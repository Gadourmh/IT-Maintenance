// controllers/performanceController.js
const Performance = require("../models/Performance");
const Personnel = require("../models/Personnel");
const Technicien = require("../models/Technicien");
const Notification = require("../models/Notification");
const mongoose = require('mongoose');
const { sendEmail } = require("../services/emailService");


async function sendCreationNotifications(performance, entityName) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });

        for (const admin of admins) {
            if (admin.PERS_email) {
                const adminSubject = `[Alerte Admin] 📈 Nouvelle Performance Enregistrée`;
                const adminText = `Une nouvelle performance a été enregistrée pour ${performance.PRF_type_entite} : ${entityName}.`;
                const adminHtml = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                      <h1>📈 Nouvelle Performance Enregistrée</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>Une nouvelle performance vient d'être enregistrée pour l'entité suivante :</p>
                      <ul style="list-style-type: none; padding: 15px; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 5px;">
                        <li style="padding-bottom: 10px;"><strong>Type :</strong> ${performance.PRF_type_entite}</li>
                        <li style="padding-bottom: 10px;"><strong>Nom :</strong> ${entityName}</li>
                        <li><strong>ID de la performance :</strong> ${performance._id}</li>
                      </ul>
                      <p>Vous pouvez consulter les détails de cette performance dans l'application.</p>
                    </div>
                    <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                      <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p>
                    </div>
                  </div>`;
                
                await sendEmail(admin.PERS_email, adminSubject, adminText, adminHtml);
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Email notifié à l'admin ${admin.PERS_nom_prenom} pour création de performance.`
                });
            }
        }
    } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi des notifications (création performance) :", emailError);
    }
}


// MODIFIÉ : Appelle les notifications de manière asynchrone
exports.createPerformance = async (req, res) => {
    try {
        const { PRF_employe, PRF_type_entite, ...otherData } = req.body;

        if (!PRF_employe || !PRF_type_entite) {
            return res.status(400).json({ message: "L'ID de l'employé et son type sont requis." });
        }

        let entityExists;
        let entityName = "Inconnu";
        if (PRF_type_entite === 'Personnel') {
            entityExists = await Personnel.findById(PRF_employe);
            if (entityExists) entityName = entityExists.PERS_nom_prenom;
        } else if (PRF_type_entite === 'Technicien') {
            entityExists = await Technicien.findById(PRF_employe);
            if (entityExists) entityName = entityExists.TECH_nom_prenom;
        } else {
            return res.status(400).json({ message: "Type d'entité invalide." });
        }

        if (!entityExists) {
            return res.status(404).json({ message: `${PRF_type_entite} non trouvé.` });
        }
        if (entityExists.deleted_at) {
            return res.status(400).json({ message: `Impossible de créer une performance pour un ${PRF_type_entite} inactif.` });
        }

        const performance = await Performance.create({ PRF_employe, PRF_type_entite, ...otherData });

      
        sendCreationNotifications(performance, entityName);

        res.status(201).json(performance);
    } catch (err) {
        console.error("❌ Erreur lors de la création de performance :", err);
        res.status(400).json({ error: err.message });
    }
};


exports.getPerformanceByUserConnecté = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role; 

        if (!userId || !userRole) {
            return res.status(400).json({ message: "Données utilisateur incomplètes." });
        }

        const entityType = (userRole === 'TECHNICIEN') ? 'Technicien' : 'Personnel';
        
        const performances = await Performance.find({
            PRF_employe: userId,
            PRF_type_entite: entityType,
            deleted_at: null
        }).populate("PRF_employe", "PERS_nom_prenom TECH_nom_prenom deleted_at");

        const formattedPerformances = performances.map(perf => ({
            ...perf.toObject(),
            employe_is_deleted: perf.PRF_employe ? !!perf.PRF_employe.deleted_at : true,
        }));

        res.status(200).json(formattedPerformances);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des performances utilisateur :", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getPerformances = async (req, res) => {
    try {
        const performances = await Performance.find({ deleted_at: null })
            .populate("PRF_employe", "PERS_nom_prenom TECH_nom_prenom deleted_at");

        const formattedPerformances = performances.map(perf => ({
            ...perf.toObject(),
            employe_is_deleted: perf.PRF_employe ? !!perf.PRF_employe.deleted_at : true,
        }));

        res.status(200).json(formattedPerformances);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des performances :", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getPerformanceById = async (req, res) => {
    try {
        const performance = await Performance.findById(req.params.id)
            .populate("PRF_employe", "PERS_nom_prenom TECH_nom_prenom deleted_at");

        if (!performance) return res.status(404).json({ message: "Performance non trouvée" });

        const formattedPerformance = {
            ...performance.toObject(),
            employe_is_deleted: performance.PRF_employe ? !!performance.PRF_employe.deleted_at : true,
        };

        res.status(200).json(formattedPerformance);
    } catch (err) {
        res.status(404).json({ error: "Non trouvé" });
    }
};



async function sendUpdateNotifications(performanceId) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });

        for (const admin of admins) {
            if (admin.PERS_email) {
                const adminSubject = `[Alerte Admin] ✏️ Mise à Jour d'une Performance`;
                const adminText = `La performance (ID: ${performanceId}) a été modifiée.`;
                const adminHtml = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                      <h1>✏️ Performance Modifiée</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>L'enregistrement de performance avec l'ID suivant a été mis à jour :</p>
                      <p style="background-color: #f9f9f9; border: 1px solid #eee; padding: 10px; border-radius: 5px; text-align: center; font-size: 16px;">
                        <strong>${performanceId}</strong>
                      </p>
                      <p>Veuillez consulter l'application pour voir les détails des modifications.</p>
                    </div>
                    <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                      <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p>
                    </div>
                  </div>`;

                await sendEmail(admin.PERS_email, adminSubject, adminText, adminHtml);
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Email notifié à l'admin ${admin.PERS_nom_prenom} pour MàJ de performance ${performanceId}.`
                });
            }
        }
    } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi des notifications (MàJ performance) :", emailError);
    }
}


exports.updatePerformance = async (req, res) => {
    try {
        const { PRF_employe, PRF_type_entite, ...updateFields } = req.body;

        if (PRF_employe && PRF_type_entite) {
            let entityToLinkExists;
            if (PRF_type_entite === 'Personnel') {
                entityToLinkExists = await Personnel.findById(PRF_employe);
            } else if (PRF_type_entite === 'Technicien') {
                entityToLinkExists = await Technicien.findById(PRF_employe);
            }
            if (!entityToLinkExists || entityToLinkExists.deleted_at) {
                return res.status(400).json({ message: `Impossible de lier à un ${PRF_type_entite} inexistant ou inactif.` });
            }
            updateFields.PRF_employe = PRF_employe;
            updateFields.PRF_type_entite = PRF_type_entite;
        }

        const updated = await Performance.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });

        if (!updated) return res.status(404).json({ message: "Performance non trouvée" });

     
        sendUpdateNotifications(updated._id);

        const populated = await updated.populate("PRF_employe", "PERS_nom_prenom TECH_nom_prenom deleted_at");
        const formattedUpdatedPerformance = {
             ...populated.toObject(),
             employe_is_deleted: populated.PRF_employe ? !!populated.PRF_employe.deleted_at : true,
        };

        res.status(200).json(formattedUpdatedPerformance);
    } catch (err) {
        console.error("❌ Erreur lors de la mise à jour de performance :", err);
        res.status(400).json({ error: err.message });
    }
};


async function sendDeletionNotifications(performanceId) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        
        for (const admin of admins) {
            if (admin.PERS_email) {
                const adminSubject = `[Alerte Admin] 🗑️ Performance Désactivée`;
                const adminText = `L'enregistrement de performance (ID: ${performanceId}) a été marqué comme inactif.`;
                const adminHtml = `
                  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                      <h1>🗑️ Performance Désactivée</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>L'enregistrement de performance suivant a été marqué comme inactif et est désormais archivé :</p>
                      <p style="background-color: #f9f9f9; border: 1px solid #eee; padding: 10px; border-radius: 5px; text-align: center; font-size: 16px;">
                        <strong>${performanceId}</strong>
                      </p>
                    </div>
                    <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                      <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p>
                    </div>
                  </div>`;

                await sendEmail(admin.PERS_email, adminSubject, adminText, adminHtml);
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Email notifié à l'admin ${admin.PERS_nom_prenom} pour suppression de perf ${performanceId}.`
                });
            }
        }
    } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi des notifications (suppression performance) :", emailError);
    }
}


exports.deletePerformance = async (req, res) => {
    try {
        const performanceId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(performanceId)) {
            return res.status(400).json({ message: "ID de la performance invalide." });
        }

        const updatedPerformance = await Performance.findByIdAndUpdate(
            performanceId,
            { $set: { deleted_at: new Date() } },
            { new: true }
        );

        if (!updatedPerformance) {
            return res.status(404).json({ message: "Performance non trouvée." });
        }

     
        sendDeletionNotifications(updatedPerformance._id);

        res.status(200).json({ message: "Performance marquée comme inactive avec succès.", performance: updatedPerformance });
    } catch (err) {
        console.error("❌ Erreur lors de la suppression logique de performance :", err);
        res.status(500).json({ error: err.message });
    }
};
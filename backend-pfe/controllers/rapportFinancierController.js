const RapportFinancier = require("../models/RapportFinancier");
const Personnel = require("../models/Personnel");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");
const mongoose = require('mongoose');


async function sendCreationNotifications(report) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Alerte Admin] 📊 Nouveau Rapport Financier Généré`;
                const text = `Un nouveau rapport financier "${report.RPFT_titre}" a été généré.`;
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>📊 Nouveau Rapport Financier</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>Un nouveau rapport financier a été généré :</p>
                      <ul style="list-style-type: none; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                        <li><strong>Titre :</strong> ${report.RPFT_titre}</li>
                        <li><strong>Période :</strong> ${report.RPFT_periode}</li>
                      </ul>
                    </div>
                    <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
                      <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p>
                    </div>
                  </div>`;
                
                await sendEmail(admin.PERS_email, subject, text, html);
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Email notifié à ${admin.PERS_nom_prenom} pour création du rapport ${report._id}.`
                });
            }
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi des notifications (création rapport) :", err);
    }
}


async function sendUpdateNotifications(report) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Alerte Admin] ✏️ Rapport Financier Modifié`;
                const text = `Le rapport financier "${report.RPFT_titre}" a été modifié.`;
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>✏️ Rapport Financier Modifié</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>Le rapport financier <strong>${report.RPFT_titre}</strong> (ID: ${report._id}) a été mis à jour.</p>
                    </div>
                    <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
                      <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p>
                    </div>
                  </div>`;

                await sendEmail(admin.PERS_email, subject, text, html);
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Email notifié à ${admin.PERS_nom_prenom} pour MàJ du rapport ${report._id}.`
                });
            }
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi des notifications (MàJ rapport) :", err);
    }
}


async function sendDeletionNotifications(report) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Alerte Admin] 🗑️ Rapport Financier Désactivé`;
                const text = `Le rapport financier "${report.RPFT_titre}" a été marqué comme inactif.`;
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>🗑️ Rapport Financier Désactivé</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>Le rapport financier <strong>${report.RPFT_titre}</strong> (ID: ${report._id}) a été marqué comme inactif.</p>
                    </div>
                    <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px;">
                      <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p>
                    </div>
                  </div>`;

                await sendEmail(admin.PERS_email, subject, text, html);
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: "Personnel",
                    NOTF_userType: admin.PERS_role_acces,
                    NOTF_type: "email",
                    NOTF_message: `Email notifié à ${admin.PERS_nom_prenom} pour désactivation du rapport ${report._id}.`
                });
            }
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi des notifications (suppression rapport) :", err);
    }
}




exports.getAllReports = async (req, res) => {
    try {
        const reports = await RapportFinancier.find({ deleted_at: null }).sort({ RPFT_dateCreation: -1 }); 
        res.json(reports);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération des rapports financiers (filtrés) :", err); 
        res.status(500).json({
            message: "Erreur serveur lors de la récupération des rapports financiers.", 
            error: err.message 
        });
    }
};

exports.createReport = async (req, res) => {
    try {
        const report = await RapportFinancier.create(req.body); 
        sendCreationNotifications(report);
        res.status(201).json(report);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la création du rapport", error: err.message }); 
    }
};

exports.updateReport = async (req, res) => {
    try {
        const updated = await RapportFinancier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); 
        if (!updated) 
        return res.status(404).json({ message: "Rapport non trouvé" }); 
        sendUpdateNotifications(updated); 
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la mise à jour", error: err.message }); 
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const reportId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ message: "ID du rapport invalide." }); 
        }

        const updatedReport = await RapportFinancier.findByIdAndUpdate(
            reportId,
            { $set: { deleted_at: new Date() } }, 
            { new: true }
        );

        if (!updatedReport) {
            return res.status(404).json({ message: "Rapport non trouvé." }); 
        }
        
        sendDeletionNotifications(updatedReport); 

        res.status(200).json({ message: "Rapport financier marqué comme inactif avec succès (suppression logique).", report: updatedReport }); 
    } catch (err) {
        console.error("❌ Erreur lors de la suppression logique d'un rapport financier :", err); 
        res.status(500).json({
            message: "Erreur serveur lors de la suppression logique du rapport financier.", 
            error: err.message 
        });
    }
};
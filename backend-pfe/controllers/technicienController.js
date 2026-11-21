const mongoose = require('mongoose');
const Technicien = require("../models/Technicien");
const Personnel = require("../models/Personnel");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../services/emailService");
const Notification = require("../models/Notification");
const { generateUniqueCode } = require("../utils/generateUniqueCode");



const VALID_SHIFTS = ['MORNING', 'AFTERNOON', 'NIGHT'];

async function sendCreationNotifications(technician, specialitesArray, creatingUser, password) { 
    try {
      
        const creationMessageTechnicianHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">Bienvenue dans l'équipe !</h1></div>
            <div style="padding: 20px;">
              <h2 style="color: #28a745;">Votre Compte Technicien est Prêt</h2>
              <p>Bonjour <strong>${technician.TECH_nom_prenom}</strong>,</p>
              <p>Votre compte a été créé avec succès.</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #28a745; margin-top: 20px;">
                <ul style="list-style-type: none; padding-left: 0;">
                  <li><strong>Code :</strong> ${technician.TECH_code}</li>
                  <li><strong>Email :</strong> ${technician.TECH_email}</li>
                  <li><strong>Mot de passe :</strong> ${password}</li>
                  <li><strong>Spécialités :</strong> ${specialitesArray.join(', ')}</li>
                </ul>
              </div>
              <p style="margin-top: 20px;">Veuillez utiliser l'email et le mot de passe ci-dessus pour vous connecter.</p>
            </div>
          </div>`;
        await sendEmail(technician.TECH_email, `[Action Requise] Votre compte Technicien a été créé`, `Votre compte technicien a été créé. Votre mot de passe est : ${password}`, creationMessageTechnicianHtml); // ✨ MODIFICATION: Ajout du mot de passe au texte brut
        await Notification.create({
            NOTF_user: technician._id, NOTF_userModel: "Technicien", NOTF_userType: "TECHNICIEN",
            NOTF_type: "email", NOTF_message: `Email de bienvenue envoyé à ${technician.TECH_nom_prenom}.`
        });

       
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const adminCreationMessageHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h3>Nouveau Technicien Ajouté</h3>
              <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
              <p>Un nouveau technicien a été ajouté par <strong>${creatingUser?.PERS_nom_prenom || 'un administrateur'}</strong>.</p>
              <p><strong>Détails :</strong> ${technician.TECH_nom_prenom} (Code: ${technician.TECH_code})</p>
            </div>`;
            await sendEmail(admin.PERS_email, `[Notification] Nouveau Technicien Ajouté : ${technician.TECH_nom_prenom}`, `Nouveau technicien : ${technician.TECH_nom_prenom}`, adminCreationMessageHtml);
            await Notification.create({
                NOTF_user: admin._id, NOTF_userModel: "Personnel", NOTF_userType: admin.PERS_role_acces,
                NOTF_type: "email", NOTF_message: `Notification pour la création du technicien ${technician.TECH_nom_prenom}.`
            });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de création (technicien) :", error);
    }
}


async function sendSelfProfileUpdateNotifications(technician, changesSummaryHtml) {
    try {
     
        const profileUpdateMessageTechnicianHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">Confirmation de Mise à Jour</h1></div>
            <div style="padding: 20px;">
              <p>Bonjour <strong>${technician.TECH_nom_prenom}</strong>, votre profil a été mis à jour.</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #007bff; margin-top: 20px;">
                <p><strong>Modifications :</strong></p>
                ${changesSummaryHtml}
              </div>
              <p style="margin-top: 20px; font-weight: bold; color: #d9534f;">Si vous n'êtes pas à l'origine de ces changements, contactez un administrateur.</p>
            </div>
          </div>`;
        await sendEmail(technician.TECH_email, `[Confirmation] Mise à jour de votre profil`, `Votre profil a été mis à jour.`, profileUpdateMessageTechnicianHtml);
        await Notification.create({
            NOTF_user: technician._id, NOTF_userModel: "Technicien", NOTF_userType: "TECHNICIEN",
            NOTF_type: "email", NOTF_message: `Auto-mise à jour du profil. Confirmation envoyée.`
        });

     
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const adminProfileUpdateMessageHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h3>Mise à jour par un technicien</h3>
              <p>Le technicien <strong>${technician.TECH_nom_prenom}</strong> a mis à jour son profil.</p>
              ${changesSummaryHtml}
            </div>`;
            await sendEmail(admin.PERS_email, `[Notification] Profil Technicien Mis à Jour par ${technician.TECH_nom_prenom}`, `Profil mis à jour pour ${technician.TECH_nom_prenom}`, adminProfileUpdateMessageHtml);
          
            await Notification.create({
                NOTF_user: admin._id,
                NOTF_userModel: "Personnel",
                NOTF_userType: admin.PERS_role_acces,
                NOTF_type: "email",
                NOTF_message: `Le technicien ${technician.TECH_nom_prenom} a mis à jour son propre profil.`
            });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de mise à jour de profil (technicien) :", error);
    }
}


async function sendAdminUpdateNotifications(technician, changesSummaryHtml, requestingUser) {
    try {
       
        const technicianUpdateMessageHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center;"><h1 style="margin: 0;">Mise à Jour de Votre Profil</h1></div>
            <div style="padding: 20px;">
              <p>Bonjour <strong>${technician.TECH_nom_prenom}</strong>,</p>
              <p>Votre profil a été mis à jour par un administrateur.</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px;">
                ${changesSummaryHtml}
              </div>
            </div>
          </div>`;
        await sendEmail(technician.TECH_email, `[Important] Votre profil technicien a été mis à jour`, `Votre profil a été mis à jour.`, technicianUpdateMessageHtml);
        await Notification.create({
            NOTF_user: technician._id, NOTF_userModel: "Technicien", NOTF_userType: "TECHNICIEN",
            NOTF_type: "email", NOTF_message: `Profil mis à jour par un admin.`
        });

       
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const adminUpdateMessageHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h3>Profil Technicien Modifié</h3>
              <p>Le profil de <strong>${technician.TECH_nom_prenom}</strong> a été modifié par <strong>${requestingUser?.PERS_nom_prenom || 'un administrateur'}</strong>.</p>
              ${changesSummaryHtml}
            </div>`;
            await sendEmail(admin.PERS_email, `[Notification] Mise à Jour Technicien : ${technician.TECH_nom_prenom}`, `Mise à jour pour ${technician.TECH_nom_prenom}`, adminUpdateMessageHtml);
        
            await Notification.create({
                NOTF_user: admin._id,
                NOTF_userModel: "Personnel",
                NOTF_userType: admin.PERS_role_acces,
                NOTF_type: "email",
                NOTF_message: `Profil de ${technician.TECH_nom_prenom} mis à jour par ${requestingUser?.PERS_nom_prenom || 'un administrateur'}.`
            });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de mise à jour admin (technicien) :", error);
    }
}


async function sendDeletionNotifications(technician, deletingUser) {
    try {
        const deletionDate = new Date();
     
        const technicianDeleteMessageHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">Désactivation de Votre Compte</h1></div>
            <div style="padding: 20px;">
              <p>Bonjour <strong>${technician.TECH_nom_prenom}</strong>,</p>
              <p>Votre compte technicien a été <strong>désactivé</strong> le <strong>${deletionDate.toLocaleString('fr-FR')}</strong>.</p>
              <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un administrateur.</p>
            </div>
          </div>`;
        await sendEmail(technician.TECH_email, `[Important] Votre compte technicien a été désactivé`, `Votre compte a été désactivé.`, technicianDeleteMessageHtml);
        await Notification.create({
            NOTF_user: technician._id, NOTF_userModel: 'Technicien', NOTF_userType: 'TECHNICIEN',
            NOTF_type: 'email', NOTF_message: `Notification de désactivation de compte envoyée.`
        });

      
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const adminDeleteMessageHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
              <h3>Compte Technicien Désactivé</h3>
              <p>Le compte de <strong>${technician.TECH_nom_prenom}</strong> a été désactivé par <strong>${deletingUser?.PERS_nom_prenom || 'un administrateur'}</strong>.</p>
            </div>`;
            await sendEmail(admin.PERS_email, `[Alerte] Compte Technicien Désactivé : ${technician.TECH_nom_prenom}`, `Désactivation de ${technician.TECH_nom_prenom}`, adminDeleteMessageHtml);
          
            await Notification.create({
                NOTF_user: admin._id,
                NOTF_userModel: "Personnel",
                NOTF_userType: admin.PERS_role_acces,
                NOTF_type: "email",
                NOTF_message: `Compte de ${technician.TECH_nom_prenom} désactivé par ${deletingUser?.PERS_nom_prenom || 'un administrateur'}.`
            });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de suppression (technicien) :", error);
    }
}


const getTechnicianProfile = async (req, res) => {
    try {
       
        const technician = await Technicien.findById(req.user.id)
            .select("-TECH_mot_passe")
            .populate({
                path: 'TECH_tickets_assignees',
                match: { deleted_at: null } 
            });

        if (!technician) {
            return res.status(404).json({ message: "Technicien non trouvé" });
        }

     
        res.status(200).json(technician);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

const updateTechnicianProfile = async (req, res) => {
    try {
        const {
            TECH_nom_prenom = "", TECH_telephone = "", TECH_email = "",
            oldPassword = "", newPassword = "", confirmNewPassword = "",
            TECH_photo_profil = "",
        } = req.body || {};

        let technician = await Technicien.findById(req.user.id).select('+TECH_mot_passe');
        if (!technician) {
            return res.status(404).json({ message: "Technicien non trouvé." });
        }

        const oldTechnicianData = { ...technician._doc };
        let changesMade = [];

        if (TECH_nom_prenom && TECH_nom_prenom.trim() !== technician.TECH_nom_prenom) {
            changesMade.push(`Nom : de "${oldTechnicianData.TECH_nom_prenom}" à "${TECH_nom_prenom.trim()}"`);
            technician.TECH_nom_prenom = TECH_nom_prenom.trim();
        }
        if (TECH_email && TECH_email.trim() !== technician.TECH_email) {
            const existingTechnician = await Technicien.findOne({ TECH_email: TECH_email.trim(), deleted_at: null, _id: { $ne: technician._id } });
            if (existingTechnician) {
                return res.status(400).json({ message: "Cet email est déjà utilisé." });
            }
            changesMade.push(`Email : de "${oldTechnicianData.TECH_email}" à "${TECH_email.trim()}"`);
            technician.TECH_email = TECH_email.trim();
        }
        if (oldPassword) {
            if (!newPassword || newPassword !== confirmNewPassword) {
                return res.status(400).json({ message: "Les mots de passe ne correspondent pas." });
            }
            const isMatch = await bcrypt.compare(oldPassword, technician.TECH_mot_passe);
            if (!isMatch) {
                return res.status(400).json({ message: "Ancien mot de passe incorrect." });
            }
            technician.TECH_mot_passe = newPassword;
            changesMade.push("Mot de passe modifié.");
        }
        
     

        if (changesMade.length === 0) {
            return res.status(200).json({ message: "Aucune modification détectée.", technician });
        }

        await technician.save();
        const technicianWithoutPassword = await Technicien.findById(technician._id).select("-TECH_mot_passe");
        const changesSummaryHtml = `<ul>${changesMade.map(change => `<li>${change}</li>`).join('')}</ul>`;

     
        sendSelfProfileUpdateNotifications(technicianWithoutPassword, changesSummaryHtml);

        res.status(200).json({ message: "Profil mis à jour avec succès.", technician: technicianWithoutPassword });
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du profil technicien :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

const getTechniciens = async (req, res) => {
    try {
        const query = { deleted_at: null };
        
       
        const techniciens = await Technicien.find(query)
            .select("-TECH_mot_passe")
            .populate('TECH_cree_par', 'PERS_nom_prenom')
           
            .populate({
                path: 'TECH_tickets_assignees',
                match: { deleted_at: null }, 
                select: 'TCKT_code' 
            });
       

        res.status(200).json(techniciens);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des techniciens :", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

const getTechnicienById = async (req, res) => {
    try {
        const { id } = req.params;
        const technicien = await Technicien.findById(id).select("-TECH_mot_passe");
        if (!technicien) {
            return res.status(404).json({ message: "Technicien non trouvé" });
        }
        res.status(200).json(technicien);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

const updateTechnician = async (req, res) => {
    try {
        const { id } = req.params;
        const { TECH_nom_prenom, TECH_email, TECH_specialite, TECH_shift, ...otherData } = req.body;

        let technician = await Technicien.findById(id);
        if (!technician) {
            return res.status(404).json({ message: "Technicien non trouvé." });
        }

        const oldTechnicianData = { ...technician._doc };
        let changesMade = [];

        if (TECH_email && TECH_email !== technician.TECH_email) {
            const existingTechnicianWithEmail = await Technicien.findOne({ TECH_email, deleted_at: null, _id: { $ne: id } });
            if (existingTechnicianWithEmail) {
                return res.status(400).json({ message: "Cet email est déjà utilisé." });
            }
            changesMade.push(`Email: de "${oldTechnicianData.TECH_email}" à "${TECH_email}"`);
            technician.TECH_email = TECH_email;
        }
        if (TECH_shift && !VALID_SHIFTS.includes(String(TECH_shift).toUpperCase())) {
            return res.status(400).json({ message: `Shift invalide.` });
        }
        if (TECH_nom_prenom && TECH_nom_prenom !== technician.TECH_nom_prenom) {
            changesMade.push(`Nom: de "${oldTechnicianData.TECH_nom_prenom}" à "${TECH_nom_prenom}"`);
            technician.TECH_nom_prenom = TECH_nom_prenom;
        }
        if (TECH_specialite) {
            technician.TECH_specialite = Array.isArray(TECH_specialite) ? TECH_specialite : String(TECH_specialite).split(',').map(s => s.trim()).filter(Boolean);
            changesMade.push(`Spécialités mises à jour.`);
        }
        Object.assign(technician, otherData);

        if (changesMade.length === 0 && JSON.stringify(technician.getChanges()) === '{}') {
            return res.status(200).json({ message: "Aucune modification détectée.", technician });
        }

        await technician.save();
        const changesSummaryHtml = `<ul>${changesMade.map(change => `<li>${change}</li>`).join('')}</ul>`;

    
        sendAdminUpdateNotifications(technician, changesSummaryHtml, req.user);

        res.status(200).json({ message: "Profil technicien mis à jour avec succès.", technician });
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du technicien :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

const createTechnician = async (req, res) => {
    try {
        const { TECH_nom_prenom, TECH_email, TECH_mot_passe, TECH_specialite, ...otherData } = req.body;

        if (!TECH_nom_prenom || !TECH_email || !TECH_mot_passe || !TECH_specialite) {
            return res.status(400).json({ message: "Veuillez remplir tous les champs requis." });
        }
        const existingTechnician = await Technicien.findOne({ TECH_email, deleted_at: null });
        if (existingTechnician) {
            return res.status(400).json({ message: "Un technicien avec cet email existe déjà." });
        }

        let specialitesArray = Array.isArray(TECH_specialite) ? TECH_specialite : String(TECH_specialite).split(',').map(s => s.trim()).filter(Boolean);
        if (specialitesArray.length === 0) {
            return res.status(400).json({ message: "Le champ Spécialité ne peut pas être vide." });
        }

        const technician = new Technicien({
            TECH_nom_prenom, TECH_email, TECH_mot_passe,
            TECH_specialite: specialitesArray,
            TECH_cree_par: req.user.id,
            ...otherData
        });

        await technician.save();

      
        sendCreationNotifications(technician, specialitesArray, req.user, TECH_mot_passe);

        res.status(201).json({ message: "Technicien créé avec succès.", technician });
    } catch (error) {
        console.error("❌ Erreur lors de l'ajout du technicien :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

const deleteTechnician = async (req, res) => {
    try {
        const { id } = req.params;
        const technician = await Technicien.findById(id);
        if (!technician || technician.deleted_at) {
            return res.status(404).json({ message: "Technicien non trouvé ou déjà inactif." });
        }

        technician.deleted_at = new Date();
        await technician.save();

       
        sendDeletionNotifications(technician, req.user);

        res.status(200).json({ message: "Technicien marqué comme inactif avec succès." });
    } catch (error) {
        console.error("❌ Erreur lors de la suppression logique du technicien :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

module.exports = {
    getTechnicianProfile,
    updateTechnicianProfile,
    getTechniciens,
    getTechnicienById,
    updateTechnician,
    createTechnician,
    deleteTechnician
};
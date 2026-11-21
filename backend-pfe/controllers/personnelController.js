const Personnel = require("../models/Personnel");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../services/emailService");
const { generateUniqueCode } = require("../utils/generateUniqueCode");
const Notification = require("../models/Notification");



/**
 * Gère l'envoi des notifications pour la création d'un nouveau membre du personnel.
 * @param {Object} newPersonnel - L'objet du nouveau personnel créé.
 * @param {string} password - Le mot de passe en clair pour l'inclure dans l'email.
 */
async function sendCreationNotifications(newPersonnel, password) { 
  try {
   
    const welcomeMessagePersonnelHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #004AAD; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">[Nom de Votre Entreprise]</h1></div>
        <div style="padding: 20px;">
          <h2 style="color: #004AAD;">Bienvenue dans l'équipe !</h2>
          <p>Bonjour <strong>${newPersonnel.PERS_nom_prenom}</strong>,</p>
          <p>Félicitations ! Votre compte personnel a été créé avec succès dans notre système.</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #004AAD; margin-top: 20px;">
            <p><strong>Détails de votre accès :</strong></p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li><strong>Code Personnel:</strong> ${newPersonnel.PERS_code}</li>
              <li><strong>Email de connexion:</strong> ${newPersonnel.PERS_email}</li>
              <li><strong>Mot de passe:</strong> ${password}</li>
              <li><strong>Rôle d'accès:</strong> ${newPersonnel.PERS_role_acces}</li>
              <li><strong>Fonction:</strong> ${newPersonnel.PERS_fonction}</li>
            </ul>
          </div>
          <p style="margin-top: 20px;">Veuillez utiliser votre email et le mot de passe fourni ci-dessus pour vous connecter.</p>
        </div>
        <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px;"><p>&copy; ${new Date().getFullYear()} [Nom de Votre Entreprise]</p></div>
      </div>`;

    await sendEmail(
      newPersonnel.PERS_email,
      `[Nom de Votre Entreprise] : Bienvenue - Votre compte personnel est créé !`,
      `Bonjour ${newPersonnel.PERS_nom_prenom}, votre compte a été créé. Votre mot de passe est : ${password}`, 
      welcomeMessagePersonnelHtml
    );
    await Notification.create({
      NOTF_user: newPersonnel._id,
      NOTF_userModel: "Personnel",
      NOTF_userType: newPersonnel.PERS_role_acces,
      NOTF_type: "email",
      NOTF_message: `Email de bienvenue envoyé à ${newPersonnel.PERS_nom_prenom}.`,
    });

   
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
    for (const admin of admins) {
      const adminNotificationMessageHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">Notification Système</h1></div>
            <div style="padding: 20px;">
              <h2 style="color: #28a745;">Nouveau Membre du Personnel Ajouté</h2>
              <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
              <p>Un nouveau membre du personnel a été ajouté au système.</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #28a745; margin-top: 20px;">
                <p><strong>Détails :</strong> ${newPersonnel.PERS_nom_prenom} (Code: ${newPersonnel.PERS_code}, Email: ${newPersonnel.PERS_email})</p>
              </div>
            </div>
            <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px;"><p>Ceci est une notification automatique.</p></div>
          </div>`;
      await sendEmail(
        admin.PERS_email,
        `[Notification] Nouveau Personnel Ajouté : ${newPersonnel.PERS_nom_prenom}`,
        `Nouveau personnel ajouté : ${newPersonnel.PERS_nom_prenom}`,
        adminNotificationMessageHtml
      );
      await Notification.create({
        NOTF_user: admin._id,
        NOTF_userModel: "Personnel",
        NOTF_userType: admin.PERS_role_acces,
        NOTF_type: "email",
        NOTF_message: `Notification pour la création du personnel ${newPersonnel.PERS_nom_prenom}.`,
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des notifications de création (personnel) :", error);
  }
}

/**
 * Gère l'envoi des notifications pour la mise à jour du profil d'un personnel par un admin.
 * @param {Object} updatedPersonnel - L'objet du personnel mis à jour.
 * @param {string} changesSummaryHtml - Le résumé HTML des modifications.
 */
async function sendAdminUpdateNotifications(updatedPersonnel, changesSummaryHtml) {
  try {
  
    const updateMessagePersonnelHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center;"><h1 style="margin: 0;">Mise à Jour de Votre Profil</h1></div>
        <div style="padding: 20px;">
          <h2 style="color: #004AAD;">Votre Profil a été Modifié</h2>
          <p>Bonjour <strong>${updatedPersonnel.PERS_nom_prenom}</strong>,</p>
          <p>Votre profil a été mis à jour par un administrateur.</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px;">
            <p><strong>Détails de la mise à jour :</strong></p>
            ${changesSummaryHtml}
          </div>
        </div>
      </div>`;
    await sendEmail(
      updatedPersonnel.PERS_email,
      `[Nom de Votre Entreprise] : Mise à jour de votre profil`,
      `Votre profil a été mis à jour par un administrateur.`,
      updateMessagePersonnelHtml
    );
    await Notification.create({
      NOTF_user: updatedPersonnel._id,
      NOTF_userModel: "Personnel",
      NOTF_userType: updatedPersonnel.PERS_role_acces,
      NOTF_type: "email",
      NOTF_message: `Notification de mise à jour de profil par un admin.`,
    });

   
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
    for (const admin of admins) {
      const adminUpdateMessageHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">Notification Admin</h1></div>
          <div style="padding: 20px;">
            <p>Le profil de <strong>${updatedPersonnel.PERS_nom_prenom}</strong> a été modifié.</p>
          </div>
        </div>`;
      await sendEmail(
        admin.PERS_email,
        `[Notification] Mise à Jour Personnel : ${updatedPersonnel.PERS_nom_prenom}`,
        `Le profil de ${updatedPersonnel.PERS_nom_prenom} a été modifié.`,
        adminUpdateMessageHtml
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des notifications de mise à jour admin (personnel) :", error);
  }
}

/**
 * Gère l'envoi des notifications lorsque le personnel met à jour son propre profil.
 * @param {Object} personnel - L'objet du personnel mis à jour.
 * @param {string} changesSummaryHtml - Le résumé HTML des modifications.
 */
async function sendSelfProfileUpdateNotifications(personnel, changesSummaryHtml) {
  try {
    
    const profileUpdateMessagePersonnelHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">Confirmation de Mise à Jour</h1></div>
        <div style="padding: 20px;">
          <h2 style="color: #004AAD;">Votre Profil a été Modifié</h2>
          <p>Bonjour <strong>${personnel.PERS_nom_prenom}</strong>,</p>
          <p>Ceci est une confirmation que votre profil a été mis à jour avec succès.</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #007bff; margin-top: 20px;">
            <p><strong>Détails des modifications :</strong></p>
            ${changesSummaryHtml}
          </div>
        </div>
      </div>`;
    await sendEmail(
      personnel.PERS_email,
      `[Solution Ticketing] Confirmation de la mise à jour de votre profil`,
      `Votre profil a été mis à jour avec succès.`,
      profileUpdateMessagePersonnelHtml
    );
    await Notification.create({
      NOTF_user: personnel._id, NOTF_userModel: "Personnel", NOTF_userType: personnel.PERS_role_acces,
      NOTF_type: "email", NOTF_message: `Confirmation de mise à jour de profil envoyée.`
    });

    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
    for (const admin of admins) {
      const adminNotificationHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">Notification Système</h1></div>
            <div style="padding: 20px;">
              <p>Le membre du personnel <strong>${personnel.PERS_nom_prenom}</strong> a mis à jour son propre profil.</p>
              <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #17a2b8; margin-top: 20px;">
                <p><strong>Détails des modifications :</strong></p>
                ${changesSummaryHtml}
              </div>
            </div>
          </div>`;
      await sendEmail(
        admin.PERS_email,
        `[Notification] Le profil de ${personnel.PERS_nom_prenom} a été mis à jour`,
        `Le profil de ${personnel.PERS_nom_prenom} a été mis à jour par lui-même.`,
        adminNotificationHtml
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des notifications de mise à jour de profil (personnel) :", error);
  }
}

/**
 * Gère l'envoi des notifications pour la désactivation d'un compte personnel.
 * @param {Object} personnelToDelete - Le personnel dont le compte est désactivé.
 * @param {string} actionTaker - L'identifiant de l'admin qui a effectué l'action.
 */
async function sendDeletionNotifications(personnelToDelete, actionTaker) {
  try {
    const deletionDate = new Date();
  
    const personnelDeleteMessageHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">Désactivation de Votre Compte</h1></div>
        <div style="padding: 20px;">
          <p>Bonjour <strong>${personnelToDelete.PERS_nom_prenom}</strong>,</p>
          <p>Votre compte (Code: ${personnelToDelete.PERS_code}) a été <strong>désactivé</strong> par un administrateur.</p>
          <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le service informatique.</p>
        </div>
      </div>`;
    await sendEmail(
      personnelToDelete.PERS_email,
      `[Action Requise] Votre compte a été désactivé`,
      `Votre compte a été désactivé.`,
      personnelDeleteMessageHtml
    );
    await Notification.create({
      NOTF_user: personnelToDelete._id, NOTF_userModel: "Personnel", NOTF_userType: personnelToDelete.PERS_role_acces,
      NOTF_type: "email", NOTF_message: `Notification de désactivation de compte envoyée.`
    });

    
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
    for (const admin of admins) {
      const adminDeleteMessageHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center;"><h1 style="margin: 0;">Notification de Désactivation</h1></div>
            <div style="padding: 20px;">
              <p>Le compte de <strong>${personnelToDelete.PERS_nom_prenom}</strong> a été désactivé par <strong>l'administrateur ' </strong>.</p>
            </div>
          </div>`;
      await sendEmail(
        admin.PERS_email,
        `[Alerte] Compte désactivé : ${personnelToDelete.PERS_nom_prenom}`,
        `Compte désactivé : ${personnelToDelete.PERS_nom_prenom}`,
        adminDeleteMessageHtml
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des notifications de désactivation (personnel) :", error);
  }
}


const createPersonnel = async (req, res) => {
  try {
    const {
      PERS_nom_prenom,
      PERS_email,
      PERS_mot_passe,
      PERS_telephone,
      PERS_role_acces,
      PERS_fonction,
    } = req.body;

    if (!PERS_nom_prenom || !PERS_email || !PERS_mot_passe || !PERS_fonction) {
      return res.status(400).json({ message: "Le nom complet, l'email, le mot de passe et la fonction sont requis." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(PERS_email)) {
      return res.status(400).json({ message: "Adresse email invalide." });
    }
    const existingPersonnel = await Personnel.findOne({ PERS_email, deleted_at: null });
    if (existingPersonnel) {
      return res.status(400).json({ message: "Cet email est déjà utilisé par un personnel actif." });
    }

    const newPersonnel = new Personnel({
      PERS_code: await generateUniqueCode("Personnel", "PERS"),
      PERS_nom_prenom,
      PERS_email,
      PERS_mot_passe,
      PERS_telephone,
      PERS_role_acces: PERS_role_acces || "NORMAL",
      PERS_fonction,
    });
    await newPersonnel.save();

  
    sendCreationNotifications(newPersonnel, PERS_mot_passe);

    res.status(201).json({ message: "Personnel créé avec succès !", personnel: newPersonnel });
  } catch (error) {
    console.error("❌ Erreur lors de la création du personnel :", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }
    res.status(500).json({ message: "Erreur lors de la création du personnel", error: error.message });
  }
};

const getPersonnels = async (req, res) => {
  try {
    const query = { deleted_at: null };
    const personnels = await Personnel.find(query).select("-PERS_mot_passe");
    res.status(200).json(personnels);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des personnels :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getPersonnelById = async (req, res) => {
  try {
    const { id } = req.params;
    const personnel = await Personnel.findById(id).select("-PERS_mot_passe");
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }
    res.status(200).json(personnel);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du personnel :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const updatePersonnel = async (req, res) => {
  try {
    const { id } = req.params;
    const { PERS_email, PERS_mot_passe, ...updateFields } = req.body;
    
    let personnel = await Personnel.findById(id);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé." });
    }

    if (PERS_email !== undefined || PERS_mot_passe !== undefined) {
      return res.status(403).json({ message: "La modification de l'email et du mot de passe n'est pas autorisée ici." });
    }

    const oldPersonnelData = { ...personnel._doc };
    const updatedPersonnel = await Personnel.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true });
    if (!updatedPersonnel) {
      return res.status(404).json({ message: "Personnel non trouvé après mise à jour." });
    }
    
    let changesSummaryHtml = "";
    for (const key in updateFields) {
        if (updateFields[key] !== oldPersonnelData[key]) {
            changesSummaryHtml += `<li><strong>${key.replace("PERS_", "")}:</strong> De "${oldPersonnelData[key] || "N/A"}" à "${updatedPersonnel[key] || "N/A"}"</li>`;
        }
    }
    if (changesSummaryHtml) changesSummaryHtml = `<ul>${changesSummaryHtml}</ul>`;

  
    sendAdminUpdateNotifications(updatedPersonnel, changesSummaryHtml);

    res.status(200).json({ message: "Personnel mis à jour avec succès.", updatedPersonnel });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du personnel :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const updatePersonnelProfile = async (req, res) => {
  try {
    const {
      PERS_nom_prenom = "", PERS_telephone = "", PERS_email = "",
      oldPassword = "", newPassword = "", confirmNewPassword = "",
      PERS_photo_profil = ""
    } = req.body || {};

    let personnel = await Personnel.findById(req.user.id).select('+PERS_mot_passe');
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé." });
    }

    const oldPersonnelData = { ...personnel._doc };
    let changesSummaryHtml = "";
    
    if (PERS_nom_prenom && personnel.PERS_nom_prenom !== PERS_nom_prenom) {
        personnel.PERS_nom_prenom = PERS_nom_prenom;
        changesSummaryHtml += `<li><strong>Nom:</strong> ${PERS_nom_prenom}</li>`;
    }
    if (PERS_telephone && personnel.PERS_telephone !== PERS_telephone) {
        personnel.PERS_telephone = PERS_telephone;
        changesSummaryHtml += `<li><strong>Téléphone:</strong> ${PERS_telephone}</li>`;
    }
    if (PERS_photo_profil !== undefined && personnel.PERS_photo_profil !== PERS_photo_profil) {
        personnel.PERS_photo_profil = PERS_photo_profil;
        changesSummaryHtml += `<li><strong>Photo de profil:</strong> Modifiée</li>`;
    }
    if (PERS_email && PERS_email !== personnel.PERS_email) {
      const existingPersonnel = await Personnel.findOne({ PERS_email, deleted_at: null, _id: { $ne: personnel._id } });
      if (existingPersonnel) {
        return res.status(400).json({ message: "Cet email est déjà utilisé." });
      }
      personnel.PERS_email = PERS_email;
      changesSummaryHtml += `<li><strong>Email:</strong> ${PERS_email}</li>`;
    }
    if (oldPassword) {
      if (!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "Champs de mot de passe invalides." });
      }
      const isMatch = await bcrypt.compare(oldPassword, personnel.PERS_mot_passe);
      if (!isMatch) {
        return res.status(400).json({ message: "Ancien mot de passe incorrect." });
      }
      personnel.PERS_mot_passe = newPassword;
      changesSummaryHtml += `<li><strong>Mot de passe:</strong> Modifié</li>`;
    }

    if (changesSummaryHtml === "") {
        return res.status(200).json({ message: "Aucune modification détectée.", personnel });
    }
    
    await personnel.save();
    
    if(changesSummaryHtml) changesSummaryHtml = `<ul>${changesSummaryHtml}</ul>`;

    // Appel SANS 'await' pour une réponse immédiate
    sendSelfProfileUpdateNotifications(personnel, changesSummaryHtml);

    res.status(200).json({ message: "Profil mis à jour avec succès.", personnel });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du profil :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const deletePersonnel = async (req, res) => {
  try {
    const { id } = req.params;
    const personnelToDelete = await Personnel.findById(id);

    if (!personnelToDelete) {
      return res.status(404).json({ message: "Personnel non trouvé." });
    }
    
    if (req.user && req.user.id === id) {
        return res.status(403).json({ message: "Vous ne pouvez pas désactiver votre propre compte." });
    }

    personnelToDelete.deleted_at = new Date();
    await personnelToDelete.save();
    
    const actionTaker = req.user ? `${req.user.PERS_nom_prenom}` : 'Système';

    sendDeletionNotifications(personnelToDelete, actionTaker);

    res.status(200).json({ message: "Le personnel a été marqué comme inactif avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la désactivation logique du personnel :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  createPersonnel,
  getPersonnels,
  getPersonnelById,
  updatePersonnel,
  updatePersonnelProfile,
  deletePersonnel
};
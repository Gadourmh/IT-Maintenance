const mongoose = require('mongoose');
const Client = require("../models/Client");
const Personnel = require("../models/Personnel");
const bcrypt = require("bcryptjs");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");

const { generateUniqueCode } = require("../utils/generateUniqueCode");



const getClientProfile = async (req, res) => {
  try {
    const client = await Client.findById(req.user.id).select("-CLNT_mot_passe");
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

async function sendProfileUpdateNotifications(client, updatedClient) {
    try {
        
        const clientSubject = `[2BINFO-SYS] Confirmation de Mise à Jour de Votre Profil`;
        const clientText = `Bonjour ${updatedClient.CLNT_raison_sociale}, Votre profil a été mis à jour avec succès.`;
        const clientHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #004AAD; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">2BINFO-SYS</h1></div>
            <div style="padding: 20px;">
              <h2 style="color: #004AAD;">Mise à Jour de Profil Réussie</h2>
              <p>Bonjour <strong>${updatedClient.CLNT_raison_sociale}</strong>,</p>
              <p>Votre profil a été mis à jour avec succès le ${new Date().toLocaleString('fr-FR')}.</p>
              <p>Si vous n'êtes pas à l'origine de cette modification, veuillez contacter notre support immédiatement.</p>
            </div>
            <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px;"><p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p></div>
          </div>`;
        await sendEmail(updatedClient.CLNT_email, clientSubject, clientText, clientHtml);
        
        await Notification.create({
          NOTF_user: client._id,
          NOTF_userModel: "Client",
          NOTF_userType: "CLIENT",
          NOTF_type: "email",
          NOTF_message: `Notification email envoyée au client ${client.CLNT_raison_sociale} pour la mise à jour du profil.`,
        });
    
    
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
          const adminSubject = `[Notification] Mise à Jour Profil Client: ${updatedClient.CLNT_raison_sociale}`;
          const adminText = `Le client ${updatedClient.CLNT_raison_sociale} (Code: ${updatedClient.CLNT_code}) a mis à jour son profil.`;
          const adminHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #004AAD; color: white; padding: 20px; text-align: center;"><h1 style="margin: 0;">2BINFO-SYS</h1></div>
            <div style="padding: 20px;">
              <h2 style="color: #004AAD;">Alerte : Profil Client Modifié</h2>
              <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
              <p>Le client <strong>${updatedClient.CLNT_raison_sociale}</strong> (Code: ${updatedClient.CLNT_code}) a mis à jour son profil.</p>
              <p>Veuillez consulter le panneau d'administration pour plus de détails.</p>
            </div>
            <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px;"><p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p></div>
          </div>`;
          await sendEmail(admin.PERS_email, adminSubject, adminText, adminHtml);
    
          await Notification.create({
            NOTF_user: admin._id,
            NOTF_userModel: "Personnel",
            NOTF_userType: admin.PERS_role_acces,
            NOTF_type: "email",
            NOTF_message: `Notification email envoyée à l'admin ${admin.PERS_nom_prenom} concernant la mise à jour du client ${client.CLNT_raison_sociale}.`,
          });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications (mise à jour profil) :", error);
    }
}

const updateClientProfile = async (req, res) => {
  try {
    const {
      CLNT_raison_sociale = "",
      CLNT_telephone = "",
      CLNT_email = "",
      oldPassword = "",
      newPassword = "",
      confirmNewPassword = "",
      CLNT_photo_profil = ""
    } = req.body || {};

    let client = await Client.findById(req.user.id).select('+CLNT_mot_passe');

    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    if (CLNT_raison_sociale) client.CLNT_raison_sociale = CLNT_raison_sociale;
    if (CLNT_telephone) client.CLNT_telephone = CLNT_telephone;
    if (CLNT_photo_profil !== undefined) {
      client.CLNT_photo_profil = CLNT_photo_profil;
    }

    if (CLNT_email && CLNT_email !== client.CLNT_email) {
      const existingClient = await Client.findOne({
        CLNT_email: CLNT_email,
        deleted_at: null,
        _id: { $ne: client._id }
      });

      if (existingClient) {
        return res.status(400).json({ message: "Cet email est déjà utilisé par un client actif." });
      }
      client.CLNT_email = CLNT_email;
    }

    if (oldPassword && newPassword && confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: "Le nouveau mot de passe et la confirmation ne correspondent pas." });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
      }

      const isMatch = await bcrypt.compare(oldPassword, client.CLNT_mot_passe);
      if (!isMatch) {
        return res.status(400).json({ message: "Ancien mot de passe incorrect" });
      }

      client.CLNT_mot_passe = newPassword;
    }

    const updatedClient = await client.save();
    
  
    sendProfileUpdateNotifications(client, updatedClient);

    res.status(200).json({ message: "Profil mis à jour avec succès", client: updatedClient });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du profil client :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


async function sendCreationNotifications(newClient, password) { 
    try {
      
        const clientWelcomeSubject = `Bienvenue chez 2BINFO-SYS ! Votre compte est prêt !`;
    
        const clientWelcomeText = `Bonjour ${newClient.CLNT_raison_sociale}, Nous sommes ravis de vous accueillir ! Votre compte a été créé avec succès. Votre code client est ${newClient.CLNT_code}. Votre mot de passe est : ${password}`;
        const clientWelcomeHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Bienvenue chez 2BINFO-SYS !</h1>
            </div>
            <div style="padding: 25px;">
              <h2 style="color: #0056b3;">Votre Compte a été Créé avec Succès</h2>
              <p>Bonjour <strong>${newClient.CLNT_raison_sociale}</strong>,</p>
              <p>Nous sommes ravis de vous compter parmi nos clients. Votre espace personnel est désormais actif et prêt à être utilisé.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-top: 20px;">
                <p style="margin: 0;"><strong><u>Vos informations de connexion :</u></strong></p>
                <ul style="list-style-type: none; padding-left: 0;">
                  <li><strong>Email de connexion :</strong> ${newClient.CLNT_email}</li>
                  <li><strong>Code Client :</strong> ${newClient.CLNT_code}</li>
                
                  <li><strong>Mot de passe :</strong> ${password}</li>
                </ul>
              </div>
              <p style="margin-top: 25px;">Vous pouvez vous connecter dès maintenant pour accéder à nos services. Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
              <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS. Tous droits réservés.</p>
            </div>
          </div>`;
        
        await sendEmail(newClient.CLNT_email, clientWelcomeSubject, clientWelcomeText, clientWelcomeHtml);
        await Notification.create({
          NOTF_user: newClient._id,
          NOTF_userModel: "Client",
          NOTF_userType: "CLIENT",
          NOTF_type: "email",
          NOTF_message: `Email de bienvenue envoyé à ${newClient.CLNT_raison_sociale}.`
        });

      
        const adminsAndTechnicians = await Personnel.find({
          PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN", "TECHNICIEN"] },
          deleted_at: null
        });

        for (let user of adminsAndTechnicians) {
          const adminNotifSubject = `Nouveau Client Enregistré : ${newClient.CLNT_raison_sociale} (${newClient.CLNT_code})`;
          const adminNotifText = `Un nouveau client a été enregistré. Raison Sociale: ${newClient.CLNT_raison_sociale}, Code: ${newClient.CLNT_code}, Email: ${newClient.CLNT_email}.`;
          const adminNotifHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Nouveau Client Enregistré</h1>
            </div>
            <div style="padding: 25px;">
              <h2 style="color: #0056b3;">Information : Nouveau Client</h2>
              <p>Bonjour <strong>${user.PERS_nom_prenom}</strong>,</p>
              <p>Un nouveau client a été ajouté au système par un membre du personnel.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin-top: 20px;">
                <p style="margin: 0;"><strong><u>Détails du nouveau client :</u></strong></p>
                <ul style="list-style-type: none; padding-left: 0;">
                  <li><strong>Raison Sociale:</strong> ${newClient.CLNT_raison_sociale}</li>
                  <li><strong>Code Client:</strong> ${newClient.CLNT_code}</li>
                  <li><strong>Email:</strong> ${newClient.CLNT_email}</li>
                  <li><strong>Téléphone:</strong> ${newClient.CLNT_telephone || 'Non renseigné'}</li>
                  <li><strong>Matricule Fiscal:</strong> ${newClient.CLNT_MF}</li>
                  <li><strong>Date de création:</strong> ${newClient.Date_creation.toLocaleString('fr-FR')}</li>
                </ul>
              </div>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
              <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS. Tous droits réservés.</p>
            </div>
          </div>`;

          await sendEmail(user.PERS_email, adminNotifSubject, adminNotifText, adminNotifHtml);
          await Notification.create({
            NOTF_user: user._id,
            NOTF_userModel: "Personnel",
            NOTF_userType: user.PERS_role_acces,
            NOTF_type: "email",
            NOTF_message: `Notification email envoyée au personnel ${user.PERS_nom_prenom} pour la création du client ${newClient.CLNT_raison_sociale}.`
          });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de création de client :", error);
    }
}

const createClient = async (req, res) => {
  try {
    const {
      CLNT_raison_sociale,
      CLNT_email,
      CLNT_mot_passe,
      CLNT_telephone,
      CLNT_MF
    } = req.body;
    let { CLNT_addresses } = req.body;

    const personnelCreeParId = req.user.id;

    if (!personnelCreeParId) {
      return res.status(401).json({ message: "ID de l'utilisateur créateur manquant. Assurez-vous d'être connecté." });
    }

    if (!CLNT_raison_sociale || !CLNT_email || !CLNT_mot_passe || !CLNT_MF) {
      return res.status(400).json({ message: "La raison sociale, l'email, le mot de passe et le matricule fiscal sont requis." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CLNT_email)) {
      return res.status(400).json({ message: "Adresse email invalide." });
    }

    const existingClientWithEmail = await Client.findOne({
      CLNT_email: CLNT_email,
      deleted_at: null
    });

    if (existingClientWithEmail) {
      return res.status(400).json({ message: "Cet email est déjà utilisé par un client actif." });
    }

    const existingClientWithMF = await Client.findOne({
      CLNT_MF: CLNT_MF,
      deleted_at: null
    });

    if (existingClientWithMF) {
      return res.status(400).json({ message: "Ce matricule fiscal est déjà utilisé par un client actif." });
    }

    if (typeof CLNT_addresses === "string") {
      try {
        CLNT_addresses = JSON.parse(CLNT_addresses);
      } catch (error) {
        return res.status(400).json({ message: "Format d'adresses invalide (JSON attendu)." });
      }
    }

    if (!Array.isArray(CLNT_addresses)) {
      return res.status(400).json({ message: "CLNT_addresses doit être un tableau." });
    }

    const formattedAddresses = CLNT_addresses.map(addr => {
      if (typeof addr === "string") {
        return { address: addr.trim() };
      } else if (addr && typeof addr === "object" && addr.address) {
        return { address: addr.address.trim() };
      } else {
        return null;
      }
    }).filter(addr => addr !== null);


    const contractPath = req.file ? `uploads/contrats/${req.file.filename}` : null;

    const newClient = new Client({
      CLNT_code: await generateUniqueCode("Client", "CLNT"),
      CLNT_raison_sociale,
      CLNT_email,
      CLNT_mot_passe,
      CLNT_telephone,
      CLNT_MF,
      CLNT_addresses: formattedAddresses,
      CLNT_contract: contractPath,
      CLNT_cree_par: personnelCreeParId,
      CLNT_statut: "actif"
    });

    await newClient.save();
    
    
    sendCreationNotifications(newClient, CLNT_mot_passe);

    res.status(201).json({ message: "Client créé avec succès !" });

  } catch (error) {
    console.error("❌ Erreur lors de la création du client :", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Cet email ou matricule fiscal est déjà utilisé." });
    }
    res.status(500).json({ message: "Erreur serveur", error });
  }
};



const getClients = async (req, res) => {
  try {
    let { page, limit, showDeleted } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const query = { deleted_at: null };

    if (showDeleted === 'true') {
        delete query.deleted_at;
    } else if (showDeleted === 'only') {
        query.deleted_at = { $ne: null };
    }

    const clients = await Client.find(query)
      .populate('CLNT_cree_par', 'PERS_nom_prenom')
      .select("-CLNT_mot_passe")
      .skip((page - 1) * limit)
      .limit(limit);

    const totalClients = await Client.countDocuments(query);

    res.status(200).json({
      totalPages: Math.ceil(totalClients / limit),
      currentPage: page,
      clients,
      showingDeleted: showDeleted === 'true',
      showingOnlyDeleted: showDeleted === 'only'
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des clients (avec pagination) :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


async function sendAdminUpdateNotifications(client, updates, userId) {
    try {
       
        const clientUpdateSubject = `[2BINFO-SYS] Mise à jour de votre profil client`;
        const clientUpdateText = `Bonjour ${client.CLNT_raison_sociale}, Votre profil client a été mis à jour par notre administration. Si vous n'êtes pas à l'origine de cette demande, contactez-nous.`;
        const clientUpdateHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Mise à Jour de Votre Profil</h1>
            </div>
            <div style="padding: 25px;">
              <h2 style="color: #0056b3;">Votre Profil Client a été Modifié</h2>
              <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
              <p>Nous vous informons que votre profil a été mis à jour par notre équipe administrative. Voici un résumé des modifications :</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-top: 20px;">
                <ul style="padding-left: 20px; margin: 0;">
                  ${updates.CLNT_raison_sociale ? `<li>La raison sociale a été modifiée.</li>` : ''}
                  ${updates.CLNT_email ? `<li>L'adresse e-mail a été modifiée.</li>` : ''}
                  ${updates.CLNT_telephone ? `<li>Le numéro de téléphone a été modifié.</li>` : ''}
                  ${updates.CLNT_MF ? `<li>Le matricule fiscal a été modifié.</li>` : ''}
                  ${updates.CLNT_addresses ? `<li>Les adresses ont été mises à jour.</li>` : ''}
                  ${updates.CLNT_statut ? `<li>Le statut du compte a été changé.</li>` : ''}
                  ${updates.CLNT_mot_passe ? `<li>Votre mot de passe a été réinitialisé.</li>` : ''}
                </ul>
              </div>
              <p style="margin-top: 25px;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
              <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS. Tous droits réservés.</p>
            </div>
          </div>`;
        await sendEmail(client.CLNT_email, clientUpdateSubject, clientUpdateText, clientUpdateHtml);

        await Notification.create({
          NOTF_user: client._id,
          NOTF_userModel: "Client",
          NOTF_userType: "CLIENT",
          NOTF_type: "email",
          NOTF_message: `Notification email envoyée au client ${client.CLNT_raison_sociale} suite à la mise à jour de son profil.`
        });

      
        const adminsAndTechnicians = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN", "TECHNICIEN"] }, deleted_at: null });
        for (const admin of adminsAndTechnicians) {
          const adminNotifSubject = `[Notification Admin] Client Mis à Jour : ${client.CLNT_raison_sociale}`;
          const adminNotifText = `Le profil du client ${client.CLNT_raison_sociale} (Code: ${client.CLNT_code}) a été mis à jour par un administrateur.`;
          const adminNotifHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Alerte : Profil Client Modifié</h1>
            </div>
            <div style="padding: 25px;">
              <h2 style="color: #0056b3;">Modification par un Administrateur</h2>
              <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
              <p>Le profil du client <strong>${client.CLNT_raison_sociale}</strong> (Code: ${client.CLNT_code}) a été mis à jour.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px;">
                <p style="margin: 0;">
                  <strong>Modifié par :</strong> Personnel ID ${userId}<br>
                  <strong>Date de modification :</strong> ${new Date().toLocaleString('fr-FR')}
                </p>
              </div>
              <p style="margin-top: 25px;">Veuillez consulter les détails dans le panneau d'administration si nécessaire.</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
              <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS. Tous droits réservés.</p>
            </div>
          </div>`;
          await sendEmail(admin.PERS_email, adminNotifSubject, adminNotifText, adminNotifHtml);
          await Notification.create({
            NOTF_user: admin._id,
            NOTF_userModel: "Personnel",
            NOTF_userType: admin.PERS_role_acces,
            NOTF_type: "email",
            NOTF_message: `Notification email envoyée au personnel ${admin.PERS_nom_prenom} concernant la mise à jour du client ${client.CLNT_raison_sociale}.`
          });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de mise à jour admin :", error);
    }
}


const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    let updates = req.body;

    if (!await Client.findById(id)) {
      return res.status(404).json({ message: "Client introuvable." });
    }

    if (updates.CLNT_mot_passe && !updates.CLNT_mot_passe.startsWith("$2b$")) {
      updates.CLNT_mot_passe = await bcrypt.hash(updates.CLNT_mot_passe, 10);
    }

    if (updates.CLNT_addresses) {
      try {
        if (typeof updates.CLNT_addresses === "string") {
          updates.CLNT_addresses = JSON.parse(updates.CLNT_addresses);
        }
        if (!Array.isArray(updates.CLNT_addresses) || !updates.CLNT_addresses.every(addr => addr && typeof addr === "object" && addr.address)) {
          return res.status(400).json({ message: "Format d'adresses invalide." });
        }
        updates.CLNT_addresses = updates.CLNT_addresses.map(addr => ({ address: addr.address.trim() }));
      } catch (error) {
        return res.status(400).json({ message: "Format des adresses invalide." });
      }
    }

    if (req.file) {
      updates.CLNT_contract = `uploads/contrats/${req.file.filename}`;
    }

    const client = await Client.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!client) {
      return res.status(404).json({ message: "Client introuvable après mise à jour." });
    }

 
    sendAdminUpdateNotifications(client, updates, req.user.id);

    res.status(200).json({ message: "Client mis à jour avec succès.", client });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du client :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


async function sendStatusChangeNotifications(client, oldStatus, newStatus, userId) {
    try {
        const isNowActive = newStatus === 'actif';
        const headerColor = isNowActive ? '#28a745' : '#dc3545';
        const headerTitle = isNowActive ? 'Votre Compte a été Réactivé' : 'Votre Compte a été Bloqué';
        const borderColor = isNowActive ? '#28a745' : '#dc3545';

   
        const clientStatusSubject = `[2BINFO-SYS] Mise à jour du statut de votre compte`;
        const clientStatusText = `Bonjour ${client.CLNT_raison_sociale}, Le statut de votre compte est passé de '${oldStatus}' à '${newStatus}'.`;
        const clientStatusHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">${headerTitle}</h1>
            </div>
            <div style="padding: 25px;">
              <h2 style="color: ${headerColor};">Mise à Jour du Statut de Compte</h2>
              <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
              <p>Nous vous informons d'un changement concernant le statut de votre compte client.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid ${borderColor}; margin-top: 20px;">
                  <p style="margin: 0;"><strong>Ancien statut :</strong> ${oldStatus.toUpperCase()}</p>
                  <p style="margin: 0;"><strong>Nouveau statut :</strong> <strong style="color:${headerColor};">${newStatus.toUpperCase()}</strong></p>
              </div>
              <p style="margin-top: 25px;">Si vous avez des questions concernant ce changement, n'hésitez pas à contacter notre service client.</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
              <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS. Tous droits réservés.</p>
            </div>
          </div>`;
        await sendEmail(client.CLNT_email, clientStatusSubject, clientStatusText, clientStatusHtml);

        await Notification.create({
          NOTF_user: client._id,
          NOTF_userModel: "Client",
          NOTF_userType: "CLIENT",
          NOTF_type: "email",
          NOTF_message: `Notification email envoyée au client ${client.CLNT_raison_sociale} pour la mise à jour de son statut (${newStatus}).`
        });

     
        const adminsAndTechnicians = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN", "TECHNICIEN"] }, deleted_at: null });
        for (const admin of adminsAndTechnicians) {
          const adminNotifSubject = `[Alerte Statut] Statut Client Modifié : ${client.CLNT_raison_sociale}`;
          const adminNotifText = `Le statut du client ${client.CLNT_raison_sociale} (Code: ${client.CLNT_code}) a été modifié par un admin. Nouveau Statut: ${newStatus}.`;
          const adminNotifHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Alerte : Statut Client Modifié</h1>
            </div>
            <div style="padding: 25px;">
              <h2 style="color: #0056b3;">Changement de Statut d'un Client</h2>
              <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
              <p>Le statut du client suivant a été modifié par un administrateur :</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px;">
                <p style="margin: 0;"><strong><u>Détails de la modification :</u></strong></p>
                <ul style="list-style-type: none; padding-left: 0;">
                  <li><strong>Client :</strong> ${client.CLNT_raison_sociale} (${client.CLNT_code})</li>
                  <li><strong>Ancien Statut :</strong> ${oldStatus.toUpperCase()}</li>
                  <li><strong>Nouveau Statut :</strong> <strong style="color:${headerColor};">${newStatus.toUpperCase()}</strong></li>
                  <li><strong>Modifié par :</strong> Personnel ID ${userId}</li>
                </ul>
              </div>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
              <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS. Tous droits réservés.</p>
            </div>
          </div>`;
          await sendEmail(admin.PERS_email, adminNotifSubject, adminNotifText, adminNotifHtml);
          await Notification.create({
            NOTF_user: admin._id,
            NOTF_userModel: "Personnel",
            NOTF_userType: admin.PERS_role_acces,
            NOTF_type: "email",
            NOTF_message: `Notification email envoyée au personnel ${admin.PERS_nom_prenom} concernant le statut du client ${client.CLNT_raison_sociale} (${newStatus}).`
          });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de changement de statut :", error);
    }
}

const updateClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["actif", "bloqué"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide. Veuillez fournir 'actif' ou 'bloqué'." });
    }

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé." });
    }

    const oldStatus = client.CLNT_statut;
    client.CLNT_statut = status;
    await client.save();

  
    sendStatusChangeNotifications(client, oldStatus, status, req.user.id);

    res.status(200).json({ message: `Client ${status} avec succès.`, client });

  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


async function sendDeletionNotifications(client, deletionDate, userId) {
    try {
       
        const clientDeleteSubject = `[2BINFO-SYS] Information importante concernant votre compte`;
        const clientDeleteText = `Bonjour ${client.CLNT_raison_sociale}, Votre compte client a été désactivé de notre système. Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter.`;
        const clientDeleteHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Désactivation de Votre Compte</h1>
            </div>
            <div style="padding: 25px;">
              <h2 style="color: #dc3545;">Votre Compte Client a été Supprimé</h2>
              <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
              <p>Nous vous informons que votre compte client (Code: ${client.CLNT_code}) a été désactivé dans nos systèmes le ${deletionDate.toLocaleString('fr-FR')}.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin-top: 20px;">
                <p style="margin: 0;">Vous n'aurez plus accès à votre espace client. Vos données seront conservées conformément à notre politique de confidentialité avant d'être définitivement supprimées.</p>
              </div>
              <p style="margin-top: 25px;">Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez une clarification, veuillez contacter notre support.</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
              <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS. Tous droits réservés.</p>
            </div>
          </div>`;
        await sendEmail(client.CLNT_email, clientDeleteSubject, clientDeleteText, clientDeleteHtml);

        await Notification.create({
          NOTF_user: client._id,
          NOTF_userModel: "Client",
          NOTF_userType: "CLIENT",
          NOTF_type: "email",
          NOTF_message: `Notification email envoyée au client ${client.CLNT_raison_sociale} pour la suppression logique du compte.`
        });

        const adminsAndTechnicians = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN", "TECHNICIEN"] }, deleted_at: null });
        for (const admin of adminsAndTechnicians) {
          const adminNotifSubject = `[Alerte Suppression] Client Désactivé : ${client.CLNT_raison_sociale}`;
          const adminNotifText = `Le client ${client.CLNT_raison_sociale} (Code: ${client.CLNT_code}) a été marqué comme supprimé logiquement.`;
          const adminNotifHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Alerte : Suppression Logique d'un Client</h1>
            </div>
            <div style="padding: 25px;">
              <h2 style="color: #dc3545;">Un Compte Client a été Désactivé</h2>
              <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
              <p>Le client suivant a été marqué comme supprimé (suppression logique) dans le système :</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin-top: 20px;">
                <p style="margin: 0;"><strong><u>Détails du client désactivé :</u></strong></p>
                <ul style="list-style-type: none; padding-left: 0;">
                  <li><strong>Client :</strong> ${client.CLNT_raison_sociale} (${client.CLNT_code})</li>
                  <li><strong>Email :</strong> ${client.CLNT_email}</li>
                  <li><strong>Date de suppression :</strong> ${deletionDate.toLocaleString('fr-FR')}</li>
                  <li><strong>Supprimé par :</strong> Personnel ID ${userId}</li>
                </ul>
              </div>
              <p style="margin-top: 25px;">Ce client n'apparaîtra plus dans les listes actives, mais ses données sont archivées.</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
              <p>&copy; ${new Date().getFullYear()} 2BINFO-SYS. Tous droits réservés.</p>
            </div>
          </div>`;
          await sendEmail(admin.PERS_email, adminNotifSubject, adminNotifText, adminNotifHtml);
          await Notification.create({
            NOTF_user: admin._id,
            NOTF_userModel: "Personnel",
            NOTF_userType: admin.PERS_role_acces,
            NOTF_type: "email",
            NOTF_message: `Notification email envoyée au personnel ${admin.PERS_nom_prenom} concernant la suppression logique du client ${client.CLNT_raison_sociale}.`
          });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de suppression :", error);
    }
}


const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé." });
    }

    if (client.deleted_at !== null) {
        return res.status(400).json({ message: "Le client est déjà marqué comme supprimé." });
    }

    const deletionDate = new Date();
    client.deleted_at = deletionDate;
    await client.save();

    
    sendDeletionNotifications(client, deletionDate, req.user.id);

    res.status(200).json({ message: "Client marqué comme supprimé avec succès (suppression logique)." });

  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


module.exports = {
  getClientProfile,
  updateClientProfile,
  createClient,
  getClients,
  updateClient,
  updateClientStatus,
  deleteClient
};
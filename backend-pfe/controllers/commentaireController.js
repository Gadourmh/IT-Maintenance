const mongoose = require("mongoose");
const Commentaire = require("../models/Commentaire");
const Ticket = require("../models/Ticket");
const { sendEmail } = require("../services/emailService");
const Technicien = require("../models/Technicien");
const Client = require("../models/Client");
const Personnel = require("../models/Personnel");
const Notification = require("../models/Notification");




/**
 * Gère l'envoi des notifications pour un nouveau commentaire.
 * S'exécute en arrière-plan sans bloquer la réponse de l'API.
 * @param {object} ticket - L'objet ticket populé.
 * @param {object} newCommentaire - Le commentaire qui vient d'être créé.
 * @param {object} commenterUser - L'utilisateur qui a posté le commentaire ({ _id, role }).
 */
async function sendNewCommentNotifications(ticket, newCommentaire, commenterUser) {
    try {
        console.log("--- Début de la logique de notification par e-mail (asynchrone) ---");

        let commenterEmail = '';
        let commenterName = '';
        let commenterId = commenterUser._id;
        let commenterRole = commenterUser.role;
        let commenterModel = '';

      
        if (commenterRole === 'CLIENT') {
            const user = await Client.findById(commenterId).select('CLNT_email CLNT_raison_sociale');
            if (user) {
                commenterEmail = user.CLNT_email;
                commenterName = user.CLNT_raison_sociale;
                commenterModel = 'Client';
            }
        } else if (commenterRole === 'TECHNICIEN') {
            const user = await Technicien.findById(commenterId).select('TECH_email TECH_nom_prenom');
            if (user) {
                commenterEmail = user.TECH_email;
                commenterName = user.TECH_nom_prenom;
                commenterModel = 'Technicien';
            }
        }
        

      
        if (commenterEmail) {
            const subject = "Confirmation de votre commentaire";
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                    <p>Bonjour <strong>${commenterName}</strong>,</p>
                    <p>Votre commentaire sur le ticket <strong>#${ticket.TCKT_code}</strong> a bien été posté :</p>
                    <blockquote style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 5px; font-style: italic;">
                        <p>"${newCommentaire.CMMT_message}"</p>
                    </blockquote>
                    <p>L'équipe de support vous répondra dans les meilleurs délais.</p>
                </div>
            `;
            try {
                await sendEmail(commenterEmail, subject, `Votre commentaire a été posté sur le ticket #${ticket.TCKT_code}.`, html);
                await Notification.create({
                    NOTF_user: commenterId,
                    NOTF_userModel: commenterModel,
                    NOTF_userType: commenterRole,
                    NOTF_type: "email",
                    NOTF_message: `Email de confirmation pour votre commentaire sur le ticket #${ticket.TCKT_code} envoyé.`,
                });
            } catch (emailError) {
                console.error(`❌ Erreur d'envoi d'email de confirmation (nouveau commentaire) à ${commenterEmail}:`, emailError);
            }
        }

       
        const ticketForNotif = await Ticket.findById(ticket._id)
            .populate({ path: 'TCKT_cree_par', model: 'Client', select: 'CLNT_email CLNT_raison_sociale' })
            .populate({ path: 'TCKT_assignee_a', model: 'Technicien', select: 'TECH_email TECH_nom_prenom' });

        if (!ticketForNotif) {
            console.error("[Notification Erreur] Ticket non trouvé pour la notification.");
            return;
        }

        const admins = await Personnel.find({ PERS_role_acces: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('PERS_email PERS_nom_prenom PERS_role_acces');

      
        const recipients = new Map();

        if (ticketForNotif.TCKT_cree_par?.CLNT_email) {
            recipients.set(ticketForNotif.TCKT_cree_par.CLNT_email, { name: ticketForNotif.TCKT_cree_par.CLNT_raison_sociale, type: 'CLIENT', id: ticketForNotif.TCKT_cree_par._id, model: 'Client' });
        }
        ticketForNotif.TCKT_assignee_a.forEach(tech => {
            if (tech?.TECH_email) recipients.set(tech.TECH_email, { name: tech.TECH_nom_prenom, type: 'TECHNICIEN', id: tech._id, model: 'Technicien' });
        });
        admins.forEach(admin => {
            if (admin?.PERS_email) recipients.set(admin.PERS_email, { name: admin.PERS_nom_prenom, type: admin.PERS_role_acces, id: admin._id, model: 'Personnel' });
        });

        if (commenterEmail && recipients.has(commenterEmail)) {
            recipients.delete(commenterEmail);
        }

      
        if (recipients.size > 0) {
            const subject = `Nouveau commentaire sur le ticket #${ticketForNotif.TCKT_code}`;
            const textVersion = `Bonjour,\n\nUn nouveau commentaire a été ajouté au ticket ${ticketForNotif.TCKT_code} par ${commenterName}.\n\nMessage : "${newCommentaire.CMMT_message}"\n\nCordialement,\nL'équipe de support.`;

            for (const [email, recipientInfo] of recipients) {
                const htmlVersion = `
                    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
                    <body>
                        <div class="container">
                            <p>Bonjour ${recipientInfo.name},</p>
                            <p>Un nouveau commentaire a été posté sur un ticket qui vous concerne par <strong>${commenterName}</strong>.</p>
                            <p><strong>Ticket :</strong> #${ticketForNotif.TCKT_code}</p>
                            <div class="comment"><p>"${newCommentaire.CMMT_message}"</p></div>
                        </div>
                    </body></html>`;
                
                try {
                    await sendEmail(email, subject, textVersion, htmlVersion);
                    await Notification.create({
                        NOTF_user: recipientInfo.id,
                        NOTF_userModel: recipientInfo.model,
                        NOTF_userType: recipientInfo.type,
                        NOTF_type: "email",
                        NOTF_message: `Notification email pour un nouveau commentaire sur le ticket #${ticketForNotif.TCKT_code} par ${commenterName}.`,
                    });
                } catch (emailError) {
                    console.error(`❌ Erreur d'envoi d'email de notification (nouveau commentaire) à ${email}:`, emailError);
                }
            }
            console.log("Toutes les notifications par e-mail pour le nouveau commentaire ont été traitées.");
        }
    } catch (error) {
        console.error("❌ Erreur globale lors de l'envoi des notifications (nouveau commentaire):", error);
    }
}



async function sendUpdateCommentNotifications(updatedCommentaire, updaterUser) {
    try {
        let updaterEmail = '', updaterName = '', updaterModel = '', updaterRole = updaterUser.role, updaterId = updaterUser.id;

 
        if (updaterRole === 'CLIENT') {
            const user = await Client.findById(updaterId).select('CLNT_email CLNT_raison_sociale').lean();
            if (user) { updaterEmail = user.CLNT_email; updaterName = user.CLNT_raison_sociale; updaterModel = 'Client'; }
        } else if (updaterRole === 'TECHNICIEN') {
            const user = await Technicien.findById(updaterId).select('TECH_email TECH_nom_prenom').lean();
            if (user) { updaterEmail = user.TECH_email; updaterName = user.TECH_nom_prenom; updaterModel = 'Technicien'; }
        } else if (['ADMIN', 'SUPER_ADMIN', 'NORMAL'].includes(updaterRole)) {
            const user = await Personnel.findById(updaterId).select('PERS_email PERS_nom_prenom').lean();
            if (user) { updaterEmail = user.PERS_email; updaterName = user.PERS_nom_prenom; updaterModel = 'Personnel'; }
        }

        // --- 2. Notification pour l'auteur de la modification ---
        if (updaterEmail) {
            const subject = "Confirmation de modification de votre commentaire";
            const html = `<p>Bonjour ${updaterName},</p><p>Nous confirmons que votre commentaire a bien été mis à jour.</p><p><strong>Nouveau contenu :</strong></p><blockquote><p>"${updatedCommentaire.CMMT_message}"</p></blockquote>`;
            try {
                await sendEmail(updaterEmail, subject, "Votre commentaire a été mis à jour.", html);
                await Notification.create({
                    NOTF_user: updaterId, NOTF_userModel: updaterModel, NOTF_userType: updaterRole,
                    NOTF_type: "email", NOTF_message: `Email de confirmation pour la mise à jour de votre commentaire envoyé.`
                });
            } catch (e) { console.error(`Erreur email confirmation modif commentaire à ${updaterEmail}:`, e); }
        }

 
        const ticketForNotif = await Ticket.findById(updatedCommentaire.CMMT_ticket)
            .populate({ path: 'TCKT_cree_par', model: 'Client', select: 'CLNT_email CLNT_raison_sociale' })
            .populate({ path: 'TCKT_assignee_a', model: 'Technicien', select: 'TECH_email TECH_nom_prenom' });
      
        if (!ticketForNotif) throw new Error("Ticket associé à la notification non trouvé.");

        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }).select('PERS_email PERS_nom_prenom PERS_role_acces');

        const recipients = new Map();
        if (ticketForNotif.TCKT_cree_par?.CLNT_email) {
            recipients.set(ticketForNotif.TCKT_cree_par.CLNT_email, { name: ticketForNotif.TCKT_cree_par.CLNT_raison_sociale, type: 'CLIENT', id: ticketForNotif.TCKT_cree_par._id, model: 'Client' });
        }
        ticketForNotif.TCKT_assignee_a.forEach(tech => { if (tech?.TECH_email) recipients.set(tech.TECH_email, { name: tech.TECH_nom_prenom, type: 'TECHNICIEN', id: tech._id, model: 'Technicien' }); });
        admins.forEach(admin => { if (admin?.PERS_email) recipients.set(admin.PERS_email, { name: admin.PERS_nom_prenom, type: admin.PERS_role_acces, id: admin._id, model: 'Personnel' }); });

        if (updaterEmail && recipients.has(updaterEmail)) {
            recipients.delete(updaterEmail);
        }
      
        if (recipients.size > 0) {
            const subject = `Mise à jour d'un commentaire sur le ticket #${ticketForNotif.TCKT_code}`;
            for (const [email, recipientInfo] of recipients) {
                const htmlVersion = `
                    <p>Bonjour ${recipientInfo.name},</p>
                    <p>Un commentaire a été <strong>mis à jour</strong> sur le ticket #${ticketForNotif.TCKT_code} par ${updaterName}.</p>
                    <p><strong>Nouveau message :</strong></p>
                    <blockquote><p>"${updatedCommentaire.CMMT_message}"</p></blockquote>`;
                try {
                    await sendEmail(email, subject, `Un commentaire a été mis à jour sur le ticket #${ticketForNotif.TCKT_code}.`, htmlVersion);
                    await Notification.create({
                        NOTF_user: recipientInfo.id, NOTF_userModel: recipientInfo.model, NOTF_userType: recipientInfo.type,
                        NOTF_type: "email", NOTF_message: `Notification email pour la mise à jour d'un commentaire sur le ticket #${ticketForNotif.TCKT_code} par ${updaterName}.`
                    });
                } catch(e) { console.error(`Erreur email notif modif commentaire à ${email}:`, e); }
            }
        }
    } catch (error) {
        console.error("❌ Erreur globale lors de l'envoi des notifications (mise à jour):", error);
    }
}



async function sendDeleteCommentNotifications(commentaireToSoftDelete, deleterUser) {
    try {
        let deleterEmail = '', deleterName = '', deleterModel = '', deleterRole = deleterUser.role, deleterId = deleterUser.id;

    
        if (deleterRole === 'CLIENT') {
            const user = await Client.findById(deleterId).select('CLNT_email CLNT_raison_sociale').lean();
            if (user) { deleterEmail = user.CLNT_email; deleterName = user.CLNT_raison_sociale; deleterModel = 'Client'; }
        } else if (deleterRole === 'TECHNICIEN') {
            const user = await Technicien.findById(deleterId).select('TECH_email TECH_nom_prenom').lean();
            if (user) { deleterEmail = user.TECH_email; deleterName = user.TECH_nom_prenom; deleterModel = 'Technicien'; }
        } else if (['ADMIN', 'SUPER_ADMIN', 'NORMAL'].includes(deleterRole)) {
            const user = await Personnel.findById(deleterId).select('PERS_email PERS_nom_prenom').lean();
            if (user) { deleterEmail = user.PERS_email; deleterName = user.PERS_nom_prenom; deleterModel = 'Personnel'; }
        }

      
        if (deleterEmail) {
            const subject = "Confirmation de suppression de votre commentaire";
            const html = `<p>Bonjour ${deleterName},</p><p>Nous confirmons que votre commentaire a bien été supprimé.</p>`;
            try {
                await sendEmail(deleterEmail, subject, "Votre commentaire a été supprimé.", html);
                 await Notification.create({
                    NOTF_user: deleterId, NOTF_userModel: deleterModel, NOTF_userType: deleterRole,
                    NOTF_type: "email", NOTF_message: `Email de confirmation pour la suppression de votre commentaire envoyé.`
                });
            } catch (e) { console.error(`Erreur email confirmation suppression commentaire à ${deleterEmail}:`, e); }
        }

       
        const ticketForNotif = await Ticket.findById(commentaireToSoftDelete.CMMT_ticket)
            .populate({ path: 'TCKT_cree_par', model: 'Client', select: 'CLNT_email CLNT_raison_sociale' })
            .populate({ path: 'TCKT_assignee_a', model: 'Technicien', select: 'TECH_email TECH_nom_prenom' });

        if (!ticketForNotif) throw new Error("Ticket associé à la notification non trouvé.");

        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }).select('PERS_email PERS_nom_prenom PERS_role_acces');

        const recipients = new Map();
        if (ticketForNotif.TCKT_cree_par?.CLNT_email) {
            recipients.set(ticketForNotif.TCKT_cree_par.CLNT_email, { name: ticketForNotif.TCKT_cree_par.CLNT_raison_sociale, type: 'CLIENT', id: ticketForNotif.TCKT_cree_par._id, model: 'Client' });
        }
        ticketForNotif.TCKT_assignee_a.forEach(tech => { if (tech?.TECH_email) recipients.set(tech.TECH_email, { name: tech.TECH_nom_prenom, type: 'TECHNICIEN', id: tech._id, model: 'Technicien' }); });
        admins.forEach(admin => { if (admin?.PERS_email) recipients.set(admin.PERS_email, { name: admin.PERS_nom_prenom, type: admin.PERS_role_acces, id: admin._id, model: 'Personnel' }); });

        if (deleterEmail && recipients.has(deleterEmail)) {
            recipients.delete(deleterEmail);
        }

        if (recipients.size > 0) {
            const subject = `Suppression d'un commentaire sur le ticket #${ticketForNotif.TCKT_code}`;
            for (const [email, recipientInfo] of recipients) {
                const htmlVersion = `
                    <p>Bonjour ${recipientInfo.name},</p>
                    <p>Un commentaire a été <strong>supprimé</strong> sur le ticket #${ticketForNotif.TCKT_code} par ${deleterName}.</p>
                    <p><strong>Contenu du commentaire supprimé :</strong></p>
                    <blockquote style="text-decoration: line-through;">
                        <p>"${commentaireToSoftDelete.CMMT_message}"</p>
                    </blockquote>`;
                try {
                    await sendEmail(email, subject, `Un commentaire a été supprimé sur le ticket #${ticketForNotif.TCKT_code}.`, htmlVersion);
                     await Notification.create({
                        NOTF_user: recipientInfo.id, NOTF_userModel: recipientInfo.model, NOTF_userType: recipientInfo.type,
                        NOTF_type: "email", NOTF_message: `Notification email pour la suppression d'un commentaire sur le ticket #${ticketForNotif.TCKT_code} par ${deleterName}.`,
                    });
                } catch (e) { console.error(`Erreur email notif suppression commentaire à ${email}:`, e); }
            }
        }
    } catch (error) {
        console.error("❌ Erreur globale lors de l'envoi des notifications (suppression):", error);
    }
}




const createCommentaire = async (req, res) => {
  try {
    const { TCKT_code, CMMT_message, CMMT_utilisateur_nom, CMMT_utilisateur_code } = req.body;
    const commenterUser = req.user;

    if (!TCKT_code || !CMMT_message || !CMMT_utilisateur_nom || !CMMT_utilisateur_code) {
      return res.status(400).json({ message: "Code du ticket, message, nom et code de l'utilisateur requis." });
    }

    const ticket = await Ticket.findOne({ TCKT_code: TCKT_code });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket introuvable." });
    }

    const newCommentaire = new Commentaire({
      CMMT_ticket: ticket._id,
      CMMT_utilisateur: commenterUser._id,
      CMMT_utilisateur_Type: commenterUser.role,
      CMMT_utilisateur_nom,
      CMMT_utilisateur_code,
      CMMT_message
    });

    await newCommentaire.save();
    
   
    sendNewCommentNotifications(ticket, newCommentaire, commenterUser);

    res.status(201).json({ message: "Commentaire ajouté avec succès !", commentaire: newCommentaire });
  
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


const getCommentairesByTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: "ID de ticket invalide" });
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      deleted_at: null
    })
    .populate("TCKT_client", "CLNT_code deleted_at");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé ou inactif." });
    }

    const commentaires = await Commentaire.find({
      CMMT_ticket: ticketId,
      deleted_at: null
    })
    .populate({
      path: "CMMT_utilisateur",
      select: "CLNT_raison_sociale TECH_nom_prenom deleted_at",
    })
    .sort({ CMMT_Date_creation: -1 });

    const commentairesFormatés = commentaires.map((commentaire) => {
      const utilisateur = commentaire.CMMT_utilisateur;
      const utilisateurNom = utilisateur
        ? (utilisateur.CLNT_raison_sociale || utilisateur.TECH_nom_prenom || "Inconnu")
        : "Utilisateur Supprimé/Inconnu";
      const utilisateurIsDeleted = utilisateur ? !!utilisateur.deleted_at : true;
      const utilisateurInfo = utilisateurNom + (utilisateurIsDeleted ? " (Supprimé)" : "");

      return {
        ...commentaire.toObject(),
        utilisateurInfo,
        utilisateur_is_deleted: utilisateurIsDeleted,
        client_is_deleted: !!ticket.TCKT_client?.deleted_at,
        clientCode: ticket.TCKT_client?.CLNT_code,
      };
    });

    res.status(200).json(commentairesFormatés);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des commentaires par ticket :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


const getCommentairesByTicketCode = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      TCKT_code: req.params.code,
      deleted_at: null
    });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket introuvable (ou inactif)." });
    }

    const commentaires = await Commentaire.find({
      CMMT_ticket: ticket._id,
      deleted_at: null
    }).sort({
      CMMT_Date_creation: -1,
    });

    const commentairesAvecInfos = await Promise.all(commentaires.map(async (commentaire) => {
      const utilisateurInfo = {
        nom: commentaire.CMMT_utilisateur_nom,
        code: commentaire.CMMT_utilisateur_code,
        type: commentaire.CMMT_utilisateur_Type,
        photo_profil: "",
        is_deleted: false
      };

      if (commentaire.CMMT_utilisateur_Type === 'CLIENT') {
        const client = await Client.findById(commentaire.CMMT_utilisateur_code, "CLNT_photo_profil deleted_at");
        utilisateurInfo.photo_profil = client?.CLNT_photo_profil || "";
        utilisateurInfo.is_deleted = !!client?.deleted_at;
      } else if (commentaire.CMMT_utilisateur_Type === 'TECHNICIEN') {
         const technicien = await Technicien.findById(commentaire.CMMT_utilisateur_code, "TECH_photo_profil deleted_at");
         utilisateurInfo.photo_profil = technicien?.TECH_photo_profil || "";
         utilisateurInfo.is_deleted = !!technicien?.deleted_at;
      } else if (['ADMIN', 'SUPER_ADMIN', 'NORMAL'].includes(commentaire.CMMT_utilisateur_Type)) {
         const personnel = await Personnel.findById(commentaire.CMMT_utilisateur_code, "PERS_photo_profil deleted_at");
         utilisateurInfo.photo_profil = personnel?.PERS_photo_profil || "";
         utilisateurInfo.is_deleted = !!personnel?.deleted_at;
      }

      const auteurNomAffichee = utilisateurInfo.nom + (utilisateurInfo.is_deleted ? " (Supprimé)" : "");

      return {
        ...commentaire.toObject(),
        auteur: {
           ...utilisateurInfo,
           nom_affichee: auteurNomAffichee,
        },
        ticket: {
          TCKT_code: ticket.TCKT_code,
        }
      };
    }));

    res.status(200).json(commentairesAvecInfos);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des commentaires par code ticket :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


const getAllCommentaires = async (req, res) => {
  try {
    const commentaires = await Commentaire.find({
      deleted_at: null
    })
    .populate("CMMT_ticket", "TCKT_code deleted_at")
    .sort({ createdAt: -1 })
    .lean();

    const commentairesAvecUserInfo = await Promise.all(commentaires.map(async (commentaire) => {
      const userId = commentaire.CMMT_utilisateur_code;
      const userType = commentaire.CMMT_utilisateur_Type;
      let userCodeAffichee = 'N/A';
      let userPhotoAffichee = '';
      let userNameAffichee = commentaire.CMMT_utilisateur_nom || 'N/A';
      let userIsDeleted = false;

      let UserModel;
      switch (userType) {
        case 'CLIENT': UserModel = Client; break;
        case 'TECHNICIEN': UserModel = Technicien; break;
        case 'ADMIN': case 'SUPER_ADMIN': case 'NORMAL': UserModel = Personnel; break;
        default: UserModel = null;
      }

      if (UserModel && userId && mongoose.Types.ObjectId.isValid(userId)) {
        try {
          const user = await UserModel.findById(userId).select("CLNT_code CLNT_photo_profil CLNT_raison_sociale TECH_code TECH_photo_profil TECH_nom_prenom PERS_code PERS_photo_profil PERS_nom_prenom deleted_at");
          if (user) {
             userIsDeleted = !!user.deleted_at;
             switch (userType) {
               case 'CLIENT':
                 userCodeAffichee = user.CLNT_code || 'N/A';
                 userPhotoAffichee = user.CLNT_photo_profil || '';
                 userNameAffichee = user.CLNT_raison_sociale || userNameAffichee;
                 break;
               case 'TECHNICIEN':
                 userCodeAffichee = user.TECH_code || 'N/A';
                 userPhotoAffichee = user.TECH_photo_profil || '';
                 userNameAffichee = user.TECH_nom_prenom || userNameAffichee;
                 break;
               case 'ADMIN': case 'SUPER_ADMIN': case 'NORMAL':
                 userCodeAffichee = user.PERS_code || 'N/A';
                 userPhotoAffichee = user.PERS_photo_profil || '';
                 userNameAffichee = user.PERS_nom_prenom || userNameAffichee;
                 break;
             }
          } else {
              userIsDeleted = true;
          }
        } catch (findError) {
             userIsDeleted = true;
        }
      } else {
           userIsDeleted = true;
      }

      const finalUserNameAffichee = userNameAffichee + (userIsDeleted ? " (Supprimé)" : "");

      return {
        ...commentaire,
        CMMT_utilisateur_code_affichee: userCodeAffichee,
        CMMT_utilisateur_photo_affichee: userPhotoAffichee,
        CMMT_utilisateur_nom_affichee: finalUserNameAffichee,
        CMMT_utilisateur_is_deleted: userIsDeleted,
        TCKT_is_deleted: commentaire.CMMT_ticket ? !!commentaire.CMMT_ticket.deleted_at : true,
        TCKT_code_affichee: commentaire.CMMT_ticket?.TCKT_code || 'N/A'
      };
    }));

    res.status(200).json(commentairesAvecUserInfo);

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des commentaires:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des commentaires.", error: error.message });
  }
};



const updateCommentaire = async (req, res) => {
  try {
    const commentaireId = req.params.id;
    const { CMMT_message } = req.body;
    const updaterUser = req.user;

    if (!commentaireId || !CMMT_message?.trim()) {
      return res.status(400).json({ message: 'ID du commentaire et message sont requis' });
    }

    const updatedCommentaire = await Commentaire.findByIdAndUpdate(
      commentaireId, { CMMT_message: CMMT_message.trim() }, { new: true }
    );

    if (!updatedCommentaire) {
      return res.status(404).json({ message: 'Commentaire non trouvé lors de la mise à jour' });
    }

    
    sendUpdateCommentNotifications(updatedCommentaire, updaterUser);
    
    res.status(200).json({ message: 'Commentaire mis à jour avec succès', commentaire: updatedCommentaire });
  } catch (error) {
    console.error('❌ Erreur globale lors de la mise à jour du commentaire:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du commentaire' });
  }
};


const deleteCommentaire = async (req, res) => {
  try {
    const commentaireId = req.params.id;
    const deleterUser = req.user;

    if (!commentaireId) {
      return res.status(400).json({ message: 'ID du commentaire est requis' });
    }

    const commentaireToSoftDelete = await Commentaire.findById(commentaireId);
    if (!commentaireToSoftDelete) {
      return res.status(404).json({ message: 'Commentaire non trouvé' });
    }
    
    const updatedCommentaire = await Commentaire.findByIdAndUpdate(
      commentaireId, { $set: { deleted_at: new Date() } }, { new: true }
    );

 
    sendDeleteCommentNotifications(commentaireToSoftDelete, deleterUser);
    
    res.status(200).json({ message: 'Commentaire supprimé logiquement avec succès', commentaire: updatedCommentaire });
  } catch (error) {
    console.error('❌ Erreur globale lors de la suppression logique du commentaire:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression logique du commentaire' });
  }
};


module.exports = {
  createCommentaire,
  getCommentairesByTicket,
  getCommentairesByTicketCode,
  getAllCommentaires,
  updateCommentaire,
  deleteCommentaire,
};
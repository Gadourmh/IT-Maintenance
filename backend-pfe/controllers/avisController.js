// controllers/avisController.js
const mongoose = require('mongoose');
const Avis = require("../models/Avis");
const Personnel = require("../models/Personnel");
const Client = require("../models/Client");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");

// ===================================================================================
// SECTION : GESTION DES NOTIFICATIONS ASYNCHRONES
// ===================================================================================

/**
 * Gère l'envoi des notifications de création d'avis en arrière-plan (aux admins et au client).
 * @param {object} avis - L'objet avis qui vient d'être créé et populé. Ceci est un commentaire JSDoc décrivant la fonction asynchrone sendCreationNotification
 Elle prend un objet avis (un avis) en paramètre et est chargée d'envoyer des notifications lorsqu'un nouvel avis est créé**/


 async function sendCreationNotification(avis) {
    try { // Démarre un bloc try pour gérer les erreurs potentielles pendant le processus de notification.
        
        const clientInfo = avis.AVIS_client;//Extrait les informations du client du champ AVIS_client de l'objet avis. Ce champ est censé être rempli avec les détails du client.
       
        if (!clientInfo || !clientInfo.CLNT_email) {
            console.error("Impossible d'envoyer de notification : email du client manquant.");
            return;
        }

        // --- 1. Notification pour le CLIENT ---
        const clientSubject = "Nous avons bien reçu votre avis !"; // Définit l'objet de l'e-mail de notification à envoyer au client.
        
        const clientTextMessage = `Bonjour ${clientInfo.CLNT_raison_sociale}, merci d'avoir partagé votre avis. Nous l'avons bien reçu. Message : "${avis.AVIS_message}".`;
        
    //Définit le message formaté en HTML pour l'e-mail du client, offrant une notification plus visuellement attrayante.
    
    const clientHtmlMessage = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
              <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0;">Merci pour votre retour !</h1>
              </div>
              <div style="padding: 25px;">
                <h2 style="color: #007bff;">Votre avis a été publié avec succès.</h2>
                <p>Bonjour <strong>${clientInfo.CLNT_raison_sociale}</strong>,</p>
                <p>Nous vous remercions sincèrement d'avoir pris le temps de nous laisser un avis. Votre retour est précieux pour nous.</p>
                <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-top: 20px;">
                    <p style="margin: 0;"><strong>Votre message :</strong></p>
                    <blockquote style="margin: 10px 0;"><em>"${avis.AVIS_message}"</em></blockquote>
                    <p><strong>Note :</strong> ${avis.AVIS_note}/5</p>
                </div>
              </div>
               <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd;">
                <p>L'équipe 2BINFO-SYS</p>
              </div>
            </div>`;

        try {
            await sendEmail(clientInfo.CLNT_email, clientSubject, clientTextMessage, clientHtmlMessage);
            // Traçage de la notification pour le client
            await Notification.create({
                NOTF_user: clientInfo._id,
                NOTF_userModel: "Client",
                NOTF_userType: 'CLIENT',
                NOTF_type: "email",
                NOTF_message: `Email de confirmation pour la création de votre avis envoyé.`,
            });
        } catch (emailError) {
             console.error(`❌ Erreur d'envoi d'email de confirmation (création avis) à ${clientInfo.CLNT_email}:`, emailError);
        }

        // --- 2. Notification pour les ADMINS ---
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        if (admins.length === 0) return; // Si aucun administrateur n'est trouvé, la fonction se termine car il n'y a personne à notifier.

        const adminSubject = `Nouvel avis de ${clientInfo.CLNT_raison_sociale}`;
        const adminTextMessage = `Nouvel avis de ${clientInfo.CLNT_raison_sociale}. Note: ${avis.AVIS_note}/5. Message: "${avis.AVIS_message}"`;
     
    // Une fonction d'aide pour générer le HTML pour les évaluations par étoiles en fonction de la note de l'avis.
       
    const generateStars = (note) => Array(5).fill(0).map((_, i) => `<span style="color: ${i < note ? '#ffc107' : '#e4e5e9'}; font-size: 20px;">★</span>`).join('');
        const adminHtmlMessage = `
            <div style="font-family: 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
              <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center;"><h1>⭐ Nouvel Avis Client ⭐</h1></div>
              <div style="padding: 25px;">
                <p>Un avis a été posté par <strong>${clientInfo.CLNT_raison_sociale}</strong> (Code: ${clientInfo.CLNT_code}).</p>
                <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #17a2b8;">
                    <p><strong>Note :</strong> ${generateStars(avis.AVIS_note)} (${avis.AVIS_note}/5)</p>
                    <p><strong>Message :</strong> <em>"${avis.AVIS_message}"</em></p>
                </div>
              </div>
            </div>`;
        
        for (const admin of admins) {
            try {
                if (admin.PERS_email) {
                    await sendEmail(admin.PERS_email, adminSubject, adminTextMessage, adminHtmlMessage);
                    await Notification.create({
                        NOTF_user: admin._id, NOTF_userModel: "Personnel", NOTF_userType: admin.PERS_role_acces,
                        NOTF_type: "email", NOTF_message: `Email pour nouvel avis de ${clientInfo.CLNT_raison_sociale} envoyé.`,
                    });
                }
            } catch (emailError) {
                console.error(`❌ Erreur d'envoi d'email de notification (création avis) à ${admin.PERS_email}:`, emailError);
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de la préparation des notifications de création d'avis :", error);
    }
}


/**
 * Gère l'envoi des notifications de mise à jour d'avis en arrière-plan.
 * @param {object} avis - L'objet avis mis à jour et populé.
 */
async function sendUpdateNotification(avis) {
    try {
        const clientInfo = avis.AVIS_client;
        if (!clientInfo || !clientInfo.CLNT_email) return;

        // --- 1. Notification pour le CLIENT ---
        const clientSubject = "Votre avis a bien été mis à jour";
        const clientHtmlMessage = `
         <div style="font-family: 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center;"><h1>📝 Avis Mis à Jour 📝</h1></div>
            <div style="padding: 25px;">
                <p>Bonjour <strong>${clientInfo.CLNT_raison_sociale}</strong>,</p>
                <p>Nous vous confirmons que votre avis a été modifié avec succès.</p>
            </div>
         </div>`;
        try {
            await sendEmail(clientInfo.CLNT_email, clientSubject, "Votre avis a été mis à jour.", clientHtmlMessage);
            await Notification.create({
                NOTF_user: clientInfo._id, NOTF_userModel: "Client", NOTF_userType: 'CLIENT',
                NOTF_type: "email", NOTF_message: `Email de confirmation pour la mise à jour de votre avis envoyé.`,
            });
        } catch (e) { console.error(`Erreur email client ${clientInfo.CLNT_email}:`, e); }

        // --- 2. Notification pour les ADMINS ---
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const adminSubject = `[Avis Modifié] L'avis du client ${clientInfo.CLNT_code} a été mis à jour`;
        for (const admin of admins) {
            try {
                if(admin.PERS_email) {
                    await sendEmail(admin.PERS_email, adminSubject, `L'avis de ${clientInfo.CLNT_raison_sociale} a été modifié.`);
                    await Notification.create({
                        NOTF_user: admin._id, NOTF_userModel: "Personnel", NOTF_userType: admin.PERS_role_acces,
                        NOTF_type: "email", NOTF_message: `Email pour la modification de l'avis de ${clientInfo.CLNT_raison_sociale} envoyé.`,
                    });
                }
            } catch (e) { console.error(`Erreur email admin ${admin.PERS_email}:`, e); }
        }
    } catch (error) {
        console.error("❌ Erreur lors de la préparation des notifications de mise à jour d'avis :", error);
    }
}


/**
 * Gère l'envoi des notifications de suppression d'avis en arrière-plan.
 * @param {object} avis - L'objet avis avant sa suppression (contient les infos nécessaires).
 * @param {boolean} isOwner - Vrai si la suppression est faite par le client lui-même.
 */
async function sendDeletionNotification(avis, isOwner) {
    try {
        await avis.populate('AVIS_client', 'CLNT_raison_sociale CLNT_code CLNT_email');
        const clientInfo = avis.AVIS_client;
        if (!clientInfo || !clientInfo.CLNT_email) return;
        
        const deletedByName = isOwner ? `vous-même` : `un administrateur`;//Détermine qui a effectué la suppression pour le contenu du message.


        // --- 1. Notification pour le CLIENT ---
        const clientSubject = "Confirmation de suppression de votre avis";
        const clientHtmlMessage = `
         <div style="font-family: 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;"><h1>🗑️ Avis Supprimé 🗑️</h1></div>
            <div style="padding: 25px;">
                <p>Bonjour <strong>${clientInfo.CLNT_raison_sociale}</strong>,</p>
                <p>Nous vous confirmons que votre avis a été supprimé suite à une action de <strong>${deletedByName}</strong>.</p>
                <p>Si vous n'êtes pas à l'origine de cette action, n'hésitez pas à contacter notre support.</p>
            </div>
         </div>`;
        try {
            await sendEmail(clientInfo.CLNT_email, clientSubject, "Votre avis a été supprimé.", clientHtmlMessage);
            await Notification.create({
                NOTF_user: clientInfo._id, NOTF_userModel: "Client", NOTF_userType: 'CLIENT',
                NOTF_type: "email", NOTF_message: `Email de confirmation pour la suppression de votre avis envoyé.`,
            });
        } catch(e) { console.error(`Erreur email client ${clientInfo.CLNT_email}:`, e); }
        
        // --- 2. Notification pour les ADMINS (uniquement si ce n'est pas un admin qui a supprimé) ---
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const adminSubject = `[Avis Supprimé] L'avis de ${clientInfo.CLNT_code} a été rendu inactif`;
        for (const admin of admins) {
            try {
                if(admin.PERS_email) {
                    await sendEmail(admin.PERS_email, adminSubject, `L'avis de ${clientInfo.CLNT_raison_sociale} a été supprimé par ${isOwner ? 'le client lui-même' : 'un autre admin'}.`);
                    await Notification.create({
                        NOTF_user: admin._id, NOTF_userModel: "Personnel", NOTF_userType: admin.PERS_role_acces,
                        NOTF_type: "email", NOTF_message: `Notification de suppression de l'avis de ${clientInfo.CLNT_raison_sociale}.`,
                    });
                }
            } catch (e) { console.error(`Erreur email admin ${admin.PERS_email}:`, e); }
        }
    } catch (error) {
        console.error("❌ Erreur lors de la préparation des notifications de suppression d'avis :", error);
    }
}


// ===================================================================================
// SECTION : CONTRÔLEURS CRUD
// ===================================================================================

exports.createAvis = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'CLIENT') {
             return res.status(403).json({ message: "Action non autorisée." });
        }
        const avis = new Avis({ ...req.body, AVIS_client: req.user.id });//Crée une nouvelle instance Avis. Elle fusionne le corps de la requête (req.body) avec le champ AVIS_client défini sur l'ID du client authentifié (req.user.id).
        
        await avis.save();
        
        await avis.populate('AVIS_client', 'CLNT_raison_sociale CLNT_photo_profil CLNT_code CLNT_email');
        sendCreationNotification(avis); // Appel asynchrone

        res.status(201).json(avis);
    } catch (error) {
        console.error("❌ Erreur création avis :", error);
        res.status(500).json({ error: "Erreur serveur." });
    }
};

exports.getAvis = async (req, res) => {
    try {
        const avisList = await Avis.find({ deleted_at: null })
                               .populate('AVIS_client', 'CLNT_raison_sociale CLNT_photo_profil CLNT_code _id')
                               .sort({ AVIS_dateCreation: -1 });// trie les résultats par date de création par ordre décroissant 
        res.json(avisList);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur." });
    }
};

exports.updateAvis = async (req, res) => {
    try {
        const { id } = req.params;
        const avis = await Avis.findById(id);
        if (!avis || avis.deleted_at) {
            return res.status(404).json({ error: "Avis non trouvé." });
        }
        if (avis.AVIS_client.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Action non autorisée." });
        }
        
        Object.assign(avis, req.body);//Met à jour l'objet avis avec les données du corps de la requête. Object.assign fusionne les propriétés de req.body dans avis.
       
        const updatedAvis = await avis.save();
        await updatedAvis.populate('AVIS_client', 'CLNT_raison_sociale CLNT_code CLNT_email _id');
        
        sendUpdateNotification(updatedAvis); // Appel asynchrone

        res.json(updatedAvis);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur." });
    }
};

exports.deleteAvis = async (req, res) => {
    try {
        const { id } = req.params;
        const avisToDelete = await Avis.findById(id);
        if (!avisToDelete || avisToDelete.deleted_at) {
            return res.status(404).json({ message: "Avis non trouvé." });
        }


        //Détermine si l'utilisateur authentifié est le propriétaire de l'avis ou un administrateur.
        
        const isOwner = req.user.role === 'CLIENT' && avisToDelete.AVIS_client.toString() === req.user.id.toString();
        const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Action non autorisée." });
        }

        avisToDelete.deleted_at = new Date();
        await avisToDelete.save();
        
        sendDeletionNotification(avisToDelete, isOwner); // Appel asynchrone

        res.status(200).json({ message: "Avis rendu inactif.", avisId: id });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur." });
    }
};
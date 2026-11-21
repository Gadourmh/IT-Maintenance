const Facture = require('../models/Facture');
const Client = require('../models/Client');
const Personnel = require('../models/Personnel');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');
const mongoose = require('mongoose');


async function sendCreationNotifications(facture, client) {
    try {
        const clientSubject = `[2BINFO-SYS] Nouvelle Facture Créée : ${facture.FACT_numeroFacture}`;
        const clientHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #004AAD; color: white; padding: 20px; text-align: center;"><h1>Nouvelle Facture</h1></div>
            <div style="padding: 20px;">
              <h2 style="color: #004AAD;">Une nouvelle facture est disponible</h2>
              <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
              <p>Voici les détails de votre nouvelle facture :</p>
              <ul style="list-style-type: none; padding: 0; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 5px;">
                <li style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Numéro de Facture :</strong> ${facture.FACT_numeroFacture}</li>
                <li style="padding: 10px;"><strong>Montant Total :</strong> ${facture.FACT_montantTotal.toFixed(2)} €</li>
              </ul>
            </div>
            <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px;"><p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p></div>
          </div>`;
        
        await sendEmail(client.CLNT_email, clientSubject, `Nouvelle facture ${facture.FACT_numeroFacture}`, clientHtml);
        await Notification.create({ NOTF_user: client._id, NOTF_userModel: 'Client', NOTF_userType: 'CLIENT', NOTF_type: 'email', NOTF_message: `Email pour nouvelle facture ${facture.FACT_numeroFacture} envoyé.` });

        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const adminSubject = `[Alerte Admin] Nouvelle Facture Créée pour ${client.CLNT_raison_sociale}`;
            const adminHtml = `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;"><h1>Nouvelle Facture Créée</h1></div>
                <div style="padding: 20px;">
                  <h2 style="color: #004AAD;">Information : Facture Créée</h2>
                  <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                  <p>Une nouvelle facture a été créée pour le client <strong>${client.CLNT_raison_sociale}</strong> (Code: ${client.CLNT_code}).</p>
                </div>
                <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px;"><p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p></div>
              </div>`;
            await sendEmail(admin.PERS_email, adminSubject, `Nouvelle facture pour ${client.CLNT_raison_sociale}`, adminHtml);
            await Notification.create({ NOTF_user: admin._id, NOTF_userModel: 'Personnel', NOTF_userType: admin.PERS_role_acces, NOTF_type: 'email', NOTF_message: `Notification de création de la facture ${facture.FACT_numeroFacture}.` });
        }
    } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi des notifications (création facture) :", emailError);
    }
}

exports.createFacture = async (req, res) => {
    try {
        const { FACT_numeroFacture, FACT_clientId, ...otherData } = req.body;

        if (!mongoose.Types.ObjectId.isValid(FACT_clientId)) {
            return res.status(400).json({ message: 'ID client invalide.' });
        }
        const client = await Client.findById(FACT_clientId);
        if (!client) return res.status(404).json({ message: 'Client non trouvé.' });
        if (client.deleted_at) return res.status(400).json({ message: "Impossible de créer une facture pour un client inactif." });

       
        const existingActiveFacture = await Facture.findOne({ FACT_numeroFacture, deleted_at: null });
        if (existingActiveFacture) {
            return res.status(409).json({ message: `Le numéro de facture '${FACT_numeroFacture}' est déjà utilisé par une facture active.` });
        }

        const newFacture = new Facture({
            FACT_numeroFacture,
            FACT_clientId,
            ...otherData
        });

        await newFacture.save();

        // Appel SANS 'await' pour une réponse immédiate
        sendCreationNotifications(newFacture, client);

        res.status(201).json(newFacture);

    } catch (err) {
        console.error("❌ Erreur lors de la création de la facture :", err);
        res.status(500).json({ message: 'Erreur lors de la création de la facture.', error: err.message });
    }
};

// ===================================================================================
// SECTION 2 : LECTURE DES FACTURES (Inchangée)
// ===================================================================================
exports.getAllFactures = async (req, res) => {
    try {
        const factures = await Facture.find({ deleted_at: null }).populate('FACT_clientId', 'CLNT_raison_sociale CLNT_code deleted_at');
        res.status(200).json(factures);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.', error: err.message });
    }
};

exports.getFactureByClientId = async (req, res) => {
    try {
        const { clientId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(clientId)) return res.status(400).json({ message: 'ID client invalide.' });
        const factures = await Facture.find({ FACT_clientId: clientId, deleted_at: null }).populate('FACT_clientId', 'CLNT_raison_sociale CLNT_code');
        res.status(200).json(factures);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.', error: err.message });
    }
};

exports.getFactureById = async (req, res) => {
    try {
        const facture = await Facture.findById(req.params.id).populate('FACT_clientId', 'CLNT_raison_sociale CLNT_code deleted_at');
        if (!facture) return res.status(404).json({ message: 'Facture non trouvée.' });
        res.status(200).json(facture);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.', error: err.message });
    }
};

// ===================================================================================
// SECTION 3 : MISE À JOUR DE FACTURE
// ===================================================================================

/**
 * NOUVEAU : Gère l'envoi des notifications de mise à jour en arrière-plan.
 */
async function sendUpdateNotifications(facture, client, changesHtml) {
    try {
        if (!client || client.deleted_at) return;

        const clientSubject = `[2BINFO-SYS] Mise à Jour de votre Facture : ${facture.FACT_numeroFacture}`;
        const clientHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center;"><h1>Mise à Jour de Facture</h1></div>
            <div style="padding: 20px;">
              <h2 style="color: #004AAD;">Votre facture a été modifiée</h2>
              <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
              <p>Détail des modifications :</p>
              <ul style="list-style-type: none; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                ${changesHtml}
              </ul>
            </div>
            <div style="background-color: #f4f4f4; color: #888; padding: 15px; text-align: center; font-size: 12px;"><p>&copy; ${new Date().getFullYear()} 2BINFO-SYS</p></div>
          </div>`;
        await sendEmail(client.CLNT_email, clientSubject, `Mise à jour facture ${facture.FACT_numeroFacture}`, clientHtml);
        await Notification.create({ NOTF_user: client._id, NOTF_userModel: 'Client', NOTF_userType: 'CLIENT', NOTF_type: 'email', NOTF_message: `Email MàJ facture ${facture.FACT_numeroFacture} envoyé.` });

        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const adminSubject = `[Alerte Admin] Facture Mise à Jour pour ${client.CLNT_raison_sociale}`;
            const adminHtml = `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center;"><h1>Facture Mise à Jour</h1></div>
                <div style="padding: 20px;">
                  <p>La facture <strong>${facture.FACT_numeroFacture}</strong> pour <strong>${client.CLNT_raison_sociale}</strong> a été modifiée. Détails :</p>
                   <ul style="list-style-type: none; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                     ${changesHtml}
                   </ul>
                </div>
              </div>`;
            await sendEmail(admin.PERS_email, adminSubject, `Mise à jour facture pour ${client.CLNT_raison_sociale}`, adminHtml);
        }
    } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi des notifications (MàJ facture) :", emailError);
    }
}

// MODIFIÉ : Détecte les changements, met à jour et notifie en asynchrone
exports.updateFacture = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const factureAvantUpdate = await Facture.findById(id).lean();
        if (!factureAvantUpdate) {
             return res.status(404).json({ message: 'Facture non trouvée.' });
        }

        const updatedFacture = await Facture.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        // NOUVEAU : Détection des changements pour l'email
        const changes = [];
        const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');
        
        if (updateData.FACT_dateEcheance && formatDate(factureAvantUpdate.FACT_dateEcheance) !== formatDate(updatedFacture.FACT_dateEcheance)) {
            changes.push(`<li><strong>Date d'échéance :</strong> <del>${formatDate(factureAvantUpdate.FACT_dateEcheance)}</del> &rarr; <strong>${formatDate(updatedFacture.FACT_dateEcheance)}</strong></li>`);
        }
        if (updateData.FACT_montantTotal !== undefined && factureAvantUpdate.FACT_montantTotal.toFixed(2) !== updatedFacture.FACT_montantTotal.toFixed(2)) {
            changes.push(`<li><strong>Montant Total :</strong> <del>${factureAvantUpdate.FACT_montantTotal.toFixed(2)} €</del> &rarr; <strong>${updatedFacture.FACT_montantTotal.toFixed(2)} €</strong></li>`);
        }
        if (updateData.FACT_montantPaye !== undefined && factureAvantUpdate.FACT_montantPaye.toFixed(2) !== updatedFacture.FACT_montantPaye.toFixed(2)) {
            changes.push(`<li><strong>Montant Payé :</strong> <del>${factureAvantUpdate.FACT_montantPaye.toFixed(2)} €</del> &rarr; <strong>${updatedFacture.FACT_montantPaye.toFixed(2)} €</strong></li>`);
        }
        if (updateData.FACT_statut && factureAvantUpdate.FACT_statut !== updatedFacture.FACT_statut) {
            changes.push(`<li><strong>Statut :</strong> <del>${factureAvantUpdate.FACT_statut}</del> &rarr; <strong>${updatedFacture.FACT_statut}</strong></li>`);
        }
        if (updateData.FACT_description && factureAvantUpdate.FACT_description !== updatedFacture.FACT_description) {
            changes.push(`<li><strong>Description :</strong> a été mise à jour.</li>`);
        }

        const changesHtml = changes.length > 0 ? changes.join('') : "<li>Mise à jour administrative (aucun changement majeur de données).</li>";
        
        // Appel SANS 'await' pour une réponse immédiate
        const populatedFacture = await updatedFacture.populate('FACT_clientId');
        sendUpdateNotifications(populatedFacture, populatedFacture.FACT_clientId, changesHtml);

        res.status(200).json(updatedFacture);

    } catch (err) {
        console.error("❌ Erreur lors de la mise à jour de la facture :", err);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la facture.', error: err.message });
    }
};

// ===================================================================================
// SECTION 4 : SUPPRESSION DE FACTURE
// ===================================================================================

/**
 * NOUVEAU : Gère l'envoi des notifications d'annulation en arrière-plan.
 */
async function sendDeletionNotifications(facture, client) {
    try {
        if (!client || client.deleted_at) return;

        const clientSubject = `[2BINFO-SYS] Annulation de la Facture : ${facture.FACT_numeroFacture}`;
        const clientHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
            <p>Nous vous informons que la facture <strong>${facture.FACT_numeroFacture}</strong> a été officiellement annulée.</p>
          </div>`;
        await sendEmail(client.CLNT_email, clientSubject, `Annulation facture ${facture.FACT_numeroFacture}`, clientHtml);
        await Notification.create({ NOTF_user: client._id, NOTF_userModel: 'Client', NOTF_userType: 'CLIENT', NOTF_type: 'email', NOTF_message: `Email annulation facture ${facture.FACT_numeroFacture} envoyé.` });

        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const adminSubject = `[Alerte Admin] Facture Annulée pour ${client.CLNT_raison_sociale}`;
            await sendEmail(admin.PERS_email, adminSubject, `La facture ${facture.FACT_numeroFacture} du client ${client.CLNT_raison_sociale} a été annulée.`);
        }
    } catch (emailError) {
        console.error("❌ Erreur lors de l'envoi des notifications (annulation facture) :", emailError);
    }
}

// MODIFIÉ : Supprime logiquement une facture et notifie en asynchrone
exports.deleteFacture = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de la facture invalide." });
        }

        const updatedFacture = await Facture.findByIdAndUpdate(
            id, { $set: { deleted_at: new Date() } }, { new: true }
        );

        if (!updatedFacture) {
             return res.status(404).json({ message: 'Facture non trouvée.' });
        }
        
        // Appel SANS 'await' pour une réponse immédiate
        const populatedFacture = await updatedFacture.populate('FACT_clientId');
        sendDeletionNotifications(populatedFacture, populatedFacture.FACT_clientId);

        res.status(200).json({ message: 'Facture marquée comme inactive avec succès.', facture: updatedFacture });
    } catch (err) {
        console.error("❌ Erreur lors de la suppression logique de la facture :", err);
        res.status(500).json({ message: 'Erreur serveur.', error: err.message });
    }
};
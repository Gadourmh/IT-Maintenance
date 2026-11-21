const mongoose = require('mongoose');
const Transaction = require("../models/Transaction");
const Personnel = require("../models/Personnel");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");


async function sendCreationNotifications(transaction) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const dateFormatted = new Date(transaction.TRNS_dateTransaction).toLocaleDateString('fr-FR');

        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Alerte Admin] 💰 Nouvelle Transaction Enregistrée`;
                const text = `Une nouvelle transaction (${transaction.TRNS_type}) de ${transaction.TRNS_montant} € a été enregistrée le ${dateFormatted}.`;
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>💰 Nouvelle Transaction</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>Une nouvelle transaction a été enregistrée avec les détails suivants :</p>
                      <ul style="list-style-type: none; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                        <li><strong>Type :</strong> ${transaction.TRNS_type}</li>
                        <li><strong>Montant :</strong> ${transaction.TRNS_montant.toFixed(2)} €</li>
                        <li><strong>Date :</strong> ${dateFormatted}</li>
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
                    NOTF_message: `Email notifié à ${admin.PERS_nom_prenom} pour création de la transaction ${transaction._id}.`
                });
            }
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi des notifications (création transaction) :", err);
    }
}


async function sendUpdateNotifications(transaction) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Alerte Admin] ✏️ Transaction Modifiée`;
                const text = `La transaction ${transaction._id} a été modifiée.`;
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>✏️ Transaction Modifiée</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>La transaction avec l'ID <strong>${transaction._id}</strong> a été mise à jour. Veuillez consulter l'application pour voir les détails.</p>
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
                    NOTF_message: `Email notifié à ${admin.PERS_nom_prenom} pour MàJ de la transaction ${transaction._id}.`
                });
            }
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi des notifications (MàJ transaction) :", err);
    }
}


async function sendDeletionNotifications(transaction) {
    try {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Alerte Admin] 🗑️ Transaction Désactivée`;
                const text = `La transaction ${transaction._id} a été marquée comme inactive.`;
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1>🗑️ Transaction Désactivée</h1>
                    </div>
                    <div style="padding: 20px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>La transaction avec l'ID <strong>${transaction._id}</strong> a été marquée comme inactive et archivée.</p>
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
                    NOTF_message: `Email notifié à ${admin.PERS_nom_prenom} pour désactivation de la transaction ${transaction._id}.`
                });
            }
        }
    } catch (err) {
        console.error("❌ Erreur lors de l'envoi des notifications (suppression transaction) :", err);
    }
}



exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ deleted_at: null }).sort({ TRNS_dateTransaction: -1 }); 
        res.json(transactions);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération de toutes les transactions (filtrées) :", err); 
        res.status(500).json({
             message: "Erreur serveur lors de la récupération de toutes les transactions.", 
             error: err.message 
        });
    }
};

exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id); 
        if (!transaction) return res.status(404).json({ message: "Transaction non trouvée" }); 
        res.status(200).json(transaction);
    } catch (err) {
        console.error("❌ Erreur lors de la récupération de la transaction par ID :", err); 
        res.status(500).json({ error: err.message }); 
    }
};

exports.createTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.create(req.body); 
        sendCreationNotifications(transaction); 
        res.status(201).json(transaction);
    } catch (err) {
        console.error("❌ Erreur lors de la création de la transaction :", err); 
        res.status(400).json({ error: err.message }); //
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); 
        if (!updated) return res.status(404).json({ message: "Transaction non trouvée" }); 
        sendUpdateNotifications(updated); 
        res.json(updated);
    } catch (err) {
        console.error("❌ Erreur lors de la mise à jour de la transaction :", err); 
        res.status(500).json({ message: "Erreur lors de la mise à jour", error: err.message }); 
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const transactionId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({ message: "ID de la transaction invalide." }); 
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            transactionId,
            { $set: { deleted_at: new Date() } }, 
            { new: true }
        );

        if (!updatedTransaction) {
            return res.status(404).json({ message: "Transaction non trouvée." }); 
        }
        
        sendDeletionNotifications(updatedTransaction); 

        res.status(200).json({ message: "Transaction marquée comme inactive avec succès (suppression logique).", transaction: updatedTransaction }); //
    } catch (err) {
        console.error("❌ Erreur lors de la suppression logique de la transaction :", err); 
        res.status(500).json({
             message: "Erreur serveur lors de la suppression logique de la transaction.", 
             error: err.message 
        });
    }
};
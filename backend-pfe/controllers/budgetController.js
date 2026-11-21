const Budget = require("../models/Budget");
const mongoose = require('mongoose');
const Personnel = require("../models/Personnel"); // Ajout pour notifier les admins
const Notification = require("../models/Notification"); // Ajout pour créer les notifications
const { sendEmail } = require("../services/emailService"); // Ajout pour l'envoi d'emails

// Mapping pour la création de notifications : Cela garantit que le bon NOTF_userModel est stocké dans le document Notification.
const userTypeToModelMap = {
  ADMIN: 'Personnel',
  SUPER_ADMIN: 'Personnel',
  NORMAL: 'Personnel'
};

// Créer un budget
exports.createBudget = async (req, res) => {
  try {
    
    const budget = new Budget(req.body);
    await budget.save();

    // --- Début Notification Email ---
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });

    for (const admin of admins) {
      if (admin.PERS_email) {
        const subject = `[Solution Ticketing] Nouveau Budget Créé: ${budget.BUDG_nom}`;
        const textMessage = `Un nouveau budget a été créé : Nom: ${budget.BUDG_nom}, Montant: ${budget.BUDG_montant}, Période: ${budget.BUDG_periode}.`;
        const htmlMessage = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Notification Budget</h1>
            </div>
            <div style="padding: 25px;">
              <h2 style="color: #0056b3;">Création d'un Nouveau Budget</h2>
              <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
              <p>Un nouveau budget a été ajouté au système avec les détails suivants :</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-top: 20px;">
                <ul style="list-style-type: none; padding-left: 0;">
                  <li><strong>Nom :</strong> ${budget.BUDG_nom}</li>
                  <li><strong>Montant :</strong> ${budget.BUDG_montant.toFixed(2)} €</li>
                  <li><strong>Période :</strong> ${budget.BUDG_periode}</li>
                  <li><strong>Remarques :</strong> ${budget.BUDG_remarques || 'Aucune'}</li>
                </ul>
              </div>
              <p style="margin-top: 25px;">Vous pouvez consulter ce budget dans le panneau d'administration.</p>
            </div>
            <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd; background-color: #f2f2f2; border-radius: 0 0 8px 8px;">
              <p>&copy; ${new Date().getFullYear()} Solution Ticketing. Tous droits réservés.</p>
            </div>
          </div>
        `;

        await sendEmail(admin.PERS_email, subject, textMessage, htmlMessage);

        // Création de la notification en BDD
        const userType = admin.PERS_role_acces;
        const userModelName = userTypeToModelMap[userType];
        if (userModelName) {
            await Notification.create({
                NOTF_user: admin._id,
                NOTF_userModel: userModelName,
                NOTF_userType: userType,
                NOTF_type: 'email',
                NOTF_message: `Nouveau budget créé: ${budget.BUDG_nom} (${budget.BUDG_montant}€).`
            });
        }
      }
    }
    // --- Fin Notification Email ---

    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Récupérer tous les budgets actifs
exports.getAllBudgets = async (req, res) => {
  try {
    // 🛑 Ajouter la condition pour exclure les budgets supprimés logiquement par défaut
    const query = {
      deleted_at: null // <-- **Ajouter cette condition**
    };

    // Récupère les budgets qui NE SONT PAS supprimés logiquement
    const budgets = await Budget.find(query); // Applique le filtre

    // Optionnel : Gérer le cas où aucun budget actif n'est trouvé
    // if (!budgets || budgets.length === 0) {
    //    return res.status(404).json({ message: "Aucun budget actif trouvé." });
    // }

    res.status(200).json(budgets);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des budgets (filtrés) :", error); // Log plus précis
    res.status(500).json({
        message: "Erreur serveur lors de la récupération des budgets.",
        error: error.message // Inclure le message d'erreur
    });
  }
};


// Mettre à jour un budget
exports.updateBudget = async (req, res) => {
  try {
    const updated = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // --- Début Notification Email ---
    if (updated) {
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Solution Ticketing] Mise à Jour du Budget: ${updated.BUDG_nom}`;
                const textMessage = `Le budget "${updated.BUDG_nom}" a été mis à jour. Nouveau montant: ${updated.BUDG_montant}.`;
                const htmlMessage = `
                  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;"><h2>Mise à Jour de Budget</h2></div>
                    <div style="padding: 25px;">
                      <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                      <p>Le budget <strong>${updated.BUDG_nom}</strong> a été mis à jour :</p>
                      <ul style="list-style-type: none; padding-left: 0;">
                        <li><strong>Montant :</strong> ${updated.BUDG_montant.toFixed(2)} €</li>
                        <li><strong>Période :</strong> ${updated.BUDG_periode}</li>
                        <li><strong>Remarques :</strong> ${updated.BUDG_remarques || 'Aucune'}</li>
                      </ul>
                    </div>
                  </div>`;
                  
                await sendEmail(admin.PERS_email, subject, textMessage, htmlMessage);

                // Création de la notification en BDD
                const userType = admin.PERS_role_acces;
                const userModelName = userTypeToModelMap[userType];
                if (userModelName) {
                    await Notification.create({
                        NOTF_user: admin._id,
                        NOTF_userModel: userModelName,
                        NOTF_userType: userType,
                        NOTF_type: 'email',
                        NOTF_message: `Budget ${updated.BUDG_nom} mis à jour.`
                    });
                }
            }
        }
    }
    // --- Fin Notification Email ---

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Suppression logique d'un budget
exports.deleteBudget = async (req, res) => {
  try {
    const budgetId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
        return res.status(400).json({ message: "ID du budget invalide." });
    }

    const updatedBudget = await Budget.findByIdAndUpdate(
      budgetId,
      { $set: { deleted_at: new Date() } },
      { new: true }
    );

    if (!updatedBudget) {
      return res.status(404).json({ message: "Budget non trouvé." });
    }

    // --- Début Notification Email ---
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
    for (const admin of admins) {
        if (admin.PERS_email) {
            const subject = `[Solution Ticketing] Désactivation du Budget: ${updatedBudget.BUDG_nom}`;
            const textMessage = `Le budget "${updatedBudget.BUDG_nom}" a été marqué comme inactif.`;
            const htmlMessage = `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;"><h2>Désactivation de Budget</h2></div>
                <div style="padding: 25px;">
                  <p>Bonjour <strong>${admin.PERS_nom_prenom}</strong>,</p>
                  <p>Le budget <strong>${updatedBudget.BUDG_nom}</strong> a été marqué comme inactif (suppression logique) le ${new Date(updatedBudget.deleted_at).toLocaleDateString('fr-FR')}.</p>
                  <p>Il n'apparaîtra plus dans les listes actives.</p>
                </div>
              </div>`;

            await sendEmail(admin.PERS_email, subject, textMessage, htmlMessage);

            // Création de la notification en BDD
            const userType = admin.PERS_role_acces;
            const userModelName = userTypeToModelMap[userType];
            if (userModelName) {
                await Notification.create({
                    NOTF_user: admin._id,
                    NOTF_userModel: userModelName,
                    NOTF_userType: userType,
                    NOTF_type: 'email',
                    NOTF_message: `Budget ${updatedBudget.BUDG_nom} désactivé.`
                });
            }
        }
    }
    // --- Fin Notification Email ---

    res.status(200).json({ message: "Budget marqué comme inactif avec succès (suppression logique).", budget: updatedBudget });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression logique d'un budget :", error);
    res.status(500).json({
        message: "Erreur serveur lors de la suppression logique du budget.",
        error: error.message
    });
  }
};
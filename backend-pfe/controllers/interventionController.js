const mongoose = require('mongoose');
const Intervention = require("../models/Intervention");
const Ticket = require("../models/Ticket");
const Technicien = require("../models/Technicien");
const Client = require("../models/Client");
const { sendEmail } = require("../services/emailService");
const Notification = require("../models/Notification");
const Personnel = require("../models/Personnel");
const Equipment = require("../models/Equipment");

const userTypeToModelMap = {
    ADMIN: 'Personnel',
    SUPER_ADMIN: 'Personnel',
    NORMAL: 'Personnel',
    CLIENT: 'Client',
    TECHNICIEN: 'Technicien',
};




async function sendCreationNotifications(intervention, ticket, client) {
    try {
        await intervention.populate('INTR_techniciens', 'TECH_nom_prenom TECH_email TECH_specialite');
        const techniciensNoms = intervention.INTR_techniciens.map(t => `${t.TECH_nom_prenom} (${t.TECH_specialite.join(', ')})`).join('; ');

       
        if (client && !client.deleted_at && client.CLNT_email) {
            const subject = `[Solution Ticketing] Intervention N°${intervention.INTR_code} planifiée`;
            const htmlMessage = `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;"><h1>Solution Ticketing</h1></div>
                <div style="padding: 25px;">
                  <h2 style="color: #0056b3;">Nouvelle Intervention Planifiée</h2>
                  <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
                  <p>Une nouvelle intervention a été programmée pour répondre à votre demande (Ticket <strong>${ticket.TCKT_code}</strong>).</p>
                  <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-top: 20px;">
                    <p style="margin: 0;"><strong><u>Détails de l'intervention :</u></strong></p>
                    <ul style="list-style-type: none; padding-left: 0;">
                      <li><strong>Numéro d'intervention :</strong> ${intervention.INTR_code}</li>
                      <li><strong>Date de début prévue :</strong> ${new Date(intervention.INTR_dt_debut).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</li>
                      <li><strong>Description de la panne :</strong> ${intervention.INTR_description_panne}</li>
                      <li><strong>Technicien(s) assigné(s) :</strong> ${techniciensNoms}</li>
                    </ul>
                  </div>
                  <p style="margin-top: 25px;">Nos techniciens prendront contact avec vous si nécessaire.</p>
                </div>
                <div style="text-align: center; font-size: 12px; color: #777; padding: 20px; border-top: 1px solid #ddd;"><p>&copy; ${new Date().getFullYear()} Solution Ticketing.</p></div>
              </div>`;
            await sendEmail(client.CLNT_email, subject, `Une intervention a été planifiée pour votre ticket ${ticket.TCKT_code}.`, htmlMessage);
        }

        
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Info Admin] Nouvelle Intervention Créée: ${intervention.INTR_code}`;
                const htmlMessage = `
                  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd;">
                    <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;"><h2>Notification Administrateur</h2></div>
                    <div style="padding: 25px;">
                      <h3>Nouvelle Intervention Créée</h3>
                      <p>Une nouvelle intervention <strong>${intervention.INTR_code}</strong> vient d'être planifiée pour le client <strong>${client?.CLNT_raison_sociale || 'N/A'}</strong> (Ticket: ${ticket.TCKT_code}).</p>
                      <ul style="list-style-type: none; padding-left: 0;">
                        <li><strong>Technicien(s):</strong> ${techniciensNoms}</li>
                        <li><strong>Date Début Prévue:</strong> ${new Date(intervention.INTR_dt_debut).toLocaleString('fr-FR')}</li>
                      </ul>
                    </div>
                  </div>`;
                await sendEmail(admin.PERS_email, subject, `Nouvelle intervention ${intervention.INTR_code} créée.`, htmlMessage);

                const userModelName = userTypeToModelMap[admin.PERS_role_acces];
                if (userModelName) {
                    await Notification.create({
                        NOTF_user: admin._id,
                        NOTF_userModel: userModelName,
                        NOTF_userType: admin.PERS_role_acces,
                        NOTF_type: 'email',
                        NOTF_message: `Nelle Interv. ${intervention.INTR_code} créée pour client ${client?.CLNT_code || 'N/A'}.`
                    });
                }
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de création d'intervention :", error);
    }
}


async function sendUpdateNotifications(intervention, oldStatus) {
    try {
        const ticket = await Ticket.findOne({ TCKT_code: intervention.INTR_ticket });
        const client = ticket ? await Client.findOne({ CLNT_code: ticket.TCKT_client }) : null;

      
        if (intervention.INTR_statut === "terminé" && oldStatus !== "terminé") {
            if (client && !client.deleted_at && client.CLNT_email) {
                await intervention.populate('INTR_techniciens', 'TECH_nom_prenom');
                const techniciensNoms = intervention.INTR_techniciens.map(t => t.TECH_nom_prenom).join(', ');

                const subject = `[Solution Ticketing] Intervention N°${intervention.INTR_code} terminée`;

                const htmlMessage = `
                  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;"><h1>Intervention Terminée</h1></div>
                    <div style="padding: 25px;">
                      <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
                      <p>L'intervention <strong>N°${intervention.INTR_code}</strong>, associée à votre ticket ${ticket.TCKT_code}, est terminée.</p>
                      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745;">
                        <p><strong>Solution apportée :</strong> ${intervention.INTR_solution_apportée || 'Non spécifiée'}</p>
                      </div>
                    </div>
                  </div>`;
                await sendEmail(client.CLNT_email, subject, `L'intervention N°${intervention.INTR_code} est terminée.`, htmlMessage);
                await Notification.create({
                    NOTF_user: client._id, NOTF_userModel: 'Client', NOTF_userType: 'CLIENT', NOTF_type: 'email',
                    NOTF_message: `Votre intervention pour le ticket ${ticket.TCKT_code} a été terminée.`
                });
            }
        }

     
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            if (admin.PERS_email) {
                const subject = `[Info Admin] MàJ Intervention: ${intervention.INTR_code}`;
                const htmlMessage = `
                  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd;">
                    <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center;"><h2>Mise à Jour d'Intervention</h2></div>
                    <div style="padding: 25px;">
                      <p>L'intervention <strong>${intervention.INTR_code}</strong> (Ticket: ${ticket?.TCKT_code || 'N/A'}) a été mise à jour.</p>
                      <ul style="list-style-type: none; padding-left: 0;">
                        <li><strong>Client:</strong> ${client?.CLNT_raison_sociale || 'N/A'}</li>
                        <li><strong>Nouveau Statut:</strong> ${intervention.INTR_statut}</li>
                      </ul>
                    </div>
                  </div>`;
                await sendEmail(admin.PERS_email, subject, `L'intervention ${intervention.INTR_code} a été mise à jour.`, htmlMessage);
                await Notification.create({
                    NOTF_user: admin._id, NOTF_userModel: 'Personnel', NOTF_userType: admin.PERS_role_acces, NOTF_type: 'email',
                    NOTF_message: `Interv. ${intervention.INTR_code} MàJ. Statut: ${intervention.INTR_statut}.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de mise à jour d'intervention :", error);
    }
}


async function sendDeletionNotifications(intervention) {
    try {
        const ticket = await Ticket.findOne({ TCKT_code: intervention.INTR_ticket });
        const client = ticket ? await Client.findOne({ CLNT_code: ticket.TCKT_client }) : null;

        if (client && !client.deleted_at && client.CLNT_email) {
            const subject = `[Solution Ticketing] Annulation de l'intervention N°${intervention.INTR_code}`;
            const htmlMessage = `
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd;">
                <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;"><h1>Avis d'Annulation</h1></div>
                <div style="padding: 25px;">
                  <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
                  <p>L'intervention <strong>N°${intervention.INTR_code}</strong>, planifiée pour votre ticket ${ticket.TCKT_code}, a été annulée. Pour plus d'informations, veuillez contacter le support.</p>
                </div>
              </div>`;
            await sendEmail(client.CLNT_email, subject, `L'intervention N°${intervention.INTR_code} a été annulée.`, htmlMessage);
            await Notification.create({
                NOTF_user: client._id, NOTF_userModel: 'Client', NOTF_userType: 'CLIENT', NOTF_type: 'email',
                NOTF_message: `L'intervention ${intervention.INTR_code} pour le ticket ${ticket.TCKT_code} a été annulée.`
            });
        }

       
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const subject = `[Avis Admin] Annulation Intervention ${intervention.INTR_code}`;
            const htmlMessage = `<p>L'intervention ${intervention.INTR_code} (Ticket: ${ticket?.TCKT_code || 'N/A'}, Client: ${client?.CLNT_raison_sociale || 'N/A'}) a été marquée comme inactive.</p>`;
            await sendEmail(admin.PERS_email, subject, `Intervention ${intervention.INTR_code} annulée.`, htmlMessage);
            await Notification.create({
                NOTF_user: admin._id, NOTF_userModel: 'Personnel', NOTF_userType: admin.PERS_role_acces, NOTF_type: 'email',
                NOTF_message: `Interv. ${intervention.INTR_code} annulée (Ticket: ${ticket?.TCKT_code || 'N/A'}).`
            });
        }

       
        if (intervention.INTR_techniciens?.length > 0) {
            const assignedTechnicians = await Technicien.find({ _id: { $in: intervention.INTR_techniciens }, deleted_at: null });
            for (const tech of assignedTechnicians) {
                const subject = `[Avis] Annulation de votre intervention ${intervention.INTR_code}`;
                const htmlMessage = `<p>Bonjour <strong>${tech.TECH_nom_prenom}</strong>, votre intervention ${intervention.INTR_code} pour le ticket ${ticket?.TCKT_code} a été annulée.</p>`;
                await sendEmail(tech.TECH_email, subject, `Votre intervention ${intervention.INTR_code} a été annulée.`, htmlMessage);
                await Notification.create({
                    NOTF_user: tech._id, NOTF_userModel: 'Technicien', NOTF_userType: 'TECHNICIEN', NOTF_type: 'email',
                    NOTF_message: `Votre interv. ${intervention.INTR_code} (Ticket: ${ticket?.TCKT_code || 'N/A'}) a été annulée.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications d'annulation d'intervention :", error);
    }
}



const createIntervention = async (req, res) => {
    try {
        
        const Date_creation = new Date();

      
        const INTR_dt_debut = req.body.INTR_dt_debut ? new Date(req.body.INTR_dt_debut) : Date_creation;

        if (isNaN(INTR_dt_debut.getTime())) {
            return res.status(400).json({ message: "La date de début fournie est invalide." });
        }

        const INTR_dt_fin = req.body.INTR_dt_fin ? new Date(req.body.INTR_dt_fin) : null;

        if (INTR_dt_fin && isNaN(INTR_dt_fin.getTime())) {
            return res.status(400).json({ message: "La date de fin fournie est invalide." });
        }

        const ticketCode = req.body.INTR_ticket;
        if (!ticketCode) {
            return res.status(400).json({ message: "Le code du ticket associé est manquant." });
        }

        const ticket = await Ticket.findOne({ TCKT_code: ticketCode });
        if (!ticket) {
            return res.status(404).json({ message: `Ticket avec le code ${ticketCode} non trouvé.` });
        }
        if (ticket.deleted_at) {
            return res.status(400).json({ message: `Impossible de créer une intervention pour le ticket ${ticketCode} car il est inactif.` });
        }

        
        const interventionData = {
            ...req.body,
            INTR_dt_debut: INTR_dt_debut, 
            INTR_dt_fin: INTR_dt_fin,
            Date_creation: Date_creation, 
            INTR_ticket: ticket.TCKT_code,
        };

        if (!Array.isArray(interventionData.INTR_techniciens) || interventionData.INTR_techniciens.length === 0) {
            return res.status(400).json({ message: "Au moins un technicien est requis pour l'intervention." });
        }

        const activeTechnicians = [];
        for (const techId of interventionData.INTR_techniciens) {
            if (!mongoose.Types.ObjectId.isValid(techId)) {
                return res.status(400).json({ message: `ID technicien invalide dans la liste : ${techId}` });
            }
            const technicien = await Technicien.findById(techId);
            if (!technicien) {
                return res.status(404).json({ message: `Technicien non trouvé avec l'ID : ${techId}` });
            }
            if (technicien.deleted_at) {
                return res.status(400).json({ message: `Impossible d'assigner l'intervention au technicien inactif : ${technicien.TECH_nom_prenom}` });
            }
            activeTechnicians.push(techId);
        }
        interventionData.INTR_techniciens = activeTechnicians;

        const intervention = new Intervention(interventionData);
        await intervention.save();

        const client = await Client.findOne({ CLNT_code: ticket.TCKT_client });
        sendCreationNotifications(intervention, ticket, client); 

        res.status(201).json({ message: "Intervention créée", intervention });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};


const updateIntervention = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const intervention = await Intervention.findById(id);
        if (!intervention) {
            return res.status(404).json({ message: "Intervention non trouvée" });
        }
        
        const oldStatus = intervention.INTR_statut;

        delete updateData.INTR_code;
        delete updateData.Date_creation;

        Object.assign(intervention, updateData);

        // --- DÉBUT DE LA MODIFICATION ---

        // Cas 1 : Le statut PASSE à "terminé"
        if (updateData.INTR_statut === "terminé" && oldStatus !== "terminé") {
            // Si la date de fin n'est pas déjà fournie, on la met à jour à maintenant.
            if (!intervention.INTR_dt_fin) {
                intervention.INTR_dt_fin = new Date();
            }
        } 
        // NOUVELLE LOGIQUE AJOUTÉE
        // Cas 2 : Le statut QUITTE "terminé" pour un autre état (ex: "en cours")
        else if (oldStatus === "terminé" && updateData.INTR_statut !== "terminé") {
            // On réinitialise la date de fin pour signifier que l'intervention est "rouverte".
            intervention.INTR_dt_fin = null;
            // On réinitialise également la durée, car elle n'est plus finale.
            // Le hook pre('save') la recalculera si une nouvelle date de fin est ajoutée plus tard.
            intervention.INTR_durée = 0; // Conformément au défaut du schéma.
        }

        // --- FIN DE LA MODIFICATION ---

        const updatedIntervention = await intervention.save();

        sendUpdateNotifications(updatedIntervention, oldStatus);

        res.status(200).json({ message: "Intervention mise à jour avec succès", intervention: updatedIntervention });

    } catch (error) {
        console.error("❌ Erreur updateIntervention :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};



const deleteIntervention = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID de l'intervention invalide." });
        }

        const intervention = await Intervention.findById(id);
        if (!intervention || intervention.deleted_at) {
            return res.status(404).json({ message: "Intervention non trouvée ou déjà inactive." });
        }

        const updatedIntervention = await Intervention.findByIdAndUpdate(
            id, { $set: { deleted_at: new Date() } }, { new: true }
        );

       
        sendDeletionNotifications(updatedIntervention);

        res.status(200).json({ message: "Intervention marquée comme inactive avec succès.", intervention: updatedIntervention });

    } catch (error) {
        console.error("❌ Erreur lors de la suppression logique de l'intervention :", error);
        res.status(500).json({ message: "Erreur serveur.", error: error.message });
    }
};




const getInterventions = async (req, res) => {
  try {
    const query = { deleted_at: null };
    const interventions = await Intervention.find(query)
     .populate("INTR_techniciens", "TECH_nom_prenom TECH_email TECH_specialite deleted_at")
     .select("INTR_ticket INTR_techniciens INTR_description_panne INTR_cause_panne INTR_solution_apportée INTR_statut INTR_durée INTR_dt_debut INTR_dt_fin Date_creation INTR_code INTR_cost");

    const formattedInterventions = await Promise.all(interventions.map(async (inter) => {
        const interObject = inter.toObject ? inter.toObject() : inter;
        let ticketPopulatedDetails = null, clientPopulatedDetails = null, equipmentPopulatedDetails = null;
        let ticketIsDeleted = true, clientIsDeleted = true, equipmentIsDeleted = true;

        if (interObject.INTR_ticket) {
            ticketPopulatedDetails = await Ticket.findOne({ TCKT_code: interObject.INTR_ticket })
                .select("TCKT_code TCKT_client TCKT_statut TCKT_description TCKT_degre_urgence TCKT_DT_resolution_demandee TCKT_DT_resolution_confirmee TCKT_equipment deleted_at");

            if (ticketPopulatedDetails) {
                ticketIsDeleted = !!ticketPopulatedDetails.deleted_at;
                if (ticketPopulatedDetails.TCKT_client) {
                    clientPopulatedDetails = await Client.findOne({ CLNT_code: ticketPopulatedDetails.TCKT_client })
                        .select("CLNT_code CLNT_raison_sociale CLNT_email CLNT_addresses deleted_at");
                    if(clientPopulatedDetails) clientIsDeleted = !!clientPopulatedDetails.deleted_at;
                }
                if (ticketPopulatedDetails.TCKT_equipment) {
                    equipmentPopulatedDetails = await Equipment.findOne({ EQPT_code: ticketPopulatedDetails.TCKT_equipment })
                        .select("EQPT_code EQPT_libelle EQPT_type EQPT_marque deleted_at");
                    if(equipmentPopulatedDetails) equipmentIsDeleted = !!equipmentPopulatedDetails.deleted_at;
                }
            }
        }
        
        let finalTicketDetails = ticketPopulatedDetails ? {
            ...ticketPopulatedDetails.toObject(),
            TCKT_client_details: clientPopulatedDetails ? clientPopulatedDetails.toObject() : null,
            TCKT_equipment_details: equipmentPopulatedDetails ? equipmentPopulatedDetails.toObject() : null,
        } : null;

        return {
            ...interObject,
            INTR_ticket_details: finalTicketDetails,
            ticket_is_deleted: ticketIsDeleted,
            client_is_deleted: clientIsDeleted,
            equipment_is_deleted: equipmentIsDeleted,
            techniciens_with_status: interObject.INTR_techniciens.map(tech => ({
                ...(tech.toObject ? tech.toObject() : tech), is_deleted: !!tech.deleted_at
            })),
        };
    }));
    res.status(200).json(formattedInterventions);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getInterventionById = async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id)
      .populate("INTR_techniciens", "TECH_nom_prenom TECH_email TECH_specialite deleted_at");
    if (!intervention) return res.status(404).json({ message: "Intervention non trouvée" });

    const interObject = intervention.toObject();
    let ticketDetails = null, clientDetails = null;
    let ticketIsDeleted = true, clientIsDeleted = true;

    if (interObject.INTR_ticket) {
        ticketDetails = await Ticket.findOne({ TCKT_code: interObject.INTR_ticket }).select("TCKT_code TCKT_client TCKT_statut deleted_at");
        if (ticketDetails) {
            ticketIsDeleted = !!ticketDetails.deleted_at;
            if (ticketDetails.TCKT_client) {
                clientDetails = await Client.findOne({ CLNT_code: ticketDetails.TCKT_client }).select("CLNT_raison_sociale CLNT_code deleted_at");
                clientIsDeleted = !!clientDetails?.deleted_at;
            }
        }
    }

    const formattedIntervention = {
        ...interObject,
        INTR_ticket_details: ticketDetails ? {
            ...ticketDetails.toObject(),
            TCKT_client: clientDetails ? clientDetails.CLNT_raison_sociale : ticketDetails.TCKT_client,
        } : null,
        ticket_is_deleted: ticketIsDeleted, client_is_deleted: clientIsDeleted,
        techniciens_with_status: interObject.INTR_techniciens.map(tech => ({ ...tech, is_deleted: !!tech.deleted_at })),
    };
    res.status(200).json(formattedIntervention);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const getInterventionsByTechnician = async (req, res) => {
  try {
    const { id: technicianId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
        return res.status(400).json({ message: "ID du technicien invalide" });
    }

    // --- CORRECTION APPLIQUÉE ICI ---
    // Ajout des champs manquants dans la méthode .select()
    const interventions = await Intervention.find({ INTR_techniciens: technicianId, deleted_at: null })
      .select("INTR_code INTR_ticket INTR_description_panne INTR_statut INTR_dt_debut INTR_dt_fin INTR_cost INTR_durée INTR_cause_panne INTR_solution_apportée")
      .populate("INTR_techniciens", "TECH_nom_prenom TECH_email deleted_at");
    // ---------------------------------

    const formattedInterventions = await Promise.all(interventions.map(async (inter) => {
        const interObject = inter.toObject();
        let ticketDetails = null, clientPopulatedDetails = null;
        let ticketIsDeleted = true, clientIsDeleted = true;

        if (interObject.INTR_ticket) {
            ticketDetails = await Ticket.findOne({ TCKT_code: interObject.INTR_ticket })
                .select("TCKT_code TCKT_client TCKT_statut TCKT_description deleted_at");
            if (ticketDetails) {
                ticketIsDeleted = !!ticketDetails.deleted_at;
                if (ticketDetails.TCKT_client) {
                    clientPopulatedDetails = await Client.findOne({ CLNT_code: ticketDetails.TCKT_client })
                        .select("CLNT_code CLNT_raison_sociale CLNT_email CLNT_addresses deleted_at");
                    if (clientPopulatedDetails) clientIsDeleted = !!clientPopulatedDetails.deleted_at;
                }
            }
        }
        
        return {
            ...interObject,
            INTR_ticket_details: ticketDetails ? {
                ...ticketDetails.toObject(),
                TCKT_client_details: clientPopulatedDetails ? clientPopulatedDetails.toObject() : null,
            } : null,
            ticket_is_deleted: ticketIsDeleted,
            client_is_deleted: clientIsDeleted,
        };
    }));
    res.status(200).json(formattedInterventions);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la récupération des interventions." });
  }
};


module.exports = {
  createIntervention,
  getInterventions,
  getInterventionById,
  updateIntervention,
  deleteIntervention,
  getInterventionsByTechnician
};
const mongoose = require('mongoose');
const Ticket = require("../models/Ticket");
const Client = require("../models/Client");
const Technicien = require("../models/Technicien");
const Personnel = require("../models/Personnel");
const Equipment = require("../models/Equipment");
const TypePanne = require("../models/TypePanne");
const { sendEmail } = require("../services/emailService");
const Notification = require("../models/Notification");



async function sendCreationNotifications(newTicket, client, equipment, typePanne) {
  try {
  
    const clientSubject = `[Ticket N°${newTicket.TCKT_code}] Confirmation de votre demande`;
    const clientHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background-color: #28a745; color: white; padding: 20px; text-align: center;"><h1>✅ Ticket Créé avec Succès</h1></div>
        <div style="padding: 25px;">
          <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
          <p>Votre demande a bien été enregistrée. Notre équipe va l'examiner prochainement.</p>
        </div>
      </div>`;
    await sendEmail(client.CLNT_email, clientSubject, `Ticket ${newTicket.TCKT_code} créé.`, clientHtml);
  
    await Notification.create({
        NOTF_user: client._id,
        NOTF_userModel: 'Client',
        NOTF_userType: 'CLIENT',
        NOTF_type: 'email',
        NOTF_message: `Confirmation de la création de votre ticket N°${newTicket.TCKT_code}.`
    });

   
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
    for (const admin of admins) {
      const adminSubject = `[Nouveau Ticket] #${newTicket.TCKT_code} - ${client.CLNT_raison_sociale}`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
          <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center;"><h1>🟦 Nouveau Ticket Soumis</h1></div>
          <div style="padding: 25px;">
            <p>Un nouveau ticket a été créé par <strong>${client.CLNT_raison_sociale}</strong> (Code: ${newTicket.TCKT_code}).</p>
          </div>
        </div>`;
      await sendEmail(admin.PERS_email, adminSubject, `Nouveau ticket de ${client.CLNT_raison_sociale}`, adminHtml);
     
      await Notification.create({
          NOTF_user: admin._id,
          NOTF_userModel: 'Personnel',
          NOTF_userType: admin.PERS_role_acces,
          NOTF_type: 'email',
          NOTF_message: `Nouveau ticket #${newTicket.TCKT_code} créé par ${client.CLNT_raison_sociale}.`
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des notifications de création de ticket :", error);
  }
}




async function sendAssignmentNotifications(ticket, technicien, client, equipment) {
    try {
       
        const techSubject = `[Nouvelle Assignation] Ticket #${ticket.TCKT_code}`;
        const techHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;"><h1>🟦 Nouvelle Assignation</h1></div>
            <div style="padding: 25px;">
                <p>Bonjour <strong>${technicien.TECH_nom_prenom}</strong>, vous avez été assigné au ticket <strong>#${ticket.TCKT_code}</strong>.</p>
            </div>
        </div>`;
        await sendEmail(technicien.TECH_email, techSubject, `Vous êtes assigné au ticket ${ticket.TCKT_code}`, techHtml);
     
        await Notification.create({
            NOTF_user: technicien._id,
            NOTF_userModel: 'Technicien',
            NOTF_userType: 'TECHNICIEN',
            NOTF_type: 'email',
            NOTF_message: `Vous avez été assigné au ticket #${ticket.TCKT_code}.`
        });

       
        const clientSubject = `[Ticket #${ticket.TCKT_code}] Un technicien a été assigné`;
        const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center;"><h1>🟧 Ticket en Prise en Charge</h1></div>
            <div style="padding: 25px;">
                <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
                <p>Le technicien <strong>${technicien.TECH_nom_prenom}</strong> a été assigné à votre ticket <strong>#${ticket.TCKT_code}</strong>.</p>
            </div>
        </div>`;
        await sendEmail(client.CLNT_email, clientSubject, `Technicien assigné à votre ticket.`, clientHtml);
    
        await Notification.create({
            NOTF_user: client._id,
            NOTF_userModel: 'Client',
            NOTF_userType: 'CLIENT',
            NOTF_type: 'email',
            NOTF_message: `Un technicien a été assigné à votre ticket #${ticket.TCKT_code}.`
        });

       
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const adminSubject = `[Assignation] Ticket #${ticket.TCKT_code} assigné à ${technicien.TECH_nom_prenom}`;
            const adminHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
              <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center;"><h1>ℹ️ Info Assignation</h1></div>
              <div style="padding: 25px;">
                  <p>Le ticket <strong>#${ticket.TCKT_code}</strong> du client <strong>${client.CLNT_raison_sociale}</strong> a été assigné au technicien <strong>${technicien.TECH_nom_prenom}</strong>.</p>
              </div>
            </div>`;
            await sendEmail(admin.PERS_email, adminSubject, `Assignation du ticket ${ticket.TCKT_code}`, adminHtml);
           
            await Notification.create({
                NOTF_user: admin._id,
                NOTF_userModel: 'Personnel',
                NOTF_userType: admin.PERS_role_acces,
                NOTF_type: 'email',
                NOTF_message: `Ticket #${ticket.TCKT_code} assigné à ${technicien.TECH_nom_prenom}.`
            });
        }

    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications d'assignation :", error);
    }
}



async function sendStatusUpdateNotifications(ticket, newStatus, client, equipment, assignees) {
    try {
        const isResolved = ["résolu", "fermé"].includes(newStatus);
        const headerColor = isResolved ? '#28a745' : '#ffc107';
        const title = isResolved ? '✅ Ticket Résolu' : '🟧 Mise à Jour du Statut';

    
        const clientSubject = `[Ticket #${ticket.TCKT_code}] Statut mis à jour : ${newStatus}`;
        const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background-color: ${headerColor}; color: white; padding: 20px; text-align: center;"><h1>${title}</h1></div>
            <div style="padding: 25px;">
                <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
                <p>Le statut de votre ticket <strong>#${ticket.TCKT_code}</strong> est maintenant : <strong>${newStatus.toUpperCase()}</strong>.</p>
            </div>
        </div>`;
        await sendEmail(client.CLNT_email, clientSubject, `Nouveau statut : ${newStatus}`, clientHtml);
      
        await Notification.create({
            NOTF_user: client._id,
            NOTF_userModel: 'Client',
            NOTF_userType: 'CLIENT',
            NOTF_type: 'email',
            NOTF_message: `Le statut de votre ticket #${ticket.TCKT_code} est maintenant : ${newStatus.toUpperCase()}.`
        });

    
        for (const tech of assignees) {
            const techSubject = `[Statut Ticket] #${ticket.TCKT_code} → ${newStatus}`;
            const techHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="padding: 25px;">
                    <p>Le statut du ticket <strong>#${ticket.TCKT_code}</strong> (Client: ${client.CLNT_raison_sociale}) est passé à <strong>${newStatus}</strong>.</p>
                </div>
            </div>`;
            await sendEmail(tech.TECH_email, techSubject, `Statut du ticket #${ticket.TCKT_code} mis à jour.`, techHtml);
         
            await Notification.create({
                NOTF_user: tech._id,
                NOTF_userModel: 'Technicien',
                NOTF_userType: 'TECHNICIEN',
                NOTF_type: 'email',
                NOTF_message: `Statut du ticket #${ticket.TCKT_code} (Client: ${client.CLNT_raison_sociale}) est passé à ${newStatus}.`
            });
        }
        
       
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            const adminSubject = `[Statut Modifié] Ticket #${ticket.TCKT_code} est maintenant '${newStatus}'`;
            const adminHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
              <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center;"><h1>ℹ️ Info Statut</h1></div>
              <div style="padding: 25px;">
                  <p>Le statut du ticket <strong>#${ticket.TCKT_code}</strong> (Client: <strong>${client.CLNT_raison_sociale}</strong>) a été changé à <strong>${newStatus.toUpperCase()}</strong>.</p>
              </div>
            </div>`;
            await sendEmail(admin.PERS_email, adminSubject, `Changement de statut pour le ticket ${ticket.TCKT_code}`, adminHtml);
           
            await Notification.create({
                NOTF_user: admin._id,
                NOTF_userModel: 'Personnel',
                NOTF_userType: admin.PERS_role_acces,
                NOTF_type: 'email',
                NOTF_message: `Statut du ticket #${ticket.TCKT_code} changé à ${newStatus.toUpperCase()}.`
            });
        }

    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de statut :", error);
    }
}



async function sendUpdateNotifications(updatedTicket) {
    try {
        const client = await Client.findOne({ CLNT_code: updatedTicket.TCKT_client, deleted_at: null });
        const assignees = await Technicien.find({ '_id': { $in: updatedTicket.TCKT_assignee_a }, deleted_at: null});
        if (!client) return;

        const commonHtml = `<p>Le ticket <strong>#${updatedTicket.TCKT_code}</strong> concernant le client <strong>${client.CLNT_raison_sociale}</strong> a été mis à jour. Veuillez consulter l'application pour voir les détails.</p>`;

      
        await sendEmail(client.CLNT_email, `[Mise à jour] Ticket #${updatedTicket.TCKT_code}`, `Mise à jour de votre ticket #${updatedTicket.TCKT_code}`, commonHtml);
     
        await Notification.create({
            NOTF_user: client._id,
            NOTF_userModel: 'Client',
            NOTF_userType: 'CLIENT',
            NOTF_type: 'email',
            NOTF_message: `Votre ticket #${updatedTicket.TCKT_code} a été mis à jour.`
        });

      
        for (const tech of assignees) {
            await sendEmail(tech.TECH_email, `[Mise à jour] Ticket #${updatedTicket.TCKT_code}`, `Mise à jour du ticket ${updatedTicket.TCKT_code}`, commonHtml);
         
            await Notification.create({
                NOTF_user: tech._id,
                NOTF_userModel: 'Technicien',
                NOTF_userType: 'TECHNICIEN',
                NOTF_type: 'email',
                NOTF_message: `Le ticket #${updatedTicket.TCKT_code} auquel vous êtes assigné a été mis à jour.`
            });
        }

     
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
            await sendEmail(admin.PERS_email, `[Ticket Modifié] Le ticket #${updatedTicket.TCKT_code} a été mis à jour`, `Mise à jour du ticket ${updatedTicket.TCKT_code}`, commonHtml);
           
            await Notification.create({
                NOTF_user: admin._id,
                NOTF_userModel: 'Personnel',
                NOTF_userType: admin.PERS_role_acces,
                NOTF_type: 'email',
                NOTF_message: `Le ticket #${updatedTicket.TCKT_code} a été mis à jour.`
            });
        }

    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de mise à jour générale :", error);
    }
}


async function sendDeletionNotifications(ticket, client, equipment) {
    try {
        const commonHtml = `<p>Le ticket <strong>#${ticket.TCKT_code}</strong> (Client: ${client.CLNT_raison_sociale}) a été annulé/supprimé.</p>`;
       
        await sendEmail(client.CLNT_email, `[Annulation] Ticket #${ticket.TCKT_code}`, `Ticket ${ticket.TCKT_code} annulé.`, commonHtml);
     
        await Notification.create({
            NOTF_user: client._id,
            NOTF_userModel: 'Client',
            NOTF_userType: 'CLIENT',
            NOTF_type: 'email',
            NOTF_message: `Le ticket #${ticket.TCKT_code} a été annulé/supprimé.`
        });

      
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        const adminsAndTechs = [...admins, ...ticket.TCKT_assignee_a];

        for (const user of adminsAndTechs) {
            await sendEmail(user.PERS_email || user.TECH_email, `[Annulation] Ticket #${ticket.TCKT_code}`, `Ticket ${ticket.TCKT_code} annulé.`, commonHtml);
         
            if (user.PERS_role_acces) { 
                await Notification.create({
                    NOTF_user: user._id,
                    NOTF_userModel: 'Personnel',
                    NOTF_userType: user.PERS_role_acces,
                    NOTF_type: 'email',
                    NOTF_message: `Le ticket #${ticket.TCKT_code} (Client: ${client.CLNT_raison_sociale}) a été annulé/supprimé.`
                });
            } else if (user.TECH_email) { 
                await Notification.create({
                    NOTF_user: user._id,
                    NOTF_userModel: 'Technicien',
                    NOTF_userType: 'TECHNICIEN',
                    NOTF_type: 'email',
                    NOTF_message: `Le ticket #${ticket.TCKT_code} auquel vous étiez assigné a été annulé/supprimé.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de suppression de ticket :", error);
    }
}


async function sendSprintAdditionNotifications(ticket, client, equipment) {
    try {
        const commonHtml = `Le ticket <strong>#${ticket.TCKT_code}</strong> pour le client <strong>${client.CLNT_raison_sociale}</strong> a été ajouté à un sprint.`;
      
        if (client && !client.deleted_at) {
            await sendEmail(client.CLNT_email, `[Planification] Votre ticket #${ticket.TCKT_code} a été planifié`, commonHtml, commonHtml);
         
            await Notification.create({ 
                NOTF_user: client._id, 
                NOTF_userModel: 'Client', 
                NOTF_userType: 'CLIENT', 
                NOTF_type: 'email', 
                NOTF_message: `Votre ticket #${ticket.TCKT_code} a été planifié dans un sprint.` 
            });
        }

 
        if (ticket.TCKT_assignee_a && ticket.TCKT_assignee_a.length > 0) {
            for (const tech of ticket.TCKT_assignee_a) {
                if (tech && !tech.deleted_at) {
                    await sendEmail(tech.TECH_email, `[Info Planification] Ticket #${ticket.TCKT_code} dans le sprint`, commonHtml, commonHtml);
                  
                    await Notification.create({
                        NOTF_user: tech._id,
                        NOTF_userModel: 'Technicien',
                        NOTF_userType: 'TECHNICIEN',
                        NOTF_type: 'email',
                        NOTF_message: `Le ticket #${ticket.TCKT_code} (Client: ${client.CLNT_raison_sociale}) a été ajouté à un sprint.`
                    });
                }
            }
        }
        
      
        const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] }, deleted_at: null });
        for (const admin of admins) {
             await sendEmail(admin.PERS_email, `[Info Admin] Ticket #${ticket.TCKT_code} ajouté à un Sprint`, commonHtml, commonHtml);
        -
             await Notification.create({
                 NOTF_user: admin._id,
                 NOTF_userModel: 'Personnel',
                 NOTF_userType: admin.PERS_role_acces,
                 NOTF_type: 'email',
                 NOTF_message: `Ticket #${ticket.TCKT_code} (Client: ${client.CLNT_raison_sociale}) ajouté à un sprint.`
             });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications d'ajout au sprint :", error);
    }
}





const createTicket = async (req, res) => {
    try {
        const { clientCode, ticket } = req.body;
        const client = await Client.findOne({ CLNT_code: clientCode, deleted_at: null });
        if (!client) return res.status(404).json({ message: "Client non trouvé ou inactif." });
        const equipment = await Equipment.findOne({ EQPT_code: ticket.TCKT_equipment, deleted_at: null });
        if (!equipment) return res.status(404).json({ message: "Équipement non trouvé ou inactif." });
        const typePanne = await TypePanne.findOne({ PANN_code: ticket.TCKT_type_panne, deleted_at: null });
        if (!typePanne) return res.status(404).json({ message: "Type de panne non trouvé ou inactif." });

        const newTicket = new Ticket({
            TCKT_client: client.CLNT_code, TCKT_cree_par: client._id, TCKT_equipment: equipment.EQPT_code, TCKT_types_pannes: [typePanne._id], ...ticket
        });
        await newTicket.save();

        sendCreationNotifications(newTicket, client, equipment, typePanne);
        return res.status(201).json({ message: "Ticket créé avec succès", newTicket });
    } catch (error) {
        console.error("❌ Erreur lors de la création du ticket :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

const addTicketToSprint = async (req, res) => {
  const { id } = req.params;
  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });
    if (ticket.TCKT_sprint)
       return res.status(400).json({ message: "Ce ticket est déjà assigné à un sprint." });
    
    ticket.TCKT_sprint = true;
    ticket.TCKT_sprint_id = new mongoose.Types.ObjectId();
    const savedTicket = await ticket.save();

    const populatedTicket = await Ticket.findById(savedTicket._id).populate('TCKT_assignee_a').lean();
    const client = await Client.findOne({ CLNT_code: populatedTicket.TCKT_client }).lean();
    const equipment = await Equipment.findOne({ EQPT_code: populatedTicket.TCKT_equipment }).lean();

   
    sendSprintAdditionNotifications(populatedTicket, client, equipment);

    res.status(200).json({ message: "Ticket ajouté au sprint avec succès", ticket: populatedTicket });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du ticket au sprint :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};



const assignTicketToTechnicians = async (req, res) => {
    try {
        const { id } = req.params;
        const { technicianId } = req.body;
        const ticket = await Ticket.findById(id);
        if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });
        const technicien = await Technicien.findOne({ _id: technicianId, deleted_at: null });
        if (!technicien) return res.status(404).json({ message: "Technicien non trouvé ou inactif." });
        
        if (ticket.TCKT_assignee_a.includes(technicien._id)) {
            return res.status(400).json({ message: "Le technicien est déjà assigné." });
        }
        
      
        ticket.TCKT_assignee_a.push(technicien._id);
        
      
        if (!technicien.TECH_tickets_assignees.includes(ticket._id)) {
            technicien.TECH_tickets_assignees.push(ticket._id);
        }

      
        await Promise.all([ticket.save(), technicien.save()]);

        const client = await Client.findOne({ CLNT_code: ticket.TCKT_client, deleted_at: null });
        const equipment = await Equipment.findOne({ EQPT_code: ticket.TCKT_equipment, deleted_at: null });

        if(client && equipment) {
            sendAssignmentNotifications(ticket, technicien, client, equipment);
        }

        const populatedTicket = await Ticket.findById(id).populate("TCKT_assignee_a", "TECH_nom_prenom");
        return res.status(200).json({ message: "Technicien assigné avec succès", ticket: populatedTicket });
    } catch (error) {
        console.error("❌ Erreur lors de l'assignation du technicien :", error);
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};




const updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { newStatus } = req.body;
        const ticket = await Ticket.findById(id);
        if(!ticket) return res.status(404).json({message: "Ticket non trouvé."});
        
        ticket.TCKT_statut = newStatus;
        if (["résolu", "fermé"].includes(newStatus)) {
            ticket.TCKT_DT_resolution_confirmee = new Date();
        }
        await ticket.save();

        const client = await Client.findOne({ CLNT_code: ticket.TCKT_client, deleted_at: null });
        const equipment = await Equipment.findOne({ EQPT_code: ticket.TCKT_equipment, deleted_at: null });
        const assignees = await Technicien.find({ '_id': { $in: ticket.TCKT_assignee_a }, deleted_at: null});

        if (client && equipment) {
            sendStatusUpdateNotifications(ticket, newStatus, client, equipment, assignees);
        }
       
        return res.status(200).json({ message: "Statut du ticket mis à jour avec succès", ticket });
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du statut du ticket :", error);
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};


const deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);
        if (!ticket || ticket.deleted_at) {
            return res.status(404).json({ message: "Ticket non trouvé ou déjà inactif." });
        }
        ticket.deleted_at = new Date();
        await ticket.save();

        const client = await Client.findOne({ CLNT_code: ticket.TCKT_client });
        const equipment = await Equipment.findOne({ EQPT_code: ticket.TCKT_equipment });
        
        if (client && equipment) {
            const populatedTicket = await ticket.populate('TCKT_assignee_a');
            sendDeletionNotifications(populatedTicket, client, equipment);
        }
        
        res.status(200).json({ message: "Ticket marqué comme inactif avec succès." });
    } catch (error) {
        console.error("❌ Erreur lors de la suppression logique du ticket :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};


const updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTicket = await Ticket.findByIdAndUpdate(id, { $set: req.body }, { new: true });
        if (!updatedTicket) return res.status(404).json({ message: "Ticket non trouvé" });
       
        sendUpdateNotifications(updatedTicket);

        return res.status(200).json({ message: "Ticket mis à jour avec succès", ticket: updatedTicket });
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du ticket :", error);
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};



const getTicketsByClientId = async (req, res) => {
  const clientId = req.params.id;
  try {
    const query = { TCKT_cree_par: clientId, deleted_at: null };
    const tickets = await Ticket.find(query)
      .populate("TCKT_client", "CLNT_raison_sociale CLNT_email deleted_at")
      .populate("TCKT_equipment", "EQPT_libelle EQPT_num_serie deleted_at")
      .populate("TCKT_assignee_a", "TECH_nom_prenom TECH_email deleted_at")
      .populate("TCKT_types_pannes", "PANN_libelle deleted_at")
      .exec();
    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ message: "Ce client n'a pas de tickets (actifs)." });
    }
    res.status(200).json(tickets);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des tickets par client :", err);
    res.status(500).json({ error: err.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await Ticket.findById(ticketId)
      .populate("TCKT_client", "CLNT_raison_sociale CLNT_email deleted_at")
      .populate("TCKT_equipment", "EQPT_libelle deleted_at")
      .populate("TCKT_assignee_a", "TECH_nom_prenom TECH_email deleted_at")
      .populate("TCKT_types_pannes", "PANN_libelle deleted_at")
      .exec();
    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }
    const ticketWithPopulatedStatus = {
      ...ticket.toObject(),
      TCKT_client_is_deleted: !!ticket.TCKT_client?.deleted_at,
      TCKT_equipment_is_deleted: !!ticket.TCKT_equipment?.deleted_at,
      TCKT_assignee_a_with_status: ticket.TCKT_assignee_a.map(tech => ({
        ...tech.toObject(),
        is_deleted: !!tech.deleted_at
      })),
      TCKT_types_pannes_with_status: ticket.TCKT_types_pannes.map(panne => ({
        ...panne.toObject(),
        is_deleted: !!panne.deleted_at
      })),
      TCKT_sprint: ticket.TCKT_sprint,
      TCKT_sprint_id: ticket.TCKT_sprint_id,
      TCKT_DT_resolution_confirmee: ticket.TCKT_DT_resolution_confirmee,
    };
    res.json(ticketWithPopulatedStatus);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération du ticket par ID :", err);
    res.status(500).json({ error: err.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const query = { deleted_at: null };
    let tickets = await Ticket.find(query)
      .populate("TCKT_equipment", "EQPT_libelle EQPT_code deleted_at")
      .populate("TCKT_assignee_a", "TECH_nom_prenom TECH_email deleted_at")
      .populate("TCKT_types_pannes", "PANN_libelle PANN_code deleted_at")
      .lean();
    const clients = await Client.find({}, "CLNT_code CLNT_raison_sociale deleted_at").lean();
    const clientMap = Object.fromEntries(clients.map(c => [c.CLNT_code, {
      _id: c._id,
      raison_sociale: c.CLNT_raison_sociale,
      deleted_at: c.deleted_at
    }]));
    tickets = tickets.map(ticket => ({
      ...ticket,
      TCKT_client_info: clientMap[ticket.TCKT_client] || { raison_sociale: "Client inconnu", deleted_at: null },
      TCKT_client_nom: clientMap[ticket.TCKT_client]?.raison_sociale || "Client inconnu",
      TCKT_client_is_deleted: !!clientMap[ticket.TCKT_client]?.deleted_at
    }));
    res.json(tickets);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des tickets :", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des tickets." });
  }
};



const getTicketsByTechnician = async (req, res) => {
  const { technicianId } = req.params;
  try {
    const query = { TCKT_assignee_a: technicianId ,deleted_at: null }; 
    let tickets = await Ticket.find(query)
      .populate("TCKT_client", "CLNT_code CLNT_raison_sociale deleted_at")
      .populate("TCKT_cree_par", "CLNT_code CLNT_raison_sociale deleted_at")
      .populate("TCKT_types_pannes", "PANN_libelle deleted_at")
      .populate("TCKT_assignee_a", "TECH_nom_prenom deleted_at")
      .exec();
    tickets = await Promise.all(tickets.map(async (ticket) => {
      const ticketObj = ticket.toObject();
      if (ticketObj.TCKT_equipment) { 
        const equipmentDetails = await Equipment.findOne({ EQPT_code: ticketObj.TCKT_equipment })
          .populate("EQPT_type", "TPEQ_libelle deleted_at")
          .exec();
        ticketObj.TCKT_equipment = equipmentDetails || null;
      } else {
        ticketObj.TCKT_equipment = null;
      }
      return ticketObj;
    }));
    res.status(200).json(tickets);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des tickets du technicien :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des tickets du technicien", error });
  }
};

const getTechniciensByTicketCode = async (req, res) => {
  try {
    const { ticketCode } = req.params;
    if (!ticketCode) {
      return res.status(400).json({ message: "Le code du ticket est requis" });
    }
    const ticket = await Ticket.findOne({ TCKT_code: ticketCode })
                               .populate('TCKT_assignee_a');
    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé pour ce code" });
    }
    if (!ticket.TCKT_assignee_a || !Array.isArray(ticket.TCKT_assignee_a)) {
      return res.status(200).json({ technicians: [], message: "Aucun technicien assigné à ce ticket." });
    }
    res.status(200).json({ technicians: ticket.TCKT_assignee_a });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des techniciens par code de ticket:", error);
    res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des techniciens." });
  }
};

module.exports = { 
    createTicket, 
    addTicketToSprint, 
    getTicketById, 
    getTicketsByClientId, 
    getTickets, 
    getTicketsByTechnician, 
    getTechniciensByTicketCode,
    updateTicket, 
    updateTicketStatus, 
    assignTicketToTechnicians, 
    deleteTicket 
};
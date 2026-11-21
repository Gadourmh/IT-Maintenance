const mongoose = require('mongoose');
const Equipment = require("../models/Equipment");
const Client = require("../models/Client");
const Personnel = require("../models/Personnel");
const { sendEmail } = require("../services/emailService");
const Notification = require("../models/Notification");
const Ticket = require("../models/Ticket");
const Technicien = require("../models/Technicien");


async function sendCreationNotifications(equipment) {
    try {
        const client = await Client.findOne({ CLNT_code: equipment.EQPT_CLNT_code, deleted_at: null });

     
        if (client && client.CLNT_email) {
            const subjectClient = `[2BINFO-SYS] Confirmation d'ajout de votre équipement`;
            const htmlClient = `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin:0;">✅ Équipement Ajouté</h1>
                </div>
                <div style="padding: 25px; line-height: 1.6;">
                    <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
                    <p>Nous vous confirmons que l'équipement suivant a bien été ajouté :</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin-top: 20px;">
                        <ul style="list-style-type: none; padding-left: 0;">
                            <li><strong>Désignation :</strong> ${equipment.EQPT_libelle}</li>
                            <li><strong>Type :</strong> ${equipment.EQPT_type ? equipment.EQPT_type.TPEQ_libelle : 'Non spécifié'}</li>
                            <li><strong>Marque :</strong> ${equipment.EQPT_marque}</li>
                            <li><strong>Numéro de série :</strong> ${equipment.EQPT_num_serie}</li>
                        </ul>
                    </div>
                </div>
              </div>`;
            await sendEmail(client.CLNT_email, subjectClient, `Votre équipement ${equipment.EQPT_libelle} a été enregistré.`, htmlClient);
            
            await Notification.create({
                NOTF_user: client._id,
                NOTF_userModel: "Client",
                NOTF_userType: "CLIENT",
                NOTF_type: "email",
                NOTF_message: `Email de confirmation pour l'ajout de l'équipement '${equipment.EQPT_libelle}' envoyé au client.`
            });
        }

        const staff = await Personnel.find({ 
            PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN", "TECHNICIEN"] },
            deleted_at: null 
        });
        for (const pers of staff) {
            const subjectStaff = `[INFO] Nouvel équipement ajouté : ${equipment.EQPT_libelle}`;
            const htmlStaff = `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin:0;">Nouvel Équipement</h1>
                </div>
                <div style="padding: 25px; line-height: 1.6;">
                    <p>Un nouvel équipement a été ajouté pour le client <strong>${client?.CLNT_raison_sociale || 'N/A'}</strong> (Code: ${equipment.EQPT_CLNT_code}).</p>
                </div>
              </div>`;
            await sendEmail(pers.PERS_email, subjectStaff, `Nouvel équipement pour ${client?.CLNT_raison_sociale}.`, htmlStaff);

            await Notification.create({
                NOTF_user: pers._id,
                NOTF_userModel: "Personnel",
                NOTF_userType: pers.PERS_role_acces,
                NOTF_type: "email",
                NOTF_message: `Notification pour le nouvel équipement '${equipment.EQPT_libelle}' du client '${client?.CLNT_raison_sociale || 'N/A'}' envoyée.`
            });
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de création d'équipement :", error);
    }
}


async function sendUpdateNotifications(equipment) {
    try {
        const client = await Client.findOne({ CLNT_code: equipment.EQPT_CLNT_code, deleted_at: null });

      
        if (client && client.CLNT_email) {
         
            const subjectClient = `[2BINFO-SYS] Mise à jour de votre équipement`;
            const htmlClient = `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin:0;">🔄 Équipement Mis à Jour</h1>
                </div>
                <div style="padding: 25px; line-height: 1.6;">
                    <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
                    <p>Nous vous informons que les informations de votre équipement ont été mises à jour :</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-top: 20px;">
                        <ul style="list-style-type: none; padding-left: 0;">
                            <li><strong>Désignation :</strong> ${equipment.EQPT_libelle}</li>
                            <li><strong>Type :</strong> ${equipment.EQPT_type ? equipment.EQPT_type.TPEQ_libelle : 'Non spécifié'}</li>
                            <li><strong>Marque :</strong> ${equipment.EQPT_marque}</li>
                            <li><strong>Numéro de série :</strong> ${equipment.EQPT_num_serie}</li>
                        </ul>
                    </div>
                </div>
              </div>`;
            await sendEmail(client.CLNT_email, subjectClient, `Votre équipement ${equipment.EQPT_libelle} a été mis à jour.`, htmlClient);

            await Notification.create({
                NOTF_user: client._id,
                NOTF_userModel: "Client",
                NOTF_userType: "CLIENT",
                NOTF_type: "email",
                NOTF_message: `Email de confirmation pour la mise à jour de l'équipement '${equipment.EQPT_libelle}' envoyé au client.`
            });
        }

        const staff = await Personnel.find({ 
            PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN", "TECHNICIEN"] },
            deleted_at: null 
        });
        for (const pers of staff) {
        
            const subjectStaff = `[INFO] Mise à jour d'équipement : ${equipment.EQPT_libelle}`;
            const htmlStaff = `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #ffc107; color: #212529; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin:0;">Équipement Modifié</h1>
                </div>
                <div style="padding: 25px; line-height: 1.6;">
                    <p>L'équipement <strong>${equipment.EQPT_libelle}</strong> du client <strong>${client?.CLNT_raison_sociale || 'N/A'}</strong> a été mis à jour.</p>
                </div>
              </div>`;
            await sendEmail(pers.PERS_email, subjectStaff, `Mise à jour équipement pour ${client?.CLNT_raison_sociale}.`, htmlStaff);

            await Notification.create({
                NOTF_user: pers._id,
                NOTF_userModel: "Personnel",
                NOTF_userType: pers.PERS_role_acces,
                NOTF_type: "email",
                NOTF_message: `Notification pour la mise à jour de l'équipement '${equipment.EQPT_libelle}' du client '${client?.CLNT_raison_sociale || 'N/A'}' envoyée.`
            });
        }

        const tickets = await Ticket.find({ TCKT_equipment: equipment.EQPT_code, deleted_at: null });
        if (tickets.length > 0) {
            const technicianIds = [...new Set(tickets.flatMap(ticket => ticket.TCKT_assignee_a))];
            const technicians = await Technicien.find({ '_id': { $in: technicianIds }, deleted_at: null });

            for (const tech of technicians) {
               
                const subjectTech = `[ALERTE] Mise à jour d'un équipement que vous gérez : ${equipment.EQPT_libelle}`;
                const htmlTech = `<p>Bonjour ${tech.TECH_nom_prenom}, l'équipement ${equipment.EQPT_libelle} (N/S: ${equipment.EQPT_num_serie}) pour lequel vous avez un ticket a été mis à jour.</p>`;
                await sendEmail(tech.TECH_email, subjectTech, `Un équipement que vous gérez a été mis à jour.`, htmlTech);

                await Notification.create({
                    NOTF_user: tech._id,
                    NOTF_userModel: "Technicien",
                    NOTF_userType: "TECHNICIEN",
                    NOTF_type: "email",
                    NOTF_message: `Alerte de mise à jour de l'équipement '${equipment.EQPT_libelle}' envoyée au technicien ${tech.TECH_nom_prenom}.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de mise à jour d'équipement :", error);
    }
}


async function sendDeletionNotifications(equipment) {
    try {
        const client = await Client.findOne({ CLNT_code: equipment.EQPT_CLNT_code, deleted_at: null });

        
        if (client && client.CLNT_email) {
        
            const subjectClient = `[2BINFO-SYS] Désactivation de votre équipement`;
            const htmlClient = `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin:0;">❌ Équipement Désactivé</h1>
                </div>
                <div style="padding: 25px; line-height: 1.6;">
                    <p>Bonjour <strong>${client.CLNT_raison_sociale}</strong>,</p>
                    <p>Nous vous informons que votre équipement suivant a été désactivé de nos systèmes :</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #dc3545; margin-top: 20px;">
                        <ul style="list-style-type: none; padding-left: 0;">
                            <li><strong>Désignation :</strong> ${equipment.EQPT_libelle}</li>
                            <li><strong>Numéro de série :</strong> ${equipment.EQPT_num_serie}</li>
                        </ul>
                    </div>
                     <p style="margin-top: 20px;">Cet équipement n'est plus sous gestion active. Contactez-nous pour toute question.</p>
                </div>
              </div>`;
            await sendEmail(client.CLNT_email, subjectClient, `Votre équipement ${equipment.EQPT_libelle} a été désactivé.`, htmlClient);
            
            await Notification.create({
                NOTF_user: client._id,
                NOTF_userModel: "Client",
                NOTF_userType: "CLIENT",
                NOTF_type: "email",
                NOTF_message: `Notification de désactivation de l'équipement '${equipment.EQPT_libelle}' envoyée au client.`
            });
        }

        const staff = await Personnel.find({ 
            PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN", "TECHNICIEN"] },
            deleted_at: null
        });
        for (const pers of staff) {
          
            const subjectStaff = `[ALERTE] Suppression d'équipement : ${equipment.EQPT_libelle}`;
            const htmlStaff = `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin:0;">Équipement Supprimé</h1>
                </div>
                <div style="padding: 25px; line-height: 1.6;">
                    <p>L'équipement <strong>${equipment.EQPT_libelle}</strong> (N/S: ${equipment.EQPT_num_serie}) du client <strong>${client?.CLNT_raison_sociale || 'N/A'}</strong> a été marqué comme supprimé.</p>
                </div>
              </div>`;
            await sendEmail(pers.PERS_email, subjectStaff, `Suppression équipement pour ${client?.CLNT_raison_sociale}.`, htmlStaff);

            await Notification.create({
                NOTF_user: pers._id,
                NOTF_userModel: "Personnel",
                NOTF_userType: pers.PERS_role_acces,
                NOTF_type: "email",
                NOTF_message: `Notification de désactivation de l'équipement '${equipment.EQPT_libelle}' du client '${client?.CLNT_raison_sociale || 'N/A'}' envoyée.`
            });
        }

        const tickets = await Ticket.find({ TCKT_equipment: equipment.EQPT_code, deleted_at: null });
        if (tickets.length > 0) {
            const technicianIds = [...new Set(tickets.flatMap(ticket => ticket.TCKT_assignee_a))];
            const technicians = await Technicien.find({ '_id': { $in: technicianIds }, deleted_at: null });

            for (const tech of technicians) {
            
                const subjectTech = `[ALERTE] Suppression d'un équipement que vous gérez : ${equipment.EQPT_libelle}`;
                const htmlTech = `<p>Bonjour ${tech.TECH_nom_prenom}, l'équipement ${equipment.EQPT_libelle} (N/S: ${equipment.EQPT_num_serie}) pour lequel vous avez un ticket a été désactivé.</p>`;
                await sendEmail(tech.TECH_email, subjectTech, `Un équipement que vous gérez a été désactivé.`, htmlTech);

                await Notification.create({
                    NOTF_user: tech._id,
                    NOTF_userModel: "Technicien",
                    NOTF_userType: "TECHNICIEN",
                    NOTF_type: "email",
                    NOTF_message: `Alerte de désactivation de l'équipement '${equipment.EQPT_libelle}' envoyée au technicien ${tech.TECH_nom_prenom}.`
                });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi des notifications de suppression d'équipement :", error);
    }
}




const createEquipment = async (req, res) => {
  try {
    const newEquipment = new Equipment(req.body);
    await newEquipment.save();

    const populatedEquipment = await newEquipment.populate('EQPT_type', 'TPEQ_libelle');
    sendCreationNotifications(populatedEquipment);
    
    res.status(201).json({ message: "Équipement créé avec succès.", equipment: populatedEquipment });
  } catch (error) {
    if (error.code === 11000) { 
        return res.status(409).json({ message: "Un équipement avec ce code ou numéro de série existe déjà." });
    }
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEquipment = await Equipment.findByIdAndUpdate(id, req.body, { new: true })
        .populate('EQPT_type', 'TPEQ_libelle');

    if (!updatedEquipment) {
      return res.status(404).json({ message: "Équipement non trouvé." });
    }

    sendUpdateNotifications(updatedEquipment);

    res.status(200).json({ message: "Équipement mis à jour avec succès.", equipment: updatedEquipment });
  } catch (error) {
    console.error("❌ Erreur dans updateEquipment:", error); 
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEquipment = await Equipment.findByIdAndUpdate(
      id,
      { $set: { deleted_at: new Date() } },
      { new: true }
    );

    if (!deletedEquipment) {
      return res.status(404).json({ message: "Équipement non trouvé." });
    }
    
    sendDeletionNotifications(deletedEquipment);
    
    res.status(200).json({ message: "Équipement marqué comme supprimé avec succès.", equipment: deletedEquipment });
  } catch (error) {
    console.error("❌ Erreur dans deleteEquipment:", error);
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

const getEquipments = async (req, res) => {
  try {
    const query = { deleted_at: null };
    const equipments = await Equipment.find(query).populate("EQPT_type");
    res.status(200).json(equipments);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la récupération des équipements" });
  }
};

const getEquipmentsByClientCode = async (req, res) => {
  try {
    const { clientCode } = req.params;
    const equipments = await Equipment.find({ EQPT_CLNT_code: clientCode, deleted_at: null })
      .populate("EQPT_type").exec();

    if (!equipments || equipments.length === 0) {
      return res.status(404).json({ message: "Aucun équipement actif trouvé pour ce client." });
    }
    res.status(200).json(equipments);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la récupération des équipements." });
  }
};


const getEquipmentsByTechnician = async (req, res) => {
  try {
    const { technicianId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(technicianId)) {
      return res.status(400).json({ message: "L'ID du technicien fourni est invalide." });
    }

    const equipments = await Ticket.aggregate([
    
      {
        $match: {
          TCKT_assignee_a: new mongoose.Types.ObjectId(technicianId),
          deleted_at: null 
        }
      },

      {
        $group: {
          _id: "$TCKT_equipment"
        }
      },
     
      {
        $lookup: {
          from: "equipment", 
          localField: "_id",
          foreignField: "EQPT_code",
          as: "equipmentDetails"
        }
      },
     
      {
        $unwind: "$equipmentDetails"
      },
   
      {
        $replaceRoot: { newRoot: "$equipmentDetails" }
      },
     
      {
        $match: {
          deleted_at: null
        }
      },
    
      {
        $lookup: {
          from: "clients",
          localField: "EQPT_CLNT_code",
          foreignField: "CLNT_code",
          as: "clientInfo"
        }
      },
    {
        $lookup: {
          from: "typeequipments",
          localField: "EQPT_type",
          foreignField: "_id",
          as: "typeInfo"
        }
      },
   
      {
        $addFields: {
          client: { $arrayElemAt: ["$clientInfo", 0] },
          EQPT_type: { $arrayElemAt: ["$typeInfo", 0] }
        }
      },
    
      {
        $project: {
          clientInfo: 0,
          typeInfo: 0
        }
      }
    ]);

    res.status(200).json(equipments);

  } catch (error) {
    console.error("❌ Erreur dans getEquipmentsByTechnician (agrégation) :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des équipements du technicien." });
  }
};


const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.findById(id).populate("EQPT_type");
    if (!equipment) {
      return res.status(404).json({ error: "Équipement non trouvé" });
    }
    res.status(200).json(equipment);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur lors de la récupération de l'équipement" });
  }
};

module.exports = {
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipments,
  getEquipmentById,
  getEquipmentsByClientCode,
  getEquipmentsByTechnician
};
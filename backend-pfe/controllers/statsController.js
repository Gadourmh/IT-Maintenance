const mongoose = require('mongoose');
const Client = require("../models/Client");
const Ticket = require("../models/Ticket");
const Technicien = require("../models/Technicien");
const Equipment = require("../models/Equipment");
const Intervention = require("../models/Intervention");
const Personnel = require("../models/Personnel");
const TypePanne = require("../models/TypePanne");
const TypeEquipment = require("../models/TypeEquipment");
const Notification = require("../models/Notification");
const Commentaire = require("../models/Commentaire");
const Facture = require("../models/Facture");




const getStats = async (req, res) => {
  try {
  
    const totalClients = await Client.countDocuments({ deleted_at: null });
    const totalTickets = await Ticket.countDocuments({ deleted_at: null });
    const totalTechniciens = await Technicien.countDocuments({ deleted_at: null });
    const totalEquipments = await Equipment.countDocuments({ deleted_at: null });
   
    const totalInterventions = await Intervention.countDocuments({ deleted_at: null });
    const totalPersonnels = await Personnel.countDocuments({ deleted_at: null });
  
    const totalPannes = await TypePanne.countDocuments({ deleted_at: null });
  
    const totalTypesEquipments = await TypeEquipment.countDocuments({ deleted_at: null });
  
    const totalNotifications = await Notification.countDocuments({ deleted_at: null });
   
    const totalCommentaires = await Commentaire.countDocuments({ deleted_at: null });


  
    const ticketsByStatus = await Ticket.aggregate([
      { $match: { deleted_at: null } }, 
      { $group: { _id: "$TCKT_statut", count: { $sum: 1 } } }
    ]);

  
    const resolvedTickets = await Ticket.countDocuments({ TCKT_statut: "résolu", deleted_at: null }); 

   
    const openTickets = await Ticket.countDocuments({
      TCKT_statut: "ouvert",
      deleted_at: null 
    });

   
    const ongoingTickets = await Ticket.countDocuments({
      TCKT_statut: "en cours",
      deleted_at: null 
    });

   
    const closedTickets = await Ticket.countDocuments({ TCKT_statut: "fermé", deleted_at: null }); 

    
    const equipmentsByType = await Equipment.aggregate([
      { $match: { deleted_at: null } }, 
      { $group: { _id: "$EQPT_type", count: { $sum: 1 } } }
    ]);

    
    const ticketsForAvgResolution = await Ticket.find({
        TCKT_DT_resolution_confirmee: { $ne: null }, 
        Date_creation: { $ne: null },            
        TCKT_statut: "résolu",
        deleted_at: null
   
    }).select("Date_creation TCKT_DT_resolution_confirmee");

    let totalResolutionTimeMs = 0;
    let countAvgResolution = 0;

    ticketsForAvgResolution.forEach(ticket => {
       
        const dateCreation = new Date(ticket.Date_creation);
        const dateConfirmee = new Date(ticket.TCKT_DT_resolution_confirmee);

    
        if (
            !isNaN(dateCreation.getTime()) && 
            !isNaN(dateConfirmee.getTime()) && 
            dateConfirmee.getTime() >= dateCreation.getTime() 
        ) {
            const resolutionTimeMs = dateConfirmee.getTime() - dateCreation.getTime(); 

          
            totalResolutionTimeMs += resolutionTimeMs;
            countAvgResolution++;
        } else {
       
            console.warn(`Ticket ${ticket._id}: Dates invalides ou désordre pour calcul du temps moyen de résolution (Création: ${ticket.Date_creation}, Résolution Confirmée: ${ticket.TCKT_DT_resolution_confirmee}).`);
        }
    });

    const averageResolutionTimeHours = countAvgResolution > 0 ? (totalResolutionTimeMs / countAvgResolution) / (1000 * 60 * 60) : 0;



    res.status(200).json({
      totalClients,
      totalTickets,
      totalTechniciens,
      totalEquipments,
      totalInterventions,
      totalPersonnels,
      totalPannes ,
      totalTypesEquipments,
      totalNotifications,
      totalCommentaires,
      resolvedTickets,
      openTickets,
      ongoingTickets,
      closedTickets,
      ticketsByStatus: ticketsByStatus.length > 0 ? ticketsByStatus : null, 
      equipmentsByType: equipmentsByType.length > 0 ? equipmentsByType : null, 
      averageResolutionTimeHours: Number(averageResolutionTimeHours.toFixed(2))
    });

  } catch (error) {
    console.error("Erreur dans getStats :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des statistiques globales", error });
  }
};



const getTechnicianProgress = async (req, res) => {
  try {
    const { technicienId } = req.params;

    
    if (!mongoose.Types.ObjectId.isValid(technicienId)) {
        return res.status(400).json({ message: "ID du technicien invalide." });
    }

 
    const tickets = await Ticket.find({
      TCKT_assignee_a: technicianId, 
      deleted_at: null 
    })
      .populate("TCKT_client", "CLNT_raison_sociale deleted_at") 
      .select("TCKT_statut TCKT_description TCKT_client TCKT_code"); 

    if (!tickets || tickets.length === 0) {
   
      return res.status(200).json({ technicienId, tickets: [], message: "Aucun ticket actif trouvé pour ce technicien." });
    }

    res.status(200).json({ technicienId, tickets });
  } catch (error) {
    console.error("❌ Erreur dans getTechnicianProgress :", error); 
    res.status(500).json({ message: "Erreur serveur lors de la récupération des tickets par technicien", error: error.message }); 
  }
};



const getTechnicianPerformance = async (req, res) => {
  try {
    const { technicienId } = req.params;

   
    if (!mongoose.Types.ObjectId.isValid(technicienId)) {
        return res.status(400).json({ message: "ID du technicien invalide." });
    }

  
    const interventions = await Intervention.find({
       INTR_techniciens: technicienId, 
       deleted_at: null 
    });


   
    if (!interventions || interventions.length === 0) {
      return res.status(200).json({ technicienId, totalTime: 0, message: "Aucune intervention active trouvée pour ce technicien." });
    }

    let totalTime = 0; 
    interventions.forEach(inter => {
    
      const startDate = new Date(inter.INTR_dt_debut);
      const endDate = new Date(inter.INTR_dt_fin);  

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && startDate.getTime() < endDate.getTime()) {
         totalTime += (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60); 
      }
    });

    res.status(200).json({ technicienId, totalTime: Number(totalTime.toFixed(2)) }); 
  } catch (error) {
    console.error("❌ Erreur dans getTechnicianPerformance :", error); 
    res.status(500).json({ message: "Erreur serveur lors de la récupération de la performance du technicien", error: error.message }); 
  }
};


const getTicketStatsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Veuillez fournir une plage de dates valide (startDate et endDate)." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) { 
       return res.status(400).json({ message: "Format de date invalide." });
    }
   
    end.setHours(23, 59, 59, 999);

   
    const ticketsInRange = await Ticket.countDocuments({
      Date_creation: { $gte: start, $lte: end }, 
      deleted_at: null 
    });

    res.status(200).json({ startDate, endDate, totalTicketsInRange: ticketsInRange, message: `Nombre de tickets actifs créés entre ${start.toLocaleDateString()} et ${end.toLocaleDateString()}.` }); 

  } catch (error) {
      console.error("❌ Erreur dans getTicketStatsByDate :", error); 
      res.status(500).json({ message: "Erreur serveur lors de la récupération des stats tickets par date", error: error.message });
  }
};


const getClientTicketStats = async (req, res) => {
  try {
    const clientStats = await Ticket.aggregate([
     
      {
          $match: {
              deleted_at: null
          }
      },
      
      { $group: { _id: "$TCKT_cree_par", count: { $sum: 1 } } }, 

    
      {
        $lookup: {
          from: "clients", 
          localField: "_id", 
          foreignField: "_id", 
          as: "clientInfo" 
        }
      },
     
      { $unwind: "$clientInfo" },

     
      {
        $project: {
          _id: 0, 
          clientId: "$_id", 
          clientCode: "$clientInfo.CLNT_code", 
          clientName: "$clientInfo.CLNT_raison_sociale", 
          totalTickets: "$count", 
         
         
        }
      },
   
      { $sort: { totalTickets: -1 } }
    ]);

    if (!clientStats || clientStats.length === 0) {
      
       return res.status(200).json([]);
    }

    res.status(200).json(clientStats); 
  } catch (error) {
    console.error("❌ Erreur dans getClientTicketStats :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des statistiques des tickets par client", error: error.message }); 
  }
};



const getEfficiencyIndicators = async (req, res) => {
  try {
    
    const totalTickets = await Ticket.countDocuments({ deleted_at: null });

 
    const totalInterventions = await Intervention.countDocuments({ deleted_at: null });

  
    const resolvedTickets = await Ticket.find({
      TCKT_statut: "résolu", 
      Date_creation: { $ne: null },
      TCKT_DT_resolution_confirmee: { $ne: null },
      deleted_at: null 
    }).select("Date_creation TCKT_DT_resolution_confirmee"); 

    let totalResolutionTimeMs = 0;
    let quickResolutions = 0; 
    let count = 0; 


    resolvedTickets.forEach(ticket => {
      const start = new Date(ticket.Date_creation);
      const end = new Date(ticket.TCKT_DT_resolution_confirmee);


      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start.getTime() < end.getTime()) {
        const resolutionTimeMs = end.getTime() - start.getTime();
        totalResolutionTimeMs += resolutionTimeMs;
        count++; 

        const resolutionTimeHours = resolutionTimeMs / (1000 * 60 * 60); 

        if (resolutionTimeHours <= 24) {
          quickResolutions++;
        }
      } else {

         console.warn(`Ticket résolu actif ${ticket._id} exclu du calcul d'efficacité : dates invalides ou création >= résolution.`);
      }
    });


    const avgResolutionTime = count > 0 ? (totalResolutionTimeMs / count) / (1000 * 60 * 60) : 0;

    const quickResolutionRate = count > 0 ? (quickResolutions / count) * 100 : 0;



    const totalTechniciens = await Technicien.countDocuments({ deleted_at: null });


    const assignedTicketsCount = await Ticket.countDocuments({
        TCKT_assignee_a: { $exists: true, $ne: [] }, 
        deleted_at: null 
    });


    const avgTicketsPerTechnician = totalTechniciens > 0 ? (assignedTicketsCount / totalTechniciens) : 0;



    const unresolvedTickets = await Ticket.countDocuments({
      TCKT_statut: { $ne: "résolu" },
      deleted_at: null 
    });


    res.status(200).json({
      avgResolutionTime: Number(avgResolutionTime.toFixed(2)), 
      quickResolutionRate: Number(quickResolutionRate.toFixed(2)), 
      avgTicketsPerTechnician: Number(avgTicketsPerTechnician.toFixed(2)),
      totalTickets,
      assignedTicketsCount, 
      totalInterventions, 
      unresolvedTickets 
    });

  } catch (error) {
    console.error("❌ Erreur dans getEfficiencyIndicators :", error); 
    res.status(500).json({ message: "Erreur serveur lors de la récupération des indicateurs de performance", error: error.message }); 
  }
};


const getTotalTimePerTechnician = async (req, res) => {
    try {
        const timePerTechnician = await Intervention.aggregate([

            {
                $match: {
                    deleted_at: null, 
                    INTR_techniciens: { $exists: true, $ne: null, $not: { $size: 0 } }, 
                    INTR_dt_debut: { $exists: true, $ne: null }, 
                    INTR_dt_fin: { $exists: true, $ne: null }, 

                     $expr: { $lt: ["$INTR_dt_debut", "$INTR_dt_fin"] } 
                }
            },

             { $unwind: "$INTR_techniciens" },

            {
                $addFields: {
                    durationMs: { $subtract: ["$INTR_dt_fin", "$INTR_dt_debut"] } 
                }
            },

            {
                 $match: { durationMs: { $gt: 0 } }
            },

            {
                $group: {
                    _id: "$INTR_techniciens",
                    totalDurationMs: { $sum: "$durationMs" }
                }
            },

            {
                $lookup: {
                    from: "techniciens", 
                    localField: "_id", 
                    foreignField: "_id", 
                    as: "technicienInfo"
                }
            },


             {
                 $match: {
                     "technicienInfo.deleted_at": null
                 }
             },


            { $unwind: "$technicienInfo" },

            {
                $project: {
                    _id: 0, 
                    technicienId: "$_id", 
                    technicienCode: "$technicienInfo.TECH_code",
                    technicienName: "$technicienInfo.TECH_nom_prenom", 
                    totalTimeHours: { $divide: ["$totalDurationMs", 1000 * 60 * 60] } 
                }
            },

             { $sort: { totalTimeHours: -1 } }
        ]);


        if (!timePerTechnician || timePerTechnician.length === 0) {
            return res.status(200).json([]);
        }


        const formattedTimePerTechnician = timePerTechnician.map(item => ({
            ...item,
            totalTimeHours: Number(item.totalTimeHours.toFixed(2))
        }));

        res.status(200).json(formattedTimePerTechnician);

    } catch (error) {
        console.error("❌ Erreur dans getTotalTimePerTechnician :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du temps total par technicien", error: error.message });
    }
};


const getAverageTicketDurationPerClient = async (req, res) => {
    try {
        const avgDurationPerClient = await Ticket.aggregate([

            {
                $match: {
                    deleted_at: null,
                    TCKT_cree_par: { $exists: true, $ne: null }, 
                    Date_creation: { $exists: true, $ne: null }, 

                    TCKT_statut: { $in: ["résolu", "fermé"] },
                    TCKT_DT_resolution_confirmee: { $exists: true, $ne: null } 
                }
            },

            {
                 $match: { $expr: { $lt: ["$Date_creation", "$TCKT_DT_resolution_confirmee"] } }
            },

            {
                $addFields: {
                    durationMs: { $subtract: ["$TCKT_DT_resolution_confirmee", "$Date_creation"] }
                }
            },

            {
                 $match: { durationMs: { $gt: 0 } }
            },

            {
                $group: {
                    _id: "$TCKT_cree_par", 
                    averageDurationMs: { $avg: "$durationMs" },
                    totalTicketsResolved: { $sum: 1 } 
                }
            },

            {
                $lookup: {
                    from: "clients", 
                    localField: "_id", 
                    foreignField: "_id", 
                    as: "clientInfo"
                }
            },

             {
                 $match: {
                     "clientInfo.deleted_at": null 
                 }
             },

            { $unwind: "$clientInfo" },

            {
                $project: {
                    _id: 0, 
                    clientId: "$_id",
                    clientCode: "$clientInfo.CLNT_code", 
                    clientName: "$clientInfo.CLNT_raison_sociale", 
                    averageTicketDurationHours: { $divide: ["$averageDurationMs", 1000 * 60 * 60] }, 
                    ticketsCount: "$totalTicketsResolved" 
                }
            },

             { $sort: { averageTicketDurationHours: -1 } }
        ]);


        if (!avgDurationPerClient || avgDurationPerClient.length === 0) {
             return res.status(200).json([]);
        }


        const formattedAvgDuration = avgDurationPerClient.map(item => ({
            ...item,
            averageTicketDurationHours: Number(item.averageTicketDurationHours.toFixed(2))
        }));


        res.status(200).json(formattedAvgDuration);

    } catch (error) {
        console.error("❌ Erreur dans getAverageTicketDurationPerClient :", error);
         res.status(500).json({ message: "Erreur serveur lors de la récupération de la durée moyenne des tickets par client", error: error.message });
    }
};



const getClientStats = async (req, res) => {
  try {
    let id;




    if (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN") {
        id = req.params.clientId; 
         if (!id || !mongoose.Types.ObjectId.isValid(id)) { 
             return res.status(400).json({ message: "L'ID du client est requis et doit être valide dans les paramètres de l'URL." });
         }
    } else if (req.user.role === "CLIENT") {

        id = req.user.id; 

    } else {

         return res.status(403).json({ message: "Accès non autorisé pour voir les statistiques client." });
    }


    const baseQuery = { TCKT_cree_par: id, deleted_at: null }; 

    const totalTickets = await Ticket.countDocuments(baseQuery);
    const resolvedTickets = await Ticket.countDocuments({ ...baseQuery, TCKT_statut: "résolu" }); 
    const openTickets = await Ticket.countDocuments({ ...baseQuery, TCKT_statut: "ouvert" });
    const ongoingTickets = await Ticket.countDocuments({ ...baseQuery, TCKT_statut: "en cours" });
    const closedTickets = await Ticket.countDocuments({ ...baseQuery, TCKT_statut: "fermé" });








    res.status(200).json({
      clientId: id, 
      totalTickets, 
      resolvedTickets, 
      openTickets, 
      ongoingTickets, 
      closedTickets 
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des statistiques client spécifiques:", error); 
    res.status(500).json({ message: "Erreur serveur lors de la récupération des statistiques client spécifiques", error: error.message }); 
  }
};


const getTechnicienStats = async (req, res) => {
  try {
    let id;


    if (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN") {
        id = req.params.technicienId;
         if (!id || !mongoose.Types.ObjectId.isValid(id)) {
             return res.status(400).json({ message: "L'ID du technicien est requis et doit être valide dans les paramètres de l'URL." });
         }
    } else if (req.user.role === "TECHNICIEN") {

        id = req.user.id; 

    } else {

         return res.status(403).json({ message: "Accès non autorisé pour voir les statistiques technicien." });
    }








    const baseTicketQuery = { TCKT_assignee_a: id, deleted_at: null }; 

    const totalAssignedTickets = await Ticket.countDocuments(baseTicketQuery);



    const totalInterventions = await Intervention.countDocuments({
        INTR_techniciens: id, 
        deleted_at: null 
    });


    const resolvedTickets = await Ticket.countDocuments({ ...baseTicketQuery, TCKT_statut: "résolu" });

    const openTickets = await Ticket.countDocuments({ ...baseTicketQuery, TCKT_statut: "ouvert" });

    const ongoingTickets = await Ticket.countDocuments({ ...baseTicketQuery, TCKT_statut: "en cours" });

    const closedTickets = await Ticket.countDocuments({ ...baseTicketQuery, TCKT_statut: "fermé" });


    res.status(200).json({
      technicienId: id,
      totalAssignedTickets, 
      totalInterventions, 
      resolvedTickets, 
      openTickets,
      ongoingTickets, 
      closedTickets, 
    });
  } catch (error) {
    console.error("❌ Erreur dans getTechnicienStats spécifiques :", error); 
    res.status(500).json({ message: "Erreur serveur lors de la récupération des statistiques technicien spécifiques", error: error.message }); 
  }
};




const getInvoiceOverview = async (req, res) => {
  try {
    const totalAmounts = await Facture.aggregate([

      {
         $match: {
             deleted_at: null 
         }
      },
      { $group: { _id: null, totalIssuedAmount: { $sum: "$FACT_montantTotal" }, totalPaidAmount: { $sum: "$FACT_montantPaye" }, totalCount: { $sum: 1 } } },
      { $project: { _id: 0, totalIssuedAmount: { $ifNull: ["$totalIssuedAmount", 0] }, totalPaidAmount: { $ifNull: ["$totalPaidAmount", 0] }, totalCount: "$totalCount", totalDueAmount: { $subtract: [ { $ifNull: ["$totalIssuedAmount", 0] }, { $ifNull: ["$totalPaidAmount", 0] } ] } } }
    ]);

    const invoiceAmounts = totalAmounts.length > 0 ? totalAmounts[0] : { totalIssuedAmount: 0, totalPaidAmount: 0, totalDueAmount: 0, totalCount: 0 };

    const invoicesByStatus = await Facture.aggregate([

      {
         $match: {
             deleted_at: null 
         }
      },
      { $group: { _id: "$FACT_statut", count: { $sum: 1 } } }
    ]);

    const statusCounts = {};
    invoicesByStatus.forEach(status => { statusCounts[status._id] = status.count; });

    res.status(200).json({
      totalIssuedAmount: Number(invoiceAmounts.totalIssuedAmount.toFixed(2)),
      totalPaidAmount: Number(invoiceAmounts.totalPaidAmount.toFixed(2)),
      totalDueAmount: Number(invoiceAmounts.totalDueAmount.toFixed(2)),
      totalInvoices: invoiceAmounts.totalCount, 
      invoicesByStatus: statusCounts 
    });

  } catch (error) {
    console.error("❌ Erreur dans getInvoiceOverview :", error); 
    res.status(500).json({ message: "Erreur serveur lors de la récupération des statistiques de factures", error: error.message }); 
  }
};



const getInvoicesOverviewByClient = async (req, res) => {
    try {
        const clientOverview = await Facture.aggregate([

            {
                $match: {
                    deleted_at: null 
                }
            },
            {
                $group: {
                    _id: "$FACT_clientId", 
                    totalBilled: { $sum: "$FACT_montantTotal" },
                    totalPaid: { $sum: "$FACT_montantPaye" },
                    invoiceCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "clients", 
                    localField: "_id", 
                    foreignField: "_id", 
                    as: "clientDetails"
                }
            },


             {
                 $match: {
                     "clientDetails.deleted_at": null 
                 }
             },
            { $unwind: "$clientDetails" },
            {
                $project: {
                    _id: 0,
                    clientId: "$_id", 
                    clientName: "$clientDetails.CLNT_raison_sociale",
                    clientCode: "$clientDetails.CLNT_code",
                    totalBilled: { $ifNull: ["$totalBilled", 0] },
                    totalPaid: { $ifNull: ["$totalPaid", 0] },
                    invoiceCount: "$invoiceCount",
                    totalDue: { $subtract: [ { $ifNull: ["$totalBilled", 0] }, { $ifNull: ["$totalPaid", 0] } ] }
                }
            }
        ]);


        if (!clientOverview || clientOverview.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(clientOverview);
    } catch (error) {
        console.error("❌ Erreur dans getInvoicesOverviewByClient :", error); 
        res.status(500).json({ message: "Erreur serveur lors de la récupération du résumé de facturation par client", error: error.message }); 
    }
};




module.exports = {
  getStats,
  getTechnicianProgress, 
  getTechnicianPerformance, 
  getTicketStatsByDate,
  getClientTicketStats, 
  getEfficiencyIndicators, 
  getClientStats, 
  getTechnicienStats, 
  getTotalTimePerTechnician, 
  getAverageTicketDurationPerClient,
  getInvoiceOverview,
  getInvoicesOverviewByClient

};
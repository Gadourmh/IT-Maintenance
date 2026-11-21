const Notification = require('../models/Notification');
const mongoose = require('mongoose');


const userTypeToModelMap = {
  ADMIN: 'Personnel',
  SUPER_ADMIN: 'Personnel',
  NORMAL: 'Personnel',
  CLIENT: 'Client',
  TECHNICIEN: 'Technicien',
};


const createNotification = async (req, res) => {
  try {
  
    const { userId, userType, notificationType, message } = req.body;

    
    const userModelName = userTypeToModelMap[userType]; 
    if (!userModelName) {
      return res.status(400).json({ message: `Type d'utilisateur non reconnu pour le modèle: ${userType}` });
    }
  
     const UserModel = mongoose.model(userModelName);


     const recipientUser = await UserModel.findById(userId);
     if (!recipientUser) {
          return res.status(404).json({ message: `${userModelName} destinataire non trouvé.` });
     }
     if (recipientUser.deleted_at) {
          
          console.warn(`Tentative de créer une notification pour un utilisateur inactif (${userModelName} ID: ${userId}). Notification non créée.`);
           return res.status(200).json({ message: "Notification non créée : l'utilisateur destinataire est inactif." });
     }


   
    const newNotification = new Notification({
      NOTF_user: userId,  
      NOTF_userModel: userModelName,
      NOTF_userType: userType,  
      NOTF_type: notificationType,  
      NOTF_message: message,  
    });

   
    await newNotification.save();

  
    console.log('Notification enregistrée avec succès !');
    return res.status(201).json(newNotification);
  } catch (error) {
    console.error('❌ Erreur lors de la création de la notification:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de la notification', error: error.message });
  }
};



const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, userType, message, dateStart, dateEnd } = req.query;

   
    const filter = {
      deleted_at: null 
    };

  
    if (type) filter.NOTF_type = new RegExp(type, "i");
    if (userType) filter.NOTF_userType = new RegExp(userType, "i");
    if (message) filter.NOTF_message = new RegExp(message, "i");
    if (dateStart && dateEnd) {
      filter.createdAt = { $gte: new Date(dateStart), $lte: new Date(dateEnd) };
    }



    const notifications = await Notification.find(filter) 
      .populate({
        path: "NOTF_user",
      
        select: "PERS_nom_prenom CLNT_raison_sociale TECH_nom_prenom deleted_at", 
        strictPopulate: false 
      })
      .sort({ createdAt: -1 }) 
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();


   
    notifications.forEach((notif) => {
      if (notif.NOTF_user) {
       
         const isUserDeleted = !!notif.NOTF_user.deleted_at;

        
         if (isUserDeleted) {
           notif.NOTF_user.nom_affichee = "Utilisateur Supprimé"; 
         
         } else {
         
           notif.NOTF_user.nom_affichee = notif.NOTF_user.PERS_nom_prenom || notif.NOTF_user.CLNT_raison_sociale || notif.NOTF_user.TECH_nom_prenom || "Utilisateur Inconnu"; // S'assurer d'avoir un nom

         }
      
          notif.NOTF_user.is_deleted = isUserDeleted;

      } else {
         
          notif.NOTF_user = { 
               nom_affichee: "Utilisateur Introuvable/Supprimé",
               is_deleted: true 
          };
      }
      
    });

   
    const totalNotifications = await Notification.countDocuments(filter); 
    const totalPages = Math.ceil(totalNotifications / limit);

    return res.status(200).json({ notifications, totalPages });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des notifications:", error);
    return res.status(500).json({ message: "Erreur lors de la récupération des notifications", error: error.message });
  }
};




const getUserNotifications = async (req, res) => {
    try {
        const requestedId = req.params.id; 
        const requesterUser = req.user;    

        let userIdToFetch = requestedId;
        let userModelToFetch;
        let userTypeToFetch;

    
        if (requesterUser.role === 'TECHNICIEN') {
           
            if (requestedId !== requesterUser.id.toString()) {
            
                return res.status(403).json({ success: false, message: "Accès refusé. Un technicien ne peut consulter que ses propres notifications." });
            }
        
            userIdToFetch = requesterUser.id;
            userModelToFetch = 'Technicien'; 
            userTypeToFetch = 'TECHNICIEN';  
        } else if (requesterUser.role === 'ADMIN' || requesterUser.role === 'SUPER_ADMIN') {
           
            let foundUser = null;
            let targetUserModel = null;
            let targetUserType = null;

          
            const Personnel = mongoose.model('Personnel');
            foundUser = await Personnel.findById(requestedId);
            if (foundUser) {
                targetUserModel = 'Personnel';
                targetUserType = foundUser.PERS_role_acces;
            } else {
              
                const Technicien = mongoose.model('Technicien');
                foundUser = await Technicien.findById(requestedId);
                if (foundUser) {
                    targetUserModel = 'Technicien';
                    targetUserType = 'TECHNICIEN';
                }
            }

            if (!foundUser) {
                return res.status(404).json({ success: false, message: `Utilisateur avec l'ID ${requestedId} non trouvé pour les notifications.` });
            }

            userIdToFetch = foundUser._id;
            userModelToFetch = targetUserModel;
            userTypeToFetch = targetUserType;

        } else {
          
            return res.status(403).json({ success: false, message: "Accès refusé. Vous n'êtes pas autorisé à consulter ces notifications." });
        }

      
        if (!userIdToFetch || !userModelToFetch || !userTypeToFetch) {
            return res.status(500).json({ success: false, message: "Erreur interne: Impossible de déterminer les informations utilisateur pour la récupération des notifications." });
        }

        const notifications = await Notification.find({
            NOTF_user: userIdToFetch,
            NOTF_userModel: userModelToFetch,
            NOTF_userType: userTypeToFetch,
            deleted_at: null 
        }).sort({ createdAt: -1 }); 

        res.status(200).json({ success: true, notifications });

    } catch (error) {
        console.error("❌ Erreur lors de la récupération des notifications de l'utilisateur:", error);
        res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la récupération des notifications.",
            error: error.message
        });
    }
};



const updateNotification = async (req, res) => {
  try {
    const notificationId = req.params.id; 
    const { userId, userType, notificationType, message } = req.body; 

 
    if (!userId || !userType || !notificationType || !message) {
      return res.status(400).json({ message: 'Les champs userId, userType, notificationType et message sont obligatoires' });
    }

   
    const userModelName = userTypeToModelMap[userType];
     if (!userModelName) {
       return res.status(400).json({ message: `Type d'utilisateur non reconnu pour le modèle: ${userType}` });
     }
     const UserModel = mongoose.model(userModelName);


  
     if (userId) {
          const recipientUser = await UserModel.findById(userId);
          if (!recipientUser) {
               return res.status(404).json({ message: `Nouvel utilisateur destinataire non trouvé (${userModelName}).` });
          }
          if (recipientUser.deleted_at) {
               return res.status(400).json({ message: `Impossible de lier la notification à un utilisateur inactif (${userModelName}).` });
          }
     }


  
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

   
    notification.NOTF_user = userId;
    notification.NOTF_userModel = userModelName; 
    notification.NOTF_userType = userType;
    notification.NOTF_message = message;

   
    await notification.save();

  
    console.log('Notification enregistrée avec succès !');
    return res.status(200).json({
      message: 'Notification mise à jour avec succès',
      notification
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la notification', error);
    return res.status(500).json({ message: `Erreur lors de la mise à jour de la notification: ${error.message}` });
  }
};





const deleteNotification = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID invalide' });
  }

  try {
  
    const updatedNotification = await Notification.findByIdAndUpdate(
      id, 
      { $set: { deleted_at: new Date() } }, 
      { new: true } 
    );

    if (!updatedNotification) {
    
      return res.status(404).json({ message: 'Notification non trouvée.' });
    }

    console.log(`✅ Notification marquée comme supprimée logiquement : ${updatedNotification._id}`);

  
    res.status(200).json({ message: 'Notification marquée comme inactive avec succès (suppression logique).', notification: updatedNotification });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression logique de la notification :', error);
    res.status(500).json({
        message: 'Erreur serveur lors de la suppression logique de la notification.',
        error: error.message 
    });
  }
};




const getNotificationStats = async (req, res) => {
  try {
  
    const jours = parseInt(req.query.days) || 30;

    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() - jours);

    const matchStage = { createdAt: { $gte: dateLimite } };

    const userTypeStats = await Notification.aggregate([
      { $match: matchStage },
      { $group: { _id: "$NOTF_userType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const typeStats = await Notification.aggregate([
      { $match: matchStage },
      { $group: { _id: "$NOTF_type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      daysRange: jours,
      notificationsByUserType: userTypeStats.map(item => ({
        userType: item._id,
        count: item.count
      })),
      notificationsByType: typeStats.map(item => ({
        type: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    console.error("Erreur dans getNotificationStats:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques."
    });
  }
};




module.exports = {
  createNotification,
  getAllNotifications,
  getUserNotifications,
  updateNotification,
  deleteNotification,
  getNotificationStats
};

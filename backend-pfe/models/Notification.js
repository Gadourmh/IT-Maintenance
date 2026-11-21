const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  NOTF_user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'NOTF_userModel' // dynamique selon le type de modèle
  },
  NOTF_userModel: {
    type: String,
    required: true,
    enum: ['Personnel', 'Client', 'Technicien'] // liste les modèles que tu as dans ton projet
  },
  NOTF_userType: {
    type: String,
    enum: ['ADMIN', 'SUPER_ADMIN', 'NORMAL', 'TECHNICIEN', 'CLIENT'], 
    required: true
  },
  NOTF_type: {
    type: String,
    enum: 'email', 
    required: true
  },
  NOTF_message: {
    type: String,
    required: true
  },


  createdAt: {
    type: Date,
    default: Date.now
  },
    deleted_at: {
    type: Date,
    default: null, // Par défaut, un client n'est pas supprimé logiquement
  },
  
});

notificationSchema.index({ createdAt: 1 });
notificationSchema.index({ NOTF_userType: 1 });
notificationSchema.index({ NOTF_type: 1 });



module.exports = mongoose.model("Notification", notificationSchema);

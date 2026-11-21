// Fichier : HistoriqueChat.js

const mongoose = require('mongoose');

const historiqueChatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'onModel'
    },
    onModel: {
        type: String,
        required: true,
        enum: ['CLIENT', 'TECHNICIEN', 'ADMIN', 'SUPER_ADMIN', 'NORMAL']
    },
    userMessage: {
        type: String,
        required: true
    },
    botResponse: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    conversationState: {
        type: Object,
        default: {} // Peut stocker temporairement la nouvelle valeur, l'ID du ticket, etc.
    },
    ticketCreationStep: {
        type: String,
        enum: [
            'idle',
            'awaiting_equipment_code',
            'awaiting_description',
            'awaiting_panne_type',
            'awaiting_urgence',
            'awaiting_resolution_date',
            'confirming_ticket'
        ],
        default: 'idle'
    },

    // Champs pour la modification de ticket (existants et un ajout)
    ticketModificationStep: {
        type: String,
        enum: [
            'idle',
            'awaiting_ticket_selection_for_modification', // ✨ CORRECTION ICI
            'awaiting_field_to_modify',
            'awaiting_new_value',
            'confirming_modification'
        ],
        default: 'idle'
    },
    modifyingTicketCode: { // Code TCKT-XXXX
        type: String,
        default: null
    },
    modifyingTicketId: { // ✨ NOUVEAU AJOUTÉ : ID MongoDB du ticket
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    modifyingField: { // Nom du champ TCKT_...
        type: String,
        default: null
    },

    // ✨ NOUVEAUX CHAMPS POUR LA SUPPRESSION DE TICKET ✨
    ticketDeletionStep: {
        type: String,
        enum: [
            'idle',
            'awaiting_ticket_code_for_deletion',
            'confirming_deletion'
        ],
        default: 'idle'
    },
    deletingTicketCode: { // Code TCKT-XXXX du ticket à supprimer
        type: String,
        default: null
    },
    deletingTicketId: { // ID MongoDB du ticket à supprimer
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },

    botLink: {
        type: {
            text: { type: String },
            url: { type: String }
        },
        default: null
    }
});

module.exports = mongoose.model('HistoriqueChat', historiqueChatSchema);
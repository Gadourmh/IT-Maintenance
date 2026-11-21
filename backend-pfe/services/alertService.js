// services/alertService.js
const cron = require('node-cron');
const mongoose = require('mongoose'); // 👈 Added mongoose
const Ticket = require('../models/Ticket');
const Technicien = require('../models/Technicien');
const Personnel = require('../models/Personnel');
const Client = require('../models/Client'); // Keep if used, though not directly in alert logic below
const Notification = require('../models/Notification'); // 👈 Added Notification model
const { sendEmail } = require('./emailService');
const moment = require('moment');

// --- Configuration des seuils d'alerte ---
const TECHNICIAN_ALERT_DAYS_BEFORE = 3; // Alerte X jours avant, le jour J, ou si dépassé
const ADMIN_ALERT_DAYS_BEFORE = 3;      // Alerte X jours avant pour les admins
// ADMIN_SUPERADMIN_ALERT_DAYS_OVERDUE: Logic for overdue will be handled by checking if date is in the past.

// --- Fonction pour créer une notification in-app directement ---
const createNotificationInAppDirect = async (userId, userModel, userType, message) => {
    try {
        if (!userId || !userModel || !userType || !message) {
            console.error("❌ Missing parameters for createNotificationInAppDirect. Notification not created.");
            return;
        }

        const MongooseModel = mongoose.model(userModel);
        const recipientUser = await MongooseModel.findById(userId).select('deleted_at');

        if (!recipientUser) {
            console.warn(`⚠️ Recipient user ${userModel} ID: ${userId} not found. Notification not created.`);
            return;
        }
        if (recipientUser.deleted_at) {
            console.warn(`⚠️ Recipient user ${userModel} ID: ${userId} is logically deleted. Notification not created.`);
            return;
        }

        await Notification.create({
            NOTF_user: userId,
            NOTF_userModel: userModel, // e.g., 'Technicien', 'Personnel'
            NOTF_userType: userType,   // e.g., 'TECHNICIEN', 'ADMIN'
            NOTF_type: 'in-app', // Specific type for these alerts
            NOTF_message: message,
        });
        console.log(`✅ In-app notification created directly for ${userType} ${userId}.`);
    } catch (error) {
        console.error("❌ Error during direct in-app notification creation:", error.message);
    }
};

const setupAlerts = () => {
    // Tâche cron pour les rappels aux techniciens
    cron.schedule('0 9 * * *', async () => {
        console.log('--- ⏰ Checking for technician ticket reminders ---');
        try {
            const today = moment().startOf('day');

            const ticketsToRemind = await Ticket.find({
                TCKT_statut: { $in: ['ouvert', 'en cours'] },
                deleted_at: null, // Ignorer les tickets supprimés logiquement
                TCKT_assignee_a: { $exists: true, $ne: [] }
            }).populate('TCKT_assignee_a', 'TECH_email TECH_nom_prenom _id deleted_at'); // Inclure deleted_at pour vérification

            for (const ticket of ticketsToRemind) {
                let alertMessagesTech = [];
                const ticketShortDesc = ticket.TCKT_description.substring(0, 50);

                // 1. Vérifier la date de résolution demandée par le client
                if (ticket.TCKT_DT_resolution_demandee) {
                    const clientDueDate = moment(ticket.TCKT_DT_resolution_demandee).startOf('day');
                    const diffDaysClient = clientDueDate.diff(today, 'days');

                    if (diffDaysClient < 0) {
                        alertMessagesTech.push(`La date demandée par le client (${clientDueDate.format('DD/MM/YYYY')}) est DÉPASSÉE de ${Math.abs(diffDaysClient)} jour(s).`);
                    } else if (diffDaysClient <= TECHNICIAN_ALERT_DAYS_BEFORE) {
                        alertMessagesTech.push(`La date demandée par le client (${clientDueDate.format('DD/MM/YYYY')}) est dans ${diffDaysClient} jour(s).`);
                    }
                }

                // 2. Vérifier la date prévue de résolution
                if (ticket.TCKT_date_prevue_resolution) {
                    const plannedDueDate = moment(ticket.TCKT_date_prevue_resolution).startOf('day');
                    const diffDaysPlanned = plannedDueDate.diff(today, 'days');

                    if (diffDaysPlanned < 0) {
                        alertMessagesTech.push(`La date de résolution prévue (${plannedDueDate.format('DD/MM/YYYY')}) est DÉPASSÉE de ${Math.abs(diffDaysPlanned)} jour(s).`);
                    } else if (diffDaysPlanned <= TECHNICIAN_ALERT_DAYS_BEFORE) {
                         alertMessagesTech.push(`La date de résolution prévue (${plannedDueDate.format('DD/MM/YYYY')}) est dans ${diffDaysPlanned} jour(s).`);
                    }
                }

                if (alertMessagesTech.length > 0 && ticket.TCKT_assignee_a && ticket.TCKT_assignee_a.length > 0) {
                    const fullAlertMessage = `Ticket #${ticket.TCKT_code} ("${ticketShortDesc}..."): ${alertMessagesTech.join('; ')}`;

                    for (const technician of ticket.TCKT_assignee_a) {
                        if (technician.deleted_at) {
                            console.warn(`Skipping notification for logically deleted technician ${technician._id}`);
                            continue;
                        }
                        if (technician.TECH_email) {
                            const emailSubject = `🔔 Rappel: Ticket #${ticket.TCKT_code} - Action Requise`;
                            const emailText = `Cher ${technician.TECH_nom_prenom},\n\n` +
                                              `Ceci est un rappel concernant le ticket #${ticket.TCKT_code} (Description: ${ticketShortDesc}...).\n` +
                                              `Détails de l'alerte: ${alertMessagesTech.join('; ')}\n\n` +
                                              `Veuillez consulter le tableau de bord pour plus de détails et prendre les mesures nécessaires.\n\n` +
                                              `Cordialement,\nVotre système de gestion de tickets.`;
                            await sendEmail(technician.TECH_email, emailSubject, emailText);
                            console.log(`📧 Email de rappel envoyé à ${technician.TECH_email} pour le ticket ${ticket.TCKT_code}.`);
                        } else {
                            console.warn(`⚠️ Le technicien ${technician.TECH_nom_prenom} (ID: ${technician._id}) n'a pas d'email.`);
                        }
                        // Créer une notification in-app pour le technicien
                        await createNotificationInAppDirect(
                            technician._id,
                            'Technicien', // Mongoose model name
                            'TECHNICIEN', // User type
                            fullAlertMessage
                        );
                    }
                }
            }
            console.log('--- ✅ Technician ticket reminders job finished ---');
        } catch (error) {
            console.error("❌ Erreur lors de la vérification des rappels de tickets pour les techniciens:", error);
        }
    });

    // Tâche cron pour les alertes aux admins/super_admins
    cron.schedule('30 9 * * *', async () => {
        console.log('--- ⏰ Checking for admin/super_admin ticket alerts ---');
        try {
            const today = moment().startOf('day');

            const adminPersonnel = await Personnel.find({
                PERS_role_acces: { $in: ['ADMIN', 'SUPER_ADMIN'] },
                deleted_at: null // Seulement les admins actifs
            }).select('PERS_email PERS_nom_prenom _id PERS_role_acces');

            if (adminPersonnel.length === 0) {
                console.warn("⚠️ Aucun administrateur ou super-administrateur actif trouvé pour recevoir les alertes.");
                return;
            }

            const ticketsForAdmins = await Ticket.find({
                TCKT_statut: { $in: ['ouvert', 'en cours'] },
                deleted_at: null
            }).populate('TCKT_assignee_a', 'TECH_nom_prenom')
              .populate('TCKT_client', 'CLNT_raison_sociale'); // TCKT_client is a code, so populate TCKT_cree_par for client object if needed

            for (const ticket of ticketsForAdmins) {
                let alertMessagesAdmin = [];
                const ticketShortDesc = ticket.TCKT_description.substring(0, 50);
                const clientName = (await Client.findOne({ CLNT_code: ticket.TCKT_client }).select('CLNT_raison_sociale'))?.CLNT_raison_sociale || ticket.TCKT_client || "N/A";
                const assignedTechnicians = ticket.TCKT_assignee_a.map(t => t.TECH_nom_prenom).join(', ') || 'Non assigné';


                // 1. Vérifier la date de résolution demandée par le client
                if (ticket.TCKT_DT_resolution_demandee) {
                    const clientDueDate = moment(ticket.TCKT_DT_resolution_demandee).startOf('day');
                    const diffDaysClient = clientDueDate.diff(today, 'days');

                    if (diffDaysClient < 0) {
                        alertMessagesAdmin.push(`DÉPASSÉ la date client (${clientDueDate.format('DD/MM/YYYY')}) de ${Math.abs(diffDaysClient)} jour(s).`);
                    } else if (diffDaysClient <= ADMIN_ALERT_DAYS_BEFORE) {
                        alertMessagesAdmin.push(`Approche de la date client (${clientDueDate.format('DD/MM/YYYY')}) - dans ${diffDaysClient} jour(s).`);
                    }
                }

                // 2. Vérifier la date prévue de résolution
                if (ticket.TCKT_date_prevue_resolution) {
                    const plannedDueDate = moment(ticket.TCKT_date_prevue_resolution).startOf('day');
                    const diffDaysPlanned = plannedDueDate.diff(today, 'days');

                    if (diffDaysPlanned < 0) {
                        alertMessagesAdmin.push(`DÉPASSÉ la date prévue (${plannedDueDate.format('DD/MM/YYYY')}) de ${Math.abs(diffDaysPlanned)} jour(s).`);
                    } else if (diffDaysPlanned <= ADMIN_ALERT_DAYS_BEFORE) {
                        alertMessagesAdmin.push(`Approche de la date prévue (${plannedDueDate.format('DD/MM/YYYY')}) - dans ${diffDaysPlanned} jour(s).`);
                    }
                }

                if (alertMessagesAdmin.length > 0) {
                    const fullAdminAlert = `Alerte Ticket #${ticket.TCKT_code} (Client: ${clientName}, Desc: "${ticketShortDesc}...", Assigné à: ${assignedTechnicians}): ${alertMessagesAdmin.join('; ')}`;
                    const emailSubject = `⚠️ Alerte Système: Ticket #${ticket.TCKT_code} requiert attention`;
                    const emailText = `Bonjour,\n\n` +
                                      `Le ticket suivant requiert votre attention:\n` +
                                      `ID Ticket: ${ticket.TCKT_code}\n` +
                                      `Client: ${clientName}\n` +
                                      `Description: ${ticket.TCKT_description}\n` +
                                      `Techniciens assignés: ${assignedTechnicians}\n` +
                                      `Statut actuel: ${ticket.TCKT_statut}\n\n` +
                                      `Détails de l'alerte: ${alertMessagesAdmin.join('; ')}\n\n` +
                                      `Veuillez examiner ce ticket et prendre les mesures nécessaires.\n\n` +
                                      `Cordialement,\nVotre système de gestion de tickets.`;

                    for (const admin of adminPersonnel) {
                        if (admin.PERS_email) {
                            await sendEmail(admin.PERS_email, emailSubject, emailText);
                        }
                        await createNotificationInAppDirect(
                            admin._id,
                            'Personnel', // Mongoose model name
                            admin.PERS_role_acces, // User type (ADMIN or SUPER_ADMIN)
                            fullAdminAlert
                        );
                    }
                    console.log(`🔔 Alerte Admin envoyée pour le ticket ${ticket.TCKT_code}.`);
                }
            }
            console.log('--- ✅ Admin/Super_Admin ticket alerts job finished ---');
        } catch (error) {
            console.error("❌ Erreur lors de la vérification des alertes de tickets pour les admins:", error);
        }
    });

    console.log('✅ Alert scheduling initialized with new logic.');
};

module.exports = { setupAlerts };
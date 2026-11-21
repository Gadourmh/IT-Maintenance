
const Ticket = require('../models/Ticket');
const Intervention = require('../models/Intervention');
const Equipment = require('../models/Equipment');
const Technicien = require('../models/Technicien'); 
const Client = require('../models/Client');
const HistoriqueChat = require('../models/HistoriqueChat');
const Personnel = require('../models/Personnel');
const TypePanne = require('../models/TypePanne'); 
const Commentaire = require('../models/Commentaire');
const Performance = require('../models/Performance');
const Facture = require('../models/Facture');
const TypeEquipment = require('../models/TypeEquipment');
const RapportFinancier = require('../models/RapportFinancier');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Recrutement = require('../models/Recrutement');
const Avis = require('../models/Avis');
const Notification = require('../models/Notification'); 
const mongoose = require('mongoose'); 

const moment = require('moment');

const {
    adminMenuSections,
    clientMenuData,
    technicienMenuData,
    normalMenuPathsByFonction
} = require('../config/menuConfig');






const fetchData = async (model, query = {}, populateOptions = '') => {
    try {
        const finalQuery = { ...query, deleted_at: null };
        const data = await model.find(finalQuery).populate(populateOptions).lean(); 
        return data;  
    } catch (error) {
        console.error(`Erreur lors de la récupération des données pour le modèle ${model.modelName}:`, error);
        return null;
    }
};



const findOneData = async (model, query = {}, populateOptions = '') => {
    try {
        const finalQuery = { ...query, deleted_at: null };
        let data;
       
        if (model.modelName === 'Ticket' && (query.TCKT_code || query._id) &&
            (chatHistoryBeingProcessed?.ticketDeletionStep === 'awaiting_ticket_code_for_deletion' ||
             chatHistoryBeingProcessed?.ticketDeletionStep === 'confirming_deletion' ||
             (chatHistoryBeingProcessed?.ticketModificationStep !== 'idle' && chatHistoryBeingProcessed?.ticketModificationStep !== 'displaying_tickets_for_modification' && chatHistoryBeingProcessed?.ticketModificationStep !== 'awaiting_ticket_selection_for_modification') )) {
             data = await model.findOne(query).populate(populateOptions).lean();
        } else {
             data = await model.findOne(finalQuery).populate(populateOptions).lean();
        }
        return data;
    } catch (error) {
       
        const modelName = model ? model.modelName : 'undefined';
        console.error(`Erreur lors de la récupération d'une seule donnée pour le modèle ${modelName}:`, error);
        return null;
    }
};


const createData = async (model, data) => {
    try {
        const newData = await model.create(data);
        return newData;
    } catch (error) {
        console.error(`Erreur lors de la création de données pour le modèle ${model.modelName}:`, error);
        return null;
    }
};

const updateData = async (model, id, data) => {
    try {
        const updatedData = await model.findByIdAndUpdate(id, data, { new: true }).lean();
        return updatedData;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour des données pour le modèle ${model.modelName}:`, error);
        return null;
    }
};

const deleteData = async (model, id) => { 
    try {
        const deletedData = await model.findByIdAndDelete(id).lean();
        return deletedData;
    } catch (error) {
        console.error(`Erreur lors de la suppression des données pour le modèle ${model.modelName}:`, error);
        return null;
    }
};




const getAccessiblePaths = (userRole, userFonction = null) => {
    let paths = new Set();
    let menuSectionsToProcess = [];

    switch (userRole) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
            menuSectionsToProcess = adminMenuSections;
            break;
        case 'CLIENT':
            menuSectionsToProcess = [
                { items: clientMenuData.clientMenu },
                { items: clientMenuData.profileSettingsMenu }
            ];
            break;
        case 'TECHNICIEN':
            menuSectionsToProcess = [
                { items: technicienMenuData.dashboardMenu },
                { items: technicienMenuData.ticketMenu },
                { items: technicienMenuData.equipmentMenu },
                { items: technicienMenuData.profileMenu }
            ];
            break;
        case 'NORMAL':
            const normalPaths = normalMenuPathsByFonction[userFonction] || [];
            normalPaths.forEach(path => paths.add(path));
            return Array.from(paths);
    }

    if (menuSectionsToProcess && Array.isArray(menuSectionsToProcess)) {
        menuSectionsToProcess.forEach(section => {
            if (section.items && Array.isArray(section.items)) {
                section.items.forEach(item => {
                    if (item.path) {
                        paths.add(item.path);
                    }
                });
            }
        });
    }
    return Array.from(paths);
};



const commandRegistry = { 
    CLIENT: [ 
        {
            keywords: ['mon profil', 'voir mon profil', 'mes données'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const client = await findOneData(Client, { _id: userId }); 
                if (client) { //
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/mon-profil') ? ' Pour plus d\'informations, visitez la page : /profile-client' : ''; 
                    return `Voici les informations de votre profil :\nNom : ${client.CLNT_raison_sociale}\nCode : ${client.CLNT_code}\nEmail : ${client.CLNT_email}.${link}`; 
                }
                return "Impossible de récupérer votre profil."; 
            }
        },
        {
            keywords: ['types de pannes', 'liste des pannes'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const types = await fetchData(TypePanne); 
                if (types && types.length > 0) { 
                    return `Les types de pannes disponibles sont : ${types.map(t => t.PANN_libelle).join(', ')}.`; 
                }
                return "Aucun type de panne disponible pour le moment."; 
            }
        },
        {
            keywords: ['types d\'équipements', 'liste des équipements'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const types = await fetchData(TypeEquipment); 
                if (types && types.length > 0) { 
                    return `Les types d'équipements disponibles sont : ${types.map(t => t.TPEQ_libelle).join(', ')}.`; 
                }
                return "Aucun type d'équipement disponible pour le moment."; 
            }
        },
        {
            keywords: ['mes commentaires sur le ticket', 'commentaires du ticket'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const codeTicket = params.join(' ').trim(); 
                if (!codeTicket) return "Veuillez spécifier le code du ticket. Par exemple : 'mes commentaires sur le ticket TCKT123'."; 

                const ticket = await findOneData(Ticket, { TCKT_code: codeTicket }); 
                if (!ticket) return `Ticket ${codeTicket} introuvable.`; 

                const comments = await fetchData(Commentaire, { CMMT_ticket: ticket._id }); 
                if (comments && comments.length > 0) { 
                    return `Voici les commentaires pour le ticket ${codeTicket} :\n${comments.map(c => `- ${c.CMMT_message} (par ${c.CMMT_utilisateur_nom})`).join('\n')}.`; 
                }
                return `Aucun commentaire trouvé pour le ticket ${codeTicket}.`; 
            }
        },
        {
            keywords: ['mes équipements', 'mes appareils'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const client = await findOneData(Client, { _id: userId }); 
                if (!client) return "Impossible de récupérer vos équipements sans votre code client."; 
                const equipments = await fetchData(Equipment, { EQPT_CLNT_code: client.CLNT_code }); 
                if (equipments && equipments.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/mes-equipements') ? ' Pour plus d\'informations, visitez la page : /mes-equipements' : ''; 
                    return `Voici vos équipements :\n${equipments.map(e => `- ${e.EQPT_libelle} (Code: ${e.EQPT_code})`).join('\n')}.${link}`; 
                }
                return "Vous n'avez aucun équipement enregistré."; 
            }
        },
        {
            keywords: ['mes demandes', 'mes tickets'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const tickets = await fetchData(Ticket, { TCKT_cree_par: userId }); 
                if (tickets && tickets.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/mes-tickets') ? ' Pour plus d\'informations, visitez la page : /mes-tickets' : ''; 
                    return `Voici vos tickets :\n${tickets.map(t => `- ${t.TCKT_code} (${t.TCKT_statut})`).join('\n')}.${link}`; 
                }
                return "Vous n'avez aucune demande/ticket enregistré."; 
            }
        },
        {
            keywords: ['mes factures', 'factures'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const factures = await fetchData(Facture, { FACT_clientId: userId }); 
                if (factures && factures.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/mes-factures') ? ' Pour plus d\'informations, visitez la page : /mes-factures' : ''; 
                    return `Voici vos factures :\n${factures.map(f => `- Facture N°${f.FACT_numeroFacture} (Montant: ${f.FACT_montantTotal} TND, Statut: ${f.FACT_statut})`).join('\n')}.${link}`; 
                }
                return "Vous n'avez aucune facture enregistrée."; 
            }
        },
    ],
    TECHNICIEN: [ 
        {
            keywords: ['mon profil', 'voir mon profil', 'mes données'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const technicien = await findOneData(Technicien, { _id: userId }); 
                if (technicien) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/profile-technicien') ? ' Pour plus d\'informations, visitez la page : /profile-technicien' : ''; 
                    return `Voici les informations de votre profil :\nNom : ${technicien.TECH_nom_prenom}\nSpécialité : ${technicien.TECH_specialite}\nEmail : ${technicien.TECH_email}.${link}`; 
                }
                return "Impossible de récupérer votre profil."; 
            }
        },
         {
            keywords: ['tickets assignés', 'mes tickets'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const tickets = await fetchData(Ticket, { TCKT_assignee_a: userId }, 'TCKT_cree_par'); 
                if (tickets && tickets.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/mes-tickets-technicien') ? ' Pour plus d\'informations, visitez la page : /mes-tickets-technicien' : ''; 
                    return `Voici les tickets qui vous sont assignés :\n${tickets.map(t => `- ${t.TCKT_code} (${t.TCKT_statut}) - Client: ${t.TCKT_cree_par ? t.TCKT_cree_par.CLNT_raison_sociale : (t.TCKT_client || 'N/A')}`).join('\n')}.${link}`; 
                }
                return "Vous n'avez aucun ticket assigné pour le moment."; 
            }
        },
        {
            keywords: ['mes interventions', 'interventions'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const interventions = await fetchData(Intervention, { INTR_techniciens: userId }, 'INTR_ticket'); 
                if (interventions && interventions.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/mes-interventions') ? ' Pour plus d\'informations, visitez la page : /mes-interventions' : ''; 
                    return `Voici vos interventions :\n${interventions.map(i => `- Intervention N°${i.INTR_code} (Ticket: ${i.INTR_ticket ? i.INTR_ticket.TCKT_code : 'N/A'}) - Statut: ${i.INTR_statut}`).join('\n')}.${link}`; 
                }
                return "Vous n'avez aucune intervention enregistrée."; 
            }
        },
        {
            keywords: ['tous les équipements', 'liste équipements'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const equipments = await fetchData(Equipment); 
                if (equipments && equipments.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/gestion-equipements-technicien') ? ' Pour plus d\'informations, visitez la page : /gestion-equipements-technicien' : ''; 
                    return `Voici la liste de tous les équipements :\n${equipments.map(e => `- ${e.EQPT_libelle} (Code: ${e.EQPT_code})`).join('\n')}.${link}`; 
                }
                return "Aucun équipement trouvé."; 
            }
        },
        {
            keywords: ['mes commentaires', 'commentaires'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const comments = await fetchData(Commentaire, { CMMT_utilisateur: userId }, 'CMMT_ticket'); 
                if (comments && comments.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/mes-commentaires-technicien') ? ' Pour plus d\'informations, visitez la page : /mes-commentaires-technicien' : ''; 
                    return `Voici vos commentaires :\n${comments.map(c => `- ${c.CMMT_message} (Ticket: ${c.CMMT_ticket ? c.CMMT_ticket.TCKT_code : 'N/A'})`).join('\n')}.${link}`; 
                }
                return "Vous n'avez aucun commentaire."; 
            }
        },
    ],
    NORMAL: [ //
        {
            keywords: ['mon profil', 'voir mon profil', 'mes données'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const personnel = await findOneData(Personnel, { _id: userId }); 
                if (personnel) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/profile-normal') ? ' Pour plus d\'informations, visitez la page : /profile-normal' : ''; 
                    return `Voici les informations de votre profil :\nNom : ${personnel.PERS_nom_prenom}\nFonction : ${personnel.PERS_fonction}\nEmail : ${personnel.PERS_email}.${link}`; 
                }
                return "Impossible de récupérer votre profil."; 
            }
        },
        {
            keywords: ['rapports financiers', 'finances', 'etat financier'], 
            handler: async (userId, userRole, userFonction, params) => { 
                if (userFonction !== 'COMPTABLE' && userFonction !== 'CHEF_SERVICE') return "Vous n'êtes pas autorisé à consulter les rapports financiers."; 
                const rapports = await fetchData(RapportFinancier); 
                if (rapports && rapports.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/rapports-financiers-normal') ? ' Pour plus d\'informations, visitez la page : /rapports-financiers-normal' : ''; 
                    return `Voici les rapports financiers :\n${rapports.map(r => `- ${r.RPFT_titre} de ${r.RPFT_periode} (Profit: ${r.RPFT_profit})`).join('\n')}.${link}`; 
                }
                return "Aucun rapport financier trouvé."; 
            }
        },
         {
            keywords: ['gestion budget', 'budgets', 'budget actuel'], 
            handler: async (userId, userRole, userFonction, params) => { 
                if (userFonction !== 'COMPTABLE' && userFonction !== 'CHEF_SERVICE') return "Vous n'êtes pas autorisé à gérer les budgets."; //
                const budgets = await fetchData(Budget); 
                if (budgets && budgets.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/gestion-budgets-normal') ? ' Pour plus d\'informations, visitez la page : /gestion-budgets-normal' : ''; //
                    return `Voici les budgets :\n${budgets.map(b => { 
                        const consomme = b.BUDG_depenses.reduce((acc, curr) => acc + curr, 0); 
                        return `- ${b.BUDG_nom} (Montant: ${b.BUDG_montant}, Consommé: ${consomme})`; 
                    }).join('\n')}.${link}`; 
                }
                return "Aucun budget trouvé."; 
            }
        },
        {
            keywords: ['suivi performances', 'performances', 'mes performances'], 
            handler: async (userId, userRole, userFonction, params) => { 
                if (userFonction !== 'RESPONSABLE_MAINTENANCE' && userFonction !== 'CHEF_SERVICE' && userFonction !== 'GESTIONNAIRE_TICKETS' && userFonction !== 'SUPPORT_CLIENT') return "Vous n'êtes pas autorisé à consulter les performances."; 
                const performances = await fetchData(Performance, { PRF_employe: userId, PRF_type_entite: 'Personnel' }); 
                if (performances && performances.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/suivi-performances-normal') || paths.includes('/mes-performances-normal') ? ' Pour plus d\'informations, visitez la page correspondante.' : ''; 
                    return `Voici vos performances :\n${performances.map(p => `- Période ${p.PRF_periode} : Note de ${p.PRF_note}/20`).join('\n')}.${link}`; 
                }
                return "Aucune performance enregistrée."; 
            }
        },
        {
            keywords: ['recrutement', 'offres emploi'], 
            handler: async (userId, userRole, userFonction, params) => { 
                if (userFonction !== 'CHEF_SERVICE' && userFonction !== 'RH') return "Vous n'êtes pas autorisé à gérer le recrutement."; //
                const recrutements = await fetchData(Recrutement); 
                if (recrutements && recrutements.length > 0) { 
                    const paths = getAccessiblePaths(userRole, userFonction); 
                    const link = paths.includes('/recrutement-normal') ? ' Pour plus d\'informations, visitez la page : /recrutement-normal' : ''; 
                    return `Voici les offres de recrutement :\n${recrutements.map(r => `- ${r.RCUT_poste} (${r.RCUT_statut})`).join('\n')}.${link}`; 
                }
                return "Aucune offre de recrutement trouvée."; 
            }
        },
        {
            keywords: ['notifications', 'mes notifications'], 
            handler: async (userId, userRole, userFonction, params) => { 
                const notifications = await fetchData(Notification, { NOTF_user: userId }); 
                if (notifications && notifications.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/notifications-normal') ? ' Pour plus d\'informations, visitez la page : /notifications-normal' : ''; //
                    return `Voici vos notifications :\n${notifications.map(n => `- ${n.NOTF_message} (Reçue le: ${moment(n.createdAt).format('DD/MM/YYYY')})`).join('\n')}.${link}`; //
                }
                return "Vous n'avez aucune notification."; //
            }
        },
        {
            keywords: ['les tickets', 'tickets'], //
            handler: async (userId, userRole, userFonction, params) => { //
                if (userFonction !== 'GESTIONNAIRE_TICKETS' && userFonction !== 'SUPPORT_CLIENT') return "Vous n'êtes pas autorisé à consulter ces tickets."; //
                const tickets = await fetchData(Ticket); //
                if (tickets && tickets.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/mes-tickets-normal') ? ' Pour plus d\'informations, visitez la page : /mes-tickets-normal' : ''; //
                    return `Voici la liste des tickets :\n${tickets.map(t => `- ${t.TCKT_code} (${t.TCKT_statut})`).join('\n')}.${link}`; //
                }
                return "Aucun ticket trouvé."; //
            }
        },
        {
            keywords: ['les clients', 'clients'], //
            handler: async (userId, userRole, userFonction, params) => { //
                if (userFonction !== 'GESTIONNAIRE_TICKETS' && userFonction !== 'SUPPORT_CLIENT' && userFonction !== 'SECRÉTAIRE') return "Vous n'êtes pas autorisé à consulter les clients."; //
                const clients = await fetchData(Client); //
                if (clients && clients.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/mes-clients-normal') || paths.includes('/gestion-clients-normal') ? ' Pour plus d\'informations, visitez la page correspondante.' : ''; //
                    return `Voici la liste des clients :\n${clients.map(c => `- ${c.CLNT_raison_sociale} (Code: ${c.CLNT_code})`).join('\n')}.${link}`; //
                }
                return "Aucun client trouvé."; //
            }
        },
    ],
    ADMIN: [ //
        {
            keywords: ['gestion personnel', 'personnel', 'liste personnel'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const personnelList = await fetchData(Personnel); //
                if (personnelList && personnelList.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/gestion-personnel') ? ' Pour plus d\'informations, visitez la page : /gestion-personnel' : ''; //
                    return `Voici la liste du personnel :\n${personnelList.map(p => `- ${p.PERS_nom_prenom} (${p.PERS_fonction})`).join('\n')}.${link}`; //
                }
                return "Aucun personnel trouvé."; //
            }
        },
        {
            keywords: ['gestion clients', 'liste clients'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const clients = await fetchData(Client); //
                if (clients && clients.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/gestion-clients') ? ' Pour plus d\'informations, visitez la page : /gestion-clients' : ''; //
                    return `Voici la liste des clients :\n${clients.map(c => `- ${c.CLNT_raison_sociale} (Code: ${c.CLNT_code})`).join('\n')}.${link}`; //
                }
                return "Aucun client trouvé."; //
            }
        },
        {
            keywords: ['gestion techniciens', 'liste techniciens'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const techniciens = await fetchData(Technicien); //
                if (techniciens && techniciens.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/gestion-techniciens') ? ' Pour plus d\'informations, visitez la page : /gestion-techniciens' : ''; //
                    return `Voici la liste des techniciens :\n${techniciens.map(t => `- ${t.TECH_nom_prenom} (${t.TECH_specialite})`).join('\n')}.${link}`; //
                }
                return "Aucun technicien trouvé."; //
            }
        },
        {
            keywords: ['gestion tickets', 'liste tickets'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const tickets = await fetchData(Ticket, {}, 'TCKT_cree_par'); //
                if (tickets && tickets.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/gestion-tickets') ? ' Pour plus d\'informations, visitez la page : /gestion-tickets' : ''; //
                    return `Voici la liste de tous les tickets :\n${tickets.map(t => `- ${t.TCKT_code} (${t.TCKT_statut}) - Client: ${t.TCKT_cree_par ? t.TCKT_cree_par.CLNT_raison_sociale : (t.TCKT_client || 'N/A')}`).join('\n')}.${link}`; //
                }
                return "Aucun ticket trouvé."; //
            }
        },
        {
            keywords: ['gestion équipements', 'liste équipements'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const equipments = await fetchData(Equipment); //
                if (equipments && equipments.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/gestion-equipements') ? ' Pour plus d\'informations, visitez la page : /gestion-equipements' : ''; //
                    return `Voici la liste de tous les équipements :\n${equipments.map(e => `- ${e.EQPT_libelle} (Code: ${e.EQPT_code}) - Client: ${e.EQPT_CLNT_code}`).join('\n')}.${link}`; //
                }
                return "Aucun équipement trouvé."; //
            }
        },
        {
            keywords: ['rapports financiers', 'finances', 'etat financier'], //
             handler: async (userId, userRole, userFonction, params) => { //
                const rapports = await fetchData(RapportFinancier); //
                if (rapports && rapports.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/rapports-financiers') ? ' Pour plus d\'informations, visitez la page : /rapports-financiers' : ''; //
                    return `Voici les rapports financiers :\n${rapports.map(r => `- ${r.RPFT_titre} de ${r.RPFT_periode} (Profit: ${r.RPFT_profit})`).join('\n')}.${link}`; //
                }
                return "Aucun rapport financier trouvé."; //
            }
        },
        {
            keywords: ['historique transactions', 'transactions'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const transactions = await fetchData(Transaction); //
                if (transactions && transactions.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/historique-transactions') ? ' Pour plus d\'informations, visitez la page : /historique-transactions' : ''; //
                    return `Voici l'historique des transactions :\n${transactions.map(t => `- Type: ${t.TRNS_type}, Montant: ${t.TRNS_montant} le ${moment(t.TRNS_dateTransaction).format('DD/MM/YYYY')}`).join('\n')}.${link}`; //
                }
                return "Aucune transaction trouvée."; //
            }
        },
        {
            keywords: ['gestion budgets', 'budgets'], //
            handler: async (userId, userRole, userFonction, params) => { //
                 const budgets = await fetchData(Budget); //
                if (budgets && budgets.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/gestion-budgets') ? ' Pour plus d\'informations, visitez la page : /gestion-budgets' : ''; //
                    return `Voici les budgets :\n${budgets.map(b => { //
                        const consomme = b.BUDG_depenses.reduce((acc, curr) => acc + curr, 0); //
                        return `- ${b.BUDG_nom} (Montant: ${b.BUDG_montant}, Consommé: ${consomme})`; //
                    }).join('\n')}.${link}`; //
                }
                return "Aucun budget trouvé."; //
            }
        },
        {
            keywords: ['suivi performances', 'performances'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const performances = await fetchData(Performance, {}, 'PRF_employe'); //
                if (performances && performances.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/suivi-performances') ? ' Pour plus d\'informations, visitez la page : /suivi-performances' : ''; //
                    return `Voici les performances globales :\n${performances.map(p => { //
                        const employeName = p.PRF_employe ? (p.PRF_employe.PERS_nom_prenom || p.PRF_employe.TECH_nom_prenom || 'N/A') : 'N/A'; //
                        return `- Période ${p.PRF_periode} : Note de ${p.PRF_note}/20 (Employé: ${employeName})`; //
                    }).join('\n')}.${link}`; //
                }
                return "Aucune performance enregistrée."; //
            }
        },
        {
            keywords: ['recrutement', 'offres emploi'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const recrutements = await fetchData(Recrutement); //
                if (recrutements && recrutements.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/recrutement') ? ' Pour plus d\'informations, visitez la page : /recrutement' : ''; //
                    return `Voici les offres de recrutement :\n${recrutements.map(r => `- ${r.RCUT_poste} (${r.RCUT_statut}) - Date limite: ${moment(r.RCUT_dateLimite).format('DD/MM/YYYY')}`).join('\n')}.${link}`; //
                }
                return "Aucune offre de recrutement trouvée."; //
            }
        },
        {
            keywords: ['facture client', 'factures clients'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const factures = await fetchData(Facture, {}, 'FACT_clientId'); //
                if (factures && factures.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/facture-client-admin') ? ' Pour plus d\'informations, visitez la page : /facture-client-admin' : ''; //
                    return `Voici les factures des clients :\n${factures.map(f => `- Facture N°${f.FACT_numeroFacture} (Client: ${f.FACT_clientId ? f.FACT_clientId.CLNT_raison_sociale : 'N/A'}, Montant: ${f.FACT_montantTotal} TND)`).join('\n')}.${link}`; //
                }
                return "Aucune facture client trouvée."; //
            }
        },
        {
            keywords: ['gestion interventions', 'interventions'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const interventions = await fetchData(Intervention, {}, 'INTR_ticket INTR_techniciens'); //
                if (interventions && interventions.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/gestion-interventions') ? ' Pour plus d\'informations, visitez la page : /gestion-interventions' : ''; //
                    return `Voici les interventions :\n${interventions.map(i => { //
                        const ticketCode = i.INTR_ticket ? i.INTR_ticket.TCKT_code : 'N/A'; //
                        const technicians = i.INTR_techniciens && i.INTR_techniciens.length > 0 ? i.INTR_techniciens.map(t => t.TECH_nom_prenom).join(', ') : 'N/A'; //
                        return `- Intervention N°${i.INTR_code} (Ticket: ${ticketCode}, Statut: ${i.INTR_statut}, Techniciens: ${technicians})`; //
                    }).join('\n')}.${link}`; //
                }
                return "Aucune intervention trouvée."; //
            }
        },
        {
            keywords: ['gestion types pannes', 'types pannes', 'liste types pannes'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const typesPannes = await fetchData(TypePanne); //
                if (typesPannes && typesPannes.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/gestion-type-pannes') ? ' Pour plus d\'informations, visitez la page : /gestion-type-pannes' : ''; //
                    return `Voici les types de pannes enregistrés :\n${typesPannes.map(tp => `- ${tp.PANN_libelle} (Code: ${tp.PANN_code})`).join('\n')}.${link}`; //
                }
                return "Aucun type de panne trouvé."; //
            }
        },
        {
            keywords: ['gestion types équipements', 'types équipements', 'liste types équipements'], //
            handler: async (userId, userRole, userFonction, params) => { //
                const typesEquipments = await fetchData(TypeEquipment); //
                if (typesEquipments && typesEquipments.length > 0) { //
                    const paths = getAccessiblePaths(userRole, userFonction); //
                    const link = paths.includes('/gestion-type-equipements') ? ' Pour plus d\'informations, visitez la page : /gestion-type-equipements' : ''; //
                    return `Voici les types d'équipements enregistrés :\n${typesEquipments.map(te => `- ${te.TPEQ_libelle} (Code: ${te.TPEQ_code})`).join('\n')}.${link}`; //
                }
                return "Aucun type d'équipement trouvé."; //
            }
        },
    ],
    SUPER_ADMIN: [], //
};

commandRegistry.SUPER_ADMIN = [...commandRegistry.ADMIN]; //SUPER_ADMIN hérite de toutes les commandes de ADMIN. C'est une façon simple de gérer les hiérarchies de permissions sans dupliquer le code."
 


const handleTicketCreation = async (userMessage, chatHistory, userId, userRole, userFonction) => {
    if (userRole !== 'CLIENT') {
        return null;
    }

    let reply = '';
    let updatedStep = chatHistory.ticketCreationStep;
    let updatedState = chatHistory.conversationState;

    if (!updatedState) updatedState = {};
    if (!updatedStep) updatedStep = 'idle';


    switch (updatedStep) {
        case 'idle':
            if (userMessage.toLowerCase().includes('créer ticket') || userMessage.toLowerCase().includes('nouveau ticket')) {
                const client = await findOneData(Client, { _id: userId });
                if (!client) {
                    reply = "Impossible de démarrer la création de ticket car votre profil client est introuvable.";
                    updatedStep = 'idle';
                    break;
                }

                const equipments = await fetchData(Equipment, { EQPT_CLNT_code: client.CLNT_code });
                if (!equipments || equipments.length === 0) {
                    reply = "Vous ne semblez avoir aucun équipement enregistré. Vous devez d'abord enregistrer un équipement pour pouvoir créer un ticket.";
                    updatedStep = 'idle';
                    break;
                }

                let equipmentListMessage = "Voici la liste de vos équipements enregistrés :\n";
                equipments.forEach(eq => {
                    equipmentListMessage += `- ${eq.EQPT_libelle} (Code: **${eq.EQPT_code}**)\n`;
                });

                reply = `D'accord, créons un nouveau ticket.\n${equipmentListMessage}\nQuel est le code de l'équipement concerné ?`;
                updatedStep = 'awaiting_equipment_code';
                updatedState = {};
            } else {
                return null;
            }
            break;

        case 'awaiting_equipment_code':
            updatedState.equipmentCode = userMessage.trim().toUpperCase();
            let equipmentQuery = { EQPT_code: updatedState.equipmentCode };

            const client = await findOneData(Client, { _id: userId });
            if (!client) {
                reply = "Impossible de vérifier l'équipement car votre profil client n'a pas pu être chargé. Veuillez réessayer plus tard.";
                updatedStep = 'idle';
                break;
            }
            equipmentQuery.EQPT_CLNT_code = client.CLNT_code;


            const equipment = await findOneData(Equipment, equipmentQuery);
            if (!equipment) {
                reply = `Le code de l'équipement "${updatedState.equipmentCode}" est introuvable ou ne vous appartient pas. Veuillez vérifier le code dans la liste fournie ou tapez 'annuler'.`;
                break;
            }

            updatedState.equipmentClientCode = equipment.EQPT_CLNT_code;
            updatedState.equipmentId = equipment._id;
            reply = `Équipement ${updatedState.equipmentCode} confirmé. Maintenant, veuillez décrire le problème ou la demande (soyez aussi précis que possible) :`;
            updatedStep = 'awaiting_description';
            break;

        case 'awaiting_description':
            updatedState.description = userMessage.trim();
            
            const typesPannes = await fetchData(TypePanne);
            if (!typesPannes || typesPannes.length === 0) {
                reply = "Aucun type de panne n'est actuellement configuré. Veuillez indiquer 'Autre'.";
                updatedState.panneType = 'Autre';
                updatedState.panneTypeId = null;
                reply += "\nQuel est le niveau d'urgence ? (Faible, Moyenne, Élevée)";
                updatedStep = 'awaiting_urgence';
                break;
            }

            let panneListMessage = "Voici les types de pannes que vous pouvez sélectionner :\n";
            typesPannes.forEach(t => {
                panneListMessage += `- **${t.PANN_libelle}**\n`;
            });
            reply = `Merci. ${panneListMessage}\nQuel est le type de panne ? Si ce n'est pas dans la liste ou si votre demande n'est pas une panne, indiquez "Autre".`;
            updatedStep = 'awaiting_panne_type';
            break;

        case 'awaiting_panne_type':
            updatedState.panneType = userMessage.trim();
            let typePanneExists = null;
            if (updatedState.panneType.toLowerCase() !== 'autre') {
                 typePanneExists = await findOneData(TypePanne, { PANN_libelle: { $regex: new RegExp(`^${updatedState.panneType}$`, 'i') } });
                 if (!typePanneExists) {
                    const typesPannesDisponibles = await fetchData(TypePanne);
                    const listePannesDispo = typesPannesDisponibles.map(t => t.PANN_libelle).join(', ');
                    reply = `Ce type de panne n'est pas reconnu. Veuillez choisir parmi les options (${listePannesDispo}) ou taper 'Autre'.`;
                    break;
                 }
            }
            updatedState.panneTypeId = typePanneExists ? typePanneExists._id : null;
            reply = "Noté. Quel est le niveau d'urgence ? (Faible, Moyenne, Élevée)";
            updatedStep = 'awaiting_urgence';
            break;

        case 'awaiting_urgence':
            const urgence = userMessage.trim().toLowerCase();
            if (!['faible', 'moyenne', 'élevée', 'basse', 'haute'].includes(urgence)) {
                reply = "Niveau d'urgence non valide. Veuillez choisir 'Faible', 'Moyenne' ou 'Élevée'.";
                break;
            }
            if (urgence === 'basse') updatedState.urgence = 'faible';
            else if (urgence === 'haute') updatedState.urgence = 'élevée';
            else updatedState.urgence = urgence;

            reply = "Quand souhaitez-vous que le problème soit résolu ? (Date au format JJ/MM/AAAA, optionnel, tapez 'passer' si non applicable)";
            updatedStep = 'awaiting_resolution_date';
            break;

        case 'awaiting_resolution_date':
            const resolutionDateInput = userMessage.trim();
            if (resolutionDateInput.toLowerCase() === 'passer') {
                updatedState.resolutionDate = null;
            } else {
                const resolutionDate = moment(resolutionDateInput, 'DD/MM/YYYY', true);
                if (!resolutionDate.isValid() || resolutionDate.isBefore(moment(), 'day')) {
                    reply = "La date de résolution est invalide ou passée. Veuillez fournir une date future au format JJ/MM/AAAA ou tapez 'passer'.";
                    break;
                }
                updatedState.resolutionDate = resolutionDate.toDate();
            }

            reply = `Voici un récapitulatif de votre demande :\n` +
                `Code Équipement : ${updatedState.equipmentCode}\n` +
                `Description : ${updatedState.description}\n` +
                `Type de panne : ${updatedState.panneType}\n` +
                `Urgence : ${updatedState.urgence}\n` +
                `Date de résolution souhaitée : ${updatedState.resolutionDate ? moment(updatedState.resolutionDate).format('DD/MM/YYYY') : 'Non spécifiée'}\n\n` +
                `Confirmez-vous la création de ce ticket ? (Oui/Non)`;
            updatedStep = 'confirming_ticket';
            break;

        case 'confirming_ticket':
           
            if (userMessage.toLowerCase().trim() === 'oui') {
                try {
                    const newTicketData = {
                        TCKT_description: updatedState.description,
                        Date_creation: new Date(),
                        TCKT_statut: 'ouvert',
                        TCKT_degre_urgence: updatedState.urgence,
                        TCKT_DT_resolution_demandee: updatedState.resolutionDate,
                        TCKT_cree_par: userId,
                        TCKT_client: updatedState.equipmentClientCode,
                        TCKT_equipment: updatedState.equipmentCode,
                        TCKT_types_pannes: updatedState.panneTypeId ? [updatedState.panneTypeId] : [],
                    };

                    const newTicket = await createData(Ticket, newTicketData);
                    if (newTicket && newTicket.TCKT_code) {
                        reply = `Votre ticket (${newTicket.TCKT_code}) a été créé avec succès ! Nous vous informerons de son suivi.`;
                    } else {
                         reply = "Une erreur est survenue lors de la finalisation de la création de votre ticket. Le ticket n'a peut-être pas été sauvegardé. Veuillez contacter le support.";
                    }
                    updatedStep = 'idle';
                    updatedState = {};
                } catch (error) {
                    console.error('Erreur lors de la création du ticket :', error);
                    reply = "Une erreur technique est survenue lors de la création de votre ticket. Veuillez réessayer ou contacter le support.";
                    updatedStep = 'idle';
                    updatedState = {};
                }
            } else {
                reply = "Création du ticket annulée. N'hésitez pas si vous avez d'autres questions.";
                updatedStep = 'idle';
                updatedState = {};
            }
            break;
        default:
            reply = "Une erreur est survenue dans le processus de création de ticket. Réinitialisation.";
            updatedStep = 'idle';
            updatedState = {};
            break;
    }

    return { reply, updatedStep, updatedState };
};


let chatHistoryBeingProcessed = null; //


const ticketModifiableFieldsConfig = {
    TECHNICIEN: [
        { name: 'TCKT_statut', label: 'Statut', type: 'enum', options: ["ouvert", "en cours", "résolu", "fermé"], model: Ticket, schemaPath: 'TCKT_statut.enum' }, 
        { name: 'TCKT_description', label: 'Description (ajouter une note)', type: 'text_append' }, 
        { name: 'TCKT_date_prevue_resolution', label: 'Date prévue de résolution (JJ/MM/AAAA)', type: 'date' }, 
    ],
    ADMIN: [
      //  { name: 'TCKT_client', label: 'Code Client', type: 'text_ref', model: Client, fieldRef: 'CLNT_code', displayField: 'CLNT_raison_sociale' }, 
     //   { name: 'TCKT_equipment', label: 'Code Équipement', type: 'text_ref', model: Equipment, fieldRef: 'EQPT_code', displayField: 'EQPT_libelle' }, 
        { name: 'TCKT_assignee_a', label: 'Techniciens assignés', type: 'array_ref', model: Technicien, fieldRef: 'TECH_code', displayField: 'TECH_nom_prenom' }, 
        { name: 'TCKT_description', label: 'Description', type: 'text' }, 
        { name: 'TCKT_types_pannes', label: 'Types de pannes', type: 'array_ref', model: TypePanne, fieldRef: 'PANN_code', displayField: 'PANN_libelle' },
        { name: 'TCKT_degre_urgence', label: 'Degré d\'urgence', type: 'enum', options: ["faible", "moyenne", "élevée"], model: Ticket, schemaPath: 'TCKT_degre_urgence.enum' }, 
        { name: 'TCKT_statut', label: 'Statut', type: 'enum', options: ["ouvert", "en cours", "résolu", "fermé"], model: Ticket, schemaPath: 'TCKT_statut.enum' }, 
        { name: 'TCKT_backlog', label: 'Mettre en backlog (oui/non)', type: 'boolean' }, 
        { name: 'TCKT_sprint', label: 'Assigner à un sprint (oui/non)', type: 'boolean' }, 
     
        { name: 'TCKT_date_prevue_resolution', label: 'Date prévue de résolution (JJ/MM/AAAA)', type: 'date' }, 
    ],
    SUPER_ADMIN: []
};
ticketModifiableFieldsConfig.SUPER_ADMIN = [...ticketModifiableFieldsConfig.ADMIN]; //



const handleTicketModification = async (userMessage, chatHistory, userId, userRole) => {
    const modificationPermissions = ['TECHNICIEN', 'ADMIN', 'SUPER_ADMIN'];
    if (!modificationPermissions.includes(userRole)) {
        return null;
    }

    let reply = '';
    let {
        ticketModificationStep = 'idle',
        modifyingTicketCode = null,
        modifyingTicketId = null,
        modifyingField = null,
        conversationState = {}
    } = chatHistory;

    const lowerCaseMessage = userMessage.toLowerCase().trim();

    if (lowerCaseMessage === 'annuler' || lowerCaseMessage === 'annuler modification') {
        reply = "Modification du ticket annulée. Que puis-je faire d'autre pour vous ?";
        return {
            reply,
            updatedHistory: {
                ticketModificationStep: 'idle',
                modifyingTicketCode: null,
                modifyingTicketId: null,
                modifyingField: null,
                conversationState: {}
            }
        };
    }

    chatHistoryBeingProcessed = { ...chatHistory, ticketModificationStep };

    switch (ticketModificationStep) {
        case 'idle':
            if (lowerCaseMessage.includes('modifier ticket') || lowerCaseMessage.includes('changer ticket')) {
                let tickets = [];
                if (userRole === 'TECHNICIEN') {
                    tickets = await fetchData(Ticket, { TCKT_assignee_a: userId, deleted_at: null }, 'TCKT_cree_par');
                } else { 
                    tickets = await fetchData(Ticket, { deleted_at: null }, 'TCKT_cree_par');
                }

                if (!tickets || tickets.length === 0) {
                    reply = "Vous n'avez aucun ticket modifiable pour le moment.";
                    ticketModificationStep = 'idle';
                    break;
                }

                let ticketListMessage = "Voici les tickets que vous pouvez modifier:\n";
                tickets.forEach(t => {
                    const clientName = t.TCKT_cree_par ? t.TCKT_cree_par.CLNT_raison_sociale : (t.TCKT_client || 'N/A');
                    ticketListMessage += `- Code: **${t.TCKT_code}**, Client: ${clientName}, Statut: ${t.TCKT_statut}, Desc: ${t.TCKT_description.substring(0, 30)}...\n`;
                });
                reply = ticketListMessage + "\nVeuillez entrer le code du ticket à modifier (ex: TCKT12345) ou tapez 'annuler'.";
                ticketModificationStep = 'awaiting_ticket_selection_for_modification';
            } else {
                chatHistoryBeingProcessed = null;
                return null;
            }
            break;

        case 'awaiting_ticket_selection_for_modification':
            const ticketCodeToSelect = userMessage.trim().toUpperCase();
            const ticket = await findOneData(Ticket, { TCKT_code: ticketCodeToSelect, deleted_at: null });

            if (!ticket) {
                reply = `Le ticket avec le code "${ticketCodeToSelect}" est introuvable ou a déjà été supprimé. Veuillez vérifier le code ou tapez 'annuler'.`;
                break;
            }

            if (userRole === 'TECHNICIEN') {
                 const ticketFull = await Ticket.findOne({ _id: ticket._id });
                 if (!ticketFull || !ticketFull.TCKT_assignee_a.some(id => id.equals(userId))) {
                    reply = `Désolé, vous ne pouvez modifier que les tickets qui vous sont assignés. Le ticket ${ticketCodeToSelect} ne vous est pas assigné. Tapez 'annuler' ou donnez un autre code de la liste.`;
                    break;
                }
            }

            modifyingTicketCode = ticket.TCKT_code;
            modifyingTicketId = ticket._id;

            let fieldsForRole = ticketModifiableFieldsConfig[userRole] ? [...ticketModifiableFieldsConfig[userRole]] : [];

            if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
                const nonModifiableCodeFields = ['TCKT_client', 'TCKT_equipment'];
                fieldsForRole = fieldsForRole.filter(f => !nonModifiableCodeFields.includes(f.name));
            }

            if (!fieldsForRole || fieldsForRole.length === 0) {
                reply = "Il n'y a aucun champ que vous êtes autorisé à modifier pour ce ticket (ou les champs de code sont exclus pour votre rôle). Annulation.";
                ticketModificationStep = 'idle';
                modifyingTicketCode = null;
                modifyingTicketId = null;
                conversationState = {};
                break;
            }
            const fieldLabels = fieldsForRole.map(f => f.label).join(', ');
            reply = `Ticket ${modifyingTicketCode} sélectionné. Quel champ souhaitez-vous modifier ?\nOptions : ${fieldLabels}. Tapez 'annuler' pour arrêter.`;
            ticketModificationStep = 'awaiting_field_to_modify';
            conversationState.currentAvailableFields = fieldsForRole;
            break;

        case 'awaiting_field_to_modify':
            const selectedFieldLabel = userMessage.trim();
            const fieldToModify = conversationState.currentAvailableFields?.find(f => f.label.toLowerCase() === selectedFieldLabel.toLowerCase());

            if (!fieldToModify) {
                const currentFieldsLabels = conversationState.currentAvailableFields?.map(f => f.label).join(', ') || "aucune option disponible";
                reply = `Champ non valide. Veuillez choisir parmi : ${currentFieldsLabels}, ou tapez 'annuler'.`;
                break;
            }
            modifyingField = fieldToModify.name;

            const ticketActuel = await Ticket.findById(modifyingTicketId).populate('TCKT_assignee_a TCKT_types_pannes').lean();
            if (!ticketActuel) {
                 reply = "Une erreur est survenue, le ticket n'a pas pu être retrouvé. Modification annulée.";
                 ticketModificationStep = 'idle'; modifyingTicketCode = null; modifyingTicketId = null; modifyingField = null; conversationState = {};
                 break;
            }
            const valeurActuelle = ticketActuel[modifyingField];

            let question = `Quelle est la nouvelle valeur pour "${fieldToModify.label}"?`;
            let optionsListMessage = "";

            if (fieldToModify.type === 'array_ref') {
                 // ✨ MODIFICATION ICI: Instructions plus claires pour l'ajout/remplacement
                let actionPrompt = `Entrez le(s) code(s) à **ajouter**, séparés par une virgule.\nPour **remplacer** toute la liste, tapez \`remplacer:\` suivi des codes.\nPour **vider** la liste, tapez \`vider\`.`;
                
                if (fieldToModify.name === 'TCKT_assignee_a') {
                    const allTechniciens = await fetchData(Technicien, { deleted_at: null });
                    if (allTechniciens && allTechniciens.length > 0) {
                        optionsListMessage = "Techniciens disponibles:\n" + allTechniciens.map(t => `- ${t.TECH_nom_prenom} (Code: ${t.TECH_code})`).join('\n') + "\n";
                        question = actionPrompt;
                    } else {
                         optionsListMessage = "Aucun technicien disponible.\n";
                         question = "Veuillez entrer les codes des techniciens. " + actionPrompt;
                    }
                } else if (fieldToModify.name === 'TCKT_types_pannes') {
                    const allTypesPannes = await fetchData(TypePanne, { deleted_at: null });
                    if (allTypesPannes && allTypesPannes.length > 0) {
                        optionsListMessage = "Types de pannes disponibles:\n" + allTypesPannes.map(tp => `- ${tp.PANN_libelle} (Code: ${tp.PANN_code})`).join('\n') + "\n";
                        question = actionPrompt;
                    } else {
                        optionsListMessage = "Aucun type de panne disponible.\n";
                        question = "Veuillez entrer les codes des types de pannes. " + actionPrompt;
                    }
                } else {
                     question = actionPrompt;
                }

            } else if (fieldToModify.type === 'enum') {
                question += ` (Options: ${fieldToModify.options.join(', ')})`;
            } else if (fieldToModify.type === 'boolean') {
                question += ` (oui/non)`;
            } else if (fieldToModify.type === 'text_append') {
                 question = `Veuillez entrer la note à ajouter à la description :`;
            }

            let displayCurrentValue = "non définie";
            if (valeurActuelle !== undefined && valeurActuelle !== null) {
                if (Array.isArray(valeurActuelle)) {
                     if (valeurActuelle.length === 0) {
                        displayCurrentValue = "vide";
                    } else if (valeurActuelle[0] instanceof mongoose.Types.ObjectId || typeof valeurActuelle[0] === 'object' && valeurActuelle[0]._id) {
                        let populatedDetails = [];
                        if (modifyingField === 'TCKT_assignee_a' && ticketActuel.TCKT_assignee_a.length > 0) {
                            populatedDetails = ticketActuel.TCKT_assignee_a.map(t => `${t.TECH_nom_prenom || t.TECH_code || t._id}`);
                        } else if (modifyingField === 'TCKT_types_pannes' && ticketActuel.TCKT_types_pannes.length > 0) {
                            populatedDetails = ticketActuel.TCKT_types_pannes.map(p => `${p.PANN_libelle || p.PANN_code || p._id}`);
                        }
                        displayCurrentValue = populatedDetails.length > 0 ? populatedDetails.join('; ') : (valeurActuelle.length === 0 ? "vide" : "plusieurs éléments (IDs)");
                    } else {
                         displayCurrentValue = valeurActuelle.join(', ');
                    }
                } else if (valeurActuelle instanceof Date) {
                    displayCurrentValue = moment(valeurActuelle).format('DD/MM/YYYY');
                } else if (typeof valeurActuelle === 'string' && valeurActuelle.length > 70) {
                    displayCurrentValue = valeurActuelle.substring(0, 70) + "...";
                } else if (typeof valeurActuelle === 'boolean') {
                    displayCurrentValue = valeurActuelle ? 'oui' : 'non';
                }
                 else {
                    displayCurrentValue = String(valeurActuelle);
                }
                 reply = (optionsListMessage ? optionsListMessage + "\n" : "") + `La valeur actuelle pour "${fieldToModify.label}" est "${displayCurrentValue}".\n${question}`;
            } else {
                 reply = (optionsListMessage ? optionsListMessage + "\n" : "") + question;
            }

            ticketModificationStep = 'awaiting_new_value';
            break;

        case 'awaiting_new_value':
            let newValueInput = userMessage.trim();
            const fieldConf = ticketModifiableFieldsConfig[userRole]?.find(f => f.name === modifyingField);
            if (!fieldConf) {
                reply = "Une erreur de configuration est survenue (champ introuvable). Modification annulée.";
                ticketModificationStep = 'idle'; modifyingTicketCode = null; modifyingTicketId = null; modifyingField = null; conversationState = {};
                break;
            }

            let validatedValue;
            let validationError = null;

            switch (fieldConf.type) {
                case 'enum':
                    if (!fieldConf.options.map(o => o.toLowerCase()).includes(newValueInput.toLowerCase())) {
                        validationError = `Valeur invalide. Veuillez choisir parmi : ${fieldConf.options.join(', ')}.`;
                    } else {
                        validatedValue = fieldConf.options.find(o => o.toLowerCase() === newValueInput.toLowerCase());
                    }
                    break;
                case 'date':
                    const dateValue = moment(newValueInput, 'DD/MM/YYYY', true);
                    if (!dateValue.isValid()) {
                        validationError = "Format de date invalide. Veuillez utiliser JJ/MM/AAAA.";
                    } else if (fieldConf.name === 'TCKT_date_prevue_resolution' && dateValue.isBefore(moment(), 'day')) {
                        validationError = "La date prévue de résolution ne peut pas être dans le passé. Veuillez utiliser JJ/MM/AAAA pour une date future.";
                    }
                     else {
                        validatedValue = dateValue.toDate();
                    }
                    break;
                case 'boolean':
                    if (newValueInput.toLowerCase() === 'oui') validatedValue = true;
                    else if (newValueInput.toLowerCase() === 'non') validatedValue = false;
                    else validationError = "Veuillez répondre par 'oui' ou 'non'.";
                    break;
                case 'text_append': {
                    const ticketToUpdate = await Ticket.findById(modifyingTicketId).lean();
                    let userDisplayName = "Utilisateur";
                    if (userRole === 'TECHNICIEN') {
                        const tech = await Technicien.findById(userId).lean();
                        userDisplayName = tech?.TECH_nom_prenom || "Technicien";
                    } else if (['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
                        const adminUser = await Personnel.findById(userId).lean();
                        userDisplayName = adminUser?.PERS_nom_prenom || "Admin";
                    }
                    const timestamp = moment().format('DD/MM/YYYY HH:mm');
                    validatedValue = `${ticketToUpdate.TCKT_description || ''}\n[Note par ${userDisplayName} (${userRole}) le ${timestamp}]: ${newValueInput}`;
                    break;
                }
                case 'array_ref': {
                    // ✨ MODIFICATION ICI: Détecter le mode d'action (add, replace, empty)
                    let updateMode = 'add';
                    let codesInput = newValueInput;

                    if (newValueInput.toLowerCase().startsWith('remplacer:')) {
                        updateMode = 'replace';
                        codesInput = newValueInput.substring('remplacer:'.length).trim();
                    } else if (newValueInput.toLowerCase() === 'vide') {
                        updateMode = 'empty';
                        codesInput = '';
                    }
                    
                    conversationState.arrayUpdateMode = updateMode;
                    const codes = codesInput.split(',').map(code => code.trim().toUpperCase()).filter(code => code);
                    const objectIds = [];

                    if (updateMode === 'empty') {
                        validatedValue = [];
                    } else if (codes.length > 0) {
                        for (const code of codes) {
                            const item = await findOneData(fieldConf.model, { [fieldConf.fieldRef]: code, deleted_at: null });
                            if (!item) {
                                validationError = `Le code "${code}" pour ${fieldConf.label.split('(')[0].trim()} est introuvable ou inactif. Vérifiez les codes et réessayez.`;
                                break;
                            }
                            objectIds.push(item._id);
                        }
                        if (!validationError) validatedValue = objectIds;
                    } else {
                         validationError = `Aucun code valide fourni. Entrez les codes, ou tapez 'vider' ou 'remplacer: ...'`;
                    }
                    break;
                }
                default:
                    validatedValue = newValueInput;
                    break;
            }

            if (validationError) {
                reply = validationError + " Tapez 'annuler' pour arrêter.";
                break;
            }

            conversationState.newValue = validatedValue;
            let displayNewValueConfirm = newValueInput;
             if (fieldConf.type === 'array_ref' && Array.isArray(validatedValue)) {
                 if (validatedValue.length === 0) {
                     displayNewValueConfirm = "vide";
                 } else {
                    const confirmedItems = [];
                    for(const id of validatedValue) {
                        const item = await fieldConf.model.findById(id).lean();
                        if(item) confirmedItems.push(item[fieldConf.displayField] || item[fieldConf.fieldRef]);
                    }
                    displayNewValueConfirm = confirmedItems.join(', ');
                 }
            } else if (validatedValue instanceof Date) {
                 displayNewValueConfirm = moment(validatedValue).format('DD/MM/YYYY');
            } else if (typeof validatedValue === 'boolean') {
                 displayNewValueConfirm = validatedValue ? 'oui' : 'non';
            }
            
            // ✨ MODIFICATION ICI: Adapter le message de confirmation
            let confirmationActionText = `modifier le champ "${fieldConf.label}" du ticket ${modifyingTicketCode} avec la nouvelle valeur`;
            if (fieldConf.type === 'array_ref') {
                if (conversationState.arrayUpdateMode === 'add') {
                    confirmationActionText = `**ajouter** les valeurs suivantes au champ "${fieldConf.label}" du ticket ${modifyingTicketCode}`;
                } else if (conversationState.arrayUpdateMode === 'replace') {
                    confirmationActionText = `**remplacer** le contenu du champ "${fieldConf.label}" du ticket ${modifyingTicketCode} par`;
                } else if (conversationState.arrayUpdateMode === 'empty') {
                    confirmationActionText = `**vider** le champ "${fieldConf.label}" du ticket ${modifyingTicketCode}`;
                }
            }

            reply = `Vous souhaitez ${confirmationActionText} : "${displayNewValueConfirm}".\nConfirmez-vous cette modification ? (Oui/Non)`;
            ticketModificationStep = 'confirming_modification';
            break;

        case 'confirming_modification':
            if (lowerCaseMessage === 'oui') {
                try {
                    const finalFieldConf = ticketModifiableFieldsConfig[userRole]?.find(f => f.name === modifyingField);
                    if (!finalFieldConf) {
                         reply = "Une erreur de configuration est survenue. La mise à jour a échoué.";
                         ticketModificationStep = 'idle'; modifyingTicketCode = null; modifyingTicketId = null; modifyingField = null; conversationState = {};
                         break;
                    }

                    // ✨ MODIFICATION ICI: Construire la bonne requête de mise à jour
                    let finalUpdate = {};

                    if (finalFieldConf.type === 'array_ref' && conversationState.arrayUpdateMode) {
                        switch(conversationState.arrayUpdateMode) {
                            case 'add':
                                finalUpdate = { $addToSet: { [modifyingField]: { $each: conversationState.newValue } } };
                                break;
                            case 'replace':
                            case 'empty':
                                finalUpdate = { $set: { [modifyingField]: conversationState.newValue } };
                                break;
                            default: // Fallback
                                finalUpdate = { $set: { [modifyingField]: conversationState.newValue } };
                        }
                    } else {
                        // Comportement par défaut pour les autres types de champ
                        finalUpdate = { $set: { [modifyingField]: conversationState.newValue } };
                    }
                    
                    if (modifyingField === 'TCKT_statut' && ['résolu', 'fermé'].includes(conversationState.newValue)) {
                         if (!finalUpdate.$set) finalUpdate.$set = {};
                         finalUpdate.$set.TCKT_DT_resolution_confirmee = new Date();
                    }

                    const updatedTicket = await Ticket.findByIdAndUpdate(modifyingTicketId, finalUpdate, { new: true }).populate(finalFieldConf.type === 'array_ref' ? modifyingField : '');

                    if (!updatedTicket) {
                        reply = "Une erreur est survenue lors de la mise à jour du ticket.";
                    } else {
                        let finalDisplayValue;
                        const updatedValue = updatedTicket[modifyingField];

                        if (updatedValue instanceof Date) {
                           finalDisplayValue = moment(updatedValue).format('DD/MM/YYYY');
                        } else if (typeof updatedValue === 'boolean') {
                           finalDisplayValue = updatedValue ? 'oui' : 'non';
                        } else if (Array.isArray(updatedValue) && finalFieldConf.type === 'array_ref') {
                            if (updatedValue.length === 0) {
                                finalDisplayValue = "vide";
                            } else {
                                const displayItems = updatedValue.map(item => item[finalFieldConf.displayField] || item[finalFieldConf.fieldRef] || item);
                                finalDisplayValue = displayItems.join(', ');
                            }
                        } else {
                           finalDisplayValue = updatedTicket[modifyingField];
                        }
                        
                        reply = `Le ticket ${modifyingTicketCode} a été mis à jour avec succès ! Le champ "${finalFieldConf.label}" est maintenant "${finalDisplayValue}".`;
                    }
                } catch (error) {
                    console.error("Erreur lors de la mise à jour du ticket via chatbot:", error);
                    reply = "Une erreur technique est survenue lors de la mise à jour.";
                }
            } else {
                reply = "Modification annulée.";
            }
            ticketModificationStep = 'idle'; modifyingTicketCode = null; modifyingTicketId = null; modifyingField = null; conversationState = {};
            break;
        default:
            reply = "Problème avec l'étape de modification. Réinitialisation.";
            ticketModificationStep = 'idle'; modifyingTicketCode = null; modifyingTicketId = null; modifyingField = null; conversationState = {};
            break;
    }
    chatHistoryBeingProcessed = null;
    return {
        reply,
        updatedHistory: { ticketModificationStep, modifyingTicketCode, modifyingTicketId, modifyingField, conversationState }
    };
};

// ===================================================================================
// ✨ NOUVEAU : Logique de SUPPRESSION de ticket interactive (AMÉLIORÉE)
// ===================================================================================
const handleTicketDeletion = async (userMessage, chatHistory, userId, userRole) => { //
    const deletionPermissions = ['ADMIN', 'SUPER_ADMIN']; //
    if (!deletionPermissions.includes(userRole)) { //
        return null;
    }

    let reply = ''; //
    let {
        ticketDeletionStep = 'idle', //
        deletingTicketCode = null, //
        deletingTicketId = null, //
        conversationState = {} //
    } = chatHistory;

    const lowerCaseMessage = userMessage.toLowerCase().trim(); //

    if (lowerCaseMessage === 'annuler' || lowerCaseMessage === 'annuler suppression') { //
        reply = "Suppression du ticket annulée. Que puis-je faire d'autre pour vous ?"; //
        return {
            reply, //
            updatedHistory: { //
                ticketDeletionStep: 'idle', //
                deletingTicketCode: null, //
                deletingTicketId: null, //
                conversationState: {} //
            }
        };
    }
    chatHistoryBeingProcessed = { ...chatHistory, ticketDeletionStep }; //

    switch (ticketDeletionStep) { //
        case 'idle': //
            if (lowerCaseMessage.includes('supprimer ticket') || lowerCaseMessage.includes('effacer ticket')) { //
                const tickets = await fetchData(Ticket, { deleted_at: null }, 'TCKT_cree_par'); //

                if (!tickets || tickets.length === 0) { //
                    reply = "Il n'y a aucun ticket actif à supprimer pour le moment."; //
                    ticketDeletionStep = 'idle'; //
                    break;
                }

                let ticketListMessage = "Attention, cette action marquera le ticket comme inactif (suppression logique).\nVoici les tickets actifs que vous pouvez supprimer:\n"; //
                tickets.forEach(t => { //
                    const clientName = t.TCKT_cree_par ? t.TCKT_cree_par.CLNT_raison_sociale : (t.TCKT_client || 'N/A'); //
                    ticketListMessage += `- Code: **${t.TCKT_code}**, Client: ${clientName}, Statut: ${t.TCKT_statut}, Desc: ${t.TCKT_description.substring(0, 30)}...\n`; //
                });
                reply = ticketListMessage + "\nVeuillez entrer le code du ticket que vous souhaitez supprimer (ex: TCKT12345) ou tapez 'annuler'."; //
                ticketDeletionStep = 'awaiting_ticket_selection_for_deletion'; //
            } else {
                chatHistoryBeingProcessed = null; //
                return null; //
            }
            break;

        case 'awaiting_ticket_selection_for_deletion': //
            const ticketCodeInput = userMessage.trim().toUpperCase(); //
            const ticket = await Ticket.findOne({ TCKT_code: ticketCodeInput }).lean(); //


            if (!ticket) { //
                reply = `Le ticket avec le code "${ticketCodeInput}" est introuvable. Veuillez vérifier le code parmi la liste fournie ou tapez 'annuler'.`; //
                break;
            }
            if (ticket.deleted_at) { //
                reply = `Le ticket "${ticketCodeInput}" est déjà marqué comme inactif depuis le ${moment(ticket.deleted_at).format('DD/MM/YYYY')}. Aucune action supplémentaire n'est requise. Tapez 'annuler' ou choisissez un autre ticket.`; //
                deletingTicketCode = null; //
                deletingTicketId = null; //
                break;
            }

            deletingTicketCode = ticket.TCKT_code; //
            deletingTicketId = ticket._id; //
            reply = `Êtes-vous sûr de vouloir supprimer (marquer comme inactif) le ticket ${deletingTicketCode} (Description: "${ticket.TCKT_description.substring(0,70).replace(/\n/g, ' ')}...") ? (Oui/Non)`; //
            ticketDeletionStep = 'confirming_deletion'; //
            break;

        case 'confirming_deletion': //
            if (userMessage.toLowerCase() === 'oui') { //
                try {
                    const updatedTicket = await Ticket.findByIdAndUpdate( //
                        deletingTicketId, //
                        { $set: { deleted_at: new Date(), TCKT_statut: 'fermé' } }, //
                        { new: true } //
                    );

                    if (!updatedTicket) { //
                        reply = "Erreur lors de la suppression du ticket."; //
                    } else {
                        reply = `Le ticket ${deletingTicketCode} a été marqué comme inactif (et fermé) avec succès.`; //
                    }
                } catch (error) {
                    console.error("Erreur lors de la suppression logique du ticket via chatbot:", error); //
                    reply = "Une erreur technique est survenue lors de la suppression."; //
                }
            } else {
                reply = "Suppression annulée."; //
            }
            ticketDeletionStep = 'idle'; deletingTicketCode = null; deletingTicketId = null; conversationState = {}; //
            break;
        default:
            reply = "Problème avec l'étape de suppression. Réinitialisation."; //
            ticketDeletionStep = 'idle'; deletingTicketCode = null; deletingTicketId = null; conversationState = {}; //
            break;
    }
    chatHistoryBeingProcessed = null; //
    return {
        reply, //
        updatedHistory: { ticketDeletionStep, deletingTicketCode, deletingTicketId, conversationState } //
    };
};


// ===================================================================================
// ✨ CORRIGÉ : Fonction pour obtenir le nom d'affichage de l'utilisateur
// ===================================================================================
const getUserDisplayName = async (userId, userRole) => { //
    let name = ''; //
    switch (userRole) { //
        case 'CLIENT': //
            const client = await findOneData(Client, { _id: userId }); //
            name = client ? `Notre Client ${client.CLNT_raison_sociale}` : 'Client'; //
            break;
        case 'TECHNICIEN': //
            const technicien = await findOneData(Technicien, { _id: userId }); //
            name = technicien ? `Notre Technicien ${technicien.TECH_nom_prenom.replace(/\s+/g, '_')}` : 'Technicien'; //
            break;
        case 'NORMAL': //
        case 'ADMIN': //
        case 'SUPER_ADMIN': //
            const personnel = await findOneData(Personnel, { _id: userId }); //
            name = personnel ? `Notre Personnel ${personnel.PERS_nom_prenom.replace(/\s+/g, '-')}` : 'Utilisateur'; //
            break;
        default: //
            name = 'Utilisateur'; //
    }
    return name; //
};


// ===================================================================================
// ✅ CONTRÔLEUR PRINCIPAL POUR LE CHATBOT (Logique interne inchangée)
// ===================================================================================
exports.processCommand = async (req, res) => { //
    const { userMessage } = req.body; //

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') { //
        console.error('❌ Erreur de validation: Le message utilisateur est manquant, invalide ou vide.'); //
        return res.status(400).json({ reply: 'Le message utilisateur est requis et doit être une chaîne de caractères non vide.' }); //
    }


    const userId = req.user ? req.user.id : null; //
    const userRole = req.user ? req.user.role : null; //
    const userFonction = req.user ? req.user.fonction : null; //

    if (!userId || !userRole) { //
        return res.status(401).json({ reply: "Veuillez vous connecter pour utiliser le chatbot." }); //
    }

    let reply = "Désolé, je n'ai pas compris votre demande. Pourriez-vous reformuler ou taper 'aide' ?"; //
    let botLink = null; //

    let chatState = await HistoriqueChat.findOne({ userId: userId, onModel: userRole }) //
        .sort({ timestamp: -1 }) //
        .lean(); //

    const defaultState = { //
        conversationState: {}, //
        ticketCreationStep: 'idle', //
        ticketModificationStep: 'idle', //
        modifyingTicketCode: null, //
        modifyingTicketId: null, //
        modifyingField: null, //
        ticketDeletionStep: 'idle', //
        deletingTicketCode: null, //
        deletingTicketId: null, //
    };

    if (!chatState) { //
        chatState = { ...defaultState }; //
    } else {
        chatState = { //
            conversationState: chatState.conversationState || {}, //
            ticketCreationStep: chatState.ticketCreationStep || 'idle', //
            ticketModificationStep: chatState.ticketModificationStep || 'idle', //
            modifyingTicketCode: chatState.modifyingTicketCode || null, //
            modifyingTicketId: chatState.modifyingTicketId || null, //
            modifyingField: chatState.modifyingField || null, //
            ticketDeletionStep: chatState.ticketDeletionStep || 'idle', //
            deletingTicketCode: chatState.deletingTicketCode || null, //
            deletingTicketId: chatState.deletingTicketId || null, //
        };
    }


    const lowerCaseMessage = userMessage.toLowerCase().trim(); //
    const userName = await getUserDisplayName(userId, userRole); //

    let interactionHandled = false; //
    let newChatStateProperties = {}; //

    if (lowerCaseMessage === 'annuler' && //
        chatState.ticketCreationStep === 'idle' && //
        chatState.ticketModificationStep === 'idle' && //
        chatState.ticketDeletionStep === 'idle') { //
        reply = "Aucune opération en cours à annuler. Comment puis-je vous aider ?"; //
        interactionHandled = true; //
    }


    // 1. Logique de création de ticket
    if (!interactionHandled && userRole === 'CLIENT' && (lowerCaseMessage.includes('créer ticket') || lowerCaseMessage.includes('nouveau ticket') || chatState.ticketCreationStep !== 'idle')) { //
        if (lowerCaseMessage === 'annuler' && chatState.ticketCreationStep !== 'idle') { //
            reply = "Création du ticket annulée."; //
            newChatStateProperties = { ticketCreationStep: 'idle', conversationState: {} }; //
            interactionHandled = true; //
        } else {
            const ticketCreationResponse = await handleTicketCreation(userMessage, chatState, userId, userRole, userFonction); //
            if (ticketCreationResponse) { //
                reply = ticketCreationResponse.reply; //
                newChatStateProperties = { //
                    ticketCreationStep: ticketCreationResponse.updatedStep, //
                    conversationState: ticketCreationResponse.updatedState //
                };
                interactionHandled = true; //
            }
        }
    } else if (!interactionHandled && userRole !== 'CLIENT' && chatState.ticketCreationStep !== 'idle') { //
        reply = "La création de ticket est réservée aux clients. Votre session de création a été réinitialisée."; //
        newChatStateProperties = { ticketCreationStep: 'idle', conversationState: {} }; //
    }

    // 2. Logique de modification de ticket
    const modificationPermissions = ['TECHNICIEN', 'ADMIN', 'SUPER_ADMIN']; //
    if (!interactionHandled && modificationPermissions.includes(userRole) && (lowerCaseMessage.includes('modifier ticket') || lowerCaseMessage.includes('changer ticket') || chatState.ticketModificationStep !== 'idle')) { //
        const ticketModificationResponse = await handleTicketModification(userMessage, chatState, userId, userRole); //
        if (ticketModificationResponse) { //
            reply = ticketModificationResponse.reply; //
            newChatStateProperties = { ...newChatStateProperties, ...ticketModificationResponse.updatedHistory }; //
            interactionHandled = true; //
        }
    } else if (!interactionHandled && !modificationPermissions.includes(userRole) && chatState.ticketModificationStep !== 'idle') { //
        reply = "La modification de ticket n'est pas autorisée pour votre rôle. Session de modification réinitialisée."; //
        newChatStateProperties = { ...newChatStateProperties, ticketModificationStep: 'idle', modifyingTicketCode: null, modifyingTicketId: null, modifyingField: null, conversationState: { ...chatState.conversationState, newValue: null, currentAvailableFields: null } }; //
    }

    // 3. Logique de suppression de ticket
    const deletionPermissions = ['ADMIN', 'SUPER_ADMIN']; //
    if (!interactionHandled && deletionPermissions.includes(userRole) && (lowerCaseMessage.includes('supprimer ticket') || lowerCaseMessage.includes('effacer ticket') || chatState.ticketDeletionStep !== 'idle')) { //
        const ticketDeletionResponse = await handleTicketDeletion(userMessage, chatState, userId, userRole); //
        if (ticketDeletionResponse) { //
            reply = ticketDeletionResponse.reply; //
            newChatStateProperties = { ...newChatStateProperties, ...ticketDeletionResponse.updatedHistory }; //
            interactionHandled = true; //
        }
    } else if (!interactionHandled && !deletionPermissions.includes(userRole) && chatState.ticketDeletionStep !== 'idle') { //
        reply = "La suppression de ticket n'est pas autorisée pour votre rôle. Session de suppression réinitialisée."; //
        newChatStateProperties = { ...newChatStateProperties, ticketDeletionStep: 'idle', deletingTicketCode: null, deletingTicketId: null }; //
    }


    // 4. Si aucune interaction complexe, traiter salutations, aide, commandes simples
    if (!interactionHandled) { //
        const resetComplexStates = { //
            ticketCreationStep: 'idle', conversationState: {}, //
            ticketModificationStep: 'idle', modifyingTicketCode: null, modifyingTicketId: null, modifyingField: null, //
            ticketDeletionStep: 'idle', deletingTicketCode: null, deletingTicketId: null //
        };

        if (lowerCaseMessage.includes('bonjour') || lowerCaseMessage.includes('salut') || lowerCaseMessage.includes('hello')) { //
            reply = `Bonjour ${userName.split('_').join(' ')} ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?`; //
            newChatStateProperties = { ...newChatStateProperties, ...resetComplexStates }; //
        } else if (lowerCaseMessage.includes('au revoir') || lowerCaseMessage.includes('bye')) { //
            reply = `Au revoir ${userName.split('_').join(' ')} ! N'hésitez pas si vous avez d'autres questions.`; //
            newChatStateProperties = { ...newChatStateProperties, ...resetComplexStates }; //
        } else if (lowerCaseMessage === 'aide') { //
            let helpMessage = `Bonjour ${userName.split('_').join(' ')} ! Voici ce que je peux faire pour vous :\n`; //
            const allowedCommands = commandRegistry[userRole] || []; //
            allowedCommands.forEach(cmd => { //
                helpMessage += `- ${cmd.keywords[0]} (ex: "${cmd.keywords[0]}")\n`; //
            });
            if (userRole === 'CLIENT') helpMessage += "- Vous pouvez aussi dire 'créer ticket'.\n"; //
            if (modificationPermissions.includes(userRole)) helpMessage += "- Pour modifier un ticket, dites 'modifier ticket'.\n"; //
            if (deletionPermissions.includes(userRole)) helpMessage += "- Pour supprimer un ticket (marquer comme inactif), dites 'supprimer ticket'.\n"; //

            reply = helpMessage; //
            newChatStateProperties = { ...newChatStateProperties, ...resetComplexStates }; //
        } else {
            // Commandes simples
            const commandsForRole = commandRegistry[userRole] || []; //
            let commandFound = false; //

            for (const cmd of commandsForRole) { //
                const matchedKeyword = cmd.keywords.find(keyword => lowerCaseMessage.includes(keyword)); //
                if (matchedKeyword) { //
                    let paramsString = ''; //
                    const keywordIndex = lowerCaseMessage.indexOf(matchedKeyword); //
                    if (keywordIndex !== -1) { //
                        paramsString = userMessage.substring(keywordIndex + matchedKeyword.length).trim(); //
                    }
                    const paramsArray = paramsString ? paramsString.split(' ') : []; //
                    const handlerResponse = await cmd.handler(userId, userRole, userFonction, paramsArray); //

                    if (typeof handlerResponse === 'string') { //
                        reply = handlerResponse; //
                    } else if (typeof handlerResponse === 'object' && handlerResponse.reply) { //
                        reply = handlerResponse.reply; //
                        botLink = handlerResponse.link || null; //
                    }
                    commandFound = true; //
                    newChatStateProperties = { ...newChatStateProperties, ...resetComplexStates }; //
                    break; //
                }
            }
            if (!commandFound && reply === "Désolé, je n'ai pas compris votre demande. Pourriez-vous reformuler ou taper 'aide' ?") { //
                reply = "Désolé, je n'ai pas trouvé de commande correspondante à votre demande. Pourriez-vous reformuler ou taper 'aide' ?"; //
                newChatStateProperties = { ...newChatStateProperties, ...resetComplexStates }; //
            }
        }
    }


    try {
        const finalChatStateToSave = { //
            ...chatState, //
            ...newChatStateProperties, //
            userId: userId, //
            onModel: userRole, //
            userMessage: userMessage, //
            botResponse: reply, //
            botLink: botLink, //
            timestamp: new Date() //
        };
        delete finalChatStateToSave._id; //
        delete finalChatStateToSave.__v; //

        await HistoriqueChat.create(finalChatStateToSave); //
        res.json({ reply: reply, link: botLink }); //

    } catch (error) {
        console.error('❌ Erreur lors du traitement de la commande ou de la sauvegarde de l\'historique:', error); //
        res.status(500).json({ reply: 'Oups ! Une erreur interne est survenue. Mon équipe technique est prévenue.' }); //
    }
};


// ===================================================================================
// ✅ CONTRÔLEUR POUR L'HISTORIQUE (MISE À JOUR POUR INCLURE BOTLINK)
// ===================================================================================
exports.getChatHistory = async (req, res) => { //
    const userId = req.user ? req.user.id : null; //
    const userRole = req.user ? req.user.role : null; //

    if (!userId || !userRole) { //
        return res.status(200).json({ history: [] }); //
    }

    try {
        const historyEntries = await HistoriqueChat.find({ userId: userId, onModel: userRole }) //
            .sort({ timestamp: 1 }) //
            .select('userMessage botResponse timestamp botLink') //
            .lean(); //

        const formattedHistory = []; //
        historyEntries.forEach(entry => { //
            formattedHistory.push({ //
                text: entry.userMessage, //
                sender: 'user', //
                timestamp: entry.timestamp //
            });
            let botMessageObject = { //
                text: entry.botResponse, //
                sender: 'bot', //
                timestamp: entry.timestamp //
            };
            if (entry.botLink && entry.botLink.url && entry.botLink.text) { //
                botMessageObject.link = entry.botLink; //
            }
            formattedHistory.push(botMessageObject); //
        });

        res.json({ history: formattedHistory }); //
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'historique du chat:', error); //
        res.status(500).json({ reply: 'Erreur lors de la récupération de l\'historique du chat.' }); //
    }
};
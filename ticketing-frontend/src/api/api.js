import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // Assure-toi que l'URL est correcte

// 🔹 Configuration d'Axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 🔹 Intercepteur pour ajouter automatiquement le token dans les requêtes
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("📌 Token ajouté :", token);
    } else {
      console.warn("⚠️ Aucun token trouvé dans localStorage");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Gestion des erreurs API
const handleRequest = async (requestFn) => {
  console.log("📡 Envoi de la requête...");
  try {
    const response = await requestFn();
    console.log("✅ Réponse API reçue :", response.data);
    return response.data;  // Retourner bien `response.data` et non `response`
  } catch (error) {
    console.error("❌ Erreur API :", error.response ? error.response.data : error.message);
    throw error;
  }
};


// 🔹 Fonctions API Génériques
// Cette fonction fetchData semble être utilisée pour les requêtes GET sans corps de requête
export const fetchData = async (url) => {
  try {
    // Utilise l'axiosInstance qui a l'intercepteur pour ajouter le token
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error("Erreur fetchData:", error);
    throw error;
  }
};


const postData = (endpoint, data) => handleRequest(() => axiosInstance.post(endpoint, data));


const putData = (endpoint, data) => handleRequest(() => axiosInstance.put(endpoint, data));



const deleteData = (endpoint) => handleRequest(() => axiosInstance.delete(endpoint));

// ✅ **API Authentification**
export const login = (credentials) => postData("/auth/login", credentials);
export const getProfile = () => fetchData("/auth/me");//pour le Personnel


export const registerFaceApi = (userId, faceDescriptor) => {
  console.log('--- DEBUG FRONTEND: registerFaceApi - AVANT ENVOI ---');
  console.log('Frontend userId (original):', userId);
  console.log('Frontend faceDescriptor (original Float32Array):', faceDescriptor);
  console.log('Frontend faceDescriptor TYPE (original):', typeof faceDescriptor);
  console.log('Is Frontend faceDescriptor an Array (original)? :', Array.isArray(faceDescriptor));

  // ✅ MODIFICATION ICI : Assurer que chaque élément est un nombre primitif
  const descriptorToSend = Array.from(faceDescriptor).map(Number); // <-- MODIFIÉ

  console.log('Frontend descriptorToSend (après Array.from().map(Number)):', descriptorToSend);
  console.log('Frontend descriptorToSend TYPE (après Array.from().map(Number)):', typeof descriptorToSend);
  console.log('Is Frontend descriptorToSend an Array (après Array.from().map(Number))? :', Array.isArray(descriptorToSend));
  console.log('----------------------------------------------------');

  return postData("/auth/register-face", {
    userId,
    faceDescriptor: descriptorToSend,
  });
};

/**
 * Tente de connecter un utilisateur via son descripteur facial.
 * @param {string} email - L'email de l'utilisateur (pour le retrouver sur le backend).
 * @param {Float32Array} liveFaceDescriptor - Le descripteur facial capturé en temps réel.
 */
export const loginFaceApi = (email, liveFaceDescriptor) => {
  // Vous pouvez ajouter des logs similaires ici pour déboguer loginFaceApi si nécessaire
  return postData("/auth/login-face", {
    email,
    liveFaceDescriptor: Array.from(liveFaceDescriptor).map(Number), // <-- MODIFIÉ
  });
};
// -------------------------------------------------------------



// ✅ **API Mot de Passe Oublié**
export const forgotPassword = (email) => postData("/auth/forgot-password", { email });

// ✅ **API Réinitialisation du Mot de Passe**
export const resetPassword = (token, newPassword) => postData(`/auth/reset-password/${token}`, { newPassword });


// ✅ **API Clients**
export const createClient = (clientData) => postData("/clients/", clientData);
export const getClients = () => fetchData("/clients/");
export const getClientProfile = () => fetchData("/clients/me");
export const updateClientProfile = (clientData) => putData("/clients/me", clientData);
export const updateClient = (clientId, clientData) => putData(`/clients/${clientId}`, clientData);
export const updateClientStatus = (clientId) => putData(`/clients/${clientId}/status`, {});
export const deleteClient = (clientId) => deleteData(`/clients/${clientId}`);


// ✅ **API Commentaires**
export const createCommentaire = (commentData) => postData("/commentaires", commentData);  // Ajouter un commentaire
export const getAllCommentaires = () => fetchData("/commentaires");  // Récupérer tous les commentaires (Admin)
export const getCommentairesByTicketCode = (code) => fetchData(`/commentaires/byCode/${code}`);  // Récupérer commentaires par code de ticket
export const getCommentairesByTicket = (ticketId) => fetchData(`/commentaires/${ticketId}`);  // Récupérer commentaires par ticket ID

export const updateCommentaire = (commentId, commentData) => putData(`/commentaires/${commentId}`, commentData);  // Mettre à jour un commentaire

export const deleteCommentaire = (commentId) => deleteData(`/commentaires/${commentId}`);  // Supprimer un commentaire



// ✅ **API Équipements**
export const createEquipment = (equipmentData) => postData("/equipments/", equipmentData);
export const getEquipments = () => fetchData("/equipments/");
export const getEquipmentById = (equipmentId) => fetchData(`/equipments/${equipmentId}`);

export const getEquipmentsByClientCode= (clientCode) => fetchData(`equipments/client/code/${clientCode}`);

export const getEquipmentsByTechnician = () => fetchData("/equipments/technicien/assigned");


export const updateEquipment = (equipmentId, equipmentData) => putData(`/equipments/${equipmentId}`, equipmentData);
export const deleteEquipment = (equipmentId) => deleteData(`/equipments/${equipmentId}`);

// ✅ **API Interventions**
export const createIntervention = (interventionData) => postData("/interventions/", interventionData);
export const getInterventions = () => fetchData("/interventions/");
export const getInterventionById = (interventionId) => fetchData(`/interventions/${interventionId}`);
export const getInterventionsByTechnicien = (technicienId) => fetchData(`/interventions/technicien/${technicienId}`);

export const updateIntervention = (interventionId, interventionData) => putData(`/interventions/${interventionId}`, interventionData);
export const deleteIntervention = (interventionId) => deleteData(`/interventions/${interventionId}`);

// ✅ **API Notifications**

export const createNotification = (notificationData) => postData("/notifications/", notificationData);
export const getAllNotifications = () => fetchData("/notifications/");

export const getUserNotifications = (userId) => fetchData(`/notifications/${userId}`);
export const updateNotification = (notificationId, notificationData) => putData(`/notifications/${notificationId}`, notificationData);
export const deleteNotification = (notificationId) => deleteData(`/notifications/${notificationId}`);
export const getNotificationStats = (days = 30) => fetchData(`/notifications/stats?days=${days}`);


// ✅ **API Personnel**
export const createPersonnel = (personnelData) => postData("/personnels/", personnelData);

export const getPersonnels = () => fetchData("/personnels/");

export const getPersonnelById = (personnelId) => fetchData(`/personnels/${personnelId}`);
export const updatePersonnel = (personnelId, personnelData) => putData(`/personnels/${personnelId}`, personnelData);
export const updatePersonnelProfile = (profileData) => putData("/personnels/profile", profileData);
export const deletePersonnel = (personnelId) => deleteData(`/personnels/${personnelId}`);


// ✅ **API Statistiques**
export const getStats = () => fetchData("/stats/");
export const getStatsTechnicien = (technicienId) => fetchData(`/stats/technicien/${technicienId}`);
export const getStatsClient = (clientId) => fetchData(`/stats/client/${clientId}`);

export const getTechnicianProgress = (technicianId) => fetchData(`/stats/techniciens/${technicianId}/progression`);
export const getTechnicianPerformance = (technicianId) => fetchData(`/stats/techniciens/${technicienId}/performance`);
// Note: Si getTicketStatsByDate doit prendre des dates en paramètres,
// la fonction API ici devrait aussi les prendre et les ajouter à l'URL.
// Exemple : export const getTicketStatsByDate = (startDate, endDate) => fetchData(`/stats/tickets/date-range?startDate=${startDate}&endDate=${endDate}`);
export const getTicketStatsByDate = () => fetchData("/stats/tickets/date-range");

export const getClientTicketStats = () => fetchData("/stats/clients/tickets"); // Nombre de tickets par client (tous)
export const getEfficiencyIndicators = () => fetchData("/stats/indicateurs-performance"); // Indicateurs d'efficacité globaux

// 🆕 Nouvelle fonction : Temps total passé sur les interventions par chaque technicien (tous les techniciens)
// Appelle le nouvel endpoint backend /api/stats/techniciens/total-time-all
export const getTotalTimePerTechnician = () => fetchData("/stats/techniciens/total-time-all");


// 🆕 Nouvelle fonction : Durée moyenne des tickets par chaque client (tous les clients)
// Appelle le nouvel endpoint backend /api/stats/clients/average-ticket-duration-all
export const getAverageTicketDurationPerClient = () => fetchData("/stats/clients/average-ticket-duration-all");

export const getInvoiceOverview = () => fetchData("/stats/invoices-overview");


export const getInvoicesOverviewByClient = () => fetchData("/stats/clients-invoices-overview");


// ✅ **API Techniciens**
export const getTechnicianProfile = () => fetchData("/techniciens/me");
export const updateTechnicianProfile = (profileData) => putData("/techniciens/me", profileData);
export const getTechnicians = () => fetchData("/techniciens/");
export const getTechnicianById = (technicianId) => fetchData(`/techniciens/${technicianId}`);
export const updateTechnician = (technicianId, technicianData) => putData(`/techniciens/${technicianId}`, technicianData);
export const createTechnician = (technicianData) => postData("/techniciens/", technicianData);
export const deleteTechnician = (technicianId) => deleteData(`/techniciens/${technicianId}`);


// ✅ **API Tickets**
export const createTicket = (ticketData) => postData("/tickets/", ticketData);
export const getTicketsByClientId = (clientId) => fetchData(`/tickets/client/${clientId}`);


// New function to get technicians by ticket code
export const getTechniciensByTicketCode = (ticketCode) => fetchData(`/tickets/code/${ticketCode}/techniciens`);

export const getTicketById = (ticketId) => fetchData(`/tickets/${ticketId}`);

export const getTickets = () => fetchData("/tickets/");

export const getTicketsByTechnician = (technicianId) => fetchData(`/tickets/technicien/${technicianId}`);

export const addTicketToSprint = async (ticketId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/sprint`, { // Route correcte : /tickets/:id/sprint
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // Aucun sprintId à envoyer ici
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de l'ajout du ticket au sprint");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur dans addTicketToSprint:", error);
    throw error;
  }
};


export const updateTicket = (ticketId, ticketData) => putData(`/tickets/${ticketId}`, ticketData);

export const assignTicketToTechnicians = (ticketId,technicianId) => putData(`/tickets/${ticketId}/assign`,{technicianId});

export const updateTicketStatus = (ticketId, status) => putData(`/tickets/${ticketId}/status`, { status });

export const deleteTicket = (ticketId) => deleteData(`/tickets/${ticketId}`);

// ✅ **API Types d'Équipements**
export const createTypeEquipment = (data) => postData("/type-equipments/", data);
export const getTypeEquipments = () => fetchData("/type-equipments/");
export const updateTypeEquipment = (id, data) => putData(`/type-equipments/${id}`, data);
export const deleteTypeEquipment = (id) => deleteData(`/type-equipments/${id}`);

// ✅ **API Types de Pannes**
export const createTypePanne = (data) => postData("/types-pannes/", data);
export const getTypePannes = () => fetchData("/types-pannes/");
export const getTypesPannesByEquipmentType = (codeEquipment) => fetchData(`/types-pannes/by-equipment-code/${equipmentTypeCode}`);
export const getTypePanneById = (id) => fetchData(`/types-pannes/${id}`);
export const updateTypePanne = (id, data) => putData(`/types-pannes/${id}`, data);
export const deleteTypePanne = (id) => deleteData(`/types-pannes/${id}`);



// ✅ **API Rapports Financiers**
export const getRapportsFinanciers = () => fetchData("/rapports-financiers/");
export const createRapportFinancier = (data) => postData("/rapports-financiers/", data);
export const updateRapportFinancier = (id, data) => putData(`/rapports-financiers/${id}`, data);
export const deleteRapportFinancier = (id) => deleteData(`/rapports-financiers/${id}`);

// ✅ **API Historique des Transactions**
export const getTransactionsHistorique = () => fetchData("/transactions-historique/");
export const createTransaction = (data) => postData("/transactions-historique/", data);
export const updateTransaction = (id, data) => putData(`/transactions-historique/${id}`, data);
export const deleteTransaction = (id) => deleteData(`/transactions-historique/${id}`);


// ✅ **API Gestion des Budgets**
export const getBudgets = () => fetchData("/budgets/");
export const createBudget = (data) => postData("/budgets/", data);
export const updateBudget = (budgetId, data) => putData(`/budgets/${budgetId}`, data);
export const deleteBudget = (budgetId) => deleteData(`/budgets/${budgetId}`);


// ✅ **API Suivi des Performances**
export const getSuiviPerformances = () => fetchData("/performances/");
export const getPerformanceByUserConnecte = () => fetchData("/performances/me");
export const createSuiviPerformance = (data) => postData("/performances/", data);
export const updateSuiviPerformance = (id, data) => putData(`/performances/${id}`, data);
export const deleteSuiviPerformance = (id) => deleteData(`/performances/${id}`);


// ✅ **API Recrutement**
export const getRecrutement = () => fetchData("/recrutement/");
export const createRecrutement = (data) => postData("/recrutement/", data);
export const updateRecrutement = (id, data) => putData(`/recrutement/${id}`, data);
export const deleteRecrutement = (id) => deleteData(`/recrutement/${id}`);

//  ** API Reviews :
export const getReviews = () => fetchData("/reviews/");
export const createReview = (data) => postData("/reviews/", data);
export const updateReview = (id, data) => putData(`/reviews/${id}`, data);
export const deleteReview = (id) => deleteData(`/reviews/${id}`);


// ✅ **API Factures**
export const createFacture = (factureData) => postData("/factures/", factureData);
export const getFactures = () => fetchData("/factures/");
export const getFactureById = (factureId) => fetchData(`/factures/${factureId}`);
export const getFacturesByClientId = (clientId) => fetchData(`/factures/client/${clientId}`);
export const updateFacture = (factureId, factureData) => putData(`/factures/${factureId}`, factureData);
export const deleteFacture = (factureId) => deleteData(`/factures/${factureId}`);


// SECTION AJOUTÉE POUR LE CHATBOT
/**
 * Envoie un message au chatbot et récupère sa réponse.
 * @param {string} message - Le message de l'utilisateur.
 * @param {string} userId - L'ID de l'utilisateur connecté (Client, Technicien, Personnel).
 * @param {string} userType - Le type de l'utilisateur ('Client', 'Technicien', 'Personnel').
 * @returns {Promise<Object>} La réponse du chatbot (ex: { reply: "..." }).
 */
export const sendUserMessageToChatbot = (message, userId, userType) => {
  return postData("/chatbot/message", {
    userMessage: message, // 🚨 CORRECTION MAJEURE ICI : La clé doit être 'userMessage'
    userId, // Ces deux-là sont toujours envoyés mais pas strictement nécessaires si le backend les extrait du token
    userType, // Le backend devrait idéalement utiliser req.user pour userId et userRole
  });
};


// MODIFICATION DE getChatHistory
export const getChatHistory = async () => {
  // fetchData utilise axiosInstance qui ajoute déjà le token
  // et utilise API_BASE_URL.
  try {
    const responseData = await fetchData("/chatbot/history");
    // Le contrôleur backend renvoie { history: formattedHistory }
    // fetchData retourne response.data, donc responseData ici est { history: [...] }
    return responseData.history; // On retourne directement le tableau des messages
  } catch (error) {
    // L'erreur aura déjà été logguée par fetchData.
    // On la relance pour que le composant appelant puisse la gérer (par exemple, afficher un message à l'utilisateur).
    console.error('Erreur lors de la récupération de l\'historique du chat:', error);
    throw error;
  }
};


export default axiosInstance;
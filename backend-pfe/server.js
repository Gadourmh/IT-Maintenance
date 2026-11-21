const express = require("express");
const http = require("http");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const cron = require("node-cron");
const moment = require("moment");
const Technicien = require("./models/Technicien");
const Equipment = require("./models/Equipment");
const Notification = require("./models/Notification");
const { sendEmail } = require("./services/emailService");
const { updateTechnicianAvailability, rotateTechnicianShifts } = require("./services/technicienServices");
const { setupAlerts } = require('./services/alertService'); // 
const path = require("path");
const { loadFaceApiModels } = require('./utils/faceRecognitionUtils');


// 🔥 Configurer Moment.js en français
moment.locale("fr");

// 🔹 Charger les variables d'environnement
dotenv.config();

// 🔹 Connexion à la base de données
connectDB();

// Chargez les modèles Face-API au démarrage du serveur
loadFaceApiModels();

// Initialiser les alertes pour les tickets (techniciens et admins)
setupAlerts(); // 👈 NOUVELLE LIGNE

// 🔹 Initialiser Express
const app = express();

// 🔹 Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(morgan("dev"));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const PORT = process.env.PORT || 5000;
const server = http.createServer(app);




// 🔹 Importation des routes
const clientRoutes = require("./routes/clientRoutes");
const technicienRoutes = require("./routes/technicienRoutes");
const personnelRoutes = require("./routes/personnelRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const interventionRoutes = require("./routes/interventionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const commentaireRoutes = require("./routes/commentaireRoutes");
const authRoutes = require("./routes/authRoutes");
const typePanneRoutes = require("./routes/typePanneRoutes");
const typeEquipmentRoutes = require("./routes/typeEquipmentRoutes"); 
const statsRoutes = require("./routes/statsRoutes");
// 🆕 Importation de la route du chatbot
const chatbotRoutes = require("./routes/chatbotRoutes"); 




// 🔹 Importation des routes supplémentaires
const rapportFinancierRoutes = require("./routes/rapportFinancierRoutes"); 
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const recrutementRoutes = require("./routes/recrutementRoutes");

// routes pour les avis :
const avisRoutes = require('./routes/avisRoutes'); 

//routes pour les factures
const factureRoutes = require ("./routes/factureRoutes.js")


// 🔹 Définition des routes API
app.get("/", (req, res) => {
  res.send("Bienvenue sur l'API de gestion de tickets !");
});

app.use("/api/clients", clientRoutes);
app.use("/api/techniciens", technicienRoutes);
app.use("/api/personnels", personnelRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/interventions", interventionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/commentaires", commentaireRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/types-pannes", typePanneRoutes);
app.use("/api/type-equipments", typeEquipmentRoutes);
app.use("/api/stats", statsRoutes);

// 🆕 Définition de la route API pour le chatbot
app.use("/api/chatbot", chatbotRoutes); 

app.use("/api/rapports-financiers", rapportFinancierRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/performances", performanceRoutes);
app.use("/api/recrutements", recrutementRoutes);
app.use("/api/avis", avisRoutes); 


app.use("/api/factures", factureRoutes);

// ✅ **Mise à jour automatique de la disponibilité des techniciens**
cron.schedule("*/5 * * * *", async () => {
  console.log("⏳ Vérification et mise à jour de la disponibilité des techniciens...");
  await updateTechnicianAvailability();
  console.log("✅ Disponibilités mises à jour !");
});

// ✅ **Rotation automatique des équipes chaque semaine**
cron.schedule("0 0 * * 0", async () => { 
  console.log("🔄 Rotation automatique des shifts des techniciens...");
  await rotateTechnicianShifts();
  console.log("✅ Rotation des shifts effectuée !");
});



// Créer une tâche cron pour la maintenance automatique
cron.schedule("0 0 * * *", async () => {
  console.log("🔍 Vérification des équipements nécessitant une maintenance...");

  const today = new Date();
  const équipements = await Equipment.find();

  équipements.forEach(async (equip) => {
    const prochainEntretien = new Date(equip.EQPT_derniere_date_Maintenance);
    prochainEntretien.setMonth(prochainEntretien.getMonth() + 6);

    // Vérifier si l'équipement nécessite une maintenance
    if (prochainEntretien <= today) {
      // Envoi d'un email de rappel
      await sendEmail(equip.EQPT_client_email, "Maintenance Préventive", "Votre équipement nécessite une maintenance.");

      // Création de la notification pour les administrateurs et techniciens concernés
      const notificationsPromises = [];

      // On envoie la notification à chaque administrateur, technicien ou super_admin
      const usersToNotify = await Technicien.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN', 'TECHNICIEN'] } });
      usersToNotify.forEach(user => {
        const notificationMessage = `L'équipement ${equip.EQPT_code} nécessite une maintenance préventive.`;

        notificationsPromises.push(
          new Notification({
            NOTF_user: user.name,
            NOTF_userId: user._id,
            NOTF_userType: user.role,
            NOTF_type: "email",
            NOTF_message: notificationMessage
          }).save()
        );
      });

      // Attendre que toutes les notifications soient créées
      await Promise.all(notificationsPromises);
      console.log(`✅ Notifications envoyées pour l'équipement ${equip.EQPT_code}`);
    }
  });

  console.log("✅ Vérification de maintenance terminée.");
});




server.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`⚠️ Le port ${PORT} est déjà utilisé. Tentative avec un autre port...`);
    const newPort = PORT + 1;
    server.listen(newPort, () => {
      console.log(`✅ Serveur relancé sur le port ${newPort}`);
    });
  } else {
    console.error("❌ Erreur serveur :", err);
  }
});
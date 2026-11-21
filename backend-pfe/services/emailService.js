const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Vérifier la connexion SMTP
transporter.verify(function (error, success) {
  if (error) {
    console.error("Erreur de connexion SMTP :", error);
  } else {
    console.log("Serveur SMTP prêt à envoyer des emails !");
  }
});

/**
 * Fonction pour envoyer un email.
 * @param {string} to - Le destinataire de l'email.
 * @param {string} subject - Le sujet de l'email.
 * @param {string} text - La version texte brut de l'email (pour la compatibilité).
 * @param {string} html - La version HTML de l'email pour une mise en forme riche.
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: `Solution Ticketing <${process.env.EMAIL_USER}>`, // Expéditeur amélioré
      to, //
      subject, //
      text, //
      html, // Ajout du contenu HTML
    });
    console.log(`Email envoyé à ${to}`); //
  } catch (error) {
    console.error("Erreur envoi email:", error); //
    throw error; //
  }
};

module.exports = { sendEmail };
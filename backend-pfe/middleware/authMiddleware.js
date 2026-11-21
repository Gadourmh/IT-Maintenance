const jwt = require("jsonwebtoken");
const Personnel = require("../models/Personnel");
const Technicien = require("../models/Technicien");
const Client = require("../models/Client");

// ✅ Middleware pour vérifier le token JWT
const protect = async (req, res, next) => {
  try {
    console.log("📌 Headers reçus :", req.headers); // Afficher tous les headers reçus

    const authHeader = req.header("Authorization");
    if (!authHeader) {
      console.error("❌ Aucun header Authorization trouvé");
      return res.status(401).json({ message: "Accès non autorisé, header manquant" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.error("❌ Format du header Authorization incorrect :", authHeader);
      return res.status(401).json({ message: "Format du token invalide" });
    }

    const token = authHeader.split(" ")[1];
    console.log("📌 Token extrait :", token);

    if (!token) {
      console.error("❌ Aucun token trouvé dans Authorization");
      return res.status(401).json({ message: "Accès non autorisé, token manquant" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error("❌ Erreur lors de la vérification du token :", error.message);
      return res.status(401).json({ message: "Token invalide ou expiré" });
    }

    console.log("🔑 Token décodé :", decoded);

    if (!decoded.id) {
      console.error("❌ Token invalide : ID utilisateur manquant");
      return res.status(401).json({ message: "Token invalide, ID utilisateur manquant." });
    }

    // Recherche de l'utilisateur dans les différentes collections
    let user = await Personnel.findById(decoded.id).select("-PERS_mot_passe");
    if (!user) {
      user = await Technicien.findById(decoded.id).select("-TECH_mot_passe");
    }
    if (!user) {
      user = await Client.findById(decoded.id).select("-CLNT_mot_passe");
    }

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé pour l'ID : ${decoded.id}`);
      return res.status(401).json({ message: "Utilisateur non trouvé." });
    }

    // Vérification du statut du client si nécessaire
    if (user.CLNT_statut && user.CLNT_statut === "bloqué") {
      return res.status(403).json({ message: "Accès interdit, votre compte est bloqué." });
    }

    // Ajout de l'utilisateur à la requête
    req.user = {
      id: user._id,
      role: user.PERS_role_acces || (user.TECH_specialite ? "TECHNICIEN" : "CLIENT"),
      fonction: user.PERS_fonction || null,
    };

    console.log("🔐 Utilisateur connecté :", req.user);

    next(); // Passer à la suite de la route
  } catch (error) {
    console.error("❌ Erreur inattendue lors de l'authentification :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ✅ Middleware pour restreindre l'accès à certains rôles
// Exemple de la fonction authorize
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    next();
  };
};


// ✅ Vérifier si le client est bloqué
const protectClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    if (client.CLNT_statut === "bloqué") {
      return res.status(403).json({ message: "Accès interdit, votre compte est bloqué." });
    }

    next();
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du statut client :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Vérifier si le client lié à un équipement existe
const checkClientValidity = async (req, res, next) => {
  const clientCode = req.body.EQPT_CLNT_code || req.params.EQPT_CLNT_code;

  try {
    const client = await Client.findOne({ CLNT_code: clientCode });

    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    if (client.CLNT_statut === "bloqué") {
      return res.status(400).json({ message: "Client bloqué, impossible d'ajouter l'équipement" });
    }

    next();
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du client :", error);
    return res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = { protect, authorize, protectClient, checkClientValidity };


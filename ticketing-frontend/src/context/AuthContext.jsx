import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // MODIFICATION : Ajout de l'état pour le token
  const [token, setToken] = useState(null); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token"); // Renommé pour éviter confusion
    const storedUser = localStorage.getItem("user");

    console.log("🔍 Token récupéré :", storedToken);
    console.log("🔍 Utilisateur récupéré :", storedUser);

    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
      // MODIFICATION : Mettre à jour l'état du token lors de l'initialisation
      setToken(storedToken); 
    }
    setLoading(false);
  }, []);
  

  const login = async (arg1, arg2) => {
    let currentToken, currentUser; // Renommés pour éviter confusion
    let errorMessage = "Échec de connexion. Vérifiez vos identifiants.";

    try {
      if (typeof arg1 === 'string' && typeof arg2 === 'string') {
        const email = arg1;
        const mot_passe = arg2;
        console.log("Tentative de connexion par email/mot de passe...");
        const response = await axios.post("http://localhost:5000/api/auth/login", { email, mot_passe });
        currentToken = response.data.token;
        currentUser = response.data.user;
        
        if (response.data.message) {
            errorMessage = response.data.message;
        }

      } 
      else if (typeof arg1 === 'string' && typeof arg2 === 'object' && arg2 !== null && typeof arg2.role === 'string') {
        currentToken = arg1;
        currentUser = arg2;
        console.log("Connexion via token et utilisateur pré-authentifiés (ex: reconnaissance faciale)...");
      } 
      else {
        console.error("Arguments invalides pour la fonction login:", arg1, arg2);
        errorMessage = "Arguments de connexion invalides.";
        return { success: false, message: errorMessage };
      }

      if (!currentUser) { // Utilisation de currentUser
        return { success: false, message: "Informations utilisateur invalides après connexion." };
      }

      if (currentUser.role === "CLIENT" && currentUser.statut === "bloqué") { // Utilisation de currentUser
        console.warn("⚠️ Tentative de connexion d'un compte client bloqué :", currentUser.email);
        return { success: false, message: "Votre compte est bloqué. Veuillez contacter l'administrateur." };
      }

      localStorage.setItem("token", currentToken);
      localStorage.setItem("user", JSON.stringify(currentUser));
      setUser(currentUser);
      // MODIFICATION : Mettre à jour l'état du token lors de la connexion
      setToken(currentToken); 

      console.log("🔹 Utilisateur connecté :", currentUser);

      const role = currentUser.role; // Utilisation de currentUser
      const fonction = currentUser.fonction; // Utilisation de currentUser

      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        navigate("/dashboard");
      } else if (role === "TECHNICIEN") {
        navigate("/dashboard-technicien");
      } else if (role === "CLIENT") {
        navigate("/dashboard-client");
      } else if (role === "NORMAL") {
        switch (fonction) {
          case "CHEF_SERVICE":
            navigate("/dashboard-chef-service");
            break;
          case "RESPONSABLE_MAINTENANCE":
            navigate("/dashboard-responsable-maintenance");
            break;
          case "GESTIONNAIRE_TICKETS":
            navigate("/dashboard-gestionnaire-tickets");
            break;
          case "SECRÉTAIRE":
            navigate("/dashboard-secretaire");
            break;
          case "COMPTABLE":
            navigate("/dashboard-comptable");
            break;
          case "RH":
            navigate("/dashboard-rh");
            break;
          case "SUPPORT_CLIENT":
            navigate("/dashboard-support-client");
            break;
          default:
            navigate("/");
            break;
        }
      } else {
        navigate("/");
      }

      return { success: true, user: currentUser }; // Retourner currentUser
    } catch (error) {
      console.error("❌ Erreur de connexion :", error.response?.data || error.message);

      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else {
        errorMessage = error.message || "Échec de connexion. Vérifiez vos identifiants.";
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // MODIFICATION : Effacer l'état du token lors de la déconnexion
    setToken(null); 
    navigate("/login");
  };

  return (
    // MODIFICATION : Fournir le 'token' via le contexte
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user }}> 
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
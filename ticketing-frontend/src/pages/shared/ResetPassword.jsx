import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  TextField, Button, Typography, Box, Card, CardContent,
  InputAdornment, IconButton
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { resetPassword } from "../../api/api";

const ResetPassword = () => {
  const { token } = useParams(); // 🔑 Récupère le token depuis l'URL
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Définir les contraintes pour affichage dans le front-end
  const passwordConstraints = [
    "Au moins 8 caractères.",
    // Décommenter si vous avez ajouté la complexité dans le backend
    // "Doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.",
    // Ajoutez d'autres règles ici si nécessaire
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setMessage(""); // Clear previous messages

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    // Optionnel : Vous pouvez ajouter une validation front-end de base ici
    // pour donner un feedback instantané avant même d'envoyer au backend.
    // Cependant, la validation backend est la source de vérité.
    // if (newPassword.length < 8) {
    //   setError("Le mot de passe est trop court.");
    //   return;
    // }
    // ... autres vérifications front-end ...


    try {
      await resetPassword(token, newPassword);
      setMessage("Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.");
      setTimeout(() => navigate("/login"), 3000); // Redirection après 3 sec
    } catch (err) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", err);
      // ✨ MODIFICATION ICI : Afficher le message d'erreur spécifique du backend ✨
      // Si l'erreur vient de l'API (contenant response.data.message), afficher ce message
      // Sinon, afficher un message d'erreur générique.
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message); // Message d'erreur du backend (ex: "Le mot de passe doit contenir au moins 8 caractères.")
      } else {
        setError("Une erreur est survenue lors de la réinitialisation du mot de passe."); // Message générique
      }
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      sx={{ backgroundColor: "#f4f6f8", p: 2 }}
    >
      <Card sx={{ width: 400, p: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
            Réinitialiser le mot de passe
          </Typography>

          {message && (
            <Typography color="success.main" align="center" sx={{ mb: 2 }}>
              {message}
            </Typography>
          )}
          {error && (
            // Afficher l'erreur spécifique (backend ou front-end)
            <Typography color="error" align="center" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Nouveau mot de passe"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* ✨ AFFICHAGE DES CONTRAINTES SOUS LE CHAMP ✨ */}
            {passwordConstraints.map((constraint, index) => (
              <Typography variant="caption" color="textSecondary" key={index} sx={{ display: 'block', mt: index === 0 ? 0.5 : 0 }}>
                • {constraint}
              </Typography>
            ))}


            <TextField
              label="Confirmer le mot de passe"
              type={showPassword ? "text" : "password"} // Utilise également showPassword pour confirmer
              fullWidth
              margin="normal"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
               InputProps={{ // Ajouter l'icône Œil aussi au champ de confirmation
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
             {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                    Les mots de passe ne correspondent pas.
                </Typography>
             )}


            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3, py: 1.5, fontWeight: "bold", textTransform: "none" }} // Ajustement mt pour espacement
              disabled={newPassword !== confirmPassword} // Désactiver si les mots de passe ne correspondent pas
            >
              Réinitialiser
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPassword;
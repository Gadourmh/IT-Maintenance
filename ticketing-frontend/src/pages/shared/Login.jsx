import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  TextField, Button, Typography, Box, IconButton, InputAdornment, Link, Dialog, DialogActions, DialogContent, DialogTitle,
  useTheme,
  styled,
  Grid,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  CircularProgress 
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonOutline from "@mui/icons-material/PersonOutline";
import LockOutlined from "@mui/icons-material/LockOutlined";

import Swal from "sweetalert2";
import { forgotPassword, loginFaceApi } from "../../api/api"; 
import { motion } from "framer-motion";

import Footer from "../../components/layout/Footer";
import FaceAuthScanner from '../../components/auth/FaceAuthScanner'; 


const BackgroundBox = styled(Box)(({ theme, ismobile }) => ({
    width: '100vw',
    minHeight: '100vh',
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#1a364b',
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/assets/images/image.jpg')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: ismobile ? 'scroll' : 'fixed',
    padding: 0,
    margin: 0,
    overflow: 'auto',
    boxSizing: 'border-box',
}));

const Login = () => {
  const [email, setEmail] = useState("");
  const [mot_passe, setMotPasse] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { login ,isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [faceScannerLoading, setFaceScannerLoading] = useState(false);
  const [faceScanMessage, setFaceScanMessage] = useState('');



useEffect(() => {
    if (isAuthenticated && user) {
      let dashboardPath = "/";
      switch (user.role) {
        case "ADMIN":
        case "SUPER_ADMIN":
          dashboardPath = "/dashboard";
          break;
        case "TECHNICIEN":
          dashboardPath = "/dashboard-technicien";
          break;
        case "CLIENT":
          dashboardPath = "/dashboard-client";
          break;
        case "NORMAL":
          // La propriété est parfois 'fonction' et parfois 'PERS_fonction', j'utilise 'PERS_fonction' comme dans votre exemple.
          switch (user.PERS_fonction || user.fonction) {
            case "CHEF_SERVICE":
              dashboardPath = "/dashboard-chef-service";
              break;
            case "RESPONSABLE_MAINTENANCE":
              dashboardPath = "/dashboard-responsable-maintenance";
              break;
            case "GESTIONNAIRE_TICKETS":
              dashboardPath = "/dashboard-GestionnaireTickets";
              break;
            case "SECRÉTAIRE":
              dashboardPath = "/dashboard-Secretaire";
              break;
            case "COMPTABLE":
              dashboardPath = "/dashboard-Comptable";
              break;
            case "RH":
              dashboardPath = "/dashboard-Rh";
              break;
            case "SUPPORT_CLIENT":
              dashboardPath = "/dashboard-SupportClient";
              break;
            default:
              dashboardPath = "/dashboard-normal-default";
              break;
          }
          break;
        default:
          dashboardPath = "/";
      }
      navigate(dashboardPath, { replace: true }); 
    }
  }, [isAuthenticated, user, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    Swal.fire({
        title: 'Connexion en cours...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

    const result = await login(email, mot_passe);
    Swal.close();

    if (!result.success) {
      setError(result.message || "Échec de connexion. Vérifiez vos identifiants.");
        Swal.fire({
          icon: 'error',
          title: 'Erreur de connexion',
          text: result.message || 'Vérifiez votre email et mot de passe.',
          confirmButtonColor: theme.palette.error.main,
        });
    }
  };

  const handleForgotPassword = async () => {
      if (!forgotPasswordEmail) {
          Swal.fire({
            icon: 'warning',
            title: 'Email manquant',
            text: 'Veuillez entrer votre adresse email.',
            confirmButtonColor: theme.palette.warning.main,
           });
          return;
      }

    try {
         Swal.fire({
            title: 'Envoi en cours...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
           });
       await forgotPassword(forgotPasswordEmail);
       setIsDialogOpen(false);
       setForgotPasswordEmail("");
       setError("");

       Swal.fire({
         icon: 'success',
         title: 'Lien envoyé !',
         text: '📩 Un lien de réinitialisation a été envoyé à votre adresse email.',
         confirmButtonColor: theme.palette.success.main,
       });
    } catch (err) {
        Swal.close();
      setError("Erreur lors de l'envoi de l'email de récupération.");
      console.error("Erreur récupération mot de passe:", err);

      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: err.response?.data?.message || 'Une erreur est survenue lors de l’envoi de l’email.',
        confirmButtonColor: theme.palette.error.main,
      });
    }
  };

 
  const handleFaceLoginClick = () => {
   
    if (!email) {
      Swal.fire({
        icon: 'warning',
        title: 'Email requis',
        text: 'Veuillez d\'abord entrer votre adresse email pour la connexion faciale.',
        confirmButtonColor: theme.palette.warning.main,
      });
      return;
    }
    setShowFaceScanner(true);
    setFaceScanMessage('Chargement du scanner facial...');
  };

  const handleFaceDetected = async (descriptor) => {
    if (!descriptor) {
      setFaceScanMessage('Détection faciale échouée. Veuillez réessayer.');
      setError('Détection faciale échouée.');
      return;
    }

    setFaceScanMessage('Visage détecté, tentative de connexion...');
    setError(''); // Clear previous error

    Swal.fire({
        title: 'Connexion faciale en cours...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
      const data = await loginFaceApi(email, descriptor);
      login(data.token, data.user); 
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: 'Connexion réussie !',
        text: data.message || 'Vous êtes connecté par reconnaissance faciale.',
        confirmButtonColor: theme.palette.success.main,
      });
      navigate('/dashboard'); 
    } catch (err) {
      Swal.close();
      const errorMessage = err.response?.data?.message || 'Reconnaissance faciale échouée. Veuillez réessayer.';
      setFaceScanMessage(errorMessage); 
      setError(errorMessage);
      Swal.fire({
        icon: 'error',
        title: 'Échec de connexion faciale',
        text: errorMessage,
        confirmButtonColor: theme.palette.error.main,
      });
      // Optionnel: cacher le scanner après une erreur pour que l'utilisateur puisse resaisir
      // setShowFaceScanner(false);
    } finally {
        setFaceScannerLoading(false); // Assurez-vous que l'état de chargement est toujours réinitialisé
    }
  };

  const handleFaceScannerError = (errorMessage) => {
    setFaceScanMessage(`Erreur du scanner facial: ${errorMessage}`);
    setError(`Erreur: ${errorMessage}`);
    setFaceScannerLoading(false);
    setShowFaceScanner(false); // Cacher le scanner en cas d'erreur critique
    Swal.fire({
      icon: 'error',
      title: 'Erreur Caméra',
      text: `Impossible d'accéder à la caméra: ${errorMessage}`,
      confirmButtonColor: theme.palette.error.main,
    });
  };

  const handleFaceScannerLoading = (isLoading) => {
    setFaceScannerLoading(isLoading);
    if (isLoading) {
      setFaceScanMessage('Chargement des modèles...');
    } else {
      setFaceScanMessage('Scanner prêt. Veuillez positionner votre visage.');
    }
  };
  // ----------------------------------------------------


  return (
    <BackgroundBox ismobile={isMobile ? 1 : 0}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
             width: '90%',
             maxWidth: 400,
             padding: isMobile ? theme.spacing(3) : theme.spacing(4),
             backgroundColor: 'rgba(0, 0, 0, 0.5)',
             borderRadius: theme.shape.borderRadius * 1,
             boxShadow: theme.shadows[3],
             boxSizing: 'border-box',
             textAlign: 'center',
             flexShrink: 0,
             margin: 'auto auto',
        }}
      >
            <Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
              sx={{
                  color: theme.palette.common.white,
                  mb: isMobile ? 0.5 : 1,
                  textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                  fontSize: isMobile ? '2rem' : 'h4.fontSize'
                }}
            >
              Bienvenue !
            </Typography>
              <Typography variant="h6" component="p"
                  sx={{
                      color: theme.palette.common.white,
                      mb: isMobile ? theme.spacing(2) : theme.spacing(4),
                      textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                      fontSize: isMobile ? '1rem' : 'h6.fontSize'
                  }}
              >
                Aujourd'hui sera génial.
              </Typography>

            {error && (
              <Typography
                    color="error"
                    align="center"
                    variant="body2"
                    sx={{ mt: isMobile ? theme.spacing(0.5) : theme.spacing(1), mb: isMobile ? theme.spacing(1) : theme.spacing(2), textShadow: '1px 1px 3px rgba(0,0,0,0.8)', fontSize: isMobile ? '0.8rem' : 'body2.fontSize' }}
                >
                {error}
              </Typography>
            )}

            {/* --- AFFICHAGE CONDITIONNEL DU SCANNER OU DU FORMULAIRE --- */}
            {showFaceScanner ? (
                <Box mt={2}>
                    {faceScannerLoading && (
                        <Box display="flex" justifyContent="center" alignItems="center" my={2}>
                            <CircularProgress size={24} sx={{ color: theme.palette.common.white }} />
                            <Typography variant="body2" sx={{ ml: 1, color: theme.palette.common.white }}>
                                {faceScanMessage}
                            </Typography>
                        </Box>
                    )}
                    {!faceScannerLoading && (
                         <Typography variant="body2" sx={{ my: 2, color: theme.palette.common.white, fontWeight: 'bold' }}>
                            {faceScanMessage}
                         </Typography>
                    )}
                    <FaceAuthScanner
                        onFaceDetected={handleFaceDetected}
                        onError={handleFaceScannerError}
                        onLoading={handleFaceScannerLoading}
                    />
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setShowFaceScanner(false)}
                        sx={{ mt: 2, color: theme.palette.common.white, borderColor: theme.palette.common.white }}
                    >
                        Retour à la connexion par mot de passe
                    </Button>
                </Box>
            ) : (
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                    margin="normal"
                    autoComplete="email"
                    variant="outlined"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <PersonOutline sx={{ color: theme.palette.common.white, fontSize: isMobile ? 20 : 24 }} />
                            </InputAdornment>
                        ),
                        sx: {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: theme.shape.borderRadius,
                            '& fieldset': { borderColor: theme.palette.grey[500] },
                            '&:hover fieldset': { borderColor: theme.palette.common.white },
                            '&.Mui-focused fieldset': { borderColor: theme.palette.common.white, borderWidth: '2px !important' },
                        }
                    }}
                    InputLabelProps={{
                        sx: { color: theme.palette.common.white }
                    }}
                    sx={{
                        '& .MuiInputBase-input': { color: theme.palette.common.white },
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                                borderColor: theme.palette.common.white,
                            },
                        },
                        mb: isMobile ? 1 : 2
                    }}
                />
                <TextField
                    label="Mot de passe"
                    type={showPassword ? "text" : "password"}
                    value={mot_passe}
                    onChange={(e) => setMotPasse(e.target.value)}
                    required
                    fullWidth
                    margin="normal"
                    autoComplete="current-password"
                    variant="outlined"
                    InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <LockOutlined sx={{ color: theme.palette.common.white, fontSize: isMobile ? 20 : 24 }} />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                        <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            sx={{ color: theme.palette.common.white }}
                        >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                    </InputAdornment>
                    ),
                    sx: {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: theme.shape.borderRadius,
                            '& fieldset': { borderColor: theme.palette.grey[500] },
                            '&:hover fieldset': { borderColor: theme.palette.common.white },
                            '&.Mui-focused fieldset': { borderColor: theme.palette.common.white, borderWidth: '2px !important' },
                        }
                    }}
                    InputLabelProps={{
                        sx: { color: theme.palette.common.white }
                    }}
                    sx={{
                        '& .MuiInputBase-input': { color: theme.palette.common.white },
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                                borderColor: theme.palette.common.white,
                            },
                        },
                        mb: isMobile ? 0 : 0
                    }}
                />
                <Grid container justifyContent="space-between" alignItems="center" sx={{ mt: 0.5, mb: isMobile ? 1.5 : 2 }}>
                    <Grid item>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    sx={{ color: theme.palette.grey[400], '&.Mui-checked': { color: theme.palette.common.white } }}
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ color: theme.palette.common.white, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                                    Remember me
                                </Typography>
                            }
                        />
                    </Grid>
                    <Grid item>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => setIsDialogOpen(true)}
                            sx={{
                                color: theme.palette.common.white,
                                textDecorationColor: theme.palette.common.white,
                                '&:hover': { textDecorationColor: 'transparent' },
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                            }}
                        >
                            Mot de passe oublié?
                        </Link>
                    </Grid>
                </Grid>
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                        mt: isMobile ? 2 : 3,
                        mb: isMobile ? 1 : 2,
                        backgroundColor: theme.palette.success.main,
                        color: theme.palette.common.white,
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.9rem' : '1.1rem',
                        padding: isMobile ? '10px 0' : '12px 0',
                        '&:hover': {
                            backgroundColor: theme.palette.success.dark,
                            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
                        },
                        borderRadius: theme.shape.borderRadius,
                    }}
                >
                   Connecter
                </Button>
                <Button
                    type="button" // Important: change to button type
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleFaceLoginClick}
                    sx={{
                        mt: isMobile ? 1 : 2,
                        mb: isMobile ? 1 : 2,
                        backgroundColor: theme.palette.info.main, // Utilisez une couleur distinctive
                        color: theme.palette.common.white,
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.9rem' : '1.1rem',
                        padding: isMobile ? '10px 0' : '12px 0',
                        '&:hover': {
                            backgroundColor: theme.palette.info.dark,
                            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
                        },
                        borderRadius: theme.shape.borderRadius,
                    }}
                >
                    Connexion par visage
                </Button>
                </form>
            )}
            {/* --------------------------------------------------- */}
            </Box>
            {/* Pas de "Don't have an account?" car le login est seulement pour les users existants. */}
            {/* Vous pouvez ajouter d'autres éléments si nécessaire */}
      </motion.div>

      {/* Boîte de dialogue pour le mot de passe oublié */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}
          PaperProps={{
            style: {
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[5],
              padding: theme.spacing(2),
              borderRadius: theme.shape.borderRadius * 2,
            },
          }}
      >
        <DialogTitle sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>J'ai oublié mon mot de passe </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Enter your email"
            type="email"
            fullWidth
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          {error && <Typography color="error" variant="body2" sx={{ mb: 1 }}>{error}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} sx={{ color: theme.palette.grey[600] }}>Annuler</Button>
          <Button onClick={handleForgotPassword} variant="contained" sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.common.white }}>Send Reset Link</Button>
        </DialogActions>
      </Dialog>

      {/* Footer en bas de page */}
      <Box sx={{ mt: 'auto', width: '100%', flexShrink: 0 }}>
          <Footer />
      </Box>
    </BackgroundBox>
  );
};

export default Login;
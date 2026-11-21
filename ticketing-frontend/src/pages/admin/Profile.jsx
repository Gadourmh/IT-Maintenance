import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Paper, Typography, Grid, Avatar, TextField, Button,
  Box, Divider, IconButton, Snackbar, Alert, InputAdornment, CircularProgress,
  useTheme
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { blue, grey, red, green } from "@mui/material/colors";
import { useAuth } from '../../context/AuthContext';
import { registerFaceApi } from '../../api/api'; // Import de registerFaceApi
import FaceAuthScanner from '../../components/auth/FaceAuthScanner'; // Import du composant FaceAuthScanner


const Profile = () => {
  const { user } = useAuth();
  const [profil, setProfil] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    PERS_nom_prenom: '',
    PERS_email: '',
    PERS_telephone: '',
    PERS_fonction: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    PERS_photo_profil: null,
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(true);

  const theme = useTheme(); // Pour utiliser le thème MUI

  // --- NOUVEAUX ÉTATS POUR L'ENREGISTREMENT FACIAL ---
  const [showFaceEnrollment, setShowFaceEnrollment] = useState(false);
  const [faceEnrollmentLoading, setFaceEnrollmentLoading] = useState(false);
  const [faceEnrollmentMessage, setFaceEnrollmentMessage] = useState('');
  // ----------------------------------------------------


  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Utilisation de l'API centralisée si possible, sinon axios direct
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      setProfil(data);

      setFormData({
        PERS_nom_prenom: data.nom_prenom || '',
        PERS_email: data.email || '',
        PERS_telephone: data.telephone || '',
        PERS_fonction: data.fonction || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        PERS_photo_profil: data.photo_profil || null,
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      setNotification({ open: true, message: 'Erreur lors de la récupération du profil', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, PERS_photo_profil: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setNotification({ open: true, message: 'Les nouveaux mots de passe et la confirmation ne correspondent pas', severity: 'error' });
      return;
    }

     if (!formData.PERS_nom_prenom || !formData.PERS_email) {
       setNotification({ open: true, message: 'Nom et Email sont obligatoires.', severity: 'error' });
       return;
     }

    try {
      const token = localStorage.getItem('token');
      const url = 'http://localhost:5000/api/personnels/profile';

      const data = {
        PERS_nom_prenom: formData.PERS_nom_prenom,
        PERS_telephone: formData.PERS_telephone,
        PERS_email: formData.PERS_email,
        PERS_photo_profil: formData.PERS_photo_profil,
      };

      if (formData.oldPassword && formData.newPassword) {
        data.oldPassword = formData.oldPassword;
        data.newPassword = formData.newPassword;
        data.confirmNewPassword = formData.confirmPassword;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };

      await axios.put(url, data, config);

      setNotification({ open: true, message: 'Profil mis à jour avec succès', severity: 'success' });
      setEditMode(false);
      fetchProfile();

    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      setNotification({ open: true, message: error.response?.data?.message || "Une erreur s'est produite lors de la mise à jour du profil.", severity: 'error' });
    }
  };

  const handleClickShowPassword = (field) => {
    if (field === 'old') setShowOldPassword(!showOldPassword);
    else if (field === 'new') setShowNewPassword(!showNewPassword);
    else if (field === 'confirm') setShowConfirmPassword(!showConfirmPassword);
  };

   const handleSnackClose = (event, reason) => {
     if (reason === 'clickaway') {
       return;
     }
     setNotification({ ...notification, open: false });
   };

   const getSnackbarSeverity = useMemo(() => {
     if (notification.message.includes("Erreur") || notification.message.includes("Échec") || notification.message.includes("Impossible") || notification.message.includes("obligatoires") || notification.message.includes("invalide") || notification.severity === 'error') {
       return "error";
     } else if (notification.message.includes("succès") || notification.severity === 'success') {
       return "success";
     } else if (notification.message.includes("Attention") || notification.message.includes("Veuillez") || notification.severity === 'warning') {
       return "warning";
     }
     return notification.severity || "info";
   }, [notification.message, notification.severity]);


  // --- NOUVELLES FONCTIONS POUR L'ENREGISTREMENT FACIAL ---
  const handleEnrollFaceClick = () => {
    if (!user || !user._id) {
        setNotification({ open: true, message: 'ID utilisateur non disponible. Veuillez vous reconnecter.', severity: 'error' });
        return;
    }
    setShowFaceEnrollment(true);
    setFaceEnrollmentMessage('Prêt à enregistrer votre visage. Veuillez vous positionner face à la caméra.');
  };

  const handleFaceDetectedForEnrollment = async (descriptor) => {
    if (!descriptor) {
      setFaceEnrollmentMessage('Détection faciale échouée. Veuillez réessayer.');
      setNotification({ open: true, message: 'Détection faciale échouée. Veuillez réessayer.', severity: 'error' });
      return;
    }

    setFaceEnrollmentMessage('Visage détecté, enregistrement en cours...');
    setNotification({ open: true, message: 'Enregistrement du visage en cours...', severity: 'info' });

    try {
      // user._id est l'ID de l'utilisateur connecté
      await registerFaceApi(user._id, descriptor);
      setFaceEnrollmentMessage('Visage enregistré avec succès !');
      setNotification({ open: true, message: 'Visage enregistré avec succès !', severity: 'success' });
      setShowFaceEnrollment(false); // Cacher le scanner après un enregistrement réussi
      fetchProfile(); // Recharger le profil pour mettre à jour l'état (si `faceDescriptor` est exposé)
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'enregistrement du visage.';
      setFaceEnrollmentMessage(errorMessage);
      setNotification({ open: true, message: errorMessage, severity: 'error' });
    } finally {
        setFaceEnrollmentLoading(false); // Assurez-vous que l'état de chargement est toujours réinitialisé
    }
  };

  const handleFaceScannerError = (errorMessage) => {
    setFaceEnrollmentMessage(`Erreur du scanner facial: ${errorMessage}`);
    setNotification({ open: true, message: `Erreur du scanner facial: ${errorMessage}`, severity: 'error' });
    setFaceEnrollmentLoading(false);
    setShowFaceEnrollment(false); // Cacher le scanner en cas d'erreur critique
  };

  const handleFaceScannerLoading = (isLoading) => {
    setFaceEnrollmentLoading(isLoading);
    if (isLoading) {
      setFaceEnrollmentMessage('Chargement des modèles...');
    } else {
      setFaceEnrollmentMessage('Scanner prêt. Veuillez positionner votre visage.');
    }
  };
  // ----------------------------------------------------


  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profil && !loading) {
    return (
      <Typography variant="h6" color="error" textAlign="center" mt={4}>
        Impossible de charger le profil.
      </Typography>
    );
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: "#f0f2f5", minHeight: "100vh" }}>

      <Paper elevation={6} sx={{ padding: 4, maxWidth: 800, margin: 'auto', borderRadius: 2, boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)' }}>

        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} sm={4} display="flex" flexDirection="column" alignItems="center">
            <Avatar
              src={formData.PERS_photo_profil}
              sx={{ width: 120, height: 120, bgcolor: blue[500], border: '3px solid #fff', boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)' }}
            >
               {!formData.PERS_photo_profil && <PersonIcon sx={{ fontSize: 70, color: grey[100] }} />}
            </Avatar>

            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              style={{ display: 'none' }}
              id="upload-photo-personnel"
              disabled={!editMode}
            />
            <label htmlFor="upload-photo-personnel">
              <Button
                component="span"
                variant="outlined"
                size="small"
                sx={{ marginTop: 2, borderRadius: 2, textTransform: 'none', borderColor: blue[500], color: blue[700], '&:hover': { borderColor: blue[700], backgroundColor: blue[50] } }}
                disabled={!editMode}
              >
                Choisir une photo
              </Button>
            </label>
          </Grid>

          <Grid item xs={12} sm={8}>
            <Typography variant="h4" gutterBottom sx={{ color: blue[900], fontWeight: 'bold' }}>
              Mon Profil Personnel
            </Typography>

            {[
              { label: 'Nom et Prénom', name: 'PERS_nom_prenom' },
              { label: 'Email', name: 'PERS_email' },
              { label: 'Téléphone', name: 'PERS_telephone' },
            ].map(({ label, name }) => (
              <Box mb={2} key={name}>
                 {editMode ? (
                   <TextField
                     fullWidth
                     label={label}
                     name={name}
                     value={formData[name]}
                     onChange={handleInputChange}
                     variant="outlined"
                     size="small"
                     InputLabelProps={{ shrink: true }}
                   />
                 ) : (
                   <>
                     <Typography variant="body2" sx={{ fontWeight: 'bold', color: grey[700] }}>{label}:</Typography>
                     <Typography variant="body1" sx={{ color: grey[900] }}>{formData[name] || 'Non spécifié'}</Typography>
                   </>
                 )}
               </Box>
            ))}

            <Box mb={2}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: grey[700] }}>Rôle:</Typography>
              <Typography variant="body1" sx={{ color: grey[900] }}>{user?.role || 'Non défini'}</Typography>
            </Box>

             <Box mb={2}>
               {editMode ? (
                  <TextField
                     fullWidth
                     label="Fonction"
                     name="PERS_fonction"
                     value={formData.PERS_fonction}
                     onChange={handleInputChange}
                     variant="outlined"
                     size="small"
                     InputLabelProps={{ shrink: true }}
                     disabled
                   />
               ) : (
                 <>
                   <Typography variant="body2" sx={{ fontWeight: 'bold', color: grey[700] }}>Fonction:</Typography>
                   <Typography variant="body1" sx={{ color: grey[900] }}>{formData.PERS_fonction || 'Non spécifiée'}</Typography>
                 </>
               )}
             </Box>


            <Divider sx={{ margin: '20px 0', borderColor: grey[400] }} />

            {/* --- NOUVELLE SECTION POUR L'ENREGISTREMENT FACIAL --- */}
            <Typography variant="h6" gutterBottom sx={{ color: blue[900], fontWeight: 'bold', mt: 3 }}>
                Authentification Faciale
            </Typography>

            {!showFaceEnrollment ? (
                <Button
                    variant="contained"
                    onClick={handleEnrollFaceClick}
                    sx={{
                        mt: 1,
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': { backgroundColor: theme.palette.primary.dark },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 'bold'
                    }}
                >
                    {profil?.faceDescriptor?.length > 0 ? 'Mettre à jour mon visage' : 'Enregistrer mon visage pour la connexion'}
                </Button>
            ) : (
                <Box mt={2} textAlign="center">
                    {faceEnrollmentLoading && (
                        <Box display="flex" justifyContent="center" alignItems="center" my={2}>
                            <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
                            <Typography variant="body2" sx={{ ml: 1, color: grey[700] }}>
                                {faceEnrollmentMessage}
                            </Typography>
                        </Box>
                    )}
                    {!faceEnrollmentLoading && (
                        <Typography variant="body2" sx={{ my: 2, color: grey[700], fontWeight: 'bold' }}>
                            {faceEnrollmentMessage}
                        </Typography>
                    )}
                    <FaceAuthScanner
                        onFaceDetected={handleFaceDetectedForEnrollment}
                        onError={handleFaceScannerError}
                        onLoading={handleFaceScannerLoading}
                    />
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setShowFaceEnrollment(false)}
                        sx={{ mt: 2, borderRadius: 2, textTransform: 'none', borderColor: red[500], color: red[700] }}
                    >
                        Annuler l'enregistrement facial
                    </Button>
                </Box>
            )}
            <Divider sx={{ margin: '20px 0', borderColor: grey[400] }} />
            {/* ---------------------------------------------------- */}

            {editMode && (
              <>
                <Typography variant="h6" gutterBottom sx={{ color: blue[900], fontWeight: 'bold' }}>Changer le mot de passe</Typography>
                {[
                  { label: 'Ancien mot de passe', name: 'oldPassword', show: showOldPassword, toggle: () => handleClickShowPassword('old') },
                  { label: 'Nouveau mot de passe', name: 'newPassword', show: showNewPassword, toggle: () => handleClickShowPassword('new') },
                  { label: 'Confirmer le mot de passe', name: 'confirmPassword', show: showConfirmPassword, toggle: () => handleClickShowPassword('confirm') },
                ].map(({ label, name, show, toggle }) => (
                  <TextField
                    key={name}
                    fullWidth
                    type={show ? 'text' : 'password'}
                    label={label}
                    name={name}
                    value={formData[name]}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                    size="small"
                     InputProps={{
                       endAdornment: (
                         <InputAdornment position="end">
                           <IconButton
                             aria-label="toggle password visibility"
                             onClick={toggle}
                             edge="end"
                           >
                             {show ? <VisibilityOff /> : <Visibility />}
                           </IconButton>
                         </InputAdornment>
                       ),
                     }}
                  />
                ))}
              </>
            )}

            <Box mt={3} display="flex" justifyContent="flex-end">
              {editMode ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{ mr: 1, backgroundColor: green[600], '&:hover': { backgroundColor: green[800] }, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                  >
                    Sauvegarder
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                       setEditMode(false);
                       fetchProfile();
                     }}
                    color="secondary"
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', borderColor: red[500], color: red[700], '&:hover': { borderColor: red[700], backgroundColor: red[50] } }}
                  >
                    Annuler
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setEditMode(true)}
                  sx={{ backgroundColor: blue[600], '&:hover': { backgroundColor: blue[800] }, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                >
                  Passer en mode édition
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

       <Snackbar
         open={notification.open}
         autoHideDuration={6000}
         onClose={handleSnackClose}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
       >
         <Alert
           onClose={handleSnackClose}
           severity={getSnackbarSeverity}
           variant="filled"
           sx={{ width: '100%' }}
         >
           {notification.message}
         </Alert>
       </Snackbar>

    </Box>
  );
};

export default Profile;
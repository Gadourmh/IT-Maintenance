import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  InputLabel,
  FormControl,
  Typography,
  Grid,
  IconButton,
  Menu,
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { blue, grey, indigo } from "@mui/material/colors";
import api from "../../api/api";

const GestionPersonnel = () => {
  const [personnels, setPersonnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [form, setForm] = useState({
    PERS_nom_prenom: "",
    PERS_email: "",
    PERS_mot_passe: "",
    PERS_telephone: "",
    PERS_fonction: "GESTIONNAIRE_TICKETS",
    PERS_role_acces: "NORMAL",
    PERS_photo_profil: "",
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  // Initialize userRole from localStorage for immediate access
  // Cela aide à afficher le bon état dès le premier rendu avant l'appel API
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");

  // États pour les filtres
  const [filtreNomPrenom, setFiltreNomPrenom] = useState("");
  const [filtreEmail, setFiltreEmail] = useState("");
  const [filtreFonction, setFiltreFonction] = useState("");
  const [filtreRoleAcces, setFiltreRoleAcces] = useState("");

  // États pour le menu d'actions de la table
  const [anchorEl, setAnchorEl] = useState(null);
  // CORRECTION ICI : Utilisation de useState(null)
  const [selectedPersonnelForMenu, setSelectedPersonnelForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Listes possibles pour les Selects de filtre
  const fonctionsPossibles = ["CHEF_SERVICE", "RESPONSABLE_MAINTENANCE", "GESTIONNAIRE_TICKETS", "SECRÉTAIRE", "COMPTABLE", "RH", "SUPPORT_CLIENT"];
  const rolesAccesPossibles = ["ADMIN", "SUPER_ADMIN", "NORMAL"];


  useEffect(() => {
    fetchPersonnels();
    fetchUserRole(); // Fetch the role from API to confirm/update
  }, []);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("token"); // Récupère le token
      const config = { headers: { Authorization: `Bearer ${token}` } }; // Ajoute le token aux headers
      const { data } = await api.get("/auth/me", config); // Utilise la config avec le token

      // Utilisation de data.role comme convenu précédemment
      setUserRole(data.role);
      localStorage.setItem("role", data.role); // Met à jour localStorage avec la bonne propriété

      console.log("Role fetched from API:", data.role); // Log de débogage
    } catch (error) {
      console.error("Erreur lors de la récupération du rôle de l'utilisateur", error.response?.data || error);
      // Fallback: If API fails, try to use what's in localStorage, or default to "NORMAL"
      const storedRole = localStorage.getItem("role");
      setUserRole(storedRole || "NORMAL");
      console.log("Role fallback (from localStorage or default):", storedRole || "NORMAL"); // Log de débogage
    }
  };

  const fetchPersonnels = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token"); // Récupère le token pour les personnels
      const config = { headers: { Authorization: `Bearer ${token}` } }; // Ajoute le token aux headers
      // Assurez-vous que votre backend renvoie les champs failedLoginAttempts, lockUntil, deleted_at
      const { data } = await api.get("/personnels", config); // Utilise la config avec le token
      setPersonnels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erreur lors du chargement des personnels", error.response?.data || error.message);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Échec du chargement des personnels.",
        severity: "error",
      });
      setPersonnels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (personnel) => {
    if (personnel) {
      setForm({
        PERS_nom_prenom: personnel.PERS_nom_prenom || "",
        PERS_email: personnel.PERS_email || "",
        PERS_mot_passe: "", // Ne pas afficher l'ancien mot de passe
        PERS_telephone: personnel.PERS_telephone || "",
        PERS_fonction: personnel.PERS_fonction || "GESTIONNAIRE_TICKETS",
        PERS_role_acces: personnel.PERS_role_acces || "NORMAL", // Assurez-vous que cette propriété correspond à votre backend si elle est utilisée dans le formulaire
        PERS_photo_profil: personnel.PERS_photo_profil || "",
      });
      setSelectedPersonnel(personnel);
    } else {
      setForm({
        PERS_nom_prenom: "",
        PERS_email: "",
        PERS_mot_passe: "",
        PERS_telephone: "",
        PERS_fonction: "GESTIONNAIRE_TICKETS",
        PERS_role_acces: "NORMAL", // Assurez-vous que cette propriété correspond à votre backend si elle est utilisée dans le formulaire
        PERS_photo_profil: "",
      });
      setSelectedPersonnel(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPersonnel(null);
    setForm({
      PERS_nom_prenom: "",
      PERS_email: "",
      PERS_mot_passe: "",
      PERS_telephone: "",
      PERS_fonction: "GESTIONNAIRE_TICKETS",
      PERS_role_acces: "NORMAL",
      PERS_photo_profil: "",
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Validation basique
     if (!form.PERS_nom_prenom || !form.PERS_email || (!selectedPersonnel && !form.PERS_mot_passe) || !form.PERS_telephone || !form.PERS_fonction || !form.PERS_role_acces) {
        setSnackbar({ open: true, message: "Veuillez remplir tous les champs obligatoires.", severity: "error" });
        return;
      }

    try {
      const dataToSend = { ...form };

       if (selectedPersonnel) {
         delete dataToSend.PERS_email; // Email should not be changed on update
         if (dataToSend.PERS_mot_passe === "") {
           delete dataToSend.PERS_mot_passe; // Don't send empty password if not changed
         }
       }
       // Note: Pour la création, la validation du mot de passe est gérée par le backend normalement,
       // mais votre code frontend ajoute une validation ici. Je la laisse.
       if (!selectedPersonnel && !dataToSend.PERS_mot_passe) {
           setSnackbar({ open: true, message: "Le mot de passe est obligatoire pour la création.", severity: "error" });
           return;
       }


      const token = localStorage.getItem("token"); // Récupère le token
      const config = { headers: { Authorization: `Bearer ${token}` } }; // Ajoute le token aux headers

      if (selectedPersonnel) {
        await api.put(`/personnels/${selectedPersonnel._id}`, dataToSend, config); // Utilise la config
        setSnackbar({ open: true, message: "Personnel modifié avec succès!", severity: "success" });
      } else {
        await api.post("/personnels", dataToSend, config); // Utilise la config
        setSnackbar({ open: true, message: "Personnel ajouté avec succès!", severity: "success" });
      }
      fetchPersonnels();
      handleCloseDialog();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la sauvegarde.";
      console.error("Erreur lors de la sauvegarde du personnel", error.response?.data || error);
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedPersonnel || !selectedPersonnel._id) {
        setSnackbar({ open: true, message: "Aucun personnel sélectionné pour la suppression.", severity: "error" });
        setOpenDeleteDialog(false);
        return;
      }
      const token = localStorage.getItem("token"); // Récupère le token
      const config = { headers: { Authorization: `Bearer ${token}` } }; // Ajoute le token aux headers
      // Ici, selon votre implémentation backend, c'est soit une suppression douce (UPDATE deleted_at)
      // soit une suppression physique (DELETE). Le code actuel fait un DELETE.
      // Si vous voulez une suppression douce, vous devrez modifier cette requête pour un PUT
      // envoyant l'ID et la date de suppression, et adapter votre backend.
      await api.delete(`/personnels/${selectedPersonnel._id}`, config); // Utilise la config
      setSnackbar({ open: true, message: "Personnel supprimé avec succès!", severity: "success" });
      fetchPersonnels();
      setOpenDeleteDialog(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erreur lors de la suppression.";
      console.error("Erreur lors de la suppression du personnel", error.response?.data || error);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      setOpenDeleteDialog(false);
    }
  };

  const handleOpenDeleteDialog = (personnel) => {
    setSelectedPersonnel(personnel);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Fonctions pour gérer le menu d'actions de la table
  const handleMenuOpen = (event, personnel) => {
    setAnchorEl(event.currentTarget);
    setSelectedPersonnelForMenu(personnel);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPersonnelForMenu(null);
  };

  // Logique de filtrage
  const filteredPersonnels = useMemo(() => {
    if (!Array.isArray(personnels)) return [];
    // Par défaut, on n'affiche pas les personnels "soft-deleted" (où deleted_at est non-NULL)
    // Si vous voulez afficher les personnels supprimés, retirez la condition `!pers.deleted_at`
    return personnels.filter((pers) => {
      const nomPrenomMatch = filtreNomPrenom === "" || (pers.PERS_nom_prenom && pers.PERS_nom_prenom.toLowerCase().includes(filtreNomPrenom.toLowerCase()));
      const emailMatch = filtreEmail === "" || (pers.PERS_email && pers.PERS_email.toLowerCase().includes(filtreEmail.toLowerCase()));
      const fonctionMatch = filtreFonction === "" || (pers.PERS_fonction && pers.PERS_fonction === filtreFonction);
      const roleAccesMatch = filtreRoleAcces === "" || (pers.PERS_role_acces && pers.PERS_role_acces === filtreRoleAcces);
      // Ajoutez la condition pour exclure les personnels soft-deleted si deleted_at est présent
      const notDeleted = pers.deleted_at === undefined || pers.deleted_at === null;


      return nomPrenomMatch && emailMatch && fonctionMatch && roleAccesMatch && notDeleted;
    });
  }, [personnels, filtreNomPrenom, filtreEmail, filtreFonction, filtreRoleAcces]);

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFiltreNomPrenom("");
    setFiltreEmail("");
    setFiltreFonction("");
    setFiltreRoleAcces("");
  };

  // Fonction utilitaire pour formater les dates
  const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
          const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
          return new Date(dateString).toLocaleDateString(undefined, options);
      } catch (error) {
          console.error("Erreur de formatage de date:", dateString, error);
          return 'Date invalide';
      }
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // Debugging: Log the user role before render
  console.log("Current userRole before render:", userRole);
  console.log("Condition for Add button (userRole !== 'ADMIN'):", userRole !== "ADMIN");


  return (
    <Box sx={{ padding: "20px", backgroundColor: grey[50], borderRadius: "8px" }}>
      <Typography variant="h4" color={indigo[900]} align="center" gutterBottom>
        Gestion des Personnels
      </Typography>

      {/* Section Filtres */}
      <Paper sx={{ padding: 2, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: grey[800] }}>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Nom & Prénom"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreNomPrenom}
              onChange={(e) => setFiltreNomPrenom(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Email"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreEmail}
              onChange={(e) => setFiltreEmail(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Fonction</InputLabel>
              <Select
                value={filtreFonction}
                label="Fonction"
                onChange={(e) => setFiltreFonction(e.target.value)}
              >
                <MenuItem value=""><em>Toutes</em></MenuItem>
                {fonctionsPossibles.map((fonction) => (
                  <MenuItem key={fonction} value={fonction}>{fonction}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Rôle d'Accès</InputLabel>
              <Select
                value={filtreRoleAcces}
                label="Rôle d'Accès"
                onChange={(e) => setFiltreRoleAcces(e.target.value)}
              >
                <MenuItem value=""><em>Tous</em></MenuItem>
                {rolesAccesPossibles.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="outlined" onClick={resetFilters} fullWidth>
              Réinitialiser Filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box display="flex" justifyContent="flex-end" mb={3}>
        {/* Afficher le bouton "Ajouter un Personnel" si le rôle n'est PAS ADMIN */}
        {userRole !== "ADMIN" && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog(null)}
            sx={{
              transition: "all 0.3s ease",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            Ajouter un Personnel
          </Button>
        )}
      </Box>


        <TableContainer component={Paper} sx={{ marginTop: 2 }} maxWidth="lg">
          <Table sx={{ minWidth: 650 }} aria-label="personnel table">
            <TableHead sx={{ backgroundColor: grey[200] }}>
              <TableRow>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Id</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Photo</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Nom & Prénom</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Téléphone</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Fonction</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Rôle d'Accès</TableCell>
                 {/* NOUVEAU : Colonnes pour les champs supplémentaires - insérées ici */}
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Tentatives échouées</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Bloqué jusqu'à</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Supprimé le</TableCell>
                {/* Masquer la colonne "Actions" si le rôle est ADMIN */}
                {userRole !== "ADMIN" && (
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPersonnels.length > 0 ? (
                filteredPersonnels.map((pers, index) => (
                  <TableRow
                    key={pers._id}
                    sx={{
                      "&:nth-of-type(odd)": {
                        backgroundColor: grey[100],
                      },
                      "&:hover": {
                        backgroundColor: grey[300],
                      },
                      cursor: "pointer",
                       // Optionnel : mettre une couleur de fond différente pour les utilisateurs supprimés
                      backgroundColor: pers.deleted_at ? grey[300] : 'inherit',
                    }}
                  >
                    <TableCell sx={{ fontSize: '0.8rem' }}>{pers._id}</TableCell>
                   <TableCell>
                       {pers.PERS_photo_profil ? (
                           pers.PERS_photo_profil.startsWith('data:image/') ? (
                               <img
                                   src={pers.PERS_photo_profil}
                                   alt={`Photo de ${pers.PERS_nom_prenom || 'personnel'}`}
                                   style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '5px' }}
                               />
                           ) : (
                                // Assurez-vous que l'URL est correcte pour accéder aux images depuis votre backend
                                <img
                                    src={`http://localhost:5000/${pers.PERS_photo_profil.replace(/\\/g, '/')}`}
                                    alt={`Photo de ${pers.PERS_nom_prenom || 'personnel'}`}
                                    style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '5px' }}
                                />
                           )
                       ) : (
                           <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>Pas de photo</Typography>
                       )}
                   </TableCell>
                    <TableCell>{pers.PERS_nom_prenom || 'N/A'}</TableCell>
                    <TableCell>{pers.PERS_email || 'N/A'}</TableCell>
                    <TableCell>{pers.PERS_telephone || 'N/A'}</TableCell>
                    <TableCell>{pers.PERS_fonction || 'N/A'}</TableCell>
                    <TableCell>{pers.PERS_role_acces || 'N/A'}</TableCell>
                    {/* NOUVEAU : Cellules pour les champs supplémentaires - insérées ici */}
                    <TableCell>{pers.failedLoginAttempts !== undefined ? pers.failedLoginAttempts : 'N/A'}</TableCell>
                    <TableCell>{pers.lockUntil ? formatDate(pers.lockUntil) : 'Jamais'}</TableCell>
                    <TableCell>{pers.deleted_at ? formatDate(pers.deleted_at) : 'Actif'}</TableCell>
                    {/* Masquer l'icône "Actions" si le rôle est ADMIN */}
                    {userRole !== "ADMIN" && (
                      <TableCell>
                        <IconButton
                          aria-label="plus d'actions"
                          aria-controls={menuOpen ? 'personnel-actions-menu' : undefined}
                          aria-haspopup="true"
                          aria-expanded={menuOpen ? 'true' : undefined}
                          onClick={(event) => handleMenuOpen(event, pers)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  {/* Ajuster le colSpan pour inclure les nouvelles colonnes.
                      Le nombre total de colonnes est maintenant 10 (7 existantes + 3 nouvelles)
                      Si Actions est masquée, c'est 9.
                  */}
                  <TableCell colSpan={userRole === "ADMIN" ? 9 : 10} align="center">
                    Aucun personnel ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>


      {/* Menu d'actions pour la table */}
      <Menu
        id="personnel-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* Afficher les options de menu si un personnel est sélectionné et le rôle n'est PAS ADMIN */}
        {selectedPersonnelForMenu && userRole !== "ADMIN" && ( // Ajout de la condition ici aussi
          <>
            {/* Désactiver les options "Modifier" et "Supprimer" si le personnel est soft-deleted */}
            <MenuItem
              onClick={() => {
                handleOpenDialog(selectedPersonnelForMenu);
                handleMenuClose();
              }}
              disabled={!!selectedPersonnelForMenu.deleted_at} // Désactiver si deleted_at est non-NULL
            >
              Modifier
            </MenuItem>
             {/* Vous pourriez ajouter une option pour "Restaurer" ici si vous implémentez la suppression douce */}
            <MenuItem
              onClick={() => {
                handleOpenDeleteDialog(selectedPersonnelForMenu);
                handleMenuClose();
              }}
               disabled={!!selectedPersonnelForMenu.deleted_at} // Désactiver si deleted_at est non-NULL
            >
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Dialog pour ajout/modification personnel */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ backgroundColor: blue[700], color: "#fff" }}>
          {selectedPersonnel ? "Modifier un Personnel" : "Ajouter un Personnel"}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            name="PERS_nom_prenom"
            label="Nom & Prénom"
            fullWidth
            value={form.PERS_nom_prenom}
            onChange={handleChange}
            sx={{ mt: 2, mb: 1 }}
            variant="outlined"
            size="small"
            required
          />
          <TextField
            margin="dense"
            name="PERS_email"
            label="Email"
            fullWidth
            value={form.PERS_email}
            disabled={selectedPersonnel ? true : false}
            onChange={handleChange}
            sx={{ mb: 1 }}
            variant="outlined"
            size="small"
            required
          />
          {selectedPersonnel === null && (
             <TextField
               margin="dense"
               name="PERS_mot_passe"
               label="Mot de Passe"
               type="password"
               fullWidth
               value={form.PERS_mot_passe}
               onChange={handleChange}
               sx={{ mb: 1 }}
               variant="outlined"
               size="small"
               required
             />
          )}
          <TextField
            margin="dense"
            name="PERS_telephone"
            label="Téléphone"
            fullWidth
            value={form.PERS_telephone}
            onChange={handleChange}
            sx={{ mb: 1 }}
            variant="outlined"
            size="small"
            required
          />

          <FormControl fullWidth margin="dense" sx={{ mb: 1 }} variant="outlined" size="small" required>
            <InputLabel>Fonction</InputLabel>
            <Select
              name="PERS_fonction"
              value={form.PERS_fonction}
              onChange={handleChange}
              label="Fonction"
            >
               <MenuItem value=""><em>Sélectionnez une fonction</em></MenuItem>
              {fonctionsPossibles.map((fonction) => (
                <MenuItem key={fonction} value={fonction}>{fonction}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" sx={{ mb: 2 }} variant="outlined" size="small" required>
            <InputLabel>Rôle d'Accès</InputLabel>
            <Select
              name="PERS_role_acces" // Gardez ce nom de propriété si c'est celui attendu par votre backend pour l'envoi
              value={form.PERS_role_acces}
              onChange={handleChange}
              label="Rôle d'Accès"
            >
              <MenuItem value=""><em>Sélectionnez un rôle</em></MenuItem>
              {rolesAccesPossibles.map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>

            {selectedPersonnel && form.PERS_photo_profil && (
                 <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                     <img
                         src={form.PERS_photo_profil.startsWith('data:image/') ? form.PERS_photo_profil : `http://localhost:5000/${form.PERS_photo_profil.replace(/\\/g, '/')}`}
                         alt="Photo Profil"
                         style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px' }}
                     />
                 </Box>
            )}


        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Annuler
          </Button>
          {/* Afficher le bouton "Modifier" / "Ajouter" si le rôle n'est PAS ADMIN */}
          {userRole !== "ADMIN" && (
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {selectedPersonnel ? "Modifier" : "Ajouter"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation pour suppression */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmation de suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce personnel ?
          </Typography>
          {selectedPersonnel && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Personnel : {selectedPersonnel.PERS_nom_prenom}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="secondary">
            Annuler
          </Button>
          {/* Afficher le bouton "Supprimer" si le rôle n'est PAS ADMIN */}
          {userRole !== "ADMIN" && (
             // Si vous implémentez la suppression douce (soft delete), ce bouton
             // ne devrait pas effectuer un DELETE physique, mais une mise à jour du champ deleted_at.
            <Button onClick={handleDelete} color="error" variant="contained">
              Supprimer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionPersonnel;
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  TextField, Button, MenuItem, Select, FormControl, InputLabel, Grid,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Box, IconButton, Menu, CircularProgress, Snackbar, Alert
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { blue, grey, red } from "@mui/material/colors"; // Added colors
import api from '../../api/api';
import { format, parseISO, isDate, isValid } from 'date-fns'; // Import date-fns functions

const GestionCommentaires = () => {
  const [commentaires, setCommentaires] = useState([]);
  const [loading, setLoading] = useState(true); // Added loading state
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" }); // Added notification state
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // Added confirm dialog state
  const [commentaireToEdit, setCommentaireToEdit] = useState(null);
  const [commentaireToDelete, setCommentaireToDelete] = useState(null); // Added state for item to delete
  const [updatedMessage, setUpdatedMessage] = useState('');

  // Filtres basés sur les états existants et une interprétation pour la date
  const [filtreUtilisateurType, setFiltreUtilisateurType] = useState('');
  const [filtreCode, setFiltreCode] = useState('');
  const [filtreDateCreation, setFiltreDateCreation] = useState(null); // Date object or null for DatePicker


  // États pour le menu d'actions de la table
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCommentaireForMenu, setSelectedCommentaireForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const utilisateurTypes = ["CLIENT", "TECHNICIEN", "ADMIN", "SUPER_ADMIN", "NORMAL"]; // Assuming these types exist

  useEffect(() => {
    fetchCommentaires();
  }, []);

  const fetchCommentaires = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await api.get('/commentaires', config);
      // Assuming the response data is an array of commentaires
      setCommentaires(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires", error.response?.data || error);
      setNotification({ open: true, message: error.response?.data?.message || 'Erreur lors du chargement des commentaires', severity: 'error' });
      setCommentaires([]); // Ensure it's an empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the edit dialog
  const handleOpenEditDialog = (commentaire) => {
    setSelectedCommentaireForMenu(null); // Close menu first
    setCommentaireToEdit(commentaire);
    setUpdatedMessage(commentaire.CMMT_message || '');
    setOpenEditDialog(true);
  };

  // Handle closing the edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCommentaireToEdit(null);
    setUpdatedMessage('');
  };

  // Handle opening the confirm delete dialog
  const handleOpenConfirmDialog = (commentaire) => {
    setSelectedCommentaireForMenu(null); // Close menu first
    setCommentaireToDelete(commentaire);
    setOpenConfirmDialog(true);
  };

  // Handle closing the confirm delete dialog
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setCommentaireToDelete(null);
  };


  // Handle update comment
  const handleUpdate = async () => {
    if (!commentaireToEdit || !updatedMessage) {
      setNotification({ open: true, message: "Le message du commentaire ne peut pas être vide.", severity: "warning" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await api.put(`/commentaires/${commentaireToEdit._id}`, { CMMT_message: updatedMessage }, config);

      // Update the comment in the local state
      setCommentaires(commentaires.map(c =>
        c._id === commentaireToEdit._id ? response.data : c
      ));

      setNotification({ open: true, message: "Commentaire mis à jour avec succès.", severity: "success" });
      handleCloseEditDialog();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du commentaire", error.response?.data || error);
      setNotification({ open: true, message: error.response?.data?.message || 'Erreur lors de la mise à jour du commentaire', severity: 'error' });
    }
  };

  // Handle delete comment
  const handleDelete = async () => {
    if (!commentaireToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.delete(`/commentaires/${commentaireToDelete._id}`, config);

      // Remove the comment from the local state
      setCommentaires(commentaires.filter(c => c._id !== commentaireToDelete._id));

      setNotification({ open: true, message: "Commentaire supprimé avec succès.", severity: "success" });
      handleCloseConfirmDialog();
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire", error.response?.data || error);
      setNotification({ open: true, message: error.response?.data?.message || 'Erreur lors de la suppression du commentaire', severity: 'error' });
      handleCloseConfirmDialog();
    }
  };


  // Logique de filtrage avec useMemo
  const filteredCommentaires = useMemo(() => {
    return commentaires.filter(commentaire => {
      const utilisateurTypeMatch = filtreUtilisateurType === '' || (commentaire.CMMT_utilisateur_Type && commentaire.CMMT_utilisateur_Type.toLowerCase().includes(filtreUtilisateurType.toLowerCase()));
      const codeMatch = filtreCode === '' || (commentaire.CMMT_code && commentaire.CMMT_code.toLowerCase().includes(filtreCode.toLowerCase()));

      // Filtrage par date de création (en utilisant parseISO pour les dates de l'API)
      const dateCreation = commentaire.CMMT_Date_creation ? parseISO(commentaire.CMMT_Date_creation) : null;
      const filterDate = filtreDateCreation ? new Date(filtreDateCreation) : null; // Convert DatePicker value to Date object

      const dateMatch = !filterDate || !dateCreation || (dateCreation.getFullYear() === filterDate.getFullYear() && dateCreation.getMonth() === filterDate.getMonth() && dateCreation.getDate() === filterDate.getDate());


      return utilisateurTypeMatch && codeMatch && dateMatch;
    });
  }, [commentaires, filtreUtilisateurType, filtreCode, filtreDateCreation]);


  // Réinitialiser les filtres
  const resetFilters = () => {
    setFiltreUtilisateurType('');
    setFiltreCode('');
    setFiltreDateCreation(null); // Reset DatePicker value to null
  };

  // Fonctions pour gérer le menu d'actions de la table
  const handleMenuOpen = (event, commentaire) => {
    setAnchorEl(event.currentTarget);
    setSelectedCommentaireForMenu(commentaire);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCommentaireForMenu(null);
  };

  const handleEditClick = (commentaire) => {
    handleOpenEditDialog(commentaire); // Open the form dialog for editing
    handleMenuClose(); // Close the menu
  };

  const handleDeleteClick = (commentaire) => {
    handleOpenConfirmDialog(commentaire); // Open the delete confirmation dialog
    handleMenuClose(); // Close the menu
  };


  // Affichage du CircularProgress pendant le chargement
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Box sx={{ padding: 3, backgroundColor: "#fff", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: blue[900] }}>
        Gestion des Commentaires
      </Typography>

      {/* Section des Filtres */}
      <Paper sx={{ padding: 2, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: grey[800] }}>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Type Utilisateur"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreUtilisateurType}
              onChange={(e) => setFiltreUtilisateurType(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Code Commentaire"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreCode}
              onChange={(e) => setFiltreCode(e.target.value)}
            />
          </Grid>
          {/* Exemple de filtre par date exacte (vous pouvez adapter) */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date de Création"
              type="date"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreDateCreation ? format(new Date(filtreDateCreation), 'yyyy-MM-dd') : ''}
              onChange={(e) => setFiltreDateCreation(e.target.value ? new Date(e.target.value) : null)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="outlined" onClick={resetFilters} fullWidth color="secondary">
              Réinitialiser Filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>


      {/* Tableau des commentaires */}
      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="commentaires table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Code</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Message</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Type Utilisateur</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>ID Utilisateur</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Création</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Dernière MAJ</TableCell>
            
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCommentaires.length > 0 ? (
              filteredCommentaires.map((commentaire, index) => (
                <TableRow
                  key={commentaire._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[100] : "white",
                    "&:hover": { backgroundColor: grey[200] },
                  }}
                >
                  <TableCell>{commentaire._id || 'N/A'}</TableCell>
                  <TableCell>{commentaire.CMMT_code || 'N/A'}</TableCell>
                  <TableCell>{commentaire.CMMT_message || 'N/A'}</TableCell>
                  <TableCell>{commentaire.CMMT_utilisateur_Type || 'N/A'}</TableCell>
                  <TableCell>{commentaire.CMMT_utilisateur_code|| 'N/A'}</TableCell>
                  <TableCell>{commentaire.createdAt ? format(parseISO(commentaire.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                  <TableCell>{commentaire.updatedAt ? format(parseISO(commentaire.updatedAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                 
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {commentaires.length > 0 ? "Aucun commentaire ne correspond aux filtres." : "Aucun commentaire disponible."}
                </TableCell>
              </TableRow>
            )}
        </TableBody>
      </Table>
    </TableContainer>

    

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionCommentaires;
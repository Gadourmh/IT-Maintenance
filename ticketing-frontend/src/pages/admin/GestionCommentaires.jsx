import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,
  TextField, Button, MenuItem, Select, FormControl, InputLabel, Grid,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Box, IconButton, Menu, CircularProgress, Snackbar, Alert
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { blue, grey, red } from "@mui/material/colors";
import api from '../../api/api';
import { format, parseISO, isDate, isValid } from 'date-fns';

const GestionCommentaires = () => {
  const [commentaires, setCommentaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [commentaireToEdit, setCommentaireToEdit] = useState(null);
  const [commentaireToDelete, setCommentaireToDelete] = useState(null);
  const [updatedMessage, setUpdatedMessage] = useState('');

  // Filtres existants (Type Utilisateur, Code Utilisateur affiché, Date Création)
  const [filtreUtilisateurType, setFiltreUtilisateurType] = useState('');
  const [filtreCodeUtilisateur, setFiltreCodeUtilisateur] = useState('');
  const [filtreDateCreation, setFiltreDateCreation] = useState(null);

  // NOUVEAU : État pour le filtre par code commentaire
  const [filtreCodeCommentaire, setFiltreCodeCommentaire] = useState('');


  // États pour le menu d'actions de la table
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCommentaireForMenu, setSelectedCommentaireForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const utilisateurTypes = ["CLIENT", "TECHNICIEN", "ADMIN", "SUPER_ADMIN", "NORMAL"];

  useEffect(() => {
    fetchCommentaires();
  }, []);

  const fetchCommentaires = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await api.get('/commentaires', config);
      setCommentaires(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires", error.response?.data || error);
      setNotification({ open: true, message: error.response?.data?.message || 'Erreur lors du chargement des commentaires', severity: 'error' });
      setCommentaires([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (commentaire) => {
    setSelectedCommentaireForMenu(null);
    setCommentaireToEdit(commentaire);
    setUpdatedMessage(commentaire.CMMT_message || '');
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCommentaireToEdit(null);
    setUpdatedMessage('');
  };

  const handleOpenConfirmDialog = (commentaire) => {
    setSelectedCommentaireForMenu(null);
    setCommentaireToDelete(commentaire);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setCommentaireToDelete(null);
  };


  const handleUpdate = async () => {
    if (!commentaireToEdit || !updatedMessage) {
      setNotification({ open: true, message: "Le message du commentaire ne peut pas être vide.", severity: "warning" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await api.put(`/commentaires/${commentaireToEdit._id}`, { CMMT_message: updatedMessage }, config);

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

  const handleDelete = async () => {
    if (!commentaireToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await api.delete(`/commentaires/${commentaireToDelete._id}`, config);

      setCommentaires(commentaires.filter(c => c._id !== commentaireToDelete._id));

      setNotification({ open: true, message: "Commentaire supprimé avec succès.", severity: "success" });
      handleCloseConfirmDialog();
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire", error.response?.data || error);
      setNotification({ open: true, message: error.response?.data?.message || 'Erreur lors de la suppression du commentaire', severity: 'error' });
      handleConfirmClose();
    }
  };


  // Logique de filtrage mise à jour avec useMemo pour inclure le filtre code commentaire
  const filteredCommentaires = useMemo(() => {
    if (!Array.isArray(commentaires)) return [];
    return commentaires.filter(commentaire => {
      const utilisateurTypeMatch = filtreUtilisateurType === '' || (commentaire.CMMT_utilisateur_Type && commentaire.CMMT_utilisateur_Type.toLowerCase().includes(filtreUtilisateurType.toLowerCase()));
      const codeUtilisateurMatch = filtreCodeUtilisateur === '' || (commentaire.CMMT_utilisateur_code_affichee && commentaire.CMMT_utilisateur_code_affichee.toLowerCase().includes(filtreCodeUtilisateur.toLowerCase()));

      // NOUVEAU : Logique de filtre pour le code commentaire
      const codeCommentaireMatch = filtreCodeCommentaire === '' || (commentaire.CMMT_code && commentaire.CMMT_code.toLowerCase().includes(filtreCodeCommentaire.toLowerCase()));


      const dateCreation = commentaire.createdAt ? parseISO(commentaire.createdAt) : null;
      const filterDate = filtreDateCreation ? new Date(filtreDateCreation) : null;

      const dateMatch = !filterDate || !dateCreation || (dateCreation.getFullYear() === filterDate.getFullYear() && dateCreation.getMonth() === filterDate.getMonth() && dateCreation.getDate() === filterDate.getDate());

      // Combiner toutes les conditions de filtre
      return utilisateurTypeMatch && codeUtilisateurMatch && codeCommentaireMatch && dateMatch;
    });
  }, [commentaires, filtreUtilisateurType, filtreCodeUtilisateur, filtreCodeCommentaire, filtreDateCreation]);


  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setFiltreUtilisateurType('');
    setFiltreCodeUtilisateur('');
    setFiltreCodeCommentaire(''); // NOUVEAU : Réinitialiser le filtre code commentaire
    setFiltreDateCreation(null);
  };

  const handleMenuOpen = (event, commentaire) => {
    setAnchorEl(event.currentTarget);
    setSelectedCommentaireForMenu(commentaire);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCommentaireForMenu(null);
  };

  const handleEditClick = (commentaire) => {
    handleOpenEditDialog(commentaire);
    handleMenuClose();
  };

  const handleDeleteClick = (commentaire) => {
    handleOpenConfirmDialog(commentaire);
    handleMenuClose();
  };

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
          {/* Filtre Type Utilisateur */}
          <Grid item xs={12} sm={6} md={3}>
             <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Type Utilisateur</InputLabel>
              <Select
                value={filtreUtilisateurType}
                label="Type Utilisateur"
                onChange={(e) => setFiltreUtilisateurType(e.target.value)}
              >
                <MenuItem value="">
                  <em>Tous</em>
                </MenuItem>
                {utilisateurTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filtre Code Utilisateur affiché */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Code Utilisateur"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreCodeUtilisateur}
              onChange={(e) => setFiltreCodeUtilisateur(e.target.value)}
            />
          </Grid>

          {/* NOUVEAU : Champ de filtre pour le code commentaire */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Code Commentaire" 
              variant="outlined"
              size="small"
              fullWidth
              value={filtreCodeCommentaire}
              onChange={(e) => setFiltreCodeCommentaire(e.target.value)} // Utilise le nouvel état
            />
          </Grid>
           {/* FIN NOUVEAU FILTRE */}


          {/* Filtre Date Création */}
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

          {/* Bouton Réinitialiser */}
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
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>ID Commentaire</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Photo</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Code Utilisateur</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Nom/Raison Sociale</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Message</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Type Utilisateur</TableCell>
               <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Code Commentaire</TableCell> {/* Colonne Code Commentaire */}
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Création</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Dernière MAJ</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
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
                   <TableCell>
                       {commentaire.CMMT_utilisateur_photo_affichee ? (
                           commentaire.CMMT_utilisateur_photo_affichee.startsWith('data:image/') ? (
                               <img
                                   src={commentaire.CMMT_utilisateur_photo_affichee}
                                   alt={`Photo ${commentaire.CMMT_utilisateur_nom_affichee || ''}`}
                                   style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }}
                               />
                           ) : (
                               <img
                                   src={`http://localhost:5000/${commentaire.CMMT_utilisateur_photo_affichee.replace(/\\/g, '/')}`}
                                   alt={`Photo ${commentaire.CMMT_utilisateur_nom_affichee || ''}`}
                                   style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }}
                               />
                           )
                       ) : (
                           <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>Pas de photo</Typography>
                       )}
                   </TableCell>
                  <TableCell>{commentaire.CMMT_utilisateur_code_affichee || 'N/A'}</TableCell>
                   <TableCell>{commentaire.CMMT_utilisateur_nom_affichee || 'N/A'}</TableCell>
                  <TableCell>{commentaire.CMMT_message || 'N/A'}</TableCell>
                  <TableCell>{commentaire.CMMT_utilisateur_Type || 'N/A'}</TableCell>
                   <TableCell>{commentaire.CMMT_code || 'N/A'}</TableCell> {/* Affiche le code commentaire */}
                  <TableCell>{commentaire.createdAt ? format(parseISO(commentaire.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                  <TableCell>{commentaire.updatedAt ? format(parseISO(commentaire.updatedAt), 'dd/MM/yyyy HH:mm') : 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="plus d'actions"
                      aria-controls={menuOpen ? 'comment-actions-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={menuOpen ? 'true' : undefined}
                      onClick={(event) => handleMenuOpen(event, commentaire)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                {/* Ajuster le colspan si vous ajoutez/retirez des colonnes dans le TableHead */}
                <TableCell colSpan={10} align="center">
                  {commentaires.length > 0 ? "Aucun commentaire ne correspond aux filtres." : "Aucun commentaire disponible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Menu d'actions pour la table */}
      <Menu
        id="comment-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedCommentaireForMenu && (
          <>
            <MenuItem onClick={() => handleEditClick(selectedCommentaireForMenu)}>
              Modifier
            </MenuItem>
            <MenuItem onClick={() => handleDeleteClick(selectedCommentaireForMenu)}>
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>


      {/* Dialog pour modification commentaire */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: blue[700], color: "#fff" }}>Modifier le Commentaire</DialogTitle>
        <DialogContent dividers>
           <TextField
            fullWidth
            label="Code Commentaire"
            value={commentaireToEdit?.CMMT_code || ''}
            disabled
            margin="normal"
            variant="outlined"
            size="small"
          />
           <TextField
            fullWidth
            label="Code Utilisateur"
            value={commentaireToEdit?.CMMT_utilisateur_code_affichee || 'N/A'}
            disabled
            margin="normal"
            variant="outlined"
            size="small"
          />
           <TextField
            fullWidth
            label="Nom / Raison Sociale"
            value={commentaireToEdit?.CMMT_utilisateur_nom_affichee || 'N/A'}
            disabled
            margin="normal"
            variant="outlined"
            size="small"
          />
          <TextField
            fullWidth
            label="Message"
            value={updatedMessage}
            onChange={(e) => setUpdatedMessage(e.target.value)}
            margin="normal"
            variant="outlined"
            size="small"
            multiline
            rows={4}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="secondary">Annuler</Button>
          <Button onClick={handleUpdate} color="primary" variant="contained">Mettre à jour</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: red[700], color: "#fff" }}>Confirmer la suppression</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce commentaire ?
          </Typography>
          {commentaireToDelete && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Code Commentaire : {commentaireToDelete.CMMT_code || 'N/A'}
            </Typography>
          )}
           {commentaireToDelete && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Utilisateur (Code) : {commentaireToDelete.CMMT_utilisateur_code_affichee || 'N/A'}
            </Typography>
          )}
           {commentaireToDelete && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Utilisateur (Nom) : {commentaireToDelete.CMMT_utilisateur_nom_affichee || 'N/A'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="secondary">Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>


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
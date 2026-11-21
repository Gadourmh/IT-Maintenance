import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Menu,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, isWithinInterval, parseISO, isValid } from 'date-fns';
import { blue, grey, red } from "@mui/material/colors";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';


const Recrutements = () => {
  const [recrutements, setRecrutements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Les noms des états restent génériques, mais les données envoyées/reçues de l'API
  // utiliseront les noms de champs du modèle (RCUT_...)
  const [poste, setPoste] = useState("");
  const [description, setDescription] = useState("");
  const [dateLimite, setDateLimite] = useState(null);
  const [statut, setStatut] = useState("Ouvert");
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecrutement, setCurrentRecrutement] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recrutementToDelete, setRecrutementToDelete] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [filterPoste, setFilterPoste] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [filterDateLimiteStart, setFilterDateLimiteStart] = useState(null);
  const [filterDateLimiteEnd, setFilterDateLimiteEnd] = useState(null);

  // Les options du statut correspondent déjà à l'énumération du modèle
  const statutOptions = ["Ouvert", "Fermé"];


  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRecrutementForMenu, setSelectedRecrutementForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);


  const handleOpenForm = (recrutement = null) => {
    if (recrutement) {
      setIsEditing(true);
      setCurrentRecrutement(recrutement);
      // MODIFICATION: Utiliser les noms de champs du modèle pour pré-remplir le formulaire
      setPoste(recrutement.RCUT_poste);
      setDescription(recrutement.RCUT_description);
      setDateLimite(recrutement.RCUT_dateLimite ? parseISO(recrutement.RCUT_dateLimite) : null);
      setStatut(recrutement.RCUT_statut);
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setPoste("");
    setDescription("");
    setDateLimite(null);
    setStatut("Ouvert");
    setIsEditing(false);
    setCurrentRecrutement(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation basée sur les états locaux (poste, description, dateLimite, statut)
    if (!poste || !description || !dateLimite || !statut) {
      setNotification({
        open: true,
        message: "Veuillez remplir tous les champs obligatoires.",
        severity: "warning",
      });
      return;
    }

    if (!isValid(new Date(dateLimite))) {
      setNotification({
        open: true,
        message: "Veuillez sélectionner une date limite valide.",
        severity: "warning",
      });
      return;
    }

    // MODIFICATION: Créer l'objet recrutementData avec les noms de champs du modèle
    const recrutementData = {
      RCUT_poste: poste,
      RCUT_description: description,
      RCUT_dateLimite: format(new Date(dateLimite), 'yyyy-MM-dd'), // Assurez-vous que le format correspond à ce que votre backend attend
      RCUT_statut: statut,
    };

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    if (isEditing && currentRecrutement) {
      // Assurez-vous que l'endpoint backend correspond à la route de mise à jour
      api.put(`/recrutements/${currentRecrutement._id}`, recrutementData, config)
        .then((response) => {
          const updatedRecrutements = recrutements.map((recrutement) =>
            recrutement._id === currentRecrutement._id ? response.data : recrutement
          );
          setRecrutements(updatedRecrutements);
          setNotification({ open: true, message: "Recrutement modifié avec succès.", severity: "success" });
          resetForm();
        })
        .catch((error) => {
          console.error("Erreur lors de la mise à jour du recrutement", error.response?.data || error);
          setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la modification.", severity: "error" });
        });
    } else {
      // Assurez-vous que l'endpoint backend correspond à la route de création
      api.post("/recrutements", recrutementData, config)
        .then((response) => {
          setRecrutements([...recrutements, response.data]);
          setNotification({ open: true, message: "Recrutement créé avec succès.", severity: "success" });
          resetForm();
        })
        .catch((error) => {
          console.error("Erreur lors de la création du recrutement", error.response?.data || error);
          setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la création.", severity: "error" });
        });
    }
  };

  const handleConfirmDelete = (recrutement) => {
    setRecrutementToDelete(recrutement);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!recrutementToDelete) return;

    const idToDelete = recrutementToDelete._id;
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };


    try {
      // Assurez-vous que l'endpoint backend correspond à la route de suppression
      await api.delete(`/recrutements/${idToDelete}`, config);
      setRecrutements(recrutements.filter((recrutement) => recrutement._id !== idToDelete));
      setNotification({ open: true, message: "Recrutement supprimé avec succès.", severity: "success" });
      setIsConfirmOpen(false);
      setRecrutementToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du recrutement", error.response?.data || error);
      setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la suppression.", severity: "error" });
      setIsConfirmOpen(false);
      setRecrutementToDelete(null);
    }
  };

  const handleEdit = (recrutement) => {
    handleOpenForm(recrutement);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Assurez-vous que l'endpoint backend correspond à la route de récupération
    api.get("/recrutements/", config)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setRecrutements(response.data);
        } else {
          console.error("La réponse de l'API n'est pas un tableau:", response.data);
          setRecrutements([]);
        }
      })
      .catch((error) => {
        console.error("Erreur de chargement des recrutements", error.response?.data || error);
        setError(error.response?.data?.message || "Impossible de charger les recrutements.");
        setRecrutements([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredRecrutements = useMemo(() => {
    return recrutements.filter((recrutement) => {
      // MODIFICATION: Utiliser les noms de champs du modèle pour le filtrage
      const posteMatch = filterPoste === "" || (recrutement.RCUT_poste && recrutement.RCUT_poste.toLowerCase().includes(filterPoste.toLowerCase()));
      const descriptionMatch = filterDescription === "" || (recrutement.RCUT_description && recrutement.RCUT_description.toLowerCase().includes(filterDescription.toLowerCase()));
      const statutMatch = filterStatut === "" || (recrutement.RCUT_statut && recrutement.RCUT_statut === filterStatut);

      // MODIFICATION: Utiliser RCUT_dateLimite pour le filtrage par date
      const dateLimite = recrutement.RCUT_dateLimite ? parseISO(recrutement.RCUT_dateLimite) : null;

      const startDateObj = filterDateLimiteStart ? new Date(filterDateLimiteStart) : null;
      const endDateObj = filterDateLimiteEnd ? new Date(filterDateLimiteEnd) : null;

      const dateMatch = !startDateObj && !endDateObj || !dateLimite ||
        (startDateObj && !endDateObj && dateLimite >= startDateObj) ||
        (!startDateObj && endDateObj && dateLimite <= endDateObj) ||
        (startDateObj && endDateObj && isValid(startDateObj) && isValid(endDateObj) && isWithinInterval(dateLimite, { start: startDateObj, end: endDateObj }));


      return posteMatch && descriptionMatch && statutMatch && dateMatch;
    });
  }, [recrutements, filterPoste, filterDescription, filterStatut, filterDateLimiteStart, filterDateLimiteEnd]);


  const resetFilters = () => {
    setFilterPoste("");
    setFilterDescription("");
    setFilterStatut("");
    setFilterDateLimiteStart(null);
    setFilterDateLimiteEnd(null);
  };

  const handleMenuOpen = (event, recrutement) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecrutementForMenu(recrutement);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecrutementForMenu(null);
  };

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: "#fff", minHeight: "100vh" }}>

      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: blue[900] }}>
        Gestion des Recrutements
      </Typography>

      {error && !notification.open && (
        <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: red[500], borderRadius: 1, bgcolor: red[50] }}>
          <Typography variant="h6" color="error">{error}</Typography>
        </Box>
      )}


      <Paper sx={{ padding: 2, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: grey[800] }}>
          Filtres
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Poste"
                variant="outlined"
                size="small"
                fullWidth
                value={filterPoste}
                onChange={(e) => setFilterPoste(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Description"
                variant="outlined"
                size="small"
                fullWidth
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filterStatut}
                  label="Statut"
                  onChange={(e) => setFilterStatut(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Tous</em>
                  </MenuItem>
                  {statutOptions.map((statut) => (
                    <MenuItem key={statut} value={statut}>
                      {statut}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Date Limite Début"
                value={filterDateLimiteStart}
                onChange={(newValue) => setFilterDateLimiteStart(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Date Limite Fin"
                value={filterDateLimiteEnd}
                onChange={(newValue) => setFilterDateLimiteEnd(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={resetFilters} color="secondary">
                Réinitialiser Filtres
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>


      <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <Button variant="contained" color="primary" onClick={() => handleOpenForm()}>
          <AddIcon sx={{ mr: 1 }}/> Créer un Recrutement
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="recrutements table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Poste</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Limite</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Statut</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecrutements.length > 0 ? (
              filteredRecrutements.map((recrutement, index) => (
                <TableRow
                  key={recrutement._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[100] : "white",
                    "&:hover": { backgroundColor: grey[200] },
                  }}
                >
                  {/* MODIFICATION: Afficher les données avec les noms de champs du modèle */}
                  <TableCell>{recrutement.RCUT_poste || 'N/A'}</TableCell>
                  <TableCell>{recrutement.RCUT_description || 'N/A'}</TableCell>
                  <TableCell>{recrutement.RCUT_dateLimite ? format(parseISO(recrutement.RCUT_dateLimite), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell>{recrutement.RCUT_statut || 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="plus d'actions"
                      aria-controls={menuOpen ? 'recrutement-actions-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={menuOpen ? 'true' : undefined}
                      onClick={(event) => handleMenuOpen(event, recrutement)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {recrutements.length > 0 ? "Aucun recrutement ne correspond aux filtres." : "Aucun recrutement disponible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        id="recrutement-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedRecrutementForMenu && (
          <>
            <MenuItem onClick={() => {
              handleEdit(selectedRecrutementForMenu);
              handleMenuClose();
            }}>
              Modifier
            </MenuItem>
            <MenuItem onClick={() => {
              handleConfirmDelete(selectedRecrutementForMenu);
              handleMenuClose();
            }}>
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>


      <Dialog open={isFormOpen} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: blue[700], color: "#fff" }}>
          {isEditing ? "Modifier le Recrutement" : "Créer un Nouveau Recrutement"}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              label="Poste"
              fullWidth
              margin="normal"
              variant="outlined"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              required
            />
            <TextField
              label="Description"
              fullWidth
              margin="normal"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date Limite"
                value={dateLimite}
                onChange={(newValue) => setDateLimite(newValue)}
                // MODIFICATION: Utiliser renderInput comme fonction pour la compatibilité avec les anciennes versions de MUI X
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" variant="outlined" required />}
              />
            </LocalizationProvider>
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Statut</InputLabel>
              <Select
                value={statut}
                label="Statut"
                onChange={(e) => setStatut(e.target.value)}
                required
              >
                {statutOptions.map((statut) => (
                  <MenuItem key={statut} value={statut}>
                    {statut}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {isEditing ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <DialogTitle sx={{ backgroundColor: red[700], color: "#fff" }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le recrutement pour le poste "{recrutementToDelete?.RCUT_poste}" ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmOpen(false)} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

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

export default Recrutements;
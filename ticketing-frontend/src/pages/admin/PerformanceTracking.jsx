import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api"; // Assurez-vous que 'api' est votre instance Axios configurée

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
  IconButton,
  Menu,
  InputLabel,
  FormControl,
  Select,
} from "@mui/material";
import { blue, grey, red } from "@mui/material/colors";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';


const Performances = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les champs du modèle (PRF_employe est maintenant polymorphe)
  const [PRF_employe, setPRF_Employe] = useState("");
  const [PRF_type_entite, setPRF_Type_Entite] = useState(""); // NOUVEAU : État pour le type d'entité
  const [PRF_periode, setPRF_Periode] = useState("");
  const [PRF_objectifs, setPRF_Objectifs] = useState("");
  const [PRF_realisations, setPRF_Realisations] = useState("");
  const [PRF_note, setPRF_Note] = useState("");
  const [PRF_commentaires, setPRF_Commentaires] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [currentPerformance, setCurrentPerformance] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [performanceToDelete, setPerformanceToDelete] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // États pour les listes déroulantes Personnel et Technicien
  const [personnelList, setPersonnelList] = useState([]); // <-- Cette variable sera mise à jour
  const [technicienList, setTechnicienList] = useState([]);

  // Filtres
  const [filterEmploye, setFilterEmploye] = useState(""); // Ce filtre cherchera dans le nom de l'entité (Personnel ou Technicien)
  const [filterPeriode, setFilterPeriode] = useState("");
  const [filterNoteMin, setFilterNoteMin] = useState("");
  const [filterNoteMax, setFilterNoteMax] = useState("");


  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPerformanceForMenu, setSelectedPerformanceForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);


  const handleOpenForm = (performance = null) => {
    if (performance) {
      setIsEditing(true);
      setCurrentPerformance(performance);
      // Charger l'ID de l'entité et son type
      setPRF_Employe(performance.PRF_employe?._id || "");
      setPRF_Type_Entite(performance.PRF_type_entite || "");
      setPRF_Periode(performance.PRF_periode);
      setPRF_Objectifs(performance.PRF_objectifs);
      setPRF_Realisations(performance.PRF_realisations);
      setPRF_Note(performance.PRF_note);
      setPRF_Commentaires(performance.PRF_commentaires);
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setPRF_Employe("");
    setPRF_Type_Entite(""); // Réinitialiser le type d'entité
    setPRF_Periode("");
    setPRF_Objectifs("");
    setPRF_Realisations("");
    setPRF_Note("");
    setPRF_Commentaires("");
    setIsEditing(false);
    setCurrentPerformance(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Vérification des champs obligatoires
    if (!PRF_employe || !PRF_type_entite || !PRF_periode || !PRF_objectifs || !PRF_realisations || PRF_note === "") {
      setNotification({
        open: true,
        message: "Veuillez remplir tous les champs obligatoires (Type d'entité, Entité, Période, Objectifs, Réalisations, Note).",
        severity: "warning",
      });
      return;
    }

    // Création de l'objet de données
    const performanceData = {
      PRF_employe,
      PRF_type_entite, // Inclure le type d'entité
      PRF_periode,
      PRF_objectifs,
      PRF_realisations,
      PRF_note: Number(PRF_note),
      PRF_commentaires,
    };

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    if (isEditing && currentPerformance) {
      api.put(`/performances/${currentPerformance._id}`, performanceData, config)
        .then((response) => {
          // Mettre à jour la performance dans l'état avec la réponse de l'API
          // La réponse contiendra l'objet PRF_employe populé
          const updatedPerformances = performances.map((performance) =>
            performance._id === currentPerformance._id ? response.data : performance
          );
          setPerformances(updatedPerformances);
          setNotification({ open: true, message: "Performance modifiée avec succès.", severity: "success" });
          resetForm();
        })
        .catch((error) => {
          console.error("Erreur lors de la mise à jour de la performance", error.response?.data || error);
          setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la modification.", severity: "error" });
        });
    } else {
      api.post("/performances", performanceData, config)
        .then((response) => {
          // Ajouter la nouvelle performance à l'état avec l'objet PRF_employe populé
          setPerformances([...performances, response.data]);
          setNotification({ open: true, message: "Performance créée avec succès.", severity: "success" });
          resetForm();
        })
        .catch((error) => {
          console.error("Erreur lors de la création de la performance", error.response?.data || error);
          setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la création.", severity: "error" });
        });
    }
  };

  const handleConfirmDelete = (performance) => {
    setPerformanceToDelete(performance);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!performanceToDelete) return;

    const idToDelete = performanceToDelete._id;
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await api.delete(`/performances/${idToDelete}`, config);
      setPerformances(performances.filter((performance) => performance._id !== idToDelete));
      setNotification({ open: true, message: "Performance supprimée avec succès.", severity: "success" });
      setIsConfirmOpen(false);
      setPerformanceToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression de la performance", error.response?.data || error);
      setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la suppression.", severity: "error" });
      setIsConfirmOpen(false);
      setPerformanceToDelete(null);
    }
  };

  const handleEdit = (performance) => {
    handleOpenForm(performance);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Performances
        const performanceResponse = await api.get("/performances/", config);
        if (Array.isArray(performanceResponse.data)) {
          setPerformances(performanceResponse.data);
        } else {
          console.error("La réponse de l'API /performances n'est pas un tableau:", performanceResponse.data);
          setPerformances([]);
        }

        // Fetch Personnel (CORRIGÉ : Utilisation de /personnels)
        const personnelResponse = await api.get("/personnels", config); // <-- Chemin corrigé ici
        if (Array.isArray(personnelResponse.data)) {
          setPersonnelList(personnelResponse.data); // <-- Mise à jour de personnelList
        } else {
          console.error("La réponse de l'API /personnels n'est pas un tableau:", personnelResponse.data);
          setPersonnelList([]);
          setNotification({ // Notification en cas d'erreur de chargement des personnels
            open: true,
            message: "Échec du chargement des personnels.",
            severity: "error",
          });
        }

        // Fetch Technicians
        const technicianResponse = await api.get("/techniciens", config);
        if (Array.isArray(technicianResponse.data)) {
          setTechnicienList(technicianResponse.data);
        } else {
          console.error("La réponse de l'API /techniciens n'est pas un tableau:", technicianResponse.data);
          setTechnicienList([]);
          setNotification({ // Notification en cas d'erreur de chargement des techniciens
            open: true,
            message: "Échec du chargement des techniciens.",
            severity: "error",
          });
        }

      } catch (err) {
        console.error("Erreur de chargement des données complètes", err.response?.data || err);
        setError(err.response?.data?.message || "Erreur de chargement des données.");
        setPerformances([]);
        setPersonnelList([]);
        setTechnicienList([]);
        setNotification({ // Notification pour l'erreur principale de chargement
            open: true,
            message: err.response?.data?.message || "Erreur de chargement des données.",
            severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Les dépendances ne contiennent que les variables qui changent, pas les fonctions de mise à jour d'état

  const filteredPerformances = useMemo(() => {
    return performances.filter((performance) => {
      // Le filtre employe doit maintenant vérifier le nom dans l'objet peuplé, quel que soit son type
      const entityName = performance.PRF_type_entite === 'Personnel'
                         ? performance.PRF_employe?.PERS_nom_prenom
                         : performance.PRF_employe?.TECH_nom_prenom;

      const employeMatch = filterEmploye === "" || (entityName && entityName.toLowerCase().includes(filterEmploye.toLowerCase()));

      const periodeMatch = filterPeriode === "" || (performance.PRF_periode && performance.PRF_periode.toLowerCase().includes(filterPeriode.toLowerCase()));

      const noteValue = typeof performance.PRF_note === 'number' ? performance.PRF_note : NaN;
      const noteMin = filterNoteMin === "" ? -Infinity : Number(filterNoteMin);
      const noteMax = filterNoteMax === "" ? Infinity : Number(filterNoteMax);

      const noteMatch = !isNaN(noteValue) && noteValue >= noteMin && noteValue <= noteMax;

      const isNoteFilterApplied = filterNoteMin !== "" || filterNoteMax !== "";
      const finalNoteMatch = isNoteFilterApplied ? noteMatch : true;


      return employeMatch && periodeMatch && finalNoteMatch;
    });
  }, [performances, filterEmploye, filterPeriode, filterNoteMin, filterNoteMax]);


  const resetFilters = () => {
    setFilterEmploye("");
    setFilterPeriode("");
    setFilterNoteMin("");
    setFilterNoteMax("");
  };

  const handleMenuOpen = (event, performance) => {
    setAnchorEl(event.currentTarget);
    setSelectedPerformanceForMenu(performance);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPerformanceForMenu(null);
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
        Gestion des Performances
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
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}> {/* Adjust grid size */}
            <TextField
              label="Nom de l'Employé/Technicien" // Updated label
              variant="outlined"
              size="small"
              fullWidth
              value={filterEmploye}
              onChange={(e) => setFilterEmploye(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}> {/* Adjust grid size */}
            <TextField
              label="Période"
              variant="outlined"
              size="small"
              fullWidth
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Note Min"
              type="number"
              inputProps={{ step: "0.1", min: "0", max: "20" }}
              variant="outlined"
              size="small"
              fullWidth
              value={filterNoteMin}
              onChange={(e) => setFilterNoteMin(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Note Max"
              type="number"
              inputProps={{ step: "0.1", min: "0", "max": "20" }}
              variant="outlined"
              size="small"
              fullWidth
              value={filterNoteMax}
              onChange={(e) => setFilterNoteMax(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="outlined" onClick={resetFilters} fullWidth color="secondary">
              Réinitialiser Filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>


      <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <Button variant="contained" color="primary" onClick={() => handleOpenForm()}>
          <AddIcon sx={{ mr: 1 }}/> Créer une Performance
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="performances table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Entité</TableCell> {/* Column updated */}
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Type d'Entité</TableCell> {/* New Column */}
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Période</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Objectifs</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Réalisations</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Note</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Commentaires</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPerformances.length > 0 ? (
              filteredPerformances.map((performance, index) => (
                <TableRow
                  key={performance._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[100] : "white",
                    "&:hover": { backgroundColor: grey[200] },
                  }}
                >
                  {/* Affichage de l'entité basée sur le type */}
                  <TableCell>
                    {performance.PRF_type_entite === 'Personnel'
                      ? performance.PRF_employe?.PERS_nom_prenom || 'N/A'
                      : performance.PRF_employe?.TECH_nom_prenom || 'N/A'}
                  </TableCell>
                  <TableCell>{performance.PRF_type_entite || 'N/A'}</TableCell> {/* Affichage du type */}
                  <TableCell>{performance.PRF_periode || 'N/A'}</TableCell>
                  <TableCell>{performance.PRF_objectifs || 'N/A'}</TableCell>
                  <TableCell>{performance.PRF_realisations || 'N/A'}</TableCell>
                  <TableCell>{typeof performance.PRF_note === 'number' ? `${performance.PRF_note} / 20` : 'Non noté'}</TableCell>
                  <TableCell>{performance.PRF_commentaires || '-'}</TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="plus d'actions"
                      aria-controls={menuOpen ? 'performance-actions-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={menuOpen ? 'true' : undefined}
                      onClick={(event) => handleMenuOpen(event, performance)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center"> {/* Colspan ajusté */}
                  {performances.length > 0 ? "Aucune performance ne correspond aux filtres." : "Aucune performance disponible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        id="performance-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedPerformanceForMenu && (
          <>
            <MenuItem onClick={() => {
              handleEdit(selectedPerformanceForMenu);
              handleMenuClose();
            }}>
              Modifier
            </MenuItem>
            <MenuItem onClick={() => {
              handleConfirmDelete(selectedPerformanceForMenu);
              handleMenuClose();
            }}>
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>

      <Dialog open={isFormOpen} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: blue[700], color: "#fff" }}>
          {isEditing ? "Modifier la Performance" : "Créer une Nouvelle Performance"}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {/* SELECT pour le Type d'Entité (Personnel ou Technicien) */}
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="type-entite-label">Type d'Entité</InputLabel>
              <Select
                labelId="type-entite-label"
                id="PRF_type_entite"
                value={PRF_type_entite}
                label="Type d'Entité"
                onChange={(e) => {
                  setPRF_Type_Entite(e.target.value);
                  setPRF_Employe(""); // Réinitialiser l'employé quand le type change
                }}
              >
                <MenuItem value="">
                  <em>Sélectionnez un type</em>
                </MenuItem>
                <MenuItem value="Personnel">Personnel</MenuItem>
                <MenuItem value="Technicien">Technicien</MenuItem>
              </Select>
            </FormControl>

            {/* SELECT pour l'Employé/Technicien (filtré par le type d'entité) */}
            <FormControl fullWidth margin="normal" required disabled={!PRF_type_entite}>
              <InputLabel id="employe-label">Entité</InputLabel>
              <Select
                labelId="employe-label"
                id="PRF_employe"
                value={PRF_employe}
                label="Entité"
                onChange={(e) => setPRF_Employe(e.target.value)}
              >
                <MenuItem value="">
                  <em>Sélectionnez une entité</em>
                </MenuItem>
                {PRF_type_entite === "Personnel" && personnelList.map((personnel) => (
                  <MenuItem key={personnel._id} value={personnel._id}>
                    {personnel.PERS_nom_prenom}
                  </MenuItem>
                ))}
                {PRF_type_entite === "Technicien" && technicienList.map((technicien) => (
                  <MenuItem key={technicien._id} value={technicien._id}>
                    {technicien.TECH_nom_prenom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Période"
              fullWidth
              margin="normal"
              variant="outlined"
              value={PRF_periode}
              onChange={(e) => setPRF_Periode(e.target.value)}
              required
            />
            <TextField
              label="Objectifs"
              fullWidth
              margin="normal"
              variant="outlined"
              value={PRF_objectifs}
              onChange={(e) => setPRF_Objectifs(e.target.value)}
              required
            />
            <TextField
              label="Réalisations"
              fullWidth
              margin="normal"
              variant="outlined"
              value={PRF_realisations}
              onChange={(e) => setPRF_Realisations(e.target.value)}
              required
            />
            <TextField
              label="Note"
              type="number"
              inputProps={{ step: "0.1", min: "0", max: "20" }}
              fullWidth
              margin="normal"
              variant="outlined"
              value={PRF_note}
              onChange={(e) => setPRF_Note(e.target.value)}
              required
            />
            <TextField
              label="Commentaires"
              fullWidth
              margin="normal"
              variant="outlined"
              value={PRF_commentaires}
              onChange={(e) => setPRF_Commentaires(e.target.value)}
            />
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
            Êtes-vous sûr de vouloir supprimer la performance pour l'entité "
            {performanceToDelete?.PRF_type_entite === 'Personnel'
              ? performanceToDelete?.PRF_employe?.PERS_nom_prenom || 'cet employé'
              : performanceToDelete?.PRF_employe?.TECH_nom_prenom || 'ce technicien'}"
            ({performanceToDelete?.PRF_type_entite}) pour la période "{performanceToDelete?.PRF_periode}" ?
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

export default Performances;
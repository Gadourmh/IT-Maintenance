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
  Snackbar,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,

  Menu,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, isWithinInterval, parseISO, isValid } from 'date-fns';
import { blue, grey, red } from "@mui/material/colors";



const Recrutements = () => {
  const [recrutements, setRecrutements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



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


   

      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="recrutements table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Poste</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Limite</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Statut</TableCell>
          
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
import React, { useEffect, useState, useMemo } from "react";
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
import { format, isWithinInterval, parseISO } from 'date-fns';
import { blue, grey, red } from "@mui/material/colors";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';

// Importez l'instance par défaut d'axios et les fonctions spécifiques pour les clients
import api from "../../api/api"; // <--- Import de l'instance axios par défaut
import { getClients } from "../../api/api"; // <--- Les fonctions spécifiques pour les clients sont toujours utiles

const FactureClient = () => {
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]); // Pour stocker la liste des clients
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    FACT_numeroFacture: "",
    FACT_clientId: "", // ID du client
    FACT_dateEmission: null,
    FACT_dateEcheance: null,
    FACT_montantTotal: "",
    FACT_montantPaye: "",
    FACT_statut: "Pending", // Statut par défaut
    FACT_description: "",
  });
  const [editingFactureId, setEditingFactureId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [factureToDelete, setFactureToDelete] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Filtres
  const [filterNumeroFacture, setFilterNumeroFacture] = useState("");
  const [filterClient, setFilterClient] = useState(""); // Filtrer par ID client
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);

  const statusOptions = ["Pending", "Paid", "Overdue", "Cancelled"];

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFactureForMenu, setSelectedFactureForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Fonctions de gestion des requêtes (similaire à handleRequest dans api.js mais local)
  const handleRequest = async (requestFn) => {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      console.error("❌ Erreur API :", error.response ? error.response.data : error.message);
      throw error; // Propage l'erreur pour la gestion dans le composant
    }
  };

  // Chargement des factures et des clients au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        const [facturesResponse, clientsData] = await Promise.all([
          handleRequest(() => api.get("/factures")), // <--- Utilisation de api.get
          getClients() // getClients est une fonction nommée, car elle ne prend pas de gestionnaire handleRequest pour le moment.
        ]);
        setFactures(facturesResponse);

        // CORRECTION POUR L'ERREUR clients.map IS NOT A FUNCTION
        // Assurez-vous que clientsData.clients est un tableau avant de le définir
        setClients(Array.isArray(clientsData.clients) ? clientsData.clients : []);

      } catch (err) {
        console.error("Erreur de chargement des données :", err); // L'erreur est déjà loguée par handleRequest
        setError(err.response?.data?.message || "Erreur de chargement des données.");
        setClients([]); // S'assurer que clients est un tableau vide en cas d'erreur
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleOpenForm = (facture = null) => {
    if (facture) {
      setEditingFactureId(facture._id);
      setFormData({
        FACT_numeroFacture: facture.FACT_numeroFacture,
        FACT_clientId: facture.FACT_clientId?._id || "", // Récupérer l'ID si client populé
        FACT_dateEmission: facture.FACT_dateEmission ? parseISO(facture.FACT_dateEmission) : null,
        FACT_dateEcheance: facture.FACT_dateEcheance ? parseISO(facture.FACT_dateEcheance) : null,
        FACT_montantTotal: facture.FACT_montantTotal,
        FACT_montantPaye: facture.FACT_montantPaye,
        FACT_statut: facture.FACT_statut,
        FACT_description: facture.FACT_description,
      });
    } else {
      resetForm(); // Utiliser resetForm pour initialiser un nouveau formulaire
    }
    setIsFormOpen(true);
  };




 
  const filteredFactures = useMemo(() => {
    return factures.filter((facture) => {
      const numeroFactureMatch = filterNumeroFacture === "" ||
        (facture.FACT_numeroFacture && facture.FACT_numeroFacture.toLowerCase().includes(filterNumeroFacture.toLowerCase()));

      const clientMatch = filterClient === "" ||
        (facture.FACT_clientId && facture.FACT_clientId._id === filterClient);

      const statusMatch = filterStatus === "" ||
        (facture.FACT_statut && facture.FACT_statut === filterStatus);

      const issueDate = facture.FACT_dateEmission ? parseISO(facture.FACT_dateEmission) : null;
      const dateMatch = (!filterStartDate && !filterEndDate) || !issueDate ||
        (filterStartDate && !filterEndDate && issueDate >= new Date(filterStartDate)) ||
        (!filterStartDate && filterEndDate && issueDate <= new Date(filterEndDate)) ||
        (filterStartDate && filterEndDate && isWithinInterval(issueDate, { start: new Date(filterStartDate), end: new Date(filterEndDate) }));

      return numeroFactureMatch && clientMatch && statusMatch && dateMatch;
    });
  }, [factures, filterNumeroFacture, filterClient, filterStatus, filterStartDate, filterEndDate]);

  const resetFilters = () => {
    setFilterNumeroFacture("");
    setFilterClient("");
    setFilterStatus("");
    setFilterStartDate(null);
    setFilterEndDate(null);
  };

  const handleMenuOpen = (event, facture) => {
    setAnchorEl(event.currentTarget);
    setSelectedFactureForMenu(facture);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFactureForMenu(null);
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
        Gestion des Factures
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
                label="Numéro de Facture"
                variant="outlined"
                size="small"
                fullWidth
                value={filterNumeroFacture}
                onChange={(e) => setFilterNumeroFacture(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>Client</InputLabel>
                <Select
                  value={filterClient}
                  label="Client"
                  onChange={(e) => setFilterClient(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Tous</em>
                  </MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client._id} value={client._id}>
                      {client.CLNT_raison_sociale} ({client.CLNT_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filterStatus}
                  label="Statut"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Tous</em>
                  </MenuItem>
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Date d'émission (Début)"
                value={filterStartDate}
                onChange={(newValue) => setFilterStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Date d'émission (Fin)"
                value={filterEndDate}
                onChange={(newValue) => setFilterEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
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
        <Table sx={{ minWidth: 650 }} aria-label="factures table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Numéro Facture</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Client</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Emission</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Échéance</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Montant Total</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Montant Payé</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Solde Dû</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Statut</TableCell>
    
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFactures.length > 0 ? (
              filteredFactures.map((facture, index) => (
                <TableRow
                  key={facture._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[100] : "white",
                    "&:hover": { backgroundColor: grey[200] },
                  }}
                >
                  <TableCell>{facture.FACT_numeroFacture}</TableCell>
                  <TableCell>{facture.FACT_clientId?.CLNT_raison_sociale || "N/A"}</TableCell> {/* Affiche le nom du client */}
                  <TableCell>{facture.FACT_dateEmission ? new Date(facture.FACT_dateEmission).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{facture.FACT_dateEcheance ? new Date(facture.FACT_dateEcheance).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell align="right">{facture.FACT_montantTotal?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}</TableCell>
                  <TableCell align="right">{facture.FACT_montantPaye?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}</TableCell>
                  <TableCell align="right">
                    {((facture.FACT_montantTotal || 0) - (facture.FACT_montantPaye || 0))?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}
                  </TableCell>
                  <TableCell>{facture.FACT_statut}</TableCell>
                 
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  {factures.length > 0 ? "Aucune facture ne correspond aux filtres." : "Aucune facture disponible."}
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

export default FactureClient;
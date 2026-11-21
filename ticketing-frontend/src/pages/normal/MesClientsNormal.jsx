import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  IconButton,
  Menu,
  CircularProgress // Added CircularProgress for loading
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { blue, grey, red } from "@mui/material/colors"; // Added colors
import axios from "axios";
import jsPDF from "jspdf"; // Keep jsPDF import

const GestionClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true); // Added loading state

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });



  // États pour les filtres (utilisent les mêmes noms que dans le code original)
  const [filtreCode, setFiltreCode] = useState("");
  const [filtreRaisonSociale, setFiltreRaisonSociale] = useState("");
  const [filtreEmail, setFiltreEmail] = useState("");
 
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreDateDebut, setFiltreDateDebut] = useState(""); // YYYY-MM-DD
  const [filtreDateFin, setFiltreDateFin] = useState(""); // YYYY-MM-DD

  // États pour le menu d'actions de la table
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClientForMenu, setSelectedClientForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const statutsPossibles = ["actif", "bloqué"];


  useEffect(() => {
    fetchClients();
  }, []); // Fetch clients on component mount

  const fetchClients = async () => {
    setLoading(true); // Set loading true before fetch
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        "http://localhost:5000/api/clients/",
        config
      );
      // Ensure response.data.clients is an array before setting state
      setClients(Array.isArray(response.data.clients) ? response.data.clients : []);
    } catch (error) {
      console.error("Erreur lors de la récupération des clients", error.response?.data || error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Échec du chargement des clients.",
        severity: "error",
      });
      setClients([]); // Ensure clients is an empty array on error
    } finally {
      setLoading(false); // Set loading false after fetch
    }
  };

  const handleOpenForm = (client = null) => {
    setSelectedClient(client);
    // Populate form data from client object if editing, otherwise reset
    setFormData(
      client
        ? {
            ...client,
            // Ensure addresses is an array, handle potential empty array or null
            CLNT_addresses: Array.isArray(client.CLNT_addresses) && client.CLNT_addresses.length > 0 ? client.CLNT_addresses : [{ address: "" }],
            // Format Date_creation to YYYY-MM-DD for date input
            Date_creation: client.Date_creation ? new Date(client.Date_creation).toISOString().split("T")[0] : "",
          }
        : {
            // Initial state for new client
            CLNT_raison_sociale: "",
            CLNT_code: "",
            CLNT_email: "",
            CLNT_telephone: "",
            CLNT_mot_passe: "",
            CLNT_statut: "actif",
          
            CLNT_addresses: [{ address: "" }],
         
            CLNT_contract: "",
          }
    );
    setContractFile(null); // Reset contract file input on opening form
    setOpen(true); // Open the form dialog
  };


  const handleCloseForm = () => {
    setOpen(false);
    setSelectedClient(null); // Reset selected client
    // Reset form data to initial empty state
    setFormData({
      CLNT_code: "",
      CLNT_raison_sociale: "",
      CLNT_email: "",
      CLNT_telephone: "",
      CLNT_mot_passe: "",
      CLNT_statut: "actif",

      CLNT_addresses: [{ address: "" }],
      Date_creation: new Date().toISOString().split("T")[0],
   
    });
    setContractFile(null); // Also reset contract file state
  };

  const handleConfirmOpen = (client) => {
    setSelectedClient(client); // Set the client to be deleted
    setConfirmOpen(true); // Open the confirmation dialog
  };





  // Fonctions pour gérer le menu d'actions de la table
  const handleMenuOpen = (event, client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClientForMenu(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClientForMenu(null); // Réinitialiser le client sélectionné
  };



  // Logique de filtrage améliorée avec useMemo
  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];

    return clients.filter((client) => {
      const dateCreationClient = client.Date_creation ? new Date(client.Date_creation) : null;
      const startDateObj = filtreDateDebut ? new Date(filtreDateDebut) : null;
      const endDateObj = filtreDateFin ? new Date(filtreDateFin) : null;

      const codeMatch = filtreCode === "" || (client.CLNT_code && client.CLNT_code.toLowerCase().includes(filtreCode.toLowerCase()));
      const raisonSocialeMatch = filtreRaisonSociale === "" || (client.CLNT_raison_sociale && client.CLNT_raison_sociale.toLowerCase().includes(filtreRaisonSociale.toLowerCase()));
      const emailMatch = filtreEmail === "" || (client.CLNT_email && client.CLNT_email.toLowerCase().includes(filtreEmail.toLowerCase()));
   
      const statutMatch = filtreStatut === "" || (client.CLNT_statut && client.CLNT_statut === filtreStatut);

      // Date comparison logic (handle invalid dates and partial range)
      const dateMatch = (!startDateObj || (dateCreationClient && dateCreationClient >= startDateObj)) &&
                          (!endDateObj || (dateCreationClient && dateCreationClient <= endDateObj));


      return codeMatch && raisonSocialeMatch && emailMatch  && statutMatch && dateMatch;
    });
  }, [clients, filtreCode, filtreRaisonSociale, filtreEmail, filtreStatut, filtreDateDebut, filtreDateFin]);

  // Function to reset filters
  const resetFilters = () => {
    setFiltreCode("");
    setFiltreRaisonSociale("");
    setFiltreEmail("");
  
    setFiltreStatut("");
    setFiltreDateDebut("");
    setFiltreDateFin("");
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Parse ISO string or just a date string
      const date = new Date(dateString);
      // Check if the parsed date is valid
      if (isNaN(date.getTime())) {
        return 'Date invalide'; // Return message for invalid dates
      }
      return date.toLocaleDateString(); // Format as local date string
    } catch (e) {
      console.error("Erreur de formatage de date", dateString, e);
      return 'Erreur date'; // Handle parsing errors
    }
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
        Gestion des Clients
      </Typography>

      {/* Section des Filtres */}
      <Paper sx={{ padding: 2, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: grey[800] }}>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Code Client"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreCode}
              onChange={(e) => setFiltreCode(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Raison Sociale"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreRaisonSociale}
              onChange={(e) => setFiltreRaisonSociale(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Email"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreEmail}
              onChange={(e) => setFiltreEmail(e.target.value)}
            />
          </Grid>
    
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filtreStatut}
                label="Statut"
                onChange={(e) => setFiltreStatut(e.target.value)}
              >
                <MenuItem value="">
                  <em>Tous</em>
                </MenuItem>
                {statutsPossibles.map((stat) => (
                  <MenuItem key={stat} value={stat}>
                    {stat.charAt(0).toUpperCase() + stat.slice(1)} {/* Capitalize first letter */}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date Création (Début)"
              type="date"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreDateDebut}
              onChange={(e) => setFiltreDateDebut(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date Création (Fin)"
              type="date"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreDateFin}
              onChange={(e) => setFiltreDateFin(e.target.value)}
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

  

      {/* Tableau des clients */}
      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="clients table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
            
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Code Client</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Raison Sociale</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Téléphone</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Statut</TableCell>
           
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Adresse(s)</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date de Création</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client, index) => (
                <TableRow
                  key={client._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[100] : "white",
                    "&:hover": { backgroundColor: grey[200] },
                  }}
                >
                
                  <TableCell>{client.CLNT_code || 'N/A'}</TableCell>
                  <TableCell>{client.CLNT_raison_sociale || 'N/A'}</TableCell>
                  <TableCell>{client.CLNT_email || 'N/A'}</TableCell>
                  <TableCell>{client.CLNT_telephone || 'N/A'}</TableCell>
                  <TableCell>{client.CLNT_statut || 'N/A'}</TableCell>
                 
                  <TableCell>
                    {client.CLNT_addresses &&
                    Array.isArray(client.CLNT_addresses) &&
                    client.CLNT_addresses.length > 0 ? (
                      client.CLNT_addresses.map((addr, addrIndex) => (
                        <div key={addrIndex}>{addr.address || 'N/A'}</div>
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">Pas d'adresses</Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDateForDisplay(client.Date_creation)}</TableCell>
               
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  Aucun client ne correspond aux filtres.
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

export default GestionClients;
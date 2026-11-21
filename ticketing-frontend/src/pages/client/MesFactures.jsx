import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, parseISO, isWithinInterval } from 'date-fns';
import api from "../../api/api"; // UPDATED: Import axiosInstance directly as 'api'

const MesFactures = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null); // To store the connected client's info

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const fetchFactures = async (clientId) => {
    try {
      setLoading(true);
      setError(null);
      // Use api.get() directly
      const response = await api.get(`/factures/client/${clientId}`);
      setFactures(response.data); // Access .data from the response
    } catch (err) {
      console.error("Erreur lors du chargement des factures :", err);
      setError("Erreur lors du chargement de vos factures.");
      setNotification({
        open: true,
        message: err.response?.data?.message || "Erreur lors du chargement de vos factures.",
        severity: "error",
      });
      setFactures([]); // Clear factures on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClientAndFactures = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch the connected client's information using api.get()
        const clientResponse = await api.get("/clients/me");
        setClient(clientResponse.data); // Access .data from the response

        if (clientResponse.data && clientResponse.data._id) {
          // 2. Use the client's ID to fetch their associated invoices
          await fetchFactures(clientResponse.data._id); // Call the dedicated fetch function
        } else {
          setFactures([]); // No client connected or client ID missing
          setNotification({
            open: true,
            message: "Aucun client connecté trouvé.",
            severity: "info",
          });
          setLoading(false); // Stop loading if no client
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données initiales :", err);
        setError("Impossible de récupérer le profil client ou les factures initiales.");
        setNotification({
          open: true,
          message: err.response?.data?.message || "Impossible de récupérer le profil client ou les factures initiales.",
          severity: "error",
        });
        setLoading(false);
        setFactures([]); // Clear factures on initial load error
      }
    };

    fetchClientAndFactures();
  }, []); // Empty dependency array means this runs once on mount

  // Memoized filtered data
  const filteredFactures = useMemo(() => {
    let currentFactures = factures;

    // Apply search term filter
    if (searchTerm) {
      currentFactures = currentFactures.filter(facture =>
        facture.FACT_numeroFacture?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facture.FACT_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      currentFactures = currentFactures.filter(facture =>
        facture.FACT_statut === statusFilter
      );
    }

    // Apply date range filter (FACT_dateEmission)
    if (startDateFilter && endDateFilter) {
      currentFactures = currentFactures.filter(facture => {
        const emissionDate = parseISO(facture.FACT_dateEmission);
        return isWithinInterval(emissionDate, { start: startDateFilter, end: endDateFilter });
      });
    } else if (startDateFilter) {
      currentFactures = currentFactures.filter(facture => {
        const emissionDate = parseISO(facture.FACT_dateEmission);
        return emissionDate >= startDateFilter;
      });
    } else if (endDateFilter) {
      currentFactures = currentFactures.filter(facture => {
        const emissionDate = parseISO(facture.FACT_dateEmission);
        return emissionDate <= endDateFilter;
      });
    }

    return currentFactures;
  }, [factures, searchTerm, statusFilter, startDateFilter, endDateFilter]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Chargement de vos factures...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  const factureStatutOptions = ['Pending', 'Paid', 'Overdue', 'Cancelled'];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Mes Factures {client ? `(${client.CLNT_raison_sociale || 'Client connecté'})` : ''}
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtres des Factures
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Rechercher par Numéro ou Description"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Statut"
              >
                <MenuItem value="">
                  <em>Tous</em>
                </MenuItem>
                {factureStatutOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid item xs={12} sm={2}>
              <DatePicker
                label="Date Début (Émission)"
                value={startDateFilter}
                onChange={(newValue) => setStartDateFilter(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                label="Date Fin (Émission)"
                value={endDateFilter}
                onChange={(newValue) => setEndDateFilter(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
          </LocalizationProvider>
          <Grid item xs={12} sm={1}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setStartDateFilter(null);
                setEndDateFilter(null);
              }}
            >
              Réinitialiser
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="factures table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Numéro Facture</TableCell>
              <TableCell>Date Émission</TableCell>
              <TableCell>Date Échéance</TableCell>
              <TableCell align="right">Montant Total</TableCell>
              <TableCell align="right">Montant Payé</TableCell>
              <TableCell align="right">Montant Restant</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFactures.length > 0 ? (
              filteredFactures.map((facture) => (
                <TableRow key={facture._id}>
                  <TableCell component="th" scope="row">{facture.FACT_numeroFacture}</TableCell>
                  <TableCell>{format(parseISO(facture.FACT_dateEmission), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(parseISO(facture.FACT_dateEcheance), 'dd/MM/yyyy')}</TableCell>
                  <TableCell align="right">{facture.FACT_montantTotal?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}</TableCell>
                  <TableCell align="right">{facture.FACT_montantPaye?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}</TableCell>
                  <TableCell align="right">
                    {((facture.FACT_montantTotal || 0) - (facture.FACT_montantPaye || 0))?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}
                  </TableCell>
                  <TableCell>{facture.FACT_statut}</TableCell>
                  <TableCell>{facture.FACT_description || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {factures.length > 0 ? "Aucune facture ne correspond aux filtres." : "Aucune facture disponible pour votre compte."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MesFactures;
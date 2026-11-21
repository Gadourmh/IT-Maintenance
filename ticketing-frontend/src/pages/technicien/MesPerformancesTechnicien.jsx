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
  Button,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, parseISO, isWithinInterval } from 'date-fns';
import api from "../../api/api"; // Ensure this import is correct (axiosInstance as default)

const MesPerformancesTechnicien = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [technicien, setTechnicien] = useState(null); // To store the connected technician's info

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState('');
  const [minNoteFilter, setMinNoteFilter] = useState('');
  const [maxNoteFilter, setMaxNoteFilter] = useState('');
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

  useEffect(() => {
    const fetchTechnicienAndPerformances = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch the connected technician's information (optional but good for display)
        // Assuming you have a /techniciens/me endpoint for the connected technician
        const technicienResponse = await api.get("/techniciens/me");
        setTechnicien(technicienResponse.data);

        // 2. Fetch performances for the connected user (technician) using api.get()
        const performancesResponse = await api.get("/performances/me");
        setPerformances(performancesResponse.data); // Access .data from the response

      } catch (err) {
        console.error("Erreur lors du chargement des performances ou du technicien :", err);
        setError("Erreur lors du chargement de vos performances.");
        setNotification({
          open: true,
          message: err.response?.data?.message || "Erreur lors du chargement de vos performances.",
          severity: "error",
        });
        setPerformances([]); // Clear performances on error
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicienAndPerformances();
  }, []); // Empty dependency array means this runs once on mount

  // Memoized filtered data
  const filteredPerformances = useMemo(() => {
    let currentPerformances = performances;

    // Apply search term filter
    if (searchTerm) {
      currentPerformances = currentPerformances.filter(performance =>
        performance.PRF_periode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        performance.PRF_objectifs?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        performance.PRF_realisations?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        performance.PRF_commentaires?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply note range filter
    const minNote = parseFloat(minNoteFilter);
    const maxNote = parseFloat(maxNoteFilter);

    if (!isNaN(minNote)) {
      currentPerformances = currentPerformances.filter(performance =>
        typeof performance.PRF_note === 'number' && performance.PRF_note >= minNote
      );
    }
    if (!isNaN(maxNote)) {
      currentPerformances = currentPerformances.filter(performance =>
        typeof performance.PRF_note === 'number' && performance.PRF_note <= maxNote
      );
    }

    // Apply date range filter (PRF_dateCreation)
    if (startDateFilter && endDateFilter) {
      currentPerformances = currentPerformances.filter(performance => {
        const creationDate = parseISO(performance.PRF_dateCreation);
        return isWithinInterval(creationDate, { start: startDateFilter, end: endDateFilter });
      });
    } else if (startDateFilter) {
      currentPerformances = currentPerformances.filter(performance => {
        const creationDate = parseISO(performance.PRF_dateCreation);
        return creationDate >= startDateFilter;
      });
    } else if (endDateFilter) {
      currentPerformances = currentPerformances.filter(performance => {
        const creationDate = parseISO(performance.PRF_dateCreation);
        return creationDate <= endDateFilter;
      });
    }

    return currentPerformances;
  }, [performances, searchTerm, minNoteFilter, maxNoteFilter, startDateFilter, endDateFilter]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Chargement de vos performances...</Typography>
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Mes Performances {technicien ? `(${technicien.TECH_nom_prenom || 'Technicien connecté'})` : ''}
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtres des Performances
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Rechercher par Contenu"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              label="Note Min (0-20)"
              variant="outlined"
              fullWidth
              type="number"
              inputProps={{ min: 0, max: 20 }}
              value={minNoteFilter}
              onChange={(e) => setMinNoteFilter(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              label="Note Max (0-20)"
              variant="outlined"
              fullWidth
              type="number"
              inputProps={{ min: 0, max: 20 }}
              value={maxNoteFilter}
              onChange={(e) => setMaxNoteFilter(e.target.value)}
            />
          </Grid>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid item xs={12} sm={2}>
              <DatePicker
                label="Date Début (Création)"
                value={startDateFilter}
                onChange={(newValue) => setStartDateFilter(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <DatePicker
                label="Date Fin (Création)"
                value={endDateFilter}
                onChange={(newValue) => setEndDateFilter(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
          </LocalizationProvider>
          <Grid item xs={12}> {/* Full width for reset button */}
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setSearchTerm('');
                setMinNoteFilter('');
                setMaxNoteFilter('');
                setStartDateFilter(null);
                setEndDateFilter(null);
              }}
            >
              Réinitialiser les filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="performance table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Période</TableCell>
              <TableCell>Objectifs</TableCell>
              <TableCell>Réalisations</TableCell>
              <TableCell align="right">Note</TableCell>
              <TableCell>Commentaires</TableCell>
              <TableCell>Date Création</TableCell>
              <TableCell>Date Mise à Jour</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPerformances.length > 0 ? (
              filteredPerformances.map((performance) => (
                <TableRow key={performance._id}>
                  <TableCell>{performance.PRF_periode || 'N/A'}</TableCell>
                  <TableCell>{performance.PRF_objectifs || 'N/A'}</TableCell>
                  <TableCell>{performance.PRF_realisations || 'N/A'}</TableCell>
                  <TableCell align="right">{typeof performance.PRF_note === 'number' ? `${performance.PRF_note} / 20` : 'Non noté'}</TableCell>
                  <TableCell>{performance.PRF_commentaires || '-'}</TableCell>
                  <TableCell>{format(parseISO(performance.PRF_dateCreation), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(parseISO(performance.PRF_dateMiseAJour), 'dd/MM/yyyy')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {performances.length > 0 ? "Aucune performance ne correspond aux filtres." : "Aucune performance disponible pour votre compte."}
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

export default MesPerformancesTechnicien;
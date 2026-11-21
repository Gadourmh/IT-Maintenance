import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Button,
  TextField,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

// Helper function to format date/time
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
     try {
        return new Date(dateString).toLocaleString(undefined, options);
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return 'Date invalide';
    }
};

// Helper function to format date (without time)
const formatDate = (dateString) => {
     if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
     try {
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return 'Date invalide';
    }
};


const GestionInterventions = () => {
  const [interventions, setInterventions] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [snackMessage, setSnackMessage] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);
  const { user } = useAuth();

  const [loadingInterventions, setLoadingInterventions] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);

  const [filterState, setFilterState] = useState({
      status: '',
      technicianId: '',
      ticketCode: '',
      searchText: '',
      startDate: '',
      endDate: '',
      creationStartDate: '',
      creationEndDate: '',
  });


  useEffect(() => {
    const fetchInterventions = async () => {
      setLoadingInterventions(true);
      try {
        const response = await api.get("/interventions/");
        setInterventions(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erreur lors de la récupération des interventions:", error);
        setSnackMessage("Erreur lors du chargement des interventions.");
        setSnackOpen(true);
      } finally {
        setLoadingInterventions(false);
      }
    };
    fetchInterventions();
  }, []);

  useEffect(() => {
    const fetchTechnicians = async () => {
      setLoadingTechnicians(true);
      try {
        const response = await api.get("/techniciens/");
        setTechnicians(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erreur lors de la récupération des techniciens:", error);
        setSnackMessage("Erreur lors du chargement des techniciens.");
        setSnackOpen(true);
      } finally {
        setLoadingTechnicians(false);
      }
    };
    fetchTechnicians();
  }, []);

  const technicianMap = useMemo(() => {
    if (!Array.isArray(technicians)) return {};
    return technicians.reduce((acc, tech) => {
      acc[tech._id] = tech.TECH_nom_prenom;
      return acc;
    }, {});
  }, [technicians]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterState(prev => ({ ...prev, [name]: value }));
    };

    const filteredInterventions = useMemo(() => {
        if (!Array.isArray(interventions)) return [];

        return interventions.filter(intr => {
            const { status, technicianId, ticketCode, searchText, startDate, endDate, creationStartDate, creationEndDate } = filterState;

            const statusMatch = status === '' || intr.INTR_statut === status;

            const technicianMatch = technicianId === '' ||
                                    (Array.isArray(intr.INTR_techniciens) && intr.INTR_techniciens.some(tech => tech?._id === technicianId));

            // ✅ FIX: Use INTR_ticket_details to access the ticket code
            const ticketCodeMatch = ticketCode === '' ||
                                    (intr.INTR_ticket_details?.TCKT_code || '').toLowerCase().includes(ticketCode.toLowerCase());

            // ✅ FIX: Use INTR_ticket_details for searching in related client/equipment fields
            const searchMatch = searchText === '' ||
                                (intr.INTR_code || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                (intr.INTR_description_panne || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                (intr.INTR_cause_panne || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                (intr.INTR_solution_apportée || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                (intr.INTR_ticket_details?.TCKT_client_details?.CLNT_raison_sociale || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                (intr.INTR_ticket_details?.TCKT_equipment_details?.EQPT_libelle || '').toLowerCase().includes(searchText.toLowerCase());

            const debutDate = intr.INTR_dt_debut ? new Date(intr.INTR_dt_debut) : null;
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;

            const debutDateMatch = (!start || (debutDate && debutDate >= start)) &&
                                   (!end || (debutDate && debutDate <= end));

            const creationDate = intr.Date_creation ? new Date(intr.Date_creation) : null;
            const creationStart = creationStartDate ? new Date(creationStartDate) : null;
            const creationEnd = creationEndDate ? new Date(new Date(creationEndDate).setHours(23, 59, 59, 999)) : null;

            const creationDateMatch = (!creationStart || (creationDate && creationDate >= creationStart)) &&
                                      (!creationEnd || (creationDate && creationDate <= creationEnd));

            return statusMatch && technicianMatch && ticketCodeMatch && searchMatch && debutDateMatch && creationDateMatch;
        });
    }, [interventions, filterState]);


    const interventionStatusColors = {
        "en attente": "warning",
        "en cours": "info",
        "terminée": "success",
        "annulée": "error",
    };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Consultation des Interventions
      </Typography>

      <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: '8px', bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>Filtres</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Recherche"
              name="searchText"
              value={filterState.searchText}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                name="status"
                value={filterState.status}
                label="Statut"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="en attente">En attente</MenuItem>
                <MenuItem value="en cours">En cours</MenuItem>
                <MenuItem value="terminée">Terminée</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Technicien</InputLabel>
              <Select
                name="technicianId"
                value={filterState.technicianId}
                label="Technicien"
                onChange={handleFilterChange}
              >
                <MenuItem value="">Tous</MenuItem>
                {technicians.map(tech => (
                  <MenuItem key={tech._id} value={tech._id}>
                    {tech.TECH_nom_prenom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Code Ticket"
              name="ticketCode"
              value={filterState.ticketCode}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Début d'intervention (du)"
              type="date"
              name="startDate"
              InputLabelProps={{ shrink: true }}
              value={filterState.startDate}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Début d'intervention (au)"
              type="date"
              name="endDate"
              InputLabelProps={{ shrink: true }}
              value={filterState.endDate}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Date de création (du)"
              type="date"
              name="creationStartDate"
              InputLabelProps={{ shrink: true }}
              value={filterState.creationStartDate}
              onChange={handleFilterChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Date de création (au)"
              type="date"
              name="creationEndDate"
              InputLabelProps={{ shrink: true }}
              value={filterState.creationEndDate}
              onChange={handleFilterChange}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => setFilterState({
            status: '',
            technicianId: '',
            ticketCode: '',
            searchText: '',
            startDate: '',
            endDate: '',
            creationStartDate: '',
            creationEndDate: '',
          })}>
            Réinitialiser les filtres
          </Button>
        </Box>
      </Box>

      {loadingInterventions || loadingTechnicians ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
           <Table sx={{ minWidth: 800 }} aria-label="MesInterventionsNormal table">
            <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ticket Associé</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description Panne</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cause Panne</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Solution Apportée</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Coût (TND)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Technicien(s)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Début</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fin</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Durée (min)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date Création</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInterventions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    Aucune intervention trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInterventions.map((intervention) => (
                  <TableRow key={intervention._id}>
                    <TableCell>{intervention.INTR_code}</TableCell>
                    {/* ✅ FIX: Use INTR_ticket_details to display the ticket code */}
                    <TableCell>{intervention.INTR_ticket_details?.TCKT_code || 'N/A'}</TableCell>
                    <TableCell>{intervention.INTR_description_panne}</TableCell>
                    <TableCell>{intervention.INTR_cause_panne || 'N/A'}</TableCell>
                    <TableCell>{intervention.INTR_solution_apportée || 'N/A'}</TableCell>
                    <TableCell>{(intervention.INTR_cost || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {Array.isArray(intervention.INTR_techniciens) ? (
                        intervention.INTR_techniciens.map(tech => (
                          <Chip key={tech._id} label={tech.TECH_nom_prenom || 'Inconnu'} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                        <Chip label={intervention.INTR_statut} color={interventionStatusColors[intervention.INTR_statut] || "default"} />
                    </TableCell>
                    <TableCell>{formatDateTime(intervention.INTR_dt_debut)}</TableCell>
                    <TableCell>{formatDateTime(intervention.INTR_dt_fin)}</TableCell>
                    <TableCell>{intervention.INTR_durée}</TableCell>
                    <TableCell>{formatDate(intervention.Date_creation)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={() => setSnackOpen(false)}>
        <Alert onClose={() => setSnackOpen(false)} severity="info" sx={{ width: '100%' }}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestionInterventions;
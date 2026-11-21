import React, { useState, useEffect, useMemo } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
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
  Divider,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import api, { getTechniciensByTicketCode, getTickets } from "../../api/api"; // Import getTechniciensByTicketCode and getTickets
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);


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

const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        // Crée une date qui est "décalée" par le fuseau horaire pour que toISOString produise les bonnes valeurs locales.
        const tzOffset = date.getTimezoneOffset() * 60000; // Décalage en millisecondes
        const localDate = new Date(date.getTime() - tzOffset);
        // On coupe la chaîne ISO pour obtenir le format "YYYY-MM-DDTHH:mm"
        const localISOString = localDate.toISOString().slice(0, 16);
        return localISOString;
    } catch (error) {
        console.error("Error formatting date for input:", dateString, error);
        return "";
    }
};


const GestionInterventions = () => {
  const [interventions, setInterventions] = useState([]);
  const [allTechnicians, setAllTechnicians] = useState([]); // Renamed from technicians for clarity
  const [tickets, setTickets] = useState([]);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    INTR_ticket: "", // This will store the TCKT_code
    INTR_techniciens: [],
    INTR_description_panne: "",
    INTR_cause_panne: "",
    INTR_solution_apportée: "",
    INTR_statut: "en attente",
    INTR_durée: 0,
    INTR_dt_debut: "",
    INTR_dt_fin: "",
    INTR_cost: 0,
  });

  const [snackMessage, setSnackMessage] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackSeverity, setSnackSeverity] = useState("info");
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loadingInterventions, setLoadingInterventions] = useState(true);
  const [loadingAllTechnicians, setLoadingAllTechnicians] = useState(true); // Renamed
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState(null);


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

  // State for technicians assigned to the selected ticket in the dialog
  const [dialogAssignedTechnicians, setDialogAssignedTechnicians] = useState([]);
  const [loadingDialogTechnicians, setLoadingDialogTechnicians] = useState(false);


  useEffect(() => {
    const fetchInterventions = async () => {
      setLoadingInterventions(true);
      try {
        const response = await api.get("/interventions/");
        setInterventions(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erreur lors de la récupération des interventions:", error);
        setSnackMessage("Erreur lors du chargement des interventions.");
        setSnackSeverity("error");
        setSnackOpen(true);
      } finally {
        setLoadingInterventions(false);
      }
    };
    fetchInterventions();
  }, []);

  useEffect(() => {
    const fetchAllTechnicians = async () => { // Renamed function
      setLoadingAllTechnicians(true); // Renamed state setter
      try {
        const response = await api.get("/techniciens/");
        setAllTechnicians(Array.isArray(response.data) ? response.data : []); // Renamed state
      } catch (error) {
        console.error("Erreur lors de la récupération des techniciens:", error);
        setSnackMessage("Erreur lors du chargement des techniciens.");
        setSnackSeverity("error");
        setSnackOpen(true);
      } finally {
        setLoadingAllTechnicians(false); // Renamed state setter
      }
    };
    fetchAllTechnicians(); // Renamed function call
  }, []);

  useEffect(() => {
    const fetchDataTickets = async () => { // Renamed to avoid conflict with generic fetchData
      setLoadingTickets(true);
      setError(null);
      try {
        const res = await getTickets(); // Use the getTickets from api.js
        const data = res; // getTickets already returns response.data
        if (Array.isArray(data)) {
          setTickets(data.filter(ticket => !ticket.deleted_at));
        } else {
          console.error("❌ Données tickets inattendues :", data);
          setTickets([]);
          setError("Format de données de tickets inattendu.");
        }
      } catch (err) {
        console.error("❌ Erreur récupération tickets :", err);
        setError("Impossible de récupérer les tickets.");
        setSnackMessage("Erreur lors du chargement des codes tickets.");
        setSnackSeverity("error");
        setSnackOpen(true);
      } finally {
        setLoadingTickets(false);
      }
    };
    if (token) {
      fetchDataTickets();
    }
  }, [token]);


  const technicianMap = useMemo(() => {
    if (!Array.isArray(allTechnicians)) return {};
    return allTechnicians.reduce((acc, tech) => {
      acc[tech._id] = tech.TECH_nom_prenom;
      return acc;
    }, {});
  }, [allTechnicians]);

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
                                        (Array.isArray(intr.INTR_techniciens) && intr.INTR_techniciens.some(tech => tech?._id === technicianId || tech === technicianId));

           const ticketCodeMatch = ticketCode === '' ||
                                     (intr.INTR_ticket_details?.TCKT_code || intr.INTR_ticket || '').toLowerCase().includes(ticketCode.toLowerCase());


            const searchMatch = searchText === '' ||
                                        (intr.INTR_code || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                        (intr.INTR_description_panne || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                        (intr.INTR_cause_panne || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                        (intr.INTR_solution_apportée || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                        (intr.INTR_ticket_details?.TCKT_client_details?.CLNT_raison_sociale ||
                                         intr.INTR_ticket_details?.TCKT_client ||
                                         '').toLowerCase().includes(searchText.toLowerCase()) ||
                                        (intr.INTR_ticket_details?.TCKT_equipment_details?.EQPT_libelle ||
                                         intr.INTR_ticket_details?.TCKT_equipment ||
                                         '').toLowerCase().includes(searchText.toLowerCase());


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


  // Function to fetch assigned technicians for a given ticket code
  const fetchTechniciansForTicket = async (ticketCode) => {
    if (!ticketCode) {
        setDialogAssignedTechnicians([]);
        return;
    }
    setLoadingDialogTechnicians(true);
    try {
        // Use the new getTechniciensByTicketCode function
        const response = await getTechniciensByTicketCode(ticketCode);
        if (response && Array.isArray(response.technicians)) { // API now returns { technicians: [...] }
            const assigned = response.technicians.map(tech => ({
                _id: tech._id,
                TECH_nom_prenom: tech.TECH_nom_prenom || 'Nom Inconnu'
            }));
            setDialogAssignedTechnicians(assigned);
            // Pre-select technicians if any are assigned and it's a new intervention
            if (!selectedIntervention && assigned.length > 0) {
                 setFormData(prevData => ({
                     ...prevData,
                     INTR_techniciens: assigned.map(tech => tech._id)
                 }));
            }
        } else {
            setDialogAssignedTechnicians([]);
            setSnackMessage("Aucun technicien assigné à ce ticket.");
            setSnackSeverity("warning");
            setSnackOpen(true);
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des techniciens pour le ticket:", error);
        setDialogAssignedTechnicians([]);
        setSnackMessage("Erreur lors du chargement des techniciens pour le ticket sélectionné.");
        setSnackSeverity("error");
        setSnackOpen(true);
    } finally {
        setLoadingDialogTechnicians(false);
    }
  };


  const handleDialogOpen = (intervention = null) => {
    setSelectedIntervention(intervention);
    const ticketCodeForDialog = intervention ? (intervention.INTR_ticket_details?.TCKT_code || intervention.INTR_ticket || "") : "";
    setFormData(
      intervention ? {
        ...intervention,
            INTR_dt_debut: formatDateForInput(intervention.INTR_dt_debut),
          INTR_dt_fin: formatDateForInput(intervention.INTR_dt_fin),
          INTR_techniciens: Array.isArray(intervention.INTR_techniciens) ? intervention.INTR_techniciens.map(tech => tech?._id || tech) : [],
          INTR_ticket: ticketCodeForDialog,
          
          INTR_cost: intervention.INTR_cost ?? 0,
          INTR_durée: intervention.INTR_durée ?? 0,
          INTR_cause_panne: intervention.INTR_cause_panne || '',
          INTR_solution_apportée: intervention.INTR_solution_apportée || '',
         
          Date_creation: undefined,
       
      } : {
        INTR_ticket: "",
        INTR_techniciens: [],
        INTR_description_panne: "",
        INTR_cause_panne: "",
        INTR_solution_apportée: "",
        INTR_statut: "en attente",
        INTR_durée: 0,
        INTR_dt_debut: "",
        INTR_dt_fin: "",
        INTR_cost: 0,
      }
    );
    if (ticketCodeForDialog) {
        fetchTechniciansForTicket(ticketCodeForDialog);
    } else {
        setDialogAssignedTechnicians([]); 
    }
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setSelectedIntervention(null);
      setFormData({
        INTR_ticket: "",
        INTR_techniciens: [],
        INTR_description_panne: "",
        INTR_cause_panne: "",
        INTR_solution_apportée: "",
        INTR_statut: "en attente",
        INTR_durée: 0,
        INTR_dt_debut: "",
        INTR_dt_fin: "",
        INTR_cost: 0,
      });
    setDialogAssignedTechnicians([]); // Clear dialog technicians on close
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
      const newValue = (name === 'INTR_durée' || name === 'INTR_cost')
                       ? (value === '' ? null : parseFloat(value))
                       : value;

    setFormData((prevData) => ({ ...prevData, [name]: newValue }));

    if (name === "INTR_ticket") {
        fetchTechniciansForTicket(value);
        setFormData(prevData => ({ ...prevData, INTR_techniciens: [] })); // Reset selected technicians when ticket changes
    }
  };

  const handleTechnicianSelect = (event) => {
    const { value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      INTR_techniciens: typeof value === 'string' ? value.split(',') : value,
    }));
  };

const handleSaveIntervention = async () => {
  if (!formData.INTR_ticket || !formData.INTR_description_panne || !formData.INTR_statut) {
    setSnackMessage("Veuillez remplir les champs obligatoires (Ticket, Description, Statut).");
    setSnackSeverity("warning");
    setSnackOpen(true);
    return;
  }
  if (formData.INTR_cost !== null && isNaN(formData.INTR_cost)) {
    setSnackMessage("Le coût de l'intervention doit être un nombre valide.");
    setSnackSeverity("warning");
    setSnackOpen(true);
    return;
  }

  const dataToSave = {
    ...formData,
    INTR_techniciens: Array.isArray(formData.INTR_techniciens) ? formData.INTR_techniciens.map(techId => techId) : [],
    INTR_cost: formData.INTR_cost === null || formData.INTR_cost === '' ? null : parseFloat(formData.INTR_cost),
    INTR_ticket: formData.INTR_ticket
  };

  try {
    setLoadingSave(true);
    let message = "";
    if (selectedIntervention) {
      // --- Bloc de mise à jour ---
      const response = await api.put(`/interventions/${selectedIntervention._id}`, dataToSave);

      // CORRECTION CRUCIALE : Extraire l'objet "intervention" de la réponse de l'API.
      const updatedIntervention = response.data.intervention;

      // On utilise l'objet extrait (et complet) pour mettre à jour l'état.
      setInterventions((prev) =>
        prev.map((i) => (i._id === selectedIntervention._id ? updatedIntervention : i))
      );
      message = "Intervention modifiée avec succès!";
    } else {
      // --- Bloc de création ---
      const response = await api.post("/interventions/", dataToSave);

      // CORRECTION CRUCIALE : Extraire l'objet "intervention" de la réponse de l'API.
      const newIntervention = response.data.intervention;

      // On utilise l'objet extrait (et complet) pour mettre à jour l'état.
      setInterventions((prev) => [...prev, newIntervention]);
      message = "Intervention créée avec succès!";
    }
    setSnackMessage(message);
    setSnackSeverity("success")
    setSnackOpen(true);
    handleDialogClose();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement:", error.response || error);
    setSnackMessage(error?.response?.data?.message || "Une erreur est survenue lors de l'enregistrement.");
    setSnackSeverity("error");
    setSnackOpen(true);
  } finally {
    setLoadingSave(false);
  }
};



  const handleDeleteIntervention = async (id) => {
    const confirmDelete = await MySwal.fire({
        title: "Êtes-vous sûr ?",
        text: "Voulez-vous vraiment supprimer cette intervention ?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer!',
        cancelButtonText: 'Annuler'
    });


    if (confirmDelete.isConfirmed) {
      try {
          setLoadingDelete(true);
        await api.delete(`/interventions/${id}`);
        setInterventions((prev) => prev.filter((i) => i._id !== id));
        setSnackMessage("Intervention supprimée avec succès!");
        setSnackSeverity("success")
        setSnackOpen(true);
      } catch (error) {
        console.error("Erreur lors de la suppression de l'intervention:", error.response || error);
        setSnackMessage(error?.response?.data?.message || "Une erreur est survenue lors de la suppression.");
        setSnackSeverity("error");
        setSnackOpen(true);
      } finally {
          setLoadingDelete(false);
      }
    }
  };

    const getTechnicianNames = (technicianArray) => {
        if (!Array.isArray(technicianArray) || technicianArray.length === 0) {
            return <Typography variant="body2" color="textSecondary" component="span">Aucun technicien</Typography>;
        }
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {technicianArray.map((tech, index) => {
                    const techId = tech?._id || tech;
                    const techName = tech?.TECH_nom_prenom || technicianMap[techId] || 'Inconnu';
                    return <Chip key={techId || index} label={techName} size="small" />;
                })}
            </Box>
        );
    };

  const handleSnackClose = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }
    setSnackOpen(false);
  };


  return (
    <Box sx={{ padding: 3, backgroundColor: "#f9f9f9", minHeight: "100vh" }}>

      <Typography variant="h4" gutterBottom color="primary.main">
        Gestion des Interventions
      </Typography>

      {/* --- Filter and Create Section --- */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
              <FilterListIcon sx={{ mr: 1 }} /> Filtrer les interventions
          </Typography>
          <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Statut</InputLabel>
                        <Select
                            value={filterState.status}
                            onChange={handleFilterChange}
                            name="status"
                            label="Statut"
                        >
                            <MenuItem value="">Tous les statuts</MenuItem>
                            <MenuItem value="en attente">En attente</MenuItem>
                            <MenuItem value="en cours">En cours</MenuItem>
                            <MenuItem value="terminé">Terminé</MenuItem>

                        </Select>
                    </FormControl>
              </Grid>
               <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Technicien</InputLabel>
                        <Select
                            value={filterState.technicianId}
                            onChange={handleFilterChange}
                            name="technicianId"
                            label="Technicien"
                            disabled={loadingAllTechnicians}
                        >
                            <MenuItem value="">Tous les techniciens</MenuItem>
                            {Array.isArray(allTechnicians) && allTechnicians.map((tech) => (
                                <MenuItem key={tech._id} value={tech._id}>
                                    {tech.TECH_nom_prenom}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                  <TextField
                      label="Code Ticket"
                      fullWidth
                       size="small"
                      value={filterState.ticketCode}
                      onChange={handleFilterChange}
                      name="ticketCode"
                  />
              </Grid>
               <Grid item xs={12} sm={6} md={3}>
                  <TextField
                      label="Rechercher (Tous les champs texte/code)"
                      fullWidth
                       size="small"
                      value={filterState.searchText}
                      onChange={handleFilterChange}
                      name="searchText"
                  />
              </Grid>
               <Grid item xs={12} sm={6} md={3}>
                  <TextField
                      label="Début Intervention (au plus tôt)"
                      type="date"
                      fullWidth
                       size="small"
                      InputLabelProps={{ shrink: true }}
                      value={filterState.startDate}
                      onChange={handleFilterChange}
                      name="startDate"
                  />
              </Grid>
               <Grid item xs={12} sm={6} md={3}>
                  <TextField
                      label="Début Intervention (au plus tard)"
                      type="date"
                      fullWidth
                       size="small"
                      InputLabelProps={{ shrink: true }}
                      value={filterState.endDate}
                      onChange={handleFilterChange}
                      name="endDate"
                  />
              </Grid>
               <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        label="Date Création (au plus tôt)"
                        type="date"
                        fullWidth
                         size="small"
                        InputLabelProps={{ shrink: true }}
                        value={filterState.creationStartDate}
                        onChange={handleFilterChange}
                        name="creationStartDate"
                    />
               </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        label="Date Création (au plus tard)"
                        type="date"
                        fullWidth
                         size="small"
                        InputLabelProps={{ shrink: true }}
                        value={filterState.creationEndDate}
                        onChange={handleFilterChange}
                        name="creationEndDate"
                    />
                </Grid>
               <Grid item xs={12} sx={{ textAlign: 'right' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleDialogOpen()}
                        startIcon={<AddIcon />}
                    >
                        Créer une Intervention
                    </Button>
               </Grid>
          </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
            <Table sx={{ minWidth: 800 }} aria-label="gestion interventions table">
            <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Code Intervention</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Code Ticket</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Description Panne</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Cause Panne</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Techniciens</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Solution Apportée</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Durée (min)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Coût (TND)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date Début</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date Fin</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date Création</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {loadingInterventions || loadingAllTechnicians || loadingDelete ? (
    <TableRow>
      <TableCell colSpan={13} style={{ textAlign: "center", padding: 50 }}>
          <Box display="flex" justifyContent="center" alignItems="center">
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography variant="body1">Chargement des interventions...</Typography>
          </Box>
      </TableCell>
    </TableRow>
  ) : filteredInterventions.length === 0 ? (
    <TableRow>
      <TableCell colSpan={13} style={{ textAlign: "center", padding: 50 }}>
            <Box>
                <Typography variant="h6" color="textSecondary">
                    {interventions.length === 0 && Object.values(filterState).every(f => f === '')
                        ? "Aucune intervention trouvée."
                        : "Aucune intervention trouvée avec les filtres actuels."
                    }
                </Typography>
                {!loadingInterventions && interventions.length > 0 && filteredInterventions.length === 0 && (
                      <Typography variant="body2" color="textSecondary">
                          (Total interventions : {interventions.length})
                      </Typography>
                )}
            </Box>
      </TableCell>
    </TableRow>
  ) : (
    filteredInterventions.map((i) => (
      <TableRow key={i._id} hover>
        <TableCell>{i.INTR_code || "N/A"}</TableCell>
        <TableCell>{i.INTR_ticket_details?.TCKT_code || i.INTR_ticket || "N/A"}</TableCell>
        <TableCell>{i.INTR_description_panne || "Aucune description"}</TableCell>
        <TableCell>{i.INTR_cause_panne || "N/A"}</TableCell>
        <TableCell>
          {getTechnicianNames(i.INTR_techniciens)}
        </TableCell>
         <TableCell>{i.INTR_solution_apportée||"N/A"}</TableCell>
        <TableCell>{i.INTR_statut || "Inconnu"}</TableCell>
        <TableCell>{i.INTR_durée ?? "N/A"}</TableCell>
        <TableCell>{i.INTR_cost ?? "N/A"}</TableCell>
        <TableCell>
          {formatDateTime(i.INTR_dt_debut)}
        </TableCell>
        <TableCell>
          {formatDateTime(i.INTR_dt_fin)}
        </TableCell>
        <TableCell>
        {formatDateTime(i.Date_creation)}
        </TableCell>


        <TableCell>
          <IconButton
            color="primary"
            onClick={() => handleDialogOpen(i)}
              size="small"
              aria-label="modifier"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            sx={{ ml: 0.5 }}
            onClick={() => handleDeleteIntervention(i._id)}
              size="small"
              aria-label="supprimer"
              disabled={loadingDelete && selectedIntervention?._id === i._id}
          >
            {loadingDelete && selectedIntervention?._id === i._id ? <CircularProgress size={20} /> : <DeleteIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
    ))
  )}
</TableBody>

        </Table>
      </TableContainer>

      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackClose} severity={snackSeverity} sx={{ width: "100%" }} variant="filled">
          {snackMessage}
        </Alert>
      </Snackbar>

      <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedIntervention ? "Modifier l'Intervention" : "Créer une Intervention"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth variant="outlined" required disabled={!!selectedIntervention}>
              <InputLabel>Code Ticket Intervention</InputLabel>
              <Select
                name="INTR_ticket"
                value={formData.INTR_ticket}
                onChange={handleInputChange}
                label="Code Ticket Intervention"
              >
                {loadingTickets ? (
                  <MenuItem disabled>Chargement des tickets...</MenuItem>
                ) : error ? (
                  <MenuItem disabled>{error}</MenuItem>
                ) : tickets.length === 0 ? (
                  <MenuItem disabled>Aucun ticket disponible</MenuItem>
                ) : (
                  tickets.map((ticket) => (
                    <MenuItem key={ticket.TCKT_code} value={ticket.TCKT_code}>
                      {ticket.TCKT_code} - {ticket.TCKT_description.substring(0,55)}...
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <TextField
              label="Description de la panne"
              name="INTR_description_panne"
              value={formData.INTR_description_panne}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
                multiline
                rows={2}
                required
            />
            <FormControl fullWidth variant="outlined">
              <InputLabel>Technicien(s) Assigné(s) au Ticket</InputLabel>
              <Select
                multiple
                name="INTR_techniciens"
                value={formData.INTR_techniciens}
                onChange={handleTechnicianSelect}
                renderValue={(selectedIds) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedIds.map((id) => {
                            const techFromDialog = dialogAssignedTechnicians.find(t => t._id === id);
                            const techName = techFromDialog?.TECH_nom_prenom || technicianMap[id] || id; // Fallback to technicianMap if not found in dialog-specific list
                            return <Chip key={id} label={techName} size="small" />;
                         })}
                    </Box>
                )}
                // Disable if loading technicians or if no ticket is selected or no technicians are assigned to the ticket
                disabled={loadingDialogTechnicians || !formData.INTR_ticket || dialogAssignedTechnicians.length === 0}
              >
                {loadingDialogTechnicians ? (
                    <MenuItem disabled>Chargement des techniciens assignés...</MenuItem>
                ) : !formData.INTR_ticket ? (
                     <MenuItem disabled>Veuillez d'abord sélectionner un ticket.</MenuItem>
                ) : dialogAssignedTechnicians.length === 0 ? (
                    <MenuItem disabled>Aucun technicien assigné à ce ticket.</MenuItem>
                ) : (
                  dialogAssignedTechnicians.map((tech) => (
                    <MenuItem key={tech._id} value={tech._id}>
                      {tech.TECH_nom_prenom}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Statut</InputLabel>
                <Select
                    name="INTR_statut"
                    value={formData.INTR_statut}
                    onChange={handleInputChange}
                    label="Statut"
                    required
                >
                    <MenuItem value="en attente">en attente</MenuItem>
                    <MenuItem value="en cours">en cours</MenuItem>
                    <MenuItem value="terminé">terminé</MenuItem>

                </Select>
              </FormControl>
            <TextField
              label="Cause de la panne"
              name="INTR_cause_panne"
              value={formData.INTR_cause_panne}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
                multiline
                rows={2}
            />
            <TextField
              label="Solution Apportée"
              name="INTR_solution_apportée"
              value={formData.INTR_solution_apportée}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
                multiline
                rows={2}
            />
            <TextField
              label="Durée (minutes)"
              name="INTR_durée"
              value={formData.INTR_durée ?? ''}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              type="number"
                InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              label="Coût de l'intervention (TND)"
              name="INTR_cost"
              value={formData.INTR_cost ?? ''}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              type="number"
              InputProps={{ inputProps: { min: 0, step: "0.01" } }}
            />
            <TextField
              label="Date de début"
              name="INTR_dt_debut"
              value={formData.INTR_dt_debut}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              type="datetime-local"
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="Date de fin"
              name="INTR_dt_fin"
              value={formData.INTR_dt_fin}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              type="datetime-local"
              InputLabelProps={{
                shrink: true,
              }}
            />
             {selectedIntervention?.Date_creation && (
                 <TextField
                     label="Date de Création"
                     value={formatDateTime(selectedIntervention.Date_creation)}
                     fullWidth
                     variant="outlined"
                     InputProps={{ readOnly: true }}
                     InputLabelProps={{ shrink: true }}
                 />
             )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary" disabled={loadingSave}>
            Annuler
          </Button>
          <Button onClick={handleSaveIntervention} color="primary" variant="contained" disabled={loadingSave}>
            {loadingSave ? <CircularProgress size={24} /> : (selectedIntervention ? "Mettre à jour" : "Créer")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionInterventions;
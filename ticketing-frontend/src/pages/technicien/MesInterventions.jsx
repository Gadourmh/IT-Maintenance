import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography,
    Box,
    Grid,
    Button,
    CircularProgress,
    Paper,
    Card,
    CardContent,
    CardActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Chip,
} from '@mui/material';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '../../api/api'; 

import WorkIcon from '@mui/icons-material/Work';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import DescriptionIcon from '@mui/icons-material/Description';
import BugReportIcon from '@mui/icons-material/BugReport';
import BuildIcon from '@mui/icons-material/Build';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EmailIcon from '@mui/icons-material/Email'; // Added for client email
import LocationOnIcon from '@mui/icons-material/LocationOn'; // Added for client address


const MySwal = withReactContent(Swal);

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


const MesInterventionsTechnicien = () => {
  const [technicianId, setTechnicianId] = useState(''); // ID of the logged-in technician
  const [interventions, setInterventions] = useState([]);
  const [allTechnicians, setAllTechnicians] = useState([]); // All technicians in the system (for name mapping)

  const [loading, setLoading] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true); // For all technicians list
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);


  const [assignedUserTickets, setAssignedUserTickets] = useState([]); // Tickets assigned to the current technician
  const [loadingUserTickets, setLoadingUserTickets] = useState(false);
  const [techniciansForSelectedTicket, setTechniciansForSelectedTicket] = useState([]); // Technicians for the ticket selected in the dialog
  const [loadingTechniciansForTicket, setLoadingTechniciansForTicket] = useState(false);


  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newFormData, setNewFormData] = useState({
      INTR_ticket: '', // This will now store the selected TICKET CODE (TCKT_code)
      INTR_techniciens: [], // Array of technician _ids
      INTR_description_panne: '',
      INTR_cause_panne: '',
      INTR_solution_apportée: '',
      INTR_statut: 'en cours',
      INTR_durée: 0,
      INTR_dt_debut: '',
      INTR_dt_fin: '',
  });


  const [snackMessage, setSnackMessage] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");
  const [snackOpen, setSnackOpen] = useState(false);


  const [filterState, setFilterState] = useState({
      status: '',
      ticketCode: '',
      searchText: '',
      startDate: '',
      endDate: '',
  });

    const handleSnackClose = (event, reason) => {
        if (reason === 'clickaway') {
          return;
        }
        setSnackOpen(false);
    };


  useEffect(() => {
    const fetchDataInitial = async () => { // Renamed to avoid conflict
        setLoading(true);
        setLoadingTechnicians(true);
        const techInfo = await fetchTechnicianInfo();
        await fetchAllTechnicians(); // Fetch all technicians for mapping names

        if(techInfo && techInfo._id) {
             await fetchInterventionsByTechnician(techInfo._id);
             // Fetch tickets assigned to the current technician (for the dialog dropdown)
             await fetchTicketsForCurrentUser(techInfo._id);
        } else {
             setLoading(false); // Ensure loading stops if techInfo is not available
        }
    };
    fetchDataInitial();
  }, []);


  const fetchTechnicianInfo = async () => {
    try {
      const res = await api.get('/techniciens/me');
      setTechnicianId(res.data._id); // Keep logged-in technician's ID
      return res.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du technicien :', error.response?.data || error);
      Swal.fire('Erreur', error?.response?.data?.message || 'Impossible de récupérer les informations du technicien.', 'error');
    }
    return null;
  };

  const fetchAllTechnicians = async () => {
    setLoadingTechnicians(true);
    try {
        const res = await api.get('/techniciens/');
        setAllTechnicians(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les techniciens :', error.response?.data || error);
    } finally {
        setLoadingTechnicians(false);
    }
};


  const fetchInterventionsByTechnician = async (currentTechId) => {
    if (!currentTechId) {
        setLoading(false);
        return;
    }
    try {
        setLoading(true);
      // This endpoint should now return interventions with INTR_ticket_details populated
      const res = await api.get(`/interventions/technicien/${currentTechId}`);
      setInterventions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Erreur récupération interventions technicien :', error.response?.data || error);
      Swal.fire('Erreur', error?.response?.data?.message || 'Impossible de récupérer les interventions assignées.', 'error');
    } finally {
        setLoading(false);
    }
  };

  // Fetch tickets assigned to current logged-in technician (for the "Create Intervention" Dialog)
  const fetchTicketsForCurrentUser = async (currentTechId) => {
    if (!currentTechId) return;
    setLoadingUserTickets(true);
    try {
        // This API should return tickets where the current technician is one of the assigned TCKT_techniciens
        const res = await api.get(`/tickets/technicien/${currentTechId}`);
        setAssignedUserTickets(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
        console.error('Erreur récupération des tickets du technicien:', error.response?.data || error);
        setSnackMessage(error?.response?.data?.message || 'Impossible de récupérer les tickets assignés.');
        setSnackSeverity("error");
        setSnackOpen(true);
    } finally {
        setLoadingUserTickets(false);
    }
  };

  // Fetch technicians assigned to a specific ticket code (for the "Create Intervention" Dialog)
  const fetchTechniciansForSelectedTicketApi = async (ticketCode) => {
    if (!ticketCode) {
        setTechniciansForSelectedTicket([]);
        // When ticket is deselected, clear the technicians in the form
        setNewFormData(prevData => ({ ...prevData, INTR_techniciens: [] }));
        return;
    }
    setLoadingTechniciansForTicket(true);
    try {
        const res = await api.get(`/tickets/code/${ticketCode}/techniciens`);
        const fetchedTechnicians = Array.isArray(res.data) ? res.data : (res.data?.technicians && Array.isArray(res.data.technicians) ? res.data.technicians : []);

        setTechniciansForSelectedTicket(fetchedTechnicians);

        // Update the form's technician list with IDs of those assigned to the ticket
        const assignedTechIds = fetchedTechnicians.map(t => t._id);
        setNewFormData(prevData => ({
            ...prevData,
            INTR_techniciens: assignedTechIds,
        }));

    } catch (error) {
        console.error(`Erreur récupération techniciens pour ticket ${ticketCode}:`, error.response?.data || error);
        setSnackMessage(error?.response?.data?.message || `Impossible de récupérer les techniciens pour le ticket ${ticketCode}.`);
        setSnackSeverity("error");
        setSnackOpen(true);
        setTechniciansForSelectedTicket([]);
        setNewFormData(prevData => ({ ...prevData, INTR_techniciens: [] })); // Clear on error
    } finally {
        setLoadingTechniciansForTicket(false);
    }
  };


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterState(prev => ({ ...prev, [name]: value }));
    };

    const filteredInterventions = useMemo(() => {
        if (!Array.isArray(interventions)) return [];
        return interventions.filter(intr => {
            const { status, ticketCode, searchText, startDate, endDate } = filterState;
            const statusMatch = status === '' || intr.INTR_statut === status;
            
            // Updated to use INTR_ticket_details
            const ticketCodeMatch = ticketCode === '' ||
                                    (intr.INTR_ticket_details?.TCKT_code || '').toLowerCase().includes(ticketCode.toLowerCase());

            const searchTextLower = searchText.toLowerCase();
            const searchMatch = searchText === '' ||
                                (intr.INTR_description_panne || '').toLowerCase().includes(searchTextLower) ||
                                (intr.INTR_cause_panne || '').toLowerCase().includes(searchTextLower) ||
                                (intr.INTR_solution_apportée || '').toLowerCase().includes(searchTextLower) ||
                                // Search in client details
                                (intr.INTR_ticket_details?.TCKT_client_details?.CLNT_raison_sociale || '').toLowerCase().includes(searchTextLower) ||
                                (intr.INTR_ticket_details?.TCKT_client_details?.CLNT_code || '').toLowerCase().includes(searchTextLower) ||
                                (intr.INTR_ticket_details?.TCKT_client_details?.CLNT_email || '').toLowerCase().includes(searchTextLower) ||
                                // Search in equipment
                                (typeof intr.INTR_ticket_details?.TCKT_equipment === 'string' && intr.INTR_ticket_details.TCKT_equipment.toLowerCase().includes(searchTextLower)) ||
                                (typeof intr.INTR_ticket_details?.TCKT_equipment?.EQPT_libelle === 'string' && intr.INTR_ticket_details.TCKT_equipment.EQPT_libelle.toLowerCase().includes(searchTextLower)) ;


            const interventionDate = intr.INTR_dt_debut ? new Date(intr.INTR_dt_debut) : null;
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : null;
            const dateMatch = (!start || (interventionDate && interventionDate >= start)) &&
                                (!end || (interventionDate && interventionDate <= end));
            return statusMatch && ticketCodeMatch && searchMatch && dateMatch;
        });
    }, [interventions, filterState]);


  const handleOpenCreateDialog = () => {
      if (!technicianId) { 
           setSnackMessage("Impossible de créer l'intervention : ID technicien non disponible.");
           setSnackSeverity("error");
           setSnackOpen(true);
           return;
      }
      setNewFormData({ // Reset form
           INTR_ticket: '', // Will be ticket CODE (TCKT_code)
           INTR_techniciens: [], // Will be populated based on selected ticket
           INTR_description_panne: '',
           INTR_cause_panne: '',
           INTR_solution_apportée: '',
           INTR_statut: 'en cours',
           INTR_durée: 0,
           INTR_dt_debut: '',
           INTR_dt_fin: '',
      });
      setTechniciansForSelectedTicket([]); // Clear previous ticket's technicians
      setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
      setOpenCreateDialog(false);
  };

  const handleNewInputChange = (e) => {
      const { name, value } = e.target;
      const newValue = (name === 'INTR_durée' && value !== '') ? parseInt(value, 10) : value;
      setNewFormData(prevData => ({ ...prevData, [name]: newValue }));

      if (name === 'INTR_ticket') {
          if (value) { // value is the TCKT_code
              fetchTechniciansForSelectedTicketApi(value); // Fetch technicians for this TCKT_code
          } else {
              fetchTechniciansForSelectedTicketApi(null); // Clear/reset if no ticket selected
          }
      }
  };

  const handleNewTechnicianSelect = (event) => {
        const { value } = event.target; // value is an array of selected technician _ids
        setNewFormData((prevData) => ({
            ...prevData,
            INTR_techniciens: typeof value === 'string' ? value.split(',') : value,
        }));
    };


  const handleCreateIntervention = async () => {
       if (!newFormData.INTR_ticket || !newFormData.INTR_description_panne.trim() || !newFormData.INTR_statut) {
           setSnackMessage("Veuillez remplir les champs obligatoires (Ticket, Description, Statut).");
           setSnackSeverity("warning");
           setSnackOpen(true);
           return;
       }
       if (!technicianId) {
            setSnackMessage("Impossible de créer l'intervention : ID technicien non disponible.");
            setSnackSeverity("error");
            setSnackOpen(true);
            return;
       }
        if (newFormData.INTR_techniciens.length === 0) {
            setSnackMessage("Veuillez sélectionner au moins un technicien pour l'intervention.");
            setSnackSeverity("warning");
            setSnackOpen(true);
            return;
        }

       const dataToCreate = {
           ...newFormData,
            INTR_techniciens: Array.isArray(newFormData.INTR_techniciens) ? newFormData.INTR_techniciens : [], 
            INTR_dt_debut: newFormData.INTR_dt_debut || null,
            INTR_dt_fin: newFormData.INTR_dt_fin || null,
            INTR_durée: (newFormData.INTR_durée === 0 || newFormData.INTR_durée === '' || newFormData.INTR_durée === null || isNaN(newFormData.INTR_durée)) ? null : newFormData.INTR_durée ,
       };

       try {
           setLoadingCreate(true);
           await api.post('/interventions/', dataToCreate);
           await fetchInterventionsByTechnician(technicianId); 

           setSnackMessage("Intervention créée avec succès !");
           setSnackSeverity("success");
           setSnackOpen(true);
           handleCloseCreateDialog();

       } catch (error) {
           console.error('Erreur lors de la création de l\'intervention :', error.response || error);
           setSnackMessage(error?.response?.data?.message || "Une erreur est survenue lors de la création de l'intervention.");
           setSnackSeverity("error");
           setSnackOpen(true);
       } finally {
           setLoadingCreate(false);
       }
  };


  // NOUVEAU : Ouvre la boîte de dialogue de modification et pré-remplit les données.
  const handleOpenEditDialog = (intervention) => {
      setEditingIntervention({
          ...intervention,
          // Formate les dates pour les champs <input type="datetime-local">
          INTR_dt_debut: formatDateForInput(intervention.INTR_dt_debut),
          INTR_dt_fin: formatDateForInput(intervention.INTR_dt_fin),
      });
      setOpenEditDialog(true);
  };

  // NOUVEAU : Ferme la boîte de dialogue de modification.
  const handleCloseEditDialog = () => {
      setOpenEditDialog(false);
      setEditingIntervention(null); // Nettoie l'état
  };
  
  // NOUVEAU : Gère les changements dans les champs du formulaire de modification.
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingIntervention(prev => ({ ...prev, [name]: value }));
  };

  // NOUVEAU : Soumet les modifications à l'API.
  const handleUpdateIntervention = async () => {
      if (!editingIntervention) return;

      if (!editingIntervention.INTR_description_panne || !editingIntervention.INTR_statut) {
          setSnackMessage('La description et le statut sont des champs obligatoires.');
          setSnackSeverity('warning');
          setSnackOpen(true);
          return;
      }

      setLoadingUpdate(true);
      try {
          // L'objet `editingIntervention` contient déjà toutes les données à jour
          await api.put(`/interventions/${editingIntervention._id}`, editingIntervention);

          setSnackMessage('Intervention mise à jour avec succès.');
          setSnackSeverity("success");
          setSnackOpen(true);
          handleCloseEditDialog();
          await fetchInterventionsByTechnician(technicianId); // Refresh list
      } catch (err) {
          console.error(err);
          setSnackMessage(err?.response?.data?.message || 'Échec de la mise à jour de l’intervention.');
          setSnackSeverity("error");
          setSnackOpen(true);
      } finally {
          setLoadingUpdate(false);
      }
  };

  
    const getTechnicianNamesDisplay = (technicianData) => {
        if (!Array.isArray(technicianData) || technicianData.length === 0) {
            return <Typography variant="body2" color="textSecondary" component="span">Aucun technicien</Typography>;
        }
        const names = technicianData.map(techOrId => {
            const techObj = allTechnicians.find(t => t._id === (techOrId?._id || techOrId));
            return techObj?.TECH_nom_prenom || 'Inconnu';
        }).join(', ');

        return <Typography variant="body2" component="span">{names}</Typography>;
    };


  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Mes Interventions</Typography>

        <Box mb={3} textAlign="right">
             <Button
                variant="contained"
                color="primary"
                onClick={handleOpenCreateDialog}
                startIcon={<AddIcon />}
                disabled={loading || loadingTechnicians || !technicianId || loadingUserTickets}
             >
                 Créer une Intervention
             </Button>
        </Box>

        {!loading && (interventions.length > 0 || Object.values(filterState).some(f => f !== '')) && (
            <Box mb={4} p={2} component={Paper} elevation={2}>
              <Typography variant="h6" gutterBottom>
                  <FilterListIcon sx={{ mr: 1 }} /> Filtrer les interventions
              </Typography>
              <Grid container spacing={2}>
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
                          label="Rechercher (Description, Client, etc.)"
                          fullWidth
                           size="small"
                          value={filterState.searchText}
                          onChange={handleFilterChange}
                          name="searchText"
                      />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                      <TextField
                          label="Date début (au plus tôt)"
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
                          label="Date fin (au plus tard)"
                          type="date"
                          fullWidth
                           size="small"
                          InputLabelProps={{ shrink: true }}
                          value={filterState.endDate}
                          onChange={handleFilterChange}
                          name="endDate"
                      />
                  </Grid>
              </Grid>
            </Box>
        )}

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Liste des Interventions Assignées</Typography>

        {loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>Chargement des interventions...</Typography>
            </Box>
        ) : filteredInterventions.length > 0 ? (
          <Grid container spacing={3}>
            {filteredInterventions.map((intr) => (
              <Grid item xs={12} sm={6} md={4} key={intr._id}>
                <Card elevation={3}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        <WorkIcon fontSize="small" color="action" sx={{ mr: 1 }} /> Intervention : {intr.INTR_code || 'N/A'}
                      </Typography>
                        <Divider sx={{ mb: 2 }} />

                      <Box display="flex" alignItems="flex-start" mb={1}>
                           <AssignmentTurnedInIcon fontSize="small" color="info" sx={{ mr: 1, mt: 0.5 }} />
                           <Typography variant="body2">Statut : {intr.INTR_statut || 'Inconnu'}</Typography>
                        </Box>
                         {intr.INTR_description_panne && (
                            <Box display="flex" alignItems="flex-start" mb={1}>
                                <DescriptionIcon fontSize="small" color="action" sx={{ mr: 1, mt: 0.5 }} />
                                <Typography variant="body2">Description Panne : {intr.INTR_description_panne}</Typography>
                            </Box>
                         )}
                         {intr.INTR_cause_panne && (
                            <Box display="flex" alignItems="flex-start" mb={1}>
                                <BugReportIcon fontSize="small" color="warning" sx={{ mr: 1, mt: 0.5 }} />
                                <Typography variant="body2">Cause : {intr.INTR_cause_panne}</Typography>
                            </Box>
                         )}
                         {intr.INTR_solution_apportée && (
                           <Box display="flex" alignItems="flex-start" mb={1}>
                               <BuildIcon fontSize="small" color="success" sx={{ mr: 1, mt: 0.5 }} />
                               <Typography variant="body2">Solution : {intr.INTR_solution_apportée}</Typography>
                           </Box>
                         )}
                         {intr.INTR_durée != null && (
                             <Box display="flex" alignItems="center" mb={1}>
                                 <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                 <Typography variant="body2">Durée : {intr.INTR_durée} min</Typography>
                             </Box>
                         )}
                         {intr.INTR_cost != null && ( // Display cost if available
                             <Box display="flex" alignItems="center" mb={1}>
                                 <AttachMoneyIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                                 <Typography variant="body2">Coût : {intr.INTR_cost} TND</Typography>
                             </Box>
                         )}
                         {intr.INTR_dt_debut && (
                             <Box display="flex" alignItems="center" mb={1}>
                                 <CalendarMonthIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                 <Typography variant="body2">Début : {formatDateTime(intr.INTR_dt_debut)}</Typography>
                             </Box>
                         )}
                          {intr.INTR_dt_fin && (
                            <Box display="flex" alignItems="center" mb={1}>
                                <CalendarMonthIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2">Fin : {formatDateTime(intr.INTR_dt_fin)}</Typography>
                            </Box>
                          )}
                         <Box display="flex" alignItems="flex-start" mb={1}>
                            <PersonIcon fontSize="small" color="action" sx={{ mr: 1, mt: 0.5 }} />
                             <Typography variant="body2">Techniciens : {getTechnicianNamesDisplay(intr.INTR_techniciens)}</Typography>
                         </Box>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                           <ConfirmationNumberIcon fontSize="small" color="action" sx={{ mr: 1 }} /> Détails du Ticket Associé
                        </Typography>

                         {/* Updated to use INTR_ticket_details */}
                         {intr.INTR_ticket_details ? (
                            <>
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Typography variant="body2">Code Ticket : {intr.INTR_ticket_details.TCKT_code || 'N/A'}</Typography>
                                </Box>
                                
                                {/* Client Details */}
                                {intr.INTR_ticket_details.TCKT_client_details ? (
                                    <>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2">Client : {intr.INTR_ticket_details.TCKT_client_details.CLNT_raison_sociale || intr.INTR_ticket_details.TCKT_client_code_fallback || 'N/A'}</Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2">Email Client : {intr.INTR_ticket_details.TCKT_client_details.CLNT_email || 'N/A'}</Typography>
                                        </Box>
                                        {intr.INTR_ticket_details.TCKT_client_details.CLNT_addresses && intr.INTR_ticket_details.TCKT_client_details.CLNT_addresses.length > 0 && (
                                            <Box display="flex" alignItems="flex-start" mb={1}> {/* Use flex-start for multi-line addresses */}
                                                <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1, mt: 0.5 }} />
                                                <Typography variant="body2">Adresse Client : {intr.INTR_ticket_details.TCKT_client_details.CLNT_addresses[0].address || 'N/A'}</Typography>
                                            </Box>
                                        )}
                                    </>
                                ) : intr.INTR_ticket_details.TCKT_client_code_fallback ? (
                                     <Box display="flex" alignItems="center" mb={1}>
                                         <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                         <Typography variant="body2">Client Code : {intr.INTR_ticket_details.TCKT_client_code_fallback}</Typography>
                                     </Box>
                                ) : null}
                                
                                {/* Equipment Details */}
                                {intr.INTR_ticket_details.TCKT_equipment ? (
                                     <Box display="flex" alignItems="center" mb={1}>
                                          <ComputerIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                          <Typography variant="body2">
                                            Équipement : 
                                            {typeof intr.INTR_ticket_details.TCKT_equipment === 'object' 
                                                ? intr.INTR_ticket_details.TCKT_equipment.EQPT_libelle || intr.INTR_ticket_details.TCKT_equipment.EQPT_code || 'Détails équipement N/A' 
                                                : intr.INTR_ticket_details.TCKT_equipment} 
                                          </Typography>
                                     </Box>
                                ) : null }

                                {intr.INTR_ticket_details.TCKT_degre_urgence && (
                                    <Box display="flex" alignItems="center" mb={1}>
                                         <WarningIcon fontSize="small" color="warning" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Urgence : {intr.INTR_ticket_details.TCKT_degre_urgence}</Typography>
                                    </Box>
                                )}
                                {intr.INTR_ticket_details.TCKT_statut && (
                                    <Box display="flex" alignItems="center" mb={1}>
                                         <AssignmentTurnedInIcon fontSize="small" color="info" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Statut Ticket : {intr.INTR_ticket_details.TCKT_statut}</Typography>
                                    </Box>
                                )}
                                {intr.INTR_ticket_details.TCKT_DT_resolution_demandee && (
                                    <Box display="flex" alignItems="center" mb={1}>
                                         <CalendarMonthIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Résolution demandée : {formatDate(intr.INTR_ticket_details.TCKT_DT_resolution_demandee)}</Typography>
                                    </Box>
                                )}
                                {intr.INTR_ticket_details.TCKT_DT_resolution_confirmee && (
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Résolution confirmée : {formatDate(intr.INTR_ticket_details.TCKT_DT_resolution_confirmee)}</Typography>
                                    </Box>
                                )}
                            </>
                         ) : (
                            <Typography variant="body2" color="textSecondary">Détails du ticket non disponibles.</Typography>
                         )}
                     </CardContent>
                     <CardActions sx={{ justifyContent: 'flex-end' }}>
                         <Button size="small" variant="contained" color="primary" onClick={() => handleOpenEditDialog(intr)}>
                           Modifier
                        </Button>
                     </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
             <Box mt={4} textAlign="center">
                 <Typography variant="h6" color="textSecondary">
                      {loading ? "Chargement..." : (interventions.length === 0 && Object.values(filterState).every(f => f === '')
                         ? "Aucune intervention assignée pour vous."
                         : "Aucune intervention trouvée avec les filtres actuels."
                      )}
                 </Typography>
                 {!loading && interventions.length > 0 && filteredInterventions.length === 0 && (
                      <Typography variant="body2" color="textSecondary">{`(Total interventions assignées : ${interventions.length})`}</Typography>
                 )}
              </Box>
        )}
      </Box>

        <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Créer une nouvelle Intervention</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} pt={1}>
                    <FormControl fullWidth variant="outlined" required>
                        <InputLabel id="ticket-select-label">Ticket Assigné *</InputLabel>
                        <Select
                            labelId="ticket-select-label"
                            name="INTR_ticket" // This will store the ticket's CODE (TCKT_code)
                            value={newFormData.INTR_ticket} // Expects TCKT_code
                            onChange={handleNewInputChange} // Triggers technician fetch using TCKT_code
                            label="Ticket Assigné *"
                            disabled={loadingUserTickets}
                        >
                            {loadingUserTickets ? (
                                <MenuItem disabled value="">
                                    <CircularProgress size={20} sx={{mr:1}} /> Chargement des tickets...
                                </MenuItem>
                            ) : assignedUserTickets.length === 0 ? (
                                <MenuItem disabled value="">Aucun ticket assigné trouvé (vérifiez vos assignations)</MenuItem>
                            ) : (
                                assignedUserTickets.map((ticket) => (
                                    <MenuItem key={ticket._id} value={ticket.TCKT_code}>
                                        {ticket.TCKT_code} {ticket.TCKT_description ? `- ${ticket.TCKT_description.substring(0,50)}...` : ''}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth variant="outlined" required> {/* Made required */}
                        <InputLabel id="technicians-select-label">Technicien(s) Assigné(s) au Ticket *</InputLabel>
                        <Select
                            labelId="technicians-select-label"
                            multiple
                            name="INTR_techniciens" // Stores array of technician _ids
                            value={newFormData.INTR_techniciens}
                            onChange={handleNewTechnicianSelect}
                            label="Technicien(s) Assigné(s) au Ticket *"
                            disabled={loadingTechniciansForTicket || !newFormData.INTR_ticket} // Disable if loading or no ticket selected
                            renderValue={(selectedIds) => ( // selectedIds are technician _ids
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                   {selectedIds.map((id) => {
                                       const tech = techniciansForSelectedTicket.find(t => t._id === id) || allTechnicians.find(t => t._id === id);
                                       return <Chip key={id} label={tech?.TECH_nom_prenom || id} size="small" />;
                                   })}
                               </Box>
                            )}
                        >
                             {loadingTechniciansForTicket ? (
                                 <MenuItem disabled>
                                    <CircularProgress size={20} sx={{mr:1}}/> Chargement des techniciens du ticket...
                                 </MenuItem>
                             ) : !newFormData.INTR_ticket ? ( // No ticket code selected yet
                                 <MenuItem disabled>Sélectionnez d'abord un ticket</MenuItem>
                             ) : techniciansForSelectedTicket.length > 0 ? (
                                techniciansForSelectedTicket.map((tech) => (
                                     <MenuItem key={tech._id} value={tech._id}> {/* Value is tech _id */}
                                         {tech.TECH_nom_prenom} ({tech.TECH_email || 'N/A'})
                                         {tech._id === technicianId && <Chip label="Vous" size="small" sx={{ ml: 1}} />}
                                     </MenuItem>
                                 ))
                             ) : ( // Ticket is selected, but API returned no technicians for it
                                <MenuItem disabled>Aucun technicien spécifiquement assigné à ce ticket via l'API.</MenuItem>
                             )
                            }
                        </Select>
                         {!loadingTechniciansForTicket && newFormData.INTR_ticket && techniciansForSelectedTicket.length === 0 && (
                            <Typography variant="caption" color="textSecondary" sx={{mt: 0.5, ml: 1.5}}>
                                Si vous êtes assigné à ce ticket, votre nom devrait apparaître. Sinon, contactez un admin.
                            </Typography>
                        )}
                    </FormControl>

                    <TextField
                        label="Description de la panne *"
                        name="INTR_description_panne"
                        value={newFormData.INTR_description_panne}
                        onChange={handleNewInputChange}
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={2}
                        required
                    />
                    <TextField
                        label="Cause de la panne"
                        name="INTR_cause_panne"
                        value={newFormData.INTR_cause_panne}
                        onChange={handleNewInputChange}
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={2}
                    />
                    <TextField
                        label="Solution Apportée"
                        name="INTR_solution_apportée"
                        value={newFormData.INTR_solution_apportée}
                        onChange={handleNewInputChange}
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={2}
                    />
                     <FormControl fullWidth variant="outlined" required>
                        <InputLabel>Statut *</InputLabel>
                        <Select
                            name="INTR_statut"
                            value={newFormData.INTR_statut}
                            onChange={handleNewInputChange}
                            label="Statut *"
                        >
                             <MenuItem value="en attente">En attente</MenuItem>
                             <MenuItem value="en cours">En cours</MenuItem>
                             <MenuItem value="terminé">Terminé</MenuItem>
                           
                        </Select>
                     </FormControl>
                    <TextField
                        label="Durée (minutes)"
                        name="INTR_durée"
                        value={newFormData.INTR_durée ?? ''}
                        onChange={handleNewInputChange}
                        fullWidth
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 0 } }}
                        disabled // CHAMP DÉSACIVÉ
                    />
                    <TextField
                        label="Date de début"
                        name="INTR_dt_debut"
                        value={newFormData.INTR_dt_debut}
                        onChange={handleNewInputChange}
                        fullWidth
                        variant="outlined"
                        type="datetime-local"
                        InputLabelProps={{ shrink: true }}
                        disabled // CHAMP DÉSACIVÉ
                    />
                    <TextField
                        label="Date de fin"
                        name="INTR_dt_fin"
                        value={newFormData.INTR_dt_fin}
                        onChange={handleNewInputChange}
                        fullWidth
                        variant="outlined"
                        type="datetime-local"
                        InputLabelProps={{ shrink: true }}
                        disabled // CHAMP DÉSACIVÉ
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseCreateDialog} color="secondary" disabled={loadingCreate}>
                    Annuler
                </Button>
                <Button onClick={handleCreateIntervention} color="primary" variant="contained" disabled={loadingCreate || loadingUserTickets || loadingTechniciansForTicket}>
                     {loadingCreate ? <CircularProgress size={24} /> : "Créer"}
                </Button>
            </DialogActions>
        </Dialog>

{/* NOUVEAU : Boîte de dialogue pour la modification */}
        <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
            <DialogTitle>Modifier l'Intervention {editingIntervention?.INTR_code || ''}</DialogTitle>
            <DialogContent>
                <Box component="form" sx={{ mt: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                name="INTR_description_panne"
                                label="Description de la panne"
                                value={editingIntervention?.INTR_description_panne || ''}
                                onChange={handleEditInputChange}
                                fullWidth
                                multiline
                                rows={3}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="INTR_cause_panne"
                                label="Cause de la panne"
                                value={editingIntervention?.INTR_cause_panne || ''}
                                onChange={handleEditInputChange}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Grid>
                        <Grid item xs={12}>
                             <TextField
                                name="INTR_solution_apportée"
                                label="Solution Apportée"
                                value={editingIntervention?.INTR_solution_apportée || ''}
                                onChange={handleEditInputChange}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Statut</InputLabel>
                                <Select
                                    name="INTR_statut"
                                    value={editingIntervention?.INTR_statut || 'en cours'}
                                    onChange={handleEditInputChange}
                                    label="Statut"
                                >
                                    <MenuItem value="en attente">En attente</MenuItem>
                                    <MenuItem value="en cours">En cours</MenuItem>
                                    <MenuItem value="terminé">Terminé</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                             <TextField
                                name="INTR_durée"
                                label="Durée (minutes)"
                                value={editingIntervention?.INTR_durée ?? ''}
                                fullWidth
                                type="number"
                                disabled
                                helperText="Ce champ est calculé automatiquement."
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                             <TextField
                                label="Date de début"
                                name="INTR_dt_debut"
                                value={editingIntervention?.INTR_dt_debut || ''}
                                fullWidth
                                type="datetime-local"
                                disabled
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                         <Grid item xs={12} sm={6}>
                            <TextField
                                label="Date de fin"
                                name="INTR_dt_fin"
                                value={editingIntervention?.INTR_dt_fin || ''}
                                fullWidth
                                type="datetime-local"
                                disabled
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                             <TextField
                                label="Coût (TND)"
                                name="INTR_cost"
                                value={editingIntervention?.INTR_cost ?? ''}
                                fullWidth
                                type="number"
                                disabled
                                helperText="Ce champ est géré par le système."
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseEditDialog} color="secondary" disabled={loadingUpdate}>
                    Annuler
                </Button>
                <Button onClick={handleUpdateIntervention} color="primary" variant="contained" disabled={loadingUpdate}>
                     {loadingUpdate ? <CircularProgress size={24} /> : "Enregistrer les modifications"}
                </Button>
            </DialogActions>
        </Dialog>

        



        <Snackbar
            open={snackOpen}
            autoHideDuration={6000}
            onClose={handleSnackClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert onClose={handleSnackClose} severity={snackSeverity} sx={{ width: '100%' }} variant="filled">
                {snackMessage}
            </Alert>
        </Snackbar>

    </Box>
  );
};

export default MesInterventionsTechnicien;
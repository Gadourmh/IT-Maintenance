import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Chip,
    Divider,
} from '@mui/material';

import WarningIcon from '@mui/icons-material/Warning';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';


const statusList = ["ouvert", "en cours", "résolu", "fermé"];

const getUrgencyColor = (urgence) => {
    switch (urgence?.toLowerCase()) {
        case "faible": return "success"; // Vert
        case "moyenne": return "warning"; // Orange/Jaune (Corrigé)
        case "élevée": return "error"; // Rouge (Corrigé)
        default: return "default"; // Couleur par défaut
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


const Kanban = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [technicianId, setTechnicianId] = useState(null);
  const [filterState, setFilterState] = useState({
      searchText: '',
      urgency: '',
  });


  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get("/techniciens/me");
        const techId = profileRes.data._id;
        setTechnicianId(techId);

        const ticketsRes = await api.get(`/tickets/technicien/${techId}`);
        setTickets(ticketsRes.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

    const filteredTickets = useMemo(() => {
        if (!Array.isArray(tickets)) return [];

        return tickets.filter(ticket => {
            const { searchText, urgency } = filterState;

            const searchMatch = searchText === '' ||
                                (ticket.TCKT_code || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                (ticket.TCKT_description || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                (ticket.TCKT_client?.CLNT_nom || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                (ticket.TCKT_equipment?.EQPT_libelle || '').toLowerCase().includes(searchText.toLowerCase());


            const urgencyMatch = urgency === '' || (ticket.TCKT_degre_urgence || '').toLowerCase() === urgency.toLowerCase();

            return searchMatch && urgencyMatch;
        });
    }, [tickets, filterState]);


  const getTicketsByStatus = (status) =>
    filteredTickets.filter((ticket) => ticket.TCKT_statut === status);


  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
        return;
    }

    const ticketToMove = tickets.find(ticket => ticket._id === draggableId);
    if (!ticketToMove) return;

    const originalStatus = ticketToMove.TCKT_statut;
    const newStatus = destination.droppableId;

    const updatedTickets = tickets.map((ticket) =>
        ticket._id === draggableId
            ? { ...ticket, TCKT_statut: newStatus }
            : ticket
    );
    setTickets(updatedTickets);

     try {
       await api.put(`/tickets/${draggableId}`, {
         TCKT_statut: newStatus,
       });
     } catch (error) {
       console.error("Erreur lors du changement de statut :", error);
        const revertedTickets = tickets.map((ticket) =>
            ticket._id === draggableId
                ? { ...ticket, TCKT_statut: originalStatus }
                : ticket
        );
        setTickets(revertedTickets);
     }
   };

  const getStatusColor = (status) => {
    switch (status) {
      case "ouvert": return "#FFF9C4";
      case "en cours": return "#BBDEFB";
      case "résolu": return "#C8E6C9";
      case "fermé": return "#E0E0E0";
      default: return "#FFFFFF";
    }
  };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterState(prev => ({ ...prev, [name]: value }));
    };


  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>🛠️ Suivi des Tickets - Vue Kanban</Typography>

       {!loading && (
         <Box mb={4} p={2} component={Paper} elevation={2}>
            <Typography variant="h6" gutterBottom>
                <FilterListIcon sx={{ mr: 1 }} /> Filtrer les tickets
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                    <TextField
                        label="Rechercher (Code, Description, Client, Equipement)"
                        fullWidth
                         size="small"
                        value={filterState.searchText}
                        onChange={handleFilterChange}
                        name="searchText"
                    />
                </Grid>
                 <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Urgence</InputLabel>
                        <Select
                            value={filterState.urgency}
                            onChange={handleFilterChange}
                            name="urgency"
                            label="Urgence"
                        >
                            <MenuItem value="">Toutes les urgences</MenuItem>
                            {/* Valeurs corrigées ici */}
                            <MenuItem value="faible">Faible</MenuItem>
                            <MenuItem value="moyenne">Moyenne</MenuItem>
                            <MenuItem value="élevée">Élevée</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </Box>
       )}


      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredTickets.length === 0 && Object.values(filterState).every(f => f === '') ? (
          <Box mt={4} textAlign="center">
              <Typography variant="h6" color="textSecondary">
                  Aucun ticket assigné.
              </Typography>
          </Box>
      ) : filteredTickets.length === 0 && !Object.values(filterState).every(f => f === '') ? (
           <Box mt={4} textAlign="center">
              <Typography variant="h6" color="textSecondary">
                   Aucun ticket trouvé avec les filtres actuels.
               </Typography>
                {tickets.length > 0 && (
                     <Typography variant="body2" color="textSecondary">
                        (Total tickets assignés : {tickets.length})
                     </Typography>
                )}
           </Box>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={3}>
            {statusList.map((status) => (
              <Droppable droppableId={status} key={status}>
                {(provided, snapshot) => (
                  <Paper
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    elevation={snapshot.isDraggingOver ? 6 : 3}
                    sx={{
                      backgroundColor: getStatusColor(status),
                      borderRadius: 2,
                      padding: 2,
                      minHeight: 400,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {status} ({getTicketsByStatus(status).length})
                    </Typography>
                     <Divider sx={{ mb: 2 }} />

                    <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                      {getTicketsByStatus(status).map((ticket, index) => (
                        <Draggable draggableId={ticket._id} index={index} key={ticket._id}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{ marginBottom: 2, boxShadow: 3, borderRadius: 2 }}
                            >
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                         <ConfirmationNumberIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        {ticket.TCKT_code || 'Ticket sans code'}
                                    </Typography>
                                     {ticket.TCKT_degre_urgence && (
                                        <Chip
                                            icon={<WarningIcon fontSize="small" />}
                                            label={ticket.TCKT_degre_urgence}
                                            color={getUrgencyColor(ticket.TCKT_degre_urgence)}
                                            size="small"
                                        />
                                     )}
                                </Box>
                                 <Divider sx={{ mb: 1 }} />

                                 <Box display="flex" alignItems="flex-start" mb={1}>
                                     <DescriptionIcon fontSize="small" color="action" sx={{ mr: 0.5, mt: 0.3 }} />
                                     <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
                                        {ticket.TCKT_description?.substring(0, 100)}{ticket.TCKT_description?.length > 100 ? '...' : '' || 'Pas de description'}
                                    </Typography>
                                </Box>

                                {ticket.TCKT_client?.CLNT_nom && (
                                    <Box display="flex" alignItems="center" mb={1}>
                                         <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                        <Typography variant="caption" color="textSecondary">
                                            Client : {ticket.TCKT_client.CLNT_nom}
                                        </Typography>
                                    </Box>
                                )}

                                {ticket.TCKT_equipment?.EQPT_libelle && (
                                     <Box display="flex" alignItems="center" mb={1}>
                                          <ComputerIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                        <Typography variant="caption" color="textSecondary">
                                            Équipement : {ticket.TCKT_equipment.EQPT_libelle}
                                        </Typography>
                                    </Box>
                                )}

                                 {ticket.TCKT_Date_creation && (
                                     <Box display="flex" alignItems="center">
                                          <CalendarTodayIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                         <Typography variant="caption" color="textSecondary">
                                             Créé le : {formatDate(ticket.TCKT_Date_creation)}
                                         </Typography>
                                     </Box>
                                 )}

                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  </Paper>
                )}
              </Droppable>
            ))}
          </Box>
        </DragDropContext>
      )}
    </Box>
  );
};

export default Kanban;
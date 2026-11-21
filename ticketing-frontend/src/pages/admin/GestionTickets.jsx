import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Button, Paper, Typography, Box, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Checkbox, ListItemText,
  TextField,
  Grid
} from "@mui/material";
import { grey, indigo, red } from "@mui/material/colors";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const GestionTickets = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]); // New state for issue types

  const [selectedTechniciansPerTicket, setSelectedTechniciansPerTicket] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUrgence, setFilterUrgence] = useState("");
  const [filterBacklog, setFilterBacklog] = useState("");
  const [filterAssignedTech, setFilterAssignedTech] = useState("");
  const [filterIssueType, setFilterIssueType] = useState(""); // New state for issue type filter
  const [filterIsAssigned, setFilterIsAssigned] = useState(""); // New state for assigned/unassigned filter

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/tickets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        if (Array.isArray(data)) {
          setTickets(data);
        } else {
          console.error("❌ Données tickets inattendues :", data);
          setTickets([]);
          setError("Format de données de tickets inattendu.");
        }
      } catch (err) {
        console.error("❌ Erreur récupération tickets :", err);
        setError("Impossible de récupérer les tickets.");
      } finally {
        setLoading(false);
      }
    };

    const fetchTechniciansData = async () => {
      try {
        const response = await api.get("/techniciens/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTechnicians(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Erreur lors de la récupération des techniciens:", error);
      }
    };

    const fetchIssueTypesData = async () => { // New function to fetch issue types
        try {
            const response = await api.get("/types-pannes/", { // Assuming you have an endpoint for issue types
                headers: { Authorization: `Bearer ${token}` },
            });
            setIssueTypes(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Erreur lors de la récupération des types de pannes:", error);
        }
    };

    fetchData();
    fetchTechniciansData();
    fetchIssueTypesData(); // Call the new fetch function
  }, [token]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const lowerCaseQuery = searchQuery.toLowerCase();

      const matchesSearch =
        (ticket.TCKT_code || '').toLowerCase().includes(lowerCaseQuery) ||
        (ticket.TCKT_client_raison_sociale || '').toLowerCase().includes(lowerCaseQuery) ||
        (ticket.TCKT_equipment || '').toLowerCase().includes(lowerCaseQuery) ||
        (ticket.TCKT_description || '').toLowerCase().includes(lowerCaseQuery) ||
        (ticket.TCKT_assignee_a || []).some(tech => (tech.TECH_nom_prenom || '').toLowerCase().includes(lowerCaseQuery)) ||
        (ticket.TCKT_types_pannes || []).some(panne =>
          (panne.PANN_code || '').toLowerCase().includes(lowerCaseQuery) ||
          (panne.PANN_libelle || '').toLowerCase().includes(lowerCaseQuery)
        );

      const matchesStatus = filterStatus === "" || ticket.TCKT_statut === filterStatus;

      const matchesUrgence = filterUrgence === "" || ticket.TCKT_degre_urgence === filterUrgence;

      const matchesBacklog =
        filterBacklog === "" ||
        (filterBacklog === "true" && ticket.TCKT_backlog === true) ||
        (filterBacklog === "false" && ticket.TCKT_backlog === false);

      const matchesAssignedTech =
        filterAssignedTech === "" ||
        (ticket.TCKT_assignee_a || []).some(tech => tech._id === filterAssignedTech);

      // New filter logic for issue types
      const matchesIssueType =
        filterIssueType === "" ||
        (ticket.TCKT_types_pannes || []).some(panne => panne._id === filterIssueType);

      // New filter logic for assigned/unassigned tickets
      const matchesIsAssigned =
        filterIsAssigned === "" ||
        (filterIsAssigned === "true" && (ticket.TCKT_assignee_a?.length || 0) > 0) ||
        (filterIsAssigned === "false" && (ticket.TCKT_assignee_a?.length || 0) === 0);


      return matchesSearch && matchesStatus && matchesUrgence && matchesBacklog && matchesAssignedTech && matchesIssueType && matchesIsAssigned;
    });
  }, [tickets, searchQuery, filterStatus, filterUrgence, filterBacklog, filterAssignedTech, filterIssueType, filterIsAssigned]);


  const handleAssignTechniciansToTicket = async (ticketId) => {
    const techniciansToAssign = selectedTechniciansPerTicket[ticketId] || [];

    if (techniciansToAssign.length === 0) {
      return Swal.fire("Erreur", "Veuillez sélectionner au moins un technicien.", "error");
    }

    const ticket = tickets.find((t) => t._id === ticketId);
      
      const techniciansToActuallyAssign = techniciansToAssign.filter(techId =>
          !ticket?.TCKT_assignee_a?.some(assigned => assigned._id === techId)
      );

      if (techniciansToActuallyAssign.length === 0) {
          
          const alreadyAssignedNames = techniciansToAssign
              .map(techId => technicians.find(t => t._id === techId)?.TECH_nom_prenom)
              .filter(name => name);
          if (alreadyAssignedNames.length > 0) {
              Swal.fire("Attention", `Les techniciens suivants étaient déjà assignés : ${alreadyAssignedNames.join(', ')}. Aucune action nécessaire.`, "warning");
          } else {
              
               Swal.fire("Attention", "Aucun technicien à assigner.", "warning");
          }

           setSelectedTechniciansPerTicket(prev => {
              const newState = { ...prev };
              delete newState[ticketId];
              return newState;
          });
          return; // Exit the function
      }

      const successfulAssignments = [];
      const failedAssignments = [];

    try {
        // Boucle sur chaque technicien à assigner individuellement
        for (const techId of techniciansToActuallyAssign) {
            try {
                // Appel API pour assigner UN seul technicien à la fois
                const res = await api.put(
                    `/tickets/${ticketId}/assign`,
                    { technicianId: techId }, // Corps de la requête correct selon votre backend
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                // Si l'appel réussit, ajoutez l'ID à la liste des succès
                successfulAssignments.push(techId);

            } catch (assignmentErr) {
                // En cas d'erreur pour un technicien, l'enregistrer et continuer avec les autres
                console.error(`❌ Erreur assignation technicien ${techId}:`, assignmentErr.response?.data || assignmentErr);
                failedAssignments.push({ techId, error: assignmentErr.response?.data?.message || assignmentErr.message });
            }
        }

       
        // --- MODIFICATION CLÉ ---
        // Après toutes les tentatives, on récupère l'état final et complet du ticket depuis le backend.
        // Cela garantit que toutes les données, y compris les techniciens assignés avec leurs noms, sont à jour.
        const updatedTicketRes = await api.get(`/tickets/${ticketId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const finalUpdatedTicket = updatedTicketRes.data; // La réponse de getTicketById est l'objet ticket directement

        if (finalUpdatedTicket) {
            // On remplace l'ancien ticket par le nouveau dans notre état global 'tickets'.
            setTickets((prevTickets) =>
                prevTickets.map((t) =>
                    t._id === ticketId ? finalUpdatedTicket : t
                )
            );
        } else {
            console.warn("Impossible de récupérer l'état mis à jour du ticket après assignation(s).");
        }

        


        // Afficher un résumé des opérations réussies et échouées
        let summaryMessage = '';

        if (successfulAssignments.length > 0) {
            const assignedTechNames = successfulAssignments
                .map(techId => technicians.find(t => t._id === techId)?.TECH_nom_prenom)
                .filter(name => name); // Filter out undefined names
            summaryMessage += `Assignation réussie pour : ${assignedTechNames.join(', ')}. `;
        }

         if (failedAssignments.length > 0) {
             const failedTechDetails = failedAssignments
                 .map(item => {
                     const techName = technicians.find(t => t._id === item.techId)?.TECH_nom_prenom || `ID ${item.techId}`;
                     return `${techName} (Erreur : ${item.error})`;
                 });
             summaryMessage += `Échec d'assignation pour : ${failedTechDetails.join('; ')}.`;
         }

         if (summaryMessage) {
             const icon = failedAssignments.length === 0 ? "success" : successfulAssignments.length > 0 ? "warning" : "error";
              Swal.fire(icon === "success" ? "Succès partiel" : icon === "warning" ? "Attention" : "Erreur", summaryMessage, icon);
         } else {
              // Cela ne devrait pas arriver si techniciansToActuallyAssign n'était pas vide
              Swal.fire("Erreur", "Aucune tentative d'assignation n'a abouti.", "error");
         }


        // Effacer les techniciens sélectionnés pour ce ticket
        setSelectedTechniciansPerTicket(prev => {
          const newState = { ...prev };
          delete newState[ticketId];
          return newState;
        });

    } catch (err) {
        // Cette partie gère les erreurs qui ne sont pas spécifiques à l'assignation d'un technicien individuel,
        // comme une erreur lors du rafraîchissement du ticket par exemple.
        console.error("❌ Erreur globale lors de l'assignation ou de la mise à jour:", err.response?.data || err);
        // Affichez un message d'erreur si aucune assignation n'a réussi et qu'une erreur globale s'est produite.
        if (successfulAssignments.length === 0) {
             Swal.fire("Erreur", `Une erreur inattendue s'est produite : ${err.response?.data?.message || err.message}`, "error");
        } else {
             // S'il y a eu des succès partiels, l'erreur globale est peut-être liée à la mise à jour
             Swal.fire("Attention", `Certaines assignations ont réussi, mais une erreur est survenue lors de la finalisation : ${err.response?.data?.message || err.message}`, "warning");
        }
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    Swal.fire({
      title: "Supprimer ce ticket ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/tickets/${ticketId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setTickets((prev) => prev.filter((t) => t._id !== ticketId));
          Swal.fire("Supprimé", "Le ticket a été supprimé.", "success");
        } catch (err) {
          console.error("❌ Suppression échouée :", err);
          Swal.fire("Erreur", `Impossible de supprimer le ticket : ${err.response?.data?.message || err.message}`, "error");
        }
      }
    });
  };

  const handleTechnicianAssignSelectChange = (ticketId, value) => {
    setSelectedTechniciansPerTicket((prev) => ({
      ...prev,
      [ticketId]: value,
    }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleUrgenceFilterChange = (e) => {
    setFilterUrgence(e.target.value);
  };

  const handleBacklogFilterChange = (e) => {
    setFilterBacklog(e.target.value);
  };

  const handleAssignedTechFilterChange = (e) => {
    setFilterAssignedTech(e.target.value);
  };

  const handleIssueTypeFilterChange = (e) => { 
    setFilterIssueType(e.target.value);
  };

  const handleIsAssignedFilterChange = (e) => { 
    setFilterIsAssigned(e.target.value);
  };


  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 4 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }


  return (
    <Box sx={{ p: 3 }}>

      <Typography variant="h4" component="h2" gutterBottom color={indigo[900]}>
        Gestion des Tickets
      </Typography>

     
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
       
        <TextField
          label="Rechercher..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ width: { xs: '100%', sm: 200 } }} 
        />

    
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 150 } }}> {/* Adjusted width */}
          <InputLabel>Statut</InputLabel>
          <Select value={filterStatus} onChange={handleStatusFilterChange} label="Statut">
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value="ouvert">ouvert</MenuItem>
            <MenuItem value="en cours">en cours</MenuItem>
            <MenuItem value="fermé">fermé</MenuItem>
            <MenuItem value="résolu">résolu</MenuItem>
          </Select>
        </FormControl>

       
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 150 } }}> {/* Adjusted width */}
          <InputLabel>Urgence</InputLabel>
          <Select value={filterUrgence} onChange={handleUrgenceFilterChange} label="Urgence">
            <MenuItem value="">Tous les niveaux</MenuItem>
            <MenuItem value="faible">faible</MenuItem>
            <MenuItem value="moyenne">moyenne</MenuItem>
            <MenuItem value="élevée">élevée</MenuItem>

          </Select>
        </FormControl>

        
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 150 } }}> {/* Adjusted width */}
          <InputLabel>Backlog</InputLabel>
          <Select value={filterBacklog} onChange={handleBacklogFilterChange} label="Backlog">
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="true">Oui</MenuItem>
            <MenuItem value="false">Non</MenuItem>
          </Select>
        </FormControl>

       
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 200 } }}> {/* Adjusted width */}
          <InputLabel>Technicien Assigné</InputLabel>
          <Select
            value={filterAssignedTech}
            onChange={handleAssignedTechFilterChange}
            label="Technicien Assigné"
          >
            <MenuItem value="">Tous les techniciens</MenuItem>
            {technicians.map((tech) => (
              <MenuItem key={tech._id} value={tech._id}>
                {tech.TECH_nom_prenom}
              </MenuItem>
              ))}
          </Select>
        </FormControl>

        
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 180 } }}>
          <InputLabel>Type de Panne</InputLabel>
          <Select
            value={filterIssueType}
            onChange={handleIssueTypeFilterChange}
            label="Type de Panne"
          >
            <MenuItem value="">Tous les types</MenuItem>
            {issueTypes.map((issueType) => (
              <MenuItem key={issueType._id} value={issueType._id}>
                {issueType.PANN_libelle}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* New: Is Assigned Filter */}
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 180 } }}>
          <InputLabel>Assignation</InputLabel>
          <Select
            value={filterIsAssigned}
            onChange={handleIsAssignedFilterChange}
            label="Assignation"
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="true">Assigné</MenuItem>
            <MenuItem value="false">Non Assigné</MenuItem>
          </Select>
        </FormControl>

        
      </Box>



      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        <Paper sx={{ overflowX: "auto", p: 2 }}>
          {filteredTickets.length === 0 && !loading ? (
            <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 2 }}>
              Aucun ticket trouvé.
            </Typography>
          ) : (


          <Table sx={{ minWidth: 500 }} aria-label="techniciens table">

              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  {/* Header Cells with white text */}
            
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Code</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Client</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Équipement</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Techniciens Assignés</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Description</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Type(s) de Panne</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Urgence</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Backlog</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Sprint</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Sprint ID</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Résolution Demandée</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Création</TableCell>
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.map((ticket, index) => (
                  <TableRow
                    key={ticket._id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? grey[100] : "white",
                      "&:hover": { backgroundColor: grey[200] },
                    }}
                  >
                    
                    <TableCell>{ticket.TCKT_code}</TableCell>
                   <TableCell>{ticket.TCKT_client_nom || 'N/A'} ({ticket.TCKT_client || 'N/A'})</TableCell>
                    <TableCell>{ticket.TCKT_equipment || 'N/A'}</TableCell>
                    <TableCell>
                      {ticket.TCKT_assignee_a?.length > 0 ? (
                        ticket.TCKT_assignee_a.map((tech) => (
                          <Typography key={tech._id} variant="body2">{tech.TECH_nom_prenom}</Typography>
                        ))
                      ) : (
                        <Typography variant="body2" color={grey[600]}>Aucun</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>{ticket.TCKT_description || 'N/A'}</TableCell>
                    <TableCell>
                      {ticket.TCKT_types_pannes?.length > 0 ? (
                        ticket.TCKT_types_pannes.map((panne) => (
                          <Typography key={panne._id} variant="body2">
                            {panne.PANN_code || ''} - {panne.PANN_libelle || ''}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2" color={grey[600]}>Aucun</Typography>
                      )}
                    </TableCell>
                    <TableCell>{ticket.TCKT_degre_urgence || 'N/A'}</TableCell>
                    <TableCell>{ticket.TCKT_statut || 'N/A'}</TableCell>
                    <TableCell>{ticket.TCKT_backlog ? "Oui" : "Non"}</TableCell>
                    <TableCell>{ticket.TCKT_sprint ? "Oui" : "Non"}</TableCell>
                    <TableCell>{ticket.TCKT_sprint_id || "N/A"}</TableCell>
                    <TableCell>
                      {ticket.TCKT_DT_resolution_demandee
                        ? format(new Date(ticket.TCKT_DT_resolution_demandee), "dd/MM/yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {ticket.Date_creation
                        ? format(new Date(ticket.Date_creation), "dd/MM/yyyy")
                        : "N/A"}
                    </TableCell>
                    {/* Action Cell - Horizontal layout for buttons */}
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Box display="flex" gap={1} alignItems="center"> {/* Horizontal layout with gap */}
                        {/* View Details Button */}
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => navigate(`/ticket-detail/${ticket._id}`, { state: { ticket } })}
                        >
                          Détails
                        </Button>

                        {/* Assign Technician Control and Button */}
                        {/* You might need to adjust the layout of the Select and Assign button here */}
                        {/* if they take up too much horizontal space.
                            Keeping them here for now to show placement. */}
                        <Box display="flex" alignItems="center" gap={1}> {/* Box to group Select and Assign button */}
                          <FormControl sx={{ minWidth: 120 }} variant="outlined" size="small">
                            <InputLabel size="small">Assigner Tech(s)</InputLabel>
                            <Select
                              multiple
                              value={selectedTechniciansPerTicket[ticket._id] || []}
                              onChange={(e) => handleTechnicianAssignSelectChange(ticket._id, e.target.value)}
                              renderValue={(selectedIds) =>
                                selectedIds
                                  .map((id) => technicians.find((t) => t._id === id)?.TECH_nom_prenom)
                                  .join(", ")
                              }
                            >
                              {technicians.map((t) => (
                                <MenuItem key={t._id} value={t._id}>
                                  <Checkbox checked={selectedTechniciansPerTicket[ticket._id]?.includes(t._id)} />
                                  <ListItemText primary={t.TECH_nom_prenom} />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            onClick={() => handleAssignTechniciansToTicket(ticket._id)}
                            variant="contained"
                            color="secondary"
                            size="small"
                          >
                            Assigner
                          </Button>
                        </Box>

                        {/* Delete Button */}
                        <Button
                          onClick={() => handleDeleteTicket(ticket._id)}
                          variant="contained"
                          color="error"
                          size="small"
                        >
                          Supprimer
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box> 

    </Box>
  );
};

export default GestionTickets;
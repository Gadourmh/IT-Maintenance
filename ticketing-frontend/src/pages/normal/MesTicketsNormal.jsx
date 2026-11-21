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

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [technicians, setTechnicians] = useState([]);



  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUrgence, setFilterUrgence] = useState("");
  const [filterBacklog, setFilterBacklog] = useState("");
  const [filterAssignedTech, setFilterAssignedTech] = useState("");

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

    fetchData();
    fetchTechniciansData();
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


      return matchesSearch && matchesStatus && matchesUrgence && matchesBacklog && matchesAssignedTech;
    });
  }, [tickets, searchQuery, filterStatus, filterUrgence, filterBacklog, filterAssignedTech]);


  

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

      {/* Filter Controls Section - Styled like the top of GestionTechniciens */}
      {/* Removed Paper wrapper here to match the image's filter area */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        {/* Search Field */}
        <TextField
          label="Rechercher..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ width: { xs: '100%', sm: 200 } }} // Responsive width
        />

        {/* Status Filter */}
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 150 } }}> {/* Adjusted width */}
          <InputLabel>Statut</InputLabel>
          <Select value={filterStatus} onChange={handleStatusFilterChange} label="Statut">
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value="Ouvert">Ouvert</MenuItem>
            <MenuItem value="En cours">En cours</MenuItem>
            <MenuItem value="Fermé">Fermé</MenuItem>
            <MenuItem value="En attente">En attente</MenuItem>
          </Select>
        </FormControl>

        {/* Urgence Filter */}
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 150 } }}> {/* Adjusted width */}
          <InputLabel>Urgence</InputLabel>
          <Select value={filterUrgence} onChange={handleUrgenceFilterChange} label="Urgence">
            <MenuItem value="">Tous les niveaux</MenuItem>
            <MenuItem value="Faible">Faible</MenuItem>
            <MenuItem value="Moyenne">Moyenne</MenuItem>
            <MenuItem value="Élevée">Élevée</MenuItem>
            <MenuItem value="Critique">Critique</MenuItem>
          </Select>
        </FormControl>

        {/* Backlog Filter */}
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 150 } }}> {/* Adjusted width */}
          <InputLabel>Backlog</InputLabel>
          <Select value={filterBacklog} onChange={handleBacklogFilterChange} label="Backlog">
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="true">Oui</MenuItem>
            <MenuItem value="false">Non</MenuItem>
          </Select>
        </FormControl>

        {/* Assigned Technician Filter */}
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

        {/* Note: No "Add Ticket" button here to match the image's filter area layout */}
      </Box>


      {/* Table Container with limited max width and gray theme */}
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
                  <TableCell sx={{ color: "black", fontWeight: 'bold' }}>ID</TableCell>
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
                    <TableCell>{ticket._id}</TableCell>
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
               
               
              </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        </Paper>
      </Box> {/* End of maxWidth Box */}

    </Box>
  );
};

export default GestionTickets;
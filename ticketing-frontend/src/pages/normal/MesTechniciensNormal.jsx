import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  // Snackbar, // <-- Removed
  // Alert,    // <-- Removed
  FormControl, InputLabel, Select, MenuItem,
  Box,
  Typography
} from "@mui/material";
import api from "../../api/api";
import Swal from 'sweetalert2'; // <-- Imported SweetAlert2

const GestionTechniciens = () => {
  const [techniciens, setTechniciens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTechnicien, setSelectedTechnicien] = useState(null);
  const [form, setForm] = useState({
    TECH_nom_prenom: "",
    TECH_email: "",
    TECH_mot_passe: "",
    TECH_telephone: "",
    TECH_specialite: "",
  });
  // const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" }); // <-- Removed
 
  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialite, setFilterSpecialite] = useState("");
  const [filterDisponibilite, setFilterDisponibilite] = useState("");

  useEffect(() => {
    fetchTechniciens();
  }, []);

  const fetchTechniciens = async () => {
    setLoading(true); // Set loading true before fetch
    try {
      const { data } = await api.get("/techniciens");
      setTechniciens(data);
    } catch (error) {
      console.error("Erreur lors du chargement des techniciens", error);
      // Replace Snackbar with SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du chargement des techniciens.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers pour les changements de filtre
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterSpecialiteChange = (e) => {
    setFilterSpecialite(e.target.value);
  };

  const handleFilterDisponibiliteChange = (e) => {
    setFilterDisponibilite(e.target.value);
  };

  // Logique de filtrage combinée
  const filteredTechniciens = techniciens.filter((tech) => {
    const matchesSearch =
      tech.TECH_nom_prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.TECH_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.TECH_telephone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tech.TECH_code || '').toLowerCase().includes(searchQuery.toLowerCase()); // Added search by code

    const matchesSpecialite =
      filterSpecialite === "" || tech.TECH_specialite === filterSpecialite;

    const matchesDisponibilite =
      filterDisponibilite === "" ||
      (filterDisponibilite === "Disponible" && tech.TECH_disponibilite) ||
      (filterDisponibilite === "Indisponible" && !tech.TECH_disponibilite);

    return matchesSearch && matchesSpecialite && matchesDisponibilite;
  });

  const handleOpenDialog = (technicien = null) => {
    setSelectedTechnicien(technicien);
    setForm(
      technicien
        ? {
            TECH_nom_prenom: technicien.TECH_nom_prenom,
            TECH_email: technicien.TECH_email,
            TECH_telephone: technicien.TECH_telephone,
            TECH_specialite: technicien.TECH_specialite,
            TECH_mot_passe: ""
          }
        : {
            TECH_nom_prenom: "",
            TECH_email: "",
            TECH_mot_passe: "",
            TECH_telephone: "",
            TECH_specialite: ""
          }
    );
    setOpenDialog(true);
  };



  

  
  return (
    <Box sx={{ p: 3 }}>
       
      <Typography variant="h4" component="h2" gutterBottom>
        Gestion des Techniciens
      </Typography>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        {/* Barre de recherche */}
        <TextField
          variant="outlined"
          label="Rechercher (Nom, Email, Tél., Code)" // Updated label
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          sx={{ width: { xs: '100%', sm: 250 } }}
        />

        {/* Filtre par Spécialité */}
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
          <InputLabel>Spécialité</InputLabel>
          <Select
            value={filterSpecialite}
            onChange={handleFilterSpecialiteChange}
            label="Spécialité"
          >
            <MenuItem value="">Toutes les spécialités</MenuItem>
            <MenuItem value="Maintenance Matérielle">Maintenance Matérielle</MenuItem>
            <MenuItem value="Réseaux & Télécoms">Réseaux & Télécoms</MenuItem>
            <MenuItem value="Support Logiciel">Support Logiciel</MenuItem>
            <MenuItem value="Sécurité Informatique">Sécurité Informatique</MenuItem>
            <MenuItem value="Systèmes (Windows/Linux)">Systèmes (Windows/Linux)</MenuItem>
            <MenuItem value="Déploiement Matériel">Déploiement Matériel</MenuItem>
            <MenuItem value="Assistance Utilisateurs">Assistance Utilisateurs</MenuItem>
            <MenuItem value="Cloud & Virtualisation">Cloud & Virtualisation</MenuItem>
            <MenuItem value="Maintenance Bureautique">Maintenance Bureautique</MenuItem>
            <MenuItem value="Câblage Réseau">Câblage Réseau</MenuItem>
            <MenuItem value="Autre">Autre</MenuItem>
          </Select>
        </FormControl>

        {/* Filtre par Disponibilité */}
        <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
          <InputLabel>Disponibilité</InputLabel>
          <Select
            value={filterDisponibilite}
            onChange={handleFilterDisponibiliteChange}
            label="Disponibilité"
          >
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value="Disponible">Disponible</MenuItem>
            <MenuItem value="Indisponible">Indisponible</MenuItem>
          </Select>
        </FormControl>

      
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 500 }} aria-label="techniciens table">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nom & Prénom</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Téléphone</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Spécialité</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Disponibilité</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date de création</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tickets Assignés</TableCell>
          
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTechniciens.map((tech, index) => (
                <TableRow
                  key={tech._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, backgroundColor: index % 2 ? '#fafafa' : '#ffffff' }}
                >
                  <TableCell component="th" scope="row">{tech._id}</TableCell>
                  <TableCell>{tech.TECH_code}</TableCell>
                  <TableCell>{tech.TECH_nom_prenom}</TableCell>
                  <TableCell>{tech.TECH_email}</TableCell>
                  <TableCell>{tech.TECH_telephone}</TableCell>
                  <TableCell>{tech.TECH_specialite}</TableCell>
                  <TableCell>{tech.TECH_disponibilite ? "Disponible" : "Indisponible"}</TableCell>
                  <TableCell>{tech.Date_creation ? new Date(tech.Date_creation).toLocaleDateString() : 'N/A'}</TableCell> {/* Added check for Date_creation */}
                  <TableCell>
                    {tech.TECH_tickets_assignees && tech.TECH_tickets_assignees.length > 0 ? (
                      <Box>
                        <Typography variant="body2" component="div">
                          <strong>IDs :</strong> {tech.TECH_tickets_assignees.join(', ')}
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Nombre :</strong> {tech.TECH_tickets_assignees.length}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2">Aucun ticket assigné</Typography>
                    )}
                  </TableCell>
                 
                </TableRow>
              ))}
            
            </TableBody>
          </Table>
        </TableContainer>
      )}

  
   
    </Box>
  );
};

export default GestionTechniciens;
import React, { useState, useEffect, useMemo } from "react";
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
  Select,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  InputLabel,
  FormControl,
  Typography,
  Grid,
  IconButton,
  Menu,
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add'; // Import AddIcon for the button
import { red, blue, grey } from "@mui/material/colors"; // Removed green and indigo as they are not used for main theme colors

import api from "../../api/api";

const GestionPersonnel = () => {
  const [personnels, setPersonnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [form, setForm] = useState({
    PERS_nom_prenom: "",
    PERS_email: "",
    PERS_mot_passe: "",
    PERS_telephone: "",
    PERS_fonction: "GESTIONNAIRE_TICKETS",
   
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userRole, setUserRole] = useState("");

  // États pour les filtres
  const [filtreNomPrenom, setFiltreNomPrenom] = useState("");
  const [filtreEmail, setFiltreEmail] = useState("");
  const [filtreFonction, setFiltreFonction] = useState("");


  // États pour le menu d'actions de la table
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPersonnelForMenu, setSelectedPersonnelForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    fetchPersonnels();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUserRole(data.PERS_role_acces);
    } catch (error) {
      console.error("Erreur lors de la récupération du rôle de l'utilisateur", error);
    }
  };

  const fetchPersonnels = async () => {
    try {
      const { data } = await api.get("/personnels");
      setPersonnels(data);
    } catch (error) {
      console.error("Erreur lors du chargement des personnels", error);
    } finally {
      setLoading(false);
    }
  };

 

   
  const filteredPersonnels = useMemo(() => {
    if (!Array.isArray(personnels)) return [];
    return personnels.filter((pers) => {
      const nomPrenomMatch = filtreNomPrenom === "" || (pers.PERS_nom_prenom && pers.PERS_nom_prenom.toLowerCase().includes(filtreNomPrenom.toLowerCase()));
      const emailMatch = filtreEmail === "" || (pers.PERS_email && pers.PERS_email.toLowerCase().includes(filtreEmail.toLowerCase()));
      const fonctionMatch = filtreFonction === "" || (pers.PERS_fonction && pers.PERS_fonction === filtreFonction);
   
      return nomPrenomMatch && emailMatch && fonctionMatch ;
    });
  }, [personnels, filtreNomPrenom, filtreEmail, filtreFonction]);

   const resetFilters = () => {
     setFiltreNomPrenom("");
     setFiltreEmail("");
     setFiltreFonction("");
   
   };

   const fonctionsPossibles = ["CHEF_SERVICE", "RESPONSABLE_MAINTENANCE", "GESTIONNAIRE_TICKETS", "SECRÉTAIRE", "COMPTABLE", "RH", "SUPPORT_CLIENT"];
  

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: grey[50], minHeight: "100vh" }}> {/* CHANGED: Background color from green to light grey */}

      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: blue[800], mb: 4 }}> {/* CHANGED: Title color from green to dark blue */}
        Gestion des Personnels
      </Typography>

      <Paper sx={{ padding: 3, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: grey[800], mb: 2 }}>
          Filtres
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Nom & Prénom"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreNomPrenom}
              onChange={(e) => setFiltreNomPrenom(e.target.value)}
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
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Fonction</InputLabel>
              <Select
                value={filtreFonction}
                onChange={(e) => setFiltreFonction(e.target.value)}
                label="Fonction"
              >
                <MenuItem value="">Toutes</MenuItem>
                {fonctionsPossibles.map((fonction) => (
                  <MenuItem key={fonction} value={fonction}>
                    {fonction.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="outlined" onClick={resetFilters} fullWidth color="secondary" sx={{ height: '40px' }}>
              Réinitialiser Filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>


      <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog(null)} startIcon={<AddIcon />}>
          Ajouter Personnel
        </Button>
      </Box>

         <TableContainer component={Paper} sx={{ marginTop: 2 }} maxWidth="lg">
              <Table sx={{ minWidth: 650 }} aria-label="personnel table">
                <TableHead sx={{ backgroundColor: grey[200] }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Id</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Nom & Prénom</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Téléphone</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Fonction</TableCell>
            
           
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPersonnels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Aucun personnel trouvé.
                </TableCell>
              </TableRow>
            ) : (
              filteredPersonnels.map((personnel, index) => (
                <TableRow
                  key={personnel._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[50] : "white", // CHANGED: Softer alternating rows
                    "&:hover": { backgroundColor: grey[100] }, // CHANGED: Softer hover
                  }}
                >
                  <TableCell>{personnel._id}</TableCell>
                  <TableCell>{personnel.PERS_nom_prenom}</TableCell>
                  <TableCell>{personnel.PERS_email}</TableCell>
                  <TableCell>{personnel.PERS_telephone}</TableCell>
                  <TableCell>{personnel.PERS_fonction}</TableCell>
                  
              
              
                
               
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

    
    
    
    </Box>
  );
};

export default GestionPersonnel;
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
  CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
  Box,
  Typography,
  Grid,
  IconButton,
  Menu,
  Snackbar,
  Alert,
  // NOUVEAUX IMPORTS POUR LA SÉLECTION MULTIPLE
  OutlinedInput,
  Chip,
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import api from "../../api/api";
import Swal from 'sweetalert2';

// Définition des valeurs valides pour le shift
const VALID_SHIFTS = ['MORNING', 'AFTERNOON', 'NIGHT'];

// URL de base pour les photos de profil si elles ne sont pas en Base64
const BASE_PHOTO_URL = 'http://localhost:5000/';

// Liste des spécialités pour la réutiliser
const specialiteOptions = [
    "Maintenance Matérielle",
    "Réseaux & Télécoms",
    "Support Logiciel",
    "Sécurité Informatique",
    "Systèmes (Windows/Linux)",
    "Déploiement Matériel",
    "Assistance Utilisateurs",
    "Cloud & Virtualisation",
    "Maintenance Bureautique",
    "Câblage Réseau",
    "Autre"
];


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
    // MODIFICATION: Initialiser comme un tableau vide
    TECH_specialite: [],
    TECH_shift: "",
    TECH_photo_profil: "",
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialite, setFilterSpecialite] = useState("");
  const [filterDisponibilite, setFilterDisponibilite] = useState("");
  const [filterCreePar, setFilterCreePar] = useState("");
  const [filterFailedAttempts, setFilterFailedAttempts] = useState("");
  const [filterLockStatus, setFilterLockStatus] = useState("all");
  const [filterDeletedStatus, setFilterDeletedStatus] = useState("active");

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTechnicienForMenu, setSelectedTechnicienForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);


  useEffect(() => {
    fetchTechniciens();
  }, []);

  const fetchTechniciens = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/techniciens?showDeleted=true");
      setTechniciens(Array.isArray(data) ? data : data.techniciens || []);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des techniciens", error.response?.data || error.message);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors du chargement des techniciens.',
      });
      setTechniciens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleFilterSpecialiteChange = (e) => setFilterSpecialite(e.target.value);
  const handleFilterDisponibiliteChange = (e) => setFilterDisponibilite(e.target.value);
  const handleFilterCreeParChange = (e) => setFilterCreePar(e.target.value);
  const handleFilterFailedAttemptsChange = (e) => setFilterFailedAttempts(e.target.value);
  const handleFilterLockStatusChange = (e) => setFilterLockStatus(e.target.value);
  const handleFilterDeletedStatusChange = (e) => setFilterDeletedStatus(e.target.value);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterSpecialite("");
    setFilterDisponibilite("");
    setFilterCreePar("");
    setFilterFailedAttempts("");
    setFilterLockStatus("all");
    setFilterDeletedStatus("active");
  };


  const filteredTechniciens = useMemo(() => {
    return techniciens.filter((tech) => {
      const techNomPrenom = tech.TECH_nom_prenom ? tech.TECH_nom_prenom.toLowerCase() : '';
      const techEmail = tech.TECH_email ? tech.TECH_email.toLowerCase() : '';
      const techTelephone = tech.TECH_telephone ? tech.TECH_telephone.toLowerCase() : '';
      const techCode = tech.TECH_code ? tech.TECH_code.toLowerCase() : '';
      // MODIFICATION: Gérer le tableau de spécialités pour le filtre
      const techSpecialites = Array.isArray(tech.TECH_specialite) ? tech.TECH_specialite.map(s => s.toLowerCase()) : [];
      const techCreeParNom = tech.TECH_cree_par && tech.TECH_cree_par.PERS_nom_prenom ? tech.TECH_cree_par.PERS_nom_prenom.toLowerCase() : '';
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        techNomPrenom.includes(query) ||
        techEmail.includes(query) ||
        techTelephone.includes(query) ||
        techCode.includes(query);

      // MODIFICATION: La logique du filtre vérifie si une des spécialités du technicien correspond
      const matchesSpecialite =
        filterSpecialite === "" || techSpecialites.includes(filterSpecialite.toLowerCase());

      const matchesDisponibilite =
        filterDisponibilite === "" ||
        (filterDisponibilite === "Disponible" && tech.TECH_disponibilite === true) ||
        (filterDisponibilite === "Indisponible" && tech.TECH_disponibilite === false);

      const matchesCreePar =
        filterCreePar === "" || (techCreeParNom && techCreeParNom.includes(filterCreePar.toLowerCase()));

      const matchesFailedAttempts =
        filterFailedAttempts === "" ||
        (tech.failedLoginAttempts !== undefined && tech.failedLoginAttempts.toString().includes(filterFailedAttempts.trim()));

      const isLocked = tech.lockUntil && new Date(tech.lockUntil) > new Date();
      const matchesLockStatus =
        filterLockStatus === "all" ||
        (filterLockStatus === "locked" && isLocked) ||
        (filterLockStatus === "unlocked" && !isLocked);

      const isDeleted = tech.deleted_at !== null && tech.deleted_at !== undefined;
      const matchesDeletedStatus =
          filterDeletedStatus === "all" ||
          (filterDeletedStatus === "active" && !isDeleted) ||
          (filterDeletedStatus === "deleted" && isDeleted);


      return matchesSearch && matchesSpecialite && matchesDisponibilite &&
             matchesCreePar && matchesFailedAttempts && matchesLockStatus && matchesDeletedStatus;
    });

  }, [techniciens, searchQuery, filterSpecialite, filterDisponibilite, filterCreePar, filterFailedAttempts, filterLockStatus, filterDeletedStatus]);


   const formatDateTimeForDisplay = (dateString) => {
     if (!dateString) return 'N/A';
     try {
       const date = new Date(dateString);
       if (isNaN(date.getTime())) return 'Date invalide';
       return date.toLocaleString('fr-FR', {
         year: 'numeric', month: '2-digit', day: '2-digit',
         hour: '2-digit', minute: '2-digit', second: '2-digit'
       });
     } catch (e) {
       console.error("Erreur de formatage de date et heure", dateString, e);
       return 'Erreur date';
     }
   };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Date invalide';
            return date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
        } catch (e) {
            console.error("Erreur de formatage de date", dateString, e);
            return 'Erreur date';
        }
    };


  const handleOpenDialog = (technicien = null) => {
    setSelectedTechnicien(technicien);
    setForm(
      technicien
        ? {
          TECH_nom_prenom: technicien.TECH_nom_prenom || "",
          TECH_email: technicien.TECH_email || "",
          TECH_telephone: technicien.TECH_telephone || "",
          // MODIFICATION: S'assurer que c'est un tableau
          TECH_specialite: Array.isArray(technicien.TECH_specialite) ? technicien.TECH_specialite : [],
          TECH_shift: technicien.TECH_shift || "",
          TECH_photo_profil: technicien.TECH_photo_profil || "",
          TECH_mot_passe: "",
        }
        : {
          TECH_nom_prenom: "",
          TECH_email: "",
          TECH_mot_passe: "",
          TECH_telephone: "",
          // MODIFICATION: Initialiser comme un tableau vide
          TECH_specialite: [],
          TECH_shift: "MORNING",
          TECH_photo_profil: "",
        }
    );
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTechnicien(null);
    setForm({
      TECH_nom_prenom: "",
      TECH_email: "",
      TECH_mot_passe: "",
      TECH_telephone: "",
      // MODIFICATION: Réinitialiser comme un tableau vide
      TECH_specialite: [],
      TECH_shift: "",
      TECH_photo_profil: "",
    });
  };

   const handleMenuOpen = (event, technicien) => {
     setAnchorEl(event.currentTarget);
     setSelectedTechnicienForMenu(technicien);
   };

   const handleMenuClose = () => {
     setAnchorEl(null);
     setSelectedTechnicienForMenu(null);
   };

    const handleEditClick = (technicien) => {
        handleOpenDialog(technicien);
        handleMenuClose();
    };

    const handleDeleteClick = (technicien) => {
        handleDelete(technicien._id);
        handleMenuClose();
    };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

   const getPhotoUrl = (photoPath) => {
       if (!photoPath) return '';
       if (photoPath.startsWith('data:image/')) {
           return photoPath;
       } else {
           const cleanedPath = photoPath.replace(/\\/g, '/');
           const baseUrl = BASE_PHOTO_URL.endsWith('/') ? BASE_PHOTO_URL.slice(0, -1) : BASE_PHOTO_URL;
           return `${baseUrl}/${cleanedPath}`;
       }
   };


  const handleSubmit = async () => {
    // MODIFICATION: Mettre à jour la validation pour le tableau de spécialités
    if (
        !form.TECH_nom_prenom?.trim() ||
        !form.TECH_telephone?.trim() ||
        (Array.isArray(form.TECH_specialite) && form.TECH_specialite.length === 0) || // Vérifier si le tableau est vide
        !form.TECH_shift
    ) {
       Swal.fire({
         icon: 'warning',
         title: 'Attention',
         text: 'Veuillez remplir les champs obligatoires (Nom & Prénom, Téléphone, Spécialité, Shift).',
         timer: 5000,
         timerProgressBar: true,
       });
       return;
    }

     if (!selectedTechnicien) {
         if (!form.TECH_email?.trim() || !form.TECH_mot_passe) {
              Swal.fire({
                 icon: 'warning',
                 title: 'Attention',
                 text: 'Pour la création, l\'email et le mot de passe sont obligatoires.',
                 timer: 5000,
                 timerProgressBar: true,
              });
             return;
         }
     }


    try {
      let payload = { ...form };

      if (selectedTechnicien) {
        delete payload.TECH_email;
        if (payload.TECH_mot_passe === '') {
          delete payload.TECH_mot_passe;
        }
      }

      if (selectedTechnicien) {
        await api.put(`/techniciens/${selectedTechnicien._id}`, payload);
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Technicien mis à jour avec succès!',
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        await api.post("/techniciens", payload);
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Technicien ajouté avec succès!',
          timer: 3000,
          timerProgressBar: true,
        });
      }
      fetchTechniciens();
      handleCloseDialog();
    } catch (error) {
      console.error("❌ Erreur lors de la soumission", error.response?.data || error.message);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de l'opération: ${error.response?.data?.message || error.message}`,
      });
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Le technicien sera marqué comme inactif et ne pourra plus se connecter.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, marquer comme inactif !',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/techniciens/${id}`);
          Swal.fire({
            icon: 'success',
            title: 'Inactif !',
            text: 'Le technicien a été marqué comme inactif.',
            timer: 3000,
            timerProgressBar: true,
          });
          fetchTechniciens();
        } catch (error) {
          console.error("❌ Erreur lors de la suppression logique", error.response?.data || error.message);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: `Erreur lors de l'opération: ${error.response?.data?.message || error.message}`,
          });
        }
      }
    });
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Box sx={{ p: 3 }}>

      <Typography variant="h4" component="h2" gutterBottom>
        Gestion des Techniciens
      </Typography>

      {/* Section Filtres */}
      <Paper sx={{ padding: 2, marginBottom: 3, borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
          Filtres
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
          <TextField
            variant="outlined"
            label="Rechercher (Nom, Email, Tél., Code)"
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            sx={{ width: { xs: '100%', sm: 250 } }}
          />

          <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
            <InputLabel>Spécialité</InputLabel>
            <Select
              value={filterSpecialite}
              onChange={handleFilterSpecialiteChange}
              label="Spécialité"
            >
              <MenuItem value="">Toutes les spécialités</MenuItem>
              {/* Utiliser la liste d'options */}
              {specialiteOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* ... autres filtres ... */}
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
          <TextField
            variant="outlined"
            label="Filtrer par Créateur"
            value={filterCreePar}
            onChange={handleFilterCreeParChange}
            size="small"
            sx={{ width: { xs: '100%', sm: 200 } }}
          />
          <TextField
            variant="outlined"
            label="Filtrer par Tent. Connexion"
            value={filterFailedAttempts}
            onChange={handleFilterFailedAttemptsChange}
            type="number"
            size="small"
            sx={{ width: { xs: '100%', sm: 200 } }}
            inputProps={{ min: 0 }}
          />
          <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
            <InputLabel>Statut Verrouillage</InputLabel>
            <Select
              value={filterLockStatus}
              onChange={handleFilterLockStatusChange}
              label="Statut Verrouillage"
            >
              <MenuItem value="all">Tous les statuts</MenuItem>
              <MenuItem value="locked">Verrouillé</MenuItem>
              <MenuItem value="unlocked">Non verrouillé</MenuItem>
            </Select>
          </FormControl>
           <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
             <InputLabel>Statut Suppression</InputLabel>
             <Select
               value={filterDeletedStatus}
               onChange={handleFilterDeletedStatusChange}
               label="Statut Suppression"
             >
               <MenuItem value="active">Actifs</MenuItem>
               <MenuItem value="deleted">Supprimés Logiquement</MenuItem>
               <MenuItem value="all">Tous</MenuItem>
             </Select>
           </FormControl>
          <Button variant="outlined" onClick={resetFilters} size="small">
            Réinitialiser
          </Button>
        </Box>
      </Paper>


      <Box display="flex" justifyContent="flex-end" mb={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Ajouter un Technicien
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="techniciens table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Photo</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Nom & Prénom</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Téléphone</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Spécialité</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Shift</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Disponibilité</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Date Création</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Créé par</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Tent. Connexion</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Verrouillé Jusqu'au</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Statut Suppression</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Tickets Assignés</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTechniciens.map((tech, index) => (
              <TableRow
                key={tech._id}
                sx={{
                   '&:last-child td, &:last-child th': { border: 0 },
                   backgroundColor: index % 2 ? '#fafafa' : '#ffffff',
                   textDecoration: tech.deleted_at ? 'line-through' : 'none',
                   color: tech.deleted_at ? 'grey' : 'inherit',
                   opacity: tech.deleted_at ? 0.7 : 1,
                   fontStyle: tech.deleted_at ? 'italic' : 'normal',
                }}
              >
                 <TableCell>
                     {tech.TECH_photo_profil ? (
                         <img
                              src={getPhotoUrl(tech.TECH_photo_profil)}
                              alt={`Photo de ${tech.TECH_nom_prenom || 'technicien'}`}
                              style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '5px' }}
                         />
                     ) : (
                         <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>Pas de photo</Typography>
                     )}
                 </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{tech.TECH_code || 'N/A'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{tech.TECH_nom_prenom || 'N/A'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{tech.TECH_email || 'N/A'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{tech.TECH_telephone || 'N/A'}</TableCell>
                {/* MODIFICATION: Afficher les spécialités jointes par une virgule */}
                <TableCell sx={{ fontSize: '0.8rem' }}>
                    {Array.isArray(tech.TECH_specialite) ? tech.TECH_specialite.join(', ') : (tech.TECH_specialite || 'N/A')}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{tech.TECH_shift || 'N/A'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem', color: tech.TECH_disponibilite ? 'green' : 'red' }}>
                    {tech.TECH_disponibilite ? "Disponible" : "Indisponible"}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{formatDateForDisplay(tech.Date_creation)}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  {tech.TECH_cree_par && tech.TECH_cree_par.PERS_nom_prenom
                    ? tech.TECH_cree_par.PERS_nom_prenom
                    : 'N/A'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>{tech.failedLoginAttempts !== undefined ? tech.failedLoginAttempts : 'N/A'}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem', color: tech.lockUntil && new Date(tech.lockUntil) > new Date() ? 'red' : 'inherit' }}>
                  {tech.lockUntil && new Date(tech.lockUntil) > new Date()
                    ? formatDateTimeForDisplay(tech.lockUntil)
                    : 'Non verrouillé'}
                </TableCell>
                 <TableCell sx={{ fontSize: '0.8rem', color: tech.deleted_at ? 'red' : 'green' }}>
                     {tech.deleted_at ? `Supprimé (${formatDateForDisplay(tech.deleted_at)})` : 'Actif'}
                 </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  {tech.TECH_tickets_assignees && tech.TECH_tickets_assignees.length > 0 ? (
                    <Box>
                      <Typography variant="body2" component="div">
                        <strong>Nombre :</strong> {tech.TECH_tickets_assignees.length}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Aucun ticket assigné</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                  <IconButton
                    aria-label="plus d'actions"
                    aria-controls={menuOpen ? 'technicien-actions-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={menuOpen ? 'true' : undefined}
                    onClick={(event) => handleMenuOpen(event, tech)}
                    size="small"
                     disabled={tech.deleted_at !== null}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredTechniciens.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={15} align="center">
                  Aucun technicien trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

       {/* ... Menu ... */}
       <Menu
         id="technicien-actions-menu"
         MenuListProps={{ 'aria-labelledby': 'basic-button' }}
         anchorEl={anchorEl}
         open={menuOpen}
         onClose={handleMenuClose}
         anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
         transformOrigin={{ vertical: 'top', horizontal: 'right' }}
       >
         {selectedTechnicienForMenu && (
           <>
             <MenuItem onClick={() => handleEditClick(selectedTechnicienForMenu)}>
               Modifier
             </MenuItem>
             <MenuItem onClick={() => handleDeleteClick(selectedTechnicienForMenu)}>
               Supprimer (Inactif)
             </MenuItem>
              {selectedTechnicienForMenu.deleted_at && (
                  <MenuItem onClick={() => { /* TODO: Implémenter la fonction de restauration */ console.log("Restaurer", selectedTechnicienForMenu._id); handleMenuClose(); }}>
                      Restaurer
                  </MenuItem>
              )}
           </>
         )}
       </Menu>


      {/* Dialog pour Ajouter/Modifier Technicien */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{selectedTechnicien ? "Modifier Technicien" : "Ajouter un Technicien"}</DialogTitle>
        <DialogContent dividers>
          {/* ... Champs en lecture seule ... */}
          {selectedTechnicien && (
            <Box mb={2}>
              {/* ... Afficahge des informations générales ... */}
            </Box>
          )}

         <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense" name="TECH_nom_prenom" label="Nom & Prénom"
                  fullWidth variant="outlined" value={form.TECH_nom_prenom}
                  onChange={handleChange} size="small" required
                />
            </Grid>
             <Grid item xs={12} sm={6}>
                 <TextField
                   margin="dense" name="TECH_email" label="Email" type="email"
                   fullWidth variant="outlined" value={form.TECH_email}
                   onChange={handleChange} size="small" required={!selectedTechnicien}
                   disabled={!!selectedTechnicien} InputLabelProps={{ shrink: selectedTechnicien ? true : undefined }}
                 />
             </Grid>

             {selectedTechnicien === null && (
               <Grid item xs={12} sm={6}>
                  <TextField
                    margin="dense" name="TECH_mot_passe" label="Mot de Passe"
                    type="password" fullWidth variant="outlined" value={form.TECH_mot_passe}
                    onChange={handleChange} size="small" required
                  />
               </Grid>
             )}

            <Grid item xs={12} sm={6}>
                 <TextField
                   margin="dense" name="TECH_telephone" label="Téléphone"
                   type="tel" fullWidth variant="outlined" value={form.TECH_telephone}
                   onChange={handleChange} size="small" required
                 />
             </Grid>

            {/* // ================================================================== */}
            {/* // MODIFICATION: CHAMP DE SÉLECTION MULTIPLE POUR LES SPÉCIALITÉS   */}
            {/* // ================================================================== */}
            <Grid item xs={12} sm={6}>
                 <FormControl fullWidth margin="dense" variant="outlined" size="small" required>
                   <InputLabel id="specialite-multiple-label">Spécialité(s)</InputLabel>
                   <Select
                     labelId="specialite-multiple-label"
                     id="TECH_specialite"
                     name="TECH_specialite"
                     multiple // Permet la sélection multiple
                     value={form.TECH_specialite} // La valeur est maintenant un tableau
                     onChange={handleChange}
                     input={<OutlinedInput id="select-multiple-chip" label="Spécialité(s)" />}
                     renderValue={(selected) => (
                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                         {selected.map((value) => (
                           <Chip key={value} label={value} size="small" />
                         ))}
                       </Box>
                     )}
                   >
                     {specialiteOptions.map((specialite) => (
                       <MenuItem
                         key={specialite}
                         value={specialite}
                       >
                         {specialite}
                       </MenuItem>
                     ))}
                   </Select>
                 </FormControl>
            </Grid>
            {/* // ================================================================== */}
            {/* // FIN DE LA MODIFICATION                                              */}
            {/* // ================================================================== */}


            <Grid item xs={12} sm={6}>
                 <FormControl fullWidth margin="dense" variant="outlined" size="small" required>
                   <InputLabel id="shift-label">Shift</InputLabel>
                   <Select
                     labelId="shift-label" id="TECH_shift" name="TECH_shift"
                     value={form.TECH_shift} onChange={handleChange} label="Shift"
                   >
                     <MenuItem value=""><em>Sélectionnez un shift</em></MenuItem>
                     <MenuItem value="MORNING">MORNING</MenuItem>
                     <MenuItem value="AFTERNOON">AFTERNOON</MenuItem>
                     <MenuItem value="NIGHT">NIGHT</MenuItem>
                   </Select>
                 </FormControl>
            </Grid>
         </Grid>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {selectedTechnicien ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
    </Box>
  );
};

export default GestionTechniciens;
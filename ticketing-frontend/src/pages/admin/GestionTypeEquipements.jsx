import React, { useState, useEffect, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, CircularProgress,
  Box,
  Typography,
  Grid
} from "@mui/material";
import { grey, blue } from "@mui/material/colors";
import Swal from "sweetalert2";
import api from "../../api/api";
import { parseISO, isDate, isValid } from 'date-fns'; // Import date-fns functions

const GestionTypesEquipements = () => {
  const [typesEquipements, setTypesEquipements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTypeEquipement, setSelectedTypeEquipement] = useState(null);
  const [form, setForm] = useState({
    TPEQ_libelle: "",
    TPEQ_code: ""
  });

  // States for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState(""); // State for start date filter (YYYY-MM-DD string)
  const [filterDateTo, setFilterDateTo] = useState("");   // State for end date filter (YYYY-MM-DD string)


  useEffect(() => {
    fetchTypesEquipements();
  }, []);

  const fetchTypesEquipements = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/type-equipments");
      setTypesEquipements(data);
    } catch (error) {
      console.error("Erreur lors du chargement des types d'équipements", error);
      Swal.fire('Erreur', 'Erreur lors du chargement des types d\'équipements.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (typeEquipement = null) => {
    if (typeEquipement) {
      setForm({
        TPEQ_libelle: typeEquipement.TPEQ_libelle || ""
        
      });
      setSelectedTypeEquipement(typeEquipement);
    } else {
      setForm({
        TPEQ_libelle: "",
    
      });
      setSelectedTypeEquipement(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setForm({ TPEQ_libelle: ""});
    setSelectedTypeEquipement(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.TPEQ_libelle ) {
      Swal.fire('Attention', 'Veuillez remplir tous les champs requis.', 'warning');
      return;
    }

    try {
      if (selectedTypeEquipement) {
        await api.put(`/type-equipments/${selectedTypeEquipement._id}`, form);
        Swal.fire('Succès', 'Type d’équipement modifié avec succès !', 'success');
      } else {
        await api.post("/type-equipments", form);
        Swal.fire('Succès', 'Type d’équipement ajouté avec succès !', 'success');
      }
      fetchTypesEquipements();
      handleCloseDialog();
    } catch (error) {
      console.error("Erreur lors de la soumission", error.response?.data || error.message);
      Swal.fire('Erreur', `Erreur lors de la soumission: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleDelete = async (typeEquipementId) => {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Vous ne pourrez pas revenir en arrière !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/type-equipments/${typeEquipementId}`);
          Swal.fire('Supprimé !', 'Le type d’équipement a été supprimé.', 'success');
          fetchTypesEquipements();
        } catch (error) {
          console.error("Erreur lors de la suppression", error.response?.data || error.message);
          Swal.fire('Erreur', `Erreur lors de la suppression: ${error.response?.data?.message || error.message}`, 'error');
        }
      }
    });
  };

  // Filtering Logic using useMemo (Updated to include date filter)
  const filteredTypesEquipements = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    // Parse filter dates
    const filterFrom = filterDateFrom ? parseISO(filterDateFrom) : null;
    const filterTo = filterDateTo ? parseISO(filterDateTo) : null;

    return typesEquipements.filter(type => {
      // Text search filter
      const matchesSearch =
        (type.TPEQ_libelle || '').toLowerCase().includes(lowerCaseQuery) ||
        (type.TPEQ_code || '').toLowerCase().includes(lowerCaseQuery);

      // Date filter
      let matchesDate = true;
      if (type.TPEQ_date_creation) {
        const creationDate = new Date(type.TPEQ_date_creation); // Use Date object for comparison

        if (filterFrom && (!isDate(creationDate) || !isValid(creationDate) || creationDate < filterFrom)) {
          matchesDate = false;
        }
        if (filterTo && (!isDate(creationDate) || !isValid(creationDate) || creationDate > filterTo)) {
          matchesDate = false;
        }
      } else {
        // If creation date is missing on an item, it shouldn't match date filters unless no date filter is set
        if (filterFrom || filterTo) {
          matchesDate = false;
        }
      }


      return matchesSearch && matchesDate;
    });
  }, [typesEquipements, searchQuery, filterDateFrom, filterDateTo]); // Dependencies updated

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle date filter changes
  const handleDateFromChange = (e) => {
    setFilterDateFrom(e.target.value); // value is YYYY-MM-DD string
  };

  const handleDateToChange = (e) => {
    setFilterDateTo(e.target.value); // value is YYYY-MM-DD string
  };


  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>

      <Typography variant="h4" component="h2" gutterBottom sx={{ color: blue[700] }}>
        Gestion des Types d'Équipements
      </Typography>

      {/* Controls Section (Add button, Search bar, Date filters) */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        {/* Search Field */}
        <TextField
          label="Rechercher (Libellé, Code)"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ width: { xs: '100%', sm: 250 } }}
        />

        {/* Date From Filter */}
        <TextField
          label="Créé après le"
          type="date"
          variant="outlined"
          size="small"
          value={filterDateFrom}
          onChange={handleDateFromChange}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 180 } }}
        />

        {/* Date To Filter */}
        <TextField
          label="Créé avant le"
          type="date"
          variant="outlined"
          size="small"
          value={filterDateTo}
          onChange={handleDateToChange}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: '100%', sm: 180 } }}
        />


        {/* Add Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Ajouter un Type d'Équipement
        </Button>
      </Box>

      {/* Table Container with limited max width and gray theme */}
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table sx={{ minWidth: 500 }} aria-label="types equipements table">

           {/* Table Header with light grey background */}
           <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                {/* Header Cells with black text */}
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Libellé</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date de Création</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTypesEquipements.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Aucun type d'équipement trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTypesEquipements.map((type, index) => (
                  <TableRow
                    key={type._id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? grey[100] : "white",
                      "&:hover": { backgroundColor: grey[200] },
                      }}
                    >
                      <TableCell>{type._id}</TableCell>
                      <TableCell>{type.TPEQ_libelle}</TableCell>
                      <TableCell>{type.TPEQ_code}</TableCell>
                      <TableCell>{type.TPEQ_date_creation ? new Date(type.TPEQ_date_creation).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box display="flex" gap={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenDialog(type)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDelete(type._id)}
                          >
                            Supprimer
                          </Button>
                        </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Dialog Formulaire */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{selectedTypeEquipement ? "Modifier un Type d'Équipement" : "Créer un Type d'Équipement"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                name="TPEQ_libelle"
                label="Libellé"
                fullWidth
                variant="outlined"
                value={form.TPEQ_libelle}
                onChange={handleChange}
                required
              />
            </Grid>
         
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">Annuler</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {selectedTypeEquipement ? "Modifier" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default GestionTypesEquipements;
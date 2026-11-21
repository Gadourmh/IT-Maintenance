import React, { useState, useEffect, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, CircularProgress,
  Box,
  Typography,
  Grid,
  Alert
} from "@mui/material";
import { grey } from "@mui/material/colors";
import Swal from "sweetalert2";
import api from "../../api/api";
import Select from 'react-select'; // 🛑 Import react-select

const GestionTypesPannes = () => {
  const [typesPannes, setTypesPannes] = useState([]);
  const [typesEquipements, setTypesEquipements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTypePanne, setSelectedTypePanne] = useState(null);
  const [form, setForm] = useState({
    PANN_libelle: "",
    PANN_TPEQ_codes: [], // 🛑 MODIFICATION ICI: Maintenant un tableau
  });

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTypesPannes();
    fetchTypesEquipements();
  }, []);

  const fetchTypesPannes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/types-pannes/");
      setTypesPannes(res.data);
      setNotification(prev => ({ ...prev, open: false }));
    } catch (error) {
      console.error("Erreur lors de la récupération des types de pannes", error.response?.data || error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Échec du chargement des types de pannes.",
        severity: "error",
      });
      setTypesPannes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTypesEquipements = async () => {
    try {
      const res = await api.get("/type-equipments/");
      setTypesEquipements(res.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des types d'équipements", error.response?.data || error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Échec du chargement des types d'équipements.",
        severity: "error",
      });
      setTypesEquipements([]);
    }
  };

  const handleOpenDialog = (typePanne = null) => {
    setSelectedTypePanne(typePanne);
    if (typePanne) {
      // 🛑 MODIFICATION ICI: Populer form.PANN_TPEQ_codes avec l'array existant
      setForm({
        _id: typePanne._id,
        PANN_libelle: typePanne.PANN_libelle,
        PANN_TPEQ_codes: typePanne.PANN_TPEQ_codes || [], // Assurez-vous que c'est un tableau
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTypePanne(null);
    resetForm();
  };

  // 🛑 MODIFICATION ICI: handleChange pour react-select
  const handleSelectChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setForm((prev) => ({ ...prev, PANN_TPEQ_codes: selectedValues }));
  };

  // Keep existing handleChange for other text fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // 🛑 MODIFICATION ICI: Valider le tableau de codes
      if (!form.PANN_libelle || !form.PANN_TPEQ_codes || form.PANN_TPEQ_codes.length === 0) {
        Swal.fire("Attention", "Veuillez remplir tous les champs obligatoires et sélectionner au moins un type d'équipement.", "warning");
        return;
      }

      // Payload includes PANN_TPEQ_codes as an array
      const payload = {
        PANN_libelle: form.PANN_libelle,
        PANN_TPEQ_codes: form.PANN_TPEQ_codes,
      };

      if (selectedTypePanne) {
        await api.put(`/types-pannes/${form._id}`, payload); // Use payload
        Swal.fire("Succès", "Type de panne modifié avec succès!", "success");
      } else {
        await api.post("/types-pannes/", payload); // Use payload
        Swal.fire("Succès", "Type de panne ajouté avec succès!", "success");
      }
      fetchTypesPannes();
      handleCloseDialog();
    } catch (error) {
      console.error("Erreur lors de la soumission du type de panne", error.response?.data || error);
      Swal.fire("Erreur", `Échec de l'opération: ${error.response?.data?.message || error.message}`, "error");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr(e) ?",
      text: "Vous ne pourrez pas revenir en arrière !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/types-pannes/${id}`);
        Swal.fire("Supprimé !", "Le type de panne a été supprimé.", "success");
        fetchTypesPannes();
      } catch (error) {
        console.error("Erreur lors de la suppression", error.response?.data || error);
        Swal.fire("Erreur", `Échec de la suppression: ${error.response?.data?.message || error.message}`, "error");
      }
    }
  };

  const resetForm = () => {
    setForm({
      PANN_libelle: "",
      PANN_TPEQ_codes: [], // 🛑 MODIFICATION ICI: Reset à un tableau vide
    });
  };

  // Helper to get Type Equipement Libelle(s) from its code(s) for display in table
  // 🛑 MODIFICATION ICI: Fonction pour gérer plusieurs libellés
  const getTypeEquipementLibellesFromCodes = (codes) => {
    if (!codes || codes.length === 0) return 'Aucun';
    const libelles = codes.map(code => {
      const type = typesEquipements.find(t => t.TPEQ_code === code);
      return type ? `${type.TPEQ_code} - ${type.TPEQ_libelle}` : `${code} (Inconnu)`;
    });
    return libelles.join(', ');
  };

  // Memoized filtering logic for the table
  const filteredTypesPannes = useMemo(() => {
    let currentTypesPannes = typesPannes;

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      currentTypesPannes = currentTypesPannes.filter((panne) =>
        (panne.PANN_libelle || "").toLowerCase().includes(lowerCaseQuery) ||
        (panne.PANN_code || "").toLowerCase().includes(lowerCaseQuery) ||
        // 🛑 MODIFICATION ICI: Rechercher dans les codes et libellés multiples
        getTypeEquipementLibellesFromCodes(panne.PANN_TPEQ_codes).toLowerCase().includes(lowerCaseQuery)
      );
    }
    return currentTypesPannes;
  }, [typesPannes, searchQuery, typesEquipements]);

  // Options for react-select
  const selectOptions = typesEquipements.map(type => ({
    value: type.TPEQ_code,
    label: `${type.TPEQ_code} - ${type.TPEQ_libelle}`
  }));

  return (
    <Box sx={{ p: 3 }}>
      {notification.open && (
        <Alert severity={notification.severity} onClose={() => setNotification(prev => ({ ...prev, open: false }))} sx={{ mb: 2 }}>
          {notification.message}
        </Alert>
      )}

      <Typography variant="h4" component="h2" gutterBottom>
        Gestion des Types de Pannes
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Créer un Nouveau Type de Panne
        </Button>
      </Box>

      {/* Filter/Search Section */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          variant="outlined"
          label="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ width: { xs: '100%', sm: 250 } }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : filteredTypesPannes.length === 0 ? (
        <Typography variant="body1" color="textSecondary" align="center" mt={4}>
          Aucun type de panne trouvé.
        </Typography>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow sx={{ backgroundColor: grey[200] }}>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Libellé</Typography></TableCell>
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Code Panne</Typography></TableCell>
                {/* 🛑 MODIFICATION ICI: Entête de colonne pour multiples équipements */}
                <TableCell><Typography variant="subtitle1" fontWeight="bold">Types Équipements Associés</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle1" fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTypesPannes.map((type) => (
                <TableRow
                  key={type._id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {type.PANN_libelle}
                  </TableCell>
                  <TableCell>{type.PANN_code}</TableCell>
                  <TableCell>
                    {/* 🛑 MODIFICATION ICI: Afficher les libellés multiples */}
                    {getTypeEquipementLibellesFromCodes(type.PANN_TPEQ_codes)}
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(type)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleDelete(type._id)}
                      >
                        Supprimer
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Formulaire */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{selectedTypePanne ? "Modifier un Type de Panne" : "Créer un Type de Panne"}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                name="PANN_libelle"
                label="Libellé"
                fullWidth
                variant="outlined"
                value={form.PANN_libelle}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* 🛑 MODIFICATION ICI: Utilisation de react-select pour la sélection multiple */}
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                Types d'Équipements Associés (Sélectionnez un ou plusieurs)
              </Typography>
              <Select
                isMulti // Active la sélection multiple
                name="PANN_TPEQ_codes"
                options={selectOptions}
                // Filtrez les options pour correspondre aux codes actuellement sélectionnés dans le formulaire
                value={selectOptions.filter(option => form.PANN_TPEQ_codes.includes(option.value))}
                onChange={handleSelectChange} // Gère le changement de sélection
                placeholder="Sélectionnez les types d'équipement..."
                closeMenuOnSelect={false} // Garde le menu ouvert après une sélection
                styles={{
                  menuPortal: base => ({ ...base, zIndex: 9999 }), // Ensure dropdown is on top
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderColor: state.isFocused ? '#1976d2' : '#ced4da',
                    '&:hover': {
                      borderColor: '#1976d2',
                    },
                    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(25, 118, 210, 0.25)' : 'none',
                    minHeight: '56px', // Match TextField height
                  }),
                }}
                menuPortalTarget={document.body} // Render dropdown outside dialog to avoid clipping
              />
            </Grid>
            {/* FIN DE LA MODIFICATION */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {selectedTypePanne ? "Modifier" : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionTypesPannes;
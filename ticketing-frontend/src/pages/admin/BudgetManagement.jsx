import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Menu,
} from "@mui/material";
import { blue, grey, red } from "@mui/material/colors";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';


const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [BUDG_nom, setBUDG_nom] = useState("");
  const [BUDG_montant, setBUDG_montant] = useState("");
  const [BUDG_periode, setBUDG_periode] = useState("");
  const [BUDG_remarques, setBUDG_remarques] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [filterName, setFilterName] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");

  const periodOptions = ["Mensuel", "Trimestriel", "Annuel"];

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedBudgetForMenu, setSelectedBudgetForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);


  const resetForm = () => {
    setBUDG_nom("");
    setBUDG_montant("");
    setBUDG_periode("");
    setBUDG_remarques("");
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleOpenForm = (budget = null) => {
    if (budget) {
      setEditingId(budget._id);
      setBUDG_nom(budget.BUDG_nom);
      setBUDG_montant(budget.BUDG_montant);
      setBUDG_periode(budget.BUDG_periode);
      setBUDG_remarques(budget.BUDG_remarques);
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!BUDG_nom || BUDG_montant === "" || !BUDG_periode) {
      setNotification({
        open: true,
        message: "Veuillez remplir tous les champs obligatoires (Nom, Montant, Période).",
        severity: "warning",
      });
      return;
    }


    const budgetData = {
      BUDG_nom,
      BUDG_montant: Number(BUDG_montant),
      BUDG_periode,
      BUDG_remarques,
    };

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    if (editingId) {
      api
        .put(`/budgets/${editingId}`, budgetData, config)
        .then((res) => {
          setBudgets((prev) =>
            prev.map((b) => (b._id === editingId ? res.data : b))
          );
          setNotification({ open: true, message: "Budget modifié avec succès.", severity: "success" });
          resetForm();
        })
        .catch((err) => {
          console.error("Erreur modification budget", err.response?.data || err);
          setNotification({ open: true, message: err.response?.data?.message || "Erreur lors de la modification.", severity: "error" });
        });
    } else {
      api
        .post("/budgets", budgetData, config)
        .then((res) => {
          setBudgets([...budgets, res.data]);
          setNotification({ open: true, message: "Budget créé avec succès.", severity: "success" });
          resetForm();
        })
        .catch((err) => {
          console.error("Erreur création budget", err.response?.data || err);
          setNotification({ open: true, message: err.response?.data?.message || "Erreur lors de la création.", severity: "error" });
        });
    }
  };

  const handleEdit = (budget) => {
    handleOpenForm(budget);
  };

  const handleConfirmDelete = (budget) => {
    setBudgetToDelete(budget);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!budgetToDelete) return;

    const idToDelete = budgetToDelete._id;

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await api.delete(`/budgets/${idToDelete}`, config);
      setBudgets((prev) => prev.filter((b) => b._id !== idToDelete));
      setNotification({ open: true, message: "Budget supprimé avec succès.", severity: "success" });
      setIsConfirmOpen(false);
      setBudgetToDelete(null);
    } catch (err) {
      console.error("Erreur suppression budget", err.response?.data || err);
      setNotification({ open: true, message: err.response?.data?.message || "Erreur lors de la suppression.", severity: "error" });
      setIsConfirmOpen(false);
      setBudgetToDelete(null);
    }
  };


  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    api
      .get("/budgets/", config)
      .then((res) => setBudgets(res.data))
      .catch((err) => console.error("Erreur chargement budgets", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      const nameMatch = filterName === "" || (budget.BUDG_nom && budget.BUDG_nom.toLowerCase().includes(filterName.toLowerCase()));
      const periodMatch = filterPeriod === "" || (budget.BUDG_periode && budget.BUDG_periode === filterPeriod);
      return nameMatch && periodMatch;
    });
  }, [budgets, filterName, filterPeriod]);

  const resetFilters = () => {
    setFilterName("");
    setFilterPeriod("");
  };

  const handleMenuOpen = (event, budget) => {
    setAnchorEl(event.currentTarget);
    setSelectedBudgetForMenu(budget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBudgetForMenu(null);
  };


  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: "#fff", minHeight: "100vh" }}>

      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: blue[900] }}>
        Gestion des Budgets
      </Typography>

      <Paper sx={{ padding: 2, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: grey[800] }}>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Nom du budget"
              variant="outlined"
              size="small"
              fullWidth
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Période</InputLabel>
              <Select
                value={filterPeriod}
                label="Période"
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <MenuItem value="">
                  <em>Tous</em>
                </MenuItem>
                {periodOptions.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="outlined" onClick={resetFilters} fullWidth color="secondary">
              Réinitialiser Filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>


      <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <Button variant="contained" color="primary" onClick={() => handleOpenForm()}>
          <AddIcon sx={{ mr: 1 }}/> Créer un Budget
        </Button>
      </Box>

      <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
        <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
          <Table sx={{ minWidth: 600 }} aria-label="budgets table">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Nom</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Montant</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Période</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Remarques</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBudgets.length > 0 ? (
                filteredBudgets.map((budget, index) => (
                  <TableRow
                    key={budget._id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? grey[100] : "white",
                      "&:hover": { backgroundColor: grey[200] },
                    }}
                  >
                    <TableCell>{budget.BUDG_nom}</TableCell>
                    <TableCell>{budget.BUDG_montant?.toLocaleString() || 'N/A'} €</TableCell>
                    <TableCell>{budget.BUDG_periode}</TableCell>
                    <TableCell>{budget.BUDG_remarques || '-'}</TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="plus d'actions"
                        aria-controls={menuOpen ? 'budget-actions-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={menuOpen ? 'true' : undefined}
                        onClick={(event) => handleMenuOpen(event, budget)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {budgets.length > 0 ? "Aucun budget ne correspond aux filtres." : "Aucun budget disponible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>

      <Menu
        id="budget-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedBudgetForMenu && (
          <>
            <MenuItem onClick={() => {
              handleEdit(selectedBudgetForMenu);
              handleMenuClose();
            }}>
              Modifier
            </MenuItem>
            <MenuItem onClick={() => {
              handleConfirmDelete(selectedBudgetForMenu);
              handleMenuClose();
            }}>
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>


      <Dialog open={isFormOpen} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: blue[700], color: "#fff" }}>
          {editingId ? "Modifier le Budget" : "Créer un Nouveau Budget"}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              label="Nom du budget"
              fullWidth
              margin="normal"
              variant="outlined"
              value={BUDG_nom}
              onChange={(e) => setBUDG_nom(e.target.value)}
              required
            />
            <TextField
              label="Montant"
              type="number"
              fullWidth
              margin="normal"
              variant="outlined"
              value={BUDG_montant}
              onChange={(e) => setBUDG_montant(e.target.value)}
              required
            />
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Période</InputLabel>
              <Select
                value={BUDG_periode}
                label="Période"
                onChange={(e) => setBUDG_periode(e.target.value)}
                required
              >
                <MenuItem value="">
                  <em>Sélectionner la période</em>
                </MenuItem>
                {periodOptions.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Remarques"
              fullWidth
              margin="normal"
              variant="outlined"
              value={BUDG_remarques}
              onChange={(e) => setBUDG_remarques(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editingId ? "Modifier" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <DialogTitle sx={{ backgroundColor: red[700], color: "#fff" }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le budget "{budgetToDelete?.BUDG_nom}" ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfirmOpen(false)} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Budgets;
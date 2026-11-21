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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, isWithinInterval, parseISO } from 'date-fns';
import { blue, grey, red } from "@mui/material/colors";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';


const FinancialReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // MODIFICATION: Les noms des champs dans formData correspondent au modèle backend
  const [formData, setFormData] = useState({
    RPFT_titre: "",
    RPFT_periode: "",
    RPFT_revenuTotal: "",
    RPFT_depensesTotales: "",
    RPFT_profit: "",
  });
  const [editingReportId, setEditingReportId] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // MODIFICATION: Les noms des filtres restent génériques car ils sont des états locaux,
  // mais le filtrage dans useMemo utilisera les noms de champs du rapport (ex: report.RPFT_titre)
  const [filterTitle, setFilterTitle] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);

  const periodOptions = ["Mensuel", "Trimestriel", "Annuel"];

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReportForMenu, setSelectedReportForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);


  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // L'endpoint est correct : /rapports-financiers/
    api.get("/rapports-financiers/", config)
      .then((response) => {
        setReports(response.data);
      })
      .catch((error) => {
        console.error("Erreur de chargement des rapports financiers", error.response?.data || error);
        setError(error.response?.data?.message || "Erreur de chargement des données.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleOpenForm = (report = null) => {
    if (report) {
      setEditingReportId(report._id);
      // MODIFICATION: Charger les données du rapport avec les noms de champs du backend
      setFormData({
        RPFT_titre: report.RPFT_titre,
        RPFT_periode: report.RPFT_periode,
        RPFT_revenuTotal: report.RPFT_revenuTotal,
        RPFT_depensesTotales: report.RPFT_depensesTotales,
        RPFT_profit: report.RPFT_profit,
      });
    } else {
      // MODIFICATION: Réinitialiser pour le nouveau rapport avec les noms de champs du backend
      setFormData({
        RPFT_titre: "",
        RPFT_periode: "",
        RPFT_revenuTotal: "",
        RPFT_depensesTotales: "",
        RPFT_profit: "",
      });
      setEditingReportId(null);
    }
    setIsFormOpen(true);
  };


  const resetForm = () => {
    // MODIFICATION: Réinitialiser avec les noms de champs du backend
    setFormData({
      RPFT_titre: "",
      RPFT_periode: "",
      RPFT_revenuTotal: "",
      RPFT_depensesTotales: "",
      RPFT_profit: "",
    });
    setEditingReportId(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // MODIFICATION: Validation avec les noms de champs du backend
    if (!formData.RPFT_titre || !formData.RPFT_periode || formData.RPFT_revenuTotal === "" || formData.RPFT_depensesTotales === "" || formData.RPFT_profit === "") {
      setNotification({
        open: true,
        message: "Veuillez remplir tous les champs obligatoires.",
        severity: "warning",
      });
      return;
    }

    // MODIFICATION: Assurer que les valeurs sont des nombres et utilisent les noms de champs du backend
    const reportData = {
      ...formData,
      RPFT_revenuTotal: Number(formData.RPFT_revenuTotal),
      RPFT_depensesTotales: Number(formData.RPFT_depensesTotales),
      RPFT_profit: Number(formData.RPFT_profit),
    };

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    if (editingReportId) {
      // L'endpoint est correct : /rapports-financiers/:id
      api.put(`/rapports-financiers/${editingReportId}`, reportData, config)
        .then((response) => {
          const updatedReports = reports.map((report) =>
            report._id === editingReportId ? response.data : report
          );
          setReports(updatedReports);
          setNotification({ open: true, message: "Rapport modifié avec succès.", severity: "success" });
          resetForm();
        })
        .catch((error) => {
          console.error("Erreur lors de la modification du rapport financier", error.response?.data || error);
          setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la modification du rapport.", severity: "error" });
        });
    } else {
      // L'endpoint est correct : /rapports-financiers/
      api.post("/rapports-financiers/", reportData, config)
        .then((response) => {
          // Ajoute le nouveau rapport avec les données complètes renvoyées par le backend
          setReports([...reports, response.data]);
          setNotification({ open: true, message: "Rapport créé avec succès.", severity: "success" });
          resetForm();
        })
        .catch((error) => {
          console.error("Erreur lors de la création du rapport financier", error.response?.data || error);
          setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la création du rapport.", severity: "error" });
        });
    }
  };


  const handleConfirmDelete = (report) => {
    setReportToDelete(report);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;

    const idToDelete = reportToDelete._id;
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      // L'endpoint est correct : /rapports-financiers/:id
      await api.delete(`/rapports-financiers/${idToDelete}`, config);
      setReports(reports.filter((report) => report._id !== idToDelete));
      setNotification({ open: true, message: "Rapport supprimé avec succès.", severity: "success" });
      setIsConfirmOpen(false);
      setReportToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du rapport financier", error.response?.data || error);
      setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la suppression du rapport.", severity: "error" });
      setIsConfirmOpen(false);
      setReportToDelete(null);
    }
  };

  const handleEdit = (report) => {
    handleOpenForm(report);
  };


  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // MODIFICATION: Utiliser les noms de champs du backend pour le filtrage
      const titleMatch = filterTitle === "" || (report.RPFT_titre && report.RPFT_titre.toLowerCase().includes(filterTitle.toLowerCase()));
      const periodMatch = filterPeriod === "" || (report.RPFT_periode && report.RPFT_periode === filterPeriod);

      // MODIFICATION: Utiliser RPFT_dateCreation pour le filtrage par date
      const reportDate = report.RPFT_dateCreation ? parseISO(report.RPFT_dateCreation) : null;

      const dateMatch = !filterStartDate && !filterEndDate || !reportDate ||
        (filterStartDate && !filterEndDate && reportDate >= new Date(filterStartDate)) ||
        (!filterStartDate && filterEndDate && reportDate <= new Date(filterEndDate)) ||
        (filterStartDate && filterEndDate && isWithinInterval(reportDate, { start: new Date(filterStartDate), end: new Date(filterEndDate) }));

      return titleMatch && periodMatch && dateMatch;
    });
  }, [reports, filterTitle, filterPeriod, filterStartDate, filterEndDate]);


  const resetFilters = () => {
    setFilterTitle("");
    setFilterPeriod("");
    setFilterStartDate(null);
    setFilterEndDate(null);
  };

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setSelectedReportForMenu(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReportForMenu(null);
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
        Rapports Financiers
      </Typography>

      {error && !notification.open && (
        <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: red[500], borderRadius: 1, bgcolor: red[50] }}>
          <Typography variant="h6" color="error">{error}</Typography>
        </Box>
      )}


      <Paper sx={{ padding: 2, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: grey[800] }}>
          Filtres
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Titre du rapport"
                variant="outlined"
                size="small"
                fullWidth
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Date Début Création"
                value={filterStartDate}
                onChange={(newValue) => setFilterStartDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Date Fin Création"
                value={filterEndDate}
                onChange={(newValue) => setFilterEndDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={resetFilters} color="secondary">
                Réinitialiser Filtres
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>


      <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <Button variant="contained" color="primary" onClick={() => handleOpenForm()}>
          <AddIcon sx={{ mr: 1 }}/> Créer un Rapport
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="financial reports table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Titre</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Période</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Revenu Total</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Dépenses Totales</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Bénéfice</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Création</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.length > 0 ? (
              filteredReports.map((report, index) => (
                <TableRow
                  key={report._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[100] : "white",
                    "&:hover": { backgroundColor: grey[200] },
                  }}
                >
                  {/* MODIFICATION: Afficher les données avec les noms de champs du backend */}
                  <TableCell>{report.RPFT_titre}</TableCell>
                  <TableCell>{report.RPFT_periode}</TableCell>
                  <TableCell align="right">{report.RPFT_revenuTotal?.toLocaleString() ?? "N/A"} €</TableCell>
                  <TableCell align="right">{report.RPFT_depensesTotales?.toLocaleString() ?? "N/A"} €</TableCell>
                  <TableCell align="right">{report.RPFT_profit?.toLocaleString() ?? "N/A"} €</TableCell>
                  {/* MODIFICATION: Utiliser RPFT_dateCreation pour la date */}
                  <TableCell>{report.RPFT_dateCreation ? new Date(report.RPFT_dateCreation).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="plus d'actions"
                      aria-controls={menuOpen ? 'report-actions-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={menuOpen ? 'true' : undefined}
                      onClick={(event) => handleMenuOpen(event, report)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {reports.length > 0 ? "Aucun rapport ne correspond aux filtres." : "Aucun rapport financier disponible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        id="report-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedReportForMenu && (
          <>
            <MenuItem onClick={() => {
              handleEdit(selectedReportForMenu);
              handleMenuClose();
            }}>
              Modifier
            </MenuItem>
            <MenuItem onClick={() => {
              handleConfirmDelete(selectedReportForMenu);
              handleMenuClose();
            }}>
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>

      <Dialog open={isFormOpen} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: blue[700], color: "#fff" }}>
          {editingReportId ? "Modifier le Rapport Financier" : "Créer un Nouveau Rapport Financier"}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              label="Titre"
              name="RPFT_titre" // MODIFICATION: Ajouter le nom de l'attribut pour le handleChange si vous l'implémentez
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.RPFT_titre} // MODIFICATION: Utiliser le nom de champ du backend
              onChange={(e) => setFormData({ ...formData, RPFT_titre: e.target.value })} // MODIFICATION
              required
            />
            <FormControl fullWidth margin="normal" variant="outlined">
              <InputLabel>Période</InputLabel>
              <Select
                name="RPFT_periode" // MODIFICATION: Ajouter le nom de l'attribut
                value={formData.RPFT_periode} // MODIFICATION: Utiliser le nom de champ du backend
                label="Période"
                onChange={(e) => setFormData({ ...formData, RPFT_periode: e.target.value })} // MODIFICATION
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
              label="Revenu Total"
              name="RPFT_revenuTotal" // MODIFICATION: Ajouter le nom de l'attribut
              type="number"
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.RPFT_revenuTotal} // MODIFICATION: Utiliser le nom de champ du backend
              onChange={(e) => setFormData({ ...formData, RPFT_revenuTotal: e.target.value })} // MODIFICATION
              required
            />
            <TextField
              label="Dépenses Totales"
              name="RPFT_depensesTotales" // MODIFICATION: Ajouter le nom de l'attribut
              type="number"
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.RPFT_depensesTotales} // MODIFICATION: Utiliser le nom de champ du backend
              onChange={(e) => setFormData({ ...formData, RPFT_depensesTotales: e.target.value })} // MODIFICATION
              required
            />
            <TextField
              label="Bénéfice"
              name="RPFT_profit" // MODIFICATION: Ajouter le nom de l'attribut
              type="number"
              fullWidth
              margin="normal"
              variant="outlined"
              value={formData.RPFT_profit} // MODIFICATION: Utiliser le nom de champ du backend
              onChange={(e) => setFormData({ ...formData, RPFT_profit: e.target.value })} // MODIFICATION
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editingReportId ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <DialogTitle sx={{ backgroundColor: red[700], color: "#fff" }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography>
            {/* MODIFICATION: Utiliser le nom de champ du backend pour le message de confirmation */}
            Êtes-vous sûr de vouloir supprimer le rapport "{reportToDelete?.RPFT_titre}" ?
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

export default FinancialReports;
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
  Snackbar,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,

} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {  isWithinInterval, parseISO } from 'date-fns';
import { blue, grey, red } from "@mui/material/colors";
import MoreVertIcon from '@mui/icons-material/MoreVert';



const FinancialReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);





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

  const menuOpen = Boolean(anchorEl);


  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

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


      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="financial reports table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Titre</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Période</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Revenu Total</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Dépenses Totales</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Bénéfice</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Montant Payé</TableCell> {/* <--- NOUVELLE COLONNE */}
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Création</TableCell>
           
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
                  <TableCell>{report.RPFT_titre}</TableCell>
                  <TableCell>{report.RPFT_periode}</TableCell>
                  {/* MODIFICATION: Utiliser le formatage TND pour toutes les devises */}
                  <TableCell align="right">{report.RPFT_revenuTotal?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}</TableCell>
                  <TableCell align="right">{report.RPFT_depensesTotales?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}</TableCell>
                  <TableCell align="right">{report.RPFT_profit?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}</TableCell>
                  <TableCell align="right">{report.RPFT_montantPaye?.toLocaleString('fr-FR', { style: 'currency', currency: 'TND' }) ?? "0 TND"}</TableCell> {/* <--- AFFICHAGE DU NOUVEAU CHAMP */}
                  <TableCell>{report.RPFT_dateCreation ? new Date(report.RPFT_dateCreation).toLocaleDateString() : 'N/A'}</TableCell>
                
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center"> {/* <--- COLSPAN MIS À JOUR */}
                  {reports.length > 0 ? "Aucun rapport ne correspond aux filtres." : "Aucun rapport financier disponible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

    

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
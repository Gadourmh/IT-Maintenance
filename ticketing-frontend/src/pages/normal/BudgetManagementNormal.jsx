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



      <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
        <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
          <Table sx={{ minWidth: 600 }} aria-label="budgets table">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Nom</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Montant</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Période</TableCell>
                <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Remarques</TableCell>
           
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
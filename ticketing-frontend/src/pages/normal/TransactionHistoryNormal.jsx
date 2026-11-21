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

} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, isWithinInterval, parseISO, isValid } from 'date-fns';
import { blue, grey, red } from "@mui/material/colors";



const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [filterType, setFilterType] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");
  const [filterDateStart, setFilterDateStart] = useState(null);
  const [filterDateEnd, setFilterDateEnd] = useState(null);

  // MODIFICATION: Les valeurs des options correspondent à l'énumération du modèle
  const typeOptions = [
    { value: "REVENU", label: "Revenu" },
    { value: "DEPENSE", label: "Dépense" },
  ];


  const [anchorEl, setAnchorEl] = useState(null);





 



  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // Assurez-vous que l'endpoint backend correspond à la route de récupération
    api.get("/transactions/", config)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setTransactions(response.data);
        } else {
          console.error("La réponse de l'API n'est pas un tableau:", response.data);
          setTransactions([]);
        }
      })
      .catch((error) => {
        console.error("Erreur de chargement des transactions", error.response?.data || error);
        setError(error.response?.data?.message || "Erreur de chargement des transactions.");
        setTransactions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // MODIFICATION: Utiliser les noms de champs du modèle pour le filtrage
      const typeMatch = filterType === "" || (transaction.TRNS_type && transaction.TRNS_type === filterType);
      const descriptionMatch = filterDescription === "" || (transaction.TRNS_description && transaction.TRNS_description.toLowerCase().includes(filterDescription.toLowerCase()));

      // MODIFICATION: Utiliser TRNS_montant
      const amountValue = typeof transaction.TRNS_montant === 'number' ? transaction.TRNS_montant : NaN;
      const amountMin = filterAmountMin === "" ? -Infinity : Number(filterAmountMin);
      const amountMax = filterAmountMax === "" ? Infinity : Number(filterAmountMax);

      const amountMatch = !isNaN(amountValue) && amountValue >= amountMin && amountValue <= amountMax;

      const isAmountFilterApplied = filterAmountMin !== "" || filterAmountMax !== "";
      const finalAmountMatch = isAmountFilterApplied ? amountMatch : true;

      // MODIFICATION: Utiliser TRNS_dateTransaction pour le filtrage par date
      const transactionDate = transaction.TRNS_dateTransaction ? parseISO(transaction.TRNS_dateTransaction) : null;

      const startDateObj = filterDateStart ? new Date(filterDateStart) : null;
      const endDateObj = filterDateEnd ? new Date(filterDateEnd) : null;

      const dateMatch = !startDateObj && !endDateObj || !transactionDate ||
        (startDateObj && !endDateObj && transactionDate >= startDateObj) ||
        (!startDateObj && endDateObj && transactionDate <= endDateObj) ||
        (startDateObj && endDateObj && isValid(startDateObj) && isValid(endDateObj) && isWithinInterval(transactionDate, { start: startDateObj, end: endDateObj }));


      return typeMatch && descriptionMatch && finalAmountMatch && dateMatch;
    });
  }, [transactions, filterType, filterDescription, filterAmountMin, filterAmountMax, filterDateStart, filterDateEnd]);


  const resetFilters = () => {
    setFilterType("");
    setFilterDescription("");
    setFilterAmountMin("");
    setFilterAmountMax("");
    setFilterDateStart(null);
    setFilterDateEnd(null);
  };

  const handleMenuOpen = (event, transaction) => {
    setAnchorEl(event.currentTarget);
    setSelectedTransactionForMenu(transaction);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTransactionForMenu(null);
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
        Gestion des Transactions
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
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterType}
                  label="Type"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Tous</em>
                  </MenuItem>
                  {typeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Description"
                variant="outlined"
                size="small"
                fullWidth
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Montant Min"
                type="number"
                variant="outlined"
                size="small"
                fullWidth
                value={filterAmountMin}
                onChange={(e) => setFilterAmountMin(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Montant Max"
                type="number"
                variant="outlined"
                size="small"
                fullWidth
                value={filterAmountMax}
                onChange={(e) => setFilterAmountMax(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Date Début"
                value={filterDateStart}
                onChange={(newValue) => setFilterDateStart(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Date Fin"
                value={filterDateEnd}
                onChange={(newValue) => setFilterDateEnd(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" variant="outlined" />}
                slotProps={{ textField: { size: 'small' } }}
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
        <Table sx={{ minWidth: 650 }} aria-label="transactions table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Montant</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date</TableCell>
         
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction, index) => (
                <TableRow
                  key={transaction._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[100] : "white",
                    "&:hover": { backgroundColor: grey[200] },
                  }}
                >
                  {/* MODIFICATION: Afficher les données avec les noms de champs du modèle */}
                  <TableCell>{transaction.TRNS_type || 'N/A'}</TableCell>
                  <TableCell>{transaction.TRNS_description || 'N/A'}</TableCell>
                  <TableCell align="right">{typeof transaction.TRNS_montant === 'number' ? `${transaction.TRNS_montant.toLocaleString()} €` : 'N/A'}</TableCell>
                  <TableCell>{transaction.TRNS_dateTransaction ? format(parseISO(transaction.TRNS_dateTransaction), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                 
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {transactions.length > 0 ? "Aucune transaction ne correspond aux filtres." : "Aucune transaction disponible."}
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

export default Transactions;
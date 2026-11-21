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
import { format, isWithinInterval, parseISO, isValid } from 'date-fns';
import { blue, grey, red } from "@mui/material/colors";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';


const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Les noms des états restent génériques, mais les données envoyées/reçues de l'API
  // utiliseront les noms de champs du modèle (TRNS_...)
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(null);
  const [transactionToEdit, setTransactionToEdit] = useState(null);


  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

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
  const [selectedTransactionForMenu, setSelectedTransactionForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);


  const handleOpenForm = (transaction = null) => {
    if (transaction) {
      setTransactionToEdit(transaction);
      // MODIFICATION: Utiliser les noms de champs du modèle pour pré-remplir le formulaire
      setType(transaction.TRNS_type);
      setDescription(transaction.TRNS_description);
      setAmount(transaction.TRNS_montant);
      setDate(transaction.TRNS_dateTransaction ? parseISO(transaction.TRNS_dateTransaction) : null);
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };


  const resetForm = () => {
    setTransactionToEdit(null);
    setType("");
    setDescription("");
    setAmount("");
    setDate(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation basée sur les états locaux (type, description, amount, date)
    if (!type || !description || amount === "" || date === null || !isValid(new Date(date))) {
      setNotification({
        open: true,
        message: "Veuillez remplir tous les champs obligatoires et valides.",
        severity: "warning",
      });
      return;
    }
    if (isNaN(Number(amount))) {
      setNotification({
        open: true,
        message: "Le montant doit être un nombre valide.",
        severity: "warning",
      });
      return;
    }

    // MODIFICATION: Créer l'objet transactionData avec les noms de champs du modèle
    const transactionData = {
      TRNS_type: type,
      TRNS_description: description,
      TRNS_montant: Number(amount),
      TRNS_dateTransaction: format(new Date(date), 'yyyy-MM-dd'), // Assurez-vous que le format correspond à ce que votre backend attend
    };

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };


    if (transactionToEdit) {
      // Assurez-vous que l'endpoint backend correspond à la route de mise à jour
      api.put(`/transactions/${transactionToEdit._id}`, transactionData, config)
        .then((response) => {
          const updatedTransactions = transactions.map((transaction) =>
            transaction._id === transactionToEdit._id ? response.data : transaction
          );
          setTransactions(updatedTransactions);
          setNotification({ open: true, message: "Transaction modifiée avec succès.", severity: "success" });
          resetForm();
        })
        .catch((error) => {
          console.error("Erreur lors de la mise à jour de la transaction", error.response?.data || error);
          setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la modification.", severity: "error" });
        });
    } else {
      // Assurez-vous que l'endpoint backend correspond à la route de création
      api.post("/transactions", transactionData, config)
        .then((response) => {
          setTransactions([...transactions, response.data]);
          setNotification({ open: true, message: "Transaction créée avec succès.", severity: "success" });
          resetForm();
        })
        .catch((error) => {
          console.error("Erreur lors de la création de la transaction", error.response?.data || error);
          setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la création.", severity: "error" });
        });
    }
  };

  const handleConfirmDelete = (transaction) => {
    setTransactionToDelete(transaction);
    setIsConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    const idToDelete = transactionToDelete._id;
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };


    try {
      // Assurez-vous que l'endpoint backend correspond à la route de suppression
      await api.delete(`/transactions/${idToDelete}`, config);
      setTransactions(transactions.filter((transaction) => transaction._id !== idToDelete));
      setNotification({ open: true, message: "Transaction supprimée avec succès.", severity: "success" });
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression de la transaction", error.response?.data || error);
      setNotification({ open: true, message: error.response?.data?.message || "Erreur lors de la suppression.", severity: "error" });
      setIsConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleEdit = (transaction) => {
    handleOpenForm(transaction);
  };


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


      <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <Button variant="contained" color="primary" onClick={() => handleOpenForm()}>
          <AddIcon sx={{ mr: 1 }}/> Créer une Transaction
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="transactions table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Description</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }} align="right">Montant</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
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
                  <TableCell>
                    <IconButton
                      aria-label="plus d'actions"
                      aria-controls={menuOpen ? 'transaction-actions-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={menuOpen ? 'true' : undefined}
                      onClick={(event) => handleMenuOpen(event, transaction)}
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
                  {transactions.length > 0 ? "Aucune transaction ne correspond aux filtres." : "Aucune transaction disponible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        id="transaction-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedTransactionForMenu && (
          <>
            <MenuItem onClick={() => {
              handleEdit(selectedTransactionForMenu);
              handleMenuClose();
            }}>
              Modifier
            </MenuItem>
            <MenuItem onClick={() => {
              handleConfirmDelete(selectedTransactionForMenu);
              handleMenuClose();
            }}>
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>


      <Dialog open={isFormOpen} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: blue[700], color: "#fff" }}>
          {transactionToEdit ? "Modifier la Transaction" : "Créer une Nouvelle Transaction"}
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal" variant="outlined" required>
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                label="Type"
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value="">
                  <em>Sélectionner le type</em>
                </MenuItem>
                {typeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Description"
              fullWidth
              margin="normal"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <TextField
              label="Montant"
              type="number"
              fullWidth
              margin="normal"
              variant="outlined"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              inputProps={{ step: "0.01" }}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(newValue) => setDate(newValue)}
                // MODIFICATION: Utiliser renderInput comme fonction pour la compatibilité avec les anciennes versions de MUI X
                renderInput={(params) => <TextField {...params} fullWidth margin="normal" variant="outlined" required />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {transactionToEdit ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <DialogTitle sx={{ backgroundColor: red[700], color: "#fff" }}>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer cette transaction ?
            {/* Vous pouvez ajouter le champ description si vous le souhaitez ici: */}
            {/* "{transactionToDelete?.TRNS_description}" */}
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

export default Transactions;
import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  Table,          // Added for table display
  TableContainer, // Added for table display
  TableHead,      // Added for table display
  TableRow,       // Added for table display
  TableCell,      // Added for table display
  TableBody,      // Added for table display
  Tooltip,        // Added for tooltips on truncated text
  IconButton      // Added for icon buttons within table cells
} from '@mui/material';
import Swal from 'sweetalert2';
import api from '../../api/api';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';     // Added for edit icon
import DeleteIcon from '@mui/icons-material/Delete'; // Added for delete icon
import PrintIcon from '@mui/icons-material/Print';   // Added for print icon

// Liste des marques d'équipements informatiques courantes
const IT_BRANDS = [
  'HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Samsung', 'LG',
  'Microsoft', 'Intel', 'AMD', 'Nvidia', 'Logitech', 'Razer', 'Corsair',
  'Kingston', 'Seagate', 'Western Digital', 'TP-Link', 'Netgear', 'Cisco',
  'Canon', 'Epson', 'Brother', 'Xerox', 'D-Link', 'Ubiquiti', 'Fortinet',
  'Check Point', 'Palo Alto Networks', 'Juniper', 'Synology', 'QNAP',
  'APC', 'Eaton', 'Schneider Electric', 'IBM', 'Oracle', 'VMware',
  'Hikvision', 'Dahua', 'Bosch', 'Axis', 'CyberPower'
];

const GestionEquipements = () => {
  const [equipments, setEquipments] = useState([]);
  const [typesEquipements, setTypesEquipements] = useState([]);
  const [typesPannes, setTypesPannes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const [form, setForm] = useState({
    EQPT_code: '',
    EQPT_CLNT_code: '',
    EQPT_CLNT_adresse: '',
    EQPT_marque: '', // This will now be selected from a dropdown
    EQPT_libelle: '',
    EQPT_num_serie: '',
    EQPT_type: '',
    EQPT_premiere_date_installation: '',
    EQPT_derniere_date_Maintenance: '',
    EQPT_date_debut_validite: '',
    EQPT_date_fin_validite: '',
    EQPT_types_pannes: [],
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterClientCode, setFilterClientCode] = useState('');
  const [filterMarque, setFilterMarque] = useState(''); // New filter state for brand
  const [filterInstallationStartDate, setFilterInstallationStartDate] = useState('');
  const [filterInstallationEndDate, setFilterInstallationEndDate] = useState('');


  useEffect(() => {
    fetchInitialData();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        "http://localhost:5000/api/clients/",
        config
      );
      setClients(Array.isArray(response.data.clients) ? response.data.clients : []);
      setNotification(prev => ({ ...prev, open: false }));
    } catch (error) {
      console.error("Erreur lors de la récupération des clients", error.response?.data || error);
      setNotification({
        open: true,
        message: error.response?.data?.message || "Échec du chargement des clients.",
        severity: "error",
      });
      setClients([]);
    } finally {
      setLoading(false);
    }
  };


  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [equipmentsRes, typesEquipementsRes, typesPannesRes] = await Promise.all([
        api.get('/equipments/'),
        api.get('/type-equipments/'),
        api.get('/types-pannes/'),
      ]);
      setEquipments(equipmentsRes.data);
      setTypesEquipements(typesEquipementsRes.data);
      setTypesPannes(typesPannesRes.data);
    } catch (error) {
      console.error("Erreur lors du chargement des données initiales", error);
      Swal.fire('Erreur', 'Erreur lors du chargement des données.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/equipments/');
      setEquipments(res.data);
    } catch (error) {
      console.error("Erreur lors du chargement des équipements", error);
      Swal.fire('Erreur', 'Erreur lors du chargement des équipements.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newState = { ...prev, [name]: value };

      if (name === 'EQPT_CLNT_code') {
        newState.EQPT_CLNT_adresse = '';
      }
      return newState;
    });
  };


  const handleMultiSelectChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: typeof value === 'string' ? value.split(',') : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.EQPT_CLNT_code || !form.EQPT_marque || !form.EQPT_libelle || !form.EQPT_num_serie || !form.EQPT_type || !form.EQPT_CLNT_adresse) {
      Swal.fire('Attention', 'Veuillez remplir tous les champs obligatoires (Code Client, Adresse Client, Marque, Libellé, Numéro de Série, Type d\'équipement).', 'warning');
      return;
    }

    try {
      if (form._id) {
        const updateData = { ...form };
        if (updateData.EQPT_premiere_date_installation === '') delete updateData.EQPT_premiere_date_installation;
        if (updateData.EQPT_derniere_date_Maintenance === '') delete updateData.EQPT_derniere_date_Maintenance;
        if (updateData.EQPT_date_debut_validite === '') delete updateData.EQPT_date_debut_validite;
        if (updateData.EQPT_date_fin_validite === '') delete updateData.EQPT_date_fin_validite;

        await api.put(`/equipments/${form._id}`, updateData);
        Swal.fire('Succès', 'Équipement modifié avec succès!', 'success');
      } else {
        await api.post('/equipments/', form);
        Swal.fire('Succès', 'Équipement ajouté avec succès!', 'success');
      }
      fetchEquipments();
      resetForm();
    } catch (error) {
      console.error("Erreur lors de l'ajout/modification de l'équipement", error.response?.data || error.message);
      Swal.fire('Erreur', `Erreur lors de l\'ajout/modification de l\'équipement: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/equipments/${id}`);
        Swal.fire('Supprimé', 'Équipement supprimé avec succès.', 'success');
        fetchEquipments();
      } catch (error) {
        console.error("Erreur lors de la suppression", error.response?.data || error.message);
        Swal.fire('Erreur', `Erreur lors de la suppression: ${error.response?.data?.message || error.message}`, 'error');
      }
    }
  };

  const handleEdit = (equipment) => {
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setForm({
      ...equipment,
      EQPT_type: equipment.EQPT_type?._id || equipment.EQPT_type || '',
      EQPT_types_pannes: (equipment.EQPT_types_pannes || []).map((p) => p._id || p),
      EQPT_premiere_date_installation: formatDateForInput(equipment.EQPT_premiere_date_installation),
      EQPT_derniere_date_Maintenance: formatDateForInput(equipment.EQPT_derniere_date_Maintenance),
      EQPT_date_debut_validite: formatDateForInput(equipment.EQPT_date_debut_validite),
      EQPT_date_fin_validite: formatDateForInput(equipment.EQPT_date_fin_validite),
    });
    Swal.fire('Info', `Équipement ${equipment.EQPT_libelle || equipment.EQPT_code || ''} chargé pour modification.`, 'info');
  };

  const resetForm = () => {
    setForm({
      EQPT_code: '',
      EQPT_CLNT_code: '',
      EQPT_CLNT_adresse: '',
      EQPT_marque: '',
      EQPT_libelle: '',
      EQPT_num_serie: '',
      EQPT_type: '',
      EQPT_premiere_date_installation: '',
      EQPT_derniere_date_Maintenance: '',
      EQPT_date_debut_validite: '',
      EQPT_date_fin_validite: '',
      EQPT_types_pannes: [],
    });
  };

  // Helper to get client raison sociale
  const getClientRaisonSociale = (clientCode) => {
    const client = clients.find(c => c.CLNT_code === clientCode);
    return client ? client.CLNT_raison_sociale : 'N/A';
  };

  // Function to clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterClientCode('');
    setFilterMarque(''); // Clear new brand filter
    setFilterInstallationStartDate('');
    setFilterInstallationEndDate('');
  };

  const filteredEquipments = useMemo(() => {
    let currentFilteredEquipments = equipments;

    // Filter by general search query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      currentFilteredEquipments = currentFilteredEquipments.filter((equipment) => {
        const clientRaisonSociale = getClientRaisonSociale(equipment.EQPT_CLNT_code).toLowerCase();
        return (
          (equipment.EQPT_code || '').toLowerCase().includes(lowerCaseQuery) ||
          (equipment.EQPT_libelle || '').toLowerCase().includes(lowerCaseQuery) ||
          (equipment.EQPT_num_serie || '').toLowerCase().includes(lowerCaseQuery) ||
          (equipment.EQPT_marque || '').toLowerCase().includes(lowerCaseQuery) ||
          (equipment.EQPT_CLNT_code || '').toLowerCase().includes(lowerCaseQuery) ||
          (equipment.EQPT_CLNT_adresse || '').toLowerCase().includes(lowerCaseQuery) ||
          clientRaisonSociale.includes(lowerCaseQuery)
        );
      });
    }

    // Filter by equipment type
    if (filterType) {
      currentFilteredEquipments = currentFilteredEquipments.filter(
        (equipment) => equipment.EQPT_type && (equipment.EQPT_type._id === filterType || equipment.EQPT_type === filterType)
      );
    }

    // Filter by client code
    if (filterClientCode) {
      currentFilteredEquipments = currentFilteredEquipments.filter(
        (equipment) => equipment.EQPT_CLNT_code === filterClientCode
      );
    }

    // Filter by brand (new filter)
    if (filterMarque) {
      currentFilteredEquipments = currentFilteredEquipments.filter(
        (equipment) => (equipment.EQPT_marque || '').toLowerCase() === filterMarque.toLowerCase()
      );
    }


    // Filter by installation date range
    if (filterInstallationStartDate) {
      const startDate = new Date(filterInstallationStartDate);
      currentFilteredEquipments = currentFilteredEquipments.filter(
        (equipment) => {
          if (!equipment.EQPT_premiere_date_installation) return false;
          const equipmentDate = new Date(equipment.EQPT_premiere_date_installation);
          return equipmentDate >= startDate;
        }
      );
    }
    if (filterInstallationEndDate) {
      const endDate = new Date(filterInstallationEndDate);
      currentFilteredEquipments = currentFilteredEquipments.filter(
        (equipment) => {
          if (!equipment.EQPT_premiere_date_installation) return false;
          const equipmentDate = new Date(equipment.EQPT_premiere_date_installation);
          // Set time to end of day to include whole day
          endDate.setHours(23, 59, 59, 999);
          return equipmentDate <= endDate;
        }
      );
    }

    return currentFilteredEquipments;
  }, [equipments, searchQuery, filterType, filterClientCode, filterMarque, filterInstallationStartDate, filterInstallationEndDate, clients]);

  const getTypeEquipementLibelle = (typeId) => {
    const type = typesEquipements.find(t => t._id === typeId);
    return type ? type.TPEQ_libelle : 'Inconnu';
  };

  const getPanneLibelles = (panneIds) => {
    if (!panneIds || panneIds.length === 0) return 'Aucune panne spécifiée';
    return panneIds.map(panneId => {
      const panne = typesPannes.find(p => p._id === panneId);
      return panne ? panne.PANN_libelle : 'Inconnu';
    }).join(', ');
  };

   const formatDateForDisplay = (dateString) => {
       if (!dateString) return 'N/A';
       const date = new Date(dateString);
       return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : dateString;
   };

   const uniqueClientCodes = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    const codes = new Set(clients.map(client => client.CLNT_code));
    return Array.from(codes);
   }, [clients]);

   const addressesForSelectedClient = useMemo(() => {
    const selectedClientCode = form.EQPT_CLNT_code;
    if (!selectedClientCode || !Array.isArray(clients)) return [];

    const clientsWithCode = clients.filter(client => client.CLNT_code === selectedClientCode);

    const allAddresses = new Set();
    clientsWithCode.forEach(client => {
      if (Array.isArray(client.CLNT_addresses)) {
        client.CLNT_addresses.forEach(addrObj => {
          if (addrObj && addrObj.address) {
            allAddresses.add(addrObj.address);
          }
        });
      }
    });
    return Array.from(allAddresses);
   }, [clients, form.EQPT_CLNT_code]);

   const handlePrintLabel = (equipment) => {
       const clientRaisonSociale = getClientRaisonSociale(equipment.EQPT_CLNT_code); // Get raison_sociale for the label

       const printWindow = window.open('', '_blank');
       printWindow.document.write(`
           <html>
           <head>
               <title>Étiquette Équipement</title>
               <style>
                   body { font-family: Arial, sans-serif; margin: 20px; }
                   .label-container {
                       border: 1px solid #ccc;
                       padding: 20px;
                       width: 300px; /* Adjust as needed for label size */
                       box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
                   }
                   h3 { margin-top: 0; }
                   p { margin-bottom: 5px; }
                   .field-name { font-weight: bold; }
               </style>
           </head>
           <body>
               <div class="label-container">
                   <h3>Détails de l'Équipement</h3>
                   <p><span class="field-name">Libellé:</span> ${equipment.EQPT_libelle || 'N/A'}</p>
                   <p><span class="field-name">Code:</span> ${equipment.EQPT_code || 'N/A'}</p>
                   <p><span class="field-name">Marque:</span> ${equipment.EQPT_marque || 'N/A'}</p>
                   <p><span class="field-name">Numéro de Série:</span> ${equipment.EQPT_num_serie || 'N/A'}</p>
                   <p><span class="field-name">Code Client:</span> ${equipment.EQPT_CLNT_code || 'N/A'}</p>
                   <p><span class="field-name">Raison Sociale Client:</span> ${clientRaisonSociale}</p>
                   <p><span class="field-name">Adresse Client:</span> ${equipment.EQPT_CLNT_adresse || 'N/A'}</p>
                   <p><span class="field-name">Type:</span> ${getTypeEquipementLibelle(equipment.EQPT_type?._id || equipment.EQPT_type) || 'N/A'}</p>
                   <p><span class="field-name">Date d'Installation:</span> ${formatDateForDisplay(equipment.EQPT_premiere_date_installation)}</p>
                   <p><span class="field-name">Dernière Maintenance:</span> ${formatDateForDisplay(equipment.EQPT_derniere_date_Maintenance)}</p>
                   <p><span class="field-name">Validité du:</span> ${formatDateForDisplay(equipment.EQPT_date_debut_validite)}</p>
                   <p><span class="field-name">Validité au:</span> ${formatDateForDisplay(equipment.EQPT_date_fin_validite)}</p>
               </div>
               <script>
                   window.onload = function() {
                       window.print();
                       window.onafterprint = function() {
                           window.close();
                       };
                   };
               </script>
           </body>
           </html>
       `);
       printWindow.document.close();
   };


  return (
    <Box sx={{ p: 3 }}>
        {notification.open && (
            <Alert severity={notification.severity} onClose={() => setNotification(prev => ({ ...prev, open: false }))} sx={{ mb: 2 }}>
                {notification.message}
            </Alert>
        )}

      <Typography variant="h4" component="h2" gutterBottom>
        Gestion des Équipements
      </Typography>

      <Box component={Paper} elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {form._id ? 'Modifier l\'Équipement' : 'Ajouter un Nouvel Équipement'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined" size="small">
                <InputLabel>Code Client</InputLabel>
                <Select
                  name="EQPT_CLNT_code"
                  value={form.EQPT_CLNT_code}
                  onChange={handleChange}
                  label="Code Client"
                >
                  <MenuItem value=""><em>Sélectionnez un code client</em></MenuItem>
                  {uniqueClientCodes.map((code) => (
                    <MenuItem key={code} value={code}>
                      {code} - {getClientRaisonSociale(code)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined" size="small">
                <InputLabel>Adresse Client</InputLabel>
                <Select
                  name="EQPT_CLNT_adresse"
                  value={form.EQPT_CLNT_adresse}
                  onChange={handleChange}
                  label="Adresse Client"
                  disabled={!form.EQPT_CLNT_code || addressesForSelectedClient.length === 0}
                >
                   <MenuItem value=""><em>Sélectionnez une adresse</em></MenuItem>
                   {addressesForSelectedClient.map((address, index) => (
                      <MenuItem key={index} value={address}>
                         {address}
                      </MenuItem>
                   ))}
                </Select>
              </FormControl>
            </Grid>
            {/* START OF MODIFICATION: Brand field as a dropdown */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined" size="small">
                <InputLabel>Marque</InputLabel>
                <Select
                  name="EQPT_marque"
                  value={form.EQPT_marque}
                  onChange={handleChange}
                  label="Marque"
                >
                  <MenuItem value=""><em>Sélectionnez une marque</em></MenuItem>
                  {IT_BRANDS.map((brand) => (
                    <MenuItem key={brand} value={brand}>
                      {brand}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* END OF MODIFICATION */}
            <Grid item xs={12} sm={6}>
              <TextField label="Libellé" name="EQPT_libelle" value={form.EQPT_libelle} onChange={handleChange} fullWidth required variant="outlined" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Numéro de Série" name="EQPT_num_serie" value={form.EQPT_num_serie} onChange={handleChange} fullWidth required variant="outlined" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Première Date d'Installation"
                name="EQPT_premiere_date_installation"
                value={form.EQPT_premiere_date_installation}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                variant="outlined" size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Dernière Date de Maintenance"
                name="EQPT_derniere_date_Maintenance"
                value={form.EQPT_derniere_date_Maintenance}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                variant="outlined" size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Date Début Validité"
                name="EQPT_date_debut_validite"
                value={form.EQPT_date_debut_validite}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                variant="outlined" size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Date Fin Validité"
                name="EQPT_date_fin_validite"
                value={form.EQPT_date_fin_validite}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                variant="outlined" size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required variant="outlined" size="small">
                <InputLabel>Type d'Équipement</InputLabel>
                <Select
                  name="EQPT_type"
                  value={form.EQPT_type}
                  onChange={handleChange}
                  label="Type d'Équipement"
                >
                  <MenuItem value=""><em>Sélectionnez un type</em></MenuItem>
                  {typesEquipements.map((type) => (
                    <MenuItem key={type._id} value={type._id}>
                      {type.TPEQ_libelle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>



            <Grid item xs={12}>
              <Button variant="contained" color="primary" type="submit" sx={{ mr: 1 }}>
                {form._id ? 'Modifier l\'Équipement' : 'Ajouter un Équipement'}
              </Button>
              {form._id && (
                <Button variant="outlined" color="secondary" onClick={resetForm}>
                  Annuler Modification
                </Button>
              )}
              {!form._id && (
                  <Button variant="outlined" onClick={resetForm}>
                      Réinitialiser
                  </Button>
              )}
            </Grid>
          </Grid>
        </form>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Liste des Équipements</Typography>

        <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
          <TextField
            variant="outlined"
            label="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', sm: 200 } }}
          />
          <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
            <InputLabel>Filtrer par Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Filtrer par Type"
            >
              <MenuItem value="">Tous les types</MenuItem>
              {typesEquipements.map((type) => (
                <MenuItem key={type._id} value={type._id}>
                  {type.TPEQ_libelle}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
            <InputLabel>Filtrer par Code Client</InputLabel>
            <Select
              value={filterClientCode}
              onChange={(e) => setFilterClientCode(e.target.value)}
              label="Filtrer par Code Client"
            >
              <MenuItem value="">Tous les clients</MenuItem>
              {uniqueClientCodes.map((code) => (
                <MenuItem key={code} value={code}>
                  {code} ({getClientRaisonSociale(code)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* START OF MODIFICATION: New filter for Brand */}
          <FormControl variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 200 } }}>
            <InputLabel>Filtrer par Marque</InputLabel>
            <Select
              value={filterMarque}
              onChange={(e) => setFilterMarque(e.target.value)}
              label="Filtrer par Marque"
            >
              <MenuItem value="">Toutes les marques</MenuItem>
              {IT_BRANDS.map((brand) => (
                <MenuItem key={brand} value={brand}>
                  {brand}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* END OF MODIFICATION */}
          <TextField
            type="date"
            label="Installé après le"
            value={filterInstallationStartDate}
            onChange={(e) => setFilterInstallationStartDate(e.target.value)}
            fullWidth={false}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            size="small"
            sx={{ width: { xs: '100%', sm: 180 } }}
          />
          <TextField
            type="date"
            label="Installé avant le"
            value={filterInstallationEndDate}
            onChange={(e) => setFilterInstallationEndDate(e.target.value)}
            fullWidth={false}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            size="small"
            sx={{ width: { xs: '100%', sm: 180 } }}
          />
          <Button
            variant="outlined"
            onClick={clearFilters}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Réinitialiser Filtres
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" mt={5}>
            <CircularProgress />
          </Box>
        ) : filteredEquipments.length === 0 ? (
            <Typography variant="body1" color="textSecondary" align="center" mt={4}>
                Aucun équipement trouvé.
            </Typography>
        ) : (
            <TableContainer component={Paper} elevation={2}>
              <Table sx={{ minWidth: 650 }} aria-label="liste des équipements">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Libellé</TableCell>
                    <TableCell>Marque</TableCell>
                    <TableCell>N° Série</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Client (Code / Raison Sociale)</TableCell>
                    <TableCell>Adresse Client</TableCell>
                    <TableCell>Date Installation</TableCell>
                    <TableCell>Dernière Maintenance</TableCell>
                    <TableCell>Validité</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEquipments.map((equipment) => (
                    <TableRow
                      key={equipment._id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {equipment.EQPT_code || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={equipment.EQPT_libelle || 'N/A'}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                            {equipment.EQPT_libelle || 'N/A'}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{equipment.EQPT_marque || 'N/A'}</TableCell>
                      <TableCell>{equipment.EQPT_num_serie || 'N/A'}</TableCell>
                      <TableCell>{getTypeEquipementLibelle(equipment.EQPT_type?._id || equipment.EQPT_type) || 'N/A'}</TableCell>
                      <TableCell>
                        {equipment.EQPT_CLNT_code || 'N/A'} / {getClientRaisonSociale(equipment.EQPT_CLNT_code)}
                      </TableCell>
                      <TableCell>
                         <Tooltip title={equipment.EQPT_CLNT_adresse || 'N/A'}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                               {equipment.EQPT_CLNT_adresse || 'N/A'}
                            </Typography>
                         </Tooltip>
                      </TableCell>
                      <TableCell>{formatDateForDisplay(equipment.EQPT_premiere_date_installation)}</TableCell>
                      <TableCell>{formatDateForDisplay(equipment.EQPT_derniere_date_Maintenance)}</TableCell>
                      <TableCell>
                        {formatDateForDisplay(equipment.EQPT_date_debut_validite)} au {formatDateForDisplay(equipment.EQPT_date_fin_validite)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(equipment)}
                          aria-label="modifier"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(equipment._id)}
                          aria-label="supprimer"
                        >
                          <DeleteIcon />
                        </IconButton>
                        <IconButton
                          color="success"
                          onClick={() => handlePrintLabel(equipment)}
                          aria-label="imprimer étiquette"
                        >
                          <PrintIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default GestionEquipements;
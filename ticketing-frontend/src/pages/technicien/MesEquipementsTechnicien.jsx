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
  CircularProgress,
  Paper,          // Added for TableContainer
  Table,          // Added for table display
  TableContainer, // Added for table display
  TableHead,      // Added for table display
  TableRow,       // Added for table display
  TableCell,      // Added for table display
  TableBody,      // Added for table display
  Tooltip,        // Added for tooltips on truncated text
  IconButton      // Added for icon buttons within table cells
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LabelIcon from '@mui/icons-material/Label';
import BuildIcon from '@mui/icons-material/Build';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PrintIcon from '@mui/icons-material/Print'; // Added for print icon
import Swal from 'sweetalert2';
import api from '../../api/api';

// Helper function to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return 'Date invalide';
    }
};

// New helper function for formatting date for display in label
const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : dateString;
};


const MesEquipementsTechnicien = () => {
    const [typesEquipements, setTypesEquipements] = useState([]);
    const [typesPannes, setTypesPannes] = useState([]);
    const [technicianId, setTechnicianId] = useState('');
    const [equipments, setEquipments] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for filters
    const [filterState, setFilterState] = useState({
        searchText: '',
        type: '',
        validity: '',
        failureType: '',
    });

    const fetchTechnicianInfo = async () => {
      try {
        const res = await api.get('/techniciens/me');
        const technician = res.data;
        setTechnicianId(technician._id);
      } catch (error) {
        console.error('Erreur lors de la récupération du technicien :', error);
        Swal.fire('Erreur', 'Impossible de récupérer les informations du technicien.', 'error');
         setLoading(false);
      }
    };

    const fetchEquipmentsByTechnician = async (technicianId) => {
      try {
        const res = await api.get(`/equipments/technicien/assigned/${technicianId}`);
        setEquipments(res.data);
      } catch (error) {
        console.error('Erreur récupération équipements technicien :', error);
        Swal.fire('Erreur', 'Impossible de récupérer les équipements assignés.', 'error');
      } finally {
         setLoading(false);
      }
    };

    const fetchTypesEquipements = async () => {
      try {
        const res = await api.get('/type-equipments/');
        setTypesEquipements(res.data);
      } catch (error) {
        console.error('Erreur lors du chargement des types d\'équipements', error);
        Swal.fire('Erreur', 'Erreur lors du chargement des types d\'équipements', 'error');
      }
    };

    const fetchTypesPannes = async () => {
      try {
        const res = await api.get('/types-pannes/');
        setTypesPannes(res.data);
      } catch (error) {
         console.error('Erreur lors du chargement des types de pannes', error);
        Swal.fire('Erreur', 'Erreur lors du chargement des types de pannes', 'error');
      }
    };

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        await fetchTypesEquipements();
        await fetchTypesPannes();
        await fetchTechnicianInfo();
      };
      fetchData();
    }, []);

    useEffect(() => {
        if (technicianId) {
            fetchEquipmentsByTechnician(technicianId);
        } else {
           if(!loading) setEquipments([]);
        }
    }, [technicianId, loading]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterState(prev => ({ ...prev, [name]: value }));
    };

    // New function to get equipment type label
    const getTypeEquipementLibelle = (typeId) => {
        const type = typesEquipements.find(t => t._id === typeId);
        return type ? type.TPEQ_libelle : 'Inconnu';
    };

    const filteredEquipments = useMemo(() => {
        if (!Array.isArray(equipments)) return [];

        return equipments.filter(equipment => {
            const { searchText, type, validity, failureType } = filterState;

            const searchMatch = searchText === '' ||
                (equipment.EQPT_libelle || '').toLowerCase().includes(searchText.toLowerCase()) ||
                (equipment.EQPT_num_serie || '').toLowerCase().includes(searchText.toLowerCase()) ||
                (equipment.EQPT_marque || '').toLowerCase().includes(searchText.toLowerCase()) ||
                (equipment.EQPT_CLNT_adresse || '').toLowerCase().includes(searchText.toLowerCase()) ||
                (equipment.client?.CLNT_raison_sociale || '').toLowerCase().includes(searchText.toLowerCase());

            const typeMatch = type === '' || equipment.EQPT_type?._id === type;

            const validityMatch = validity === '' || (() => {
                if (!equipment.EQPT_date_fin_validite) return validity === 'valid';
                const endDate = new Date(equipment.EQPT_date_fin_validite);
                const now = new Date();
                now.setHours(0,0,0,0);
                endDate.setHours(0,0,0,0);

                const sevenDaysFromNow = new Date();
                sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                 sevenDaysFromNow.setHours(0,0,0,0);

                if (validity === 'expired') {
                    return endDate < now;
                }
                if (validity === 'expires_soon') {
                    return endDate >= now && endDate <= sevenDaysFromNow;
                }
                if (validity === 'valid') {
                    return endDate > sevenDaysFromNow;
                }
                 return true;
            })();

            const failureTypeMatch = failureType === '' ||
                (Array.isArray(equipment.EQPT_types_pannes) && equipment.EQPT_types_pannes.some(panne => panne._id === failureType));


            return searchMatch && typeMatch && validityMatch && failureTypeMatch;
        });
    }, [equipments, filterState]);

    // Printing logic similar to MesEquipements.jsx and GestionEquipements.jsx
    const handlePrintLabel = (equipment) => {
        const clientRaisonSociale = equipment.client?.CLNT_raison_sociale || 'N/A';
        const clientCode = equipment.EQPT_CLNT_code || 'N/A';


        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Étiquette Équipement</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    .label-container {
                        width: 8cm;
                        height: 5cm;
                        overflow: hidden;
                        border: 1px solid #ccc;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        padding: 5mm;
                        font-size: 9px;
                    }
                    h3 { margin-top: 0; margin-bottom: 5px; font-size: 11px; text-align: center; }
                    p { margin: 1px 0; line-height: 1.2; }
                    .field-name { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="label-container">
                    <h3>${equipment.EQPT_libelle || 'Détails de l\'Équipement'}</h3>
                    <p><span class="field-name">Code:</span> ${equipment.EQPT_code || 'N/A'}</p>
                    <p><span class="field-name">Marque:</span> ${equipment.EQPT_marque || 'N/A'}</p>
                    <p><span class="field-name">N° Série:</span> ${equipment.EQPT_num_serie || 'N/A'}</p>
                    <p><span class="field-name">Type:</span> ${getTypeEquipementLibelle(equipment.EQPT_type?._id || equipment.EQPT_type)}</p>
                    <p><span class="field-name">Client:</span> ${clientRaisonSociale} (${clientCode})</p>
                    <p><span class="field-name">Adresse:</span> ${equipment.EQPT_CLNT_adresse || 'N/A'}</p>
                    <p><span class="field-name">Installation:</span> ${formatDateForDisplay(equipment.EQPT_premiere_date_installation)}</p>
                    <p><span class="field-name">Maintenance:</span> ${formatDateForDisplay(equipment.EQPT_derniere_date_Maintenance)}</p>
                    <p><span class="field-name">Validité:</span> ${formatDateForDisplay(equipment.EQPT_date_debut_validite)} au ${formatDateForDisplay(equipment.EQPT_date_fin_validite)}</p>
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
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Mes Équipements</Typography>

            {/* --- Filtering Section --- */}
            {!loading && (equipments.length > 0 || typesEquipements.length > 0 || typesPannes.length > 0) && (
                 <Box mb={4} p={2} border={1} borderRadius={2} borderColor="grey.300">
                    <Typography variant="h6" gutterBottom>Filtrer les équipements</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                label="Rechercher"
                                fullWidth
                                value={filterState.searchText}
                                onChange={handleFilterChange}
                                name="searchText"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Type d'équipement</InputLabel>
                                <Select
                                    value={filterState.type}
                                    onChange={handleFilterChange}
                                    name="type"
                                    label="Type d'équipement"
                                >
                                    <MenuItem value="">Tous les types</MenuItem>
                                    {Array.isArray(typesEquipements) && typesEquipements.map((type) => (
                                        <MenuItem key={type._id} value={type._id}>
                                            {type.TPEQ_libelle}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                         <Grid item xs={12} sm={6} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Validité</InputLabel>
                                <Select
                                    value={filterState.validity}
                                    onChange={handleFilterChange}
                                    name="validity"
                                    label="Validité"
                                >
                                    <MenuItem value="">Toutes les validités</MenuItem>
                                    <MenuItem value="valid">Valide</MenuItem>
                                    <MenuItem value="expires_soon">Expire bientôt dans ( 7 jours)</MenuItem>
                                    <MenuItem value="expired">Expiré</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                         {Array.isArray(typesPannes) && typesPannes.length > 0 && (
                            <Grid item xs={12} sm={6} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Type de panne potentiel</InputLabel>
                                    <Select
                                        value={filterState.failureType || ''}
                                        onChange={handleFilterChange}
                                        name="failureType"
                                        label="Type de panne potentiel"
                                    >
                                        <MenuItem value="">Tous les types de panne</MenuItem>
                                        {typesPannes.map((panne) => (
                                            <MenuItem key={panne._id} value={panne._id}>
                                                {panne.PANN_libelle}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                             </Grid>
                         )}
                    </Grid>
                </Box>
            )}


            {/* --- Equipment List Section (Table Display) --- */}
            <Typography variant="h6" gutterBottom>Liste des Équipements Assignés</Typography>

            {loading ? (
                 <Box display="flex" justifyContent="center" mt={4}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ ml: 2 }}>Chargement des équipements...</Typography>
                 </Box>
            ) : filteredEquipments.length > 0 ? (
                <TableContainer component={Paper} elevation={2}>
                    <Table sx={{ minWidth: 850 }} aria-label="liste des équipements assignés au technicien">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell>Libellé</TableCell>
                                <TableCell>N° Série</TableCell>
                                <TableCell>Marque</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Client</TableCell>
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
                                    <TableCell>
                                        <Tooltip title={equipment.EQPT_libelle || 'N/A'}>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                                                {equipment.EQPT_libelle || 'N/A'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>{equipment.EQPT_num_serie || 'N/A'}</TableCell>
                                    <TableCell>{equipment.EQPT_marque || 'N/A'}</TableCell>
                                    <TableCell>{getTypeEquipementLibelle(equipment.EQPT_type?._id || equipment.EQPT_type) || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Tooltip title={equipment.client?.CLNT_raison_sociale || 'N/A'}>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                                                {equipment.client?.CLNT_raison_sociale || 'N/A'}
                                            </Typography>
                                        </Tooltip>
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
            ) : (
                <Box mt={4} textAlign="center">
                    <Typography variant="h6" color="textSecondary">
                         {loading ? "Chargement..." : (equipments.length === 0 && Object.values(filterState).every(f => f === '') ? "Aucun équipement assigné." : "Aucun équipement trouvé avec les filtres actuels.")}
                    </Typography>
                    {!loading && equipments.length > 0 && filteredEquipments.length === 0 && (
                         <Typography variant="body2" color="textSecondary">
                            (Total équipements assignés : {equipments.length})
                         </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default MesEquipementsTechnicien;
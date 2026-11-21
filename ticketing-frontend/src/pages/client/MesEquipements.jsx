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
import PrintIcon from '@mui/icons-material/Print'; // Added for print icon

const MesEquipements = () => {
  const [typesEquipements, setTypesEquipements] = useState([]);
  const [clientCode, setClientCode] = useState('');
  const [clientRaisonSociale, setClientRaisonSociale] = useState('');
  const [equipments, setEquipments] = useState([]);

  // --- New states for filtering ---
  const [searchTerm, setSearchTerm] = useState('');
  const [typeEquipmentFilter, setTypeEquipmentFilter] = useState('');

  useEffect(() => {
    fetchClientInfo();
    fetchTypesEquipements();
  }, []);

  useEffect(() => {
    if (clientCode) {
      fetchEquipementsByClientCode(clientCode);
    }
  }, [clientCode]);

  const fetchClientInfo = async () => {
    try {
      const res = await api.get('/clients/me');
      const client = res.data;
      setClientCode(client.CLNT_code);
      setClientRaisonSociale(client.CLNT_raison_sociale);
    } catch (error) {
      console.error('Erreur lors de la récupération du client :', error);
      Swal.fire('Erreur', error?.response?.data?.message || 'Impossible de récupérer le client connecté.', 'error');
    }
  };

  const fetchEquipementsByClientCode = async (clientCode) => {
    try {
      const res = await api.get(`equipments/client/code/${clientCode}`);
      if (Array.isArray(res.data)) {
        setEquipments(res.data);
      } else {
        console.error('Expected array of equipments, but received:', res.data);
        setEquipments([]);
      }
    } catch (error) {
      console.error('Erreur récupération équipements client :', error);
      Swal.fire('Erreur', error?.response?.data?.message || 'Impossible de récupérer les équipements.', 'error');
    }
  };

  const fetchTypesEquipements = async () => {
    try {
      const res = await api.get('/type-equipments/');
      setTypesEquipements(res.data);
    } catch (error) {
      Swal.fire('Erreur', error?.response?.data?.message || 'Erreur lors du chargement des types d\'équipements', 'error');
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTypeEquipmentFilterChange = (event) => {
    setTypeEquipmentFilter(event.target.value);
  };

  const filteredEquipments = useMemo(() => {
    let filtered = equipments;

    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(equipment =>
        (equipment.EQPT_code && equipment.EQPT_code.toLowerCase().includes(lowercasedSearchTerm)) ||
        (equipment.EQPT_marque && equipment.EQPT_marque.toLowerCase().includes(lowercasedSearchTerm)) ||
        (equipment.EQPT_libelle && equipment.EQPT_libelle.toLowerCase().includes(lowercasedSearchTerm)) ||
        (equipment.EQPT_num_serie && equipment.EQPT_num_serie.toLowerCase().includes(lowercasedSearchTerm)) ||
        (equipment.EQPT_CLNT_adresse && equipment.EQPT_CLNT_adresse.toLowerCase().includes(lowercasedSearchTerm)) ||
        (equipment.EQPT_type?.TPEQ_libelle && equipment.EQPT_type.TPEQ_libelle.toLowerCase().includes(lowercasedSearchTerm)) ||
        (equipment.EQPT_types_pannes && equipment.EQPT_types_pannes.some(panne =>
          panne?.PANN_libelle && panne.PANN_libelle.toLowerCase().includes(lowercasedSearchTerm)
        ))
      );
    }

    if (typeEquipmentFilter) {
      filtered = filtered.filter(equipment =>
        equipment.EQPT_type && equipment.EQPT_type._id === typeEquipmentFilter
      );
    }

    return filtered;
  }, [equipments, searchTerm, typeEquipmentFilter]);

  // Nouvelle fonction pour récupérer le libellé du type d'équipement
  const getTypeEquipementLibelle = (typeId) => {
    const type = typesEquipements.find(t => t._id === typeId);
    return type ? type.TPEQ_libelle : 'Inconnu';
  };

  // Nouvelle fonction pour formater les dates
  const formatDateForDisplay = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : dateString;
  };

  // Logique d'impression similaire à GestionEquipements.jsx
  const handlePrintLabel = (equipment) => {
      // Utilisation directe de clientRaisonSociale car tous les équipements ici appartiennent au client connecté
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
          <html>
          <head>
              <title>Étiquette Équipement</title>
              <style>
                  body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                  .label-container {
                      /* Ajustez ces valeurs pour la taille physique de votre étiquette */
                      width: 8cm; /* Largeur de l'étiquette */
                      height: 5cm; /* Hauteur de l'étiquette */
                      overflow: hidden; /* Empêche le contenu de déborder */
                      border: 1px solid #ccc; /* Bordure légère pour visualisation */
                      box-sizing: border-box; /* Inclut padding et border dans la taille */
                      display: flex;
                      flex-direction: column;
                      justify-content: space-between;
                      padding: 5mm; /* Marge interne pour le contenu */
                      font-size: 9px; /* Taille de police par défaut pour l'étiquette */
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
                  <p><span class="field-name">Client:</span> ${clientRaisonSociale} (${equipment.EQPT_CLNT_code || 'N/A'})</p>
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
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>Mes Équipements</Typography>

      <Box mt={2}>
        <Typography variant="h5" gutterBottom>Mes Équipements enregistrés</Typography>

        <Box sx={{ marginBottom: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Rechercher équipement..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 200 }}
          />

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type d'Équipement</InputLabel>
            <Select
              value={typeEquipmentFilter}
              onChange={handleTypeEquipmentFilterChange}
              label="Type d'Équipement"
            >
              <MenuItem value=""><em>Tous les types</em></MenuItem>
              {typesEquipements.map((type) => (
                <MenuItem key={type._id} value={type._id}>
                  {type.TPEQ_libelle}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {filteredEquipments.length > 0 ? (
            <TableContainer component={Paper} elevation={2}>
              <Table sx={{ minWidth: 650 }} aria-label="liste de mes équipements">
                <TableHead>
                 <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Code</TableCell>
                    <TableCell>Libellé</TableCell>
                    <TableCell>Marque</TableCell>
                    <TableCell>N° Série</TableCell>
                    <TableCell>Type</TableCell>
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
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>
            Aucun équipement trouvé.
            {equipments.length > 0 && searchTerm === '' && typeEquipmentFilter === '' && (
              ' (Vérifiez les filtres si vous attendiez des équipements.)'
            )}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default MesEquipements;
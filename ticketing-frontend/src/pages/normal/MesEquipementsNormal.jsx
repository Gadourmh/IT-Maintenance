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
  CircularProgress
} from '@mui/material';
import Swal from 'sweetalert2';
import api from '../../api/api';

const GestionEquipements = () => {
  const [equipments, setEquipments] = useState([]);
  const [typesEquipements, setTypesEquipements] = useState([]);
  const [typesPannes, setTypesPannes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
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

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [equipmentsRes, typesEquipementsRes, typesPannesRes] = await Promise.all([
        api.get('/equipments/'),
        api.get('/type-equipments/'),
        api.get('/types-pannes/')
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

  

  
 



   

  const filteredEquipments = useMemo(() => {
    return equipments.filter((equipment) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const matchesSearch =
        (equipment.EQPT_code || '').toLowerCase().includes(lowerCaseQuery) ||
        (equipment.EQPT_libelle || '').toLowerCase().includes(lowerCaseQuery) ||
        (equipment.EQPT_num_serie || '').toLowerCase().includes(lowerCaseQuery) ||
        (equipment.EQPT_CLNT_code || '').toLowerCase().includes(lowerCaseQuery) ||
        (equipment.EQPT_CLNT_adresse || '').toLowerCase().includes(lowerCaseQuery) ||
        (equipment.EQPT_marque || '').toLowerCase().includes(lowerCaseQuery);

      const matchesType =
        filterType === '' ||
        (equipment.EQPT_type && (equipment.EQPT_type._id === filterType || equipment.EQPT_type === filterType));

      return matchesSearch && matchesType;
    });
  }, [equipments, searchQuery, filterType]);

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

  return (
    <Box sx={{ p: 3 }}>
       
      <Typography variant="h4" component="h2" gutterBottom>
        Gestion des Équipements
      </Typography>

      
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Liste des Équipements</Typography>

        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
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
          <Grid container spacing={3}>
            {filteredEquipments.map((equipment) => (
              <Grid item xs={12} sm={6} md={4} key={equipment._id}>
                <Box component={Paper} elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {equipment.EQPT_libelle || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary"><b>Code:</b> {equipment.EQPT_code || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>Marque:</b> {equipment.EQPT_marque || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>N° Série:</b> {equipment.EQPT_num_serie || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>Client Code:</b> {equipment.EQPT_CLNT_code || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>Client Adresse:</b> {equipment.EQPT_CLNT_adresse || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>Type:</b> {getTypeEquipementLibelle(equipment.EQPT_type?._id || equipment.EQPT_type) || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>Pannes possibles:</b> {getPanneLibelles((equipment.EQPT_types_pannes || []).map(p => p._id || p))}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>Installé le:</b> {formatDateForDisplay(equipment.EQPT_premiere_date_installation)}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>Maintenance le:</b> {formatDateForDisplay(equipment.EQPT_derniere_date_Maintenance)}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>Validité du:</b> {formatDateForDisplay(equipment.EQPT_date_debut_validite)}</Typography>
                    <Typography variant="body2" color="textSecondary"><b>Validité au:</b> {formatDateForDisplay(equipment.EQPT_date_fin_validite)}</Typography>
                  </Box>
               
                </Box>
              </Grid>
          ))}
        </Grid>
        )}
      </Box>
    </Box>
  );
};

export default GestionEquipements;
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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material';
import Swal from 'sweetalert2';
import api from '../../api/api';

const MesTickets = () => {
  const [typesPannes, setTypesPannes] = useState([]);
  const [filteredTypesPannes, setFilteredTypesPannes] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [clientId, setClientId] = useState('');
  const [clientCode, setClientCode] = useState('');

  const [form, setForm] = useState({
    TCKT_code: '',
    TCKT_client: '',
    TCKT_equipment: '',
    TCKT_description: '',
    TCKT_type_panne: '',
    TCKT_degre_urgence: 'moyenne',
    TCKT_statut: 'ouvert',
    TCKT_DT_resolution_demandee: '',
  });
  const [mesTickets, setMesTickets] = useState([]);

  // --- États pour le filtrage des tickets ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgenceFilter, setUrgenceFilter] = useState('');
  // NOUVEAUX ÉTATS POUR LES FILTRES DE DATE
  const [prevueResolutionFilter, setPrevueResolutionFilter] = useState('');
  const [confirmeeResolutionFilter, setConfirmeeResolutionFilter] = useState('');

  // --- Chargement initial des infos client et des types de pannes globaux ---
  useEffect(() => {
    fetchClientInfo();
    fetchTypesPannesGlobally();
  }, []);

  // --- Chargement des tickets et équipements du client une fois que clientId et clientCode sont connus ---
  useEffect(() => {
    if (clientId && clientCode) {
      fetchTicketsByClient(clientId);
      fetchEquipmentsByClientCode(clientCode);
    }
  }, [clientId, clientCode]);

  const fetchClientInfo = async () => {
    try {
      const res = await api.get('/clients/me');
      const client = res.data;
      setClientId(client._id);
      setClientCode(client.CLNT_code);
      setForm((prev) => ({ ...prev, TCKT_client: client.CLNT_code }));
    } catch (error) {
      console.error('Erreur lors de la récupération du client :', error);
      Swal.fire('Erreur', error?.response?.data?.message || 'Impossible de récupérer le client connecté.', 'error');
    }
  };

  const fetchTypesPannesGlobally = async () => {
    try {
      const res = await api.get('/types-pannes/');
      setTypesPannes(res.data);
    } catch (error) {
      Swal.fire('Erreur', error?.response?.data?.message || 'Erreur lors du chargement des types de pannes globaux', 'error');
    }
  };

  const fetchEquipmentsByClientCode = async (code) => {
    try {
      const res = await api.get(`equipments/client/code/${code}`);
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

  const fetchTypesPannesByEquipmentTypeCode = async (equipmentTypeCode) => {
    if (!equipmentTypeCode) {
      setFilteredTypesPannes([]);
      return;
    }
    try {
      const res = await api.get(`/types-pannes/by-equipment-code/${equipmentTypeCode}`);
      setFilteredTypesPannes(res.data);
      if (form.TCKT_type_panne && !res.data.some(tp => tp.PANN_code === form.TCKT_type_panne)) {
        setForm(prev => ({ ...prev, TCKT_type_panne: '' }));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des types de pannes pour l'équipement", error);
      Swal.fire('Erreur', 'Erreur lors du chargement des types de pannes pour cet équipement.', 'error');
      setFilteredTypesPannes([]);
    }
  };

  const fetchTicketsByClient = async (id) => {
    try {
      const res = await api.get(`/tickets/client/${id}`);
      if (Array.isArray(res.data)) {
         setMesTickets(res.data);
      } else {
         console.error('Expected array of tickets, but received:', res.data);
         setMesTickets([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tickets du client :', error);
      Swal.fire('Erreur', error?.response?.data?.message || 'Impossible de récupérer vos tickets.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEquipmentChange = (e) => {
    const selectedEquipmentCode = e.target.value;
    setForm(prev => ({ ...prev, TCKT_equipment: selectedEquipmentCode, TCKT_type_panne: '' }));

    const selectedEquipment = equipments.find(eq => eq.EQPT_code === selectedEquipmentCode);

    if (selectedEquipment && selectedEquipment.EQPT_type && selectedEquipment.EQPT_type.TPEQ_code) {
      fetchTypesPannesByEquipmentTypeCode(selectedEquipment.EQPT_type.TPEQ_code);
    } else {
      setFilteredTypesPannes([]);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const ticketData = {
        TCKT_equipment: form.TCKT_equipment,
        TCKT_type_panne: form.TCKT_type_panne,
        TCKT_description: form.TCKT_description,
        TCKT_degre_urgence: form.TCKT_degre_urgence,
        TCKT_statut: form.TCKT_statut,
        TCKT_DT_resolution_demandee: form.TCKT_DT_resolution_demandee || null,
      };

       await api.post('/tickets', {
         clientCode: form.TCKT_client,
         ticket: ticketData,
       });

      Swal.fire('Succès', 'Ticket créé avec succès!', 'success');
      resetForm();
      fetchTicketsByClient(clientId);
    } catch (error) {
      console.error('Erreur lors de la création du ticket :', error);
      Swal.fire('Erreur', error?.response?.data?.message || 'Erreur lors de la création du ticket', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      TCKT_code: '',
      TCKT_client: form.TCKT_client,
      TCKT_equipment: '',
      TCKT_description: '',
      TCKT_type_panne: '',
      TCKT_degre_urgence: 'moyenne',
      TCKT_statut: 'ouvert',
      TCKT_DT_resolution_demandee: '',
    });
    setFilteredTypesPannes([]);
  };

  // --- Handlers pour les changements de filtre ---
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleUrgenceFilterChange = (event) => {
    setUrgenceFilter(event.target.value);
  };

  // NOUVEAUX HANDLERS POUR LES FILTRES DE DATE
  const handlePrevueResolutionFilterChange = (event) => {
    setPrevueResolutionFilter(event.target.value);
  };

  const handleConfirmeeResolutionFilterChange = (event) => {
    setConfirmeeResolutionFilter(event.target.value);
  };

  // --- Logique de filtrage des tickets ---
  const filteredTickets = useMemo(() => {
    let filtered = mesTickets;

    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket =>
        (ticket.TCKT_code && ticket.TCKT_code.toLowerCase().includes(lowercasedSearchTerm)) ||
        (ticket.TCKT_equipment && ticket.TCKT_equipment.toLowerCase().includes(lowercasedSearchTerm)) ||
        (ticket.TCKT_description && ticket.TCKT_description.toLowerCase().includes(lowercasedSearchTerm)) ||
        (ticket.TCKT_types_pannes &&
          (Array.isArray(ticket.TCKT_types_pannes) ?
            ticket.TCKT_types_pannes.some(panne =>
              panne.PANN_libelle && panne.PANN_libelle.toLowerCase().includes(lowercasedSearchTerm)
            ) :
            (ticket.TCKT_types_pannes.PANN_libelle && ticket.TCKT_types_pannes.PANN_libelle.toLowerCase().includes(lowercasedSearchTerm))
          )
        )
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.TCKT_statut === statusFilter);
    }

    if (urgenceFilter) {
      filtered = filtered.filter(ticket => ticket.TCKT_degre_urgence === urgenceFilter);
    }

    // NOUVELLE LOGIQUE DE FILTRAGE POUR LA DATE PRÉVUE DE RÉSOLUTION
    if (prevueResolutionFilter) {
      filtered = filtered.filter(ticket => {
        if (!ticket.TCKT_date_prevue_resolution) return false;
        const ticketDate = new Date(ticket.TCKT_date_prevue_resolution).toISOString().slice(0, 10);
        return ticketDate === prevueResolutionFilter;
      });
    }

    // NOUVELLE LOGIQUE DE FILTRAGE POUR LA DATE DE RÉSOLUTION CONFIRMÉE
    if (confirmeeResolutionFilter) {
      filtered = filtered.filter(ticket => {
        if (!ticket.TCKT_DT_resolution_confirmee) return false;
        const ticketDate = new Date(ticket.TCKT_DT_resolution_confirmee).toISOString().slice(0, 10);
        return ticketDate === confirmeeResolutionFilter;
      });
    }

    return filtered;
  }, [mesTickets, searchTerm, statusFilter, urgenceFilter, prevueResolutionFilter, confirmeeResolutionFilter]);


  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>Gestion de mes Tickets</Typography>

      {/* Section pour la création de ticket */}
      <Paper elevation={2} sx={{ padding: 3, marginBottom: 4 }}>
        <Typography variant="h5" gutterBottom>Créer un nouveau Ticket</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Code Client"
                name="TCKT_client"
                value={form.TCKT_client}
                onChange={handleChange}
                fullWidth
                disabled
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Équipement</InputLabel>
                <Select
                  name="TCKT_equipment"
                  value={form.TCKT_equipment}
                  onChange={handleEquipmentChange}
                  label="Équipement"
                >
                  <MenuItem value=""><em>Sélectionnez un équipement</em></MenuItem>
                  {equipments.map((eq) => (
                    <MenuItem key={eq.EQPT_code} value={eq.EQPT_code}>
                      {eq.EQPT_code} - {eq.EQPT_type?.TPEQ_libelle || eq.EQPT_type} - {eq.EQPT_libelle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                name="TCKT_description"
                value={form.TCKT_description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type de Panne</InputLabel>
                <Select
                  name="TCKT_type_panne"
                  value={form.TCKT_type_panne}
                  onChange={handleChange}
                  label="Type de Panne"
                  disabled={!form.TCKT_equipment || filteredTypesPannes.length === 0}
                >
                   <MenuItem value=""><em>Sélectionnez un type</em></MenuItem>
                  {filteredTypesPannes.map((typePanne) => (
                    <MenuItem key={typePanne.PANN_code} value={typePanne.PANN_code}>
                      {typePanne.PANN_libelle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Degré d'Urgence</InputLabel>
                <Select
                  name="TCKT_degre_urgence"
                  value={form.TCKT_degre_urgence}
                  onChange={handleChange}
                  label="Degré d'Urgence"
                >
                  <MenuItem value="faible">Faible</MenuItem>
                  <MenuItem value="moyenne">Moyenne</MenuItem>
                  <MenuItem value="élevée">Élevée</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Date Résolution Demandée"
                name="TCKT_DT_resolution_demandee"
                value={form.TCKT_DT_resolution_demandee}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" color="secondary" onClick={resetForm}>
                  Réinitialiser
                </Button>
                <Button variant="contained" color="primary" type="submit">
                  Créer un Ticket
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Section de filtrage et liste des tickets */}
      <Box mt={5}>
        <Typography variant="h5" gutterBottom>Mes Tickets enregistrés</Typography>

        <Box sx={{ marginBottom: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Rechercher"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ minWidth: 200 }}
          />

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Statut"
            >
              <MenuItem value=""><em>Tous les statuts</em></MenuItem>
              <MenuItem value="ouvert">Ouvert</MenuItem>
              <MenuItem value="en cours">En Cours</MenuItem>
              <MenuItem value="fermé">Fermé</MenuItem>
              <MenuItem value="résolu">Résolu</MenuItem>
            </Select>
          </FormControl>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Urgence</InputLabel>
            <Select
              value={urgenceFilter}
              onChange={handleUrgenceFilterChange}
              label="Urgence"
            >
              <MenuItem value=""><em>Toutes les urgences</em></MenuItem>
              <MenuItem value="faible">Faible</MenuItem>
              <MenuItem value="moyenne">Moyenne</MenuItem>
              <MenuItem value="élevée">Élevée</MenuItem>
            </Select>
          </FormControl>

          {/* NOUVEAUX FILTRES DE DATE */}
          <TextField
            type="date"
            label="Date Prévue Résol. (Filtre)"
            variant="outlined"
            size="small"
            value={prevueResolutionFilter}
            onChange={handlePrevueResolutionFilterChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />

          <TextField
            type="date"
            label="Date Résol. Confirmée (Filtre)"
            variant="outlined"
            size="small"
            value={confirmeeResolutionFilter}
            onChange={handleConfirmeeResolutionFilterChange}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
        </Box>

        {/* Tableau des tickets */}
        <Paper elevation={2}>
          <Table sx={{ minWidth: 500 }}>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Équipement</TableCell>
                <TableCell>Type Panne</TableCell>
                <TableCell>Urgence</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Demandée pour</TableCell>
                <TableCell>Date Prévue Résol.</TableCell>
                <TableCell>Date Résol. Confirmée</TableCell>
                <TableCell>Date de Création</TableCell>
                <TableCell>Créé Par</TableCell>
                <TableCell>Backlog</TableCell>
                <TableCell>Sprint</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket._id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">{ticket.TCKT_code}</TableCell>
                    <TableCell>{ticket.TCKT_equipment}</TableCell>
                    <TableCell>
                      {ticket.TCKT_types_pannes ? (
                        Array.isArray(ticket.TCKT_types_pannes) ? (
                          ticket.TCKT_types_pannes.map((typePanne, index) => (
                            <span key={typePanne._id || typePanne.PANN_code || index}>
                              {typePanne.PANN_libelle}
                              {index < ticket.TCKT_types_pannes.length - 1 ? ', ' : ''}
                            </span>
                          ))
                        ) : (
                          ticket.TCKT_types_pannes.PANN_libelle
                        )
                      ) : (
                        ticket.TCKT_type_panne
                      )}
                    </TableCell>
                    <TableCell>{ticket.TCKT_degre_urgence}</TableCell>
                    <TableCell>{ticket.TCKT_statut}</TableCell>
                    <TableCell>
                      {ticket.TCKT_DT_resolution_demandee
                        ? new Date(ticket.TCKT_DT_resolution_demandee).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {ticket.TCKT_date_prevue_resolution
                        ? new Date(ticket.TCKT_date_prevue_resolution).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {ticket.TCKT_DT_resolution_confirmee
                        ? new Date(ticket.TCKT_DT_resolution_confirmee).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.Date_creation).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{clientCode}</TableCell>
                    <TableCell>{ticket.TCKT_backlog ? 'Oui' : 'Non'}</TableCell>
                    <TableCell>{ticket.TCKT_sprint ? 'Oui' : 'Non'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    Aucun ticket trouvé.
                    {mesTickets.length > 0 && searchTerm === '' && statusFilter === '' && urgenceFilter === '' && prevueResolutionFilter === '' && confirmeeResolutionFilter === '' && (
                        ' (Vérifiez les filtres si vous attendiez des tickets.)'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Box>
  );
};

export default MesTickets;
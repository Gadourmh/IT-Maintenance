import React, { useEffect, useState } from 'react';
import {
  Paper, Typography, CircularProgress, TextField, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, Box, Button
} from '@mui/material';
import api from '../../api/api';

const MesNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterUserType, setFilterUserType] = useState('');
  const [filterUserModel, setFilterUserModel] = useState('');

  // Valeurs en attente (modifiables avant validation)
  const [pendingFilters, setPendingFilters] = useState({
    searchText: '',
    type: '',
    userType: '',
    userModel: '',
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: me } = await api.get('/auth/me');
        const { data } = await api.get(`/notifications/${me._id}`);
        setNotifications(data.notifications || []);
        setFiltered(data.notifications || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleApplyFilters = () => {
    setSearchText(pendingFilters.searchText);
    setFilterType(pendingFilters.type);
    setFilterUserType(pendingFilters.userType);
    setFilterUserModel(pendingFilters.userModel);

    let result = [...notifications];

    if (pendingFilters.searchText) {
      result = result.filter(n =>
        n.NOTF_message.toLowerCase().includes(pendingFilters.searchText.toLowerCase())
      );
    }

    if (pendingFilters.type) {
      result = result.filter(n => n.NOTF_type === pendingFilters.type);
    }

    if (pendingFilters.userType) {
      result = result.filter(n => n.NOTF_userType === pendingFilters.userType);
    }

    if (pendingFilters.userModel) {
      result = result.filter(n => n.NOTF_userModel === pendingFilters.userModel);
    }

    setFiltered(result);
  };

  const typeOptions = [...new Set(notifications.map(n => n.NOTF_type))];
  const userTypeOptions = [...new Set(notifications.map(n => n.NOTF_userType))];
  const userModelOptions = [...new Set(notifications.map(n => n.NOTF_userModel))];

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Mes Notifications</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Recherche par message"
              variant="outlined"
              fullWidth
              value={pendingFilters.searchText}
              onChange={(e) => setPendingFilters(prev => ({ ...prev, searchText: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={pendingFilters.type}
                label="Type"
                onChange={(e) => setPendingFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="">Tous</MenuItem>
                {typeOptions.map((type, idx) => (
                  <MenuItem key={idx} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type Utilisateur</InputLabel>
              <Select
                value={pendingFilters.userType}
                label="Type Utilisateur"
                onChange={(e) => setPendingFilters(prev => ({ ...prev, userType: e.target.value }))}
              >
                <MenuItem value="">Tous</MenuItem>
                {userTypeOptions.map((type, idx) => (
                  <MenuItem key={idx} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Modèle Utilisateur</InputLabel>
              <Select
                value={pendingFilters.userModel}
                label="Modèle Utilisateur"
                onChange={(e) => setPendingFilters(prev => ({ ...prev, userModel: e.target.value }))}
              >
                <MenuItem value="">Tous</MenuItem>
                {userModelOptions.map((model, idx) => (
                  <MenuItem key={idx} value={model}>{model}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={12} sx={{ textAlign: 'right', mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handleApplyFilters}>
              Appliquer les filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filtered.length === 0 ? (
        <Typography variant="body1">Aucune notification trouvée.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><b>Message</b></TableCell>
                <TableCell><b>Type</b></TableCell>
                <TableCell><b>Utilisateur</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Modèle</b></TableCell>
                <TableCell><b>Type Utilisateur</b></TableCell>
                <TableCell><b>Date</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((notif) => (
                <TableRow key={notif._id}>
                  <TableCell>{notif.NOTF_message}</TableCell>
                  <TableCell>{notif.NOTF_type}</TableCell>
                  <TableCell>{notif.NOTF_user?.PERS_nom_prenom || '—'}</TableCell>
                  <TableCell>{notif.NOTF_user?.PERS_email || '—'}</TableCell>
                  <TableCell>{notif.NOTF_userModel}</TableCell>
                  <TableCell>{notif.NOTF_userType}</TableCell>
                  <TableCell>{new Date(notif.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default MesNotifications;

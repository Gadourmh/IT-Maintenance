import React, { useEffect, useState, useMemo } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  TextField,
  Pagination,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  CircularProgress
} from "@mui/material";
import axios from "axios";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// --- MODIFICATION : Import du DatePicker ---
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const GestionNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  
  // --- MODIFICATION : Remplacement des anciens états de date par une plage de dates ---
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    userId: "",
    userType: "",
    notificationType: "email",
    message: ""
  });

  const [clients, setClients] = useState([]);
  const [personnels, setPersonnels] = useState([]);
  const [techniciens, setTechniciens] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchClients = async (config) => {
    try {
      const response = await axios.get("http://localhost:5000/api/clients/", config);
      setClients(Array.isArray(response.data.clients) ? response.data.clients.filter(c => c.deleted_at === null) : []);
    } catch (error) {
      console.error("Erreur lors de la récupération des clients", error);
    }
  };

  const fetchPersonnels = async (config) => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/personnels", config);
      setPersonnels(Array.isArray(data) ? data.filter(p => p.deleted_at === null) : []);
    } catch (error) {
      console.error("Erreur lors du chargement des personnels", error);
    }
  };
  
  const fetchTechniciens = async (config) => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/techniciens", config);
      const techniciansData = Array.isArray(data) ? data : data.techniciens || [];
      setTechniciens(techniciansData.filter(t => t.deleted_at === null));
    } catch (error) {
      console.error("Erreur lors du chargement des techniciens", error);
      setTechniciens([]);
    }
  };
  
  // --- MODIFICATION : L'effet pour récupérer les listes d'utilisateurs ne s'exécute qu'une fois ---
  useEffect(() => {
    const fetchUserAndTechData = async () => {
      setLoadingUsers(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await Promise.all([
        fetchClients(config),
        fetchPersonnels(config),
        fetchTechniciens(config)
      ]);
      setLoadingUsers(false);
    };
    fetchUserAndTechData();
  }, []);

  // --- MODIFICATION : L'effet pour récupérer les notifications s'exécute lorsque la page ou les filtres changent ---
  useEffect(() => {
    fetchNotifications();
  }, [page, typeFilter, userTypeFilter]);

  const allUsers = useMemo(() => {
    const combinedUsers = [
      ...clients.map(user => ({ id: user._id, name: user.CLNT_raison_sociale, role: 'CLIENT' })),
      ...personnels.map(user => ({ id: user._id, name: user.PERS_nom_prenom, role: user.PERS_role_acces })),
      ...techniciens.map(user => ({ id: user._id, name: user.TECH_nom_prenom, role: 'TECHNICIEN' }))
    ];
    return combinedUsers;
  }, [clients, personnels, techniciens]);


  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // L'API est interrogée avec les filtres actuels
      const response = await axios.get(
        `http://localhost:5000/api/notifications?page=${page}&limit=${limit}&type=${typeFilter}&userType=${userTypeFilter}`,
        config
      );
      setNotifications(response.data.notifications || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications", error);
      setNotification({ open: true, message: "Échec du chargement des notifications.", severity: "error" });
    }
  };
  
  const handleUserChange = (event) => {
    const selectedUserId = event.target.value;
    const selectedUser = allUsers.find(user => user.id === selectedUserId);
    if (selectedUser) {
        setNewNotification({
            ...newNotification,
            userId: selectedUser.id,
            userType: selectedUser.role
        });
    }
  };

  const handleSearch = (e) => setSearchQuery(e.target.value);
  const handlePageChange = (event, value) => setPage(value);
  
  // --- MODIFICATION : Nouveaux gestionnaires pour les filtres qui réinitialisent aussi la page ---
  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
    setPage(1); // Réinitialise à la page 1 lors du changement de filtre
  };

  const handleUserTypeFilterChange = (event) => {
    setUserTypeFilter(event.target.value);
    setPage(1); // Réinitialise à la page 1 lors du changement de filtre
  };


  // --- MODIFICATION : La logique de filtrage client est simplifiée ---
  // Elle gère maintenant la recherche textuelle et la nouvelle plage de dates.
  // Les filtres `typeFilter` et `userTypeFilter` sont gérés par l'API.
  const filteredNotifications = notifications.filter((notif) => {
    const notifDate = new Date(notif.createdAt);

    // Filtre par plage de dates
    let matchDate = true;
    if (startDate && notifDate < new Date(startDate).setHours(0, 0, 0, 0)) {
        matchDate = false;
    }
    if (endDate && notifDate > new Date(endDate).setHours(23, 59, 59, 999)) {
        matchDate = false;
    }

    // Filtre par texte de recherche (sur le message, le type et le type d'utilisateur)
    const matchSearch = (
      notif.NOTF_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.NOTF_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.NOTF_userType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return matchSearch && matchDate;
  });

  const handleCreateNotification = async () => {
    if (!newNotification.userId || !newNotification.message) {
      setNotification({ open: true, message: "Le destinataire et le message doivent être remplis.", severity: "error" });
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
  
      await axios.post("http://localhost:5000/api/notifications", {
        userId: newNotification.userId,
        userType: newNotification.userType,
        notificationType: newNotification.notificationType,
        message: newNotification.message
      }, config);
  
      setNotification({ open: true, message: "Notification créée avec succès !", severity: "success" });
      setShowCreateForm(false);
      fetchNotifications();
      setNewNotification({ userId: "", userType: "", notificationType: "email", message: "" });
    } catch (error) {
      console.error("Erreur lors de la création de la notification", error);
      setNotification({ open: true, message: "Erreur lors de la création de la notification.", severity: "error" });
    }
  };
  
  const handleEditNotification = (notifId) => {
    const notificationToEdit = notifications.find(notif => notif._id === notifId);
    if (notificationToEdit) {
      setSelectedNotificationId(notifId);
      setNewNotification({
        userId: notificationToEdit.NOTF_user ? notificationToEdit.NOTF_user._id : "",
        userType: notificationToEdit.NOTF_userType,
        notificationType: notificationToEdit.NOTF_type,
        message: notificationToEdit.NOTF_message
      });
      setShowEditForm(true);
    }
  };
  
  const handleSaveEditNotification = async () => {
    if (!newNotification.userId || !newNotification.userType || !newNotification.notificationType || !newNotification.message) {
      setNotification({ open: true, message: "Tous les champs doivent être remplis.", severity: "error" });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(
        `http://localhost:5000/api/notifications/${selectedNotificationId}`,
        {
          userId: newNotification.userId,
          userType: newNotification.userType,
          notificationType: newNotification.notificationType,
          message: newNotification.message
        },
        config
      );
      if (response.status === 200) {
        setNotification({ open: true, message: "Notification modifiée avec succès !", severity: "success" });
        setShowEditForm(false);
        fetchNotifications();
        setNewNotification({ userId: "", userType: "", notificationType: "", message: "" });
      }
    } catch (error) {
      console.error("Erreur lors de la modification de la notification", error);
      setNotification({ open: true, message: "Erreur lors de la modification de la notification.", severity: "error" });
    }
  };

  const handleDeleteNotification = (id) => {
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer cette notification ?");
    if (confirmDelete) {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        axios.delete(`http://localhost:5000/api/notifications/${id}`, config)
          .then((response) => {
            setNotification({ open: true, message: "Notification supprimée avec succès !", severity: "success" });
            fetchNotifications();
          })
          .catch((error) => {
            console.error("Erreur lors de la suppression de la notification", error);
            setNotification({ open: true, message: "Erreur lors de la suppression de la notification.", severity: "error" });
          });
      } catch (error) {
        console.error("Erreur lors de la suppression de la notification", error);
        setNotification({ open: true, message: "Erreur lors de la suppression de la notification.", severity: "error" });
      }
    }
  };
  
  return (
    // Le LocalizationProvider est nécessaire pour les DatePicker
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div>
        <Typography variant="h4" gutterBottom>Gestion des Notifications</Typography>
  
        {/* --- MODIFICATION : Interface utilisateur des filtres mise à jour --- */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: 10 }}>
          <TextField
            label="Rechercher"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={handleSearch}
            style={{ minWidth: "150px", flexGrow: 1 }}
          />
  
          <FormControl size="small" style={{ minWidth: "150px", flexGrow: 1 }}>
            <InputLabel>Type de Notification</InputLabel>
            <Select value={typeFilter} onChange={handleTypeFilterChange} label="Type de Notification">
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="email">Email</MenuItem>
            </Select>
          </FormControl>
  
          <FormControl size="small" style={{ minWidth: "150px", flexGrow: 1 }}>
            <InputLabel>Type d'Utilisateur</InputLabel>
            <Select value={userTypeFilter} onChange={handleUserTypeFilterChange} label="Type d'Utilisateur">
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              <MenuItem value="NORMAL">Normal</MenuItem>
              <MenuItem value="TECHNICIEN">Technicien</MenuItem>
              <MenuItem value="CLIENT">Client</MenuItem>
            </Select>
          </FormControl>

          {/* --- NOUVEAUTÉ : Ajout des filtres par plage de dates --- */}
          <DatePicker
            label="Date de début"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slotProps={{ textField: { size: 'small', style: { minWidth: "150px", flexGrow: 1 } } }}
          />
          <DatePicker
            label="Date de fin"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slotProps={{ textField: { size: 'small', style: { minWidth: "150px", flexGrow: 1 } } }}
          />
        </div>
  
      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="notifications table">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Type d'utilisateur</TableCell>
                <TableCell>Type de notification</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredNotifications.map((notif) => (
                <TableRow key={notif._id}>
                  <TableCell>
                    {notif.NOTF_user ? (
                      notif.NOTF_user.PERS_nom_prenom ||
                      notif.NOTF_user.CLNT_raison_sociale ||
                      notif.NOTF_user.TECH_nom_prenom ||
                      "Utilisateur"
                    ) : (
                      "Utilisateur Supprimé"
                    )}
                  </TableCell>
                  <TableCell>{notif.NOTF_userType}</TableCell>
                  <TableCell>{notif.NOTF_type}</TableCell>
                  <TableCell>{notif.NOTF_message}</TableCell>
                  <TableCell>
                    {new Date(notif.createdAt).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell>
                  <Button variant="contained" color="primary" onClick={() => handleEditNotification(notif._id)} sx={{ mr: 1 }}>Modifier</Button>
                    <Button variant="contained" color="secondary" onClick={() => handleDeleteNotification(notif._id)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
  
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          color="primary"
          style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}
        />
  
        <Button variant="contained" color="primary" onClick={() => setShowCreateForm(!showCreateForm)} style={{ marginTop: "20px" }}>
          {showCreateForm ? "Fermer le formulaire" : "Créer une notification"}
        </Button>
  
        {showCreateForm && (
          <Box component={Paper} sx={{ p: 2, mt: 2, mb: 2 }}>
            <Typography variant="h6">Nouvelle Notification</Typography>
            {loadingUsers ? <CircularProgress /> : (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Destinataire</InputLabel>
                  <Select
                    value={newNotification.userId}
                    label="Destinataire"
                    onChange={handleUserChange}
                  >
                    <MenuItem value="">
                      <em>Sélectionnez un utilisateur</em>
                    </MenuItem>
                    {allUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="User Type"
                  fullWidth
                  margin="normal"
                  value={newNotification.userType}
                  disabled
                />
                
                <TextField
                  label="Message"
                  fullWidth
                  multiline
                  rows={4}
                  margin="normal"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                />
                <Button variant="contained" color="success" onClick={handleCreateNotification}>
                  Enregistrer
                </Button>
              </>
            )}
          </Box>
        )}
  
        {showEditForm && (
          <Box component={Paper} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Modifier Notification</Typography>
            <TextField label="User ID" fullWidth margin="normal" value={newNotification.userId} onChange={(e) => setNewNotification({ ...newNotification, userId: e.target.value })}/>
            <FormControl fullWidth margin="normal">
              <InputLabel>User Type</InputLabel>
              <Select value={newNotification.userType} label="User Type" onChange={(e) => setNewNotification({ ...newNotification, userType: e.target.value })}>
                <MenuItem value="CLIENT">CLIENT</MenuItem>
                <MenuItem value="TECHNICIEN">TECHNICIEN</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
                <MenuItem value="SUPER_ADMIN">SUPER_ADMIN</MenuItem>
                <MenuItem value="NORMAL">NORMAL</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Notification Type" fullWidth margin="normal" value={newNotification.notificationType} onChange={(e) => setNewNotification({ ...newNotification, notificationType: e.target.value })}/>
            <TextField label="Message" fullWidth multiline rows={4} margin="normal" value={newNotification.message} onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}/>
            <Button variant="contained" color="success" onClick={handleSaveEditNotification}>Enregistrer</Button>
          </Box>
        )}

        <Snackbar open={notification.open} autoHideDuration={6000} onClose={() => setNotification({ ...notification, open: false })}>
            <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
                {notification.message}
            </Alert>
        </Snackbar>

      </div>
    </LocalizationProvider>
  );
};

export default GestionNotifications;
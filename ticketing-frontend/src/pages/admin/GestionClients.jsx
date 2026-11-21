import React, { useEffect, useState, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
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
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  IconButton,
  Menu,
  CircularProgress
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { blue, grey, red, green } from "@mui/material/colors";
import axios from "axios";
// import jsPDF from "jspdf"; // jsPDF n'est pas utilisé directement dans le code fourni pour ces modifs, mais gardé si besoin ailleurs

const GestionClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [contractFile, setContractFile] = useState(null);
  const [formData, setFormData] = useState({
    CLNT_code: "",
    CLNT_raison_sociale: "",
    CLNT_email: "", // Gardé pour la création, bien que désactivé en modification
    CLNT_telephone: "",
    CLNT_mot_passe: "",
    CLNT_statut: "actif",
    CLNT_MF: "",
    CLNT_addresses: [{ address: "" }],
    Date_creation: new Date().toISOString().split("T")[0],
    CLNT_contract: "",
    CLNT_photo_profil: "",
    // AJOUTÉ : Nouveaux champs pour l'état initial du formulaire
    failedLoginAttempts: 0,
    lockUntil: null,
    CLNT_cree_par: { _id: "", PERS_nom_prenom: "" },
  });

  const [filtreCode, setFiltreCode] = useState("");
  const [filtreRaisonSociale, setFiltreRaisonSociale] = useState("");
  const [filtreEmail, setFiltreEmail] = useState("");
  const [filtreMF, setFiltreMF] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreDateDebut, setFiltreDateDebut] = useState("");
  const [filtreDateFin, setFiltreDateFin] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClientForMenu, setSelectedClientForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const statutsPossibles = ["actif", "bloqué"];

  useEffect(() => {
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
      // Assurez-vous que votre API renvoie bien les nouveaux champs
      setClients(Array.isArray(response.data.clients) ? response.data.clients : []);
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

  const handleOpenForm = (client = null) => {
    setSelectedClient(client);
    if (client) {
      setFormData({
        ...client,
        CLNT_addresses: Array.isArray(client.CLNT_addresses) && client.CLNT_addresses.length > 0 ? client.CLNT_addresses : [{ address: "" }],
        Date_creation: client.Date_creation ? new Date(client.Date_creation).toISOString().split("T")[0] : "",
        CLNT_photo_profil: client.CLNT_photo_profil || "",
        // MODIFIÉ : Assurer que les nouveaux champs sont bien repris ou initialisés
        failedLoginAttempts: client.failedLoginAttempts !== undefined ? client.failedLoginAttempts : 0,
        lockUntil: client.lockUntil || null,
        CLNT_cree_par: client.CLNT_cree_par || { _id: "", PERS_nom_prenom: "" },
        CLNT_mot_passe: "", // Ne pas pré-remplir le mot de passe pour la modification
      });
    } else {
      setFormData({
        CLNT_raison_sociale: "",
        CLNT_code: "", // Le code est souvent généré côté serveur pour un nouveau client
        CLNT_email: "",
        CLNT_telephone: "",
        CLNT_mot_passe: "",
        CLNT_statut: "actif",
        CLNT_MF: "",
        CLNT_addresses: [{ address: "" }],
        Date_creation: new Date().toISOString().split("T")[0],
        CLNT_contract: "",
        CLNT_photo_profil: "",
        // MODIFIÉ : Initialisation pour un nouveau client
        failedLoginAttempts: 0,
        lockUntil: null,
        CLNT_cree_par: { _id: "", PERS_nom_prenom: "" }, // Sera probablement défini par le backend
      });
    }
    setContractFile(null);
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setSelectedClient(null);
    setFormData({
      CLNT_code: "",
      CLNT_raison_sociale: "",
      CLNT_email: "",
      CLNT_telephone: "",
      CLNT_mot_passe: "",
      CLNT_statut: "actif",
      CLNT_MF: "",
      CLNT_addresses: [{ address: "" }],
      Date_creation: new Date().toISOString().split("T")[0],
      CLNT_contract: "",
      CLNT_photo_profil: "",
      // MODIFIÉ : Reset des nouveaux champs
      failedLoginAttempts: 0,
      lockUntil: null,
      CLNT_cree_par: { _id: "", PERS_nom_prenom: "" },
    });
    setContractFile(null);
  };

  const handleConfirmOpen = (client) => {
    setSelectedClient(client);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setSelectedClient(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (index, value) => {
    const updatedAddresses = [...formData.CLNT_addresses];
    updatedAddresses[index] = { address: value };
    setFormData({ ...formData, CLNT_addresses: updatedAddresses });
  };

  const addAddressField = () => {
    setFormData({
      ...formData,
      CLNT_addresses: [...formData.CLNT_addresses, { address: "" }],
    });
  };

  const removeAddressField = (index) => {
    const updatedAddresses = formData.CLNT_addresses.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, CLNT_addresses: updatedAddresses.length > 0 ? updatedAddresses : [{address: ""}] });
  };

  const handleFileChange = (e) => {
    setContractFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    // La validation reste la même, les nouveaux champs ne sont pas obligatoires à la saisie manuelle
    if (!formData.CLNT_raison_sociale || !formData.CLNT_email || (!selectedClient && !formData.CLNT_mot_passe) || !formData.CLNT_telephone || !formData.CLNT_MF) {
      setNotification({
        open: true,
        message: "Veuillez remplir tous les champs obligatoires (Raison Sociale, Email, Mot de passe (nouveau), Téléphone, Matricule Fiscal).",
        severity: "error",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };
      const data = new FormData();

      // On n'ajoute pas les champs failedLoginAttempts, lockUntil, CLNT_cree_par au FormData
      // car ils sont généralement gérés par le backend ou informationnels.
      // Si vous avez besoin de les envoyer, décommentez et ajustez.
      Object.keys(formData).forEach((key) => {
        if (key === "CLNT_addresses") {
          const validAddresses = (Array.isArray(formData[key]) ? formData[key] : [{address:''}]).filter(addr => addr.address.trim() !== '');
          if (validAddresses.length > 0) {
            data.append(key, JSON.stringify(validAddresses));
          }
        } else if (key !== "CLNT_contract" && key !== "CLNT_photo_profil" &&
                   key !== "failedLoginAttempts" && key !== "lockUntil" && key !== "CLNT_cree_par" && key !== "_id" && key !== "__v" && key !== "Date_creation_timestamp") { // Exclure les champs non modifiables ou spéciaux
          if (formData[key] !== null && formData[key] !== undefined && (key !== "CLNT_mot_passe" || (key === "CLNT_mot_passe" && formData[key] !== "")) ) { // N'envoie le mot de passe que s'il est renseigné
             if (key === "Date_creation" && selectedClient) return; // Ne pas renvoyer Date_creation en modification
             data.append(key, formData[key]);
          }
        }
      });


      if (contractFile) {
        data.append("CLNT_contract", contractFile);
      }
      // Si vous gérez un upload de photo de profil séparé :
      // if (photoFile) { data.append("CLNT_photo_profil", photoFile); }


      let response;
      if (selectedClient) {
        response = await axios.put(
          `http://localhost:5000/api/clients/${selectedClient._id}`,
          data,
          config
        );
      } else {
        response = await axios.post(
          "http://localhost:5000/api/clients/",
          data,
          config
        );
      }

      setNotification({
        open: true,
        message: selectedClient
          ? "Client modifié avec succès."
          : "Client créé avec succès.",
        severity: "success",
      });
      fetchClients();
      handleCloseForm();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la sauvegarde.";
      console.error("Erreur lors de la sauvegarde du client", error.response?.data || error);
      setNotification({ open: true, message: errorMessage, severity: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    const idToDelete = selectedClient._id;
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(
        `http://localhost:5000/api/clients/${idToDelete}`,
        config
      );
      setClients(clients.filter((client) => client._id !== idToDelete));
      setNotification({
        open: true,
        message: "Client supprimé avec succès.",
        severity: "success",
      });
      handleConfirmClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Erreur lors de la suppression.";
      console.error("Erreur lors de la suppression du client", error.response?.data || error);
      setNotification({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      handleConfirmClose();
    }
  };

  const handleChangeStatus = async (clientId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `http://localhost:5000/api/clients/${clientId}/status`,
        { status: newStatus },
        config
      );
      setClients(clients.map(client =>
        client._id === clientId ? { ...client, CLNT_statut: newStatus } : client
      ));
      setNotification({
        open: true,
        message: "Statut modifié avec succès.",
        severity: "success",
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Erreur lors du changement de statut.";
      console.error("Erreur lors du changement de statut", error.response?.data || error);
      setNotification({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  const handleMenuOpen = (event, client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClientForMenu(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClientForMenu(null);
  };

  const handleEditClick = (client) => {
    handleOpenForm(client);
    handleMenuClose();
  };

  const handleDeleteClick = (client) => {
    handleConfirmOpen(client);
    handleMenuClose();
  };

  const handleChangeStatusClick = (client) => {
    const newStatus = client.CLNT_statut === "actif" ? "bloqué" : "actif";
    handleChangeStatus(client._id, newStatus);
    handleMenuClose();
  };

  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    return clients.filter((client) => {
      const dateCreationClient = client.Date_creation ? new Date(client.Date_creation) : null;
      const startDateObj = filtreDateDebut ? new Date(filtreDateDebut) : null;
      const endDateObj = filtreDateFin ? new Date(filtreDateFin) : null;
      const codeMatch = filtreCode === "" || (client.CLNT_code && client.CLNT_code.toLowerCase().includes(filtreCode.toLowerCase()));
      const raisonSocialeMatch = filtreRaisonSociale === "" || (client.CLNT_raison_sociale && client.CLNT_raison_sociale.toLowerCase().includes(filtreRaisonSociale.toLowerCase()));
      const emailMatch = filtreEmail === "" || (client.CLNT_email && client.CLNT_email.toLowerCase().includes(filtreEmail.toLowerCase()));
      const mfMatch = filtreMF === "" || (client.CLNT_MF && client.CLNT_MF.toLowerCase().includes(filtreMF.toLowerCase()));
      const statutMatch = filtreStatut === "" || (client.CLNT_statut && client.CLNT_statut === filtreStatut);
      const dateMatch = (!startDateObj || (dateCreationClient && dateCreationClient >= startDateObj)) &&
                        (!endDateObj || (dateCreationClient && dateCreationClient <= endDateObj));
      return codeMatch && raisonSocialeMatch && emailMatch && mfMatch && statutMatch && dateMatch;
    });
  }, [clients, filtreCode, filtreRaisonSociale, filtreEmail, filtreMF, filtreStatut, filtreDateDebut, filtreDateFin]);

  const resetFilters = () => {
    setFiltreCode("");
    setFiltreRaisonSociale("");
    setFiltreEmail("");
    setFiltreMF("");
    setFiltreStatut("");
    setFiltreDateDebut("");
    setFiltreDateFin("");
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
      console.error("Erreur de formatage de date", dateString, e);
      return 'Erreur date';
    }
  };

  // AJOUTÉ : Fonction pour formater la date et l'heure
  const formatDateTimeForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleString('fr-FR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      console.error("Erreur de formatage de date et heure", dateString, e);
      return 'Erreur date';
    }
  };


  const handleDownloadPDF = (contratPath, clientName) => {
    if (!contratPath) {
      setNotification({ open: true, message: "Aucun contrat disponible à télécharger.", severity: "warning" });
      return;
    }
    const fileUrl = `http://localhost:5000/${contratPath.replace(/\\/g, '/')}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', `Contrat_${clientName || 'client'}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLabel = (client) => {
    if (!client) return;

    const formattedDateCreation = client.Date_creation
        ? formatDateForDisplay(client.Date_creation)
        : 'N/A';

    let photoSrcForLabel = '';
    if (client.CLNT_photo_profil) {
        if (client.CLNT_photo_profil.startsWith('data:image/')) {
             photoSrcForLabel = client.CLNT_photo_profil;
        } else {
             photoSrcForLabel = `http://localhost:5000/${client.CLNT_photo_profil.replace(/\\/g, '/')}`;
        }
    }

    // AJOUTÉ : Inclure les nouveaux champs dans l'étiquette si désiré (ici, un exemple pour 'Créé par')
    const creeParNom = client.CLNT_cree_par && client.CLNT_cree_par.PERS_nom_prenom ? client.CLNT_cree_par.PERS_nom_prenom : 'N/A';

    const labelContent = `
        <html>
        <head>
            <title>Étiquette Client - ${client.CLNT_code || ''}</title>
            <style>
                /* Styles existants ... */
                body {
                    margin: 0;
                    font-family: 'Arial', sans-serif;
                    font-size: 6.5pt; /* Ajusté pour potentiellement plus de texte */
                    padding: 2px;
                    box-sizing: border-box;
                    line-height: 1.1; /* Ajusté */
                    overflow: hidden;
                    color: #333;
                }
                .label-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: row;
                    border: 1px solid #555;
                    padding: 2px;
                    gap: 3px; /* Réduit */
                    background-color: #f8f8f8;
                }
                 .label-image-area {
                    flex-shrink: 0;
                    width: 25mm; /* Réduit légèrement si besoin de place */
                    height: calc(100% - 4px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    border-right: 1px solid #ddd;
                    padding-right: 3px; /* Réduit */
                    overflow: hidden;
                }
                .label-details-area {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between; /* Aide à distribuer l'espace */
                    gap: 0.5px; /* Réduit */
                    overflow: hidden;
                    padding-left: 2px;
                }
                 .label-field strong {
                     display: inline-block;
                     width: 45px; /* Ajusté */
                     margin-right: 2px;
                     text-align: right;
                     flex-shrink: 0;
                     font-weight: normal;
                     color: ${grey[700]};
                     font-size: 6pt;
                }
                /* ... Autres styles ... */
                 .label-field.cree-par strong { width: 50px; }
                 .label-field.cree-par span { font-style: italic; font-size: 5.8pt; }

            </style>
        </head>
        <body>
            <div class="label-container">
                <div class="label-image-area">
                    ${photoSrcForLabel ? `<img src="${photoSrcForLabel}" alt="Photo Client"/>` : '<span>Pas de photo</span>'}
                </div>
                <div class="label-details-area">
                    <div class="detail-group">
                         <div class="group-title">Client</div>
                        <div class="label-field main-info"><strong>Code :</strong> <span>${client.CLNT_code || 'N/A'}</span></div>
                        <div class="label-field main-info"><strong>Raison Soc. :</strong> <span>${client.CLNT_raison_sociale || 'N/A'}</span></div>
                    </div>
                    <div class="detail-group">
                        <div class="group-title">Contact</div>
                         <div class="label-field"><strong>Email :</strong> <span>${client.CLNT_email || 'N/A'}</span></div>
                         <div class="label-field"><strong>Téléphone :</strong> <span>${client.CLNT_telephone || 'N/A'}</span></div>
                    </div>
                     <div class="detail-group">
                          <div class="group-title">Infos</div>
                         <div class="label-field"><strong>M. Fiscal :</strong> <span>${client.CLNT_MF || 'N/A'}</span></div>
                         <div class="label-field status-${client.CLNT_statut}"><strong>Statut :</strong> <span>${client.CLNT_statut || 'N/A'}</span></div>
                         <div class="label-field"><strong>Création :</strong> <span>${formattedDateCreation}</span></div>
                       
                         <div class="label-field cree-par"><strong>Créé par :</strong> <span>${creeParNom}</span></div>
                     </div>
                    <div class="detail-group address-group" style="margin-top: auto;"> {/* Pousse en bas */}
                         <div class="group-title">Adresse(s)</div>
                         <div class="address-block">
                            ${client.CLNT_addresses && Array.isArray(client.CLNT_addresses) && client.CLNT_addresses.length > 0
                                ? client.CLNT_addresses.map(addr => `<div class="address-line">${addr.address || 'N/A'}</div>`).join('')
                                : '<div class="address-line">N/A</div>'}
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(labelContent);
        printWindow.document.close();
        printWindow.onload = function() {
             printWindow.print();
        };
    } else {
        setNotification({
            open: true,
            message: "Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les pop-ups pour ce site.",
            severity: "warning",
        });
    }
};


  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: "#fff", minHeight: "100vh" }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: blue[900] }}>
        Gestion des Clients
      </Typography>
      <Paper sx={{ padding: 2, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: grey[800] }}>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          {/* Filtres existants ... */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Code Client"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreCode}
              onChange={(e) => setFiltreCode(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Raison Sociale"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreRaisonSociale}
              onChange={(e) => setFiltreRaisonSociale(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Email"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreEmail}
              onChange={(e) => setFiltreEmail(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Matricule Fiscal"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreMF}
              onChange={(e) => setFiltreMF(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Statut</InputLabel>
              <Select
                value={filtreStatut}
                label="Statut"
                onChange={(e) => setFiltreStatut(e.target.value)}
              >
                <MenuItem value="">
                  <em>Tous</em>
                </MenuItem>
                {statutsPossibles.map((stat) => (
                  <MenuItem key={stat} value={stat}>
                    {stat.charAt(0).toUpperCase() + stat.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date Création (Début)"
              type="date"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreDateDebut}
              onChange={(e) => setFiltreDateDebut(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date Création (Fin)"
              type="date"
              variant="outlined"
              size="small"
              fullWidth
              value={filtreDateFin}
              onChange={(e) => setFiltreDateFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="outlined" onClick={resetFilters} fullWidth color="secondary">
              Réinitialiser Filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <Box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
        <Button variant="contained" color="primary" onClick={() => handleOpenForm()}>
          Créer un Client
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="clients table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              {/* <TableCell sx={{ color: "black", fontWeight: 'bold' }}>ID</TableCell> // ID peut être long, optionnel */}
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Photo</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Code Client</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Raison Sociale</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Téléphone</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Statut</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Matricule Fiscal</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Adresse(s)</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Date Création</TableCell>
              {/* AJOUTÉ : Nouvelles colonnes pour les nouveaux champs */}
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Tentatives Conn.</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Verrouillé Jusqu'au</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Créé par</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Contrat</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client, index) => (
                <TableRow
                  key={client._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[100] : "white",
                    "&:hover": { backgroundColor: grey[200] },
                  }}
                >
                  {/* <TableCell>{client._id}</TableCell> */}
                   <TableCell>
                       {client.CLNT_photo_profil ? (
                           client.CLNT_photo_profil.startsWith('data:image/') ? (
                               <img
                                   src={client.CLNT_photo_profil}
                                   alt={`Photo de ${client.CLNT_raison_sociale || 'client'}`}
                                   style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '5px' }}
                               />
                           ) : (
                               client.CLNT_photo_profil.includes(',data:') ? (
                                  <img
                                       src={client.CLNT_photo_profil.split(',data:')[1] ? `data:${client.CLNT_photo_profil.split(',data:')[1]}` : ''}
                                       alt={`Photo de ${client.CLNT_raison_sociale || 'client'}`}
                                       style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '5px' }}
                                   />
                               ) : (
                                   <img
                                        src={`http://localhost:5000/${client.CLNT_photo_profil.replace(/\\/g, '/')}`}
                                        alt={`Photo de ${client.CLNT_raison_sociale || 'client'}`}
                                        style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: '5px' }}
                                    />
                               )
                           )
                       ) : (
                           <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>Pas de photo</Typography>
                       )}
                   </TableCell>
                  <TableCell>{client.CLNT_code || 'N/A'}</TableCell>
                  <TableCell>{client.CLNT_raison_sociale || 'N/A'}</TableCell>
                  <TableCell>{client.CLNT_email || 'N/A'}</TableCell>
                  <TableCell>{client.CLNT_telephone || 'N/A'}</TableCell>
                  <TableCell>
                     <span style={{ color: client.CLNT_statut === 'actif' ? green[700] : red[700], fontWeight: 'bold' }}>
                         {client.CLNT_statut || 'N/A'}
                     </span>
                  </TableCell>
                  <TableCell>{client.CLNT_MF || 'N/A'}</TableCell>
                  <TableCell>
                    {client.CLNT_addresses &&
                    Array.isArray(client.CLNT_addresses) &&
                    client.CLNT_addresses.length > 0 ? (
                      client.CLNT_addresses.map((addr, addrIndex) => (
                        <div key={addrIndex}>{addr.address || 'N/A'}</div>
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">Pas d'adresses</Typography>
                    )}
                  </TableCell>
                 <TableCell>{formatDateForDisplay(client.Date_creation)}</TableCell>
                 {/* AJOUTÉ : Cellules pour les nouveaux champs */}
                 <TableCell>{client.failedLoginAttempts !== undefined ? client.failedLoginAttempts : 'N/A'}</TableCell>
                 <TableCell>{formatDateTimeForDisplay(client.lockUntil)}</TableCell>
                 <TableCell>{client.CLNT_cree_par && client.CLNT_cree_par.PERS_nom_prenom ? client.CLNT_cree_par.PERS_nom_prenom : 'N/A'}</TableCell>
                  <TableCell>
                    {client.CLNT_contract ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Button
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => window.open(`http://localhost:5000/${client.CLNT_contract.replace(/\\/g, '/')}`, "_blank")}
                        >
                          Voir
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() => handleDownloadPDF(client.CLNT_contract, client.CLNT_raison_sociale)}
                        >
                          Télécharger
                        </Button>
                      </Box>
                    ) : (
                      "Aucun contrat"
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="plus d'actions"
                      aria-controls={menuOpen ? 'client-actions-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={menuOpen ? 'true' : undefined}
                      onClick={(event) => handleMenuOpen(event, client)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                {/* MODIFIÉ : Ajuster le colspan */}
                <TableCell colSpan={14} align="center"> {/* 1 (Photo) + 11 (existants sans ID) + 3 (nouveaux) + 1 (Contrat) + 1 (Actions) = 17. Si ID était affiché colSpan={15} */}
                                                          {/* Comptons : Photo, Code, RS, Email, Tel, Statut, MF, Adresse, DateCrea, Tentatives, Verrouillé, CrééPar, Contrat, Actions = 14 colonnes */}
                  Aucun client ne correspond aux filtres.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu
        id="client-actions-menu"
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedClientForMenu && (
          <>
            <MenuItem onClick={() => handleEditClick(selectedClientForMenu)}>
              Modifier
            </MenuItem>
            <MenuItem onClick={() => handleDeleteClick(selectedClientForMenu)}>
              Supprimer
            </MenuItem>
            <MenuItem onClick={() => handleChangeStatusClick(selectedClientForMenu)}>
              {selectedClientForMenu.CLNT_statut === "actif" ? "Bloquer" : "Activer"} {/* "Bloquer" au lieu de "Désactiver" */}
            </MenuItem>
            <MenuItem onClick={() => { handlePrintLabel(selectedClientForMenu); handleMenuClose(); }}>
              Imprimer Étiquette
            </MenuItem>
          </>
        )}
      </Menu>
      <Dialog open={open} onClose={handleCloseForm} maxWidth="md" fullWidth> {/* Augmenté maxWidth à "md" pour plus de place */}
        <DialogTitle sx={{ backgroundColor: blue[700], color: "#fff" }}>
          {selectedClient ? "Modifier le Client" : "Créer un Client"}
        </DialogTitle>
        <DialogContent dividers>
          {/* AJOUTÉ : Grid pour mieux organiser les champs du formulaire */}
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Raison Sociale"
                  name="CLNT_raison_sociale"
                  value={formData.CLNT_raison_sociale || ""}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  size="small"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Code Client"
                  name="CLNT_code"
                  value={formData.CLNT_code || ""} // Le code est affiché si existant, mais non modifiable directement ici
                  fullWidth
                  variant="outlined"
                  size="small"
                  disabled // Le code client est généralement non modifiable ou généré côté serveur
                  InputLabelProps={{ shrink: !!formData.CLNT_code }}
                />
              </Grid>
              {!selectedClient && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mot de passe"
                    name="CLNT_mot_passe"
                    value={formData.CLNT_mot_passe || ""}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="password"
                    required={!selectedClient} // Requis seulement à la création
                  />
                </Grid>
              )}
            
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  name="CLNT_email"
                  value={formData.CLNT_email || ""}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  size="small"
                  required
                  disabled={selectedClient !== null} // Email non modifiable après création
                  InputLabelProps={{ shrink: !!formData.CLNT_email }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Téléphone"
                  name="CLNT_telephone"
                  value={formData.CLNT_telephone || ""}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  size="small"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Matricule Fiscal"
                  name="CLNT_MF"
                  value={formData.CLNT_MF || ""}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  size="small"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    name="CLNT_statut"
                    value={formData.CLNT_statut || "actif"}
                    label="Statut"
                    onChange={handleChange}
                  >
                    {/* <MenuItem value=""><em>Non défini</em></MenuItem> */}
                    {statutsPossibles.map((stat) => (
                      <MenuItem key={stat} value={stat}>
                        {stat.charAt(0).toUpperCase() + stat.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* AJOUTÉ : Affichage des nouveaux champs (lecture seule) */}
              {selectedClient && ( // Afficher seulement en modification
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Tentatives de connexion échouées"
                      name="failedLoginAttempts"
                      value={formData.failedLoginAttempts !== undefined ? formData.failedLoginAttempts : 'N/A'}
                      fullWidth
                      variant="outlined"
                      size="small"
                      disabled
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Compte verrouillé jusqu'au"
                      name="lockUntil"
                      value={formData.lockUntil ? formatDateTimeForDisplay(formData.lockUntil) : 'Non verrouillé'}
                      fullWidth
                      variant="outlined"
                      size="small"
                      disabled
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Client créé par (ID)"
                      value={formData.CLNT_cree_par && formData.CLNT_cree_par._id ? formData.CLNT_cree_par._id : 'N/A'}
                      fullWidth
                      variant="outlined"
                      size="small"
                      disabled
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Client créé par (Nom)"
                      value={formData.CLNT_cree_par && formData.CLNT_cree_par.PERS_nom_prenom ? formData.CLNT_cree_par.PERS_nom_prenom : 'N/A'}
                      fullWidth
                      variant="outlined"
                      size="small"
                      disabled
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ marginTop: '10px' }}>Adresses</Typography>
                {formData.CLNT_addresses && Array.isArray(formData.CLNT_addresses) && formData.CLNT_addresses.map((address, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', marginBottom: '5px', gap: 1 }}>
                    <TextField
                      label={`Adresse ${index + 1}`}
                      value={address.address || ''}
                      onChange={(e) => handleAddressChange(index, e.target.value)}
                      fullWidth
                      margin="dense"
                      variant="outlined"
                      size="small"
                    />
                    {formData.CLNT_addresses.length > 1 && (
                      <Button onClick={() => removeAddressField(index)} color="error" size="small" variant="outlined">
                        Suppr.
                      </Button>
                    )}
                  </Box>
                ))}
                <Button onClick={addAddressField} color="primary" variant="outlined" size="small" sx={{ marginTop: '5px' }}>
                  Ajouter une adresse
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ marginTop: '20px', marginBottom: '5px' }}>Contrat (PDF)</Typography>
                <input type="file" accept=".pdf" onChange={handleFileChange} />
                {selectedClient && selectedClient.CLNT_contract && !contractFile && (
                  <Typography variant="body2" sx={{ marginTop: '5px' }}>
                    Contrat actuel : <a href={`http://localhost:5000/${selectedClient.CLNT_contract.replace(/\\/g, '/')}`} target="_blank" rel="noopener noreferrer">{selectedClient.CLNT_contract.split(/[\\/]/).pop()}</a>
                    <br/><em>Pour remplacer, choisissez un nouveau fichier.</em>
                  </Typography>
                )}
              </Grid>
             
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {selectedClient ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>
     <Dialog open={confirmOpen} onClose={handleConfirmClose}>
  <DialogTitle sx={{ backgroundColor: red[700], color: "#fff" }}>
    Confirmer la désactivation du client {/* <-- Nouveau titre */}
  </DialogTitle>
  <DialogContent dividers>
    <Typography>
      Êtes-vous sûr de vouloir **marquer ce client comme inactif** ? Il ne sera plus visible dans les listes actives mais restera lié aux enregistrements existants (tickets, factures, etc.). {/* <-- Nouveau texte */}
    </Typography>
    {selectedClient && (
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
        Client : {selectedClient.CLNT_raison_sociale || 'N/A'}
      </Typography>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={handleConfirmClose} color="secondary">
      Annuler
    </Button>
    <Button onClick={handleDelete} color="error" variant="contained">
      Désactiver {/* <-- Nouveau texte du bouton */}
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

export default GestionClients;
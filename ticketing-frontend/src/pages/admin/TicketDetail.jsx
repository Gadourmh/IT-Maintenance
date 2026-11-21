import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  CircularProgress,
  TextField,
  MenuItem,
  Grid,
  Stack,
} from "@mui/material";
import { format } from "date-fns";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";

const TicketDetail = () => {
  const { ticketId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [ticket, setTicket] = useState(location.state?.ticket || null);
  const [loading, setLoading] = useState(!location.state?.ticket);
  const [isEditing, setIsEditing] = useState(false);

  // Le formulaire ne contient que les champs modifiables
  const [formData, setFormData] = useState({
    TCKT_statut: "",
    TCKT_date_prevue_resolution: null,
  });

  // Fonction dédiée pour synchroniser le formulaire avec l'état du ticket
  const syncFormData = (ticketData) => {
    if (!ticketData) return;
    setFormData({
      TCKT_statut: ticketData.TCKT_statut || "",
      TCKT_date_prevue_resolution: ticketData.TCKT_date_prevue_resolution
        ? new Date(ticketData.TCKT_date_prevue_resolution)
        : null,
    });
  };

  // Fonction pour charger les détails complets du ticket, réutilisable
  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedTicket = res.data;
      setTicket(fetchedTicket);
      syncFormData(fetchedTicket); // S'assure que le formulaire d'édition est aussi à jour
    } catch (error) {
      console.error("Erreur récupération ticket:", error);
      Swal.fire("Erreur", `Impossible de charger les détails du ticket: ${error.message || "Erreur inconnue"}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!location.state?.ticket) {
      fetchTicketDetails();
    } else {
      // Si on vient de la liste, on synchronise quand même le formulaire
      syncFormData(ticket);
    }
  }, [ticketId, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        TCKT_statut: formData.TCKT_statut,
        TCKT_date_prevue_resolution: formData.TCKT_date_prevue_resolution,
      };

      // 1. Envoyer la requête de mise à jour
      await api.put(`/tickets/${ticketId}`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
      
      // 2. Recharger les données complètes pour éviter les incohérences
      await fetchTicketDetails();

      setIsEditing(false);
      Swal.fire("Succès", "Ticket modifié avec succès.", "success");
    } catch (error) {
      console.error("❌ Erreur modification ticket:", error.response?.data || error);
      Swal.fire("Erreur", `Erreur lors de la modification du ticket: ${error.response?.data?.message || error.message}`, "error");
    }
  };

  const addToSprint = async () => {
    try {
      // 1. Envoyer la requête d'ajout au sprint
      await api.put(`/tickets/${ticketId}/sprint`, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      // 2. Recharger les données complètes pour refléter le changement
      await fetchTicketDetails();

      Swal.fire("Succès", "Ticket ajouté au sprint avec succès.", "success");
    } catch (error) {
      console.error("❌ Erreur ajout au sprint:", error.response?.data || error);
      Swal.fire("Erreur", `Erreur lors de l'ajout du ticket au sprint: ${error.response?.data?.message || error.message}`, "error");
    }
  };

  if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (!ticket) return <Box p={4}><Typography variant="h5" color="error">Ticket non trouvé.</Typography></Box>;

  return (
    <Box p={4}>
      <Button variant="contained" color="primary" onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        Retour
      </Button>

      <Paper elevation={5} sx={{ p: 4, borderRadius: '8px' }}>
        <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
          Détails du Ticket : {ticket.TCKT_code}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {!isEditing ? (
          // --- VUE DÉTAILLÉE ---
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" sx={{ mb: 1 }}><strong>Client :</strong> {ticket.TCKT_client?.CLNT_raison_sociale || ticket.TCKT_client || "Non défini"}</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}><strong>Équipement (Code) :</strong> {ticket.TCKT_equipment || "Non défini"}</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}><strong>Degré d'Urgence :</strong> {ticket.TCKT_degre_urgence || 'N/A'}</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}><strong>Statut :</strong> {ticket.TCKT_statut || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" sx={{ mb: 1 }}><strong>Date Résolution Demandée :</strong> {ticket.TCKT_DT_resolution_demandee ? format(new Date(ticket.TCKT_DT_resolution_demandee), "dd/MM/yyyy") : "Non défini"}</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}><strong>Date Prévue Résolution :</strong> {ticket.TCKT_date_prevue_resolution ? format(new Date(ticket.TCKT_date_prevue_resolution), "dd/MM/yyyy") : "Non définie"}</Typography>
              </Grid>
              <Grid item xs={12}>
                 <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>Techniciens Assignés :</Typography>
                 {ticket.TCKT_assignee_a?.length > 0 ? ticket.TCKT_assignee_a.map((tech) => (
                    <Typography key={tech._id} variant="body2" sx={{ ml: 2 }}>- {tech.TECH_nom_prenom} ({tech.TECH_email})</Typography>
                 )) : <Typography variant="body2" sx={{ ml: 2 }}>Aucun</Typography>}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Description :</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>{ticket.TCKT_description || "Non défini"}</Typography>
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button variant="contained" color="primary" onClick={() => setIsEditing(true)}>Modifier Ticket</Button>
              <Button variant="contained" color="secondary" onClick={addToSprint} disabled={ticket.TCKT_sprint}>
                {ticket.TCKT_sprint ? "Déjà dans un Sprint" : "Ajouter au Sprint"}
              </Button>
            </Stack>
          </>
        ) : (
          // --- FORMULAIRE DE MODIFICATION ---
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Description</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mt: 1 }}>
                  {ticket.TCKT_description || "Non défini"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Degré d'urgence</Typography>
                <Typography variant="body1" sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mt: 1, height: '100%' }}>
                  {ticket.TCKT_degre_urgence || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Date Résolution Demandée</Typography>
                <Typography variant="body1" sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mt: 1, height: '100%' }}>
                  {ticket.TCKT_DT_resolution_demandee ? format(new Date(ticket.TCKT_DT_resolution_demandee), "dd/MM/yyyy") : "Non défini"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Techniciens Assignés</Typography>
                <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, mt: 1 }}>
                    {ticket.TCKT_assignee_a?.length > 0
                        ? ticket.TCKT_assignee_a.map((tech) => (
                            <Typography key={tech._id} variant="body2">
                                - {tech.TECH_nom_prenom} ({tech.TECH_email})
                            </Typography>
                        ))
                        : <Typography variant="body2">Aucun technicien assigné</Typography>
                    }
                </Box>
              </Grid>
              
              <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

              {/* --- Champs réellement modifiables --- */}
              <Grid item xs={12} sm={6}>
                <TextField select label="Statut" name="TCKT_statut" value={formData.TCKT_statut} onChange={handleChange} fullWidth>
                  <MenuItem value="ouvert">Ouvert</MenuItem>
                  <MenuItem value="en cours">En cours</MenuItem>
                  <MenuItem value="résolu">Résolu</MenuItem>
                  <MenuItem value="fermé">Fermé</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date Prévue Résolution"
                  name="TCKT_date_prevue_resolution"
                  type="date"
                  value={formData.TCKT_date_prevue_resolution ? format(new Date(formData.TCKT_date_prevue_resolution), "yyyy-MM-dd") : ''}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Button type="submit" variant="contained" color="primary">Enregistrer</Button>
              <Button variant="outlined" color="secondary" onClick={() => { setIsEditing(false); syncFormData(ticket); }}>Annuler</Button>
            </Stack>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default TicketDetail;
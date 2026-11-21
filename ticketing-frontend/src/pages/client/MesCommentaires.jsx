import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import {
    Box,
    Typography,
    CircularProgress,
    Paper,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    Avatar,
    Stack,
    IconButton,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select, // Importez Select et InputLabel
} from "@mui/material";
import { Edit, Delete, MoreVert } from '@mui/icons-material';

const MesCommentaires = () => {
    const [commentaires, setCommentaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    // Renommé pour plus de clarté, ce sera la valeur sélectionnée du Select
    const [selectedTicketCode, setSelectedTicketCode] = useState(""); // <-- MODIFIÉ ICI
    const [editId, setEditId] = useState(null);
    const [editMessages, setEditMessages] = useState({});
    const [clientId, setClientId] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientTicketsList, setClientTicketsList] = useState([]); // <-- NOUVEL ÉTAT POUR LA LISTE DES TICKETS DU CLIENT

    // États pour les filtres
    const [filtreTicketCode, setFiltreTicketCode] = useState("");
    const [filtreAuteurType, setFiltreAuteurType] = useState("");
    const [filtreDateDebut, setFiltreDateDebut] = useState("");
    const [filtreDateFin, setFiltreDateFin] = useState("");
    const [filtreMessage, setFiltreMessage] = useState("");


    // --- Récupération des commentaires ---
    const fetchCommentairesClient = async () => {
        setLoading(true);
        try {
            const me = await api.get("/clients/me");
            const cltId = me.data._id;
            const cltName = me.data.CLNT_raison_sociale || "Client inconnu";

            setClientId(cltId);
            setClientName(cltName);

            // Récupérer TOUS les tickets de ce client
            const ticketRes = await api.get(`/tickets/client/${cltId}`);
            const tickets = ticketRes.data;
            setClientTicketsList(tickets); // <-- Peupler la liste des tickets du client ici

            if (!tickets || tickets.length === 0) {
                setCommentaires([]);
                setLoading(false);
                return;
            }

            // Récupérer les commentaires pour chaque ticket et les combiner
            const allCommentaires = [];
            for (const ticket of tickets) {
                try {
                    const comRes = await api.get(`/commentaires/byCode/${ticket.TCKT_code}`);
                    allCommentaires.push(...comRes.data);
                } catch (comError) {
                    console.error(`Erreur récupération commentaires pour ticket ${ticket.TCKT_code}:`, comError);
                }
            }

            // Trier les commentaires par date (du plus récent au plus ancien)
            allCommentaires.sort((a, b) => new Date(b.CMMT_Date_creation) - new Date(a.CMMT_Date_creation));

            setCommentaires(allCommentaires);

        } catch (error) {
            console.error("Erreur récupération commentaires client:", error);
            Swal.fire("Erreur", "Impossible de récupérer vos commentaires.", "error");
            setCommentaires([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCommentairesClient();
    }, []);


    // --- Logique d'ajout de commentaire ---
    const handleAjouter = async () => {
        // Utiliser 'selectedTicketCode' au lieu de 'ticketCodeInput'
        if (!selectedTicketCode.trim() || !message.trim() || !clientName || !clientId) { // <-- MODIFIÉ ICI
            Swal.fire("Champs requis", "Code du ticket et message requis.", "warning");
            return;
        }

        try {
            // S'assurer que le ticket existe et appartient bien à ce client avant d'ajouter le commentaire
            // Cette vérification est redondante si le Select ne propose que les tickets du client,
            // mais c'est une bonne couche de sécurité côté client.
            const ticketExistsForClient = clientTicketsList.some(ticket => ticket.TCKT_code === selectedTicketCode.trim()); // <-- MODIFIÉ ICI

            if (!ticketExistsForClient) {
                 Swal.fire("Ticket Invalide", "Ce code de ticket n'existe pas ou ne vous appartient pas.", "warning");
                 return;
            }

            await api.post("/commentaires", {
                TCKT_code: selectedTicketCode.trim(), // <-- MODIFIÉ ICI
                CMMT_message: message.trim(),
                CMMT_utilisateur_nom: clientName,
                CMMT_utilisateur_code: clientId,
                CMMT_utilisateur_Type: 'CLIENT',
            });

            setMessage("");
            setSelectedTicketCode(""); // Vider le champ du code ticket après ajout // <-- MODIFIÉ ICI
            fetchCommentairesClient();
            Swal.fire("Succès", "Commentaire ajouté.", "success");
        } catch (error) {
            console.error("Erreur ajout commentaire:", error.response?.data || error.message);
            Swal.fire("Erreur", `Impossible d’ajouter le commentaire. ${error.response?.data?.message || ''}`, "error");
        }
    };


    // --- Logique de modification de commentaire ---
    const handleModifier = async (commentId, updatedMessage) => {
        if (!updatedMessage.trim()) {
            Swal.fire("Champs requis", "Le message modifié ne peut pas être vide.", "warning");
            return;
        }

         const commentaireToEdit = commentaires.find(c => c._id === commentId);
         if (!commentaireToEdit || commentaireToEdit.auteur?.code !== clientId || commentaireToEdit.auteur?.type !== 'CLIENT') {
             Swal.fire("Erreur", "Vous ne pouvez modifier que vos propres commentaires.", "error");
             setEditId(null);
             setEditMessages((prev) => ({ ...prev, [commentId]: "" }));
             return;
         }


        try {
            await api.put(`/commentaires/${commentId}`, {
                CMMT_message: updatedMessage,
            });
            setEditId(null);
            setEditMessages((prev) => ({ ...prev, [commentId]: "" }));
            fetchCommentairesClient();
            Swal.fire("Succès", "Commentaire modifié avec succès.", "success");
        } catch (error) {
            console.error("Erreur modification commentaire:", error.response?.data || error.message);
            Swal.fire("Erreur", `Erreur lors de la modification du commentaire. ${error.response?.data?.message || ''}`, "error");
        }
    };

    // --- Logique de suppression de commentaire ---
    const handleSupprimer = async (id) => {
         const commentaireToDelete = commentaires.find(c => c._id === id);
         if (!commentaireToDelete || commentaireToDelete.auteur?.code !== clientId || commentaireToDelete.auteur?.type !== 'CLIENT') {
             Swal.fire("Erreur", "Vous ne pouvez supprimer que vos propres commentaires.", "error");
             return;
         }


        const confirmation = await Swal.fire({
            title: "Êtes-vous sûr ?",
            text: "Cette action est irréversible.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#aaa",
            confirmButtonText: "Oui, supprimer",
            cancelButtonText: "Annuler",
        });

        if (confirmation.isConfirmed) {
            try {
                await api.delete(`/commentaires/${id}`);
                fetchCommentairesClient();
                Swal.fire("Supprimé", "Commentaire supprimé avec succès.", "success");
            } catch (error) {
                console.error("Erreur suppression:", error.response?.data || error.message);
                Swal.fire("Erreur", `Impossible de supprimer le commentaire. ${error.response?.data?.message || ''}`, "error");
            }
        }
    };

    // --- Logique de filtrage ---
    const filteredCommentaires = useMemo(() => {
        let filtered = commentaires;

        // Filtrer par code ticket
        if (filtreTicketCode) {
            filtered = filtered.filter(com =>
                com.ticket?.TCKT_code?.toLowerCase().includes(filtreTicketCode.toLowerCase())
            );
        }

        // Filtrer par type auteur (Client, Technicien, Personnel - même si ici c'est un client)
        if (filtreAuteurType) {
             filtered = filtered.filter(com =>
                 com.auteur?.type?.toLowerCase() === filtreAuteurType.toLowerCase()
             );
        }

        // Filtrer par message
         if (filtreMessage) {
             filtered = filtered.filter(com =>
                 com.CMMT_message?.toLowerCase().includes(filtreMessage.toLowerCase())
             );
         }

        // Filtrer par date de création
        if (filtreDateDebut) {
            const dateDebut = new Date(filtreDateDebut);
            filtered = filtered.filter(com =>
                new Date(com.CMMT_Date_creation) >= dateDebut
            );
        }
        if (filtreDateFin) {
            const dateFin = new Date(filtreDateFin);
            dateFin.setDate(dateFin.getDate() + 1); // Inclure toute la journée de fin
            filtered = filtered.filter(com =>
                new Date(com.CMMT_Date_creation) < dateFin
            );
        }


        return filtered;
    }, [commentaires, filtreTicketCode, filtreAuteurType, filtreDateDebut, filtreDateFin, filtreMessage]);

    // --- Fonction pour formater la date ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) {
            return 'Date invalide';
          }
          return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          console.error("Erreur de formatage de date", dateString, e);
          return 'Erreur date';
        }
    };

     // --- Fonction pour obtenir la source de l'image ---
    const getPhotoSrc = (photoPathOrDataUrl) => {
        if (!photoPathOrDataUrl) return null;
         if (photoPathOrDataUrl.startsWith('data:image/')) {
             return photoPathOrDataUrl; // C'est déjà une Data URL
         } else {
             // Supposer que c'est un chemin de fichier relatif
             return `http://localhost:5000/${photoPathOrDataUrl.replace(/\\/g, '/')}`;
         }
    };


    // --- Rendu du composant ---
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom component="h2" sx={{ mb: 4, textAlign: 'center', color: 'primary.main' }}>
                Mes commentaires de tickets
            </Typography>

            {/* Section Filtres */}
            <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
                 <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
                    Filtres
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            label="Code du ticket"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={filtreTicketCode}
                            onChange={(e) => setFiltreTicketCode(e.target.value)}
                        />
                    </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            label="Message contient"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={filtreMessage}
                            onChange={(e) => setFiltreMessage(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                         <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel>Type d'auteur</InputLabel>
                             <Select
                                value={filtreAuteurType}
                                label="Type d'auteur"
                                onChange={(e) => setFiltreAuteurType(e.target.value)}
                             >
                                 <MenuItem value=""><em>Tous les types</em></MenuItem>
                                 <MenuItem value="CLIENT">Client</MenuItem>
                                 <MenuItem value="TECHNICIEN">Technicien</MenuItem>
                             </Select>
                         </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            label="Date (depuis)"
                            type="date"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={filtreDateDebut}
                            onChange={(e) => setFiltreDateDebut(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            label="Date (jusqu'au)"
                            type="date"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={filtreDateFin}
                            onChange={(e) => setFiltreDateFin(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                        <Button variant="outlined" onClick={() => {
                            setFiltreTicketCode("");
                            setFiltreAuteurType("");
                            setFiltreDateDebut("");
                            setFiltreDateFin("");
                            setFiltreMessage("");
                        }} fullWidth>
                            Réinitialiser Filtres
                        </Button>
                    </Grid>
                </Grid>
            </Paper>


            {/* Section Ajout Commentaire */}
             <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
                 <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
                    Ajouter un commentaire
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                     {/* MODIFIÉ ICI: Remplacer TextField par FormControl et Select */}
                     <FormControl fullWidth size="small" sx={{flexGrow: 0, width: { sm: '200px' }}} required>
                        <InputLabel id="ticket-code-label">Code du ticket</InputLabel>
                        <Select
                            labelId="ticket-code-label"
                            id="ticket-code-select"
                            value={selectedTicketCode}
                            label="Code du ticket"
                            onChange={(e) => setSelectedTicketCode(e.target.value)} // <-- Utilise setSelectedTicketCode
                        >
                            <MenuItem value=""><em>Sélectionnez un ticket</em></MenuItem>
                            {clientTicketsList.map((ticket) => (
                                <MenuItem key={ticket.TCKT_code} value={ticket.TCKT_code}>
                                    {ticket.TCKT_code} - {ticket.TCKT_description.substring(0, 30)}{ticket.TCKT_description.length > 30 ? '...' : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                     <TextField
                        label="Votre message"
                        variant="outlined"
                        size="small"
                        multiline
                        rows={1}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        fullWidth
                        sx={{flexGrow: 1}}
                     />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAjouter}
                        sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}
                    >
                        Ajouter
                    </Button>
                </Stack>
             </Paper>


            {/* Section Liste Commentaires */}
            <Typography variant="h5" gutterBottom sx={{ mb: 2, color: 'text.secondary' }}>
                Liste des commentaires
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" mt={4}>
                    <CircularProgress />
                </Box>
            ) : (
                 <Box className="space-y-4">
                    {filteredCommentaires.length > 0 ? (
                        filteredCommentaires.map((commentaire) => (
                            <Card key={commentaire._id} elevation={1} sx={{ borderRadius: '8px' }}>
                                <CardContent>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                                        <Avatar
                                            src={getPhotoSrc(commentaire.auteur?.photo_profil)}
                                            alt={commentaire.auteur?.nom || 'Auteur inconnu'}
                                            sx={{ width: 40, height: 40 }}
                                        >
                                            {commentaire.auteur?.nom ? commentaire.auteur.nom.charAt(0) : '?'}
                                        </Avatar>

                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle2" component="p" sx={{ fontWeight: 'bold' }}>
                                                {commentaire.auteur?.nom || 'Auteur inconnu'} ({commentaire.auteur?.type || 'N/A'})
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                 Ticket Code: {commentaire.ticket?.TCKT_code || 'N/A'} - {formatDate(commentaire.CMMT_Date_creation)}
                                            </Typography>
                                        </Box>

                                        {/* Boutons d'action (Modifier/Supprimer) */}
                                        {commentaire.auteur?.code === clientId && commentaire.auteur?.type === 'CLIENT' && (
                                            <Stack direction="row" spacing={0.5}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setEditId(commentaire._id);
                                                        setEditMessages({
                                                            ...editMessages,
                                                            [commentaire._id]: commentaire.CMMT_message,
                                                        });
                                                    }}
                                                    color="primary"
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleSupprimer(commentaire._id)}
                                                    color="error"
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        )}
                                    </Stack>

                                    {/* Message du commentaire (mode affichage ou édition) */}
                                    {editId === commentaire._id ? (
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                            <TextField
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                value={editMessages[commentaire._id] || ""}
                                                onChange={(e) =>
                                                    setEditMessages({ ...editMessages, [commentaire._id]: e.target.value })
                                                }
                                            />
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleModifier(commentaire._id, editMessages[commentaire._id])}
                                                sx={{flexShrink: 0}}
                                            >
                                                💾 Enregistrer
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => {
                                                     setEditId(null);
                                                     setEditMessages((prev) => ({ ...prev, [commentaire._id]: "" }));
                                                }}
                                                 color="secondary"
                                                 sx={{flexShrink: 0}}
                                            >
                                                Annuler
                                            </Button>
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                            {commentaire.CMMT_message}
                                        </Typography>
                                    )}

                                </CardContent>
                            </Card>
                        ))
                    ) : (
                         <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 4 }}>
                            {commentaires.length > 0 ? "Aucun commentaire ne correspond aux filtres." : "Aucun commentaire trouvé pour vos tickets."}
                         </Typography>
                    )}
                </Box>
            )}

        </Box>
    );
};

export default MesCommentaires;
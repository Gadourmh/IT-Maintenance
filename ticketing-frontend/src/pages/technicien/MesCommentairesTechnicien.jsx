import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import {
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Grid,
    Paper,
    Avatar, // Import pour la photo de profil
    Stack, // Import pour aligner les éléments
    Card, // Import pour le conteneur de chaque commentaire
    CardContent, // Import pour le contenu de la carte
    IconButton,
    // Ajouter d'autres composants Material UI si nécessaire
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCommentIcon from '@mui/icons-material/AddComment';
import FilterListIcon from '@mui/icons-material/FilterList';

// Helper function to format date
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }; // Format plus lisible
    try {
        return new Date(dateString).toLocaleString('fr-FR', options); // Utiliser 'fr-FR'
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return 'Date invalide';
    }
};

// Helper function to get photo source (from GestionClients/Techniciens)
const getPhotoSrc = (photoPathOrDataUrl) => {
    if (!photoPathOrDataUrl) return null;
     if (photoPathOrDataUrl.startsWith('data:image/')) {
         return photoPathOrDataUrl; // C'est déjà une Data URL
     } else {
         // Supposer que c'est un chemin de fichier relatif (adapter l'URL de base si nécessaire)
         return `http://localhost:5000/${photoPathOrDataUrl.replace(/\\/g, '/')}`;
     }
     // On n'inclut pas la logique ",data:" spécifique ici, car elle est moins courante.
};


const MesCommentairesTechnicien = () => {
    const [commentaires, setCommentaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [ticketCodeInput, setTicketCodeInput] = useState(""); // Renommé pour clarté
    const [editId, setEditId] = useState(null);
    const [editMessage, setEditMessage] = useState("");
    const [technicianId, setTechnicianId] = useState("");
    const [technicianName, setTechnicianName] = useState("");

    // State for filters
    const [filterState, setFilterState] = useState({
        ticketCode: '',
        searchText: '',
        startDate: '',
        endDate: '',
        auteurType: '', // Nouveau filtre par type d'auteur
    });

    const fetchCommentairesTechnicien = async () => {
        setLoading(true);
        try {
            const me = await api.get("/techniciens/me");
            const techId = me.data._id;
            const techName = me.data.TECH_nom_prenom || "Technicien inconnu";
            const technicianAssignedTickets = me.data.TECH_tickets_assignees || []; // Récupérer les tickets assignés

            setTechnicianId(techId);
            setTechnicianName(techName);

            // Si le technicien n'a pas de tickets assignés, pas la peine de chercher les commentaires
            if (technicianAssignedTickets.length === 0) {
                setCommentaires([]);
                setLoading(false);
                return;
            }

            // --- Récupérer les commentaires pour les tickets assignés ---
            // Si votre backend a un endpoint pour récupérer les tickets *avec* leurs commentaires par Tech ID, utilisez-le.
            // Sinon, on doit itérer comme suit, en utilisant l'endpoint byCode qui ramène l'info auteur + photo + ticketCode (si modifié)
            const allCommentaires = [];
            // Nous devons d'abord récupérer les CODES des tickets assignés si l'endpoint /tickets/technicien/:id ne les renvoie pas déjà
            // Le code original fait api.get(`/tickets/technicien/${techId}`); qui renvoie une liste d'objets tickets, donc on a les codes.
            const ticketRes = await api.get(`/tickets/technicien/${techId}`);
            const tickets = ticketRes.data;

            if (!tickets || tickets.length === 0) {
                 setCommentaires([]);
                 setLoading(false);
                 return;
            }

             // Utiliser Promise.all pour lancer les appels en parallèle si possible
            const commentsPromises = tickets.map(async (ticket) => {
                 try {
                    // Utilise l'endpoint backend `/commentaires/byCode/:code` qui renvoie l'auteur avec photo et ticket.TCKT_code
                    const comRes = await api.get(`/commentaires/byCode/${ticket.TCKT_code}`);
                    // Les commentaires retournés par cette API devraient déjà contenir l'objet `auteur` (avec `photo_profil`) et l'objet `ticket` (avec `TCKT_code`)
                    return comRes.data;
                 } catch (commentError) {
                    console.error(`Erreur récupération commentaires pour ticket ${ticket.TCKT_code}:`, commentError.response?.data || commentError.message);
                    return []; // Retourne un tableau vide en cas d'erreur pour ce ticket
                 }
            });

            const commentsResults = await Promise.all(commentsPromises);
            const combinedComments = commentsResults.flat(); // Aplatir le tableau de tableaux de commentaires

            // Trier les commentaires par date (du plus récent au plus ancien)
            combinedComments.sort((a, b) => new Date(b.CMMT_Date_creation) - new Date(a.CMMT_Date_creation));


            setCommentaires(combinedComments);

        } catch (error) {
            console.error("Erreur récupération commentaires ou technicien:", error.response?.data || error.message);
            Swal.fire("Erreur", "Impossible de récupérer les commentaires ou les informations du technicien.", "error");
            setCommentaires([]);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchCommentairesTechnicien();
    }, []);


    // --- Handle Filter Changes ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilterState(prev => ({ ...prev, [name]: value }));
    };

    // --- Filtering Logic ---
    const filteredCommentaires = useMemo(() => {
        if (!Array.isArray(commentaires)) return [];

        return commentaires.filter(comment => {
            const { ticketCode, searchText, startDate, endDate, auteurType } = filterState;

            // Filter by Ticket Code (assuming comment.ticket.TCKT_code is now available from backend)
            const ticketCodeMatch = ticketCode === '' ||
                                    (comment.ticket?.TCKT_code || '').toLowerCase().includes(ticketCode.toLowerCase());

            // Text Search Filter (in comment message or author name)
            const searchMatch = searchText === '' ||
                                (comment.CMMT_message || '').toLowerCase().includes(searchText.toLowerCase()) ||
                                (comment.auteur?.nom || '').toLowerCase().includes(searchText.toLowerCase()); // Vérifier dans auteur.nom

            // Filter by Author Type
            const auteurTypeMatch = auteurType === '' ||
                                    (comment.auteur?.type || '').toLowerCase() === auteurType.toLowerCase();


            // Date Range Filter
            const commentDate = new Date(comment.CMMT_Date_creation);
            const start = startDate ? new Date(startDate) : null;
            if(start) start.setHours(0,0,0,0); // Start of the day
            const end = endDate ? new Date(endDate) : null;
            if(end) end.setHours(23,59,59,999); // End of the day


            const dateMatch = (!start || (commentDate && commentDate >= start)) && (!end || (commentDate && commentDate <= end));

            // Combine Filters
            return ticketCodeMatch && searchMatch && auteurTypeMatch && dateMatch;
        });
    }, [commentaires, filterState]);


    // --- Handle Add Comment ---
    const handleAjouter = async () => {
        if (!ticketCodeInput.trim() || !message.trim()) {
            Swal.fire("Champs requis", "Code du ticket et message requis.", "warning");
            return;
        }

        // Optionnel: Vérifier si le technicien est bien assigné à ce ticket avant d'ajouter le commentaire
        // Cette vérification pourrait aussi être faite côté backend.
        // Pour simplifier, on assume que l'API d'ajout gère l'autorisation.

        try {
            setLoading(true);
            await api.post("/commentaires", {
                TCKT_code: ticketCodeInput.trim(),
                CMMT_message: message.trim(),
                CMMT_utilisateur_nom: technicianName, // Nom du technicien connecté
                CMMT_utilisateur_code: technicianId, // ID du technicien connecté
                CMMT_utilisateur_Type: 'TECHNICIEN', // Type correct
            });

            setMessage("");
            setTicketCodeInput("");
            fetchCommentairesTechnicien(); // Recharger les commentaires
            Swal.fire("Succès", "Commentaire ajouté.", "success");
        } catch (error) {
            console.error("Erreur ajout commentaire:", error.response?.data || error.message);
            Swal.fire("Erreur", `Impossible d’ajouter le commentaire. ${error.response?.data?.message || ''}`, "error");
        } finally {
            setLoading(false);
        }
    };


    // --- Handle Edit/Delete Actions ---
    // Function to check if the current user can edit/delete the comment
    const canEditOrDelete = (comment) => {
        // A technician can only edit/delete their own comments
        return comment.auteur?.code === technicianId && comment.auteur?.type === 'TECHNICIEN';
    };

    // Trigger edit mode
    const handleStartEdit = (comment) => {
         // Only start edit if the user can edit
        if (canEditOrDelete(comment)) {
            setEditId(comment._id);
            setEditMessage(comment.CMMT_message);
        } else {
             Swal.fire("Non autorisé", "Vous ne pouvez modifier que vos propres commentaires.", "error");
        }
    };

    const handleModifier = async (commentId) => {
        if (!editMessage.trim()) {
            Swal.fire("Champs requis", "Le message ne peut pas être vide.", "warning");
            return;
        }

        // Find the comment to get original data
        const originalComment = commentaires.find(c => c._id === commentId);

        // Basic validation and authorization check
        if (!originalComment || !canEditOrDelete(originalComment)) {
             Swal.fire("Erreur", "Action non autorisée.", "error");
             handleCancelEdit(); // Exit edit mode if not authorized or comment not found
             return;
        }

        // Check if the message has actually changed
        if (originalComment.CMMT_message === editMessage.trim()) {
            Swal.fire("Information", "Aucune modification détectée.", "info");
            handleCancelEdit(); // Exit edit mode
            return;
        }

        try {
            setLoading(true);
            await api.put(`/commentaires/${commentId}`, {
                CMMT_message: editMessage.trim(),
            });
            setEditId(null);
            setEditMessage("");
            fetchCommentairesTechnicien();
            Swal.fire("Succès", "Commentaire modifié.", "success");
        } catch (error) {
            console.error("Erreur modification commentaire:", error.response?.data || error.message);
            Swal.fire("Erreur", `Impossible de modifier le commentaire. ${error.response?.data?.message || ''}`, "error");
        } finally {
            setLoading(false);
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setEditId(null);
        setEditMessage("");
    };

    const handleSupprimer = async (id) => {
         // Find the comment to check authorization
         const commentaireToDelete = commentaires.find(c => c._id === id);

         // Basic authorization check
         if (!commentaireToDelete || !canEditOrDelete(commentaireToDelete)) {
             Swal.fire("Erreur", "Action non autorisée.", "error");
             return;
         }

        const confirmation = await Swal.fire({
            title: "Supprimer ce commentaire ?",
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
                setLoading(true);
                await api.delete(`/commentaires/${id}`);
                fetchCommentairesTechnicien();
                Swal.fire("Supprimé", "Commentaire supprimé.", "success");
            } catch (error) {
                console.error("Erreur suppression:", error.response?.data || error.message);
                Swal.fire("Erreur", `Impossible de supprimer. ${error.response?.data?.message || ''}`, "error");
            } finally {
                setLoading(false);
            }
        }
    };


    // --- Render Component ---
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom component="h2" sx={{ mb: 4, textAlign: 'center', color: 'primary.main' }}>
                🛠️ Mes commentaires de tickets
            </Typography>

            {/* Section Filtres */}
            <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
                 <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
                    <FilterListIcon sx={{ mr: 1, verticalAlign: 'bottom' }} /> Filtrer les commentaires
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Code du ticket"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={filterState.ticketCode}
                            onChange={handleFilterChange}
                            name="ticketCode"
                        />
                    </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Message ou Auteur"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={filterState.searchText}
                            onChange={handleFilterChange}
                            name="searchText"
                        />
                    </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                         <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel>Type d'auteur</InputLabel>
                             <Select
                                value={filterState.auteurType}
                                label="Type d'auteur"
                                onChange={handleFilterChange}
                                name="auteurType"
                             >
                                 <MenuItem value=""><em>Tous les types</em></MenuItem>
                                 <MenuItem value="CLIENT">Client</MenuItem>
                                 <MenuItem value="TECHNICIEN">Technicien</MenuItem>
                                  {/* Ajoutez d'autres types si pertinent, ex: Personnel */}
                                   <MenuItem value="PERSONNEL">Personnel</MenuItem>
                             </Select>
                         </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Date (depuis)"
                            type="date"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={filterState.startDate}
                            onChange={handleFilterChange}
                            name="startDate"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Date (jusqu'au)"
                            type="date"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={filterState.endDate}
                            onChange={handleFilterChange}
                             name="endDate"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                        <Button variant="outlined" onClick={() => {
                           setFilterState({ // Réinitialise tous les filtres
                                ticketCode: '',
                                searchText: '',
                                startDate: '',
                                endDate: '',
                                auteurType: '',
                           });
                        }} fullWidth>
                            Réinitialiser Filtres
                        </Button>
                    </Grid>
                </Grid>
            </Paper>


            {/* Section Ajout Commentaire */}
             <Paper elevation={2} sx={{ p: 2, mb: 4 }}>
                 <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
                    <AddCommentIcon sx={{ mr: 1, verticalAlign: 'bottom' }} /> Ajouter un commentaire
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                     <TextField
                        label="Code du ticket"
                        variant="outlined"
                        size="small"
                        value={ticketCodeInput}
                        onChange={(e) => setTicketCodeInput(e.target.value)}
                        fullWidth
                        sx={{flexGrow: 0, width: { sm: '200px' }}}
                        helperText="Code du ticket sur lequel commenter" // Helper text
                     />
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
                    <Typography variant="body1" sx={{ ml: 2 }}>Chargement des commentaires...</Typography>
                </Box>
            ) : (
                 <Box sx={{ '.MuiCard-root': { mb: 2 } }}> {/* Applique un style aux Cards directes */}
                    {filteredCommentaires.length > 0 ? (
                        filteredCommentaires.map((comment) => (
                            <Card key={comment._id} elevation={1} sx={{ borderRadius: '8px' }}>
                                <CardContent>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                                        {/* Affichage de la photo de profil */}
                                        <Avatar
                                            src={getPhotoSrc(comment.auteur?.photo_profil)}
                                            alt={comment.auteur?.nom || 'Auteur inconnu'}
                                            sx={{ width: 40, height: 40 }}
                                        >
                                            {/* Fallback initiales */}
                                            {comment.auteur?.nom ? comment.auteur.nom.charAt(0) : '?'}
                                        </Avatar>

                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle2" component="p" sx={{ fontWeight: 'bold' }}>
                                                {comment.auteur?.nom || 'Auteur inconnu'} ({comment.auteur?.type || 'N/A'})
                                            </Typography>
                                             <Typography variant="caption" color="text.secondary">
                                                 Ticket Code: {comment.ticket?.TCKT_code || 'N/A'} - {formatDateTime(comment.CMMT_Date_creation)}
                                            </Typography>
                                        </Box>

                                        {/* Boutons d'action (Modifier/Supprimer) */}
                                        {canEditOrDelete(comment) && ( // N'affiche les boutons que si le technicien peut modifier/supprimer ce commentaire
                                            <Stack direction="row" spacing={0.5}>
                                                {editId === comment._id ? (
                                                    // Mode édition
                                                    <>
                                                        <IconButton size="small" color="primary" onClick={() => handleModifier(comment._id)}>
                                                            <SaveIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={handleCancelEdit}>
                                                            <CancelIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    // Mode affichage
                                                    <>
                                                        <IconButton size="small" color="info" onClick={() => handleStartEdit(comment)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => handleSupprimer(comment._id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </Stack>
                                        )}
                                    </Stack>

                                    {/* Message du commentaire (mode affichage ou édition) */}
                                    {editId === comment._id ? (
                                        <TextField
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            multiline
                                            rows={2} // Minimum 2 rows in edit mode
                                            value={editMessage}
                                            onChange={(e) => setEditMessage(e.target.value)}
                                            sx={{ mt: 1 }}
                                        />
                                    ) : (
                                        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}> {/* whiteSpace pour préserver les retours à la ligne */}
                                            {comment.CMMT_message}
                                        </Typography>
                                    )}

                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        // Message si aucun commentaire trouvé (après filtrage ou initial)
                         <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 4 }}>
                            {commentaires.length > 0 && Object.values(filterState).every(f => f === '' || f === null)
                                ? "Aucun commentaire trouvé avec les filtres actuels." // Message si filtres actifs mais aucun résultat
                                : commentaires.length === 0 && Object.values(filterState).every(f => f === '' || f === null)
                                    ? "Aucun commentaire trouvé pour vos tickets." // Message si liste initiale vide
                                    : "Aucun commentaire ne correspond aux critères de recherche." // Message générique si filtré à zéro
                            }
                             {/* Afficher le total si filtres actifs et liste filtrée vide */}
                            {commentaires.length > 0 && filteredCommentaires.length === 0 && (
                                <Typography variant="body2" color="textSecondary">
                                    (Total commentaires : {commentaires.length})
                                </Typography>
                            )}
                         </Typography>
                    )}
                </Box>
            )}

        </Box>
    );
};

export default MesCommentairesTechnicien;
import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography,
    Box,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    Button,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Grid,
    CircularProgress, // Added for loading indicator
    Snackbar, // Added for Snackbar feedback
    Alert, // Added for Alert feedback
    Chip, // Added Chip for displaying lists (pannes, assignees, interventions)
    Divider, // Added Divider for visual separation (in future card view)
} from '@mui/material';
import Swal from 'sweetalert2';
import api from '../../api/api';

// Helper function to format date (without time)
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


const MesTicketsTechniciens = () => {
    const [technicienId, setTechnicienId] = useState('');
    const [mesTickets, setMesTickets] = useState([]);
    const [open, setOpen] = useState(false); // State for Edit Dialog
    const [currentTicket, setCurrentTicket] = useState(null); // Ticket being edited
    const [newStatus, setNewStatus] = useState(''); // Status in edit dialog
    const [editLoading, setEditLoading] = useState(false); // Loading for Edit Save button
    const [typesPannes, setTypesPannes] = useState([]); // For Type Panne select in edit dialog

    // --- Nouveaux états pour le filtrage (Keep your existing filter states) ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [urgenceFilter, setUrgenceFilter] = useState('');
    const [typePanneFilter, setTypePanneFilter] = useState('');

    // Loading state for initial fetch
    const [loading, setLoading] = useState(true);

    // State for Snackbar feedback
    const [snackMessage, setSnackMessage] = useState("");
    const [snackSeverity, setSnackSeverity] = useState("success"); // 'success', 'error', 'warning', 'info'
    const [snackOpen, setSnackOpen] = useState(false);

    // --- Snackbar close handler ---
    const handleSnackClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackOpen(false);
    };
    // --- END SNACKBAR HANDLER ---


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Start loading for combined fetch
            const techInfo = await fetchTechnicienInfo();
            if(techInfo && techInfo._id) {
                await fetchTicketsByTechnicien(techInfo._id);
            } else {
                setLoading(false); // Stop loading if tech info fails
            }
            await fetchTypesPannes(); // Fetch types pannes regardless of tech info success
            // Note: Final setLoading(false) is in fetchTicketsByTechnicien
        };
        fetchData();
    }, []); // Empty dependency array: run once on mount


    // Keep this effect to refetch tickets if technicianId changes (less likely after initial load)
    useEffect(() => {
        if (technicienId) {
            // Avoid double fetching on mount
            // fetchTicketsByTechnicien(technicienId);
        }
    }, [technicienId]);


    const fetchTechnicienInfo = async () => {
        try {
            const res = await api.get('/techniciens/me');
            setTechnicienId(res.data._id);
            return res.data; // Return data so the first effect can use the ID
        } catch (error) {
            console.error('Erreur lors de la récupération du technicien :', error.response?.data || error);
            Swal.fire('Erreur', error?.response?.data?.message || 'Impossible de récupérer le technicien connecté.', 'error');
            // setLoading(false); // Handled by the main effect's else block
        }
        return null; // Return null on error
    };


    const fetchTicketsByTechnicien = async (id) => {
        try {
            setLoading(true); // Keep loading true while fetching tickets
            // --- MODIFICATION ICI : AJOUTER LES PARAMÈTRES POUR POPULER LES CHAMPS ---
            // Ceci DÉPEND de ton API backend. Adapte les paramètres "_populate" ou "_embed" selon sa configuration.
            // Exemple courant (peut varier) :
            const res = await api.get(`/tickets/technicien/${id}?_populate=TCKT_client&_populate=TCKT_equipment&_populate=TCKT_assignee_a&_populate=TCKT_types_pannes&_embed=interventions`, {
                // Assumes your API supports these query parameters to embed/populate related data
            });
            // --- FIN MODIFICATION API CALL ---

            if (Array.isArray(res.data)) {
                setMesTickets(res.data);
            } else {
                console.error('Expected array of tickets, but received:', res.data);
                setMesTickets([]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des tickets :', error.response?.data || error);
            Swal.fire('Erreur', error?.response?.data?.message || 'Impossible de récupérer les tickets.', 'error');
        } finally {
            setLoading(false); // Set loading false after fetch (success or error)
        }
    };


    const fetchTypesPannes = async () => {
        try {
            const res = await api.get('/types-pannes/');
            if (Array.isArray(res.data)) {
                setTypesPannes(res.data);
            } else {
                console.error('Expected array of types pannes, but received:', res.data);
                setTypesPannes([]);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des types de pannes :", error.response?.data || error);
            Swal.fire('Erreur', error?.response?.data?.message || 'Erreur lors du chargement des types de pannes', 'error');
        }
    };

    const handleEditClick = (ticket) => {
        setCurrentTicket({
            ...ticket,
            // When editing, set the TCKT_type_panne in state to the ID of the first type panne
            TCKT_type_panne: ticket.TCKT_types_pannes?.[0]?._id || '',
            TCKT_date_prevue_resolution: ticket.TCKT_date_prevue_resolution || '', // Added TCKT_date_prevue_resolution
        });
        setNewStatus(ticket.TCKT_statut || ''); // Use default empty string if status is null
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentTicket(null); // Clear current ticket state
        setNewStatus(''); // Reset status state
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentTicket({ ...currentTicket, [name]: value });
    };

    const handleStatusChange = (e) => {
        setNewStatus(e.target.value);
    };

    const handleSave = async () => {
        if (!currentTicket) return;

        try {
            setEditLoading(true); // Start loading on Save button

            const updatedTicket = {
                ...currentTicket,
                TCKT_statut: newStatus,
                // Send TCKT_types_pannes as an array of IDs. If TCKT_type_panne is '' or null, send empty array.
                TCKT_types_pannes: currentTicket.TCKT_type_panne ? [currentTicket.TCKT_type_panne] : [],
                // Do not send fields that are not meant to be updated by the technician via this form
                // Example: remove assigned_a, creation date, potentially client/equipment if not editable here
            };

            // Filter out fields that are read-only or not meant for update via this dialog
            const fieldsToUpdate = {
                TCKT_description: updatedTicket.TCKT_description,
                TCKT_statut: updatedTicket.TCKT_statut,
                TCKT_types_pannes: updatedTicket.TCKT_types_pannes,
                TCKT_date_prevue_resolution: updatedTicket.TCKT_date_prevue_resolution, // Added TCKT_date_prevue_resolution
                // Add other fields here if they are meant to be editable by the technician
                // TCKT_cause_panne: updatedTicket.TCKT_cause_panne, // Example if you add cause/solution to dialog
                // TCKT_solution_apportée: updatedTicket.TCKT_solution_apportée,
                // TCKT_durée: updatedTicket.TCKT_durée,
                // TCKT_dt_debut: updatedTicket.TCKT_dt_debut,
                // TCKT_dt_fin: updatedTicket.TCKT_dt_fin,
                // Add TCKT_DT_resolution_confirmee here if technicians can mark as resolved
            };


            const res = await api.put(`/tickets/${currentTicket._id}`, fieldsToUpdate);

            // Refetch the list after update to ensure consistency and get full updated data
            await fetchTicketsByTechnicien(technicienId);


            // Use Snackbar for feedback instead of Swal.fire
            setSnackMessage('Le ticket a été mis à jour avec succès.');
            setSnackSeverity("success");
            setSnackOpen(true);

            handleClose(); // Close dialog on success
        } catch (error) {
            console.error('Erreur lors de la mise à jour du ticket', error.response?.data || error);
            // Use Snackbar for feedback instead of Swal.fire
            setSnackMessage(error.response?.data?.message || 'Impossible de modifier le ticket.');
            setSnackSeverity("error");
            setSnackOpen(true);
        } finally {
            setEditLoading(false); // Stop loading on Save button
        }
    };


    // --- Handlers pour les changements de filtre (Keep your existing handlers) ---
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
    };

    const handleUrgenceFilterChange = (event) => {
        setUrgenceFilter(event.target.value);
    };

    const handleTypePanneFilterChange = (event) => {
        setTypePanneFilter(event.target.value);
    };


    // --- Logique de filtrage des tickets (Keep your existing logic, adjust search to new fields) ---
    const filteredTickets = useMemo(() => {
        // Ensure mesTickets is an array before filtering
        if (!Array.isArray(mesTickets)) return [];

        let filtered = mesTickets;

        // Filtrage par terme de recherche - INCLURE LES NOUVEAUX CHAMPS
        if (searchTerm) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(ticket =>
                (ticket._id || '').toLowerCase().includes(lowercasedSearchTerm) || // Added Ticket ID to search
                (ticket.TCKT_code && ticket.TCKT_code.toLowerCase().includes(lowercasedSearchTerm)) ||
                (ticket.TCKT_description && ticket.TCKT_description.toLowerCase().includes(lowercasedSearchTerm)) ||
                (ticket.TCKT_client_raison_sociale && ticket.TCKT_client_raison_sociale.toLowerCase().includes(lowercasedSearchTerm)) || // Added Client Raison Sociale
                (ticket.TCKT_client && ticket.TCKT_client.toLowerCase().includes(lowercasedSearchTerm)) || // Existing Client ID/Name
                (ticket.TCKT_equipment?.EQPT_libelle && ticket.TCKT_equipment.EQPT_libelle.toLowerCase().includes(lowercasedSearchTerm)) || // Added Equipment Libelle (if nested)
                (typeof ticket.TCKT_equipment === 'string' && ticket.TCKT_equipment.toLowerCase().includes(lowercasedSearchTerm)) || // Added Equipment string (if not nested)
                (ticket.TCKT_types_pannes && ticket.TCKT_types_pannes.some(panne =>
                    panne?.PANN_libelle && panne.PANN_libelle.toLowerCase().includes(lowercasedSearchTerm)
                )) ||
                (ticket.TCKT_assignee_a && ticket.TCKT_assignee_a.some(tech =>
                    tech?.TECH_nom_prenom && tech.TECH_nom_prenom.toLowerCase().includes(lowercasedSearchTerm)
                )) ||
                (ticket.TCKT_degre_urgence && ticket.TCKT_degre_urgence.toLowerCase().includes(lowercasedSearchTerm)) || // Added Urgence
                (ticket.TCKT_statut && ticket.TCKT_statut.toLowerCase().includes(lowercasedSearchTerm)) || // Added Status
                (ticket.interventions || []).some(inv => (inv.INTR_code || '').toLowerCase().includes(lowercasedSearchTerm)) // Added Intervention Code to search
                // Add search on Backlog, Sprint, Sprint ID if needed
                // (typeof ticket.TCKT_backlog === 'boolean' && (ticket.TCKT_backlog ? 'oui' : 'non').includes(lowercasedSearchTerm)) ||
                // (typeof ticket.TCKT_sprint === 'boolean' && (ticket.TCKT_sprint ? 'oui' : 'non').includes(lowercasedSearchTerm)) ||
                // (ticket.TCKT_sprint_id && ticket.TCKT_sprint_id.toLowerCase().includes(lowercasedSearchTerm))
            );
        }

        // Filtrage par statut (Keep existing)
        if (statusFilter) {
            filtered = filtered.filter(ticket => ticket.TCKT_statut === statusFilter);
        }

        // Filtrage par degré d'urgence (Keep existing)
        if (urgenceFilter) {
            filtered = filtered.filter(ticket => ticket.TCKT_degre_urgence === urgenceFilter);
        }

        // Filtrage par type de panne (par l'ID) (Keep existing)
        if (typePanneFilter) {
            filtered = filtered.filter(ticket =>
                ticket.TCKT_types_pannes && ticket.TCKT_types_pannes.some(panne => panne?._id === typePanneFilter)
            );
        }

        // Add filters for Backlog, Sprint if needed in the future
        // if (backlogFilter !== '') { ... }


        return filtered;
    }, [mesTickets, searchTerm, statusFilter, urgenceFilter, typePanneFilter]);


    // Display loading state
    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: '80vh' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Chargement des tickets...</Typography>
            </Box>
        );
    }


    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h4" gutterBottom>Mes Tickets Assignés</Typography>

            {/* Section de filtrage (Keep your existing section with minor adjustments) */}
            <Box sx={{ marginBottom: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                    label="Rechercher ticket..."
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
                        <MenuItem value="en cours">En cours</MenuItem>
                        <MenuItem value="résolu">Résolu</MenuItem>
                        <MenuItem value="fermé">Fermé</MenuItem>
                        {/* Add other statuses if needed */}
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
                        {/* Add other urgencies if needed */}
                    </Select>
                </FormControl>

                <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Type de Panne</InputLabel>
                    <Select
                        value={typePanneFilter}
                        onChange={handleTypePanneFilterChange}
                        label="Type de Panne"
                    >
                        <MenuItem value=""><em>Tous les types de panne</em></MenuItem>
                        {typesPannes.map((typePanne) => (
                            <MenuItem key={typePanne._id} value={typePanne._id}>
                                {typePanne.PANN_libelle}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {/* Add filters for Backlog, Sprint, etc. here if needed */}

            </Box>

            <Box mt={2}>
                <Paper sx={{ overflowX: 'auto' }}> {/* Ensure Paper has horizontal overflow auto */}
                    <Table sx={{ minWidth: 1200 }} aria-label="tickets assignées table"> {/* Increased minWidth for new columns and potential sticky */}
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                {/* ADDED Sticky "ID" column header */}
                                <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, zIndex: 3, backgroundColor: '#f5f5f5', minWidth: 100 }}>ID</TableCell>

                                {/* Sticky "Code" column header (offset by ID column width) */}
                                <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 100, zIndex: 2, backgroundColor: '#f5f5f5' }}>Code</TableCell>

                                {/* Other headers */}
                                <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Urgence</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Date Création</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Équipement</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Pannes</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Assigné Par</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Backlog</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Sprint</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Sprint ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Résolution Demandée</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Résolution Confirmée</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Date Prévue Résolution</TableCell> {/* Added column header */}

                                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map((ticket, index) => (
                                    <TableRow
                                        key={ticket._id}
                                        sx={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }} // Added row banding
                                    >
                                        {/* ADDED Sticky "ID" column cell */}
                                        <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white', minWidth: 100 }}>{ticket._id || 'N/A'}</TableCell>

                                        {/* Sticky "Code" column cell (offset by ID column width) */}
                                        <TableCell component="th" scope="row" sx={{ position: 'sticky', left: 100, zIndex: 1, backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>{ticket.TCKT_code || 'N/A'}</TableCell>

                                        {/* Other cells */}
                                        <TableCell>{ticket.TCKT_statut || 'N/A'}</TableCell>
                                        <TableCell>{ticket.TCKT_degre_urgence || 'N/A'}</TableCell>
                                        <TableCell>
                                            {ticket.Date_creation
                                                ? formatDate(ticket.Date_creation) // Use helper function
                                                : 'N/A'}
                                        </TableCell>
                                        {/* Display Client Info */}
                                        <TableCell sx={{ maxWidth: 150, wordBreak: 'break-word' }}> {/* Added max width */}
                                            {ticket.TCKT_client_raison_sociale || ticket.TCKT_client || 'N/A'}
                                        </TableCell>
                                        {/* Display Equipment Info */}
                                        <TableCell sx={{ maxWidth: 150, wordBreak: 'break-word' }}> {/* Added max width */}
                                            {ticket.TCKT_equipment?.EQPT_libelle || ticket.TCKT_equipment || 'N/A'} {/* Handle nested or string */}
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>{ticket.TCKT_description || 'N/A'}</TableCell>
                                        {/* Display Pannes using Chips */}
                                        <TableCell sx={{ wordBreak: 'break-word', verticalAlign: 'top' }}> {/* Allow full width, top align */}
                                            {ticket.TCKT_types_pannes?.length > 0 ? (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {ticket.TCKT_types_pannes.map((typePanne) => (
                                                        <Chip key={typePanne._id} label={typePanne.PANN_libelle || 'Inconnu'} size="small" />
                                                    ))}
                                                </Box>
                                            ) : (
                                                'N/A'
                                            )}
                                        </TableCell>
                                        {/* Display Assignees using Chips */}
                                        <TableCell sx={{ wordBreak: 'break-word', verticalAlign: 'top' }}> {/* Allow full width, top align */}
                                            {ticket.TCKT_assignee_a?.length > 0 ? (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {ticket.TCKT_assignee_a.map((technicien) => (
                                                        <Chip key={technicien._id} label={technicien.TECH_nom_prenom || 'Inconnu'} size="small" />
                                                    ))}
                                                </Box>
                                            ) : (
                                                'N/A'
                                            )}
                                        </TableCell>
                                        {/* Display Backlog Status */}
                                        <TableCell>{ticket.TCKT_backlog ? 'Oui' : 'Non'}</TableCell>
                                        {/* Display Sprint Status */}
                                        <TableCell>{ticket.TCKT_sprint ? 'Oui' : 'Non'}</TableCell>
                                        {/* Display Sprint ID */}
                                        <TableCell>{ticket.TCKT_sprint_id || 'N/A'}</TableCell>
                                        {/* Display Resolution Dates */}
                                        <TableCell>
                                            {ticket.TCKT_DT_resolution_demandee
                                                ? formatDate(ticket.TCKT_DT_resolution_demandee) // Use helper function
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {ticket.TCKT_DT_resolution_confirmee
                                                ? formatDate(ticket.TCKT_DT_resolution_confirmee) // Use helper function
                                                : 'N/A'}
                                        </TableCell>
                                        <TableCell> {/* Display Date Prévue Résolution */}
                                            {ticket.TCKT_date_prevue_resolution
                                                ? formatDate(ticket.TCKT_date_prevue_resolution)
                                                : 'N/A'}
                                        </TableCell>
                                        {/* Display Associated Interventions */}

                                        {/* Actions Cell */}
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleEditClick(ticket)}
                                            >
                                                Modifier
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={19} align="center"> {/* UPDATED colSpan to 19 */}
                                        Aucun ticket trouvé.
                                        {mesTickets.length > 0 && searchTerm === '' && statusFilter === '' && urgenceFilter === '' && typePanneFilter === '' && (
                                            <Typography component="span" variant="body2" color="textSecondary">
                                                {' (Vérifiez les filtres si vous attendiez des tickets.)'}
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Paper>
            </Box>

            {/* Edit Dialog (Keep your existing Dialog with minor adjustments) */}
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Modifier le Ticket : {currentTicket?.TCKT_code || ''}</DialogTitle> {/* Added ticket code to title */}
                <DialogContent>
                    <TextField
                        label="Description"
                        fullWidth
                        name="TCKT_description"
                        value={currentTicket?.TCKT_description || ''}
                        onChange={handleChange}
                        margin="normal"
                        multiline
                        rows={4}
                    />
                    <TextField
                        label="Urgence"
                        fullWidth
                        name="TCKT_degre_urgence"
                        value={currentTicket?.TCKT_degre_urgence || ''}
                        onChange={handleChange}
                        margin="normal"
                        disabled // Urgency usually not editable by technician
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Statut</InputLabel>
                        <Select
                            value={newStatus}
                            onChange={handleStatusChange}
                            label="Statut"
                        >
                            <MenuItem value="ouvert">Ouvert</MenuItem>
                            <MenuItem value="en cours">En cours</MenuItem>
                            <MenuItem value="résolu">Résolu</MenuItem>
                            <MenuItem value="fermé">Fermé</MenuItem>
                            {/* Ensure these match your backend statuses */}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Type de Panne</InputLabel>
                        <Select
                            // Bind value to the ID stored in currentTicket.TCKT_type_panne state
                            value={currentTicket?.TCKT_type_panne || ''}
                            onChange={(e) =>
                                setCurrentTicket({
                                    ...currentTicket,
                                    TCKT_type_panne: e.target.value, // Update with the selected ID
                                })
                            }
                            label="Type de Panne"

                        >
                            <MenuItem value=""><em>Aucun</em></MenuItem> {/* Option for no type selected */}
                            {typesPannes.map((type) => (
                                <MenuItem key={type._id} value={type._id}>
                                    {type.PANN_libelle}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {/* Added TextField for TCKT_date_prevue_resolution */}
                    <TextField
                        label="Date Prévue Résolution"
                        name="TCKT_date_prevue_resolution"
                        type="date"
                        fullWidth
                        margin="normal"
                        value={currentTicket?.TCKT_date_prevue_resolution ? new Date(currentTicket.TCKT_date_prevue_resolution).toISOString().slice(0, 10) : ''}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                    />
                    {/* Add other editable fields here if necessary (e.g., cause, solution, dates, duration) */}
                    {/* Example: Add Resolution Confirmed date picker */}
                    {/* <TextField
                        label="Résolution Confirmée"
                        name="TCKT_DT_resolution_confirmee"
                        type="date" // or datetime-local depending on desired input
                        fullWidth
                        margin="normal"
                        value={currentTicket?.TCKT_DT_resolution_confirmee ? new Date(currentTicket.TCKT_DT_resolution_confirmee).toISOString().slice(0, 10) : ''}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                    /> */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="secondary" disabled={editLoading}>
                        Annuler
                    </Button>
                    <Button onClick={handleSave} color="primary" variant="contained" disabled={editLoading}>
                        {editLoading ? <CircularProgress size={24} /> : "Enregistrer"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for feedback */}
            <Snackbar
                open={snackOpen}
                autoHideDuration={6000}
                onClose={handleSnackClose}
            >
                <Alert onClose={handleSnackClose} severity={snackSeverity} sx={{ width: '100%' }}>
                    {snackMessage}
                </Alert>
            </Snackbar>

        </Box>
    );
};

export default MesTicketsTechniciens;
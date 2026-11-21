import React, { useEffect, useState, useRef } from "react";
// Import Bar from react-chartjs-2 and Chart.js components
import { Bar, Pie } from "react-chartjs-2"; // Ajout de Pie pour potentiels graphiques circulaires
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement, // Ajout pour Pie/Doughnut
    Title,
    Tooltip,
    Legend,
} from "chart.js";


// Ajout des icônes pour les fonctionnalités d'impression/exportation
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import TableChartIcon from '@mui/icons-material/TableChart'; // Icon for Excel export

// Import des bibliothèques d'impression/exportation
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from 'xlsx'; // Import for Excel export


// Import API and SweetAlert
import api from "../../api/api";
import Swal from "sweetalert2";

// Import Material UI components
import {
    Box, Typography, Grid, Card, CardContent,
    CircularProgress, FormControl, InputLabel, Select, MenuItem, Button,
    Container, Snackbar,Stack,Alert
} from "@mui/material";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Palette de couleurs conservée car spécifique à Chart.js dans ce fichier
const CHART_COLORS = [
    "#2196F3", "#4CAF50", "#FFC107", "#FF5722", "#9C27B0", "#00BCD4",
    "#E91E63", "#673AB7", "#795548", "#607D8B", "#8BC34A", "#FF9800",
];

// Mappages de couleurs spécifiques conservés
const STATUS_TICKET_COLORS = {
    "ouvert": CHART_COLORS[1],
    "fermé": CHART_COLORS[0],
    "en cours": CHART_COLORS[2],
    "résolu": CHART_COLORS[12],
    "Inconnu": CHART_COLORS[8] || CHART_COLORS[4] // Fallback amélioré
};

const URGENCY_TICKET_COLORS = {
    "faible": CHART_COLORS[1],
    "moyenne": CHART_COLORS[3],
    "élevée": CHART_COLORS[6],
    "Inconnue": CHART_COLORS[8] || CHART_COLORS[4]
};


const DashboardClient = () => {
    const [clientId, setClientId] = useState(null);
    const [clientCode, setClientCode] = useState(null);
    const [mesTickets, setMesTickets] = useState([]);
    const [equipements, setEquipements] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterTicketStatus, setFilterTicketStatus] = useState("");
    const [filterTicketUrgency, setFilterTicketUrgency] = useState("");
    const [filterTicketEquipment, setFilterTicketEquipment] = useState("");
    const [filterTicketPanneType, setFilterTicketPanneType] = useState("");
    const [filterEquipmentType, setFilterEquipmentType] = useState("");
      
    // --- Nouveaux états pour les informations de l'utilisateur connecté ---
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [showWelcomeMessage, setShowWelcomeMessage] = useState(false); 


    // Fetch logged-in user details
    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoadingUser(true);
            try {
                const token = localStorage.getItem("token");
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                const response = await api.get("/clients/me", config);
                setLoggedInUser(response.data);
                setShowWelcomeMessage(true); // Show Snackbar on successful fetch
            } catch (error) {
                console.error("Erreur de chargement des informations utilisateur :", error);
                setLoggedInUser(null);
            } finally {
                setLoadingUser(false);
            }
        };
        fetchUserDetails();
    }, []);

    // Handle Snackbar close
    const handleCloseWelcomeMessage = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowWelcomeMessage(false);
    };

    // Ref pour cibler le contenu à imprimer/exporter
    const componentRef = useRef();

    // --- Gestion de l'exportation PDF ---
    const handleExportPdf = async () => {
        const element = componentRef.current;
        const canvas = await html2canvas(element, { scale: 2, logging: true, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        pdf.save('TableauDeBord_Client.pdf');
    };

    // --- Gestion de l'exportation PNG ---
    const handleExportPng = async () => {
        const element = componentRef.current;
        const canvas = await html2canvas(element, { scale: 2, logging: true, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'TableauDeBord_Client.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Gestion de l'exportation Excel ---
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        // 1. KPIs
        const kpiDataForExport = kpiCardsData.map(kpi => ({
            Indicateur: kpi.title,
            Valeur: kpi.value
        }));
        if (kpiDataForExport.length > 0) {
            const wsKpis = XLSX.utils.json_to_sheet(kpiDataForExport);
            XLSX.utils.book_append_sheet(wb, wsKpis, "Indicateurs Clés");
        }
        
        // 2. Liste des Tickets (filtrés)
        const ticketsToExport = filteredTicketsData.map(ticket => ({
            "ID Ticket": ticket._id,
            "Sujet": ticket.TCKT_sujet,
            "Statut": ticket.TCKT_statut,
            "Urgence": ticket.TCKT_degre_urgence,
            "Équipement": ticket.TCKT_equipement?.EQPT_denomination || ticket.TCKT_equipement?.EQPT_code || "N/A",
            "Types de Pannes": ticket.TCKT_types_pannes?.map(p => p.PANN_libelle).join(", ") || "N/A",
            "Date Création": ticket.TCKT_date_creation ? new Date(ticket.TCKT_date_creation).toLocaleDateString('fr-FR') : "N/A",
        }));
        if (ticketsToExport.length > 0) {
            const wsTickets = XLSX.utils.json_to_sheet(ticketsToExport);
            XLSX.utils.book_append_sheet(wb, wsTickets, "Mes Tickets (Filtres)");
        }

        // 3. Liste des Équipements (filtrés)
        const equipementsToExport = filteredEquipmentsData.map(equip => ({
            "Code Équipement": equip.EQPT_code,
            "Dénomination": equip.EQPT_denomination,
            "Type": equip.EQPT_type?.TPEQ_libelle || "N/A",
            "Numéro de Série": equip.EQPT_numero_serie,
            "Date d'Installation": equip.EQPT_date_installation ? new Date(equip.EQPT_date_installation).toLocaleDateString('fr-FR') : "N/A",
        }));
        if (equipementsToExport.length > 0) {
            const wsEquipements = XLSX.utils.json_to_sheet(equipementsToExport);
            XLSX.utils.book_append_sheet(wb, wsEquipements, "Mes Équipements (Filtres)");
        }

        // 4. Données des graphiques (exemples de résumés)
        const ticketsStatusExport = Object.entries(ticketStatusCounts).map(([status, count]) => ({ Statut: status, Nombre: count }));
        if (ticketsStatusExport.length > 0) {
            const wsTicketsStatus = XLSX.utils.json_to_sheet(ticketsStatusExport);
            XLSX.utils.book_append_sheet(wb, wsTicketsStatus, "Tickets par Statut");
        }

        const ticketsUrgenceExport = Object.entries(urgencyCounts).map(([urgence, count]) => ({ Urgence: urgence, Nombre: count }));
         if (ticketsUrgenceExport.length > 0) {
            const wsTicketsUrgence = XLSX.utils.json_to_sheet(ticketsUrgenceExport);
            XLSX.utils.book_append_sheet(wb, wsTicketsUrgence, "Tickets par Urgence");
        }


        if (wb.SheetNames.length > 0) {
            XLSX.writeFile(wb, "TableauDeBord_Client_Export.xlsx");
        } else {
            alert("Aucune donnée à exporter !");
        }
    };

    // --- ✨ SECTION CORRIGÉE : CHARGEMENT DES DONNÉES ✨ ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Étape 1 : Récupérer les informations du client. C'est la seule étape critique.
                const clientRes = await api.get("/clients/me");
                const client = clientRes.data;
                setClientId(client._id);
                setClientCode(client.CLNT_code);

                // Étape 2 : Lancer les autres requêtes en parallèle avec Promise.allSettled
                // Cela garantit que toutes les requêtes se terminent, même si l'une d'elles échoue.
                const [ticketsResult, equipResult] = await Promise.allSettled([
                    api.get(`/tickets/client/${client._id}`),
                    api.get(`/equipments/client/code/${client.CLNT_code}`)
                ]);

                // Traiter le résultat des tickets
                if (ticketsResult.status === 'fulfilled') {
                    setMesTickets(ticketsResult.value.data);
                } else {
                    console.error("Erreur de chargement des tickets:", ticketsResult.reason);
                    setMesTickets([]); // Initialiser comme un tableau vide en cas d'erreur
                }

                // Traiter le résultat des équipements
                if (equipResult.status === 'fulfilled') {
                    setEquipements(equipResult.value.data);
                } else {
                    // C'est probablement ici que l'erreur "impossible de recuperer un equipment" se produit
                    console.error("Erreur de chargement des équipements:", equipResult.reason);
                    setEquipements([]); // Initialiser comme un tableau vide en cas d'erreur
                }

            } catch (error) {
                // Cette erreur ne se déclenchera que si la requête critique /clients/me échoue.
                console.error("Erreur critique : Impossible de charger les informations du client.", error);
                Swal.fire("Erreur", "Impossible de vérifier votre identité. Veuillez vous reconnecter.", "error");
                setMesTickets([]); // Vider tous les états pour être sûr
                setEquipements([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    // --- ✨ FIN DE LA SECTION CORRIGÉE ✨ ---


    const getFilteredTickets = () => {
        let filtered = mesTickets;
        if (filterTicketStatus !== "") {
            filtered = filtered.filter(t => t.TCKT_statut === filterTicketStatus);
        }
        if (filterTicketUrgency !== "") {
            filtered = filtered.filter(t => t.TCKT_degre_urgence === filterTicketUrgency);
        }
        if (filterTicketEquipment !== "") {
            filtered = filtered.filter(t => t.TCKT_equipement?._id === filterTicketEquipment);
        }
        if (filterTicketPanneType !== "") {
            filtered = filtered.filter(t => t.TCKT_types_pannes?.some(panne => panne.PANN_libelle === filterTicketPanneType));
        }
        return filtered;
    };

    const getFilteredEquipments = () => {
        let filtered = equipements;
        if (filterEquipmentType !== "") {
            filtered = filtered.filter(eq => eq.EQPT_type?.TPEQ_libelle === filterEquipmentType);
        }
        return filtered;
    };

    const getUniqueValues = (data, key, nestedKey) => {
        if (!data || data.length === 0) return [];
        let valuesSet = new Set(); // Utiliser un Set pour l'unicité et la performance
        data.forEach(item => {
            let current = item;
            if (nestedKey) { // Pour TCKT_types_pannes (array) ou EQPT_type (object)
                const mainProp = item[key]; // e.g., item['TCKT_types_pannes'] or item['EQPT_type']
                if (Array.isArray(mainProp)) {
                    mainProp.forEach(subItem => {
                        if (subItem && subItem[nestedKey]) valuesSet.add(subItem[nestedKey]);
                    });
                } else if (mainProp && mainProp[nestedKey]) {
                    valuesSet.add(mainProp[nestedKey]);
                }
            } else if (key.includes('.')) { // Pour 'TCKT_equipement._id'
                const keys = key.split('.');
                for (const k of keys) {
                    current = current?.[k];
                    if (current === undefined || current === null) break;
                }
                if (current !== undefined && current !== null) valuesSet.add(current);
            } else { // Pour 'TCKT_statut'
                if (item[key] !== undefined && item[key] !== null) valuesSet.add(item[key]);
            }
        });
        return Array.from(valuesSet).sort(); // Convertir en tableau trié
    };

    // --- Chart Data Calculation (Using Filtered Data) ---
    const filteredTicketsData = getFilteredTickets();
    const filteredEquipmentsData = getFilteredEquipments();

    const ticketStatusCounts = {};
    filteredTicketsData.forEach((ticket) => {
        const status = ticket.TCKT_statut || "Inconnu";
        ticketStatusCounts[status] = (ticketStatusCounts[status] || 0) + 1;
    });

    const urgencyCounts = {};
    const urgencyOrder = ["faible", "moyenne", "élevée", "Inconnue"];
    urgencyOrder.forEach(u => urgencyCounts[u] = 0); // Initialize for order
    filteredTicketsData.forEach((ticket) => {
        const urgency = ticket.TCKT_degre_urgence || "Inconnue";
        urgencyCounts[urgency] = (urgencyCounts[urgency] || 0) + 1;
    });

    const typeEquipementCount = {};
    filteredEquipmentsData.forEach((eq) => {
        const typeLibelle = eq.EQPT_type?.TPEQ_libelle || "Inconnu";
        typeEquipementCount[typeLibelle] = (typeEquipementCount[typeLibelle] || 0) + 1;
    });

    const panneCount = {};
    let totalFilteredPannesOccurrences = 0;
    filteredEquipmentsData.forEach((eq) => { // Base sur les équipements filtrés
        eq.EQPT_types_pannes?.forEach((panne) => {
            const panneLibelle = panne.PANN_libelle || "Inconnue";
            // Si filterTicketPanneType est actif et ne correspond pas, on saute cette panne
            if (filterTicketPanneType && filterTicketPanneType !== panneLibelle) return;

            panneCount[panneLibelle] = (panneCount[panneLibelle] || 0) + 1;
            totalFilteredPannesOccurrences++;
        });
    });


    // --- Chart.js Data Objects ---
    const chartDataStatuts = {
        labels: Object.keys(ticketStatusCounts),
        datasets: [{
            label: "Nombre de tickets",
            data: Object.values(ticketStatusCounts),
            backgroundColor: Object.keys(ticketStatusCounts).map(status => STATUS_TICKET_COLORS[status] || CHART_COLORS[5]),
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    const chartDataUrgences = {
        labels: urgencyOrder.filter(u => urgencyCounts[u] > 0), // Only show urgencies with data
        datasets: [{
            label: "Nombre de tickets",
            data: urgencyOrder.filter(u => urgencyCounts[u] > 0).map(u => urgencyCounts[u]),
            backgroundColor: urgencyOrder.filter(u => urgencyCounts[u] > 0).map(urgency => URGENCY_TICKET_COLORS[urgency] || CHART_COLORS[5]),
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    const chartTypeData = {
        labels: Object.keys(typeEquipementCount),
        datasets: [{
            label: "Nombre d'équipements",
            data: Object.values(typeEquipementCount),
            backgroundColor: Object.keys(typeEquipementCount).map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    const chartPanneData = {
        labels: Object.keys(panneCount),
        datasets: [{
            label: "Pannes sur équipements",
            data: Object.values(panneCount),
            backgroundColor: Object.keys(panneCount).map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    // --- Chart.js Options (Style Power BI) ---
    const getChartOptions = (chartTitle) => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    display: false, // Style Power BI : grille X souvent absente ou très discrète
                    borderColor: '#e0e0e0',
                },
                ticks: {
                    color: '#595959', // Couleur des ticks X
                    font: { family: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', size: 11 },
                    maxRotation: 30, // Rotation pour lisibilité
                    minRotation: 0,
                },
                border: {
                    color: '#e0e0e0' // Ligne de l'axe X
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    drawBorder: false, // Pas de bordure de grille Y
                    color: '#e0e0e0', // Lignes de grille Y discrètes
                    borderDash: [3, 3], // Pointillés
                },
                ticks: {
                    color: '#595959',
                    font: { family: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', size: 11 },
                    stepSize: 1, // Assurer des entiers si les comptes sont petits
                    callback: function (value) { if (Number.isInteger(value)) { return value; } },
                },
                border: {
                    display: false, // Masquer la ligne de l'axe Y
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    color: '#333333',
                    font: { family: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', size: 12 },
                    boxWidth: 12,
                    padding: 15,
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(255, 255, 255, 0.95)', // Fond blanc pour tooltip
                titleColor: '#111', // Couleur du titre du tooltip
                titleFont: { family: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', weight: '600', size: 14 },
                bodyColor: '#333', // Couleur du corps du tooltip
                bodyFont: { family: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', size: 13 },
                borderColor: '#E0E0E0', // Bordure du tooltip
                borderWidth: 1,
                padding: 10,
                cornerRadius: 4,
                boxPadding: 5,
                callbacks: {
                    label: function (tooltipItem) {
                        const label = tooltipItem.label || '';
                        const value = tooltipItem.raw || 0;
                        return `${label}: ${value}`;
                    },
                    title: function (tooltipItems) {
                        return tooltipItems[0]?.dataset?.label || chartTitle || '';
                    }
                },
                mode: 'index',
                intersect: false,
            },
            title: { // Titre au-dessus du graphique, géré par la carte MUI <Typography variant="h6">
                display: false, // On utilise le titre de la carte MUI
            }
        },
        // Ajout pour les graphiques à barres
        elements: {
            bar: {
                borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 }, // Coins arrondis en haut pour les barres
            }
        }
    });


    const resetFilters = () => {
        setFilterTicketStatus("");
        setFilterTicketUrgency("");
        setFilterTicketEquipment("");
        setFilterTicketPanneType("");
        setFilterEquipmentType("");
    };

    // --- Summary Stats (KPI Cards) ---
    const totalFilteredTickets = filteredTicketsData.length;
    const ticketsOpen = filteredTicketsData.filter(t => t.TCKT_statut === "OUVERT" || t.TCKT_statut === "ouvert").length; // Case insensitive for "ouvert"
    const ticketsInProgress = filteredTicketsData.filter(t => t.TCKT_statut === "EN COURS" || t.TCKT_statut === "en cours").length; // Case insensitive for "en cours"
    const totalFilteredEquipments = filteredEquipmentsData.length;


    const kpiCardsData = [
        { title: "Mes Tickets (Filtrés)", value: totalFilteredTickets, color: "text.primary" },
        { title: "Tickets Ouverts", value: ticketsOpen, color: STATUS_TICKET_COLORS["ouvert"] || "error.main" },
        { title: "Tickets en Cours", value: ticketsInProgress, color: STATUS_TICKET_COLORS["en cours"] || "warning.main" },
        { title: "Mes Équipements (Filtrés)", value: totalFilteredEquipments, color: "text.primary" },
    ];

    const renderKpiCard = (title, value, valueColor = "text.primary") => (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.8rem' }}>
                {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" sx={{ color: valueColor }}>
                {loading ? <CircularProgress size={28} /> : value}
            </Typography>
        </Card>
    );

    const renderChartJsCard = (chartTitle, chartData, chartType = 'bar') => (
        <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h6" sx={{ textAlign: 'left', mb: 2 }}>
                    {chartTitle}
                </Typography>
                {loading ? (
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (!chartData.labels || chartData.labels.length === 0 || chartData.datasets.every(ds => ds.data.length === 0 || ds.data.every(d => d === 0))) ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        Aucune donnée disponible avec les filtres actuels.
                    </Typography>
                ) : (
                    <Box sx={{ flexGrow: 1, position: 'relative', width: '100%', height: 'calc(100% - 40px)' }}> {/* Hauteur relative pour le graphique */}
                        {chartType === 'bar' && <Bar data={chartData} options={getChartOptions(chartTitle)} />}
                        {chartType === 'pie' && <Pie data={chartData} options={getChartOptions(chartTitle)} />} {/* Ajouter support Pie si besoin */}
                    </Box>
                )}
            </CardContent>
        </Card>
    );


    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
            {/* Section du titre et des boutons d'action */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                    Tableau de Bord Client
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end" sx={{ mt: { xs: 2, sm: 0 } }}>

                    <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleExportPdf}>
                        Exporter PDF
                    </Button>
                    <Button variant="outlined" startIcon={<ImageOutlinedIcon />} onClick={handleExportPng}>
                        Exporter PNG
                    </Button>
                    <Button variant="outlined" startIcon={<TableChartIcon />} onClick={handleExportExcel}>
                        Exporter Excel
                    </Button>
                </Stack>
            </Box>

            {/* Contenu principal du Dashboard à imprimer/exporter */}
            {/* Ajoutez la réf 'componentRef' ici */}
            <Box ref={componentRef} sx={{ p: 2, backgroundColor: 'background.paper' }}>

                {/* Filters Section */}
                <Card sx={{ mb: { xs: 2, md: 3 }, p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Filtres
                    </Typography>
                    <Grid container spacing={{ xs: 1.5, md: 2 }}>
                        {/* Filter: Statut Ticket */}
                        <Grid item xs={12} sm={6} md={4} lg={2.4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Statut Ticket</InputLabel>
                                <Select value={filterTicketStatus} label="Statut Ticket" onChange={(e) => setFilterTicketStatus(e.target.value)}>
                                    <MenuItem value="">Tous</MenuItem>
                                    {getUniqueValues(mesTickets, 'TCKT_statut').map((status) => (
                                        <MenuItem key={status} value={status}>{status}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* Filter: Urgence Ticket */}
                        <Grid item xs={12} sm={6} md={4} lg={2.4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Urgence Ticket</InputLabel>
                                <Select value={filterTicketUrgency} label="Urgence Ticket" onChange={(e) => setFilterTicketUrgency(e.target.value)}>
                                    <MenuItem value="">Toutes</MenuItem>
                                    {urgencyOrder.map((urgency) => (<MenuItem key={urgency} value={urgency}>{urgency}</MenuItem>))}
                                    {getUniqueValues(mesTickets, 'TCKT_degre_urgence').filter(u => !urgencyOrder.includes(u)).map(u => (<MenuItem key={u} value={u}>{u}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* Filter: Équipement du Ticket */}
                        <Grid item xs={12} sm={6} md={4} lg={2.4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Équipement (Ticket)</InputLabel>
                                <Select value={filterTicketEquipment} label="Équipement (Ticket)" onChange={(e) => setFilterTicketEquipment(e.target.value)}>
                                    <MenuItem value="">Tous</MenuItem>
                                    {equipements.map((equip) => (
                                        <MenuItem key={equip._id} value={equip._id}>{equip.EQPT_denomination || equip.EQPT_code || equip._id}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* Filter: Type Panne du Ticket */}
                        <Grid item xs={12} sm={6} md={4} lg={2.4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Type Panne (Ticket)</InputLabel>
                                <Select value={filterTicketPanneType} label="Type Panne (Ticket)" onChange={(e) => setFilterTicketPanneType(e.target.value)}>
                                    <MenuItem value="">Toutes</MenuItem>
                                    {getUniqueValues(mesTickets, 'TCKT_types_pannes', 'PANN_libelle').map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* Filter: Type d'Équipement (pour graphiques équipements) */}
                        <Grid item xs={12} sm={6} md={4} lg={2.4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Type d'Équipement</InputLabel>
                                <Select value={filterEquipmentType} label="Type d'Équipement" onChange={(e) => setFilterEquipmentType(e.target.value)}>
                                    <MenuItem value="">Tous</MenuItem>
                                    {getUniqueValues(equipements, 'EQPT_type', 'TPEQ_libelle').map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* Reset Filters Button */}
                        <Grid item xs={12} display="flex" justifyContent="flex-end" alignItems="center" sx={{ pt: { xs: 1, md: 1.5 } }}>
                            <Button variant="outlined" onClick={resetFilters}>
                                Réinitialiser
                            </Button>
                        </Grid>
                    </Grid>
                </Card>

                {/* Summary Stats Section (KPI Cards) */}
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 2, md: 3 } }}>
                    {kpiCardsData.map(kpi => (
                        <Grid item xs={6} sm={6} md={3} key={kpi.title}>
                            {renderKpiCard(kpi.title, kpi.value, kpi.color)}
                        </Grid>
                    ))}
                </Grid>

                {/* Charts Section */}
                <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                    <Grid item xs={12} md={6} lg={6}>
                        {renderChartJsCard("Tickets par Statut", chartDataStatuts, 'bar')}
                    </Grid>
                    <Grid item xs={12} md={6} lg={6}>
                        {renderChartJsCard("Tickets par Urgence", chartDataUrgences, 'bar')}
                    </Grid>
                    <Grid item xs={12} md={6} lg={6}>
                        {renderChartJsCard("Mes Équipements par Type", chartTypeData, 'bar')}
                    </Grid>
                    <Grid item xs={12} md={6} lg={6}>
                        {renderChartJsCard("Pannes sur mes Équipements", chartPanneData, 'bar')}
                    </Grid>
                </Grid>
            </Box>
              {/* Snackbar for welcome message */}
                        <Snackbar
                            open={showWelcomeMessage && loggedInUser !== null} // Only show if user data is loaded
                            autoHideDuration={6000} // Disappears after 6 seconds
                            onClose={handleCloseWelcomeMessage}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        >
                            <Alert onClose={handleCloseWelcomeMessage} severity="success" sx={{ width: '100%' }}>
                                Bienvenue, {loggedInUser?.CLNT_raison_sociale} ({loggedInUser?.CLNT_code})!
                            </Alert>
                        </Snackbar>
        </Container>
    );
};

export default DashboardClient;
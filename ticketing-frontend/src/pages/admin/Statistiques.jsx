import React, { useEffect, useState, useMemo, useRef } from "react"; // Import useRef
import { Box, Typography, Grid, Paper, CircularProgress, Button, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  getStats,
  getClientTicketStats,
  getEfficiencyIndicators,
  getTicketStatsByDate,
  getTotalTimePerTechnician,
  getAverageTicketDurationPerClient,
} from "../../api/api";
import { blue, grey, green, red } from "@mui/material/colors";

// Import new libraries for export
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from 'xlsx'; // For Excel export
import { saveAs } from 'file-saver'; // For saving files

const Statistiques = () => {
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState(null);
  const [clientTicketStats, setClientTicketStats] = useState(null);
  const [performanceIndicators, setPerformanceIndicators] = useState(null);
  const [ticketStatsByDateRange, setTicketStatsByDateRange] = useState(null);

  const [technicianTotalTimeStats, setTechnicianTotalTimeStats] = useState([]);
  const [clientAverageDurationStats, setClientAverageDurationStats] = useState([]);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [error, setError] = useState(null);

  // Ref for the content to be exported
  const contentRef = useRef(null);
  const ticketsByStatusChartRef = useRef(null); // Ref for the BarChart specifically

  useEffect(() => {
    const fetchAllStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          overallStatsData,
          clientTicketStatsData,
          performanceIndicatorsData,
          technicianTotalTimeData,
          clientAverageDurationData,
        ] = await Promise.all([
          getStats(),
          getClientTicketStats(),
          getEfficiencyIndicators(),
          getTotalTimePerTechnician(),
          getAverageTicketDurationPerClient(),
        ]);

        setOverallStats(overallStatsData);
        setClientTicketStats(clientTicketStatsData);
        setPerformanceIndicators(performanceIndicatorsData);
        setTechnicianTotalTimeStats(technicianTotalTimeData || []);
        setClientAverageDurationStats(clientAverageDurationData || []);
      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err);
        setError("Impossible de charger certaines statistiques. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  const fetchTicketStatsByDateRange = async () => {
    if (!startDate || !endDate) {
      console.warn("Veuillez sélectionner une plage de dates.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const data = await getTicketStatsByDate(formattedStartDate, formattedEndDate);
      setTicketStatsByDateRange(data);
    } catch (err) {
      console.error("Erreur chargement stats par date:", err);
      setError("Impossible de charger les statistiques par plage de dates.");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Export Functions

  // Export to PDF
  const handleExportPdf = async () => {
    setLoading(true);
    try {
      // Capture the content of the main Box
      const element = contentRef.current;
      const canvas = await html2canvas(element, { scale: 2 }); // Scale for better resolution
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("statistiques.pdf");
    } catch (err) {
      console.error("Erreur lors de l'exportation PDF:", err);
      setError("Erreur lors de l'exportation PDF.");
    } finally {
      setLoading(false);
    }
  };

  // Export to PNG (for the whole dashboard or specific charts)
  const handleExportPng = async () => {
    setLoading(true);
    try {
      const element = contentRef.current; // Or ticketsByStatusChartRef.current for just the chart
      const canvas = await html2canvas(element, { scale: 2 });
      canvas.toBlob(function(blob) {
        saveAs(blob, "statistiques.png");
      });
    } catch (err) {
      console.error("Erreur lors de l'exportation PNG:", err);
      setError("Erreur lors de l'exportation PNG.");
    } finally {
      setLoading(false);
    }
  };


  // Export to Excel (data only, graphs as images is more complex for client-side)
  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Overall Stats
      if (overallStats) {
        const wsData = [
          ["Statistique", "Valeur"],
          ["Total Clients", overallStats.totalClients ?? 'N/A'],
          ["Total Tickets", overallStats.totalTickets ?? 'N/A'],
          ["Total Techniciens", overallStats.totalTechniciens ?? 'N/A'],
          ["Total Equipements", overallStats.totalEquipments ?? 'N/A'],
          ["Total Interventions", overallStats.totalInterventions ?? 'N/A'],
        ];
        if (overallStats.ticketsByStatus && overallStats.ticketsByStatus.length > 0) {
            wsData.push(["Tickets par Statut"]);
            overallStats.ticketsByStatus.forEach(item => {
                wsData.push([`  ${item._id}`, item.count]);
            });
        }
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, "Statistiques Globales");
      }

      // Sheet 2: Performance Indicators
      if (performanceIndicators) {
        const wsData = [
          ["Indicateur", "Valeur"],
          ["Temps Moyen Résolution (heures)", performanceIndicators.avgResolutionTime !== undefined ? performanceIndicators.avgResolutionTime.toFixed(2) : 'N/A'],
          ["Taux Résolution Rapide (<24h) (%)", performanceIndicators.quickResolutionRate !== undefined ? performanceIndicators.quickResolutionRate.toFixed(2) : 'N/A'],
          ["Tickets Assignés/Technicien (Moy)", performanceIndicators.avgTicketsPerTechnician !== undefined ? performanceIndicators.avgTicketsPerTechnician.toFixed(2) : 'N/A'],
          ["Tickets Non Résolus", performanceIndicators.unresolvedTickets ?? 'N/A'],
          ["Interventions Totales", performanceIndicators.totalInterventions ?? 'N/A'],
          ["Tickets Totaux (Indicateurs)", performanceIndicators.totalTickets ?? 'N/A'],
          ["Tickets Assignés Totaux", performanceIndicators.assignedTicketsCount ?? 'N/A'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, "Indicateurs Performance");
      }

      // Sheet 3: Tickets by Client
      if (clientTicketStats && clientTicketStats.length > 0) {
        const wsData = [["Client", "Code Client", "Total Tickets"]];
        clientTicketStats.forEach(client => {
          wsData.push([client.clientName, client.clientCode, client.totalTickets]);
        });
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, "Tickets par Client");
      }

      // Sheet 4: Total Time per Technician
      if (technicianTotalTimeStats && technicianTotalTimeStats.length > 0) {
        const wsData = [["Technicien", "Code Technicien", "Temps Total (heures)"]];
        technicianTotalTimeStats.forEach(tech => {
          wsData.push([tech.technicienName, tech.technicienCode, tech.totalTimeHours !== undefined ? tech.totalTimeHours.toFixed(2) : 'N/A']);
        });
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, "Temps par Technicien");
      }

      // Sheet 5: Average Ticket Duration per Client
      if (clientAverageDurationStats && clientAverageDurationStats.length > 0) {
        const wsData = [["Client", "Code Client", "Durée Moyenne (heures)", "Nombre de Tickets"]];
        clientAverageDurationStats.forEach(client => {
          wsData.push([
            client.clientName,
            client.clientCode,
            client.averageTicketDurationHours !== undefined ? client.averageTicketDurationHours.toFixed(2) : 'N/A',
            client.ticketsCount ?? 'N/A'
          ]);
        });
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(workbook, ws, "Durée Moyenne Tickets Client");
      }

      // Sheet 6: Tickets by Date Range
      if (ticketStatsByDateRange) {
          const wsData = [
              ["Statistique", "Valeur"],
              [`Total Tickets (${format(startDate, 'yyyy-MM-dd')} à ${format(endDate, 'yyyy-MM-dd')})`, ticketStatsByDateRange.totalTicketsInRange ?? 'N/A']
          ];
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          XLSX.utils.book_append_sheet(workbook, ws, "Tickets par Date");
      }

      // Export the workbook
      XLSX.writeFile(workbook, "statistiques.xlsx");

      // For graphs in Excel: This is complex client-side. You'd typically convert the chart's SVG to an image
      // (e.g., using html2canvas on the chart's ref) and then use a more advanced XLSX feature to embed the image.
      // This goes beyond simple data export and often requires server-side processing for true native charts.
      // For this request, we are only exporting data for Excel.
    } catch (err) {
      console.error("Erreur lors de l'exportation Excel:", err);
      setError("Erreur lors de l'exportation Excel.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Box sx={{ padding: 3, backgroundColor: "#f4f6f8", minHeight: "100vh" }} ref={contentRef}> {/* Apply ref here */}
      <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 4, textAlign: 'center', color: blue[800] }}>
        📊 Tableau de Bord des Statistiques
      </Typography>

      {/* Export Buttons Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExportPdf}
          disabled={loading || error}
        >
          Exporter en PDF
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleExportExcel}
          disabled={loading || error}
        >
          Exporter en Excel
        </Button>
        <Button
          variant="contained"
          color="info"
          onClick={handleExportPng}
          disabled={loading || error}
        >
          Exporter en PNG
        </Button>
      </Box>

      {/* Afficher un indicateur de chargement pendant le chargement initial */}
      {loading && !overallStats && technicianTotalTimeStats.length === 0 && clientAverageDurationStats.length === 0 && !performanceIndicators ? (
         <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
           <CircularProgress size={60} />
           <Typography variant="h6" sx={{ ml: 2 }}>Chargement des données...</Typography>
         </Box>
      ) : error ? (
         <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
           <Typography variant="h6" color="error">{error}</Typography>
         </Box>
      ) : (
        <Grid container spacing={3}>
          {overallStats && (
            <>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom sx={{ color: blue[700], borderBottom: `2px solid ${blue[200]}`, pb: 1, mb: 2 }}>
                  Statistiques Générales
                </Typography>
              </Grid>
              <Grid item xs={12} container spacing={3}>
                 <Grid item xs={12} sm={6} md={3}>
                   <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                      <Typography variant="h6" color="textSecondary">Total Clients</Typography>
                      <Typography variant="h5" color="primary.main">{overallStats.totalClients ?? 'N/A'}</Typography>
                   </Paper>
                 </Grid>
                 <Grid item xs={12} sm={6} md={3}>
                   <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                      <Typography variant="h6" color="textSecondary">Total Tickets</Typography>
                      <Typography variant="h5" color="primary.main">{overallStats.totalTickets ?? 'N/A'}</Typography>
                   </Paper>
                 </Grid>
                 <Grid item xs={12} sm={6} md={3}>
                   <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                      <Typography variant="h6" color="textSecondary">Total Techniciens</Typography>
                      <Typography variant="h5" color="primary.main">{overallStats.totalTechniciens ?? 'N/A'}</Typography>
                   </Paper>
                 </Grid>
                   <Grid item xs={12} sm={6} md={3}>
                       <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                           <Typography variant="h6" color="textSecondary">Total Equipements</Typography>
                           <Typography variant="h5" color="primary.main">{overallStats.totalEquipments ?? 'N/A'}</Typography>
                       </Paper>
                   </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                       <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                           <Typography variant="h6" color="textSecondary">Total Interventions</Typography>
                           <Typography variant="h5" color="primary.main">{overallStats.totalInterventions ?? 'N/A'}</Typography>
                       </Paper>
                   </Grid>

              </Grid>

                {overallStats.ticketsByStatus && overallStats.ticketsByStatus.length > 0 && (
                   <Grid item xs={12}>
                       <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>Tickets par Statut</Typography>
                        <Box sx={{ height: 300, width: '100%' }} ref={ticketsByStatusChartRef}> {/* Apply ref to the chart container */}
                           <ResponsiveContainer>
                               <BarChart
                                   data={overallStats.ticketsByStatus}
                                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                               >
                                   <CartesianGrid strokeDasharray="3 3" />
                                   <XAxis dataKey="_id" />
                                   <YAxis />
                                   <Tooltip />
                                   <Legend />
                                   <Bar dataKey="count" fill={blue[500]} />
                               </BarChart>
                           </ResponsiveContainer>
                       </Box>
                   </Grid>
                )}
            </>
          )}

           {performanceIndicators && (
                <Grid item xs={12}>
                     <Typography variant="h5" gutterBottom sx={{ mt: 4, color: green[800], borderBottom: `2px solid ${green[200]}`, pb: 1, mb: 2 }}>
                        Indicateurs d'Efficacité
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4}>
                             <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                 <Typography variant="h6" color="textSecondary">Temps Moyen Résolution</Typography>
                                 <Typography variant="h5" color="primary.main">
                                     {performanceIndicators.avgResolutionTime !== undefined ? `${performanceIndicators.avgResolutionTime.toFixed(2)} heures` : 'N/A'}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                             <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                <Typography variant="h6" color="textSecondary">Taux Résolution Rapide (&lt;24h)</Typography>
                                <Typography variant="h5" color="primary.main">
                                     {performanceIndicators.quickResolutionRate !== undefined ? `${performanceIndicators.quickResolutionRate.toFixed(2)} %` : 'N/A'}
                                </Typography>
                            </Paper>
                        </Grid>
                         <Grid item xs={12} sm={6} md={4}>
                             <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                <Typography variant="h6" color="textSecondary">Tickets Assignés/Technicien (Moy)</Typography>
                                <Typography variant="h5" color="primary.main">
                                     {performanceIndicators.avgTicketsPerTechnician !== undefined ? performanceIndicators.avgTicketsPerTechnician.toFixed(2) : 'N/A'}
                                </Typography>
                            </Paper>
                         </Grid>
                         <Grid item xs={12} sm={6} md={4}>
                             <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                <Typography variant="h6" color="textSecondary">Tickets Non Résolus</Typography>
                                <Typography variant="h5" color="primary.main">{performanceIndicators.unresolvedTickets ?? 'N/A'}</Typography>
                             </Paper>
                         </Grid>
                         <Grid item xs={12} sm={6} md={4}>
                             <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                 <Typography variant="h6" color="textSecondary">Interventions Totales (Indicateurs)</Typography>
                                 <Typography variant="h5" color="primary.main">{performanceIndicators.totalInterventions ?? 'N/A'}</Typography>
                             </Paper>
                         </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                             <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                 <Typography variant="h6" color="textSecondary">Tickets Totaux (Indicateurs)</Typography>
                                 <Typography variant="h5" color="primary.main">{performanceIndicators.totalTickets ?? 'N/A'}</Typography>
                             </Paper>
                         </Grid>
                           <Grid item xs={12} sm={6} md={4}>
                             <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                <Typography variant="h6" color="textSecondary">Tickets Assignés Totaux</Typography>
                                <Typography variant="h5" color="primary.main">{performanceIndicators.assignedTicketsCount ?? 'N/A'}</Typography>
                             </Paper>
                          </Grid>
                    </Grid>
                </Grid>
           )}

          {clientTicketStats && Array.isArray(clientTicketStats) && clientTicketStats.length > 0 && (
             <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ mt: 4, color: blue[700], borderBottom: `2px solid ${blue[200]}`, pb: 1, mb: 2 }}>
                    Nombre de Demandes par Client
                  </Typography>
                   <Grid container spacing={3}>
                       {clientTicketStats.map(client => (
                           <Grid item xs={12} sm={6} md={4} key={client.clientId}>
                               <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                   <Typography variant="h6" color="textSecondary">{client.clientName} ({client.clientCode})</Typography>
                                   <Typography variant="h5" color="primary.main">{client.totalTickets ?? 0} tickets</Typography>
                               </Paper>
                           </Grid>
                       ))}
                   </Grid>
              </Grid>
          )}

            {technicianTotalTimeStats && Array.isArray(technicianTotalTimeStats) && technicianTotalTimeStats.length > 0 && (
               <Grid item xs={12}>
                   <Typography variant="h5" gutterBottom sx={{ mt: 4, color: blue[700], borderBottom: `2px solid ${blue[200]}`, pb: 1, mb: 2 }}>
                       Temps Total Passé sur Interventions par Technicien
                   </Typography>
                   <Grid container spacing={3}>
                       {technicianTotalTimeStats.map(tech => (
                            <Grid item xs={12} sm={6} md={4} key={tech.technicienId}>
                                <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                   <Typography variant="h6" color="textSecondary">{tech.technicienName} ({tech.technicienCode})</Typography>
                                   <Typography variant="h5" color="primary.main">
                                       {tech.totalTimeHours !== undefined ? `${tech.totalTimeHours.toFixed(2)} heures` : 'N/A'}
                                    </Typography>
                                </Paper>
                            </Grid>
                       ))}
                   </Grid>
               </Grid>
            )}

           {clientAverageDurationStats && Array.isArray(clientAverageDurationStats) && clientAverageDurationStats.length > 0 && (
              <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ mt: 4, color: blue[700], borderBottom: `2px solid ${blue[200]}`, pb: 1, mb: 2 }}>
                      Durée Moyenne des Tickets Résolus par Client
                  </Typography>
                  <Grid container spacing={3}>
                      {clientAverageDurationStats.map(client => (
                          <Grid item xs={12} sm={6} md={4} key={client.clientId}>
                              <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50] }}>
                                  <Typography variant="h6" color="textSecondary">{client.clientName} ({client.clientCode})</Typography>
                                  <Typography variant="h5" color="primary.main">
                                      {client.averageTicketDurationHours !== undefined ? `${client.averageTicketDurationHours.toFixed(2)} heures` : 'N/A'}
                                      {client.ticketsCount !== undefined && (
                                           <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                              (sur {client.ticketsCount} tickets)
                                           </Typography>
                                      )}
                                  </Typography>
                              </Paper>
                          </Grid>
                      ))}
                  </Grid>
               </Grid>
           )}

           <Grid item xs={12}>
               <Typography variant="h5" gutterBottom sx={{ mt: 4, color: blue[700], borderBottom: `2px solid ${blue[200]}`, pb: 1, mb: 2 }}>
                   Statistiques Tickets par Plage de Dates
               </Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <DatePicker
                            label="Date de début"
                            value={startDate}
                            onChange={(newValue) => setStartDate(newValue)}
                            renderInput={(params) => <TextField {...params} size="small" />}
                        />
                        <DatePicker
                            label="Date de fin"
                            value={endDate}
                            onChange={(newValue) => setEndDate(newValue)}
                             renderInput={(params) => <TextField {...params} size="small" />}
                        />
                        <Button
                           variant="contained"
                           onClick={fetchTicketStatsByDateRange}
                           disabled={!startDate || !endDate || loading}
                         >
                            Filtrer par Date
                        </Button>
                    </Box>
                </LocalizationProvider>

                 {ticketStatsByDateRange && (
                     <Paper elevation={3} sx={{ padding: 2, borderRadius: 2, boxShadow: 3, bgcolor: grey[50], mt: 2 }}>
                         <Typography variant="h6" color="textSecondary">Total Tickets Créés dans la Période Sélectionnée</Typography>
                         <Typography variant="h5" color="primary.main">
                             {ticketStatsByDateRange.totalTicketsInRange ?? 'N/A'} tickets
                         </Typography>
                     </Paper>
                 )}
                  {!ticketStatsByDateRange && !startDate && !endDate && (
                       <Typography variant="body1" color="textSecondary">
                            Sélectionnez une plage de dates pour voir les statistiques.
                       </Typography>
                  )}

           </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Statistiques;
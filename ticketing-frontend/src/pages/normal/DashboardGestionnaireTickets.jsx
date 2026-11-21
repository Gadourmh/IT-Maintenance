import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, CardContent, Typography, Box, CircularProgress,
  Container, Button, Stack
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import RefreshIcon from "@mui/icons-material/Refresh"; // Pour le bouton de rechargement
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Dashboard = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef();
  const navigate = useNavigate();

  // Remplacez cette valeur par le code iframe généré via "Publish to Web" dans Power BI Service
  const [iframeCode, setIframeCode] = useState('<iframe title="TableauDeBord_GestionnaireTickets" width="100%" height="90%" src="https://app.powerbi.com/view?r=eyJrIjoiYzkwZDk4ZTItY2NmNC00OGY5LTk4NGQtNTEzNTc0NDk4N2FlIiwidCI6IjRkOGYzM2RhLWFkOTctNDZkOC1iY2YzLTQ4YmE4YzI0MDA3MCJ9" frameborder="0" allowFullScreen="true"></iframe>');

  useEffect(() => {
    // Validation basique du code iframe
    if (!iframeCode || !iframeCode.includes("<iframe")) {
      setError("Le code iframe est invalide ou manquant. Veuillez le remplacer par le code généré via 'Publish to Web' dans Power BI.");
    }
  }, [iframeCode]);

  // Fonction pour recharger l'iframe (simule un rafraîchissement)
  const handleRefresh = () => {
    setLoading(true);
    // Ici, vous ne pouvez pas recharger dynamiquement sans API, mais vous pouvez forcer un re-render
    setTimeout(() => {
      // Simule un rechargement (en pratique, vous devrez republier ou attendre le rafraîchissement Power BI)
      setLoading(false);
    }, 1000); // Délai simulé
  };

  // --- Gestion de l'exportation PDF ---
  const handleExportPdf = async () => {
    const element = componentRef.current;
    const canvas = await html2canvas(element, { scale: 2, logging: true, useCORS: true });
    const imgData = canvas.toDataURL("https://app.powerbi.com/reportEmbed?reportId=00c8be02-ef27-42be-b9e2-eec08ad18264&autoAuth=true&ctid=4d8f33da-ad97-46d8-bcf3-48ba8c240070");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save("PowerBIDashboard.pdf");
  };

  // --- Gestion de l'exportation PNG ---
  const handleExportPng = async () => {
    const element = componentRef.current;
    const canvas = await html2canvas(element, { scale: 2, logging: true, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = "PowerBIDashboard.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth={false} sx={{ py: 0, px: 0, width:"100", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Section du titre et des boutons d'action */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, px: 3, height: "60px", flexShrink: 0 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: { xs: "center", sm: "left" } }}>
          Tableau de Bord Power BI
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap" justifyContent="flex-end" sx={{ mt: { xs: 1, sm: 0 } }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Rafraîchir"}
          </Button>
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handleExportPdf}>
            Exporter PDF
          </Button>
          <Button variant="outlined" startIcon={<ImageOutlinedIcon />} onClick={handleExportPng}>
            Exporter PNG
          </Button>
        </Stack>
      </Box>

      {/* Contenu principal du Dashboard à imprimer/exporter */}
      <Box ref={componentRef} sx={{ flexGrow: 1, p: 0, backgroundColor: "background.paper", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Card sx={{ flexGrow: 1, p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <CardContent sx={{ flexGrow: 1, p: 0, "&:last-child": { pb: 0 }, height: "100%", display: "flex", flexDirection: "column" }}>
            {error ? (
              <Typography variant="body2" color="error" sx={{ textAlign: "center", py: 2, flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {error}
              </Typography>
            ) : loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <CircularProgress />
              </Box>
            ) : iframeCode ? (
              <Box sx={{ flexGrow: 1, width: "100%", position: "relative", paddingBottom: "56.25%" /* Ratio 16:9, ajustable selon le tableau */ }}>
                <div
                  dangerouslySetInnerHTML={{ __html: iframeCode }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2, flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                Chargement du tableau de bord...
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Dashboard;
import React, { useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Container,
    styled,
    useTheme,
    CircularProgress,
    useMediaQuery // Importez useMediaQuery
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import InfoIcon from "@mui/icons-material/Info";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import LoginIcon from "@mui/icons-material/Login";
import EngineeringIcon from "@mui/icons-material/Engineering";
import DevicesIcon from "@mui/icons-material/Devices";
import BuildIcon from "@mui/icons-material/Build";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { CommentBank } from "@mui/icons-material";

import Footer from "../../components/layout/Footer";
import { useAuth } from "../../context/AuthContext";
import AvisSection from "../shared/AvisSection";


const animationStyles = `
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes slideInUp {
    0% {
      transform: translateY(50px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;


const Home = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Détecte si l'écran est mobile


    useEffect(() => {
        if (!loading && user) {
            switch (user.role) {
                case "ADMIN":
                case "SUPER_ADMIN":
                    navigate("/dashboard");
                    break;
                case "TECHNICIEN":
                    navigate("/dashboard-technicien");
                    break;
                case "CLIENT":
                    navigate("/dashboard-client");
                    break;
                case "NORMAL":
                    switch (user.fonction) {
                        case "CHEF_SERVICE":
                            navigate("/dashboard-chef-service");
                            break;
                        case "RESPONSABLE_MAINTENANCE":
                            navigate("/dashboard-responsable-maintenance");
                            break;
                        case "GESTIONNAIRE_TICKETS":
                            navigate("/dashboard-GestionnaireTickets");
                            break;
                        case "SECRÉTAIRE":
                            navigate("/dashboard-Secretaire");
                            break;
                        case "COMPTABLE":
                            navigate("/dashboard-Comptable");
                            break;
                        case "RH":
                            navigate("/dashboard-Rh");
                            break;
                        case "SUPPORT_CLIENT":
                            navigate("/dashboard-SupportClient");
                            break;
                        default:
                            navigate("/dashboard-normal-default");
                            break;
                    }
                    break;
                default:
                    navigate("/login");
                    break;
            }
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Chargement...</Typography>
            </Box>
        );
    }

    return (
        <>
            {/* Conteneur principal pour toute la page avec l'image de fond */}
            {/* *** POINT D'OPTIMISATION MAJEUR : ASSUREZ-VOUS QUE L'IMAGE /assets/images/R.jpg EST TRÈS BIEN OPTIMISÉE POUR LE WEB (compression, format) *** */}
            <Box
                sx={{
                    minHeight: "100vh",
                    width: "100%",
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url('/assets/images/R.jpg')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    // --- MODIFICATION : Ajuste backgroundAttachment pour mobile ---
                    backgroundAttachment: isMobile ? 'scroll' : 'fixed', // 'scroll' sur mobile, 'fixed' sur bureau
                    // --- FIN MODIFICATION ---
                    color: "#fff",
                    display: 'flex',
                    flexDirection: 'column',
                    animation: "fadeIn 2s ease-in-out",
                    // Ajouté précédemment pour masquer le flash initial
                    backgroundColor: '#1A364B',
                }}
            >
                <Box sx={{ flexGrow: 1 }}>
                    <Box>

                        {/* Section Titre Principal */}
                        <Box
                            sx={{
                                // --- MODIFICATION : Ajuste le padding vertical pour mobile ---
                                paddingTop: { xs: '80px', sm: '64px' }, // Plus de padding en haut sur mobile pour laisser place à la Navbar (peut nécessiter ajustement)
                                paddingBottom: { xs: theme.spacing(4), md: theme.spacing(10) }, // Moins de padding en bas sur mobile
                                // --- FIN MODIFICATION ---
                                textAlign: 'center',
                            }}
                        >
                            <Container
                                maxWidth="md"
                                sx={{
                                    position: "relative",
                                    zIndex: 2,
                                    animation: "slideInUp 1s ease-out",
                                    // --- MODIFICATION : Ajoute un padding horizontal sur mobile si nécessaire ---
                                     px: { xs: 2, md: 0 }, // Ajoute un padding de 2 unités sur les côtés en mobile
                                    // --- FIN MODIFICATION ---
                                }}
                            >
                                <Typography
                                    variant="h3"
                                    component="h1"
                                    fontWeight="bold"
                                    gutterBottom
                                    sx={{
                                        textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
                                        // Les tailles de police sont déjà responsives, ajustement mineur
                                        fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' }, // Ajusté un peu la taille XS
                                    }}
                                >
                                    Bienvenue sur notre plateforme de gestion des tickets
                                </Typography>
                                <Typography fontWeight="bold" variant="h6" component="p"
                                    sx={{
                                        opacity: 1,
                                        mb: { xs: 4, md: 6 }, // Moins de marge en bas sur mobile
                                        // Les tailles de police sont déjà responsives, ajustement mineur
                                        fontSize: { xs: '1rem', sm: '1.25rem' }, // Ajusté un peu la taille XS/SM
                                        color: 'white',
                                    }}
                                >
                                    <b> Simplifiez la maintenance, centralisez les demandes, suivez les interventions.</b>
                                </Typography>

                                {/* --- MODIFICATION : Ajuste l'espacement des grilles pour mobile --- */}
                                <Grid container spacing={isMobile ? 2 : 4} justifyContent="center"> {/* Moins d'espacement entre les cartes sur mobile */}
                                    {/* FIN MODIFICATION --- */}
                                    {!user && (
                                        <Grid item xs={12} sm={6} md={4}>
                                            <Card
                                                sx={{
                                                    borderRadius: 3,
                                                    boxShadow: 4,
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    backdropFilter: 'blur(5px)',
                                                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                                    "&:hover": { transform: "scale(1.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
                                                    animation: "fadeIn 1.5s ease-in-out",
                                                    height: '100%',
                                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                                                }}
                                            >
                                                <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                                                    {/* --- MODIFICATION : Ajuste taille icône mobile --- */}
                                                    <LoginIcon sx={{ fontSize: isMobile ? 40 : 50, color: theme.palette.primary.main, mb: 2 }} />
                                                    {/* FIN MODIFICATION --- */}
                                                    <Typography variant="h6" component="h2" gutterBottom fontWeight="bold"
                                                        sx={{ fontSize: isMobile ? '1.1rem' : 'h6.fontSize' }} // Ajuste taille titre carte mobile
                                                    >
                                                        Connexion
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary"
                                                        sx={{ mb: 2, fontSize: isMobile ? '0.875rem' : 'body2.fontSize' }} // Ajuste taille texte carte mobile
                                                    >
                                                        Accédez à votre espace personnel pour gérer vos tickets et vos informations.
                                                    </Typography>
                                                </CardContent>
                                                <Box sx={{ p: isMobile ? 1 : 2 }}> {/* Moins de padding sur le bouton sur mobile */}
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => navigate("/login")}
                                                        fullWidth
                                                        size={isMobile ? 'medium' : 'large'} // Ajuste taille bouton mobile
                                                    >
                                                        Accéder
                                                    </Button>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    )}
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card
                                            sx={{
                                                borderRadius: 3,
                                                boxShadow: 4,
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                backdropFilter: 'blur(5px)',
                                                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                                "&:hover": { transform: "scale(1.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
                                                animation: "fadeIn 1.5s ease-in-out",
                                                height: '100%',
                                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                                            }}
                                        >
                                            <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                                                {/* --- MODIFICATION : Ajuste taille icône mobile --- */}
                                                <InfoIcon sx={{ fontSize: isMobile ? 40 : 50, color: theme.palette.primary.main, mb: 2 }} />
                                                {/* FIN MODIFICATION --- */}
                                                <Typography variant="h6" component="h2" gutterBottom fontWeight="bold"
                                                    sx={{ fontSize: isMobile ? '1.1rem' : 'h6.fontSize' }} // Ajuste taille titre carte mobile
                                                >
                                                    À propos
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary"
                                                    sx={{ mb: 2, fontSize: isMobile ? '0.875rem' : 'body2.fontSize' }} // Ajuste taille texte carte mobile
                                                >
                                                    Découvrez notre mission, notre équipe et les avantages de notre solution de ticketing.
                                                </Typography>
                                            </CardContent>
                                            <Box sx={{ p: isMobile ? 1 : 2 }}> {/* Moins de padding sur le bouton sur mobile */}
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => navigate("/about")}
                                                    fullWidth
                                                    size={isMobile ? 'medium' : 'large'} // Ajuste taille bouton mobile
                                                >
                                                    En savoir plus
                                                </Button>
                                            </Box>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card
                                            sx={{
                                                borderRadius: 3,
                                                boxShadow: 4,
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                backdropFilter: 'blur(5px)',
                                                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                                "&:hover": { transform: "scale(1.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
                                                animation: "fadeIn 1.5s ease-in-out",
                                                height: '100%',
                                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                                            }}
                                        >
                                            <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                                                {/* --- MODIFICATION : Ajuste taille icône mobile --- */}
                                                <ContactMailIcon sx={{ fontSize: isMobile ? 40 : 50, color: theme.palette.secondary.main, mb: 2 }} />
                                                {/* FIN MODIFICATION --- */}
                                                <Typography variant="h6" component="h2" gutterBottom fontWeight="bold"
                                                    sx={{ fontSize: isMobile ? '1.1rem' : 'h6.fontSize' }} // Ajuste taille titre carte mobile
                                                >
                                                    Contact
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary"
                                                    sx={{ mb: 2, fontSize: isMobile ? '0.875rem' : 'body2.fontSize' }} // Ajuste taille texte carte mobile
                                                >
                                                    Besoin d'aide ou avez des questions ? Contactez-nous directement via notre formulaire.
                                                </Typography>
                                            </CardContent>
                                            <Box sx={{ p: isMobile ? 1 : 2 }}> {/* Moins de padding sur le bouton sur mobile */}
                                                <Button
                                                    variant="outlined"
                                                    color="secondary"
                                                    onClick={() => navigate("/contact")}
                                                    fullWidth
                                                    size={isMobile ? 'medium' : 'large'} // Ajuste taille bouton mobile
                                                >
                                                    Nous écrire
                                                </Button>
                                            </Box>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Container>
                        </Box>


                        {/* SECTION DESCRIPTION ou FONCTIONNALITÉS */}
                        {/* --- MODIFICATION : Ajuste le padding vertical et l'espacement des grilles pour mobile --- */}
                        <Box sx={{ py: { xs: 6, md: 8 } }}> {/* Moins de padding vertical sur mobile */}
                            <Container maxWidth="lg">
                                <Typography variant="h4" component="h2" textAlign="center" fontWeight="bold" gutterBottom
                                    sx={{
                                        mb: { xs: 4, md: 6 }, // Moins de marge en bas sur mobile
                                        fontSize: { xs: '1.8rem', sm: '2rem', md: 'h4.fontSize' } ,// Ajuste taille titre section mobile
                                        color : "white"
                                   
                                    }}
                                >
                                    Pourquoi choisir notre plateforme ?
                                </Typography>
                                <Grid container spacing={isMobile ? 2 : 4} justifyContent="center"> {/* Moins d'espacement entre les cartes sur mobile */}
                                    {/* Chaque fonctionnalité devient une Card */}
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card
                                            sx={{
                                                borderRadius: 3,
                                                boxShadow: 4,
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                backdropFilter: 'blur(5px)',
                                                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                                "&:hover": { transform: "scale(1.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
                                                height: '100%',
                                                display: 'flex', flexDirection: 'column'
                                            }}
                                        >
                                            <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                                                {/* --- MODIFICATION : Ajuste taille icône mobile --- */}
                                                <BuildIcon sx={{ fontSize: isMobile ? 60 : 80, color: theme.palette.primary.main, mb: 2 }} />
                                                {/* FIN MODIFICATION --- */}
                                                <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom color="text.primary"
                                                    sx={{ fontSize: isMobile ? '1.1rem' : 'h6.fontSize' }} // Ajuste taille titre carte mobile
                                                >
                                                    Gestion centralisée des tickets
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary"
                                                    sx={{ fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }} // Ajuste taille texte carte mobile
                                                >
                                                    Suivez, gérez et résolvez toutes les demandes de maintenance en un seul lieu, pour une efficacité accrue.
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card
                                            sx={{
                                                borderRadius: 3,
                                                boxShadow: 4,
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                backdropFilter: 'blur(5px)',
                                                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                                "&:hover": { transform: "scale(1.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
                                                height: '100%',
                                                display: 'flex', flexDirection: 'column'
                                            }}
                                        >
                                            <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                                                {/* --- MODIFICATION : Ajuste taille icône mobile --- */}
                                                <EngineeringIcon sx={{ fontSize: isMobile ? 60 : 80, color: theme.palette.primary.main, mb: 2 }} />
                                                {/* FIN MODIFICATION --- */}
                                                <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom color="text.primary"
                                                    sx={{ fontSize: isMobile ? '1.1rem' : 'h6.fontSize' }} // Ajuste taille titre carte mobile
                                                >
                                                    Optimisation des Interventions
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary"
                                                    sx={{ fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }} // Ajuste taille texte carte mobile
                                                >
                                                    Assignez les tâches aux techniciens les plus pertinents et suivez leur progression en temps réel.
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card
                                            sx={{
                                                borderRadius: 3,
                                                boxShadow: 4,
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                backdropFilter: 'blur(5px)',
                                                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                                "&:hover": { transform: "scale(1.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
                                                animation: "fadeIn 1.5s ease-in-out",
                                                height: '100%',
                                                display: 'flex', flexDirection: 'column'
                                            }}
                                        >
                                            <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                                                {/* --- MODIFICATION : Ajuste taille icône mobile --- */}
                                                <DevicesIcon sx={{ fontSize: isMobile ? 60 : 80, color: theme.palette.primary.main, mb: 2 }} />
                                                {/* FIN MODIFICATION --- */}
                                                <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom color="text.primary"
                                                    sx={{ fontSize: isMobile ? '1.1rem' : 'h6.fontSize' }} // Ajuste taille titre carte mobile
                                                >
                                                    Suivi précis des Équipements
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary"
                                                    sx={{ fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }} // Ajuste taille texte carte mobile
                                                >
                                                    Maintenez un inventaire détaillé de vos équipements et consultez leur historique de maintenance.
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card
                                            sx={{
                                                borderRadius: 3,
                                                boxShadow: 4,
                                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                backdropFilter: 'blur(5px)',
                                                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                                "&:hover": { transform: "scale(1.05)", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" },
                                                animation: "fadeIn 1.5s ease-in-out",
                                                height: '100%',
                                                display: 'flex', flexDirection: 'column'
                                            }}
                                        >
                                            <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                                                {/* --- MODIFICATION : Ajuste taille icône mobile --- */}
                                                <CommentBank sx={{ fontSize: isMobile ? 60 : 80, color: theme.palette.primary.main, mb: 2 }} />
                                                {/* FIN MODIFICATION --- */}
                                                <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom color="text.primary"
                                                    sx={{ fontSize: isMobile ? '1.1rem' : 'h6.fontSize' }} // Ajuste taille titre carte mobile
                                                >
                                                    Communication Améliorée
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary"
                                                    sx={{ fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }} // Ajuste taille texte carte mobile
                                                >
                                                    Facilitez les échanges entre clients, techniciens et gestionnaires grâce aux notifications et commentaires.
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Container>
                        </Box>


                        {/* SECTION AVIS */}
                        {/* --- MODIFICATION : Ajuste padding vertical pour mobile --- */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 4, md: 6 } }}> {/* Moins de padding vertical sur mobile */}
                            <Card
                                sx={{
                                    animation: "fadeIn 2s ease-in-out",
                                    borderRadius: 3,
                                    boxShadow: 4,
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(5px)',
                                    maxWidth: 'sm',
                                    width: '100%',
                                    margin: '0 auto',
                                }}
                            >
                                {/* --- MODIFICATION : Ajuste padding vertical sur CardContent Avis --- */}
                                <CardContent sx={{ py: { xs: 4, md: 6 } }}> {/* Moins de padding vertical sur mobile */}
                                    <Container maxWidth="lg">
                                        <AvisSection />
                                    </Container>
                                </CardContent>
                                {/* FIN MODIFICATION --- */}
                            </Card>
                        </Box>
                        {/* FIN MODIFICATION --- */}

                    </Box>
                </Box>

                <Footer />

            </Box>

         
        </>
    );
};

export default Home;
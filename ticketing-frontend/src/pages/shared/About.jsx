import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from "@mui/material";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import GroupsIcon from "@mui/icons-material/Groups";
import EngineeringIcon from "@mui/icons-material/Engineering";
import TimelineIcon from "@mui/icons-material/Timeline";
import PersonIcon from "@mui/icons-material/Person";
import Footer from "../../components/layout/Footer";

// Importez l'instance 'api' (ajustez le chemin si nécessaire)
import api from "../../api/api";


const animationStyles = `
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes slideInUp {
    0% { transform: translateY(50px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideInLeft {
    0% { transform: translateX(-50px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideInRight {
    0% { transform: translateX(50px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
`;


const About = () => {
  const [specialiteFilter, setSpecialiteFilter] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [personnelList, setPersonnelList] = useState([]);
  const [technicianList, setTechnicianList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Effet pour récupérer les données au montage du composant
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Commencer le chargement
        const [personnelsRes, techniciansRes] = await Promise.all([
          api.get("/personnels/"), // Utilisation de l'instance api
          api.get("/techniciens/"), // Utilisation de l'instance api
        ]);
        // Les données sont généralement dans .data de la réponse Axios
        setPersonnelList(personnelsRes.data);
        setTechnicianList(techniciansRes.data);
        setError(null); // Réinitialiser les erreurs en cas de succès
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        // Vérifiez si l'erreur a une réponse et un message
        setError(err.response?.data?.message || "Erreur lors du chargement des données. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false); // Arrêter le chargement, qu'il y ait eu succès ou erreur
      }
    };

    fetchData();
  }, []); // Le tableau vide assure que cet effet ne s'exécute qu'une fois au montage


   const values = [
    {
      icon: <EmojiObjectsIcon fontSize="large" color="primary" />,
      title: "Innovation",
      description:
        "Nous adoptons les dernières technologies pour vous offrir des solutions performantes.",
    },
    {
      icon: <GroupsIcon fontSize="large" color="primary" />,
      title: "Collaboration",
      description:
        "Un travail d’équipe au cœur de notre réussite, pour un meilleur service utilisateur.",
    },
    {
      icon: <EngineeringIcon fontSize="large" color="primary" />,
      title: "Fiabilité",
      description:
        "Nous garantissons des services sécurisés, stables et disponibles à tout moment.",
    },
  ];

  const steps = [
    "Identifier les besoins des utilisateurs",
    "Créer une plateforme intuitive et performante",
    "Assurer le support et le suivi des interventions",
    "Analyser les performances pour une amélioration continue",
  ];

  // Extraction des spécialités uniques des techniciens pour le filtre
  // S'assurer que technicianList est non vide avant de faire .flatMap
  const specialites = ["Tous", ...new Set(technicianList.flatMap((t) => t.TECH_specialite || []))];


  // Filtrage des techniciens basés sur la spécialité et la recherche
  const filteredTechniciens = technicianList.filter((t) => {
    const matchSpecialite = specialiteFilter === "Tous" || (t.TECH_specialite && t.TECH_specialite.includes(specialiteFilter));
    const matchSearch =
      t.TECH_nom_prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.TECH_email && t.TECH_email.toLowerCase().includes(searchQuery.toLowerCase())); // Ajout de vérification pour tech.TECH_email
    return matchSpecialite && matchSearch;
  });

  return (
    <>
      {/* Conteneur principal pour toute la page avec l'image de fond */}
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/assets/images/andras-vas-Bd7gNnWJBkU-unsplash.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: isMobile ? 'scroll' : 'fixed',
          color: "white",
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000',
        }}
      >
        {/* Wrapper pour le contenu principal (prend l'espace restant, pousse le footer) */}
        <Box sx={{ flexGrow: 1 }}>

          {/* Section Titre Principal */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: 'center',
              paddingTop: { xs: '80px', sm: '64px' },
              paddingBottom: { xs: theme.spacing(4), md: theme.spacing(10) },
            }}
          >
            <Container maxWidth="md"
             sx={{
                 px: { xs: 2, md: 0 },
             }}
            >
              <Typography
                variant="h3"
                component="h1"
                fontWeight="bold"
                gutterBottom
                sx={{
                    textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
                    fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
                    animation: "slideInUp 1s ease-out"
                }}
              >
                À propos de notre solution de gestion des tickets
              </Typography>
              <Typography variant="h6" component="p"
                sx={{
                    opacity: 0.9,
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                    animation: "slideInUp 1.2s ease-out",
                    color:"white"
                }}
              >
                Découvrez qui nous sommes, notre mission et les valeurs qui nous animent.
              </Typography>
            </Container>
          </Box>


          {/* Section Valeurs principales */}
          <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Container maxWidth="lg">
              <Typography
                variant="h4"
                align="center"
                fontWeight="bold"
                gutterBottom
                sx={{
                    mb: { xs: 4, md: 6 },
                    color: 'white',
                    fontSize: { xs: '1.8rem', sm: 'h4.fontSize' }
                }}
              >
                Nos Valeurs
              </Typography>
              <Grid container spacing={isMobile ? 2 : 4}>
                {values.map((val, i) => (
                  <Grid item xs={12} sm={4} key={i} sx={{ animation: `slideInUp ${1 + i * 0.2}s ease-out` }}>
                    <Card
                      elevation={6}
                      sx={{
                        textAlign: "center",
                        p: { xs: 2, md: 3 },
                        height: "100%",
                        borderRadius: 2,
                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                        "&:hover": { transform: "translateY(-5px)", boxShadow: 8 },
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff'
                      }}
                    >
                      <Avatar sx={{ bgcolor: "primary.main", mx: "auto", mb: 2, width: isMobile ? 50 : 60, height: isMobile ? 50 : 60 }}>
                        {React.cloneElement(val.icon, { fontSize: isMobile ? 'medium' : 'large', color: 'inherit' })}
                      </Avatar>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        gutterBottom
                        sx={{
                          fontSize: isMobile ? '1.1rem' : 'h6.fontSize',
                          color: 'white'
                        }}
                      >
                        {val.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="inherit"
                        sx={{ fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }}
                      >
                        {val.description}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>


          {/* Section Ligne du temps de l'objectif */}
          <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Container maxWidth="lg">
              <Typography
                variant="h4"
                align="center"
                fontWeight="bold"
                gutterBottom
                sx={{
                    mb: { xs: 4, md: 6 },
                    color: 'white',
                    fontSize: { xs: '1.8rem', sm: 'h4.fontSize' }
                }}
              >
                Notre Mission, étape par étape
              </Typography>
              <Grid container spacing={isMobile ? 2 : 4} justifyContent="center">
                {steps.map((step, idx) => (
                  <Grid item xs={12} sm={6} md={3} key={idx} sx={{ animation: `slideInUp ${1 + idx * 0.2}s ease-out` }}>
                    <Card
                      elevation={4}
                      sx={{
                        height: "100%",
                        p: { xs: 2, md: 3 },
                        textAlign: "center",
                        borderRadius: 2,
                        borderBottom: `4px solid ${theme.palette.secondary.main}`,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff'
                      }}
                    >
                      <TimelineIcon color="secondary" sx={{ fontSize: isMobile ? 40 : 50, mb: 2 }} />
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        gutterBottom
                        sx={{
                          fontSize: isMobile ? '1rem' : 'h6.fontSize',
                          color: 'white'
                        }}
                      >
                        Étape {idx + 1}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="inherit"
                        sx={{ fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }}
                      >
                        {step}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>


          {/* Section Équipe Administrative */}
          <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Container maxWidth="lg">
              <Typography
                variant="h4"
                align="center"
                fontWeight="bold"
                gutterBottom
                sx={{
                    mb: { xs: 4, md: 6 },
                    color: 'white',
                    fontSize: { xs: '1.8rem', sm: 'h4.fontSize' }
                }}
              >
                Notre Équipe Administrative
              </Typography>
              {loading && <Box display="flex" justifyContent="center"><CircularProgress color="primary" /></Box>}
              {error && <Alert severity="error" sx={{ mb: 4, justifyContent: 'center' }}>{error}</Alert>}
              {!loading && !error && personnelList.length === 0 && (
                <Typography align="center" color="text.secondary">Aucun membre du personnel trouvé.</Typography>
              )}
              {!loading && !error && personnelList.length > 0 && (
                <Grid container spacing={isMobile ? 2 : 3}>
                  {personnelList.map((perso, i) => (
                    <Grid item xs={12} sm={6} md={4} key={perso._id} sx={{ animation: `slideInLeft ${1 + i * 0.1}s ease-out` }}>
                      <Card
                        elevation={3}
                        sx={{
                          p: { xs: 2, md: 3 },
                          borderRadius: 2,
                          height: '100%',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>
                          {/* Utiliser PERS_photo_profil s'il existe, sinon l'icône par défaut */}
                          {perso.PERS_photo_profil ? (
                            <Avatar src={perso.PERS_photo_profil} alt={perso.PERS_nom_prenom} sx={{ width: isMobile ? 50 : 60, height: isMobile ? 50 : 60 }} />
                          ) : (
                            <Avatar sx={{ bgcolor: "secondary.main", width: isMobile ? 50 : 60, height: isMobile ? 50 : 60 }}>
                              <PersonIcon fontSize={isMobile ? 'medium' : 'large'} />
                            </Avatar>
                          )}
                          <Box>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{
                                fontSize: isMobile ? '1rem' : 'h6.fontSize',
                                color: 'white'
                              }}
                            >
                              {perso.PERS_nom_prenom}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="inherit"
                              sx={{ fontSize: isMobile ? '0.8rem' : 'body2.fontSize' }}
                            >
                              {perso.PERS_email}
                            </Typography>
                            {/* Afficher le téléphone uniquement s'il est présent */}
                            {perso.PERS_telephone && (
                              <Typography
                                variant="body2"
                                color="inherit"
                                sx={{ fontSize: isMobile ? '0.8rem' : 'body2.fontSize' }}
                              >
                                {perso.PERS_telephone}
                              </Typography>
                            )}
                             {/* Afficher la fonction uniquement si elle est présente */}
                             {perso.PERS_fonction && (
                              <Typography
                                variant="body2"
                                color="primary.light"
                                sx={{ fontSize: isMobile ? '0.8rem' : 'body2.fontSize' }}
                              >
                                Fonction : {perso.PERS_fonction}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Container>
          </Box>


          {/* Section Techniciens */}
          <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Container maxWidth="lg">
              <Typography
                variant="h4"
                align="center"
                fontWeight="bold"
                gutterBottom
                sx={{
                    mb: { xs: 4, md: 6 },
                    color: 'white',
                    fontSize: { xs: '1.8rem', sm: 'h4.fontSize' }
                }}
              >
                Nos Techniciens
              </Typography>

              {/* Filtres et recherche */}
              <Box sx={{ mb: { xs: 4, md: 4 }, display: "flex", justifyContent: "center", gap: isMobile ? theme.spacing(1) : theme.spacing(2), flexWrap: "wrap", animation: "fadeIn 1s ease-out" }}>
                {/* FormControl pour le filtre de spécialité */}
                <FormControl sx={{ minWidth: isMobile ? 180 : 250 }}>
                  <InputLabel id="filter-label" sx={{color: '#fff'}}>Filtrer par spécialité</InputLabel>
                  <Select
                    labelId="filter-label"
                    value={specialiteFilter}
                    label="Filtrer par spécialité"
                    onChange={(e) => setSpecialiteFilter(e.target.value)}
                    sx={{
                      color: '#fff',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' },
                      '.MuiSvgIcon-root': { color: '#fff' },
                      fontSize: isMobile ? '0.9rem' : 'inherit'
                    }}
                  >
                    {specialites.map((spec, index) => (
                      <MenuItem key={index} value={spec} sx={{ fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                        {spec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* TextField pour la recherche */}
                <TextField
                  label="Rechercher par nom ou email"
                  variant="outlined"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    minWidth: isMobile ? 180 : 300,
                    '& label': { color: '#fff', fontSize: isMobile ? '0.9rem' : 'inherit' },
                    '& input': { color: '#fff', fontSize: isMobile ? '0.9rem' : 'inherit' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.8)' }
                  }}
                />
              </Box>

              {loading && <Box display="flex" justifyContent="center"><CircularProgress color="primary" /></Box>}
              {error && <Alert severity="error" sx={{ mb: 4, justifyContent: 'center' }}>{error}</Alert>}
              {!loading && !error && filteredTechniciens.length === 0 && (
                <Typography align="center" color="text.secondary">Aucun technicien trouvé.</Typography>
              )}
              {!loading && !error && filteredTechniciens.length > 0 && (
                <Grid container spacing={isMobile ? 2 : 3}>
                  {filteredTechniciens.map((tech, i) => (
                    <Grid item xs={12} sm={6} md={4} key={tech._id} sx={{ animation: `slideInRight ${1 + i * 0.1}s ease-out` }}>
                      <Card
                        elevation={3}
                        sx={{
                          p: { xs: 2, md: 3 },
                          borderRadius: 2,
                          height: '100%',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#fff'
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>
                           {/* Utiliser TECH_photo_profil s'il existe, sinon l'icône par défaut */}
                           {tech.TECH_photo_profil ? (
                              <Avatar src={tech.TECH_photo_profil} alt={tech.TECH_nom_prenom} sx={{ width: isMobile ? 50 : 60, height: isMobile ? 50 : 60 }} />
                           ) : (
                              <Avatar sx={{ bgcolor: "primary.main", width: isMobile ? 50 : 60, height: isMobile ? 50 : 60 }}>
                                 <EngineeringIcon fontSize={isMobile ? 'medium' : 'large'} />
                              </Avatar>
                           )}
                          <Box>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{
                                fontSize: isMobile ? '1rem' : 'h6.fontSize',
                                color: 'white'
                              }}
                            >
                              {tech.TECH_nom_prenom}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="inherit"
                              sx={{ fontSize: isMobile ? '0.8rem' : 'body2.fontSize' }}
                            >
                              {tech.TECH_email}
                            </Typography>
                            {/* Afficher le téléphone uniquement s'il est présent */}
                            {tech.TECH_telephone && (
                              <Typography
                                variant="body2"
                                color="inherit"
                                sx={{ fontSize: isMobile ? '0.8rem' : 'body2.fontSize' }}
                              >
                                {tech.TECH_telephone}
                              </Typography>
                            )}
                            {/* Afficher la spécialité uniquement si elle est présente et est un tableau */}
                            {tech.TECH_specialite && tech.TECH_specialite.length > 0 && (
                              <Typography
                                variant="body2"
                                color="primary.light"
                                sx={{ fontSize: isMobile ? '0.8rem' : 'body2.fontSize' }}
                              >
                                Spécialité : {tech.TECH_specialite.join(', ')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Container>
          </Box>
        </Box>

        {/* Footer - À L'INTÉRIEUR DU CONTENEUR AVEC L'IMAGE DE FOND */}
          <Footer />

      </Box>

      <style>{animationStyles}</style>
    </>
  );
};

export default About;
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  Card,
  CardContent,
  styled,
  useTheme,
  useMediaQuery,
  IconButton, // Ajout de IconButton
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
// --- MODIFICATION : Ajout des icônes nécessaires pour les nouvelles cartes ---
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
// --- FIN MODIFICATION ---
import Footer from "../../components/layout/Footer";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import AvisSection from "../../pages/shared/AvisSection";
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Le thème custom ne change pas
const customTheme = createTheme({
  palette: {
    primary: {
      main: '#ffeb3b',
      light: '#ffff6b',
      dark: '#c8b900',
      contrastText: '#000',
    },
    secondary: {
      main: '#424242',
      light: '#6d6d6d',
      dark: '#1b1b1b',
      contrastText: '#fff',
    },
  },
  components: {
    MuiOutlinedInput: {
        styleOverrides: {
            notchedOutline: {
                borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            root: {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ffeb3b',
                },
                '& input, & textarea': {
                    color: '#fff',
                },
                 '& label': {
                    color: '#fff',
                 },
            },
        },
    },
     MuiInputLabel: {
        styleOverrides: {
            root: {
                 color: '#fff',
                 '&.Mui-focused': {
                    color: '#ffeb3b',
                 },
            },
        },
    },
      MuiRating: {
        styleOverrides: {
            iconFilled: {
                color: '#ffeb3b',
            },
            iconEmpty: {
                color: 'rgba(255, 255, 255, 0.5)',
            },
        },
      },
  },
});

const BackgroundBox = styled(Box)(({ theme, ismobile }) => ({
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/assets/images/background.jpg')`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: ismobile ? 'scroll' : 'fixed',
  color: "#fff",
  overflow: "hidden",
  boxSizing: "border-box",
  backgroundColor: '#000',
}));

const Contact = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ThemeProvider theme={customTheme}>
      <BackgroundBox ismobile={isMobile ? 1 : 0}>
        <Box sx={{ flexGrow: 1 }}>
          <Container
            maxWidth="lg"
            sx={{ pt: { xs: "80px", sm: "64px" }, pb: { xs: theme.spacing(6), md: theme.spacing(10) } }}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              align="center"
              gutterBottom
              sx={{
                textTransform: "uppercase",
                textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
                mb: { xs: 4, md: 4 },
                fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' },
                color: "#fff",
              }}
            >
              Contactez-nous
            </Typography>

            <Typography
              variant="h6"
              align="center"
              paragraph
              sx={{
                  maxWidth: 700,
                  mx: "auto",
                  mb: { xs: 4, md: 4 },
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  color: "#fff",
                  opacity: 0.9
                }}
            >
              Une question ? Un besoin spécifique ? N’hésitez pas à nous
              écrire, nous serons ravis de vous répondre rapidement.
            </Typography>

            {/* Informations de contact */}
            <Grid container spacing={isMobile ? 2 : 4} justifyContent="center" sx={{ mb: { xs: 4, md: 6 } }}>
              <Grid item xs={12} sm={8} md={6}> {/* MODIFICATION HERE: Changed sm to 8 and md to 6 */}
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: 6,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    p: { xs: 2, md: 3 }
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      color="primary"
                      gutterBottom
                      sx={{ fontSize: isMobile ? '1.2rem' : 'h5.fontSize' }}
                    >
                      Informations de Contact
                    </Typography>
                    <Box display="flex" alignItems="center" mb={isMobile ? 1 : 2}>
                      <LocationOnIcon
                        color="primary"
                        sx={{ fontSize: isMobile ? 25 : 30, mr: isMobile ? 1 : 2 }}
                      />
                      <Typography variant="body1" sx={{ fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }}>
                        123 Rue de la Maintenance, Nabeul
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={isMobile ? 1 : 2}>
                      <PhoneIcon
                        color="primary"
                        sx={{ fontSize: isMobile ? 25 : 30, mr: isMobile ? 1 : 2 }}
                      />
                      <Typography variant="body1" sx={{ fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }}>
                        +216 29 057 400
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={isMobile ? 0 : 2}>
                      <EmailIcon
                        color="primary"
                        sx={{ fontSize: isMobile ? 25 : 30, mr: isMobile ? 1 : 2 }}
                      />
                      <Typography variant="body1" sx={{ fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }}>
                       solution.ticketing.parcinfo@gmail.com
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            
            {/* SECTION AVIS (conservée) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 4, md: 6 } }}>
              <Card
                sx={{
                  animation: "fadeIn 2s ease-in-out",
                  borderRadius: 3,
                  boxShadow: 4,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(5px)',
                  maxWidth: 'sm',
                  width: '100%',
                  margin: '0 auto',
                  p: { xs: 2, md: 0 }
                }}
              >
                <CardContent sx={{ py: { xs: 4, md: 6 } }}>
                  <Container maxWidth="lg">
                    <AvisSection />
                  </Container>
                </CardContent>
              </Card>
            </Box>

            {/* Carte pour la Map */}
            <Grid container spacing={isMobile ? 2 : 4} justifyContent="center" sx={{ mt: { xs: 4, md: 6 } }}> {/* Added justifyContent="center" and potentially reduced size */}
              <Grid item xs={12} md={8}> {/* Changed md to 8 to make it smaller */}
                <Card
                  sx={{
                    boxShadow: 6,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    p: { xs: 2, md: 3 }
                  }}
                >
                  <CardContent>
                    <Typography variant="h5" fontWeight="bold" gutterBottom
                       sx={{ fontSize: isMobile ? '1.2rem' : 'h5.fontSize' }}
                    >
                      Notre emplacement
                    </Typography>
                    <MapContainer
                      center={[36.4575, 10.1894]}
                      zoom={13}
                      style={{ width: "100%", height: isMobile ? "300px" : "400px" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution={false} 
                        noWrap={true}
                      />
                      <Marker position={[36.4575, 10.1894]}>
                        <Popup>Notre bureau à Nabeul, Tunisie</Popup>
                      </Marker>
                    </MapContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* --- MODIFICATION : Remplacement de la section "Laissez-nous un avis" --- */}
            {/* Nouvelle section avec Horaires et Réseaux Sociaux */}
            <Grid container spacing={isMobile ? 2 : 4} sx={{ mt: { xs: 4, md: 6 } }}>
              {/* Carte Horaires d'ouverture */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', boxShadow: 6, backgroundColor: "rgba(255, 255, 255, 0.1)", color: "#fff", p: { xs: 2, md: 2 } }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <AccessTimeIcon color="primary" sx={{ fontSize: isMobile ? 28 : 32, mr: 1.5 }} />
                      <Typography variant="h5" fontWeight="bold" sx={{ fontSize: isMobile ? '1.2rem' : 'h5.fontSize' }}>
                        Horaires d'ouverture
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 0.5, fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }}>
                      Lundi - Vendredi : <strong>9h00 - 18h00</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 0.5, fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }}>
                      Samedi : <strong>9h00 - 13h00</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }}>
                      Dimanche : Fermé
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Carte Suivez-nous */}
              <Grid item xs={12} md={6}>
                 <Card sx={{ height: '100%', boxShadow: 6, backgroundColor: "rgba(255, 255, 255, 0.1)", color: "#fff", p: { xs: 2, md: 2 } }}>
                   <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <ShareIcon color="primary" sx={{ fontSize: isMobile ? 28 : 32, mr: 1.5 }} />
                        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: isMobile ? '1.2rem' : 'h5.fontSize' }}>
                          Suivez-nous
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ mb: 2, fontSize: isMobile ? '0.9rem' : 'body1.fontSize' }}>
                        Restez connectés avec nous sur les réseaux sociaux pour les dernières actualités.
                      </Typography>
                      <Box>
                        <IconButton href="https://www.facebook.com" target="_blank" aria-label="Facebook" sx={{ color: 'white', '&:hover': { color: '#ffeb3b' } }}>
                          <FacebookIcon fontSize="large" />
                        </IconButton>
                        <IconButton href="https://www.linkedin.com" target="_blank" aria-label="LinkedIn" sx={{ color: 'white', '&:hover': { color: '#ffeb3b' } }}>
                          <LinkedInIcon fontSize="large" />
                        </IconButton>
                      </Box>
                   </CardContent>
                 </Card>
              </Grid>
            </Grid>
            {/* --- FIN DE LA MODIFICATION --- */}

          </Container>
        </Box>
        <Footer />
      </BackgroundBox>
    </ThemeProvider>
  );
};

export default Contact;
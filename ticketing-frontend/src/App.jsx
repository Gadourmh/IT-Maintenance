import { useState, useEffect } from "react";
import AppRoutes from "./routes";
import 'bootstrap/dist/css/bootstrap.min.css';

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";

import AdminMenu from "./components/auth/AdminMenu";
import ClientMenu from "./components/auth/ClientMenu";
import TechnicienMenu from "./components/auth/TechnicienMenu";
import NormalMenu from "./components/auth/NormalMenu";

import { Box, createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { useAuth } from "./context/AuthContext";
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { useLocation } from "react-router-dom";

// Importez le composant Chatbot depuis son nouvel emplacement
import Chatbot from './pages/shared/Chatbot'; 

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const isSpecialBackgroundPage = location.pathname === '/' ||
                                   location.pathname === '/login' ||
                                   location.pathname === '/about' ||
                                   location.pathname === '/contact';

  const themeMode = localStorage.getItem('theme') || 'light'; 

  const theme = createTheme({
    palette: {
      mode: themeMode,
      background: {
        default: '#f0f2f5', 
        paper: '#ffffff',  
      },
      primary: {
        main: '#2196F3', 
      },
      secondary: {
        main: '#4CAF50', 
      },
      text: {
        primary: '#333333', 
        secondary: '#595959', 
      }
    },
    typography: {
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
      h4: {
        fontWeight: 600,
        fontSize: '1.75rem', 
        color: '#222222',
      },
      h6: { 
        fontWeight: 600,
        fontSize: '1.1rem',
        color: '#333333',
        marginBottom: '12px', 
      },
      body1: {
        fontSize: '0.95rem',
      },
      body2: {
        fontSize: '0.875rem',
      },
      caption: {
        fontSize: '0.75rem',
        color: '#595959',
      }
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 6, 
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.07)', 
            border: '1px solid #EAEAEA', 
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: '16px',
            '&:last-child': {
              paddingBottom: '16px',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            textTransform: 'none', 
            fontWeight: 600,
          },
          outlined: {
            borderColor: '#C4C4C4',
            color: '#333333',
            '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)', 
                borderColor: '#A4A4A4',
            }
          },
          contained: {
            '&:hover': {
                boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)', 
            }
          }
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            fontSize: '0.95rem',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.95rem',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
            root: {
                fontSize: '0.9rem',
            }
        }
      },
      MuiTooltip: { 
        styleOverrides: {
            tooltip: {
                fontSize: "0.8rem",
                backgroundColor: "rgba(0,0,0,0.85)",
                borderRadius: "4px",
            },
            arrow: {
                color: "rgba(0,0,0,0.85)",
            }
        }
      }
    },
  });

  const { t } = useTranslation();
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    i18n.changeLanguage(savedLanguage);
  }, []);

  const renderMenu = () => {
    if (!user) return null;
    const role = user?.PERS_role_acces || user?.role;
    switch (role) {
      case "ADMIN":
      case "SUPER_ADMIN":
        return <AdminMenu open={menuOpen} setOpen={setMenuOpen} />;
      case "CLIENT":
        return <ClientMenu open={menuOpen} setOpen={setMenuOpen} />;
      case "TECHNICIEN":
        return <TechnicienMenu open={menuOpen} setOpen={setMenuOpen} />;
      case "NORMAL":
        return <NormalMenu open={menuOpen} setOpen={setMenuOpen} />;
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar
        openAdminMenu={menuOpen}
        setOpenAdminMenu={setMenuOpen}
        toggleDrawer={() => setSidebarOpen(!sidebarOpen)}
      />
      <Box
        sx={{
          flexGrow: 1,
          marginTop: isSpecialBackgroundPage ? 0 : (theme) => `${theme.mixins.toolbar.minHeight}px`, 
          display: isSpecialBackgroundPage ? 'block' : 'flex',
          overflowX: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: isSpecialBackgroundPage ? 'transparent' : theme.palette.background.default, 
        }}
        component="main"
      >
        {!isSpecialBackgroundPage ? (
          <>
            <Sidebar isOpen={sidebarOpen} toggleDrawer={() => setSidebarOpen(!sidebarOpen)} />
            <Box sx={{ flexGrow: 1, p: {xs: 2, sm: 3}, overflowX: 'auto' }}> 
              {renderMenu()}
              <AppRoutes />
            </Box>
          </>
        ) : (
          <AppRoutes />
        )}
      </Box>
      
      {/* 🚀 Intégration du Chatbot : Il sera visible sur toutes les pages. */}
      {/* Ses styles `position: fixed` le feront apparaître en bas à droite. */}
      <Chatbot /> 

    </ThemeProvider>
  );
};

export default App;
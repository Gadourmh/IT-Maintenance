import React from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton, 
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    useMediaQuery,
    Box,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu"; 
import HomeIcon from "@mui/icons-material/Home";
import LoginIcon from "@mui/icons-material/Login";
import InfoIcon from "@mui/icons-material/Info";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";

import { useLocation } from "react-router-dom";

import AdminMenu from "../auth/AdminMenu";
import ClientMenu from "../auth/ClientMenu";
import TechnicienMenu from "../auth/TechnicienMenu";
import NormalMenu from "../auth/NormalMenu";


const drawerWidth = 240;


const Navbar = ({ toggleDrawer }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm")); 

    const location = useLocation();
   
    const isSpecialBackgroundPage = location.pathname === '/' ||
                                    location.pathname === '/login' ||
                                    location.pathname === '/about' ||
                                    location.pathname === '/contact';

  
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen); 
        if(toggleDrawer) toggleDrawer(); 
    };

    const [openRoleMenu, setOpenRoleMenu] = useState(false);

    useEffect(() => {
        setOpenRoleMenu(false);
    }, [user]);

    const handleMonEspaceClick = () => {
        setOpenRoleMenu((prev) => !prev);
    };

   
    const handleMenuItemClick = (action) => {
        action();
        if (isMobile) {
            setMobileOpen(false); 
        }
    };


    const menuItems = [
        {
            text: "Accueil",
            icon: <HomeIcon />,
            action: () => {
                
                if (user) {
                    navigate("/dashboard");
                } else {
                    navigate("/");
                }
            }
        },
        { text: "À Propos", icon: <InfoIcon />, action: () => navigate("/about") },
        { text: "Contact", icon: <ContactMailIcon />, action: () => navigate("/contact") },
    ];

    if (user) {
        menuItems.push({
            text: "Mon espace",
            icon: <AccountCircleIcon />,
            action: handleMonEspaceClick,
        });
        menuItems.push({ text: "Déconnexion", icon: <LogoutIcon />, action: logout });
    } else if (location.pathname !== '/login') { 
       
        menuItems.push({ text: "Connexion", icon: <LoginIcon />, action: () => navigate("/login") });
    }

   
    const renderRoleMenu = () => {
        if (!user) return null;
        const role = user?.PERS_role_acces || user?.role;

        switch (role) {
            case "ADMIN":
            case "SUPER_ADMIN":
                return openRoleMenu ? <AdminMenu open={openRoleMenu} setOpen={setOpenRoleMenu} /> : null;
            case "CLIENT":
                return openRoleMenu ? <ClientMenu open={openRoleMenu} setOpen={setOpenRoleMenu} /> : null;
            case "TECHNICIEN":
                return openRoleMenu ? <TechnicienMenu open={openRoleMenu} setOpen={setOpenRoleMenu} /> : null;
            case "NORMAL":
                return openRoleMenu ? <NormalMenu open={openRoleMenu} setOpen={setOpenRoleMenu} /> : null;
            default:
                return null;
        }
    };

   
    const appBarBackgroundColor = isSpecialBackgroundPage ? 'transparent' : '#1A364B';

    return (
        <>
            <AppBar
                position={isSpecialBackgroundPage ? "absolute" : "static"}
                color="transparent"
                sx={{
                    backgroundColor: appBarBackgroundColor,
                    boxShadow: isSpecialBackgroundPage ? 'none' : theme.shadows[4],
                    zIndex: theme.zIndex.drawer + 1, 
                    top: isSpecialBackgroundPage ? 0 : 'auto',
                    left: isSpecialBackgroundPage ? 0 : 'auto',
                    right: isSpecialBackgroundPage ? 0 : 'auto',
                    width: isSpecialBackgroundPage ? '100%' : 'auto',
                   
                    
                  
                }}
            >
                <Toolbar>
                    {isMobile && (
                        <IconButton
                           
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{
                                mr: 2,
                            
                                color: isSpecialBackgroundPage ? theme.palette.common.white : 'inherit',
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    
                    {( !isMobile || !mobileOpen ) && (
                        <Typography
                            variant="h6"
                            noWrap
                            component="div"
                            sx={{
                                flexGrow: 0.59,
                                fontWeight: "bold",
                                cursor: "pointer",
                                color: theme.palette.common.white, 
                               
                                textShadow: isSpecialBackgroundPage ? '1px 1px 3px rgba(0, 0, 0, 0.5)' : 'none', 
                            }}
                            onClick={() => navigate("/")}
                        >
                            Gestion des Tickets
                        </Typography>
                    )}
                    


                    {!isMobile && (
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            {menuItems.map((item) => (
                                <Button
                                    key={item.text}
                                    color="inherit" 
                                    startIcon={item.icon}
                                    onClick={() => handleMenuItemClick(item.action)}
                                    sx={{
                                        textTransform: 'none',
                                        mx: 1,
                                        color: theme.palette.common.white, 
                                        fontWeight: 'bold',
                                       
                                        textShadow: isSpecialBackgroundPage ? '1px 1px 3px rgba(0, 0, 0, 0.5)' : 'none', 
                                    }}
                                >
                                    {item.text}
                                </Button>
                            ))}
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <nav>
                <Drawer
                    anchor="left"
                    
                    open={mobileOpen}
                    onClose={handleDrawerToggle} 
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' }, 
                        '& .MuiDrawer-paper': {
                             boxSizing: 'border-box',
                             width: drawerWidth, 
                             backgroundColor: theme.palette.background.default, 
                             zIndex: theme.zIndex.drawer + 2,
                             color: theme.palette.text.primary, 
                             paddingTop: '20px', 
                         },
                       
                         '& .MuiBackdrop-root': {
                            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                         },
                    }}
                >
                  
                    <Box
                        
                         sx={{ textAlign: 'left', px: 2 }} 
                    >
                        
                        <Typography variant="h6" sx={{ my: 2, fontWeight: 'bold', color: theme.palette.text.primary, textAlign: 'center' }}>
                            Menu Principal
                        </Typography>
                        <List>
                            {menuItems.map((item) => (
                                <ListItem button key={item.text} onClick={() => handleMenuItemClick(item.action)}>
                                    {item.icon && <ListItemIcon sx={{ color: theme.palette.action.active }}>{item.icon}</ListItemIcon>} 
                                    <ListItemText primary={item.text} sx={{ color: theme.palette.text.primary }} /> 
                                </ListItem>
                            ))}
                            
                        </List>
                    </Box>
                </Drawer>
            </nav>

           
            {renderRoleMenu()}

        </>
    );
};

export default Navbar;
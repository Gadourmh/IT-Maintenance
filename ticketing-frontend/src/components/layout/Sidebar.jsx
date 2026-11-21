import React, { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Avatar,
  Divider,
  Collapse,
  Typography,
  Box,
  useTheme, 
} from "@mui/material";
import {
  Dashboard,
  ConfirmationNumber,
  Logout,
  ExpandLess,
  ExpandMore,
  BarChart,
  Settings,
  AssignmentTurnedIn,
  Storage,
  Dns,
  BugReport,
  AccountCircle,
  ViewKanban,
  Home,
  Inventory,
  Person,
  Groups,
  Notifications,
  Build,
  CommentBank,
  AssignmentInd,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom"; 
import { useAuth } from "../../context/AuthContext";

const drawerWidth = 250; 

const Sidebar = ({ isOpen, toggleDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user, logout } = useAuth();
  const [openRoleMenu, setOpenRoleMenu] = useState(false);
  const theme = useTheme();

  const toggleRoleMenu = () => setOpenRoleMenu((prev) => !prev);


  useEffect(() => {
    if (user?.role) {
      setOpenRoleMenu(false);
    }
  }, [user?.role]);

 
  const handleNavigation = (path) => {
    navigate(path);
    
  };

 
  const handleLogout = () => {
    logout();
    
  };

  
  const isActive = (path) => {
    
      if (path === '/') {
          return location.pathname === '/';
      }

      
      return location.pathname.startsWith(path);
  };


 


  const adminMenuItems = [
    {
      group: "Gestion des Ressources",
      items: [
        { text: "Clients", icon: <Groups />, path: "/gestion-clients" },
        { text: "Techniciens", icon: <Build />, path: "/gestion-techniciens" },
        { text: "Personnel", icon: <Person />, path: "/gestion-personnel" },
      ],
    },
    {
      group: "Gestion des Interventions",
      items: [
        { text: "Tickets", icon: <ConfirmationNumber />, path: "/gestion-tickets" },
        { text: "Interventions", icon: <AssignmentTurnedIn />, path: "/gestion-interventions" },
        { text: "Notifications", icon: <Notifications />, path: "/gestion-notifications" },
      ],
    },
    {
      group: "Configuration & Statistiques",
      items: [
        { text: "Équipements", icon: <Storage />, path: "/gestion-equipements" },
        { text: "Types d'Équipements", icon: <Dns />, path: "/gestion-type-equipements" },
        { text: "Types de Pannes", icon: <BugReport />, path: "/gestion-type-pannes" },
    
        { text: "Statistiques Globales", icon: <BarChart />, path: "/statistiques" }, 
        { text: "Performances Techniciens", icon: <BarChart />, path: "/performances-techniciens" },
        { text: "Profil", icon: <AccountCircle />, path: "/profile" },
       
      ],
    },
  ];

  const clientMenuItems = [
    { text: "Mon Dashboard", icon: <Dashboard />, path: "/dashboard-client" },
    { text: "Mes Tickets", icon: <ConfirmationNumber />, path: "/mes-tickets" },
    { text: "Mes Équipements", icon: <Inventory />, path: "/mes-equipements" },
    { text: "Profil", icon: <AccountCircle />, path: "/profile" }, 
  ];

  const technicienMenuItems = [
    { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-technicien" },
    { text: "Équipements", icon: <Storage />, path: "/equipements-technicien" },
    { text: "Tickets assignés", icon: <AssignmentInd />, path: "/tickets-assignes" },
    { text: "Mes interventions", icon: <Build />, path: "/mes-interventions" },
    { text: "Commentaires", icon: <CommentBank />, path: "/commentaires-tickets" }, 
    { text: "Kanban", icon: <ViewKanban />, path: "/kanban-technicien" },
    { text: "Mon profil", icon: <AccountCircle />, path: "/mon-profil-technicien" }, 
  ];

  const getNormalMenuItemsByFonction = () => {
    
    switch (user?.PERS_fonction) {
      case "CHEF_SERVICE":
        return [
          { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-chef-service" },
          { text: "Mes Tickets", icon: <ConfirmationNumber />, path: "/mes-tickets-normal" },
          { text: "Mes Équipements", icon: <Inventory />, path: "/mes-equipements-normal" },
          { text: "Mon Profil", icon: <AccountCircle />, path: "/profile-normal" }, // Vérifier le chemin
        ];
      case "COMPTABLE":
        return [
          { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-Comptable" },
          { text: "Mes Tickets", icon: <ConfirmationNumber />, path: "/mes-tickets-normal" },
          { text: "Mes Équipements", icon: <Inventory />, path: "/mes-equipements-normal" }, // Peut-être pas pertinent pour un comptable ? À vérifier
          { text: "Mon Profil", icon: <AccountCircle />, path: "/profile-normal" },
        ];
      case "RESPONSABLE_MAINTENANCE":
        return [
          { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-responsable-maintenance" },
          { text: "Gestion Tickets", icon: <ConfirmationNumber />, path: "/gestion-tickets" }, // Chemin corrigé? Vérifier ta config
           { text: "Gestion Interventions", icon: <AssignmentTurnedIn />, path: "/gestion-interventions" }, // Chemin corrigé?
           { text: "Gestion Equipements", icon: <Storage />, path: "/gestion-equipements" }, // Chemin corrigé?
          { text: "Mon Profil", icon: <AccountCircle />, path: "/profile-normal" },
        ];
      case "GESTIONNAIRE_TICKETS":
        return [
          { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-Gestionnaire-Tickets" },
          { text: "Tickets", icon: <ConfirmationNumber />, path: "/gestion-tickets" }, 
        
          { text: "Mon Profil", icon: <AccountCircle />, path: "/profile-normal" },
        ];
      case "SECRÉTAIRE":
        return [
          { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-Secretaire" },
          { text: "Tickets", icon: <ConfirmationNumber />, path: "/gestion-tickets" }, 
   
          { text: "Mon Profil", icon: <AccountCircle />, path: "/profile-normal" },
        ];
      case "RH":
        return [
          { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-rh" },
          { text: "Personnel", icon: <Person />, path: "/gestion-personnel" }, 
          { text: "Mon Profil", icon: <AccountCircle />, path: "/profile-normal" },
        ];
      case "SUPPORT_CLIENT":
      default: 
        return [
          { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-support-client" },
          { text: "Mes Tickets", icon: <ConfirmationNumber />, path: "/mes-tickets-normal" },
          { text: "Mes Équipements", icon: <Inventory />, path: "/mes-equipements-normal" },
          { text: "Mon Profil", icon: <AccountCircle />, path: "/profile-normal" },
        ];
    }
  };


 
  const roleMenuItems = () => {
    if (!user) return []; 
    switch (user.role) {
      case "ADMIN":
      case "SUPER_ADMIN":
        return adminMenuItems;
      case "CLIENT":
        return clientMenuItems;
      case "TECHNICIEN":
        return technicienMenuItems;
      case "NORMAL":
        return getNormalMenuItemsByFonction();
      default:
        return [];
    }
  };


  return (
    <Drawer
      anchor="left"
      open={isOpen}
      onClose={() => toggleDrawer(false)}
      variant="temporary" 
      sx={{
        width: drawerWidth,
        flexShrink: 0,
      
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: theme.palette.background.paper, 
          color: theme.palette.text.primary, 
         
        },
      }}
    >
     
      <Box sx={{ width: drawerWidth, overflowY: 'auto' }}> 
        <List>
          
          <ListItem sx={{ py: 2, px: 2, backgroundColor: theme.palette.primary.dark, color: theme.palette.primary.contrastText }}> 
            <Avatar sx={{ marginRight: 2, bgcolor: theme.palette.secondary.main }}> 
                 {user?.name ? user.name.charAt(0) : <AccountCircle />} 
            </Avatar>
            <ListItemText
                 primary={user?.nom_prenom || "Utilisateur"}
                 secondary={user?.email || ""}
                 primaryTypographyProps={{ fontWeight: 'bold', color: 'inherit' }}
                 secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }} 
             />
          </ListItem>
          <Divider />

         
       

         
          <ListItemButton onClick={toggleRoleMenu} sx={{ py: 1.5 }}>
            <ListItemIcon><Settings color="action" /></ListItemIcon> 
            <ListItemText primary="Mon Espace" primaryTypographyProps={{ fontWeight: 'bold' }} />
            {openRoleMenu ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

       
          <Collapse in={openRoleMenu} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" ? adminMenuItems.map((group, idx) => (
                <Box key={`group-${idx}`}>
              
                  <Typography
                         variant="caption" 
                         display="block" 
                         sx={{
                             padding: "8px 16px", 
                             fontWeight: "bold",
                             color: theme.palette.text.secondary, 
                             textTransform: 'uppercase', 
                         }}
                    >
                    {group.group}
                  </Typography>
                 
                  {group.items.map((item, subIdx) => (
                    <ListItemButton
                      key={`item-${idx}-${subIdx}`}
                      onClick={() => handleNavigation(item.path)}
                         selected={isActive(item.path)} 
                         sx={{ 
                             pl: 4, 
                             py: 1.2,
                             '&.Mui-selected': { 
                                 backgroundColor: theme.palette.action.selected,
                                 color: theme.palette.primary.main,
                                 '& .MuiListItemIcon-root': {
                                     color: theme.palette.primary.main,
                                 },
                                 
                             },
                            
                             color: theme.palette.text.secondary,
                             '& .MuiListItemIcon-root': {
                                 color: theme.palette.action.active,
                             },
                             '&:hover': {
                                 backgroundColor: theme.palette.action.hover,
                             }
                         }} 
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive(item.path) ? 'bold' : 'normal' }} />
                    </ListItemButton>
                  ))}
                </Box>
              )) : null}

             
           
              {user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN" ? (
                 roleMenuItems().map((item, idx) => (
                     <ListItemButton
                         key={`role-item-${idx}`}
                         onClick={() => handleNavigation(item.path)}
                         selected={isActive(item.path)}
                          sx={{ 
                             pl: 4,
                             py: 1.2,
                             '&.Mui-selected': {
                                 backgroundColor: theme.palette.action.selected,
                                 color: theme.palette.primary.main,
                                 '& .MuiListItemIcon-root': {
                                     color: theme.palette.primary.main,
                                 },
                                
                             },
                             color: theme.palette.text.secondary,
                             '& .MuiListItemIcon-root': {
                                 color: theme.palette.action.active,
                             },
                              '&:hover': {
                                  backgroundColor: theme.palette.action.hover,
                             }
                         }} 
                     >
                         <ListItemIcon>{item.icon}</ListItemIcon>
                         <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive(item.path) ? 'bold' : 'normal' }} />
                     </ListItemButton>
                 ))
             ) : null}

            </List>
          </Collapse>

          <Divider sx={{ my: 1 }} />

         
          <ListItemButton onClick={handleLogout} sx={{ py: 1.5 }}>
            <ListItemIcon><Logout color="error" /></ListItemIcon>
            <ListItemText primary="Déconnexion" primaryTypographyProps={{ color: theme.palette.error.main, fontWeight: 'bold' }} />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
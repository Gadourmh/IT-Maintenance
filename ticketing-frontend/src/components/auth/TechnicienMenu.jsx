import React, { useCallback } from "react";
import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import {
  Dashboard,
  Storage,
  AssignmentInd,
  Build,
  CommentBank,
  ViewKanban,
  AccountCircle,
  Settings,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const TechnicienMenu = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  if (!user) return null;

  // Regroupement des pages par catégories
  const dashboardMenu = [
    { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-technicien" },
  ];

  const ticketMenu = [
    { text: "Tickets assignés", icon: <AssignmentInd />, path: "/mes-tickets-technicien" },
    { text: "Mes interventions", icon: <Build />, path: "/mes-interventions" },
    { text: "Commentaires", icon: <CommentBank />, path: "/commentaires-tickets" },
    { text: "Kanban", icon: <ViewKanban />, path: "/kanban-technicien" },
  ];

  const equipmentMenu = [
    { text: "Équipements", icon: <Storage />, path: "/equipements-technicien" },
  ];

  const profileMenu = [

     { text: "Mes performances", icon: <AccountCircle />, path: "/mes-performances-technicien" },
    { text: "Mon profil", icon: <AccountCircle />, path: "/mon-profil-technicien" },
  
  ];

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <Box sx={{ width: 250, padding: "10px" }}>
        {/* Tableau de bord */}
        <List>
          <Typography variant="h6" sx={{ marginLeft: 2, marginBottom: 1, color: "gray" }}>
            Tableau de bord
          </Typography>
          {dashboardMenu.map((item, index) => (
            <ListItemButton key={index} onClick={() => handleNavigation(item.path)} sx={{ padding: "10px 0" }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ marginTop: "10px" }} />

        {/* Tickets et interventions */}
        <List>
          <Typography variant="h6" sx={{ marginLeft: 2, marginBottom: 1, color: "gray" }}>
            Tickets & Interventions
          </Typography>
          {ticketMenu.map((item, index) => (
            <ListItemButton key={index} onClick={() => handleNavigation(item.path)} sx={{ padding: "10px 0" }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ marginTop: "10px" }} />

        {/* Équipements */}
        <List>
          <Typography variant="h6" sx={{ marginLeft: 2, marginBottom: 1, color: "gray" }}>
            Équipements
          </Typography>
          {equipmentMenu.map((item, index) => (
            <ListItemButton key={index} onClick={() => handleNavigation(item.path)} sx={{ padding: "10px 0" }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ marginTop: "10px" }} />

        {/* Profil et paramètres */}
        <List>
          <Typography variant="h6" sx={{ marginLeft: 2, marginBottom: 1, color: "gray" }}>
            Profil & Paramètres
          </Typography>
          {profileMenu.map((item, index) => (
            <ListItemButton key={index} onClick={() => handleNavigation(item.path)} sx={{ padding: "10px 0" }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ marginTop: "10px" }} />
      </Box>
    </Drawer>
  );
};

export default TechnicienMenu;

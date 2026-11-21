import React, { useCallback } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  ListSubheader,
  IconButton,
} from "@mui/material";
import {
  Dashboard,
  AssignmentTurnedIn,
  Storage,
  AccountCircle,
  CommentBank,
  Close,
  Payment,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ClientMenu = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fermeture du menu
  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Vérification du rôle de l'utilisateur
  if (!user) return null; // Empêche l'affichage si l'utilisateur n'est pas défini

  // Menu pour le rôle client
  const clientMenu = [
    { text: "Tableau de bord", icon: <Dashboard />, path: "/dashboard-client" },
    { text: "Mes demandes", icon: <AssignmentTurnedIn />, path: "/mes-tickets" },
    { text: "Mes appareils", icon: <Storage />, path: "/mes-equipements" },
     { text: "Mes Factures", icon: <Payment />, path: "/mes-factures" },

  ];

  const profileSettingsMenu = [
    { text: "Mon profil", icon: <AccountCircle />, path: "/mon-profil" },
    { text: "Mes commentaires", icon: <CommentBank />, path: "/mes-commentaires" },
  ];

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <div style={{ width: 250 }}>
        {/* Bouton de fermeture du menu */}
        <IconButton onClick={handleClose} style={{ marginLeft: "auto", marginRight: 10 }}>
          <Close />
        </IconButton>

        {/* Menu principal */}
        <List>
          <ListSubheader sx={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
            Menu Principal
          </ListSubheader>
          {clientMenu.map((item, index) => (
            <ListItem
              button
              key={index}
              // *** MODIFICATION ICI : Appel de navigate() PUIS de handleClose() ***
              onClick={() => {
                navigate(item.path);
                handleClose();
              }}
              // *** SUPPRESSION DE onClickCapture={handleClose} ***
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Menu de profil et paramètres */}
        <List>
          <ListSubheader sx={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
            Mon Espace
          </ListSubheader>
          {profileSettingsMenu.map((item, index) => (
            <ListItem
              button
              key={index}
              // *** MODIFICATION ICI : Appel de navigate() PUIS de handleClose() ***
              onClick={() => {
                navigate(item.path);
                handleClose();
              }}
              // *** SUPPRESSION DE onClickCapture={handleClose} ***
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </div>
    </Drawer>
  );
};

export default ClientMenu;
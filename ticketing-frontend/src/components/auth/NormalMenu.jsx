import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
} from "@mui/material";
import {
  Dashboard,
  AssignmentTurnedIn,
  Storage,
  CommentBankOutlined,
  Notifications,
  AccountCircle,
  Group,
  People,
  Assessment,
  History,
  Work,
  Money,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NormalMenu = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClose = () => setOpen(false);
  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  const getDashboardPath = () => {
    switch (user?.fonction) {
      case "CHEF_SERVICE":
        return "/dashboard-chef-service";
      case "RESPONSABLE_MAINTENANCE":
        return "/dashboard-responsable-maintenance";
      case "GESTIONNAIRE_TICKETS":
        return "/dashboard-gestionnaire-tickets";
      case "SECRETAIRE":
        return "/dashboard-secretaire";
      case "COMPTABLE":
        return "/dashboard-comptable";
      case "RH":
        return "/dashboard-rh";
      case "SUPPORT_CLIENT":
        return "/dashboard-support-client";
      default:
        return "/dashboard-gestionnaire-tickets";
    }
  };

  // Définition dynamique des éléments du menu selon la fonction
  const getMenuItemsByFonction = () => {
    const commonItems = [
      { text: "Tableau de bord", icon: <Dashboard />, path: getDashboardPath() },
      { text: "Mon Profil", icon: <AccountCircle />, path: "/mon-profil-normal" }
    ];

    const fonctionMenus = {
      CHEF_SERVICE: [
        { text: "Les Personnels", icon: <Group />, path: "/mes-personnels-normal" },
        { text: "Les Tickets", icon: <AssignmentTurnedIn />, path: "/mes-tickets-normal" },
        { text: "Les Techniciens", icon: <People />, path: "/mes-techniciens-normal" },
         { text: "Mes Performances", icon: <Assessment />, path: "/mes-performances-normal" }, 
      ],
      RESPONSABLE_MAINTENANCE: [
        { text: "Les Équipements", icon: <Storage />, path: "/mes-equipements-normal" },
        { text: "Les Interventions", icon: <AssignmentTurnedIn />, path: "/mes-interventions-normal" },
        { text: "Les Techniciens", icon: <People />, path: "/mes-techniciens-normal" },
           { text: "Mes Performances", icon: <Assessment />, path: "/mes-performances-normal" }, 
      ],
      GESTIONNAIRE_TICKETS: [
        { text: "Les Tickets", icon: <AssignmentTurnedIn />, path: "/mes-tickets-normal" },
        { text: "Mes Commentaires", icon: <CommentBankOutlined />, path: "/mes-commentaires-normal" },
        { text: "Les Clients", icon: <People />, path: "/mes-clients-normal" },
           { text: "Mes Performances", icon: <Assessment />, path: "/mes-performances-normal" }, 
      ],
      SECRETAIRE: [
        { text: "Les Tickets", icon: <AssignmentTurnedIn />, path: "/mes-tickets-normal" },
        { text: "Les Clients", icon: <People />, path: "/mes-clients-normal" },
        { text: "Mes Notifications", icon: <Notifications />, path: "/mes-notifications-normal" },
           { text: "Mes Performances", icon: <Assessment />, path: "/mes-performances-normal" }, 
      ],
      COMPTABLE: [
        { text: "Rapports Financiers", icon: <Assessment />, path: "/rapports-financiers-normal" },
        { text: "Historique des Transactions", icon: <History />, path: "/historique-transactions-normal" },
        { text: "Gestion des Budgets", icon: <Storage />, path: "/gestion-budgets-normal" },
         { text: "Les Factures", icon: <Money />, path: "/facture-client" }, 
            { text: "Mes Performances", icon: <Assessment />, path: "/mes-performances-normal" }, 
      ],
      RH: [
        { text: "Les Personnels", icon: <Group />, path: "/mes-personnels-normal" },
        { text: "Suivi des Performances", icon: <Assessment />, path: "/suivi-performances-normal" }, 
        { text: "Recrutement", icon: <Work />, path: "/recrutement-normal" } 
      ],
      SUPPORT_CLIENT: [
        { text: "Les Tickets", icon: <AssignmentTurnedIn />, path: "/mes-tickets-normal" },
        { text: "Les Clients", icon: <People />, path: "/mes-clients-normal" },
        { text: "Mes Commentaires", icon: <CommentBankOutlined />, path: "/mes-commentaires-normal" },
         { text: "Mes Performances", icon: <Assessment />, path: "/mes-performances-normal" }, 
      ]
    };

    const fonction = user?.fonction;

    return [...commonItems, ...(fonctionMenus[fonction] || [])];
  };

  const menuItems = getMenuItemsByFonction();

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <Box sx={{ width: 250, padding: "10px" }}>
        <List>
          {/* Titre général du menu */}
          <Typography variant="h6" sx={{ marginLeft: 2, marginBottom: 1, color: "gray" }}>
            Menu Principal
          </Typography>

          {/* Liste des éléments de menu */}
          {menuItems.map((item, index) => (
            <ListItem button key={item.path} onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Divider />
      </Box>
    </Drawer>
  );
};

export default NormalMenu;

import React from "react";
import {
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  Divider, ListSubheader
} from "@mui/material";
import {
  Dashboard, People, Settings, BarChart, AssignmentTurnedIn,
  Storage, Dns, BugReport, AccountCircle, ViewKanban,
  Group, CommentBankOutlined, Notifications,
  Assessment, History, Work,Money
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminMenu = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleClose = () => setOpen(false);
  const handleNavigation = (path) => {
    navigate(path);
    handleClose();
  };

  // Menus regroupés par catégorie
  const menuSections = [
    {
      title: "Gestion",
      items: [
        { text: "Tableau de Bord", icon: <Dashboard />, path: "/dashboard" },
        { text: "Gestion du Personnel", icon: <Group />, path: "/gestion-personnel" },
        { text: "Gestion des Clients", icon: <People />, path: "/gestion-clients" },
        { text: "Gestion des Techniciens", icon: <People />, path: "/gestion-techniciens" },
        { text: "Gestion des Tickets", icon: <AssignmentTurnedIn />, path: "/gestion-tickets" },
        { text: "Gestion des Équipements", icon: <Storage />, path: "/gestion-equipements" },
        { text: "Types d'Équipements", icon: <Dns />, path: "/gestion-type-equipements" },
        { text: "Types de Pannes", icon: <BugReport />, path: "/gestion-type-pannes" },
        { text: "Gestion des Interventions", icon: <AssignmentTurnedIn />, path: "/gestion-interventions" },
      ],
    },
    {
      title: "Paramètres & Statistiques",
      items: [
        { text: "Statistiques", icon: <BarChart />, path: "/statistiques" },
        { text: "Gestion des Commentaires", icon: <CommentBankOutlined />, path: "/gestion-commentaires" },
        { text: "Gestion des Notifications", icon: <Notifications />, path: "/gestion-notifications" },
      ],
    },
    {
      title: "Finances & Performances",
      items: [
        { text: "Rapports Financiers", icon: <Assessment />, path: "/rapports-financiers" },
        { text: "Historique des Transactions", icon: <History />, path: "/historique-transactions" },
        { text: "Gestion des Budgets", icon: <Storage />, path: "/gestion-budgets" },
        { text: "Suivi des Performances", icon: <Assessment />, path: "/suivi-performances" },
        { text: "Recrutement", icon: <Work />, path: "/recrutement" },
        { text: "Facture Client"  ,icon :<Money/> ,path:"/facture-client-admin"}
      ],
    },
    {
      title: "Utilisateur",
      items: [
        { text: "Profil", icon: <AccountCircle />, path: "/profile" },
        // { text: "Paramètres", icon: <Settings />, path: "/parametres" },
      ],
    },
  ];

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      {menuSections.map((section, i) => (
        <React.Fragment key={i}>
          <List
            subheader={
              <ListSubheader component="div">{section.title}</ListSubheader>
            }
          >
            {section.items.map((item, index) => (
              <ListItem button key={index} onClick={() => handleNavigation(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
          {i < menuSections.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </Drawer>
  );
};

export default AdminMenu;

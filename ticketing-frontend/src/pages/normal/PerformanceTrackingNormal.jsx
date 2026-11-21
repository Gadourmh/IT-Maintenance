import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/api"; // Assurez-vous que 'api' est votre instance Axios configurée

import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  MenuItem,
  IconButton,
  Menu,
  InputLabel,
  FormControl,
  Select,
} from "@mui/material";
import { blue, grey, red } from "@mui/material/colors";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';


const Performances = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);




  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // États pour les listes déroulantes Personnel et Technicien
  const [personnelList, setPersonnelList] = useState([]); // <-- Cette variable sera mise à jour
  const [technicienList, setTechnicienList] = useState([]);

  // Filtres
  const [filterEmploye, setFilterEmploye] = useState(""); // Ce filtre cherchera dans le nom de l'entité (Personnel ou Technicien)
  const [filterPeriode, setFilterPeriode] = useState("");
  const [filterNoteMin, setFilterNoteMin] = useState("");
  const [filterNoteMax, setFilterNoteMax] = useState("");


  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPerformanceForMenu, setSelectedPerformanceForMenu] = useState(null);
  const menuOpen = Boolean(anchorEl);




  useEffect(() => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Performances
        const performanceResponse = await api.get("/performances/", config);
        if (Array.isArray(performanceResponse.data)) {
          setPerformances(performanceResponse.data);
        } else {
          console.error("La réponse de l'API /performances n'est pas un tableau:", performanceResponse.data);
          setPerformances([]);
        }

        // Fetch Personnel (CORRIGÉ : Utilisation de /personnels)
        const personnelResponse = await api.get("/personnels", config); // <-- Chemin corrigé ici
        if (Array.isArray(personnelResponse.data)) {
          setPersonnelList(personnelResponse.data); // <-- Mise à jour de personnelList
        } else {
          console.error("La réponse de l'API /personnels n'est pas un tableau:", personnelResponse.data);
          setPersonnelList([]);
          setNotification({ // Notification en cas d'erreur de chargement des personnels
            open: true,
            message: "Échec du chargement des personnels.",
            severity: "error",
          });
        }

        // Fetch Technicians
        const technicianResponse = await api.get("/techniciens", config);
        if (Array.isArray(technicianResponse.data)) {
          setTechnicienList(technicianResponse.data);
        } else {
          console.error("La réponse de l'API /techniciens n'est pas un tableau:", technicianResponse.data);
          setTechnicienList([]);
          setNotification({ // Notification en cas d'erreur de chargement des techniciens
            open: true,
            message: "Échec du chargement des techniciens.",
            severity: "error",
          });
        }

      } catch (err) {
        console.error("Erreur de chargement des données complètes", err.response?.data || err);
        setError(err.response?.data?.message || "Erreur de chargement des données.");
        setPerformances([]);
        setPersonnelList([]);
        setTechnicienList([]);
        setNotification({ // Notification pour l'erreur principale de chargement
            open: true,
            message: err.response?.data?.message || "Erreur de chargement des données.",
            severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Les dépendances ne contiennent que les variables qui changent, pas les fonctions de mise à jour d'état

  const filteredPerformances = useMemo(() => {
    return performances.filter((performance) => {
      // Le filtre employe doit maintenant vérifier le nom dans l'objet peuplé, quel que soit son type
      const entityName = performance.PRF_type_entite === 'Personnel'
                         ? performance.PRF_employe?.PERS_nom_prenom
                         : performance.PRF_employe?.TECH_nom_prenom;

      const employeMatch = filterEmploye === "" || (entityName && entityName.toLowerCase().includes(filterEmploye.toLowerCase()));

      const periodeMatch = filterPeriode === "" || (performance.PRF_periode && performance.PRF_periode.toLowerCase().includes(filterPeriode.toLowerCase()));

      const noteValue = typeof performance.PRF_note === 'number' ? performance.PRF_note : NaN;
      const noteMin = filterNoteMin === "" ? -Infinity : Number(filterNoteMin);
      const noteMax = filterNoteMax === "" ? Infinity : Number(filterNoteMax);

      const noteMatch = !isNaN(noteValue) && noteValue >= noteMin && noteValue <= noteMax;

      const isNoteFilterApplied = filterNoteMin !== "" || filterNoteMax !== "";
      const finalNoteMatch = isNoteFilterApplied ? noteMatch : true;


      return employeMatch && periodeMatch && finalNoteMatch;
    });
  }, [performances, filterEmploye, filterPeriode, filterNoteMin, filterNoteMax]);


  const resetFilters = () => {
    setFilterEmploye("");
    setFilterPeriode("");
    setFilterNoteMin("");
    setFilterNoteMax("");
  };



  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: "#fff", minHeight: "100vh" }}>

      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: blue[900] }}>
        Gestion des Performances
      </Typography>

      {error && !notification.open && (
        <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: red[500], borderRadius: 1, bgcolor: red[50] }}>
          <Typography variant="h6" color="error">{error}</Typography>
        </Box>
      )}


      <Paper sx={{ padding: 2, marginBottom: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: grey[800] }}>
          Filtres
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}> {/* Adjust grid size */}
            <TextField
              label="Nom de l'Employé/Technicien" // Updated label
              variant="outlined"
              size="small"
              fullWidth
              value={filterEmploye}
              onChange={(e) => setFilterEmploye(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}> {/* Adjust grid size */}
            <TextField
              label="Période"
              variant="outlined"
              size="small"
              fullWidth
              value={filterPeriode}
              onChange={(e) => setFilterPeriode(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Note Min"
              type="number"
              inputProps={{ step: "0.1", min: "0", max: "20" }}
              variant="outlined"
              size="small"
              fullWidth
              value={filterNoteMin}
              onChange={(e) => setFilterNoteMin(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Note Max"
              type="number"
              inputProps={{ step: "0.1", min: "0", "max": "20" }}
              variant="outlined"
              size="small"
              fullWidth
              value={filterNoteMax}
              onChange={(e) => setFilterNoteMax(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="outlined" onClick={resetFilters} fullWidth color="secondary">
              Réinitialiser Filtres
            </Button>
          </Grid>
        </Grid>
      </Paper>


 

      <TableContainer component={Paper} sx={{ marginTop: 2, boxShadow: 3, borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="performances table">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Entité</TableCell> {/* Column updated */}
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Type d'Entité</TableCell> {/* New Column */}
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Période</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Objectifs</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Réalisations</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Note</TableCell>
              <TableCell sx={{ color: "black", fontWeight: 'bold' }}>Commentaires</TableCell>
           
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPerformances.length > 0 ? (
              filteredPerformances.map((performance, index) => (
                <TableRow
                  key={performance._id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? grey[100] : "white",
                    "&:hover": { backgroundColor: grey[200] },
                  }}
                >
                  {/* Affichage de l'entité basée sur le type */}
                  <TableCell>
                    {performance.PRF_type_entite === 'Personnel'
                      ? performance.PRF_employe?.PERS_nom_prenom || 'N/A'
                      : performance.PRF_employe?.TECH_nom_prenom || 'N/A'}
                  </TableCell>
                  <TableCell>{performance.PRF_type_entite || 'N/A'}</TableCell> {/* Affichage du type */}
                  <TableCell>{performance.PRF_periode || 'N/A'}</TableCell>
                  <TableCell>{performance.PRF_objectifs || 'N/A'}</TableCell>
                  <TableCell>{performance.PRF_realisations || 'N/A'}</TableCell>
                  <TableCell>{typeof performance.PRF_note === 'number' ? `${performance.PRF_note} / 20` : 'Non noté'}</TableCell>
                  <TableCell>{performance.PRF_commentaires || '-'}</TableCell>
                 
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center"> {/* Colspan ajusté */}
                  {performances.length > 0 ? "Aucune performance ne correspond aux filtres." : "Aucune performance disponible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>



    

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Performances;
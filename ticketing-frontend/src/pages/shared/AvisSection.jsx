import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Rating,
  Card,
  CardContent,
  Avatar,
  Grid,
  TextField,
  Button,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import Swal from 'sweetalert2'; // Importation de SweetAlert2
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

const AvisSection = () => {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    AVIS_nom: "",
    AVIS_message: "",
    AVIS_note: 5,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
// -- MODIFICATION 1 --
  // Ce useEffect récupère les données du client connecté et met à jour le nom automatiquement.
  useEffect(() => {
    const fetchClientData = async () => {
      if (user && user.role === "CLIENT" && !isEditing) {
        try {
          // Utilise l'API pour récupérer les données spécifiques du client
          const res = await api.get("/clients/me");
          if (res.data && res.data.CLNT_raison_sociale) {
            setFormData((prevData) => ({
              ...prevData,
              AVIS_nom: res.data.CLNT_raison_sociale,
            }));
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des informations du client:", error);
          // En cas d'erreur, on se rabat sur le nom disponible dans le contexte
          setFormData((prevData) => ({
            ...prevData,
            AVIS_nom: user.name || user.CLNT_raison_sociale || "",
          }));
        }
      } else if (!user && !isEditing) {
        // Vide le champ si l'utilisateur se déconnecte
        setFormData((prevData) => ({ ...prevData, AVIS_nom: "" }));
      }
    };

    fetchClientData();
  }, [user, isEditing]); // Se déclenche quand l'utilisateur ou l'état d'édition change


  const fetchReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    try {
      const res = await api.get("/avis");
      setReviews(res.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des avis :", err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchReviews();
    }
  }, [fetchReviews, authLoading]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRatingChange = (e, newValue) => {
    setFormData({ ...formData, AVIS_note: newValue || 0 });
  };

   const resetForm = useCallback(() => {
    // La raison sociale sera automatiquement re-populée par le useEffect ci-dessus
    setFormData({
      AVIS_nom: formData.AVIS_nom, // Conserve le nom déjà chargé
      AVIS_message: "",
      AVIS_note: 5,
    });
    setIsEditing(false);
    setEditingReviewId(null);
  }, [formData.AVIS_nom]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || user.role !== "CLIENT") {
      Swal.fire({
        icon: 'warning',
        title: 'Action non autorisée',
        text: "Vous devez être un client connecté pour soumettre un avis.",
      });
      return;
    }
    if (!formData.AVIS_nom.trim()) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: "Le nom ne peut pas être vide." });
        return;
    }
     if (!formData.AVIS_message.trim()) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: "Le message ne peut pas être vide." });
        return;
    }

    setIsSubmitting(true);
    Swal.fire({
        title: isEditing ? 'Modification en cours...' : 'Soumission en cours...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
      if (isEditing) {
        await api.put(`/avis/${editingReviewId}`, formData);
        Swal.fire({
            icon: 'success',
            title: 'Avis modifié !',
            text: 'Votre avis a été mis à jour avec succès.',
            timer: 2500,
            showConfirmButton: false
        });
      } else {
        await api.post("/avis", formData);
        Swal.fire({
            icon: 'success',
            title: 'Avis soumis !',
            text: 'Merci pour votre retour ! Votre avis a été enregistré.',
            timer: 2500,
            showConfirmButton: false
        });
      }
      resetForm();
      fetchReviews();
    } catch (err) {
      console.error("Erreur lors de la soumission de l'avis :", err.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Erreur de soumission',
        text: err.response?.data?.error || err.response?.data?.message || "Une erreur est survenue lors de l'enregistrement de l'avis.",
      });
    } finally {
        setIsSubmitting(false);
        // Swal.close() est géré par les alertes de succès/erreur individuelles
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: "Cette action est irréversible !",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer !',
        cancelButtonText: 'Annuler'
    }).then(async (result) => {
        if (result.isConfirmed) {
            setIsSubmitting(true); // Utiliser le même état pour le chargement
            Swal.fire({
                title: 'Suppression en cours...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });
            try {
              await api.delete(`/avis/${id}`);
              Swal.fire(
                'Supprimé !',
                "L'avis a été supprimé avec succès.",
                'success'
              );
              fetchReviews();
            } catch (err) {
              console.error("Erreur lors de la suppression de l'avis :", err.response?.data || err);
              Swal.fire(
                'Erreur',
                err.response?.data?.message || "Une erreur est survenue lors de la suppression.",
                'error'
              );
            } finally {
                setIsSubmitting(false);
            }
        }
    });
  };

  const handleEdit = (review) => {
    setFormData({
      AVIS_nom: review.AVIS_nom || review.AVIS_client?.CLNT_raison_sociale || "",
      AVIS_message: review.AVIS_message,
      AVIS_note: review.AVIS_note,
    });
    setIsEditing(true);
    setEditingReviewId(review._id);
    // Optionnel: scroller vers le formulaire
    const formElement = document.getElementById("avis-form-card"); // Ajoutez un id à la Card du formulaire
    if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth" });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Affiche un loader global pendant que l'état d'authentification est vérifié
  if (authLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
        </Box>
    );
  }

  // Le bloc `if (!user)` qui empêchait l'affichage des avis est retiré.
  // Le formulaire et les actions seront conditionnellement affichés plus bas.

  return (
    <Box sx={{ mt: {xs: 2, md:4}, mb: {xs:2, md:4}, px: {xs: 1, md:0} }}>
      <Typography variant="h4" textAlign="center" gutterBottom sx={{fontSize: {xs: '1.8rem', md: '2.5rem'}}}>
        Découvrez ce que nos clients pensent de nous
      </Typography>

      {/* Formulaire de soumission/modification d'avis, visible uniquement pour les CLIENTS connectés */}
      {user && user.role === "CLIENT" && (
        <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
          <Card id="avis-form-card" sx={{ width: "100%", maxWidth: 650, p: {xs: 2, md:3} }}> {/* id ajouté ici */}
            <CardContent>
                <Typography variant="h6" textAlign="center" gutterBottom sx={{fontSize: {xs: '1.2rem', md: '1.5rem'}}}>
                {isEditing ? "Modifier votre avis" : "Partagez votre avis !"}
                </Typography>
                <form onSubmit={handleSubmit}>
                <TextField
                    label="Votre nom"
                    name="AVIS_nom"
                    value={formData.AVIS_nom}
                    onChange={handleChange}
                    fullWidth
                    required
                    InputLabelProps={{ sx: { color: 'black' } }}
                    sx={{ 
                        mb: 2,
                        '& .MuiInputBase-input': { color: 'black' },
                    }}
                    disabled
                />
                <TextField
                    label="Votre message"
                    name="AVIS_message"
                    value={formData.AVIS_message}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    required
                    InputLabelProps={{ sx: { color: 'black' } }}
                    sx={{ 
                        mb: 2,
                        '& .MuiInputBase-input': { color: 'black' },
                    }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography component="legend" sx={{ mr: 1, color: 'text.primary' }}>Votre note</Typography>
                    <Rating
                    name="AVIS_note"
                    value={Number(formData.AVIS_note)}
                    onChange={handleRatingChange}
                    />
                </Box>
                <Button variant="contained" color="primary" type="submit" fullWidth disabled={isSubmitting || isLoadingReviews}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditing ? "Mettre à jour" : "Soumettre")}
                </Button>
                {isEditing && (
                    <Button
                    variant="outlined"
                    color="secondary"
                    onClick={resetForm}
                    fullWidth
                    sx={{ mt: 1 }}
                    disabled={isSubmitting || isLoadingReviews}
                    >
                    Annuler la modification
                    </Button>
                )}
                </form>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Affichage des avis */}
      {isLoadingReviews ? (
         <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
         </Box>
      ) : reviews.length === 0 && !isLoadingReviews ? (
        <Box sx={{ my: 3, textAlign: 'center' }}>
            <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                Aucun avis pour le moment.
            </Typography>
            {/* Message optionnel si l'utilisateur n'est pas connecté et qu'il n'y a pas d'avis */}
            {(!user || user.role !== "CLIENT") && (
                 <Typography sx={{ mt:1, color: 'text.secondary' }}>
                    Soyez le premier à en laisser un en vous connectant en tant que client !
                 </Typography>
            )}
        </Box>
      ) : (
        <Grid container spacing={{xs: 2, md:3}} justifyContent="center">
          {reviews.map((review) => {
            const clientReviewer = review.AVIS_client;
            
            // Les actions ne sont possibles que si un utilisateur est connecté et autorisé
            const isOwner = user && user.role === "CLIENT" && clientReviewer && (user.id === clientReviewer._id || user._id === clientReviewer._id);
            const isAdminOrSuperAdmin = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");

            const canEdit = isOwner;
            const canDelete = isOwner || isAdminOrSuperAdmin;
            
            const displayName = review.AVIS_nom || clientReviewer?.CLNT_raison_sociale || "Utilisateur Anonyme";
            const avatarChar = displayName.charAt(0).toUpperCase();
            const avatarSrc = clientReviewer?.CLNT_photo_profil || undefined;

            return (
              // -- MODIFICATION ICI --
              <Grid item xs={12} sm={10} md={8} lg={6} key={review._id}>
                <Card sx={{ boxShadow: 2, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2}}>
                  <CardContent sx={{ flexGrow: 1, p: {xs:2, md:2.5} }}>
                    <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                      <Avatar 
                        src={avatarSrc}
                        sx={{ bgcolor: avatarSrc ? 'transparent' : 'secondary.main', color: 'white', width: 40, height: 40 }}
                      >
                        {!avatarSrc && avatarChar}
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="bold">{displayName}</Typography>
                    </Box>
                    <Rating value={review.AVIS_note} readOnly size="small" sx={{mb:1}}/>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1, wordBreak: 'break-word' }}>
                      "{review.AVIS_message}"
                    </Typography>
                  <Typography variant="caption" display="block" color="text.disabled" mt={1}>
    Le {new Date(review.AVIS_dateCreation).toLocaleDateString()}
    {(user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && 
      new Date(review.AVIS_dateCreation).getTime() !== new Date(review.AVIS_dateMiseAJour).getTime()) && 
     ` (modifié le ${new Date(review.AVIS_dateMiseAJour).toLocaleDateString()})`}
</Typography>

                  </CardContent>
                  {/* Afficher les boutons d'action uniquement si l'utilisateur est connecté et autorisé */}
                  {user && (canEdit || canDelete) && (
                    <Box 
                        sx={{ 
                            mt: 'auto', 
                            p: 1, 
                            borderTop: '1px solid', 
                            borderColor: 'divider', 
                            display: 'flex', 
                            justifyContent: (canEdit && canDelete) ? 'space-between' : 'flex-end' 
                        }}
                    >
                      {canEdit && (
                        <IconButton onClick={() => handleEdit(review)} color="primary" size="small" aria-label="modifier l'avis">
                          <Edit fontSize="small"/>
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton onClick={() => handleDelete(review._id)} color="error" size="small" aria-label="supprimer l'avis">
                          <Delete fontSize="small"/>
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Snackbar n'est plus utilisé */}
    </Box>
  );
};

export default AvisSection;
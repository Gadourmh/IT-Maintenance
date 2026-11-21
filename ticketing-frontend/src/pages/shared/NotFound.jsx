import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
      }}
    >
      <Typography variant="h2" color="error" sx={{ fontWeight: "bold" }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Oups ! La page que vous cherchez n'existe pas.
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate("/")}>
        Retour à l'accueil
      </Button>
    </Box>
  );
};

export default NotFound;



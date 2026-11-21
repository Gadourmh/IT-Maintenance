import { Box, Typography, useTheme } from "@mui/material";

const Footer = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        textAlign: "center",
        py: 3,
        backgroundColor: 'transparent',
        mt: 0,
        color: '#fff',
      }}
    >
      <Typography variant="body2" color="inherit">
        © 2025 Gestion des Tickets - Tous droits réservés.
      </Typography>
    </Box>
  );
};

export default Footer;
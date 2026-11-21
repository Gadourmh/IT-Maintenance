import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <p>Chargement...</p>;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case "ADMIN":
      case "SUPER_ADMIN":
        return <Navigate to="/dashboard" />;
      case "TECHNICIEN":
        return <Navigate to="/dashboard-technicien" />;
      case "CLIENT":
        return <Navigate to="/dashboard-client" />;
      case "NORMAL":
        // 🔁 Rediriger selon la fonction du personnel NORMAL
        switch (user.fonction) {
          case "CHEF_SERVICE":
            return <Navigate to="/dashboard-chef-service" />;
          case "RESPONSABLE_MAINTENANCE":
            return <Navigate to="/dashboard-responsable-maintenance" />;
          case "GESTIONNAIRE_TICKETS":
            return <Navigate to="/dashboard-gestionnaire-tickets" />;
          case "SECRÉTAIRE":
            return <Navigate to="/dashboard-Secretaire" />;
          case "COMPTABLE":
            return <Navigate to="/dashboard-Comptable" />;
          case "RH":
            return <Navigate to="/dashboard-rh" />;
          case "SUPPORT_CLIENT":
            return <Navigate to="/dashboard-support-Client" />;
        }
      default:
        return <Navigate to="/" />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

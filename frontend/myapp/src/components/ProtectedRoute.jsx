import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, admin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to={admin ? "/admin/login" : "/login"} state={{ from: location.pathname }} replace />
    );
  }

  if (admin && user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  if (!admin && (location.pathname === "/login" || location.pathname === "/register")) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
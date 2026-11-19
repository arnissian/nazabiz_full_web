import { Navigate, Outlet } from "react-router-dom";
import { useIsAuthenticated } from "../utils/auth/useIsAuthenticated";


export default function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

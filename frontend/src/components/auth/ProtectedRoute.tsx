import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../../lib/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const location = useLocation();

  if (!token) {
    // Redirect them to the login page, but save the current location they were
    // trying to go to when they were redirected.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

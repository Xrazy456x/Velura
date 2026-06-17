import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isBooting } = useAuth();
  const location = useLocation();

  if (isBooting) {
    return (
      <div className="section-shell grid min-h-[55vh] place-items-center">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-sm font-semibold text-stone-700 shadow-soft">
          <Loader2 className="animate-spin text-leaf" size={20} aria-hidden="true" />
          Loading portal
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

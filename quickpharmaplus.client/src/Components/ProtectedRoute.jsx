import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

// Protect routes; wait for auth rehydration before redirecting.
export default function ProtectedRoute({ children, allowedRoles }) {
    const location = useLocation();
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        // Return null or a small spinner component while rehydrating.
        return null;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const userRoles = user.roles || [];
        const isAllowed = userRoles.some(r => allowedRoles.includes(r));
        if (!isAllowed) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
}

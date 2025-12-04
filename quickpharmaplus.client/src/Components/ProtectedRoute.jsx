import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

// This component protects routes based on authentication and optionally role.
export default function ProtectedRoute({ children, allowedRoles }) {

    const { user } = useContext(AuthContext);

    // If there is no user in context or localStorage → redirect to login.
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If specific roles are required, check them here.
    if (allowedRoles && allowedRoles.length > 0) {
        const userRoles = user.roles || [];

        const isAllowed = userRoles.some(r => allowedRoles.includes(r));

        if (!isAllowed) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // If authenticated (and role matches if required), show the page.
    return children;
}

import { useState } from "react";
import { AuthContext } from "./AuthContext.jsx";

// Synchronously rehydrate from sessionStorage to avoid a flash redirect on full refresh.
export default function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = sessionStorage.getItem("user");
            if (stored && stored !== "undefined") {
                return JSON.parse(stored);
            }
        } catch (err) {
            console.error("Failed to parse stored user:", err);
            sessionStorage.removeItem("user");
        }
        return null;
    });

    // Use a loading flag if you plan to call the server to validate/refresh the session.
    // For pure sessionStorage-only approach we can keep loading false.
    const loading = false;

    const login = (userObj) => {
        setUser(userObj);
        try {
            sessionStorage.setItem("user", JSON.stringify(userObj));
        } catch (e) {
            console.error("Failed to persist user to sessionStorage", e);
        }
    };

    const logout = async () => {
        // If you have a server-side logout endpoint, call it with credentials: 'include'
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } catch (e) {
            console.warn("Logout request failed:", e);
        } finally {
            setUser(null);
            sessionStorage.removeItem("user");
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

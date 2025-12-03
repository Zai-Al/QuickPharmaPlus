// NavbarSelector.jsx
import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";   // unified navbar

export default function NavbarSelector() {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    // Pages where navbar should not appear
    const hideOnPages = [
        "/login",
        "/register",
        "/forgotPassword",
        "/resetPassword"
    ];

    // no navbar on login/registration pages
    if (hideOnPages.includes(location.pathname)) return null;

    // no navbar before login
    if (!user) return null;

    return <Navbar user={user} />;
}

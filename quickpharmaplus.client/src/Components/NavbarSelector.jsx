// NavbarSelector.jsx
import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext.jsx";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";   // unified navbar

export default function NavbarSelector() {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    // Pages where navbar should not appear (utility pages)
    const hideOnPages = [
        "/forgotPassword",
        "/resetPassworPublic"
    ];

    // don't render navbar on certain utility pages
    if (hideOnPages.includes(location.pathname)) return null;

    // always render Navbar; Navbar will show role-based or default links when user is null
    return <Navbar user={user} />;
}

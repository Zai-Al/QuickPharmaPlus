import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { WishlistContext } from "../Context/WishlistContext";
import { CartContext } from "../Context/CartContext";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function NavbarSelector() {
    const { user } = useContext(AuthContext);
    const { wishlistCount } = useContext(WishlistContext);
    const { cartCount } = useContext(CartContext);
    const location = useLocation();

    const hideOnPages = [
        "/forgotPassword",
        "/resetPassworPublic",
    ];

    if (hideOnPages.includes(location.pathname)) return null;

    return (
        <Navbar
            user={user}
            wishlistCount={wishlistCount}
            cartCount={cartCount}
        />
    );
}

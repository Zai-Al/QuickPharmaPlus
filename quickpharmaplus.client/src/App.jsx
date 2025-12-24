import "./App.css";
import NavbarSelector from "./Components/NavbarSelector";
import AppRoutes from "./AppRoute.jsx";
import { BrowserRouter } from "react-router-dom";
import { WishlistProvider } from "./Context/WishlistProvider.jsx";
import { CartProvider } from "./Context/CartProvider.jsx";

export default function App() {
    return (
        <BrowserRouter>
            <WishlistProvider>
                <CartProvider>
                    <NavbarSelector />
                    <AppRoutes />
                </CartProvider>
            </WishlistProvider>
        </BrowserRouter>
    );
}

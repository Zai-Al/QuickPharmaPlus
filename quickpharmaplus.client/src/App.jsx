import "./App.css";
import { BrowserRouter } from "react-router-dom";
import NavbarSelector from "./Components/NavbarSelector";
import AppRoutes from "./AppRoute.jsx";
import { AuthProvider } from "./Context/AuthContext";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <NavbarSelector />
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

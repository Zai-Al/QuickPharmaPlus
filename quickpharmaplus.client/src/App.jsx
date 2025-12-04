import "./App.css";
import NavbarSelector from "./Components/NavbarSelector";
import AppRoutes from "./AppRoute.jsx";
import { BrowserRouter } from "react-router-dom";


export default function App() {
    return (
        <>
            <BrowserRouter>

                <NavbarSelector />
                <AppRoutes />
            </BrowserRouter>

        </>
    );
}

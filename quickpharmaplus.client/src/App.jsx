import { Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout.jsx";
import NavbarSelector from "./Components/NavbarSelector";
import Home from "./Pages/Home.jsx";
import Privacy from "./Pages/Privacy.jsx";
import TermsOfUse from "./Pages/TermsOfUse.jsx";
import "./App.css";


export default function App() {
    return (
        <>
            {/* Role-based navbar */}
            <NavbarSelector />

            {/* Page content */}
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<TermsOfUse />} />
                </Routes>
            </Layout>
        </>
    );
}

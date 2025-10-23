import { NavLink } from "react-router-dom";
import logo from "../assets/Logo.jpg"; // make sure file name matches

const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    fontWeight: "500",
    color: isActive ? "#0077cc" : "#333",
    background: isActive ? "rgba(0,119,204,0.1)" : "transparent",
});

export default function Navbar() {
    return (
        <header style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            borderBottom: "1px solid #eee",
            background: "#fafafa"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={logo} alt="QuickPharma+" style={{ height: 35 }} />
                <strong>QuickPharma+</strong>
            </div>

            <nav style={{ display: "flex", gap: 8 }}>
                <NavLink to="/" style={linkStyle} end>Home</NavLink>
                <NavLink to="/privacy" style={linkStyle}>Privacy</NavLink>
            </nav>
        </header>
    );
}

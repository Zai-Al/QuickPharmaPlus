import { NavLink } from "react-router-dom";
import logo from "../../assets/Logo.png";
import "../../App.css";

export default function EmployeeNavbar() {
    return (
        <nav
            className="navbar navbar-expand-lg bg-white shadow-sm py-0"
            style={{ borderBottom: "1px solid #e5e5e5" }}
        >
            <div className="container-fluid">

                {/* LOGO (Goes to dashboard) */}
                <a className="navbar-brand d-flex align-items-center px-3" href="/dashboard">
                    <img src={logo} alt="QuickPharma+" height="50" className="me-2" />
                </a>

                {/* CENTER NAVIGATION */}
                <ul className="navbar-nav mx-auto d-flex align-items-center">

                    <li className="nav-item">
                        <NavLink to="/terms" className="nav-link px-3">Terms of Use</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/privacy" className="nav-link px-3">Privacy Policy</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/products" className="nav-link px-3">Products</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/suppliers" className="nav-link px-3">Suppliers</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/orders" className="nav-link px-3">Orders</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/prescriptions" className="nav-link px-3">Prescriptions</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/safety-checks" className="nav-link px-3">Safety Checks</NavLink>
                    </li>

                </ul>

                {/* IDENTITY PROFILE ICON (auto-loaded later) */}
                <div className="px-3">
                    <div id="identity-profile-widget"></div>
                </div>

            </div>
        </nav>
    );
}

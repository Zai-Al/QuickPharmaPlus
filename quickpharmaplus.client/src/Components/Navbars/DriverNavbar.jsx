import { NavLink } from "react-router-dom";
import logo from "../../assets/Logo.png";
import "../../App.css";

export default function DriverNavbar() {
    return (
        <nav
            className="navbar navbar-expand-lg bg-white shadow-sm py-0"
            style={{ borderBottom: "1px solid #e5e5e5" }}
        >
            <div className="container-fluid">

                {/* LOGO → Takes the driver to dashboard */}
                <a className="navbar-brand d-flex align-items-center px-3" href="/driver/dashboard">
                    <img src={logo} alt="QuickPharma+" height="50" className="me-2" />
                </a>

                {/* CENTERED LINKS */}
                <ul className="navbar-nav mx-auto d-flex align-items-center">

                    <li className="nav-item">
                        <NavLink to="/driver/dashboard" className="nav-link px-3">Dashboard</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/terms" className="nav-link px-3">Terms of Use</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/privacy" className="nav-link px-3">Privacy Policy</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/delivery-requests" className="nav-link px-3">Delivery Requests</NavLink>
                    </li>

                </ul>

                {/* USER PROFILE ICON (Identity will override this later) */}
                <div className="px-3">
                    <div id="identity-profile-widget"></div>
                </div>

            </div>
        </nav>
    );
}

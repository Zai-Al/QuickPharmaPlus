import { NavLink, Link } from "react-router-dom";
import logo from "../../assets/Logo.png";
import "../Navigation.css";

export default function EmployeeNavbar() {

    //currently logged in user
    //change this when auth is implemented
    const loggedInUser = "EmployeeUser";
    return (
        <nav className="navbar navbar-expand-lg bg-white shadow-sm py-2">
            <div className="container-fluid">

                {/* LEFT — LOGO */}
                <div className="navbar-brand d-flex align-items-center me-4">
                    <img
                        src={logo}
                        alt="QuickPharma+ Logo"
                        height="48"
                        style={{ cursor: "default" }}
                    />
                </div>

                {/* CENTER NAVIGATION */}
                <ul className="navbar-nav mx-auto d-flex align-items-center">

                    <li className="nav-item">
                        <NavLink to="/managerDashboard" className="nav-link px-3">Dashboard</NavLink>
                    </li>

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

                {/* PROFILE BUTTON */}
                <Link
                    to="/profileInternal"
                    className="btn btn-dark d-flex align-items-center gap-2 px-3 py-2"

                >
                    <i className="bi bi-person-circle fs-5"></i>
                    {loggedInUser}
                </Link>

            </div>
        </nav>
    );
}

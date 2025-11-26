import { NavLink, Link } from "react-router-dom";
import logo from "../../assets/Logo.png";
import "../Navigation.css";
export default function AdminNavbar() {

    const loggedInUser = "AdminUser";

    return (
        <nav className="navbar navbar-expand-lg bg-white shadow-sm py-2 flex-nowrap">
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

                {/* CENTER — NAVIGATION (MATCHES EMPLOYEE STYLE) */}
                <ul className="navbar-nav mx-auto d-flex align-items-center">

                    <li className="nav-item">
                        <NavLink to="/adminDashboard" className="nav-link px-3">Dashboard</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/employees" className="nav-link px-3">Employees</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/delivery-requests" className="nav-link px-3">Delivery Requests</NavLink>
                    </li>

                    {/* DROPDOWN — but styled same inline spacing as employee */}
                    <li className="nav-item dropdown">
                        <a className="nav-link dropdown-toggle px-3" data-bs-toggle="dropdown" href="#">
                            Inventory Management
                        </a>

                        <div className="dropdown-menu">
                            <NavLink className="dropdown-item" to="/inventory">Inventory</NavLink>
                            <NavLink className="dropdown-item" to="/products">Products</NavLink>
                            <NavLink className="dropdown-item" to="/categories">Categories</NavLink>
                            <NavLink className="dropdown-item" to="/suppliers">Suppliers</NavLink>
                            <NavLink className="dropdown-item" to="/orders">Orders</NavLink>
                            <NavLink className="dropdown-item" to="/prescriptions">Prescriptions</NavLink>
                            <div className="dropdown-divider"></div>
                            <NavLink className="dropdown-item" to="/expired-products">Expired Products</NavLink>
                        </div>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/safety-checks" className="nav-link px-3">Safety Checks</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/reports" className="nav-link px-3">Reports</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/logs" className="nav-link px-3">Logs</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/terms" className="nav-link px-3">Terms of Use</NavLink>
                    </li>

                    <li className="nav-item">
                        <NavLink to="/privacy" className="nav-link px-3">Privacy Policy</NavLink>
                    </li>
                </ul>

                {/* RIGHT — PROFILE BUTTON (SAME AS EMPLOYEE NAVBAR) */}
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

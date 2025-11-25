import { NavLink, Link } from "react-router-dom";
import logo from "../../assets/Logo.png";
import "../../App.css";

export default function AdminNavbar() {
    return (
        <>
            <nav className="navbar navbar-expand-lg bg-white shadow-sm admin-navbar w-100 ">
                <div className="container-fluid px-4">

                    {/* LOGO */}
                    <Link to="/" className="navbar-brand d-flex align-items-center">
                        <img src={logo} alt="QuickPharma+" height="48" />
                    </Link>

                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#adminNav"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="adminNav">
                        <ul className="navbar-nav mx-auto align-items-center">


                            {/* OTHER TABS */}
                            <li className="nav-item">
                                <NavLink to="/employees" className="nav-link">Employees</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/prescriptions" className="nav-link">Prescriptions</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/delivery-requests" className="nav-link">Delivery Requests</NavLink>
                            </li>

                            {/* EXACT BOOTSWATCH DROPDOWN (Inventory Management) */}
                            <li className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    href="#"
                                    role="button"
                                    aria-haspopup="true"
                                    aria-expanded="false"
                                >
                                    Inventory Management
                                </a>

                                <div className="dropdown-menu">
                                    <NavLink className="dropdown-item" to="/inventory">Inventory</NavLink>
                                    <NavLink className="dropdown-item" to="/products">Products</NavLink>
                                    <NavLink className="dropdown-item" to="/categories">Categories</NavLink>
                                    <NavLink className="dropdown-item" to="/suppliers">Suppliers</NavLink>
                                    <NavLink className="dropdown-item" to="/orders">Orders</NavLink>

                                    <div className="dropdown-divider"></div>

                                    <NavLink className="dropdown-item" to="/expired-products">Expired Products</NavLink>
                                </div>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/safety-checks" className="nav-link">Safety Checks</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/reports" className="nav-link">Reports</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/logs" className="nav-link">Logs</NavLink>
                            </li>

                            {/* Terms */}
                            <li className="nav-item">
                                <NavLink to="/terms" className="nav-link">Terms of Use</NavLink>
                            </li>

                            {/* Privacy */}
                            <li className="nav-item">
                                <NavLink to="/privacy" className="nav-link">Privacy Policy</NavLink>
                            </li>
                        </ul>

                        {/* Identity placeholder */}
                        <div id="identity-profile-widget" className="ms-3"></div>
                    </div>
                </div>
            </nav>

            {/* UNDERLINE SECTION */}
            <div className="navbar-bottom-line"></div>
        </>
    );
}

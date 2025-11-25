import { NavLink, Link } from "react-router-dom";
import logo from "../../assets/Logo.png";
import "../../App.css";

export default function AdminNavbar() {

    //currently logged in user
    const loggedInUser = "AdminUser";

    return (
        <>
            <nav className="navbar navbar-expand-lg bg-white shadow-sm admin-navbar w-100">
                <div className="container-fluid px-4 d-flex align-items-center">

                    {/* LEFT — LOGO */}
                    <Link to="/" className="navbar-brand d-flex align-items-center me-4">
                        <img src={logo} alt="QuickPharma+" height="48" />
                    </Link>

                    {/* CENTER — NAVIGATION LINKS */}
                    <div className="flex-grow-1 d-flex justify-content-center">
                        <div className="collapse navbar-collapse show" id="adminNav">
                            <ul className="navbar-nav align-items-center gap-3">

                                <li className="nav-item">
                                    <NavLink to="/employees" className="nav-link">Employees</NavLink>
                                </li>

                                <li className="nav-item">
                                    <NavLink to="/prescriptions" className="nav-link">Prescriptions</NavLink>
                                </li>

                                <li className="nav-item">
                                    <NavLink to="/delivery-requests" className="nav-link">Delivery Requests</NavLink>
                                </li>

                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle" data-bs-toggle="dropdown" href="#">
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

                                <li className="nav-item">
                                    <NavLink to="/terms" className="nav-link">Terms of Use</NavLink>
                                </li>

                                <li className="nav-item">
                                    <NavLink to="/privacy" className="nav-link">Privacy Policy</NavLink>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* PROFILE BUTTON */}
                    <Link
                        to="/login"
                        className="btn btn-dark d-flex align-items-center gap-2 px-3 py-2"

                    >
                        <i className="bi bi-person-circle fs-5"></i>
                        {loggedInUser}
                    </Link>



                </div>
            </nav>

            <div className="navbar-bottom-line"></div>
        </>
    );
}

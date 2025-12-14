import { NavLink, Link } from "react-router-dom";
import { useContext } from "react";
import logo from "../assets/Logo.png";
import "./Navigation.css";
import { AuthContext } from "../Context/AuthContext.jsx";
import ExpandableSearch from "../Pages/External_System/Shared_Components/ExpandableSearch";
import { FiHeart} from "react-icons/fi";
import { TiShoppingCart } from "react-icons/ti";


export default function Navbar({ user: propUser, cartCount = 0,
    wishlistCount = 0, }) {
    const { user: ctxUser } = useContext(AuthContext);
    const user = propUser ?? ctxUser;

    const fName = user?.firstName || "";
    const lName = user?.lastName || "";
    const fullName = `${fName} ${lName}`.trim();

    const roles = user?.roles || [];

    const isAdmin = roles.includes("Admin");
    const isManager = roles.includes("Manager");
    const isPharmacist = roles.includes("Pharmacist");
    const isDriver = roles.includes("Driver");
    const isEmployee = isManager || isPharmacist;
    const isCustomer = roles.includes("Customer");


    return (
        <nav className="navbar navbar-expand-lg bg-white shadow-sm py-2 sticky-top"
            style={{ borderBottom: "1px solid #e5e5e5", zIndex: 1030 }}
        >
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


                {/* CENTER NAVIGATION (Role-Based) */}
                <ul className="navbar-nav mx-auto d-flex align-items-center">


                    {/* --------------------------------------------------------- */}
                    {/* ADMIN NAVBAR */}
                    {/* --------------------------------------------------------- */}
                    {isAdmin && (
                        <>
                            <li className="nav-item">
                                <NavLink to="/adminDashboard" className="nav-link px-3">Dashboard</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/employees" className="nav-link px-3">Employees</NavLink>
                            </li>

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
                                    <NavLink className="dropdown-item" to="/delivery-requests">Delivery Requests</NavLink>
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
                        </>
                    )}



                    {/* --------------------------------------------------------- */}
                    {/* EMPLOYEE NAVBAR (Manager + Pharmacist) */}
                    {/* --------------------------------------------------------- */}
                    {isEmployee && (
                        <>
                            <li className="nav-item">
                                <NavLink to={isManager ? "/managerDashboard" : "/pharmacistDashboard"} className="nav-link px-3">
                                    Dashboard
                                </NavLink>
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

                            <li className="nav-item">
                                <NavLink to="/terms" className="nav-link px-3">Terms of Use</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/privacy" className="nav-link px-3">Privacy Policy</NavLink>
                            </li>
                        </>
                    )}



                    {/* --------------------------------------------------------- */}
                    {/* DRIVER NAVBAR */}
                    {/* --------------------------------------------------------- */}
                    {isDriver && (
                        <>
                            <li className="nav-item">
                                <NavLink to="/driverDashboard" className="nav-link px-3">Dashboard</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/delivery-requests" className="nav-link px-3">Delivery Requests</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/terms" className="nav-link px-3">Terms of Use</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/privacy" className="nav-link px-3">Privacy Policy</NavLink>
                            </li>

                        </>
                    )}



                    {/* --------------------------------------------------------- */}
                    {/* CUSTOMER NAVBAR */}
                    {/* --------------------------------------------------------- */}
                    {isCustomer && (
                        <>
                            <li className="nav-item">
                                <NavLink to="/home" className="nav-link px-3">Home</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/productsPage" className="nav-link px-3">Products</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/myOrders" className="nav-link px-3">My Orders</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/healthProfile" className="nav-link px-3">Health Profile</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/terms" className="nav-link px-3">Terms of Use</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/privacy" className="nav-link px-3">Privacy Policy</NavLink>
                            </li>
                            

                            

                        </>
                    )}



                    {/* --------------------------------------------------------- */}
                    {/* DEFAULT PUBLIC NAVBAR (Anonymous / Not logged in) */}
                    {/* --------------------------------------------------------- */}
                    {!isAdmin && !isEmployee && !isDriver && !isCustomer && (
                        <>
                            {/* TODO: add general/default navigation here */}
                            <li className="nav-item">
                                <NavLink to="/home" className="nav-link px-3">Home</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/productsPage" className="nav-link px-3">Products</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/terms" className="nav-link px-3">Terms of Use</NavLink>
                            </li>

                            <li className="nav-item">
                                <NavLink to="/privacy" className="nav-link px-3">Privacy Policy</NavLink>
                            </li>
                            <ExpandableSearch onSearch={(term) => console.log("Searching:", term)} />
                        </>
                    )}

                </ul>



                <div className="d-flex align-items-center gap-3">
                    {isCustomer && (
                        <>
                            {/* Wishlist icon */}
                            <ExpandableSearch onSearch={(term) => console.log("Searching:", term)} />
                            <NavLink
                                to="/wishList"
                                className="nav-icon-link position-relative"
                            >
                                <FiHeart className="fs-5 nav-icon" />
                                {wishlistCount > 0 && (
                                    <span className="nav-badge">{wishlistCount}</span>
                                )}
                            </NavLink>

                            {/* Cart icon */}
                            <NavLink
                                to="/cart"
                                className="nav-icon-link position-relative"
                            >
                                <TiShoppingCart className="fs-5 nav-icon" />
                                {cartCount > 0 && (
                                    <span className="nav-badge">{cartCount}</span>
                                )}
                            </NavLink>
                        </>
                    )}

                    {/* Profile / Login button */}
                    <Link
                        to={
                            !user
                                ? "/login"
                                : isCustomer
                                    ? "/externalProfile"
                                    : "/profileInternal"
                        }
                        className="btn d-flex align-items-center gap-2 px-3 py-2"
                        style={{
                            border: "1px solid #000",
                            borderRadius: "6px",
                            background: "#fff",
                        }}
                    >
                        <i className="bi bi-person-circle fs-5"></i>
                        {user ? fullName : "Login"}
                    </Link>



                </div>
            </div>
        </nav>
    );
}

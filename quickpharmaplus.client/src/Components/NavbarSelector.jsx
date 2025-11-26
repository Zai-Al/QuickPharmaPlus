import AdminNavbar from "./Navbars/AdminNavbar";
import EmployeeNavBar from "./Navbars/EmployeeNavBar";
import DriverNavbar from "./Navbars/DriverNavbar";
//import CustomerNavbar from "./Navbars/CustomerNavbar";

export default function NavbarSelector() {
    //const role = localStorage.getItem("role");

    const role = "driver"; // For testing purposes only

    if (role === "admin") return <AdminNavbar />;
    if (role === "manager" || role === "pharmacist") return <EmployeeNavBar />;
    if (role === "driver") return <DriverNavbar />;
    if (role === "customer") return <CustomerNavbar />;

    return null;
}

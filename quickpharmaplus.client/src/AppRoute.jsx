import { Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout.jsx";

//Pages for General Information
import Home from "./Pages/Home.jsx";
import Privacy from "./Pages/Privacy.jsx";
import TermsOfUse from "./Pages/TermsOfUse.jsx";

//Pages for User Management
import Login from "./Pages/User_Managment/Login.jsx";
import InternalProfile from "./Pages/User_Managment/Profile_Internal.jsx";
import EditInternalProfile from "./Pages/User_Managment/Edit_Profile_Internal.jsx";

import Register from "./Pages/User_Managment/Register.jsx";
import ResetPassword from "./Pages/User_Managment/Reset_Password.jsx";
import ForgotPassword from "./Pages/User_Managment/Forgot_Password.jsx";

// Internal system dashboards
import AdminDashboard from "./Pages/Internal_System/Dashboards/AdminDashboard.jsx";
import DriverDashboard from "./Pages/Internal_System/Dashboards/DriverDashboard.jsx";
import PharmacistDashboard from "./Pages/Internal_System/Dashboards/PharmacistDashboard.jsx";
import ManagerDashboard from "./Pages/Internal_System/Dashboards/ManagerDashboard.jsx";


// Internal system supplier page

export default function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/*"
                element={
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<TermsOfUse />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/profileInternal" element={<InternalProfile />} />
                            <Route path="/editProfileInternal" element={<EditInternalProfile />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/resetPassword" element={<ResetPassword />} />
                            <Route path="/forgotPassword" element={<ForgotPassword />} />

                            {/* Internal system dashboard routes */}
                            <Route path="adminDashboard" element={<AdminDashboard />} />
                            <Route path="driverDashboard" element={<DriverDashboard />} />
                            <Route path="/pharmacistDashboard" element={<PharmacistDashboard />} />
                            <Route path="/managerDashboard" element={<ManagerDashboard />} />


                            {/* Internal system supplier route */}

                        </Routes>
                    </Layout>
                }
            />
        </Routes>
    );
}
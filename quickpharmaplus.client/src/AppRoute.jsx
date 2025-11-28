import { Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout.jsx";

// Pages for General Information
import Privacy from "./Pages/Privacy.jsx";
import TermsOfUse from "./Pages/TermsOfUse.jsx";

import ProtectedRoute from "./Components/ProtectedRoute";
import Unauthorized from "./Components/Unauthorized.jsx";

// Pages for User Management
import Login from "./Pages/User_Managment/Login.jsx";
import InternalProfile from "./Pages/User_Managment/Profile_Internal.jsx";
import EditInternalProfile from "./Pages/User_Managment/Edit_Profile_Internal.jsx";
import Register from "./Pages/User_Managment/Register.jsx";
import ResetPassword from "./Pages/User_Managment/Reset_Password.jsx";
import ForgotPassword from "./Pages/User_Managment/Forgot_Password.jsx";

// Dashboards
import AdminDashboard from "./Pages/Internal_System/Dashboards/AdminDashboard.jsx";
import DriverDashboard from "./Pages/Internal_System/Dashboards/DriverDashboard.jsx";
import PharmacistDashboard from "./Pages/Internal_System/Dashboards/PharmacistDashboard.jsx";
import ManagerDashboard from "./Pages/Internal_System/Dashboards/ManagerDashboard.jsx";

// Internal system pages
import EmployeesList from "./Pages/Internal_System/Admin/Employee/EmployeesList.jsx";
import SupplierList from "./Pages/Internal_System/Suppliers/SupplierList.jsx";
import ProductsList from "./Pages/Internal_System/Products/ProductsList.jsx";

export default function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/*"
                element={
                    <Layout>
                        <Routes>

                            {/* Public routes */}
                            <Route path="/" element={<Login />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/privacy" element={<Privacy />} />
                            <Route path="/terms" element={<TermsOfUse />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/resetPassword" element={<ResetPassword />} />
                            <Route path="/forgotPassword" element={<ForgotPassword />} />

                            {/* Unauthorized page */}
                            <Route path="/unauthorized" element={<Unauthorized />} />

                            {/* Protected routes */}

                            <Route
                                path="/profileInternal"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist", "Driver"]}>
                                        <InternalProfile />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/editProfileInternal"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist", "Driver"]}>
                                        <EditInternalProfile />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Dashboards */}
                            <Route
                                path="/adminDashboard"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/driverDashboard"
                                element={
                                    <ProtectedRoute allowedRoles={["Driver"]}>
                                        <DriverDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/pharmacistDashboard"
                                element={
                                    <ProtectedRoute allowedRoles={["Pharmacist"]}>
                                        <PharmacistDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/managerDashboard"
                                element={
                                    <ProtectedRoute allowedRoles={["Manager"]}>
                                        <ManagerDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Internal pages */}
                            <Route
                                path="/suppliers"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <SupplierList />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/products"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <ProductsList />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/employees"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <EmployeesList />
                                    </ProtectedRoute>
                                }
                            />

                        </Routes>
                    </Layout>
                }
            />
        </Routes>
    );
}

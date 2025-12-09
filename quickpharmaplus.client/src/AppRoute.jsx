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
import PublicResetPassword from "./Pages/User_Managment/Reset_Password_Public.jsx";

// Dashboards
import AdminDashboard from "./Pages/Internal_System/Dashboards/AdminDashboard.jsx";
import DriverDashboard from "./Pages/Internal_System/Dashboards/DriverDashboard.jsx";
import PharmacistDashboard from "./Pages/Internal_System/Dashboards/PharmacistDashboard.jsx";
import ManagerDashboard from "./Pages/Internal_System/Dashboards/ManagerDashboard.jsx";

// Internal system pages
import EmployeesList from "./Pages/Internal_System/Admin/Employee/EmployeesList.jsx";
import AddEmployee from "./Pages/Internal_System/Admin/Employee/AddEmployee.jsx";
import SupplierList from "./Pages/Internal_System/Suppliers/SupplierList.jsx";
import AddSupplier from "./Pages/Internal_System/Suppliers/AddSupplier.jsx";
import OrdersList from "./Pages/Internal_System/Orders/OrdersList.jsx";
import CreateOrder from "./Pages/Internal_System/Orders/CreateOrder.jsx";
import CreateAutomatedOrder from "./Pages/Internal_System/Orders/CreateAutomatedOrder.jsx";
import ProductsList from "./Pages/Internal_System/Products/ProductsList.jsx";
import AddProduct from "./Pages/Internal_System/Products/AddProduct.jsx";
import ViewProduct from "./Pages/Internal_System/Products/ViewProductDetails.jsx";
import CategoryList from "./Pages/Internal_System/Admin/Category/CategoryList.jsx";
import AddCategory from "./Pages/Internal_System/Admin/Category/AddCategory.jsx";
import CategoryType from "./Pages/Internal_System/Admin/Category/Types.jsx";
import InventoryList from "./Pages/Internal_System/Admin/Inventory/InventoryList.jsx";
import AddInventory from "./Pages/Internal_System/Admin/Inventory/AddInventory.jsx";
import PerscriptionsList from "./Pages/Internal_System/Perscriptions/PerscriptionsList.jsx";
import ViewPerscription from "./Pages/Internal_System/Perscriptions/PerscriptionDetails.jsx";
import ApprovePerscription from "./Pages/Internal_System/Perscriptions/PerscriptionApproval.jsx";

import ReportList from "./Pages/Internal_System/Admin/Report/ReportList.jsx";
import GenerateReport from "./Pages/Internal_System/Admin/Report/GenerateReport.jsx";
import ReportDetails from "./Pages/Internal_System/Admin/Report/ReportDetails.jsx";

import ExpiredProducts from "./Pages/Internal_System/Admin/Expired/ExpiredProductsList.jsx";

import LogsList from "./Pages/Internal_System/Admin/QuickPharmaLog/LogsList.jsx";
import DeliveryRequests from "./Pages/Internal_System/Delivery/DeliveryRequestList.jsx";


import SafetyCheck from "./Pages/Internal_System/SafetyCheck/SafetyCheck.jsx";


// External System Pages
import HealthProfile from "./Pages/External_System/Health_Profile/HomeProfile.jsx";
import PrescriptionDetails from "./Pages/External_System/Health_Profile/PrescriptionDetails.jsx";
import PlanDetails from "./Pages/External_System/Health_Profile/PlanDetails.jsx";
import MyOrders from "./Pages/External_System/My_Orders/MyOrders.jsx";
import MyOrderDetails from "./Pages/External_System/My_Orders/MyOrderDetails.jsx";
import Cart from "./Pages/External_System/Cart_And_Wish_List/Cart.jsx";
import Home from "./Pages/External_System/Home/Home.jsx";
import Product from "./Pages/External_System/Products/Product.jsx";
import ProductDetails from "./Pages/External_System/Products/ProductDetails.jsx";


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
                            <Route path="/forgotPassword" element={<ForgotPassword />} />
                            <Route path="/reset-password-public" element={<PublicResetPassword />} />


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
                                path="/resetPassword"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist", "Driver"]}>
                                        <ResetPassword />
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

                            <Route
                                path="/safety-checks"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist", "Driver"]}>
                                        <SafetyCheck />
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
                                path="/suppliers/add"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <AddSupplier />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/prescriptions"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <PerscriptionsList />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="//perscription/view"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <ViewPerscription />
                                    </ProtectedRoute>
                                }
                            />


                            <Route
                                path= "/prescriptions/approve"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <ApprovePerscription />
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
                                path="/addProduct"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <AddProduct />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/products/view"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <ViewProduct />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/orders"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <OrdersList />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/orders/create-auto"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <CreateAutomatedOrder />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/orders/create"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Manager", "Pharmacist"]}>
                                        <CreateOrder />
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

                            <Route
                                path="/employees/add"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <AddEmployee />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/categories"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <CategoryList/>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/categories/add"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <AddCategory />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/categories/types/:categoryId"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <CategoryType />
                                    </ProtectedRoute>
                                }
                            />


                            <Route
                                path="/inventory/add"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <AddInventory />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/inventory"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <InventoryList />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/expired-products"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <ExpiredProducts />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/logs"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <LogsList />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/reports"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <ReportList />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/report/details"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <ReportDetails />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/reports/generate"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin"]}>
                                        <GenerateReport />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/delivery-requests"
                                element={
                                    <ProtectedRoute allowedRoles={["Admin", "Driver"]}>
                                        <DeliveryRequests />
                                    </ProtectedRoute>
                                }
                            />

                            {/* External system pages */} 

                            
                            <Route path="/home" element={<Home />} />
                            <Route path="/productsPage" element={<Product />} />


                            

                            <Route path="/myOrders" element={<ProtectedRoute allowedRoles={["Customer"]}>
                                <MyOrders />
                            </ProtectedRoute>
                            }
                            />

                            <Route path="/healthProfile" element={<ProtectedRoute allowedRoles={["Customer"]}>
                                <HealthProfile />
                            </ProtectedRoute>
                            }
                            />

                            <Route path="/cart" element={<ProtectedRoute allowedRoles={["Customer"]}>
                                <Cart />
                            </ProtectedRoute>
                            }
                            />

                            <Route
                                path="/myOrderDetails/:id"
                                element={<ProtectedRoute allowedRoles={["Customer"]}>
                                    <MyOrderDetails />
                                </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/prescriptions/:id"
                                element={<ProtectedRoute allowedRoles={["Customer"]}>
                                    <PrescriptionDetails />
                                </ProtectedRoute>
                                }
                            />

                            <Route path="/PlanDetails/:id" element={<ProtectedRoute allowedRoles={["Customer"]}>
                                <PlanDetails />
                            </ProtectedRoute>
                            }
                            />

                            <Route path="/productDetails/:id" element={<ProtectedRoute allowedRoles={["Customer"]}>
                                <ProductDetails />
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

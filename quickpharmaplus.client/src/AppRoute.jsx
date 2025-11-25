import { Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout.jsx";

//Pages for General Information
import Home from "./Pages/Home.jsx";
import Privacy from "./Pages/Privacy.jsx";
import TermsOfUse from "./Pages/TermsOfUse.jsx";

//Pages for User Management
import Login from "./Pages/User_Managment/Login.jsx";
import Profile from "./Pages/User_Managment/Profile.jsx";
import Register from "./Pages/User_Managment/Register.jsx";
import ResetPassword from "./Pages/User_Managment/Reset_Password.jsx";
import ForgotPassword from "./Pages/User_Managment/Forgot_Password.jsx";

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
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/resetPassword" element={<ResetPassword />} />
                            <Route path="/forgotPassword" element={<ForgotPassword />} />

                        </Routes>
                    </Layout>
                }
            />
        </Routes>
    );
}

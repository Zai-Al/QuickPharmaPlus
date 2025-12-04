import "./Login.css";
import background from "../../assets/Background.png";
import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";

export default function Login() {

    const navigate = useNavigate();

    // Access the global authentication context
    const { setUser } = useContext(AuthContext);

    // Local state for form inputs and error message
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Function executed when user clicks "Login"
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        // Use the environment variable we configured
        const baseURL = import.meta.env.VITE_API_BASE_URL;

        try {
            // Make the login request using fetch
            const response = await fetch(`${baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error("Invalid email or password.");
            }

            const user = await response.json();

            // Save the user in the global context
            setUser(user);

            // Save to localStorage to keep the user logged in after a page refresh
            localStorage.setItem("user", JSON.stringify(user));

            // Redirect user based on roles
            if (user.roles?.includes("Admin")) {
                navigate("/adminDashboard");
            } else if (user.roles?.includes("Pharmacist")) {
                navigate("/pharmacistDashboard");
            } else if (user.roles?.includes("Manager")) {
                navigate("/managerDashboard");
            } else if (user.roles?.includes("Driver")) {
                navigate("/driverDashboard");
            } else {
                navigate("/");
            }

        } catch (err) {
            console.error("LOGIN ERROR:", err);
            setError("Invalid email or password.");
        }
    };


    return (
        <div className="login-wrapper d-flex">

            {/* Left background image section */}
            <div
                className="login-left"
                style={{
                    backgroundImage: `url(${background})`,
                    backgroundSize: "605px",
                    backgroundPosition: "left center"
                }}
            ></div>

            {/* Right login form section */}
            <div className="login-right d-flex flex-column justify-content-center align-items-center">

                <h2 className="fw-bold mb-1 text-center">Welcome to QuickPharma+</h2>
                <p className="text-muted mb-4 text-center">Sign into your account</p>

                <div className="login-box">

                    {/* Display error message */}
                    {error && (
                        <div className="alert alert-danger py-2">{error}</div>
                    )}

                    {/* Email */}
                    <label className="form-label fw-bold mt-3 login-label">Email</label>
                    <input
                        type="email"
                        className="form-control"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    {/* Password */}
                    <label className="form-label fw-bold mt-4 login-label">Password</label>
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {/* Forgot password */}
                    <div className="text-end mt-2">
                        <Link to="/forgotPassword" className="login-link">
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Login button */}
                    <button
                        className="btn btn-primary w-100 mt-4 login-btn"
                        onClick={handleLogin}
                    >
                        Login
                    </button>

                    {/* Registration link */}
                    <p className="text-center mt-3">
                        Don't have an account?{" "}
                        <Link to="/register" className="login-link">
                            Sign up
                        </Link>
                    </p>

                </div>
            </div>
        </div>
    );
}

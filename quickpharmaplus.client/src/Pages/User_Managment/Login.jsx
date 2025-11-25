import "./Login.css";
import logo from "../../assets/Logo.png";
import background from "../../assets/Background.png";
import { Link } from "react-router-dom";

export default function Login() {
    return (
        <div className="login-wrapper d-flex">

            {/* LEFT BACKGROUND IMAGE */}
            <div
                className="login-left"
                style={{
                    backgroundImage: `url(${background})`,
                    backgroundSize: "605px",
                    backgroundPosition: "left center"
                }}
            ></div>

            {/* RIGHT FORM */}
            <div className="login-right d-flex flex-column justify-content-center align-items-center">

                <h2 className="fw-bold mb-1 text-center">Welcome to QuickPharma+</h2>
                <p className="text-muted mb-4 text-center">Sign into your account</p>

                <div className="login-box">
                    <label className="form-label fw-bold mt-3 login-label">Email</label>
                    <input type="email" className="form-control" placeholder="Enter your email" />

                    <label className="form-label fw-bold mt-4 login-label">Password</label>
                    <input type="password" className="form-control" placeholder="Enter your password" />

                    <div className="text-end mt-2">
                        <Link to="/forgotPassword" className="login-link">
                            Forgot Password?
                        </Link>
                    </div>

                    <button className="btn btn-primary w-100 mt-4 login-btn">Login</button>

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

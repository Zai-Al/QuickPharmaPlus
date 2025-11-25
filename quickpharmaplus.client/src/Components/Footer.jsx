import logo from "../assets/Logo.png";
import { Link } from "react-router-dom";

export default function Footer() {
    return (
        <>
            {/* teal line reused from navbar */}
            <div className="navbar-bottom-line"></div>

            <footer className="bg-white mt-auto footer-section">
                <div className="container py-3">
                    {/* TOP ROW – FLEX, WRAPS NICELY */}
                    <div className="footer-top d-flex flex-wrap justify-content-between align-items-start">
                      
                        {/* LOGO + TAGLINE */}
                        <div className="footer-col">
                            <img
                                src={logo}
                                alt="QuickPharma+"
                                height="60"
                                className="mb-2"
                                style={{ marginLeft: "-200px", marginTop: "14px", paddingLeft:"40px" }}
                            />
                            <div className="text-muted small" style={{ marginLeft: "-150px"}}>
                                Quick Solutions for Better Health
                            </div>
                        </div>

                        {/* CONTACT */}
                        <div className="footer-col" style={{ marginLeft: "-200px", marginTop: "14px", paddingLeft: "40px" }}>
                            <h6 className="fw-bold mb-2">Contact Us</h6>
                            <p className="mb-1">Phone: +973 38403843</p>
                            <p className="mb-1">Email: support@quickpharma.bh</p>
                        </div>

                        {/* INFORMATION */}
                        <div className="footer-col" style={{ marginLeft: "-200px", marginTop: "14px", paddingLeft: "40px" }}>
                            <h6 className="fw-bold mb-2">Information</h6>
                            <p className="mb-1">
                                <Link to="/privacy">Privacy Policy</Link>
                            </p>
                            <p className="mb-1">
                                <Link to="/terms">Terms of Use</Link>
                            </p>
                        </div>

                        {/* VISIT US */}
                        <div className="footer-col" style={{marginTop: "14px" }}>
                            <h6 className="fw-bold mb-2" >Visit Us</h6>
                            <p className="mb-1">Branches: Bilad, Salmaniya, Budaya,</p>
                            <p className="mb-1">Sitra</p>
                        </div>
                    </div>

                    {/* COPYRIGHT ROW */}
                    <div className="text-center mt-2 small">
                        <strong>&#169; 2025 QuickPharma+ All Rights Reserved</strong>
                    </div>
                </div>
            </footer>
        </>
    );
}

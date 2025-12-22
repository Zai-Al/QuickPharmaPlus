import logo from "../assets/Logo.png";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
    return (
        <>
            <div className="navbar-bottom-line"></div>

            <footer className="bg-white mt-auto footer-section">
                <div className="container py-4">
                    <div className="footer-grid">
                        {/* LOGO */}
                        <div className="footer-col footer-brand">
                            <img src={logo} alt="QuickPharma+" height="60" className="footer-logo" />
                        </div>

                        {/* CONTACT */}
                        <div className="footer-col">
                            <h6 className="fw-bold mb-2">Contact Us</h6>
                            <p className="mb-1">Phone: +973 38403843</p>
                            <p className="mb-1">Email: support@quickpharma.bh</p>
                        </div>

                        {/* INFORMATION */}
                        <div className="footer-col info-col">
                            <h6 className="fw-bold mb-2">Information</h6>
                            <p className="mb-1">
                                <Link to="/privacy">Privacy Policy</Link>
                            </p>
                            <p className="mb-1">
                                <Link to="/terms">Terms of Use</Link>
                            </p>
                        </div>

                        {/* FOLLOW US (NEW) */}
                        <div className="footer-col">
                            <h6 className="fw-bold mb-2">Follow Us</h6>
                            <p className="mb-1">
                                <span className="footer-social-label">Instagram:</span>{" "}
                                <a className="footer-social-link" href="https://instagram.com/quickpharma" target="_blank" rel="noreferrer">
                                    @quickpharma
                                </a>
                            </p>
                            <p className="mb-1">
                                <span className="footer-social-label">TikTok:</span>{" "}
                                <a className="footer-social-link" href="https://tiktok.com/@quickpharma" target="_blank" rel="noreferrer">
                                    @quickpharma
                                </a>
                            </p>
                            <p className="mb-1">
                                <span className="footer-social-label">X:</span>{" "}
                                <a className="footer-social-link" href="https://x.com/quickpharma" target="_blank" rel="noreferrer">
                                    @quickpharma
                                </a>
                            </p>
                        </div>

                        {/* STORES */}
                        <div className="footer-col footer-stores">
                            <h6 className="fw-bold mb-2">Our Stores</h6>
                            <p className="mb-1">Seef Branch - Rd 2819, Blk 428, Bldg. 120</p>
                            <p className="mb-1">Samaheej Branch - Rd 107, Blk 253, Bldg. 22</p>
                            <p className="mb-1">Awali Branch - Awali Avenue, Blk 711, Bldg. 101</p>
                            <p className="mb-1">Budaiya Branch - Budaiya Highway, Blk 575, Bldg. 300</p>
                            <p className="mb-1">Tubli Branch - Rd 4459, Blk 745, Bldg. 12</p>
                        </div>
                    </div>

                    <div className="footer-bottom text-center mt-3 small">
                        <strong>&#169; 2025 QuickPharma+ All Rights Reserved</strong>
                    </div>
                </div>
            </footer>
        </>
    );
}

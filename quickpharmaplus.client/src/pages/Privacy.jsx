export default function Privacy() {
    return (
        <div className="container py-5 policy-page">

            {/* PAGE TITLE (CENTERED) */}
            <div className="text-center mb-5">
                <h1 className="fw-bold mb-4">Privacy Policy</h1>
                <p className="text-muted mb-0">Version 1.0</p>
                <p className="text-muted">Last Updated: 16/11/2025</p>
            </div>

            {/* ACCORDION */}
            <div className="accordion" id="privacyAccordion">

                {/* SECTION 1 */}
                <div className="accordion-item border-teal policy-card mb-3">
                    <h2 className="accordion-header" id="headingOne">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseOne"
                            aria-expanded="false"
                            aria-controls="collapseOne"
                        >
                            1. Introduction
                        </button>
                    </h2>
                    <div
                        id="collapseOne"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingOne"
                        data-bs-parent="#privacyAccordion"
                    >
                        <div className="accordion-body">
                            QuickPharma+ is committed to maintaining the confidentiality and
                            security of all information managed within the system.
                        </div>
                    </div>
                </div>

                {/* SECTION 2 */}
                <div className="accordion-item border-teal policy-card mb-3">
                    <h2 className="accordion-header" id="headingTwo">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseTwo"
                            aria-expanded="false"
                            aria-controls="collapseTwo"
                        >
                            2. What Information We Collect
                        </button>
                    </h2>
                    <div
                        id="collapseTwo"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingTwo"
                        data-bs-parent="#privacyAccordion"
                    >
                        <div className="accordion-body">
                            <ul className="mb-0">
                                <li>User and employee details</li>
                                <li>Customer and prescription data</li>
                                <li>Product and inventory information</li>
                                <li>Supplier details</li>
                                <li>System logs and technical data</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* SECTION 3 */}
                <div className="accordion-item border-teal policy-card mb-3">
                    <h2 className="accordion-header" id="headingThree">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseThree"
                            aria-expanded="false"
                            aria-controls="collapseThree"
                        >
                            3. How Information Is Used
                        </button>
                    </h2>
                    <div
                        id="collapseThree"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingThree"
                        data-bs-parent="#privacyAccordion"
                    >
                        <div className="accordion-body">
                            <ul className="mb-0">
                                <li>Inventory and reorder operations</li>
                                <li>Product safety checks</li>
                                <li>Controlled medicine monitoring</li>
                                <li>Transaction processing</li>
                                <li>User access control and security monitoring</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* SECTION 4 */}
                <div className="accordion-item border-teal policy-card mb-3">
                    <h2 className="accordion-header" id="headingFour">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseFour"
                            aria-expanded="false"
                            aria-controls="collapseFour"
                        >
                            4. Data Protection Measures
                        </button>
                    </h2>
                    <div
                        id="collapseFour"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingFour"
                        data-bs-parent="#privacyAccordion"
                    >
                        <div className="accordion-body">
                            <ul className="mb-0">
                                <li>Encrypted storage</li>
                                <li>Role-based authorization</li>
                                <li>Daily backups</li>
                                <li>Hashed login credentials</li>
                                <li>Full audit trail logging</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* SECTION 5 */}
                <div className="accordion-item border-teal policy-card mb-3">
                    <h2 className="accordion-header" id="headingFive">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseFive"
                            aria-expanded="false"
                            aria-controls="collapseFive"
                        >
                            5. Sharing of Information
                        </button>
                    </h2>
                    <div
                        id="collapseFive"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingFive"
                        data-bs-parent="#privacyAccordion"
                    >
                        <div className="accordion-body">
                            Shared only with regulatory authorities or internal IT teams
                            when required. No commercial sharing or selling of data occurs.
                        </div>
                    </div>
                </div>

                {/* SECTION 6 */}
                <div className="accordion-item border-teal policy-card mb-3">
                    <h2 className="accordion-header" id="headingSix">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseSix"
                            aria-expanded="false"
                            aria-controls="collapseSix"
                        >
                            6. User Responsibilities
                        </button>
                    </h2>
                    <div
                        id="collapseSix"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingSix"
                        data-bs-parent="#privacyAccordion"
                    >
                        <div className="accordion-body">
                            Maintain account confidentiality, follow internal policies,
                            ensure accurate data entry, and report suspicious activity.
                        </div>
                    </div>
                </div>

                {/* SECTION 7 */}
                <div className="accordion-item border-teal policy-card mb-3">
                    <h2 className="accordion-header" id="headingSeven">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseSeven"
                            aria-expanded="false"
                            aria-controls="collapseSeven"
                        >
                            7. Data Retention
                        </button>
                    </h2>
                    <div
                        id="collapseSeven"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingSeven"
                        data-bs-parent="#privacyAccordion"
                    >
                        <div className="accordion-body">
                            Records retained based on regulatory requirements and system
                            policy timelines.
                        </div>
                    </div>
                </div>

                {/* SECTION 8 */}
                <div className="accordion-item border-teal policy-card">
                    <h2 className="accordion-header" id="headingEight">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseEight"
                            aria-expanded="false"
                            aria-controls="collapseEight"
                        >
                            8. Contact Information
                        </button>
                    </h2>
                    <div
                        id="collapseEight"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingEight"
                        data-bs-parent="#privacyAccordion"
                    >
                        <div className="accordion-body">
                            QuickPharma+ System Administration: support@quickpharma.bh
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

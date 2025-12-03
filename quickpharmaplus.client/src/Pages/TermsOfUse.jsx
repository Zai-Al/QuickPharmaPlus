export default function TermsOfUse() {
    return (
        <div className="container py-5 terms-page">

            {/* PAGE TITLE */}
            <div className="text-center mb-5">
                <h1 className="fw-bold mb-4">Terms of Use</h1>
                <p className="text-muted mb-0" style={{ textAlign: "center" }}>Version 1.0</p>
                <p className="text-muted" style={{ textAlign: "center" }}>Last Updated: 16/11/2025</p>
            </div>

            {/* ACCORDION */}
            <div className="accordion" id="termsAccordion">

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
                            1. Acceptance of Terms
                        </button>
                    </h2>
                    <div
                        id="collapseOne"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingOne"
                        data-bs-parent="#termsAccordion"
                    >
                        <div className="accordion-body">
                            Use of this system signifies agreement with all terms and policies.
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
                            2. Authorized Use Only
                        </button>
                    </h2>
                    <div
                        id="collapseTwo"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingTwo"
                        data-bs-parent="#termsAccordion"
                    >
                        <div className="accordion-body">
                            The system is restricted to approved pharmacy personnel.
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
                            3. User Responsibilities
                        </button>
                    </h2>
                    <div
                        id="collapseThree"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingThree"
                        data-bs-parent="#termsAccordion"
                    >
                        <div className="accordion-body">
                            Maintain confidentiality, ensure accurate data entry, log out after use,
                            and follow all regulations.
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
                            4. Prohibited Actions
                        </button>
                    </h2>
                    <div
                        id="collapseFour"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingFour"
                        data-bs-parent="#termsAccordion"
                    >
                        <div className="accordion-body">
                            Unauthorized access, sharing credentials, manipulating data,
                            exporting information without approval, or bypassing security controls.
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
                            5. System Monitoring
                        </button>
                    </h2>
                    <div
                        id="collapseFive"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingFive"
                        data-bs-parent="#termsAccordion"
                    >
                        <div className="accordion-body">
                            All activity is logged and may be reviewed by administrators.
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
                            6. Data Ownership
                        </button>
                    </h2>
                    <div
                        id="collapseSix"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingSix"
                        data-bs-parent="#termsAccordion"
                    >
                        <div className="accordion-body">
                            All system data belongs to the pharmacy and governing institution.
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
                            7. Confidentiality
                        </button>
                    </h2>
                    <div
                        id="collapseSeven"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingSeven"
                        data-bs-parent="#termsAccordion"
                    >
                        <div className="accordion-body">
                            Users must protect patient and pharmaceutical data at all times.
                        </div>
                    </div>
                </div>

                {/* SECTION 8 */}
                <div className="accordion-item border-teal policy-card mb-3">
                    <h2 className="accordion-header" id="headingEight">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseEight"
                            aria-expanded="false"
                            aria-controls="collapseEight"
                        >
                            8. Modifications
                        </button>
                    </h2>
                    <div
                        id="collapseEight"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingEight"
                        data-bs-parent="#termsAccordion"
                    >
                        <div className="accordion-body">
                            The system administrators may update these terms at any time.
                        </div>
                    </div>
                </div>

                {/* SECTION 9 */}
                <div className="accordion-item border-teal policy-card">
                    <h2 className="accordion-header" id="headingNine">
                        <button
                            className="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseNine"
                            aria-expanded="false"
                            aria-controls="collapseNine"
                        >
                            9. Contact
                        </button>
                    </h2>
                    <div
                        id="collapseNine"
                        className="accordion-collapse collapse"
                        aria-labelledby="headingNine"
                        data-bs-parent="#termsAccordion"
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

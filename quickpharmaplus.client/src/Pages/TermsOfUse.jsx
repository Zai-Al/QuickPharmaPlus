export default function TermsOfUse() {
    return (
        <div className="container py-5 terms-page">

            {/* PAGE TITLE */}
            <div className="text-center mb-4">
                <h2 className="fw-bold" style={{ color: "#000" }}>Terms of Use</h2>
                <p className="text-muted mb-1" style={{ textAlign: "center" }}>Version 1.0</p>
                <p className="text-muted" style={{ textAlign: "center" }}>Last Updated: 16/11/2025</p>
            </div>

            {/* TERMS CARD CONTAINER */}
            <div className="p-4 bg-white shadow-sm rounded">

                {/* SECTION 1 */}
                <div className="p-3 mb-4 rounded" style={{ border: "2px solid #7ac9c5" }}>
                    <h5 className="policy-section-title fw-bold mb-2" style={{ color: "#000" }}>
                        1. Acceptance of Terms
                    </h5>
                    <p className="mb-0">
                        Use of this system signifies agreement with all terms and policies.
                    </p>
                </div>

                {/* SECTION 2 */}
                <div className="p-3 mb-4 rounded" style={{ border: "2px solid #7ac9c5" }}>
                    <h5 className="policy-section-title fw-bold mb-2" style={{ color: "#000" }}>
                        2. Authorized Use Only
                    </h5>
                    <p className="mb-0">
                        The system is restricted to approved pharmacy personnel.
                    </p>
                </div>

                {/* SECTION 3 */}
                <div className="p-3 mb-4 rounded" style={{ border: "2px solid #7ac9c5" }}>
                    <h5 className="policy-section-title fw-bold mb-2" style={{ color: "#000" }}>
                        3. User Responsibilities
                    </h5>
                    <p className="mb-0">
                        Maintain confidentiality, ensure accurate data entry, log out after use,
                        and follow all regulations.
                    </p>
                </div>

                {/* SECTION 4 */}
                <div className="p-3 mb-4 rounded" style={{ border: "2px solid #7ac9c5" }}>
                    <h5 className="policy-section-title fw-bold mb-2" style={{ color: "#000" }}>
                        4. Prohibited Actions
                    </h5>
                    <p className="mb-0">
                        Unauthorized access, sharing credentials, manipulating data, exporting information
                        without approval, or bypassing security controls.
                    </p>
                </div>

                {/* SECTION 5 */}
                <div className="p-3 mb-4 rounded" style={{ border: "2px solid #7ac9c5" }}>
                    <h5 className="policy-section-title fw-bold mb-2" style={{ color: "#000" }}>
                        5. System Monitoring
                    </h5>
                    <p className="mb-0">
                        All activity is logged and may be reviewed by administrators.
                    </p>
                </div>

                {/* SECTION 6 */}
                <div className="p-3 mb-4 rounded" style={{ border: "2px solid #7ac9c5" }}>
                    <h5 className="policy-section-title fw-bold mb-2" style={{ color: "#000" }}>
                        6. Data Ownership
                    </h5>
                    <p className="mb-0">
                        All system data belongs to the pharmacy and governing institution.
                    </p>
                </div>

                {/* SECTION 7 */}
                <div className="p-3 mb-4 rounded" style={{ border: "2px solid #7ac9c5" }}>
                    <h5 className="policy-section-title fw-bold mb-2" style={{ color: "#000" }}>
                        7. Confidentiality
                    </h5>
                    <p className="mb-0">
                        Users must protect patient and pharmaceutical data at all times.
                    </p>
                </div>

                {/* SECTION 8 */}
                <div className="p-3 mb-4 rounded" style={{ border: "2px solid #7ac9c5" }}>
                    <h5 className="policy-section-title fw-bold mb-2" style={{ color: "#000" }}>
                        8. Modifications
                    </h5>
                    <p className="mb-0">
                        The system administrators may update these terms at any time.
                    </p>
                </div>

                {/* SECTION 9 */}
                <div className="p-3 mb-1 rounded" style={{ border: "2px solid #7ac9c5" }}>
                    <h5 className="policy-section-title fw-bold mb-2" style={{ color: "#000" }}>
                        9. Contact
                    </h5>
                    <p className="mb-0">
                        QuickPharma+ System Administration: support@quickpharma.bh
                    </p>
                </div>

            </div>
        </div>
    );
}

export default function TermsOfUse() {
    return (
        <div className="container py-5 terms-page">

            {/* PAGE TITLE */}
            <div className="text-center mb-5">
                <h2 className="fw-bold mb-1">Terms of Use</h2>
                <p className="text-muted mb-0" style={{ textAlign: "center" }}>Version 1.0</p>
                <p className="text-muted" style={{ textAlign: "center" }}>Last Updated: 16/11/2025</p>
            </div>

            {/* SECTION 1 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">1. Acceptance of Terms</h5>
                    <p className="mb-0">
                        Use of this system signifies agreement with all terms and policies.
                    </p>
                </div>
            </div>

            {/* SECTION 2 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">2. Authorized Use Only</h5>
                    <p className="mb-0">
                        The system is restricted to approved pharmacy personnel.
                    </p>
                </div>
            </div>

            {/* SECTION 3 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">3. User Responsibilities</h5>
                    <p className="mb-0">
                        Maintain confidentiality, ensure accurate data entry, log out after use,
                        and follow all regulations.
                    </p>
                </div>
            </div>

            {/* SECTION 4 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">4. Prohibited Actions</h5>
                    <p className="mb-0">
                        Unauthorized access, sharing credentials, manipulating data, exporting information
                        without approval, or bypassing security controls.
                    </p>
                </div>
            </div>

            {/* SECTION 5 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">5. System Monitoring</h5>
                    <p className="mb-0">
                        All activity is logged and may be reviewed by administrators.
                    </p>
                </div>
            </div>

            {/* SECTION 6 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">6. Data Ownership</h5>
                    <p className="mb-0">
                        All system data belongs to the pharmacy and governing institution.
                    </p>
                </div>
            </div>

            {/* SECTION 7 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">7. Confidentiality</h5>
                    <p className="mb-0">
                        Users must protect patient and pharmaceutical data at all times.
                    </p>
                </div>
            </div>

            {/* SECTION 8 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">8. Modifications</h5>
                    <p className="mb-0">
                        The system administrators may update these terms at any time.
                    </p>
                </div>
            </div>

            {/* SECTION 9 */}
            <div className="card border-teal mb-1 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">9. Contact</h5>
                    <p className="mb-0">
                        QuickPharma+ System Administration: support@quickpharma.bh
                    </p>
                </div>
            </div>

        </div>
    );
}

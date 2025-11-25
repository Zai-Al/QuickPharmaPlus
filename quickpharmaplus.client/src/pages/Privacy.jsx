export default function Privacy() {
    return (
        <div className="container py-5 policy-page">

            {/* PAGE TITLE (CENTERED) */}
            <div className="text-center mb-5">
                <h2 className="fw-bold mb-1">Privacy Policy</h2>
                <p className="text-muted mb-0">Version 1.0</p>
                <p className="text-muted">Last Updated: 16/11/2025</p>
            </div>

            {/* SECTION 1 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">1. Introduction</h5>
                    <p className="mb-0">
                        QuickPharma+ is committed to maintaining the confidentiality and security of all
                        information managed within the system.
                    </p>
                </div>
            </div>

            {/* SECTION 2 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">2. What Information We Collect</h5>
                    <ul className="mb-0">
                        <li>User and employee details</li>
                        <li>Customer and prescription data</li>
                        <li>Product and inventory information</li>
                        <li>Supplier details</li>
                        <li>System logs and technical data</li>
                    </ul>
                </div>
            </div>

            {/* SECTION 3 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">3. How Information Is Used</h5>
                    <ul className="mb-0">
                        <li>Inventory and reorder operations</li>
                        <li>Product safety checks</li>
                        <li>Controlled medicine monitoring</li>
                        <li>Transaction processing</li>
                        <li>User access control and security monitoring</li>
                    </ul>
                </div>
            </div>

            {/* SECTION 4 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">4. Data Protection Measures</h5>
                    <ul className="mb-0">
                        <li>Encrypted storage</li>
                        <li>Role-based authorization</li>
                        <li>Daily backups</li>
                        <li>Hashed login credentials</li>
                        <li>Full audit trail logging</li>
                    </ul>
                </div>
            </div>

            {/* SECTION 5 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">5. Sharing of Information</h5>
                    <p className="mb-0">
                        Shared only with regulatory authorities or internal IT teams when required.
                        No commercial sharing or selling of data occurs.
                    </p>
                </div>
            </div>

            {/* SECTION 6 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">6. User Responsibilities</h5>
                    <p className="mb-0">
                        Maintain account confidentiality, follow internal policies, ensure accurate data entry,
                        and report suspicious activity.
                    </p>
                </div>
            </div>

            {/* SECTION 7 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">7. Data Retention</h5>
                    <p className="mb-0">
                        Records retained based on regulatory requirements and system policy timelines.
                    </p>
                </div>
            </div>

            {/* SECTION 8 */}
            <div className="card border-teal mb-4 policy-card">
                <div className="card-body">
                    <h5 className="policy-section-title">8. Contact Information</h5>
                    <p className="mb-0">
                        QuickPharma+ System Administration: support@quickpharma.bh
                    </p>
                </div>
            </div>
        </div>
    );
}

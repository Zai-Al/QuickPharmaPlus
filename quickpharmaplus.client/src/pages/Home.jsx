export default function Home() {
    return (
        <div className="container py-5">

            {/* PAGE TITLE */}
            <div className="text-center mb-4">
                <h1 className="fw-bold">Welcome to QuickPharma+</h1>
                <p className="text-muted">Your trusted platform for pharmacy and medical operations</p>
            </div>

            {/* INTRO CARDS */}
            <div className="row g-4">

                {/* Card 1 */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title fw-bold">Manage Inventory</h5>
                            <p className="card-text">
                                Track stock levels, monitor expired products, and maintain accurate inventory data across branches.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title fw-bold">Process Orders</h5>
                            <p className="card-text">
                                Handle prescriptions, supplier orders, delivery requests, and internal transactions with ease.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="col-md-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title fw-bold">Secure & Role-Based Access</h5>
                            <p className="card-text">
                                Designed for admins, pharmacists, managers, drivers, and customers with tailored navigation and permissions.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* EXTRA SPACING */}
            <div className="text-center mt-5">
                <p className="text-muted">Use the navigation bar above to continue exploring the platform.</p>
            </div>

        </div>
    );
}

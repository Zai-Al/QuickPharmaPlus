import "./Dashboard.css";

export default function DriverDashboard() {
    const loggedInUser = "Driver";   // Replace with real identity later

    return (
        <div className="admin-container">

            {/* PAGE TITLE */}
            <h2 className="dashboard-title text-center">
                Welcome {loggedInUser}
            </h2>

            {/* ========== METRIC CARDS ========== */}
            <div className="row justify-content-center mt-4">

                {/* My Total Deliveries */}
                <div className="col-md-10 mb-4" style={{ marginTop: "2em" }}>
                    <div className="card dashboard-card border-teal" style={{ marginTop: "2em" }}>
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Total Deliveries</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                154
                            </p>
                        </div>
                    </div>
                </div>

                {/* My Deliveries Today */}
                <div className="col-md-10 mb-4" style={{ marginTop: "2em" }}>
                    <div className="card dashboard-card border-teal" style={{ marginTop: "2em" }}>
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Deliveries Today</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                87
                            </p>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}

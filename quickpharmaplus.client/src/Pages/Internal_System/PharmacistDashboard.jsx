import "./Dashboard.css";

export default function PharmacistDashboard() {
    const loggedInUser = "Pharmacist";   // Replace with real identity later

    return (
        <div className="admin-container">

            {/* PAGE TITLE */}
            <h2 className="dashboard-title text-center">
                Welcome {loggedInUser}
            </h2>

            {/* ========== METRIC CARDS ========== */}
            <div className="row justify-content-center mt-4">

                {/* My Total Sales */}
                <div className="col-md-10 mb-4" style={{ marginTop: "2em" }}>
                    <div className="card dashboard-card border-teal" style={{ marginTop: "2em" }}>
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Total Sales</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                154
                            </p>
                        </div>
                    </div>
                </div>

                {/* My Total Prescriptions */}
                <div className="col-md-10 mb-4" style={{ marginTop: "2em" }}>
                    <div className="card dashboard-card border-teal" style={{ marginTop: "2em" }}>
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Total Prescriptions</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                87
                            </p>
                        </div>
                    </div>
                </div>

                {/* My Total Orders */}
                <div className="col-md-10 mb-4" style={{ marginTop: "2em" }}>
                    <div className="card dashboard-card border-teal" style={{ marginTop: "2em" }}>
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Total Orders</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                42
                            </p>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}

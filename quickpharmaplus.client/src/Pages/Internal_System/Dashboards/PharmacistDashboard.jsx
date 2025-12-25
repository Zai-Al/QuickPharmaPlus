import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../Context/AuthContext.jsx";
import "./Dashboard.css";

export default function PharmacistDashboard() {
    const { user: ctxUser } = useContext(AuthContext);

    // State for dashboard data
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard data on component mount
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/PharmacistDashboard", {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch dashboard data (${response.status})`);
            }

            const data = await response.json();
            setDashboardData(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Failed to load dashboard data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    // Extract user name (same pattern as Profile_Internal)
    const firstName = ctxUser?.firstName ?? ctxUser?.givenName ?? ctxUser?.name ?? ctxUser?.FirstName ?? "";

    // Loading state
    if (loading) {
        return (
            <div className="admin-container">
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="admin-container">
                <div className="alert alert-danger m-5" role="alert">
                    <h4 className="alert-heading">Error!</h4>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchDashboardData}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Return null if no data (safety check)
    if (!dashboardData) {
        return null;
    }

    return (
        <div className="admin-container">
            <h2 className="dashboard-title text-center">Welcome{" "}
                <span style={{ color: "#1D2D44" }}>{firstName}</span>
                !
            </h2>

            {/* ==== METRIC CARDS ==== */}
            <div className="row justify-content-center mt-5">
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Total Approvals</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.myTotalApprovals}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Approvals Today</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.myApprovalsToday}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Branch Pending Prescriptions</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.branchPendingPrescriptions}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Branch Total Prescriptions</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.branchTotalPrescriptions}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Branch Total Orders</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.branchTotalOrders}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Branch Controlled Medications Dispensed</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.branchControlledMedicationsDispensed}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
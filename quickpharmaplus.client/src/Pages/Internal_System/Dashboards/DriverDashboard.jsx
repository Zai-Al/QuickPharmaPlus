import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../../Context/AuthContext.jsx";
import "./Dashboard.css";

export default function DriverDashboard() {
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
            const response = await fetch("/api/DriverDashboard", {
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

    // Extract user first name
    const firstName = ctxUser?.firstName ?? ctxUser?.givenName ?? ctxUser?.name ?? ctxUser?.FirstName ?? ctxUser?.username ?? "Driver";

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
            {/* PAGE TITLE */}
            <h2 className="dashboard-title text-center mb-0">
                Welcome <span style={{ color: "#1D2D44" }}>{firstName}</span>
            </h2>

            {/* SLOT INFORMATION */}
            {dashboardData.driverSlotName && (
                <h5 className="text-center mt-1 text-muted fw-normal">
                    (Slot - {dashboardData.driverSlotName})
                </h5>
            )}

            {/* ========== METRIC CARDS ========== */}
            <div className="row justify-content-center mt-5">
                {/* My Slot Pending Deliveries */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Slot Pending Deliveries</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.mySlotPendingDeliveries}
                            </p>
                        </div>
                    </div>
                </div>

                {/* My Slot Urgent Deliveries */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Slot Urgent Deliveries</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.mySlotUrgentDeliveries}
                            </p>
                        </div>
                    </div>
                </div>

                {/* My Slot Today's Deliveries */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Slot Today's Deliveries</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.mySlotTodaysDeliveries}
                            </p>
                        </div>
                    </div>
                </div>

                {/* My Slot Total Deliveries */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">My Slot Total Deliveries</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.mySlotTotalDeliveries}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Branch Pending Deliveries */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Branch Pending Deliveries</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.branchPendingDeliveries}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Branch Total Deliveries */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Branch Total Deliveries</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.branchTotalDeliveries}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

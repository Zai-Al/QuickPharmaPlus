import { useState, useEffect, useContext } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { AuthContext } from "../../../Context/AuthContext.jsx";
import "./Dashboard.css";

export default function ManagerDashboard() {
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
            const response = await fetch("/api/ManagerDashboard", {
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

    // Don't render charts until data is loaded
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

    // ==== CHART: SALES PER SUPPLIER (PIE) ====
    const supplierSalesChart = {
        chart: {
            type: "pie",
            height: 400,
            width: 750,
            spacingTop: 30,
            spacingBottom: 30,
            spacingLeft: 20,
            spacingRight: 20
        },
        title: { text: "" },
        plotOptions: {
            pie: {
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        fontSize: "16px",
                        fontWeight: "500"
                    }
                }
            }
        },
        series: [
            {
                name: "Sales",
                data: dashboardData.salesPerSupplier.map(item => ({
                    name: item.supplierName,
                    y: item.totalSales
                }))
            }
        ]
    };

    // ==== CHART: SALES PER CATEGORY (COLUMN) ====
    const categorySalesChart = {
        chart: {
            type: "column",
            height: 400,
            width: 1000,
            spacingTop: 30,
            spacingBottom: 30,
            spacingLeft: 20,
            spacingRight: 20
        },
        title: { text: "" },
        colors: ['#3AAFA9'],
        xAxis: {
            categories: dashboardData.salesPerCategory.map(item => item.categoryName),
            title: {
                text: "Category",
                style: {
                    fontSize: "14px",
                    fontWeight: "500"
                }
            },
            labels: {
                style: {
                    fontSize: "13px"
                }
            }
        },
        yAxis: {
            title: {
                text: "Total Sales (BHD)",
                style: {
                    fontSize: "14px",
                    fontWeight: "500"
                }
            },
            labels: {
                style: {
                    fontSize: "12px"
                }
            }
        },
        series: [
            {
                name: "Sales",
                data: dashboardData.salesPerCategory.map(item => item.totalSales)
            }
        ]
    };

    // ==== CHART: PRESCRIPTIONS APPROVED PER PHARMACIST (LINE) ====
    const pharmacistLineChart = {
        chart: {
            type: "line",
            height: 400,
            width: 1000,
            spacingTop: 30,
            spacingBottom: 30,
            spacingLeft: 20,
            spacingRight: 20
        },
        title: { text: "" },
        colors: ['#598199'],
        xAxis: {
            categories: dashboardData.prescriptionApprovalsPerPharmacist.map(item => item.pharmacistName),
            title: {
                text: "Pharmacist",
                style: {
                    fontSize: "14px",
                    fontWeight: "500"
                }
            },
            labels: {
                style: {
                    fontSize: "13px"
                }
            }
        },
        yAxis: {
            title: {
                text: "Approved Prescriptions",
                style: {
                    fontSize: "14px",
                    fontWeight: "500"
                }
            },
            labels: {
                style: {
                    fontSize: "12px"
                }
            }
        },
        series: [
            {
                name: "Approvals",
                data: dashboardData.prescriptionApprovalsPerPharmacist.map(item => item.totalApprovals)
            }
        ]
    };

    return (
        <div className="admin-container">
            <h2 className="dashboard-title text-center">Welcome{" "}
                <span style={{ color: "#1D2D44" }}>{firstName}</span>
                !
            </h2>

            {/* ==== SALES PER SUPPLIER (PIE) ==== */}
            <div className="row justify-content-center mt-4 mb-4">
                <div className="col-md-10">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Sales Per Supplier</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={supplierSalesChart}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== SALES PER CATEGORY (COLUMN) ==== */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-10">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Sales Per Category</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={categorySalesChart}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== PRESCRIPTIONS APPROVED PER PHARMACIST (LINE) ==== */}
            <div className="row justify-content-center mb-5">
                <div className="col-md-10">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Prescriptions Approved Per Pharmacist</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={pharmacistLineChart}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== METRIC CARDS ==== */}
            <div className="row justify-content-center">

                {/* Total Branch Sales */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Branch Sales</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                BHD {dashboardData.metrics.totalBranchSales.toFixed(3)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Today's Branch Sales */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Today's Branch Sales</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                BHD {dashboardData.metrics.todayBranchSales.toFixed(3)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Branch Employees */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Branch Employees</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.totalBranchEmployees}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Branch Prescriptions */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Branch Prescriptions</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.totalBranchPrescriptions}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Branch Deliveries */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Branch Deliveries</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.totalBranchDeliveries}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Today's Branch Deliveries */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Today's Branch Deliveries</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.todayBranchDeliveries}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Branch Inventory */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Branch Inventory</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.totalBranchInventory}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Branch Orders */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Branch Orders</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData.metrics.totalBranchOrders}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
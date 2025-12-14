import { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "./Dashboard.css";

export default function AdminDashboard() {
    const baseURL = import.meta.env.VITE_API_BASE_URL;

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
            const response = await fetch(`${baseURL}/api/AdminDashboard`, {
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

    // ==== CHART: SALES PER BRANCH (PIE) ====
    const salesChartOptions = {
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
                data: dashboardData?.salesPerBranch.map(item => ({
                    name: item.branchCity,
                    y: item.totalSales
                })) || []
            }
        ]
    };


    // ==== CHART: INVENTORY PER BRANCH (COLUMN) ====
    const inventoryChartOptions = {
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
        colors: ['#779bb0'],
        xAxis: {
            categories: dashboardData?.inventoryPerBranch.map(item => item.branchCity) || [],
            title: {
                text: "Branch",
                style: {
                    fontSize: "20px",
                    fontWeight: "500"
                }
            },
            labels: {
                style: {
                    fontSize: "15px"
                }
            }
        },
        yAxis: {
            title: {
                text: "Inventory Stock",
                style: {
                    fontSize: "20px",
                    fontWeight: "500"
                }
            },
            labels: {
                style: {
                    fontSize: "15px"
                }
            }
        },
        series: [
            {
                name: "Inventory",
                data: dashboardData?.inventoryPerBranch.map(item => item.totalInventory) || []
            }
        ]
    };


    // ==== CHART: PRESCRIPTIONS PER BRANCH (LINE) ====
    const prescriptionsChartOptions = {
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
            categories: dashboardData?.prescriptionsPerBranch.map(item => item.branchCity) || [],
            title: {
                text: "Branch",
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
                text: "Prescriptions Dispensed",
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
                name: "Prescriptions",
                data: dashboardData?.prescriptionsPerBranch.map(item => item.totalPrescriptions) || []
            }
        ]
    };


    // ==== CHART: SALES PER SUPPLIER (COLUMN) ====
    const supplierSalesChartOptions = {
        chart: {
            type: "column",
            height: 750,
            width: 1100,
            spacingTop: 30,
            spacingBottom: 30,
            spacingLeft: 20,
            spacingRight: 20
        },
        title: { text: "" },
        colors: ['#2B7A78'],
        xAxis: {
            categories: dashboardData?.salesPerSupplier.map(item => item.supplierName) || [],
            title: {
                text: "Supplier",
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
                text: "Total Sales",
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
                data: dashboardData?.salesPerSupplier.map(item => item.totalSales) || []
            }
        ]
    };


    // ==== CHART: SALES PER CATEGORY (LINE) ====
    const categorySalesChartOptions = {
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
        colors: ['#3AAFA9'],
        xAxis: {
            categories: dashboardData?.salesPerCategory.map(item => item.categoryName) || [],
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
                text: "Total Sales",
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
                data: dashboardData?.salesPerCategory.map(item => item.totalSales) || []
            }
        ]
    };


    // Current user (you can get this from context or auth state later)
    const currentUser = "Admin";

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

    return (
        <div className="admin-container">

            <h2 className="dashboard-title text-center">Welcome {" "}
                <span style={{ color: "#1D2D44" }}>{currentUser}</span>
            </h2>

            {/* ==== SALES PER BRANCH (PIE) ==== */}
            <div className="row justify-content-center mt-4 mb-4">
                <div className="col-md-10">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Sales Per Branch</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={salesChartOptions}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== INVENTORY PER BRANCH (COLUMN) ==== */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-10">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Inventory Per Branch</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={inventoryChartOptions}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== PRESCRIPTIONS PER BRANCH (LINE) ==== */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-10">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Prescriptions Dispensed Per Branch</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={prescriptionsChartOptions}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== SALES PER SUPPLIER (COLUMN) ==== */}
            <div className="row justify-content-center mb-4">
                <div className="col-md-10">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Sales Per Supplier</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={supplierSalesChartOptions}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== SALES PER CATEGORY (LINE) ==== */}
            <div className="row justify-content-center mb-5">
                <div className="col-md-10">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Sales Per Category</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={categorySalesChartOptions}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==== METRIC CARDS ==== */}
            <div className="row justify-content-center">

                {/* Total Sales */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Sales</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData?.metrics.totalSalesCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Today's Total Sales */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Today's Total Sales</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData?.metrics.todaysSalesCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Number of Employees */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Number of Employees</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData?.metrics.totalEmployeesCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Number of Suppliers - CHANGED */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Number of Suppliers</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData?.metrics.totalSuppliersCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Logs */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Logs</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData?.metrics.totalLogsCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Today's Logs */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Today's Logs</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData?.metrics.todaysLogsCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Total Reports */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Total Reports</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData?.metrics.totalReportsCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Today's Reports */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Today's Reports</h4>
                        </div>
                        <div className="card-body">
                            <p className="card-text text-center placeholder-number">
                                {dashboardData?.metrics.todaysReportsCount || 0}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
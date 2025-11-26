import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "./Dashboard.css";

export default function AdminDashboard() {

    // ==== CHART: SALES PER BRANCH (PIE) ====
    const salesChartOptions = {
        chart: { type: "pie" },
        title: { text: "Sales Per Branch" },
        series: [
            {
                name: "Sales",
                data: [
                    { name: "Salmaniya", y: 120 },
                    { name: "Budaiya", y: 90 },
                    { name: "Isa Town", y: 150 }
                ]
            }
        ]
    };

    // ==== CHART: INVENTORY PER BRANCH (COLUMN) ====
    const inventoryChartOptions = {
        chart: { type: "column" },
        title: { text: "Inventory Per Branch" },
        xAxis: {
            categories: ["Salmaniya", "Budaiya", "Isa Town"],
            title: { text: "Branch" }
        },
        yAxis: {
            title: { text: "Inventory Stock" }
        },
        series: [
            {
                name: "Inventory",
                data: [300, 180, 220]
            }
        ]
    };

    // ==== NEW CHART: PRESCRIPTIONS PER BRANCH (LINE) ====
    const prescriptionsChartOptions = {
        chart: { type: "line" },
        title: { text: "" },
        xAxis: {
            categories: ["Salmaniya", "Budaiya", "Isa Town", "Manama"],
            title: { text: "Branch" }
        },
        yAxis: {
            title: { text: "Prescriptions Dispensed" }
        },
        series: [
            {
                name: "Prescriptions",
                data: [85, 55, 110, 23]
            }
        ]
    };

    // ==== NEW CHART: SALES PER CATEGORY (COLUMN) ====
    const categorySalesChartOptions = {
        chart: { type: "line" },
        title: { text: "" },
        xAxis: {
            categories: ["Tablets", "Syrups", "Vitamins", "Supplements", "Cosmetics"],
            title: { text: "Category" }
        },
        yAxis: {
            title: { text: "Total Sales" }
        },
        series: [
            {
                name: "Sales",
                data: [350, 180, 260, 220, 140]
            }
        ]
    };

    //constant for the current user 
    const currentUser = "Admin";

    return (
        <div className="admin-container">

            <h2 className="dashboard-title text-center">Welcome {" "}
                <span style={{ color: "#1D2D44" }}>{currentUser}</span>
            </h2>

            {/* ==== TOP CHARTS ROW (PIE + COLUMN) ==== */}
            <div className="row justify-content-center mt-4 mb-5">

                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Chart for Sales Per Branch</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={salesChartOptions}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Chart for Inventory Per Branch</h4>
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

            {/* ==== SALES PER CATEGORY (COLUMN) ==== */}
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

                {[
                    "Total Sales",
                    "Today's Total Sales",
                    "Total Number of Employees",
                    "Employees Per Branch",
                    "Total Logs",
                    "Today's Logs",
                    "Total Reports",
                    "Today's Reports"
                ].map((item, index) => (
                    <div className="col-md-5" key={index}>
                        <div className="card dashboard-card border-teal mb-4">
                            <div className="card-header teal-header">
                                <h4 className="card-title">{item}</h4>
                            </div>
                            <div className="card-body">
                                <p className="card-text text-center placeholder-number">
                                    {Math.floor(Math.random() * 200 + 20)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
}

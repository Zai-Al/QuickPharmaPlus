import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import "./ManagerDashboard.css";   // Reuse same styling

export default function ManagerDashboard() {

    // ===== SAMPLE PIE CHART DATA =====
    const supplierSalesChart = {
        chart: { type: "pie" },
        title: { text: "Supplier Sales Distribution" },
        series: [
            {
                name: "Sales",
                colorByPoint: true,
                data: [
                    { name: "Supplier A", y: 35 },
                    { name: "Supplier B", y: 25 },
                    { name: "Supplier C", y: 20 },
                    { name: "Supplier D", y: 10 },
                    { name: "Supplier E", y: 10 }
                ]
            }
        ]
    };

    const categorySalesChart = {
        chart: { type: "column" },  // BAR GRAPH
        title: { text: "Category Sales Distribution" },
        xAxis: {
            categories: ["Medicine", "Supplements", "Cosmetics", "Personal Care"],
            title: { text: "Category" }
        },
        yAxis: {
            min: 0,
            title: { text: "Total Sales" }
        },
        series: [
            {
                name: "Sales",
                data: [45, 20, 15, 20],
                color: "#1D7281"   // teal theme
            }
        ]
    };


    // ===== METRIC BOXES =====
    const metricTitles = [
        "Total Branch Sales",
        "Today Total Branch Sales",
        "Total Number of Employees",
        "Total Number of Prescriptions",
        "Total Number of Deliveries",
        "Total Number of Today Deliveries",
        "Branch Total Products",
        "Branch Total Orders"
    ];

    const pharmacistLineChart = {
        chart: { type: "line" },
        title: { text: "" },   // no default title, we use the card header
        xAxis: {
            categories: ["Fatima", "Ahmed", "Sara", "Hassan", "Maryam"],
            title: { text: "Pharmacist" }
        },
        yAxis: {
            title: { text: "Approved Prescriptions" }
        },
        series: [
            {
                name: "Approvals",
                data: [45, 60, 38, 52, 70],   // fake test data
                color: "#1D7281",            // teal-ish line
                lineWidth: 3,
                marker: {
                    radius: 5,
                    fillColor: "#1D7281"
                }
            }
        ]
    };

    //constant for the current user 
    const currentUser = "Manager";

    return (
        <div className="admin-container">

            <h2 className="dashboard-title text-center">Welcome {" "}
                <span style={{ color: "#1D2D44" }}>{currentUser}</span>
            </h2>

            {/* ===== CHARTS SECTION ===== */}
            <div className="row justify-content-center mt-4 mb-5">

                {/* Supplier Pie Chart */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Pie Chart for Suppliers Sales</h4>
                        </div>
                        <div className="card-body">
                            <HighchartsReact
                                highcharts={Highcharts}
                                options={supplierSalesChart}
                            />
                        </div>
                    </div>
                </div>

                {/* Category Pie Chart */}
                <div className="col-md-5">
                    <div className="card dashboard-card border-teal mb-4">
                        <div className="card-header teal-header">
                            <h4 className="card-title">Chart for Category Sales</h4>
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

            {/* ===== LINE CHART: PRESCRIPTIONS APPROVED PER PHARMACIST ===== */}
            <div className="row justify-content-center mt-4 mb-5">
                <div className="col-md-10">   {/* Full width but centered */}
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


            {/* ===== METRIC CARDS ===== */}
            <div className="row justify-content-center">
                {metricTitles.map((title, index) => (
                    <div className="col-md-5" key={index}>
                        <div className="card dashboard-card border-teal mb-4">
                            <div className="card-header teal-header">
                                <h4 className="card-title">{title}</h4>
                            </div>
                            <div className="card-body">
                                <p className="card-text text-center placeholder-number">
                                    {Math.floor(Math.random() * 300 + 50)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

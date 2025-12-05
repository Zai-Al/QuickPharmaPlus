// src/Pages/Shared_Components/StockStatus.jsx

export default function StockStatus({ status }) {
    const MAP = {
        IN_STOCK: {
            color: "#1FCB87",
            label: "In Stock",
        },
        LOW_STOCK: {
            color: "#E2A520",
            label: "Low Stock",
        },
        OUT_OF_STOCK: {
            color: "#EB5757",
            label: "Out of Stock",
        },
    };

    const stock = MAP[status] || {
        color: "#6B7280",
        label: status || "Unknown",
    };

    return (
        <span
            style={{
                color: stock.color,
                fontWeight: 600,
                fontSize: "0.85rem",
            }}
        >
            {stock.label}
        </span>
    );
}

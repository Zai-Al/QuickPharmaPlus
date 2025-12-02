import "./DetailsSection.css";

export default function ProductHeader({ name, image }) {
    return (
        <div className="d-flex justify-content-between align-items-center mb-4 p-3 border rounded product-header">

            {/* Product Name */}
            <h2 className="fw-bold">{name}</h2>

            {/* Image Box */}
            <div
                style={{
                    width: "150px",
                    height: "150px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f8f8f8"
                }}
            >
                {image
                    ? <img src={image} alt="Product" style={{ width: "100%", height: "100%", borderRadius: "6px" }} />
                    : <span>Image</span>}
            </div>
        </div>
    );
}

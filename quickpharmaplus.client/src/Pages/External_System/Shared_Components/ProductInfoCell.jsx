// src/Pages/External_System/Shared_Components/ProductInfoCell.jsx
import { IncompatibilityPill, PrescribedPill } from "./MedicationPills";

export default function ProductInfoCell({
    imageSrc = "",
    name = "",
    category = "",
    type = "",
    incompatibilityLines = [],
    prescribed = false,
}) {
    const hasIncompatibility =
        incompatibilityLines && incompatibilityLines.length > 0;

    return (
        <div className="d-flex align-items-center gap-3">
            {/* product image */}
            <div
                style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={name}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    <span
                        style={{
                            fontSize: "0.75rem",
                            color: "#999",
                        }}
                    >
                        No image
                    </span>
                )}
            </div>

            {/* text + pills */}
            <div>
                <div className="fw-bold">{name}</div>
                <div
                    className="text-muted"
                    style={{ fontSize: "0.85rem" }}
                >
                    {category}
                    {type ? `, ${type}` : ""}
                </div>

                <div className="d-flex gap-2 mt-1">
                    {hasIncompatibility && (
                        <IncompatibilityPill
                            popoverLines={incompatibilityLines}
                        />
                    )}

                    {prescribed && <PrescribedPill />}
                </div>
            </div>
        </div>
    );
}

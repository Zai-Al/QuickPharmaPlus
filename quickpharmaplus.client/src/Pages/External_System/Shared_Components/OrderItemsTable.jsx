import TableFormat from "./TableFormat";
import formatCurrency from "../Shared_Components/formatCurrency.js";

export default function OrderItemsTable({
    items = [],
    currency = "BHD",
    shippingMethod = "", // "", "pickup", "delivery"
    title = "Prescription Summary",
}) {
    const DELIVERY_FEE_DELIVERY = 1.0; // when delivery is chosen

    const subtotal = items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
    );

    const hasMethod = shippingMethod === "pickup" || shippingMethod === "delivery";

    const deliveryFee =
        !hasMethod
            ? 0
            : shippingMethod === "delivery"
                ? DELIVERY_FEE_DELIVERY
                : 0;

    const totalAmount = subtotal + deliveryFee;

    return (
        <div className="order-items-table">
            <h5 className="mt-4 mb-3 text-start">{title}</h5>

            <TableFormat headers={["Product", "Price", "Quantity", "Subtotal"]}>
                {/* Item rows */}
                {items.map((item) => (
                    <tr key={item.id ?? item.name}>
                        <td className="align-middle text-start ps-4">
                            <div className="d-flex align-items-center gap-3">
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
                                    {item.imageSrc ? (
                                        <img
                                            src={item.imageSrc}
                                            alt={item.name}
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

                                <div>
                                    <div className="fw-bold">{item.name}</div>
                                    <div
                                        className="text-muted"
                                        style={{ fontSize: "0.85rem" }}
                                    >
                                        {item.category}
                                        {item.type ? `, ${item.type}` : ""}
                                    </div>
                                </div>
                            </div>
                        </td>

                        <td className="align-middle">
                            {formatCurrency(item.price || 0, currency)}
                        </td>

                        <td className="align-middle">
                            {item.quantity ?? 0}
                        </td>

                        <td className="align-middle">
                            {formatCurrency(
                                (item.price || 0) * (item.quantity || 0),
                                currency
                            )}
                        </td>
                    </tr>
                ))}

                {/* Subtotal always visible */}
                <tr className="summary-row">
                    <td colSpan={3} className="text-end fw-semibold">
                        Subtotal
                    </td>
                    <td className="fw-semibold">
                        {formatCurrency(subtotal, currency)}
                    </td>
                </tr>

                {/* Only show these when a shipping method is chosen */}
                {hasMethod && (
                    <tr className="summary-row">
                        <td colSpan={3} className="text-end">
                            Delivery Fee
                        </td>
                        <td>{formatCurrency(deliveryFee, currency)}</td>
                    </tr>
                )}

                {hasMethod && (
                    <tr className="summary-row">
                        <td colSpan={3} className="text-end fw-bold">
                            Total Amount
                        </td>
                        <td className="fw-bold">
                            {formatCurrency(totalAmount, currency)}
                        </td>
                    </tr>
                )}
            </TableFormat>
        </div>
    );
}

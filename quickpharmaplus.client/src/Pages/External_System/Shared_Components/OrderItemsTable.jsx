import TableFormat from "./TableFormat";
import formatCurrency from "../Shared_Components/formatCurrency.js";
import ProductInfoCell from "./ProductInfoCell";

// Optional helper: same style as in Cart / WishList
const buildIncompatibilityLines = (inc = {}) => {
    const lines = [];

    if (inc.medications && inc.medications.length) {
        lines.push(
            "Not compatible with: " +
            inc.medications
                .map((m) => m.otherProductName)
                .join(", ")
        );
    }

    if (inc.allergies && inc.allergies.length) {
        lines.push(
            "Allergy conflict: " + inc.allergies.join(", ")
        );
    }

    if (inc.illnesses && inc.illnesses.length) {
        lines.push(
            "Illness conflict: " + inc.illnesses.join(", ")
        );
    }

    return lines;
};

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

    const hasMethod =
        shippingMethod === "pickup" || shippingMethod === "delivery";

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
                {items.map((item) => {
                    const incLines = buildIncompatibilityLines(
                        item.incompatibilities
                    );

                    return (
                        <tr key={item.id ?? item.name}>
                            {/* Product cell now uses ProductInfoCell (with pills) */}
                            <td className="align-middle text-start ps-4">
                                <ProductInfoCell
                                    imageSrc={item.imageSrc}
                                    name={item.name}
                                    category={item.category}
                                    type={item.type}
                                    incompatibilityLines={incLines}
                                    prescribed={item.prescribed}
                                />
                            </td>

                            {/* Price */}
                            <td className="align-middle">
                                {formatCurrency(item.price || 0, currency)}
                            </td>

                            {/* Quantity */}
                            <td className="align-middle">
                                {item.quantity ?? 0}
                            </td>

                            {/* Subtotal */}
                            <td className="align-middle">
                                {formatCurrency(
                                    (item.price || 0) *
                                    (item.quantity || 0),
                                    currency
                                )}
                            </td>
                        </tr>
                    );
                })}

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

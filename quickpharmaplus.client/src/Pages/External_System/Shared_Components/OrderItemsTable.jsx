import TableFormat from "./TableFormat";
import formatCurrency from "../Shared_Components/formatCurrency.js";
import ProductInfoCell from "./ProductInfoCell";


const buildIncompatibilityLines = (inc = {}) => {
    const lines = [];

    if (inc.medications && inc.medications.length) {
        lines.push(
            "Not compatible with: " +
            inc.medications.map((m) => m.otherProductName).join(", ")
        );
    }

    if (inc.allergies && inc.allergies.length) {
        lines.push("Allergy conflict: " + inc.allergies.join(", "));
    }

    if (inc.illnesses && inc.illnesses.length) {
        lines.push("Illness conflict: " + inc.illnesses.join(", "));
    }

    return lines;
};

export default function OrderItemsTable({
    items = [],
    currency = "BHD",
    title = "Prescription Summary",

    
    deliveryFee = 0,
    urgentFee = 0,
    total = null, 
}) {
    const subtotal = items.reduce(
        (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)),
        0
    );

    const deliveryFeeNum = Number(deliveryFee || 0);
    const urgentFeeNum = Number(urgentFee || 0);

    const computedTotal = subtotal + deliveryFeeNum + urgentFeeNum;
    const totalAmount = total == null ? computedTotal : Number(total || 0);

    const showAnyFees = deliveryFeeNum > 0 || urgentFeeNum > 0 || total != null;

    return (
        <div className="order-items-table">
            <h5 className="mt-4 mb-3 text-start">{title}</h5>

            <TableFormat headers={["Product", "Price", "Quantity", "Subtotal"]}>
                {/* Item rows */}
                {items.map((item) => {
                    const incLines = buildIncompatibilityLines(item.incompatibilities);

                    return (
                        <tr key={item.id ?? item.name}>
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

                            <td className="align-middle">
                                {formatCurrency(Number(item.price || 0), currency)}
                            </td>

                            <td className="align-middle">
                                {item.quantity ?? 0}
                            </td>

                            <td className="align-middle">
                                {formatCurrency(
                                    Number(item.price || 0) * Number(item.quantity || 0),
                                    currency
                                )}
                            </td>
                        </tr>
                    );
                })}

                
                <tr className="summary-row">
                    <td colSpan={3} className="text-end fw-semibold">
                        Subtotal
                    </td>
                    <td className="fw-semibold">
                        {formatCurrency(subtotal, currency)}
                    </td>
                </tr>

               
                {deliveryFeeNum > 0 && (
                    <tr className="summary-row">
                        <td colSpan={3} className="text-end fw-semibold">
                            Delivery Fee
                        </td>
                        <td className="fw-semibold">{formatCurrency(deliveryFeeNum, currency)}</td>
                    </tr>
                )}

                
                {urgentFeeNum > 0 && (
                    <tr className="summary-row">
                        <td colSpan={3} className="text-end fw-semibold">
                            Urgent Delivery Fee
                        </td>
                        <td className="fw-semibold">{formatCurrency(urgentFeeNum, currency)}</td>
                    </tr>
                )}

               
                {showAnyFees && (
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

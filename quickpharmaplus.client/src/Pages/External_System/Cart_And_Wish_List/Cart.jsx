import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Shared_Components/PageHeader";
import TableFormat from "../Shared_Components/TableFormat";
import formatCurrency from "../Shared_Components/formatCurrency";
import ProductInfoCell from "../Shared_Components/ProductInfoCell";
import StockStatus from "../Shared_Components/StockStatus";
import DialogModal from "../Shared_Components/DialogModal";
import "../Shared_Components/External_Style.css";

// --- Mock cart data – replace with API later ---
const INITIAL_CART_ITEMS = [
    {
        id: 1,
        productId: 101,
        name: "Product Name A",
        category: "Category",
        type: "type",
        price: 0,
        quantity: 1,
        stockAvailable: 5,
        stockStatus: "IN_STOCK", // IN_STOCK | LOW_STOCK | OUT_OF_STOCK
        prescribed: true,
        imageSrc: "",
        incompatibilities: {
            medications: [
                {
                    otherProductId: 102,
                    otherProductName: "Product Name B",
                    interactionType: "MAJOR",
                },
            ],
            allergies: [],
            illnesses: [],
        },
    },
    {
        id: 2,
        productId: 102,
        name: "Product Name B",
        category: "Category",
        type: "type",
        price: 0,
        quantity: 1,
        stockAvailable: 2,
        stockStatus: "LOW_STOCK",
        prescribed: false,
        imageSrc: "",
        incompatibilities: {
            medications: [
                {
                    otherProductId: 101,
                    otherProductName: "Product Name A",
                    interactionType: "MAJOR",
                },
            ],
            allergies: ["Penicillin"],
            illnesses: ["Asthma"],
        },
    },
    {
        id: 3,
        productId: 103,
        name: "Product Name C",
        category: "Category",
        type: "type",
        price: 0,
        quantity: 1,
        stockAvailable: 0,
        stockStatus: "OUT_OF_STOCK",
        prescribed: true,
        imageSrc: "",
        incompatibilities: {
            medications: [],
            allergies: [],
            illnesses: [],
        },
    },
];

// build lines shown inside the incompatibility popover
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



export default function Cart() {
    const [items, setItems] = useState(INITIAL_CART_ITEMS);
    const navigate = useNavigate();

    // per-item quantity errors (e.g., exceeding stock)
    const [quantityErrors, setQuantityErrors] = useState({}); // { [id]: string }
    const [showProceedWarning, setShowProceedWarning] = useState(false);


    const itemsCount = items.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
    );
    const totalWithoutShipping = items.reduce(
        (sum, item) =>
            sum + (item.price || 0) * (item.quantity || 0),
        0
    );

    const isCartEmpty = items.length === 0;

    // -- quantity change handler with stock rules --
    const handleChangeQuantity = (id, delta) => {
        setItems((prevItems) => {
            let updatedItems = [...prevItems];
            let errorMsg = "";

            updatedItems = updatedItems.map((item) => {
                if (item.id !== id) return item;

                // if out of stock – no change
                if (item.stockStatus === "OUT_OF_STOCK") {
                    errorMsg =
                        "This product is currently out of stock.";
                    return item;
                }

                const currentQty = item.quantity || 1;
                const stockAvailable =
                    item.stockAvailable ?? currentQty;

                const newQty = currentQty + delta;

                if (newQty < 1) {
                    return { ...item, quantity: 1 };
                }

                if (newQty > stockAvailable) {
                    errorMsg = `Only ${stockAvailable} in stock.`;
                    // do NOT change quantity
                    return item;
                }

                // valid change
                return { ...item, quantity: newQty };
            });

            // update error message for this item id
            setQuantityErrors((prev) => ({
                ...prev,
                [id]: errorMsg,
            }));

            return updatedItems;
        });
    };

    // remove one item
    const handleRemoveItem = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setQuantityErrors((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    };

    // clear the whole cart
    const handleClearCart = () => {
        setItems([]);
        setQuantityErrors({});
    };

    const handleProceedToCheckout = () => {
        // check if any item has incompatibilities
        const hasAnyIncompatibility = items.some((item) => {
            const inc = item.incompatibilities || {};
            return (
                (inc.medications &&
                    inc.medications.length > 0) ||
                (inc.allergies &&
                    inc.allergies.length > 0) ||
                (inc.illnesses &&
                    inc.illnesses.length > 0)
            );
        });

        if (hasAnyIncompatibility) {
            setShowProceedWarning(true);
        } else {
            navigate("/checkout", { state: { items } });
        }
    };

    return (
        <div className="min-vh-100">
            {/* top blue bar */}
            <PageHeader title="Shopping Cart" />

            <div className="container list-padding py-4">
                {/* Order Summary card */}
                <div className="d-flex justify-content-center mb-4">
                    <div
                        className="card shadow-sm"
                        style={{
                            maxWidth: "520px",
                            width: "100%",
                            borderRadius: "16px",
                            border: "1px solid #E5E7EB",
                        }}
                    >
                        <div className="card-body pt-3 pb-5">
                            <h5 className="fw-bold text-center mb-3">
                                Order Summary
                            </h5>

                            <div className="order-summary-grid mb-5">
                                <div className="fw-bold">Items</div>
                                <div className="text-end fw-semibold">{itemsCount}</div>

                                <div className="fw-bold">Subtotal</div>
                                <div className="text-end fw-semibold">
                                    {formatCurrency(totalWithoutShipping)}
                                </div>
                            </div>


                            <div className="text-center ">
                                <button
                                    type="button"
                                    className="btn qp-add-btn px-4"
                                    style={{ minWidth: "220px" }}
                                    disabled={isCartEmpty}
                                    onClick={handleProceedToCheckout}
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Clear cart link */}
                <div className="d-flex justify-content-end mb-2">
                    {!isCartEmpty && (
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={handleClearCart}
                        >
                            Clear Shopping Cart
                        </button>
                    )}
                </div>

                {/* Cart table */}
                <TableFormat
                    headers={[
                        "", // remove
                        "Product",
                        "Price",
                        "Quantity",
                        "Stock Status",
                        "Subtotal",
                    ]}
                    headerBg="#54B2B5"
                >
                    {items.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="text-center py-4 text-muted"
                            >
                                Your shopping cart is empty.
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => {
                            const incLines =
                                buildIncompatibilityLines(
                                    item.incompatibilities
                                );
                            const qtyError =
                                quantityErrors[item.id];
                            const outOfStock =
                                item.stockStatus ===
                                "OUT_OF_STOCK";

                            return (
                                <tr key={item.id}>
                                    {/* remove (X) column */}
                                    <td className="align-middle text-center">
                                        <button
                                            type="button"
                                            className="btn p-0"
                                            onClick={() =>
                                                handleRemoveItem(
                                                    item.id
                                                )
                                            }
                                        >
                                            X
                                        </button>
                                    </td>

                                    {/* product info cell (shared component) */}
                                    <td className="align-middle text-start ps-4">
                                        <ProductInfoCell
                                            imageSrc={
                                                item.imageSrc
                                            }
                                            name={item.name}
                                            category={
                                                item.category
                                            }
                                            type={item.type}
                                            incompatibilityLines={
                                                incLines
                                            }
                                            prescribed={
                                                item.prescribed
                                            }
                                        />
                                    </td>

                                    {/* price */}
                                    <td className="align-middle">
                                        {formatCurrency(
                                            item.price || 0
                                        )}
                                    </td>

                                    {/* quantity controls + error */}
                                    <td className="align-middle">
                                        <div className="d-flex flex-column align-items-center">
                                            <div className="d-inline-flex align-items-center border rounded-pill px-2 py-1">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm border-0"
                                                    style={{
                                                        boxShadow:
                                                            "none",
                                                        padding:
                                                            "0 6px",
                                                    }}
                                                    onClick={() =>
                                                        handleChangeQuantity(
                                                            item.id,
                                                            -1
                                                        )
                                                    }
                                                    disabled={
                                                        outOfStock
                                                    }
                                                >
                                                    -
                                                </button>
                                                <span className="mx-2">
                                                    {
                                                        item.quantity
                                                    }
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm border-0"
                                                    style={{
                                                        boxShadow:
                                                            "none",
                                                        padding:
                                                            "0 6px",
                                                    }}
                                                    onClick={() =>
                                                        handleChangeQuantity(
                                                            item.id,
                                                            1
                                                        )
                                                    }
                                                    disabled={
                                                        outOfStock
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {qtyError && (
                                                <div className="text-danger small mt-1">
                                                    {qtyError}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* stock status */}
                                    <td className="align-middle">
                                        <StockStatus
                                            status={
                                                item.stockStatus
                                            }
                                        />
                                    </td>

                                    {/* subtotal */}
                                    <td className="align-middle">
                                        {formatCurrency(
                                            (item.price || 0) *
                                            (item.quantity ||
                                                0)
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </TableFormat>
            </div>
            <DialogModal
                show={showProceedWarning}
                title="Incompatibility Detected"
                body={
                    <>
                        <p className="fw-bold">
                            Are you sure you want to proceed to checkout?
                        </p>
                        <p>
                            Some medications in your cart are incompatible with your
                            health profile or other medications.
                        </p>
                        
                    </>
                }
                confirmLabel="Proceed Anyway"
                cancelLabel="Cancel"
                onCancel={() => setShowProceedWarning(false)}
                onConfirm={() => {
                    setShowProceedWarning(false);
                    navigate("/checkout", { state: { items } });
                }}
            />

        </div>

    );
}

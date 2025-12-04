// src/Pages/External_System/Cart.jsx
import { useState } from "react";
import PageHeader from "../Shared_Components/PageHeader";
import TableFormat from "../Shared_Components/TableFormat";
import formatCurrency from "../Shared_Components/formatCurrency";

// mock cart data for now – replace with API later
const INITIAL_CART_ITEMS = [
    {
        id: 1,
        name: "Product Name",
        category: "Category",
        type: "type",
        price: 0,
        quantity: 1,
        imageSrc: "",
        nonEligible: false,
    },
    {
        id: 2,
        name: "Product Name",
        category: "Category",
        type: "type",
        price: 0,
        quantity: 1,
        imageSrc: "",
        nonEligible: true, // to show the red "Non-eligible" pill
    },
    {
        id: 3,
        name: "Product Name",
        category: "Category",
        type: "type",
        price: 0,
        quantity: 1,
        imageSrc: "",
        nonEligible: false,
    },
    {
        id: 4,
        name: "Product Name",
        category: "Category",
        type: "type",
        price: 0,
        quantity: 1,
        imageSrc: "",
        nonEligible: false,
    },
];

export default function Cart() {
    const [items, setItems] = useState(INITIAL_CART_ITEMS);

    const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalWithoutShipping = items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
    );

    // quantity change: +/- buttons
    const handleChangeQuantity = (id, delta) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        quantity: Math.max(1, (item.quantity || 1) + delta),
                    }
                    : item
            )
        );
    };

    // remove single line
    const handleRemoveItem = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    // clear all
    const handleClearCart = () => {
        setItems([]);
    };

    const handleProceedToCheckout = () => {
        // later: navigate to checkout page
        console.log("Proceed to checkout with items:", items);
    };

    const isCartEmpty = items.length === 0;

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
                        <div className="card-body">
                            <h5 className="fw-bold text-center mb-2">
                                Order Summary
                            </h5>
                            <hr className="mt-2" />

                            <div className="d-flex justify-content-between mb-2">
                                <span>Items</span>
                                <span className="fw-semibold">
                                    {itemsCount}
                                </span>
                            </div>

                            <div className="d-flex justify-content-between mb-4">
                                <span>Total Without Shipping</span>
                                <span className="fw-semibold">
                                    {formatCurrency(totalWithoutShipping)}
                                </span>
                            </div>

                            <div className="text-center">
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
                        "", // remove column
                        "Product",
                        "Price",
                        "Quantity",
                        "Subtotal",
                    ]}
                    headerBg="#54B2B5"
                >
                    {items.length === 0 ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="text-center py-4 text-muted"
                            >
                                Your shopping cart is empty.
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => (
                            <tr key={item.id}>
                                {/* remove (X) column */}
                                <td className="align-middle text-center">
                                    <button
                                        type="button"
                                        className="btn btn-link text-danger p-0"
                                        onClick={() =>
                                            handleRemoveItem(item.id)
                                        }
                                    >
                                        X
                                    </button>
                                </td>

                                {/* product info */}
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
                                            <div className="fw-bold">
                                                {item.name}
                                            </div>
                                            <div
                                                className="text-muted"
                                                style={{ fontSize: "0.85rem" }}
                                            >
                                                {item.category}
                                                {item.type
                                                    ? `, ${item.type}`
                                                    : ""}
                                            </div>

                                            {item.nonEligible && (
                                                <span
                                                    className="badge rounded-pill mt-1"
                                                    style={{
                                                        backgroundColor:
                                                            "#EB5757",
                                                        color: "#fff",
                                                        fontSize: "0.7rem",
                                                    }}
                                                >
                                                    Non-eligible
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* price */}
                                <td className="align-middle">
                                    {formatCurrency(item.price || 0)}
                                </td>

                                {/* quantity controls */}
                                <td className="align-middle">
                                    <div className="d-inline-flex align-items-center border rounded-pill px-2 py-1">
                                        <button
                                            type="button"
                                            className="btn btn-sm border-0"
                                            style={{
                                                boxShadow: "none",
                                                padding: "0 6px",
                                            }}
                                            onClick={() =>
                                                handleChangeQuantity(
                                                    item.id,
                                                    -1
                                                )
                                            }
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="mx-2">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-sm border-0"
                                            style={{
                                                boxShadow: "none",
                                                padding: "0 6px",
                                            }}
                                            onClick={() =>
                                                handleChangeQuantity(
                                                    item.id,
                                                    1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>

                                {/* subtotal */}
                                <td className="align-middle">
                                    {formatCurrency(
                                        (item.price || 0) *
                                        (item.quantity || 0)
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </TableFormat>
            </div>
        </div>
    );
}

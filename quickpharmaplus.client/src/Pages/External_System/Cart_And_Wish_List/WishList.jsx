import { useState } from "react";
import PageHeader from "../Shared_Components/PageHeader";
import TableFormat from "../Shared_Components/TableFormat";
import formatCurrency from "../Shared_Components/formatCurrency";
import ProductInfoCell from "../Shared_Components/ProductInfoCell";
import StockStatus from "../Shared_Components/StockStatus";
import DialogModal from "../Shared_Components/DialogModal";
import HeartFilled from "../../../assets/icons/heart-filled.svg";
import Heart from "../../../assets/icons/heart.svg";
import "../Shared_Components/External_Style.css";

// --- Mock wish list data – replace with API later ---
const INITIAL_WISHLIST_ITEMS = [
    {
        id: 1,
        productId: 201,
        name: "Product Name A",
        category: "Category",
        type: "type",
        price: 0,
        stockAvailable: 5,
        stockStatus: "IN_STOCK", // IN_STOCK | LOW_STOCK | OUT_OF_STOCK
        prescribed: true,
        imageSrc: "",
        incompatibilities: {
            medications: [
                {
                    otherProductId: 301,
                    otherProductName: "Other Med A",
                    interactionType: "MAJOR",
                },
            ],
            allergies: [],
            illnesses: [],
        },
    },
    {
        id: 2,
        productId: 202,
        name: "Product Name B",
        category: "Category",
        type: "type",
        price: 0,
        stockAvailable: 3,
        stockStatus: "IN_STOCK",
        prescribed: false,
        imageSrc: "",
        incompatibilities: {
            medications: [],
            allergies: ["Penicillin"],
            illnesses: [],
        },
    },
    {
        id: 3,
        productId: 203,
        name: "Product Name C",
        category: "Category",
        type: "type",
        price: 0,
        stockAvailable: 0,
        stockStatus: "OUT_OF_STOCK",
        prescribed: false,
        imageSrc: "",
        incompatibilities: {
            medications: [],
            allergies: [],
            illnesses: ["Asthma"],
        },
    },
];

// build lines shown inside the incompatibility popover (for ProductInfoCell)
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
        lines.push("Allergy conflict: " + inc.allergies.join(", "));
    }

    if (inc.illnesses && inc.illnesses.length) {
        lines.push("Illness conflict: " + inc.illnesses.join(", "));
    }

    return lines;
};

// build a short summary sentence for the dialog based on which types exist
const buildIncompatibilitySummary = (inc = {}) => {
    const hasMed = inc.medications && inc.medications.length > 0;
    const hasAll = inc.allergies && inc.allergies.length > 0;
    const hasIll = inc.illnesses && inc.illnesses.length > 0;

    const types = [];
    if (hasMed) types.push("your other medications");
    if (hasAll) types.push("your recorded allergies");
    if (hasIll) types.push("your recorded illnesses");

    if (types.length === 0) return null;
    if (types.length === 1)
        return `This product may be incompatible with ${types[0]}.`;
    if (types.length === 2)
        return `This product may be incompatible with ${types[0]} and ${types[1]}.`;

    return "This product may be incompatible with your medications, allergies, and illnesses.";
};

export default function WishList() {
    const [items, setItems] = useState(INITIAL_WISHLIST_ITEMS);
    const [addDialog, setAddDialog] = useState({
        show: false,
        item: null,
        summary: "",
        detailLines: [],
    });

    const isEmpty = items.length === 0;

    const handleRemoveItem = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleClearWishList = () => {
        setItems([]);
    };

    // Add to cart with incompatibility check
    const handleAddToCart = (item) => {
        const inc = item.incompatibilities || {};
        const summary = buildIncompatibilitySummary(inc);

        if (!summary) {
            // no incompatibilities -> add directly
            console.log("Add to cart (no incompatibility):", item);
            return;
        }

        const detailLines = buildIncompatibilityLines(inc);

        setAddDialog({
            show: true,
            item,
            summary,
            detailLines,
        });
    };

    const handleConfirmAdd = () => {
        if (addDialog.item) {
            console.log(
                "Add to cart with incompatibility warning:",
                addDialog.item
            );
            // later: actually add to cart (and optionally remove from wishlist)
        }
        setAddDialog({
            show: false,
            item: null,
            summary: "",
            detailLines: [],
        });
    };

    const handleCancelAdd = () => {
        setAddDialog((prev) => ({
            ...prev,
            show: false,
            item: null,
        }));
    };

    return (
        <div className="min-vh-100">
            {/* top blue bar */}
            <PageHeader title="Wish List" />

            <div className="container list-padding py-4">
                {/* Clear wish list link */}
                <div className="d-flex justify-content-end mb-2">
                    {!isEmpty && (
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={handleClearWishList}
                        >
                            Clear Wish List
                        </button>
                    )}
                </div>

                {/* Wish list table */}
                <TableFormat
                    headers={[
                        "", // heart/remove
                        "Product",
                        "Price",
                        "Stock Status",
                        "", // Add to Cart
                    ]}
                    headerBg="#54B2B5"
                >
                    {isEmpty ? (
                        <tr>
                            <td
                                colSpan={5}
                                className="text-center py-4 text-muted"
                            >
                                Your wish list is empty.
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => {
                            const incLines = buildIncompatibilityLines(
                                item.incompatibilities
                            );
                            const outOfStock =
                                item.stockStatus === "OUT_OF_STOCK";

                            return (
                                <tr key={item.id}>
                                    {/* heart / remove column */}
                                    <td className="align-middle text-center">
                                        <button
                                            type="button"
                                            className="btn p-0 border-0 bg-transparent"
                                            onClick={() =>
                                                handleRemoveItem(
                                                    item.id
                                                )
                                            }
                                            aria-label="Remove from wish list"
                                            style={{ cursor: "pointer" }}
                                        >
                                            <img
                                                src={HeartFilled}
                                                alt="Remove from wishlist"
                                                width="22"
                                                height="22"
                                            />
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

                                    {/* stock status */}
                                    <td className="align-middle">
                                        <StockStatus
                                            status={
                                                item.stockStatus
                                            }
                                        />
                                    </td>

                                    {/* Add to Cart button */}
                                    <td className="align-middle text-end pe-4">
                                        <button
                                            type="button"
                                            className="btn qp-add-btn px-3"
                                            disabled={outOfStock}
                                            onClick={() =>
                                                handleAddToCart(
                                                    item
                                                )
                                            }
                                        >
                                            Add to Cart
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </TableFormat>
            </div>

            {/* Incompatibility dialog for Add to Cart */}
            <DialogModal
                show={addDialog.show}
                title="Possible Incompatibility"
                body={
                    <>
                        <p className="fw-bold">
                            Are you sure you want to add this product to your
                            cart?
                        </p>
                        <p>{addDialog.summary}</p>

                        {addDialog.detailLines &&
                            addDialog.detailLines.length > 0 && (
                                <ul className="mb-0">
                                    {addDialog.detailLines.map(
                                        (line, idx) => (
                                            <li key={idx}>
                                                {line}
                                            </li>
                                        )
                                    )}
                                </ul>
                            )}
                    </>
                }
                confirmLabel="Add to Cart"
                cancelLabel="Cancel"
                onCancel={handleCancelAdd}
                onConfirm={handleConfirmAdd}
            />
        </div>
    );
}

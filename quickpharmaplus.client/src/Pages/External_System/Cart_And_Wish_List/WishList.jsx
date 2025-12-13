// src/Pages/External_System/WishList/WishList.jsx  (adjust path if different)
import { useEffect, useMemo, useState, useContext } from "react";
import PageHeader from "../Shared_Components/PageHeader";
import TableFormat from "../Shared_Components/TableFormat";
import formatCurrency from "../Shared_Components/formatCurrency";
import ProductInfoCell from "../Shared_Components/ProductInfoCell";
import StockStatus from "../Shared_Components/StockStatus";
import DialogModal from "../Shared_Components/DialogModal";
import HeartFilled from "../../../assets/icons/heart-filled.svg";
import "../Shared_Components/External_Style.css";
import { AuthContext } from "../../../Context/AuthContext";
import { Link } from "react-router-dom";


// --- keep mock as fallback if API fails (optional) ---
const INITIAL_WISHLIST_ITEMS = [
    {
        id: 1,
        productId: 201,
        name: "Product Name A",
        category: "Category",
        type: "type",
        price: 0,
        stockAvailable: 5,
        stockStatus: "IN_STOCK",
        prescribed: true,
        imageSrc: "",
        incompatibilities: { medications: [], allergies: [], illnesses: [] },
    },
];

// build lines shown inside the incompatibility popover (for ProductInfoCell)
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

const buildIncompatibilitySummary = (inc = {}) => {
    const hasMed = inc.medications && inc.medications.length > 0;
    const hasAll = inc.allergies && inc.allergies.length > 0;
    const hasIll = inc.illnesses && inc.illnesses.length > 0;

    const types = [];
    if (hasMed) types.push("your other medications");
    if (hasAll) types.push("your recorded allergies");
    if (hasIll) types.push("your recorded illnesses");

    if (types.length === 0) return null;
    if (types.length === 1) return `This product may be incompatible with ${types[0]}.`;
    if (types.length === 2) return `This product may be incompatible with ${types[0]} and ${types[1]}.`;

    return "This product may be incompatible with your medications, allergies, and illnesses.";
};

export default function WishList() {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [addDialog, setAddDialog] = useState({
        show: false,
        item: null,
        summary: "",
        detailLines: [],
    });

    const isEmpty = items.length === 0;

    // =========================
    // Load wishlist from API
    // GET: /api/Wishlist?userId=5
    // =========================
    useEffect(() => {
        if (!currentUserId) {
            setItems([]);
            return;
        }

        const controller = new AbortController();

        const fetchWishlist = async () => {
            try {
                setLoading(true);
                setLoadError("");

                const res = await fetch(`${API_BASE}/api/Wishlist?userId=${currentUserId}`, {
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                    // credentials: "include", // enable later if you secure with cookies
                });

                if (!res.ok) throw new Error("Failed to load wishlist.");

                const data = await res.json();
                const apiItems = Array.isArray(data?.items) ? data.items : [];

                // Map API -> your UI shape
                const mapped = apiItems.map((x, idx) => ({
                    id: x.productId ?? idx + 1, // unique key for table row
                    productId: x.productId,
                    name: x.name ?? "—",
                    category: x.categoryName ?? "—",
                    type: x.productTypeName ?? "—",
                    price: x.price ?? 0,
                    stockAvailable: x.inventoryCount ?? 0,
                    stockStatus: x.stockStatus ?? "IN_STOCK",
                    prescribed: !!x.requiresPrescription,
                    imageSrc: x.productId
                        ? `${API_BASE}/api/ExternalProducts/${x.productId}/image`
                        : "",
                    incompatibilities: { medications: [], allergies: [], illnesses: [] }, // later
                }));

                setItems(mapped);
            } catch (e) {
                if (e.name !== "AbortError") {
                    setLoadError(e?.message || "Error loading wishlist.");
                    // optional fallback:
                    // setItems(INITIAL_WISHLIST_ITEMS);
                    setItems([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
        return () => controller.abort();
    }, [API_BASE, currentUserId]);

    // =========================
    // Remove item (API)
    // DELETE: /api/Wishlist/{productId}?userId=5
    // =========================
    const handleRemoveItem = async (productId) => {
        if (!currentUserId || !productId) return;

        try {
            const res = await fetch(
                `${API_BASE}/api/Wishlist/${productId}?userId=${currentUserId}`,
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    // credentials: "include",
                }
            );

            if (!res.ok) throw new Error("Failed to remove item.");

            setItems((prev) => prev.filter((it) => it.productId !== productId));
        } catch (e) {
            console.error(e);
        }
    };

    // Clear wishlist (no clear endpoint yet -> delete one by one)
    const handleClearWishList = async () => {
        if (!currentUserId || items.length === 0) return;

        try {
            // delete sequentially (simple + safe)
            for (const it of items) {
                // eslint-disable-next-line no-await-in-loop
                await fetch(`${API_BASE}/api/Wishlist/${it.productId}?userId=${currentUserId}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    // credentials: "include",
                });
            }
            setItems([]);
        } catch (e) {
            console.error("Failed to clear wishlist:", e);
        }
    };

    // Add to cart with incompatibility check (still mock logic)
    const handleAddToCart = (item) => {
        const inc = item.incompatibilities || {};
        const summary = buildIncompatibilitySummary(inc);

        if (!summary) {
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
            console.log("Add to cart with incompatibility warning:", addDialog.item);
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
            <PageHeader title="Wish List" />

            <div className="container list-padding py-4">
                {/* top right actions */}
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

                {/* status messages */}
                {loading && (
                    <div className="mb-2">
                        <small className="text-muted">Loading wishlist...</small>
                    </div>
                )}

                {loadError && (
                    <div className="alert alert-danger">{loadError}</div>
                )}

                {/* table */}
                <TableFormat
                    headers={["", "Product", "Price", "Stock Status", ""]}
                    headerBg="#54B2B5"
                >
                    {isEmpty ? (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-muted">
                                {currentUserId
                                    ? "Your wish list is empty."
                                    : "Please login to view your wish list."}
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => {
                            const incLines = buildIncompatibilityLines(item.incompatibilities);
                            const outOfStock = item.stockStatus === "OUT_OF_STOCK";

                            return (
                                <tr key={item.productId}>
                                    {/* remove */}
                                    <td className="align-middle text-center">
                                        <button
                                            type="button"
                                            className="btn p-0 border-0 bg-transparent"
                                            onClick={() => handleRemoveItem(item.productId)}
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

                                    {/* product info */}
                                    <td className="align-middle text-start ps-4">
                                        <ProductInfoCell
                                            imageSrc={item.imageSrc}
                                            name={
                                                <Link
                                                    to={`/productDetails/${item.productId}`}
                                                    className="text-decoration-none text-dark"
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    {item.name}
                                                </Link>
                                            }
                                            category={item.category}
                                            type={item.type}
                                            incompatibilityLines={incLines}
                                            prescribed={item.prescribed}
                                        />

                                    </td>

                                    {/* price */}
                                    <td className="align-middle">
                                        {formatCurrency(item.price || 0)}
                                    </td>

                                    {/* stock status */}
                                    <td className="align-middle">
                                        <StockStatus status={item.stockStatus} />
                                    </td>

                                    {/* add to cart */}
                                    <td className="align-middle text-end pe-4">
                                        <button
                                            type="button"
                                            className="btn qp-add-btn px-3"
                                            disabled={outOfStock}
                                            onClick={() => handleAddToCart(item)}
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

            {/* incompatibility dialog */}
            <DialogModal
                show={addDialog.show}
                title="Possible Incompatibility"
                body={
                    <>
                        <p className="fw-bold">
                            Are you sure you want to add this product to your cart?
                        </p>
                        <p>{addDialog.summary}</p>

                        {addDialog.detailLines && addDialog.detailLines.length > 0 && (
                            <ul className="mb-0">
                                {addDialog.detailLines.map((line, idx) => (
                                    <li key={idx}>{line}</li>
                                ))}
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

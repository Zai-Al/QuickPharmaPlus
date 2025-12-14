// src/Pages/External_System/WishList/WishList.jsx
import { useEffect, useState, useContext } from "react";
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
import { WishlistContext } from "../../../Context/WishlistContext";
import { CartContext } from "../../../Context/CartContext";

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

    // navbar badge refreshers
    const { refreshWishlistCount } = useContext(WishlistContext);
    const cartCtx = useContext(CartContext);
    const refreshCartCount = cartCtx?.refreshCartCount;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [rowBusy, setRowBusy] = useState({}); // { [productId]: true }
    const [actionError, setActionError] = useState(""); // optional visible error

    const [addDialog, setAddDialog] = useState({
        show: false,
        item: null,
        summary: "",
        detailLines: [],
    });

    const isEmpty = items.length === 0;

    // =========================
    // Load wishlist from API
    // GET: /api/Wishlist?userId=...
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
                setActionError("");

                const res = await fetch(`${API_BASE}/api/Wishlist?userId=${currentUserId}`, {
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    const body = await res.text().catch(() => "");
                    throw new Error(body || "Failed to load wishlist.");
                }

                const data = await res.json();
                const apiItems = Array.isArray(data?.items) ? data.items : [];

                const mapped = apiItems.map((x, idx) => {
                    const productId = x.productId ?? x.ProductId ?? null;

                    const inv =
                        x.inventoryCount ??
                        x.InventoryCount ??
                        x.stockAvailable ??
                        x.StockAvailable ??
                        0;

                    const stockStatus =
                        x.stockStatus ??
                        x.StockStatus ??
                        (inv <= 0 ? "OUT_OF_STOCK" : inv <= 5 ? "LOW_STOCK" : "IN_STOCK");

                    return {
                        id: productId ?? idx + 1,
                        productId,
                        name: x.name ?? x.productName ?? "—",
                        category: x.categoryName ?? x.category ?? "—",
                        type: x.productTypeName ?? x.type ?? "—",
                        price: x.price ?? 0,

                        stockAvailable: inv,
                        stockStatus,
                        prescribed: !!(x.requiresPrescription ?? x.prescribed ?? false),

                        imageSrc: productId ? `${API_BASE}/api/ExternalProducts/${productId}/image` : "",

                        // keep structure
                        incompatibilities: x.incompatibilities ?? { medications: [], allergies: [], illnesses: [] },
                    };
                });

                setItems(mapped);

                refreshWishlistCount?.();
            } catch (e) {
                if (e.name !== "AbortError") {
                    setLoadError(e?.message || "Error loading wishlist.");
                    setItems([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
        return () => controller.abort();
    }, [API_BASE, currentUserId, refreshWishlistCount]);

    // =========================
    // Remove item from wishlist (API)
    // DELETE: /api/Wishlist/{productId}?userId=...
    // =========================
    const removeFromWishlistApi = async (productId) => {
        const res = await fetch(`${API_BASE}/api/Wishlist/${productId}?userId=${currentUserId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(body || "Failed to remove item from wishlist.");
        }

        return true;
    };

    const handleRemoveItem = async (productId) => {
        if (!currentUserId || !productId) return;

        try {
            setActionError("");
            await removeFromWishlistApi(productId);

            setItems((prev) => prev.filter((it) => it.productId !== productId));
            refreshWishlistCount?.();
        } catch (e) {
            console.error(e);
            setActionError(e?.message || "Failed to remove item.");
        }
    };

    // Clear wishlist (no clear endpoint yet -> delete one by one)
    const handleClearWishList = async () => {
        if (!currentUserId || items.length === 0) return;

        try {
            setActionError("");

            for (const it of items) {
                // eslint-disable-next-line no-await-in-loop
                await removeFromWishlistApi(it.productId);
            }

            setItems([]);
            refreshWishlistCount?.();
        } catch (e) {
            console.error("Failed to clear wishlist:", e);
            setActionError(e?.message || "Failed to clear wishlist.");
        }
    };

    // =========================
    // Add to cart (API)
    // POST: /api/Cart/{productId}?userId=...&qty=1
    // =========================
    const addToCartApi = async (productId, qty = 1) => {
        const url = `${API_BASE}/api/Cart/${productId}?userId=${currentUserId}&qty=${qty}`;

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        // if your backend uses 409 for stock conflict
        if (res.status === 409) {
            const data = await res.json().catch(() => null);
            return { ok: false, reason: data?.reason || "OUT_OF_STOCK" };
        }

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            return { ok: false, reason: body || "FAILED" };
        }

        return { ok: true };
    };

    // =========================
    // Add to cart + remove from wishlist (IMPORTANT FLOW)
    // =========================
    const addToCartThenRemoveFromWishlist = async (item) => {
        if (!currentUserId) {
            setActionError("Please login to add items to cart.");
            return;
        }

        const productId = item?.productId;
        if (!productId) {
            setActionError("Missing product id.");
            return;
        }

        // guard: don’t call backend if out of stock
        const outOfStock =
            (item.stockStatus || "").toUpperCase() === "OUT_OF_STOCK" ||
            (typeof item.stockAvailable === "number" && item.stockAvailable <= 0);

        if (outOfStock) return;

        try {
            setActionError("");
            setRowBusy((prev) => ({ ...prev, [productId]: true }));

            // 1) add to cart
            const addRes = await addToCartApi(productId, 1);

            if (!addRes.ok) {
                const msg =
                    addRes.reason === "OUT_OF_STOCK"
                        ? "This product is out of stock."
                        : `Failed to add to cart: ${addRes.reason}`;
                console.warn(msg);
                setActionError(msg);
                return;
            }

            refreshCartCount?.();

            // 2) remove from wishlist ONLY if cart add succeeded
            await removeFromWishlistApi(productId);

            setItems((prev) => prev.filter((it) => it.productId !== productId));
            refreshWishlistCount?.();
        } catch (e) {
            console.error("Add-to-cart + remove-from-wishlist failed:", e);
            setActionError(e?.message || "Something went wrong. Please try again.");
        } finally {
            setRowBusy((prev) => ({ ...prev, [productId]: false }));
        }
    };

    // Add to cart click (with incompatibility dialog)
    const handleAddToCart = (item) => {
        const inc = item.incompatibilities || {};
        const summary = buildIncompatibilitySummary(inc);

        // no incompatibility -> do action immediately
        if (!summary) {
            addToCartThenRemoveFromWishlist(item);
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

    const handleConfirmAdd = async () => {
        if (addDialog.item) {
            await addToCartThenRemoveFromWishlist(addDialog.item);
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
                        <button type="button" className="btn btn-link p-0" onClick={handleClearWishList}>
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

                {loadError && <div className="alert alert-danger">{loadError}</div>}
                {actionError && <div className="alert alert-warning">{actionError}</div>}

                {/* table */}
                <TableFormat headers={["", "Product", "Price", "Stock Status", ""]} headerBg="#54B2B5">
                    {isEmpty ? (
                        <tr>
                            <td colSpan={5} className="text-center py-4 text-muted">
                                {currentUserId ? "Your wish list is empty." : "Please login to view your wish list."}
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => {
                            const incLines = buildIncompatibilityLines(item.incompatibilities);

                            const outOfStock =
                                (item.stockStatus || "").toUpperCase() === "OUT_OF_STOCK" ||
                                (typeof item.stockAvailable === "number" && item.stockAvailable <= 0);

                            const busy = !!rowBusy[item.productId];

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
                                            disabled={busy}
                                            title={busy ? "Please wait..." : "Remove"}
                                        >
                                            <img src={HeartFilled} alt="Remove from wishlist" width="22" height="22" />
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
                                    <td className="align-middle">{formatCurrency(item.price || 0)}</td>

                                    {/* stock status */}
                                    <td className="align-middle">
                                        <StockStatus status={item.stockStatus} />
                                    </td>

                                    {/* add to cart */}
                                    <td className="align-middle text-end pe-4">
                                        <button
                                            type="button"
                                            className="btn qp-add-btn px-3"
                                            disabled={outOfStock || busy}
                                            onClick={() => handleAddToCart(item)}
                                            title={
                                                outOfStock
                                                    ? "Out of stock"
                                                    : busy
                                                        ? "Please wait..."
                                                        : "Add to Cart"
                                            }
                                        >
                                            {busy ? "Adding..." : "Add to Cart"}
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
                        <p className="fw-bold">Are you sure you want to add this product to your cart?</p>
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

// src/Pages/External_System/Cart/Cart.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../Shared_Components/PageHeader";
import TableFormat from "../Shared_Components/TableFormat";
import formatCurrency from "../Shared_Components/formatCurrency";
import ProductInfoCell from "../Shared_Components/ProductInfoCell";
import StockStatus from "../Shared_Components/StockStatus";
import DialogModal from "../Shared_Components/DialogModal";
import "../Shared_Components/External_Style.css";
import { AuthContext } from "../../../Context/AuthContext";
import { CartContext } from "../../../Context/CartContext";

/* ---------------- helpers ---------------- */

// ? normalize (supports camelCase OR PascalCase)
const normalizeInc = (incRaw) => {
    const obj = incRaw || {};
    return {
        medications: obj.medications ?? obj.Medications ?? [],
        allergies: obj.allergies ?? obj.Allergies ?? [],
        illnesses: obj.illnesses ?? obj.Illnesses ?? [],
    };
};

// build lines shown inside the incompatibility popover (for ProductInfoCell)
const buildIncompatibilityLines = (incRaw = {}) => {
    const inc = normalizeInc(incRaw);
    const lines = [];

    if (inc.medications?.length) {
        lines.push(
            "Not compatible with: " +
            inc.medications
                .map((m) => m?.otherProductName ?? m?.OtherProductName ?? "Unknown")
                .join(", ")
        );
    }
    if (inc.allergies?.length) {
        lines.push("Allergy conflict: " + inc.allergies.join(", "));
    }
    if (inc.illnesses?.length) {
        lines.push("Illness conflict: " + inc.illnesses.join(", "));
    }

    return lines;
};

// helper image
const buildCartImageSrc = (x, API_BASE) => {
    const productId = x?.productId ?? x?.ProductId ?? null;

    const base64 =
        x?.productImageBase64 ??
        x?.ProductImageBase64 ??
        x?.imageBase64 ??
        x?.ImageBase64 ??
        null;

    const hasBase64 = !!base64;

    return hasBase64
        ? `data:image/jpeg;base64,${base64}`
        : productId
            ? `${API_BASE}/api/ExternalProducts/${productId}/image?v=${productId}`
            : "";
};


export default function Cart() {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    // safe: don’t crash if provider not wrapped yet
    const cartCtx = useContext(CartContext);
    const refreshCartCount = cartCtx?.refreshCartCount;

    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    // per-row qty errors (keyed by row.id)
    const [quantityErrors, setQuantityErrors] = useState({});
    const [showProceedWarning, setShowProceedWarning] = useState(false);

    /* =========================
       Load cart
       ========================= */
    useEffect(() => {
        if (!currentUserId) {
            setItems([]);
            return;
        }

        const controller = new AbortController();

        const fetchCart = async () => {
            try {
                setLoading(true);
                setLoadError("");

                const res = await fetch(`${API_BASE}/api/Cart?userId=${currentUserId}`, {
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) throw new Error("Failed to load cart.");

                const data = await res.json();
                const apiItems = Array.isArray(data?.items) ? data.items : [];

                const mapped = apiItems.map((x, idx) => {
                    const productId = x.productId ?? x.ProductId;

                    const qty =
                        x.cartQuantity ??
                        x.CartQuantity ??
                        x.cartItemQuantity ??
                        x.CartItemQuantity ??
                        x.quantity ?? // fallback
                        1;

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

                    // ? normalize incompatibilities coming from API
                    const inc = normalizeInc(x.incompatibilities ?? x.Incompatibilities ?? null);

                    return {
                        // keep row key stable (prefer cartItemId if backend returns it)
                        id: x.cartItemId ?? x.CartItemId ?? x.id ?? idx + 1,
                        productId,
                        name: x.name ?? x.Name ?? "—",
                        category: x.categoryName ?? x.CategoryName ?? "—",
                        type: x.productTypeName ?? x.ProductTypeName ?? "—",
                        price: x.price ?? x.Price ?? 0,
                        quantity: Number(qty) || 1,
                        stockAvailable: Number(inv) || 0,
                        stockStatus,
                        prescribed: !!(x.requiresPrescription ?? x.RequiresPrescription ?? false),
                        imageSrc: buildCartImageSrc(x, API_BASE),
                        incompatibilities: inc,
                    };
                });

                setItems(mapped);
                refreshCartCount?.();
            } catch (e) {
                if (e.name !== "AbortError") {
                    setLoadError(e?.message || "Error loading cart.");
                    setItems([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
        return () => controller.abort();
    }, [API_BASE, currentUserId, refreshCartCount]);

    /* =========================
       Derived values
       ========================= */
    const itemsCount = useMemo(
        () => items.reduce((sum, it) => sum + (it.quantity || 0), 0),
        [items]
    );

    const subtotal = useMemo(
        () => items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0),
        [items]
    );

    const isCartEmpty = items.length === 0;

    /* =========================
       Quantity update (API)
       PUT: /api/Cart/{productId}?userId=...&qty=NEW_QTY
       (absolute set)
       ========================= */
    const updateQtyApi = async (productId, qty) => {
        const res = await fetch(
            `${API_BASE}/api/Cart/${productId}?userId=${currentUserId}&qty=${qty}`,
            { method: "PUT", headers: { "Content-Type": "application/json" } }
        );

        if (res.status === 409) {
            const data = await res.json().catch(() => null);
            return { ok: false, reason: data?.reason || "EXCEEDS_AVAILABLE_STOCK" };
        }

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            return { ok: false, reason: body || "FAILED" };
        }

        return { ok: true };
    };

    const handleChangeQuantity = async (rowId, delta) => {
        const row = items.find((x) => x.id === rowId);
        if (!row) return;

        if (!currentUserId || !row.productId) return;

        const statusUpper = (row.stockStatus || "").toUpperCase();
        if (statusUpper === "OUT_OF_STOCK") {
            setQuantityErrors((p) => ({ ...p, [rowId]: "This product is currently out of stock." }));
            return;
        }

        const currentQty = Number(row.quantity || 1);
        const maxQty = Number.isFinite(row.stockAvailable) ? Number(row.stockAvailable) : currentQty;
        const nextQty = currentQty + delta;

        if (nextQty < 1) return;

        if (nextQty > maxQty) {
            setQuantityErrors((p) => ({ ...p, [rowId]: `Only ${maxQty} in stock.` }));
            return;
        }

        // optimistic UI
        setItems((prev) => prev.map((it) => (it.id === rowId ? { ...it, quantity: nextQty } : it)));
        setQuantityErrors((p) => ({ ...p, [rowId]: "" }));

        const result = await updateQtyApi(row.productId, nextQty);
        if (!result.ok) {
            // revert on failure
            setItems((prev) => prev.map((it) => (it.id === rowId ? { ...it, quantity: currentQty } : it)));
            setQuantityErrors((p) => ({
                ...p,
                [rowId]:
                    result.reason === "EXCEEDS_AVAILABLE_STOCK"
                        ? `Only ${maxQty} in stock.`
                        : "Could not update quantity. Please try again.",
            }));
            return;
        }

        refreshCartCount?.();
    };

    /* =========================
       Remove / clear
       ========================= */
    const handleRemoveItem = async (rowId) => {
        const row = items.find((x) => x.id === rowId);
        if (!row) return;

        if (!currentUserId || !row.productId) return;

        try {
            const res = await fetch(`${API_BASE}/api/Cart/${row.productId}?userId=${currentUserId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                throw new Error(body || "Failed to remove item.");
            }

            setItems((prev) => prev.filter((x) => x.id !== rowId));
            setQuantityErrors((prev) => {
                const copy = { ...prev };
                delete copy[rowId];
                return copy;
            });

            refreshCartCount?.();
        } catch (e) {
            console.error(e);
        }
    };

    const handleClearCart = async () => {
        if (!currentUserId) return;

        try {
            await fetch(`${API_BASE}/api/Cart/clear?userId=${currentUserId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });

            setItems([]);
            setQuantityErrors({});
            refreshCartCount?.();
        } catch (e) {
            console.error("Failed to clear cart:", e);
        }
    };

    /* =========================
       Checkout
       ========================= */
    const handleProceedToCheckout = () => {
        const hasInc = items.some((x) => {
            const inc = normalizeInc(x.incompatibilities);
            return !!(inc.medications.length || inc.allergies.length || inc.illnesses.length);
        });

        if (hasInc) {
            setShowProceedWarning(true);
            return;
        }

        navigate("/checkout");
    };

    /* =========================
       Render
       ========================= */
    return (
        <div className="min-vh-100">
            <PageHeader title="Shopping Cart" />

            <div className="container list-padding py-4">
                {loading && <small className="text-muted d-block mb-2">Loading cart...</small>}
                {loadError && <div className="alert alert-danger">{loadError}</div>}

                {/* Order summary */}
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
                            <h5 className="fw-bold text-center mb-3">Order Summary</h5>

                            <div className="order-summary-grid mb-5">
                                <div className="fw-bold">Items</div>
                                <div className="text-end fw-semibold">{itemsCount}</div>

                                <div className="fw-bold">Subtotal</div>
                                <div className="text-end fw-semibold">{formatCurrency(subtotal)}</div>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    className="btn qp-add-btn px-4"
                                    style={{ minWidth: "220px" }}
                                    disabled={isCartEmpty || !currentUserId}
                                    onClick={handleProceedToCheckout}
                                >
                                    Proceed to Checkout
                                </button>
                            </div>

                            {!currentUserId && (
                                <div className="text-center mt-2">
                                    <small className="text-muted">Login is required to checkout.</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {!isCartEmpty && (
                    <div className="d-flex justify-content-end mb-2">
                        <button type="button" className="btn qp-outline-btn" onClick={handleClearCart}>
                            Clear Shopping Cart
                        </button>
                    </div>
                )}

                {/* Cart table */}
                <TableFormat headers={["", "Product", "Price", "Quantity", "Stock Status", "Subtotal"]} headerBg="#54B2B5">
                    {isCartEmpty ? (
                        <tr>
                            <td colSpan={6} className="text-center py-4 text-muted">
                                {currentUserId ? (
                                    "Your shopping cart is empty."
                                ) : (
                                    <>
                                        Please login to view your cart.{" "}
                                        <Link to="/login" className="text-decoration-none">
                                            Login
                                        </Link>
                                    </>
                                )}
                            </td>
                        </tr>
                    ) : (
                        items.map((item) => {
                            const incLines = buildIncompatibilityLines(item.incompatibilities);
                            const qtyError = quantityErrors[item.id];
                            const outOfStock =
                                (item.stockStatus || "").toUpperCase() === "OUT_OF_STOCK" ||
                                Number(item.stockAvailable || 0) <= 0;

                            return (
                                <tr key={item.id}>
                                    {/* remove */}
                                    <td className="align-middle text-center">
                                        <button
                                            type="button"
                                            className="btn qp-icon-btn"
                                            onClick={() => handleRemoveItem(item.id)}
                                            aria-label="Remove from cart"
                                            title="Remove"
                                        >
                                            X
                                        </button>
                                    </td>

                                    {/* product info + clickable name */}
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

                                    {/* quantity */}
                                    <td className="align-middle">
                                        <div className="d-flex flex-column align-items-center">
                                            <div className="d-inline-flex align-items-center border rounded-pill px-2 py-1">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm border-0"
                                                    style={{ boxShadow: "none", padding: "0 6px" }}
                                                    onClick={() => handleChangeQuantity(item.id, -1)}
                                                    disabled={outOfStock || item.quantity <= 1}
                                                >
                                                    -
                                                </button>

                                                <span className="mx-2">{item.quantity}</span>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm border-0"
                                                    style={{ boxShadow: "none", padding: "0 6px" }}
                                                    onClick={() => handleChangeQuantity(item.id, 1)}
                                                    disabled={outOfStock || item.quantity >= item.stockAvailable}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {qtyError && <div className="text-danger small mt-1">{qtyError}</div>}
                                        </div>
                                    </td>

                                    {/* stock status */}
                                    <td className="align-middle">
                                        <StockStatus status={item.stockStatus} />
                                    </td>

                                    {/* subtotal */}
                                    <td className="align-middle">
                                        {formatCurrency((item.price || 0) * (item.quantity || 0))}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </TableFormat>
            </div>

            {/* incompatibility proceed warning */}
            <DialogModal
                show={showProceedWarning}
                title="Incompatibility Detected"
                body={
                    <>
                        <p className="fw-bold">Are you sure you want to proceed to checkout?</p>
                        <p className="mb-0">
                            Some medications in your cart are incompatible with your health profile or other medications.
                        </p>
                    </>
                }
                confirmLabel="Proceed Anyway"
                cancelLabel="Cancel"
                onCancel={() => setShowProceedWarning(false)}
                onConfirm={() => {
                    setShowProceedWarning(false);
                    navigate("/checkout");
                }}
            />
        </div>
    );
}

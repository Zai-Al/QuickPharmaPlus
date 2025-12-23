// src/Pages/External_System/WishList/WishList.jsx
import { useEffect, useState, useContext, useCallback } from "react";
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
import { dialogCopy } from "../Shared_Components/dialogCopy";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";

// normalize (supports camelCase OR PascalCase)
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

    if (inc.allergies?.length) lines.push("Allergy conflict: " + inc.allergies.join(", "));
    if (inc.illnesses?.length) lines.push("Illness conflict: " + inc.illnesses.join(", "));

    return lines;
};

const buildIncompatibilitySummary = (incRaw = {}) => {
    const inc = normalizeInc(incRaw);

    const hasMed = inc.medications.length > 0;
    const hasAll = inc.allergies.length > 0;
    const hasIll = inc.illnesses.length > 0;

    const types = [];
    if (hasMed) types.push("your other medications");
    if (hasAll) types.push("your recorded allergies");
    if (hasIll) types.push("your recorded illnesses");

    if (types.length === 0) return null;
    if (types.length === 1) return `This product may be incompatible with ${types[0]}.`;
    if (types.length === 2) return `This product may be incompatible with ${types[0]} and ${types[1]}.`;
    return "This product may be incompatible with your medications, allergies, and illnesses.";
};

// modal lines for server medication interaction objects
const buildMedicationLines = (incRaw = {}) => {
    const inc = normalizeInc(incRaw);
    const lines = [];

    (inc.medications || []).forEach((m) => {
        if (!m) return;
        if (typeof m === "string") lines.push(m);
        else {
            lines.push(
                m.message ||
                (m.otherProductName || m.OtherProductName
                    ? `Not compatible with: ${m.otherProductName ?? m.OtherProductName}`
                    : "Medication interaction detected.")
            );
        }
    });

    if (inc.allergies?.length) lines.push("Allergy conflict: " + inc.allergies.join(", "));
    if (inc.illnesses?.length) lines.push("Illness conflict: " + inc.illnesses.join(", "));

    return lines.filter(Boolean);
};

// helper for image
const buildWishImageSrc = (x, API_BASE) => {
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

export default function WishList() {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    const { refreshWishlistCount } = useContext(WishlistContext);
    const cartCtx = useContext(CartContext);
    const refreshCartCount = cartCtx?.refreshCartCount;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [rowBusy, setRowBusy] = useState({});
    const [actionError, setActionError] = useState("");

    const PAGE_SIZE = 12;

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [TotalCount, setTotalCount] = useState(0);

    const [reloadKey, setReloadKey] = useState(0);
    const triggerReload = useCallback(() => setReloadKey((k) => k + 1), []);

    // health modal (from wishlist item incompatibilities: allergy/illness)
    const [addDialog, setAddDialog] = useState({
        show: false,
        item: null,
        summary: "",
        detailLines: [],
    });

    // medication modal (from server 409: MEDICATION_INTERACTION)
    const [medDialog, setMedDialog] = useState({
        show: false,
        item: null,
        detailLines: [],
    });

    const isEmpty = items.length === 0;

    // =========================
    // Load wishlist
    // =========================
    useEffect(() => {
        if (!currentUserId) {
            setPage(1);
            setTotalPages(1);
            setTotalCount(0);
            setItems([]);
            setLoadError("");
            setActionError("");
            return;
        }

        const controller = new AbortController();

        const fetchWishlist = async () => {
            try {
                setLoading(true);
                setLoadError("");
                setActionError("");

                const res = await fetch(
                    `${API_BASE}/api/Wishlist?userId=${currentUserId}&page=${page}&pageSize=${PAGE_SIZE}`,
                    {
                        credentials: "include",
                        signal: controller.signal,
                        headers: { "Content-Type": "application/json" },
                    }
                );

                if (!res.ok) {
                    const body = await res.text().catch(() => "");
                    throw new Error(body || "Failed to load wishlist.");
                }

                const data = await res.json();
                const apiTotalPages = Number(data?.totalPages ?? 1);
                const apiTotalCount = Number(data?.totalCount ?? 0);

                const nextTotalPages = apiTotalPages > 0 ? apiTotalPages : 1;
                setTotalPages(nextTotalPages);
                setTotalCount(apiTotalCount >= 0 ? apiTotalCount : 0);

                // If the current page is now beyond total pages (e.g., deleted items),
                // snap back to last valid page and refetch.
                if (page > nextTotalPages) {
                    setPage(nextTotalPages);
                    return;
                }

                const apiItems = Array.isArray(data?.items) ? data.items : [];

                const mapped = apiItems.map((x, idx) => {
                    const productId = x.productId ?? x.ProductId ?? null;

                    const inv =
                        x.inventoryCount ?? x.InventoryCount ?? x.stockAvailable ?? x.StockAvailable ?? 0;

                    const stockStatus =
                        x.stockStatus ??
                        x.StockStatus ??
                        (inv <= 0 ? "OUT_OF_STOCK" : inv <= 5 ? "LOW_STOCK" : "IN_STOCK");

                    const inc = normalizeInc(x.incompatibilities ?? x.Incompatibilities ?? null);

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
                        imageSrc: buildWishImageSrc(x, API_BASE),
                        incompatibilities: inc,
                    };
                });

                // If page becomes empty (after deletes) and we're not on page 1, go back.
                if (mapped.length === 0 && page > 1) {
                    setPage((p) => Math.max(1, p - 1));
                    return;
                }

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
    }, [API_BASE, currentUserId, page, PAGE_SIZE, refreshWishlistCount, reloadKey]);

    // =========================
    // Remove item
    // =========================
    const removeFromWishlistApi = async (productId) => {
        const res = await fetch(`${API_BASE}/api/Wishlist/${productId}?userId=${currentUserId}`, {
            credentials: "include",
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
            setRowBusy((prev) => ({ ...prev, [productId]: true }));

            await removeFromWishlistApi(productId);

            refreshWishlistCount?.();
            triggerReload(); // refetch + refresh totals/pages
        } catch (e) {
            console.error(e);
            setActionError(e?.message || "Failed to remove item.");
        } finally {
            setRowBusy((prev) => ({ ...prev, [productId]: false }));
        }
    };

    // =========================
    // Clear wishlist (Option A endpoint)
    // DELETE /api/Wishlist/clear?userId=...
    // =========================
    const clearWishlistApi = async () => {
        const res = await fetch(`${API_BASE}/api/Wishlist/clear?userId=${currentUserId}`, {
            credentials: "include",
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(body || "Failed to clear wishlist.");
        }

        return true;
    };

    const handleClearWishList = async () => {
        if (!currentUserId) return;

        try {
            setActionError("");
            setLoading(true);

            await clearWishlistApi();

            // reset UI state
            setItems([]);
            setPage(1);
            setTotalPages(1);
            setTotalCount(0);

            refreshWishlistCount?.();
        } catch (e) {
            console.error("Failed to clear wishlist:", e);
            setActionError(e?.message || "Failed to clear wishlist.");
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // Add to cart (API) — IMPORTANT: keep the 409 body
    // =========================
    const addToCartApi = async (productId, qty = 1, forceAdd = false) => {
        const url = `${API_BASE}/api/Cart/${productId}?userId=${currentUserId}&qty=${qty}${forceAdd ? "&forceAdd=true" : ""
            }`;

        const res = await fetch(url, {
            credentials: "include",
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (res.status === 409) {
            const data = await res.json().catch(() => null);
            return { ok: false, conflict: true, data };
        }

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            return { ok: false, conflict: false, error: body || "FAILED" };
        }

        const data = await res.json().catch(() => null);
        return { ok: true, data };
    };

    // =========================
    // Add to cart + remove from wishlist
    // =========================
    const addToCartThenRemoveFromWishlist = async (item, forceAdd = false) => {
        if (!currentUserId) {
            setActionError("Please login to add items to cart.");
            return;
        }

        const productId = item?.productId;
        if (!productId) {
            setActionError("Missing product id.");
            return;
        }

        const outOfStock =
            (item.stockStatus || "").toUpperCase() === "OUT_OF_STOCK" ||
            (typeof item.stockAvailable === "number" && item.stockAvailable <= 0);

        if (outOfStock) return;

        try {
            setActionError("");
            setRowBusy((prev) => ({ ...prev, [productId]: true }));

            // 1) add to cart
            const addRes = await addToCartApi(productId, 1, forceAdd);

            // handle 409 properly
            if (!addRes.ok && addRes.conflict) {
                const reason = addRes?.data?.reason;

                // stock conflicts
                if (reason === "OUT_OF_STOCK") {
                    setActionError("This product is out of stock.");
                    return;
                }
                if (reason === "EXCEEDS_AVAILABLE_STOCK") {
                    setActionError("Requested quantity exceeds available stock.");
                    return;
                }

                // medication interaction -> show modal (instead of failed message)
                if (reason === "MEDICATION_INTERACTION" && addRes?.data?.requiresConfirmation) {
                    const inc = addRes?.data?.incompatibilities ?? { medications: [], allergies: [], illnesses: [] };
                    const lines = buildMedicationLines(inc);

                    setMedDialog({
                        show: true,
                        item,
                        detailLines: lines,
                    });

                    return;
                }

                setActionError(`Failed to add to cart: ${reason || "CONFLICT"}`);
                return;
            }

            if (!addRes.ok) {
                console.warn("Add to cart failed:", addRes.error);
                setActionError(addRes.error || "Failed to add to cart.");
                return;
            }

            refreshCartCount?.();

            // 2) remove from wishlist ONLY if cart add succeeded
            await removeFromWishlistApi(productId);

            refreshWishlistCount?.();
            triggerReload(); // refetch page + totals
        } catch (e) {
            console.error("Add-to-cart + remove-from-wishlist failed:", e);
            setActionError(e?.message || "Something went wrong. Please try again.");
        } finally {
            setRowBusy((prev) => ({ ...prev, [productId]: false }));
        }
    };

    // Health dialog (from item incompatibilities)
    const handleAddToCart = (item) => {
        const inc = normalizeInc(item.incompatibilities || {});
        const summary = buildIncompatibilitySummary(inc);

        if (!summary) {
            addToCartThenRemoveFromWishlist(item, false);
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
            await addToCartThenRemoveFromWishlist(addDialog.item, false);
        }
        setAddDialog({ show: false, item: null, summary: "", detailLines: [] });
    };

    const handleCancelAdd = () => {
        setAddDialog({ show: false, item: null, summary: "", detailLines: [] });
    };

    // Medication interaction confirm -> retry with forceAdd=true
    const handleConfirmMedicationAdd = async () => {
        const item = medDialog.item;
        setMedDialog({ show: false, item: null, detailLines: [] });
        if (item) await addToCartThenRemoveFromWishlist(item, true);
    };

    const handleCancelMedicationAdd = () => {
        setMedDialog({ show: false, item: null, detailLines: [] });
    };

    const handlePageChange = (newPage) => {
        if (!newPage) return;
        if (newPage < 1) return;
        if (newPage > totalPages) return;
        setPage(newPage);
    };

    return (
        <div className="min-vh-100">
            <PageHeader title="Wish List" />

            <div className="container list-padding py-4">
                <div className="d-flex justify-content-end mb-2">
                    {!isEmpty && (
                        <button
                            type="button"
                            className="btn qp-outline-btn"
                            onClick={handleClearWishList}
                            disabled={loading}
                            title={loading ? "Please wait..." : "Clear Wish List"}
                        >
                            {loading ? "Clearing..." : "Clear Wish List"}
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="mb-2">
                        <small className="text-muted">Loading wishlist...</small>
                    </div>
                )}

                {loadError && <div className="alert alert-danger">{loadError}</div>}
                {actionError && <div className="alert alert-warning">{actionError}</div>}

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

                                    <td className="align-middle">{formatCurrency(item.price || 0)}</td>

                                    <td className="align-middle">
                                        <StockStatus status={item.stockStatus} />
                                    </td>

                                    <td className="align-middle text-end pe-4">
                                        <button
                                            type="button"
                                            className="btn qp-add-btn px-3"
                                            disabled={outOfStock || busy}
                                            onClick={() => handleAddToCart(item)}
                                            title={outOfStock ? "Out of stock" : busy ? "Please wait..." : "Add to Cart"}
                                        >
                                            {busy ? "Adding..." : "Add to Cart"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </TableFormat>

                {!loading && totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                        <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                    </div>
                )}
            </div>

            {/* Health modal (allergy/illness) */}
            <DialogModal
                show={addDialog.show}
                title={dialogCopy.wishlistAddToCartHealth.title}
                body={
                    <>
                        <p className="fw-bold">{dialogCopy.wishlistAddToCartHealth.heading}</p>
                        <p>{addDialog.summary}</p>

                        {addDialog.detailLines?.length > 0 && (
                            <ul className="mb-0">
                                {addDialog.detailLines.map((line, idx) => (
                                    <li key={idx}>{line}</li>
                                ))}
                            </ul>
                        )}
                    </>
                }
                confirmLabel={dialogCopy.wishlistAddToCartHealth.confirm}
                cancelLabel={dialogCopy.wishlistAddToCartHealth.cancel}
                onCancel={handleCancelAdd}
                onConfirm={handleConfirmAdd}
            />

            {/* Medication interaction modal (server 409 MEDICATION_INTERACTION) */}
            <DialogModal
                show={medDialog.show}
                title={dialogCopy.wishlistAddToCartMedication.title}
                body={
                    <>
                        <p className="fw-bold mb-2">
                            <strong>{medDialog.item?.name}</strong>
                            {dialogCopy.wishlistAddToCartMedication.bodyTopSuffix}
                        </p>

                        {medDialog.detailLines?.length > 0 && (
                            <ul className="mb-0">
                                {medDialog.detailLines.map((line, idx) => (
                                    <li key={idx}>{line}</li>
                                ))}
                            </ul>
                        )}

                        <p className="mt-3 mb-0">{dialogCopy.wishlistAddToCartMedication.question}</p>
                    </>
                }
                confirmLabel={dialogCopy.wishlistAddToCartMedication.confirm}
                cancelLabel={dialogCopy.wishlistAddToCartMedication.cancel}
                onCancel={handleCancelMedicationAdd}
                onConfirm={handleConfirmMedicationAdd}
            />
        </div>
    );
}

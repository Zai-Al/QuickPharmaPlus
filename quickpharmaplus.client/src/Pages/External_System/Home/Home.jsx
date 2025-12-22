// src/Pages/External_System/HomeExternal.jsx
import { useEffect, useMemo, useState, useContext, useRef } from "react";
import HomeSlider from "./HomeSlider";
import CategoriesRow from "./CategoriesRow";
import "./Home.css";
import ProductRowSection from "../Shared_Components/ProductRowSection";
import DialogModal from "../Shared_Components/DialogModal"; 
import { AuthContext } from "../../../Context/AuthContext";
import { WishlistContext } from "../../../Context/WishlistContext";
import { CartContext } from "../../../Context/CartContext";
import { dialogCopy } from "../Shared_Components/dialogCopy";


/* =========================
   Helpers: incompatibilities
   ========================= */

// normalize (supports camelCase OR PascalCase OR legacy array)
const normalizeInc = (incRaw) => {
    if (!incRaw) return { medications: [], allergies: [], illnesses: [] };

    // legacy array shape -> treat as medication messages
    if (Array.isArray(incRaw)) return { medications: incRaw, allergies: [], illnesses: [] };

    const obj = incRaw || {};
    return {
        medications: obj.medications ?? obj.Medications ?? [],
        allergies: obj.allergies ?? obj.Allergies ?? [],
        illnesses: obj.illnesses ?? obj.Illnesses ?? [],
    };
};

const buildIncLines = (incRaw) => {
    const inc = normalizeInc(incRaw);
    const lines = [];

    // meds can be string OR object { otherProductName, message, ... }
    (inc.medications || []).forEach((m) => {
        if (!m) return;
        if (typeof m === "string") {
            lines.push(m);
            return;
        }
        lines.push(
            m.message ||
            (m.otherProductName || m.OtherProductName
                ? `Not compatible with: ${m.otherProductName ?? m.OtherProductName}`
                : "Medication interaction detected.")
        );
    });

    if (inc.allergies?.length) lines.push("Allergy conflict: " + inc.allergies.join(", "));
    if (inc.illnesses?.length) lines.push("Illness conflict: " + inc.illnesses.join(", "));

    return lines.filter(Boolean);
};

const hasAnyInc = (incRaw) => {
    const inc = normalizeInc(incRaw);
    return !!(inc.medications?.length || inc.allergies?.length || inc.illnesses?.length);
};

// map API dto -> ProductRowSection card shape
const mapApiToCard = (dto, API_BASE) => {
    const inv = dto?.inventoryCount ?? dto?.InventoryCount ?? 0;
    const stockStatus =
        dto?.stockStatus ??
        dto?.StockStatus ??
        (inv <= 0 ? "OUT_OF_STOCK" : inv <= 5 ? "LOW_STOCK" : "IN_STOCK");
    const hasBase64 = !!dto.productImageBase64;

    return {
        id: dto.id,
        name: dto.name,
        price: dto.price ?? 0,
        imageUrl: hasBase64
            ? `data:image/jpeg;base64,${dto.productImageBase64}`
            : dto.id
                ? `${API_BASE}/api/ExternalProducts/${dto.id}/image?v=${dto.id}`
                : null,
        isFavorite: false,
        requiresPrescription: dto.requiresPrescription ?? false,

        // keep object shape
        incompatibilities: dto.incompatibilities ?? { medications: [], allergies: [], illnesses: [] },

        categoryName: dto.categoryName ?? "",
        productType: dto.productTypeName ?? "",

        // needed for disabling button
        inventoryCount: inv,
        stockStatus,
        canAddToCart: inv > 0 && stockStatus !== "OUT_OF_STOCK",
    };
};

export default function HomeExternal() {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { refreshWishlistCount } = useContext(WishlistContext);

    // safe: don’t crash if provider not wrapped yet
    const cartCtx = useContext(CartContext);
    const refreshCartCount = cartCtx?.refreshCartCount;

    // current user (needed for wishlist/cart)
    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    /* =========================
       Unified dialog state
       - For cart: health incompatibility OR server MEDICATION_INTERACTION 409
       - For wishlist: server MEDICATION_INTERACTION 409 (forceAdd)
       ========================= */
    const [pendingProduct, setPendingProduct] = useState(null);
    const [dialogLines, setDialogLines] = useState([]);
    const [showDialog, setShowDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState(null); // "CART" | "WISHLIST" | null
    const [forceAddNext, setForceAddNext] = useState(false); // if server says MEDICATION_INTERACTION

    // categories
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // newest products
    const [newProducts, setNewProducts] = useState([]);
    const [loadingNew, setLoadingNew] = useState(false);
    const [newError, setNewError] = useState("");

    // wishlist ids (hearts)
    const [wishlistIds, setWishlistIds] = useState(() => new Set());
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // "Added" visual state (only after confirmed + success)
    const [addedIds, setAddedIds] = useState(() => new Set());
    const addedTimersRef = useRef({}); // { [productId]: timeoutId }

    // best sellers
    const [bestSellers, setBestSellers] = useState([]);
    const [loadingBest, setLoadingBest] = useState(false);
    const [bestError, setBestError] = useState("");



    const markAddedBriefly = (productId) => {
        setAddedIds((prev) => {
            const next = new Set(prev);
            next.add(productId);
            return next;
        });

        if (addedTimersRef.current[productId]) clearTimeout(addedTimersRef.current[productId]);

        addedTimersRef.current[productId] = setTimeout(() => {
            setAddedIds((prev) => {
                const next = new Set(prev);
                next.delete(productId);
                return next;
            });
            delete addedTimersRef.current[productId];
        }, 1200);
    };

    useEffect(() => {
        return () => {
            Object.values(addedTimersRef.current).forEach((t) => clearTimeout(t));
            addedTimersRef.current = {};
        };
    }, []);

    /* =========================
       Load wishlist IDs
       GET: /api/Wishlist/ids?userId=...
       ========================= */
    useEffect(() => {
        if (!currentUserId) {
            setWishlistIds(new Set());
            return;
        }

        const controller = new AbortController();

        const fetchWishlistIds = async () => {
            try {
                setWishlistLoading(true);

                const res = await fetch(`${API_BASE}/api/Wishlist/ids?userId=${currentUserId}`, {
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) return;

                const data = await res.json();
                const idsArr = Array.isArray(data?.ids) ? data.ids : [];
                setWishlistIds(new Set(idsArr));
            } catch (e) {
                if (e.name !== "AbortError") console.error("Failed to load wishlist ids:", e);
            } finally {
                setWishlistLoading(false);
            }
        };

        fetchWishlistIds();
        return () => controller.abort();
    }, [API_BASE, currentUserId]);

    /* =========================
       Load categories
       GET: /api/Category?pageNumber=1&pageSize=200
       ========================= */
    useEffect(() => {
        const controller = new AbortController();

        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);

                const res = await fetch(`${API_BASE}/api/Category?pageNumber=1&pageSize=200`, {
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    setCategories([]);
                    return;
                }

                const data = await res.json();
                const items = data.items ?? [];

                const mapped = items
                    .map((c) => {
                        const id = c.categoryId ?? c.CategoryId ?? null;

                        return {
                            id,
                            name: c.categoryName ?? c.CategoryName ?? "—",
                            iconUrl: id
                                ? `${API_BASE}/api/Category/${id}/image?v=${id}`
                                : null,
                        };
                    })
                    .filter((c) => c.id != null);

                setCategories(mapped);
            } catch (e) {
                if (e.name !== "AbortError") console.error("Failed to load categories:", e);
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
        return () => controller.abort();
    }, [API_BASE]);

    // load best sellers

    useEffect(() => {
        const controller = new AbortController();

        const fetchBestSellers = async () => {
            try {
                setLoadingBest(true);
                setBestError("");

                const url =
                    `${API_BASE}/api/ExternalProducts/best-sellers?top=10` +
                    (currentUserId ? `&userId=${currentUserId}` : "");

                const res = await fetch(url, {
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) throw new Error("Failed to load best sellers.");

                const data = await res.json();
                const items = Array.isArray(data?.items) ? data.items : [];

                setBestSellers(items.map((dto) => mapApiToCard(dto, API_BASE)));
            } catch (e) {
                if (e.name !== "AbortError") {
                    setBestSellers([]);
                    setBestError(e?.message || "Error loading best sellers.");
                }
            } finally {
                setLoadingBest(false);
            }
        };

        fetchBestSellers();
        return () => controller.abort();
    }, [API_BASE, currentUserId]);



    /* =========================
       Load newest products
       ========================= */
    useEffect(() => {
        const controller = new AbortController();

        const fetchNewest = async () => {
            try {
                setLoadingNew(true);
                setNewError("");

                const res = await fetch(`${API_BASE}/api/ExternalProducts?pageNumber=1&pageSize=100`, {
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) throw new Error("Failed to load new products.");

                const data = await res.json();
                const items = Array.isArray(data.items) ? data.items : [];

                const newest10 = items
                    .slice()
                    .sort((a, b) => (b?.id ?? 0) - (a?.id ?? 0))
                    .slice(0, 10)
                    .map((dto) => mapApiToCard(dto, API_BASE));

                setNewProducts(newest10);
            } catch (e) {
                if (e.name !== "AbortError") {
                    setNewProducts([]);
                    setNewError(e?.message || "Error loading new products.");
                }
            } finally {
                setLoadingNew(false);
            }
        };

        fetchNewest();
        return () => controller.abort();
    }, [API_BASE]);

    /* =========================
       Cart: POST /api/Cart/{id}?userId=...&qty=1&forceAdd=true/false
       ========================= */
    const addToCartApi = async (product, forceAdd = false) => {
        if (!product?.id) return { ok: false };

        if (!currentUserId) {
            console.warn("Login required to add to cart.");
            return { ok: false };
        }

        const inv = product.inventoryCount ?? 0;
        const status = product.stockStatus ?? "";
        if (inv <= 0 || status === "OUT_OF_STOCK" || product.canAddToCart === false) {
            return { ok: false };
        }

        try {
            const url = `${API_BASE}/api/Cart/${product.id}?userId=${currentUserId}&qty=1${forceAdd ? "&forceAdd=true" : ""
                }`;

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (res.status === 409) {
                const data = await res.json().catch(() => null);

                if (data?.reason === "MEDICATION_INTERACTION") {
                    return {
                        ok: false,
                        conflict: true,
                        incompatibilities: data?.incompatibilities ?? null,
                    };
                }

                return { ok: false, reason: data?.reason || "CONFLICT" };
            }

            if (!res.ok) return { ok: false, reason: "FAILED" };

            refreshCartCount?.();
            markAddedBriefly(product.id);
            return { ok: true };
        } catch (e) {
            console.error("Failed to add to cart:", e);
            return { ok: false, reason: "NETWORK" };
        }
    };

    const handleAddToCartRequest = async (product) => {
        const inv = product?.inventoryCount ?? 0;
        const status = product?.stockStatus ?? "";
        if (inv <= 0 || status === "OUT_OF_STOCK" || product?.canAddToCart === false) return;

        // 1) health incompatibility from list (if present)
        if (hasAnyInc(product?.incompatibilities)) {
            setPendingProduct(product);
            setDialogLines(buildIncLines(product.incompatibilities));
            setDialogMode("CART");
            setForceAddNext(false);
            setShowDialog(true);
            return;
        }

        // 2) try add, server may return MEDICATION_INTERACTION (409)
        const result = await addToCartApi(product, false);

        if (result?.conflict) {
            setPendingProduct(product);
            setDialogLines(buildIncLines(result.incompatibilities));
            setDialogMode("CART");
            setForceAddNext(true); // confirm -> retry with forceAdd=true
            setShowDialog(true);
            return;
        }
    };

    /* =========================
       Wishlist: POST/DELETE /api/Wishlist/{id}?userId=...&forceAdd=true/false
       ========================= */
    const toggleWishlistApi = async (product, forceAdd = false) => {
        if (!product?.id) return { ok: false };
        if (!currentUserId) return { ok: false };

        const isFav = wishlistIds.has(product.id);

        const url = isFav
            ? `${API_BASE}/api/Wishlist/${product.id}?userId=${currentUserId}`
            : `${API_BASE}/api/Wishlist/${product.id}?userId=${currentUserId}${forceAdd ? "&forceAdd=true" : ""}`;

        try {
            const res = await fetch(url, {
                method: isFav ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (res.status === 409) {
                const data = await res.json().catch(() => null);

                if (data?.reason === "MEDICATION_INTERACTION") {
                    return {
                        ok: false,
                        conflict: true,
                        incompatibilities: data?.incompatibilities ?? null,
                    };
                }

                return { ok: false, reason: data?.reason || "CONFLICT" };
            }

            if (!res.ok) return { ok: false, reason: "FAILED" };

            setWishlistIds((prev) => {
                const next = new Set(prev);
                if (isFav) next.delete(product.id);
                else next.add(product.id);
                return next;
            });

            refreshWishlistCount?.();
            return { ok: true };
        } catch (e) {
            console.error("Failed to toggle wishlist:", e);
            return { ok: false, reason: "NETWORK" };
        }
    };

    const handleToggleFavorite = async (product) => {
        if (!product?.id) return;

        if (!currentUserId) {
            console.warn("No userId found. Login required to use wishlist.");
            return;
        }

        const isFav = wishlistIds.has(product.id);

        // remove: no dialog
        if (isFav) {
            await toggleWishlistApi(product, false);
            return;
        }

        // add: server may require confirmation
        const result = await toggleWishlistApi(product, false);

        if (result?.conflict) {
            setPendingProduct(product);
            setDialogLines(buildIncLines(result.incompatibilities));
            setDialogMode("WISHLIST");
            setForceAddNext(true);
            setShowDialog(true);
        }
    };

    /* =========================
       Dialog handlers (unified)
       ========================= */
    const handleCancelDialog = () => {
        setShowDialog(false);
        setPendingProduct(null);
        setDialogLines([]);
        setDialogMode(null);
        setForceAddNext(false);
    };

    const handleConfirmDialog = async () => {
        if (!pendingProduct || !dialogMode) {
            handleCancelDialog();
            return;
        }

        if (dialogMode === "CART") {
            await addToCartApi(pendingProduct, forceAddNext);
        } else if (dialogMode === "WISHLIST") {
            await toggleWishlistApi(pendingProduct, forceAddNext);
        }

        handleCancelDialog();
    };

    /* =========================
       Derived arrays with isFavorite + isAdded
       ========================= */
    const bestSellersWithFav = useMemo(() => {
        return bestSellers.map((p) => {
            const inv = p.inventoryCount ?? 0;
            const status =
                p.stockStatus ?? (inv <= 0 ? "OUT_OF_STOCK" : inv <= 5 ? "LOW_STOCK" : "IN_STOCK");

            return {
                ...p,
                stockStatus: status,
                canAddToCart: inv > 0 && status !== "OUT_OF_STOCK",
                isFavorite: wishlistIds.has(p.id),
                isAdded: addedIds.has(p.id),
            };
        });
    }, [bestSellers, wishlistIds, addedIds]);



    const newProductsWithFav = useMemo(() => {
        return newProducts.map((p) => ({
            ...p,
            isFavorite: wishlistIds.has(p.id),
            isAdded: addedIds.has(p.id),
        }));
    }, [newProducts, wishlistIds, addedIds]);

    // pick copy based on dialogMode (cart vs wishlist)
    // pick copy based on dialogMode + whether next confirm is "force add"
    const copy = (() => {
        if (dialogMode === "WISHLIST") {
            // wishlist: most of your conflicts are medication-based
            return forceAddNext
                ? dialogCopy.wishlistMedicationInteraction
                : dialogCopy.wishlistHealthWarning;
        }

        // CART
        return forceAddNext
            ? dialogCopy.cartMedicationInteraction
            : dialogCopy.cartHealthWarning;
    })();


    return (
        <div className="home-external">
            <HomeSlider />
            <CategoriesRow categories={categories} />

            {loadingCategories && (
                <div className="container mt-2">
                    <small className="text-muted">Loading categories...</small>
                </div>
            )}

            {wishlistLoading && (
                <div className="container mt-2">
                    <small className="text-muted">Loading wishlist...</small>
                </div>
            )}

            {bestError ? (
                <div className="container my-3">
                    <div className="alert alert-danger mb-0">{bestError}</div>
                </div>
            ) : (
                <ProductRowSection
                    title={loadingBest ? "Best Seller (Loading...)" : "Best Seller"}
                    products={bestSellersWithFav}
                    highlight
                    onAddToCart={handleAddToCartRequest}
                    onToggleFavorite={handleToggleFavorite}
                />
            )}


            {newError ? (
                <div className="container my-3">
                    <div className="alert alert-danger mb-0">{newError}</div>
                </div>
            ) : (
                <ProductRowSection
                    title={loadingNew ? "New Products (Loading...)" : "New Products"}
                    products={newProductsWithFav}
                    onAddToCart={handleAddToCartRequest}
                    onToggleFavorite={handleToggleFavorite}
                />
            )}

            {/* ONE dialog for both cart + wishlist confirmation */}
            <DialogModal
                show={showDialog}
                title={copy.title}
                body={
                    <div>
                        {/* CART copy uses introPrefix/introSuffix */}
                        {copy.introPrefix ? (
                            <p className="fw-bold">
                                {copy.introPrefix} <strong>{pendingProduct?.name}</strong> {copy.introSuffix}
                            </p>
                        ) : (
                            // WISHLIST copy uses leadTextSuffix
                            <p className="fw-bold">
                                <strong>{pendingProduct?.name}</strong> {copy.leadTextSuffix}
                            </p>
                        )}

                        {dialogLines?.length > 0 && (
                            <ul className="mb-2">
                                {dialogLines.map((msg, idx) => (
                                    <li key={idx}>{msg}</li>
                                ))}
                            </ul>
                        )}

                        <p className="mb-0">{copy.question}</p>
                    </div>
                }
                confirmLabel={copy.confirm}
                cancelLabel={copy.cancel}
                onConfirm={handleConfirmDialog}
                onCancel={handleCancelDialog}
            />

        </div>
    );
}

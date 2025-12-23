// src/Pages/External_System/ProductDetails.jsx
import { useEffect, useMemo, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../Shared_Components/PageHeader";
import StockStatus from "../Shared_Components/StockStatus";
import ProductRowSection from "../Shared_Components/ProductRowSection";
import formatCurrency from "../Shared_Components/formatCurrency";
import DialogModal from "../Shared_Components/DialogModal";
import Heart from "../../../assets/icons/heart.svg";
import HeartFilled from "../../../assets/icons/heart-filled.svg";
import "./ProductDetails.css";
import { AuthContext } from "../../../Context/AuthContext.jsx";
import { WishlistContext } from "../../../Context/WishlistContext";
import { CartContext } from "../../../Context/CartContext";
import { IncompatibilityPill } from "../Shared_Components/MedicationPills";
import { dialogCopy } from "../Shared_Components/dialogCopy";

// ---------- helper to build messages like in Home / WishList ----------
const buildInteractionMessages = (inc) => {
    if (!inc) return [];
    if (Array.isArray(inc)) return inc;

    const msgs = [];
    if (inc.medications?.length) msgs.push(dialogCopy.cartMedicationInteraction.leadLine);
    if (inc.allergies?.length) msgs.push(dialogCopy.cartHealthWarning.allergyLine);
    if (inc.illnesses?.length) msgs.push(dialogCopy.cartHealthWarning.illnessLine);
    return msgs;
};

// ? normalize incompatibilities (array OR object) into lines for the pill popover + modals
const normalizeIncToLines = (inc) => {
    if (!inc) return [];
    if (Array.isArray(inc)) return inc.filter(Boolean);

    const lines = [];

    (inc.medications || []).forEach((m) => {
        if (!m) return;
        if (typeof m === "string") lines.push(m);
        else
            lines.push(
                m.message ||
                (m.otherProductName
                    ? `Not compatible with: ${m.otherProductName}`
                    : "Medication interaction detected.")
            );
    });

    (inc.allergies || []).forEach((a) => {
        if (!a) return;
        if (typeof a === "string") lines.push(a);
        else lines.push(a.allergyName || a.name || JSON.stringify(a));
    });

    (inc.illnesses || []).forEach((i) => {
        if (!i) return;
        if (typeof i === "string") lines.push(i);
        else lines.push(i.illnessName || i.name || JSON.stringify(i));
    });

    return lines.filter(Boolean);
};

// build nicer wishlist modal content from incompatibilities object
const buildFavLines = (inc) => {
    if (!inc) return [];
    const lines = [];

    if (Array.isArray(inc.medications) && inc.medications.length) {
        inc.medications.forEach((m) => {
            if (!m) return;
            if (typeof m === "string") lines.push(m);
            else if (typeof m === "object")
                lines.push(
                    m.message ||
                    (m.otherProductName
                        ? `Not compatible with: ${m.otherProductName}`
                        : "Medication interaction detected.")
                );
        });
    }

    if (Array.isArray(inc.allergies) && inc.allergies.length) {
        lines.push("Allergy conflict: " + inc.allergies.join(", "));
    }

    if (Array.isArray(inc.illnesses) && inc.illnesses.length) {
        lines.push("Illness conflict: " + inc.illnesses.join(", "));
    }

    return lines.filter(Boolean);
};

const buildFavSummary = (inc) => {
    const hasMed = Array.isArray(inc?.medications) && inc.medications.length > 0;
    const hasAll = Array.isArray(inc?.allergies) && inc.allergies.length > 0;
    const hasIll = Array.isArray(inc?.illnesses) && inc.illnesses.length > 0;

    const types = [];
    if (hasMed) types.push("your other wishlist items");
    if (hasAll) types.push("your recorded allergies");
    if (hasIll) types.push("your recorded illnesses");

    if (types.length === 0) return "";
    if (types.length === 1) return `This product may be incompatible with ${types[0]}.`;
    if (types.length === 2) return `This product may be incompatible with ${types[0]} and ${types[1]}.`;
    return "This product may be incompatible with your wishlist items, allergies, and illnesses.";
};

// local UI-only check (health-based)
const mockCheckInteractions = (_currentCart, productToAdd) => {
    const inc = productToAdd?.incompatibilities;
    return buildInteractionMessages(inc);
};

const mapListItemToCard = (dto, API_BASE) => {
    const hasBase64 = !!dto.productImageBase64; 

    return {
        id: dto.id,
        name: dto.name,
        price: dto.price ?? 0,
        imageUrl: hasBase64 ? `data:image/jpeg;base64,${dto.productImageBase64}` : dto.id ? `${API_BASE}/api/ExternalProducts/${dto.id}/image?v=${dto.id}` : null,
        isFavorite: false,
        requiresPrescription: dto.requiresPrescription ?? false,
        incompatibilities: dto.incompatibilities ?? { medications: [], allergies: [], illnesses: [] },
        categoryName: dto.categoryName ?? "",
        productType: dto.productTypeName ?? "",
        inventoryCount: dto.inventoryCount ?? 0,
        stockStatus: dto.stockStatus ?? ((dto.inventoryCount ?? 0) <= 0 ? "OUT_OF_STOCK" : "IN_STOCK"),
    };
};

export default function ProductDetails() {
    const { id } = useParams();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { refreshWishlistCount } = useContext(WishlistContext);

    // safety: CartProvider may not exist in some pages
    const cartCtx = useContext(CartContext);
    const refreshCartCount = cartCtx?.refreshCartCount;

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    // ? main add button visual state (ONLY after proceed + success)
    const [isAdded, setIsAdded] = useState(false);
    const addedTimerRef = useRef(null);

    const [quantity, setQuantity] = useState(1);
    const [uiWarning, setUiWarning] = useState("");

    const flashAdded = () => {
        setIsAdded(true);
        if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
        addedTimerRef.current = setTimeout(() => {
            setIsAdded(false);
            setQuantity(1); // reset qty back to 1
        }, 1400);
    };

    useEffect(() => {
        return () => {
            if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
        };
    }, []);

    // wishlist ids (for hearts everywhere)
    const [wishlistIds, setWishlistIds] = useState(() => new Set());
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // limit quantity to highest stock in a single city row
    const [maxQty, setMaxQty] = useState(0);

    // product state from API
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    // local cart mock (for health-only modal; medication-vs-cart is server-side)
    const [cartItems, setCartItems] = useState([]);

    // cart incompatibility dialog (used for BOTH health and drug-drug conflict)
    const [pendingItem, setPendingItem] = useState(null);
    const [interactionMessages, setInteractionMessages] = useState([]);
    const [showInteractionDialog, setShowInteractionDialog] = useState(false);

    // ? wishlist confirmation dialog
    const [favDialog, setFavDialog] = useState({
        show: false,
        product: null,
        summary: "",
        detailLines: [],
        step: "health", // "health" | "medication"
    });

    const openFavDialog = (prod, inc, step) => {
        setFavDialog({
            show: true,
            product: prod,
            summary: buildFavSummary(inc),
            detailLines: buildFavLines(inc),
            step,
        });
    };

    const closeFavDialog = () => {
        setFavDialog({ show: false, product: null, summary: "", detailLines: [], step: "health" });
    };

    const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);

    // availability data
    const [branchAvailability, setBranchAvailability] = useState([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState("");

    // carousels
    const [similarProducts, setSimilarProducts] = useState([]);
    const [brandProducts, setBrandProducts] = useState([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [loadingBrand, setLoadingBrand] = useState(false);

    // =========================
    // Load wishlist IDs
    // =========================
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
                    credentials: "include",
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    const body = await res.text();
                    console.error("Failed to load wishlist ids:", res.status, body);
                    return;
                }

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

    // ----------------------------
    // helper: compute maxQty
    // ----------------------------
    const getBranchStock = (b) =>
        Number(
            b?.stock ??
            b?.Stock ??
            b?.stockAvailable ??
            b?.StockAvailable ??
            b?.inventoryCount ??
            b?.InventoryCount ??
            0
        ) || 0;

    const computeAndSetMaxQtyFromItems = (items) => {
        const highestStock = items && items.length > 0 ? Math.max(...items.map(getBranchStock)) : 0;

        setMaxQty(highestStock);

        setQuantity((q) => {
            if (highestStock <= 0) return 1;
            if (q < 1) return 1;
            if (q > highestStock) return highestStock;
            return q;
        });
    };

    const preloadAvailabilityCount = async (productId) => {
        try {
            const res = await fetch(`${API_BASE}/api/ExternalProducts/${productId}/availability`);
            if (!res.ok) return;

            const data = await res.json();
            const items = data.items || [];

            setProduct((prev) => (prev ? { ...prev, branchesCount: data.branchesCount ?? 0 } : prev));
            computeAndSetMaxQtyFromItems(items);
        } catch {
            // silent
        }
    };

    // ==============================
    // Load product detail
    // ==============================
    useEffect(() => {
        let cancelled = false;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                setLoadError("");
                setUiWarning("");

                const res = await fetch(
                    `${API_BASE}/api/ExternalProducts/${id}${currentUserId ? `?userId=${currentUserId}` : ""}`
                );

                if (!res.ok) {
                    if (res.status === 404) throw new Error("Product not found.");
                    throw new Error("Failed to load product.");
                }

                const data = await res.json();
                const imageUrl = data.productImageBase64 ? `data:image/jpeg;base64,${data.productImageBase64}` : null;

                if (cancelled) return;

                // reset per product
                setBranchAvailability([]);
                setAvailabilityError("");
                setLoadingAvailability(false);

                setSimilarProducts([]);
                setBrandProducts([]);
                setLoadingSimilar(false);
                setLoadingBrand(false);

                setQuantity(1);
                setMaxQty(0);
                setIsAdded(false);

                setProduct({
                    id: data.id,
                    name: data.name,
                    categoryName: data.categoryName,
                    categoryId: data.categoryId ?? null,

                    productType: data.productTypeName,
                    productTypeId: data.productTypeId ?? null,

                    supplierName: data.supplierName ?? "",
                    supplierId: data.supplierId ?? null,

                    price: data.price ?? 0,
                    description: data.description ?? "",
                    isPrescribed: data.requiresPrescription ?? false,
                    stockStatus: data.stockStatus ?? "OUT_OF_STOCK",
                    branchesCount: 0,
                    imageUrl,
                    incompatibilities: data.incompatibilities ?? { medications: [], allergies: [], illnesses: [] },
                });

                preloadAvailabilityCount(data.id);
            } catch (e) {
                if (cancelled) return;
                setLoadError(e?.message || "Error loading product.");
                setProduct(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (id) fetchProduct();
        else {
            setLoadError("Missing product id.");
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [id, API_BASE, currentUserId]);

    const mainIsFavorite = !!product?.id && wishlistIds.has(product.id);

    // ? main pill lines
    const mainIncLines = normalizeIncToLines(product?.incompatibilities);
    const mainHasInc = mainIncLines.length > 0;

    // ==============================
    // Load Similar + Brand products
    // ==============================
    useEffect(() => {
        if (!product?.id) return;

        const fetchSimilar = async () => {
            if (!product.productTypeId) {
                setSimilarProducts([]);
                return;
            }

            try {
                setLoadingSimilar(true);

                const qs = new URLSearchParams();
                qs.set("pageNumber", "1");
                qs.set("pageSize", "10");
                qs.append("productTypeIds", String(product.productTypeId));
                if (currentUserId) qs.set("userId", String(currentUserId));

                const res = await fetch(`${API_BASE}/api/ExternalProducts?${qs.toString()}`);
                if (!res.ok) throw new Error("Failed to load similar products.");

                const data = await res.json();
                const items = (data.items || [])
                    .filter((x) => x.id !== product.id)
                    .slice(0, 10)
                    .map((dto) => mapListItemToCard(dto, API_BASE));

                setSimilarProducts(items);
            } catch {
                setSimilarProducts([]);
            } finally {
                setLoadingSimilar(false);
            }
        };

        const fetchBrand = async () => {
            if (!product.supplierId) {
                setBrandProducts([]);
                return;
            }

            try {
                setLoadingBrand(true);

                const qs = new URLSearchParams();
                qs.set("pageNumber", "1");
                qs.set("pageSize", "10");
                qs.append("supplierIds", String(product.supplierId));
                if (currentUserId) qs.set("userId", String(currentUserId));

                const res = await fetch(`${API_BASE}/api/ExternalProducts?${qs.toString()}`);
                if (!res.ok) throw new Error("Failed to load brand products.");

                const data = await res.json();
                const items = (data.items || [])
                    .filter((x) => x.id !== product.id)
                    .slice(0, 10)
                    .map((dto) => mapListItemToCard(dto, API_BASE));

                setBrandProducts(items);
            } catch {
                setBrandProducts([]);
            } finally {
                setLoadingBrand(false);
            }
        };

        fetchSimilar();
        fetchBrand();
    }, [product?.id, product?.productTypeId, product?.supplierId, API_BASE, currentUserId]);

    const similarWithFav = useMemo(
        () => similarProducts.map((p) => ({ ...p, isFavorite: wishlistIds.has(p.id) })),
        [similarProducts, wishlistIds]
    );

    const brandWithFav = useMemo(
        () => brandProducts.map((p) => ({ ...p, isFavorite: wishlistIds.has(p.id) })),
        [brandProducts, wishlistIds]
    );

    // ==============================
    // Quantity logic
    // ==============================
    const handleQtyChange = (delta) => {
        setQuantity((prev) => {
            const next = prev + delta;
            if (maxQty <= 0) return 1;
            if (next < 1) return 1;
            if (next > maxQty) return maxQty;
            return next;
        });
    };

    // ? universal click guard
    const eatClick = (e) => {
        if (!e) return;
        e.preventDefault?.();
        e.stopPropagation?.();
    };

    // ==============================
    // REAL add-to-cart API (UPDATED)
    // ==============================
    const addToCartApi = async (prod, qty, forceAdd = false) => {
        setUiWarning("");

        if (!currentUserId) {
            setUiWarning("Please log in to add items to your cart.");
            return { ok: false };
        }
        if (!prod?.id) return { ok: false };

        const outOfStock =
            prod.stockStatus === "OUT_OF_STOCK" ||
            (prod.id === product?.id && maxQty <= 0) ||
            (typeof prod.inventoryCount === "number" && prod.inventoryCount <= 0);

        if (outOfStock) return { ok: false };

        const safeQty = Math.max(1, Number(qty || 1));

        try {
            const url = `${API_BASE}/api/Cart/${prod.id}?userId=${currentUserId}&qty=${safeQty}${forceAdd ? "&forceAdd=true" : ""
                }`;

            const res = await fetch(url, {
                credentials: "include",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (res.status === 409) {
                const data = await res.json().catch(() => null);

                // ? show dialog for drug-drug interaction (server side)
                if (data?.reason === "MEDICATION_INTERACTION") {
                    return {
                        ok: false,
                        conflict: true,
                        incompatibilities: data?.incompatibilities ?? null,
                    };
                }

                // stock conflicts etc.
                setUiWarning(data?.reason ? String(data.reason) : "Unable to add item (conflict).");
                return { ok: false };
            }

            if (!res.ok) {
                const body = await res.text();
                console.error("Add to cart failed:", res.status, body);
                setUiWarning("Failed to add to cart.");
                return { ok: false };
            }

            refreshCartCount?.();
            return { ok: true };
        } catch (e) {
            console.error("Failed to add to cart:", e);
            setUiWarning("Network error while adding to cart.");
            return { ok: false };
        }
    };

    const addToLocalCartForMock = (prod, qty) => {
        setCartItems((prev) => [...prev, { ...prod, quantity: qty }]);
    };

    // ? MAIN add-to-cart
    const handleAddToCartClick = async (e) => {
        eatClick(e);

        if (!product) return;
        if (maxQty <= 0) return;

        const safeQty = Math.min(Math.max(quantity, 1), maxQty);

        // 1) health-based modal (client-side)
        const messages = mockCheckInteractions(cartItems, product);
        if (messages.length > 0) {
            setPendingItem({
                product,
                quantity: safeQty,
                forceAdd: false,
                mode: "health",
            });
            setInteractionMessages(messages);
            setShowInteractionDialog(true);
            return;
        }

        // 2) try add (server may return drug-drug conflict)
        const result = await addToCartApi(product, safeQty, false);

        if (result?.conflict) {
            const lines = normalizeIncToLines(result.incompatibilities);
            setPendingItem({
                product,
                quantity: safeQty,
                forceAdd: true, // next confirm will force add
                mode: "medication",
                incompatibilities: result.incompatibilities,
            });
            setInteractionMessages(lines.length ? lines : ["Medication interaction detected."]);
            setShowInteractionDialog(true);
            return;
        }

        if (result?.ok) {
            addToLocalCartForMock(product, safeQty);
            flashAdded();
        }
    };

    // ? CAROUSEL add-to-cart
    const handleCarouselAddToCart = async (p, e) => {
        eatClick(e);

        const outOfStock =
            p?.stockStatus === "OUT_OF_STOCK" || (typeof p?.inventoryCount === "number" && p.inventoryCount <= 0);
        if (outOfStock) return;

        // 1) health-based modal (client-side)
        const messages = mockCheckInteractions(cartItems, p);
        if (messages.length > 0) {
            setPendingItem({
                product: p,
                quantity: 1,
                forceAdd: false,
                mode: "health",
            });
            setInteractionMessages(messages);
            setShowInteractionDialog(true);
            return;
        }

        // 2) try add (server may return drug-drug conflict)
        const result = await addToCartApi(p, 1, false);

        if (result?.conflict) {
            const lines = normalizeIncToLines(result.incompatibilities);
            setPendingItem({
                product: p,
                quantity: 1,
                forceAdd: true,
                mode: "medication",
                incompatibilities: result.incompatibilities,
            });
            setInteractionMessages(lines.length ? lines : ["Medication interaction detected."]);
            setShowInteractionDialog(true);
            return;
        }

        if (result?.ok) {
            addToLocalCartForMock(p, 1);
        }
    };

    // =========================================================
    // Wishlist: confirmation-first (health + server 409 medication)
    // =========================================================
    const removeFromWishlistApi = async (productId) => {
        const url = `${API_BASE}/api/Wishlist/${productId}?userId=${currentUserId}`;
        const res = await fetch(url, {
            credentials: "include",
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(body || "Failed to remove from wishlist.");
        }
        return true;
    };

    const addToWishlistApi = async (productId, forceAdd = false) => {
        const url = `${API_BASE}/api/Wishlist/${productId}?userId=${currentUserId}${forceAdd ? "&forceAdd=true" : ""}`;

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

    const tryAddWishlist = async (prod, forceAdd = false) => {
        const productId = Number(prod?.id);
        if (!productId || Number.isNaN(productId)) return;

        const result = await addToWishlistApi(productId, forceAdd);

        if (!result.ok && result.conflict) {
            const inc = result?.data?.incompatibilities ?? { medications: [], allergies: [], illnesses: [] };
            openFavDialog(prod, inc, "medication");
            return;
        }

        if (!result.ok) {
            console.error("Wishlist add failed:", result.error);
            return;
        }

        setWishlistIds((prev) => {
            const next = new Set(prev);
            next.add(productId);
            return next;
        });
        refreshWishlistCount?.();
    };

    const requestToggleFavorite = async (arg1, arg2, arg3) => {
        if (!currentUserId) {
            console.warn("Login required to use wishlist.");
            return;
        }

        const prodObj = typeof arg1 === "object" && arg1 !== null ? arg1 : typeof arg3 === "object" ? arg3 : null;

        const productId = typeof arg1 === "object" && arg1 !== null ? Number(arg1.id ?? arg1.productId) : Number(arg1);
        if (!productId || Number.isNaN(productId)) return;

        const isFavNow = typeof arg2 === "boolean" ? arg2 : wishlistIds.has(productId);

        if (isFavNow) {
            try {
                await removeFromWishlistApi(productId);
                setWishlistIds((prev) => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
                refreshWishlistCount?.();
            } catch (e) {
                console.error("Failed to remove from wishlist:", e);
            }
            return;
        }

        const inc = prodObj?.incompatibilities ?? { medications: [], allergies: [], illnesses: [] };
        const hasHealth =
            (Array.isArray(inc.allergies) && inc.allergies.length > 0) ||
            (Array.isArray(inc.illnesses) && inc.illnesses.length > 0);

        if (hasHealth) {
            openFavDialog(prodObj ?? { id: productId, name: "This product" }, inc, "health");
            return;
        }

        await tryAddWishlist(prodObj ?? { id: productId, name: "This product" }, false);
    };

    const handleConfirmFav = async () => {
        const prod = favDialog.product;
        if (!prod?.id) {
            closeFavDialog();
            return;
        }

        if (favDialog.step === "health") {
            closeFavDialog();
            await tryAddWishlist(prod, false);
            return;
        }

        if (favDialog.step === "medication") {
            closeFavDialog();
            await tryAddWishlist(prod, true);
        }
    };

    const handleMainToggleFavorite = () => {
        if (!product?.id) return;
        requestToggleFavorite(product, mainIsFavorite);
    };

    // availability modal fetch
    const handleAvailability = async () => {
        if (!product?.id) return;

        setShowAvailabilityDialog(true);

        if (branchAvailability.length > 0 || loadingAvailability) return;

        try {
            setLoadingAvailability(true);
            setAvailabilityError("");

            const res = await fetch(`${API_BASE}/api/ExternalProducts/${product.id}/availability`);
            if (!res.ok) throw new Error("Failed to load branch availability.");

            const data = await res.json();
            const items = data.items || [];

            setBranchAvailability(items);
            setProduct((prev) => (prev ? { ...prev, branchesCount: data.branchesCount ?? 0 } : prev));
            computeAndSetMaxQtyFromItems(items);
        } catch (e) {
            setAvailabilityError(e?.message || "Error loading availability.");
            setBranchAvailability([]);
        } finally {
            setLoadingAvailability(false);
        }
    };

    const handleCancelAdd = (e) => {
        eatClick(e);
        setShowInteractionDialog(false);
        setPendingItem(null);
        setInteractionMessages([]);
    };

    // ? confirm: if pendingItem.forceAdd => retry with forceAdd=true
    const handleConfirmAdd = async (e) => {
        eatClick(e);

        if (pendingItem?.product) {
            const result = await addToCartApi(pendingItem.product, pendingItem.quantity, !!pendingItem.forceAdd);

            if (result?.ok) {
                addToLocalCartForMock(pendingItem.product, pendingItem.quantity);

                if (pendingItem.product?.id === product?.id) {
                    flashAdded();
                }
            }
        }

        handleCancelAdd();
    };

    // ? copy selectors
    const availabilityCopy = dialogCopy.branchAvailability;
    const cartCopy =
        pendingItem?.mode === "medication" ? dialogCopy.cartMedicationInteraction : dialogCopy.cartHealthWarning;
    const wishlistCopy =
        favDialog.step === "medication" ? dialogCopy.wishlistMedicationInteraction : dialogCopy.wishlistHealthWarning;

    return (
        <div className="min-vh-100">
            <PageHeader title="Product Details" />

            <div className="container list-padding py-4 product-details-page">
                {wishlistLoading && currentUserId && <small className="text-muted d-block mb-2">Loading wishlist...</small>}

                {uiWarning && <div className="alert alert-warning py-2 mb-3">{uiWarning}</div>}

                {loading && (
                    <div className="py-4">
                        <div className="text-muted">Loading...</div>
                    </div>
                )}

                {!loading && loadError && (
                    <div className="py-4">
                        <div className="alert alert-danger mb-0">{loadError}</div>
                    </div>
                )}

                {!loading && !loadError && product && (
                    <>
                        <div className="row g-4">
                            <div className="col-md-5">
                                <div className="product-main-image-box">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="product-main-image" />
                                    ) : (
                                        <div className="product-main-image-placeholder">
                                            <span>No image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-7">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    {/* ? pills */}
                                    <div className="d-flex flex-column gap-2 align-items-start">
                                        {product.isPrescribed && (
                                            <span className="product-pill product-pill-prescribed">Prescribed</span>
                                        )}
                                        {mainHasInc && <IncompatibilityPill popoverLines={mainIncLines} />}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn p-0 border-0 bg-transparent product-fav-btn"
                                        onClick={handleMainToggleFavorite}
                                        aria-label="Toggle wishlist"
                                    >
                                        <img src={mainIsFavorite ? HeartFilled : Heart} alt="Favorite" className="product-fav-icon" />
                                    </button>
                                </div>

                                <h3 className="product-title mb-3">{product.name}</h3>

                                <p className="mb-3 text-muted">
                                    {product.categoryName}
                                    {product.productType ? `, ${product.productType}` : ""}
                                </p>

                                <p className="product-price mb-3">{formatCurrency(product.price || 0, "BHD")}</p>

                                <div className="mb-3">
                                    <span className="fw-bold">Availability: </span>
                                    <button type="button" className="btn btn-link p-0 product-branches-link" onClick={handleAvailability}>
                                        Available at {product.branchesCount} branches
                                    </button>
                                </div>

                                <div className="mb-3">
                                    <StockStatus status={product.stockStatus} />
                                </div>

                                {/* Quantity + Add to Cart */}
                                <div className="d-flex align-items-center justify-content-center gap-3 mb-2">
                                    <div className="d-inline-flex align-items-center border rounded-pill px-2 py-1">
                                        <button
                                            type="button"
                                            className="btn btn-sm border-0"
                                            style={{ boxShadow: "none", padding: "0 6px" }}
                                            onClick={() => handleQtyChange(-1)}
                                            disabled={quantity <= 1}
                                        >
                                            -
                                        </button>

                                        <span className="mx-2">{quantity}</span>

                                        <button
                                            type="button"
                                            className="btn btn-sm border-0"
                                            style={{ boxShadow: "none", padding: "0 6px" }}
                                            onClick={() => handleQtyChange(1)}
                                            disabled={maxQty <= 0 || quantity >= maxQty}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        className={`btn qp-add-btn px-4 ${isAdded ? "qp-added-btn" : ""}`}
                                        onClick={handleAddToCartClick}
                                        disabled={maxQty <= 0}
                                        title={maxQty <= 0 ? "Out of stock in all branches" : "Add to cart"}
                                    >
                                        {maxQty <= 0 ? "Out of Stock" : isAdded ? "Added" : "Add to Cart"}
                                    </button>
                                </div>

                                <div className="text-muted small">{maxQty <= 0 ? "Out of stock in all branches" : null}</div>
                            </div>
                        </div>

                        <div className="mt-3 product-description-section">
                            <h5 className="product-section-title">Description</h5>
                            <p className="product-description-text">{product.description}</p>
                        </div>

                        <div className="product-recommendation-header">Product Recommendation</div>

                        {/* Similar products */}
                        <div className="mt-5">
                            <ProductRowSection
                                title={loadingSimilar ? "Similar Products (Loading...)" : "Similar Products"}
                                products={similarWithFav}
                                onAddToCart={handleCarouselAddToCart}
                                onToggleFavorite={(a, b, c) => requestToggleFavorite(a, b, c)}
                            />
                        </div>

                        {/* Brand products */}
                        <div className="mt-4">
                            <ProductRowSection
                                title={loadingBrand ? "Other Products by Brand (Loading...)" : "Other Products by Brand"}
                                products={brandWithFav}
                                onAddToCart={handleCarouselAddToCart}
                                onToggleFavorite={(a, b, c) => requestToggleFavorite(a, b, c)}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Branch availability dialog (copy centralized) */}
            <DialogModal
                show={showAvailabilityDialog}
                title={availabilityCopy.title}
                body={
                    <div>
                        <p className="mb-3">
                            {availabilityCopy.introPrefix} <strong>{product?.name}</strong> {availabilityCopy.introSuffix}
                        </p>

                        {availabilityError && <div className="alert alert-danger py-2">{availabilityError}</div>}

                        <div className="table-responsive">
                            <table className="table align-middle text-center mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>{availabilityCopy.tableCityHeader}</th>
                                        <th>{availabilityCopy.tableStockHeader}</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loadingAvailability ? (
                                        <tr>
                                            <td colSpan="2" className="text-muted py-4">
                                                {availabilityCopy.loading}
                                            </td>
                                        </tr>
                                    ) : branchAvailability.length === 0 ? (
                                        <tr>
                                            <td colSpan="2" className="text-muted py-4">
                                                {availabilityCopy.empty}
                                            </td>
                                        </tr>
                                    ) : (
                                        branchAvailability.map((b, idx) => (
                                            <tr key={idx}>
                                                <td>{b.cityName}</td>
                                                <td>
                                                    {getBranchStock(b) > 0 ? (
                                                        <span className="fw-semibold">
                                                            {getBranchStock(b)} {availabilityCopy.units}
                                                        </span>
                                                    ) : (
                                                        <span className="text-danger fw-semibold">{availabilityCopy.outOfStock}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                }
                confirmLabel={availabilityCopy.confirm}
                cancelLabel={availabilityCopy.cancel}
                onConfirm={() => setShowAvailabilityDialog(false)}
                onCancel={() => setShowAvailabilityDialog(false)}
            />

            {/* Cart Interaction warning dialog (copy centralized) */}
            <DialogModal
                show={showInteractionDialog}
                title={cartCopy.title}
                body={
                    <div>
                        <p className="fw-bold">
                            {cartCopy.introPrefix} <strong>{pendingItem?.product?.name}</strong>{cartCopy.introSuffix}
                        </p>

                        <ul>
                            {(interactionMessages || []).map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                            ))}
                        </ul>

                        <p className="mb-0">{cartCopy.question}</p>
                    </div>
                }
                confirmLabel={cartCopy.confirm}
                cancelLabel={cartCopy.cancel}
                onConfirm={handleConfirmAdd}
                onCancel={handleCancelAdd}
            />

            {/* Wishlist confirmation dialog (copy centralized) */}
            <DialogModal
                show={favDialog.show}
                title={wishlistCopy.title}
                body={
                    <div>
                        <p>
                            <strong>{favDialog.product?.name}</strong> {wishlistCopy.leadTextSuffix}
                        </p>

                        {favDialog.summary && <p>{favDialog.summary}</p>}

                        {favDialog.detailLines?.length > 0 && (
                            <ul className="mb-0">
                                {favDialog.detailLines.map((msg, idx) => (
                                    <li key={idx}>{msg}</li>
                                ))}
                            </ul>
                        )}

                        <p className="mt-3 mb-0">{wishlistCopy.question}</p>
                    </div>
                }
                confirmLabel={wishlistCopy.confirm}
                cancelLabel={wishlistCopy.cancel}
                onConfirm={handleConfirmFav}
                onCancel={closeFavDialog}
            />
        </div>
    );
}

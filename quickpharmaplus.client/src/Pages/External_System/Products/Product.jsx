// src/Pages/External_System/Product.jsx
import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import ProductCard from "../Shared_Components/ProductCard";
import PageHeader from "../Shared_Components/PageHeader";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import "./ProductPage.css";
import { AuthContext } from "../../../Context/AuthContext.jsx";
import { FiSearch } from "react-icons/fi";
import { WishlistContext } from "../../../Context/WishlistContext";
import { CartContext } from "../../../Context/CartContext";
import DialogModal from "../Shared_Components/DialogModal";
import { dialogCopy } from "../Shared_Components/dialogCopy";


// price ranges for filter
const PRICE_RANGES = [
    { key: "1-5", label: "1 BHD - 5 BHD", min: 1, max: 5 },
    { key: "6-10", label: "6 BHD - 10 BHD", min: 6, max: 10 },
    { key: "11-15", label: "11 BHD - 15 BHD", min: 11, max: 15 },
    { key: "16-20", label: "16 BHD - 20 BHD", min: 16, max: 20 },
    { key: "21-25", label: "21 BHD - 25 BHD", min: 21, max: 25 },
    { key: "26-30", label: "26 BHD - 30 BHD", min: 26, max: 30 },
    { key: "31+", label: "31 BHD and above", min: 31, max: null },
];

// helper: backend returns incompatibilities as an object
// { medications: [], allergies: [], illnesses: [] }
// but ProductCard expects lines array
const normalizeToLines = (inc) => {
    if (!inc) return [];
    if (Array.isArray(inc)) return inc;

    const toText = (x) => {
        if (x == null) return "";
        if (typeof x === "string") return x;
        if (typeof x === "object") {
            return (
                x.message ||
                x.name ||
                x.ingredientName ||
                x.illnessName ||
                x.allergyName ||
                x.otherProductName ||
                JSON.stringify(x)
            );
        }
        return String(x);
    };

    const lines = [];
    (inc.medications || []).forEach((x) => lines.push(toText(x)));
    (inc.allergies || []).forEach((x) => lines.push(toText(x)));
    (inc.illnesses || []).forEach((x) => lines.push(toText(x)));

    return lines.filter(Boolean);
};

// wishlist dialog helpers (explicit for meds objects)
const buildFavLines = (inc) => {
    if (!inc) return [];
    const lines = [];

    if (Array.isArray(inc.medications) && inc.medications.length) {
        inc.medications.forEach((m) => {
            if (!m) return;
            if (typeof m === "string") lines.push(m);
            else if (typeof m === "object") {
                lines.push(
                    m.message ||
                    (m.otherProductName
                        ? `Not compatible with: ${m.otherProductName}`
                        : "Medication interaction detected.")
                );
            }
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

// helper for card image
const buildCardImageUrl = (dto, API_BASE) => {
    const id = dto?.id ?? dto?.Id ?? dto?.productId ?? dto?.ProductId ?? null;

    const base64 =
        dto?.productImageBase64 ??
        dto?.ProductImageBase64 ??
        dto?.imageBase64 ??
        dto?.ImageBase64 ??
        null;

    const hasBase64 = !!base64;

    return hasBase64
        ? `data:image/jpeg;base64,${base64}`
        : id
            ? `${API_BASE}/api/ExternalProducts/${id}/image?v=${id}`
            : null;
};
export default function Product() {
    const location = useLocation();

    const { refreshWishlistCount } = useContext(WishlistContext);

    // safety: if CartProvider not wrapped yet, don’t crash
    const cartCtx = useContext(CartContext);
    const refreshCartCount = cartCtx?.refreshCartCount;

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    // filters / search state
    const [searchText, setSearchText] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedPrices, setSelectedPrices] = useState([]);
    const [sortBy, setSortBy] = useState("price-asc");

    const [isCategoryOpen, setIsCategoryOpen] = useState(true);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isBranchOpen, setIsBranchOpen] = useState(false);
    const [isBrandOpen, setIsBrandOpen] = useState(false);
    const [isPriceOpen, setIsPriceOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    // pagination + data
    const [products, setProducts] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const pageSize = 12;
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // wishlist ids (for hearts)
    const [wishlistIds, setWishlistIds] = useState(() => new Set());
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // "Added" visual state controlled here (only after confirmed + API success)
    const [addedIds, setAddedIds] = useState(() => new Set());
    const addedTimersRef = useRef({}); // { [productId]: timeoutId }

    const markAddedBriefly = (productId) => {
        setAddedIds((prev) => {
            const next = new Set(prev);
            next.add(productId);
            return next;
        });

        // clear previous timer if exists
        if (addedTimersRef.current[productId]) {
            clearTimeout(addedTimersRef.current[productId]);
        }

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
            // cleanup timers on unmount
            Object.values(addedTimersRef.current).forEach((t) => clearTimeout(t));
            addedTimersRef.current = {};
        };
    }, []);

    // filter metadata
    const [filterMeta, setFilterMeta] = useState({
        categories: [],
        brands: [],
        types: [],
        branches: [],
    });

    // cart incompatibility modal state (HEALTH/PROFILE based)
    const [pendingProduct, setPendingProduct] = useState(null);
    const [interactionMessages, setInteractionMessages] = useState([]);
    const [showInteractionDialog, setShowInteractionDialog] = useState(false);

    // cart medication-interaction modal state (SERVER 409 MEDICATION_INTERACTION)
    const [medDialog, setMedDialog] = useState({
        show: false,
        product: null,
        incompatibilities: null, // object from server
        messages: [],
    });

    // wishlist confirmation modal (health first, then possible 409 medication)
    const [favDialog, setFavDialog] = useState({
        show: false,
        product: null,
        summary: "",
        detailLines: [],
        step: "health", // "health" | "medication"
    });

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

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
                    const body = await res.text().catch(() => "");
                    console.error("Failed to load wishlist ids:", res.status, body);
                    return;
                }

                const data = await res.json().catch(() => null);
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

    // =========================
    // fetch filter metadata
    // =========================
    useEffect(() => {
        const controller = new AbortController();

        async function fetchCategoriesForFilter() {
            try {
                const res = await fetch(`${API_BASE}/api/Category?pageNumber=1&pageSize=200`, {
                    signal: controller.signal,
                });
                if (!res.ok) return;

                const data = await res.json().catch(() => null);
                const items = data?.items ?? [];

                setFilterMeta((prev) => ({
                    ...prev,
                    categories: items.map((c) => ({
                        id: c.categoryId ?? c.CategoryId ?? null,
                        name: c.categoryName ?? c.CategoryName ?? "—",
                    })),
                }));
            } catch (e) {
                if (e.name !== "AbortError") console.error("Failed to load categories:", e);
            }
        }

        async function fetchTypesForFilter() {
            try {
                const res = await fetch(`${API_BASE}/api/Category/types?pageNumber=1&pageSize=200`, {
                    signal: controller.signal,
                });
                if (!res.ok) return;

                const data = await res.json().catch(() => null);
                const items = data?.items ?? [];

                setFilterMeta((prev) => ({
                    ...prev,
                    types: items.map((t) => ({
                        id: t.productTypeId ?? t.ProductTypeId ?? t.typeId ?? t.TypeId ?? null,
                        name: t.productTypeName ?? t.ProductTypeName ?? t.typeName ?? t.TypeName ?? "—",
                        categoryId: t.categoryId ?? t.CategoryId ?? null,
                    })),
                }));
            } catch (e) {
                if (e.name !== "AbortError") console.error("Failed to load types:", e);
            }
        }

        async function fetchBrandsForFilter() {
            try {
                const res = await fetch(`${API_BASE}/api/Suppliers?pageNumber=1&pageSize=200`, {
                    signal: controller.signal,
                });
                if (!res.ok) return;

                const data = await res.json().catch(() => null);
                const items = data?.items ?? [];

                setFilterMeta((prev) => ({
                    ...prev,
                    brands: items.map((s) => ({
                        id: s.supplierId ?? s.SupplierId ?? null,
                        name: s.supplierName ?? s.SupplierName ?? "—",
                    })),
                }));
            } catch (e) {
                if (e.name !== "AbortError") console.error("Failed to load brands:", e);
            }
        }

        async function fetchBranchesForFilter() {
            try {
                const res = await fetch(`${API_BASE}/api/Branch?pageNumber=1&pageSize=200`, {
                    signal: controller.signal,
                });
                if (!res.ok) return;

                const data = await res.json().catch(() => null);
                const items = data?.items ?? [];

                setFilterMeta((prev) => ({
                    ...prev,
                    branches: items.map((b) => {
                        const id = b.branchId ?? b.BranchId ?? null;
                        const city = b.cityName ?? b.CityName ?? "";
                        return { id, name: city ? `Branch #${id} - ${city}` : `Branch #${id}` };
                    }),
                }));
            } catch (e) {
                if (e.name !== "AbortError") console.error("Failed to load branches:", e);
            }
        }

        fetchCategoriesForFilter();
        fetchTypesForFilter();
        fetchBrandsForFilter();
        fetchBranchesForFilter();

        return () => controller.abort();
    }, [API_BASE]);

    // read from URL whenever it changes
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        const urlSearch = params.get("search") || "";
        setSearchText(urlSearch);

        const categoryIdParam = params.get("categoryId");
        if (categoryIdParam) {
            const idNum = Number(categoryIdParam);
            if (!Number.isNaN(idNum)) setSelectedCategories([idNum]);
        }
    }, [location.search]);

    // reset to first page when any filter changes
    useEffect(() => {
        setPageNumber(1);
    }, [searchText, selectedCategories, selectedTypes, selectedBranches, selectedBrands, selectedPrices, sortBy]);

    // =========================
    // Load products
    // =========================
    useEffect(() => {
        const controller = new AbortController();

        const loadProducts = async () => {
            try {
                setIsLoading(true);

                const params = new URLSearchParams();
                params.set("pageNumber", String(pageNumber));
                params.set("pageSize", String(pageSize));

                if (searchText.trim()) params.set("search", searchText.trim());

                selectedCategories.forEach((id) => params.append("categoryIds", String(id)));
                selectedBrands.forEach((id) => params.append("supplierIds", String(id)));
                selectedTypes.forEach((id) => params.append("productTypeIds", String(id)));
                selectedBranches.forEach((id) => params.append("branchIds", String(id)));

                if (currentUserId) params.set("userId", String(currentUserId));

                // price filter
                if (selectedPrices.length > 0) {
                    const key = selectedPrices[0];
                    const rg = PRICE_RANGES.find((x) => x.key === key);
                    if (rg) {
                        params.set("minPrice", String(rg.min));
                        if (rg.max != null) params.set("maxPrice", String(rg.max));
                        else params.delete("maxPrice");
                    }
                } else {
                    params.delete("minPrice");
                    params.delete("maxPrice");
                }

                params.set("sortBy", sortBy);

                const url = `${API_BASE}/api/ExternalProducts?${params.toString()}`;

                const response = await fetch(url, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const body = await response.text().catch(() => "");
                    console.error("Failed to load products:", response.status, body);
                    setProducts([]);
                    setTotalPages(1);
                    return;
                }

                const data = await response.json().catch(() => null);

                const mapped = (data?.items || []).map((dto) => {
                    const inv = dto.inventoryCount ?? dto.InventoryCount ?? 0;
                    const stockStatus =
                        dto.stockStatus ??
                        dto.StockStatus ??
                        (inv <= 0 ? "OUT_OF_STOCK" : inv <= 5 ? "LOW_STOCK" : "IN_STOCK");

                    const safeInc =
                        dto.incompatibilities ??
                        dto.Incompatibilities ??
                        { medications: [], allergies: [], illnesses: [] };

                    return {
                        id: dto.id ?? dto.Id ?? dto.productId ?? dto.ProductId,
                        name: dto.name ?? dto.Name ?? dto.productName ?? dto.ProductName,
                        categoryId: dto.categoryId ?? dto.CategoryId,
                        categoryName: dto.categoryName ?? dto.CategoryName,
                        productTypeId: dto.productTypeId ?? dto.ProductTypeId ?? null,
                        productType: dto.productTypeName ?? dto.ProductTypeName ?? dto.typeName ?? dto.TypeName,
                        price: dto.price ?? dto.Price ?? 0,
                        supplierId: dto.supplierId ?? dto.SupplierId ?? null,
                        brand: dto.supplierName ?? dto.SupplierName ?? "Unknown",
                        branch: "All Branches",
                        requiresPrescription: dto.requiresPrescription ?? dto.RequiresPrescription ?? false,
                        incompatibilities: safeInc,
                        imageUrl: buildCardImageUrl(dto, API_BASE),
                        inventoryCount: inv,
                        stockStatus,
                    };
                });

                setProducts(mapped);
                setTotalPages(data?.totalPages || 1);
            } catch (err) {
                if (err.name !== "AbortError") console.error("Error loading products:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();
        return () => controller.abort();
    }, [
        API_BASE,
        pageNumber,
        pageSize,
        searchText,
        selectedCategories,
        selectedBrands,
        selectedTypes,
        selectedBranches,
        selectedPrices,
        sortBy,
        currentUserId,
    ]);

    // apply favorite + added state
    const productsWithFav = useMemo(() => {
        return products.map((p) => ({
            ...p,
            isFavorite: wishlistIds.has(p.id),
            isAdded: addedIds.has(p.id),
        }));
    }, [products, wishlistIds, addedIds]);

    // filter handlers
    const handleBranchesToggle = (branchId) => {
        setSelectedBranches((prev) =>
            prev.includes(branchId) ? prev.filter((x) => x !== branchId) : [...prev, branchId]
        );
    };

    const handleCategoryToggle = (catId) => {
        setSelectedCategories((prev) => (prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]));
    };

    const handleTypesToggle = (typeId) => {
        setSelectedTypes((prev) => (prev.includes(typeId) ? prev.filter((x) => x !== typeId) : [...prev, typeId]));
    };

    const handleBrandToggle = (supplierId) => {
        setSelectedBrands((prev) => (prev.includes(supplierId) ? prev.filter((x) => x !== supplierId) : [...prev, supplierId]));
    };

    const handlePriceToggle = (key) => {
        setSelectedPrices((prev) => (prev[0] === key ? [] : [key]));
    };

    // =========================================================
    // Wishlist (Heart): confirmation-first (health + medication)
    // =========================================================
    const openFavDialog = (product, inc, step) => {
        setFavDialog({
            show: true,
            product,
            summary: buildFavSummary(inc),
            detailLines: buildFavLines(inc),
            step,
        });
    };

    const closeFavDialog = () => {
        setFavDialog({ show: false, product: null, summary: "", detailLines: [], step: "health" });
    };

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

    // tries to add; if server says 409 medication interaction, open medication modal
    const tryAddWishlist = async (product, forceAdd = false) => {
        const productId = Number(product?.id);
        if (!productId || Number.isNaN(productId)) return;

        const result = await addToWishlistApi(productId, forceAdd);

        if (!result.ok && result.conflict) {
            const inc = result?.data?.incompatibilities ?? { medications: [], allergies: [], illnesses: [] };
            openFavDialog(product, inc, "medication");
            return;
        }

        if (!result.ok) {
            console.error("Wishlist add failed:", result.error);
            return;
        }

        // only AFTER success do we fill heart
        setWishlistIds((prev) => {
            const next = new Set(prev);
            next.add(productId);
            return next;
        });

        refreshWishlistCount?.();
    };

    // used by ProductCard heart click
    const handleToggleFavoriteRequest = async (product) => {
        const productId = Number(product?.id);
        if (!productId || Number.isNaN(productId)) return;

        if (!currentUserId) {
            console.warn("Login required to use wishlist.");
            return;
        }

        const isFavNow = wishlistIds.has(productId);

        // remove: no dialog
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

        // adding: if HEALTH incompatibilities exist (allergy/illness) -> show dialog first
        const healthInc = product?.incompatibilities ?? { medications: [], allergies: [], illnesses: [] };
        const hasHealth =
            (Array.isArray(healthInc.allergies) && healthInc.allergies.length > 0) ||
            (Array.isArray(healthInc.illnesses) && healthInc.illnesses.length > 0);

        if (hasHealth) {
            openFavDialog(product, healthInc, "health");
            return;
        }

        // no health conflicts -> try add immediately (may still 409 from medication)
        await tryAddWishlist(product, false);
    };

    const handleConfirmFav = async () => {
        const product = favDialog.product;
        if (!product) {
            closeFavDialog();
            return;
        }

        if (favDialog.step === "health") {
            // health-confirm means: now actually call server (could still be 409 medication)
            closeFavDialog();
            await tryAddWishlist(product, false);
            return;
        }

        if (favDialog.step === "medication") {
            // medication-confirm means: forceAdd=true
            closeFavDialog();
            await tryAddWishlist(product, true);
        }
    };

    // =========================================================
    // Cart: handle BOTH:
    // 1) health incompatibilities (from ExternalProducts userId)
    // 2) server 409 MEDICATION_INTERACTION (drug-to-drug) requiring confirmation
    // =========================================================

    const addToCartApi = async (productId, qty = 1, forceAdd = false) => {
        const url = `${API_BASE}/api/Cart/${productId}?userId=${currentUserId}&qty=${qty}${forceAdd ? "&forceAdd=true" : ""}`;

        const res = await fetch(url, {
            credentials: "include",
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (res.status === 409) {
            const data = await res.json().catch(() => null);
            return { ok: false, status: 409, data };
        }

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            return { ok: false, status: res.status, error: body || "FAILED" };
        }

        const data = await res.json().catch(() => null);
        return { ok: true, data };
    };

    const performAddToCartSuccessFlow = async (productId) => {
        refreshCartCount?.();
        markAddedBriefly(productId); // ? green Added ONLY here
    };

    const closeMedDialog = () => {
        setMedDialog({ show: false, product: null, incompatibilities: null, messages: [] });
    };

    const handleConfirmMedicationAdd = async () => {
        const product = medDialog.product;
        if (!product?.id) {
            closeMedDialog();
            return;
        }

        const productId = Number(product.id);
        const res = await addToCartApi(productId, 1, true); // forceAdd=true

        if (res.ok) {
            await performAddToCartSuccessFlow(productId);
        } else {
            console.warn("Force add failed:", res?.data?.reason || res?.error || "FAILED");
        }

        closeMedDialog();
    };

    // called for direct add (no health conflicts)
    const handleAddToCart = async (product, forceAdd = false) => {
        if (!product?.id) return;

        if (!currentUserId) {
            console.warn("Login required to add to cart.");
            return;
        }

        const inv = product.inventoryCount ?? 0;
        const status = (product.stockStatus ?? "").toUpperCase();
        if (inv <= 0 || status === "OUT_OF_STOCK") return;

        const productId = Number(product.id);

        const addRes = await addToCartApi(productId, 1, forceAdd);

        if (!addRes.ok) {
            // 409 can be:
            // - OUT_OF_STOCK / EXCEEDS_AVAILABLE_STOCK
            // - MEDICATION_INTERACTION + requiresConfirmation + incompatibilities
            if (addRes.status === 409) {
                const reason = addRes?.data?.reason;

                if (reason === "MEDICATION_INTERACTION" && addRes?.data?.requiresConfirmation) {
                    const inc = addRes?.data?.incompatibilities ?? { medications: [], allergies: [], illnesses: [] };

                    setMedDialog({
                        show: true,
                        product,
                        incompatibilities: inc,
                        messages: buildFavLines(inc), // reuse formatter (shows med message + names)
                    });
                    return;
                }

                // stock conflicts or other conflicts: just log (you can show toast if you want)
                console.warn("Cart conflict:", reason || "CONFLICT", addRes?.data);
                return;
            }

            console.warn("Cart add failed:", addRes.error);
            return;
        }

        await performAddToCartSuccessFlow(productId);
    };

    // request add: show health modal first IF health incompatibilities exist on product DTO
    const handleAddToCartRequest = (product) => {
        if (!product?.id) return;

        if (!currentUserId) {
            console.warn("Login required to add to cart.");
            return;
        }

        const inv = product.inventoryCount ?? 0;
        const status = (product.stockStatus ?? "").toUpperCase();
        if (inv <= 0 || status === "OUT_OF_STOCK") return;

        const incObj = product?.incompatibilities ?? { medications: [], allergies: [], illnesses: [] };

        // HEALTH-based conflicts (allergy/illness) are already on the product list (from ExternalProducts?userId=)
        const healthLines = normalizeToLines({
            medications: [], // only show health at this step
            allergies: incObj.allergies || [],
            illnesses: incObj.illnesses || [],
        });

        if (healthLines.length === 0) {
            // no health conflict -> try add (server may still 409 for medication interaction)
            handleAddToCart(product, false);
            return;
        }

        setPendingProduct(product);
        setInteractionMessages(healthLines);
        setShowInteractionDialog(true);
    };

    const handleCancelAdd = () => {
        setShowInteractionDialog(false);
        setPendingProduct(null);
        setInteractionMessages([]);
    };

    const handleConfirmAdd = async () => {
        if (pendingProduct) {
            // after health-confirm, try add (may open medication modal if 409)
            await handleAddToCart(pendingProduct, false);
        }
        handleCancelAdd();
    };

    const cartHealthCopy = dialogCopy.cartHealthWarning;
    const cartMedCopy = dialogCopy.cartMedicationInteraction;

    const wishlistCopy =
        favDialog.step === "medication"
            ? dialogCopy.wishlistMedicationInteraction
            : dialogCopy.wishlistHealthWarning;


    return (
        <div className="products-page">
            <PageHeader title="Our Products" />

            <div className="products-layout">
                {/* Filter sidebar */}
                <aside className="products-filters">
                    <h3 className="filters-title">Filter By:</h3>

                    {/* Category */}
                    <div className="filter-group">
                        <button type="button" className="filter-group-header" onClick={() => setIsCategoryOpen((open) => !open)}>
                            <span>Category</span>
                            <span>{isCategoryOpen ? "-" : "+"}</span>
                        </button>

                        {isCategoryOpen && (
                            <div className="filter-group-body">
                                <button
                                    type="button"
                                    className={"chip-btn" + (selectedCategories.length === 0 ? " is-active" : "")}
                                    onClick={() => setSelectedCategories([])}
                                >
                                    All
                                </button>

                                <div className="filter-pill-row">
                                    {filterMeta.categories.map((cat) => {
                                        const active = selectedCategories.includes(cat.id);
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                className={"chip-btn" + (active ? " is-active" : "")}
                                                onClick={() => handleCategoryToggle(cat.id)}
                                            >
                                                {cat.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Type */}
                    <div className="filter-group">
                        <button type="button" className="filter-group-header" onClick={() => setIsTypeOpen((open) => !open)}>
                            <span>Type</span>
                            <span>{isTypeOpen ? "-" : "+"}</span>
                        </button>

                        {isTypeOpen && (
                            <div className="filter-group-body">
                                <button
                                    type="button"
                                    className={"chip-btn" + (selectedTypes.length === 0 ? " is-active" : "")}
                                    onClick={() => setSelectedTypes([])}
                                >
                                    All
                                </button>

                                <div className="filter-pill-row">
                                    {filterMeta.types.map((t) => {
                                        const active = selectedTypes.includes(t.id);
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                className={"chip-btn" + (active ? " is-active" : "")}
                                                onClick={() => handleTypesToggle(t.id)}
                                            >
                                                {t.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Branch */}
                    <div className="filter-group">
                        <button type="button" className="filter-group-header" onClick={() => setIsBranchOpen((open) => !open)}>
                            <span>Branch</span>
                            <span>{isBranchOpen ? "-" : "+"}</span>
                        </button>

                        {isBranchOpen && (
                            <div className="filter-group-body">
                                <button
                                    type="button"
                                    className={"chip-btn" + (selectedBranches.length === 0 ? " is-active" : "")}
                                    onClick={() => setSelectedBranches([])}
                                >
                                    All
                                </button>

                                <div className="filter-pill-row">
                                    {(filterMeta.branches ?? []).map((b) => {
                                        const active = selectedBranches.includes(b.id);
                                        return (
                                            <button
                                                key={b.id}
                                                type="button"
                                                className={"chip-btn" + (active ? " is-active" : "")}
                                                onClick={() => handleBranchesToggle(b.id)}
                                            >
                                                {b.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Brand */}
                    <div className="filter-group">
                        <button type="button" className="filter-group-header" onClick={() => setIsBrandOpen((open) => !open)}>
                            <span>Brand</span>
                            <span>{isBrandOpen ? "-" : "+"}</span>
                        </button>

                        {isBrandOpen && (
                            <div className="filter-group-body">
                                <button
                                    type="button"
                                    className={"chip-btn" + (selectedBrands.length === 0 ? " is-active" : "")}
                                    onClick={() => setSelectedBrands([])}
                                >
                                    All
                                </button>

                                <div className="filter-pill-row">
                                    {filterMeta.brands.map((br) => {
                                        const active = selectedBrands.includes(br.id);
                                        return (
                                            <button
                                                key={br.id}
                                                type="button"
                                                className={"chip-btn" + (active ? " is-active" : "")}
                                                onClick={() => handleBrandToggle(br.id)}
                                            >
                                                {br.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div className="filter-group">
                        <button type="button" className="filter-group-header" onClick={() => setIsPriceOpen((open) => !open)}>
                            <span>Price</span>
                            <span>{isPriceOpen ? "-" : "+"}</span>
                        </button>

                        {isPriceOpen && (
                            <div className="filter-group-body">
                                <button
                                    type="button"
                                    className={"chip-btn" + (selectedPrices.length === 0 ? " is-active" : "")}
                                    onClick={() => setSelectedPrices([])}
                                >
                                    All
                                </button>

                                <div className="filter-pill-row">
                                    {PRICE_RANGES.map((rg) => {
                                        const active = selectedPrices.includes(rg.key);
                                        return (
                                            <button
                                                key={rg.key}
                                                type="button"
                                                className={"chip-btn" + (active ? " is-active" : "")}
                                                onClick={() => handlePriceToggle(rg.key)}
                                            >
                                                {rg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sort By */}
                    <div className="filter-group">
                        <button type="button" className="filter-group-header" onClick={() => setIsSortOpen((open) => !open)}>
                            <span>Sort By</span>
                            <span>{isSortOpen ? "-" : "+"}</span>
                        </button>

                        {isSortOpen && (
                            <div className="filter-group-body">
                                <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="name-asc">Name: A-Z</option>
                                    <option value="name-desc">Name: Z-A</option>
                                </select>
                            </div>
                        )}
                    </div>
                </aside>

                {/* search + grid + pagination */}
                <main className="products-content">
                    <div className="products-search-row" style={{ position: "relative" }}>
                        <input
                            type="text"
                            className="products-search-input"
                            placeholder="Search Products by Category, Brand, Name, Type and Branch"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ paddingRight: "42px" }}
                        />

                        <FiSearch
                            className="search-icon"
                            style={{
                                position: "absolute",
                                right: "14px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#888",
                                fontSize: "18px",
                                pointerEvents: "none",
                            }}
                        />
                    </div>

                    {wishlistLoading && currentUserId && (
                        <small className="text-muted d-block mb-2">Loading wishlist...</small>
                    )}

                    {isLoading && <p className="loading-msg">Loading products...</p>}

                    <div className="products-grid">
                        {!isLoading && productsWithFav.length === 0 ? (
                            <p className="no-products-msg">No products match your filters.</p>
                        ) : (
                            productsWithFav.map((p) => {
                                const lines = normalizeToLines(p.incompatibilities);

                                return (
                                    <ProductCard
                                        key={p.id}
                                        id={p.id}
                                        name={p.name}
                                        price={p.price}
                                        imageUrl={p.imageUrl}
                                        isFavorite={p.isFavorite}
                                        isAdded={p.isAdded}
                                        categoryName={p.categoryName}
                                        productType={p.productType}
                                        onToggleFavorite={() => handleToggleFavoriteRequest(p)}
                                        onAddToCart={() => handleAddToCartRequest(p)}
                                        isPrescribed={p.requiresPrescription}
                                        hasIncompatibilities={lines.length > 0}
                                        incompatibilityLines={lines}
                                        inventoryCount={p.inventoryCount}
                                        stockStatus={p.stockStatus}
                                    />
                                );
                            })
                        )}
                    </div>

                    <div className="products-pagination mt-4">
                        <Pagination currentPage={pageNumber} totalPages={totalPages} onPageChange={(page) => setPageNumber(page)} />
                    </div>
                </main>
            </div>

            {/* HEALTH-based modal (allergy/illness) */}
            <DialogModal
                show={showInteractionDialog}
                title={cartHealthCopy.title}
                body={
                    <div>
                        <p className="fw-bold">
                            {cartHealthCopy.introPrefix} <strong>{pendingProduct?.name}</strong>
                            {cartHealthCopy.introSuffix}
                        </p>

                        {interactionMessages.length > 0 && (
                            <ul>
                                {interactionMessages.map((msg, idx) => (
                                    <li key={idx}>{msg}</li>
                                ))}
                            </ul>
                        )}

                        <p className="mb-0">{cartHealthCopy.question}</p>
                    </div>
                }
                confirmLabel={cartHealthCopy.confirm}
                cancelLabel={cartHealthCopy.cancel}
                onConfirm={handleConfirmAdd}
                onCancel={handleCancelAdd}
            />


            {/* SERVER medication-interaction modal (409 MEDICATION_INTERACTION) */}
            <DialogModal
                show={medDialog.show}
                title={cartMedCopy.title}
                body={
                    <div>
                        <p className="fw-bold mb-2">
                            {cartMedCopy.introPrefix} <strong>{medDialog.product?.name}</strong>
                            {cartMedCopy.introSuffix}
                        </p>

                        {medDialog.messages?.length > 0 && (
                            <ul className="mb-0">
                                {medDialog.messages.map((m, idx) => (
                                    <li key={idx}>{m}</li>
                                ))}
                            </ul>
                        )}

                        <p className="mt-3 mb-0">{cartMedCopy.question}</p>
                    </div>
                }
                confirmLabel={cartMedCopy.confirm}
                cancelLabel={cartMedCopy.cancel}
                onConfirm={handleConfirmMedicationAdd}
                onCancel={closeMedDialog}
            />


            {/* Wishlist confirmation modal (health first, then server medication conflict) */}
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

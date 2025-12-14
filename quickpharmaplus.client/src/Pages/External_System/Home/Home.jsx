// src/Pages/External_System/HomeExternal.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import HomeSlider from "./HomeSlider";
import CategoriesRow from "./CategoriesRow";
import "./Home.css";
import ProductRowSection from "../Shared_Components/ProductRowSection";
import DialogModal from "../../../Components/InternalSystem/Modals/ConfirmModal";
import { AuthContext } from "../../../Context/AuthContext";
import { WishlistContext } from "../../../Context/WishlistContext";
import { CartContext } from "../../../Context/CartContext"; // ? add this

// ==============================
// TEMP mock Best Sellers (keep for now)
// ==============================
const mockBestSellers = [
    {
        id: 101,
        name: "Vitamin C 1000mg",
        price: 3.5,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: false,
        incompatibilities: [],
        categoryName: "Vitamins",
        productType: "Tablets",
        inventoryCount: 999, // mock ok
        stockStatus: "IN_STOCK",
    },
    {
        id: 102,
        name: "Paracetamol 500mg",
        price: 1.2,
        imageUrl: null,
        isFavorite: true,
        requiresPrescription: false,
        incompatibilities: [],
        categoryName: "Pain Relief",
        productType: "Tablets",
        inventoryCount: 0, // ? example: out of stock mock
        stockStatus: "OUT_OF_STOCK",
    },
];

// map API dto -> ProductRowSection card shape
const mapApiToCard = (dto, API_BASE) => {
    const inv = dto?.inventoryCount ?? dto?.InventoryCount ?? 0;
    const stockStatus =
        dto?.stockStatus ??
        dto?.StockStatus ??
        (inv <= 0 ? "OUT_OF_STOCK" : inv <= 5 ? "LOW_STOCK" : "IN_STOCK");

    return {
        id: dto.id,
        name: dto.name,
        price: dto.price ?? 0,
        imageUrl: dto.id ? `${API_BASE}/api/ExternalProducts/${dto.id}/image` : null,
        isFavorite: false,
        requiresPrescription: dto.requiresPrescription ?? false,
        incompatibilities: dto.incompatibilities ?? [],
        categoryName: dto.categoryName ?? "",
        productType: dto.productTypeName ?? "",

        // ? needed for disabling button
        inventoryCount: inv,
        stockStatus,
        canAddToCart: inv > 0 && stockStatus !== "OUT_OF_STOCK",
    };
};

export default function HomeExternal() {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { refreshWishlistCount } = useContext(WishlistContext);
    const { refreshCartCount } = useContext(CartContext); // ?

    // get current user (we need userId for wishlist/cart endpoints)
    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    // incompatibility dialog state
    const [pendingProduct, setPendingProduct] = useState(null);
    const [interactionMessages, setInteractionMessages] = useState([]);
    const [showInteractionDialog, setShowInteractionDialog] = useState(false);

    // ? categories from API only (no mock fallback)
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // newest products from API
    const [newProducts, setNewProducts] = useState([]);
    const [loadingNew, setLoadingNew] = useState(false);
    const [newError, setNewError] = useState("");

    // wishlist ids (used to render heart state)
    const [wishlistIds, setWishlistIds] = useState(() => new Set());
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // =========================
    // Load wishlist IDs (for hearts)
    // GET: /api/Wishlist/ids?userId=5
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

    // =========================
    // Load categories (API)
    // GET: /api/Category?pageNumber=1&pageSize=200
    // =========================
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
                    setCategories([]); // ? no fallback
                    return;
                }

                const data = await res.json();
                const items = data.items ?? [];

                const mapped = items
                    .map((c) => ({
                        id: c.categoryId ?? c.CategoryId ?? null,
                        name: c.categoryName ?? c.CategoryName ?? "—",
                        iconUrl: null,
                    }))
                    .filter((c) => c.id != null);

                setCategories(mapped);
            } catch (e) {
                if (e.name !== "AbortError") console.error("Failed to load categories:", e);
                setCategories([]); // ? no fallback
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
        return () => controller.abort();
    }, [API_BASE]);

    // =========================
    // Load newest 10 products:
    // =========================
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

    // =========================
    // Add to cart (real backend)
    // POST /api/Cart/{productId}?userId=5&qty=1
    // =========================
    const actuallyAddToCart = async (product) => {
        if (!product?.id) return;

        if (!currentUserId) {
            console.warn("Login required to add to cart.");
            return;
        }

        // ? block immediately if out of stock
        const inv = product.inventoryCount ?? 0;
        const status = product.stockStatus ?? "";
        if (inv <= 0 || status === "OUT_OF_STOCK" || product.canAddToCart === false) {
            console.warn("Out of stock. Add to cart blocked.");
            return;
        }

        try {
            const url = `${API_BASE}/api/Cart/${product.id}?userId=${currentUserId}&qty=1`;

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            // 409 when out of stock / exceeds stock
            if (res.status === 409) {
                const data = await res.json().catch(() => null);
                console.warn("Cart conflict:", data?.reason || "OUT_OF_STOCK");
                return;
            }

            if (!res.ok) throw new Error("Cart add failed");

            // update navbar count
            refreshCartCount?.();
        } catch (e) {
            console.error("Failed to add to cart:", e);
        }
    };

    // Called from ProductRowSection / ProductCard
    const handleAddToCartRequest = (product) => {
        // ? if no stock, do nothing (button will be disabled anyway)
        const inv = product?.inventoryCount ?? 0;
        const status = product?.stockStatus ?? "";
        if (inv <= 0 || status === "OUT_OF_STOCK" || product?.canAddToCart === false) {
            return;
        }

        const inc = product?.incompatibilities || [];
        const hasIncompatibility = Array.isArray(inc) && inc.length > 0;

        if (!hasIncompatibility) {
            actuallyAddToCart(product);
            return;
        }

        setPendingProduct(product);
        setInteractionMessages(inc);
        setShowInteractionDialog(true);
    };

    const handleCancelAdd = () => {
        setShowInteractionDialog(false);
        setPendingProduct(null);
        setInteractionMessages([]);
    };

    const handleConfirmAdd = () => {
        if (pendingProduct) {
            actuallyAddToCart(pendingProduct);
        }
        handleCancelAdd();
    };

    // Heart click: call POST (add) or DELETE (remove)
    const handleToggleFavorite = async (product) => {
        if (!product?.id) return;

        if (!currentUserId) {
            console.warn("No userId found. Login required to use wishlist.");
            return;
        }

        const isFav = wishlistIds.has(product.id);

        try {
            const url = `${API_BASE}/api/Wishlist/${product.id}?userId=${currentUserId}`;

            const res = await fetch(url, {
                method: isFav ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Wishlist request failed");

            setWishlistIds((prev) => {
                const next = new Set(prev);
                if (isFav) next.delete(product.id);
                else next.add(product.id);
                return next;
            });

            refreshWishlistCount?.();
        } catch (e) {
            console.error("Failed to toggle wishlist:", e);
        }
    };

    // =========================
    // Derived arrays with isFavorite computed from wishlistIds
    // + ? add canAddToCart for mock best sellers too
    // =========================
    const bestSellersWithFav = useMemo(() => {
        return mockBestSellers.map((p) => {
            const inv = p.inventoryCount ?? 0;
            const status =
                p.stockStatus ?? (inv <= 0 ? "OUT_OF_STOCK" : inv <= 5 ? "LOW_STOCK" : "IN_STOCK");

            return {
                ...p,
                stockStatus: status,
                canAddToCart: inv > 0 && status !== "OUT_OF_STOCK",
                isFavorite: wishlistIds.has(p.id),
            };
        });
    }, [wishlistIds]);

    const newProductsWithFav = useMemo(() => {
        return newProducts.map((p) => ({
            ...p,
            isFavorite: wishlistIds.has(p.id),
        }));
    }, [newProducts, wishlistIds]);

    return (
        <div className="home-external">
            {/* Hero slider */}
            <HomeSlider />

            {/* Categories (API only) */}
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

            {/* Best Seller section (mock for now) */}
            <ProductRowSection
                title="Best Seller"
                products={bestSellersWithFav}
                highlight
                onAddToCart={handleAddToCartRequest}
                onToggleFavorite={handleToggleFavorite}
            />

            {/* New Products section (API) */}
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

            {/* Interaction warning dialog */}
            <DialogModal
                show={showInteractionDialog}
                title="Possible Incompatibility"
                body={
                    <div>
                        <p>
                            <strong>{pendingProduct?.name}</strong> may be incompatible with your health profile
                            (medications, allergies, or illnesses).
                        </p>

                        {interactionMessages.length > 0 && (
                            <ul>
                                {interactionMessages.map((msg, idx) => (
                                    <li key={idx}>{msg}</li>
                                ))}
                            </ul>
                        )}

                        <p>Do you still want to add this product to your cart?</p>
                    </div>
                }
                confirmLabel="Proceed and Add"
                cancelLabel="Cancel"
                onConfirm={handleConfirmAdd}
                onCancel={handleCancelAdd}
            />
        </div>
    );
}

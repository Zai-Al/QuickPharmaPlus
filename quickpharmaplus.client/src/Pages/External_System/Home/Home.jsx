// src/Pages/External_System/HomeExternal.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import HomeSlider from "./HomeSlider";
import CategoriesRow from "./CategoriesRow";
import "./Home.css";
import ProductRowSection from "../Shared_Components/ProductRowSection";
import DialogModal from "../../../Components/InternalSystem/Modals/ConfirmModal";
import { AuthContext } from "../../../Context/AuthContext";

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
    },
    {
        id: 103,
        name: "Blood Pressure Tabs",
        price: 7.8,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing blood pressure medication."],
        categoryName: "Heart & BP",
        productType: "Tablets",
    },
    {
        id: 104,
        name: "Blood Pressure Tabs",
        price: 7.8,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing blood pressure medication."],
        categoryName: "Heart & BP",
        productType: "Tablets",
    },
];

// fallback categories if API fails (optional)
const mockCategoriesFallback = [
    { id: 1, name: "Cold & Flu", iconUrl: null },
    { id: 2, name: "Vitamins", iconUrl: null },
    { id: 3, name: "Skin Care", iconUrl: null },
    { id: 4, name: "Pain Relief", iconUrl: null },
    { id: 5, name: "Baby Care", iconUrl: null },
];

// map API dto -> ProductRowSection card shape
const mapApiToCard = (dto, API_BASE) => ({
    id: dto.id,
    name: dto.name,
    price: dto.price ?? 0,
    imageUrl: dto.id ? `${API_BASE}/api/ExternalProducts/${dto.id}/image` : null,
    isFavorite: false,
    requiresPrescription: dto.requiresPrescription ?? false,
    incompatibilities: dto.incompatibilities ?? [],
    categoryName: dto.categoryName ?? "",
    productType: dto.productTypeName ?? "",
});

export default function HomeExternal() {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    // ? get current user (we need userId for wishlist endpoints: ?userId=)
    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null; // adapt if needed

    // cart + incompatibility dialog state
    const [_cartItems, setCartItems] = useState([]);
    const [pendingProduct, setPendingProduct] = useState(null);
    const [interactionMessages, setInteractionMessages] = useState([]);
    const [showInteractionDialog, setShowInteractionDialog] = useState(false);

    // ? categories from API
    const [categories, setCategories] = useState(mockCategoriesFallback);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // ? newest products from API
    const [newProducts, setNewProducts] = useState([]);
    const [loadingNew, setLoadingNew] = useState(false);
    const [newError, setNewError] = useState("");

    // ? wishlist ids (used to render heart state)
    const [wishlistIds, setWishlistIds] = useState(() => new Set());
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // =========================
    // Load wishlist IDs (for hearts)
    // GET: /api/Wishlist/ids?userId=5
    // =========================
    useEffect(() => {
        // if not logged in yet, keep empty
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
                    // if you later secure endpoints with cookies:
                    // credentials: "include",
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
    // Load categories (same style as Product.jsx)
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

                if (!res.ok) return;

                const data = await res.json();
                const items = data.items ?? [];

                // map to CategoriesRow shape
                const mapped = items
                    .map((c) => ({
                        id: c.categoryId ?? c.CategoryId ?? null,
                        name: c.categoryName ?? c.CategoryName ?? "—",
                        iconUrl: null,
                    }))
                    .filter((c) => c.id != null);

                if (mapped.length > 0) setCategories(mapped);
            } catch (e) {
                if (e.name !== "AbortError") console.error("Failed to load categories:", e);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchCategories();
        return () => controller.abort();
    }, [API_BASE]);

    // =========================
    // Load newest 10 products:
    // - fetch a page (100)
    // - sort by id DESC
    // - take first 10
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
    // Derived arrays with isFavorite computed from wishlistIds
    // =========================
    const bestSellersWithFav = useMemo(() => {
        return mockBestSellers.map((p) => ({
            ...p,
            isFavorite: wishlistIds.has(p.id),
        }));
    }, [wishlistIds]);

    const newProductsWithFav = useMemo(() => {
        return newProducts.map((p) => ({
            ...p,
            isFavorite: wishlistIds.has(p.id),
        }));
    }, [newProducts, wishlistIds]);

    const actuallyAddToCart = (product) => {
        setCartItems((prev) => [...prev, product]);
        console.log("Added to cart:", product.name);
    };

    // Called from ProductRowSection / ProductCard
    const handleAddToCartRequest = (product) => {
        const inc = product.incompatibilities || [];
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
            console.log("Proceeding to add despite incompatibility:", pendingProduct.name);
            actuallyAddToCart(pendingProduct);
        }
        handleCancelAdd();
    };

    // ? Heart click: call POST (add) or DELETE (remove)
    // Controller endpoints:
    // POST   /api/Wishlist/{productId}?userId=5
    // DELETE /api/Wishlist/{productId}?userId=5
    const handleToggleFavorite = async (product) => {
        if (!product?.id) return;

        // if no user yet, just block (or show login dialog later)
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
                // if you later secure endpoints with cookies:
                // credentials: "include",
            });

            if (!res.ok) throw new Error("Wishlist request failed");

            // update local set immediately (fast UI)
            setWishlistIds((prev) => {
                const next = new Set(prev);
                if (isFav) next.delete(product.id);
                else next.add(product.id);
                return next;
            });
        } catch (e) {
            console.error("Failed to toggle wishlist:", e);
        }
    };

    return (
        <div className="home-external">
            {/* Hero slider */}
            <HomeSlider />

            {/* Categories (API) */}
            <CategoriesRow categories={categories} />

            {/* Optional: tiny loading text */}
            {loadingCategories && (
                <div className="container mt-2">
                    <small className="text-muted">Loading categories...</small>
                </div>
            )}

            {/* Optional: wishlist ids loading (tiny) */}
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

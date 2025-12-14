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

// ---------- helper to build messages like in Home / WishList ----------
const buildInteractionMessages = (inc) => {
    if (!inc) return [];
    if (Array.isArray(inc)) return inc;

    const msgs = [];
    if (inc.medications && inc.medications.length > 0) {
        msgs.push("This medication may interact with other medications you are taking.");
    }
    if (inc.allergies && inc.allergies.length > 0) {
        msgs.push("This product may not be suitable due to your allergies.");
    }
    if (inc.illnesses && inc.illnesses.length > 0) {
        msgs.push("This product may be incompatible with your recorded illnesses.");
    }
    return msgs;
};

const mockCheckInteractions = (_currentCart, productToAdd) => {
    const inc = productToAdd?.incompatibilities;
    return buildInteractionMessages(inc);
};

// map API list item -> ProductRowSection card shape (IMPORTANT: include stock fields)
const mapListItemToCard = (dto, API_BASE) => ({
    id: dto.id,
    name: dto.name,
    price: dto.price ?? 0,
    imageUrl: dto.id ? `${API_BASE}/api/ExternalProducts/${dto.id}/image` : null,
    isFavorite: false,
    requiresPrescription: dto.requiresPrescription ?? false,
    incompatibilities: dto.incompatibilities ?? [],
    categoryName: dto.categoryName ?? "",
    productType: dto.productTypeName ?? "",

    
    inventoryCount: dto.inventoryCount ?? 0,
    stockStatus:
        dto.stockStatus ??
        ((dto.inventoryCount ?? 0) <= 0 ? "OUT_OF_STOCK" : "IN_STOCK"),
});

export default function ProductDetails() {
    const { id } = useParams();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { refreshWishlistCount } = useContext(WishlistContext);
    const { refreshCartCount } = useContext(CartContext);

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    
    const [isAdded, setIsAdded] = useState(false);
    const addedTimerRef = useRef(null);

    const flashAdded = () => {
        setIsAdded(true);
        if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
        addedTimerRef.current = setTimeout(() => {
            setIsAdded(false);
            setQuantity(1); 
        }, 1400);
    };

    useEffect(() => {
        return () => {
            if (addedTimerRef.current) clearTimeout(addedTimerRef.current);
        };
    }, []);

    // ? wishlist ids (for hearts everywhere)
    const [wishlistIds, setWishlistIds] = useState(() => new Set());
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // ? limit quantity to highest stock in a single city row
    const [maxQty, setMaxQty] = useState(0);

    // product state from API
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [quantity, setQuantity] = useState(1);

    // local cart mock (kept for interaction logic — you can later replace with real cart fetch)
    const [cartItems, setCartItems] = useState([]);

    // dialogs
    const [pendingItem, setPendingItem] = useState(null);
    const [interactionMessages, setInteractionMessages] = useState([]);
    const [showInteractionDialog, setShowInteractionDialog] = useState(false);

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
    // Load wishlist IDs (for hearts)
    // GET: /api/Wishlist/ids?userId=37
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
    // helper: compute maxQty from availability items
    // ----------------------------
    const computeAndSetMaxQtyFromItems = (items) => {
        const highestStock =
            items && items.length > 0 ? Math.max(...items.map((b) => b.stock ?? 0)) : 0;

        setMaxQty(highestStock);

        setQuantity((q) => {
            if (highestStock <= 0) return 1;
            if (q < 1) return 1;
            if (q > highestStock) return highestStock;
            return q;
        });
    };

    // preload branchesCount + maxQty
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
    // GET: /api/ExternalProducts/{id}
    // ==============================
    useEffect(() => {
        let cancelled = false;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                setLoadError("");

                const res = await fetch(`${API_BASE}/api/ExternalProducts/${id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Product not found.");
                    throw new Error("Failed to load product.");
                }

                const data = await res.json();

                const imageUrl = data.productImageBase64
                    ? `data:image/jpeg;base64,${data.productImageBase64}`
                    : null;

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
                    incompatibilities: data.incompatibilities ?? null,
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
    }, [id, API_BASE]);

    // ? is main product currently in wishlist?
    const mainIsFavorite = !!product?.id && wishlistIds.has(product.id);

    // ==============================
    // Load Similar + Brand products (limit 10)
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
    }, [product?.id, product?.productTypeId, product?.supplierId, API_BASE]);

    // ? apply favorite state from wishlistIds into carousels
    const similarWithFav = useMemo(
        () => similarProducts.map((p) => ({ ...p, isFavorite: wishlistIds.has(p.id) })),
        [similarProducts, wishlistIds]
    );

    const brandWithFav = useMemo(
        () => brandProducts.map((p) => ({ ...p, isFavorite: wishlistIds.has(p.id) })),
        [brandProducts, wishlistIds]
    );

    // ==============================
    // Quantity logic (limit by maxQty)
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

    // ==============================
    // REAL add-to-cart API
    // POST: /api/Cart/{productId}?userId=...&qty=...
    // ==============================
    const addToCartApi = async (prod, qty) => {
        if (!currentUserId) {
            console.warn("Login required to use cart.");
            return false;
        }
        if (!prod?.id) return false;

        // hard guard: out of stock
        const outOfStock =
            prod.stockStatus === "OUT_OF_STOCK" || (prod.id === product?.id && maxQty <= 0);

        if (outOfStock) return false;

        const safeQty = Math.max(1, Number(qty || 1));

        try {
            const url = `${API_BASE}/api/Cart/${prod.id}?userId=${currentUserId}&qty=${safeQty}`;

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (res.status === 409) {
                const data = await res.json().catch(() => null);
                console.warn("Cart conflict:", data?.reason || "OUT_OF_STOCK");
                return false;
            }

            if (!res.ok) {
                const body = await res.text();
                console.error("Add to cart failed:", res.status, body);
                return false;
            }

            refreshCartCount?.();
            return true;
        } catch (e) {
            console.error("Failed to add to cart:", e);
            return false;
        }
    };

    // (optional) still keep local cart list for incompatibility mock
    const addToLocalCartForMock = (prod, qty) => {
        setCartItems((prev) => [...prev, { ...prod, quantity: qty }]);
    };

    const handleAddToCartClick = async () => {
        if (!product) return;
        if (maxQty <= 0) return;

        const safeQty = Math.min(Math.max(quantity, 1), maxQty);
        const messages = mockCheckInteractions(cartItems, product);

        if (messages.length === 0) {
            const ok = await addToCartApi(product, safeQty);
            if (ok) {
                addToLocalCartForMock(product, safeQty);
                flashAdded(); 
            }
            return;
        }

        setPendingItem({ product, quantity: safeQty });
        setInteractionMessages(messages);
        setShowInteractionDialog(true);
    };

    const handleCarouselAddToCart = async (p) => {
        const outOfStock =
            p?.stockStatus === "OUT_OF_STOCK" ||
            (typeof p?.inventoryCount === "number" && p.inventoryCount <= 0);

        if (outOfStock) return;

        const messages = mockCheckInteractions(cartItems, p);

        if (messages.length === 0) {
            const ok = await addToCartApi(p, 1);
            if (ok) addToLocalCartForMock(p, 1);
            return;
        }

        setPendingItem({ product: p, quantity: 1 });
        setInteractionMessages(messages);
        setShowInteractionDialog(true);
    };

    // ? ROBUST wishlist toggle:
    // supports: onToggleFavorite(productObj) OR onToggleFavorite(id, isFavorite)
    const handleToggleFavorite = async (arg1, arg2) => {
        if (!currentUserId) {
            console.warn("Login required to use wishlist.");
            return;
        }

        const productId =
            typeof arg1 === "object" && arg1 !== null ? (arg1.id ?? arg1.productId) : arg1;

        if (!productId) return;

        const isFav = typeof arg2 === "boolean" ? arg2 : wishlistIds.has(Number(productId));

        try {
            const url = `${API_BASE}/api/Wishlist/${productId}?userId=${currentUserId}`;

            const res = await fetch(url, {
                method: isFav ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                const body = await res.text();
                console.error("Wishlist request failed:", res.status, body);
                return;
            }

            setWishlistIds((prev) => {
                const next = new Set(prev);
                if (isFav) next.delete(Number(productId));
                else next.add(Number(productId));
                return next;
            });

            refreshWishlistCount();
        } catch (e) {
            console.error("Failed to toggle wishlist:", e);
        }
    };

    const handleMainToggleFavorite = () => {
        if (!product?.id) return;
        handleToggleFavorite(product.id, mainIsFavorite);
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

    const handleCancelAdd = () => {
        setShowInteractionDialog(false);
        setPendingItem(null);
        setInteractionMessages([]);
    };

    const handleConfirmAdd = async () => {
        if (pendingItem) {
            const ok = await addToCartApi(pendingItem.product, pendingItem.quantity);
            if (ok) {
                addToLocalCartForMock(pendingItem.product, pendingItem.quantity);
                // if the dialog was for the MAIN product, show Added on the main button too
                if (pendingItem.product?.id === product?.id) flashAdded();
            }
        }
        handleCancelAdd();
    };

    return (
        <div className="min-vh-100">
            <PageHeader title="Product Details" />

            <div className="container list-padding py-4 product-details-page">
                {wishlistLoading && currentUserId && (
                    <small className="text-muted d-block mb-2">Loading wishlist...</small>
                )}

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
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="product-main-image"
                                        />
                                    ) : (
                                        <div className="product-main-image-placeholder">
                                            <span>No image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-md-7">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        {product.isPrescribed && (
                                            <span className="product-pill product-pill-prescribed">
                                                Prescribed
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="btn p-0 border-0 bg-transparent product-fav-btn"
                                        onClick={handleMainToggleFavorite}
                                        aria-label="Toggle wishlist"
                                    >
                                        <img
                                            src={mainIsFavorite ? HeartFilled : Heart}
                                            alt="Favorite"
                                            className="product-fav-icon"
                                        />
                                    </button>
                                </div>

                                <h3 className="product-title mb-1">{product.name}</h3>

                                <p className="mb-2 text-muted">
                                    {product.categoryName}
                                    {product.productType ? `, ${product.productType}` : ""}
                                </p>

                                <p className="product-price mb-3">
                                    {formatCurrency(product.price || 0, "BHD")}
                                </p>

                                <div className="mb-2">
                                    <span className="fw-bold">Availability: </span>
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 product-branches-link"
                                        onClick={handleAvailability}
                                    >
                                        Available at {product.branchesCount} branches
                                    </button>
                                </div>

                                <div className="mb-3">
                                    <StockStatus status={product.stockStatus} />
                                </div>

                                {/* Quantity + Add to Cart */}
                                <div className="d-flex align-items-center gap-3 mb-2">
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
                                        disabled={maxQty <= 0} // ? disabled only when out of stock
                                        title={maxQty <= 0 ? "Out of stock in all branches" : "Add to cart"}
                                    >
                                        {maxQty <= 0 ? "Out of Stock" : isAdded ? "Added" : "Add to Cart"}
                                    </button>
                                </div>

                                <div className="text-muted small">
                                    {maxQty <= 0 ? "Out of stock in all branches" : null}
                                </div>
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
                                onToggleFavorite={handleToggleFavorite}
                            />
                        </div>

                        {/* Brand products */}
                        <div className="mt-4">
                            <ProductRowSection
                                title={loadingBrand ? "Other Products by Brand (Loading...)" : "Other Products by Brand"}
                                products={brandWithFav}
                                onAddToCart={handleCarouselAddToCart}
                                onToggleFavorite={handleToggleFavorite}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Branch availability dialog */}
            <DialogModal
                show={showAvailabilityDialog}
                title="Branch Availability"
                body={
                    <div>
                        <p className="mb-3">
                            Stock availability for <strong>{product?.name}</strong> by branch:
                        </p>

                        {availabilityError && (
                            <div className="alert alert-danger py-2">{availabilityError}</div>
                        )}

                        <div className="table-responsive">
                            <table className="table align-middle text-center mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>City</th>
                                        <th>Stock Available</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loadingAvailability ? (
                                        <tr>
                                            <td colSpan="2" className="text-muted py-4">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : branchAvailability.length === 0 ? (
                                        <tr>
                                            <td colSpan="2" className="text-muted py-4">
                                                No branches found.
                                            </td>
                                        </tr>
                                    ) : (
                                        branchAvailability.map((b, idx) => (
                                            <tr key={idx}>
                                                <td>{b.cityName}</td>
                                                <td>
                                                    {b.stock > 0 ? (
                                                        <span className="fw-semibold">{b.stock} units</span>
                                                    ) : (
                                                        <span className="text-danger fw-semibold">Out of stock</span>
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
                confirmLabel="Close"
                cancelLabel="Cancel"
                onConfirm={() => setShowAvailabilityDialog(false)}
                onCancel={() => setShowAvailabilityDialog(false)}
            />

            {/* Interaction warning dialog */}
            <DialogModal
                show={showInteractionDialog}
                title="Medication Interaction Warning"
                body={
                    <div>
                        <p className="fw-bold">
                            We found possible interactions when adding{" "}
                            <strong>{pendingItem?.product?.name}</strong>:
                        </p>
                        <ul>
                            {interactionMessages.map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                            ))}
                        </ul>
                        <p className="mb-0">Do you still want to add this product to your cart?</p>
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

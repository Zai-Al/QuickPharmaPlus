// src/Pages/External_System/Product.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import ProductCard from "../Shared_Components/ProductCard";
import PageHeader from "../Shared_Components/PageHeader";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import "./ProductPage.css";
import { AuthContext } from "../../../Context/AuthContext.jsx";
import { FiSearch} from "react-icons/fi";

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


export default function Product() {
    const location = useLocation();

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

    // pagination + data from backend
    const [products, setProducts] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const pageSize = 12;
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // ? wishlist ids (for hearts)
    const [wishlistIds, setWishlistIds] = useState(() => new Set());
    const [wishlistLoading, setWishlistLoading] = useState(false);

    // filter metadata
    const [filterMeta, setFilterMeta] = useState({
        categories: [],
        brands: [],
        types: [],
        branches: [],
    });

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

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
                    // credentials: "include", // later if you secure endpoints
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

    // =========================
    // fetch filter metadata (categories/types/brands/branches)
    // =========================
    useEffect(() => {
        const controller = new AbortController();

        async function fetchCategoriesForFilter() {
            try {
                const res = await fetch(`${API_BASE}/api/Category?pageNumber=1&pageSize=200`, {
                    signal: controller.signal,
                });
                if (!res.ok) return;

                const data = await res.json();
                const items = data.items ?? [];

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

                const data = await res.json();
                const items = data.items ?? [];

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

                const data = await res.json();
                const items = data.items ?? [];

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

                const data = await res.json();
                const items = data.items ?? [];

                setFilterMeta((prev) => ({
                    ...prev,
                    branches: items.map((b) => {
                        const id = b.branchId ?? b.BranchId ?? null;
                        const city = b.cityName ?? b.CityName ?? "";
                        return {
                            id,
                            name: city ? `Branch #${id} - ${city}` : `Branch #${id}`,
                        };
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
                    const body = await response.text();
                    console.error("Failed to load products:", response.status, body);
                    setProducts([]);
                    setTotalPages(1);
                    return;
                }

                const data = await response.json();

                const mapped = (data.items || []).map((dto) => ({
                    id: dto.id,
                    name: dto.name,

                    categoryId: dto.categoryId,
                    categoryName: dto.categoryName,

                    productTypeId: dto.productTypeId ?? null,
                    productType: dto.productTypeName,

                    price: dto.price ?? 0,

                    supplierId: dto.supplierId ?? null,
                    brand: dto.supplierName || "Unknown",

                    branch: "All Branches",

                    requiresPrescription: dto.requiresPrescription,
                    incompatibilities: [],

                    imageUrl: dto.id ? `${API_BASE}/api/ExternalProducts/${dto.id}/image` : null,
                }));

                setProducts(mapped);
                setTotalPages(data.totalPages || 1);
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
    ]);

    // ? apply favorite state from wishlistIds
    const productsWithFav = useMemo(() => {
        return products.map((p) => ({
            ...p,
            isFavorite: wishlistIds.has(p.id),
        }));
    }, [products, wishlistIds]);

    // filter handlers
    function handleBranchesToggle(branchId) {
        setSelectedBranches((prev) =>
            prev.includes(branchId) ? prev.filter((x) => x !== branchId) : [...prev, branchId]
        );
    }

    const handleCategoryToggle = (catId) => {
        setSelectedCategories((prev) =>
            prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
        );
    };

    const handleTypesToggle = (typeId) => {
        setSelectedTypes((prev) =>
            prev.includes(typeId) ? prev.filter((x) => x !== typeId) : [...prev, typeId]
        );
    };

    const handleBrandToggle = (supplierId) => {
        setSelectedBrands((prev) =>
            prev.includes(supplierId) ? prev.filter((x) => x !== supplierId) : [...prev, supplierId]
        );
    };

    const handlePriceToggle = (key) => {
        setSelectedPrices((prev) => (prev[0] === key ? [] : [key]));
    };

    const handleToggleFavorite = async (id /*, isFavoriteFromCard */) => {
        const productId = Number(id);
        if (!productId || Number.isNaN(productId)) return;

        if (!currentUserId) {
            console.warn("No userId found. Login required to use wishlist.");
            return;
        }

        const isFavNow = wishlistIds.has(productId);

        console.log("TOGGLE WISHLIST:", {
            productId,
            currentUserId,
            isFavNow,
        });

        try {
            const url = `${API_BASE}/api/Wishlist/${productId}?userId=${currentUserId}`;

            const res = await fetch(url, {
                method: isFavNow ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                const body = await res.text();
                console.error("Wishlist request failed:", res.status, body);
                return;
            }

            // update local state immediately
            setWishlistIds((prev) => {
                const next = new Set(prev);
                if (isFavNow) next.delete(productId);
                else next.add(productId);
                return next;
            });
        } catch (e) {
            console.error("Failed to toggle wishlist:", e);
        }
    };


    const handleAddToCart = (id) => {
        console.log("Add to cart", id);
    };

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
                            style={{ paddingRight: "42px" }} // makes room for icon
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
                                pointerEvents: "none", // so clicks go to input
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
                            productsWithFav.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    id={p.id}
                                    name={p.name}
                                    price={p.price}
                                    imageUrl={p.imageUrl}
                                    isFavorite={p.isFavorite}
                                    categoryName={p.categoryName}
                                    productType={p.productType}
                                    onToggleFavorite={handleToggleFavorite}
                                    onAddToCart={() => handleAddToCart(p.id)}
                                    isPrescribed={p.requiresPrescription}
                                    hasIncompatibilities={p.incompatibilities && p.incompatibilities.length > 0}
                                    incompatibilityLines={p.incompatibilities}
                                />
                            ))
                        )}
                    </div>

                    <div className="products-pagination mt-4">
                        <Pagination
                            currentPage={pageNumber}
                            totalPages={totalPages}
                            onPageChange={(page) => setPageNumber(page)}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}

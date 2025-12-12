// src/Pages/External_System/Product.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ProductCard from "../Shared_Components/ProductCard";
import PageHeader from "../Shared_Components/PageHeader";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import "./ProductPage.css";

// The only static thing: price ranges
const PRICE_RANGES = [
    "1BHD - 5BHD",
    "6BHD - 10BHD",
    "11BHD - 15BHD",
    "16BHD - 20BHD",
    "21BHD - 25BHD",
    "26BHD - 30BHD",
];

// Branch filters will stay static for now (until we wire real branch data)
const BRANCHES = ["Sitra", "Budaiya", "Bilad", "Salmanya"];

export default function Product() {
    const location = useLocation();

    // ---- filters / search state ----------------------
    const [searchText, setSearchText] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]); // category IDs
    const [selectedTypes, setSelectedTypes] = useState([]); // productType IDs
    const [selectedBranches, setSelectedBranches] = useState([]); // strings (not sent to backend yet)
    const [selectedBrands, setSelectedBrands] = useState([]); // supplier IDs
    const [selectedPrices, setSelectedPrices] = useState([]); // strings (like "1BHD - 5BHD")
    const [sortBy, setSortBy] = useState("price-asc");

    const [isCategoryOpen, setIsCategoryOpen] = useState(true);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isBranchOpen, setIsBranchOpen] = useState(false);
    const [isBrandOpen, setIsBrandOpen] = useState(false);
    const [isPriceOpen, setIsPriceOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    // ---- pagination + data from backend -------------
    const [products, setProducts] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const pageSize = 12;
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // ---- filter metadata (all options from DB) ------
    const [filterMeta, setFilterMeta] = useState({
        categories: [],
        brands: [],
        types: [],
    });

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

    // ---- load filter options ONCE (categories/brands/types) ----
    useEffect(() => {
        const controller = new AbortController();

        async function fetchCategoriesForFilter() {
            try {
                const res = await fetch(
                    `${API_BASE}/api/Category?pageNumber=1&pageSize=200`,
                    {
                        signal: controller.signal,
                        // credentials: "include", // enable if your API needs cookies
                    }
                );
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

        // ? This matches your controller: [HttpGet("types")]
        async function fetchTypesForFilter() {
            try {
                const res = await fetch(
                    `${API_BASE}/api/Category/types?pageNumber=1&pageSize=200`,
                    {
                        signal: controller.signal,
                        // credentials: "include",
                    }
                );
                if (!res.ok) return;

                const data = await res.json();
                const items = data.items ?? [];

                setFilterMeta((prev) => ({
                    ...prev,
                    types: items.map((t) => ({
                        // most likely camelCase from ASP.NET:
                        id: t.productTypeId ?? t.ProductTypeId ?? t.typeId ?? t.TypeId ?? null,
                        name: t.productTypeName ?? t.ProductTypeName ?? t.typeName ?? t.TypeName ?? "—",
                        categoryId: t.categoryId ?? t.CategoryId ?? null, // optional (handy later)
                    })),
                }));
            } catch (e) {
                if (e.name !== "AbortError") console.error("Failed to load types:", e);
            }
        }

        async function fetchBrandsForFilter() {
            try {
                const res = await fetch(
                    `${API_BASE}/api/Suppliers?pageNumber=1&pageSize=200`,
                    {
                        signal: controller.signal,
                        // credentials: "include",
                    }
                );
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

        fetchCategoriesForFilter();
        fetchTypesForFilter();
        fetchBrandsForFilter();

        return () => controller.abort();
    }, [API_BASE]);

    // ---- read from URL whenever it changes ----
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        const urlSearch = params.get("search") || "";
        setSearchText(urlSearch);

        const categoryIdParam = params.get("categoryId");
        if (categoryIdParam) {
            const idNum = Number(categoryIdParam);
            if (!Number.isNaN(idNum)) {
                setSelectedCategories([idNum]);
            }
        }
    }, [location.search]);

    // ---- reset to first page when any filter changes ----
    useEffect(() => {
        setPageNumber(1);
    }, [
        searchText,
        selectedCategories,
        selectedTypes,
        selectedBranches,
        selectedBrands,
        selectedPrices,
        sortBy,
    ]);

    // ---- BACKEND FETCH: load products from API with pagination + filters ----
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

                selectedPrices.forEach((rg) => {
                    const [min, max] = rg.replace(/BHD/g, "").split("-").map((v) => v.trim());
                    params.append("priceRanges", `${min}-${max}`);
                });

                params.set("sortBy", sortBy);

                const url = `${API_BASE}/api/ExternalProducts?${params.toString()}`;

                const response = await fetch(url, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    // credentials: "include",
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
                    isFavorite: false,

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
        selectedPrices,
        sortBy,
    ]);

    // ---- filter handlers -----------------------------

    const handleBranchToggle = (branch) => {
        setSelectedBranches((prev) =>
            prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
        );
    };

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

    const handlePriceToggle = (range) => {
        setSelectedPrices((prev) =>
            prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
        );
    };

    const handleToggleFavorite = (id, isFav) => {
        console.log("Toggle favorite", id, isFav);
    };

    const handleAddToCart = (id) => {
        console.log("Add to cart", id);
    };

    return (
        <div className="products-page">
            <PageHeader title="Our Products" />

            <div className="products-layout">
                {/* LEFT: Filter sidebar */}
                <aside className="products-filters">
                    <h3 className="filters-title">Filter By:</h3>

                    {/* Category */}
                    <div className="filter-group">
                        <button
                            type="button"
                            className="filter-group-header"
                            onClick={() => setIsCategoryOpen((open) => !open)}
                        >
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
                        <button
                            type="button"
                            className="filter-group-header"
                            onClick={() => setIsTypeOpen((open) => !open)}
                        >
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

                    {/* Branch (static for now) */}
                    <div className="filter-group">
                        <button
                            type="button"
                            className="filter-group-header"
                            onClick={() => setIsBranchOpen((open) => !open)}
                        >
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
                                    {BRANCHES.map((branch) => {
                                        const active = selectedBranches.includes(branch);
                                        return (
                                            <button
                                                key={branch}
                                                type="button"
                                                className={"chip-btn" + (active ? " is-active" : "")}
                                                onClick={() => handleBranchToggle(branch)}
                                            >
                                                {branch}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Brand */}
                    <div className="filter-group">
                        <button
                            type="button"
                            className="filter-group-header"
                            onClick={() => setIsBrandOpen((open) => !open)}
                        >
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
                        <button
                            type="button"
                            className="filter-group-header"
                            onClick={() => setIsPriceOpen((open) => !open)}
                        >
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
                                        const active = selectedPrices.includes(rg);
                                        return (
                                            <button
                                                key={rg}
                                                type="button"
                                                className={"chip-btn" + (active ? " is-active" : "")}
                                                onClick={() => handlePriceToggle(rg)}
                                            >
                                                {rg}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sort By */}
                    <div className="filter-group">
                        <button
                            type="button"
                            className="filter-group-header"
                            onClick={() => setIsSortOpen((open) => !open)}
                        >
                            <span>Sort By</span>
                            <span>{isSortOpen ? "-" : "+"}</span>
                        </button>

                        {isSortOpen && (
                            <div className="filter-group-body">
                                <select
                                    className="sort-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                    <option value="name-asc">Name: A-Z</option>
                                    <option value="name-desc">Name: Z-A</option>
                                </select>
                            </div>
                        )}
                    </div>
                </aside>

                {/* RIGHT: search + grid + pagination */}
                <main className="products-content">
                    <div className="products-search-row">
                        <input
                            type="text"
                            className="products-search-input"
                            placeholder="Search Products by Category, Brand, and Name"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                        <span className="search-icon">??</span>
                    </div>

                    {isLoading && <p className="loading-msg">Loading products...</p>}

                    <div className="products-grid">
                        {!isLoading && products.length === 0 ? (
                            <p className="no-products-msg">No products match your filters.</p>
                        ) : (
                            products.map((p) => (
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

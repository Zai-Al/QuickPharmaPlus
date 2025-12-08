// src/Pages/External_System/Product.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ProductCard from "../Shared_Components/ProductCard";
import "./ProductPage.css";
import PageHeader from "../Shared_Components/PageHeader";

// ---- TEMP DATA (replace later with API/DB) -----------------
const MOCK_PRODUCTS = [
    {
        id: 1,
        name: "Vitamin C 1000mg",
        categoryId: 2,
        categoryName: "Vitamins",
        productType: "Tablets",
        price: 3.5,
        branch: "Sitra",
        brand: "QuickHealth",
        isFavorite: false,
        requiresPrescription: false,
        incompatibilities: [],
        imageUrl: null,
    },
    {
        id: 2,
        name: "Paracetamol 500mg",
        categoryId: 4,
        categoryName: "Pain Relief",
        productType: "Tablets",
        price: 1.2,
        branch: "Budaiya",
        brand: "MediCare",
        isFavorite: true,
        requiresPrescription: false,
        incompatibilities: [],
        imageUrl: null,
    },
    {
        id: 3,
        name: "Blood Pressure Tabs",
        categoryId: 5,
        categoryName: "Heart & BP",
        productType: "Tablets",
        price: 7.8,
        branch: "Salmanya",
        brand: "CardioLife",
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing BP medication"],
        imageUrl: null,
    },
    {
        id: 4,
        name: "Blood Pressure Tabs",
        categoryId: 5,
        categoryName: "Heart & BP",
        productType: "Tablets",
        price: 7.8,
        branch: "Salmanya",
        brand: "CardioLife",
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing BP medication"],
        imageUrl: null,
    },
    {
        id: 5,
        name: "Blood Pressure Tabs",
        categoryId: 5,
        categoryName: "Heart & BP",
        productType: "Tablets",
        price: 7.8,
        branch: "Salmanya",
        brand: "CardioLife",
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing BP medication"],
        imageUrl: null,
    },
    {
        id: 6,
        name: "Blood Pressure Tabs",
        categoryId: 5,
        categoryName: "Heart & BP",
        productType: "Tablets",
        price: 7.8,
        branch: "Salmanya",
        brand: "CardioLife",
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing BP medication"],
        imageUrl: null,
    },
    {
        id: 7,
        name: "Blood Pressure Tabs",
        categoryId: 5,
        categoryName: "Heart & BP",
        productType: "Tablets",
        price: 7.8,
        branch: "Salmanya",
        brand: "CardioLife",
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing BP medication"],
        imageUrl: null,
    },
    // add more mock rows if you want more cards
];

const BRANCHES = ["Sitra", "Budaiya", "Bilad", "Salmanya"];

const CATEGORY_OPTIONS = [
    { id: 1, name: "Cold & Flu", iconUrl: null },
    { id: 2, name: "Vitamins", iconUrl: null },
    { id: 3, name: "Skin Care", iconUrl: null },
    { id: 4, name: "Pain Relief", iconUrl: null },
    { id: 5, name: "Baby Care", iconUrl: null },
];

const TYPES = ["Tablets", "Capsules", "Syrup"];
const BRANDS = ["QuickHealth", "MediCare", "CardioLife", "VitaBoost", "PureMed"];
const PRICE_RANGES = [
    "1BHD - 5BHD",
    "6BHD - 10BHD",
    "11BHD - 15BHD",
    "16BHD - 20BHD",
    "21BHD - 25BHD",
    "26BHD - 30BHD",
];

export default function Product() {
    const location = useLocation();

    // ---- filters / search state ----------------------
    const [searchText, setSearchText] = useState("");
    // selectedCategories now holds numeric categoryIds
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

    // ---- read from URL whenever it changes ----
    useEffect(() => {
        const params = new URLSearchParams(location.search);

        // ?search=
        const urlSearch = params.get("search") || "";
        setSearchText(urlSearch);

        // ?categoryId= (from Home page categories)
        const categoryIdParam = params.get("categoryId");
        if (categoryIdParam) {
            const idNum = Number(categoryIdParam);
            if (!Number.isNaN(idNum)) {
                setSelectedCategories([idNum]);
            }
        }
    }, [location.search]);

    const handleBranchToggle = (branch) => {
        setSelectedBranches((prev) =>
            prev.includes(branch)
                ? prev.filter((b) => b !== branch)
                : [...prev, branch]
        );
    };

    // now working with numeric categoryIds
    const handleCategoryToggle = (catId) => {
        setSelectedCategories((prev) =>
            prev.includes(catId)
                ? prev.filter((c) => c !== catId) // unselect
                : [...prev, catId] // select
        );
    };

    const handleTypesToggle = (t) => {
        setSelectedTypes((prev) =>
            prev.includes(t)
                ? prev.filter((ty) => ty !== t)
                : [...prev, t]
        );
    };

    const handleBrandToggle = (br) => {
        setSelectedBrands((prev) =>
            prev.includes(br)
                ? prev.filter((b) => b !== br)
                : [...prev, br]
        );
    };

    const handlePriceToggle = (range) => {
        setSelectedPrices((prev) =>
            prev.includes(range)
                ? prev.filter((r) => r !== range)
                : [...prev, range]
        );
    };

    // ---- main filtering + sorting logic ----------------
    const filteredProducts = useMemo(() => {
        let list = [...MOCK_PRODUCTS];

        const q = searchText.trim().toLowerCase();
        if (q) {
            list = list.filter((p) => {
                const name = p.name.toLowerCase();
                const cat = p.categoryName?.toLowerCase() || "";
                const brand = p.brand?.toLowerCase() || "";
                return (
                    name.includes(q) ||
                    cat.includes(q) ||
                    brand.includes(q)
                );
            });
        }

        // filter by selectedCategories (IDs) if any
        if (selectedCategories.length > 0) {
            list = list.filter((p) =>
                selectedCategories.includes(p.categoryId)
            );
        }

        if (selectedTypes.length > 0) {
            list = list.filter((p) =>
                selectedTypes.includes(p.productType)
            );
        }

        if (selectedBranches.length > 0) {
            list = list.filter((p) => selectedBranches.includes(p.branch));
        }

        if (selectedBrands.length > 0) {
            list = list.filter((p) => selectedBrands.includes(p.brand));
        }

        if (selectedPrices.length > 0) {
            list = list.filter((p) => {
                const price = p.price;

                return selectedPrices.some((rg) => {
                    // Extract ONLY numbers ignoring 'BHD' & spaces
                    const [min, max] = rg
                        .replace(/BHD/g, "") // remove BHD
                        .split("-") // split by dash
                        .map((v) => Number(v.trim())); // convert to numbers

                    return price >= min && price <= max;
                });
            });
        }

        // Sorting
        if (sortBy === "price-asc") {
            list.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-desc") {
            list.sort((a, b) => b.price - a.price);
        } else if (sortBy === "name-asc") {
            list.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === "name-desc") {
            list.sort((a, b) => b.name.localeCompare(a.name));
        }

        return list;
    }, [
        searchText,
        selectedCategories,
        selectedTypes,
        selectedBranches,
        selectedBrands,
        selectedPrices,
        sortBy,
    ]);

    const handleToggleFavorite = (id, isFav) => {
        console.log("Toggle favorite", id, isFav);
        // later: call API / update global state
    };

    const handleAddToCart = (id) => {
        console.log("Add to cart", id);
        // later: add to cart / call API
    };

    return (
        <div className="products-page">
            <PageHeader title="Our Products" />

            <div className="products-layout">
                {/* LEFT: Filter sidebar */}
                <aside className="products-filters">
                    <h3 className="filters-title">Filter By:</h3>

                    {/* Category (multi-select pills) */}
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
                                {/* "All" pill clears selection */}
                                <button
                                    type="button"
                                    className={
                                        "chip-btn" +
                                        (selectedCategories.length === 0
                                            ? " is-active"
                                            : "")
                                    }
                                    onClick={() => setSelectedCategories([])}
                                >
                                    All
                                </button>

                                {/* Each category can be toggled on/off */}
                                <div className="filter-pill-row">
                                    {CATEGORY_OPTIONS.map((cat) => {
                                        const active =
                                            selectedCategories.includes(
                                                cat.id
                                            );
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                className={
                                                    "chip-btn" +
                                                    (active
                                                        ? " is-active"
                                                        : "")
                                                }
                                                onClick={() =>
                                                    handleCategoryToggle(
                                                        cat.id
                                                    )
                                                }
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
                            onClick={() =>
                                setIsTypeOpen((open) => !open)
                            }
                        >
                            <span>Type</span>
                            <span>{isTypeOpen ? "-" : "+"}</span>
                        </button>

                        {isTypeOpen && (
                            <div className="filter-group-body">
                                {/* "All" pill clears selection */}
                                <button
                                    type="button"
                                    className={
                                        "chip-btn" +
                                        (selectedTypes.length === 0
                                            ? " is-active"
                                            : "")
                                    }
                                    onClick={() => setSelectedTypes([])}
                                >
                                    All
                                </button>

                                {/* Each type can be toggled on/off */}
                                <div className="filter-pill-row">
                                    {TYPES.map((t) => {
                                        const active =
                                            selectedTypes.includes(t);
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                className={
                                                    "chip-btn" +
                                                    (active
                                                        ? " is-active"
                                                        : "")
                                                }
                                                onClick={() =>
                                                    handleTypesToggle(t)
                                                }
                                            >
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Branch */}
                    <div className="filter-group">
                        <button
                            type="button"
                            className="filter-group-header"
                            onClick={() =>
                                setIsBranchOpen((open) => !open)
                            }
                        >
                            <span>Branch</span>
                            <span>{isBranchOpen ? "-" : "+"}</span>
                        </button>
                        {isBranchOpen && (
                            <div className="filter-group-body">
                                {/* "All" pill clears selection */}
                                <button
                                    type="button"
                                    className={
                                        "chip-btn" +
                                        (selectedBranches.length === 0
                                            ? " is-active"
                                            : "")
                                    }
                                    onClick={() => setSelectedBranches([])}
                                >
                                    All
                                </button>

                                {/* Pill toggles */}
                                <div className="filter-pill-row">
                                    {BRANCHES.map((branch) => {
                                        const active =
                                            selectedBranches.includes(branch);
                                        return (
                                            <button
                                                key={branch}
                                                type="button"
                                                className={
                                                    "chip-btn" +
                                                    (active
                                                        ? " is-active"
                                                        : "")
                                                }
                                                onClick={() =>
                                                    handleBranchToggle(branch)
                                                }
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
                            onClick={() =>
                                setIsBrandOpen((open) => !open)
                            }
                        >
                            <span>Brand</span>
                            <span>{isBrandOpen ? "-" : "+"}</span>
                        </button>
                        {isBrandOpen && (
                            <div className="filter-group-body">
                                {/* "All" pill resets */}
                                <button
                                    type="button"
                                    className={
                                        "chip-btn" +
                                        (selectedBrands.length === 0
                                            ? " is-active"
                                            : "")
                                    }
                                    onClick={() => setSelectedBrands([])}
                                >
                                    All
                                </button>

                                <div className="filter-pill-row">
                                    {BRANDS.map((br) => {
                                        const active =
                                            selectedBrands.includes(br);
                                        return (
                                            <button
                                                key={br}
                                                type="button"
                                                className={
                                                    "chip-btn" +
                                                    (active
                                                        ? " is-active"
                                                        : "")
                                                }
                                                onClick={() =>
                                                    handleBrandToggle(br)
                                                }
                                            >
                                                {br}
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
                            onClick={() =>
                                setIsPriceOpen((open) => !open)
                            }
                        >
                            <span>Price</span>
                            <span>{isPriceOpen ? "-" : "+"}</span>
                        </button>
                        {isPriceOpen && (
                            <div className="filter-group-body">
                                {/* "All" clears selection */}
                                <button
                                    type="button"
                                    className={
                                        "chip-btn" +
                                        (selectedPrices.length === 0
                                            ? " is-active"
                                            : "")
                                    }
                                    onClick={() => setSelectedPrices([])}
                                >
                                    All
                                </button>

                                <div className="filter-pill-row">
                                    {PRICE_RANGES.map((rg) => {
                                        const active =
                                            selectedPrices.includes(rg);
                                        return (
                                            <button
                                                key={rg}
                                                type="button"
                                                className={
                                                    "chip-btn" +
                                                    (active
                                                        ? " is-active"
                                                        : "")
                                                }
                                                onClick={() =>
                                                    handlePriceToggle(rg)
                                                }
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
                            onClick={() =>
                                setIsSortOpen((open) => !open)
                            }
                        >
                            <span>Sort By</span>
                            <span>{isSortOpen ? "-" : "+"}</span>
                        </button>
                        {isSortOpen && (
                            <div className="filter-group-body">
                                <select
                                    className="sort-select"
                                    value={sortBy}
                                    onChange={(e) =>
                                        setSortBy(e.target.value)
                                    }
                                >
                                    <option value="price-asc">
                                        Price: Low to High
                                    </option>
                                    <option value="price-desc">
                                        Price: High to Low
                                    </option>
                                    <option value="name-asc">
                                        Name: A-Z
                                    </option>
                                    <option value="name-desc">
                                        Name: Z-A
                                    </option>
                                </select>
                            </div>
                        )}
                    </div>
                </aside>

                {/* RIGHT: search + grid */}
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

                    <div className="products-grid">
                        {filteredProducts.length === 0 ? (
                            <p className="no-products-msg">
                                No products match your filters.
                            </p>
                        ) : (
                            filteredProducts.map((p) => (
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
                                    onAddToCart={() =>
                                        handleAddToCart(p.id)
                                    }
                                    isPrescribed={p.requiresPrescription}
                                    hasIncompatibilities={
                                        p.incompatibilities &&
                                        p.incompatibilities.length > 0
                                    }
                                    incompatibilityLines={
                                        p.incompatibilities
                                    }
                                />
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

// ExpandableSearch.jsx
import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./ExpandableSearch.css";
import { FiSearch, FiX } from "react-icons/fi";
import { AuthContext } from "../../../Context/AuthContext.jsx"; 

function toImageSrc(dto) {
    if (dto.productImageBase64 || dto.ProductImageBase64) {
        return `data:image/jpeg;base64,${dto.productImageBase64 ?? dto.ProductImageBase64
            }`;
    }
    return "";
}



export default function ExpandableSearch() {
    const [expanded, setExpanded] = useState(false);
    const [query, setQuery] = useState("");

    const [suggestions, setSuggestions] = useState([]);
    const [loadingSug, setLoadingSug] = useState(false);

    const inputRef = useRef(null);
    const navigate = useNavigate();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    const openSearch = () => {
        setExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 200);
    };

    const closeSearch = () => {
        setExpanded(false);
        setQuery("");
        setSuggestions([]);
    };
    const goToProductDetails = (productId) => {
        if (!productId) return;
        navigate(`/productDetails/${encodeURIComponent(productId)}`); 
        closeSearch();
    };

    const goToProductsSearch = (q) => {
        const term = (q || "").trim();
        if (!term) return;

        navigate(`/productsPage?search=${encodeURIComponent(term)}`);
        closeSearch();
    };

    const submitSearch = (e) => {
        e.preventDefault();
        goToProductsSearch(query);
    };

    // close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (expanded && !e.target.closest(".expand-search-container")) {
                closeSearch();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [expanded]);

    // suggestions (debounced)
    useEffect(() => {
        if (!expanded) return;

        const q = query.trim();

        // IMPORTANT: your backend will return empty for invalid characters,
        // so keep this >=2 and basic characters.
        if (q.length < 2) {
            setSuggestions([]);
            return;
        }

        const controller = new AbortController();
        const t = setTimeout(async () => {
            try {
                setLoadingSug(true);

                const params = new URLSearchParams();
                params.set("pageNumber", "1");
                params.set("pageSize", "6");
                params.set("search", q);
                if (currentUserId) params.set("userId", String(currentUserId));

                const url = `${API_BASE}/api/ExternalProducts?${params.toString()}`;
                const res = await fetch(url, { signal: controller.signal });

                if (!res.ok) {
                    setSuggestions([]);
                    return;
                }

                const data = await res.json().catch(() => null);
                const items = Array.isArray(data?.items) ? data.items : [];

                const mapped = items
                    .map((dto) => ({
                        id: dto.id ?? dto.Id ?? dto.productId ?? dto.ProductId,
                        name: dto.name ?? dto.Name ?? dto.productName ?? dto.ProductName ?? "",
                        category: dto.categoryName ?? dto.CategoryName ?? "",
                        type: dto.productTypeName ?? dto.ProductTypeName ?? "",
                        supplier: dto.supplierName ?? dto.SupplierName ?? "",

                        imageUrl: toImageSrc(dto),


                        isPrescribed:
                            dto.isPrescribed ??
                            dto.IsPrescribed ??
                            false,

                        
                        isIncompatible:
                            dto.isIncompatible ??
                            dto.IsIncompatible ??
                            false,
                    }))
                    .filter((x) => x.id && x.name);


                setSuggestions(mapped);
            } catch (err) {
                if (err.name !== "AbortError") setSuggestions([]);
            } finally {
                setLoadingSug(false);
            }
        }, 250);

        return () => {
            clearTimeout(t);
            controller.abort();
        };
    }, [expanded, query, API_BASE, currentUserId]);

    return (
        <form className="expand-search-container" onSubmit={submitSearch}>
            {expanded ? (
                <div className="expand-search-inputWrap">
                    <input
                        ref={inputRef}
                        type="text"
                        className="expand-search-input"
                        placeholder="Search products..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") closeSearch();
                        }}
                    />

                    <button
                        type="button"
                        className="expand-search-close"
                        onClick={closeSearch}
                    >
                        <FiX size={20} />
                    </button>

                    {(loadingSug || suggestions.length > 0) && (
                        <div className="expand-search-dropdown">
                            {loadingSug && (
                                <div className="expand-search-ddItem muted">Searching...</div>
                            )}

                            {!loadingSug && suggestions.length === 0 && (
                                <div className="expand-search-ddItem muted">No results</div>
                            )}

                            {!loadingSug &&
                                suggestions.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className="expand-search-ddRow"
                                        onClick={() => goToProductDetails(s.id)}
                                        title={s.name}
                                    >
                                        <div className="dd-imgWrap">
                                            {s.imageUrl ? (
                                                <img className="dd-img" src={s.imageUrl} alt={s.name} />
                                            ) : (
                                                <div className="dd-imgFallback">No Image</div>
                                            )}
                                        </div>

                                        <div className="dd-main">
                                            <div className="dd-topLine">
                                                <div className="dd-title">{s.name}</div>

                                                <div className="dd-badges">
                                                    {s.isIncompatible && (
                                                        <span className="dd-badge dd-badge-danger">Incompatible</span>
                                                    )}
                                                    {s.isPrescribed && (
                                                        <span className="dd-badge dd-badge-success">Prescribed</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="dd-sub">
                                                {[s.category, s.type].filter(Boolean).join(", ")}
                                            </div>

                                            {s.supplier ? <div className="dd-supplier">{s.supplier}</div> : null}
                                        </div>
                                    </button>
                                ))}


                            {!loadingSug && query.trim() && (
                                <button
                                    type="button"
                                    className="expand-search-ddItem seeAll"
                                    onClick={() => goToProductsSearch(query)}
                                >
                                    See all results for "{query.trim()}"
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    className="expand-search-icon"
                    onClick={openSearch}
                >
                    <FiSearch size={20} />
                </button>
            )}
        </form>
    );
}

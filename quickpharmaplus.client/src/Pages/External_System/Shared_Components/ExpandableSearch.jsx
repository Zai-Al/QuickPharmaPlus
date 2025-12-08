// ExpandableSearch.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ExpandableSearch.css";
import { FiSearch, FiX } from "react-icons/fi";

export default function ExpandableSearch() {
    const [expanded, setExpanded] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);
    const navigate = useNavigate();

    const openSearch = () => {
        setExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 200);
    };

    const closeSearch = () => {
        setExpanded(false);
        setQuery("");
    };

    const submitSearch = (e) => {
        e.preventDefault();
        if (!query) return;
        navigate(`/products?search=${query}`);
        closeSearch();
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (expanded && !e.target.closest(".expand-search-container")) {
                closeSearch();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [expanded]);

    return (
        <form className="expand-search-container" onSubmit={submitSearch}>
            {expanded ? (
                <>
                    <input
                        ref={inputRef}
                        type="text"
                        className="expand-search-input"
                        placeholder="Search products..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        type="button"
                        className="expand-search-close"
                        onClick={closeSearch}
                    >
                        <FiX size={20} />
                    </button>
                </>
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

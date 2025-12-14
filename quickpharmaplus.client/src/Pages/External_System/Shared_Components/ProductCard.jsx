// src/Pages/Shared_Components/ProductCard.jsx
import { useNavigate } from "react-router-dom";
import { IncompatibilityPill, PrescribedPill } from "./MedicationPills";
import "./ProductCard.css";
import { useState, useEffect } from "react";
import HeartFilled from "../../../assets/icons/heart-filled.svg";
import Heart from "../../../assets/icons/heart.svg";

export default function ProductCard({
    id,
    name,
    price,
    imageUrl,
    isFavorite: initialFavorite = false,
    categoryName,
    productType,
    onToggleFavorite = () => { },
    onAddToCart = () => { },
    isPrescribed = false,
    hasIncompatibilities = false,
    incompatibilityLines = [],
    inventoryCount = null,
    stockStatus = null,
}) {
    const navigate = useNavigate();
    const goToDetails = () => navigate(`/productDetails/${id}`);

    const [isFavorite, setIsFavorite] = useState(initialFavorite);
    const [isAdded, setIsAdded] = useState(false); // visual only

    useEffect(() => {
        setIsFavorite(initialFavorite);
    }, [initialFavorite]);

    const inv = typeof inventoryCount === "number" ? inventoryCount : null;
    const status = typeof stockStatus === "string" ? stockStatus : null;

    const isOutOfStock =
        (status && status.toUpperCase() === "OUT_OF_STOCK") ||
        (inv !== null && inv <= 0);

    const handleAddClick = (e) => {
        e.stopPropagation();

        if (isOutOfStock) return;

        // ? REAL add-to-cart call (THIS WAS NOT REMOVED)
        onAddToCart();

        // ? visual feedback only
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1200);
    };

    return (
        <div className="product-card" onClick={goToDetails}>
            <div className="product-badges">
                {isPrescribed && <PrescribedPill />}
                {hasIncompatibilities && (
                    <IncompatibilityPill popoverLines={incompatibilityLines} />
                )}
            </div>

            <button
                type="button"
                className="favorite-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsFavorite((prev) => !prev);
                    onToggleFavorite(id);
                }}
            >
                <img
                    src={isFavorite ? HeartFilled : Heart}
                    className="favorite-icon"
                    alt="favorite"
                />
            </button>

            <div className="product-image-wrapper">
                <img src={imageUrl} alt={name} className="product-image" />
            </div>

            <div className="product-info">
                <h4 className="product-name">{name}</h4>
                <p className="product-meta">
                    {categoryName}, {productType}
                </p>
                <p className="product-price">{price?.toFixed(2)} BHD</p>
            </div>

            <button
                type="button"
                className={`product-add-btn ${isAdded ? "added" : ""}`}
                disabled={isOutOfStock}
                onClick={handleAddClick}
            >
                {isOutOfStock
                    ? "Out of Stock"
                    : isAdded
                        ? "Added"
                        : "Add to Cart"}
            </button>
        </div>
    );
}

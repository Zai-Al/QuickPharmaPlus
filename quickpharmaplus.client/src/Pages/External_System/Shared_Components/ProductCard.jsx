// src/Pages/Shared_Components/ProductCard.jsx
import { useNavigate } from "react-router-dom";
import { IncompatibilityPill, PrescribedPill } from "./MedicationPills";
import "./ProductCard.css";
import { useState } from "react";
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
}) {
    const navigate = useNavigate();

    const goToDetails = () => navigate(`/productDetails/${id}`);

    const [isFavorite, setIsFavorite] = useState(initialFavorite);

    const handleFavoriteClick = () => {
        const newState = !isFavorite;
        setIsFavorite(newState);

        if (onToggleFavorite) {
            onToggleFavorite(id, newState);
        }
    };


    return (
        <div className="product-card" onClick={goToDetails}>
            {/* Pills */}
            <div className="product-badges">
                {isPrescribed && <PrescribedPill />}
                {hasIncompatibilities && (
                    <IncompatibilityPill popoverLines={incompatibilityLines} />
                )}
            </div>

            {/* Favorite */}
            <button
                type="button"
                className="favorite-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    handleFavoriteClick();
                }}
            >
                <img
                    src={isFavorite ? HeartFilled : Heart}
                    className="favorite-icon"
                    alt="favorite icon"
                />
            </button>

            {/* Image */}
            <div className="product-image-wrapper">
                <img src={imageUrl} alt={name} className="product-image" />
            </div>

            {/* Info */}
            <div className="product-info">
                <h4 className="product-name">{name}</h4>

                {/* Category + Type */}
                <p className="product-meta">
                    {categoryName} , {productType}
                </p>

                <p className="product-price">
                    {price?.toFixed(2)} BHD
                </p>
            </div>

            <button
                type="button"
                className="product-add-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart();
                }}
            >
                Add to Cart
            </button>
        </div>
    );
}

// src/Pages/External_System/Shared_Components/ProductCarouselSection.jsx

import { useRef } from "react";
import ProductCard from "./ProductCard";
import { useNavigate } from "react-router-dom";
import "../Home/Home.css";

export default function ProductRowSection({
    title,
    products = [],
    onAddToCart,
    onToggleFavorite,
    highlight = false,
}) {
    const rowRef = useRef(null);
    const navigate = useNavigate();

    const scroll = (direction) => {
        const container = rowRef.current;
        if (!container) return;

        const firstCard = container.querySelector(".product-card");
        const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 260;

        container.scrollBy({
            left: direction === "left" ? -cardWidth : cardWidth,
            behavior: "smooth",
        });
    };

    const handleViewAll = () => {
        const params = new URLSearchParams();

        if (products.length > 0 && products[0].categoryName) {
            params.set("categoryId", products[0].categoryId ?? "");
            params.set("categoryName", products[0].categoryName ?? "");
        }

        navigate(`/productsPage?${params.toString()}`);
    };

    return (
        <section className={`home-section ${highlight ? "home-section--highlight" : ""}`}>
            <div className="home-section-inner">
                <div className="home-section-header">
                    <h3>{title}</h3>

                    <button className="view-all-btn" onClick={handleViewAll}>
                        View All Products
                    </button>
                </div>

                <div className="home-products-carousel">
                    <button
                        type="button"
                        className="carousel-arrow"
                        onClick={() => scroll("left")}
                        aria-label="Scroll left"
                    >
                        &lsaquo;
                    </button>

                    <div className="home-products-row" ref={rowRef}>
                        {products.map((p) => (
                            <ProductCard
                                key={p.id}
                                id={p.id}
                                name={p.name}
                                price={p.price}
                                imageUrl={p.imageUrl}
                                isFavorite={p.isFavorite}
                                categoryName={p.categoryName}
                                productType={p.productType}
                                isPrescribed={p.requiresPrescription}
                                hasIncompatibilities={p.incompatibilities?.length > 0}
                                incompatibilityLines={p.incompatibilities}

                                
                                inventoryCount={p.inventoryCount}
                                stockStatus={p.stockStatus}

                                onToggleFavorite={() => onToggleFavorite?.(p)}
                                onAddToCart={() => onAddToCart?.(p)}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        className="carousel-arrow"
                        onClick={() => scroll("right")}
                        aria-label="Scroll right"
                    >
                        &rsaquo;
                    </button>
                </div>
            </div>
        </section>
    );
}

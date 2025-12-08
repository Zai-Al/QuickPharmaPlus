// src/Pages/External_System/Shared_Components/ProductCarouselSection.jsx
import { useRef } from "react";
import ProductCard from "./ProductCard";
import "../Home/Home.css";

export default function ProductRowSection({
    title,
    products,
    highlight = false,          
}) {
    const rowRef = useRef(null);

    const scroll = (direction) => {
        const container = rowRef.current;
        if (!container) return;

        // scroll by one card width + gap
        const firstCard = container.querySelector(".product-card");
        const cardWidth = firstCard
            ? firstCard.offsetWidth + 16 // 16px gap
            : 260;

        const amount = direction === "left" ? -cardWidth : cardWidth;

        container.scrollBy({
            left: amount,
            behavior: "smooth",
        });
    };

    return (
        <section
            className={`home-section ${highlight ? "home-section--highlight" : ""
                }`}
        >
            <div className="home-section-inner">
                <div className="home-section-header">
                    <h3>{title}</h3>
                    <button
                        className="view-all-btn"
                        onClick={() =>
                            console.log("View all clicked for:", title)
                        }
                    >
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
                                onToggleFavorite={() =>
                                    console.log("toggle fav", p.id)
                                }
                                onAddToCart={() =>
                                    console.log("add to cart", p.id)
                                }
                                isPrescribed={p.requiresPrescription}
                                hasIncompatibilities={
                                    p.incompatibilities &&
                                    p.incompatibilities.length > 0
                                }
                                incompatibilityLines={p.incompatibilities}
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

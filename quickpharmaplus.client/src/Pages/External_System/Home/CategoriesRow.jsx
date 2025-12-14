// src/Pages/External_System/Home/CategoriesRow.jsx
import { useRef } from "react";
import "./Home.css";
import CategoryBubble from "./CategoryBubble";

export default function CategoriesRow({ categories = [] }) {
    const rowRef = useRef(null);

    if (!categories.length) return null;

    const scroll = (direction) => {
        const container = rowRef.current;
        if (!container) return;

        const firstItem = container.querySelector(".category-bubble");
        const itemWidth = firstItem ? firstItem.offsetWidth + 32 : 160; // 32 ~= gap

        container.scrollBy({
            left: direction === "left" ? -itemWidth : itemWidth,
            behavior: "smooth",
        });
    };

    return (
        <section className="categories-row">
            <h3 className="section-title">Product Categories</h3>
            <p className="section-subtitle">Our product categories.</p>

            <div className="categories-carousel">
                {/* Left arrow */}
                <button
                    type="button"
                    className="categories-arrow"
                    onClick={() => scroll("left")}
                    aria-label="Scroll categories left"
                >
                    &lsaquo;
                </button>

                {/* Scroll row */}
                <div className="categories-list categories-scroll" ref={rowRef}>
                    {categories.map((cat) => (
                        <CategoryBubble
                            key={cat.id}
                            id={cat.id}
                            name={cat.name}
                            iconUrl={cat.iconUrl}
                        />
                    ))}
                </div>

                {/* Right arrow */}
                <button
                    type="button"
                    className="categories-arrow"
                    onClick={() => scroll("right")}
                    aria-label="Scroll categories right"
                >
                    &rsaquo;
                </button>
            </div>
        </section>
    );
}

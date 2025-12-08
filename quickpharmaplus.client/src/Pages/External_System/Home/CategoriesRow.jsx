import "./Home.css"; 
import CategoryBubble from "./CategoryBubble";

export default function CategoriesRow({ categories = [] }) {
    if (!categories.length) return null;

    return (
        <section className="categories-row">
            <h3 className="section-title">Product Categories</h3>
            <p className="section-subtitle">Our product categories.</p>

            <div className="categories-list">
                {categories.map((cat) => (
                    <CategoryBubble
                        key={cat.id}
                        id={cat.id}
                        name={cat.name}
                        iconUrl={cat.iconUrl}
                    />
                ))}
            </div>
        </section>
    );
}

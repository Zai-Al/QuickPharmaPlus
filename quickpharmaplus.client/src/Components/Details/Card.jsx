import "./DetailsSection.css";

export default function ProductCard({ title, content }) {
    return (
        <div className="card border-secondary mb-4">
            <div className="card-header">
                <h4 className="card-title m-0">{title}</h4>
            </div>
            <div className="product-card-body">
                {content}
            </div>
        </div>
    );
}

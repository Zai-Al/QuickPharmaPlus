import "./DetailsSection.css";


export default function ProductCard({ title, text }) {
    return (
        <div className="card border-secondary mb-3">
            <div className="card-header">
                <h4 className="card-title m-0">{title}</h4>
            </div>
            <div className="card-body">
                <p className="card-text">{text}</p>
            </div>
        </div>
    );
}

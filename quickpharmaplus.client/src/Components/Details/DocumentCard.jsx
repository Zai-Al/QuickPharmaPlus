import "./DetailsSection.css";

export default function DocumentCard({ title, children }) {
    return (
        <div className="card border-secondary mb-3">
            <div className="card-header">
                <h4 className="card-title m-0">{title}</h4>
            </div>

            <div className="card-body">
                <div className="document-buttons-wrapper">
                    {children}
                </div>
            </div>
        </div>
    );
}

// src/Shared_Components/PageHeader.jsx
export default function PageHeader({ title }) {
    return (
        <div style={{ backgroundColor: "rgba(162, 199, 224, 0.5)" }}>
            <div className="container py-3">
                <h2 className="fw-bold text-center m-0">{title}</h2>
            </div>
        </div>
    );
}

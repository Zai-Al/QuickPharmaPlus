import "./Home.css";
import { useNavigate } from "react-router-dom";

export default function CategoryBubble({ id, name, iconUrl }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/productsPage?category=${id}`);
    };

    return (
        <div className="category-bubble" onClick={handleClick}>
            <div className="category-icon-wrapper">
                {iconUrl ? (
                    <img src={iconUrl} alt={name} className="category-icon" />
                ) : (
                    <span className="category-icon-placeholder">icon</span>
                )}
            </div>
            <p className="category-name">{name}</p>
        </div>
    );
}

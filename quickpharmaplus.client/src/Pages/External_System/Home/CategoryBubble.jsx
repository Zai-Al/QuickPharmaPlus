import "./Home.css";
import { useNavigate } from "react-router-dom";

export default function CategoryBubble({ id, name, iconUrl }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/productsPage?category=${id}`);
    };

    return (
        <div className="category-bubble" onClick={handleClick}>
            <div className="cat-bubble-circle">
                {iconUrl ? (
                    <img src={iconUrl} alt={name} className="cat-bubble-img" />
                ) : (
                    <div className="cat-bubble-fallback" />
                )}
            </div>
            <p className="category-name">{name}</p>
        </div>
    );
}

import React from "react";
import ProductHeader from "../../../Components/Details/ProductHeader";
import ProductCard from "../../../Components/Details/Card";
import "./ViewProductDetails.css"; // optional for later styling


export default function ViewProductDetails() {

    // Later: dynamic API data
    // const { id } = useParams();
    // const [product, setProduct] = useState(null);

    return (
        <div className="container mt-4">

            {/* ===========================
                PRODUCT HEADER COMPONENT
            =========================== */}
            <ProductHeader
                name="Product Name"
                image={null}  // later: image URL
            />

            {/* ===========================
                PRODUCT DETAIL CARDS
            =========================== */}
            <ProductCard
                title="Description"
                text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt."
            />

            <ProductCard
                title="Ingredients"
                text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt."
            />

            <ProductCard
                title="Known Interactions"
                text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt."
            />

        </div>
    );
}

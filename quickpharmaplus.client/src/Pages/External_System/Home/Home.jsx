// src/Pages/External_System/HomeExternal.jsx
import HomeSlider from "./HomeSlider";
import CategoriesRow from "./CategoriesRow";
import "./Home.css";
import ProductRowSection from "../Shared_Components/ProductRowSection";

// Later you’ll replace these with real data from your API/DB
const mockCategories = [
    { id: 1, name: "Cold & Flu", iconUrl: null },
    { id: 2, name: "Vitamins", iconUrl: null },
    { id: 3, name: "Skin Care", iconUrl: null },
    { id: 4, name: "Pain Relief", iconUrl: null },
    { id: 5, name: "Baby Care", iconUrl: null },
];

const mockBestSellers = [
    {
        id: 101,
        name: "Vitamin C 1000mg",
        price: 3.5,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: false,
        incompatibilities: [],
        categoryName: "Vitamins",
        productType: "Tablets",
    },
    {
        id: 102,
        name: "Paracetamol 500mg",
        price: 1.2,
        imageUrl: null,
        isFavorite: true,
        requiresPrescription: false,
        incompatibilities: [],
        categoryName: "Pain Relief",
        productType: "Tablets",
    },
    {
        id: 103,
        name: "Blood Pressure Tabs",
        price: 7.8,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing BP medication"],
        categoryName: "Heart & BP",
        productType: "Tablets",
    },
    {
        id: 104,
        name: "Blood Pressure Tabs",
        price: 7.8,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing BP medication"],
        categoryName: "Heart & BP",
        productType: "Tablets",
    },
    {
        id: 105,
        name: "Blood Pressure Tabs",
        price: 7.8,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing BP medication"],
        categoryName: "Heart & BP",
        productType: "Tablets",
    },
    {
        id: 106,
        name: "Blood Pressure Tabs",
        price: 7.8,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["May interact with existing BP medication"],
        categoryName: "Heart & BP",
        productType: "Tablets",
    },
];

const mockNewProducts = [
    {
        id: 201,
        name: "Hydrating Face Cream",
        price: 6.9,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: false,
        incompatibilities: [],
        categoryName: "Skin Care",
        productType: "Cream",
    },
    {
        id: 202,
        name: "Allergy Relief Spray",
        price: 4.2,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: ["Not recommended with current antihistamine"],
        categoryName: "Allergy",
        productType: "Spray",
    },
    {
        id: 203,
        name: "Kids Multivitamin Gummies",
        price: 5.5,
        imageUrl: null,
        isFavorite: true,
        requiresPrescription: false,
        incompatibilities: [],
        categoryName: "Kids Health",
        productType: "Gummies",
    },
    {
        id: 204,
        name: "Kids Multivitamin Gummies",
        price: 5.5,
        imageUrl: null,
        isFavorite: true,
        requiresPrescription: false,
        incompatibilities: [],
        categoryName: "Kids Health",
        productType: "Gummies",
    },
    {
        id: 205,
        name: "Kids Multivitamin Gummies",
        price: 5.5,
        imageUrl: null,
        isFavorite: true,
        requiresPrescription: false,
        incompatibilities: [],
        categoryName: "Kids Health",
        productType: "Gummies",
    },
    {
        id: 206,
        name: "Kids Multivitamin Gummies",
        price: 5.5,
        imageUrl: null,
        isFavorite: true,
        requiresPrescription: false,
        incompatibilities: [],
        categoryName: "Kids Health",
        productType: "Gummies",
    },
];

export default function HomeExternal() {
    // UI-only for now: just log actions
    const handleToggleFavorite = (productId, isFavorite) => {
        console.log("toggle favorite for", productId, "->", isFavorite);
    };

    const handleAddToCart = (productId) => {
        console.log("add to cart", productId);
    };

    return (
        <div className="home-external">
            {/* Hero slider */}
            <HomeSlider />

            {/* Categories */}
            <CategoriesRow categories={mockCategories} />

            {/* Best Seller section with arrows + scroll */}
            <ProductRowSection
                title="Best Seller"
                products={mockBestSellers}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={handleAddToCart}
                highlight
            />

            {/* New Products section with arrows + scroll */}
            <ProductRowSection
                title="New Products"
                products={mockNewProducts}
                onToggleFavorite={handleToggleFavorite}
                onAddToCart={handleAddToCart}
            />
        </div>
    );
}

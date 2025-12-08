// src/Pages/External_System/HomeExternal.jsx
import { useState } from "react";
import HomeSlider from "./HomeSlider";
import CategoriesRow from "./CategoriesRow";
import "./Home.css";
import ProductRowSection from "../Shared_Components/ProductRowSection";
import DialogModal from "../../../Components/InternalSystem/Modals/ConfirmModal";

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
        incompatibilities: [], // no issues
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
        incompatibilities: [], // no issues
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
        incompatibilities: [
            "May interact with existing blood pressure medication.",
        ],
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
        incompatibilities: [
            "May interact with existing blood pressure medication.",
        ],
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
        incompatibilities: [
            "May interact with existing blood pressure medication.",
        ],
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
        incompatibilities: [
            "May interact with existing blood pressure medication.",
        ],
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
        incompatibilities: [
            "Not recommended with your recorded allergies / antihistamines.",
        ],
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
    const [_cartItems, setCartItems] = useState([]);
    const [pendingProduct, setPendingProduct] = useState(null);
    const [interactionMessages, setInteractionMessages] = useState([]);
    const [showInteractionDialog, setShowInteractionDialog] = useState(false);

    const actuallyAddToCart = (product) => {
        setCartItems((prev) => [...prev, product]);
        console.log("Added to cart:", product.name);
    };

    // Called from ProductRowSection / ProductCard
    const handleAddToCartRequest = (product) => {
        const inc = product.incompatibilities || [];
        const hasIncompatibility =
            Array.isArray(inc) && inc.length > 0;

        if (!hasIncompatibility) {
            // no incompatibility -> just add directly
            actuallyAddToCart(product);
            return;
        }

        // there are incompatibilities -> show dialog
        setPendingProduct(product);
        setInteractionMessages(inc);
        setShowInteractionDialog(true);
    };

    const handleCancelAdd = () => {
        setShowInteractionDialog(false);
        setPendingProduct(null);
        setInteractionMessages([]);
    };

    const handleConfirmAdd = () => {
        if (pendingProduct) {
            // here you could choose a special message based on type:
            // - for now, mock strings already mention meds/allergies
            console.log(
                "Proceeding to add despite incompatibility:",
                pendingProduct.name
            );
            actuallyAddToCart(pendingProduct);
        }
        handleCancelAdd();
    };

    const handleToggleFavorite = (product) => {
        console.log("toggle favorite for", product.id);
        // later: update API / global favorite store
    };

    return (
        <div className="home-external">
            {/* Hero slider */}
            <HomeSlider />

            {/* Categories */}
            <CategoriesRow categories={mockCategories} />

            {/* Best Seller section */}
            <ProductRowSection
                title="Best Seller"
                products={mockBestSellers}
                highlight
                onAddToCart={handleAddToCartRequest}
                onToggleFavorite={handleToggleFavorite}
            />

            {/* New Products section */}
            <ProductRowSection
                title="New Products"
                products={mockNewProducts}
                onAddToCart={handleAddToCartRequest}
                onToggleFavorite={handleToggleFavorite}
            />

            {/* Interaction warning dialog */}
            <DialogModal
                show={showInteractionDialog}
                title="Possible Incompatibility"
                body={
                    <div>
                        <p>
                            <strong>
                                {pendingProduct?.name}
                            </strong>{" "}
                            may be incompatible with your health
                            profile (medications, allergies, or
                            illnesses).
                        </p>

                        {interactionMessages.length > 0 && (
                            <ul>
                                {interactionMessages.map(
                                    (msg, idx) => (
                                        <li key={idx}>{msg}</li>
                                    )
                                )}
                            </ul>
                        )}

                        <p>
                            Do you still want to add this product to
                            your cart?
                        </p>
                    </div>
                }
                confirmLabel="Proceed and Add"
                cancelLabel="Cancel"
                onConfirm={handleConfirmAdd}
                onCancel={handleCancelAdd}
            />
        </div>
    );
}

// src/Pages/External_System/ProductDetails.jsx
import { useState } from "react";
import PageHeader from "../Shared_Components/PageHeader";
import StockStatus from "../Shared_Components/StockStatus";
import ProductRowSection from "../Shared_Components/ProductRowSection";
import formatCurrency from "../Shared_Components/formatCurrency";
import DialogModal from "../Shared_Components/DialogModal";
import Heart from "../../../assets/icons/heart.svg";
import HeartFilled from "../../../assets/icons/heart-filled.svg";
import "./ProductDetails.css";


// ---- TEMP MAIN PRODUCT (replace with API later) -----------------
const MOCK_PRODUCT = {
    id: 101,
    name: "Product Name A",
    categoryName: "Category",
    productType: "type",
    price: 0.0,
    description:
        "Product Description Product Description Product Description Product Description Product Description Product Description.",
    isPrescribed: true,
    stockStatus: "IN_STOCK", // IN_STOCK | LOW_STOCK | OUT_OF_STOCK
    branchesCount: 4,
    imageUrl: null,
    incompatibilities: {
        medications: [
            {
                otherProductId: 102,
                otherProductName: "Product Name B",
                interactionType: "MAJOR",
            },
        ],
        allergies: [],
        illnesses: [],
    },
};

// reuse your ProductCard-style shape for the carousels
const MOCK_SIMILAR_PRODUCTS = [
    {
        id: 201,
        name: "Product Name",
        price: 0,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: [], // or same object shape later
        categoryName: "Category",
        productType: "type",
    },
    {
        id: 202,
        name: "Product Name",
        price: 0,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: [],
        categoryName: "Category",
        productType: "type",
    },
    {
        id: 203,
        name: "Product Name",
        price: 0,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: [],
        categoryName: "Category",
        productType: "type",
    },
    {
        id: 204,
        name: "Product Name",
        price: 0,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: [],
        categoryName: "Category",
        productType: "type",
    },
];

const MOCK_BRAND_PRODUCTS = [
    {
        id: 301,
        name: "Product Name",
        price: 0,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: [],
        categoryName: "Category",
        productType: "type",
    },
    {
        id: 302,
        name: "Product Name",
        price: 0,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: [],
        categoryName: "Category",
        productType: "type",
    },
    {
        id: 303,
        name: "Product Name",
        price: 0,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: [],
        categoryName: "Category",
        productType: "type",
    },
    {
        id: 304,
        name: "Product Name",
        price: 0,
        imageUrl: null,
        isFavorite: false,
        requiresPrescription: true,
        incompatibilities: [],
        categoryName: "Category",
        productType: "type",
    },
];

// ---------- helper to build messages like in Home / WishList ----------
const buildInteractionMessages = (inc) => {
    // inc can be object {medications, allergies, illnesses}
    // or an array of strings (like some of your mock products)
    if (!inc) return [];

    if (Array.isArray(inc)) {
        return inc; // already a list of lines
    }

    const msgs = [];
    if (inc.medications && inc.medications.length > 0) {
        msgs.push(
            "This medication may interact with other medications you are taking."
        );
    }
    if (inc.allergies && inc.allergies.length > 0) {
        msgs.push("This product may not be suitable due to your allergies.");
    }
    if (inc.illnesses && inc.illnesses.length > 0) {
        msgs.push(
            "This product may be incompatible with your recorded illnesses."
        );
    }
    return msgs;
};

const mockCheckInteractions = (currentCart, productToAdd) => {
    const inc = productToAdd.incompatibilities;
    const messages = buildInteractionMessages(inc);

    // later you can also compare with items in currentCart if needed
    return messages;
};

export default function ProductDetails() {
    const [product] = useState(MOCK_PRODUCT);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);

    // local "cart" just for demo before real backend/context
    const [cartItems, setCartItems] = useState([]);

    // dialog state (same pattern as Home / WishList)
    const [pendingItem, setPendingItem] = useState(null); // {product, quantity}
    const [interactionMessages, setInteractionMessages] = useState([]);
    const [showInteractionDialog, setShowInteractionDialog] = useState(false);

    const handleQtyChange = (delta) => {
        setQuantity((prev) => {
            const next = prev + delta;
            return next < 1 ? 1 : next;
        });
    };

    const handleToggleFavorite = () => {
        setIsFavorite((prev) => !prev);
        console.log("toggle favorite main product", product.id);
    };

    const actuallyAddToCart = (prod, qty) => {
        setCartItems((prev) => [...prev, { ...prod, quantity: qty }]);
        console.log("Added to cart:", prod.name, "qty:", qty);
        // later: update CartContext or call API
    };

    // MAIN add to cart click (with interaction check)
    const handleAddToCartClick = () => {
        const messages = mockCheckInteractions(cartItems, product);

        if (messages.length === 0) {
            // no issues -> just add
            actuallyAddToCart(product, quantity);
            return;
        }

        // show dialog like before
        setPendingItem({ product, quantity });
        setInteractionMessages(messages);
        setShowInteractionDialog(true);
    };

    // for carousels below (also using interaction check)
    const handleCarouselAddToCart = (p) => {
        const messages = mockCheckInteractions(cartItems, p);

        if (messages.length === 0) {
            actuallyAddToCart(p, 1);
            return;
        }

        setPendingItem({ product: p, quantity: 1 });
        setInteractionMessages(messages);
        setShowInteractionDialog(true);
    };

    const handleCarouselToggleFavorite = (p) => {
        console.log("Toggle favorite from carousel", p.id);
    };

    const handleCancelAdd = () => {
        setShowInteractionDialog(false);
        setPendingItem(null);
        setInteractionMessages([]);
    };

    const handleConfirmAdd = () => {
        if (pendingItem) {
            actuallyAddToCart(pendingItem.product, pendingItem.quantity);
        }
        handleCancelAdd();
    };

    return (
        <div className="min-vh-100">
            {/* Top blue bar */}
            <PageHeader title="Product Details" />

            <div className="container list-padding py-4 product-details-page">
                {/* Top main layout */}
                <div className="row g-4">
                    {/* LEFT: big image */}
                    <div className="col-md-5">
                        <div className="product-main-image-box">
                            {product.imageUrl ? (
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="product-main-image"
                                />
                            ) : (
                                <div className="product-main-image-placeholder">
                                    <span>No image</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: info */}
                    <div className="col-md-7">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            {/* left: badges */}
                            <div>
                                {product.isPrescribed && (
                                    <span className="product-pill product-pill-prescribed">
                                        Prescribed
                                    </span>
                                )}
                            </div>

                            {/* wishlist heart */}
                            <button
                                type="button"
                                className="btn p-0 border-0 bg-transparent product-fav-btn"
                                onClick={handleToggleFavorite}
                                aria-label="Toggle wishlist"
                            >
                                <img
                                    src={isFavorite ? HeartFilled : Heart}
                                    alt="Favorite"
                                    className="product-fav-icon"
                                />
                            </button>
                        </div>

                        <h3 className="product-title mb-1">
                            {product.name}
                        </h3>

                        <p className="mb-2 text-muted">
                            {product.categoryName}
                            {product.productType
                                ? `, ${product.productType}`
                                : ""}
                        </p>

                        <p className="product-price mb-3">
                            {formatCurrency(product.price || 0, "BHD")}
                        </p>

                        <div className="mb-2">
                            <span className="fw-bold">Availability: </span>
                            <button
                                type="button"
                                className="btn btn-link p-0 product-branches-link"
                            >
                                Available at {product.branchesCount} branches
                            </button>
                        </div>

                        <div className="mb-3">
                            <StockStatus status={product.stockStatus} />
                        </div>

                        {/* Quantity + Add to Cart */}
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <div className="d-inline-flex align-items-center border rounded-pill px-2 py-1">
                                <button
                                    type="button"
                                    className="btn btn-sm border-0"
                                    style={{ boxShadow: "none", padding: "0 6px" }}
                                    onClick={() => handleQtyChange(-1)}
                                >
                                    -
                                </button>
                                <span className="mx-2">{quantity}</span>
                                <button
                                    type="button"
                                    className="btn btn-sm border-0"
                                    style={{ boxShadow: "none", padding: "0 6px" }}
                                    onClick={() => handleQtyChange(1)}
                                >
                                    +
                                </button>
                            </div>

                            <button
                                type="button"
                                className="btn qp-add-btn px-4"
                                onClick={handleAddToCartClick}
                            >
                                Add to Cart
                            </button>
                        </div>

                       

                    </div>
                </div>

                <div className="mt-3 product-description-section">
                    <h5 className="product-section-title">Description</h5>
                    <p className="product-description-text">
                        {product.description}
                    </p>
                </div>

                {/* Product Recommendation header styled like a table header */}
                <div className="product-recommendation-header">
                    Product Recommendation
                </div>

                {/* Similar products carousel */}
                <div className="mt-5">
                    <ProductRowSection
                        title="Similar Products"
                        products={MOCK_SIMILAR_PRODUCTS}
                        onAddToCart={handleCarouselAddToCart}
                        onToggleFavorite={handleCarouselToggleFavorite}
                    />
                </div>

                {/* Other products by brand carousel */}
                <div className="mt-4">
                    <ProductRowSection
                        title="Other Products by Brand"
                        products={MOCK_BRAND_PRODUCTS}
                        onAddToCart={handleCarouselAddToCart}
                        onToggleFavorite={handleCarouselToggleFavorite}
                    />
                </div>
            </div>

            {/* Interaction warning dialog – same pattern as Home / WishList */}
            <DialogModal
                show={showInteractionDialog}
                title="Medication Interaction Warning"
                body={
                    <div>
                        <p className="fw-bold">
                            We found possible interactions when adding{" "}
                            <strong>{pendingItem?.product?.name}</strong>:
                        </p>
                        <ul>
                            {interactionMessages.map((msg, idx) => (
                                <li key={idx}>{msg}</li>
                            ))}
                        </ul>
                        <p className="mb-0">
                            Do you still want to add this product to your cart?
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

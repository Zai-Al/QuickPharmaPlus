import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductHeader from "../../../Components/Details/ProductHeader";
import ProductCard from "../../../Components/Details/Card";
import FormHeader from "../../../Components/InternalSystem/FormHeader";

import "./ViewProductDetails.css";


export default function ViewProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchProductDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const url = `${baseURL}/api/Products/${id}/details`;
            console.log("Fetching from URL:", url); // ADD THIS
            
            const response = await fetch(url, {
                credentials: "include"
            });
            
            console.log("Response status:", response.status); // ADD THIS
            console.log("Response headers:", response.headers); // ADD THIS
            
            const text = await response.text(); // Change to text first
            console.log("Response body:", text); // ADD THIS
            
            const data = JSON.parse(text); // Then parse
            setProduct(data);
        } catch (err) {
            console.error("Error fetching product details:", err);
            setError("Unable to load product details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Helper: Convert base64 image to data URL
    const getImageUrl = (base64Image) => {
        if (!base64Image) return null;
        return `data:image/jpeg;base64,${base64Image}`;
    };

    // Helper: Format ingredients list
    const formatIngredients = () => {
        if (!product?.ingredients || product.ingredients.length === 0) {
            return "No ingredients information available.";
        }

        return (
            <ul className="ingredients-list fw-bold">
                {product.ingredients.map((ingredient, index) => (
                    <li key={ingredient.ingredientId || index}
                        style={{ marginBottom: "8px" }}
                    >
                        {ingredient.ingredientName}
                    </li>
                ))}
            </ul>
        );
    };

    // Helper: Format interactions list
    const formatInteractions = () => {
        if (!product?.knownInteractions || product.knownInteractions.length === 0) {
            return (
                <div className="no-interactions-message"
                    style={{ color: "#2e7d32", fontWeight: "500" }}
                >
                    <i className="bi bi-check-circle-fill text-success me-2"></i>
                    This product has no known interactions with other ingredients.
                </div>
            );
        }

        return (
            <div className="interactions-list">
                {product.knownInteractions.map((interaction, index) => (
                    <div key={index} className="interaction-item">
                        <div className="interaction-header">
                            <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                            <span className="interaction-type text-warning fw-bold">{interaction.interactionTypeName}</span>
                        </div>
                        <div className="interaction-ingredients mb-3">
                            <strong>{interaction.ingredientAName}</strong> 
                            <span className="mx-2">↔</span> 
                            <strong>{interaction.ingredientBName}: </strong>
                            {interaction.interactionDescription}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Loading state
    if (loading) {
        return (
            <div className="container mt-4 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading product details...</p>
            </div>
        );
    }

    // Error state
    if (error || !product) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error || "Product not found."}
                </div>
                <button 
                    className="btn btn-primary" 
                    onClick={() => navigate("/products")}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Products
                </button>
            </div>
        );
    }

    return (
        <div className="container mt-4 view-product-details-page">


            {/* ===========================
                PRODUCT HEADER COMPONENT
            =========================== */}
            <ProductHeader
                name={product.productName || "Unknown Product"}
                image={getImageUrl(product.productImage)}
            />

            {/* ===========================
                PRODUCT DETAIL CARDS
            =========================== */}
            
            {/* Description Card */}
            <ProductCard
                title="Description"
                content={
                    <div className="product-description">
                        {product.productDescription || "No description available."}
                    </div>
                }
            />

            {/* Additional Info Card */}
            <ProductCard
                title="Product Information"
                content={
                    <div className="product-info-grid">
                        <div className="info-item mb-1">
                            <span className="info-label fw-bold">Category: </span>
                            <span className="info-value">{product.categoryName || "N/A"}</span>
                        </div>
                        <div className="info-item mb-1">
                            <span className="info-label fw-bold">Type: </span>
                            <span className="info-value">{product.productTypeName || "N/A"}</span>
                        </div>
                        <div className="info-item mb-1">
                            <span className="info-label fw-bold">Supplier: </span>
                            <span className="info-value">{product.supplierName || "N/A"}</span>
                        </div>
                        <div className="info-item mb-1">
                            <span className="info-label fw-bold">Price: </span>
                            <span className="info-value">
                                {product.productPrice 
                                    ? ` BHD${product.productPrice.toFixed(2)}` 
                                    : "N/A"}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label fw-bold">Controlled Substance: </span>
                            <span className="info-value">
                                {product.isControlled ? (
                                    <span style={{ color: "#c62828", fontWeight: "500" }}>Yes</span>
                                ) : (
                                        <span style={{ color: "#2e7d32", fontWeight: "500" }}>No</span>
                                )}
                            </span>
                        </div>
                    </div>
                }
            />

            {/* Ingredients Card */}
            <ProductCard
                title={`Active Ingredients (${product.ingredients?.length || 0})`}
                content={formatIngredients()}
            />

            {/* Known Interactions Card */}
            <ProductCard
                title={`Known Interactions ${product.knownInteractions?.length > 0 ? `(${product.knownInteractions.length})` : ''}`}
                content={formatInteractions()}
            />
        </div>
    );
}

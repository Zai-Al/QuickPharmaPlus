// src/Pages/External_System/Shared_Components/dialogCopy.js

export const dialogCopy = {
    // =========================
    // CART (HomeExternal + ProductDetails)
    // =========================
    cartHealthWarning: {
        title: "Possible Incompatibility",
        introPrefix: "We found possible incompatibilities when adding",
        introSuffix: ":",
        question: "Do you still want to add this product to your cart?",
        confirm: "Proceed and Add",
        cancel: "Cancel",

        allergyLine: "This product may not be suitable due to your allergies.",
        illnessLine: "This product may be incompatible with your recorded illnesses.",
    },

    cartMedicationInteraction: {
        title: "Medication Interaction Warning",
        introPrefix: "We found a possible medication interaction when adding",
        introSuffix: ":",
        question: "Do you still want to add this product to your cart?",
        confirm: "Add Anyway",
        cancel: "Cancel",

        leadLine: "This medication may interact with other medications you are taking.",
    },

    // =========================
    // WISHLIST (HomeExternal: like/heart with server 409)
    // =========================
    wishlistMedicationInteraction: {
        title: "Medication Interaction Detected",
        leadTextSuffix: "may interact with other medications you already have.",
        question: "Do you still want to add it anyway?",
        confirm: "Add Anyway",
        cancel: "Cancel",
    },

    wishlistHealthWarning: {
        title: "Possible Interaction",
        leadTextSuffix: "may not be suitable for you based on your health profile.",
        question: "Do you still want to add it to your wish list?",
        confirm: "Proceed and Add",
        cancel: "Cancel",
    },

    // =========================
    // WISHLIST PAGE (WishList.jsx -> Add to Cart flows)
    // =========================
    wishlistAddToCartHealth: {
        title: "Possible Incompatibility",
        heading: "Are you sure you want to add this product to your cart?",
        // summary + detailLines are dynamic in WishList.jsx
        confirm: "Add to Cart",
        cancel: "Cancel",
    },

    wishlistAddToCartMedication: {
        title: "Medication Interaction Detected",
        bodyTopSuffix: "may interact with another item already in your cart.",
        question: "Do you still want to add it anyway?",
        confirm: "Add Anyway",
        cancel: "Cancel",
    },

    // =========================
    // BRANCH AVAILABILITY (ProductDetails)
    // =========================
    branchAvailability: {
        title: "Branch Availability",
        introPrefix: "Stock availability for",
        introSuffix: "by branch:",
        tableCityHeader: "City",
        tableStockHeader: "Stock Available",
        loading: "Loading...",
        empty: "No branches found.",
        units: "units",
        outOfStock: "Out of stock",
        confirm: "Close",
        cancel: "Cancel",
    },

    // =========================
    // CHECKOUT (if you add a “proceed anyway” modal later)
    // =========================
    checkoutProceed: {
        title: "Incompatibility Detected",
        intro:
            "Some products in your cart may be incompatible with your health profile or with each other.",
        question: "Are you sure you want to proceed to checkout?",
        confirm: "Proceed Anyway",
        cancel: "Cancel",
    },
};

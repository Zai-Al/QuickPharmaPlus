// src/Pages/External_System/ShippingTab.jsx
import { useState, useEffect } from "react";
import DropDown from "../Shared_Components/DropDown";
import AddressFields from "../Shared_Components/AddressFields";
import "./Checkout.css";

// TEMP – replace with real profile address later
const MOCK_SAVED_ADDRESS = {
    city: "Manama",
    block: "305",
    road: "12",
    buildingFloor: "Building 10 / Floor 3",
};

// Fixed time slots (text will also be stored in DB)
const SLOT_OPTIONS = [
    "08:00 - 11:59",
    "12:00 - 15:59",
    "16:00 - 19:59",
    "20:00 - 23:59",
];

// Pickup branches (placeholder names)
const BRANCH_OPTIONS = [
    "Branch 1",
    "Branch 2",
    "Branch 3",
    "Branch 4",
    "Branch 5",
];

// Helper: build Today + next 6 days (7 total) as text options
function getNext7DaysLabels() {
    const opts = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const label = d.toLocaleDateString("en-GB", {
            weekday: "short", // Mon, Tue...
            day: "2-digit",   // 09
            month: "short",   // Dec
        });

        opts.push(label); // e.g. "Mon, 09 Dec"
    }
    return opts;
}

/**
 * Props:
 * - savedAddress?: address from profile (optional)
 * - unavailableByBranch?: { [branchName: string]: string[] } // item names not available there
 * - showErrors?: boolean   // parent sets true when user clicks Continue
 * - onStateChange?: (state) => void   // { isValid, mode, isUrgent }
 */
export default function ShippingTab({
    savedAddress,
    unavailableByBranch = {},
    showErrors = false,
    onStateChange,
}) {
    // "pickup" | "delivery"
    const [mode, setMode] = useState("pickup");

    // pickup state
    const [pickupBranch, setPickupBranch] = useState("");
    const [unavailableItems, setUnavailableItems] = useState([]);

    // delivery state
    const [useSavedAddress, setUseSavedAddress] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [shippingDate, setShippingDate] = useState("");
    const [shippingTime, setShippingTime] = useState("");

    const [address, setAddress] = useState({
        city: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    // all validation errors
    const [errors, setErrors] = useState({});
    const [pickupBranchError, setPickupBranchError] = useState("");

    const profileAddress = savedAddress || MOCK_SAVED_ADDRESS;
    const dateOptions = getNext7DaysLabels(); // today + 6 days

    const isPickup = mode === "pickup";
    const isDelivery = mode === "delivery";

    // Fill address when using saved profile address
    useEffect(() => {
        if (useSavedAddress && isDelivery) {
            setAddress((prev) => {
                if (
                    prev.city === profileAddress.city &&
                    prev.block === profileAddress.block &&
                    prev.road === profileAddress.road &&
                    prev.buildingFloor === profileAddress.buildingFloor
                ) {
                    return prev; // no change
                }
                return { ...profileAddress };
            });
        }
    }, [useSavedAddress, isDelivery, profileAddress]);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddress((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleToggleSavedAddress = () => {
        setUseSavedAddress((prev) => !prev);
    };

    const handleToggleUrgent = () => {
        setIsUrgent((prev) => !prev);
    };

    // When pickup branch changes, check if all items are available in that branch
    const handlePickupBranchChange = (e) => {
        const value = e.target.value;
        setPickupBranch(value);

        const unavailable = value ? unavailableByBranch[value] || [] : [];

        setUnavailableItems(unavailable);

        if (!value) {
            setPickupBranchError("Please choose a pickup branch.");
        } else if (unavailable.length > 0) {
            setPickupBranchError(
                "Some items in your order are not available at this branch."
            );
        } else {
            setPickupBranchError("");
        }
    };

    // === VALIDATION (pickup branch + delivery address/schedule) ===
    useEffect(() => {
        const numberRegex = /^[0-9]+$/;
        const newErrors = {};

        // Pickup validation
        if (isPickup) {
            if (!pickupBranch) {
                newErrors.pickupBranch = "Please choose a pickup branch.";
            } else if (unavailableItems.length > 0) {
                newErrors.pickupBranch =
                    "Some items in your order are not available at this branch.";
            }
        }

        // Delivery validation
        if (isDelivery) {
            // Address only if NOT using saved address
            if (!useSavedAddress) {
                if (!address.city) {
                    newErrors.city = "Please select your city.";
                }

                if (!address.block.trim()) {
                    newErrors.block = "Please enter your block.";
                } else if (!numberRegex.test(address.block.trim())) {
                    newErrors.block = "Block must contain only numbers.";
                }

                if (!address.road.trim()) {
                    newErrors.road = "Please enter your road.";
                } else if (!numberRegex.test(address.road.trim())) {
                    newErrors.road = "Road must contain only numbers.";
                }

                if (!address.buildingFloor.trim()) {
                    newErrors.buildingFloor =
                        "Please enter your building / floor number.";
                }
            }

            // Schedule (only when not urgent)
            if (!isUrgent) {
                if (!shippingDate) {
                    newErrors.shippingDate = "Please select a shipping date.";
                }
                if (!shippingTime) {
                    newErrors.shippingTime = "Please select a time slot.";
                }
            }
        }

        // showErrors controls whether messages are visible
        const visibleErrors = showErrors ? newErrors : {};

        // merge pickupBranchError into visibleErrors for DropDown
        if (visibleErrors.pickupBranch) {
            setPickupBranchError(visibleErrors.pickupBranch);
        } else if (!showErrors) {
            // when we hide errors, also clear the visible pickup error
            setPickupBranchError("");
        }

        setErrors(visibleErrors);

        const isValid = Object.keys(newErrors).length === 0;

        if (onStateChange) {
            onStateChange({
                isValid,
                mode,
                isUrgent,
            });
        }
    }, [
        isPickup,
        isDelivery,
        pickupBranch,
        unavailableItems,
        useSavedAddress,
        address,
        isUrgent,
        shippingDate,
        shippingTime,
        showErrors,
        mode,
        onStateChange,
    ]);

    return (
        <div className="text-start prescription-container">
            <h3 className="fw-bold mb-3 text-center">Shipping</h3>

            {/* PICKUP OPTION */}
            <div className="prescription-option">
                <input
                    className="form-check-input"
                    type="radio"
                    name="shippingMode"
                    id="shipping-pickup"
                    value="pickup"
                    checked={isPickup}
                    onChange={() => setMode("pickup")}
                />
                <label htmlFor="shipping-pickup" className="form-check-label">
                    Pickup
                </label>
            </div>

            {isPickup && (
                <div className="prescription-subsection">
                    <DropDown
                        label="Choose Pickup Branch:"
                        name="pickupBranch"
                        value={pickupBranch}
                        onChange={handlePickupBranchChange}
                        placeholder="Choose Pickup Branch"
                        options={BRANCH_OPTIONS}
                        error={pickupBranchError}
                    />

                    {showErrors &&
                        unavailableItems.length > 0 &&
                        !pickupBranchError && (
                            <div className="mt-1 small text-danger text-start">
                                <div>Unavailable in this branch:</div>
                                <ul className="mb-1">
                                    {unavailableItems.map((name, idx) => (
                                        <li key={idx}>{name}</li>
                                    ))}
                                </ul>
                                <div>
                                    Please select another branch or remove these
                                    items from your order.
                                </div>
                            </div>
                        )}
                </div>
            )}

            {/* DELIVERY OPTION */}
            <div className="prescription-option mt-3">
                <input
                    className="form-check-input"
                    type="radio"
                    name="shippingMode"
                    id="shipping-delivery"
                    value="delivery"
                    checked={isDelivery}
                    onChange={() => setMode("delivery")}
                />
                <label htmlFor="shipping-delivery" className="form-check-label">
                    Delivery
                </label>
            </div>

            {isDelivery && (
                <div className="prescription-subsection">
                    {/* fee note */}
                    <p className="text-danger small mb-3">
                        * Delivery fee is 1 BHD
                    </p>

                    {/* SHIPPING ADDRESS */}
                    <div className="mb-4">
                        <h5 className="fw-bold mb-2">Shipping Address</h5>

                        <div className="form-check mb-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="use-saved-address"
                                checked={useSavedAddress}
                                onChange={handleToggleSavedAddress}
                            />
                            <label
                                htmlFor="use-saved-address"
                                className="form-check-label"
                            >
                                Choose saved address from Profile.
                            </label>
                        </div>

                        <div className="prescription-address mt-2">
                            <AddressFields
                                title=""
                                formData={address}
                                errors={errors}
                                handleChange={handleAddressChange}
                                disabled={useSavedAddress}
                            />
                        </div>
                    </div>

                    {/* SHIPPING SCHEDULE */}
                    <div className="mb-2">
                        <h5 className="fw-bold mb-2">Shipping Schedule</h5>

                        <div className="form-check mb-1">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="set-delivery-urgency"
                                checked={isUrgent}
                                onChange={handleToggleUrgent}
                            />
                            <label
                                htmlFor="set-delivery-urgency"
                                className="form-check-label"
                            >
                                Set Delivery Urgency
                            </label>
                        </div>

                        <p className="small text-muted mb-3">
                            Delivery urgency allows order deliveries within an
                            hour but delivery fees increases by 1 BHD.
                        </p>

                        {/* Two dropdowns – disappear when urgent is ON */}
                        {!isUrgent && (
                            <div className="row">
                                <div className="col-md-6">
                                    <DropDown
                                        label="Shipping Date:"
                                        name="shippingDate"
                                        value={shippingDate}
                                        onChange={(e) =>
                                            setShippingDate(e.target.value)
                                        }
                                        placeholder="Choose Shipping Date"
                                        options={dateOptions}
                                        error={errors.shippingDate}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <DropDown
                                        label="Shipping Time:"
                                        name="shippingTime"
                                        value={shippingTime}
                                        onChange={(e) =>
                                            setShippingTime(e.target.value)
                                        }
                                        placeholder="Choose Shipping Time"
                                        options={SLOT_OPTIONS}
                                        error={errors.shippingTime}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="prescription-divider" />
        </div>
    );
}

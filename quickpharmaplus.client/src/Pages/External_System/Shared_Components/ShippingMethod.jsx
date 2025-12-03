// src/Pages/Shared_Components/ShippingMethod.jsx
import { useState, useEffect } from "react";
import DropDown from "./DropDown";
import AddressFields from "./AddressFields";

/**
 * ShippingMethod component
 *
 * Props:
 * - hasSavedAddress: boolean
 * - savedAddress: { city, block, road, buildingFloor } | null
 * - onChange?: (data) => void
 * - errors?: { method?, pickupBranch?, address?: { city?, block?, road?, buildingFloor? } }
 * - showErrors?: boolean
 */
export default function ShippingMethod({
    hasSavedAddress = false,
    savedAddress = null,
    onChange,
    errors = {},
    showErrors = false,
    initialData = null,
}) {
    const [method, setMethod] = useState("");         // "", "pickup", "delivery"
    const [pickupBranch, setPickupBranch] = useState("");
    const [useSavedAddress, setUseSavedAddress] = useState(false);

    const [address, setAddress] = useState({
        city: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    const [initializedFromParent, setInitializedFromParent] = useState(false);

    // Initialize from parent data (for edit mode)
    useEffect(() => {
        if (!initializedFromParent && initialData) {
            setMethod(initialData.method || "");
            setPickupBranch(initialData.pickupBranch || "");
            setUseSavedAddress(initialData.useSavedAddress || false);
            setAddress(initialData.address || {
                city: "",
                block: "",
                road: "",
                buildingFloor: "",
            });

            setInitializedFromParent(true);
        }
    }, [initializedFromParent, initialData]);


    // When toggling "use saved address", fill in address and lock fields
    useEffect(() => {
        if (hasSavedAddress && savedAddress && useSavedAddress) {
            setAddress({
                city: savedAddress.city || "",
                block: savedAddress.block || "",
                road: savedAddress.road || "",
                buildingFloor: savedAddress.buildingFloor || "",
            });
        }
    }, [hasSavedAddress, savedAddress, useSavedAddress]);

    // Notify parent whenever shipping data changes
    useEffect(() => {
        if (typeof onChange === "function") {
            onChange({
                method,
                pickupBranch,
                useSavedAddress,
                address,
            });
        }
        // we intentionally do NOT include onChange in deps to avoid loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [method, pickupBranch, useSavedAddress, address]);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddress((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleMethodChange = (e) => {
        const value = e.target.value;
        setMethod(value);

        // reset some state when switching
        if (value === "pickup") {
            setUseSavedAddress(false);
        }
        if (value === "delivery") {
            setPickupBranch("");
        }
    };

    const handlePickupBranchChange = (e) => {
        setPickupBranch(e.target.value);
    };

    const handleUseSavedChange = (e) => {
        const checked = e.target.checked;
        setUseSavedAddress(checked);
        // if unchecked, we keep current address but fields become editable again
    };

    // Extract nested address errors coming from parent
    const addressErrors = showErrors && errors.address ? errors.address : {};
    const pickupBranchError =
        showErrors && errors.pickupBranch ? errors.pickupBranch : undefined;

    return (
        <div className="mt-4 text-start">
            <h5 className="fw-bold mb-3">Shipping Method</h5>

            {/* Method selection */}
            {/* Method selection */}
            <div className="mb-3 d-flex align-items-center gap-4">
                <label className="d-flex align-items-center gap-2">
                    <input
                        className="form-check-input"
                        type="radio"
                        name="shippingMethod"
                        id="shippingPickup"
                        value="pickup"
                        checked={method === "pickup"}
                        onChange={handleMethodChange}
                    />
                    Pickup
                </label>

                <label className="d-flex align-items-center gap-2">
                    <input
                        className="form-check-input"
                        type="radio"
                        name="shippingMethod"
                        id="shippingDelivery"
                        value="delivery"
                        checked={method === "delivery"}
                        onChange={handleMethodChange}
                    />
                    Delivery
                </label>
            </div>


            {/* Pickup branch selection */}
            {method === "pickup" && (
                <div className="mb-4">
                    <DropDown
                        label="Choose Pickup Branch"
                        name="pickupBranch"
                        value={pickupBranch}
                        onChange={handlePickupBranchChange}
                        placeholder="Choose Pickup Branch"
                        options={[
                            "Manama Branch",
                            "Muharraq Branch",
                            "Riffa Branch",
                            "Isa Town Branch",
                        ]}
                        className="w-50"
                        error={pickupBranchError}
                    />
                </div>
            )}

            {/* Delivery + Shipping Address */}
            {method === "delivery" && (
                <div className="mt-3">
                    <p className="text-muted small mb-2">
                        Delivery fee: <strong>1 BHD</strong>
                    </p>
                    {hasSavedAddress && (
                        <div className="form-check mb-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="useSavedAddress"
                                checked={useSavedAddress}
                                onChange={handleUseSavedChange}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="useSavedAddress"
                            >
                                Choose saved address from Profile.
                            </label>
                        </div>
                    )}

                    <AddressFields
                        title="Shipping Address"
                        formData={address}
                        errors={addressErrors}
                        handleChange={handleAddressChange}
                        disabled={useSavedAddress}
                    />
                </div>
            )}
        </div>
    );
}

// src/Pages/External_System/PrescriptionPlanTab.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PrescriptionListView from "../Shared_Components/PrescriptionListView";
import OrderItemsTable from "../Shared_Components/OrderItemsTable";
import ShippingMethod from "../Shared_Components/ShippingMethod";
import DropDown from "../Shared_Components/DropDown";
import DialogModal from "../Shared_Components/DialogModal";  
import { StatusBadge } from "../Shared_Components/statusUI";

const createDefaultShippingData = () => ({
    method: "",
    pickupBranch: "",
    useSavedAddress: false,
    address: {
        city: "",
        block: "",
        road: "",
        buildingFloor: "",
    },
});

export default function PrescriptionPlanTab({
    onSuccess,
    startInEditMode = false,
    planToEdit = null,
}) {
    const [view, setView] = useState("list");
    const [plans, setPlans] = useState([]);

    const [selectedPrescriptionName, setSelectedPrescriptionName] = useState("");
    const [planItems, setPlanItems] = useState([]);

    // create vs edit
    const [isEditing, setIsEditing] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    // shipping state (raw data)
    const [shippingData, setShippingData] = useState(createDefaultShippingData);

    // validation state
    const [shippingErrors, setShippingErrors] = useState({});
    const [showShippingErrors, setShowShippingErrors] = useState(false);

    // confirm save dialog for EDIT
    const [showSaveModal, setShowSaveModal] = useState(false);  

    const prescriptionOptions = ["Prescription A", "Prescription B", "Prescription C"];

    const navigate = useNavigate();

    // ===== HANDLE EDIT MODE FROM PARENT (HealthProfile) =====
    const [initializedFromParent, setInitializedFromParent] = useState(false);

    useEffect(() => {
        if (!initializedFromParent && startInEditMode && planToEdit) {
            setIsEditing(true);
            setEditingPlan(planToEdit);

            setSelectedPrescriptionName(planToEdit.name || "");
            setPlanItems(planToEdit.items || []);
            setShippingData(planToEdit.shipping || createDefaultShippingData());

            setShowShippingErrors(false);
            setShippingErrors({});
            setView("form");

            setInitializedFromParent(true);
        }
    }, [initializedFromParent, startInEditMode, planToEdit]);

    const handleAddNewClick = () => {
        setIsEditing(false);
        setEditingPlan(null);
        setInitializedFromParent(false);

        setSelectedPrescriptionName("");
        setPlanItems([]);
        setShippingData(createDefaultShippingData());
        setShippingErrors({});
        setShowShippingErrors(false);
        setView("form");
    };

    const handleViewPlanDetails = (index) => {
        const plan = plans[index];

        navigate(`/PlanDetails/${plan.id}`, {
            state: {
                plan,
                openPrescriptionPlanTab: true,
            },
        });
    };

    const handlePrescriptionChange = (e) => {
        const name = e.target.value;
        setSelectedPrescriptionName(name);

        if (name) {
            setPlanItems([
                {
                    id: 1,
                    imageSrc: null,
                    name: `${name} - Product 1`,
                    category: "Category",
                    type: "Tablet",
                    price: 0.0,
                    quantity: 1,
                },
                {
                    id: 2,
                    imageSrc: null,
                    name: `${name} - Product 2`,
                    category: "Category",
                    type: "Capsule",
                    price: 0.0,
                    quantity: 1,
                },
            ]);
        } else {
            setPlanItems([]);
        }
    };

    // ShippingMethod  parent (NO validation here)
    const handleShippingChange = (data) => {
        setShippingData(data);
    };

    // ----- VALIDATION (only used on submit) -----
    const validateShipping = (data) => {
        const errors = {};
        if (!data.method) {
            errors.method = "Please choose Pickup or Delivery.";
        }

        if (data.method === "pickup") {
            if (!data.pickupBranch) {
                errors.pickupBranch = "Please choose a pickup branch.";
            }
        }

        if (data.method === "delivery" && !data.useSavedAddress) {
            const addrErrors = {};
            if (!data.address.city) addrErrors.city = "City is required.";
            if (!data.address.block) addrErrors.block = "Block is required.";
            if (!data.address.road) addrErrors.road = "Road is required.";
            if (!data.address.buildingFloor)
                addrErrors.buildingFloor = "Building/Floor is required.";

            if (Object.keys(addrErrors).length > 0) {
                errors.address = addrErrors;
            }
        }

        return errors;
    };

    const handleCreatePlan = (e) => {
        e.preventDefault();

        if (!selectedPrescriptionName) {
            setShowShippingErrors(true);
            return;
        }

        // validate shipping ONCE when button pressed
        const errors = validateShipping(shippingData);
        if (Object.keys(errors).length > 0) {
            setShippingErrors(errors);
            setShowShippingErrors(true);
            return;
        }

        // ---- EDIT MODE: show confirm dialog instead of saving immediately ----
        if (isEditing && editingPlan) {
            setShowSaveModal(true);   // open confirm dialog
            return;
        }

        // ---- CREATE MODE: proceed as before ----
        const today = new Date();
        const creationDate = today.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        const newPlan = {
            id: Date.now(),
            name: selectedPrescriptionName,
            creationDate,
            status: "Ongoing",
            items: planItems,
            shipping: shippingData,
        };

        setPlans((prev) => [...prev, newPlan]);

        if (typeof onSuccess === "function") {
            onSuccess("Prescription plan created successfully!");
        }

        setIsEditing(false);
        setEditingPlan(null);
        setInitializedFromParent(false);
        setView("list");
    };

    // === CONFIRM SAVE HANDLERS (EDIT) ===
    const handleConfirmSaveChanges = () => {
        setShowSaveModal(false);

        if (isEditing && editingPlan) {
            const updated = {
                ...editingPlan,
                name: selectedPrescriptionName,
                items: planItems,
                shipping: shippingData,
            };

            setPlans((prev) =>
                prev.map((p) => (p.id === editingPlan.id ? updated : p))
            );

            if (typeof onSuccess === "function") {
                onSuccess("Prescription plan updated successfully!");
            }
        }

        setIsEditing(false);
        setEditingPlan(null);
        setInitializedFromParent(false);
        setView("list");
    };

    const handleCancelSaveChanges = () => {
        setShowSaveModal(false);
    };

    const isFormReady =
        !!selectedPrescriptionName &&
        planItems.length > 0 &&
        !!shippingData.method;

    // ===== LIST VIEW =====
    if (view === "list") {
        return (
            <PrescriptionListView
                description={
                    "Choose from your approved prescriptions to create a personalized plan. " +
                    "The system will use the dosage and expiry information provided by the pharmacist " +
                    "to automatically renew your plan every 30 days, unless you cancel or the prescription expires. " +
                    "Payment for each renewal is made through cash on delivery."
                }
                title="Prescription Plans"
                items={plans.map((p) => ({
                    ...p,
                    status: <StatusBadge status={p.status} />,
                }))}
                columns={[
                    { key: "name", header: "Prescription Plan Name" },
                    { key: "creationDate", header: "Creation Date" },
                    { key: "status", header: "Status" },
                ]}
                emptyMessage="No prescription plan added to the system."
                renderActions={(_, index) => (
                    <button
                        className="btn btn-sm qp-edit-btn"
                        style={{ width: "160px" }}
                        onClick={() => handleViewPlanDetails(index)}
                    >
                        View Plan Details
                    </button>
                )}
                addButtonLabel="Add New Prescription Plan"
                onAddNew={handleAddNewClick}
            />
        );
    }

    // ===== FORM VIEW =====
    return (
        <div className="text-start">
            <p className="fw-bold">
                Choose from your approved prescriptions to create a personalized plan.
                The system will use the dosage and expiry information provided by the pharmacist
                to automatically renew your plan every 30 days, unless you cancel or the
                prescription expires. Payment for each renewal is made through cash on delivery.
            </p>

            <form onSubmit={handleCreatePlan}>
                {/* Choose Prescription */}
                <div className="mb-4">
                    <DropDown
                        label="Choose the prescription you want to create a plan for:"
                        name="prescriptionName"
                        value={selectedPrescriptionName}
                        onChange={handlePrescriptionChange}
                        placeholder="Choose Prescription Name"
                        options={prescriptionOptions}
                        className="w-50"
                        disabled={isEditing} // during edit, user cannot change the prescription
                    />
                </div>

                {selectedPrescriptionName && (
                    <>
                        <OrderItemsTable
                            items={planItems}
                            showDeliveryFee={true}
                            showTotalAmount={true}
                            shippingMethod={shippingData.method}
                        />

                        <ShippingMethod
                            hasSavedAddress={false}
                            savedAddress={null}
                            onChange={handleShippingChange}
                            errors={shippingErrors}
                            showErrors={showShippingErrors}
                            initialData={shippingData}
                        />
                    </>
                )}

                <div className="d-flex justify-content-center gap-3 mt-4">
                    <button
                        type="submit"
                        className={`btn px-5 ${isEditing ? "qp-edit-btn" : "qp-add-btn"
                            }`}
                        disabled={!isFormReady}
                    >
                        {isEditing
                            ? "Update Prescription Plan"
                            : "Create Prescription Plan"}
                    </button>

                    <button
                        type="button"
                        className="btn btn-danger px-5"
                        onClick={() => setView("list")}
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* CONFIRM SAVE CHANGES DIALOG FOR EDIT MODE */}
            <DialogModal
                show={showSaveModal}
                title="Save Changes?"
                body="Are you sure you want to save the changes to this prescription plan?"
                confirmLabel="Save Changes"
                cancelLabel="Cancel"
                onConfirm={handleConfirmSaveChanges}
                onCancel={handleCancelSaveChanges}
            />
        </div>
    );
}

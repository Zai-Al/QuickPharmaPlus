// src/Pages/External_System/PrescriptionPlanTab.jsx
import { useEffect, useMemo, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PrescriptionListView from "../Shared_Components/PrescriptionListView";
import OrderItemsTable from "../Shared_Components/OrderItemsTable";
import DialogModal from "../Shared_Components/DialogModal";
import { StatusBadge } from "../Shared_Components/statusUI";
import { AuthContext } from "../../../Context/AuthContext.jsx";

export default function PrescriptionPlanTab({
    onSuccess,
    startInEditMode = false,
    planToEdit = null,
}) {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";
    const userId = user?.userId || user?.id;

    const [view, setView] = useState("list");
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [plans, setPlans] = useState([]);

    // eligible prescriptions dropdown (CREATE only)
    const [eligible, setEligible] = useState([]);
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");

    // items from approval table (CREATE) OR from planToEdit.items (EDIT)
    const [planItems, setPlanItems] = useState([]);

    // shipping fields
    const [method, setMethod] = useState(""); // "pickup" | "delivery"
    const [branchId, setBranchId] = useState(""); // pickup

    // lists
    const [branches, setBranches] = useState([]); // /api/Branch
    const [cities, setCities] = useState([]); // /api/cities

    const [address, setAddress] = useState({
        cityId: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    // City searchable dropdown
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const cityWrapRef = useRef(null);

    // edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState(null);

    // show prescription name in edit mode even if prescriptionId not available
    const [editingPrescriptionName, setEditingPrescriptionName] = useState("");

    // confirm save dialog for EDIT
    const [showSaveModal, setShowSaveModal] = useState(false);

    // ======================
    // Fetch helpers (minimal fix: only res.json() when res.ok)
    // ======================
    const fetchEligiblePrescriptions = async () => {
        const res = await fetch(`${API_BASE}/api/PrescriptionPlan/user/${userId}/eligible`, {
            credentials: "include",
        });

        if (!res.ok) {
            // avoid crashing on HTML
            setEligible([]);
            return;
        }

        const json = await res.json();
        setEligible(Array.isArray(json) ? json : []);
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/Branch?pageNumber=1&pageSize=500`, {
                credentials: "include",
            });

            if (!res.ok) {
                setBranches([]);
                return;
            }

            const json = await res.json();
            const raw = Array.isArray(json?.items) ? json.items : [];

            const normalized = raw.map((b) => ({
                branchId: b.branchId ?? b.BranchId ?? b.id ?? b.Id,
                cityName: b.cityName ?? b.CityName ?? b.branchCityName ?? b.BranchCityName ?? "",
                branchName: b.branchName ?? b.BranchName ?? "",
            }));

            setBranches(normalized.filter((b) => b.branchId != null));

        } catch (e) {
            console.error(e);
            setBranches([]);
        }
    };

    const fetchCities = async () => {
        const res = await fetch(`${API_BASE}/api/cities`, { credentials: "include" });

        if (!res.ok) {
            setCities([]);
            return;
        }

        const json = await res.json();
        setCities(Array.isArray(json) ? json : []);
    };

    const fetchPlans = async () => {
        const res = await fetch(`${API_BASE}/api/PrescriptionPlan/user/${userId}/plans`, {
            credentials: "include",
        });

        if (!res.ok) {
            // avoid crashing on HTML
            setPlans([]);
            return;
        }

        const json = await res.json();
        setPlans(Array.isArray(json) ? json : []);
    };

    // ======================
    // Load initial data
    // ======================
    useEffect(() => {
        if (!userId) return;

        (async () => {
            setLoading(true);
            setLoadError("");
            try {
                await Promise.all([
                    fetchEligiblePrescriptions(),
                    fetchBranches(),
                    fetchCities(),
                    fetchPlans(),
                ]);
            } catch (e) {
                console.error(e);
                setLoadError("Failed to load prescription plan data.");
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // ======================
    // EDIT MODE init from parent
    // ======================
    const [initializedFromParent, setInitializedFromParent] = useState(false);

    useEffect(() => {
        if (!initializedFromParent && startInEditMode && planToEdit) {
            setIsEditing(true);

            const id = planToEdit.prescriptionPlanId || planToEdit.planId || planToEdit.id;
            setEditingPlanId(id);

            // show prescription name (this is what you asked)
            setEditingPrescriptionName(
                planToEdit.name ||
                planToEdit.Name ||
                planToEdit.prescriptionName ||
                planToEdit.PrescriptionName ||
                ""
            );

            // prescriptionId might not exist in DTO, keep it only if provided
            const pid = planToEdit.prescriptionId || planToEdit.PrescriptionId || "";
            setSelectedPrescriptionId(pid ? String(pid) : "");

            // items should be shown in edit (this is what you asked)
            const incomingItems = planToEdit.items || planToEdit.Items || [];
            setPlanItems(Array.isArray(incomingItems) ? incomingItems : []);

            // method from DTO (repo returns Shipping.Method)
            const m =
                planToEdit?.shipping?.Method ??
                planToEdit?.shipping?.method ??
                "";
            setMethod(m);

            // ? pickup branch id comes from backend now
            const bid =
                planToEdit?.shipping?.branchId ??
                planToEdit?.shipping?.BranchId ??
                "";

            setBranchId(bid ? String(bid) : "");

            const addr = planToEdit?.shipping?.Address ?? planToEdit?.shipping?.address ?? null;

            if (m === "delivery" && addr) {
                const cityName = addr.City ?? addr.city ?? "";
                setCityQuery(cityName);

                // map city name -> cityId (since DTO doesn't give CityId)
                const foundCity = (cities || []).find(
                    (c) =>
                        String(c.cityName ?? c.CityName ?? "").trim().toLowerCase() ===
                        String(cityName).trim().toLowerCase()
                );

                setAddress({
                    cityId: foundCity?.cityId ? String(foundCity.cityId) : foundCity?.CityId ? String(foundCity.CityId) : "",
                    block: addr.Block ?? addr.block ?? "",
                    road: addr.Road ?? addr.road ?? "",
                    buildingFloor: addr.BuildingFloor ?? addr.buildingFloor ?? "",
                });
            }


            setView("form");
            setInitializedFromParent(true);
        }
    }, [initializedFromParent, startInEditMode, planToEdit, branches, cities]);


    // If edit came without items (because you navigated with planId only),
    // load items from the plans list you already fetch.
    useEffect(() => {
        if (!isEditing) return;
        if (!editingPlanId) return;
        if (planItems && planItems.length > 0) return;

        const found = (plans || []).find((p) => {
            const id = p.prescriptionPlanId || p.PrescriptionPlanId || p.planId || p.id;
            return String(id) === String(editingPlanId);
        });

        if (found?.items?.length) {
            setPlanItems(found.items);
            setEditingPrescriptionName(found.name || found.prescriptionName || "");
        }
    }, [isEditing, editingPlanId, plans, planItems]);

    // ======================
    // Close city dropdown outside click
    // ======================
    useEffect(() => {
        const onDocMouseDown = (e) => {
            if (!cityWrapRef.current) return;
            if (!cityWrapRef.current.contains(e.target)) setShowCityDropdown(false);
        };
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    // ======================
    // City dropdown helpers
    // ======================
    const filteredCities = useMemo(() => {
        const q = (cityQuery || "").trim().toLowerCase();
        const list = cities || [];
        if (!q) return list;

        return list.filter((c) =>
            String(c.cityName ?? c.CityName ?? "").toLowerCase().includes(q)
        );
    }, [cities, cityQuery]);

    const handleCityInputChange = (e) => {
        const val = e.target.value;
        setCityQuery(val);
        setAddress((a) => ({ ...a, cityId: "" }));
        setShowCityDropdown(true);
        setHighlightIndex(0);
    };

    const handleSelectCity = (city) => {
        const name = city.cityName ?? city.CityName ?? "";
        const id = city.cityId ?? city.CityId ?? "";

        setCityQuery(name);
        setAddress((a) => ({ ...a, cityId: String(id) }));
        setShowCityDropdown(false);
        setHighlightIndex(0);
    };

    const handleCityInputFocus = () => {
        setShowCityDropdown(true);
        setHighlightIndex(0);
    };

    const handleCityKeyDown = (e) => {
        if (!showCityDropdown) return;

        const list = filteredCities || [];
        if (list.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[highlightIndex];
            if (picked) handleSelectCity(picked);
        } else if (e.key === "Escape") {
            setShowCityDropdown(false);
        }
    };

    // ======================
    // When prescription changes -> fetch items (CREATE only)
    // ======================
    useEffect(() => {
        if (isEditing) return;

        if (!userId || !selectedPrescriptionId) {
            setPlanItems([]);
            return;
        }

        (async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/api/PrescriptionPlan/user/${userId}/prescription/${selectedPrescriptionId}/items`,
                    { credentials: "include" }
                );

                if (!res.ok) {
                    setPlanItems([]);
                    return;
                }

                const json = await res.json();
                setPlanItems(Array.isArray(json) ? json : []);
            } catch (e) {
                console.error(e);
                setPlanItems([]);
            }
        })();
    }, [API_BASE, userId, selectedPrescriptionId, isEditing]);

    // ======================
    // Actions
    // ======================
    const resetForm = () => {
        setIsEditing(false);
        setEditingPlanId(null);
        setInitializedFromParent(false);
        setEditingPrescriptionName("");

        setSelectedPrescriptionId("");
        setPlanItems([]);
        setMethod("");
        setBranchId("");
        setAddress({ cityId: "", block: "", road: "", buildingFloor: "" });
        setCityQuery("");
        setShowCityDropdown(false);
        setHighlightIndex(0);
    };

    const handleAddNewClick = () => {
        resetForm();
        setView("form");
    };

    const handleViewPlanDetails = (index) => {
        const plan = plans[index];
        const id = plan.prescriptionPlanId || plan.PrescriptionPlanId || plan.planId || plan.id;

        // keep it like your newer flow: PlanDetails loads from DB if needed
        navigate(`/PlanDetails/${id}`, {
            state: { planId: id, openPrescriptionPlanTab: true },
        });
    };

    // ======================
    // VALIDATION (restored number-only checks)
    // ======================
    const onlyNumbers = (v) => /^\d+$/.test(String(v || "").trim());

    const validate = () => {
        // if create: must choose prescription
        if (!isEditing) {
            if (!selectedPrescriptionId) return "Please select a prescription.";
            if (!planItems || planItems.length === 0) return "This prescription has no approved items.";
        }

        if (!method) return "Please choose Pickup or Delivery.";

        if (method === "pickup") {
            if (!branchId) return "Please choose a pickup branch.";
        }

        if (method === "delivery") {
            if (!address.cityId) return "City is required.";
            if (!address.block) return "Block is required.";
            if (!onlyNumbers(address.block)) return "Block must contain numbers only.";
            if (!address.road) return "Road is required.";
            if (!onlyNumbers(address.road)) return "Road / Street must contain numbers only.";
            if (!address.buildingFloor) return "Building/Floor is required.";
        }

        return "";
    };

    const subtotal = useMemo(() => {
        return (planItems || []).reduce((sum, x) => {
            const price = Number(x.unitPrice ?? x.price ?? 0);
            const qty = Number(x.quantity ?? 0);
            return sum + price * qty;
        }, 0);
    }, [planItems]);

    const buildUpsertDto = () => {
        const deliveryFee = method === "delivery" ? 1 : 0;

        const baseCommon =
            method === "pickup"
                ? {
                    method: "pickup",
                    branchId: branchId ? Number(branchId) : null,
                    cityId: null,
                    block: null,
                    road: null,
                    buildingFloor: null,
                }
                : {
                    method: "delivery",
                    branchId: null,
                    cityId: address.cityId ? Number(address.cityId) : null,
                    block: address.block,
                    road: address.road,
                    buildingFloor: address.buildingFloor,
                };

        if (isEditing) {
            return { ...baseCommon };
        }

        return {
            prescriptionId: Number(selectedPrescriptionId),
            ...baseCommon,
            subtotalAmount: subtotal,
            deliveryFee,
            totalAmount: subtotal + deliveryFee,
        };
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        const err = validate();
        if (err) {
            if (typeof onSuccess === "function") onSuccess(err);
            return;
        }

        if (isEditing && editingPlanId) {
            setShowSaveModal(true);
            return;
        }

        // CREATE
        setLoading(true);
        try {
            const dto = buildUpsertDto();
            const res = await fetch(`${API_BASE}/api/PrescriptionPlan/user/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(dto),
            });

            if (!res.ok) {
                if (typeof onSuccess === "function") onSuccess("Failed to create prescription plan.");
                return;
            }

            const ok = await res.json();
            if (!ok) throw new Error("Create failed");

            if (typeof onSuccess === "function") onSuccess("Prescription plan created successfully!");

            setView("list");
            resetForm();
            await fetchPlans();
            await fetchEligiblePrescriptions();
        } catch (e2) {
            console.error(e2);
            if (typeof onSuccess === "function") onSuccess("Failed to create prescription plan.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSaveChanges = async () => {
        setShowSaveModal(false);

        setLoading(true);
        try {
            const dto = buildUpsertDto();

            const res = await fetch(`${API_BASE}/api/PrescriptionPlan/user/${userId}/${editingPlanId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(dto),
            });

            if (!res.ok) {
                if (typeof onSuccess === "function") onSuccess("Failed to update prescription plan.");
                return;
            }

            const ok = await res.json();
            if (!ok) throw new Error("Update failed");

            if (typeof onSuccess === "function") onSuccess("Prescription plan updated successfully!");

            setView("list");
            resetForm();
            await fetchPlans();
        } catch (e2) {
            console.error(e2);
            if (typeof onSuccess === "function") onSuccess("Failed to update prescription plan.");
        } finally {
            setLoading(false);
        }
    };

    const isFormReady = useMemo(() => {
        if (isEditing) return !!method; // edit: only shipping required
        return !!selectedPrescriptionId && planItems.length > 0 && !!method;
    }, [isEditing, selectedPrescriptionId, planItems.length, method]);

    // ======================
    // LIST VIEW
    // ======================
    if (view === "list") {
        return (
            <PrescriptionListView
                description={
                    "Choose from your approved prescriptions to create a personalized plan. " +
                    "The system renews your plan every 30 days unless you cancel or the prescription expires."
                }
                title="Prescription Plans"
                items={plans.map((p) => ({
                    ...p,
                    // IMPORTANT: do NOT replace p.status with a React element (it breaks cloning / navigation later)
                    prescriptionName: p.name ?? p.Name ?? p.prescriptionName ?? "",
                    prescriptionPlanCreationDate:
                        p.creationDate ?? p.CreationDate ?? p.prescriptionPlanCreationDate ?? "",
                    statusDisplay: <StatusBadge status={p.status ?? p.Status ?? p.statusName ?? "Ongoing"} />,
                }))}
                columns={[
                    { key: "prescriptionName", header: "Prescription Plan Name" },
                    { key: "prescriptionPlanCreationDate", header: "Creation Date" },
                    { key: "statusDisplay", header: "Status" },
                ]}
                emptyMessage={loading ? "Loading..." : "No prescription plan added to the system."}
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
                onAddNew={userId ? handleAddNewClick : undefined}
                addButtonDisabledMessage={
                    !userId ? "Login required to create a prescription plan." : ""
                }

            />
        );
    }

    // ======================
    // FORM VIEW
    // ======================
    return (
        <div className="text-start">
            {loadError && <div className="alert alert-danger">{loadError}</div>}

            <form onSubmit={handleSubmit}>
                {/* Prescription selection (CREATE) / Prescription name display (EDIT) */}
                <div className="mb-4">
                    <label className="form-label fw-bold">
                        Choose the prescription you want to create a plan for:
                    </label>

                    {!isEditing ? (
                        <select
                            className="form-select w-50"
                            value={selectedPrescriptionId}
                            onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                        >
                            <option value="">Choose Prescription</option>
                            {eligible.map((p) => (
                                <option key={p.prescriptionId} value={p.prescriptionId}>
                                    {p.prescriptionName}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            className="form-control w-50"
                            value={editingPrescriptionName}
                            readOnly
                        />
                    )}
                </div>

                {/* Items (show in create + edit) */}
                {(isEditing || selectedPrescriptionId) && (
                    <>
                        <OrderItemsTable
                            items={(planItems || []).map((x, idx) => ({
                                id: idx + 1,
                                name: x.productName || x.name,
                                quantity: x.quantity,
                                price: x.unitPrice ?? x.price ?? 0,
                                type: x.typeName || x.productTypeName || x.dosage || x.type,
                                category: x.categoryName || x.category || "Prescription",
                                incompatibilities: x.incompatibilities,
                                requiresPrescription: x.requiresPrescription,
                            }))}
                            showDeliveryFee={true}
                            showTotalAmount={true}
                            shippingMethod={method}
                        />

                        {/* Shipping method */}
                        <div className="mt-4">
                            <label className="form-label fw-bold">Delivery Method</label>

                            <div className="d-flex gap-4">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        id="pickup"
                                        checked={method === "pickup"}
                                        onChange={() => setMethod("pickup")}
                                    />
                                    <label className="form-check-label" htmlFor="pickup">
                                        Pickup
                                    </label>
                                </div>

                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        id="delivery"
                                        checked={method === "delivery"}
                                        onChange={() => setMethod("delivery")}
                                    />
                                    <label className="form-check-label" htmlFor="delivery">
                                        Delivery
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Pickup */}
                        {method === "pickup" && (
                            <div className="mt-3 w-50">
                                <label className="form-label fw-bold">Pickup Branch</label>
                                <select
                                    className="form-select"
                                    value={branchId}
                                    onChange={(e) => setBranchId(e.target.value)}
                                >
                                    <option value="">Choose Branch</option>
                                    {branches.map((b) => (
                                        <option key={b.branchId} value={String(b.branchId)}>
                                            {(b.cityName || `Branch #${b.branchId}`).trim()}
                                        </option>
                                    ))}

                                </select>
                            </div>
                        )}

                        {/* Delivery (editable in edit mode too) */}
                        {method === "delivery" && (
                            <div className="mt-3">
                                <div className="row g-3">
                                    {/* City */}
                                    <div className="col-md-6" ref={cityWrapRef} style={{ position: "relative" }}>
                                        <label className="form-label fw-bold">City</label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={cities.length === 0 ? "Loading cities..." : "Select city or start typing"}
                                            value={cityQuery}
                                            onChange={handleCityInputChange}
                                            onFocus={handleCityInputFocus}
                                            onKeyDown={handleCityKeyDown}
                                            disabled={(cities || []).length === 0}
                                            autoComplete="off"
                                        />

                                        {showCityDropdown && (filteredCities || []).length > 0 && (
                                            <ul
                                                className="list-group position-absolute w-100"
                                                style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}
                                            >
                                                {filteredCities.map((c, idx) => (
                                                    <li
                                                        key={c.cityId ?? c.CityId ?? idx}
                                                        className={`list-group-item list-group-item-action ${idx === highlightIndex ? "active" : ""
                                                            }`}
                                                        onMouseDown={(ev) => ev.preventDefault()}
                                                        onClick={() => handleSelectCity(c)}
                                                        onMouseEnter={() => setHighlightIndex(idx)}
                                                    >
                                                        {c.cityName ?? c.CityName}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Block</label>
                                        <input
                                            className="form-control"
                                            value={address.block}
                                            onChange={(e) => setAddress((a) => ({ ...a, block: e.target.value }))}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Road</label>
                                        <input
                                            className="form-control"
                                            value={address.road}
                                            onChange={(e) => setAddress((a) => ({ ...a, road: e.target.value }))}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Building Number / Floor Number</label>
                                        <input
                                            className="form-control"
                                            value={address.buildingFloor}
                                            onChange={(e) =>
                                                setAddress((a) => ({ ...a, buildingFloor: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="d-flex justify-content-center gap-3 mt-4">
                    <button
                        type="submit"
                        className={`btn px-5 ${isEditing ? "qp-edit-btn" : "qp-add-btn"}`}
                        disabled={!isFormReady || loading}
                    >
                        {isEditing ? "Update Prescription Plan" : "Create Prescription Plan"}
                    </button>

                    <button
                        type="button"
                        className="btn btn-danger px-5"
                        onClick={() => {
                            setView("list");
                            resetForm();
                        }}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </div>
            </form>

            <DialogModal
                show={showSaveModal}
                title="Save Changes?"
                body="Are you sure you want to save the changes to this prescription plan?"
                confirmLabel="Save Changes"
                cancelLabel="Cancel"
                onConfirm={handleConfirmSaveChanges}
                onCancel={() => setShowSaveModal(false)}
            />
        </div>
    );
}

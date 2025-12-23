import { useEffect, useMemo, useState } from "react";
import Dropdown from "./DropDown";
import ItemTable from "./ItemTable";
import DialogModal from "./DialogModal";
//import { useNavigate } from "react-router-dom";


export default function IllnessAllergyComponents({
    title,
    singularLabel,
    listDescription,
    formDescription,
    onSuccess,
    mode,   // "illness" | "allergy"
    userId,
}) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const isIllness = mode === "illness";
    const isAllergy = mode === "allergy";

    const [view, setView] = useState("list");
    const [items, setItems] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    // dropdown options fetched from API (NO hardcoding)
    const [nameOptions, setNameOptions] = useState([]);
    const [severityOptions, setSeverityOptions] = useState([]);

    // form data (IDs only)
    const [formData, setFormData] = useState({ nameId: "", severityId: "" });

    const [editingItem, setEditingItem] = useState(null);
    const [errors, setErrors] = useState({});

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteItem, setDeleteItem] = useState(null);
/*
    const navigate = useNavigate();
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const requireLoginForAdd = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        setShowLoginPrompt(true);
    };
*/

    const resetForm = () => {
        setFormData({ nameId: "", severityId: "" });
        setEditingItem(null);
        setErrors({});
    };

    const getLookupUrl = (includeNameId = null) => {
        const endpoint = isIllness ? "illnessNames" : "allergyNames";
        const includeKey = isIllness ? "includeIllnessNameId" : "includeAllergyNameId";
        const includePart = includeNameId ? `&${includeKey}=${includeNameId}` : "";
        return `${API_BASE}/api/HealthProfileLookup/${endpoint}?userId=${userId}${includePart}`;
    };

    const getCrudBase = () => (isIllness ? "HealthProfileIllness" : "HealthProfileAllergy");

    const getRowIdKey = () => (isIllness ? "healthProfileIllnessId" : "healthProfileAllergyId");
    const getRowNameIdKey = () => (isIllness ? "illnessNameId" : "allergyNameId");

    /* =========================
       Load dropdown options
       GET /api/HealthProfileLookup/illnessNames?userId=...
       GET /api/HealthProfileLookup/allergyNames?userId=...
       GET /api/HealthProfileLookup/severities
       ========================= */
    const loadOptions = async (signal, includeNameId = null) => {
        try {
            if (!isIllness && !isAllergy) return;

            if (!userId) {
                setNameOptions([]);
                setSeverityOptions([]);
                return;
            }

            // names (illness/allergy)
            const r1 = await fetch(getLookupUrl(includeNameId), {
                credentials: "include",
                signal,
                headers: { "Content-Type": "application/json" },
            });

            if (r1.ok) {
                const d1 = await r1.json();
                const list1 = Array.isArray(d1?.items) ? d1.items : [];

                setNameOptions(
                    list1.map((x) => ({
                        value: isIllness ? x.illnessNameId : x.allergyNameId,
                        label: isIllness ? x.illnessName : x.allergyName,
                        typeName: isIllness ? x.illnessTypeName : x.allergyTypeName,
                    }))
                );
            } else {
                setNameOptions([]);
            }

            // severities
            const r2 = await fetch(`${API_BASE}/api/HealthProfileLookup/severities`, {
                credentials: "include",
                signal,
                headers: { "Content-Type": "application/json" },
            });

            if (r2.ok) {
                const d2 = await r2.json();
                const list2 = Array.isArray(d2?.items) ? d2.items : [];
                setSeverityOptions(list2.map((x) => ({ value: x.severityId, label: x.severityName })));
            } else {
                setSeverityOptions([]);
            }
        } catch (e) {
            if (e?.name !== "AbortError") console.error(e);
        }
    };

    useEffect(() => {
        if (!isIllness && !isAllergy) return;

        const controller = new AbortController();
        loadOptions(controller.signal);
        return () => controller.abort();
    }, [API_BASE, mode, userId]);

    /* =========================
       Load table
       GET /api/HealthProfileIllness?userId=...
       GET /api/HealthProfileAllergy?userId=...
       ========================= */
    const loadItems = async (signal) => {
        try {
            if (!isIllness && !isAllergy) return;

            if (!userId) {
                setItems([]);
                return;
            }

            setLoading(true);
            setLoadError("");

            const res = await fetch(`${API_BASE}/api/${getCrudBase()}?userId=${userId}`, {
                credentials: "include",
                signal,
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error(`Failed to load ${title.toLowerCase()}.`);

            const data = await res.json();
            setItems(Array.isArray(data?.items) ? data.items : []);
        } catch (e) {
            if (e?.name !== "AbortError") {
                setLoadError(e?.message || `Error loading ${title.toLowerCase()}.`);
                setItems([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isIllness && !isAllergy) return;

        const controller = new AbortController();
        loadItems(controller.signal);
        return () => controller.abort();
    }, [API_BASE, mode, userId, title]);

    // Auto type display (read-only) based on selected name
    const selectedTypeName = useMemo(() => {
        const id = Number(formData.nameId);
        if (!id) return "";
        return nameOptions.find((o) => Number(o.value) === id)?.typeName || "";
    }, [formData.nameId, nameOptions]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((p) => ({ ...p, [name]: value ? Number(value) : "" }));
        setErrors((p) => ({ ...p, [name]: "" }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.nameId) newErrors.nameId = "Please select a value for name.";
        if (!formData.severityId) newErrors.severityId = "Please select a value for severity.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /* =========================
       Add / Update
       POST /api/HealthProfileIllness?userId=...&illnessNameId=...&severityId=...
       POST /api/HealthProfileAllergy?userId=...&allergyNameId=...&severityId=...
       PUT  /api/HealthProfileIllness/{id}?userId=...&illnessNameId=...&severityId=...
       PUT  /api/HealthProfileAllergy/{id}?userId=...&allergyNameId=...&severityId=...
       ========================= */
    const saveToApi = async () => {
        if (!userId) return;
        if (!validate()) return;

        try {
            setLoadError("");

            const isEdit = !!editingItem;
            const base = getCrudBase();
            const rowIdKey = getRowIdKey();

            const nameQueryKey = isIllness ? "illnessNameId" : "allergyNameId";

            const url = isEdit
                ? `${API_BASE}/api/${base}/${editingItem[rowIdKey]}?userId=${userId}&${nameQueryKey}=${formData.nameId}&severityId=${formData.severityId}`
                : `${API_BASE}/api/${base}?userId=${userId}&${nameQueryKey}=${formData.nameId}&severityId=${formData.severityId}`;

            const res = await fetch(url, {
                credentials: "include",
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(msg || (isEdit ? `Failed to update ${singularLabel.toLowerCase()}.` : `Failed to add ${singularLabel.toLowerCase()}.`));
            }

            const data = await res.json();
            const ok = isEdit ? data?.updated : data?.added;

            if (!ok) {
                throw new Error(
                    isEdit
                        ? `This ${singularLabel.toLowerCase()} already exists or cannot be updated.`
                        : `This ${singularLabel.toLowerCase()} already exists or cannot be added.`
                );
            }

            // Reload list + refresh dropdown options (so added item disappears)
            await loadItems();
            await loadOptions();

            onSuccess?.(isEdit ? `${singularLabel} updated successfully!` : `${singularLabel} added successfully!`);
            resetForm();
            setView("list");
        } catch (e) {
            console.error(e);
            setLoadError(e?.message || "Save failed.");
        }
    };

    /* =========================
       Delete
       DELETE /api/HealthProfileIllness/{id}?userId=...
       DELETE /api/HealthProfileAllergy/{id}?userId=...
       ========================= */
    const confirmDelete = async () => {
        if (!deleteItem || !userId) return;

        try {
            const base = getCrudBase();
            const rowIdKey = getRowIdKey();

            const res = await fetch(
                `${API_BASE}/api/${base}/${deleteItem[rowIdKey]}?userId=${userId}`,
                { method: "DELETE", headers: { "Content-Type": "application/json" } }
            );

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(msg || `Failed to delete ${singularLabel.toLowerCase()}.`);
            }

            const data = await res.json();
            if (!data?.removed) throw new Error(`Could not delete ${singularLabel.toLowerCase()}.`);

            // optimistic list update
            setItems((prev) => prev.filter((x) => x[rowIdKey] !== deleteItem[rowIdKey]));

            // Refresh dropdown options (so deleted comes back)
            await loadOptions();

            setShowDeleteModal(false);
            setDeleteItem(null);
            onSuccess?.(`${singularLabel} deleted successfully!`);
        } catch (e) {
            console.error(e);
            setLoadError(e?.message || "Delete failed.");
            setShowDeleteModal(false);
        }
    };

    const handleEdit = async (item) => {
        const nameIdKey = getRowNameIdKey();

        // ensure dropdown includes current selection
        const controller = new AbortController();
        await loadOptions(controller.signal, item[nameIdKey]);

        setFormData({ nameId: item[nameIdKey], severityId: item.severityId });
        setEditingItem(item);
        setErrors({});
        setView("form");
    };

    const handleDelete = (item) => {
        setDeleteItem(item);
        setShowDeleteModal(true);
    };

    /* =========================
       FORM VIEW
       ========================= */
    if (view === "form") {
        return (
            <div className="health-illness-form">
                <p className="fw-bold mb-4 text-start">{formDescription}</p>

                <form onSubmit={(e) => e.preventDefault()}>
                    <Dropdown
                        label={isIllness ? "Choose the illness name:" : "Choose the allergy name:"}
                        name="nameId"
                        value={formData.nameId ?? ""}
                        onChange={handleChange}
                        placeholder={isIllness ? "Choose Illness Name" : "Choose Allergy Name"}
                        options={nameOptions}
                        error={errors.nameId}
                        className="w-50"
                        disabled={!userId}
                    />

                    {/* Auto type */}
                    <div className="mb-3 w-50">
                        <h5 className="form-label text-start fw-bold">{isIllness ? "Illness type (auto):" : "Allergy type (auto):"}</h5>
                        <input className="form-control" value={selectedTypeName} readOnly />
                    </div>

                    <Dropdown
                        label={isIllness ? "Choose the illness severity:" : "Choose the allergy severity:"}
                        name="severityId"
                        value={formData.severityId ?? ""}
                        onChange={handleChange}
                        placeholder={isIllness ? "Choose Illness Severity" : "Choose Allergy Severity"}
                        options={severityOptions}
                        error={errors.severityId}
                        className="w-50"
                        disabled={!userId}
                    />

                    <div className="d-flex justify-content-center gap-3 mt-3">
                        <button
                            type="button"
                            className={`btn px-5 ${editingItem ? "qp-edit-btn" : "qp-add-btn"}`}
                            disabled={!userId}
                            onClick={() => (editingItem ? setShowSaveModal(true) : saveToApi())}
                        >
                            {editingItem ? "Save Changes" : `Add ${singularLabel}`}
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger px-5"
                            onClick={() => {
                                resetForm();
                                setView("list");
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <DialogModal
                    show={showSaveModal}
                    title={`Save ${singularLabel}?`}
                    body={`Are you sure you want to save changes to this ${singularLabel.toLowerCase()}?`}
                    confirmLabel="Save Changes"
                    cancelLabel="Cancel"
                    onConfirm={() => {
                        setShowSaveModal(false);
                        saveToApi();
                    }}
                    onCancel={() => setShowSaveModal(false)}
                />
            </div>
        );
    }

    /* =========================
       LIST VIEW
       ========================= */
    const columns = isIllness
        ? [
            { key: "illnessName", header: "Name" },
            { key: "illnessTypeName", header: "Type" },
            { key: "severityName", header: "Severity" },
        ]
        : [
            { key: "allergyName", header: "Name" },
            { key: "allergyTypeName", header: "Type" },
            { key: "severityName", header: "Severity" },
        ];

    return (
        <div>
            <p className="fw-bold text-start">{listDescription}</p>

            {loading && <small className="text-muted d-block mb-2">Loading...</small>}
            {loadError && <div className="alert alert-danger">{loadError}</div>}

            <ItemTable
                title={title}
                items={items}
                columns={columns}
                emptyMessage={`No ${title.toLowerCase()} added to the system.`}
                renderActions={(item) => (
                    <div className="d-flex flex-column gap-2 mx-auto" style={{ width: "130px" }}>
                        <button className="btn btn-sm w-100 qp-edit-btn" onClick={() => handleEdit(item)}>
                            Edit {singularLabel}
                        </button>

                        <button className="btn btn-danger btn-sm w-100" onClick={() => handleDelete(item)}>
                            Delete
                        </button>
                    </div>
                )}
            />

            <div className="text-center">
                <button
                    type="button"
                    className="btn qp-add-btn"
                    disabled={!userId}
                    onClick={() => {
                        resetForm();
                        setView("form");
                    }}
                >
                    Add New {singularLabel}
                </button>

                {!userId && <div className="text-muted small mt-2">Login is required.</div>}
            </div>

            <DialogModal
                show={showDeleteModal}
                title={`Delete ${singularLabel}?`}
                body={`Are you sure you want to delete this ${singularLabel.toLowerCase()}?`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setDeleteItem(null);
                }}
            />
        </div>
    );
}

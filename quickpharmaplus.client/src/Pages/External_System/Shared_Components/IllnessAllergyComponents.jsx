import { useState } from "react";
import Dropdown from "./DropDown";
import ItemTable from "./ItemTable";
import DialogModal from "./DialogModal";

export default function IllnessAllergyComponents({
    title,           // e.g. "Illnesses" or "Allergies"
    singularLabel,   // e.g. "Illness" or "Allergy"
    listDescription, // description text shown in LIST view
    formDescription, // description text shown in FORM view
    dropdowns,       // array of field configs
    onSuccess,       
}) {
    const [view, setView] = useState("list"); // "list" or "form"

    // all saved items (illnesses OR allergies)
    const [items, setItems] = useState([]);

    // Build an empty form object from dropdown field names
    const buildEmptyForm = () =>
        dropdowns.reduce((acc, d) => ({ ...acc, [d.name]: "" }), {});

    const [formData, setFormData] = useState(buildEmptyForm());

    // If null adding new; if number ? editing that index
    const [editingIndex, setEditingIndex] = useState(null);

    // Validation errors per field (e.g. { illnessName: "Please select ..." })
    const [errors, setErrors] = useState({});

    // Save / delete modal state
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState(null);

    // Handle dropdown changes (shared for all fields)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Clear error for this field as soon as user selects something
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const resetForm = () => {
        setFormData(buildEmptyForm());
        setEditingIndex(null);
        setErrors({});
    };

    const handleSubmit = (e) => {
        if (e) {
            e.preventDefault();
        }

        const newErrors = {};

        // Validate each dropdown
        dropdowns.forEach((d) => {
            if (!formData[d.name]) {
                newErrors[d.name] = `Please select a value for ${d.columnHeader.toLowerCase()}.`;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (editingIndex === null) {
            // Add new item
            setItems((prev) => [...prev, formData]);
        } else {
            // Update existing item
            setItems((prev) =>
                prev.map((item, idx) => (idx === editingIndex ? formData : item))
            );
        }

        
        if (typeof onSuccess === "function") {
            onSuccess(
                editingIndex === null
                    ? `${singularLabel} added successfully!`
                    : `${singularLabel} updated successfully!`
            );
        }

        resetForm();
        setView("list");
    };


    const handleCancel = () => {
        resetForm();
        setView("list");
    };

    const handleAddNewClick = () => {
        resetForm();
        setView("form");
    };

    const handleEdit = (index) => {
        setFormData(items[index]);
        setEditingIndex(index);
        setErrors({});
        setView("form");
    };

    // Delete flow
    const handleDelete = (index) => {
        setDeleteIndex(index);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        setItems((prev) => prev.filter((_, i) => i !== deleteIndex));
        setShowDeleteModal(false);
        setDeleteIndex(null);

        if (typeof onSuccess === "function") {
            onSuccess(`${singularLabel} deleted successfully!`);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteIndex(null);
    };

    // Save changes flow (edit mode)
    const confirmSave = () => {
        handleSubmit(); // run the real save logic (no event)
        setShowSaveModal(false);
    };

    const cancelSave = () => {
        setShowSaveModal(false);
    };

    // ==================== FORM VIEW ====================
    if (view === "form") {
        return (
            <div className="health-illness-form">
                <p className="fw-bold mb-4 text-start">
                    {formDescription}
                </p>

                <form onSubmit={handleSubmit}>
                    {dropdowns.map((d) => (
                        <Dropdown
                            key={d.name}
                            label={d.label}
                            name={d.name}
                            value={formData[d.name]}
                            onChange={handleChange}
                            placeholder={d.placeholder}
                            options={d.options}
                            error={errors[d.name]}
                            className="w-50"
                        />
                    ))}

                    <div className="d-flex justify-content-center gap-3 mt-3">
                        <button
                            type="button"
                            className={`btn px-5 ${editingIndex === null ? "qp-add-btn" : "qp-edit-btn"
                                }`}
                            onClick={() => {
                                if (editingIndex === null) {
                                    // Normal add
                                    handleSubmit();
                                } else {
                                    // Editing show confirmation modal
                                    setShowSaveModal(true);
                                }
                            }}
                        >
                            {editingIndex === null
                                ? `Add ${singularLabel}`
                                : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger px-5"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                {/* Save changes confirmation modal (form view) */}
                <DialogModal
                    show={showSaveModal}
                    title={`Save ${singularLabel}?`}
                    body={`Are you sure you want to save changes to this ${singularLabel.toLowerCase()}?`}
                    confirmLabel="Save Changes"
                    cancelLabel="Cancel"
                    onConfirm={confirmSave}
                    onCancel={cancelSave}
                />
            </div>
        );
    }

    
    // ==================== LIST VIEW ====================
    return (
        <div>
            <p className="fw-bold text-start">
                {listDescription}
            </p>

            <ItemTable
                title={title}
                items={items}
                columns={dropdowns.map((d) => ({
                    key: d.name,
                    header: d.columnHeader,
                }))}
                emptyMessage={`No ${title.toLowerCase()} added to the system.`}
                renderActions={(_, index) => (
                    <div
                        className="d-flex flex-column gap-2 mx-auto"
                        style={{ width: "130px" }}
                    >
                        <button
                            className="btn btn-sm w-100 qp-edit-btn"
                            onClick={() => handleEdit(index)}
                        >
                            Edit {singularLabel}
                        </button>

                        <button
                            className="btn btn-danger btn-sm w-100"
                            onClick={() => handleDelete(index)}
                        >
                            Delete
                        </button>
                    </div>
                )}
            />

            <div className="text-center">
                <button
                    type="button"
                    className="btn qp-add-btn"
                    onClick={handleAddNewClick}
                >
                    Add New {singularLabel}
                </button>
            </div>

            {/* Delete confirmation modal */}
            <DialogModal
                show={showDeleteModal}
                title={`Delete ${singularLabel}?`}
                body={`Are you sure you want to delete this ${singularLabel.toLowerCase()}?`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );

}

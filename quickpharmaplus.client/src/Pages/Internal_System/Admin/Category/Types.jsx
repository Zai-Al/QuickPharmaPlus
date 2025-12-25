import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./CategoryList.css";

import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";

export default function CategoryTypes() {
    const { categoryId } = useParams();
    const [categoryName, setCategoryName] = useState("");

    const [types, setTypes] = useState([]);

    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteTypeName, setDeleteTypeName] = useState("");
    const [productCount, setProductCount] = useState(0);
    const [loadingDeleteInfo, setLoadingDeleteInfo] = useState(false);

    const [showAddPopup, setShowAddPopup] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");
    const [typeNameError, setTypeNameError] = useState("");

    // EDIT STATE
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editTypeName, setEditTypeName] = useState("");
    const [originalEditTypeName, setOriginalEditTypeName] = useState("");
    const [editTypeNameError, setEditTypeNameError] = useState("");

    // Validation pattern (same as categories)
    const validTypeNamePattern = /^[A-Za-z .\-']*$/;

    // ===========================================
    // FETCH TYPES
    // ===========================================
    async function fetchTypes() {
        if (!categoryId) return;

        try {
            const res = await fetch(
                `/api/category/types/${categoryId}?pageNumber=${currentPage}&pageSize=${pageSize}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!res.ok) {
                throw new Error(`Failed to load types (${res.status})`);
            }

            const data = await res.json();

            setTypes(data.items ?? []);
            const count = data.totalCount ?? 0;
            setTotalCount(count);
            setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
        } catch (err) {
            console.error("Failed to fetch types:", err);
        }
    }

    useEffect(() => {
        fetchTypes();
        fetchCategoryName();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, categoryId]);

    // ===========================================
    // VALIDATE TYPE NAME
    // ===========================================
    const validateTypeName = (value) => {
        if (!value.trim()) return "Type name is required.";
        if (value.trim().length < 3) return "Type name must be at least 3 characters.";
        return "";
    };

    // ===========================================
    // CHECK FOR DUPLICATE TYPE NAME (FOR ADD)
    // ===========================================
    const checkDuplicateTypeName = async (name) => {
        if (!name.trim() || name.trim().length < 3) return;

        try {
            const response = await fetch(
                `/api/Category/type/check-name?name=${encodeURIComponent(name.trim())}&categoryId=${categoryId}`,
                { credentials: "include" }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.exists) {
                    setTypeNameError("A type with this name already exists in this category.");
                }
            }
        } catch (error) {
            console.error("Error checking duplicate type name:", error);
        }
    };

    // ===========================================
    // CHECK FOR DUPLICATE TYPE NAME (FOR EDIT)
    // ===========================================
    const checkDuplicateTypeNameForEdit = async (name) => {
        // Don't check if name hasn't changed
        if (name.trim().toLowerCase() === originalEditTypeName.trim().toLowerCase()) {
            return;
        }

        if (!name.trim() || name.trim().length < 3) return;

        try {
            const response = await fetch(
                `/api/Category/type/check-name?name=${encodeURIComponent(name.trim())}&categoryId=${categoryId}&excludeTypeId=${editId}`,
                { credentials: "include" }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.exists) {
                    setEditTypeNameError("A type with this name already exists in this category.");
                }
            }
        } catch (error) {
            console.error("Error checking duplicate type name:", error);
        }
    };

    // ===========================================
    // HANDLE TYPE NAME CHANGE (ADD)
    // ===========================================
    const handleTypeNameChange = (e) => {
        const value = e.target.value;

        if (!validTypeNamePattern.test(value)) {
            setTypeNameError("Only letters, spaces, dash (-), dot (.), and ' allowed.");
            return;
        }

        setNewTypeName(value);
        setTypeNameError(validateTypeName(value));
    };

    // ===========================================
    // HANDLE TYPE NAME CHANGE (EDIT)
    // ===========================================
    const handleEditTypeNameChange = (e) => {
        const value = e.target.value;

        if (!validTypeNamePattern.test(value)) {
            setEditTypeNameError("Only letters, spaces, dash (-), dot (.), and ' allowed.");
            return;
        }

        setEditTypeName(value);
        setEditTypeNameError(validateTypeName(value));
    };

    // ===========================================
    // ADD TYPE (MATCH SERVER MODEL)
    // ===========================================
    async function addType() {
        const error = validateTypeName(newTypeName);
        setTypeNameError(error);

        if (error) return;

        try {
            const res = await fetch(`/api/category/types/${categoryId}/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newTypeName) // server expects raw string body
            });

            if (res.status === 409) {
                // Conflict - duplicate name
                setTypeNameError("A type with this name already exists in this category.");
                return;
            }

            if (!res.ok) throw new Error("Failed adding type");

            setShowAddPopup(false);
            setNewTypeName("");
            setTypeNameError("");
            setCurrentPage(1); // Reset to first page after adding

            fetchTypes();
        } catch (err) {
            console.error("Error adding type:", err);
        }
    }

    // ===========================================
    // HANDLE EDIT CLICK
    // ===========================================
    function handleEditClick(typeId, typeName) {
        setEditId(typeId);
        setEditTypeName(typeName);
        setOriginalEditTypeName(typeName);
        setEditTypeNameError("");
        setShowEditPopup(true);
    }

    // ===========================================
    // UPDATE TYPE
    // ===========================================
    async function updateType() {
        const error = validateTypeName(editTypeName);
        setEditTypeNameError(error);

        if (error) return;

        try {
            const res = await fetch(`/api/category/type/${editId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(editTypeName) // server expects raw string body
            });

            if (res.status === 409) {
                // Conflict - duplicate name
                setEditTypeNameError("A type with this name already exists in this category.");
                return;
            }

            if (!res.ok) throw new Error("Failed updating type");

            setShowEditPopup(false);
            setEditId(null);
            setEditTypeName("");
            setOriginalEditTypeName("");
            setEditTypeNameError("");

            fetchTypes();
        } catch (err) {
            console.error("Error updating type:", err);
        }
    }

    // ===========================================
    // CLOSE EDIT POPUP
    // ===========================================
    function handleCloseEditPopup() {
        setShowEditPopup(false);
        setEditId(null);
        setEditTypeName("");
        setOriginalEditTypeName("");
        setEditTypeNameError("");
    }

    // ===========================================
    // FETCH TYPE DETAILS FOR DELETE
    // ===========================================
    async function handleDeleteClick(typeId, typeName) {
        setDeleteId(typeId);
        setDeleteTypeName(typeName);
        setShowDeleteModal(true);
        setLoadingDeleteInfo(true);

        try {
            // Fetch type details including product count
            const res = await fetch(`/api/category/type/${typeId}/details`, {
                method: "GET",
                credentials: "include"
            });

            if (res.ok) {
                const data = await res.json();
                setProductCount(data.productCount || 0);
            } else {
                setProductCount(0);
            }
        } catch (err) {
            console.error("Failed to fetch type details:", err);
            setProductCount(0);
        } finally {
            setLoadingDeleteInfo(false);
        }
    }

    // ===========================================
    // DELETE TYPE
    // ===========================================
    async function deleteType() {
        if (!deleteId) return;

        try {
            const res = await fetch(`/api/category/type/${deleteId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!res.ok) throw new Error("Failed deleting type");

            setShowDeleteModal(false);
            setDeleteId(null);
            setDeleteTypeName("");
            setProductCount(0);

            // If deleting the last item on current page, go to previous page
            if (types.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchTypes();
            }
        } catch (err) {
            console.error("Error deleting type:", err);
        }
    }

    // ===========================================
    // CLOSE DELETE MODAL
    // ===========================================
    function handleCloseDeleteModal() {
        setShowDeleteModal(false);
        setDeleteId(null);
        setDeleteTypeName("");
        setProductCount(0);
    }

    // ===========================================
    // CLOSE ADD POPUP
    // ===========================================
    function handleCloseAddPopup() {
        setShowAddPopup(false);
        setNewTypeName("");
        setTypeNameError("");
    }

    // ===========================================
    //  FETCH CATEGORY NAME
    // ===========================================
    async function fetchCategoryName() {
        try {
            const res = await fetch(`/api/category/${categoryId}`, {
                method: "GET",
                credentials: "include"
            });

            if (!res.ok) throw new Error("Failed to load category");

            const data = await res.json();
            setCategoryName(data.categoryName ?? "Category");
        } catch (err) {
            console.error("Error loading category name:", err);
            setCategoryName("Category"); // fallback
        }
    }

    // ===========================================
    // TABLE STRUCTURE
    // ===========================================
    const columns = [
        { key: "productTypeName", label: "Type Name" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        edit: (row) => (
            <EditButton onClick={() => handleEditClick(row.productTypeId, row.productTypeName)} />
        ),
        delete: (row) => (
            <DeleteButton
                onClick={() => handleDeleteClick(row.productTypeId, row.productTypeName)}
            />
        )
    };

    return (
        <div className="categories-page">
            <h2 className="text-center fw-bold categories-title">
                {categoryName ? `${categoryName}` : ""} - Category Types
            </h2>

            <FilterSection>
                <FilterLeft></FilterLeft>
                <FilterRight>
                    <button
                        className="page-add-btn-custom d-flex align-items-center"
                        onClick={() => setShowAddPopup(true)}
                    >
                        <i className="bi bi-plus-circle fs-5 me-3"></i>
                        Add New Type
                    </button>
                </FilterRight>
            </FilterSection>

            <DataTable
                columns={columns}
                data={types}
                renderMap={renderMap}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* DELETE MODAL - ENHANCED WITH PRODUCT COUNT */}
            <DeleteModal
                show={showDeleteModal}
                onClose={handleCloseDeleteModal}
                onConfirm={deleteType}
                title="Confirm Type Deletion"
                message={
                    loadingDeleteInfo
                        ? "Loading type details..."
                        : `Are you sure you want to delete the type "${deleteTypeName}"?`
                }
            >
                {!loadingDeleteInfo && productCount > 0 && (
                    <div className="delete-warning-info">
                        <p className="fw-bold mb-2">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            Warning: This action cannot be undone!
                        </p>
                        <p className="mb-2">Deleting this type will:</p>
                        <ul className="mb-0">
                            <li>
                                Modify <strong>{productCount}</strong> product{productCount !== 1 ? "s" : ""} to "Not Defined" type
                            </li>
                        </ul>
                    </div>
                )}
            </DeleteModal>

            {/* ADD TYPE POPUP WITH VALIDATION */}
            {showAddPopup && (
                <div className="custom-popup-overlay">
                    <div className="custom-popup-box">
                        <h4 className="fw-bold mb-3 text-center">Add New Type</h4>

                        <input
                            type="text"
                            className={`form-control mb-1 ${typeNameError ? "is-invalid" : ""}`}
                            placeholder="Enter Type Name"
                            value={newTypeName}
                            onChange={handleTypeNameChange}
                            onBlur={() => checkDuplicateTypeName(newTypeName)}
                        />

                        {typeNameError && (
                            <div className="invalid-feedback d-block mb-2" style={{ fontSize: "0.85rem" }}>
                                {typeNameError}
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button className="btn-cancel-popup" onClick={handleCloseAddPopup}>
                                Cancel
                            </button>
                            <button
                                className="btn-add-popup"
                                onClick={addType}
                                disabled={!!typeNameError || !newTypeName.trim()}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT TYPE POPUP WITH VALIDATION */}
            {showEditPopup && (
                <div className="custom-popup-overlay">
                    <div className="custom-popup-box">
                        <h4 className="fw-bold mb-3 text-center">Edit Type</h4>

                        <input
                            type="text"
                            className={`form-control mb-1 ${editTypeNameError ? "is-invalid" : ""}`}
                            placeholder="Enter Type Name"
                            value={editTypeName}
                            onChange={handleEditTypeNameChange}
                            onBlur={() => checkDuplicateTypeNameForEdit(editTypeName)}
                        />

                        {editTypeNameError && (
                            <div className="invalid-feedback d-block mb-2" style={{ fontSize: "0.85rem" }}>
                                {editTypeNameError}
                            </div>
                        )}

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button className="btn-cancel-popup" onClick={handleCloseEditPopup}>
                                Cancel
                            </button>
                            <button
                                className="btn-save-popup"
                                onClick={updateType}
                                disabled={!!editTypeNameError || !editTypeName.trim()}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
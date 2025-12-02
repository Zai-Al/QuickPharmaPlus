import { useState } from "react";
import "./CategoryList.css"; // Using the same CSS as requested

// Shared components
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";

export default function CategoryTypes() {

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Add Type popup
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");

    // Fake types list
    const types = [
        { id: 1, typeName: "Tablet" },
        { id: 2, typeName: "Capsule" },
        { id: 3, typeName: "Syrup" },
        { id: 4, typeName: "Injection" }
    ];

    // TABLE STRUCTURE
    const columns = [
        { key: "typeName", label: "Type Name" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        edit: (row) => (
            <EditButton to={`/category/type/edit/${row.id}`} />
        ),
        delete: (row) => (
            <DeleteButton
                onClick={() => {
                    setDeleteId(row.id);
                    setShowDeleteModal(true);
                }}
            />
        )
    };

    return (
        <div className="categories-page">

            {/* PAGE TITLE */}
            <h2 className="text-center fw-bold categories-title">
                (CategoryName) Types
            </h2>

            {/* FILTER SECTION */}
            <FilterSection>
                <FilterLeft></FilterLeft>
                <FilterRight>
                    {/* CUSTOM ADD BUTTON */}
                    <button
                        className="page-add-btn-custom d-flex align-items-center"
                        onClick={() => setShowAddPopup(true)}
                    >
                        <i className="bi bi-plus-circle fs-5 me-3"></i>
                        Add New Type
                    </button>
                </FilterRight>
            </FilterSection>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={types}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => {
                    console.log("Deleting type:", deleteId);
                    setShowDeleteModal(false);
                }}
                message="Are you sure you want to delete this type?"
            />

            {/* ADD TYPE POPUP */}
            {showAddPopup && (
                <div className="custom-popup-overlay">
                    <div className="custom-popup-box">

                        <h4 className="fw-bold mb-3 text-center">Add New Type</h4>

                        <input
                            type="text"
                            className="form-control mb-3"
                            placeholder="Enter Type Name"
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                        />

                        <div className="d-flex justify-content-end gap-2">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowAddPopup(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    console.log("Adding new type:", newTypeName);
                                    setShowAddPopup(false);
                                    setNewTypeName("");
                                }}
                            >
                                Add
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

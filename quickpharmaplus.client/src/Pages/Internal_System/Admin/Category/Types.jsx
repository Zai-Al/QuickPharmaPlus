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

    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const { categoryId } = useParams();
    const [categoryName, setCategoryName] = useState("");

    const [types, setTypes] = useState([]);

    const [totalCount, setTotalCount] = useState(0);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const [showAddPopup, setShowAddPopup] = useState(false);
    const [newTypeName, setNewTypeName] = useState("");

    // ===========================================
    // FETCH TYPES USING fetch() + ENV VAR
    // ===========================================
    async function fetchTypes() {
        if (!categoryId) return;

        try {
            const res = await fetch(
                `${baseURL}/api/category/types/${categoryId}?pageNumber=${currentPage}&pageSize=${pageSize}`,
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
            setTotalCount(data.totalCount ?? 0);

        } catch (err) {
            console.error("Failed to fetch types:", err);
        }
    }

    useEffect(() => {
        fetchTypes();
        fetchCategoryName();
    }, [currentPage, categoryId]);




    // ===========================================
    // ADD TYPE (MATCH SERVER MODEL)
    // ===========================================
    async function addType() {
        if (!newTypeName.trim()) return;

        try {
            const res = await fetch(
                `${baseURL}/api/category/types/${categoryId}/add`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(newTypeName) // server expects raw string body
                }
            );

            if (!res.ok) throw new Error("Failed adding type");

            setShowAddPopup(false);
            setNewTypeName("");

            fetchTypes();

        } catch (err) {
            console.error("Error adding type:", err);
        }
    }

    // ===========================================
    // DELETE TYPE
    // ===========================================
    async function deleteType() {
        if (!deleteId) return;

        try {
            const res = await fetch(
                `${baseURL}/api/category/type/${deleteId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            if (!res.ok) throw new Error("Failed deleting type");

            setShowDeleteModal(false);
            fetchTypes();

        } catch (err) {
            console.error("Error deleting type:", err);
        }
    }

    // ===========================================
    //  FETCH CATEGORY NAME 
    // ===========================================
    async function fetchCategoryName() {
        try {
            const res = await fetch(
                `${baseURL}/api/category/${categoryId}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

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
            <EditButton to={`/category/type/edit/${row.productTypeId}`} />
        ),
        delete: (row) => (
            <DeleteButton
                onClick={() => {
                    setDeleteId(row.productTypeId);
                    setShowDeleteModal(true);
                }}
            />
        )
    };

    return (
        <div className="categories-page">

            <h2 className="text-center fw-bold categories-title">
                <h2 className="text-center fw-bold categories-title">
                    {categoryName ? `${categoryName}` : ""} - Category Types
                </h2>
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
                totalItems={totalCount}
                itemsPerPage={pageSize}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />

            <DeleteModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={deleteType}
                message="Are you sure you want to delete this type?"
            />

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
                            <button className="btn btn-secondary" onClick={() => setShowAddPopup(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={addType}>
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

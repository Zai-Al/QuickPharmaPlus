import { useState, useEffect, useRef } from "react";
import "./CategoryList.css";

// Shared components
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import ClearButton from "../../../../Components/InternalSystem/Buttons/ClearButton";
import PageAddButton from "../../../../Components/InternalSystem/Buttons/PageAddButton";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import ViewButton from "../../../../Components/InternalSystem/Buttons/ViewButton";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";

export default function CategoryList() {
    // === STATE ===
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // === SEARCH STATE ===
    const [nameSearch, setNameSearch] = useState("");
    const [idSearch, setIdSearch] = useState("");

    // === VALIDATION STATE ===
    const [nameError, setNameError] = useState("");
    const [idError, setIdError] = useState("");

    // Patterns
    const validNamePattern = /^[A-Za-z\s-]*$/;
    const validIdPattern = /^[0-9]*$/;

    const searchDebounceRef = useRef(null);

    // === DELETE MODAL STATE ===
    const [deleteId, setDeleteId] = useState(null);
    const [deleteCategoryName, setDeleteCategoryName] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [typeCount, setTypeCount] = useState(0);
    const [productCount, setProductCount] = useState(0);
    const [loadingDeleteInfo, setLoadingDeleteInfo] = useState(false);

    // === PAGING ===
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // === FETCH WHEN PAGE OR SEARCH CHANGES ===
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        searchDebounceRef.current = setTimeout(() => {
            fetchCategories();
        }, 300);

        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, nameSearch, idSearch]);

    // === FETCH CATEGORIES ===
    async function fetchCategories() {
        setLoading(true);
        setError("");

        try {
            let searchParam = "";

            if (idSearch.trim()) searchParam = idSearch.trim();
            else if (nameSearch.trim()) searchParam = nameSearch.trim();

            const res = await fetch(
                `/api/category?pageNumber=${currentPage}&pageSize=${pageSize}` +
                (searchParam ? `&search=${encodeURIComponent(searchParam)}` : ""),
                { method: "GET", credentials: "include" }
            );

            if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);

            const data = await res.json();

            const mapped = (data.items || []).map((c) => ({
                id: c.categoryId,
                name: c.categoryName,
                productCount: c.productCount ?? 0,
            }));

            setCategories(mapped);
            setTotalPages(Math.ceil((data.totalCount ?? mapped.length) / pageSize));
        } catch (err) {
            console.error("Fetch categories error:", err);
            setError("Unable to load categories.");
        } finally {
            setLoading(false);
        }
    }

    // === FETCH DELETE DETAILS ===
    async function handleDeleteClick(categoryId, categoryName, productCount) {
        setDeleteId(categoryId);
        setDeleteCategoryName(categoryName);
        setProductCount(productCount);
        setShowModal(true);
        setLoadingDeleteInfo(true);

        try {
            // Fetch types for this category
            const res = await fetch(
                `/api/category/types/${categoryId}?pageNumber=1&pageSize=1000`,
                { method: "GET", credentials: "include" }
            );

            if (res.ok) {
                const data = await res.json();
                setTypeCount(data.totalCount || 0);
            } else {
                setTypeCount(0);
            }
        } catch (err) {
            console.error("Failed to fetch category types:", err);
            setTypeCount(0);
        } finally {
            setLoadingDeleteInfo(false);
        }
    }

    // === DELETE ===
    async function handleDeleteConfirm() {
        if (!deleteId) {
            setShowModal(false);
            return;
        }

        try {
            const res = await fetch(`/api/category/${deleteId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Deletion failed");

            // Refresh the list
            fetchCategories();
        } catch (err) {
            console.error("Delete category error:", err);
            setError("Failed to delete category. Please try again.");
        } finally {
            setDeleteId(null);
            setDeleteCategoryName("");
            setTypeCount(0);
            setProductCount(0);
            setShowModal(false);
        }
    }

    // === CLOSE MODAL ===
    function handleCloseModal() {
        setShowModal(false);
        setDeleteId(null);
        setDeleteCategoryName("");
        setTypeCount(0);
        setProductCount(0);
    }

    // ============================
    // LIVE VALIDATION HANDLERS
    // ============================

    function handleNameChange(e) {
        const value = e.target.value;

        if (!validNamePattern.test(value)) {
            setNameError("Only letters, spaces and dashes allowed.");
            return;
        }

        setNameError("");
        setNameSearch(value);
        setCurrentPage(1);
    }

    function handleIdChange(e) {
        const value = e.target.value;

        if (!validIdPattern.test(value)) {
            setIdError("Only numbers allowed.");
            return;
        }

        setIdError("");
        setIdSearch(value);
        setCurrentPage(1);
    }

    // ============================
    // CLEAR FILTERS
    // ============================
    function handleClearFilters() {
        setNameSearch("");
        setIdSearch("");
        setNameError("");
        setIdError("");

        if (currentPage !== 1) setCurrentPage(1);
        else fetchCategories();
    }

    // === COLUMNS ===
    const columns = [
        { key: "name", label: "Category Name" },
        { key: "productCount", label: "Number of Products" },
        { key: "view", label: "View Types" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" },
    ];

    const renderMap = {
        view: (row) => <ViewButton to={`/categories/types/${row.id}`} text="View Types" />,
        edit: (row) => <EditButton to={`/categories/edit/${row.id}`} />,
        delete: (row) => (
            <DeleteButton
                onClick={() => handleDeleteClick(row.id, row.name, row.productCount)}
            />
        ),
    };

    return (
        <div className="categories-page">
            <h2 className="text-center fw-bold categories-title">Categories</h2>

            {/* FILTER SECTION */}
            <FilterSection>
                <FilterLeft>
                    {/* CATEGORY NAME */}
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter category name for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${nameError ? "is-invalid" : ""}`}
                            placeholder="Search Category by Name"
                            value={nameSearch}
                            onChange={handleNameChange}
                        />

                        <div style={{ height: "20px" }}>
                            {nameError && <div className="invalid-feedback d-block">{nameError}</div>}
                        </div>
                    </div>

                    {/* CATEGORY ID */}
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter category ID for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${idError ? "is-invalid" : ""}`}
                            placeholder="Search Category by ID"
                            value={idSearch}
                            onChange={handleIdChange}
                        />

                        <div style={{ height: "20px" }}>
                            {idError && <div className="invalid-feedback d-block">{idError}</div>}
                        </div>
                    </div>
                </FilterLeft>

                <FilterRight>
                    <ClearButton onClear={handleClearFilters} />
                    <PageAddButton to="/categories/add" text="Add New Category" />
                </FilterRight>
            </FilterSection>

            {/* STATUS */}
            {loading && <div className="text-center text-muted my-3">Loading categories...</div>}
            {error && <div className="alert alert-danger w-50">{error}</div>}

            {/* TABLE */}
            <DataTable columns={columns} data={categories} renderMap={renderMap} />

            {/* PAGINATION */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={handleCloseModal}
                onConfirm={handleDeleteConfirm}
                title="Confirm Category Deletion"
                message={
                    loadingDeleteInfo
                        ? "Loading category details..."
                        : `Are you sure you want to delete the category "${deleteCategoryName}"?`
                }
            >
                {!loadingDeleteInfo && (typeCount > 0 || productCount > 0) && (
                    <div className="delete-warning-info">
                        <p className="fw-bold mb-2">
                            <i className="bi bi-exclamation-circle me-1"></i>
                            Warning: This action cannot be undone!
                        </p>
                        <p className="mb-2">Deleting this category will:</p>
                        <ul className="mb-0">
                            {typeCount > 0 && (
                                <li>
                                    Permanently delete <strong>{typeCount}</strong> category type{typeCount !== 1 ? "s" : ""}
                                </li>
                            )}
                            {productCount > 0 && (
                                <li>
                                    Modify <strong>{productCount}</strong> product{productCount !== 1 ? "s" : ""} to "Not Defined" category
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </DeleteModal>
        </div>
    );
}
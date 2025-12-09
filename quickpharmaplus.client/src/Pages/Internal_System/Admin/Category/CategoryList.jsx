import { useState, useEffect, useRef } from "react";
import "./CategoryList.css";

// Shared components
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import PageAddButton from "../../../../Components/InternalSystem/Buttons/PageAddButton";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import ViewButton from "../../../../Components/InternalSystem/Buttons/ViewButton";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";

export default function CategoryList() {

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // === STATE ===
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // === SEARCH STATE ===
    const [nameSearch, setNameSearch] = useState("");
    const [idSearch, setIdSearch] = useState("");
    const searchDebounceRef = useRef(null);

    // === DELETE MODAL STATE ===
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

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

    // === FETCH CATEGORIES (connected to backend filtering) ===
    async function fetchCategories() {
        setLoading(true);
        setError("");

        try {
            let searchParam = "";

            // If user typed ID, backend detects numeric → exact filter applies
            if (idSearch.trim()) {
                searchParam = idSearch.trim();
            }
            // Otherwise if name entered, send it (backend does StartsWith)
            else if (nameSearch.trim()) {
                searchParam = nameSearch.trim();
            }

            const res = await fetch(
                `${baseURL}/api/category?pageNumber=${currentPage}&pageSize=${pageSize}` +
                (searchParam ? `&search=${encodeURIComponent(searchParam)}` : ""),
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                throw new Error(`Failed to load categories (${res.status})`);
            }

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

    // === DELETE CATEGORY USING FETCH() ===
    async function handleDeleteConfirm() {
        if (!deleteId) {
            setShowModal(false);
            return;
        }

        try {
            const res = await fetch(`${baseURL}/api/category/${deleteId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Deletion failed");

            // Refresh after delete
            fetchCategories();

        } catch (err) {
            console.error("Delete category error:", err);
        } finally {
            setDeleteId(null);
            setShowModal(false);
        }
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
        view: (row) => (
            <ViewButton to={`/categories/types/${row.id}`} text="View Types" />
        ),
        edit: (row) => <EditButton to={`/categories/edit/${row.id}`} />,
        delete: (row) => (
            <DeleteButton
                onClick={() => {
                    setDeleteId(row.id);
                    setShowModal(true);
                }}
            />
        ),
    };

    return (
        <div className="categories-page">
            <h2 className="text-center fw-bold categories-title">Categories</h2>

            {/* FILTER SECTION */}
            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter category name for automatic search</div>
                        <SearchTextField
                            placeholder="Search Category by Name"
                            value={nameSearch}
                            onChange={(e) => {
                                setNameSearch(e.target.value);
                                setCurrentPage(1); // reset on filter
                            }}
                        />
                    </div>

                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter category ID for automatic search</div>
                        <SearchTextField
                            placeholder="Search Category by ID"
                            value={idSearch}
                            onChange={(e) => {
                                setIdSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </FilterLeft>

                <FilterRight>
                    <PageAddButton to="/categories/add" text="Add New Category" />
                </FilterRight>
            </FilterSection>

            {/* STATUS */}
            {loading && <div className="text-center text-muted my-3">Loading categories...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* TABLE */}
            <DataTable columns={columns} data={categories} renderMap={renderMap} />

            {/* PAGINATION */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDeleteConfirm}
                message="Are you sure you want to delete this category?"
            />
        </div>
    );
}

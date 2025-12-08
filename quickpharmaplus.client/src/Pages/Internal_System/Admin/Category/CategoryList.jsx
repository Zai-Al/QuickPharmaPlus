import { useState, useEffect } from "react";
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
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // fetched categories
    const [categories, setCategories] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Table columns
    const columns = [
        { key: "name", label: "Category Name" },
        { key: "productCount", label: "Number of Products" },
        { key: "view", label: "View Types" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    async function fetchCategories(search = "") {
        try {
            const url = `/api/category?pageNumber=${currentPage}&pageSize=${pageSize}` + (search ? `&search=${encodeURIComponent(search)}` : "");
            const res = await fetch(url);
            if (!res.ok) {
                console.error("Failed to fetch categories", res.statusText);
                return;
            }
            const data = await res.json();

            // Map API shape to table shape (DataTable expects { id, name, productCount })
            const mapped = (data.items || []).map(c => ({
                id: c.categoryId,
                name: c.categoryName,
                productCount: c.productCount ?? 0
            }));

            setCategories(mapped);
            setTotalCount(data.totalCount ?? mapped.length);
        } catch (err) {
            console.error(err);
        }
    }

    // Button renderers
    const renderMap = {
        view: (row) => (
            // pass the category id in the route so the types page can fetch types for this category
            <ViewButton to={`/categories/types/${row.id}`} text="View Types" />
        ),
        edit: (row) => (
            <EditButton to={`/categories/edit/${row.id}`} />
        ),
        delete: (row) => (
            <DeleteButton
                onClick={() => {
                    setDeleteId(row.id);
                    setShowModal(true);
                }}
            />
        )
    };

    return (
        <div className="categories-page">

            {/* PAGE TITLE */}
            <h2 className="text-center fw-bold categories-title">
                Categories
            </h2>

            {/* FILTER SECTION (NO SEARCH BUTTON) */}
            <FilterSection>
                {/* LEFT FILTERS */}
                <FilterLeft>
                    <SearchTextField placeholder="Search Category by Name" />
                    <SearchTextField placeholder="Search Category by ID" />
                </FilterLeft>

                {/* RIGHT FILTER (Add Button) */}
                <FilterRight>
                    <PageAddButton to="/categories/add" text="Add New Category" />
                </FilterRight>
            </FilterSection>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={categories}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination
                totalItems={totalCount}
                itemsPerPage={pageSize}
                currentPage={currentPage}
                onPageChange={(page) => setCurrentPage(page)}
            />

            {/* DELETE CONFIRMATION MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={() => {
                    console.log("Deleting category:", deleteId);
                    setShowModal(false);
                }}
                message="Are you sure you want to delete this category?"
            />

        </div>
    );
}

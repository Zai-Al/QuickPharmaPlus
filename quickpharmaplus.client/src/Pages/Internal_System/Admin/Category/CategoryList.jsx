import { useState } from "react";
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

import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";

export default function CategoryList() {
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Fake sample category data (structure must match screenshot)
    const categories = [
        { id: 1, name: "Analgesic", productCount: 14 },
    ];

    // Table columns
    const columns = [
        { key: "name", label: "Category Name" },
        { key: "productCount", label: "Number of Products" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    // Button renderers
    const renderMap = {
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
            <Pagination />

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

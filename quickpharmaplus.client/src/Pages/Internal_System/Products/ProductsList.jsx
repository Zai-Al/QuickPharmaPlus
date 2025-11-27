import { useState } from "react";
import "./ProductsList.css";

// Reusable Components
import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../Components/InternalSystem/Buttons/DeleteButton";
import AddButton from "../../../Components/InternalSystem/Buttons/AddButton";


import ViewButton from "../../../Components/InternalSystem/Buttons/ViewButton";
import SearchTextField from "../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../Components/InternalSystem/Modals/DeleteModal";
import FilterDropdown from "../../../Components/InternalSystem/GeneralComponents/FilterDropdown";


export default function ProductsList() {
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Fake placeholder data (one row ONLY)
    const products = [
        {
            id: 1,
            name: "Panadol",
            category: "Analgesic",
            supplier: "Pharma Gulf",
            price: "1.200",
            controlled: "Yes",
        }
    ];

    // Table columns
    const columns = [
        { key: "name", label: "Product Name" },
        { key: "category", label: "Category" },
        { key: "supplier", label: "Supplier" },
        { key: "price", label: "Unit Price" },
        { key: "controlled", label: "Control" },
        { key: "view", label: "View Details" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    // Custom rendering for special columns
    const renderMap = {
        view: (row) => <ViewButton to={`/product/view/${row.id}`} />,
        edit: (row) => <EditButton to={`/product/edit/${row.id}`} />,
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
        <div className="products-page">

            {/* TITLE */}
            <h2 className="text-center fw-bold products-title">Products</h2>

            {/* FILTERS */}
            <FilterSection>
                <FilterLeft>
                    <SearchTextField placeholder="Search Product by Name" />
                    <SearchTextField placeholder="Search Product by ID" />
                </FilterLeft>

                <FilterRight>
                    <AddButton to="/products/add" text="Add New Product" />
                </FilterRight>
            </FilterSection>

            <FilterSection>
                <FilterLeft>
                    <FilterDropdown placeholder="Filter Product by Supplier" />
                    <FilterDropdown placeholder="Filter Product by Category" />
                </FilterLeft>
            </FilterSection>

            {/* TABLE */}
            <DataTable columns={columns} data={products} renderMap={renderMap} />

            {/* PAGINATION */}
            <Pagination />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={() => {
                    console.log("Deleting product:", deleteId);
                    setShowModal(false);
                }}
                message="Are you sure you want to delete this product?"
            />
        </div>
    );
}

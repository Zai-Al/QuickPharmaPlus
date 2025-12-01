import { useState } from "react";
import "./InventoryList.css";

// Shared components
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import PageAddButton from "../../../../Components/InternalSystem/Buttons/PageAddButton";

import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropDownList from "../../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import DatePicker from "../../../../Components/InternalSystem/GeneralComponents/DatePicker";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";


export default function InventoryList() {
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Sample data (just one row for layout)
    const inventory = [
        { id: 1, productName: "Panadol", quantity: 120, expiry: "2026-05-12" }
    ];

    // Columns config
    const columns = [
        { key: "id", label: "Product ID" },
        { key: "productName", label: "Product Name" },
        { key: "quantity", label: "Quantity" },
        { key: "expiry", label: "Expiry Date" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    // Render map
    const renderMap = {
        edit: (row) => (
            <EditButton to={`/inventory/edit/${row.id}`} />
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

    const [filterExpiryDate, setFilterExpiryDate] = useState(null);


    return (
        <div className="inventory-page">

            {/* PAGE TITLE */}
            <h2 className="text-center fw-bold inventory-title">
                Inventory
            </h2>

            {/* FILTERS */}
            <FilterSection>

                {/* LEFT SIDE FILTERS */}
                <FilterLeft>
                    <SearchTextField placeholder="Search Inventory Record by ID" />
                                        <FilterDropDownList placeholder="Search Inventory Records by Product Name" />
                </FilterLeft>

                {/* RIGHT SIDE (Add + Search Button) */}
                <FilterRight>
                    <PageAddButton to="/inventory/add" text="Add New Inventory" />
                </FilterRight>
            </FilterSection>

            {/* FILTERS */}
            <FilterSection>

                {/* LEFT SIDE FILTERS */}
                <FilterLeft>
                    <DatePicker
                        selected={filterExpiryDate}
                        onChange={(d) => setFilterExpiryDate(d)}
                        placeholderText="Filter Inventory Records by Expiry Date"
                    />
                </FilterLeft>

            </FilterSection>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={inventory}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={() => {
                    console.log("Deleting inventory record:", deleteId);
                    setShowModal(false);
                }}
                message="Are you sure you want to delete this inventory record?"
            />

        </div>
    );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import "./SupplierList.css";

// Components
import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../Components/InternalSystem/Buttons/EditButton";
import PageAddButton from "../../../Components/InternalSystem/Buttons/PageAddButton";
import DeleteButton from "../../../Components/InternalSystem/Buttons/DeleteButton";
import DeleteModal from "../../../Components/InternalSystem/Modals/DeleteModal";
import SearchTextField from "../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterRight from "../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";


export default function SupplierList() {
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // One row of fake data so buttons appear properly
    const suppliers = [
        {
            id: 1,
            name: "Pharma Gulf",
            representative: "Ahmed Ali",
            contact: "32144555",
            email: "test@gmail.com",
            address: "Manama, Bahrain",
            products: "14"
        }
    ];

    // Table columns
    const columns = [
        { key: "name", label: "Name" },
        { key: "representative", label: "Representative" },
        { key: "contact", label: "Contact" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address" },
        { key: "products", label: "Number of Products" },

        // Buttons (rendered conditionally inside DataTable)
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    // How special columns should be rendered
    const renderMap = {
        edit: (row) => (
            <EditButton to={`/supplier/edit/${row.id}`} />
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
        <div className="suppliers-page">

            {/* PAGE TITLE */}
            <h2 className="text-center fw-bold suppliers-title">Suppliers</h2>

            {/* SEARCH FILTERS */}
            <FilterSection>

                <FilterLeft>
                    <SearchTextField placeholder="Search Supplier by Name" />
                    <SearchTextField placeholder="Search Supplier by ID" />
                </FilterLeft>

                <FilterRight>
                    <PageAddButton to="/suppliers/add" text="Add New Supplier" />
                </FilterRight>

            </FilterSection>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={suppliers}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={() => {
                    console.log("Deleting supplier:", deleteId);
                    setShowModal(false);
                }}
                message="Are you sure you want to delete this supplier record?"
            />

        </div>
    );
}

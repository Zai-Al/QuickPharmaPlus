import { useState } from "react";
import "./EmployeesList.css";

// Components
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import AddButton from "../../../../Components/InternalSystem/Buttons/AddButton";
import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";

export default function EmployeesList() {

    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // One row of fake data, so buttons appear
    const employees = [
        {
            id: 1,
            name: "Ahmed Ali",
            email: "ahmedali@quickpharma.com",
            phone: "39399999",
            address: "Saar / Block No. 837 / Road No. 3321 / Building No. 445",
            role: "Admin"
        }
    ];

    // Table columns
    const columns = [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone Number" },
        { key: "address", label: "Address" },
        { key: "role", label: "Role" },

        // Action buttons
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    // Rendering special columns (buttons)
    const renderMap = {
        edit: (row) => <EditButton to={`/employees/edit/${row.id}`} />,
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
        <div className="employees-page">

            {/* TITLE */}
            <h2 className="text-center fw-bold employees-title">Employees</h2>

            {/* FILTERS */}
            <FilterSection>
                <FilterLeft>
                    <SearchTextField placeholder="Search Employee by Name" />
                    <SearchTextField placeholder="Search Employee by ID" />
                </FilterLeft>

                <FilterRight>
                    <AddButton to="/employees/add" text="Add New Employee" />
                </FilterRight>
            </FilterSection>

            {/* TABLE */}
            <DataTable columns={columns} data={employees} renderMap={renderMap} />

            {/* PAGINATION */}
            <Pagination />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={() => {
                    console.log("Deleted employee ID:", deleteId);
                    setShowModal(false);
                }}
                message="Are you sure you want to delete this employee?"
            />
        </div>
    );
}

import { useState } from "react";
import "./ReportList.css";

/* ===========================
   INTERNAL SYSTEM COMPONENTS
   =========================== */

import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import ViewButton from "../../../../Components/InternalSystem/Buttons/ViewButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import PageAddButton from "../../../../Components/InternalSystem/Buttons/PageAddButton";

import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropdown from "../../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import DatePicker from "../../../../Components/InternalSystem/GeneralComponents/DatePicker";

import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";

import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";

export default function ReportsList() {
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filterDate, setFilterDate] = useState(null);

    /* -------------------------------------------- */
    /*              DUMMY TABLE DATA                */
    /* -------------------------------------------- */
    const reports = [
        {
            id: 1,
            name: "Monthly Sales Report",
            type: "Sales",
            created: "2025-05-18"
        }
    ];

    /* -------------------------------------------- */
    /*               TABLE COLUMNS                  */
    /* -------------------------------------------- */
    const columns = [
        { key: "name", label: "Report Name" },
        { key: "type", label: "Report Type" },
        { key: "created", label: "Creation Date" },

        { key: "view", label: "View Details" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        //view: (row) => <ViewButton to={`/reports/view/${row.id}`} text="View Details" />,
        view: () => <ViewButton to="/report/details" text="View Details" />,
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
        <div className="reports-page">

            {/* TITLE */}
            <h2 className="text-center fw-bold reports-title">Reports</h2>

            {/* FILTER SECTION 1 — LEFT + RIGHT */}
            <FilterSection>
                <FilterLeft>
                    <SearchTextField
                        name="reportId"
                        placeholder="Search Report by ID"
                    />

                    <SearchTextField
                        name="reportName"
                        placeholder="Search Report by Name"
                    />
                </FilterLeft>

                <FilterRight>
                    <PageAddButton to="/reports/generate" text="Generate New Report" />
                </FilterRight>
            </FilterSection>

            {/* FILTER SECTION 2 — LEFT ONLY */}
            <FilterSection>
                <FilterLeft>

                    <FilterDropdown
                        name="type"
                        placeholder="Filter by Report Type"
                    />

                    <DatePicker
                        name="creationDate"
                        selected={filterDate}
                        onChange={(d) => setFilterDate(d)}
                        placeholderText="Filter by Creation Date"
                    />
                </FilterLeft>
            </FilterSection>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={reports}
                renderMap={renderMap}
                tableClass="reports-table"
            />

            {/* PAGINATION */}
            <Pagination />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={() => {
                    console.log("Deleted report:", deleteId);
                    setShowModal(false);
                }}
                message="Are you sure you want to delete this report?"
            />
        </div>
    );
}

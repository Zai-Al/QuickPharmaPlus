import { useState } from "react";
import "./LogsList.css";

/* ===========================
   INTERNAL SYSTEM COMPONENTS
   =========================== */

// Correct import depth for Admin folder
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropdown from "../../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import DataPicker from "../../../../Components/InternalSystem/GeneralComponents/DatePicker";

import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";

export default function Logs() {
    const [filterDate, setFilterDate] = useState(null);

    /* -------------------------------------------- */
    /*                 TABLE DATA                    */
    /* -------------------------------------------- */
    const logs = [
        {
            id: 1,
            type: "Update",
            description: "Updated product information",
            date: "2025-05-12",
            employee: "Sara Abbas"
        }
    ];

    /* -------------------------------------------- */
    /*               TABLE COLUMNS                  */
    /* -------------------------------------------- */
    const columns = [
        { key: "id", label: "Log ID" },
        { key: "type", label: "Log Type" },
        { key: "description", label: "Action Description" },
        { key: "date", label: "Action Date" },
        { key: "employee", label: "Employee Name" }
    ];

    const renderMap = {}; // no buttons in logs table

    return (
        <div className="logs-page">

            {/* TITLE */}
            <h2 className="text-center fw-bold logs-title">Logs</h2>

            {/* FILTER SECTION 1 */}
            <FilterSection>
                <FilterLeft>
                    <SearchTextField
                        name="logId"
                        placeholder="Search Log by ID"
                    />

                    <FilterDropdown
                        name="logType"
                        placeholder="Search Log by Type"
                    />
                </FilterLeft>
            </FilterSection>

            {/* FILTER SECTION 2 */}
            <FilterSection>
                <FilterLeft>
                    <FilterDropdown
                        name="employeeName"
                        placeholder="Filter by Employee Name"
                    />

                    <DataPicker
                        name="actionDate"
                        selected={filterDate}
                        onChange={(d) => setFilterDate(d)}
                        placeholderText="Search Log by Action Date"
                    />
                </FilterLeft>
            </FilterSection>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={logs}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination />

        </div>
    );
}

import { useState } from "react";
import "./PerscriptionsList.css";

/* ===========================
   INTERNAL SYSTEM COMPONENTS
   =========================== */
import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import SearchTextField from "../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropdown from "../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import DataPicker from "../../../Components/InternalSystem/GeneralComponents/DatePicker";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import ViewButton from "../../../Components/InternalSystem//Buttons/ViewButton";
export default function PrescriptionList() {

    /* ---------------------------- */
    /*         FILTER STATES        */
    /* ---------------------------- */
    const [filterDate, setFilterDate] = useState(null);

    /* ---------------------------- */
    /*        TABLE DUMMY DATA      */
    /* ---------------------------- */
    const prescriptionData = [
        {
            id: 1,
            patientName: "Layla Ahmed",
            expiry: "2025-06-15",
            status: "Active"
        }
    ];

    const columns = [
        { key: "patientName", label: "Patient Name" },
        { key: "expiry", label: "Expiry Date" },
        { key: "status", label: "Status" },
        { key: "view", label: "View Details" }
    ];

    const renderMap = {
        //view: (row) => (
        //    <button className="view-btn">View Details</button>
        //)
        view: () => <ViewButton to="/perscription/view" text="View Details"/>,

    };

    return (
        <div className="prescriptions-page">

            {/* TITLE */}
            <h2 className="text-center fw-bold prescriptions-title">Prescriptions</h2>

            {/* FILTERS — all in one FilterSection */}
            <FilterSection>
                <FilterLeft>
                    <SearchTextField
                        name="prescriptionId"
                        placeholder="Search Prescription by ID"
                    />

                    <SearchTextField
                        name="patientName"
                        placeholder="Search Prescription by Patient Name"
                    />
                </FilterLeft>
            </FilterSection>

            <FilterSection>
                <FilterLeft>
                    <FilterDropdown
                        name="status"
                        placeholder="Filter Prescription by Status"
                    />
                    <DataPicker
                        name="prescriptionDate"
                        selected={filterDate}
                        onChange={(d) => setFilterDate(d)}
                        placeholderText="Search Prescription by Date"
                    />
                </FilterLeft>
            </FilterSection>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={prescriptionData}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination />
        </div>
    );
}

import { useState } from "react";
import "./DeliveryRequestList.css";

/* ===========================
   INTERNAL SYSTEM COMPONENTS
   =========================== */

import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import SearchTextField from "../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropdown from "../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import EditButton from "../../../Components/InternalSystem/Buttons/EditButton";
import UrgencyIndicator from "../../../Components/InternalSystem/GeneralComponents/UrgencyIndicator";

export default function DeliveryRequests() {

    /* -------------------------------------------- */
    /*                 TABLE DATA                    */
    /* -------------------------------------------- */
    const deliveries = [
        {
            id: 1,
            location: "Manama, Street 1202, Block 318, Building 55",
            payment: "Pay Online",
            slot: "Morning",
            urgent: true,
            contact: "+973 34112233",
            status: "Pending"
        },
        {
            id: 2,
            location: "Riffa, Street 2105, Block 917, Building 22",
            payment: "Pay on Delivery",
            slot: "Evening",
            urgent: false,
            contact: "+973 39887766",
            status: "In Progress"
        }
    ];

    /* -------------------------------------------- */
    /*               TABLE COLUMNS                  */
    /* -------------------------------------------- */
    const columns = [
        { key: "id", label: "Order ID" },
        { key: "location", label: "Location" },
        { key: "payment", label: "Payment" },
        { key: "slot", label: "Slot" },
        { key: "urgent", label: "Urgency" },
        { key: "contact", label: "Patient Contact" },
        { key: "status", label: "Status" },
        { key: "edit", label: "Change Status" }
    ];

    /* -------------------------------------------- */
    /*            CUSTOM RENDERING MAP              */
    /* -------------------------------------------- */
    const renderMap = {
        urgent: (row) => <UrgencyIndicator urgent={row.urgent} />,
        edit: (row) => <EditButton to={`/delivery/edit/${row.id}`} />
    };

    /* -------------------------------------------- */
    /*                    RETURN                    */
    /* -------------------------------------------- */
    return (
        <div className="delivery-page">

            {/* TITLE */}
            <h2 className="text-center fw-bold delivery-title">Delivery Requests</h2>

            {/* FILTER SECTION 1 */}
            <FilterSection>
                <FilterLeft>
                    <SearchTextField
                        placeholder="Search Order by ID"
                        name="orderId"
                    />

                    <FilterDropdown
                        placeholder="Filter Order by Status"
                        name="orderStatus"
                    />
                </FilterLeft>
            </FilterSection>

            {/* FILTER SECTION 2 */}
            <FilterSection>
                <FilterLeft>
                    <FilterDropdown
                        placeholder="Filter Order by Payment"
                        name="payment"
                    />

                    <FilterDropdown
                        placeholder="Filter Order by Urgency"
                        name="urgency"
                    />
                </FilterLeft>
            </FilterSection>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={deliveries}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination />
        </div>
    );
}

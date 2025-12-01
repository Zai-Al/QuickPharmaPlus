import { useState } from "react";
import "./ExpiredProductsList.css";

/* ===========================
   INTERNAL SYSTEM COMPONENTS
   =========================== */

import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import DisposeButton from "../../../../Components/InternalSystem/Buttons/DisposeButton";

import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropdown from "../../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import DataPicker from "../../../../Components/InternalSystem/GeneralComponents/DatePicker";

import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";

import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";

export default function ExpiredProductsList() {
    //const [disposeId, setDisposeId] = useState(null);
    const [filterDate, setFilterDate] = useState(null);

    /* -------------------------------------------- */
    /*              DUMMY TABLE DATA                */
    /* -------------------------------------------- */
    const expiredProducts = [
        {
            id: 1,
            product: "Panadol",
            supplier: "Pharma Gulf",
            category: "Pain Relief",
            expiry: "2025-02-10"
        }
    ];

    /* -------------------------------------------- */
    /*               TABLE COLUMNS                  */
    /* -------------------------------------------- */
    const columns = [
        { key: "product", label: "Product Name" },
        { key: "supplier", label: "Supplier Name" },
        { key: "category", label: "Category" },
        { key: "expiry", label: "Expiration Date" },
        { key: "dispose", label: "Dispose" }
    ];

    const renderMap = {
        dispose: (row) => (
            <DisposeButton
                onClick={() => {
                    //setDisposeId(row.id);
                    console.log("Disposing product: ", row.id);
                }}
            />
        )
    };

    return (
        <div className="expired-products-page">
            {/* TITLE */}
            <h2 className="text-center fw-bold expired-products-title">
                Expired Products
            </h2>

            {/* FILTER SECTION 1 — LEFT ONLY */}
            <FilterSection>
                <FilterLeft>
                    <SearchTextField
                        name="productId"
                        placeholder="Search Product by ID"
                    />

                    <FilterDropdown
                        name="supplier"
                        placeholder="Filter Products by Supplier Name"
                    />
                </FilterLeft>
            </FilterSection>

            {/* FILTER SECTION 2 — LEFT ONLY */}
            <FilterSection>
                <FilterLeft>
                    <FilterDropdown
                        name="supplier"
                        placeholder="Filter Products by Supplier Name"
                    />

                    <DataPicker
                        name="expiryDate"
                        selected={filterDate}
                        onChange={(d) => setFilterDate(d)}
                        placeholderText="Filter by Expiration Date"
                    />
                </FilterLeft>
            </FilterSection>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={expiredProducts}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination />
        </div>
    );
}

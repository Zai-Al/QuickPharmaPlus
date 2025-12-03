import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./OrdersList.css";

/* ===========================
   INTERNAL SYSTEM COMPONENTS
   =========================== */

import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../Components/InternalSystem/Buttons/EditButton";
import PageAddButton from "../../../Components/InternalSystem/Buttons/PageAddButton";
import DeleteButton from "../../../Components/InternalSystem/Buttons/DeleteButton";
import DeleteModal from "../../../Components/InternalSystem/Modals/DeleteModal";

import SearchTextField from "../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropdown from "../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import DataPicker from "../../../Components/InternalSystem/GeneralComponents/DatePicker";
import FilterRight from "../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";

import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";

export default function OrdersList() {

    const location = useLocation();
    const navigate = useNavigate();

    /* ----------------------------------------- */
    /*          LOCAL STATE FOR TABS              */
    /* ----------------------------------------- */
    const [isReorderPage, setIsReorderPage] = useState(false);

    /* ----------------------------------------- */
    /*     ACTIVATE REORDER TAB IF URL MATCHES    */
    /* ----------------------------------------- */
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");

        if (tab === "reorder") {
            setIsReorderPage(true);
        }
    }, [location]);

    /* ----------------------------------------- */
    /*            DELETE + FILTER STATE           */
    /* ----------------------------------------- */
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filterExpiryDate, setFilterExpiryDate] = useState(null);

    /* ----------------------------------------- */
    /*            DUMMY DATA FOR TABLES           */
    /* ----------------------------------------- */

    const ordersData = [
        {
            id: 1,
            supplier: "Pharma Gulf",
            product: "Panadol",
            employee: "Ahmed Ali",
            quantity: 50,
            date: "2025-05-10",
            typ: "Manual",
            status: "Completed"
        }
    ];

    const reorderData = [
        {
            id: 1,
            product: "Panadol",
            supplier: "Pharma Gulf",
            employee: "Sara Abbas",
            threshold: 80,
            quantity: 120,
            created: "2025-05-05"
        }
    ];

    /* ----------------------------------------- */
    /*               TABLE COLUMNS               */
    /* ----------------------------------------- */

    const orderColumns = [
        { key: "supplier", label: "Supplier Name" },
        { key: "product", label: "Product Name" },
        { key: "employee", label: "Employee Name" },
        { key: "date", label: "Order Date" },
        { key: "quantity", label: "Quantity" },
        { key: "typ", label: "Type" },
        { key: "status", label: "Status" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const reorderColumns = [
        { key: "product", label: "Product Name" },
        { key: "supplier", label: "Supplier Name" },
        { key: "employee", label: "Employee Name" },
        { key: "created", label: "Creation Date" },
        { key: "threshold", label: "Threshold" },
        { key: "quantity", label: "Quantity" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        edit: (row) => <EditButton to={`/orders/edit/${row.id}`} />,
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
        <div className="orders-page">

            {/* ================= TITLE ================= */}
            <h2 className="text-center fw-bold orders-title">
                {isReorderPage ? "Reorders" : "Orders"}
            </h2>

            {/* ================= FILTER SECTION 1 ================= */}
            <FilterSection>
                <FilterLeft>
                    <SearchTextField name="orderId" placeholder="Search Order by ID" />
                    <FilterDropdown name="supplier" placeholder="Filter Orders by Supplier Name" />
                </FilterLeft>

                <FilterRight>
                    {!isReorderPage ? (
                        <PageAddButton to="/orders/create" text="Create New Order" />
                    ) : (
                        <PageAddButton to="/orders/create-auto" text="Create New Automated Order" />
                    )}
                </FilterRight>
            </FilterSection>

            {/* ================= FILTER SECTION 2 ================= */}
            <FilterSection>
                <FilterLeft>
                    <FilterDropdown name="product" placeholder="Filter Orders by Product Name" />
                    <FilterDropdown name="employee" placeholder="Filter Orders by Employee Name" />
                </FilterLeft>
            </FilterSection>

            {/* ================= FILTER SECTION 3 ================= */}
            <FilterSection>
                <FilterLeft>
                    <FilterDropdown name="status" placeholder="Filter Orders by Status" />

                    {!isReorderPage ? (
                        <>
                            <FilterDropdown
                                name="type"
                                placeholder="Filter Orders by Type"
                            />

                            <DataPicker
                                name="orderCreationDate"
                                selected={filterExpiryDate}
                                onChange={(d) => setFilterExpiryDate(d)}
                                placeholderText="Filter By Creation Date"
                            />
                        </>
                    ) : (
                        <DataPicker
                            name="orderCreationDate"
                            selected={filterExpiryDate}
                            onChange={(d) => setFilterExpiryDate(d)}
                            placeholderText="Filter By Creation Date"
                        />
                    )}
                </FilterLeft>
            </FilterSection>

            {/* ==================== TABS ==================== */}
            <ul className="nav nav-tabs orders-tabs">
                <li className="nav-item">
                    <button
                        className={`nav-link ${!isReorderPage ? "active" : ""}`}
                        onClick={() => setIsReorderPage(false)}
                    >
                        Orders List
                    </button>
                </li>

                <li className="nav-item">
                    <button
                        className={`nav-link ${isReorderPage ? "active" : ""}`}
                        onClick={() => setIsReorderPage(true)}
                    >
                        Reorder Requests
                    </button>
                </li>
            </ul>

            {/* ==================== TABLE ==================== */}
            <DataTable
                columns={isReorderPage ? reorderColumns : orderColumns}
                data={isReorderPage ? reorderData : ordersData}
                renderMap={renderMap}
            />

            {/* ==================== PAGINATION ==================== */}
            <Pagination />

            {/* ==================== DELETE MODAL ==================== */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={() => {
                    console.log("Deleting:", deleteId);
                    setShowModal(false);
                }}
                message="Are you sure you want to delete this record?"
            />
        </div>
    );
}

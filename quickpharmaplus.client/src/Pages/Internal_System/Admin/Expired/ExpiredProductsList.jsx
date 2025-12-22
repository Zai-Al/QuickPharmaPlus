import { useEffect, useState, useRef } from "react";
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
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";

import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DisposalModal from "../../../../Components/InternalSystem/Modals/DisposalModal";
import ClearButton from "../../../../Components/InternalSystem/Buttons/ClearButton";

export default function ExpiredProductsList() {
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [expiredProducts, setExpiredProducts] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filters
    const [idSearch, setIdSearch] = useState("");
    const [supplierSearch, setSupplierSearch] = useState("");
    const [filterDate, setFilterDate] = useState(null);

    // Disposal modal
    const [showModal, setShowModal] = useState(false);
    const [disposeProduct, setDisposeProduct] = useState(null);

    const filterDebounceRef = useRef(null);

    // Validation states
    const [idError, setIdError] = useState("");

    /* -------------------------------------------- */
    /*               TABLE COLUMNS                  */
    /* -------------------------------------------- */
    const columns = [
        { key: "product", label: "Product Name" },
        { key: "supplier", label: "Supplier Name" },
        { key: "category", label: "Category" },
        { key: "type", label: "Type" },
        { key: "quantity", label: "Quantity" },
        { key: "branch", label: "Branch" },
        { key: "expiry", label: "Expiration Date" },
        { key: "dispose", label: "Dispose" }
    ];

    const renderMap = {
        dispose: (row) => (
            <DisposeButton
                onClick={() => {
                    setDisposeProduct(row);
                    setShowModal(true);
                }}
            />
        )
    };

    function formatDate(dateValue) {
        if (!dateValue) return "";
        const d = new Date(dateValue);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }

    useEffect(() => {
        fetchExpiredProducts(currentPage);
    }, [currentPage]);

    useEffect(() => {
        if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);

        filterDebounceRef.current = setTimeout(() => {
            if (currentPage !== 1) setCurrentPage(1);
            else fetchExpiredProducts(1);
        }, 300);

        return () => clearTimeout(filterDebounceRef.current);
    }, [idSearch, supplierSearch, filterDate, pageSize]);

    async function fetchExpiredProducts(pageNumber = 1) {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.set("pageNumber", String(pageNumber));
            params.set("pageSize", String(pageSize));
            params.set("daysBeforeExpiry", "29");

            if (idSearch && idSearch.trim()) {
                params.set("search", idSearch.trim());
            }

            if (supplierSearch && supplierSearch.trim()) {
                params.set("supplierName", supplierSearch.trim());
            }

            if (filterDate) {
                const raw = filterDate;
                params.set("expiryDate", `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, "0")}-${String(raw.getDate()).padStart(2, "0")}`);
            }

            const res = await fetch(`${baseURL}/api/ExpiredProducts?${params.toString()}`, { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to load expired products (${res.status})`);

            const data = await res.json();

            const mapped = (data.items || []).map((i) => ({
                inventoryId: i.inventoryId,
                product: i.productName ?? "—",
                supplier: i.supplierName ?? "—",
                category: i.categoryName ?? "—",
                type: i.productType ?? "—",
                quantity: i.quantity ?? 0,
                branch: i.branchCity ?? "—",
                expiry: formatDate(i.expiryDate),
                productName: i.productName,
                branchCity: i.branchCity,
                expiryDate: i.expiryDate
            }));

            setExpiredProducts(mapped);

            const totalCount = data.totalCount ?? mapped.length;
            setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));

        } catch (err) {
            setError("Unable to load expired products.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // LIVE VALIDATION FOR INVENTORY ID (NUMBERS ONLY)
    const handleIdChange = (e) => {
        const val = e.target.value;

        if (/^[0-9]*$/.test(val)) {
            setIdError("");
            setIdSearch(val);
        } else {
            setIdError("Only numbers allowed.");
        }
    };

    // =================== DISPOSAL HANDLER ===================
    async function handleDisposeConfirm() {
        if (!disposeProduct) {
            setShowModal(false);
            return;
        }

        try {
            const res = await fetch(`${baseURL}/api/ExpiredProducts/dispose/${disposeProduct.inventoryId}`, {
                method: "POST",
                credentials: "include"
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Disposal failed (${res.status})`);
            }

            // Show success message
            const responseData = await res.json();
            setSuccessMessage(responseData.message || "Expired inventory batch disposed successfully!");
            setError("");

            // Remove disposed item from the list
            setExpiredProducts(prev => prev.filter(i => i.inventoryId !== disposeProduct.inventoryId));

            // Hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);

        } catch (err) {
            console.error("Dispose inventory error:", err);
            setError(err.message || "Failed to dispose inventory batch.");
            setSuccessMessage("");
        } finally {
            setDisposeProduct(null);
            setShowModal(false);
        }
    }

    return (
        <div className="expired-products-page">
            {/* TITLE */}
            <h2 className="text-center fw-bold expired-products-title">
                Expired Products
            </h2>

            {/* SUCCESS MESSAGE */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible w-50" style={{margin: "20px auto" }}>
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setSuccessMessage("")}></button>
                    <strong>Success!</strong> {successMessage}
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="alert alert-danger alert-dismissible" style={{ width: "80%", margin: "20px auto" }}>
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setError("")}></button>
                    <strong>Error!</strong> {error}
                </div>
            )}

            {/* FILTER SECTION 1 */}
            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter inventory id for automatic search</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${idError ? "is-invalid" : ""}`}
                            placeholder="Search Product by ID"
                            value={idSearch}
                            onChange={handleIdChange}
                        />
                        <div style={{ height: "20px" }}>
                            {idError && <div className="invalid-feedback d-block">{idError}</div>}
                        </div>
                    </div>

                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter supplier name for automatic search</div>
                        <input
                            type="text"
                            className="form-control filter-text-input"
                            placeholder="Filter Products by Supplier Name"
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                        />
                    </div>
                </FilterLeft>

                <FilterRight>
                    <ClearButton
                        onClear={() => {
                            setIdSearch("");
                            setSupplierSearch("");
                            setFilterDate(null);
                            setIdError("");

                            if (currentPage !== 1) setCurrentPage(1);
                            else fetchExpiredProducts(1);
                        }}
                    />
                </FilterRight>
            </FilterSection>

            {/* FILTER SECTION 2 */}
            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Select expiry date for automatic search</div>
                        <DataPicker
                            name="expiryDate"
                            selected={filterDate}
                            onChange={(d) => setFilterDate(d)}
                            placeholderText="Filter by Expiration Date"
                        />
                    </div>
                </FilterLeft>
            </FilterSection>

            {loading && <div className="text-center text-muted my-3">Loading expired products...</div>}

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={expiredProducts}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
            />

            {/* DISPOSAL MODAL */}
            <DisposalModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDisposeConfirm}
                product={disposeProduct}
            />
        </div>
    );
}

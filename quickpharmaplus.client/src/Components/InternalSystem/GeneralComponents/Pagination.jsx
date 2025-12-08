import "./GeneralComponents.css";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="pagination-container">
            <button
                className="pagination-btn pagination-navigation"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <i className="bi bi-chevron-left pe-2"></i>
                Previous
            </button>
            <div className="pagination-pages">
                {pages.map(page => (
                    <button
                        key={page}
                        className={`pagination-page-btn ${page === currentPage ? "active" : ""}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}
            </div>
            <button
                className="pagination-btn pagination-navigation"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next 
                <i className="bi bi-chevron-right ps-2"></i>
            </button>
        </div>
    );
}

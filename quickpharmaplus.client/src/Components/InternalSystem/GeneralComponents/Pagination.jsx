import "./GeneralComponents.css";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    const maxVisible = 15; // max numbers to display

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

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

            {/* Optional: show leading dots */}
            {startPage > 1 && (
                <>
                    <button
                        className="pagination-page-btn"
                        onClick={() => onPageChange(1)}
                    >
                        1
                    </button>
                    <span className="pagination-dots">...</span>
                </>
            )}

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

            {/* Optional: show ending dots */}
            {endPage < totalPages && (
                <>
                    <span className="pagination-dots">...</span>
                    <button
                        className="pagination-page-btn"
                        onClick={() => onPageChange(totalPages)}
                    >
                        {totalPages}
                    </button>
                </>
            )}

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

import "./GeneralComponents.css";

export default function Pagination({ currentPage = 1, totalPages = 5, onPageChange }) {

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    //return (
    //    <div className="pagination-container">
    //        <button
    //            className="pagination-btn"
    //            disabled={currentPage === 1}
    //            onClick={() => onPageChange(currentPage - 1)}
    //        >
    //            ◉ Previous
    //        </button>

    //        <div className="pagination-pages">
    //            {pages.map((page) => (
    //                <button
    //                    key={page}
    //                    className={`pagination-page-btn ${page === currentPage ? "active" : ""}`}
    //                    onClick={() => onPageChange(page)}
    //                >
    //                    {page}
    //                </button>
    //            ))}
    //        </div>

    //        <button
    //            className="pagination-btn"
    //            disabled={currentPage === totalPages}
    //            onClick={() => onPageChange(currentPage + 1)}
    //        >
    //            Next ◉
    //        </button>
    //    </div>
    //);

    return (
        <div className="pagination-placeholder">
            ◉ Previous &nbsp; 1 &nbsp; 2 &nbsp; 3 &nbsp; Next ◉
        </div>
    );
}

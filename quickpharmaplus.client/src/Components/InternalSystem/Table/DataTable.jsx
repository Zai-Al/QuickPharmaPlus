import "./DataTable.css";

export default function DataTable({ columns = [], data = [], renderMap = {} }) {
    return (
        <div className="table-responsive data-table-container">
            <table className="table table-bordered data-table">

                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index}>{col.label}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-3">
                                No data available.
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex}>
                                        {
                                            renderMap[col.key]   // 👉 Custom component?
                                                ? renderMap[col.key](row)
                                                : row[col.key] ?? "" // 👉 Normal text field
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>

            </table>
        </div>
    );
}

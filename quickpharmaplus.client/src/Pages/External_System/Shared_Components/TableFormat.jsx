
export default function TableFormat({ headers = [], children }) {
    return (
        <div className="table-responsive mb-4">
            <table className="table align-middle text-center">
                {headers.length > 0 && (
                    <thead className="qp-table-header">
                        <tr>
                            {headers.map((text, index) => (
                                <th key={index}>{text}</th>
                            ))}
                        </tr>
                    </thead>
                )}

                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

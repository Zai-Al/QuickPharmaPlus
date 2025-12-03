// Shared_Components/ProfileItemsTable.jsx
import TableFormat from "./TableFormat";

export default function ItemTable({
    title,
    items = [],
    columns = [],
    emptyMessage,       // shown only if defined
    renderActions,      // optional
}) {

    // Only show empty message if emptyMessage prop exists
    if (items.length === 0 && emptyMessage) {
        return (
            <div className="text-center my-5">
                <span>{emptyMessage}</span>
            </div>
        );
    }

    // Build table headers
    const headers = [
        ...columns.map((c) => c.header),
        ...(renderActions ? ["Actions"] : []),
    ];

    return (
        <>
            {title && <h5 className="mt-4 mb-3">{title}</h5>}

            <TableFormat headers={headers}>
                {items.map((item, index) => (
                    <tr key={index}>
                        {columns.map((col) => (
                            <td key={col.key} className="align-middle">
                                {item[col.key]}
                            </td>
                        ))}

                        {renderActions && (
                            <td className="align-middle">
                                {renderActions(item, index)}
                            </td>
                        )}
                    </tr>
                ))}
            </TableFormat>
        </>
    );
}

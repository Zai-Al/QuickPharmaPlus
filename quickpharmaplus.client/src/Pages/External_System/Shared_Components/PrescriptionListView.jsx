
import ItemTable from "./ItemTable";

export default function PrescriptionListView({
    description,          // top paragraph
    title,                // table title
    items = [],           // table rows
    columns = [],         // { key, header }
    emptyMessage,         // message if no items
    renderActions,        // optional actions column renderer
    addButtonLabel,       // label for bottom button
    onAddNew,             // handler for bottom button
}) {
    return (
        <div>
            {/* Top description paragraph */}
            {description && (
                <p className="fw-bold text-start">
                    {description}
                </p>
            )}

            <ItemTable
                title={title}
                items={items}
                columns={columns}
                emptyMessage={emptyMessage}
                renderActions={renderActions}
            />

            {/* Add New button at the bottom, centered */}
            {onAddNew && (
                <div className="text-center">
                    <button
                        type="button"
                        className="btn qp-add-btn"
                        onClick={onAddNew}
                    >
                        {addButtonLabel || "Add New"}
                    </button>
                </div>
            )}
        </div>
    );
}

import ItemTable from "./ItemTable";

export default function PrescriptionListView({
    description,
    title,
    items = [],
    columns = [],
    emptyMessage,
    renderActions,
    addButtonLabel,

    onAddNew,

    
    addButtonDisabledMessage = "",
}) {
    const canAdd = typeof onAddNew === "function";

    return (
        <div>
            {description && <p className="fw-bold text-start">{description}</p>}

            <ItemTable
                title={title}
                items={items}
                columns={columns}
                emptyMessage={emptyMessage}
                renderActions={renderActions}
            />

            {/* Always show button if label exists (or you want it always) */}
            <div className="text-center">
                <button
                    type="button"
                    className="btn qp-add-btn"
                    onClick={canAdd ? onAddNew : undefined}
                    disabled={!canAdd}
                >
                    {addButtonLabel || "Add New"}
                </button>

                {!canAdd && addButtonDisabledMessage && (
                    <div className="text-muted small mt-2">{addButtonDisabledMessage}</div>
                )}
            </div>
        </div>
    );
}

// src/Pages/External_System/OrderSummaryTab.jsx
import OrderItemsTable from "../Shared_Components/OrderItemsTable";

export default function OrderSummaryTab({ items = [] }) {
    return (
        <div className="order-summary-tab">
            <h3 className="fw-bold mb-4 text-center">Order Summary</h3>

            {items.length === 0 ? (
                <p className="text-muted text-center">
                    Your cart is empty.
                </p>
            ) : (
                <OrderItemsTable
                    items={items}
                    title="Order Summary"
                    shippingMethod="" 
                />
            )}
        </div>
    );
}

export default function formatCurrency(amount, currency = "BHD") {
    if (amount == null || isNaN(amount)) return `0.00 ${currency}`;
    return `${amount.toFixed(2)} ${currency}`;
}

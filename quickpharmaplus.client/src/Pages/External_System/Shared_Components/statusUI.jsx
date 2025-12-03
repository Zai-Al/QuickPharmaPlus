
import iconApproved from "../../../assets/icons/status-approved.svg";
import iconPending from "../../../assets/icons/status-pending.svg";
import iconRejected from "../../../assets/icons/status-rejected.svg";
import iconExpired from "../../../assets/icons/status-expired.svg";


const STATUS_UI_MAP = {
    // Shared statuses
    Approved: {
        color: "#1FCB87",
        icon: iconApproved,
        label: "Approved",
    },
    "Pending Approval": {
        color: "#E2A520",
        icon: iconPending,
        label: "Pending Approval",
    },
    Rejected: {
        color: "#EB5757",
        icon: iconRejected,
        label: "Rejected",
    },
    Expired: {
        color: "#9CA3AF",
        icon: iconExpired,
        label: "Expired",
    },
    Ongoing: {
        color: "#1FCB87",
        icon: iconApproved,
        label: "Ongoing",
    },

    // Add as many as you want here:
    // "In Progress": {
    //     color: "#3B82F6",
    //     icon: iconInProgress,
    //     label: "In Progress",
    // },
    // "On Hold": {
    //     color: "#A855F7",
    //     icon: iconOnHold,
    //     label: "On Hold",
    // },
    // "Ready for Pickup": {
    //     color: "#22C55E",
    //     icon: iconPickup,
    //     label: "Ready for Pickup",
    // },
};

// Helper function every page can use
export function StatusUI(status) {
    const config = STATUS_UI_MAP[status];

    if (config) return config;

    // Fallback if status not defined
    return {
        color: "#444",
        icon: null,
        label: status || "Unknown",
    };
}


export function StatusBadge({ status }) {
    const { color, icon, label } = StatusUI(status);

    return (
        <span
            className="d-inline-flex align-items-center gap-2"
            style={{
                padding: "2px 8px",
                borderRadius: "999px",
                //border: `1px solid ${color}`,
                fontSize: "0.85rem",
                fontWeight: 600,
            }}
        >
            {icon && (
                <img
                    src={icon}
                    alt={label}
                    style={{ width: 16, height: 16, objectFit: "contain" }}
                />
            )}
            <span style={{ color }}>{label}</span>
        </span>
    );
}

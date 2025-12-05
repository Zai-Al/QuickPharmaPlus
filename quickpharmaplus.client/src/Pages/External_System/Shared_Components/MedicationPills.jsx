// src/Pages/External_System/Shared_Components/MedicationPills.jsx
import { useEffect, useRef } from "react";
import { Tooltip, Popover } from "bootstrap";


export function IncompatibilityPill({ popoverLines = [] }) {
    const pillRef = useRef(null);

    useEffect(() => {
        if (!pillRef.current) return;

        // clean up any existing POPOVER on this element
        const existingPopover = Popover.getInstance(pillRef.current);
        if (existingPopover) {
            existingPopover.dispose();
        }

        const contentHtml =
            popoverLines.length > 0
                ? popoverLines.join("<br/>")
                : "This product has incompatibilities.";

        const popover = new Popover(pillRef.current, {
            placement: "bottom",
            trigger: "click",
            html: true,
            content: contentHtml,
            template: `
                <div class="popover" role="tooltip">
                    <div class="popover-arrow"></div>
                    <h3 class="popover-header d-flex justify-content-between align-items-center">
                        <span>Incompatibility details</span>
                        <button type="button"
                                class="btn-close"
                                data-bs-dismiss="popover"
                                aria-label="Close"></button>
                    </h3>
                    <div class="popover-body"></div>
                </div>
            `,
        });

        return () => {
            popover.dispose();
        };
    }, [popoverLines]);

    return (
        <button
            type="button"
            ref={pillRef}
            className="badge rounded-pill border-0"
            style={{
                backgroundColor: "#EB5757",
                color: "#fff",
                fontSize: "0.7rem",
            }}
        >
            Incompatible
        </button>
    );
}


export function PrescribedPill() {
    const pillRef = useRef(null);

    useEffect(() => {
        if (!pillRef.current) return;

        // clean old tooltip if React StrictMode remounts
        const existingTooltip = Tooltip.getInstance(pillRef.current);
        if (existingTooltip) {
            existingTooltip.dispose();
        }

        const tooltip = new Tooltip(pillRef.current, {
            title: "This product requires a prescription",
            placement: "top",
        });

        return () => {
            tooltip.dispose();
        };
    }, []);

    return (
        <span
            ref={pillRef}
            className="badge rounded-pill border-0"
            style={{
                backgroundColor: "#1FCB87",
                color: "#fff",
                fontSize: "0.7rem",
            }}
        >
            Prescribed
        </span>
    );
}

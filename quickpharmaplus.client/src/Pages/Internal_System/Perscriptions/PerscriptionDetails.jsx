import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import FormHeader from "../../../Components/InternalSystem/FormHeader";
import Card from "../../../Components/Details/Card";
import DownloadButton from "../../../Components/Details/DownloadDocuments";
import ViewDocument from "../../../Components/Details/ViewDocument";

import ApproveButton from "../../../Components/Details/ApproveButton";
import RejectButton from "../../../Components/Details/RejectButton";
import DocumentCard from "../../../Components/Details/DocumentCard";
import { StatusBadge } from "../../External_System/Shared_Components/statusUI.jsx";

import "./PrescriptionDetails.css";

export default function PrescriptionDetails() {
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    const { prescriptionId } = useParams();

    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [details, setDetails] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!prescriptionId) return;

            try {
                setLoading(true);
                setErrorMsg("");

                const res = await fetch(`${baseURL}/api/Prescription/${encodeURIComponent(prescriptionId)}`, {
                    credentials: "include",
                });

                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(t || `Failed to load prescription details (${res.status}).`);
                }

                const data = await res.json();
                setDetails(data);
            } catch (err) {
                setDetails(null);
                setErrorMsg(err?.message || "Failed to load prescription details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [baseURL, prescriptionId]);

    const docUrls = useMemo(() => {
        if (!prescriptionId) return null;

        return {
            prescription: `${baseURL}/api/Prescription/${encodeURIComponent(prescriptionId)}/document`,
            cpr: `${baseURL}/api/Prescription/${encodeURIComponent(prescriptionId)}/cpr`,
        };
    }, [baseURL, prescriptionId]);

    const patientDetailsNode = useMemo(() => {
        if (!details) return <div>—</div>;

        const firstName = details.FirstName ?? details.firstName ?? "—";
        const lastName = details.LastName ?? details.lastName ?? "—";
        const email = details.Email ?? details.email ?? "—";
        const contactNumber = details.ContactNumber ?? details.contactNumber ?? "—";

        const city = details.CityName ?? details.cityName ?? "";
        const block = details.Block ?? details.block ?? "";
        const road = details.Road ?? details.road ?? "";
        const buildingFloor = details.BuildingFloor ?? details.buildingFloor ?? "";

        return (
            <div className="text-start">
                <div className="mt-1 ms-2"><strong>First Name:</strong> {firstName}</div>
                <div className="mt-1 ms-2"><strong>Last Name:</strong> {lastName}</div>
                <div className="mt-1 ms-2"><strong>Email:</strong> {email}</div>
                <div className="mt-1 ms-2"><strong>Contact Number:</strong> {contactNumber}</div>
                <div className="mt-1 ms-2">
                    <strong>Address:</strong>{" "}
                    {[city, block && `Block No. ${block}`, road && `Road No. ${road}`, buildingFloor && `Building No. ${buildingFloor}`]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                </div>
            </div>
        );
    }, [details]);

    const hasPrescriptionDoc =
        details?.HasPrescriptionDocument ??
        details?.hasPrescriptionDocument ??
        false;

    const hasCprDoc =
        details?.HasCprDocument ??
        details?.hasCprDocument ??
        false;

    const prescriptionStatusId =
        details?.PrescriptionStatusId ??
        details?.prescriptionStatusId ??
        details?.PrescriptionStatusID ??
        details?.prescriptionStatusID ??
        null;

    const statusName =
        (details?.PrescriptionStatusName ?? details?.prescriptionStatusName ?? "").trim();

    const statusFromId = (id) => {
        switch (Number(id)) {
            case 1: return "Approved";
            case 2: return "Pending Approval";
            case 3: return "Expired";
            case 4: return "Rejected";
            default: return "Unknown";
        }
    };

    // Prefer backend status name (best match for STATUS_UI_MAP), fallback to id mapping
    const badgeStatus = statusName || statusFromId(prescriptionStatusId);

    const isPendingApproval = (Number(prescriptionStatusId) === 2); // PendingApproval

    return (
        <div className="container prescription-page">
            <FormHeader title="Prescription Approval" to="/prescriptions" />

            {loading && <p>Loading...</p>}

            {!loading && errorMsg && (
                <div className="alert alert-danger text-start">{errorMsg}</div>
            )}

            {!loading && !errorMsg && details && (
                <>
                    <div className="prescription-section">
                        <Card title="Patient Details" content={patientDetailsNode} />
                    </div>

                    <div className="prescription-section">
                        <DocumentCard title="CPR Document">
                            <ViewDocument documentUrl={hasCprDoc ? docUrls?.cpr : null} />
                            <DownloadButton documentUrl={hasCprDoc ? docUrls?.cpr : null} />
                        </DocumentCard>
                    </div>

                    <div className="prescription-section">
                        <DocumentCard title="Prescription Document">
                            <ViewDocument documentUrl={hasPrescriptionDoc ? docUrls?.prescription : null} />
                            <DownloadButton documentUrl={hasPrescriptionDoc ? docUrls?.prescription : null} />
                        </DocumentCard>
                    </div>

                    <div className="prescription-status">
                        <strong>Prescription Status:</strong> <StatusBadge status={badgeStatus} />
                    </div>

                    {isPendingApproval && (
                        <div className="action-buttons">
                            <ApproveButton id={prescriptionId} />
                            <RejectButton id={prescriptionId} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

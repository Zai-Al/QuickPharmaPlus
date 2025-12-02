import React from "react";
// import { useParams } from "react-router-dom"; // <-- COMMENTED OUT FOR NOW

import FormHeader from "../../../Components/InternalSystem/FormHeader";
import Card from "../../../Components/Details/Card";
import DownloadButton from "../../../Components/Details/DownloadDocuments";
import ViewDocument from "../../../Components/Details/ViewDocument";

import ApproveButton from "../../../Components/Details/ApproveButton";
import RejectButton from "../../../Components/Details/RejectButton";
import DocumentCard from "../../../Components/Details/DocumentCard";

import "./PrescriptionDetails.css";

export default function PrescriptionDetails() {

    // const { id } = useParams(); // <-- COMMENTED OUT (ID not used yet)
    // Later: you will use this ID to fetch and pass data

    return (
        <div className="container prescription-page">

            {/* ===========================
                PAGE TITLE SECTION
            =========================== */}
            <FormHeader
                title="Prescription Approval"
                to="/prescriptions"
            />

            {/* ===========================
                PATIENT DETAILS CARD
            =========================== */}
            <Card
                title="Patient Details"
                text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
                      ut labore et dolore magna aliqua. Ut enim ad minim veniam..."
            />

            {/* ===========================
                CPR DOCUMENT CARD
            =========================== */}
            <DocumentCard title="CPR Document">
                {/* <ViewDocument id={id} /> */}
                {/* <DownloadButton id={id} /> */}

                {/* Temporary placeholders (until ID logic implemented): */}
                <ViewDocument />
                <DownloadButton />
            </DocumentCard>

            {/* ===========================
                PRESCRIPTION DOCUMENT CARD
            =========================== */}
            <DocumentCard title="Prescription Document">
                {/* <ViewDocument id={id} /> */}
                {/* <DownloadButton id={id} /> */}

                <ViewDocument />
                <DownloadButton />
            </DocumentCard>

            {/* ===========================
                ACTION BUTTONS SECTION
            =========================== */}
            <div className="action-buttons">
                {/* <ApproveButton id={id} /> */}
                {/* <RejectButton id={id} /> */}

                {/* TEMPORARY BUTTONS WITH NO ID */}
                <ApproveButton />
                <RejectButton />
            </div>

        </div>
    );
}

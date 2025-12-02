import React from "react";

//Imports updated for “one layer deeper”
import FormHeader from "../../../../Components/InternalSystem/FormHeader";
import Card from "../../../../Components/Details/Card";
import DocumentCard from "../../../../Components/Details/DocumentCard";
import ViewDocument from "../../../../Components/Details/ViewDocument";
import DownloadButton from "../../../../Components/Details/DownloadDocuments";

import "./ReportDetails.css";

export default function ReportDetails() {

    // ==========================================
    // FUTURE: when backend is ready, use the ID
    // const { id } = useParams();
    // Later: fetch report details by ID
    // ==========================================

    return (
        <div className="container report-page">

            {/* ===========================
                PAGE HEADER
            =========================== */}
            <div className="report-title-wrapper">
                <h2>Report Details</h2>
            </div>


            {/* ===========================
                REPORT DETAILS CARD
            =========================== */}
            <Card
                title="Report Details"
                text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt 
                      ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation..."
            />

            {/* ===========================
                REPORT DOCUMENT SECTION
            =========================== */}
            <DocumentCard title="Report Document">

                {/* FUTURE: these will receive the report ID */}
                {/* <ViewDocument id={id} /> */}
                {/* <DownloadButton id={id} /> */}

                <ViewDocument />
                <DownloadButton />
            </DocumentCard>

        </div>
    );
}
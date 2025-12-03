import { useState, useEffect } from "react";
import IllnessesTab from "./IllnessesTab";
import AllergyTab from "./AllergyTab";
import PrescriptionTab from "./PrescriptionTab";
import PrescriptionPlanTab from "./PrescriptionPlanTab";
import NavigationTab from "../Shared_Components/NavigationTab";
import PageHeader from "../Shared_Components/PageHeader";
import SuccessAlert from "../Shared_Components/SuccessAlert";
import { useLocation, useNavigate } from "react-router-dom";
import "../Shared_Components/External_Style.css";

export default function HealthProfile() {
    const [activeTab, setActiveTab] = useState("illnesses");

    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    const healthTabs = [
        { key: "illnesses", label: "Illnesses" },
        { key: "allergy", label: "Allergy" },
        { key: "prescription", label: "Prescription" },
        { key: "plan", label: "Prescription Plan" },
    ];

    const handleSuccess = (msg) => {
        setSuccessMessage(msg);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const location = useLocation();
    const navigate = useNavigate();
    const navSuccess = location.state?.successMessage;
    const openPrescriptionEditForm = location.state?.openPrescriptionEditForm;
    const prescriptionToEdit = location.state?.prescriptionToEdit;
    const openPrescriptionTab = location.state?.openPrescriptionTab;
    const openPrescriptionPlanTab = location.state?.openPrescriptionPlanTab;
    const openPlanEditForm = location.state?.openPlanEditForm;
    const planToEdit = location.state?.planToEdit;


    
    useEffect(() => {
        if (navSuccess) {
            handleSuccess(navSuccess);
            setActiveTab("prescription");
            navigate(location.pathname, { replace: true, state: {} });
        }
        else if (openPrescriptionEditForm) {
            setActiveTab("prescription");
            navigate(location.pathname, { replace: true, state: {} });
        }
        else if (openPrescriptionTab) {
            // NEW: coming back from details page
            setActiveTab("prescription");
            navigate(location.pathname, { replace: true, state: {} });
        }
        else if (openPrescriptionPlanTab) {
            // NEW: coming back from details page
            setActiveTab("plan");
            navigate(location.pathname, { replace: true, state: {} });
        }
        else if (openPlanEditForm) {
            // NEW: coming back from details page
            setActiveTab("plan");
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [navSuccess, openPrescriptionEditForm, openPrescriptionTab, openPlanEditForm, openPrescriptionPlanTab, navigate, location.pathname]);



    return (
        <>
            {/* Full-width header directly under the navbar */}
            <PageHeader title="Health Profile" />

            <SuccessAlert
                show={showSuccess}
                message={successMessage}
                onClose={() => setShowSuccess(false)}
            />

            <div className="container pt-4 pb-5 health-profile-page">
                <h2 className="fw-bold mb-4 text-start">
                    Benefit of Creating a Health Profile
                </h2>
                <p className="text-start">
                    By creating a health profile, you gain a personalized experience
                    tailored to your needs. Our system highlights any products that are
                    incompatible with your health conditions, ensuring safe and informed
                    choices. Plus, you'll easily keep track of your prescriptions,
                    helping you stay organized and in control of your health.
                </p>

                {/* Tabs header */}
                <NavigationTab
                    tabs={healthTabs}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <div className="border rounded-bottom p-4 mt-0">
                    {activeTab === "illnesses" && (
                        <IllnessesTab onSuccess={handleSuccess} />
                    )}
                    {activeTab === "allergy" && (
                        <AllergyTab onSuccess={handleSuccess} />
                    )}
                    {activeTab === "prescription" && (
                        <PrescriptionTab onSuccess={handleSuccess} startInEditMode={openPrescriptionEditForm} prescriptionToEdit={prescriptionToEdit} />
                    )}
                    {activeTab === "plan" && (
                        <PrescriptionPlanTab onSuccess={handleSuccess} startInEditMode={openPlanEditForm} planToEdit={planToEdit} />
                    )}
                </div>
            </div>
        </>
    );
}

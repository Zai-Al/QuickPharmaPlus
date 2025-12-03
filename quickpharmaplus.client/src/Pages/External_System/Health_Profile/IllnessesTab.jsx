import IllnessAllergyComponents from "../Shared_Components/IllnessAllergyComponents";

export default function IllnessesTab({ onSuccess }) {
    const illnessDropdowns = [
        {
            name: "illnessName",
            label: "Choose the illness name:",
            placeholder: "Choose Illness Name",
            columnHeader: "Name",
            options: ["Diabetes", "Hypertension", "Asthma"],
        },
        {
            name: "illnessType",
            label: "Choose the illness type:",
            placeholder: "Choose Illness Type",
            columnHeader: "Type",
            options: ["Chronic", "Acute"],
        },
        {
            name: "illnessSeverity",
            label: "Choose the illness severity:",
            placeholder: "Choose Illness Severity",
            columnHeader: "Severity",
            options: ["Mild", "Moderate", "Severe"],
        },
    ];

    return (
        <IllnessAllergyComponents
            title="Illnesses"
            singularLabel="Illness"
            listDescription={`If you have an illness, please add it to your health profile by clicking the "Add New Illness" button. By adding an illness the system will be able to notify you which products are not suitable for you.`}
            formDescription="Please describe your illness by selecting the option that best suits your condition from the list below."
            dropdowns={illnessDropdowns}
            onSuccess={onSuccess}        
        />
    );
}

import IllnessAllergyComponents from "../Shared_Components/IllnessAllergyComponents";

export default function AllergyTab({ onSuccess }) {

    const allergyDropdowns = [
        {
            name: "allergyName",
            columnHeader: "Name",
            label: "Choose the allergy name:",
            placeholder: "Choose Allergy Name",
            options: ["Peanuts", "Seafood", "Pollen"],
        },
        {
            name: "allergyType",
            columnHeader: "Type",
            label: "Choose the allergy type:",
            placeholder: "Choose Allergy Type",
            options: ["Food", "Environmental", "Medication"],
        },
        {
            name: "allergySeverity",
            columnHeader: "Severity",
            label: "Choose the allergy severity:",
            placeholder: "Choose Allergy Severity",
            options: ["Mild", "Moderate", "Severe"],
        },
    ];



    return (
        <IllnessAllergyComponents
            title="allergies"
            singularLabel="Allergy"
            listDescription={`If you have an allergy, please add it to your health profile by clicking the "Add New Allergy" button. By adding an allergy the system will be able to notify you which products are not suitable for you.`}
            formDescription="Please describe your allergy by selecting the option that best suits your condition from the list below."
            dropdowns={allergyDropdowns}
            onSuccess={onSuccess} 
            
        />
    );
}


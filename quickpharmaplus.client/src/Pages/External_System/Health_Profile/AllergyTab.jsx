import { useContext } from "react";
import { AuthContext } from "../../../Context/AuthContext";
import IllnessAllergyComponents from "../Shared_Components/IllnessAllergyComponents";

export default function AllergyTab({ onSuccess }) {
    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    return (
        <IllnessAllergyComponents
            mode="allergy"
            userId={currentUserId}
            title="Allergies"
            singularLabel="Allergy"
            listDescription={`If you have an allergy, please add it to your health profile by clicking the "Add New Allergy" button. By adding an allergy the system will be able to notify you which products are not suitable for you.`}
            formDescription="Please describe your allergy by selecting the option that best suits your condition from the list below."
            onSuccess={onSuccess}
        />
    );
}
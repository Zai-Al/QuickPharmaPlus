import { useContext } from "react";
import { AuthContext } from "../../../Context/AuthContext";
import IllnessAllergyComponents from "../Shared_Components/IllnessAllergyComponents";

export default function IllnessesTab({ onSuccess }) {
    const { user } = useContext(AuthContext);
    const currentUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    return (
        <IllnessAllergyComponents
            mode="illness"
            userId={currentUserId}
            title="Illnesses"
            singularLabel="Illness"
            listDescription={`If you have an illness, please add it to your health profile by clicking the "Add New Illness" button. By adding an illness the system will be able to notify you which products are not suitable for you.`}
            formDescription="Please describe your illness by selecting the option that best suits your condition from the list below."
            onSuccess={onSuccess}
        />
    );
}

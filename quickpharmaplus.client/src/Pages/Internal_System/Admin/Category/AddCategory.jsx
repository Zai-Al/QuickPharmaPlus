import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CategoryList.css";

import AddButton from "../../../../Components/Form/FormAddButton";
import TextField from "../../../../Components/Form/FormTextField";
import UploadButton from "../../../../Components/Form/FormUploudButton";

import ImagePreview from "../../../../Components/InternalSystem/GeneralComponents/ImagePreview";
import FormWrapper from "../../../../Components/InternalSystem/GeneralComponents/Form";

import FormHeader from "../../../../Components/InternalSystem/FormHeader";

export default function AddCategory() {

    const [categoryName, setCategoryName] = useState("");
    const [categoryImage, setCategoryImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [nameError, setNameError] = useState("");
    const [isNameTouched, setIsNameTouched] = useState(false);

    const navigate = useNavigate();

    /* ---------------------- IMAGE UPLOAD ---------------------- */
    const handleUpload = (file) => {
        setCategoryImage(file);

        if (file) {
            const previewURL = URL.createObjectURL(file);
            setPreviewImage(previewURL);
        }
    };

    /* ---------------------- VALIDATION LOGIC ---------------------- */
    const validateName = (value) => {
        if (!value.trim()) return "Category name is required.";
        if (value.trim().length < 3) return "Category name must be at least 3 characters.";
        return "";
    };

    /* ---------------------- SUBMIT FORM ---------------------- */
    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validateName(categoryName);
        setNameError(error);
        setIsNameTouched(true);

        if (error) {
            setErrorMessage(error);
            setSuccessMessage("");
            return;
        }

        const formData = new FormData();
        formData.append("CategoryName", categoryName);
        if (categoryImage) {
            formData.append("CategoryImage", categoryImage);
        }

        // Use dynamic API URL from Vite config
        const baseURL = import.meta.env.VITE_API_BASE_URL;

        try {
            const response = await fetch(`${baseURL}/api/Category/add`, {
                method: "POST",
                body: formData
            });

            console.log("Response status:", response.status);

            if (response.ok) {
                setSuccessMessage("Category added successfully!");
                setErrorMessage("");
                setTimeout(() => navigate("/categories"), 1500);
            } else {
                const errorText = await response.text();
                setErrorMessage("Failed to add category: " + errorText);
                setSuccessMessage("");
            }
        } catch (error) {
            setErrorMessage("Server error. Please try again later: " + error.message);
            setSuccessMessage("");
        }
    };

    return (
        <div className="add-category-page">
            <FormHeader title="Add New Category Record" to="/categories" />

            {/* ---------------- SUCCESS ALERT ---------------- */}
            {successMessage && (
                <div className="alert alert-dismissible alert-success">
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                    <strong>Success! </strong> {successMessage}
                </div>
            )}

            {/* ---------------- ERROR ALERT ---------------- */}
            {errorMessage && (
                <div className="alert alert-dismissible alert-danger">
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                    <strong>Error! </strong> {errorMessage}
                </div>
            )}

            <FormWrapper title="Enter New Category Details:">
                <form className="add-category-form" onSubmit={handleSubmit}>

                    <TextField
                        placeholder="Enter Category Name"
                        value={categoryName}
                        onChange={(e) => {
                            const value = e.target.value;
                            setCategoryName(value);
                            setIsNameTouched(true);
                            setNameError(validateName(value));
                        }}
                        onBlur={() => setIsNameTouched(true)}
                    />

                    {nameError && isNameTouched && (
                        <div className="invalid-feedback d-block">
                            {nameError}
                        </div>
                    )}

                    <UploadButton
                        text="Upload Category Photo"
                        onUpload={handleUpload}
                    />

                    <ImagePreview src={previewImage} />

                    <AddButton text="Add New Category" type="submit" />

                </form>
            </FormWrapper>
        </div>
    );
}

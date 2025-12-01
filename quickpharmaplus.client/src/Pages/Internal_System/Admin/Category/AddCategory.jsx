import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CategoryList.css";

import AddButton from "../../../../Components/InternalSystem/Buttons/AddButton";
import UploadButton from "../../../../Components/InternalSystem/Buttons/UploadButton";
import ImagePreview from "../../../../Components/InternalSystem/GeneralComponents/ImagePreview";
import InputTextField from "../../../../Components/InternalSystem/GeneralComponents/InputTextField";
import FormWrapper from "../../../../Components/InternalSystem/GeneralComponents/Form";

export default function AddCategory() {
    const [categoryName, setCategoryName] = useState("");
    const [categoryImage, setCategoryImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // validation
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
        if (!value.trim()) {
            return "Category name is required.";
        }
        if (value.trim().length < 3) {
            return "Category name must be at least 3 characters.";
        }
        return "";
    };

    /* -------------------------- SUBMIT FORM -------------------------- */
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

        try {
            const response = await fetch("https://localhost:7231/api/Category/add", {
                method: "POST",
                body: formData,
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
            <h2 className="add-category-title">Add Category</h2>

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

                    {/* -------- CATEGORY NAME VALIDATION -------- */}
                    <div className="form-group mb-3">
                        <InputTextField
                            placeholder="Enter Category Name"
                            value={categoryName}
                            onChange={(e) => {
                                const value = e.target.value;
                                setCategoryName(value);
                                setIsNameTouched(true);
                                setNameError(validateName(value));
                            }}
                            onBlur={() => setIsNameTouched(true)}
                            className={`form-control ${nameError && isNameTouched ? "is-invalid" : ""}`}
                        />

                        {nameError && isNameTouched && (
                            <div className="invalid-feedback d-block">
                                {nameError}
                            </div>
                        )}
                    </div>

                    {/* -------- IMAGE UPLOAD -------- */}
                    <UploadButton
                        text="Upload Category Photo"
                        onUpload={handleUpload}
                    />

                    {/* -------- IMAGE PREVIEW -------- */}
                    <ImagePreview src={previewImage} />

                    {/* -------- SUBMIT BUTTON -------- */}
                    <div className="add-btn-wrapper">
                        {/*<AddButton text="Add New Category" type="submit" />*/}
                        <button type="submit" class="add-btn-custom  d-flex align-items-center gap-4">
                    
                            <i className="bi bi-plus-circle fs-5"></i>
                            Add New Category
                        </button>

                    </div>
                </form>
            </FormWrapper>
        </div>
    );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CategoryList.css";

import AddButton from "../../../../Components/Form/FormAddButton";
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
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // SAME regex as Edit (with apostrophe)
    const validCategoryNamePattern = /^[A-Za-z .\-']*$/;

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

    /* ---------------------- CHECK FOR DUPLICATE NAME ---------------------- */
    const checkDuplicateName = async (name) => {
        if (!name.trim() || name.trim().length < 3) return;

        try {
            const response = await fetch(
                `${baseURL}/api/Category/check-name?name=${encodeURIComponent(name.trim())}`,
                { credentials: "include" }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.exists) {
                    setNameError("A category with this name already exists in the system.");
                }
            }
        } catch (error) {
            console.error("Error checking duplicate name:", error);
        }
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

        try {
            const response = await fetch(`${baseURL}/api/Category/add`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            if (response.ok) {
                setSuccessMessage("Category added successfully!");
                setErrorMessage("");
                setTimeout(() => navigate("/categories"), 1500);
            } else if (response.status === 409) {
                // Conflict - duplicate name
                setErrorMessage("A category with this name already exists in the system.");
                setNameError("A category with this name already exists in the system.");
                setSuccessMessage("");
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

            {successMessage && (
                <div className="alert alert-dismissible alert-success">
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                    <strong>Success! </strong> {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="alert alert-dismissible alert-danger">
                    <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                    <strong>Error! </strong> {errorMessage}
                </div>
            )}

            <FormWrapper title="Enter New Category Details:">
                <form className="add-category-form" onSubmit={handleSubmit}>



                    {/* NAME INPUT — LIVE VALIDATION MATCHES EDIT */}
                    <ImagePreview src={previewImage} />


                    <div className="mb-2 category-input-container" style={{ width: "80%" }}>
                        <input
                            type="text"
                            className={`form-control category-name-input ${nameError && isNameTouched ? "is-invalid" : ""}`}
                            placeholder="Enter Category Name"
                            value={categoryName}
                            onChange={(e) => {
                                const value = e.target.value;

                                if (!validCategoryNamePattern.test(value)) {
                                    setNameError("Only letters, spaces, dash (-), dot (.), and ' allowed.");
                                    setIsNameTouched(true);
                                    return;
                                }

                                setCategoryName(value);
                                setIsNameTouched(true);
                                setNameError(validateName(value));
                            }}
                            onBlur={() => {
                                setIsNameTouched(true);
                                checkDuplicateName(categoryName);
                            }}
                        />

                        {nameError && isNameTouched && (
                            <div className="invalid-feedback">
                                {nameError}
                            </div>
                        )}
                    </div>

                    <UploadButton
                        text="Upload Category Photo"
                        onUpload={handleUpload}
                    />

                    <AddButton text="Add New Category" type="submit" />

                </form>
            </FormWrapper>
        </div>
    );
}

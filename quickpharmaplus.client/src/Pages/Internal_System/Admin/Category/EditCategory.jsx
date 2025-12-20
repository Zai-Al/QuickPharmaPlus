import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CategoryList.css";

import AddButton from "../../../../Components/Form/FormAddButton";
import TextField from "../../../../Components/Form/FormTextField";
import UploadButton from "../../../../Components/Form/FormUploudButton";

import ImagePreview from "../../../../Components/InternalSystem/GeneralComponents/ImagePreview";
import FormWrapper from "../../../../Components/InternalSystem/GeneralComponents/Form";
import FormHeader from "../../../../Components/InternalSystem/FormHeader";

export default function EditCategory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    const [categoryName, setCategoryName] = useState("");
    const [originalCategoryName, setOriginalCategoryName] = useState("");
    const [categoryImage, setCategoryImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [existingImage, setExistingImage] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const [nameError, setNameError] = useState("");
    const [isNameTouched, setIsNameTouched] = useState(false);

    // Updated regex - includes ampersand (&)
    const validCategoryNamePattern = /^[A-Za-z .'\-()&]*$/;

    /* ---------------- FETCH CATEGORY ---------------- */
    useEffect(() => {
        fetchCategory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function fetchCategory() {
        try {
            const response = await fetch(`${baseURL}/api/Category/${id}`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch category");

            const data = await response.json();
            setCategoryName(data.categoryName || "");
            setOriginalCategoryName(data.categoryName || "");

            if (data.categoryImage) {
                const image = `data:image/jpeg;base64,${data.categoryImage}`;
                setExistingImage(image);
                setPreviewImage(image);
            }
        } catch {
            setErrorMessage("Unable to load category details.");
        } finally {
            setLoading(false);
        }
    }

    /* ---------------- IMAGE UPLOAD ---------------- */
    const handleUpload = (file) => {
        setCategoryImage(file);
        if (file) {
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    /* ---------------------- VALIDATION LOGIC ---------------------- */
    const validateName = (value) => {
        if (!value.trim()) return "Category name is required.";
        if (value.trim().length < 3) return "Category name must be at least 3 characters.";
        return "";
    };

    /* ---------------- CHECK FOR DUPLICATE NAME ---------------- */
    const checkDuplicateName = async (name) => {
        // Don't check if name hasn't changed
        if (name.trim().toLowerCase() === originalCategoryName.trim().toLowerCase()) {
            // Clear duplicate error if reverting to original name
            if (nameError === "A category with this name already exists in the system.") {
                setNameError("");
            }
            return;
        }

        if (!name.trim() || name.trim().length < 3) return;

        try {
            const response = await fetch(
                `${baseURL}/api/Category/check-name?name=${encodeURIComponent(name.trim())}&excludeId=${id}`,
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

    /* ---------------- LIVE VALIDATION ---------------- */
    function handleNameChange(e) {
        const value = e.target.value;

        // BLOCK invalid input and show error immediately
        if (!validCategoryNamePattern.test(value)) {
            setNameError("Only letters, spaces, dot (.), apostrophe ('), dash (-), parentheses (), and ampersand (&) allowed.");
            setIsNameTouched(true);
            return;
        }

        // Update value and validate
        setCategoryName(value);
        setIsNameTouched(true);
        
        // Run validation
        const error = validateName(value);
        setNameError(error);
    }

    /* ---------------- SUBMIT ---------------- */
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
            const response = await fetch(`${baseURL}/api/Category/${id}`, {
                method: "PUT",
                body: formData,
                credentials: "include"
            });

            if (response.ok) {
                setSuccessMessage("Category updated successfully!");
                setErrorMessage("");
                setTimeout(() => navigate("/categories"), 1500);
            } else if (response.status === 409) {
                // Conflict - duplicate name
                setErrorMessage("A category with this name already exists in the system.");
                setNameError("A category with this name already exists in the system.");
                setSuccessMessage("");
            } else {
                const text = await response.text();
                setErrorMessage("Failed to update category: " + text);
            }
        } catch (err) {
            setErrorMessage("Server error: " + err.message);
        }
    };

    /* ---------------- LOADING ---------------- */
    if (loading) {
        return (
            <div className="add-category-page">
                <FormHeader title="Edit Category Record" to="/categories" />
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" />
                    <p className="mt-2">Loading category details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="add-category-page">
            <FormHeader title="Edit Category Record" to="/categories" />

            {successMessage && (
                <div className="alert alert-dismissible alert-success">
                    <button className="btn-close" data-bs-dismiss="alert" />
                    <strong>Success!</strong> {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="alert alert-dismissible alert-danger">
                    <button className="btn-close" data-bs-dismiss="alert" />
                    <strong>Error!</strong> {errorMessage}
                </div>
            )}

            <FormWrapper title="Edit Category Details:">
                <form className="add-category-form" onSubmit={handleSubmit}>

                    {/* IMAGE PREVIEW */}
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <div
                            style={{
                                padding: "12px",
                                border: "2px dashed #3AAFA9",
                                borderRadius: "12px",
                                display: "inline-block",
                                backgroundColor: "#F9FEFE"
                            }}
                        >
                            <ImagePreview src={previewImage} />
                        </div>

                        {existingImage && !categoryImage && (
                            <div className="text-muted fst-italic small" style={{ marginTop: "8px" }}>
                                Current image is shown. Upload a new photo to replace it.
                            </div>
                        )}
                    </div>

                    {/* NAME INPUT — LIVE VALIDATION */}
                    <div className="mb-2 categor-input-container">
                        <input
                            type="text"
                            className={`form-control category-name-input ${nameError && isNameTouched ? "is-invalid" : ""}`}
                            placeholder="Enter Category Name"
                            value={categoryName}
                            onChange={handleNameChange}
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

                    {/* UPLOAD */}
                    <UploadButton
                        text="Upload Category Photo"
                        onUpload={handleUpload}
                    />

                    {/* SAVE */}
                    <AddButton text="Save Changes" type="submit" icon="file-earmark-check" />

                </form>
            </FormWrapper>
        </div>
    );
}

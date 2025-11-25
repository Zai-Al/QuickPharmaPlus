import { Link, useNavigate } from "react-router-dom";
import "./Edit_Profile_Internal.css";

export default function EditProfile_Internal() {

    const navigate = useNavigate();

    const loggedInUser = "AdminUser";

    const handleSave = () => {
        // save logic later
        navigate("/profileInternal");
    };

    return (
        <div className="edit-profile-page">

            <div className="edit-header">
                <h2 className="edit-title">Edit User Profile</h2>

                <button
                    className="btn btn-warning cancel-btn"
                    onClick={() => navigate("/profileInternal")}
                >
                    <i className="bi bi-x-lg"></i> Cancel
                </button>
            </div>



            {/* FORM */}
            <div className="edit-wrapper d-flex justify-content-center align-items-start">
                <div className="edit-box">

                    {/* FIRST NAME */}
                    <div className="mb-3">
                        <label className="edit-label">First Name</label>
                        <input
                            type="text"
                            className="form-control edit-input"
                            defaultValue={loggedInUser}
                        />
                    </div>

                    {/* LAST NAME */}
                    <div className="mb-3">
                        <label className="edit-label">Last Name</label>
                        <input
                            type="text"
                            className="form-control edit-input"
                            placeholder="Last Name"
                        />
                    </div>

                    {/* PHONE NUMBER */}
                    <div className="mb-3">
                        <label className="edit-label">Phone Number</label>
                        <input
                            type="text"
                            className="form-control edit-input"
                            placeholder="Phone Number"
                        />
                    </div>

                    {/* ADDRESS SECTION */}
                    <label className="edit-label mt-2em">Address</label>

                    <div className="row mb-3">
                        <div className="col">
                            <select className="form-select edit-input">
                                <option>City</option>
                                <option>Manama</option>
                                <option>Juffair</option>
                                <option>Isa Town</option>
                            </select>
                        </div>

                        <div className="col mb-3">
                            <input
                                type="text"
                                className="form-control edit-input"
                                placeholder="Block"
                            />
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col">
                            <input
                                type="text"
                                className="form-control edit-input"
                                placeholder="Road"
                            />
                        </div>

                        <div className="col">
                            <input
                                type="text"
                                className="form-control edit-input"
                                placeholder="Building / Floor"
                            />
                        </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <button className="btn save-btn w-100 mb-3" onClick={handleSave}>
                        Save Changes
                    </button>

                    {/* RESET PASSWORD */}
                    <p className="text-center">
                        <span className="reset-disabled">Reset Password</span>
                    </p>

                </div>
            </div>
        </div>
    );
}

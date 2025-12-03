import DropDown from "./DropDown";

export default function AddressFields({
    title = "Registered Address",
    formData = {},
    errors = {},
    handleChange,
    disabled = false,      // NEW
}) {
    return (
        <div className="mt-4 text-start">
            <h5 className="fw-bold mb-3">{title}</h5>

            {/* City + Block */}
            <div className="row">
                <div className="col-md-6 small-label">
                    <DropDown
                        label="City:"
                        name="city"
                        value={formData.city || ""}
                        onChange={handleChange}
                        placeholder="Select City"
                        options={[
                            "Manama",
                            "Muharraq",
                            "Isa Town",
                            "Riffa",
                            "Hamad Town",
                            "Sitra",
                            "Budaiya",
                            "Juffair",
                            "A'ali",
                        ]}
                        error={errors.city}
                        className="w-100"
                        disabled={disabled}   // NEW
                    />
                </div>

                <div className="col-md-6">
                    <label className="form-label fw-bold">Block:</label>
                    <input
                        type="text"
                        name="block"
                        className={`form-control ${errors.block ? "is-invalid" : ""}`}
                        value={formData.block || ""}
                        onChange={handleChange}
                        disabled={disabled}    // NEW
                    />
                    {errors.block && (
                        <div className="invalid-feedback d-block text-start">
                            {errors.block}
                        </div>
                    )}
                </div>
            </div>

            {/* Road + Building/Floor */}
            <div className="row mt-3">
                <div className="col-md-6">
                    <label className="form-label fw-bold">Road:</label>
                    <input
                        type="text"
                        name="road"
                        className={`form-control ${errors.road ? "is-invalid" : ""}`}
                        value={formData.road || ""}
                        onChange={handleChange}
                        disabled={disabled}    // NEW
                    />
                    {errors.road && (
                        <div className="invalid-feedback d-block text-start">
                            {errors.road}
                        </div>
                    )}
                </div>

                <div className="col-md-6">
                    <label className="form-label fw-bold">
                        Building Number / Floor Number:
                    </label>
                    <input
                        type="text"
                        name="buildingFloor"
                        className={`form-control ${errors.buildingFloor ? "is-invalid" : ""
                            }`}
                        value={formData.buildingFloor || ""}
                        onChange={handleChange}
                        disabled={disabled}    // NEW
                    />
                    {errors.buildingFloor && (
                        <div className="invalid-feedback d-block text-start">
                            {errors.buildingFloor}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

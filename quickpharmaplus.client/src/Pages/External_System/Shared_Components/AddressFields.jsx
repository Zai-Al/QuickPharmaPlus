// src/Pages/External_System/Shared_Components/AddressFields.jsx
// Adjust the path if your structure is slightly different

export default function AddressFields({
    title = "Address",
    formData = {},
    errors = {},
    handleChange,
    disabled = false,
    cities = [] // ?? NEW: optional list of cities
}) {
    const showCityDropdown = Array.isArray(cities) && cities.length > 0;

    return (
        <div className="address-fields">
            {title && <h5 className="fw-bold mb-3">{title}</h5>}

            <div className="row mb-3">
                <div className="col-md-6">
                    <label className="form-label fw-bold">City</label>

                    {showCityDropdown ? (
                        <select
                            name="city"
                            className="form-select"
                            value={formData.city || ""}
                            onChange={handleChange}
                            disabled={disabled}
                        >
                            <option value="">Select city</option>
                            {cities.map((c) => (
                                <option key={c.cityId} value={c.cityName}>
                                    {c.cityName}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter city"
                            name="city"
                            value={formData.city || ""}
                            onChange={handleChange}
                            disabled={disabled}
                        />
                    )}

                    {errors.city && (
                        <div className="text-danger small mt-1">{errors.city}</div>
                    )}
                </div>

                <div className="col-md-6">
                    <label className="form-label fw-bold">Block</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter block"
                        name="block"
                        value={formData.block || ""}
                        onChange={handleChange}
                        disabled={disabled}
                    />
                    {errors.block && (
                        <div className="text-danger small mt-1">{errors.block}</div>
                    )}
                </div>
            </div>

            <div className="row mb-3">
                <div className="col-md-6">
                    <label className="form-label fw-bold">Road / Street</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter road / street"
                        name="road"
                        value={formData.road || ""}
                        onChange={handleChange}
                        disabled={disabled}
                    />
                    {errors.road && (
                        <div className="text-danger small mt-1">{errors.road}</div>
                    )}
                </div>

                <div className="col-md-6">
                    <label className="form-label fw-bold">Building / Floor</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter building / floor"
                        name="buildingFloor"
                        value={formData.buildingFloor || ""}
                        onChange={handleChange}
                        disabled={disabled}
                    />
                    {errors.buildingFloor && (
                        <div className="text-danger small mt-1">{errors.buildingFloor}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

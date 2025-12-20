// src/Pages/External_System/checkoutUtils.js
export function buildCreateOrderFormData(draft, userId) {
    const fd = new FormData();

    fd.append("UserId", String(userId));

    // ---------- SHIPPING ----------
    const s = draft.shipping || {};

    fd.append("Mode", s.Mode || "pickup");
    fd.append("UseSavedAddress", String(!!s.UseSavedAddress));
    fd.append("IsUrgent", String(!!s.IsUrgent));

    if (s.PickupBranchId != null) fd.append("PickupBranchId", String(s.PickupBranchId));
    if (s.CityId != null) fd.append("CityId", String(s.CityId));
    if (s.Block) fd.append("Block", s.Block);
    if (s.Road) fd.append("Road", s.Road);
    if (s.BuildingFloor) fd.append("BuildingFloor", s.BuildingFloor);
    if (s.ShippingDate) fd.append("ShippingDate", s.ShippingDate);
    if (s.SlotId != null) fd.append("SlotId", String(s.SlotId));

    // ---------- PRESCRIPTION ----------
    const p = draft.prescription || {};

    if (p.ApprovedPrescriptionId != null) {
        fd.append("ApprovedPrescriptionId", String(p.ApprovedPrescriptionId));
    }

    fd.append("IsHealthProfile", String(!!p.IsHealthProfile));

    // IMPORTANT: you said prescriptions are already uploaded
    fd.append("UploadNewPrescription", "false");

    return fd;
}

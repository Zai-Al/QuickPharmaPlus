// src/Pages/External_System/checkoutUtils.js
export function buildCreateOrderFormData(draft, userId) {
    const fd = new FormData();

    fd.set("UserId", String(userId));

    // ---------- SHIPPING ----------
    const s = draft?.shipping || {};

    const mode = s.Mode ?? s.mode ?? "pickup";
    fd.set("Mode", String(mode));

    const useSaved = s.UseSavedAddress ?? s.useSavedAddress ?? false;
    fd.set("UseSavedAddress", String(!!useSaved));

    const urgent = s.IsUrgent ?? s.isUrgent ?? false;
    fd.set("IsUrgent", String(!!urgent));

    const pickupBranchId = s.PickupBranchId ?? s.pickupBranchId;
    if (pickupBranchId != null) fd.set("PickupBranchId", String(pickupBranchId));

    const cityId = s.CityId ?? s.cityId;
    if (cityId != null) fd.set("CityId", String(cityId));

    const block = s.Block ?? s.block;
    if (block) fd.set("Block", String(block));

    const road = s.Road ?? s.road;
    if (road) fd.set("Road", String(road));

    const buildingFloor = s.BuildingFloor ?? s.buildingFloor;
    if (buildingFloor) fd.set("BuildingFloor", String(buildingFloor));

    const shippingDate = s.ShippingDate ?? s.shippingDate;
    if (shippingDate) fd.set("ShippingDate", String(shippingDate));

    const slotId = s.SlotId ?? s.slotId;
    if (slotId != null) fd.set("SlotId", String(slotId));

    // ---------- PRESCRIPTION ----------
    const p = draft?.prescription || {};

    const approvedId = p.ApprovedPrescriptionId ?? p.approvedPrescriptionId;
    if (approvedId != null) fd.set("ApprovedPrescriptionId", String(approvedId));

    const isHP = p.IsHealthProfile ?? p.isHealthProfile ?? false;
    fd.set("IsHealthProfile", String(!!isHP));

    // Not uploading from success page
    fd.set("UploadNewPrescription", "false");

    return fd;
}

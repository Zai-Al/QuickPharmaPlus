// src/Pages/External_System/Checkout/ShippingTab.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./Checkout.css";
import DialogModal from "../Shared_Components/DialogModal";

// ---------- helpers ----------
function toISODate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function getNext7Days() {
    const today = new Date();
    const opts = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const label = d.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
        });

        opts.push({ label, value: toISODate(d) });
    }
    return opts;
}

function toHHmm(t) {
    if (!t) return "";
    const parts = String(t).split(":");
    const hh = parts[0]?.padStart(2, "0") ?? "00";
    const mm = parts[1]?.padStart(2, "0") ?? "00";
    return `${hh}:${mm}`;
}

function hhmmToMinutes(hhmm) {
    if (!hhmm || !hhmm.includes(":")) return null;
    const [h, m] = hhmm.split(":").map((x) => Number(x));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
}

function formatSlotLabel(s) {
    const start = toHHmm(s?.start ?? s?.Start);
    const end = toHHmm(s?.end ?? s?.End);
    if (start && end) return `${start} - ${end}`;
    return String(s?.slotName ?? s?.SlotName ?? "Time Slot");
}

export default function ShippingTab({
    userId,
    cartItems = [],
    savedAddress: savedAddressProp = null,
    showErrors = false,
    onStateChange,
    initialState = null,
}) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";
    const dateOptions = useMemo(() => getNext7Days(), []);

    const lastSentRef = useRef("");
    const lastValidateRef = useRef("");

    const [savedAddress, setSavedAddress] = useState(savedAddressProp);

    useEffect(() => {
        if (savedAddressProp) setSavedAddress(savedAddressProp);
    }, [savedAddressProp]);

    // mode
    const [mode, setMode] = useState("pickup"); // pickup | delivery
    const isPickup = mode === "pickup";
    const isDelivery = mode === "delivery";

    // pickup branch list
    const [branches, setBranches] = useState([]);
    const [pickupBranchId, setPickupBranchId] = useState("");

    // cities
    const [cities, setCities] = useState([]);

    // city search states
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const cityWrapRef = useRef(null);

    // delivery
    const [useSavedAddress, setUseSavedAddress] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    const [address, setAddress] = useState({
        cityId: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    // backend results
    const [resolvedBranchId, setResolvedBranchId] = useState("");
    const [unavailableProductNames, setUnavailableProductNames] = useState([]);

    // schedule
    const [shippingDateISO, setShippingDateISO] = useState("");
    const [slotId, setSlotId] = useState("");
    const [slotOptions, setSlotOptions] = useState([]);
    const [slotsByDate, setSlotsByDate] = useState({});

    // unavailable pop-up
    const [showUnavailableModal, setShowUnavailableModal] = useState(false);
    const [unavailableModalBody, setUnavailableModalBody] = useState(null);
    const lastPopupKeyRef = useRef("");

    const [urgentAvailable, setUrgentAvailable] = useState(false);
    const [urgentReason, setUrgentReason] = useState("");


    // errors shown
    const [errors, setErrors] = useState({});

    // =========================
    // HYDRATE FROM initialState
    // =========================
    const hydratedRef = useRef(false);

    useEffect(() => {
        if (!isDelivery) {
            setUrgentAvailable(false);
            setUrgentReason("");
            if (isUrgent) setIsUrgent(false);
            return;
        }

        if (!resolvedBranchId) {
            setUrgentAvailable(false);
            setUrgentReason("Select your city/branch first.");
            if (isUrgent) setIsUrgent(false);
            return;
        }

        const todayISO = toISODate(new Date());
        const todaySlots = slotsByDate?.[todayISO] || [];

        if (todaySlots.length === 0) {
            setUrgentAvailable(false);
            setUrgentReason("No slots available today.");
            if (isUrgent) setIsUrgent(false);
            return;
        }

        const now = new Date();
        const plus60 = new Date(now.getTime() + 60 * 60 * 1000);

        const nowMin = now.getHours() * 60 + now.getMinutes();
        const plusMin = plus60.getHours() * 60 + plus60.getMinutes();

        // if we crossed midnight, don’t allow urgent
        if (plusMin < nowMin) {
            setUrgentAvailable(false);
            setUrgentReason("Urgent delivery is not available at this time.");
            if (isUrgent) setIsUrgent(false);
            return;
        }

        const ok = todaySlots.some((s) => {
            const sStart = hhmmToMinutes(s.start);
            const sEnd = hhmmToMinutes(s.end);
            if (sStart == null || sEnd == null) return false;
            return sStart <= nowMin && sEnd >= plusMin;
        });

        setUrgentAvailable(ok);
        setUrgentReason(ok ? "" : "No time slot covers the next 60 minutes right now.");

        // If user had urgent ON but it becomes invalid, turn it off
        if (!ok && isUrgent) setIsUrgent(false);
    }, [isDelivery, resolvedBranchId, slotsByDate, isUrgent]);


    useEffect(() => {
        if (hydratedRef.current) return;
        if (!initialState) return;

        hydratedRef.current = true;

        const initMode = initialState.Mode ?? initialState.mode ?? "pickup";
        setMode(initMode);

        const initPickup = initialState.PickupBranchId ?? initialState.pickupBranchId ?? "";
        setPickupBranchId(initPickup ? String(initPickup) : "");

        const initUseSaved = !!(initialState.UseSavedAddress ?? initialState.useSavedAddress ?? false);
        setUseSavedAddress(initUseSaved);

        const initUrgent = !!(initialState.IsUrgent ?? initialState.isUrgent ?? false);
        setIsUrgent(initUrgent);

        setAddress({
            cityId: initialState.CityId != null ? String(initialState.CityId) : "",
            block: initialState.Block ?? initialState.block ?? "",
            road: initialState.Road ?? initialState.road ?? "",
            buildingFloor: initialState.BuildingFloor ?? initialState.buildingFloor ?? "",
        });

        // IMPORTANT: if NOT urgent, restore date+slot.
        // If urgent, we leave slot blank, but we still want date saved as TODAY (you wanted that on backend; UI can still show empty)
        const initDate = initialState.ShippingDate ?? initialState.shippingDate ?? "";
        const initSlot = initialState.SlotId ?? initialState.slotId ?? "";

        setShippingDateISO(initDate ? String(initDate) : "");
        setSlotId(initSlot ? String(initSlot) : "");
    }, [initialState]);


    // items for validation
    const validateItems = useMemo(() => {
        return (cartItems || [])
            .filter((x) => x && x.productId && Number(x.quantity) > 0)
            .map((x) => ({
                productId: Number(x.productId),
                qty: Number(x.quantity),
            }));
    }, [cartItems]);

    const validateItemsKey = useMemo(() => {
        return (validateItems || [])
            .map((x) => `${x.productId}:${x.qty}`)
            .sort()
            .join("|");
    }, [validateItems]);

    const unavailableKey = useMemo(
        () => (unavailableProductNames || []).slice().sort().join("|"),
        [unavailableProductNames]
    );

    const addressKey = useMemo(
        () => `${address.cityId}|${address.block}|${address.road}|${address.buildingFloor}`,
        [address.cityId, address.block, address.road, address.buildingFloor]
    );

    // ---------- helpers for clean state resets ----------
    const resetDeliveryScheduleAndAvailability = () => {
        setShippingDateISO("");
        setSlotId("");
        setSlotOptions([]);
        setSlotsByDate({});
        setResolvedBranchId("");
        setUnavailableProductNames([]);
        lastPopupKeyRef.current = "";
        setShowUnavailableModal(false);
    };

    const applySavedAddressToForm = (sa) => {
        if (!sa) return;

        const saCityId = sa.cityId ? String(sa.cityId) : "";
        const saCityName = sa.cityName ? String(sa.cityName) : "";

        setAddress({
            cityId: saCityId,
            block: sa.block ?? "",
            road: sa.road ?? "",
            buildingFloor: sa.buildingFloor ?? "",
        });

        setCityQuery(saCityName);
        setShowCityDropdown(false);
        setHighlightIndex(0);
    };

    const clearAddressForm = () => {
        setAddress({ cityId: "", block: "", road: "", buildingFloor: "" });
        setCityQuery("");
        setShowCityDropdown(false);
        setHighlightIndex(0);
    };

    const toggleUseSavedAddress = () => {
        const next = !useSavedAddress;

        
        lastValidateRef.current = "";
        lastSentRef.current = "";
        lastPopupKeyRef.current = "";

        resetDeliveryScheduleAndAvailability();
        setUseSavedAddress(next);

        if (next) {
            // checked ON
            applySavedAddressToForm(savedAddress);
        } else {
            // checked OFF => make fields empty again
            clearAddressForm();
        }
    };


    // ---------- fetch branches + cities ----------
    const fetchBranches = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/Branch?pageNumber=1&pageSize=500`, {
                credentials: "include",
            });
            if (!res.ok) {
                setBranches([]);
                return;
            }

            const json = await res.json();
            const raw = Array.isArray(json?.items) ? json.items : [];

            const normalized = raw
                .map((b) => ({
                    branchId: b.branchId ?? b.BranchId ?? b.id ?? b.Id,
                    cityName:
                        b.cityName ??
                        b.CityName ??
                        b.branchCityName ??
                        b.BranchCityName ??
                        "",
                    branchName: b.branchName ?? b.BranchName ?? "",
                }))
                .filter((b) => b.branchId != null);

            setBranches(normalized);
        } catch {
            setBranches([]);
        }
    };

    const fetchCities = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/cities`, { credentials: "include" });
            if (!res.ok) {
                setCities([]);
                return;
            }
            const json = await res.json();
            setCities(Array.isArray(json) ? json : []);
        } catch {
            setCities([]);
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchCities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- close city dropdown on outside click ----------
    useEffect(() => {
        const onDocMouseDown = (e) => {
            if (!cityWrapRef.current) return;
            if (!cityWrapRef.current.contains(e.target)) setShowCityDropdown(false);
        };
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, []);

    // ---------- city search helpers ----------
    const filteredCities = useMemo(() => {
        const q = (cityQuery || "").trim().toLowerCase();
        const list = cities || [];
        if (!q) return list;
        return list.filter((c) =>
            String(c.cityName ?? c.CityName ?? "").toLowerCase().includes(q)
        );
    }, [cities, cityQuery]);

    const handleCityInputChange = (e) => {
        const val = e.target.value;
        setCityQuery(val);

        // typing => city not selected
        setAddress((a) => ({ ...a, cityId: "" }));

        resetDeliveryScheduleAndAvailability();

        setShowCityDropdown(true);
        setHighlightIndex(0);
    };

    const handleCityInputFocus = () => {
        if (useSavedAddress) return;
        setShowCityDropdown(true);
        setHighlightIndex(0);
    };

    const handleSelectCity = (city) => {
        const name = city.cityName ?? city.CityName ?? "";
        const id = city.cityId ?? city.CityId ?? "";
        setCityQuery(name);
        setAddress((a) => ({ ...a, cityId: String(id) }));

        resetDeliveryScheduleAndAvailability();

        setShowCityDropdown(false);
        setHighlightIndex(0);
    };

    const handleCityKeyDown = (e) => {
        if (!showCityDropdown || useSavedAddress) return;
        const list = filteredCities || [];
        if (list.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[highlightIndex];
            if (picked) handleSelectCity(picked);
        } else if (e.key === "Escape") {
            setShowCityDropdown(false);
        }
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddress((a) => ({ ...a, [name]: value }));
    };

    // ---------- fetch saved address (PROFILE) ----------
    useEffect(() => {
        if (!userId) return;

        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/Addresses/profile?userId=${userId}`, {
                    credentials: "include",
                });

                if (!res.ok) {
                    setSavedAddress(null);
                    return;
                }

                const dto = await res.json();

                const mapped = {
                    cityId: dto?.city?.cityId ?? dto?.City?.cityId ?? dto?.city?.CityId ?? "",
                    cityName:
                        dto?.city?.cityName ??
                        dto?.City?.cityName ??
                        dto?.city?.CityName ??
                        "",
                    block: dto?.block ?? dto?.Block ?? "",
                    road: dto?.street ?? dto?.Street ?? "",
                    buildingFloor: dto?.buildingNumber ?? dto?.BuildingNumber ?? "",
                };

                setSavedAddress(mapped);
            } catch (e) {
                console.error(e);
                setSavedAddress(null);
            }
        })();
    }, [API_BASE, userId]);

    // if user toggled saved address ON before savedAddress finished loading,
    // apply it once it arrives
    useEffect(() => {
        if (!isDelivery) return;
        if (!useSavedAddress) return;
        if (!savedAddress) return;

        // force saved values
        applySavedAddressToForm(savedAddress);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDelivery, useSavedAddress, savedAddress]);

    // ---------- VALIDATE ----------
    async function validateShipping() {
        try {
            const payload = {
                UserId: Number(userId),
                Mode: mode,
                PickupBranchId: isPickup && pickupBranchId ? Number(pickupBranchId) : null,

                UseSavedAddress: isDelivery ? !!useSavedAddress : false,
                CityId: isDelivery && address.cityId ? Number(address.cityId) : null,
                Block: isDelivery ? address.block : null,
                Road: isDelivery ? address.road : null,
                BuildingFloor: isDelivery ? address.buildingFloor : null,

                IsUrgent: !!isUrgent,
                ShippingDate: shippingDateISO ? shippingDateISO : null,
                SlotId: slotId ? Number(slotId) : null,

                Items: (validateItems || []).map((x) => ({
                    ProductId: x.productId,
                    Quantity: x.qty,
                })),
            };

            const res = await fetch(`${API_BASE}/api/CheckoutShipping/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => ({}));

            const rb =
                json?.branchId ??
                json?.BranchId ??
                json?.resolvedBranchId ??
                json?.ResolvedBranchId ??
                "";

            const unavailable =
                json?.unavailableProductNames ??
                json?.unavailable ??
                json?.UnavailableProductNames ??
                [];

            const names = Array.isArray(unavailable)
                ? unavailable
                    .map((x) => (typeof x === "string" ? x : x?.name ?? x?.Name))
                    .filter(Boolean)
                : [];

            const nextRb = rb ? String(rb) : "";
            setResolvedBranchId((prev) => (prev === nextRb ? prev : nextRb));

            const nextNamesSorted = names.slice().sort();
            setUnavailableProductNames((prev) => {
                const prevKey = (prev || []).slice().sort().join("|");
                const nextKey = nextNamesSorted.join("|");
                return prevKey === nextKey ? prev : names;
            });
        } catch {
            setResolvedBranchId("");
            setUnavailableProductNames([]);
        }
    }

    useEffect(() => {
        if (!userId) return;

        if (isPickup) {
            if (!pickupBranchId) {
                setResolvedBranchId("");
                setUnavailableProductNames([]);
                return;
            }
        }

        if (isDelivery) {
            if (!useSavedAddress && !address.cityId) {
                setResolvedBranchId("");
                setUnavailableProductNames([]);
                return;
            }
            if (useSavedAddress && !savedAddress) {
                setResolvedBranchId("");
                setUnavailableProductNames([]);
                return;
            }
            // if saved is ON but for any timing reason address.cityId is empty, use saved cityId
            if (useSavedAddress && savedAddress && !address.cityId) {
                const saCityId = savedAddress.cityId ? String(savedAddress.cityId) : "";
                if (saCityId) setAddress((a) => ({ ...a, cityId: saCityId }));
            }
        }

        const key = [
            String(userId),
            mode,
            pickupBranchId || "",
            useSavedAddress ? "1" : "0",
            isDelivery && useSavedAddress
                ? `SAVED:${savedAddress?.cityId ?? ""}`
                : `ADDR:${addressKey}`,
            validateItemsKey,
        ].join("||");

        if (key === lastValidateRef.current) return;
        lastValidateRef.current = key;

        validateShipping();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        userId,
        mode,
        pickupBranchId,
        useSavedAddress,
        savedAddress,
        addressKey,
        validateItemsKey,
        isPickup,
        isDelivery,
    ]);

    // if products unavailable -> popup
    useEffect(() => {
        if (!unavailableProductNames || unavailableProductNames.length === 0) {
            lastPopupKeyRef.current = "";
            setShowUnavailableModal(false);
            return;
        }

        const key = (unavailableProductNames || []).slice().sort().join("|");
        if (key === lastPopupKeyRef.current) return;
        lastPopupKeyRef.current = key;

        setUnavailableModalBody(
            <div className="text-start">
                <p className="fw-bold mb-2">Some items are not available in this branch.</p>
                <p className="mb-2">You can't continue until you choose another city / branch or remove the item(s) from your order</p>

                <div className="fw-bold mb-1">Unavailable items:</div>
                <ul className="mb-0">
                    {unavailableProductNames.map((n, idx) => (
                        <li key={idx}>{n}</li>
                    ))}
                </ul>
            </div>
        );

        setShowUnavailableModal(true);
    }, [unavailableKey]);

    // ---------- slots ----------
    async function loadSlots(branchId) {
        try {
            const res = await fetch(
                `${API_BASE}/api/CheckoutShipping/slots?branchId=${encodeURIComponent(
                    branchId
                )}&daysAhead=6`,
                { credentials: "include" }
            );

            const json = await res.json().catch(() => null);
            const groups = Array.isArray(json) ? json : Array.isArray(json?.slots) ? json.slots : [];

            const map = {};
            for (const g of groups) {
                const date = g?.date ?? g?.Date;
                const slots = Array.isArray(g?.slots)
                    ? g.slots
                    : Array.isArray(g?.Slots)
                        ? g.Slots
                        : [];

                if (!date) continue;

                map[String(date)] = slots
                    .map((s) => ({
                        value: String(s.slotId ?? s.SlotId ?? ""),
                        label: formatSlotLabel(s),
                        start: toHHmm(s?.start ?? s?.Start ?? s?.slotStartTime ?? s?.SlotStartTime),
                        end: toHHmm(s?.end ?? s?.End ?? s?.slotEndTime ?? s?.SlotEndTime),
                    }))
                    .filter((o) => o.value);

            }

            setSlotsByDate(map);
        } catch {
            setSlotsByDate({});
        }
    }

    useEffect(() => {
        if (!isDelivery || isUrgent) return;

        if (!shippingDateISO) {
            setSlotOptions([]);
            setSlotId("");
            return;
        }

        const opts = slotsByDate[shippingDateISO] || [];
        setSlotOptions(opts);

        if (slotId && !opts.some((o) => o.value === slotId)) setSlotId("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDelivery, isUrgent, shippingDateISO, slotsByDate]);

    useEffect(() => {
        if (!isDelivery) return;

        if (isUrgent) {
            setSlotId("");
            setSlotOptions([]);
            return;
        }

        if (!resolvedBranchId) {
            setSlotOptions([]);
            setSlotId("");
            return;
        }

        loadSlots(resolvedBranchId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDelivery, isUrgent, resolvedBranchId]);

    // ---------- UI VALIDATION + send to parent ----------
    useEffect(() => {
        const numberRegex = /^[0-9]+$/;
        const newErrors = {};

        if (isPickup) {
            if (!pickupBranchId) newErrors.pickupBranch = "Please choose a pickup branch.";
            if (pickupBranchId && unavailableProductNames.length > 0)
                newErrors.pickupBranch = "Some items are not available at this branch.";
        }

        if (isDelivery) {
            if (!useSavedAddress) {
                if (!address.cityId) newErrors.city = "Please select your city.";

                if (!address.block.trim()) newErrors.block = "Please enter your block.";
                else if (!numberRegex.test(address.block.trim()))
                    newErrors.block = "Block must contain only numbers.";

                if (!address.road.trim()) newErrors.road = "Please enter your road.";
                else if (!numberRegex.test(address.road.trim()))
                    newErrors.road = "Road must contain only numbers.";

                if (!address.buildingFloor.trim())
                    newErrors.buildingFloor = "Please enter your building / floor number.";
            } else {
                // saved address on: still require cityId to exist (from savedAddress)
                if (!address.cityId) newErrors.city = "Saved address is missing a city.";
            }

            if ((address.cityId || useSavedAddress) && unavailableProductNames.length > 0) {
                newErrors.deliveryInventory =
                    "Some products are not available for delivery in your area.";
            }

            if (!isUrgent) {
                if (!shippingDateISO) newErrors.shippingDate = "Please select a shipping date.";
                if (!slotId) newErrors.shippingTime = "Please select a time slot.";
            }
        }

        const nextErrors = showErrors ? newErrors : {};
        setErrors((prev) =>
            JSON.stringify(prev) === JSON.stringify(nextErrors) ? prev : nextErrors
        );

        const hasErrors = Object.keys(newErrors).length > 0;

        const payload = {
            isValid: !hasErrors,
            mode,
            isUrgent: !!isUrgent,
            IsUrgent: !!isUrgent,

            UserId: Number(userId),
            Mode: mode,
            PickupBranchId: isPickup && pickupBranchId ? Number(pickupBranchId) : null,

            UseSavedAddress: isDelivery ? !!useSavedAddress : false,
            CityId: isDelivery && address.cityId ? Number(address.cityId) : null,
            Block: isDelivery ? address.block : null,
            Road: isDelivery ? address.road : null,
            BuildingFloor: isDelivery ? address.buildingFloor : null,

            ShippingDate: isDelivery && !isUrgent ? (shippingDateISO || null) : null,
            SlotId: isDelivery && !isUrgent && slotId ? Number(slotId) : null,

            Items: (validateItems || []).map((x) => ({
                ProductId: x.productId,
                Quantity: x.qty,
            })),
        };

        const key = JSON.stringify(payload);
        if (key === lastSentRef.current) return;
        lastSentRef.current = key;

        if (typeof onStateChange === "function") onStateChange(payload);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        showErrors,
        mode,
        pickupBranchId,
        useSavedAddress,
        addressKey,
        cityQuery,
        resolvedBranchId,
        isUrgent,
        shippingDateISO,
        slotId,
        unavailableKey,
        isPickup,
        isDelivery,
    ]);

    // ---------- UI ----------
    return (
        <div className="text-start prescription-container">
            <h3 className="fw-bold mb-3 text-center">Shipping</h3>

            {/* PICKUP */}
            <div className="prescription-option">
                <input
                    className="form-check-input"
                    type="radio"
                    name="shippingMode"
                    id="shipping-pickup"
                    value="pickup"
                    checked={isPickup}
                    onChange={() => {
                        setMode("pickup");
                        setUseSavedAddress(false);
                        setPickupBranchId("");
                        clearAddressForm();
                        resetDeliveryScheduleAndAvailability();
                        setIsUrgent(false);
                    }}
                />
                <label htmlFor="shipping-pickup" className="form-check-label">
                    Pickup
                </label>
            </div>

            {isPickup && (
                <div className="prescription-subsection">
                    <label className="form-label fw-bold">Choose Pickup Branch:</label>
                    <select
                        className="form-select"
                        value={pickupBranchId}
                        onChange={(e) => setPickupBranchId(e.target.value)}
                    >
                        <option value="">Choose Pickup Branch</option>
                        {branches.map((b) => (
                            <option key={b.branchId} value={String(b.branchId)}>
                                {(b.cityName || b.branchName || `Branch #${b.branchId}`).trim()}
                            </option>
                        ))}
                    </select>

                    {showErrors && errors.pickupBranch && (
                        <div className="text-danger small mt-1">{errors.pickupBranch}</div>
                    )}

                    {showErrors && unavailableProductNames.length > 0 && (
                        <div className="mt-2 small text-danger">
                            <div>Unavailable in this branch:</div>
                            <ul className="mb-1">
                                {unavailableProductNames.map((n, idx) => (
                                    <li key={idx}>{n}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* DELIVERY */}
            <div className="prescription-option mt-3">
                <input
                    className="form-check-input"
                    type="radio"
                    name="shippingMode"
                    id="shipping-delivery"
                    value="delivery"
                    checked={isDelivery}
                    onChange={() => {
                        setMode("delivery");
                        setPickupBranchId("");
                        resetDeliveryScheduleAndAvailability();
                    }}
                />
                <label htmlFor="shipping-delivery" className="form-check-label">
                    Delivery
                </label>
            </div>

            {isDelivery && (
                <div className="prescription-subsection">
                    <p className="text-danger small mb-3">* Delivery fee is 1 BHD</p>

                    {/* Saved address checkbox */}
                    <div className="form-checker-css mb-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="use-saved-address"
                            checked={useSavedAddress}
                            onChange={toggleUseSavedAddress}
                            disabled={!savedAddress}
                        />
                        <label htmlFor="use-saved-address" className="form-check-label ms-2">
                            Choose saved address from Profile.
                            {!savedAddress && (
                                <span className="text-muted"> (No saved address found)</span>
                            )}
                        </label>
                    </div>

                    {/* City + Block aligned */}
                    <div className="row g-3">
                        <div className="col-md-6" ref={cityWrapRef} style={{ position: "relative" }}>
                            <label className="form-label fw-bold">City</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={
                                    cities.length === 0
                                        ? "Loading cities..."
                                        : "Select city or start typing"
                                }
                                value={cityQuery}
                                onChange={handleCityInputChange}
                                onFocus={handleCityInputFocus}
                                onKeyDown={handleCityKeyDown}
                                disabled={useSavedAddress || cities.length === 0}
                                autoComplete="off"
                            />

                            {showCityDropdown && !useSavedAddress && filteredCities.length > 0 && (
                                <ul
                                    className="list-group position-absolute w-100"
                                    style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}
                                >
                                    {filteredCities.map((c, idx) => (
                                        <li
                                            key={c.cityId ?? c.CityId ?? idx}
                                            className={`list-group-item list-group-item-action ${idx === highlightIndex ? "active" : ""
                                                }`}
                                            onMouseDown={(ev) => ev.preventDefault()}
                                            onClick={() => handleSelectCity(c)}
                                            onMouseEnter={() => setHighlightIndex(idx)}
                                        >
                                            {c.cityName ?? c.CityName}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {showErrors && errors.city && (
                                <div className="text-danger small mt-1">{errors.city}</div>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">Block</label>
                            <input
                                className="form-control"
                                name="block"
                                value={address.block}
                                onChange={handleAddressChange}
                                disabled={useSavedAddress}
                            />
                            {showErrors && errors.block && (
                                <div className="text-danger small mt-1">{errors.block}</div>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">Road</label>
                            <input
                                className="form-control"
                                name="road"
                                value={address.road}
                                onChange={handleAddressChange}
                                disabled={useSavedAddress}
                            />
                            {showErrors && errors.road && (
                                <div className="text-danger small mt-1">{errors.road}</div>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">Building Number / Floor Number</label>
                            <input
                                className="form-control"
                                name="buildingFloor"
                                value={address.buildingFloor}
                                onChange={handleAddressChange}
                                disabled={useSavedAddress}
                            />
                            {showErrors && errors.buildingFloor && (
                                <div className="text-danger small mt-1">{errors.buildingFloor}</div>
                            )}
                        </div>
                    </div>

                    {showErrors && errors.deliveryInventory && unavailableProductNames.length > 0 && (
                        <div className="mt-2 small text-danger">
                            <div>Unavailable for delivery:</div>
                            <ul className="mb-1">
                                {unavailableProductNames.map((n, idx) => (
                                    <li key={idx}>{n}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Schedule */}
                    <div className="mt-4">
                        <h5 className="fw-bold mb-2">Shipping Schedule</h5>

                        <div className="form-checker-css my-4">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="urgent"
                                checked={isUrgent}
                                disabled={!urgentAvailable}
                                onChange={() => {
                                    setIsUrgent((p) => !p);
                                    // when toggling urgency, reset date/slot only
                                    setShippingDateISO("");
                                    setSlotId("");
                                    setSlotOptions([]);
                                }}
                            />
                            <label htmlFor="urgent" className="form-check-label ms-2">
                                Set Delivery Urgency (pay 1 BHD extra to get order within an hour)
                            </label>
                        </div>

                        {!urgentAvailable && (
                            <div className="small text-muted mb-3">
                                {urgentReason}
                            </div>
                        )}

                        {!isUrgent && (
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Shipping Date:</label>
                                    <select
                                        className="form-select"
                                        value={shippingDateISO}
                                        onChange={(e) => {
                                            setShippingDateISO(e.target.value);
                                            setSlotId("");
                                        }}
                                    >
                                        <option value="">Choose Shipping Date</option>
                                        {dateOptions.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>

                                    {showErrors && errors.shippingDate && (
                                        <div className="text-danger small mt-1">
                                            {errors.shippingDate}
                                        </div>
                                    )}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Shipping Time:</label>
                                    <select
                                        className="form-select"
                                        value={slotId}
                                        onChange={(e) => setSlotId(e.target.value)}
                                        disabled={
                                            !resolvedBranchId || !shippingDateISO || slotOptions.length === 0
                                        }
                                    >
                                        <option value="">
                                            {!resolvedBranchId
                                                ? "Select city first"
                                                : !shippingDateISO
                                                    ? "Select date"
                                                    : slotOptions.length === 0
                                                        ? "No available slots"
                                                        : "Choose Shipping Time"}
                                        </option>

                                        {slotOptions.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>

                                    {showErrors && errors.shippingTime && (
                                        <div className="text-danger small mt-1">
                                            {errors.shippingTime}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <DialogModal
                show={showUnavailableModal}
                title="Unavailable items"
                body={unavailableModalBody}
                confirmLabel="OK"
                cancelLabel={null}
                onCancel={() => setShowUnavailableModal(false)}
                onConfirm={() => setShowUnavailableModal(false)}
            />

            <div className="prescription-divider" />
        </div>
    );
}

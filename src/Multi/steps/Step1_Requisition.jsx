// /Multi/steps/Step1_Requisition.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { MultiContext } from "../MultiContext";
import useFormState from "../hooks/useFormState";
import useAutosave from "../hooks/useAutosave";
import useStepStatus from "../hooks/useStepStatus";
import useReminders from "../hooks/useReminders";

import bookingApi from "../../api/bookingApi";
import supplierApi from "../../api/supplierApi";
import agencyApi from "../../api/agencyApi";

import { calculateNights, guardNumber, normalizeVAT } from "../MultiUtils";

// 📅 Range calendar (same package used in BookingForm)
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

// ----------------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------------
const TAB_HOTEL = "hotel";
const TAB_AIRPORT = "airport";
const TAB_CHAUFFEUR = "chauffeur";

const isoToday = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};
const clampToday = (v) => {
  if (!v) return isoToday();
  const chosen = new Date(v);
  const today = new Date(isoToday());
  return chosen < today ? isoToday() : v;
};
const minDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};
const toISODate = (dateObj) => {
  if (!(dateObj instanceof Date) || isNaN(dateObj)) return "";
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const addDaysISO = (isoDateStr, days) => {
  if (!isoDateStr) return "";
  const d = new Date(isoDateStr);
  if (isNaN(d)) return "";
  d.setDate(d.getDate() + days);
  return toISODate(d);
};
const autoTicket = () => {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(
    d.getMinutes()
  ).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
  return `TKT-${stamp}`;
};
const suggestVehicle = (people) => {
  const p = parseInt(people || 0, 10);
  if (p <= 3) return "Sedan";
  if (p <= 5) return "MPV";
  if (p <= 8) return "Van";
  if (p <= 15) return "Mini Coach";
  return "Coach";
};
const buildRoomsArray = (count, existing = []) => {
  const next = [...existing];
  if (count > next.length) {
    for (let i = next.length; i < count; i++) {
      next.push({
        roomTypeId: null,
        roomTypeName: "",
        guestName: "",
        inclusion: "",
        adults: 2,
        children: 0,
        childrenAges: [],
      });
    }
  } else if (count < next.length) {
    next.length = count;
  }
  next.forEach((r) => {
    const c = Number(r.children || 0);
    if (r.childrenAges.length !== c) {
      r.childrenAges = Array.from({ length: c }, (_, i) => r.childrenAges[i] ?? 0);
    }
  });
  return next;
};

// ----------------------------------------------------------------------------------
// UI primitives (same look/feel as your previous requisition step)
// ----------------------------------------------------------------------------------
function Section({ title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-800 mb-3">{title}</div>
      {children}
    </div>
  );
}
function StatusBadge({ state, percent }) {
  const map = {
    ok: "bg-emerald-100 text-emerald-700 border-emerald-300",
    warn: "bg-amber-100 text-amber-700 border-amber-300",
    danger: "bg-rose-100 text-rose-700 border-rose-300",
  };
  return (
    <span className={`text-xs px-2 py-1 border rounded-md ${map[state] || ""}`}>
      Completion: {percent}%
    </span>
  );
}
function Input({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  placeholder,
  required = false,
  readOnly = false,
  min,
  max,
}) {
  return (
    <label className="text-sm text-slate-700">
      <span className="block mb-1">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      <input
        className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-blue-400 ${
          error ? "border-rose-300" : "border-slate-300"
        } ${readOnly ? "bg-slate-50" : ""}`}
        value={value ?? ""}
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        readOnly={readOnly}
        min={min}
        max={max}
      />
      {error && <div className="text-xs text-rose-600 mt-1">{error}</div>}
    </label>
  );
}
function Select({ label, value, onChange, options = [], required = false }) {
  return (
    <label className="text-sm text-slate-700">
      <span className="block mb-1">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      <select
        className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="text-sm text-slate-700 flex items-center gap-2">
      <input
        type="checkbox"
        className="accent-blue-600 w-4 h-4"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-md border transition ${
        active
          ? "border-blue-400 bg-blue-50 text-blue-700"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
      type="button"
    >
      {children}
    </button>
  );
}

// ----------------------------------------------------------------------------------
// Sub-sections for Transfers (same style as previous requisition)
// ----------------------------------------------------------------------------------
function AirportTransfer({ data, setMany, stay }) {
  const minStay = stay?.checkIn || isoToday();
  const maxStay = stay?.checkOut || undefined;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Input label="No. of People" type="number" value={data.people} onChange={(v) => setMany({ people: guardNumber(v, 0, 999) })} />
      <Input label="No. of Luggage" type="number" value={data.luggage} onChange={(v) => setMany({ luggage: guardNumber(v, 0, 999) })} />
      <Input label="Type of Vehicle" value={data.vehicle} onChange={(v) => setMany({ vehicle: v })} placeholder="Sedan / Van / Coach" />
      <Input label="Pick-up from" value={data.pickupFrom} onChange={(v) => setMany({ pickupFrom: v })} />
      <Input label="Drop-off To" value={data.dropTo} onChange={(v) => setMany({ dropTo: v })} />
      <Input label="Pick-up Date" type="date" min={minStay} max={maxStay} value={data.pickupDate} onChange={(v) => setMany({ pickupDate: v })} />
      <Input label="Pick-up Time" type="time" value={data.pickupTime} onChange={(v) => setMany({ pickupTime: v })} />
      <Input label="Drop-off Date" type="date" min={minStay} max={maxStay} value={data.dropDate} onChange={(v) => setMany({ dropDate: v })} />
      <Input label="Drop-off Time" type="time" value={data.dropTime} onChange={(v) => setMany({ dropTime: v })} />
      <Input label="Charges" type="number" value={data.charges} onChange={(v) => setMany({ charges: guardNumber(v, 0) })} />
      <Input label="Other Charges (Rates)" type="number" value={data.otherChargesRate} onChange={(v) => setMany({ otherChargesRate: guardNumber(v, 0) })} />
      <Input label="Other Charges (Nature)" value={data.otherChargesNature} onChange={(v) => setMany({ otherChargesNature: v })} />
      <Input label="Remarks" value={data.remarks} onChange={(v) => setMany({ remarks: v })} />
    </div>
  );
}
function ChauffeurTransfer({ data, setMany, stay }) {
  const minStay = stay?.checkIn || isoToday();
  const maxStay = stay?.checkOut || undefined;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Input label="No. of People" type="number" value={data.people} onChange={(v) => setMany({ people: guardNumber(v, 0, 999) })} />
      <Input label="Type of Vehicle" value={data.vehicle} onChange={(v) => setMany({ vehicle: v })} />
      <Input label="Pick-up from" value={data.pickupFrom} onChange={(v) => setMany({ pickupFrom: v })} />
      <Input label="Drop-off To" value={data.dropTo} onChange={(v) => setMany({ dropTo: v })} />
      <Input label="Pick-up Date" type="date" min={minStay} max={maxStay} value={data.pickupDate} onChange={(v) => setMany({ pickupDate: v })} />
      <Input label="Pick-up Time" type="time" value={data.pickupTime} onChange={(v) => setMany({ pickupTime: v })} />
      <Input label="Drop-off Date" type="date" min={minStay} max={maxStay} value={data.dropDate} onChange={(v) => setMany({ dropDate: v })} />
      <Input label="Drop-off Time" type="time" value={data.dropTime} onChange={(v) => setMany({ dropTime: v })} />
      <Input label="Charges" type="number" value={data.charges} onChange={(v) => setMany({ charges: guardNumber(v, 0) })} />
      <Input label="Other Charges (i) Rates" type="number" value={data.otherChargesRate} onChange={(v) => setMany({ otherChargesRate: guardNumber(v, 0) })} />
      <Input label="Other Charges (ii) Nature" value={data.otherChargesNature} onChange={(v) => setMany({ otherChargesNature: v })} />
      <Input label="Remarks" value={data.remarks} onChange={(v) => setMany({ remarks: v })} />
    </div>
  );
}

// ----------------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------------
export default function Step1_Requisition() {
  const { ticketId, formData, actions } = useContext(MultiContext);
  const [activeTab, setActiveTab] = useState(TAB_HOTEL);

  // Search dropdown / lists (reuse BookingForm API patterns)
  const [agents, setAgents] = useState([]);
  const [agentSearch, setAgentSearch] = useState("");
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);

  const [agentStaffList, setAgentStaffList] = useState([]);
  const [agentStaffSearch, setAgentStaffSearch] = useState("");
  const [showAgentStaffDropdown, setShowAgentStaffDropdown] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [subCategories, setSubCategories] = useState([]);
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const [hotels, setHotels] = useState([]);
  const [hotelQuery, setHotelQuery] = useState("");
  const [showHotelResults, setShowHotelResults] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // -----------------------------
  // Initial (Booking-like fields) but keep requisition UI
  // -----------------------------
  const initial = useMemo(() => {
    const r = formData.requisition || {};
    const tno = r.ticketNo || ticketId || autoTicket();
    const checkIn = r.checkIn || "";
    const checkOut = r.checkOut || "";
    const nights = r.nights || (checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0);

    return {
      // meta
      dateOfRequest: r.dateOfRequest || isoToday(),
      ticketNo: tno,
      remarks: r.remarks || "",

      // agent / staff / supplier / hotel (now driven by APIs)
      agencyId: r.agencyId || null,
      agencyName: r.agencyName || "",
      agencyStaffId: r.agencyStaffId || null,
      agencyStaffName: r.agencyStaffName || "",

      supplierCategoryId: r.supplierCategoryId || null,
      supplierSubCategoryId: r.supplierSubCategoryId || null,
      supplierId: r.supplierId || null,
      supplierName: r.supplierName || "",

      hotelId: r.hotelId || null,
      hotelName: r.hotelName || "",
      address: r.address || "",

      // stay
      checkIn,
      checkOut,
      nights,
      numberOfRooms: r.numberOfRooms || 1,

      // per-room details
      rooms: Array.isArray(r.rooms) ? r.rooms : buildRoomsArray(r.numberOfRooms || 1),

      // quick totals (derived)
      adults: r.adults || 0,
      children: r.children || 0,

      // commercial (buying)
      buyingCurrency: r.buyingCurrency || "GBP",
      ratePerRoom: r.ratePerRoom || "",
      otherCharges: r.otherCharges || "",

      vatPercent: r.vatPercent ?? "",
      vatInclusive: r.vatInclusive ?? true,
      commissionPercent: r.commissionPercent ?? "",
      commissionInclusive: r.commissionInclusive ?? false,

      paymentTerms: r.paymentTerms || "",
      cancellationPolicy: r.cancellationPolicy || "",
      deadlineDate: r.deadlineDate || "",

      // transfers
      airport: {
        people: r.airport?.people || "",
        luggage: r.airport?.luggage || "",
        vehicle: r.airport?.vehicle || suggestVehicle(r.airport?.people),
        pickupFrom: r.airport?.pickupFrom || "",
        dropTo: r.airport?.dropTo || "",
        pickupDate: r.airport?.pickupDate || "",
        pickupTime: r.airport?.pickupTime || "",
        dropDate: r.airport?.dropDate || "",
        dropTime: r.airport?.dropTime || "",
        charges: r.airport?.charges || "",
        otherChargesRate: r.airport?.otherChargesRate || "",
        otherChargesNature: r.airport?.otherChargesNature || "",
        remarks: r.airport?.remarks || "",
      },
      chauffeur: {
        people: r.chauffeur?.people || "",
        vehicle: r.chauffeur?.vehicle || suggestVehicle(r.chauffeur?.people),
        pickupFrom: r.chauffeur?.pickupFrom || "",
        dropTo: r.chauffeur?.dropTo || "",
        pickupDate: r.chauffeur?.pickupDate || "",
        pickupTime: r.chauffeur?.pickupTime || "",
        dropDate: r.chauffeur?.dropDate || "",
        dropTime: r.chauffeur?.dropTime || "",
        charges: r.chauffeur?.charges || "",
        otherChargesRate: r.chauffeur?.otherChargesRate || "",
        otherChargesNature: r.chauffeur?.otherChargesNature || "",
        remarks: r.chauffeur?.remarks || "",
      },
    };
  }, [formData.requisition, ticketId]);

  // -----------------------------
  // Schema (soft validation)
  // -----------------------------
  const schema = {
    dateOfRequest: { type: "string", required: true, transform: clampToday },
    ticketNo: { type: "string", required: true },
    remarks: { type: "string" },

    // api-bound ids are optional at requisition step, but enabled
    agencyId: { type: "number" },
    agencyName: { type: "string" },
    agencyStaffId: { type: "number" },
    agencyStaffName: { type: "string" },

    supplierCategoryId: { type: "number" },
    supplierSubCategoryId: { type: "number" },
    supplierId: { type: "number" },
    supplierName: { type: "string" },

    hotelId: { type: "number" },
    hotelName: { type: "string", required: true },
    address: { type: "string" },

    checkIn: { type: "string", required: true, transform: clampToday },
    checkOut: { type: "string", required: true, transform: clampToday },
    nights: { type: "number" },
    numberOfRooms: { type: "number", transform: (v) => guardNumber(v, 1, 999) },

    buyingCurrency: { type: "string", required: true },
    ratePerRoom: { type: "number", transform: (v) => guardNumber(v, 0) },
    otherCharges: { type: "string" },

    vatPercent: { type: "number", transform: normalizeVAT },
    vatInclusive: { type: "boolean" },
    commissionPercent: { type: "number", transform: normalizeVAT },
    commissionInclusive: { type: "boolean" },

    paymentTerms: { type: "string" },
    cancellationPolicy: { type: "string" },
    deadlineDate: { type: "string", transform: clampToday },
  };

  const { form, errors, setField, setMany, blurField } = useFormState({
    initial,
    schema,
    onChange: (next) => {
      // Persist entire form step to context
      actions.updateStepData("requisition", { ...next });
    },
  });

  // -----------------------------
  // Date range popup state (centered)
  // -----------------------------
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarWrapRef = useRef(null);
  const dateRange = useMemo(
    () => [
      {
        startDate: form.checkIn ? new Date(form.checkIn) : new Date(),
        endDate: form.checkOut
          ? new Date(form.checkOut)
          : new Date(new Date().setDate(new Date().getDate() + 1)),
        key: "selection",
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.checkIn, form.checkOut]
  );

  useEffect(() => {
    const onDocClick = (e) => {
      if (!calendarWrapRef.current) return;
      if (!calendarWrapRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showCalendar]);

  const handleRangeChange = (item) => {
    const start = item.selection.startDate;
    const end = item.selection.endDate;
    const isoIn = toISODate(start);
    let isoOut = toISODate(end);
    if (new Date(isoOut) <= new Date(isoIn)) isoOut = addDaysISO(isoIn, 1);

    // clamp deadline if >= check-in
    let nextDeadline = form.deadlineDate;
    if (nextDeadline && new Date(nextDeadline) >= new Date(isoIn)) {
      nextDeadline = addDaysISO(isoIn, -1);
    }

    const n = calculateNights(isoIn, isoOut);
    setMany({ checkIn: isoIn, checkOut: isoOut, nights: n, deadlineDate: nextDeadline });
  };

  // -----------------------------
  // Nights / transfer date windows clamping
  // -----------------------------
  useEffect(() => {
    if (form.checkIn && form.checkOut) {
      const n = calculateNights(form.checkIn, form.checkOut);
      if (String(n) !== String(form.nights)) setField("nights", n);
    }
  }, [form.checkIn, form.checkOut, form.nights, setField]);

  useEffect(() => {
    const minStay = form.checkIn ? new Date(form.checkIn) : new Date(isoToday());
    const maxStay = form.checkOut ? new Date(form.checkOut) : null;

    const clampBlock = (blockName) => {
      const block = form[blockName];
      if (!block) return;
      const patch = {};
      ["pickupDate", "dropDate"].forEach((k) => {
        const v = block[k];
        if (!v) return;
        const d = new Date(v);
        if (d < minStay) patch[k] = form.checkIn || isoToday();
        else if (maxStay && d > maxStay) patch[k] = form.checkOut;
      });
      if (Object.keys(patch).length) {
        setMany({ [blockName]: { ...block, ...patch } });
      }
    };

    clampBlock("airport");
    clampBlock("chauffeur");

    if (form.deadlineDate && form.checkIn && new Date(form.deadlineDate) >= new Date(form.checkIn)) {
      setField("deadlineDate", addDaysISO(form.checkIn, -1));
    }
  }, [form.checkIn, form.checkOut, form.deadlineDate, setMany, setField, form.airport, form.chauffeur]);

  // -----------------------------
  // Rooms builder
  // -----------------------------
  useEffect(() => {
    const count = Number(form.numberOfRooms || 0);
    const nextRooms = buildRoomsArray(count, form.rooms || []);
    if (JSON.stringify(nextRooms) !== JSON.stringify(form.rooms || [])) {
      setField("rooms", nextRooms);
    }
  }, [form.numberOfRooms, form.rooms, setField]);

  // Derived totals from rooms
  const totals = useMemo(() => {
    const rooms = form.rooms || [];
    const totalAdults = rooms.reduce((s, r) => s + Number(r.adults || 0), 0);
    const totalChildren = rooms.reduce((s, r) => s + Number(r.children || 0), 0);
    return { totalAdults, totalChildren, totalPeople: totalAdults + totalChildren };
  }, [form.rooms]);

  // -----------------------------
  // Autosave (1.5s)
  // -----------------------------
  useAutosave({
    ticketId: form.ticketNo || ticketId || autoTicket(),
    stepId: "requisition",
    data: { ...form, lastUpdated: new Date().toISOString() },
    onEvent: (evt) => {
      if (evt.type === "autosave:end" && evt.payload?.ok) {
        actions.pushAudit("Requisition autosaved");
      }
    },
  });

  // -----------------------------
  // Step status + mark complete
  // -----------------------------
  const requiredFields = ["dateOfRequest", "ticketNo", "hotelName", "checkIn", "checkOut", "buyingCurrency"];
  const { percent, state } = useStepStatus({ data: form, required: requiredFields });

  useEffect(() => {
    if (percent === 100) {
      actions.markComplete("requisition");
      actions.pushAudit("Requisition marked complete (auto)");
    }
  }, [percent, actions]);

  // -----------------------------
  // Reminders (idle > 3 days)
  // -----------------------------
  useReminders({
    ticketId: form.ticketNo || ticketId,
    stepId: "requisition",
    lastUpdatedIso: form?.lastUpdated,
    isStepComplete: percent === 100,
  });

  // -----------------------------
  // API data bootstrapping (reuse BookingForm endpoints)
  // -----------------------------
  // initial: agents + categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentList, categoryList] = await Promise.all([
          agencyApi.getActiveAgencies(),
          supplierApi.getCategories(),
        ]);
        setAgents(agentList || []);
        setCategories(categoryList || []);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };
    fetchData();
  }, []);

  // when agency changes → staff list
  useEffect(() => {
    if (!form.agencyId) {
      setAgentStaffList([]);
      setField("agencyStaffId", null);
      setField("agencyStaffName", "");
      return;
    }
    const fetchStaff = async () => {
      try {
        const staff = await agencyApi.getAgencyStaffByAgency(form.agencyId);
        setAgentStaffList(staff || []);
      } catch (err) {
        console.error("Failed to load agency staff:", err);
      }
    };
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.agencyId]);

  // when category changes → subcategories
  useEffect(() => {
    if (!form.supplierCategoryId) {
      setSubCategories([]);
      setSubCategorySearch("");
      setMany({
        supplierSubCategoryId: null,
        supplierId: null,
        supplierName: "",
      });
      return;
    }
    const fetchSub = async () => {
      try {
        const subcats = await supplierApi.getSubCategories(form.supplierCategoryId);
        setSubCategories(subcats || []);
      } catch (err) {
        console.error("Failed fetching subcategories:", err);
      }
    };
    fetchSub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.supplierCategoryId]);

  // when cat/subcat changes → suppliers
  useEffect(() => {
    if (!form.supplierCategoryId) {
      setSuppliers([]);
      setSupplierSearch("");
      return;
    }
    const fetchSuppliers = async () => {
      try {
        const supplierList = await supplierApi.getSuppliersByCategory(
          form.supplierCategoryId,
          form.supplierSubCategoryId
        );
        setSuppliers(supplierList || []);
      } catch (err) {
        console.error("Failed fetching suppliers:", err);
      }
    };
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.supplierCategoryId, form.supplierSubCategoryId]);

  // hotel search (debounced) — bookingApi.searchHotels
  useEffect(() => {
    if (hotelQuery.length < 2) {
      setHotels([]);
      setSearchLoading(false);
      return;
    }
    let tm = null;
    const run = async () => {
      setSearchLoading(true);
      try {
        const list = await bookingApi.searchHotels(hotelQuery);
        setHotels(Array.isArray(list) ? list : []);
        setShowHotelResults(true);
      } catch (err) {
        console.error(err);
        setHotels([]);
      } finally {
        setSearchLoading(false);
      }
    };
    tm = setTimeout(run, 300);
    return () => tm && clearTimeout(tm);
  }, [hotelQuery]);

  // select hotel -> fill hotelId, hotelName, address (auto)
  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    setHotelQuery(hotel.hotelName);
    const addressFromHotel =
      hotel.address ||
      [hotel.cityName, hotel.countryName].filter(Boolean).join(", ");
    setMany({
      hotelId: hotel.id,
      hotelName: hotel.hotelName,
      address: addressFromHotel || form.address || "",
    });
    setShowHotelResults(false);
  };

  // -----------------------------
  // Render
  // -----------------------------
  const minDateToday = minDate(0);
  const deadlineMaxISO = form.checkIn ? addDaysISO(form.checkIn, -1) : undefined;

  return (
    <div className="space-y-5">
      {/* TOP BAR */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          <span className="font-medium text-slate-800">Ticket:</span> {form.ticketNo}
        </div>
        <div className="text-xs">
          <StatusBadge state={state} percent={percent} />
        </div>
      </div>

      {/* BASIC INFO */}
      <Section title="Requisition — Basic Information">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Date of Request"
            type="date"
            min={minDateToday}
            value={form.dateOfRequest}
            onChange={(v) => setField("dateOfRequest", v)}
            onBlur={() => blurField?.("dateOfRequest")}
            error={errors.dateOfRequest}
          />
          <Input
            label="Ticket #"
            value={form.ticketNo}
            onChange={(v) => setField("ticketNo", v)}
            onBlur={() => blurField?.("ticketNo")}
            error={errors.ticketNo}
          />
          <Input label="Remarks" value={form.remarks} onChange={(v) => setField("remarks", v)} />
        </div>
      </Section>

      {/* PARTIES (now using the same API-driven searchable dropdowns as Booking) */}
      <Section title="Parties">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Agent */}
          <div>
            <label className="text-sm text-slate-700 block mb-1">Agent *</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="Search agent..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                onFocus={() => setShowAgentDropdown(true)}
                onBlur={() => setTimeout(() => setShowAgentDropdown(false), 180)}
              />
              {showAgentDropdown &&
                agents.filter((a) =>
                  a.agencyName?.toLowerCase().includes(agentSearch.toLowerCase())
                ).length > 0 && (
                  <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {agents
                      .filter((a) =>
                        a.agencyName?.toLowerCase().includes(agentSearch.toLowerCase())
                      )
                      .map((a) => (
                        <div
                          key={a.id}
                          className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                          onMouseDown={() => {
                            setMany({
                              agencyId: a.id,
                              agencyName: a.agencyName,
                              agencyStaffId: null,
                              agencyStaffName: "",
                            });
                            setAgentSearch(a.agencyName);
                            setShowAgentDropdown(false);
                          }}
                        >
                          {a.agencyName}
                        </div>
                      ))}
                  </div>
                )}
            </div>
            {form.agencyName && (
              <div className="mt-1 text-xs px-2 py-1 inline-block rounded bg-slate-100 text-slate-700">
                {form.agencyName}
              </div>
            )}
          </div>

          {/* Agent Staff */}
          <div>
            <label className="text-sm text-slate-700 block mb-1">Agent Staff</label>
            <div className="relative">
              <input
                type="text"
                disabled={!form.agencyId}
                className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                  form.agencyId ? "border-slate-300" : "border-slate-200 bg-slate-50"
                }`}
                placeholder={form.agencyId ? "Search staff..." : "Select agent first"}
                value={agentStaffSearch}
                onChange={(e) => setAgentStaffSearch(e.target.value)}
                onFocus={() => form.agencyId && setShowAgentStaffDropdown(true)}
                onBlur={() => setTimeout(() => setShowAgentStaffDropdown(false), 180)}
              />
              {showAgentStaffDropdown &&
                agentStaffList.filter((st) =>
                  (st.name || "").toLowerCase().includes(agentStaffSearch.toLowerCase())
                ).length > 0 && (
                  <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {agentStaffList
                      .filter((st) =>
                        (st.name || "").toLowerCase().includes(agentStaffSearch.toLowerCase())
                      )
                      .map((st) => (
                        <div
                          key={st.id}
                          className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                          onMouseDown={() => {
                            setMany({
                              agencyStaffId: st.id,
                              agencyStaffName: st.name,
                            });
                            setAgentStaffSearch(st.name);
                            setShowAgentStaffDropdown(false);
                          }}
                        >
                          {st.name}{" "}
                          {st.role && (
                            <span className="text-slate-400">({st.role})</span>
                          )}
                        </div>
                      ))}
                  </div>
                )}
            </div>
            {form.agencyStaffName && (
              <div className="mt-1 text-xs px-2 py-1 inline-block rounded bg-slate-100 text-slate-700">
                {form.agencyStaffName}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-slate-700 block mb-1">Category *</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="Search category..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 180)}
              />
              {showCategoryDropdown &&
                categories.filter((c) =>
                  c.name?.toLowerCase().includes(categorySearch.toLowerCase())
                ).length > 0 && (
                  <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {categories
                      .filter((c) =>
                        c.name?.toLowerCase().includes(categorySearch.toLowerCase())
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                          onMouseDown={() => {
                            setMany({
                              supplierCategoryId: c.id,
                              supplierSubCategoryId: null,
                              supplierId: null,
                              supplierName: "",
                            });
                            setCategorySearch(c.name);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          {c.name}
                        </div>
                      ))}
                  </div>
                )}
            </div>
            {form.supplierCategoryId && (
              <div className="mt-1 text-xs px-2 py-1 inline-block rounded bg-slate-100 text-slate-700">
                {categories.find((x) => x.id === form.supplierCategoryId)?.name}
              </div>
            )}
          </div>

          {/* Subcategory */}
          <div>
            <label className="text-sm text-slate-700 block mb-1">Subcategory</label>
            <div className="relative">
              <input
                type="text"
                disabled={!form.supplierCategoryId}
                className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                  form.supplierCategoryId ? "border-slate-300" : "border-slate-200 bg-slate-50"
                }`}
                placeholder={form.supplierCategoryId ? "Search subcategory..." : "Select category first"}
                value={subCategorySearch}
                onChange={(e) => setSubCategorySearch(e.target.value)}
                onFocus={() => form.supplierCategoryId && setShowSubCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowSubCategoryDropdown(false), 180)}
              />
              {showSubCategoryDropdown &&
                subCategories.filter((sc) =>
                  sc.name?.toLowerCase().includes(subCategorySearch.toLowerCase())
                ).length > 0 && (
                  <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {subCategories
                      .filter((sc) =>
                        sc.name?.toLowerCase().includes(subCategorySearch.toLowerCase())
                      )
                      .map((sc) => (
                        <div
                          key={sc.id}
                          className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                          onMouseDown={() => {
                            setMany({
                              supplierSubCategoryId: sc.id,
                              supplierId: null,
                              supplierName: "",
                            });
                            setSubCategorySearch(sc.name);
                            setShowSubCategoryDropdown(false);
                          }}
                        >
                          {sc.name}
                        </div>
                      ))}
                  </div>
                )}
            </div>
            {form.supplierSubCategoryId && (
              <div className="mt-1 text-xs px-2 py-1 inline-block rounded bg-slate-100 text-slate-700">
                {subCategories.find((x) => x.id === form.supplierSubCategoryId)?.name}
              </div>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label className="text-sm text-slate-700 block mb-1">Supplier *</label>
            <div className="relative">
              <input
                type="text"
                disabled={!form.supplierCategoryId}
                className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-blue-400 ${
                  form.supplierCategoryId ? "border-slate-300" : "border-slate-200 bg-slate-50"
                }`}
                placeholder={form.supplierCategoryId ? "Search supplier..." : "Select category first"}
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                onFocus={() => form.supplierCategoryId && setShowSupplierDropdown(true)}
                onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 180)}
              />
              {showSupplierDropdown &&
                suppliers.filter((s) =>
                  s.supplierName?.toLowerCase().includes(supplierSearch.toLowerCase())
                ).length > 0 && (
                  <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suppliers
                      .filter((s) =>
                        s.supplierName?.toLowerCase().includes(supplierSearch.toLowerCase())
                      )
                      .map((s) => (
                        <div
                          key={s.id}
                          className="px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                          onMouseDown={() => {
                            setMany({
                              supplierId: s.id,
                              supplierName: s.supplierName,
                            });
                            setSupplierSearch(s.supplierName);
                            setShowSupplierDropdown(false);
                          }}
                        >
                          {s.supplierName}
                        </div>
                      ))}
                  </div>
                )}
            </div>
            {form.supplierName && (
              <div className="mt-1 text-xs px-2 py-1 inline-block rounded bg-slate-100 text-slate-700">
                {form.supplierName}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* HOTEL DETAILS (with search + auto address) */}
      <Section title="Hotel Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-sm text-slate-700 block mb-1">Hotel *</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="Search hotels, cities, or landmarks..."
                value={hotelQuery}
                onChange={(e) => setHotelQuery(e.target.value)}
                onFocus={() => hotelQuery.length >= 2 && setShowHotelResults(true)}
                onBlur={() => setTimeout(() => setShowHotelResults(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hotels.length > 0) {
                    e.preventDefault();
                    handleHotelSelect(hotels[0]);
                  }
                }}
              />
              {hotelQuery && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onMouseDown={() => {
                    setHotelQuery("");
                    setSelectedHotel(null);
                    setMany({ hotelId: null, hotelName: "", address: "" });
                  }}
                >
                  ✕
                </button>
              )}
              {showHotelResults && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-72 overflow-auto">
                  {searchLoading ? (
                    <div className="px-3 py-2 text-sm text-slate-500">Searching hotels…</div>
                  ) : hotels.length > 0 ? (
                    hotels.map((h) => (
                      <div
                        key={h.id}
                        className={`px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer ${
                          selectedHotel?.id === h.id ? "bg-slate-50" : ""
                        }`}
                        onMouseDown={() => handleHotelSelect(h)}
                      >
                        <div className="font-medium text-slate-800">{h.hotelName}</div>
                        <div className="text-slate-500">
                          {[h.cityName, h.countryName].filter(Boolean).join(", ")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      No hotels found for “{hotelQuery}”
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedHotel && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-1 inline-block rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Selected
                </span>
                <div className="text-sm text-slate-800">
                  <strong>{selectedHotel.hotelName}</strong>{" "}
                  <span className="text-slate-500">
                    {[selectedHotel.cityName, selectedHotel.countryName].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Input
            label="Hotel Name (free text if needed)"
            required
            value={form.hotelName}
            onChange={(v) => setField("hotelName", v)}
            onBlur={() => blurField?.("hotelName")}
            error={errors.hotelName}
          />
          <Input
            label="Address (auto from hotel selection; editable)"
            value={form.address}
            onChange={(v) => setField("address", v)}
          />
        </div>

        {/* Dates - click-to-open calendar (centered) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
          <div>
            <label className="text-sm text-slate-700 block mb-1">Check-In *</label>
            <div
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-slate-800 cursor-pointer"
              onClick={() => setShowCalendar((v) => !v)}
              role="button"
              tabIndex={0}
            >
              {form.checkIn || "Select Check-In"}
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-700 block mb-1">Check-Out *</label>
            <div
              className="w-full px-3 py-2 rounded-md border border-slate-300 text-slate-800 cursor-pointer"
              onClick={() => setShowCalendar((v) => !v)}
              role="button"
              tabIndex={0}
            >
              {form.checkOut || "Select Check-Out"}
            </div>
          </div>
          <Input label="No. of Nights" type="number" readOnly value={form.nights} />
          <Input
            label="No. of Rooms"
            type="number"
            value={form.numberOfRooms}
            onChange={(v) => setField("numberOfRooms", guardNumber(v, 1))}
          />
        </div>

        {/* Centered calendar popup */}
        <div ref={calendarWrapRef} className="relative">
          {showCalendar && (
            <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl">
              <DateRange
                ranges={dateRange}
                onChange={handleRangeChange}
                moveRangeOnFirstSelection={false}
                months={1}
                direction="horizontal"
                minDate={new Date()}
                rangeColors={["#2a5adf"]}
              />
            </div>
          )}
        </div>
      </Section>

      {/* ROOMS (Dynamic Room Builder) */}
      <Section title="Room Details">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Guest Name</th>
                <th className="py-2 pr-3">Inclusion</th>
                <th className="py-2 pr-3">Adults</th>
                <th className="py-2 pr-3">Children</th>
                <th className="py-2 pr-3">Children Ages</th>
                <th className="py-2 pr-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(form.rooms || []).map((room, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-medium">Room {idx + 1}</td>
                  <td className="py-2 pr-3">
                    <input
                      className="w-full px-2 py-1 rounded border border-slate-300"
                      value={room.roomTypeName || ""}
                      placeholder="Type"
                      onChange={(e) => {
                        const next = [...form.rooms];
                        next[idx].roomTypeName = e.target.value;
                        setField("rooms", next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className="w-full px-2 py-1 rounded border border-slate-300"
                      value={room.guestName || ""}
                      placeholder="Guest Name"
                      onChange={(e) => {
                        const next = [...form.rooms];
                        next[idx].guestName = e.target.value;
                        setField("rooms", next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      className="w-full px-2 py-1 rounded border border-slate-300"
                      value={room.inclusion || ""}
                      onChange={(e) => {
                        const next = [...form.rooms];
                        next[idx].inclusion = e.target.value;
                        setField("rooms", next);
                      }}
                    >
                      <option value="">Select</option>
                      <option value="Room Only">Room Only</option>
                      <option value="With Breakfast">With Breakfast</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={1}
                      className="w-20 px-2 py-1 rounded border border-slate-300"
                      value={room.adults}
                      onChange={(e) => {
                        const v = Math.max(1, +e.target.value || 1);
                        const next = [...form.rooms];
                        next[idx].adults = v;
                        setField("rooms", next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      className="w-20 px-2 py-1 rounded border border-slate-300"
                      value={room.children}
                      onChange={(e) => {
                        const c = Math.max(0, +e.target.value || 0);
                        const next = [...form.rooms];
                        next[idx].children = c;
                        next[idx].childrenAges = Array.from({ length: c }, (_, i) => room.childrenAges?.[i] ?? 0);
                        setField("rooms", next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-2 flex-wrap">
                      {(room.childrenAges || []).map((age, aidx) => (
                        <input
                          key={aidx}
                          type="number"
                          min={0}
                          max={12}
                          className="w-16 px-2 py-1 rounded border border-slate-300"
                          value={age}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(12, +e.target.value || 0));
                            const next = [...form.rooms];
                            next[idx].childrenAges[aidx] = v;
                            setField("rooms", next);
                          }}
                          placeholder="Age"
                        />
                      ))}
                      {(!room.children || room.children === 0) && <span className="text-slate-400">–</span>}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...form.rooms];
                        next.splice(idx, 1);
                        setMany({
                          rooms: next,
                          numberOfRooms: next.length,
                        });
                      }}
                      className="text-rose-600 hover:text-rose-700 text-xs"
                    >
                      🗑️ Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Room + */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              const next = [
                ...(form.rooms || []),
                {
                  roomTypeId: null,
                  roomTypeName: "",
                  guestName: "",
                  inclusion: "",
                  adults: 2,
                  children: 0,
                  childrenAges: [],
                },
              ];
              setMany({
                rooms: next,
                numberOfRooms: next.length,
              });
            }}
            className="px-3 py-2 text-sm rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            ➕ Add Room
          </button>
        </div>

        {/* Quick Totals */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="text-sm">
            <div className="text-slate-600">Total People</div>
            <div className="font-medium text-slate-900">{totals.totalPeople}</div>
          </div>
          <div className="text-sm">
            <div className="text-slate-600">Adults</div>
            <div className="font-medium text-slate-900">{totals.totalAdults}</div>
          </div>
          <div className="text-sm">
            <div className="text-slate-600">Children</div>
            <div className="font-medium text-slate-900">{totals.totalChildren}</div>
          </div>
        </div>
      </Section>

      {/* COMMERCIAL (Buying) */}
      <Section title="Commercial (Buying)">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Select
            label="Buying Currency"
            required
            value={form.buyingCurrency}
            onChange={(v) => setField("buyingCurrency", v)}
            options={["GBP", "USD", "EUR", "AED", "INR"]}
          />
          <Input
            label="Rate per room per night"
            type="number"
            value={form.ratePerRoom}
            onChange={(v) => setField("ratePerRoom", v)}
          />
          <Input
            label="Any Other Charges / Tax"
            placeholder="Breakfast, City tax, etc."
            value={form.otherCharges}
            onChange={(v) => setField("otherCharges", v)}
          />
          <Input
            label="Payment Terms"
            value={form.paymentTerms}
            onChange={(v) => setField("paymentTerms", v)}
            placeholder="e.g. 50% advance, 50% before check-in"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <Input label="VAT %" type="number" value={form.vatPercent} onChange={(v) => setField("vatPercent", v)} />
            <Toggle label="VAT Inclusive?" checked={!!form.vatInclusive} onChange={(v) => setField("vatInclusive", v)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Commission %"
              type="number"
              value={form.commissionPercent}
              onChange={(v) => setField("commissionPercent", v)}
            />
            <Toggle
              label="Commission Inclusive?"
              checked={!!form.commissionInclusive}
              onChange={(v) => setField("commissionInclusive", v)}
            />
          </div>

          <Input label="Cancellation Policy" value={form.cancellationPolicy} onChange={(v) => setField("cancellationPolicy", v)} />
          <Input
            label="Deadline Date"
            type="date"
            min={minDate(0)}
            max={deadlineMaxISO}
            value={form.deadlineDate}
            onChange={(v) => setField("deadlineDate", v)}
          />
        </div>
      </Section>

      {/* TRANSFERS */}
      <Section title="Requisition (Transfers)">
        <div className="flex gap-2 mb-3">
          <TabButton active={activeTab === TAB_HOTEL} onClick={() => setActiveTab(TAB_HOTEL)}>
            Hotel
          </TabButton>
          <TabButton active={activeTab === TAB_AIRPORT} onClick={() => setActiveTab(TAB_AIRPORT)}>
            Airport Transfers (Pickup & Drop)
          </TabButton>
          <TabButton active={activeTab === TAB_CHAUFFEUR} onClick={() => setActiveTab(TAB_CHAUFFEUR)}>
            Other Transfers (Chauffeur)
          </TabButton>
        </div>

        {activeTab === TAB_HOTEL && (
          <div className="text-xs text-slate-500">
            Tip: Fill hotel dates first — transfer dates will auto-clamp within stay.
          </div>
        )}

        {activeTab === TAB_AIRPORT && (
          <AirportTransfer
            data={form.airport || {}}
            setMany={(patch) => setMany({ airport: { ...(form.airport || {}), ...patch } })}
            stay={{ checkIn: form.checkIn, checkOut: form.checkOut }}
          />
        )}

        {activeTab === TAB_CHAUFFEUR && (
          <ChauffeurTransfer
            data={form.chauffeur || {}}
            setMany={(patch) => setMany({ chauffeur: { ...(form.chauffeur || {}), ...patch } })}
            stay={{ checkIn: form.checkIn, checkOut: form.checkOut }}
          />
        )}
      </Section>
    </div>
  );
}

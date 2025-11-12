import React, { useContext, useEffect, useMemo, useState } from "react";
import { MultiContext } from "../MultiContext";
import useFormState from "../hooks/useFormState";
import useAutosave from "../hooks/useAutosave";
import useVersioning from "../hooks/useVersioning";
import useStepStatus from "../hooks/useStepStatus";
import {
  calculateCommercial,
  calculateNights,
  normalizeVAT,
  guardNumber,
  predictProfit,
} from "../MultiUtils";
import VersionModal from "../components/VersionModal";

/*
  Step2_Quotation.jsx
  ---------------------------------------------
  Client Quotation builder with versions + live financials.

  ✅ Automation (5):
  1) Autofill from Step 1 (requisition) for all matching fields.
  2) Hybrid Versioning: show tabs for ≤3 versions; switch to modal when >3.
  3) Live Commercial Engine: auto profit/margin/markup with FX mismatch detection.
  4) Predictive Markup Assist: suggests markup using past version history.
  5) Autosave + Validation: 1.5s debounced save; marks step complete when valid.

  Notes:
  - Accordion sections: Hotel Quotation, Airport Transfer, Chauffeur Transfer, Terms.
  - Uses context.actions.updateStepData("quotation", patch) for sync.
*/

export default function Step2_Quotation() {
  const { ticketId, formData, actions, fxRates } = useContext(MultiContext);
  const req = formData.requisition || {};
  const q = formData.quotation || {};

  // -----------------------------
  // INITIAL (Autofill from Step 1)
  // -----------------------------
  const initial = useMemo(() => {
    // Carry forward dates/rooms/nights/hotel/guest/etc. from requisition:
    const nights =
      req.nights || (req.checkIn && req.checkOut ? calculateNights(req.checkIn, req.checkOut) : 0);

    return {
      // meta
      remarks: q.remarks || "",
      dateOfQuotation: q.dateOfQuotation || isoToday(),
      ticketNo: q.ticketNo || req.ticketNo || ticketId || autoTicket(),

      // parties & hotel
      clientName: q.clientName || req.clientName || "",
      guestName: q.guestName || req.guestName || "",
      hotelName: q.hotelName || req.hotelName || "",
      address: q.address || req.address || "",
      checkIn: q.checkIn || req.checkIn || "",
      checkOut: q.checkOut || req.checkOut || "",
      nights: q.nights || nights,
      rooms: q.rooms || req.rooms || "",
      roomCategory: q.roomCategory || req.roomCategory || "",
      occupancy: q.occupancy || req.occupancy || "",
      specialRequest: q.specialRequest || req.specialRequest || "",

      // selling (hotel)
      sellingCurrency: q.sellingCurrency || "GBP",
      sellingRatePerRoom: q.sellingRatePerRoom || "",
      sellingOtherCharges: q.sellingOtherCharges || "", // Breakfast/City tax etc
      sellingVatPercent: q.sellingVatPercent ?? (Number.isFinite(req.vatPercent) ? req.vatPercent : ""),
      sellingVatInclusive: q.sellingVatInclusive ?? (req.vatInclusive ?? true),
      netSellingAmount: q.netSellingAmount || "",
      paymentTerms: q.paymentTerms || req.paymentTerms || "",
      cancellationPolicy: q.cancellationPolicy || req.cancellationPolicy || "",

      // transfers — airport
      airport: {
        people: q.airport?.people || req.airport?.people || "",
        luggage: q.airport?.luggage || req.airport?.luggage || "",
        vehicle: q.airport?.vehicle || req.airport?.vehicle || "",
        pickupFrom: q.airport?.pickupFrom || req.airport?.pickupFrom || "",
        dropTo: q.airport?.dropTo || req.airport?.dropTo || "",
        pickupDate: q.airport?.pickupDate || req.airport?.pickupDate || "",
        pickupTime: q.airport?.pickupTime || req.airport?.pickupTime || "",
        dropDate: q.airport?.dropDate || req.airport?.dropDate || "",
        dropTime: q.airport?.dropTime || req.airport?.dropTime || "",
        chargesSelling: q.airport?.chargesSelling || "",
        otherChargesRate: q.airport?.otherChargesRate || "",
        otherChargesNature: q.airport?.otherChargesNature || "",
        remarks: q.airport?.remarks || req.airport?.remarks || "",
      },

      // transfers — chauffeur
      chauffeur: {
        people: q.chauffeur?.people || req.chauffeur?.people || "",
        vehicle: q.chauffeur?.vehicle || req.chauffeur?.vehicle || "",
        pickupFrom: q.chauffeur?.pickupFrom || req.chauffeur?.pickupFrom || "",
        dropTo: q.chauffeur?.dropTo || req.chauffeur?.dropTo || "",
        pickupDate: q.chauffeur?.pickupDate || req.chauffeur?.pickupDate || "",
        pickupTime: q.chauffeur?.pickupTime || req.chauffeur?.pickupTime || "",
        dropDate: q.chauffeur?.dropDate || req.chauffeur?.dropDate || "",
        dropTime: q.chauffeur?.dropTime || req.chauffeur?.dropTime || "",
        chargesSelling: q.chauffeur?.chargesSelling || "",
        otherChargesRate: q.chauffeur?.otherChargesRate || "",
        otherChargesNature: q.chauffeur?.otherChargesNature || "",
        remarks: q.chauffeur?.remarks || req.chauffeur?.remarks || "",
      },

      // computed financials snapshot (display-only fields updated live)
      _calc: q._calc || {
        profit: 0,
        margin: 0,
        markup: 0,
        convertedBuying: 0,
      },

      // optional user override for FX
      exchangeRateOverride: q.exchangeRateOverride || "",
    };
  }, [q, req, ticketId]);

  // -----------------------------
  // FORM + Validation Schema
  // -----------------------------
  const schema = {
    remarks: { type: "string" },
    dateOfQuotation: { type: "string", required: true, transform: clampToday },
    ticketNo: { type: "string", required: true },

    clientName: { type: "string" },
    guestName: { type: "string" },
    hotelName: { type: "string", required: true },
    address: { type: "string" },
    checkIn: { type: "string", required: true, transform: clampToday },
    checkOut: { type: "string", required: true, transform: clampToday },
    nights: { type: "number" },
    rooms: { type: "number", transform: (v) => guardNumber(v, 1, 999) },
    roomCategory: { type: "string" },
    occupancy: { type: "string" },
    specialRequest: { type: "string" },

    sellingCurrency: { type: "string", required: true },
    sellingRatePerRoom: { type: "number", transform: (v) => guardNumber(v, 0) },
    sellingOtherCharges: { type: "string" },
    sellingVatPercent: { type: "number", transform: normalizeVAT },
    sellingVatInclusive: { type: "boolean" },
    netSellingAmount: { type: "number", transform: (v) => guardNumber(v, 0) },
    paymentTerms: { type: "string" },
    cancellationPolicy: { type: "string" },

    exchangeRateOverride: { type: "number", transform: (v) => guardNumber(v, 0) },
  };

  const { form, errors, setField, setMany, blurField } = useFormState({
    initial,
    schema,
    onChange: (next) => {
      actions.updateStepData("quotation", { ...next });
    },
  });

  // -----------------------------
  // Versioning (Hybrid UI)
  // -----------------------------
  const currentUser = getUser();
  const {
    versions,
    latest,
    snapshot,
    maybeSnapshotOnChange,
  } = useVersioning({
    ticketId,
    kind: "quotation",
    payload: form,
    currentUser,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const showTabs = versions.length <= 3;
  useEffect(() => {
    // auto snapshot significant changes
    maybeSnapshotOnChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sellingRatePerRoom, form.sellingCurrency, form.sellingVatPercent]);

  const createNewVersion = () => {
    snapshot({ reason: "manual" });
    actions.pushAudit("New quotation version created");
  };

  // -----------------------------
  // Live Date Logic & Nights
  // -----------------------------
  useEffect(() => {
    if (form.checkIn && form.checkOut) {
      const n = calculateNights(form.checkIn, form.checkOut);
      if (String(n) !== String(form.nights)) setField("nights", n);
    }
  }, [form.checkIn, form.checkOut, form.nights, setField]);

  // -----------------------------
  // Live Commercial Calculation
  // -----------------------------
  const buying = useMemo(() => {
    // Build minimal buying payload from Step 1 requisition (amount per room * rooms * nights + misc)
    const amount = guardNumber(req.ratePerRoom || 0, 0);
    const vatPercent = normalizeVAT(req.vatPercent ?? 0);
    const commissionable = !!req.commissionPercent;
    const commissionType = "percentage";
    const commissionValue = guardNumber(req.commissionPercent || 0, 0, 100);

    return {
      amount: amount * (Number(req.rooms || 1) || 1) * (Number(req.nights || form.nights || 1) || 1),
      vatPercent,
      vatIncluded: !!req.vatInclusive,
      additionalCosts: parseOtherCharges(req.otherCharges),
      commissionable,
      commissionType,
      commissionValue,
      currency: req.buyingCurrency || "GBP",
    };
  }, [req, form.nights]);

  const selling = useMemo(() => {
    const price = guardNumber(form.sellingRatePerRoom || 0, 0);
    const vatPercent = normalizeVAT(form.sellingVatPercent ?? 0);

    return {
      price: price * (Number(form.rooms || 1) || 1) * (Number(form.nights || 1) || 1),
      vatPercent,
      vatIncluded: !!form.sellingVatInclusive,
      incentive: false,
      discounts: parseOtherCharges(form.sellingOtherCharges),
      currency: form.sellingCurrency || "GBP",
    };
  }, [form.sellingRatePerRoom, form.sellingVatPercent, form.sellingVatInclusive, form.rooms, form.nights, form.sellingCurrency, form.sellingOtherCharges]);

  const detectedFx = useMemo(() => {
    const from = buying.currency || "GBP";
    const to = selling.currency || "GBP";
    if (from === to) return 1;
    // Prefer context fxRates if available; else allow manual override or 1
    const ctxRate = fxRates?.[from]?.[to] || fxRates?.[`${from}_${to}`];
    const override = parseFloat(form.exchangeRateOverride) || 0;
    return override || ctxRate || 1;
  }, [buying.currency, selling.currency, fxRates, form.exchangeRateOverride]);

  const calc = useMemo(() => {
    const res = calculateCommercial(buying, selling, detectedFx);
    return res;
  }, [buying, selling, detectedFx]);

  // Predictive assist
  const predictedProfit = useMemo(() => {
    const past = versions.map((v) => ({ margin: v.payload?._calc?.margin || 0 }));
    return predictProfit(past, { amount: buying.amount || 0 });
  }, [versions, buying.amount]);

  // Store computed snapshot for display
  useEffect(() => {
    setMany({ _calc: calc, netSellingAmount: guardNumber(calc?.netSelling || 0, 0) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc]);

  // -----------------------------
  // Autosave + Step Status
  // -----------------------------
  useAutosave({
    ticketId: form.ticketNo || ticketId || autoTicket(),
    stepId: "quotation",
    data: { ...form, lastUpdated: new Date().toISOString() },
  });

  const required = [
    "dateOfQuotation",
    "ticketNo",
    "hotelName",
    "checkIn",
    "checkOut",
    "sellingCurrency",
    "sellingRatePerRoom",
  ];
  const { percent, state } = useStepStatus({
    data: form,
    required,
  });

  useEffect(() => {
    if (percent === 100) {
      actions.markComplete("quotation");
      actions.pushAudit("Quotation marked complete (auto)");
    }
  }, [percent, actions]);

  // -----------------------------
  // UI State (Accordion)
  // -----------------------------
  const [open, setOpen] = useState({
    hotel: true,
    airport: false,
    chauffeur: false,
    terms: true,
  });

  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="space-y-4">
      {/* Version Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-slate-600">
          Ticket: <span className="font-semibold text-slate-800">{form.ticketNo}</span>
        </div>

        <div className="flex items-center gap-2">
          {showTabs ? (
            <div className="flex items-center gap-1">
              {versions.map((v) => (
                <span
                  key={v.version}
                  className="text-xs px-2 py-1 rounded-md border border-slate-300 bg-slate-50"
                  title={new Date(v.savedAt).toLocaleString()}
                >
                  v{v.version}
                </span>
              ))}
            </div>
          ) : (
            <button
              className="text-xs px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-50"
              onClick={() => setModalOpen(true)}
            >
              View Versions ({versions.length})
            </button>
          )}

          <button
            className="text-xs px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={createNewVersion}
          >
            New Version
          </button>

          <span className={`text-xs px-2 py-1 border rounded-md ${state === "ok"
              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
              : state === "warn"
              ? "bg-amber-100 text-amber-700 border-amber-300"
              : "bg-rose-100 text-rose-700 border-rose-300"}`}>
            Completion: {percent}%
          </span>
        </div>
      </div>

      {/* Accordions */}
      <Accordion
        title="Hotel Quotation"
        open={open.hotel}
        onToggle={() => toggle("hotel")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Date of Quotation"
            type="date"
            min={isoToday()}
            value={form.dateOfQuotation}
            onChange={(v) => setField("dateOfQuotation", v)}
            onBlur={() => blurField("dateOfQuotation")}
            error={errors.dateOfQuotation}
          />
          <Input
            label="Ticket #"
            value={form.ticketNo}
            onChange={(v) => setField("ticketNo", v)}
            onBlur={() => blurField("ticketNo")}
            error={errors.ticketNo}
          />
          <Input
            label="Remarks"
            value={form.remarks}
            onChange={(v) => setField("remarks", v)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <Input
            label="Client / Agent Name"
            value={form.clientName}
            onChange={(v) => setField("clientName", v)}
          />
          <Input
            label="Guest Name"
            value={form.guestName}
            onChange={(v) => setField("guestName", v)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <Input
            label="Hotel Name"
            required
            value={form.hotelName}
            onChange={(v) => setField("hotelName", v)}
            onBlur={() => blurField("hotelName")}
            error={errors.hotelName}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(v) => setField("address", v)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-2">
          <Input
            label="Check-In"
            type="date"
            min={isoToday()}
            value={form.checkIn}
            onChange={(v) => setField("checkIn", v)}
            onBlur={() => blurField("checkIn")}
            error={errors.checkIn}
          />
          <Input
            label="Check-Out"
            type="date"
            min={form.checkIn || isoToday()}
            value={form.checkOut}
            onChange={(v) => setField("checkOut", v)}
            onBlur={() => blurField("checkOut")}
            error={errors.checkOut}
          />
          <Input label="No. of Nights" type="number" value={form.nights} readOnly />
          <Input
            label="No. of Rooms"
            type="number"
            value={form.rooms}
            onChange={(v) => setField("rooms", v)}
          />
          <Input
            label="Room Category"
            value={form.roomCategory}
            onChange={(v) => setField("roomCategory", v)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <Input
            label="Occupancy"
            value={form.occupancy}
            onChange={(v) => setField("occupancy", v)}
          />
          <Input
            label="Special Request, If Any"
            value={form.specialRequest}
            onChange={(v) => setField("specialRequest", v)}
          />
          <Select
            label="Selling Currency"
            required
            value={form.sellingCurrency}
            onChange={(v) => setField("sellingCurrency", v)}
            options={["GBP", "USD", "EUR", "AED", "INR"]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
          <Input
            label="Rate per room per night (Selling Price)"
            type="number"
            value={form.sellingRatePerRoom}
            onChange={(v) => setField("sellingRatePerRoom", v)}
          />
          <Input
            label="Any Other Charges / Tax (Selling Price)"
            placeholder="Breakfast, City tax, etc."
            value={form.sellingOtherCharges}
            onChange={(v) => setField("sellingOtherCharges", v)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="VAT %"
              type="number"
              value={form.sellingVatPercent}
              onChange={(v) => setField("sellingVatPercent", v)}
            />
            <Toggle
              label="VAT Inclusive?"
              checked={!!form.sellingVatInclusive}
              onChange={(v) => setField("sellingVatInclusive", v)}
            />
          </div>
          <Input
            label="Net Amt. (Selling Price)"
            type="number"
            value={form.netSellingAmount}
            onChange={(v) => setField("netSellingAmount", v)}
          />
        </div>

        {/* FX helper + computed chips */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            label="Exchange Rate (override if needed)"
            type="number"
            value={form.exchangeRateOverride}
            onChange={(v) => setField("exchangeRateOverride", v)}
          />
          <Chip label={`Detected FX: ${detectedFx}`} />
          <Chip label={`Profit: ${fmt(calc?.profit)} ${form.sellingCurrency}`} />
          <Chip label={`Margin: ${fmt(calc?.margin)}% • Markup: ${fmt(calc?.markup)}%`} />
        </div>

        {/* Predictive hint */}
        <div className="mt-2 text-xs text-slate-500">
          Suggested profit (from past versions): <span className="font-medium text-slate-700">{fmt(predictedProfit)} {form.sellingCurrency}</span>
        </div>
      </Accordion>

      <Accordion
        title="Airport Transfers (Pick-up & Drop) — Selling"
        open={open.airport}
        onToggle={() => toggle("airport")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="No. of People (Adult)" type="number" value={form.airport.people}
                 onChange={(v) => setMany({ airport: { ...form.airport, people: guardNumber(v,0,999) } })} />
          <Input label="No. of Luggage (Suitcase)" type="number" value={form.airport.luggage}
                 onChange={(v) => setMany({ airport: { ...form.airport, luggage: guardNumber(v,0,999) } })} />
          <Input label="Type of Vehicle" value={form.airport.vehicle}
                 onChange={(v) => setMany({ airport: { ...form.airport, vehicle: v } })} />

          <Input label="Pick-up from" value={form.airport.pickupFrom}
                 onChange={(v) => setMany({ airport: { ...form.airport, pickupFrom: v } })} />
          <Input label="Drop-off To" value={form.airport.dropTo}
                 onChange={(v) => setMany({ airport: { ...form.airport, dropTo: v } })} />

          <Input label="Pick-up Date" type="date" min={form.checkIn || isoToday()} max={form.checkOut || undefined}
                 value={form.airport.pickupDate}
                 onChange={(v) => setMany({ airport: { ...form.airport, pickupDate: v } })} />
          <Input label="Pick-up Time" type="time" value={form.airport.pickupTime}
                 onChange={(v) => setMany({ airport: { ...form.airport, pickupTime: v } })} />

          <Input label="Drop-off Date" type="date" min={form.checkIn || isoToday()} max={form.checkOut || undefined}
                 value={form.airport.dropDate}
                 onChange={(v) => setMany({ airport: { ...form.airport, dropDate: v } })} />
          <Input label="Drop-off Time" type="time" value={form.airport.dropTime}
                 onChange={(v) => setMany({ airport: { ...form.airport, dropTime: v } })} />

          <Input label="Charges (Selling Price)" type="number" value={form.airport.chargesSelling}
                 onChange={(v) => setMany({ airport: { ...form.airport, chargesSelling: guardNumber(v,0) } })} />

          <Input label="Other Charges (i) Rate" type="number" value={form.airport.otherChargesRate}
                 onChange={(v) => setMany({ airport: { ...form.airport, otherChargesRate: guardNumber(v,0) } })} />
          <Input label="Other Charges (ii) Nature" value={form.airport.otherChargesNature}
                 onChange={(v) => setMany({ airport: { ...form.airport, otherChargesNature: v } })} />
          <Input label="Remarks" value={form.airport.remarks}
                 onChange={(v) => setMany({ airport: { ...form.airport, remarks: v } })} />
        </div>
      </Accordion>

      <Accordion
        title="Other Transfers (Chauffeur Service) — Selling"
        open={open.chauffeur}
        onToggle={() => toggle("chauffeur")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label="No. of People (Adult)" type="number" value={form.chauffeur.people}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, people: guardNumber(v,0,999) } })} />
          <Input label="Type of Vehicle" value={form.chauffeur.vehicle}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, vehicle: v } })} />

          <Input label="Pick-up from" value={form.chauffeur.pickupFrom}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, pickupFrom: v } })} />
          <Input label="Drop-off To" value={form.chauffeur.dropTo}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, dropTo: v } })} />

          <Input label="Pick-up Date" type="date" min={form.checkIn || isoToday()} max={form.checkOut || undefined}
                 value={form.chauffeur.pickupDate}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, pickupDate: v } })} />
          <Input label="Pick-up Time" type="time" value={form.chauffeur.pickupTime}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, pickupTime: v } })} />

          <Input label="Drop-off Date" type="date" min={form.checkIn || isoToday()} max={form.checkOut || undefined}
                 value={form.chauffeur.dropDate}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, dropDate: v } })} />
          <Input label="Drop-off Time" type="time" value={form.chauffeur.dropTime}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, dropTime: v } })} />

          <Input label="Charges (Selling Price)" type="number" value={form.chauffeur.chargesSelling}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, chargesSelling: guardNumber(v,0) } })} />

          <Input label="Other Charges (i) Rate" type="number" value={form.chauffeur.otherChargesRate}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, otherChargesRate: guardNumber(v,0) } })} />
          <Input label="Other Charges (ii) Nature" value={form.chauffeur.otherChargesNature}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, otherChargesNature: v } })} />
          <Input label="Remarks" value={form.chauffeur.remarks}
                 onChange={(v) => setMany({ chauffeur: { ...form.chauffeur, remarks: v } })} />
        </div>
      </Accordion>

      <Accordion
        title="Terms & Summary"
        open={open.terms}
        onToggle={() => toggle("terms")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Payment Terms"
            value={form.paymentTerms}
            onChange={(v) => setField("paymentTerms", v)}
          />
          <Input
            label="Cancellation Policy"
            value={form.cancellationPolicy}
            onChange={(v) => setField("cancellationPolicy", v)}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <Chip label={`Buying (converted): ${fmt(calc?.convertedBuying)} ${form.sellingCurrency}`} />
          <Chip label={`Net Selling: ${fmt(calc?.netSelling)} ${form.sellingCurrency}`} />
          <Chip label={`Profit: ${fmt(calc?.profit)} ${form.sellingCurrency}`} />
          <Chip label={`Margin: ${fmt(calc?.margin)}%`} />
        </div>
      </Accordion>

      {/* Versions Modal */}
      {modalOpen && (
        <VersionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          quotationData={form}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

/* -------------------------------
   UI Elements
-------------------------------- */
function Accordion({ title, open, onToggle, children }) {
  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <span className="text-slate-500">{open ? "−" : "+"}</span>
      </button>
      <div className={`px-4 pb-4 ${open ? "" : "hidden"}`}>{children}</div>
    </div>
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
        }`}
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

function Chip({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-1 text-[11px] rounded-md border border-slate-300 bg-slate-50 text-slate-700">
      {label}
    </span>
  );
}

/* -------------------------------
   Helpers
-------------------------------- */
function isoToday() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function clampToday(v) {
  if (!v) return isoToday();
  const chosen = new Date(v);
  const today = new Date(isoToday());
  return chosen < today ? isoToday() : v;
}
function autoTicket() {
  return `T${Date.now().toString().slice(-6)}`;
}
function parseOtherCharges(text) {
  // turns "Breakfast:10, CityTax:5" into [{amount:10},{amount:5}]
  if (!text || typeof text !== "string") return [];
  const arr = text.split(",").map((s) => s.trim()).filter(Boolean);
  return arr
    .map((item) => {
      const m = item.match(/([\d.]+)/);
      return { amount: m ? parseFloat(m[1]) : 0 };
    })
    .filter((x) => !isNaN(x.amount) && x.amount > 0);
}
function getUser() {
  try {
    const u = JSON.parse(localStorage.getItem("currentUser") || "null");
    return u || { name: "User" };
  } catch {
    return { name: "User" };
  }
}
function fmt(n) {
  const v = typeof n === "number" ? n : parseFloat(n || 0);
  if (isNaN(v)) return "0";
  return (Math.round(v * 100) / 100).toLocaleString();
}

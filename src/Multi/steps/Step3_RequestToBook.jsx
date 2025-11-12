// /Multi/steps/Step3_RequestToBook.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { MultiContext } from "../MultiContext";
import useFormState from "../hooks/useFormState";
import useAutosave from "../hooks/useAutosave";
import useReminders from "../hooks/useReminders";
import useStepStatus from "../hooks/useStepStatus";
import {
  calculateNights,
  guardNumber,
  normalizeVAT,
  predictProfit,
} from "../MultiUtils";

// NOTE: We assume calculateCommercial is exported from ../MultiUtils or ../utils/commercialCalculations
// If it's in another path inside Multi, update import accordingly.
import { calculateCommercial } from "../../utils/commercialCalculations";

/*
  Step3_RequestToBook.jsx — Supplier Confirmation (Request to Hotel)
  -----------------------------------------------------------------
  COMPULSORY 5 AUTOMATION FEATURES (this file implements many; these five are core):
  1) Deep Autofill from Step 1 (requisition) + Step 2 (quotation) into Step 3 fields.
  2) Dual Commission Mode (% | Amount) with cross-computation & live balance recompute.
  3) FX Auto-Fetch (context fxRates first; live API fallback) + converted totals.
  4) Autosave (1.5s) + Reminders (pending > 3 days if unpaid) + Step completion sync.
  5) Strict Date Guards: no past dates; transfer dates clamped inside stay; nights auto.

  Layout: Two-column — Left (accordion forms), Right (sticky financial cockpit).
*/

export default function Step3_RequestToBook() {
  const { ticketId, formData, actions, fxRates } = useContext(MultiContext);
  const req = formData.requisition || {};
  const quo = formData.quotation || {};
  const conf = formData.confirmation || {};

  // -----------------------------
  // INITIAL (Autofill from Steps 1 & 2)
  // -----------------------------
  const initial = useMemo(() => {
    const checkIn = conf.checkIn || quo.checkIn || req.checkIn || "";
    const checkOut = conf.checkOut || quo.checkOut || req.checkOut || "";
    const nights =
      conf.nights ||
      quo.nights ||
      req.nights ||
      (checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0);

    return {
      // meta
      remarks: conf.remarks || "",
      dateOfConfirmation: conf.dateOfConfirmation || isoToday(),
      ticketNo: conf.ticketNo || quo.ticketNo || req.ticketNo || ticketId || autoTicket(),

      // hotel + guests
      guestName: conf.guestName || quo.guestName || req.guestName || "",
      hotelName: conf.hotelName || quo.hotelName || req.hotelName || "",
      hotelReference: conf.hotelReference || "",
      address: conf.address || quo.address || req.address || "",
      checkIn,
      checkOut,
      nights,
      rooms: conf.rooms || quo.rooms || req.rooms || 1,
      roomCategory: conf.roomCategory || quo.roomCategory || req.roomCategory || "",
      occupancy: conf.occupancy || quo.occupancy || req.occupancy || "",
      specialRequest: conf.specialRequest || quo.specialRequest || req.specialRequest || "",

      // buying details (supplier side)
      buyingCurrency: conf.buyingCurrency || req.buyingCurrency || "GBP",
      buyingRatePerRoom: conf.buyingRatePerRoom || req.ratePerRoom || "",
      otherCharges: conf.otherCharges || req.otherCharges || "", // text, parsed to line items
      vatPercent: conf.vatPercent ?? (Number.isFinite(req.vatPercent) ? req.vatPercent : 0),
      vatInclusive: conf.vatInclusive ?? (req.vatInclusive ?? true),

      // commission section
      commissionFromHotelType: conf.commissionFromHotelType || "percentage", // percentage | amount
      commissionFromHotelValue: conf.commissionFromHotelValue || "",
      commissionPaid: conf.commissionPaid || 0,
      balance: conf.balance || 0,
      paid: !!conf.paid,

      paymentTerms: conf.paymentTerms || quo.paymentTerms || req.paymentTerms || "",
      cancellationPolicy: conf.cancellationPolicy || quo.cancellationPolicy || req.cancellationPolicy || "",

      // transfers — airport
      airport: {
        people: conf.airport?.people || req.airport?.people || "",
        luggage: conf.airport?.luggage || req.airport?.luggage || "",
        vehicle: conf.airport?.vehicle || req.airport?.vehicle || "",
        pickupFrom: conf.airport?.pickupFrom || req.airport?.pickupFrom || "",
        dropTo: conf.airport?.dropTo || req.airport?.dropTo || "",
        pickupDate: conf.airport?.pickupDate || req.airport?.pickupDate || "",
        pickupTime: conf.airport?.pickupTime || req.airport?.pickupTime || "",
        dropDate: conf.airport?.dropDate || req.airport?.dropDate || "",
        dropTime: conf.airport?.dropTime || req.airport?.dropTime || "",
        chargesBuying: conf.airport?.chargesBuying || "",
        otherChargesRate: conf.airport?.otherChargesRate || "",
        otherChargesNature: conf.airport?.otherChargesNature || "",
        guestContact: conf.airport?.guestContact || "",
        remarks: conf.airport?.remarks || req.airport?.remarks || "",
      },

      // transfers — chauffeur
      chauffeur: {
        people: conf.chauffeur?.people || req.chauffeur?.people || "",
        vehicle: conf.chauffeur?.vehicle || req.chauffeur?.vehicle || "",
        pickupFrom: conf.chauffeur?.pickupFrom || req.chauffeur?.pickupFrom || "",
        dropTo: conf.chauffeur?.dropTo || req.chauffeur?.dropTo || "",
        pickupDate: conf.chauffeur?.pickupDate || req.chauffeur?.pickupDate || "",
        pickupTime: conf.chauffeur?.pickupTime || req.chauffeur?.pickupTime || "",
        dropDate: conf.chauffeur?.dropDate || req.chauffeur?.dropDate || "",
        dropTime: conf.chauffeur?.dropTime || req.chauffeur?.dropTime || "",
        chargesBuying: conf.chauffeur?.chargesBuying || "",
        otherChargesRate: conf.chauffeur?.otherChargesRate || "",
        otherChargesNature: conf.chauffeur?.otherChargesNature || "",
        guestContact: conf.chauffeur?.guestContact || "",
        remarks: conf.chauffeur?.remarks || req.chauffeur?.remarks || "",
      },

      // FX override (optional)
      exchangeRateOverride: conf.exchangeRateOverride || "",

      // computed snapshot for display
      _calc: conf._calc || {
        totalBuying: 0,
        convertedBuying: 0,
        commissionAmount: 0,
        balance: 0,
        profitHint: 0,
      },
    };
  }, [ticketId, req, quo, conf]);

  // -----------------------------
  // FORM + Validation
  // -----------------------------
  const schema = {
    remarks: { type: "string" },
    dateOfConfirmation: { type: "string", required: true, transform: clampToday },
    ticketNo: { type: "string", required: true },

    guestName: { type: "string" },
    hotelName: { type: "string", required: true },
    hotelReference: { type: "string" },
    address: { type: "string" },

    checkIn: { type: "string", required: true, transform: clampToday },
    checkOut: { type: "string", required: true, transform: clampToday },
    nights: { type: "number" },
    rooms: { type: "number", transform: (v) => guardNumber(v, 1, 999) },
    roomCategory: { type: "string" },
    occupancy: { type: "string" },
    specialRequest: { type: "string" },

    buyingCurrency: { type: "string", required: true },
    buyingRatePerRoom: { type: "number", transform: (v) => guardNumber(v, 0) },
    otherCharges: { type: "string" },
    vatPercent: { type: "number", transform: normalizeVAT },
    vatInclusive: { type: "boolean" },

    commissionFromHotelType: { type: "string" }, // percentage | amount
    commissionFromHotelValue: { type: "number", transform: (v) => guardNumber(v, 0) },
    commissionPaid: { type: "number", transform: (v) => guardNumber(v, 0) },
    balance: { type: "number", transform: (v) => guardNumber(v, 0) },
    paid: { type: "boolean" },

    paymentTerms: { type: "string" },
    cancellationPolicy: { type: "string" },

    exchangeRateOverride: { type: "number", transform: (v) => guardNumber(v, 0) },
  };

  const { form, errors, setField, setMany, blurField } = useFormState({
    initial,
    schema,
    onChange: (next) => actions.updateStepData("confirmation", { ...next }),
  });

  // auto nights recompute
  useEffect(() => {
    if (form.checkIn && form.checkOut) {
      const n = calculateNights(form.checkIn, form.checkOut);
      if (String(n) !== String(form.nights)) setField("nights", n);
    }
  }, [form.checkIn, form.checkOut, form.nights, setField]);

  // -----------------------------
  // FX Rate (context first, fallback live)
  // -----------------------------
  const [loadingFx, setLoadingFx] = useState(false);
  const detectedFx = useMemo(() => {
    const from = form.buyingCurrency || "GBP";
    const to = (quo.sellingCurrency || "GBP"); // compare against selling currency if needed; here used for converted reference
    if (from === to) return 1;
    const ctx = fxRates?.[from]?.[to] || fxRates?.[`${from}_${to}`];
    const override = parseFloat(form.exchangeRateOverride) || 0;
    return override || ctx || 1;
  }, [form.buyingCurrency, quo.sellingCurrency, fxRates, form.exchangeRateOverride]);

  // optional live fallback when context missing (runs once if needed)
  useEffect(() => {
    let cancel = false;
    async function fallback() {
      if (detectedFx !== 1 || !form.buyingCurrency || !quo.sellingCurrency) return;
      if (form.buyingCurrency === quo.sellingCurrency) return;
      setLoadingFx(true);
      try {
        const url = `https://open.er-api.com/v6/latest/${form.buyingCurrency}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => null);
        const rate = data?.result === "success" ? data?.rates?.[quo.sellingCurrency] : null;
        if (!cancel && rate) setField("exchangeRateOverride", Number(rate).toFixed(4));
      } catch {
        // ignore
      } finally {
        if (!cancel) setLoadingFx(false);
      }
    }
    fallback();
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.buyingCurrency, quo.sellingCurrency]);

  // -----------------------------
  // Buying & Commission math (hotel)
  // -----------------------------
  const buyingPayload = useMemo(() => {
    const perRoom = guardNumber(form.buyingRatePerRoom || 0, 0);
    const rooms = Number(form.rooms || 1) || 1;
    const nights = Number(form.nights || 1) || 1;
    const amount = perRoom * rooms * nights;
    return {
      amount,
      vatPercent: normalizeVAT(form.vatPercent || 0),
      vatIncluded: !!form.vatInclusive,
      additionalCosts: parseOtherCharges(form.otherCharges),
      commissionable: (form.commissionFromHotelType && guardNumber(form.commissionFromHotelValue, 0) > 0),
      commissionType: form.commissionFromHotelType === "amount" ? "fixed" : "percentage",
      commissionValue: guardNumber(form.commissionFromHotelValue, 0),
      currency: form.buyingCurrency || "GBP",
    };
  }, [form.buyingRatePerRoom, form.rooms, form.nights, form.vatPercent, form.vatInclusive, form.otherCharges, form.commissionFromHotelType, form.commissionFromHotelValue, form.buyingCurrency]);

  // build selling mirror from Quotation (for profit hint only)
  const sellingPayload = useMemo(() => {
    const perRoomSell = guardNumber(quo.sellingRatePerRoom || 0, 0);
    const rooms = Number(form.rooms || 1) || 1;
    const nights = Number(form.nights || 1) || 1;
    const price = perRoomSell * rooms * nights;
    return {
      price,
      vatPercent: normalizeVAT(quo.sellingVatPercent || 0),
      vatIncluded: !!quo.sellingVatInclusive,
      incentive: false,
      discounts: parseOtherCharges(quo.sellingOtherCharges),
      currency: quo.sellingCurrency || "GBP",
    };
  }, [quo.sellingRatePerRoom, quo.sellingVatPercent, quo.sellingVatInclusive, quo.sellingOtherCharges, quo.sellingCurrency, form.rooms, form.nights]);

  const calc = useMemo(() => {
    // use quotation currency vs buying currency for conversion reference
    const fx = form.exchangeRateOverride ? parseFloat(form.exchangeRateOverride) : detectedFx || 1;
    return calculateCommercial(buyingPayload, sellingPayload, fx || 1);
  }, [buyingPayload, sellingPayload, detectedFx, form.exchangeRateOverride]);

  // commission normalized cross-values
  const commissionAmount = useMemo(() => {
    if (!buyingPayload?.commissionable) return 0;
    if (form.commissionFromHotelType === "amount") return guardNumber(form.commissionFromHotelValue, 0);
    // percentage
    const baseWithoutVat = calc?.grossBuying ? deriveBaseWithoutVat(buyingPayload) : deriveBaseWithoutVat(buyingPayload);
    return (baseWithoutVat * guardNumber(form.commissionFromHotelValue, 0)) / 100;
  }, [form.commissionFromHotelType, form.commissionFromHotelValue, buyingPayload, calc?.grossBuying]);

  // live balance engine
  const [balanceBadge, setBalanceBadge] = useState("Pending");
  useEffect(() => {
    const total = guardNumber(calc?.netBuying || 0, 0);
    const paid = guardNumber(form.commissionPaid || 0, 0);
    const bal = Math.max(total - paid, 0);
    setMany({ balance: bal, _calc: { ...form._calc, totalBuying: total, convertedBuying: calc?.convertedBuying || total, commissionAmount: commissionAmount, balance: bal } });
    setBalanceBadge(bal <= 0 ? "Settled" : form.paid ? "Partially Paid" : "Pending");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc?.netBuying, calc?.convertedBuying, form.commissionPaid, commissionAmount]);

  // predictive hint from versions (optional)
  const pastMargins = (formData?.quotationVersions || []).map((v) => v.payload?._calc?.margin || 0);
  const profitHint = useMemo(() => predictProfit(pastMargins.map((m) => ({ margin: m })), { amount: calc?.netSelling || 0 }) || 0, [pastMargins, calc?.netSelling]);

  useEffect(() => {
    setMany({ _calc: { ...form._calc, profitHint } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profitHint]);

  // -----------------------------
  // Autosave + Step Status + Reminder
  // -----------------------------
  useAutosave({
    ticketId: form.ticketNo || ticketId || autoTicket(),
    stepId: "confirmation",
    data: { ...form, lastUpdated: new Date().toISOString() },
  });

  const required = [
    "dateOfConfirmation",
    "ticketNo",
    "hotelName",
    "checkIn",
    "checkOut",
    "buyingCurrency",
    "buyingRatePerRoom",
  ];
  const { percent, state } = useStepStatus({ data: form, required });

  useEffect(() => {
    if (percent === 100 && form.paid) {
      actions.markComplete("confirmation");
      actions.pushAudit("Request to Hotel marked complete (auto)");
    }
  }, [percent, form.paid, actions]);

  // reminder if unpaid > 3 days
  useReminders({
    key: `conf-${form.ticketNo}`,
    active: (form.balance || 0) > 0 && !form.paid,
    days: 3,
    message: "Supplier confirmation pending payment for this ticket.",
  });

  // -----------------------------
  // UI State (Accordions)
  // -----------------------------
  const [open, setOpen] = useState({
    hotel: true,
    airport: false,
    chauffeur: false,
    policy: true,
  });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: Accordions (span 2) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600">
            Ticket: <span className="font-semibold text-slate-800">{form.ticketNo}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              tone={state === "ok" ? "success" : state === "warn" ? "warn" : "danger"}
              label={`Completion ${percent}%`}
            />
            <Badge
              tone={balanceBadge === "Settled" ? "success" : balanceBadge === "Partially Paid" ? "warn" : "danger"}
              label={balanceBadge}
            />
          </div>
        </div>

        {/* Hotel Confirmation (Buying) */}
        <Accordion title="Hotel Confirmation (Buying Side)" open={open.hotel} onToggle={() => toggle("hotel")}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Date of Confirmation to Hotel"
              type="date"
              min={isoToday()}
              value={form.dateOfConfirmation}
              onChange={(v) => setField("dateOfConfirmation", v)}
              onBlur={() => blurField("dateOfConfirmation")}
              error={errors.dateOfConfirmation}
              required
            />
            <Input label="Ticket #" value={form.ticketNo} onChange={(v) => setField("ticketNo", v)} onBlur={() => blurField("ticketNo")} error={errors.ticketNo} required />
            <Input label="Remarks" value={form.remarks} onChange={(v) => setField("remarks", v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Input label="Guest Name" value={form.guestName} onChange={(v) => setField("guestName", v)} />
            <Input label="Hotel Name" value={form.hotelName} onChange={(v) => setField("hotelName", v)} onBlur={() => blurField("hotelName")} error={errors.hotelName} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Input label="Hotel References" value={form.hotelReference} onChange={(v) => setField("hotelReference", v)} />
            <Input label="Address" value={form.address} onChange={(v) => setField("address", v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-2">
            <Input label="Check-In" type="date" min={isoToday()} value={form.checkIn} onChange={(v) => setField("checkIn", v)} onBlur={() => blurField("checkIn")} error={errors.checkIn} required />
            <Input label="Check-Out" type="date" min={form.checkIn || isoToday()} value={form.checkOut} onChange={(v) => setField("checkOut", v)} onBlur={() => blurField("checkOut")} error={errors.checkOut} required />
            <Input label="No. of Nights" type="number" value={form.nights} readOnly />
            <Input label="No. of Rooms" type="number" value={form.rooms} onChange={(v) => setField("rooms", v)} />
            <Input label="Room Category" value={form.roomCategory} onChange={(v) => setField("roomCategory", v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <Input label="Occupancy" value={form.occupancy} onChange={(v) => setField("occupancy", v)} />
            <Input label="Special Request, If Any" value={form.specialRequest} onChange={(v) => setField("specialRequest", v)} />
            <Select
              label="Buying Currency"
              value={form.buyingCurrency}
              onChange={(v) => setField("buyingCurrency", v)}
              options={["GBP", "USD", "EUR", "AED", "INR"]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
            <Input
              label="Buying Rate per room per night"
              type="number"
              value={form.buyingRatePerRoom}
              onChange={(v) => setField("buyingRatePerRoom", v)}
            />
            <Input
              label="Any Other Charges / Tax"
              placeholder="Breakfast, City tax, etc."
              value={form.otherCharges}
              onChange={(v) => setField("otherCharges", v)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input label="VAT %" type="number" value={form.vatPercent} onChange={(v) => setField("vatPercent", v)} />
              <Toggle label="VAT Inclusive?" checked={!!form.vatInclusive} onChange={(v) => setField("vatInclusive", v)} />
            </div>

            {/* Commission block */}
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Commission from Hotel (Type)"
                value={form.commissionFromHotelType}
                onChange={(v) => setField("commissionFromHotelType", v)}
                options={["percentage", "amount"]}
              />
              <Input
                label={`Commission Value (${form.commissionFromHotelType === "amount" ? form.buyingCurrency : "%"})`}
                type="number"
                value={form.commissionFromHotelValue}
                onChange={(v) => setField("commissionFromHotelValue", v)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
            <Input
              label="Commission Paid"
              type="number"
              value={form.commissionPaid}
              onChange={(v) => setField("commissionPaid", v)}
            />
            <Input label="Balance" type="number" value={form.balance} readOnly />
            <Toggle label="Paid?" checked={!!form.paid} onChange={(v) => setField("paid", v)} />
            <Input
              label="FX Override"
              type="number"
              value={form.exchangeRateOverride}
              onChange={(v) => setField("exchangeRateOverride", v)}
            />
          </div>

          <div className="text-[11px] text-slate-500 mt-1">
            {loadingFx ? "Fetching live FX..." : `Detected FX: ${fmt(detectedFx)} (${form.buyingCurrency} → ${quo.sellingCurrency || form.buyingCurrency})`}
          </div>
        </Accordion>

        {/* Airport Transfers */}
        <Accordion title="CONFIRMATION (Transfers) — Airport Pick-up & Drop (Buying)" open={open.airport} onToggle={() => toggle("airport")}>
          <TransfersSection
            data={form.airport}
            setData={(patch) => setMany({ airport: { ...form.airport, ...patch } })}
            checkIn={form.checkIn}
            checkOut={form.checkOut}
          />
        </Accordion>

        {/* Chauffeur */}
        <Accordion title="CONFIRMATION (Transfers) — Chauffeur Service (Buying)" open={open.chauffeur} onToggle={() => toggle("chauffeur")}>
          <ChauffeurSection
            data={form.chauffeur}
            setData={(patch) => setMany({ chauffeur: { ...form.chauffeur, ...patch } })}
            checkIn={form.checkIn}
            checkOut={form.checkOut}
          />
        </Accordion>

        {/* Policy & Summary */}
        <Accordion title="Payment & Policy Summary" open={open.policy} onToggle={() => toggle("policy")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Payment Terms" value={form.paymentTerms} onChange={(v) => setField("paymentTerms", v)} />
            <Input label="Cancellation Policy" value={form.cancellationPolicy} onChange={(v) => setField("cancellationPolicy", v)} />
          </div>
        </Accordion>
      </div>

      {/* RIGHT: Sticky Financial Summary */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-4">
          <div className="border border-slate-200 rounded-xl bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Financial Summary (Real-Time)</div>
              <Badge
                tone={form.paid ? "success" : (form.balance || 0) > 0 ? "warn" : "success"}
                label={form.paid ? "Paid" : (form.balance || 0) > 0 ? "Unpaid" : "Paid"}
              />
            </div>

            <Divider />

            <Row label="Buying Currency" value={form.buyingCurrency} />
            <Row label="Rooms × Nights" value={`${form.rooms || 1} × ${form.nights || 1}`} />
            <Row label="Rate per Room" value={`${fmt(form.buyingRatePerRoom)} ${form.buyingCurrency}`} />
            <Row label="VAT" value={`${fmt(form.vatPercent)}% (${form.vatInclusive ? "Inclusive" : "Excluding"})`} />
            <Row label="Other Charges" value={fmt(sumCharges(parseOtherCharges(form.otherCharges)))} />

            <Divider />

            <Row label="Total Buying (Net)" value={`${fmt(calc?.netBuying)} ${form.buyingCurrency}`} />
            <Row
              label={`Converted (${form.buyingCurrency} → ${quo.sellingCurrency || form.buyingCurrency})`}
              value={`${fmt(calc?.convertedBuying)} ${quo.sellingCurrency || form.buyingCurrency}`}
              detail={`FX ${fmt(detectedFx)}`}
            />

            <Divider />

            <Row
              label={`Commission (${form.commissionFromHotelType === "amount" ? form.buyingCurrency : "%"})`}
              value={
                form.commissionFromHotelType === "amount"
                  ? `${fmt(form.commissionFromHotelValue)} ${form.buyingCurrency}`
                  : `${fmt(form.commissionFromHotelValue)} %`
              }
              detail={`Amount: ${fmt(commissionAmount)} ${form.buyingCurrency}`}
            />
            <Row label="Commission Paid" value={`${fmt(form.commissionPaid)} ${form.buyingCurrency}`} />
            <Row label="Balance" value={`${fmt(form.balance)} ${form.buyingCurrency}`} />

            <div className="text-[11px] text-slate-500">
              {form.paid ? "All dues settled." : "Balance pending. Auto-reminder in 3 days."}
            </div>

            <Divider />

            {/* Mini analytics stacked bar */}
            <AnalyticsBar
              profitPct={safePct(calc?.profit, calc?.netSelling)} // vs selling hint
              commissionPct={safePct(commissionAmount, calc?.netBuying)}
              balancePct={safePct(form.balance, calc?.netBuying)}
            />

            <div className="text-[11px] text-slate-500">
              Profit hint (from past versions): {fmt(form._calc?.profitHint)} {quo.sellingCurrency || form.buyingCurrency}
            </div>

            <div className="text-[11px] text-slate-400">💾 Autosaving every 1.5s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------
   Subsections (Transfers)
-------------------------------- */
function TransfersSection({ data, setData, checkIn, checkOut }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Input label="No. of People" type="number" value={data.people} onChange={(v) => setData({ people: guardNumber(v, 0, 999) })} />
      <Input label="No. of Luggage" type="number" value={data.luggage} onChange={(v) => setData({ luggage: guardNumber(v, 0, 999) })} />
      <Input label="Type of Vehicle" value={data.vehicle} onChange={(v) => setData({ vehicle: v })} />

      <Input label="Pick-up from" value={data.pickupFrom} onChange={(v) => setData({ pickupFrom: v })} />
      <Input label="Drop-off To" value={data.dropTo} onChange={(v) => setData({ dropTo: v })} />

      <Input label="Pick-up Date" type="date" min={checkIn || isoToday()} max={checkOut || undefined} value={data.pickupDate} onChange={(v) => setData({ pickupDate: v })} />
      <Input label="Pick-up Time" type="time" value={data.pickupTime} onChange={(v) => setData({ pickupTime: v })} />

      <Input label="Drop-off Date" type="date" min={checkIn || isoToday()} max={checkOut || undefined} value={data.dropDate} onChange={(v) => setData({ dropDate: v })} />
      <Input label="Drop-off Time" type="time" value={data.dropTime} onChange={(v) => setData({ dropTime: v })} />

      <Input label="Charges (Buying)" type="number" value={data.chargesBuying} onChange={(v) => setData({ chargesBuying: guardNumber(v, 0) })} />

      <Input label="Other Charges (i) Rate" type="number" value={data.otherChargesRate} onChange={(v) => setData({ otherChargesRate: guardNumber(v, 0) })} />
      <Input label="Other Charges (ii) Nature" value={data.otherChargesNature} onChange={(v) => setData({ otherChargesNature: v })} />
      <Input label="Guest Contact Details" value={data.guestContact} onChange={(v) => setData({ guestContact: v })} />
      <Input label="Remarks" value={data.remarks} onChange={(v) => setData({ remarks: v })} />
    </div>
  );
}

function ChauffeurSection(props) {
  // identical structure to TransfersSection (different labels kept for clarity)
  return <TransfersSection {...props} />;
}

/* -------------------------------
   UI Elements
-------------------------------- */
function Accordion({ title, open, onToggle, children }) {
  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <span className="text-slate-500">{open ? "−" : "+"}</span>
      </button>
      <div className={`px-4 pb-4 ${open ? "" : "hidden"}`}>{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, onBlur, error, type = "text", placeholder, required = false, readOnly = false, min, max }) {
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
      <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Row({ label, value, detail }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-slate-600">{label}</div>
      <div className="text-slate-900 font-medium text-right">
        {value}
        {detail && <div className="text-[11px] text-slate-500">{detail}</div>}
      </div>
    </div>
  );
}

function Badge({ label, tone = "neutral" }) {
  const map = {
    success: "bg-emerald-100 text-emerald-700 border-emerald-300",
    warn: "bg-amber-100 text-amber-700 border-amber-300",
    danger: "bg-rose-100 text-rose-700 border-rose-300",
    neutral: "bg-slate-100 text-slate-700 border-slate-300",
  };
  return <span className={`text-xs px-2 py-1 border rounded-md ${map[tone] || map.neutral}`}>{label}</span>;
}

function Divider() {
  return <div className="h-px bg-slate-200 my-1" />;
}

function AnalyticsBar({ profitPct = 0, commissionPct = 0, balancePct = 0 }) {
  // normalize to max 100 each for stacked view
  const p = clampPct(profitPct);
  const c = clampPct(commissionPct);
  const b = clampPct(balancePct);
  const total = p + c + b || 1;
  const pW = (p / total) * 100;
  const cW = (c / total) * 100;
  const bW = (b / total) * 100;
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded bg-slate-100">
        <div className="h-2 bg-emerald-500 transition-all" style={{ width: `${pW}%` }} title={`Profit ${p.toFixed(1)}%`} />
        <div className="h-2 bg-amber-500 transition-all" style={{ width: `${cW}%` }} title={`Commission ${c.toFixed(1)}%`} />
        <div className="h-2 bg-rose-500 transition-all" style={{ width: `${bW}%` }} title={`Balance ${b.toFixed(1)}%`} />
      </div>
      <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
        <span>Profit {p.toFixed(1)}%</span>
        <span>Commission {c.toFixed(1)}%</span>
        <span>Balance {b.toFixed(1)}%</span>
      </div>
    </div>
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
function fmt(n) {
  const v = typeof n === "number" ? n : parseFloat(n || 0);
  if (isNaN(v)) return "0";
  return (Math.round(v * 100) / 100).toLocaleString();
}
function parseOtherCharges(text) {
  // "Breakfast:10, CityTax:5" -> [{amount:10},{amount:5}]
  if (!text || typeof text !== "string") return [];
  const arr = text.split(",").map((s) => s.trim()).filter(Boolean);
  return arr
    .map((item) => {
      const m = item.match(/([\d.]+)/);
      return { amount: m ? parseFloat(m[1]) : 0 };
    })
    .filter((x) => !isNaN(x.amount) && x.amount > 0);
}
function sumCharges(arr = []) {
  return arr.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
}
function deriveBaseWithoutVat(buying) {
  const amount = parseFloat(buying.amount || 0);
  const vatRate = (parseFloat(buying.vatPercent || 0) || 0) / 100;
  return buying.vatIncluded ? amount / (1 + vatRate) : amount;
}
function safePct(part, whole) {
  const p = Number(part || 0);
  const w = Number(whole || 0);
  if (w <= 0) return 0;
  return (p / w) * 100;
}
function clampPct(x) {
  if (!isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

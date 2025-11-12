// /Multi/steps/Step4_ClientConfirmation.jsx
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

// For profit hint using quotation vs buying as context
import { calculateCommercial } from "../../utils/commercialCalculations";

/*
  Step 4 — Client Confirmation (Selling Side)
  ===========================================
  COMPULSORY 5 AUTOMATION FEATURES IN THIS FILE:
  1) Deep Autofill: Pulls data forward from Steps 1 (Requisition), 2 (Quotation), 3 (RequestToBook).
  2) Auto Finance: Nights, Net Amount (selling), Balance (Net - Received) recalc live; Invoice # auto.
  3) FX Awareness: Uses context fxRates first; optional live fallback; profit hint via calculateCommercial.
  4) Autosave + Step Status + Audit: 1.5s autosave, completion tracking, audit push when completed.
  5) Reminders: Auto reminder if balance > 0 for more than 3 days (unpaid).

  Layout: two-column — Left: accordions; Right: sticky financial cockpit (like Step 3).
*/

export default function Step4_ClientConfirmation() {
  const { ticketId, formData, actions, fxRates } = useContext(MultiContext);

  const req = formData.requisition || {};
  const quo = formData.quotation || {};
  const conf3 = formData.confirmation || {}; // step 3 (supplier confirmation)

  // -----------------------------
  // INITIAL (Autofill from Steps 1/2/3)
  // -----------------------------
  const initial = useMemo(() => {
    const checkIn =
      formData.clientConfirm?.checkIn || conf3.checkIn || quo.checkIn || req.checkIn || "";
    const checkOut =
      formData.clientConfirm?.checkOut || conf3.checkOut || quo.checkOut || req.checkOut || "";
    const nights =
      formData.clientConfirm?.nights ||
      conf3.nights ||
      quo.nights ||
      req.nights ||
      (checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0);

    return {
      // meta
      remarks: formData.clientConfirm?.remarks || "",
      dateOfConfirmation: formData.clientConfirm?.dateOfConfirmation || isoToday(),
      bookingStatus: formData.clientConfirm?.bookingStatus || "On-Request",
      invoiceNo: formData.clientConfirm?.invoiceNo || "",

      // parties / references
      clientName: formData.clientConfirm?.clientName || quo.clientName || "",
      clientVoucher: formData.clientConfirm?.clientVoucher || "",
      hotelConfirmationNo: formData.clientConfirm?.hotelConfirmationNo || conf3.hotelReference || "",

      // stay details
      guestName: formData.clientConfirm?.guestName || conf3.guestName || quo.guestName || req.guestName || "",
      hotelName: formData.clientConfirm?.hotelName || conf3.hotelName || quo.hotelName || req.hotelName || "",
      address: formData.clientConfirm?.address || conf3.address || quo.address || req.address || "",
      checkIn,
      checkOut,
      nights,
      rooms: formData.clientConfirm?.rooms || conf3.rooms || quo.rooms || req.rooms || 1,
      roomCategory: formData.clientConfirm?.roomCategory || conf3.roomCategory || quo.roomCategory || req.roomCategory || "",
      occupancy: formData.clientConfirm?.occupancy || conf3.occupancy || quo.occupancy || req.occupancy || "",
      specialRequest: formData.clientConfirm?.specialRequest || conf3.specialRequest || quo.specialRequest || req.specialRequest || "",

      // selling side
      sellingCurrency: formData.clientConfirm?.sellingCurrency || quo.sellingCurrency || "GBP",
      ratePerNight: formData.clientConfirm?.ratePerNight || quo.sellingRatePerRoom || "",
      otherCharges: formData.clientConfirm?.otherCharges || quo.sellingOtherCharges || "",
      netAmount: formData.clientConfirm?.netAmount || "", // can be auto computed from rate × rooms × nights (+ charges)
      received: formData.clientConfirm?.received || "",
      balance: formData.clientConfirm?.balance || "",
      paidStatus: formData.clientConfirm?.paidStatus || "Unpaid",
      paymentTerms: formData.clientConfirm?.paymentTerms || quo.paymentTerms || req.paymentTerms || "",
      cancellationPolicy: formData.clientConfirm?.cancellationPolicy || quo.cancellationPolicy || req.cancellationPolicy || "",

      // transfers — clients (airport)
      airport: {
        people: formData.clientConfirm?.airport?.people || conf3.airport?.people || req.airport?.people || "",
        luggage: formData.clientConfirm?.airport?.luggage || conf3.airport?.luggage || req.airport?.luggage || "",
        vehicle: formData.clientConfirm?.airport?.vehicle || conf3.airport?.vehicle || req.airport?.vehicle || "",
        pickupFrom: formData.clientConfirm?.airport?.pickupFrom || conf3.airport?.pickupFrom || req.airport?.pickupFrom || "",
        dropTo: formData.clientConfirm?.airport?.dropTo || conf3.airport?.dropTo || req.airport?.dropTo || "",
        pickupDate: formData.clientConfirm?.airport?.pickupDate || conf3.airport?.pickupDate || req.airport?.pickupDate || "",
        pickupTime: formData.clientConfirm?.airport?.pickupTime || conf3.airport?.pickupTime || req.airport?.pickupTime || "",
        dropDate: formData.clientConfirm?.airport?.dropDate || conf3.airport?.dropDate || req.airport?.dropDate || "",
        dropTime: formData.clientConfirm?.airport?.dropTime || conf3.airport?.dropTime || req.airport?.dropTime || "",
        chargesSelling: formData.clientConfirm?.airport?.chargesSelling || "",
        otherRate: formData.clientConfirm?.airport?.otherRate || "",
        otherNature: formData.clientConfirm?.airport?.otherNature || "",
        driverContact: formData.clientConfirm?.airport?.driverContact || "",
        remarks: formData.clientConfirm?.airport?.remarks || conf3.airport?.remarks || "",
      },

      // transfers — clients (chauffeur)
      chauffeur: {
        people: formData.clientConfirm?.chauffeur?.people || conf3.chauffeur?.people || req.chauffeur?.people || "",
        vehicle: formData.clientConfirm?.chauffeur?.vehicle || conf3.chauffeur?.vehicle || req.chauffeur?.vehicle || "",
        pickupFrom: formData.clientConfirm?.chauffeur?.pickupFrom || conf3.chauffeur?.pickupFrom || req.chauffeur?.pickupFrom || "",
        dropTo: formData.clientConfirm?.chauffeur?.dropTo || conf3.chauffeur?.dropTo || req.chauffeur?.dropTo || "",
        pickupDate: formData.clientConfirm?.chauffeur?.pickupDate || conf3.chauffeur?.pickupDate || req.chauffeur?.pickupDate || "",
        pickupTime: formData.clientConfirm?.chauffeur?.pickupTime || conf3.chauffeur?.pickupTime || req.chauffeur?.pickupTime || "",
        dropDate: formData.clientConfirm?.chauffeur?.dropDate || conf3.chauffeur?.dropDate || req.chauffeur?.dropDate || "",
        dropTime: formData.clientConfirm?.chauffeur?.dropTime || conf3.chauffeur?.dropTime || req.chauffeur?.dropTime || "",
        chargesSelling: formData.clientConfirm?.chauffeur?.chargesSelling || "",
        otherRate: formData.clientConfirm?.chauffeur?.otherRate || "",
        otherNature: formData.clientConfirm?.chauffeur?.otherNature || "",
        driverContact: formData.clientConfirm?.chauffeur?.driverContact || "",
        remarks: formData.clientConfirm?.chauffeur?.remarks || conf3.chauffeur?.remarks || "",
      },

      // FX override optional (selling currency vs buying currency from step 3)
      exchangeRateOverride: formData.clientConfirm?.exchangeRateOverride || "",

      // computed snapshot (for summary)
      _calc: formData.clientConfirm?._calc || {
        netSelling: 0,
        profitHint: 0,
      },
    };
  }, [formData, req, quo, conf3, ticketId]);

  // -----------------------------
  // FORM + Validation
  // -----------------------------
  const schema = {
    remarks: { type: "string" },
    dateOfConfirmation: { type: "string", required: true, transform: clampToday },
    bookingStatus: { type: "string", required: true },
    invoiceNo: { type: "string" },

    clientName: { type: "string" },
    clientVoucher: { type: "string" },
    hotelConfirmationNo: { type: "string" },

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
    ratePerNight: { type: "number", transform: (v) => guardNumber(v, 0) },
    otherCharges: { type: "string" },
    netAmount: { type: "number", transform: (v) => guardNumber(v, 0) },
    received: { type: "number", transform: (v) => guardNumber(v, 0) },
    balance: { type: "number", transform: (v) => guardNumber(v, 0) },
    paidStatus: { type: "string" },

    paymentTerms: { type: "string" },
    cancellationPolicy: { type: "string" },

    exchangeRateOverride: { type: "number", transform: (v) => guardNumber(v, 0) },
  };

  const { form, errors, setField, setMany, blurField } = useFormState({
    initial,
    schema,
    onChange: (next) => actions.updateStepData("clientConfirm", { ...next }),
  });

  // ---- Auto: Invoice # on mount if empty (INV-YYYYMMDD-XXXX)
  useEffect(() => {
    if (!form.invoiceNo) {
      const todayStr = isoToday().replace(/-/g, "");
      const seq = Math.floor(1000 + Math.random() * 9000);
      setField("invoiceNo", `INV-${todayStr}-${seq}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Auto: Nights recompute from dates
  useEffect(() => {
    if (form.checkIn && form.checkOut) {
      const n = calculateNights(form.checkIn, form.checkOut);
      if (String(n) !== String(form.nights)) setField("nights", n);
    }
  }, [form.checkIn, form.checkOut, form.nights, setField]);

  // ---- Selling Net computation from rate/rooms/nights + otherCharges text
  const netSellingLive = useMemo(() => {
    const perNight = guardNumber(form.ratePerNight, 0);
    const rooms = Number(form.rooms || 1) || 1;
    const nights = Number(form.nights || 1) || 1;
    const other = sumCharges(parseOtherCharges(form.otherCharges));
    return perNight * rooms * nights + other;
  }, [form.ratePerNight, form.rooms, form.nights, form.otherCharges]);

  useEffect(() => {
    if (guardNumber(form.netAmount, 0) !== netSellingLive) {
      setField("netAmount", netSellingLive);
    }
  }, [netSellingLive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Balance = Net - Received
  const balanceLive = useMemo(() => {
    const net = guardNumber(form.netAmount, 0);
    const rec = guardNumber(form.received, 0);
    return Math.max(net - rec, 0);
  }, [form.netAmount, form.received]);

  useEffect(() => {
    if (guardNumber(form.balance, 0) !== balanceLive) {
      setField("balance", balanceLive);
    }
  }, [balanceLive]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------
  // FX & Profit Hint (vs supplier buying)
  // -----------------------------
  const detectedFx = useMemo(() => {
    // compare buying currency from step3 vs selling currency here
    const from = conf3.buyingCurrency || quo.buyingCurrency || "GBP";
    const to = form.sellingCurrency || "GBP";
    if (from === to) return 1;
    const ctx = fxRates?.[from]?.[to] || fxRates?.[`${from}_${to}`];
    const override = parseFloat(form.exchangeRateOverride) || 0;
    return override || ctx || 1;
  }, [fxRates, conf3.buyingCurrency, quo.buyingCurrency, form.sellingCurrency, form.exchangeRateOverride]);

  const [loadingFx, setLoadingFx] = useState(false);
  useEffect(() => {
    let cancel = false;
    async function fallback() {
      if (!conf3.buyingCurrency || !form.sellingCurrency) return;
      if (conf3.buyingCurrency === form.sellingCurrency) return;
      // if no context rate and no override, try fetch once
      const hasCtx = fxRates?.[conf3.buyingCurrency]?.[form.sellingCurrency] || fxRates?.[`${conf3.buyingCurrency}_${form.sellingCurrency}`];
      if (hasCtx || form.exchangeRateOverride) return;
      setLoadingFx(true);
      try {
        const url = `https://open.er-api.com/v6/latest/${conf3.buyingCurrency}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => null);
        const rate = data?.result === "success" ? data?.rates?.[form.sellingCurrency] : null;
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
  }, [conf3.buyingCurrency, form.sellingCurrency]);

  // Build buying payload from step 3 for profit comparison
  const buyingPayload = useMemo(() => {
    const perRoomBuy = guardNumber(conf3.buyingRatePerRoom || 0, 0);
    const rooms = Number(form.rooms || 1) || 1;
    const nights = Number(form.nights || 1) || 1;
    const amount = perRoomBuy * rooms * nights;
    return {
      amount,
      vatPercent: normalizeVAT(conf3.vatPercent || 0),
      vatIncluded: !!conf3.vatInclusive,
      additionalCosts: parseOtherCharges(conf3.otherCharges),
      commissionable:
        conf3.commissionFromHotelType &&
        guardNumber(conf3.commissionFromHotelValue, 0) > 0,
      commissionType:
        conf3.commissionFromHotelType === "amount" ? "fixed" : "percentage",
      commissionValue: guardNumber(conf3.commissionFromHotelValue, 0),
      currency: conf3.buyingCurrency || "GBP",
    };
  }, [
    conf3.buyingRatePerRoom,
    conf3.vatPercent,
    conf3.vatInclusive,
    conf3.otherCharges,
    conf3.commissionFromHotelType,
    conf3.commissionFromHotelValue,
    conf3.buyingCurrency,
    form.rooms,
    form.nights,
  ]);

  // Build selling payload from this step (net uses rate×rooms×nights + other)
  const sellingPayload = useMemo(() => {
    const perRoomSell = guardNumber(form.ratePerNight || 0, 0);
    const rooms = Number(form.rooms || 1) || 1;
    const nights = Number(form.nights || 1) || 1;
    const price = perRoomSell * rooms * nights; // base
    return {
      price,
      vatPercent: 0, // Step 4 form tracks net as a final number (VAT optional could be added later)
      vatIncluded: false,
      incentive: false,
      discounts: parseOtherCharges(form.otherCharges), // treat as additions (positive)
      currency: form.sellingCurrency || "GBP",
    };
  }, [form.ratePerNight, form.rooms, form.nights, form.otherCharges, form.sellingCurrency]);

  const calc = useMemo(() => {
    const fx = form.exchangeRateOverride ? parseFloat(form.exchangeRateOverride) : detectedFx || 1;
    return calculateCommercial(buyingPayload, sellingPayload, fx || 1);
  }, [buyingPayload, sellingPayload, detectedFx, form.exchangeRateOverride]);

  // Profit hint from versions (optional)
  const pastMargins = (formData?.quotationVersions || []).map((v) => v.payload?._calc?.margin || 0);
  const profitHint = useMemo(
    () => predictProfit(pastMargins.map((m) => ({ margin: m })), { amount: calc?.netSelling || 0 }) || 0,
    [pastMargins, calc?.netSelling]
  );

  useEffect(() => {
    setMany({ _calc: { ...form._calc, netSelling: calc?.netSelling || netSellingLive, profitHint } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calc?.netSelling, netSellingLive, profitHint]);

  // -----------------------------
  // Autosave + Step Status + Audit
  // -----------------------------
  useAutosave({
    ticketId: formData?.ticketId || ticketId || autoTicket(),
    stepId: "clientConfirm",
    data: { ...form, lastUpdated: new Date().toISOString() },
  });

  const required = [
    "dateOfConfirmation",
    "bookingStatus",
    "hotelName",
    "checkIn",
    "checkOut",
    "sellingCurrency",
    "ratePerNight",
  ];
  const { percent, state } = useStepStatus({ data: form, required });

  useEffect(() => {
    if (percent === 100 && (form.paidStatus === "Paid" || guardNumber(form.balance, 0) === 0)) {
      actions.markComplete("clientConfirm");
      actions.pushAudit("Client Confirmation marked complete (auto)");
    }
  }, [percent, form.paidStatus, form.balance, actions]);

  // -----------------------------
  // Reminders: unpaid > 3 days
  // -----------------------------
  useReminders({
    key: `client-${formData?.ticketId || ticketId}`,
    active: guardNumber(form.balance, 0) > 0 && form.paidStatus !== "Paid",
    days: 3,
    message: "Client Confirmation pending balance for this ticket.",
  });

  // -----------------------------
  // UI state (Accordions)
  // -----------------------------
  const [open, setOpen] = useState({
    client: true,
    airport: false,
    chauffeur: false,
    policy: true,
  });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  // badge about payment
  const paidBadge =
    guardNumber(form.balance, 0) === 0
      ? "Paid"
      : form.paidStatus === "Paid"
      ? "Paid"
      : "Unpaid";

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: Accordions */}
      <div className="lg:col-span-2 space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600">
            Ticket:{" "}
            <span className="font-semibold text-slate-800">
              {formData?.ticketId || ticketId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              tone={state === "ok" ? "success" : state === "warn" ? "warn" : "danger"}
              label={`Completion ${percent}%`}
            />
            <Badge
              tone={paidBadge === "Paid" ? "success" : "warn"}
              label={paidBadge}
            />
          </div>
        </div>

        {/* Client Confirmation (Selling) */}
        <Accordion
          title="Client Confirmation (Selling Side)"
          open={open.client}
          onToggle={() => toggle("client")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Remarks"
              value={form.remarks}
              onChange={(v) => setField("remarks", v)}
            />

            <Input
              label="Date of Confirmation to Client"
              type="date"
              min={isoToday()}
              value={form.dateOfConfirmation}
              onChange={(v) => setField("dateOfConfirmation", v)}
              onBlur={() => blurField("dateOfConfirmation")}
              error={errors.dateOfConfirmation}
              required
            />

            <Select
              label="Booking Status"
              value={form.bookingStatus}
              onChange={(v) => setField("bookingStatus", v)}
              options={[
                "On-Request",
                "Confirmed",
                "Reconfirmed",
                "Cancelled by Agent",
                "Cancelled by Hotel",
              ]}
              required
            />

            <Input
              label="Inv #"
              value={form.invoiceNo}
              onChange={(v) => setField("invoiceNo", v)}
            />

            <Input
              label="Client / Agent Name"
              value={form.clientName}
              onChange={(v) => setField("clientName", v)}
            />
            <Input
              label="Client / Agent Voucher"
              value={form.clientVoucher}
              onChange={(v) => setField("clientVoucher", v)}
            />
            <Input
              label="Hotel Confirmation No. (HCN)"
              value={form.hotelConfirmationNo}
              onChange={(v) => setField("hotelConfirmationNo", v)}
            />

            <Input
              label="Guest Name"
              value={form.guestName}
              onChange={(v) => setField("guestName", v)}
            />
            <Input
              label="Hotel Name"
              value={form.hotelName}
              onChange={(v) => setField("hotelName", v)}
              onBlur={() => blurField("hotelName")}
              error={errors.hotelName}
              required
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(v) => setField("address", v)}
            />

            <Input
              label="Check-In"
              type="date"
              min={isoToday()}
              value={form.checkIn}
              onChange={(v) => setField("checkIn", v)}
              onBlur={() => blurField("checkIn")}
              error={errors.checkIn}
              required
            />
            <Input
              label="Check-Out"
              type="date"
              min={form.checkIn || isoToday()}
              value={form.checkOut}
              onChange={(v) => setField("checkOut", v)}
              onBlur={() => blurField("checkOut")}
              error={errors.checkOut}
              required
            />
            <Input label="No. Of Nights" type="number" value={form.nights} readOnly />

            <Input
              label="No. Of Rooms"
              type="number"
              value={form.rooms}
              onChange={(v) => setField("rooms", v)}
            />
            <Input
              label="Room Category"
              value={form.roomCategory}
              onChange={(v) => setField("roomCategory", v)}
            />
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
              value={form.sellingCurrency}
              onChange={(v) => setField("sellingCurrency", v)}
              options={["GBP", "USD", "EUR", "AED", "INR"]}
              required
            />
            <Input
              label="Rate per room per night (Selling Price)"
              type="number"
              value={form.ratePerNight}
              onChange={(v) => setField("ratePerNight", v)}
            />
            <Input
              label="Any Other Charges / Tax (Selling Price)"
              placeholder="Breakfast, City tax, etc, To specify"
              value={form.otherCharges}
              onChange={(v) => setField("otherCharges", v)}
            />

            <Input
              label="Net Amt. (Selling Price)"
              type="number"
              value={form.netAmount}
              onChange={(v) => setField("netAmount", v)}
            />
            <Input
              label="Received"
              type="number"
              value={form.received}
              onChange={(v) => setField("received", v)}
            />
            <Input label="Balance (auto)" type="number" value={form.balance} readOnly />

            <Select
              label="Paid / Unpaid"
              value={form.paidStatus}
              onChange={(v) => setField("paidStatus", v)}
              options={["Paid", "Unpaid"]}
            />

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

          {/* FX Override helper */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <Input
              label="FX Override"
              type="number"
              value={form.exchangeRateOverride}
              onChange={(v) => setField("exchangeRateOverride", v)}
            />
            <div className="text-[12px] text-slate-600 flex items-end">
              {loadingFx
                ? "Fetching live FX…"
                : `Detected FX: ${fmt(detectedFx)} (${conf3.buyingCurrency || quo.buyingCurrency || "GBP"} → ${form.sellingCurrency})`}
            </div>
          </div>
        </Accordion>

        {/* TRANSFERS — CLIENTS (Airport) */}
        <Accordion
          title="CONFIRMATION (FOR TRANSFERS) — CLIENTS — Airport (Pick-up & Drop)"
          open={open.airport}
          onToggle={() => toggle("airport")}
        >
          <TransfersClient
            data={form.airport}
            setData={(patch) =>
              setMany({ airport: { ...form.airport, ...patch } })
            }
            checkIn={form.checkIn}
            checkOut={form.checkOut}
            sellingCurrency={form.sellingCurrency}
          />
        </Accordion>

        {/* TRANSFERS — CLIENTS (Chauffeur) */}
        <Accordion
          title="CONFIRMATION (FOR TRANSFERS) — CLIENTS — Chauffeur Service"
          open={open.chauffeur}
          onToggle={() => toggle("chauffeur")}
        >
          <TransfersClient
            data={form.chauffeur}
            setData={(patch) =>
              setMany({ chauffeur: { ...form.chauffeur, ...patch } })
            }
            checkIn={form.checkIn}
            checkOut={form.checkOut}
            sellingCurrency={form.sellingCurrency}
          />
        </Accordion>

        {/* Policy */}
        <Accordion
          title="Policy & Notes"
          open={open.policy}
          onToggle={() => toggle("policy")}
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
        </Accordion>
      </div>

      {/* RIGHT: Sticky Financial Summary */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-4">
          <div className="border border-slate-200 rounded-xl bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">
                Client Summary (Real-Time)
              </div>
              <Badge
                tone={paidBadge === "Paid" ? "success" : "warn"}
                label={paidBadge}
              />
            </div>

            <Divider />

            <Row label="Selling Currency" value={form.sellingCurrency} />
            <Row
              label="Rooms × Nights"
              value={`${form.rooms || 1} × ${form.nights || 1}`}
            />
            <Row
              label="Rate per Room"
              value={`${fmt(form.ratePerNight)} ${form.sellingCurrency}`}
            />
            <Row
              label="Other Charges"
              value={fmt(sumCharges(parseOtherCharges(form.otherCharges)))}
            />

            <Divider />

            <Row
              label="Net Amount (Selling)"
              value={`${fmt(form.netAmount)} ${form.sellingCurrency}`}
            />
            <Row
              label="Received"
              value={`${fmt(form.received)} ${form.sellingCurrency}`}
            />
            <Row
              label="Balance"
              value={`${fmt(form.balance)} ${form.sellingCurrency}`}
            />

            <div className="text-[11px] text-slate-500">
              {paidBadge === "Paid"
                ? "All dues settled."
                : "Balance pending. Auto-reminder in 3 days."}
            </div>

            <Divider />

            {/* Profit hint vs supplier buying (Step 3) */}
            <Row
              label="Detected FX"
              value={`${fmt(detectedFx)} (${conf3.buyingCurrency || quo.buyingCurrency || "GBP"} → ${form.sellingCurrency})`}
            />
            <Row
              label="Profit hint (model)"
              value={`${fmt(form._calc?.profitHint)} ${form.sellingCurrency}`}
            />

            <AnalyticsBar
              profitPct={safePct(form._calc?.profitHint, form.netAmount)}
              commissionPct={safePct(guardNumber(conf3.commissionPaid, 0), calc?.netBuying)}
              balancePct={safePct(form.balance, form.netAmount)}
            />

            <div className="text-[11px] text-slate-400">💾 Autosaving every 1.5s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------
   Transfers (Clients)
-------------------------------- */
function TransfersClient({ data, setData, checkIn, checkOut, sellingCurrency }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Input
        label="No. of People"
        type="number"
        value={data.people}
        onChange={(v) => setData({ people: guardNumber(v, 0, 999) })}
      />
      <Input
        label="No. of Luggage"
        type="number"
        value={data.luggage}
        onChange={(v) => setData({ luggage: guardNumber(v, 0, 999) })}
      />
      <Input
        label="Type of Vehicle"
        value={data.vehicle}
        onChange={(v) => setData({ vehicle: v })}
      />

      <Input
        label="Pick-up from"
        value={data.pickupFrom}
        onChange={(v) => setData({ pickupFrom: v })}
      />
      <Input
        label="Drop-off To"
        value={data.dropTo}
        onChange={(v) => setData({ dropTo: v })}
      />

      <Input
        label="Pick-up Date"
        type="date"
        min={checkIn || isoToday()}
        max={checkOut || undefined}
        value={data.pickupDate}
        onChange={(v) => setData({ pickupDate: v })}
      />
      <Input
        label="Pick-up Time"
        type="time"
        value={data.pickupTime}
        onChange={(v) => setData({ pickupTime: v })}
      />

      <Input
        label="Drop-off Date"
        type="date"
        min={checkIn || isoToday()}
        max={checkOut || undefined}
        value={data.dropDate}
        onChange={(v) => setData({ dropDate: v })}
      />
      <Input
        label="Drop-off Time"
        type="time"
        value={data.dropTime}
        onChange={(v) => setData({ dropTime: v })}
      />

      <Input
        label={`Charges (Selling Price)`}
        type="number"
        value={data.chargesSelling}
        onChange={(v) => setData({ chargesSelling: guardNumber(v, 0) })}
      />

      <Input
        label="Other Charges (i) Rate"
        type="number"
        value={data.otherRate}
        onChange={(v) => setData({ otherRate: guardNumber(v, 0) })}
      />
      <Input
        label="Other Charges (ii) Nature"
        value={data.otherNature}
        onChange={(v) => setData({ otherNature: v })}
      />
      <Input
        label="Driver Contact Details"
        value={data.driverContact}
        onChange={(v) => setData({ driverContact: v })}
      />
      <Input
        label="Remarks"
        value={data.remarks}
        onChange={(v) => setData({ remarks: v })}
      />
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
        type="button"
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
        } ${readOnly ? "bg-slate-100" : "bg-white"}`}
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

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-slate-600">{label}</div>
      <div className="text-slate-900 font-medium text-right">{value}</div>
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
  return (
    <span className={`text-xs px-2 py-1 border rounded-md ${map[tone] || map.neutral}`}>
      {label}
    </span>
  );
}

function Divider() {
  return <div className="h-px bg-slate-200 my-1" />;
}

function AnalyticsBar({ profitPct = 0, commissionPct = 0, balancePct = 0 }) {
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
        <div
          className="h-2 bg-emerald-500 transition-all"
          style={{ width: `${pW}%` }}
          title={`Profit ${p.toFixed(1)}%`}
        />
        <div
          className="h-2 bg-amber-500 transition-all"
          style={{ width: `${cW}%` }}
          title={`Commission ${c.toFixed(1)}%`}
        />
        <div
          className="h-2 bg-rose-500 transition-all"
          style={{ width: `${bW}%` }}
          title={`Balance ${b.toFixed(1)}%`}
        />
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
  // "Breakfast:10, CityTax:5" -> [{amount:10}, {amount:5}]
  if (!text || typeof text !== "string") return [];
  const arr = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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

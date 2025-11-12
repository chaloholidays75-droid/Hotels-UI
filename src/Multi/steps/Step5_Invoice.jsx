// /Multi/steps/Step5_Invoice.jsx
import React, { useContext, useEffect, useMemo, useRef } from "react";
import { MultiContext } from "../MultiContext";
import useFormState from "../hooks/useFormState";
import useAutosave from "../hooks/useAutosave";
import useReminders from "../hooks/useReminders";
import useStepStatus from "../hooks/useStepStatus";

// PDF
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  BlobProvider,
} from "@react-pdf/renderer";

/* =========================================================================
   STEP 5: INVOICE
   Automation:
   1) Autofill from prev. steps
   2) Live totals (net/received/balance/bank/total payable)
   3) Autosave drafts every 1.5s
   4) Reminder if balance > 0 for 3 days
   5) Auto invoice #, date guards, print/email/download
   ======================================================================= */

/* ---------------- Helpers ---------------- */
const isoToday = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

function Button({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors
        ${
          disabled
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
        }`}
    >
      {children}
    </button>
  );
}

const clampToToday = (v) => {
  if (!v) return isoToday();
  const chosen = new Date(v);
  const today = new Date(isoToday());
  return chosen < today ? isoToday() : v;
};

const fmt = (n) => {
  const v = typeof n === "number" ? n : parseFloat(n ?? 0);
  if (isNaN(v)) return "0.00";
  return (Math.round(v * 100) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const guardNumber = (v, min = 0) => {
  const n = Number(v);
  if (isNaN(n) || n < min) return min;
  return n;
};

const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

/* ---------------- PDF Styles ---------------- */
const pdfStyles = StyleSheet.create({
  page: { padding: 24, fontSize: 11, fontFamily: "Helvetica" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: 700 },
  sub: { color: "#555" },
  box: {
    border: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "stretch" },
  col: { flex: 1, paddingRight: 8 },
  tHead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  th: { flex: 1, fontWeight: 700 },
  td: { flex: 1 },
  foot: { marginTop: 8, fontSize: 10, color: "#444" },
  right: { textAlign: "right" },
  bold: { fontWeight: 700 },
});

/* ---------------- PDF Component ---------------- */
function InvoicePDF({ data, company }) {
  const {
    invoiceNo,
    invoiceDate,
    toName,
    bookingStatus,
    agentVoucher,
    hcn,
    clientName,
    hotelName,
    address,
    checkIn,
    checkOut,
    nights,
    rooms, // numeric summary
    currency,
    ratePerNight,
    netAmount,
    received,
    balance,
    bankCharges,
    totalNetPayable,
    remarks,
    lineItems, // normalized detailed rows
    roomCategory,
    occupancy,
  } = data;

  // Fallback single line item if none provided
  const safeLineItems =
    Array.isArray(lineItems) && lineItems.length > 0
      ? lineItems
      : [
          {
            roomTypeName: roomCategory || "Room",
            guestName: clientName || "",
            nights: guardNumber(nights, 0),
            count: guardNumber(rooms, 1),
            ratePerNight: guardNumber(ratePerNight, 0),
          },
        ];

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.headerRow}>
          <View>
            <Text style={pdfStyles.title}>INVOICE</Text>
            <Text style={pdfStyles.sub}>{company.name}</Text>
            <Text style={pdfStyles.sub}>
              {String(company.phone)}  {String(company.email)}
            </Text>
          </View>
          <View>
            <Text>
              Invoice #: <Text style={pdfStyles.bold}>{String(invoiceNo || "-")}</Text>
            </Text>
            <Text>
              Date: <Text style={pdfStyles.bold}>{String(invoiceDate || "-")}</Text>
            </Text>
            <Text>
              Status:{" "}
              <Text style={pdfStyles.bold}>{String(bookingStatus || "Confirmed")}</Text>
            </Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={pdfStyles.box}>
          <Text style={pdfStyles.bold}>To</Text>
          <Text>{String(toName || "-")}</Text>
        </View>

        {/* Booking Details */}
        <View style={pdfStyles.box}>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text>Client / Agent Name: {String(clientName || "-")}</Text>
            </View>
            <View style={pdfStyles.col}>
              <Text>Client / Agent Voucher: {String(agentVoucher || "-")}</Text>
            </View>
          </View>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text>HCN: {String(hcn || "-")}</Text>
            </View>
            <View style={pdfStyles.col}>
              <Text>Hotel: {String(hotelName || "-")}</Text>
            </View>
          </View>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text>Address: {String(address || "-")}</Text>
            </View>
          </View>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text>Check-In: {String(checkIn || "-")}</Text>
            </View>
            <View style={pdfStyles.col}>
              <Text>Check-Out: {String(checkOut || "-")}</Text>
            </View>
            <View style={pdfStyles.col}>
              <Text>Nights: {guardNumber(nights, 0)}</Text>
            </View>
          </View>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text>Rooms: {guardNumber(rooms, 1)}</Text>
            </View>
            <View style={pdfStyles.col}>
              <Text>Room Category: {String(roomCategory || "-")}</Text>
            </View>
            <View style={pdfStyles.col}>
              <Text>Occupancy: {String(occupancy || "-")}</Text>
            </View>
          </View>
        </View>

        {/* Line Items */}
        <View style={{ ...pdfStyles.box, padding: 0 }}>
          <View style={pdfStyles.tHead}>
            <Text style={{ ...pdfStyles.th, flex: 2 }}>Description</Text>
            <Text style={{ ...pdfStyles.th, flex: 1, textAlign: "right" }}>
              Rate/Nt.
            </Text>
            <Text style={{ ...pdfStyles.th, flex: 1, textAlign: "right" }}>
              Nights
            </Text>
            <Text style={{ ...pdfStyles.th, flex: 1, textAlign: "right" }}>
              Rooms
            </Text>
            <Text style={{ ...pdfStyles.th, flex: 1, textAlign: "right" }}>
              Amount
            </Text>
          </View>

          {safeLineItems.map((r, i) => {
            const roomName = r?.roomTypeName || r?.roomCategory || "Room";
            const guest = r?.guestName ? ` (${String(r.guestName)})` : "";
            const nightsCount = guardNumber(r?.nights ?? nights, 0);
            const roomCount = guardNumber(r?.count ?? 1, 1);
            const rate = guardNumber(r?.ratePerNight ?? ratePerNight, 0);
            const subtotal = rate * nightsCount * roomCount;

            return (
              <View key={`row-${i}`} style={pdfStyles.tRow}>
                <Text style={{ ...pdfStyles.td, flex: 2 }}>
                  {`${String(hotelName || "Hotel")} — ${String(roomName)}${guest}`}
                </Text>
                <Text style={{ ...pdfStyles.td, flex: 1, textAlign: "right" }}>
                  {String(currency)} {fmt(rate)}
                </Text>
                <Text style={{ ...pdfStyles.td, flex: 1, textAlign: "right" }}>
                  {nightsCount}
                </Text>
                <Text style={{ ...pdfStyles.td, flex: 1, textAlign: "right" }}>
                  {roomCount}
                </Text>
                <Text style={{ ...pdfStyles.td, flex: 1, textAlign: "right" }}>
                  {String(currency)} {fmt(subtotal)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={pdfStyles.box}>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text>Net Amt.</Text>
            </View>
            <View style={{ ...pdfStyles.col, textAlign: "right" }}>
              <Text>
                {String(currency)} {fmt(netAmount)}
              </Text>
            </View>
          </View>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text>Recd.</Text>
            </View>
            <View style={{ ...pdfStyles.col, textAlign: "right" }}>
              <Text>
                {String(currency)} {fmt(received)}
              </Text>
            </View>
          </View>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text>Balance</Text>
            </View>
            <View style={{ ...pdfStyles.col, textAlign: "right" }}>
              <Text>
                {String(currency)} {fmt(balance)}
              </Text>
            </View>
          </View>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text>Bank Charges</Text>
            </View>
            <View style={{ ...pdfStyles.col, textAlign: "right" }}>
              <Text>
                {String(currency)} {fmt(bankCharges)}
              </Text>
            </View>
          </View>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text style={pdfStyles.bold}>
                Total Net Payable to Chalo Holiday
              </Text>
            </View>
            <View style={{ ...pdfStyles.col, textAlign: "right" }}>
              <Text style={pdfStyles.bold}>
                {String(currency)} {fmt(totalNetPayable)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes / Bank */}
        <View style={pdfStyles.box}>
          <Text style={pdfStyles.bold}>Note</Text>
          <Text>Bank Transfer — All charges to be covered by sender.</Text>
          <Text style={{ marginTop: 6, fontWeight: 700 }}>Bank Details</Text>
          <Text>Currency: {String(currency || "GBP")}</Text>
        </View>

        {/* Footer */}
        <Text style={pdfStyles.foot}>Remarks: {String(remarks || "-")}</Text>
        <Text style={pdfStyles.foot}>This is a system generated invoice.</Text>
      </Page>
    </Document>
  );
}

/* ---------------- Main Component ---------------- */
export default function Step5_Invoice() {
  const { ticketId, formData, actions } = useContext(MultiContext);
  const step4 = formData.clientConfirmation || formData.confirmation || {};
  const step3 = formData.supplierConfirmation || formData.requestToHotel || {};
  const req = formData.requisition || {};
  const quo = formData.quotation || {};

  // Unique invoice number per ticket
  const autoInvoiceNo = (ticket) => {
    const key = `invoiceNo_${ticket}`;
    let existing = localStorage.getItem(key);
    if (existing) return existing;

    const inv = `INV-${String(ticket || "T")
      .replace(/\D/g, "")
      .slice(-6)}-${Date.now().toString().slice(-5)}`;
    localStorage.setItem(key, inv);
    return inv;
  };

  // Build safe line items from any previous step's "rooms" structure
  const normalizeLineItems = (roomsCandidate, fallback) => {
    if (Array.isArray(roomsCandidate) && roomsCandidate.length) {
      // map known fields -> ensure only primitives enter <Text/>
      return roomsCandidate.map((r) => ({
        roomTypeName: r?.roomTypeName || r?.roomCategory || fallback.roomTypeName,
        guestName: r?.guestName || "",
        nights: guardNumber(r?.nights ?? fallback.nights, 0),
        count: guardNumber(r?.count ?? 1, 1),
        ratePerNight: guardNumber(r?.ratePerNight ?? fallback.ratePerNight, 0),
      }));
    }
    return [fallback];
  };

  // Autofill baseline
  const initial = useMemo(() => {
    const checkIn = step4.checkIn || step3.checkIn || req.checkIn || "";
    const checkOut = step4.checkOut || step3.checkOut || req.checkOut || "";
    const nights =
      step4.nights ||
      step3.nights ||
      req.nights ||
      (checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0);

    const cur = step4.sellingCurrency || quo.sellingCurrency || "GBP";
    const rateNt = step4.sellingRatePerNight || quo.sellingRatePerRoom || 0;

    // Fallback single-line model for line items
    const fallbackLine = {
      roomTypeName: step4.roomCategory || step3.roomCategory || req.roomCategory || "Room",
      guestName: step4.guestName || "",
      nights: guardNumber(nights, 0),
      count: guardNumber(step4.rooms || step3.rooms || req.rooms || 1, 1),
      ratePerNight: guardNumber(rateNt, 0),
    };

    // Try to pull any array-like "rooms" detail from steps
    const lineItems =
      normalizeLineItems(step4.rooms, fallbackLine) ||
      normalizeLineItems(step3.rooms, fallbackLine) ||
      [fallbackLine];

    // Compute numeric rooms summary from lineItems
    const roomsCount = lineItems.reduce((sum, li) => sum + guardNumber(li.count, 1), 0);

    const computedSubtotal = lineItems.reduce(
      (sum, li) =>
        sum + guardNumber(li.ratePerNight, 0) * guardNumber(li.nights, 0) * guardNumber(li.count, 1),
      0
    );

    const received = guardNumber(step4.received || 0);
    const bankCharges = guardNumber(step4.bankCharges || 0);
    const net = guardNumber(step4.netAmount ?? computedSubtotal, 0);
    const balance = Math.max(net - received, 0);
    const totalNetPayable = balance + bankCharges;

    return {
      // header
      companyPhone: "44 (0) 2030049978",
      companyEmail: "info@chaloholidays.com",
      invoiceDate: clampToToday(step4.invoiceDate || isoToday()),
      invoiceNo: step4.invoiceNo || autoInvoiceNo(ticketId),
      bookingStatus: step4.status || "Confirmed",
      toName: step4.clientName || step4.agentName || "",
      remarks: step4.remarks || "",

      // booking
      agentVoucher: step4.agentVoucher || "",
      hcn: step4.hcn || step3.hotelReference || "",
      clientName: step4.clientName || "",
      hotelName: step4.hotelName || step3.hotelName || req.hotelName || "",
      address: step4.address || step3.address || req.address || "",
      checkIn,
      checkOut,
      nights: guardNumber(nights, 0),
      rooms: roomsCount, // numeric summary
      roomCategory: step4.roomCategory || step3.roomCategory || req.roomCategory || "",
      occupancy: step4.occupancy || step3.occupancy || req.occupancy || "",

      // finance
      currency: cur,
      ratePerNight: guardNumber(rateNt, 0), // used only for fallback
      netAmount: net,
      received,
      balance,
      bankCharges,
      totalNetPayable,
      paid: !!step4.paid,

      // detailed
      lineItems,
    };
  }, [ticketId, step4, step3, req, quo]);

  // Form schema (soft validation)
  const schema = {
    invoiceDate: { type: "string", required: true, transform: clampToToday },
    invoiceNo: { type: "string", required: true },
    bookingStatus: { type: "string" },
    toName: { type: "string" },
    remarks: { type: "string" },
    agentVoucher: { type: "string" },
    hcn: { type: "string" },
    clientName: { type: "string" },
    hotelName: { type: "string", required: true },
    address: { type: "string" },
    checkIn: { type: "string", required: true, transform: clampToToday },
    checkOut: { type: "string", required: true, transform: clampToToday },
    nights: { type: "number" },
    rooms: { type: "number" },
    currency: { type: "string", required: true },
    ratePerNight: { type: "number" },
    netAmount: { type: "number" },
    received: { type: "number" },
    balance: { type: "number" },
    bankCharges: { type: "number" },
    totalNetPayable: { type: "number" },
    paid: { type: "boolean" },
    lineItems: { type: "array" },
  };

  const { form, errors, setField, setMany } = useFormState({
    initial,
    schema,
    onChange: (data) => actions.updateStepData("invoice", { ...data }),
  });

  // Ensure invoice number exists
  useEffect(() => {
    if (!form.invoiceNo) {
      const newInv = step4.invoiceNo || autoInvoiceNo(ticketId);
      setField("invoiceNo", newInv);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nights auto calc from check-in/out
  useEffect(() => {
    if (form.checkIn && form.checkOut) {
      const n = calculateNights(form.checkIn, form.checkOut);
      if (n !== form.nights) setField("nights", n);
    }
  }, [form.checkIn, form.checkOut, form.nights, setField]);

  // Live totals
  useEffect(() => {
    // If lineItems present, recompute subtotal from them; otherwise fallback
    const hasLines = Array.isArray(form.lineItems) && form.lineItems.length > 0;
    const base = hasLines
      ? form.lineItems.reduce(
          (sum, li) =>
            sum +
            guardNumber(li.ratePerNight, 0) *
              guardNumber(li.nights ?? form.nights, 0) *
              guardNumber(li.count, 1),
          0
        )
      : guardNumber(form.ratePerNight, 0) *
        guardNumber(form.nights, 0) *
        guardNumber(form.rooms, 1);

    const netAmount = guardNumber(form.netAmount || base, 0);
    const received = guardNumber(form.received, 0);
    const balance = Math.max(netAmount - received, 0);
    const totalNetPayable = balance + guardNumber(form.bankCharges, 0);
    setMany({ netAmount, balance, totalNetPayable });
  }, [
    form.ratePerNight,
    form.nights,
    form.rooms,
    form.received,
    form.bankCharges,
    form.lineItems,
    setMany,
  ]);

  // Autosave every 1.5s
  useAutosave({
    ticketId: ticketId || step4.ticketId,
    stepId: "invoice",
    data: { ...form, lastUpdated: new Date().toISOString() },
  });

  // Step status
  const required = [
    "invoiceDate",
    "invoiceNo",
    "hotelName",
    "checkIn",
    "checkOut",
    "currency",
  ];
  const { percent, state } = useStepStatus({ data: form, required });

  // Mark complete when paid and fields ready
  useEffect(() => {
    if (percent === 100 && (form.paid || form.balance === 0)) {
      actions.markComplete("invoice");
      actions.pushAudit("Invoice marked complete (auto)");
    }
  }, [percent, form.paid, form.balance, actions]);

  // Reminder after 3 days if balance > 0
  useReminders({
    key: `inv-${ticketId}`,
    active: guardNumber(form.balance, 0) > 0,
    days: 3,
    message: "Invoice unpaid for this ticket.",
  });

  // Company identity from your header line
  const company = useMemo(
    () => ({
      name: "Chalo Holiday",
      phone: "44 (0) 2030049978",
      email: "info@chaloholidays.com",
    }),
    []
  );

  /* --------- Actions: Email / Print ---------- */
  const emailTo = useRef(step4.clientEmail || step4.agentEmail || "");
  const emailSubject = useMemo(
    () =>
      `Invoice ${form.invoiceNo} — ${
        form.clientName || form.toName || form.hotelName || ""
      }`,
    [form.invoiceNo, form.clientName, form.toName, form.hotelName]
  );

  async function sendEmailWithPdf(blob) {
    try {
      const fd = new FormData();
      fd.append("ticketId", ticketId);
      fd.append("invoiceNo", form.invoiceNo);
      fd.append("to", emailTo.current || "");
      fd.append("subject", emailSubject);
      fd.append(
        "body",
        `Dear Client,\n\nPlease find the attached invoice ${form.invoiceNo}.\n\nRegards,\nChalo Holiday`
      );
      fd.append(
        "file",
        new File([blob], `${form.invoiceNo}.pdf`, { type: "application/pdf" })
      );

      const res = await fetch(
        "https://backend.chaloholidayonline.com/api/invoices/send-email",
        {
          method: "POST",
          body: fd,
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert("✅ Invoice emailed successfully.");
      actions.pushAudit("Invoice emailed");
    } catch (e) {
      alert(`❌ Failed to email invoice: ${e.message}`);
    }
  }

  function printBlob(blob) {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) {
      const timer = setInterval(() => {
        w.focus();
        // Printing a blob in a new tab is browser-controlled; we try once loaded
        if (w.document?.readyState === "complete") {
          w.print();
          clearInterval(timer);
        }
      }, 400);
    } else {
      // Fallback: download, then user prints
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.invoiceNo}.pdf`;
      a.click();
    }
    actions.pushAudit("Invoice printed");
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: Form */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Invoice <span className="font-semibold">{form.invoiceNo}</span> •
                Ticket: {ticketId}
              </div>
              <Badge
                tone={state === "ok" ? "success" : state === "warn" ? "warn" : "danger"}
                label={`Completion ${percent}%`}
              />
            </div>
          </CardHeader>
          <CardBody>
            {/* Company Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Company Phone"
                value={form.companyPhone || company.phone}
                onChange={(v) => setField("companyPhone", v)}
              />
              <Input
                label="Company Email"
                value={form.companyEmail || company.email}
                onChange={(v) => setField("companyEmail", v)}
              />
              <Input
                label="Date"
                type="date"
                min={isoToday()}
                value={form.invoiceDate}
                onChange={(v) => setField("invoiceDate", v)}
                error={errors.invoiceDate}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <Input
                label="To"
                value={form.toName}
                onChange={(v) => setField("toName", v)}
              />
              <Input
                label="Invoice #"
                value={form.invoiceNo}
                onChange={(v) => setField("invoiceNo", v)}
                required
                error={errors.invoiceNo}
              />
              <Select
                label="Booking Status"
                value={form.bookingStatus}
                onChange={(v) => setField("bookingStatus", v)}
                options={[
                  "On-Request",
                  "Confirmed",
                  "Reconfirmed(Guaranteed)",
                  "Cancelled by Agent",
                  "Cancelled by Hotel",
                ]}
              />
            </div>

            <Divider />

            {/* Booking */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Client / Agent Name"
                value={form.clientName}
                onChange={(v) => setField("clientName", v)}
              />
              <Input
                label="Client / Agent Voucher"
                value={form.agentVoucher}
                onChange={(v) => setField("agentVoucher", v)}
              />
              <Input label="HCN" value={form.hcn} onChange={(v) => setField("hcn", v)} />
              <Input label="Guest Name" value={step4.guestName || ""} readOnly />
              <Input
                label="Hotel Name"
                value={form.hotelName}
                onChange={(v) => setField("hotelName", v)}
                required
                error={errors.hotelName}
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
                required
                error={errors.checkIn}
              />
              <Input
                label="Check-Out"
                type="date"
                min={form.checkIn || isoToday()}
                value={form.checkOut}
                onChange={(v) => setField("checkOut", v)}
                required
                error={errors.checkOut}
              />
              <Input label="Nights" type="number" value={form.nights} readOnly />
              <Input
                label="No Of Room"
                type="number"
                value={form.rooms}
                onChange={(v) => setField("rooms", guardNumber(v, 1))}
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
            </div>

            <Divider />

            {/* Finance */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Select
                label="Currency"
                value={form.currency}
                onChange={(v) => setField("currency", v)}
                options={["GBP", "USD", "EUR", "AED", "INR"]}
                required
              />
              <Input
                label="Rate/Nt."
                type="number"
                value={form.ratePerNight}
                onChange={(v) => setField("ratePerNight", guardNumber(v))}
              />
              <Input
                label="Net Amt."
                type="number"
                value={form.netAmount}
                onChange={(v) => setField("netAmount", guardNumber(v))}
              />
              <Input
                label="Recd."
                type="number"
                value={form.received}
                onChange={(v) => setField("received", guardNumber(v))}
              />
              <Input label="Balance" type="number" value={form.balance} readOnly />
              <Input
                label="Bank Charges"
                type="number"
                value={form.bankCharges}
                onChange={(v) => setField("bankCharges", guardNumber(v))}
              />
              <Input
                label="Total Net Payable to Chalo Holiday"
                type="number"
                value={form.totalNetPayable}
                readOnly
              />
              <Toggle
                label="Paid"
                checked={!!form.paid}
                onChange={(v) => setField("paid", v)}
              />
            </div>

            <Divider />

            <Input
              label="Remarks"
              value={form.remarks}
              onChange={(v) => setField("remarks", v)}
              placeholder="Notes for client / internal"
            />
          </CardBody>
        </Card>

        {/* PDF Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-700">Invoice PDF</div>
              <small className="text-slate-500">Download • Print • Email</small>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-3 items-center">
              <PDFDownloadLink
                document={
                  <InvoicePDF
                    data={form}
                    company={{
                      name: "Chalo Holiday",
                      phone: form.companyPhone || "44 (0) 2030049978",
                      email: form.companyEmail || "info@chaloholidays.com",
                    }}
                  />
                }
                fileName={`${form.invoiceNo}.pdf`}
              >
                {({ loading }) => (
                  <Button disabled={loading}>
                    {loading ? "Preparing…" : "⬇️ Download PDF"}
                  </Button>
                )}
              </PDFDownloadLink>

              <BlobProvider
                document={
                  <InvoicePDF
                    data={form}
                    company={{
                      name: "Chalo Holiday",
                      phone: form.companyPhone || "44 (0) 2030049978",
                      email: form.companyEmail || "info@chaloholidays.com",
                    }}
                  />
                }
              >
                {({ blob, loading }) => (
                  <>
                    <Button disabled={loading} onClick={() => blob && printBlob(blob)}>
                      🖨️ Print
                    </Button>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        className="px-3 py-2 border rounded-md text-sm"
                        placeholder="email@domain.com"
                        defaultValue={emailTo.current}
                        onChange={(e) => (emailTo.current = e.target.value)}
                        style={{ minWidth: 240 }}
                      />
                      <Button
                        disabled={loading}
                        onClick={() => blob && sendEmailWithPdf(blob)}
                      >
                        ✉️ Send Email
                      </Button>
                    </div>
                  </>
                )}
              </BlobProvider>
            </div>

            <div className="text-[11px] text-slate-500 mt-2">
              Note: Bank Transfer — All charges to be covered by sender.
            </div>
          </CardBody>
        </Card>
      </div>

      {/* RIGHT: Sticky Summary */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">
                  Financial Summary
                </div>
                <Badge
                  tone={form.paid ? "success" : form.balance > 0 ? "warn" : "success"}
                  label={form.paid ? "Paid" : form.balance > 0 ? "Unpaid" : "Settled"}
                />
              </div>
            </CardHeader>
            <CardBody>
              <Row label="Currency" value={form.currency} />
              <Row
                label="Rooms × Nights"
                value={`${guardNumber(form.rooms, 1)} × ${guardNumber(form.nights, 0)}`}
              />
              <Row
                label="Rate/Nt."
                value={`${form.currency} ${fmt(guardNumber(form.ratePerNight, 0))}`}
              />
              <Divider />
              <Row
                label="Net Amount"
                value={`${form.currency} ${fmt(guardNumber(form.netAmount, 0))}`}
              />
              <Row
                label="Received"
                value={`${form.currency} ${fmt(guardNumber(form.received, 0))}`}
              />
              <Row
                label="Balance"
                value={`${form.currency} ${fmt(guardNumber(form.balance, 0))}`}
              />
              <Row
                label="Bank Charges"
                value={`${form.currency} ${fmt(guardNumber(form.bankCharges, 0))}`}
              />
              <Divider />
              <Row
                label="Total Net Payable"
                value={`${form.currency} ${fmt(guardNumber(form.totalNetPayable, 0))}`}
              />
              <div className="text-[11px] text-slate-500 mt-1">
                💾 Autosaving every 1.5s • Reminder if unpaid for 3 days
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small UI Primitives (local to file) ---------------- */
function Card({ children }) {
  return <div className="border border-slate-200 rounded-xl bg-white shadow-sm">{children}</div>;
}
function CardHeader({ children }) {
  return <div className="px-4 py-3 border-b border-slate-100">{children}</div>;
}
function CardBody({ children }) {
  return <div className="px-4 py-4">{children}</div>;
}
function Divider() {
  return <div className="h-px bg-slate-200 my-3" />;
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
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div className="text-slate-600">{label}</div>
      <div className="text-slate-900 font-medium text-right">{value}</div>
    </div>
  );
}
function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  readOnly = false,
  min,
  error,
}) {
  return (
    <label className="text-sm text-slate-700">
      <span className="block mb-1">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      <input
        className={`w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
          readOnly ? "bg-slate-50" : ""
        }`}
        value={value ?? ""}
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        readOnly={readOnly}
        min={min}
      />
      {error && <span className="text-xs text-rose-600 mt-1 inline-block">{String(error)}</span>}
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

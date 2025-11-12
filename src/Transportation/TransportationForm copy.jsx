import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../api/apiInstance";
import bookingApi from "../api/bookingApi";
import supplierApi from "../api/supplierApi";

export default function TransportationForm() {
  const [bookings, setBookings] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  const [transfer, setTransfer] = useState({
    transferType: "Airport Pickup",
    noOfPeople: 1,
    noOfLuggage: 0,
    vehicleType: "Sedan",
    pickupFrom: "",
    dropoffTo: "",
    pickupDate: "",
    pickupTime: "",
    dropoffDate: "",
    dropoffTime: "",
    supplierId: "",
    driverContact: "",
    buyingCurrency: "GBP",
    sellingCurrency: "GBP",
    chargesBuying: "",
    chargesSelling: "",
    paymentTerms: "",
    cancellationPolicy: "",
    otherCharges: [{ id: 1, type: "", amount: "", remark: "" }],
    remarks: "",
    autoCreateCommercial: true,
  });

  // Derived financial values
  const profit = useMemo(() => {
    const buy = parseFloat(transfer.chargesBuying || 0);
    const sell = parseFloat(transfer.chargesSelling || 0);
    return (sell - buy).toFixed(2);
  }, [transfer.chargesBuying, transfer.chargesSelling]);

  const profitMarginPct = useMemo(() => {
    const buy = parseFloat(transfer.chargesBuying || 0);
    const sell = parseFloat(transfer.chargesSelling || 0);
    return sell > 0 ? (((sell - buy) / sell) * 100).toFixed(2) : 0;
  }, [transfer.chargesBuying, transfer.chargesSelling]);

  // Load dropdowns (Booking + Suppliers)
  useEffect(() => {
    (async () => {
      try {
        const b = await bookingApi.getBookings();
        const s = await supplierApi.getSuppliers();
        // Map for readable dropdowns
        setBookings(
          b.map((bk) => ({
            id: bk.id,
            label:
              (bk.ticketNo ? `${bk.ticketNumber} - ` : "") +
              (bk.hotelName || bk.agencyName || "Unnamed Booking"),
          }))
        );
        setSuppliers(
          s.map((sp) => ({
            id: sp.id,
            name: sp.supplierName || sp.companyName || "Unnamed Supplier",
          }))
        );
      } catch (err) {
        console.error("Dropdown load error", err);
      }
    })();
  }, []);

  const updateField = (key, value) => setTransfer((t) => ({ ...t, [key]: value }));

  const addOtherCharge = () => {
    setTransfer((t) => ({
      ...t,
      otherCharges: [
        ...t.otherCharges,
        { id: (t.otherCharges.at(-1)?.id || 0) + 1, type: "", amount: "", remark: "" },
      ],
    }));
  };

  const removeOtherCharge = (id) => {
    setTransfer((t) => ({
      ...t,
      otherCharges: t.otherCharges.filter((oc) => oc.id !== id),
    }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...transfer, bookingId: Number(bookingId) };
      await api.post("/transfers", payload);
      setSaveStatus("success");
      alert("Transfer saved successfully!");
    } catch (err) {
      console.error("Save error", err);
      setSaveStatus("error");
      alert(err?.response?.data?.message || "Failed to save transfer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-6xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-6 text-blue-800">
        Transportation / Transfer Form
      </h2>

      {/* Booking / Supplier */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="text-sm font-semibold">Booking</label>
          <select
            className="w-full border rounded-lg p-2"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          >
            <option value="">Select Booking</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold">Transfer Type</label>
          <select
            className="w-full border rounded-lg p-2"
            value={transfer.transferType}
            onChange={(e) => updateField("transferType", e.target.value)}
          >
            <option>Airport Pickup</option>
            <option>Airport Drop</option>
            <option>Chauffeur</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold">Supplier</label>
          <select
            className="w-full border rounded-lg p-2"
            value={transfer.supplierId}
            onChange={(e) => updateField("supplierId", e.target.value)}
          >
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* People + Vehicle */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <input
          type="number"
          placeholder="People"
          value={transfer.noOfPeople}
          onChange={(e) => updateField("noOfPeople", e.target.value)}
          className="border rounded-lg p-2"
        />
        <input
          type="number"
          placeholder="Luggage"
          value={transfer.noOfLuggage}
          onChange={(e) => updateField("noOfLuggage", e.target.value)}
          className="border rounded-lg p-2"
        />
        <input
          type="text"
          placeholder="Vehicle Type"
          value={transfer.vehicleType}
          onChange={(e) => updateField("vehicleType", e.target.value)}
          className="border rounded-lg p-2"
        />
        <input
          type="text"
          placeholder="Driver Contact"
          value={transfer.driverContact}
          onChange={(e) => updateField("driverContact", e.target.value)}
          className="border rounded-lg p-2"
        />
      </div>

      {/* Route */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Pick-up From"
          value={transfer.pickupFrom}
          onChange={(e) => updateField("pickupFrom", e.target.value)}
          className="border rounded-lg p-2"
        />
        <input
          type="text"
          placeholder="Drop-off To"
          value={transfer.dropoffTo}
          onChange={(e) => updateField("dropoffTo", e.target.value)}
          className="border rounded-lg p-2"
        />
      </div>

      {/* Timing */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <input
          type="date"
          value={transfer.pickupDate}
          onChange={(e) => updateField("pickupDate", e.target.value)}
          className="border rounded-lg p-2"
        />
        <input
          type="time"
          value={transfer.pickupTime}
          onChange={(e) => updateField("pickupTime", e.target.value)}
          className="border rounded-lg p-2"
        />
        <input
          type="date"
          value={transfer.dropoffDate}
          onChange={(e) => updateField("dropoffDate", e.target.value)}
          className="border rounded-lg p-2"
        />
        <input
          type="time"
          value={transfer.dropoffTime}
          onChange={(e) => updateField("dropoffTime", e.target.value)}
          className="border rounded-lg p-2"
        />
      </div>

      {/* Financial */}
      <div className="border rounded-xl shadow-sm p-6 mb-6 bg-gradient-to-br from-blue-50 to-white">
        <h3 className="font-semibold text-blue-700 mb-4">Financial Details</h3>
        <div className="grid md:grid-cols-6 gap-4 mb-4">
          <select
            value={transfer.buyingCurrency}
            onChange={(e) => updateField("buyingCurrency", e.target.value)}
            className="border rounded-lg p-2"
          >
            <option>GBP</option>
            <option>USD</option>
            <option>EUR</option>
            <option>INR</option>
          </select>
          <input
            type="number"
            placeholder="Buying Amount"
            value={transfer.chargesBuying}
            onChange={(e) => updateField("chargesBuying", e.target.value)}
            className="border rounded-lg p-2"
          />
          <select
            value={transfer.sellingCurrency}
            onChange={(e) => updateField("sellingCurrency", e.target.value)}
            className="border rounded-lg p-2"
          >
            <option>GBP</option>
            <option>USD</option>
            <option>EUR</option>
            <option>INR</option>
          </select>
          <input
            type="number"
            placeholder="Selling Amount"
            value={transfer.chargesSelling}
            onChange={(e) => updateField("chargesSelling", e.target.value)}
            className="border rounded-lg p-2"
          />
          <input
            type="text"
            placeholder="Payment Terms"
            value={transfer.paymentTerms}
            onChange={(e) => updateField("paymentTerms", e.target.value)}
            className="border rounded-lg p-2 md:col-span-2"
          />
        </div>

        {/* Profit */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Profit</p>
            <p className="text-xl font-bold text-green-700">
              {profit} {transfer.sellingCurrency}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Profit Margin</p>
            <p className="text-xl font-bold text-blue-700">
              {profitMarginPct}%
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold">Cancellation Policy</label>
            <input
              type="text"
              placeholder="e.g., 24 hrs before"
              value={transfer.cancellationPolicy}
              onChange={(e) => updateField("cancellationPolicy", e.target.value)}
              className="border rounded-lg p-2 w-full"
            />
          </div>
        </div>
      </div>

      {/* Other Charges */}
      <div className="border rounded-xl p-6 mb-6">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold text-blue-700">Other Charges</h3>
          <button
            onClick={addOtherCharge}
            className="text-sm px-3 py-1 bg-blue-100 rounded"
          >
            + Add
          </button>
        </div>
        {transfer.otherCharges.map((oc) => (
          <div
            key={oc.id}
            className="grid md:grid-cols-12 gap-3 mb-3 items-center"
          >
            <input
              type="text"
              placeholder="Type"
              value={oc.type}
              onChange={(e) =>
                setTransfer((t) => ({
                  ...t,
                  otherCharges: t.otherCharges.map((ch) =>
                    ch.id === oc.id ? { ...ch, type: e.target.value } : ch
                  ),
                }))
              }
              className="border rounded-lg p-2 md:col-span-3"
            />
            <input
              type="number"
              placeholder="Amount"
              value={oc.amount}
              onChange={(e) =>
                setTransfer((t) => ({
                  ...t,
                  otherCharges: t.otherCharges.map((ch) =>
                    ch.id === oc.id ? { ...ch, amount: e.target.value } : ch
                  ),
                }))
              }
              className="border rounded-lg p-2 md:col-span-3"
            />
            <input
              type="text"
              placeholder="Remark"
              value={oc.remark}
              onChange={(e) =>
                setTransfer((t) => ({
                  ...t,
                  otherCharges: t.otherCharges.map((ch) =>
                    ch.id === oc.id ? { ...ch, remark: e.target.value } : ch
                  ),
                }))
              }
              className="border rounded-lg p-2 md:col-span-5"
            />
            <button
              onClick={() => removeOtherCharge(oc.id)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Save Actions */}
      <div className="flex gap-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-blue-700 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Transfer"}
        </button>
        {saveStatus === "success" && (
          <span className="text-green-700 self-center">Saved ✔</span>
        )}
        {saveStatus === "error" && (
          <span className="text-red-600 self-center">Error ✖</span>
        )}
      </div>
    </motion.div>
  );
}

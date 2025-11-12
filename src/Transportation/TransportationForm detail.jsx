import React, { useEffect, useMemo, useState } from "react";
import "./TransportationForm.css";
import api from "../api/apiInstance";
import bookingApi from "../api/bookingApi";
import supplierApi from "../api/supplierApi";

export default function TransportationForm() {
  const [bookings, setBookings] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [bookingId, setBookingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [errors, setErrors] = useState({});

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
    supplierName: "",
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

  // Feature 1: Real-time Cost Calculator
  const [costCalculation, setCostCalculation] = useState({
    baseRate: 0,
    distanceCharge: 0,
    timeCharge: 0,
    luggageCharge: 0,
    totalEstimated: 0
  });

  // Feature 2: Smart Vehicle Recommendations
  const vehicleRecommendations = useMemo(() => {
    const people = parseInt(transfer.noOfPeople) || 1;
    const luggage = parseInt(transfer.noOfLuggage) || 0;
    
    const recommendations = [];
    if (people <= 4 && luggage <= 2) {
      recommendations.push({ type: "Sedan", capacity: "1-4 people, 2 luggage", price: "$$" });
    }
    if (people <= 6 && luggage <= 4) {
      recommendations.push({ type: "SUV", capacity: "1-6 people, 4 luggage", price: "$$$" });
    }
    if (people <= 8 && luggage <= 6) {
      recommendations.push({ type: "Van", capacity: "1-8 people, 6 luggage", price: "$$$$" });
    }
    if (people > 8 || luggage > 6) {
      recommendations.push({ type: "Mini Bus", capacity: "8+ people, 6+ luggage", price: "$$$$$" });
    }
    return recommendations;
  }, [transfer.noOfPeople, transfer.noOfLuggage]);

  // Feature 3: Live Form Validation & Suggestions
  const [fieldSuggestions, setFieldSuggestions] = useState({
    pickupFrom: [],
    dropoffTo: []
  });

  // Feature 4: Quick Template System
  const transferTemplates = [
    { name: "Airport Transfer", transferType: "Airport Pickup", vehicleType: "Sedan", noOfPeople: 3, noOfLuggage: 2 },
    { name: "Corporate Ride", transferType: "Chauffeur", vehicleType: "SUV", noOfPeople: 2, noOfLuggage: 1 },
    { name: "Group Transfer", transferType: "Airport Pickup", vehicleType: "Van", noOfPeople: 6, noOfLuggage: 4 }
  ];

  // Feature 5: Interactive Map Preview
  const [showMapPreview, setShowMapPreview] = useState(false);

  // Enhanced financial calculations
  const { profit, profitMarginPct } = useMemo(() => {
    const buy = parseFloat(transfer.chargesBuying || 0);
    const sell = parseFloat(transfer.chargesSelling || 0);
    const profitValue = (sell - buy).toFixed(2);
    const marginValue = sell > 0 ? (((sell - buy) / sell) * 100).toFixed(2) : 0;

    return {
      profit: profitValue,
      profitMarginPct: marginValue
    };
  }, [transfer.chargesBuying, transfer.chargesSelling]);

  // Feature 1: Auto-cost calculation
  useEffect(() => {
    const calculateCosts = () => {
      const baseRates = {
        "Sedan": 50, "SUV": 75, "Van": 100, "Mini Bus": 150, "Bus": 200
      };
      
      const baseRate = baseRates[transfer.vehicleType] || 50;
      const luggageCharge = (parseInt(transfer.noOfLuggage) || 0) * 5;
      const peopleCharge = (parseInt(transfer.noOfPeople) || 1) * 2;
      
      setCostCalculation({
        baseRate,
        luggageCharge,
        peopleCharge,
        totalEstimated: baseRate + luggageCharge + peopleCharge
      });
    };

    calculateCosts();
  }, [transfer.vehicleType, transfer.noOfLuggage, transfer.noOfPeople]);

//   // Load dropdowns
//   useEffect(() => {
//     const loadDropdowns = async () => {
//       try {
//         const [bookingsData, suppliersData] = await Promise.all([
//           bookingApi.getBookings(),
//           supplierApi.getSuppliers()
//         ]);

//         setBookings(
//           bookingsData.map((booking) => ({
//             id: booking.id,
//             label: (booking.ticketNo ? `${booking.ticketNumber} - ` : "") +
//                    (booking.hotelName || booking.agencyName || "Unnamed Booking"),
//             supplierId: booking.supplierId || "",
//           }))
//         );

//         // setSuppliers(
//         //   suppliersData.map((supplier) => ({
//         //     id: supplier.id,
//         //     name: supplier.supplierName || supplier.companyName || "Unnamed Supplier",
//         //   }))
//         // );
//       } catch (error) {
//         console.error("Failed to load dropdown data:", error);
//       }
//     };

//     loadDropdowns();
//   }, []);
// ✅ Load bookings + suppliers
useEffect(() => {
  const loadDropdowns = async () => {
    try {
      const [bookingsData, suppliersData] = await Promise.all([
        bookingApi.getBookings(),
        supplierApi.getSuppliers(),
      ]);

      setBookings(
        bookingsData.map((booking) => ({
          id: booking.id,
          label:
            (booking.ticketNo ? `${booking.ticketNumber} - ` : "") +
            (booking.hotelName || booking.agencyName || "Unnamed Booking"),
          supplierId: booking.supplierName || "",
        }))
      );

      setSuppliers(
        suppliersData.map((supplier) => ({
          id: supplier.id,
          name:
            supplier.supplierName ||
            supplier.companyName ||
            "Unnamed Supplier",
        }))
      );
    } catch (error) {
      console.error("Failed to load dropdown data:", error);
    }
  };

  loadDropdowns();
}, []);


  // Field update handler
  const updateField = (key, value) => {
    setTransfer(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  // Feature 4: Apply template
  const applyTemplate = (template) => {
    setTransfer(prev => ({
      ...prev,
      transferType: template.transferType,
      vehicleType: template.vehicleType,
      noOfPeople: template.noOfPeople,
      noOfLuggage: template.noOfLuggage
    }));
  };

  // Other charges management
  const addOtherCharge = () => {
    setTransfer(prev => ({
      ...prev,
      otherCharges: [
        ...prev.otherCharges,
        { 
          id: (prev.otherCharges.at(-1)?.id || 0) + 1, 
          type: "", 
          amount: "", 
          remark: "" 
        },
      ],
    }));
  };

  const updateOtherCharge = (id, field, value) => {
    setTransfer(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.map(charge =>
        charge.id === id ? { ...charge, [field]: value } : charge
      ),
    }));
  };
// const handleBookingChange = (id) => {
//   setBookingId(id);

//   // Find the selected booking
//   const selected = bookings.find((b) => b.id.toString() === id.toString());

//   if (selected?.supplierId) {
//     // ✅ Auto-fill supplierId in transfer
//     setTransfer((prev) => ({
//       ...prev,
//       supplierId: selected.supplierId.toString(),
//     }));
//   }
// };

const handleBookingChange = (id) => {
  setBookingId(id);

  const selected = bookings.find((b) => b.id.toString() === id.toString());
  if (!selected) return;

  console.log("Selected booking:", selected);

  // ✅ Store supplier name directly
setTransfer((prev) => ({
  ...prev,
  supplierName: selected.supplierId || "", // since it’s actually a name
}));

};



  const removeOtherCharge = (id) => {
    setTransfer(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.filter(charge => charge.id !== id),
    }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus("saving");

    try {
      const payload = { 
        ...transfer, 
        bookingId: Number(bookingId),
        costCalculation // Include cost calculation in payload
      };
      
      await api.post("/transfers", payload);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="transportation-form-container">
      <div className="form-header-section">
        <h1 className="form-main-title">Transportation Transfer Management</h1>
        <p className="form-subtitle">Create and manage transportation transfers with smart recommendations</p>
      </div>

      {/* Feature 4: Quick Templates */}
      <div className="template-section">
        <h3 className="section-subtitle">Quick Templates</h3>
        <div className="template-cards-container">
          {transferTemplates.map((template, index) => (
            <button
              key={index}
              className="template-card"
              onClick={() => applyTemplate(template)}
            >
              <span className="template-name">{template.name}</span>
              <span className="template-details">
                {template.vehicleType} • {template.noOfPeople} people • {template.noOfLuggage} luggage
              </span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="transportation-main-form">
        {/* Booking & Supplier Section */}
        <section className="form-section-card">
          <h2 className="section-title">Booking & Supplier Information</h2>
          <div className="form-grid-three">
            <div className="form-field-group">
              <label className="field-label required">Select Booking</label>
              <select
                className={`form-select ${errors.bookingId ? 'field-error' : ''}`}
                value={bookingId}
                onChange={(e) => handleBookingChange(e.target.value)}
                >
                <option value="">Choose a booking...</option>
                {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                    {booking.label}
                    </option>
                ))}
                </select>

              {errors.bookingId && <span className="error-message">{errors.bookingId}</span>}
            </div>

            <div className="form-field-group">
              <label className="field-label">Transfer Type</label>
              <select
                className="form-select"
                value={transfer.transferType}
                onChange={(e) => updateField("transferType", e.target.value)}
              >
                <option>Airport Pickup</option>
                <option>Airport Drop</option>
                <option>Chauffeur</option>
                <option>City Transfer</option>
                <option>Intercity Transfer</option>
              </select>
            </div>

            {/* <div className="form-field-group">
              <label className="field-label required">Supplier</label>
              <select
                className={`form-select ${errors.supplierId ? 'field-error' : ''}`}
                value={transfer.supplierId}
                onChange={(e) => updateField("supplierId", e.target.value)}
              >
                <option value="">Select supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && <span className="error-message">{errors.supplierId}</span>}
            </div> */}
<div className="form-field-group">
  <label className="field-label">Linked Supplier</label>
  <input
    type="text"
    className="form-input"
    value={transfer.supplierName || "— No supplier linked —"}
    readOnly
  />
</div>




          </div>
        </section>

        {/* Passenger & Vehicle Section */}
        <section className="form-section-card">
          <h2 className="section-title">Passenger & Vehicle Details</h2>
          
          {/* Feature 2: Vehicle Recommendations */}
          <div className="recommendation-banner">
            <h4 className="recommendation-title">💡 Vehicle Recommendations</h4>
            <div className="recommendation-list">
              {vehicleRecommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <span className="vehicle-type">{rec.type}</span>
                  <span className="vehicle-capacity">{rec.capacity}</span>
                  <span className="vehicle-price">{rec.price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-grid-four">
            <div className="form-field-group">
              <label className="field-label">Passengers</label>
              <input
                type="number"
                min="1"
                max="50"
                value={transfer.noOfPeople}
                onChange={(e) => updateField("noOfPeople", e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field-group">
              <label className="field-label">Luggage Pieces</label>
              <input
                type="number"
                min="0"
                max="20"
                value={transfer.noOfLuggage}
                onChange={(e) => updateField("noOfLuggage", e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field-group">
              <label className="field-label">Vehicle Type</label>
              <select
                className="form-select"
                value={transfer.vehicleType}
                onChange={(e) => updateField("vehicleType", e.target.value)}
              >
                <option>Sedan</option>
                <option>SUV</option>
                <option>Van</option>
                <option>Mini Bus</option>
                <option>Bus</option>
                <option>Luxury Car</option>
              </select>
            </div>

            <div className="form-field-group">
              <label className="field-label">Driver Contact</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={transfer.driverContact}
                onChange={(e) => updateField("driverContact", e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Feature 1: Cost Calculation Display */}
          <div className="cost-calculation-card">
            <h4 className="cost-calculation-title">💰 Estimated Cost Breakdown</h4>
            <div className="cost-breakdown">
              <div className="cost-item">
                <span>Base Rate ({transfer.vehicleType}):</span>
                <span>${costCalculation.baseRate}</span>
              </div>
              <div className="cost-item">
                <span>Luggage Charge ({transfer.noOfLuggage} × $5):</span>
                <span>${costCalculation.luggageCharge}</span>
              </div>
              <div className="cost-item">
                <span>Passenger Charge ({transfer.noOfPeople} × $2):</span>
                <span>${costCalculation.peopleCharge}</span>
              </div>
              <div className="cost-total">
                <span>Total Estimated:</span>
                <span>${costCalculation.totalEstimated}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Route & Timing Section */}
        <section className="form-section-card">
          <h2 className="section-title">Route & Schedule Information</h2>
          
          {/* Feature 5: Map Preview Toggle */}
          {/* <div className="map-preview-toggle">
            <button
              type="button"
              className={`toggle-button ${showMapPreview ? 'active' : ''}`}
              onClick={() => setShowMapPreview(!showMapPreview)}
            >
              {showMapPreview ? '📍 Hide Map Preview' : '🗺️ Show Map Preview'}
            </button>
          </div> */}

          {showMapPreview && (
            <div className="map-preview-placeholder">
              <div className="map-placeholder-content">
                <span>📍 Interactive Map Preview</span>
                <p>Visual route from {transfer.pickupFrom || 'pickup'} to {transfer.dropoffTo || 'dropoff'}</p>
              </div>
            </div>
          )}

          <div className="form-grid-two">
            <div className="form-field-group">
              <label className="field-label required">Pick-up Location</label>
              <input
                type="text"
                placeholder="Enter full pick-up address"
                value={transfer.pickupFrom}
                onChange={(e) => updateField("pickupFrom", e.target.value)}
                className={`form-input ${errors.pickupFrom ? 'field-error' : ''}`}
              />
              {errors.pickupFrom && <span className="error-message">{errors.pickupFrom}</span>}
            </div>

            <div className="form-field-group">
              <label className="field-label required">Drop-off Location</label>
              <input
                type="text"
                placeholder="Enter full drop-off address"
                value={transfer.dropoffTo}
                onChange={(e) => updateField("dropoffTo", e.target.value)}
                className={`form-input ${errors.dropoffTo ? 'field-error' : ''}`}
              />
              {errors.dropoffTo && <span className="error-message">{errors.dropoffTo}</span>}
            </div>
          </div>

          <div className="timing-grid">
            <div className="timing-group">
              <h4 className="timing-title">Pick-up Schedule</h4>
              <div className="form-grid-two">
                <div className="form-field-group">
                  <label className="field-label">Date</label>
                  <input
                    type="date"
                    value={transfer.pickupDate}
                    onChange={(e) => updateField("pickupDate", e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-field-group">
                  <label className="field-label">Time</label>
                  <input
                    type="time"
                    value={transfer.pickupTime}
                    onChange={(e) => updateField("pickupTime", e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <div className="timing-group">
              <h4 className="timing-title">Drop-off Schedule</h4>
              <div className="form-grid-two">
                <div className="form-field-group">
                  <label className="field-label">Date</label>
                  <input
                    type="date"
                    value={transfer.dropoffDate}
                    onChange={(e) => updateField("dropoffDate", e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-field-group">
                  <label className="field-label">Time</label>
                  <input
                    type="time"
                    value={transfer.dropoffTime}
                    onChange={(e) => updateField("dropoffTime", e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Section */}
        <section className="form-section-card financial-section">
          <h2 className="section-title">Financial Details</h2>
          
          <div className="form-grid-six">
            <div className="form-field-group">
              <label className="field-label">Buying Currency</label>
              <select
                className="form-select"
                value={transfer.buyingCurrency}
                onChange={(e) => updateField("buyingCurrency", e.target.value)}
              >
                <option>GBP</option>
                <option>USD</option>
                <option>EUR</option>
                <option>INR</option>
              </select>
            </div>

            <div className="form-field-group">
              <label className="field-label">Buying Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={transfer.chargesBuying}
                onChange={(e) => updateField("chargesBuying", e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field-group">
              <label className="field-label">Selling Currency</label>
              <select
                className="form-select"
                value={transfer.sellingCurrency}
                onChange={(e) => updateField("sellingCurrency", e.target.value)}
              >
                <option>GBP</option>
                <option>USD</option>
                <option>EUR</option>
                <option>INR</option>
              </select>
            </div>

            <div className="form-field-group">
              <label className="field-label required">Selling Amount</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={transfer.chargesSelling}
                onChange={(e) => updateField("chargesSelling", e.target.value)}
                className={`form-input ${errors.chargesSelling ? 'field-error' : ''}`}
              />
              {errors.chargesSelling && <span className="error-message">{errors.chargesSelling}</span>}
            </div>

            <div className="form-field-group double-width">
              <label className="field-label">Payment Terms</label>
              <input
                type="text"
                placeholder="e.g., Net 30, 50% advance"
                value={transfer.paymentTerms}
                onChange={(e) => updateField("paymentTerms", e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Profit Summary */}
          <div className="profit-summary-grid">
            <div className="profit-card">
              <div className="profit-label">Estimated Profit</div>
              <div className={`profit-amount ${profit >= 0 ? 'positive' : 'negative'}`}>
                {profit} {transfer.sellingCurrency}
              </div>
            </div>
            
            <div className="profit-card">
              <div className="profit-label">Profit Margin</div>
              <div className={`profit-percentage ${profitMarginPct >= 0 ? 'positive' : 'negative'}`}>
                {profitMarginPct}%
              </div>
            </div>
            
            <div className="form-field-group">
              <label className="field-label">Cancellation Policy</label>
              <input
                type="text"
                placeholder="e.g., Free cancellation 24h before"
                value={transfer.cancellationPolicy}
                onChange={(e) => updateField("cancellationPolicy", e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Other Charges Section */}
        <section className="form-section-card">
          <div className="section-header-with-action">
            <h2 className="section-title">Additional Charges</h2>
            <button
              type="button"
              className="add-charge-button"
              onClick={addOtherCharge}
            >
              <span className="button-icon">+</span>
              Add New Charge
            </button>
          </div>

          {transfer.otherCharges.map((charge) => (
            <div key={charge.id} className="charge-item-row">
              <div className="charge-input-group">
                <input
                  type="text"
                  placeholder="Charge type (Toll, Parking, etc.)"
                  value={charge.type}
                  onChange={(e) => updateOtherCharge(charge.id, "type", e.target.value)}
                  className="charge-type-input"
                />
              </div>
              
              <div className="charge-input-group">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={charge.amount}
                  onChange={(e) => updateOtherCharge(charge.id, "amount", e.target.value)}
                  className="charge-amount-input"
                />
              </div>
              
              <div className="charge-input-group large">
                <input
                  type="text"
                  placeholder="Remarks or description"
                  value={charge.remark}
                  onChange={(e) => updateOtherCharge(charge.id, "remark", e.target.value)}
                  className="charge-remark-input"
                />
              </div>
              
              <button
                type="button"
                className="remove-charge-button"
                onClick={() => removeOtherCharge(charge.id)}
                title="Remove this charge"
              >
                ×
              </button>
            </div>
          ))}
        </section>

        {/* Form Actions */}
        <section className="form-actions-section">
          <div className="actions-container">
            <button
              type="submit"
              disabled={saving}
              className={`submit-button ${saving ? 'loading' : ''}`}
            >
              {saving ? (
                <>
                  <span className="loading-spinner"></span>
                  Saving Transfer...
                </>
              ) : (
                'Save Transportation Transfer'
              )}
            </button>

            <div className="status-indicators">
              {saveStatus === "success" && (
                <div className="status-success">
                  ✅ Transfer saved successfully!
                </div>
              )}
              {saveStatus === "error" && (
                <div className="status-error">
                  ❌ Failed to save transfer. Please try again.
                </div>
              )}
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
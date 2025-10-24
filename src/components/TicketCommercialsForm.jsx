import React, { useState, useEffect } from "react";
import "./TicketCommercialsForm.css";

const TicketCommercialsForm = () => {
  const [form, setForm] = useState({
    buyingCurrency: "GBP",
    ratePerRoom: "",
    otherCharges: "",
    vat: "",
    commission: "",
    paymentTerms: "",
    cancellationPolicy: "",
    markup: "",
    netRate: ""
  });
//   alert("hello hi!")
  const [calculations, setCalculations] = useState({
    vatAmount: 0,
    commissionAmount: 0,
    totalWithVat: 0,
    netAfterCommission: 0
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Auto-calculate derived values when inputs change
  useEffect(() => {
    const rate = parseFloat(form.ratePerRoom) || 0;
    const vatPercent = parseFloat(form.vat) || 0;
    const commissionPercent = parseFloat(form.commission) || 0;
    const markupPercent = parseFloat(form.markup) || 0;
    
    const vatAmount = rate * (vatPercent / 100);
    const commissionAmount = rate * (commissionPercent / 100);
    const totalWithVat = rate + vatAmount;
    const netAfterCommission = rate - commissionAmount;
    const netRate = rate * (1 + (markupPercent / 100));
    
    setCalculations({
      vatAmount,
      commissionAmount,
      totalWithVat,
      netAfterCommission
    });
    
    if (form.markup) {
      setForm(prev => ({ ...prev, netRate: netRate.toFixed(2) }));
    }
  }, [form.ratePerRoom, form.vat, form.commission, form.markup]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.ratePerRoom) newErrors.ratePerRoom = "Rate per room is required";
    if (form.vat && (form.vat < 0 || form.vat > 100)) newErrors.vat = "VAT must be between 0-100%";
    if (form.commission && (form.commission < 0 || form.commission > 100)) newErrors.commission = "Commission must be between 0-100%";
    if (form.markup && form.markup < 0) newErrors.markup = "Markup cannot be negative";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSaveStatus("Saving...");
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Ticket Commercials Saved:", form);
      setSaveStatus("Saved successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("Save failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      buyingCurrency: "GBP",
      ratePerRoom: "",
      otherCharges: "",
      vat: "",
      commission: "",
      paymentTerms: "",
      cancellationPolicy: "",
      markup: "",
      netRate: ""
    });
    setErrors({});
    setSaveStatus("");
  };

  const handleCurrencyChange = (e) => {
    const currency = e.target.value;
    setForm({ ...form, buyingCurrency: currency });
  };

  return (
    <div className="tc-ticket-commercials-container">
      <div className="tc-ticket-commercials-card">
        <header className="tc-form-header">
          <h2>Ticket Commercials</h2>
          <p>Configure pricing and commercial terms for your ticket</p>
        </header>
        
        <form onSubmit={handleSubmit} className="tc-commercials-form">
          <div className="tc-form-section">
            <div className="tc-section-header">
              <h3>Pricing Details</h3>
              <div className="tc-section-divider"></div>
            </div>
            
            <div className="tc-form-row">
              <div className="tc-form-group">
                <label>Buying Currency</label>
                <div className="tc-select-wrapper">
                  <select 
                    name="buyingCurrency" 
                    value={form.buyingCurrency} 
                    onChange={handleCurrencyChange}
                    className="tc-currency-select"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                  <span className="tc-select-arrow"></span>
                </div>
              </div>

              <div className="tc-form-group">
                <label>
                  Rate per Room per Night
                  <span className="tc-required">*</span>
                </label>
                <div className="tc-input-with-symbol">
                  <span className="tc-currency-symbol">
                    {form.buyingCurrency === "USD" ? "$" : 
                     form.buyingCurrency === "EUR" ? "€" : 
                     form.buyingCurrency === "INR" ? "₹" : 
                     form.buyingCurrency === "JPY" ? "¥" : 
                     form.buyingCurrency === "CAD" ? "C$" : "£"}
                  </span>
                  <input
                    type="number"
                    name="ratePerRoom"
                    value={form.ratePerRoom}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={errors.ratePerRoom ? "error" : ""}
                  />
                </div>
                {errors.ratePerRoom && <span className="tc-error-text">{errors.ratePerRoom}</span>}
              </div>
            </div>

            <div className="tc-form-row">
              <div className="tc-form-group">
                <label>VAT %</label>
                <div className="tc-percent-input-wrapper">
                  <input
                    type="number"
                    name="vat"
                    value={form.vat}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                    className={errors.vat ? "error" : ""}
                  />
                  <span className="tc-percent-symbol">%</span>
                </div>
                {errors.vat && <span className="tc-error-text">{errors.vat}</span>}
                {form.vat && (
                  <div className="tc-calculation-hint">
                    VAT Amount: {calculations.vatAmount.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="tc-form-group">
                <label>Commission %</label>
                <div className="tc-percent-input-wrapper">
                  <input
                    type="number"
                    name="commission"
                    value={form.commission}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                    className={errors.commission ? "error" : ""}
                  />
                  <span className="tc-percent-symbol">%</span>
                </div>
                {errors.commission && <span className="tc-error-text">{errors.commission}</span>}
                {form.commission && (
                  <div className="tc-calculation-hint">
                    Commission: {calculations.commissionAmount.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="tc-form-group">
                <label>Markup %</label>
                <div className="tc-percent-input-wrapper">
                  <input
                    type="number"
                    name="markup"
                    value={form.markup}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className={errors.markup ? "error" : ""}
                  />
                  <span className="tc-percent-symbol">%</span>
                </div>
                {errors.markup && <span className="tc-error-text">{errors.markup}</span>}
              </div>
            </div>

            <div className="tc-form-row">
              <div className="tc-form-group">
                <label>Net Rate</label>
                <div className="tc-readonly-field">
                  <span className="tc-currency-symbol">
                    {form.buyingCurrency === "USD" ? "$" : 
                     form.buyingCurrency === "EUR" ? "€" : 
                     form.buyingCurrency === "INR" ? "₹" : 
                     form.buyingCurrency === "JPY" ? "¥" : 
                     form.buyingCurrency === "CAD" ? "C$" : "£"}
                  </span>
                  {form.netRate || "0.00"}
                </div>
              </div>

              <div className="tc-form-group">
                <label>Total with VAT</label>
                <div className="tc-readonly-field highlighted">
                  <span className="tc-currency-symbol">
                    {form.buyingCurrency === "USD" ? "$" : 
                     form.buyingCurrency === "EUR" ? "€" : 
                     form.buyingCurrency === "INR" ? "₹" : 
                     form.buyingCurrency === "JPY" ? "¥" : 
                     form.buyingCurrency === "CAD" ? "C$" : "£"}
                  </span>
                  {calculations.totalWithVat.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="tc-form-group full-width">
              <label>Other Charges / Taxes</label>
              <input
                type="text"
                name="otherCharges"
                value={form.otherCharges}
                onChange={handleChange}
                placeholder="e.g., Breakfast, City Tax, Resort Fee"
              />
            </div>
          </div>

          <div className="tc-form-section">
            <div className="tc-section-header">
              <h3>Terms & Conditions</h3>
              <div className="tc-section-divider"></div>
            </div>
            
            <div className="tc-form-group full-width">
              <label>Payment Terms</label>
              <textarea
                name="paymentTerms"
                value={form.paymentTerms}
                onChange={handleChange}
                placeholder="e.g., Payment due within 15 days of invoice date. 2% discount if paid within 7 days."
                rows="3"
              />
            </div>

            <div className="tc-form-group full-width">
              <label>Cancellation Policy</label>
              <textarea
                name="cancellationPolicy"
                value={form.cancellationPolicy}
                onChange={handleChange}
                placeholder="e.g., Free cancellation up to 48 hours before check-in. 50% charge for cancellations within 48 hours."
                rows="3"
              />
            </div>
          </div>

          <div className="tc-form-actions">
            <button 
              type="button" 
              className="tc-btn-secondary"
              onClick={handleReset}
            >
              Reset
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="tc-btn-primary"
            >
              {isSubmitting ? "Saving..." : "Save Commercials"}
            </button>
          </div>
          
          {saveStatus && (
            <div className={`tc-save-status ${saveStatus.includes("success") ? "success" : "error"}`}>
              {saveStatus}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TicketCommercialsForm;
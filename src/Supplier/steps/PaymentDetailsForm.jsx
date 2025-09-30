import React from "react";

const PaymentDetailsForm = ({ formData, handleChange, setCurrentStep, onSubmit, saving }) => {
  return (
    <div className="form-section">
      <h2 className="section-title">Payment & Final Details</h2>

      <div className="form-row">
        <div className="form-group full-width">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="enablePaymentDetails"
              checked={formData.enablePaymentDetails}
              onChange={handleChange}
              className="terms-checkbox"
            />
            <span className="checkbox-text">Enable Payment Details</span>
          </label>
          <span className="input-hint">Check this if you want to add payment information now</span>
        </div>
      </div>

      {formData.enablePaymentDetails && (
        <div className="payment-details-section">
          <h3 className="subsection-title">Bank Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input 
                type="text" 
                name="bankName" 
                value={formData.bankName} 
                onChange={handleChange} 
                className="form-input"
                placeholder="Enter bank name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bank Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter account number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Swift Code</label>
              <input
                type="text"
                name="bankSwiftCode"
                value={formData.bankSwiftCode}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter SWIFT/BIC code"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <input 
                type="text" 
                name="paymentTerms" 
                value={formData.paymentTerms} 
                onChange={handleChange} 
                className="form-input"
                placeholder="e.g., Net 30 days"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tax ID</label>
              <input 
                type="text" 
                name="taxId" 
                value={formData.taxId} 
                onChange={handleChange} 
                className="form-input"
                placeholder="Enter tax identification number"
              />
            </div>
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group full-width">
          <label className="form-label">Special Remarks</label>
          <textarea
            name="specialRemarks"
            value={formData.specialRemarks}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Any additional notes or special instructions"
            rows="3"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group full-width">
          <label className="checkbox-label required">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="terms-checkbox"
            />
            <span className="checkbox-text">
              I accept the Terms & Conditions *
            </span>
          </label>
          {!formData.acceptTerms && (
            <span className="error-message">You must accept the terms and conditions</span>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          onClick={() => setCurrentStep(2)}
          disabled={saving}
          className="secondary-button back-button"
        >
          Back: User Details
        </button>
        <button 
          type="button" 
          onClick={onSubmit} 
          disabled={saving || !formData.acceptTerms}
          className="submit-button save-button"
        >
          {saving ? (
            <>
              <span className="loading-spinner"></span>
              Saving Supplier...
            </>
          ) : (
            "Save Supplier"
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentDetailsForm;
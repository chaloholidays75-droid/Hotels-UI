import React from 'react';
import LocationSelector from '../components/LocationSelector';
import CategorySelector from '../components/CategorySelector';

const SupplierDetailsForm = ({ formData, setFormData, errors, setErrors, handleChange, setCurrentPage }) => {

  const handleNext = (e) => {
    e.preventDefault();
    // Add simple validation if needed
    if (!formData.supplierName || !formData.emailId) {
      setErrors({ supplierName: 'Required', emailId: 'Required' });
      return;
    }
    setCurrentPage('user');
  };

  return (
    <form onSubmit={handleNext} className="supplier-form">
      <h2>Supplier Details</h2>

      <div className="form-group">
        <label className="form-label required">Supplier Name</label>
        <input
          type="text"
          name="supplierName"
          value={formData.supplierName}
          onChange={handleChange}
          className={errors.supplierName ? 'form-input error' : 'form-input'}
        />
        {errors.supplierName && <span className="error-message">{errors.supplierName}</span>}
      </div>

      <LocationSelector
        countryId={formData.countryId}
        cityId={formData.cityId}
        onCountrySelect={({ id }) => setFormData({ ...formData, countryId: id })}
        onCitySelect={({ id }) => setFormData({ ...formData, cityId: id })}
      />

      <CategorySelector
        categoryId={formData.supplierCategoryId}
        subCategoryId={formData.supplierSubCategoryId}
        onCategorySelect={(id) => setFormData({ ...formData, supplierCategoryId: id })}
        onSubCategorySelect={(id) => setFormData({ ...formData, supplierSubCategoryId: id })}
      />

      <div className="form-group">
        <input
          type="checkbox"
          name="paymentEnabled"
          checked={formData.paymentEnabled}
          onChange={handleChange}
        />
        <label>Enable Payment Details</label>
      </div>

      {formData.paymentEnabled && (
        <>
          <div className="form-group">
            <label>Payment Method</label>
            <input
              type="text"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Account Number</label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      <button type="submit" className="submit-button">Next: User Details</button>
    </form>
  );
};

export default SupplierDetailsForm;

import React, { useEffect, useState } from "react";
import supplierApi from "../../api/supplierApi";
import LocationSelector from "../../components/LocationSelector";
import CategorySelector from "../../components/CategorySelector";

const SupplierDetailsForm = ({ formData, setFormData, handleChange, setCurrentStep }) => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await supplierApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch categories");
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const data = await supplierApi.getSubCategories(categoryId);
      setSubCategories(data);
    } catch (err) {
      console.error(err);
      setSubCategories([]);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      supplierCategoryId: categoryId,
      supplierSubCategoryId: "" // Reset subcategory when category changes
    }));

    if (categoryId) {
      fetchSubCategories(categoryId);
    } else {
      setSubCategories([]);
    }
  };

  const handleSubCategorySelect = (subCategoryId) => {
    setFormData((prev) => ({
      ...prev,
      supplierSubCategoryId: subCategoryId
    }));
  };

  // Email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation
  const isValidPhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  };

  return (
    <div className="form-section">
      <h2 className="section-title">Supplier Details</h2>

      {/* Supplier Name */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label required">Supplier Name</label>
          <input
            type="text"
            name="supplierName"
            value={formData.supplierName || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter supplier name"
          />
        </div>
      </div>
         {/* Location */}
      <div className="form-row">
        <div className="form-group full-width">
          <label className="form-label">Location</label>
          <LocationSelector
                countryId={formData.countryId}
                cityId={formData.cityId}
                onCountrySelect={({ name, id, phoneCode }) =>
                    setFormData((prev) => ({
                    ...prev,
                    countryId: id,
                    country: name,
                    contactPhone: phoneCode + (prev.contactPhone?.replace(/^\+\d*/, "  ") || "")
                    }))
                }
                onCitySelect={({ name, id }) =>
                    setFormData((prev) => ({
                    ...prev,
                    cityId: id,
                    city: name
                    }))
                }
                />
        </div>
      </div>
      {/* Email + Phone */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label required">Email</label>
          <input
            type="email"
            name="emailId"
            value={formData.emailId || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter email address"
          />
          {formData.emailId && !isValidEmail(formData.emailId) && (
            <span className="error-message">Please enter a valid email address</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label required">Phone Number</label>
          <input
            type="tel"
            name="phoneNo"
            value={formData.phoneNo || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter phone number"
          />
          {formData.phoneNo && !isValidPhone(formData.phoneNo) && (
            <span className="error-message">Please enter a valid phone number</span>
          )}
        </div>
      </div>

      {/* PostCode + Region */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Post Code</label>
          <input
            type="text"
            name="postCode"
            value={formData.postCode || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter postal code"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Region</label>
          <input
            type="text"
            name="region"
            value={formData.region || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter region"
          />
        </div>
      </div>

      {/* Website */}
      <div className="form-row">
        <div className="form-group full-width">
          <label className="form-label">Website</label>
          <input
            type="url"
            name="website"
            value={formData.website || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Business Currency */}
      <div className="form-row">
        <div className="form-group full-width">
          <label className="form-label required">Business Currency</label>
          <select
            name="businessCurrency"
            value={formData.businessCurrency || ""}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">-- Select Currency --</option>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
          </select>
        </div>
      </div>

 

      {/* Address */}
      <div className="form-row">
        <div className="form-group full-width">
          <label className="form-label">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter complete address"
          />
        </div>
      </div>

      {/* Category + Subcategory */}
      <div className="form-row">
        <div className="form-group full-width">
          <label className="form-label required">Category & Subcategory</label>
          <CategorySelector
            categoryId={formData.supplierCategoryId}
            subCategoryId={formData.supplierSubCategoryId}
            onCategorySelect={handleCategorySelect}
            onSubCategorySelect={handleSubCategorySelect}
            size="medium"
            variant="default"
            required={true}
          />
        </div>
      </div>

      {/* Next Button */}
      <div className="form-actions">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="submit-button next-button"
          disabled={
            !formData.supplierName ||
            !formData.supplierCategoryId ||
            !formData.supplierSubCategoryId ||
            !formData.emailId ||
            !formData.phoneNo ||
            !formData.businessCurrency ||
            !isValidEmail(formData.emailId) ||
            !isValidPhone(formData.phoneNo)
          }
        >
          Next: User Details
        </button>
      </div>
    </div>
  );
};

export default SupplierDetailsForm;

import React, { useEffect, useState, useMemo } from "react";
import { z } from "zod";
import supplierApi from "../../api/supplierApi";
import LocationSelector from "../../components/LocationSelector";
import CategorySelector from "../../components/CategorySelector";
import "./SupplierRegistrationForm.css";

const passwordStrength = (pwd = "") => {
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 10) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { label: "Very weak", score, color: "bg-red-400" };
  if (score === 2) return { label: "Weak", score, color: "bg-orange-400" };
  if (score === 3) return { label: "Medium", score, color: "bg-yellow-400" };
  if (score >= 4) return { label: "Strong", score, color: "bg-green-400" };
  return { label: "Very weak", score, color: "bg-red-400" };
};

// Zod schema for user validation
const UserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userEmailId: z.string().email("Invalid email address"),
  mobileNo: z
    .string()
    .optional()
    .refine((v) => !v || /^[\+]?[0-9]{7,15}$/.test(v), "Invalid phone number"),
  userName: z.string().min(4, "Username must be at least 4 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"]
    });
  }
});

const SupplierRegistrationForm = ({ formData, setFormData, handleChange, onSubmit, saving }) => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [userIsValid, setUserIsValid] = useState(false);

  const pwdStrength = useMemo(() => passwordStrength(formData.password || ""), [formData.password]);

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
      supplierSubCategoryId: ""
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

  // Validate user details
  useEffect(() => {
    const userData = {
      firstName: formData.firstName ?? "",
      lastName: formData.lastName ?? "",
      userEmailId: formData.userEmailId ?? "",
      mobileNo: formData.mobileNo ?? "",
      userName: formData.userName ?? "",
      password: formData.password ?? "",
      confirmPassword: formData.confirmPassword ?? ""
    };

    const parsed = UserSchema.safeParse(userData);
    if (parsed.success) {
      setErrors({});
      setUserIsValid(true);
    } else {
      const zodErrs = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path?.[0] ?? "_";
        if (!zodErrs[path]) zodErrs[path] = issue.message;
      }
      setErrors(zodErrs);
      setUserIsValid(false);
    }
  }, [
    formData.firstName,
    formData.lastName,
    formData.userEmailId,
    formData.mobileNo,
    formData.userName,
    formData.password,
    formData.confirmPassword
  ]);

  const isFormValid = 
    formData.supplierName &&
    formData.supplierCategoryId &&
    formData.supplierSubCategoryId &&
    formData.emailId &&
    formData.phoneNo &&
    formData.businessCurrency &&
    formData.countryId &&
    formData.cityId &&
    isValidEmail(formData.emailId) &&
    isValidPhone(formData.phoneNo) &&
    userIsValid &&
    formData.acceptTerms;

  return (
    <div className="supplier-registration-form">
      <h2 className="supplier-registration-title">Supplier Registration</h2>

      <div className="supplier-registration-grid">
        {/* Row 1: Category, Location, Supplier Name, Email */}
        <div className="registration-field-group">
          <label className="registration-field-label required">Category & Subcategory</label>
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

        <div className="registration-field-group">
          <label className="registration-field-label required">Location</label>
          <div className="registration-location-wrapper">
            <LocationSelector
              countryId={formData.countryId}
              cityId={formData.cityId}
              onCountrySelect={({ name, id, phoneCode }) =>
                setFormData((prev) => ({
                  ...prev,
                  countryId: id,
                  country: name,
                  cityId: "",
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

        <div className="registration-field-group">
          <label className="registration-field-label required">Supplier Name</label>
          <input
            type="text"
            name="supplierName"
            value={formData.supplierName || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Enter supplier name"
          />
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label required">Email</label>
          <input
            type="email"
            name="emailId"
            value={formData.emailId || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="email@example.com"
          />
          {formData.emailId && !isValidEmail(formData.emailId) && (
            <span className="registration-field-error">Invalid email address</span>
          )}
        </div>

        {/* Row 2: Phone, Currency, Post Code, Area */}
        <div className="registration-field-group">
          <label className="registration-field-label required">Phone Number</label>
          <input
            type="tel"
            name="phoneNo"
            value={formData.phoneNo || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Phone number"
          />
          {formData.phoneNo && !isValidPhone(formData.phoneNo) && (
            <span className="registration-field-error">Invalid phone number</span>
          )}
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label required">Buying Currency</label>
          <select
            name="businessCurrency"
            value={formData.businessCurrency || ""}
            onChange={handleChange}
            className="registration-field-input"
          >
            <option value="">Select Currency</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="CAD">CAD</option>
          </select>
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label">Post Code</label>
          <input
            type="text"
            name="postCode"
            value={formData.postCode || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Postal code"
          />
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label">Area</label>
          <input
            type="text"
            name="area"
            value={formData.area || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Area or locality"
          />
        </div>

        {/* Row 3: Website, Address, First Name, Last Name */}
        <div className="registration-field-group">
          <label className="registration-field-label">Website</label>
          <input
            type="url"
            name="website"
            value={formData.website || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="https://example.com"
          />
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Enter complete address"
          />
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label required">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Enter first name"
          />
          {errors.firstName && <span className="registration-field-error">{errors.firstName}</span>}
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label required">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Enter last name"
          />
          {errors.lastName && <span className="registration-field-error">{errors.lastName}</span>}
        </div>

        {/* Row 4: User Email, Mobile No, Username, Password */}
        <div className="registration-field-group">
          <label className="registration-field-label required">User Email</label>
          <input
            type="email"
            name="userEmailId"
            value={formData.userEmailId || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Enter email address"
          />
          {errors.userEmailId && <span className="registration-field-error">{errors.userEmailId}</span>}
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label">Mobile No</label>
          <input
            type="text"
            name="mobileNo"
            value={formData.mobileNo || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Enter mobile number"
          />
          {errors.mobileNo && <span className="registration-field-error">{errors.mobileNo}</span>}
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label required">Username</label>
          <input
            type="text"
            name="userName"
            value={formData.userName || ""}
            onChange={handleChange}
            className="registration-field-input"
            placeholder="Choose a username"
          />
          {errors.userName && <span className="registration-field-error">{errors.userName}</span>}
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label required">Password</label>
          <div className="registration-input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              className="registration-field-input"
              placeholder="Enter password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="registration-toggle-icon"
              onClick={() => setShowPassword((s) => !s)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          {errors.password && <span className="registration-field-error">{errors.password}</span>}
        </div>

        {/* Row 5: Password Strength, Confirm Password, Payment Details, Special Remarks */}
        <div className="registration-field-group">
          <label className="registration-field-label">Password Strength</label>
          <div className="registration-password-strength">
            <div className="registration-password-strength-bar">
              <div
                className="registration-password-strength-fill"
                style={{
                  width: `${(pwdStrength.score / 5) * 100}%`,
                  backgroundColor:
                    pwdStrength.label === "Very weak"
                      ? "#f87171"
                      : pwdStrength.label === "Weak"
                      ? "#fb923c"
                      : pwdStrength.label === "Medium"
                      ? "#fbbf24"
                      : "#34d399"
                }}
              />
            </div>
            <span className="registration-password-strength-label">{pwdStrength.label}</span>
            <small className="registration-password-tip">
              Use 10+ chars with upper, lower, numbers and symbols
            </small>
          </div>
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label required">Confirm Password</label>
          <div className="registration-input-with-icon">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword || ""}
              onChange={handleChange}
              className="registration-field-input"
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="registration-toggle-icon"
              onClick={() => setShowConfirmPassword((s) => !s)}
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? "🙈" : "👁"}
            </button>
          </div>
          {errors.confirmPassword && <span className="registration-field-error">{errors.confirmPassword}</span>}
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label">Payment Details</label>
          <div className="registration-checkbox-group">
            <label className="registration-checkbox-label">
              <input
                type="checkbox"
                name="enablePaymentDetails"
                checked={formData.enablePaymentDetails}
                onChange={handleChange}
                className="registration-checkbox"
              />
              <span className="registration-checkbox-text">Enable Payment Details</span>
            </label>
          </div>
        </div>

        <div className="registration-field-group">
          <label className="registration-field-label">Special Remarks</label>
          <textarea
            name="specialRemarks"
            value={formData.specialRemarks}
            onChange={handleChange}
            className="registration-textarea"
            placeholder="Any additional notes or special instructions"
            rows="2"
          />
        </div>

        {/* Row 6: Terms & Conditions */}
        <div className="registration-field-group registration-field-fullwidth">
          <label className="registration-checkbox-label required">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="registration-checkbox"
            />
            <span className="registration-checkbox-text">
              I accept the Terms & Conditions *
            </span>
          </label>
          {!formData.acceptTerms && (
            <span className="registration-field-error">You must accept the terms and conditions</span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="registration-form-actions">
        <button 
          type="button" 
          onClick={onSubmit} 
          disabled={saving || !isFormValid}
          className="registration-submit-button"
        >
          {saving ? (
            <>
              <span className="registration-loading-spinner"></span>
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

export default SupplierRegistrationForm;
import React, { useState } from "react";
import supplierApi from "../api/supplierApi";

const SupplierUserDetailsForm = ({
  formData,
  setFormData,
  errors,
  setErrors,
  setCurrentPage,
  onSaved
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- Validation functions ---
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhone = (phone) => /^[+]?[0-9]{8,15}$/.test(phone);

  const validateForm = () => {
    let formErrors = {};

    if (!formData.firstName) formErrors.firstName = "First name is required";
    if (!formData.lastName) formErrors.lastName = "Last name is required";

    if (!formData.userEmailId) {
      formErrors.userEmailId = "Email is required";
    } else if (!validateEmail(formData.userEmailId)) {
      formErrors.userEmailId = "Enter a valid email address";
    }

    if (!formData.designation) formErrors.designation = "Designation is required";

    if (!formData.mobileNo) {
      formErrors.mobileNo = "Mobile number is required";
    } else if (!validatePhone(formData.mobileNo)) {
      formErrors.mobileNo = "Enter a valid mobile number";
    }

    if (!formData.userName) formErrors.userName = "Username is required";

    if (!formData.password) {
      formErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      formErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      formErrors.password = "Password must contain uppercase, lowercase, and numbers";
    }

    if (formData.password !== formData.confirmPassword) {
      formErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.acceptTerms) formErrors.acceptTerms = "You must accept terms";

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  // --- Submit handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Send all supplier + user details to backend
      await supplierApi.createSupplierWithUser(formData);
      onSaved(); // notify parent
    } catch (error) {
      console.error("Error saving supplier user:", error);
      alert(
        error.response?.data?.message || "An error occurred while saving user details."
      );
    }
  };

  // --- Render form ---
  return (
    <form onSubmit={handleSubmit} className="supplier-form">
      <h2>Supplier Main User Details</h2>

      <div className="form-row">
        <div className="form-group">
          <label>Title</label>
          <select
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          >
            <option value="">Select Title</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
            <option value="Dr">Dr</option>
          </select>
        </div>

        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="userEmailId"
            value={formData.userEmailId}
            onChange={(e) => setFormData({ ...formData, userEmailId: e.target.value })}
          />
          {errors.userEmailId && <span className="error-message">{errors.userEmailId}</span>}
        </div>

        <div className="form-group">
          <label>Designation *</label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          />
          {errors.designation && <span className="error-message">{errors.designation}</span>}
        </div>

        <div className="form-group">
          <label>Mobile No *</label>
          <input
            type="tel"
            name="mobileNo"
            value={formData.mobileNo}
            onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
          />
          {errors.mobileNo && <span className="error-message">{errors.mobileNo}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Username *</label>
          <input
            type="text"
            name="userName"
            value={formData.userName}
            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
          />
          {errors.userName && <span className="error-message">{errors.userName}</span>}
        </div>

        <div className="form-group">
          <label>Password *</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>👁️</button>
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="form-group">
          <label>Confirm Password *</label>
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>👁️</button>
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>
      </div>

      <div className="form-group">
        <input
          type="checkbox"
          name="acceptTerms"
          checked={formData.acceptTerms}
          onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
        />
        <label>I accept Terms and Conditions</label>
        {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
      </div>

      <div className="form-actions">
        <button type="button" onClick={() => setCurrentPage('supplier')}>
          Back to Supplier Details
        </button>
        <button type="submit">Register Supplier</button>
      </div>
    </form>
  );
};

export default SupplierUserDetailsForm;

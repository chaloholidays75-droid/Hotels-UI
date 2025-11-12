import React, { useState, useEffect } from 'react';
import LocationSelector from '../components/LocationSelector';
import agencyApi from '../api/agencyApi';
import './AgencyRegistrationForm.css';

const passwordStrength = (pwd = "") => {
  let score = 0;
  if (pwd && pwd.length >= 6) score += 1;
  if (pwd && pwd.length >= 10) score += 1;
  if (pwd && /[0-9]/.test(pwd)) score += 1;
  if (pwd && /[A-Z]/.test(pwd)) score += 1;
  if (pwd && /[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { label: "Very weak", score, color: "bg-red-400" };
  if (score === 2) return { label: "Weak", score, color: "bg-orange-400" };
  if (score === 3) return { label: "Medium", score, color: "bg-yellow-400" };
  if (score >= 4) return { label: "Strong", score, color: "bg-green-400" };
  return { label: "Very weak", score, color: "bg-red-400" };
};

const AgencyForm = ({ 
  setActiveTab, 
  setAgencies, 
  agencies,
  setShowSuccessMessage,
  setShowErrorMessage,
  setMessageBoxContent
}) => {
  const [formData, setFormData] = useState({
    // Agency Details
    agencyName: '',
    countryId: '',
    cityId: '',
    postCode: '',
    area: '',
    region: '',
    address: '',
    website: '',
    phoneNo: '',
    emailId: '',
    businessCurrency: 'USD',
    specialRemarks: '',
    
    // User Details
    title: '',
    firstName: '',
    lastName: '',
    userEmailId: '',
    designation: '',
    mobileNo: '',
    userName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    
    // Staff Details
    sales: [{ name: "", designation: "", email: "", phone: "" }],
    reservation: [{ name: "", designation: "", email: "", phone: "" }],
    accounts: [{ name: "", designation: "", email: "", phone: "" }],
    reception: [{ name: "", designation: "", email: "", phone: "" }],
    concierge: [{ name: "", designation: "", email: "", phone: "" }]
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingEmail, setExistingEmail] = useState(false);
  const [existingUsername, setExistingUsername] = useState(false);

  const pwdStrength = passwordStrength(formData?.password || "");

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return false;
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validateEmails = (emails) => {
    if (!emails) return true;
    const emailList = emails.split(',');
    for (let email of emailList) {
      if (email.trim() && !validateEmail(email.trim())) {
        return false;
      }
    }
    return true;
  };

  const validatePhone = (phone) => {
    if (!phone) return false;
    const re = /^[+]?[0-9]{8,15}$/;
    return re.test(phone);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStaffChange = (role, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [role]: prev[role].map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }));
  };

  const addStaffMember = (role) => {
    setFormData(prev => ({
      ...prev,
      [role]: [...prev[role], { name: "", designation: "", email: "", phone: "" }]
    }));
  };

  const removeStaffMember = (role, index) => {
    setFormData(prev => ({
      ...prev,
      [role]: prev[role].filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    let formErrors = {};

    // Agency validation
    if (!formData.agencyName) formErrors.agencyName = 'Agency name is required';
    if (!formData.countryId) formErrors.country = 'Country is required';
    if (!formData.cityId) formErrors.city = 'City is required';
    if (!formData.postCode) formErrors.postCode = 'Post code is required';
    if (!formData.area) formErrors.area = 'Area is required';
    if (!formData.region) formErrors.region = 'Region is required';
    if (!formData.address) formErrors.address = 'Address is required';
    
    if (!formData.phoneNo) {
      formErrors.phoneNo = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNo)) {
      formErrors.phoneNo = 'Please enter a valid phone number';
    }
    
    if (!formData.emailId) {
      formErrors.emailId = 'Email ID is required';
    } else if (!validateEmails(formData.emailId)) {
      formErrors.emailId = 'Please enter valid email addresses separated by commas';
    }

    // User validation
    if (!formData.firstName) formErrors.firstName = 'First name is required';
    if (!formData.lastName) formErrors.lastName = 'Last name is required';
    
    if (!formData.userEmailId) {
      formErrors.userEmailId = 'Email is required';
    } else if (!validateEmail(formData.userEmailId)) {
      formErrors.userEmailId = 'Please enter a valid email address';
    }
    
    if (!formData.designation) formErrors.designation = 'Designation is required';
    
    if (!formData.mobileNo) {
      formErrors.mobileNo = 'Mobile number is required';
    } else if (!validatePhone(formData.mobileNo)) {
      formErrors.mobileNo = 'Please enter a valid mobile number';
    }
    
    if (!formData.userName) {
      formErrors.userName = 'Username is required';
    }
    
    if (!formData.password) {
      formErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      formErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
      formErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }
    
    if (formData.password !== formData.confirmPassword) {
      formErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) formErrors.acceptTerms = 'You must accept the terms and conditions';

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      // Collect staff data
      const staff = [];
      const staffRoles = ['sales', 'reservation', 'accounts', 'reception', 'concierge'];
      
      staffRoles.forEach(role => {
        formData[role].forEach(person => {
          if (person.name.trim()) {
            staff.push({
              role: role.charAt(0).toUpperCase() + role.slice(1),
              name: person.name.trim(),
              designation: person.designation.trim() || null,
              email: person.email.trim() || null,
              phone: person.phone.trim() || null
            });
          }
        });
      });

      const payload = { ...formData, staff };
      const createdAgency = await agencyApi.createAgency(payload);

      setAgencies([...agencies, createdAgency]);
      setActiveTab('view');
      setMessageBoxContent('Agency registered successfully!');
      setShowSuccessMessage(true);

      // Reset form
      setFormData({
        agencyName: '',
        countryId: '',
        cityId: '',
        postCode: '',
        area: '',
        address: '',
        website: '',
        phoneNo: '',
        emailId: '',
        businessCurrency: 'USD',
        specialRemarks: '',
        title: '',
        firstName: '',
        lastName: '',
        userEmailId: '',
        designation: '',
        mobileNo: '',
        userName: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
        sales: [{ name: "", designation: "", email: "", phone: "" }],
        reservation: [{ name: "", designation: "", email: "", phone: "" }],
        accounts: [{ name: "", designation: "", email: "", phone: "" }],
        reception: [{ name: "", designation: "", email: "", phone: "" }],
        concierge: [{ name: "", designation: "", email: "", phone: "" }]
      });

    } catch (error) {
      console.error("Error submitting to backend:", error);
      setMessageBoxContent(error.response?.data?.title || "An error occurred while registering the agency");
      setShowErrorMessage(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const staffRoles = [
    { key: 'sales', title: 'Sales' },
    { key: 'reservation', title: 'Reservation' },
    { key: 'accounts', title: 'Accounts' },
    { key: 'reception', title: 'Reception' },
    { key: 'concierge', title: 'Concierge' }
  ];

  return (
    <div className="agency-registration-form">
      <h2 className="agency-registration-title">Agency Registration</h2>

      <form onSubmit={handleSubmit}>
        <div className="agency-registration-grid">
          {/* Row 1: Agency Name, Location, Area, Post Code */}
          <div className="agency-field-group">
            <label className="agency-field-label required">Agency Name</label>
            <input
              type="text"
              name="agencyName"
              value={formData.agencyName}
              onChange={handleChange}
              className={errors.agencyName ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="Enter agency name"
            />
            {errors.agencyName && <span className="agency-field-error">{errors.agencyName}</span>}
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">Location</label>
            <div className="agency-location-wrapper">
              <LocationSelector
                countryId={formData.countryId}
                cityId={formData.cityId}
                onCountrySelect={(country) => {
                  setFormData(prev => ({
                    ...prev,
                    countryId: country.id,
                    country: country.name,
                    countryPhoneCode: country.phoneCode,
                    region: country.region
                  }));

                  if (errors.region) {
                    setErrors(prev => ({ ...prev, region: "" }));
                  }
                }}
                onCitySelect={({ name, id }) =>
                  setFormData(prev => ({ ...prev, cityId: id, city: name }))
                }
                errors={errors}
              />
            </div>
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">Region</label>
            <input
              type="text"
              name="region"
              value={formData.region || ""}
              disabled
              className="agency-field-input"
              placeholder="Autofilled"
            />
            {errors.region && <span className="agency-field-error">{errors.region}</span>}
          </div>
          <div className="agency-field-group">
            <label className="agency-field-label required">Area</label>
            <input
              type="text"
              name="area"
              value={formData.area || ""}
              onChange={handleChange}
              className={errors.area ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="Enter Area"
            />
            {errors.area && <span className="agency-field-error">{errors.area}</span>}
          </div>
          <div className="agency-field-group">
            <label className="agency-field-label required">Post Code</label>
            <input
              type="text"
              name="postCode"
              value={formData.postCode}
              onChange={handleChange}
              className={errors.postCode ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="Enter post code"
            />
            {errors.postCode && <span className="agency-field-error">{errors.postCode}</span>}
          </div>

          {/* Row 2: Address, Website, Phone, Email */}
          <div className="agency-field-group">
            <label className="agency-field-label required">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={errors.address ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="Enter full address"
            />
            {errors.address && <span className="agency-field-error">{errors.address}</span>}
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label">Website</label>
            <input
              type="text"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="agency-field-input"
              placeholder="https://example.com"
            />
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">Phone No</label>
            <input
              type="tel"
              name="phoneNo"
              value={formData.phoneNo}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setFormData(prev => ({
                  ...prev,
                  phoneNo: `${prev.countryPhoneCode || ""}${raw}`
                }));
              }}
              className={errors.phoneNo ? 'agency-field-input error' : 'agency-field-input'}
              placeholder={`e.g. ${formData.countryPhoneCode || "+XXX"} 9876543210`}
            />
            {errors.phoneNo && <span className="agency-field-error">{errors.phoneNo}</span>}
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">Email ID</label>
            <input
              type="text"
              name="emailId"
              value={formData.emailId}
              onChange={handleChange}
              className={errors.emailId ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="email@example.com, email2@example.com"
            />
            {errors.emailId && <span className="agency-field-error">{errors.emailId}</span>}
            <div className="agency-input-hint">(Use commas for multiple emails)</div>
          </div>

          {/* Row 3: Business Currency, Title, First Name, Last Name */}
          <div className="agency-field-group">
            <label className="agency-field-label required">Business Currency</label>
            <select
              name="businessCurrency"
              value={formData.businessCurrency}
              onChange={handleChange}
              className="agency-field-input"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label">Title</label>
            <select
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="agency-field-input"
            >
              <option value="">Select Title</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
            </select>
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="Enter first name"
            />
            {errors.firstName && <span className="agency-field-error">{errors.firstName}</span>}
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="Enter last name"
            />
            {errors.lastName && <span className="agency-field-error">{errors.lastName}</span>}
          </div>

          {/* Row 4: User Email, Designation, Mobile No, Username */}
          <div className="agency-field-group">
            <label className="agency-field-label required">User Email</label>
            <input
              type="email"
              name="userEmailId"
              value={formData.userEmailId}
              onChange={handleChange}
              className={errors.userEmailId ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="email@example.com"
            />
            {errors.userEmailId && <span className="agency-field-error">{errors.userEmailId}</span>}
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">Designation</label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className={errors.designation ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="Enter designation"
            />
            {errors.designation && <span className="agency-field-error">{errors.designation}</span>}
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">Mobile No</label>
            <input
              type="tel"
              name="mobileNo"
              value={formData.mobileNo}
              onChange={handleChange}
              className={errors.mobileNo ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="Enter mobile number"
            />
            {errors.mobileNo && <span className="agency-field-error">{errors.mobileNo}</span>}
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">Username</label>
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              className={errors.userName ? 'agency-field-input error' : 'agency-field-input'}
              placeholder="Enter username"
            />
            {errors.userName && <span className="agency-field-error">{errors.userName}</span>}
          </div>

          {/* Row 5: Password, Confirm Password, Password Strength, Special Remarks */}
          <div className="agency-field-group">
            <label className="agency-field-label required">Password</label>
            <div className="agency-input-with-icon">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'agency-field-input error' : 'agency-field-input'}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="agency-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            {errors.password && <span className="agency-field-error">{errors.password}</span>}
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label required">Confirm Password</label>
            <div className="agency-input-with-icon">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'agency-field-input error' : 'agency-field-input'}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="agency-toggle-icon"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "🙈" : "👁"}
              </button>
            </div>
            {errors.confirmPassword && <span className="agency-field-error">{errors.confirmPassword}</span>}
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label">Password Strength</label>
            <div className="agency-password-strength">
              <div className="agency-password-strength-bar">
                <div
                  className="agency-password-strength-fill"
                  style={{
                    width: `${(pwdStrength.score / 5) * 100}%`,
                    backgroundColor: pwdStrength.color.replace('bg-', '')
                  }}
                />
              </div>
              <span className="agency-password-strength-label">{pwdStrength.label}</span>
            </div>
          </div>

          <div className="agency-field-group">
            <label className="agency-field-label">Special Remarks</label>
            <textarea
              name="specialRemarks"
              value={formData.specialRemarks}
              onChange={handleChange}
              className="agency-textarea"
              placeholder="Any additional notes or special instructions"
              rows="2"
            />
          </div>

          {/* Staff Sections */}
          {staffRoles.map(({ key, title }) => (
            <div key={key} className="agency-field-group agency-field-fullwidth">
              <div className="agency-staff-section">
                <div className="agency-staff-header">
                  <h4>{title} Staff</h4>
                  <button
                    type="button"
                    className="agency-add-staff-btn"
                    onClick={() => addStaffMember(key)}
                  >
                    + Add {title}
                  </button>
                </div>
                {formData[key].map((person, index) => (
                  <div key={index} className="agency-staff-row">
                    <input
                      type="text"
                      placeholder="Name"
                      value={person.name}
                      onChange={(e) => handleStaffChange(key, index, 'name', e.target.value)}
                      className="agency-field-input"
                    />
                    <input
                      type="text"
                      placeholder="Designation"
                      value={person.designation}
                      onChange={(e) => handleStaffChange(key, index, 'designation', e.target.value)}
                      className="agency-field-input"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={person.email}
                      onChange={(e) => handleStaffChange(key, index, 'email', e.target.value)}
                      className="agency-field-input"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={person.phone}
                      onChange={(e) => handleStaffChange(key, index, 'phone', e.target.value)}
                      className="agency-field-input"
                    />
                    <button
                      type="button"
                      className="agency-remove-staff-btn"
                      onClick={() => removeStaffMember(key, index)}
                      disabled={formData[key].length <= 1}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Terms & Conditions */}
          <div className="agency-field-group agency-field-fullwidth">
            <label className="agency-checkbox-label required">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="agency-checkbox"
              />
              <span className="agency-checkbox-text">
                I accept the Terms & Conditions *
              </span>
            </label>
            {errors.acceptTerms && <span className="agency-field-error">{errors.acceptTerms}</span>}
          </div>
        </div>

        {/* Submit Button */}
        <div className="agency-form-actions">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="agency-submit-button"
          >
            {isSubmitting ? (
              <>
                <span className="agency-loading-spinner"></span>
                Registering Agency...
              </>
            ) : (
              "Register Agency"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgencyForm;
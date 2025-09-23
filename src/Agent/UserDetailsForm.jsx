import React, { useState } from 'react';
import agencyApi from '../api/agencyApi';
const UserDetailsForm = ({ 
  formData, 
  setFormData, 
  errors, 
  setErrors, 
  passwordStrength, 
  passwordMatch,
  existingEmail,
  existingUsername,
  handleChange, 
  setCurrentPage, 
  setActiveTab, 
  setAgencies, 
  agencies,
  setShowSuccessMessage,
  setShowErrorMessage,
  setMessageBoxContent
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhone = (phone) => {
    const re = /^[+]?[0-9]{8,15}$/;
    return re.test(phone);
  };

  const validateUserForm = () => {
    let formErrors = {};

    if (!formData.firstName) formErrors.firstName = 'First name is required';
    if (!formData.lastName) formErrors.lastName = 'Last name is required';
    
    if (!formData.userEmailId) {
      formErrors.userEmailId = 'Email is required';
    } else if (!validateEmail(formData.userEmailId)) {
      formErrors.userEmailId = 'Please enter a valid email address';
    } else if (existingEmail) {
      formErrors.userEmailId = 'This email is already registered';
    }
    
    if (!formData.designation) formErrors.designation = 'Designation is required';
    
    if (!formData.mobileNo) {
      formErrors.mobileNo = 'Mobile number is required';
    } else if (!validatePhone(formData.mobileNo)) {
      formErrors.mobileNo = 'Please enter a valid mobile number';
    }
    
    if (!formData.userName) {
      formErrors.userName = 'Username is required';
    } else if (existingUsername) {
      formErrors.userName = 'This username is already taken';
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

const handleUserSubmit = async (e) => {
  e.preventDefault();
  if (!validateUserForm()) return;

  const newAgency = {
    agencyName: formData.agencyName,
    countryId: formData.countryId,
    cityId: formData.cityId,
    postCode: formData.postCode,
    address: formData.address,
    website: formData.website,
    phoneNo: formData.phoneNo,
    emailId: formData.emailId,
    businessCurrency: formData.businessCurrency,
    title: formData.title,
    firstName: formData.firstName,
    lastName: formData.lastName,
    userEmailId: formData.userEmailId,
    designation: formData.designation,
    mobileNo: formData.mobileNo,
    userName: formData.userName,
    password: formData.password,
    acceptTerms: formData.acceptTerms
  };

  try {
    const createdAgency = await agencyApi.createAgency(newAgency);

    setAgencies([...agencies, createdAgency]);
    setActiveTab('view');
    setMessageBoxContent('Agency registered successfully!');
    setShowSuccessMessage(true);

    setFormData({
      agencyName: '',
      countryId: '',
      cityId: '',
      postCode: '',
      address: '',
      website: '',
      phoneNo: '',
      emailId: '',
      businessCurrency: 'USD',
      title: '',
      firstName: '',
      lastName: '',
      userEmailId: '',
      designation: '',
      mobileNo: '',
      userName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    });

  } catch (error) {
    console.error("Error submitting to backend:", error);
    setMessageBoxContent(error.response?.data?.title || "An error occurred while registering the agency");
    setShowErrorMessage(true);
  }
};

  return (
    <form onSubmit={handleUserSubmit} className="agency-form">
      <div className="form-section">
        <h2 className="section-title">Main User Details</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title" className="form-label">Title</label>
            <select
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select Title</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="firstName" className="form-label required">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={errors.firstName ? 'form-input error' : 'form-input'}
              placeholder="Enter first name"
            />
            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lastName" className="form-label required">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? 'form-input error' : 'form-input'}
              placeholder="Enter last name"
            />
            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="userEmailId" className="form-label required">Email ID</label>
            <input
              type="email"
              id="userEmailId"
              name="userEmailId"
              value={formData.userEmailId}
              onChange={handleChange}
              className={errors.userEmailId || existingEmail ? 'form-input error' : 'form-input'}
              placeholder="email@example.com"
            />
            {errors.userEmailId && <span className="error-message">{errors.userEmailId}</span>}
            {existingEmail && !errors.userEmailId && <span className="error-message">This email is already registered</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="designation" className="form-label required">Designation</label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className={errors.designation ? 'form-input error' : 'form-input'}
              placeholder="Enter designation"
            />
            {errors.designation && <span className="error-message">{errors.designation}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="mobileNo" className="form-label required">Mobile No</label>
            <input
              type="tel"
              id="mobileNo"
              name="mobileNo"
              value={formData.mobileNo}
              onChange={handleChange}
              className={errors.mobileNo ? 'form-input error' : 'form-input'}
              placeholder="Enter mobile number"
            />
            {errors.mobileNo && <span className="error-message">{errors.mobileNo}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="userName" className="form-label required">User Name</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              className={errors.userName || existingUsername ? 'form-input error' : 'form-input'}
              placeholder="Enter username"
            />
            {errors.userName && <span className="error-message">{errors.userName}</span>}
            {existingUsername && !errors.userName && <span className="error-message">This username is already taken</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="password" className="form-label required">Password</label>
            <div className="input-with-icon">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'form-input error' : 'form-input'}
                placeholder="Create a strong password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
            {passwordStrength && (
              <div className={`password-strength ${passwordStrength.includes('Weak') ? 'weak' : passwordStrength.includes('Medium') ? 'medium' : 'strong'}`}>
                Password strength: {passwordStrength}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label required">Confirm Password</label>
            <div className="input-with-icon">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword || (passwordMatch === false) ? 'form-input error' : 'form-input'}
                placeholder="Confirm your password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </span>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            {passwordMatch === false && !errors.confirmPassword && (
              <span className="error-message">Passwords do not match</span>
            )}
            {passwordMatch === true && (
              <span className="success-message">Passwords match</span>
            )}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <div className="terms-container">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="terms-checkbox"
              />
              <label htmlFor="acceptTerms" className="terms-text">
                I Accept <a href="#terms" className="terms-link">Terms and Conditions</a>
              </label>
            </div>
            {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className="secondary-button"
          onClick={() => setCurrentPage('agency')}
        >
          Back to Agency Details
        </button>
        <button type="submit" className="submit-button">Register Agency</button>
      </div>
    </form>
  );
};

export default UserDetailsForm;
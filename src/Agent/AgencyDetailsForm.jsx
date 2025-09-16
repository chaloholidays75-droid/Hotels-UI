import React from 'react';
import LocationSelector from '../LocationSelector';

const AgencyDetailsForm = ({ formData, setFormData, errors, setErrors, handleChange, setCurrentPage }) => {
  const [showNotification, setShowNotification] = React.useState('');

  const validateEmail = (email) => {
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
    const re = /^[+]?[0-9]{8,15}$/;
    return re.test(phone);
  };

  const validateAgencyForm = () => {
    let formErrors = {};

    if (!formData.agencyName) formErrors.agencyName = 'Agency name is required';
    if (!formData.countryId) formErrors.country = 'Country is required';
    if (!formData.cityId) formErrors.city = 'City is required';
    if (!formData.postCode) formErrors.postCode = 'Post code is required';
    if (!formData.emailId) formErrors.emailId = 'Email ID is required';
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

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleAgencyNext = (e) => {
    e.preventDefault();
    if (validateAgencyForm()) {
      setCurrentPage('user');
    }
  };

  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleAgencyNext} className="agency-form">
      <div className="form-section">
        <h2 className="section-title">Agency Details</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="agencyName" className="form-label required">Agency Name</label>
            <input
              type="text"
              id="agencyName"
              name="agencyName"
              value={formData.agencyName}
              onChange={handleChange}
              className={errors.agencyName ? 'form-input error' : 'form-input'}
              placeholder="Enter agency name"
            />
            {errors.agencyName && <span className="error-message">{errors.agencyName}</span>}
          </div>
          
          <div className="form-group">
            <LocationSelector
              countryId={formData.countryId}
              cityId={formData.cityId}
              onCountrySelect={({ name, id }) => setFormData({ ...formData, countryId: id, country: name })}
              onCitySelect={({ name, id }) => setFormData({ ...formData, cityId: id, city: name })}
              errors={errors}
              showNotification={showNotification}
            />
          </div>
        
          <div className="form-group">
            <label htmlFor="postCode" className="form-label required">Post Code</label>
            <input
              type="text"
              id="postCode"
              name="postCode"
              value={formData.postCode}
              onChange={handleChange}
              className={errors.postCode ? 'form-input error' : 'form-input'}
              placeholder="Enter post code"
            />
            {errors.postCode && <span className="error-message">{errors.postCode}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="address" className="form-label required">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={errors.address ? 'form-input error' : 'form-input'}
              placeholder="Enter full address"
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="website" className="form-label">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="form-input"
              placeholder="https://example.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phoneNo" className="form-label required">Phone No</label>
            <input
              type="tel"
              id="phoneNo"
              name="phoneNo"
              value={formData.phoneNo}
              onChange={handleChange}
              className={errors.phoneNo ? 'form-input error' : 'form-input'}
              placeholder="Enter phone number"
            />
            {errors.phoneNo && <span className="error-message">{errors.phoneNo}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="emailId" className="form-label required">Email ID</label>
            <input
              type="text"
              id="emailId"
              name="emailId"
              value={formData.emailId}
              onChange={handleChange}
              className={errors.emailId ? 'form-input error' : 'form-input'}
              placeholder="email@example.com, email2@example.com"
            />
            {errors.emailId && <span className="error-message">{errors.emailId}</span>}
            <div className="input-hint">(Please use ' , ' for multiple Email IDs)</div>
          </div>
          
          <div className="form-group">
            <label htmlFor="businessCurrency" className="form-label required">Business Currency</label>
            <select
              id="businessCurrency"
              name="businessCurrency"
              value={formData.businessCurrency}
              onChange={handleChange}
              className="form-select"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button type="submit" className="submit-button">Next: User Details</button>
      </div>
    </form>
  );
};

export default AgencyDetailsForm;
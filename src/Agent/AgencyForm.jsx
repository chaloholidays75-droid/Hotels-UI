import React, { useState } from 'react';
import AgencyDetailsForm from './AgencyDetailsForm';
import UserDetailsForm from './UserDetailsForm';
import agencyApi from '../api/agencyApi';

// Message Box Component
const MessageBox = ({ type, message, onClose, isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className={`message-box-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`message-box ${type}`}>
        <div className="message-box-header">
          {type === 'success' ? (
            <span className="message-icon">✓</span>
          ) : (
            <span className="message-icon">⚠</span>
          )}
          <h3>{type === 'success' ? 'Success!' : 'Error!'}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="message-box-content">
          <p>{message}</p>
        </div>
        <div className="message-box-footer">
          <button className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const AgencyForm = ({ setActiveTab, setAgencies, agencies }) => {
  const [currentPage, setCurrentPage] = useState('agency');
  const [formData, setFormData] = useState({
    agencyName: '',
    countryId: '',
    cityId: '',
    postCode: '',
    address: '',
    region: '',
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

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(null);
  const [existingEmail, setExistingEmail] = useState(false);
  const [existingUsername, setExistingUsername] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [messageBoxContent, setMessageBoxContent] = useState('');

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    if (name === 'password') {
      checkPasswordStrength(value);
      
      // Check if passwords match
      if (formData.confirmPassword) {
        setPasswordMatch(value === formData.confirmPassword);
      }
    }
    
    if (name === 'confirmPassword') {
      setPasswordMatch(value === formData.password);
    }
    
    // Check if email already exists in database
if (name === 'userEmailId' && value) {
  try {
    const { data } = await agencyApi.get(`/agency/check-email?email=${encodeURIComponent(value)}`);
    setExistingEmail(data.exists);
  } catch (error) {
    console.error("Error checking email:", error.response?.data || error.message);
  }
}

if (name === 'userName' && value) {
  try {
    const { data } = await agencyApi.get(`/agency/check-username?username=${encodeURIComponent(value)}`);
    setExistingUsername(data.exists);
  } catch (error) {
    console.error("Error checking username:", error.response?.data || error.message);
  }
}
  };

  const checkPasswordStrength = (password) => {
    let strength = '';
    if (password.length === 0) {
      strength = '';
    } else if (password.length < 8) {
      strength = 'Weak (min 8 characters)';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      strength = 'Medium (add uppercase, lowercase, and numbers)';
    } else {
      strength = 'Strong';
    }
    setPasswordStrength(strength);
  };

  return (
    <div>
      <div className="form-progress">
        <div className={`progress-step ${currentPage === 'agency' ? 'active' : 'completed'}`}>
          <span className="step-number">1</span>
        </div>
        <div className={`progress-step ${currentPage === 'user' ? 'active' : ''}`}>
          <span className="step-number">2</span>
        </div>
      </div>

      {currentPage === 'agency' ? (
        <AgencyDetailsForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          handleChange={handleChange}
          setCurrentPage={setCurrentPage}
        />
      ) : (
        <UserDetailsForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          passwordStrength={passwordStrength}
          passwordMatch={passwordMatch}
          existingEmail={existingEmail}
          existingUsername={existingUsername}
          handleChange={handleChange}
          setCurrentPage={setCurrentPage}
          setActiveTab={setActiveTab}
          setAgencies={setAgencies}
          agencies={agencies}
          setShowSuccessMessage={setShowSuccessMessage}
          setShowErrorMessage={setShowErrorMessage}
          setMessageBoxContent={setMessageBoxContent}
        />
      )}
      
      {/* Message Boxes */}
      <MessageBox 
        type="success" 
        message={messageBoxContent} 
        onClose={() => setShowSuccessMessage(false)} 
        isVisible={showSuccessMessage} 
      />
      
      <MessageBox 
        type="error" 
        message={messageBoxContent} 
        onClose={() => setShowErrorMessage(false)} 
        isVisible={showErrorMessage} 
      />
    </div>
  );
};

export default AgencyForm;
import React, { useState } from 'react';
import AgencyDetailsForm from './AgencyDetailsForm';
import UserDetailsForm from './UserDetailsForm';

const AgencyForm = ({ setActiveTab, setAgencies, agencies }) => {
  const [currentPage, setCurrentPage] = useState('agency');
  const [formData, setFormData] = useState({
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

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');

  const handleChange = (e) => {
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
          handleChange={handleChange}
          setCurrentPage={setCurrentPage}
          setActiveTab={setActiveTab}
          setAgencies={setAgencies}
          agencies={agencies}
        />
      )}
    </div>
  );
};

export default AgencyForm;
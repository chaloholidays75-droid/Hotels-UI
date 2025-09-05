import React, { useState } from 'react';
// import * as XLSX from 'xlsx';
import LocationSelector from '../components/LocationSelector';
import './AgencyManagement.css';

const AgencyManagement = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [agencies, setAgencies] = useState([]);
  const [viewModal, setViewModal] = useState({ isOpen: false, agency: null });
  const [editModal, setEditModal] = useState({ isOpen: false, agency: null });
  const [formData, setFormData] = useState({
    agencyName: '',
    country: '',
    city: '',
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

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

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditModal({
      ...editModal,
      agency: {
        ...editModal.agency,
        [name]: type === 'checkbox' ? checked : value
      }
    });
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
  const handleLocationChange = (field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));

  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }
};

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

  const validateForm = () => {
    let formErrors = {};

    // Agency Details validation
    if (!formData.agencyName) formErrors.agencyName = 'Agency name is required';
    if (!formData.country) formErrors.country = 'Country is required';
    if (!formData.city) formErrors.city = 'City is required';
    if (!formData.postCode) formErrors.postCode = 'Post code is required';
    if (!formData.address) formErrors.address = 'Address is required';
    if (!formData.phoneNo) {
      formErrors.phoneNo = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNo)) {
      formErrors.phoneNo = 'Please enter a valid phone number';
    }
    
    if (formData.emailId && !validateEmails(formData.emailId)) {
      formErrors.emailId = 'Please enter valid email addresses separated by commas';
    }

    // Main User Details validation
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
    
    if (!formData.userName) formErrors.userName = 'Username is required';
    
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const newAgency = {
        id: Date.now(),
        agencyName: formData.agencyName,
        country: formData.country,
        city: formData.city,
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
        createdAt: new Date().toLocaleDateString(),
        status: 'Active'
      };
      
      setAgencies([...agencies, newAgency]);
      
      // Reset form
      setFormData({
        agencyName: '',
        country: '',
        city: '',
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
      
      setPasswordStrength('');
      
      alert('Agency registered successfully!');
      
      setActiveTab('view');
    }
  };

  const toggleAgencyStatus = (id) => {
    setAgencies(agencies.map(agency => 
      agency.id === id 
        ? {...agency, status: agency.status === 'Active' ? 'Inactive' : 'Active'} 
        : agency
    ));
  };

  const openViewModal = (agency) => {
    setViewModal({ isOpen: true, agency });
  };

  const closeViewModal = () => {
    setViewModal({ isOpen: false, agency: null });
  };

  const openEditModal = (agency) => {
    setEditModal({ isOpen: true, agency: { ...agency } });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, agency: null });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setAgencies(agencies.map(agency => 
      agency.id === editModal.agency.id ? editModal.agency : agency
    ));
    closeEditModal();
    alert('Agency details updated successfully!');
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(agencies.map(agency => ({
      'Agency Name': agency.agencyName,
      'Country': agency.country,
      'City': agency.city,
      'Post Code': agency.postCode,
      'Address': agency.address,
      'Phone': agency.phoneNo,
      'Email': agency.emailId,
      'Currency': agency.businessCurrency,
      'Contact Person': `${agency.firstName} ${agency.lastName}`,
      'Designation': agency.designation,
      'User Email': agency.userEmailId,
      'Mobile': agency.mobileNo,
      'Status': agency.status,
      'Registered On': agency.createdAt
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agencies');
    XLSX.writeFile(workbook, 'agencies.xlsx');
  };

  const printAgencies = () => {
    const printContent = `
      <html>
        <head>
          <title>Agencies List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-active { color: green; font-weight: bold; }
            .status-inactive { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Agencies List</h1>
          <table>
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>Country</th>
                <th>City</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${agencies.map(agency => `
                <tr>
                  <td>${agency.agencyName}</td>
                  <td>${agency.country}</td>
                  <td>${agency.city}</td>
                  <td>${agency.firstName} ${agency.lastName}</td>
                  <td>${agency.phoneNo}</td>
                  <td>${agency.emailId}</td>
                  <td class="status-${agency.status.toLowerCase()}">${agency.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="margin-top: 20px; text-align: center;">
            Generated on ${new Date().toLocaleDateString()}
          </p>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="agency-management-container">
      <div className="header">
        <h1>Agency Management System</h1>
        <p>Manage your agency registrations and view all agencies in one place</p>
      </div>
      
      <div className="tabs">
        <button 
          className={activeTab === 'add' ? 'tab active' : 'tab'} 
          onClick={() => handleTabChange('add')}
        >
          Add Agency
        </button>
        <button 
          className={activeTab === 'view' ? 'tab active' : 'tab'} 
          onClick={() => handleTabChange('view')}
        >
          View Agencies ({agencies.length})
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'add' ? (
          <form onSubmit={handleSubmit} className="agency-form">
            {/* Agency Details Section */}
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
                  {/* <label htmlFor="country" className="form-label required">Country</label> */}
                  <LocationSelector
                    type="country"                // if your component distinguishes type
                    value={formData.country}
                    onChange={(value) => handleLocationChange('country', value)}
                  />
                  {errors.country && <span className="error-message">{errors.country}</span>}
                </div>

                <div className="form-group">
                  {/* <label htmlFor="city" className="form-label required">City</label> */}
                  <LocationSelector
                    type="city"
                    country={formData.country}   // pass selected country to filter cities
                    value={formData.city}
                    onChange={(value) => handleLocationChange('city', value)}
                  />
                  {errors.city && <span className="error-message">{errors.city}</span>}
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
                  <label htmlFor="emailId" className="form-label">Email ID</label>
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
            
            {/* Main User Details Section */}
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
                    className={errors.userEmailId ? 'form-input error' : 'form-input'}
                    placeholder="email@example.com"
                  />
                  {errors.userEmailId && <span className="error-message">{errors.userEmailId}</span>}
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
                    className={errors.userName ? 'form-input error' : 'form-input'}
                    placeholder="Enter username"
                  />
                  {errors.userName && <span className="error-message">{errors.userName}</span>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password" className="form-label required">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? 'form-input error' : 'form-input'}
                    placeholder="Create a strong password"
                  />
                  {errors.password && <span className="error-message">{errors.password}</span>}
                  {passwordStrength && (
                    <div className={`password-strength ${passwordStrength.includes('Weak') ? 'weak' : passwordStrength.includes('Medium') ? 'medium' : 'strong'}`}>
                      Password strength: {passwordStrength}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label required">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? 'form-input error' : 'form-input'}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
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
              <button type="submit" className="submit-button">Register Agency</button>
            </div>
          </form>
        ) : (
          <div className="agencies-list">
            <div className="list-header">
              <h2 className="section-title">Registered Agencies</h2>
              <div className="action-buttons">
                <button className="action-btn export" onClick={exportToExcel}>
                  Export to Excel
                </button>
                <button className="action-btn print" onClick={printAgencies}>
                  Print
                </button>
              </div>
            </div>
            
            {agencies.length === 0 ? (
              <div className="empty-state">
                <p>No agencies registered yet.</p>
                <button 
                  className="secondary-button"
                  onClick={() => handleTabChange('add')}
                >
                  Add Your First Agency
                </button>
              </div>
            ) : (
              <div className="agencies-container">
                {agencies.map(agency => (
                  <div key={agency.id} className={`agency-card ${agency.status === 'Inactive' ? 'inactive' : ''}`}>
                    <div className="agency-header">
                      <h3>{agency.agencyName}</h3>
                      <div className="status-toggle">
                        <span className={`status-indicator ${agency.status === 'Active' ? 'active' : 'inactive'}`}>
                          {agency.status}
                        </span>
                        <button 
                          className={`toggle-btn ${agency.status === 'Active' ? 'active' : 'inactive'}`}
                          onClick={() => toggleAgencyStatus(agency.id)}
                          title={`Mark as ${agency.status === 'Active' ? 'Inactive' : 'Active'}`}
                        >
                          {agency.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="agency-details">
                      <div className="detail-row">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{agency.city}, {agency.country}</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Contact:</span>
                        <span className="detail-value">{agency.phoneNo}</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Main User:</span>
                        <span className="detail-value">{agency.firstName} {agency.lastName}</span>
                      </div>
                      
                      <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <span className={`detail-value status ${agency.status.toLowerCase()}`}>
                          {agency.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="agency-actions">
                      <button 
                        className="action-btn view"
                        onClick={() => openViewModal(agency)}
                      >
                        View Details
                      </button>
                      <button 
                        className="action-btn edit"
                        onClick={() => openEditModal(agency)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Agency Details</h2>
              <button className="close-btn" onClick={closeViewModal}>×</button>
            </div>
            <div className="modal-content">
              {viewModal.agency && (
                <div className="agency-details-modal">
                  <div className="detail-section">
                    <h3>Agency Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Agency Name:</span>
                      <span className="detail-value">{viewModal.agency.agencyName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{viewModal.agency.address}, {viewModal.agency.city}, {viewModal.agency.country} {viewModal.agency.postCode}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{viewModal.agency.phoneNo}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{viewModal.agency.emailId}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Website:</span>
                      <span className="detail-value">{viewModal.agency.website || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Business Currency:</span>
                      <span className="detail-value">{viewModal.agency.businessCurrency}</span>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h3>Main User Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{viewModal.agency.title} {viewModal.agency.firstName} {viewModal.agency.lastName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Designation:</span>
                      <span className="detail-value">{viewModal.agency.designation}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{viewModal.agency.userEmailId}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Mobile:</span>
                      <span className="detail-value">{viewModal.agency.mobileNo}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Username:</span>
                      <span className="detail-value">{viewModal.agency.userName}</span>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h3>Additional Information</h3>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className={`detail-value status ${viewModal.agency.status.toLowerCase()}`}>
                        {viewModal.agency.status}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Registered On:</span>
                      <span className="detail-value">{viewModal.agency.createdAt}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Agency Details</h2>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-content">
              {editModal.agency && (
                <form onSubmit={handleEditSubmit}>
                  <div className="form-section">
                    <h3 className="section-title">Agency Details</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Agency Name</label>
                        <input
                          type="text"
                          name="agencyName"
                          value={editModal.agency.agencyName}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label required">Country</label>
                        <select
                          name="country"
                          value={editModal.agency.country}
                          onChange={handleEditChange}
                          className="form-select"
                        >
                          <option value="">Select Country</option>
                          <option value="US">United States</option>
                          <option value="UK">United Kingdom</option>
                          <option value="CA">Canada</option>
                          <option value="AU">Australia</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">City</label>
                        <select
                          name="city"
                          value={editModal.agency.city}
                          onChange={handleEditChange}
                          className="form-select"
                        >
                          <option value="">Select City</option>
                          <option value="New York">New York</option>
                          <option value="London">London</option>
                          <option value="Toronto">Toronto</option>
                          <option value="Sydney">Sydney</option>
                          <option value="Berlin">Berlin</option>
                          <option value="Paris">Paris</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label required">Post Code</label>
                        <input
                          type="text"
                          name="postCode"
                          value={editModal.agency.postCode}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label className="form-label required">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={editModal.agency.address}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Website</label>
                        <input
                          type="url"
                          name="website"
                          value={editModal.agency.website}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label required">Phone No</label>
                        <input
                          type="tel"
                          name="phoneNo"
                          value={editModal.agency.phoneNo}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Email ID</label>
                        <input
                          type="text"
                          name="emailId"
                          value={editModal.agency.emailId}
                          onChange={handleEditChange}
                          className="form-input"
                          placeholder="email@example.com, email2@example.com"
                        />
                        <div className="input-hint">(Please use ' , ' for multiple Email IDs)</div>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label required">Business Currency</label>
                        <select
                          name="businessCurrency"
                          value={editModal.agency.businessCurrency}
                          onChange={handleEditChange}
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
                  
                  <div className="form-section">
                    <h3 className="section-title">Main User Details</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <select
                          name="title"
                          value={editModal.agency.title}
                          onChange={handleEditChange}
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
                        <label className="form-label required">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={editModal.agency.firstName}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={editModal.agency.lastName}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label required">Email ID</label>
                        <input
                          type="email"
                          name="userEmailId"
                          value={editModal.agency.userEmailId}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">Designation</label>
                        <input
                          type="text"
                          name="designation"
                          value={editModal.agency.designation}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label required">Mobile No</label>
                        <input
                          type="tel"
                          name="mobileNo"
                          value={editModal.agency.mobileNo}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label required">User Name</label>
                        <input
                          type="text"
                          name="userName"
                          value={editModal.agency.userName}
                          onChange={handleEditChange}
                          className="form-input"
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group full-width">
                        <label className="form-label">Status</label>
                        <select
                          name="status"
                          value={editModal.agency.status}
                          onChange={handleEditChange}
                          className="form-select"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="submit-button">Save Changes</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyManagement;
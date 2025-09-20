import React, { useState } from 'react';

const AgencyEditModal = ({ editModal, closeEditModal, setAgencies, agencies }) => {
  const [showNotification, setShowNotification] = useState('');
  const [errors, setErrors] = useState({});

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "country") {
      setEditModal({
        ...editModal,
        agency: {
          ...editModal.agency,
          country: { ...editModal.agency.country, name: value },
        },
      });
    } else if (name === "city") {
      setEditModal({
        ...editModal,
        agency: {
          ...editModal.agency,
          city: { ...editModal.agency.city, name: value },
        },
      });
    } else {
      setEditModal({
        ...editModal,
        agency: {
          ...editModal.agency,
          [name]: type === "checkbox" ? checked : value,
        },
      });
    }

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
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

  const validateEditForm = () => {
    let formErrors = {};

    // Agency Details validation
    if (!editModal.agency.agencyName) formErrors.agencyName = 'Agency name is required';
    if (!editModal.agency.country) formErrors.country = 'Country is required';
    if (!editModal.agency.city) formErrors.city = 'City is required';
    if (!editModal.agency.postCode) formErrors.postCode = 'Post code is required';
    if (!editModal.agency.address) formErrors.address = 'Address is required';
    
    if (!editModal.agency.phoneNo) {
      formErrors.phoneNo = 'Phone number is required';
    } else if (!validatePhone(editModal.agency.phoneNo)) {
      formErrors.phoneNo = 'Please enter a valid phone number';
    }
    
    if (!editModal.agency.emailId) {
      formErrors.emailId = 'Email ID is required';
    } else if (!validateEmails(editModal.agency.emailId)) {
      formErrors.emailId = 'Please enter valid email addresses separated by commas';
    }

    // User Details validation
    if (!editModal.agency.firstName) formErrors.firstName = 'First name is required';
    if (!editModal.agency.lastName) formErrors.lastName = 'Last name is required';
    
    if (!editModal.agency.userEmailId) {
      formErrors.userEmailId = 'Email is required';
    } else if (!validateEmail(editModal.agency.userEmailId)) {
      formErrors.userEmailId = 'Please enter a valid email address';
    }
    
    if (!editModal.agency.designation) formErrors.designation = 'Designation is required';
    
    if (!editModal.agency.mobileNo) {
      formErrors.mobileNo = 'Mobile number is required';
    } else if (!validatePhone(editModal.agency.mobileNo)) {
      formErrors.mobileNo = 'Please enter a valid mobile number';
    }
    
    if (!editModal.agency.userName) formErrors.userName = 'Username is required';

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const parseErrorMessage = (error) => {
    if (error.response?.data) {
      return error.response.data.message || JSON.stringify(error.response.data);
    }
    return error.message || "An unknown error occurred";
  };

const handleEditSubmit = async (e) => {
  e.preventDefault();
  if (!editModal.agency) return;

  if (!editModal.agency.id || isNaN(editModal.agency.id)) {
    alert("Invalid agency ID");
    return;
  }

  if (!validateEditForm()) return;

  // Prepare payload for backend
  const payload = {
    ...editModal.agency,
    countryId: editModal.agency.country?.id,
    cityId: editModal.agency.city?.id,
  };

  // Remove nested objects before sending
  delete payload.country;
  delete payload.city;

  // Remove undefined or null values
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  try {
    const res = await fetch(
      `https://backend.chaloholidayonline.com/api/agency/${editModal.agency.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      const contentLength = res.headers.get("content-length");
      let updated;

      if (contentLength && parseInt(contentLength) > 0) {
        updated = await res.json();
      } else {
        updated = {
          ...payload,
          updatedAt: new Date().toISOString(),
        };
      }

      // Keep country and city objects for UI display
      setAgencies((prev) =>
        prev.map((a) =>
          a.id === updated.id
            ? { ...updated, country: editModal.agency.country, city: editModal.agency.city }
            : a
        )
      );

      alert("Agency updated successfully!");
      closeEditModal();
    } else {
      let errorData;
      try {
        errorData = await res.json();
      } catch {
        errorData = { message: await res.text() || "Unknown error" };
      }

      console.error("Update failed:", errorData);
      alert(`Failed to update agency: ${errorData.message || "Unknown error"}`);
    }
  } catch (error) {
    const message = parseErrorMessage(error);
    console.error("Error details:", error);
    alert(`Error: ${message}`);
  }
};


  return (
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
                      className={errors.agencyName ? 'form-input error' : 'form-input'}
                    />
                    {errors.agencyName && <span className="error-message">{errors.agencyName}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={editModal.agency.country?.name || ''}
                      onChange={handleEditChange}
                      className={errors.country ? 'form-input error' : 'form-input'}
                    />
                    {errors.country && <span className="error-message">{errors.country}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">City</label>
                    <input
                      type="text"
                      name="city"
                      value={editModal.agency.city?.name || ''}
                      onChange={handleEditChange}
                      className={errors.city ? 'form-input error' : 'form-input'}
                    />
                    {errors.city && <span className="error-message">{errors.city}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Post Code</label>
                    <input
                      type="text"
                      name="postCode"
                      value={editModal.agency.postCode}
                      onChange={handleEditChange}
                      className={errors.postCode ? 'form-input error' : 'form-input'}
                    />
                    {errors.postCode && <span className="error-message">{errors.postCode}</span>}
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
                      className={errors.address ? 'form-input error' : 'form-input'}
                    />
                    {errors.address && <span className="error-message">{errors.address}</span>}
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
                      className={errors.phoneNo ? 'form-input error' : 'form-input'}
                    />
                    {errors.phoneNo && <span className="error-message">{errors.phoneNo}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Email ID</label>
                    <input
                      type="text"
                      name="emailId"
                      value={editModal.agency.emailId}
                      onChange={handleEditChange}
                      className={errors.emailId ? 'form-input error' : 'form-input'}
                      placeholder="email@example.com, email2@example.com"
                    />
                    {errors.emailId && <span className="error-message">{errors.emailId}</span>}
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
                      className={errors.firstName ? 'form-input error' : 'form-input'}
                    />
                    {errors.firstName && <span className="error-message">{errors.firstName}</span>}
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
                      className={errors.lastName ? 'form-input error' : 'form-input'}
                    />
                    {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Email ID</label>
                    <input
                      type="email"
                      name="userEmailId"
                      value={editModal.agency.userEmailId}
                      onChange={handleEditChange}
                      className={errors.userEmailId ? 'form-input error' : 'form-input'}
                    />
                    {errors.userEmailId && <span className="error-message">{errors.userEmailId}</span>}
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
                      className={errors.designation ? 'form-input error' : 'form-input'}
                    />
                    {errors.designation && <span className="error-message">{errors.designation}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Mobile No</label>
                    <input
                      type="tel"
                      name="mobileNo"
                      value={editModal.agency.mobileNo}
                      onChange={handleEditChange}
                      className={errors.mobileNo ? 'form-input error' : 'form-input'}
                    />
                    {errors.mobileNo && <span className="error-message">{errors.mobileNo}</span>}
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
                      className={errors.userName ? 'form-input error' : 'form-input'}
                    />
                    {errors.userName && <span className="error-message">{errors.userName}</span>}
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
                <button type="button" className="secondary-button" onClick={closeEditModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyEditModal;
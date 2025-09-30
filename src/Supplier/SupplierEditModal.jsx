import React, { useState } from 'react';
import supplierApi from '../api/supplierApi';
import CategorySelector from '../components/CategorySelector';

const SupplierEditModal = ({ editModal, setEditModal, closeEditModal, setSuppliers, suppliers }) => {
    
  const [showNotification, setShowNotification] = useState('');
  const [errors, setErrors] = useState({});
  console.log("editModal:", editModal);  // <-- log here
  console.log("Supplier:", editModal?.supplier);
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
 if (name === "country") {
  setEditModal({
    ...editModal,
    supplier: {
      ...editModal.supplier,
      countryName: value,
      countryId: editModal.supplier.countryId || null
    },
  });
    } else if (name === "city") {   
      setEditModal({
        ...editModal,
        supplier: {
          ...editModal.supplier,
        cityName: value,
        cityId: editModal.supplier.cityId || null
        },
      });
    } else {
      setEditModal({
        ...editModal,
        supplier: {
          ...editModal.supplier,
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

    // Supplier Details validation
    if (!editModal.supplier.supplierName) formErrors.supplierName = 'Supplier name is required';
    if (!editModal.supplier.countryName) formErrors.country = 'Country is required';
    if (!editModal.supplier.cityName) formErrors.city = 'City is required';
    if (!editModal.supplier.postCode) formErrors.postCode = 'Post code is required';
    if (!editModal.supplier.region) formErrors.region = 'Region is required';
    if (!editModal.supplier.address) formErrors.address = 'Address is required';
    
    if (!editModal.supplier.phoneNo) {
      formErrors.phoneNo = 'Phone number is required';
    } else if (!validatePhone(editModal.supplier.phoneNo)) {
      formErrors.phoneNo = 'Please enter a valid phone number';
    }
    
    if (!editModal.supplier.emailId) {
      formErrors.emailId = 'Email ID is required';
    } else if (!validateEmails(editModal.supplier.emailId)) {
      formErrors.emailId = 'Please enter valid email addresses separated by commas';
    }

    // Category validation
    if (!editModal.supplier.supplierCategoryId) formErrors.supplierCategoryId = 'Category is required';
    if (!editModal.supplier.supplierSubCategoryId) formErrors.supplierSubCategoryId = 'Subcategory is required';

    // User Details validation
    if (!editModal.supplier.firstName) formErrors.firstName = 'First name is required';
    if (!editModal.supplier.lastName) formErrors.lastName = 'Last name is required';
    
    if (!editModal.supplier.userEmailId) {
      formErrors.userEmailId = 'Email is required';
    } else if (!validateEmail(editModal.supplier.userEmailId)) {
      formErrors.userEmailId = 'Please enter a valid email address';
    }
    
    if (!editModal.supplier.mobileNo) {
      formErrors.mobileNo = 'Mobile number is required';
    } else if (!validatePhone(editModal.supplier.mobileNo)) {
      formErrors.mobileNo = 'Please enter a valid mobile number';
    }
    
    if (!editModal.supplier.userName) formErrors.userName = 'Username is required';

    // Payment details validation if enabled
if (editModal.supplier.enablePaymentDetails) {
  if (!editModal.supplier.bankName) 
    formErrors.bankName = 'Payment details are enabled - bank name is required. Enter "N/A" if not available';
  
  if (!editModal.supplier.bankAccountNumber) 
    formErrors.bankAccountNumber = 'Payment details are enabled - account number is required. Enter "N/A" if not available';
  
  if (!editModal.supplier.bankSwiftCode) 
    formErrors.bankSwiftCode = 'Payment details are enabled - SWIFT code is required. Enter "N/A" if not available';
  
  if (!editModal.supplier.paymentTerms) 
    formErrors.paymentTerms = 'Payment details are enabled - payment terms are required. Enter "N/A" if not specified';
  
  if (!editModal.supplier.taxId) 
    formErrors.taxId = 'Payment details are enabled - tax ID is required. Enter "N/A" if not available';
}
    // Terms acceptance validation
    if (!editModal.supplier.acceptTerms) formErrors.acceptTerms = 'You must accept the terms and conditions';

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

const handleEditSubmit = async (e) => {
  e.preventDefault();
  if (!editModal.supplier) return;

  if (!editModal.supplier.id || isNaN(editModal.supplier.id)) {
    alert("Invalid supplier ID");
    return;
  }

  if (!validateEditForm()) return;

 try {
    // 1️⃣ Fetch countries
    const countriesData = await supplierApi.getCountries();
    const countries = Array.isArray(countriesData) ? countriesData : [];
    console.log("Countries:", countries);
    // 2️⃣ Find the selected country
    const matchedCountry = countries.find(
      c => c.name.toLowerCase() === (editModal.supplier.countryName.toLowerCase() || '').toLowerCase()
    );
  

  let matchedCity = null;
  if (matchedCountry) {
      const citiesData = await supplierApi.getCities(matchedCountry.id);
      const cities = Array.isArray(citiesData) ? citiesData : [];
      console.log("Cities:", cities);

  matchedCity = cities.find(
        ct => ct.name.toLowerCase() === editModal.supplier.cityName.toLowerCase()
      );
  }

  const payload = {
    ...editModal.supplier,
    countryId: matchedCountry ? matchedCountry.id : null,
    cityId: matchedCity ? matchedCity.id : null,
  };

  delete payload.countryName;
  delete payload.cityName;

  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined || payload[key] === null) delete payload[key];
  });

  console.log("Payload being sent:", payload);

  const updatedSupplier = await supplierApi.updateSupplier(editModal.supplier.id, payload);
  alert("Supplier updated successfully!");
 const mergedSupplier = { ...editModal.supplier, ...updatedSupplier };
setSuppliers(prev =>
  prev.map(s => (s.id === mergedSupplier.id ? mergedSupplier : s))
);
closeEditModal();

} catch (error) {
  console.error("Failed to update supplier:", error.response?.data || error.message);
  alert(
    `Failed to update supplier: ${
      error.response?.data?.message || error.message || "Unknown error"
    }`
  );
}

};

    console.log("Supplier data:", editModal.supplier);



  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Edit Supplier Details</h2>
          <button className="close-btn" onClick={closeEditModal}>×</button>
        </div>
        <div className="modal-content">
          {editModal.supplier && (
            <form onSubmit={handleEditSubmit}>
              <div className="form-section">
                <h3 className="section-title">Supplier Details</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Supplier Name</label>
                    <input
                      type="text"
                      name="supplierName"
                      value={editModal.supplier.supplierName}
                      onChange={handleEditChange}
                      className={errors.supplierName ? 'form-input error' : 'form-input'}
                    />
                    {errors.supplierName && <span className="error-message">{errors.supplierName}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={editModal.supplier.countryName|| ''}
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
                      value={editModal.supplier.cityName || ''}
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
                      value={editModal.supplier.postCode}
                      onChange={handleEditChange}
                      className={errors.postCode ? 'form-input error' : 'form-input'}
                    />
                    {errors.postCode && <span className="error-message">{errors.postCode}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Region</label>
                    <input
                      type="text"
                      name="region"
                      value={editModal.supplier.region}
                      onChange={handleEditChange}
                      className={errors.region ? 'form-input error' : 'form-input'}
                    />
                    {errors.region && <span className="error-message">{errors.region}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="form-label required">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={editModal.supplier.address}
                      onChange={handleEditChange}
                      className={errors.address ? 'form-input error' : 'form-input'}
                    />
                    {errors.address && <span className="error-message">{errors.address}</span>}
                  </div>
                </div>

                <div className="form-row">


                  <div className="form-group">
                    <label className="form-label required">Phone No</label>
                    <input
                      type="tel"
                      name="phoneNo"
                      value={editModal.supplier.phoneNo}
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
                      value={editModal.supplier.emailId}
                      onChange={handleEditChange}
                      className={errors.emailId ? 'form-input error' : 'form-input'}
                      placeholder="email@example.com, email2@example.com"
                    />
                    {errors.emailId && <span className="error-message">{errors.emailId}</span>}
                    {/* <div className="input-hint">(Please use ' , ' for multiple Email IDs)</div> */}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Business Currency</label>
                    <select
                      name="businessCurrency"
                      value={editModal.supplier.businessCurrency}
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

                {/* <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Category</label>
                    <input
                      type="text"
                      name="supplierCategoryId"
                      value={editModal.supplier.supplierCategoryId}
                      onChange={handleEditChange}
                      className={errors.supplierCategoryId ? 'form-input error' : 'form-input'}
                    />
                    {errors.supplierCategoryId && <span className="error-message">{errors.supplierCategoryId}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Subcategory</label>
                    <input
                      type="text"
                      name="supplierSubCategoryId"
                      value={editModal.supplier.supplierSubCategoryId}
                      onChange={handleEditChange}
                      className={errors.supplierSubCategoryId ? 'form-input error' : 'form-input'}
                    />
                    {errors.supplierSubCategoryId && <span className="error-message">{errors.supplierSubCategoryId}</span>}
                  </div>
                </div> */}
                <div className="form-row">
                    <div className="form-group">
                        <CategorySelector
                        categoryId={editModal.supplier.supplierCategoryid}
                        subCategoryId={editModal.supplier.supplierSubCategoryid}
                        onCategorySelect={(id) => {
                            setEditModal(prev => ({
                            ...prev,
                            supplier: { ...prev.supplier, supplierCategoryId: id }
                            }));
                        }}
                        onSubCategorySelect={(id) => {
                            setEditModal(prev => ({
                            ...prev,
                            supplier: { ...prev.supplier, supplierSubCategoryId: id }
                            }));
                        }}
                        errors={{
                            category: errors.supplierCategoryId,
                            subCategory: errors.supplierSubCategoryId
                        }}
                        />
                    </div>
                    </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Main User Details</h3>

                <div className="form-row">
                  {/* <div className="form-group">
                    <label className="form-label">Title</label>
                    <select
                      name="title"
                      value={editModal.supplier.title}
                      onChange={handleEditChange}
                      className="form-select"
                    >
                      <option value="">Select Title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div> */}

                  <div className="form-group">
                    <label className="form-label required">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editModal.supplier.firstName}
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
                      value={editModal.supplier.lastName}
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
                      value={editModal.supplier.userEmailId}
                      onChange={handleEditChange}
                      className={errors.userEmailId ? 'form-input error' : 'form-input'}
                    />
                    {errors.userEmailId && <span className="error-message">{errors.userEmailId}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Mobile No</label>
                    <input
                      type="tel"
                      name="mobileNo"
                      value={editModal.supplier.mobileNo}
                      onChange={handleEditChange}
                      className={errors.mobileNo ? 'form-input error' : 'form-input'}
                    />
                    {errors.mobileNo && <span className="error-message">{errors.mobileNo}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">User Name</label>
                    <input
                      type="text"
                      name="userName"
                      value={editModal.supplier.userName}
                      onChange={handleEditChange}
                      className={errors.userName ? 'form-input error' : 'form-input'}
                    />
                    {errors.userName && <span className="error-message">{errors.userName}</span>}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Payment Details</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        name="enablePaymentDetails"
                        checked={editModal.supplier.enablePaymentDetails || false}
                        onChange={handleEditChange}
                        className="form-checkbox"
                      />
                      Enable Payment Details
                    </label>
                  </div>
                </div>

                {editModal.supplier.enablePaymentDetails && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label ">Bank Name</label>
                        <input
                          type="text"
                          name="bankName"
                          value={editModal.supplier.bankName || ''}
                          onChange={handleEditChange}
                          className={errors.bankName ? 'form-input error' : 'form-input'}
                        />
                        {errors.bankName && <span className="error-message">{errors.bankName}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label ">Bank Account Number</label>
                        <input
                          type="text"
                          name="bankAccountNumber"
                          value={editModal.supplier.bankAccountNumber || ''}
                          onChange={handleEditChange}
                          className={errors.bankAccountNumber ? 'form-input error' : 'form-input'}
                        />
                        {errors.bankAccountNumber && <span className="error-message">{errors.bankAccountNumber}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label ">Bank SWIFT/BIC Code</label>
                        <input
                          type="text"
                          name="bankSwiftCode"
                          value={editModal.supplier.bankSwiftCode || ''}
                          onChange={handleEditChange}
                          className={errors.bankSwiftCode ? 'form-input error' : 'form-input'}
                        />
                        {errors.bankSwiftCode && <span className="error-message">{errors.bankSwiftCode}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label ">Payment Terms</label>
                        <input
                          type="text"
                          name="paymentTerms"
                          value={editModal.supplier.paymentTerms || ''}
                          onChange={handleEditChange}
                          className={errors.paymentTerms ? 'form-input error' : 'form-input'}
                        />
                        {errors.paymentTerms && <span className="error-message">{errors.paymentTerms}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label ">Tax ID</label>
                        <input
                          type="text"
                          name="taxId"
                          value={editModal.supplier.taxId || ''}
                          onChange={handleEditChange}
                          className={errors.taxId ? 'form-input error' : 'form-input'}
                        />
                        {errors.taxId && <span className="error-message">{errors.taxId}</span>}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="form-section">
                <h3 className="section-title">Additional Information</h3>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="form-label">Special Remarks</label>
                    <textarea
                      name="specialRemarks"
                      value={editModal.supplier.specialRemarks || ''}
                      onChange={handleEditChange}
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label ">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        checked={editModal.supplier.acceptTerms || false}
                        onChange={handleEditChange}
                        className={errors.acceptTerms ? 'form-checkbox error' : 'form-checkbox'}
                      />
                      Accept Terms & Conditions
                    </label>
                    {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      value={editModal.supplier.status}
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

export default SupplierEditModal;
// import React, { useState } from 'react';
// import LocationSelector from '../components/LocationSelector';

// const AgencyAdd = ({ setAgencies, agencies, setActiveTab }) => {
//   const [formData, setFormData] = useState({
//     agencyName: '',
//     country: '',
//     city: '',
//     postCode: '',
//     address: '',
//     website: '',
//     phoneNo: '',
//     emailId: '',
//     businessCurrency: 'USD',
//     title: '',
//     firstName: '',
//     lastName: '',
//     userEmailId: '',
//     designation: '',
//     mobileNo: '',
//     userName: '',
//     password: '',
//     confirmPassword: '',
//     acceptTerms: false
//   });

//   const [errors, setErrors] = useState({});
//   const [passwordStrength, setPasswordStrength] = useState('');
//   const [showNotification, setShowNotification] = useState('');

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData({
//       ...formData,
//       [name]: type === 'checkbox' ? checked : value
//     });

//     if (errors[name]) {
//       setErrors({
//         ...errors,
//         [name]: ''
//       });
//     }

//     if (name === 'password') {
//       checkPasswordStrength(value);
//     }
//   };

//   const checkPasswordStrength = (password) => {
//     let strength = '';
//     if (password.length === 0) {
//       strength = '';
//     } else if (password.length < 8) {
//       strength = 'Weak (min 8 characters)';
//     } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
//       strength = 'Medium (add uppercase, lowercase, and numbers)';
//     } else {
//       strength = 'Strong';
//     }
//     setPasswordStrength(strength);
//   };

//   const handleLocationChange = (field, value) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));

//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   };

//   const validateEmail = (email) => {
//     const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//     return re.test(String(email).toLowerCase());
//   };

//   const validateEmails = (emails) => {
//     if (!emails) return true;
//     const emailList = emails.split(',');
//     for (let email of emailList) {
//       if (email.trim() && !validateEmail(email.trim())) {
//         return false;
//       }
//     }
//     return true;
//   };

//   const validatePhone = (phone) => {
//     const re = /^[+]?[0-9]{8,15}$/;
//     return re.test(phone);
//   };

//   const validateForm = () => {
//     let formErrors = {};

//     // Agency Details validation
//     if (!formData.agencyName) formErrors.agencyName = 'Agency name is required';
//     if (!formData.country) formErrors.country = 'Country is required';
//     if (!formData.city) formErrors.city = 'City is required';
//     if (!formData.postCode) formErrors.postCode = 'Post code is required';
//     if (!formData.address) formErrors.address = 'Address is required';
//     if (!formData.phoneNo) {
//       formErrors.phoneNo = 'Phone number is required';
//     } else if (!validatePhone(formData.phoneNo)) {
//       formErrors.phoneNo = 'Please enter a valid phone number';
//     }
    
//     if (formData.emailId && !validateEmails(formData.emailId)) {
//       formErrors.emailId = 'Please enter valid email addresses separated by commas';
//     }

//     // Main User Details validation
//     if (!formData.firstName) formErrors.firstName = 'First name is required';
//     if (!formData.lastName) formErrors.lastName = 'Last name is required';
    
//     if (!formData.userEmailId) {
//       formErrors.userEmailId = 'Email is required';
//     } else if (!validateEmail(formData.userEmailId)) {
//       formErrors.userEmailId = 'Please enter a valid email address';
//     }
    
//     if (!formData.designation) formErrors.designation = 'Designation is required';
    
//     if (!formData.mobileNo) {
//       formErrors.mobileNo = 'Mobile number is required';
//     } else if (!validatePhone(formData.mobileNo)) {
//       formErrors.mobileNo = 'Please enter a valid mobile number';
//     }
    
//     if (!formData.userName) formErrors.userName = 'Username is required';
    
//     if (!formData.password) {
//       formErrors.password = 'Password is required';
//     } else if (formData.password.length < 8) {
//       formErrors.password = 'Password must be at least 8 characters';
//     } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(formData.password)) {
//       formErrors.password = 'Password must contain uppercase, lowercase, and numbers';
//     }
    
//     if (formData.password !== formData.confirmPassword) {
//       formErrors.confirmPassword = 'Passwords do not match';
//     }
    
//     if (!formData.acceptTerms) formErrors.acceptTerms = 'You must accept the terms and conditions';

//     setErrors(formErrors);
//     return Object.keys(formErrors).length === 0;
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     if (validateForm()) {
//       const newAgency = {
//         id: Date.now(),
//         agencyName: formData.agencyName,
//         country: formData.country,
//         city: formData.city,
//         postCode: formData.postCode,
//         address: formData.address,
//         website: formData.website,
//         phoneNo: formData.phoneNo,
//         emailId: formData.emailId,
//         businessCurrency: formData.businessCurrency,
//         title: formData.title,
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         userEmailId: formData.userEmailId,
//         designation: formData.designation,
//         mobileNo: formData.mobileNo,
//         userName: formData.userName,
//         createdAt: new Date().toLocaleDateString(),
//         status: 'Active'
//       };
      
//       setAgencies([...agencies, newAgency]);
      
//       // Reset form
//       setFormData({
//         agencyName: '',
//         country: '',
//         city: '',
//         postCode: '',
//         address: '',
//         website: '',
//         phoneNo: '',
//         emailId: '',
//         businessCurrency: 'USD',
//         title: '',
//         firstName: '',
//         lastName: '',
//         userEmailId: '',
//         designation: '',
//         mobileNo: '',
//         userName: '',
//         password: '',
//         confirmPassword: '',
//         acceptTerms: false
//       });
      
//       setPasswordStrength('');
//       alert('Agency registered successfully!');
//       setActiveTab('view');
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="agency-form">
//       {/* Agency Details Section */}
//       <div className="form-section">
//         <h2 className="section-title">Agency Details</h2>
        
//         <div className="form-row">
//           <div className="form-group">
//             <label htmlFor="agencyName" className="form-label required">Agency Name</label>
//             <input
//               type="text"
//               id="agencyName"
//               name="agencyName"
//               value={formData.agencyName}
//               onChange={handleChange}
//               className={errors.agencyName ? 'form-input error' : 'form-input'}
//               placeholder="Enter agency name"
//             />
//             {errors.agencyName && <span className="error-message">{errors.agencyName}</span>}
//           </div>
          
//           <div className="form-group">
//             <LocationSelector
//               countryId={formData.countryId}
//               cityId={formData.cityId}
//               onCountrySelect={(code, name, id) => handleLocationChange("country", { code, name, id })}
//               onCitySelect={(name, id) => handleLocationChange("city", { name, id })}
//               onHotelSelect={(hotel) => handleLocationChange("hotel", hotel)}
//               showNotification={showNotification}
//             />
//           </div>
        
//           <div className="form-group">
//             <label htmlFor="postCode" className="form-label required">Post Code</label>
//             <input
//               type="text"
//               id="postCode"
//               name="postCode"
//               value={formData.postCode}
//               onChange={handleChange}
//               className={errors.postCode ? 'form-input error' : 'form-input'}
//               placeholder="Enter post code"
//             />
//             {errors.postCode && <span className="error-message">{errors.postCode}</span>}
//           </div>
//         </div>
        
//         <div className="form-row">
//           <div className="form-group full-width">
//             <label htmlFor="address" className="form-label required">Address</label>
//             <input
//               type="text"
//               id="address"
//               name="address"
//               value={formData.address}
//               onChange={handleChange}
//               className={errors.address ? 'form-input error' : 'form-input'}
//               placeholder="Enter full address"
//             />
//             {errors.address && <span className="error-message">{errors.address}</span>}
//           </div>
//         </div>
        
//         <div className="form-row">
//           <div className="form-group">
//             <label htmlFor="website" className="form-label">Website</label>
//             <input
//               type="url"
//               id="website"
//               name="website"
//               value={formData.website}
//               onChange={handleChange}
//               className="form-input"
//               placeholder="https://example.com"
//             />
//           </div>
          
//           <div className="form-group">
//             <label htmlFor="phoneNo" className="form-label required">Phone No</label>
//             <input
//               type="tel"
//               id="phoneNo"
//               name="phoneNo"
//               value={formData.phoneNo}
//               onChange={handleChange}
//               className={errors.phoneNo ? 'form-input error' : 'form-input'}
//               placeholder="Enter phone number"
//             />
//             {errors.phoneNo && <span className="error-message">{errors.phoneNo}</span>}
//           </div>
//         </div>
        
//         <div className="form-row">
//           <div className="form-group">
//             <label htmlFor="emailId" className="form-label">Email ID</label>
//             <input
//               type="text"
//               id="emailId"
//               name="emailId"
//               value={formData.emailId}
//               onChange={handleChange}
//               className={errors.emailId ? 'form-input error' : 'form-input'}
//               placeholder="email@example.com, email2@example.com"
//             />
//             {errors.emailId && <span className="error-message">{errors.emailId}</span>}
//             <div className="input-hint">(Please use ' , ' for multiple Email IDs)</div>
//           </div>
          
//           <div className="form-group">
//             <label htmlFor="businessCurrency" className="form-label required">Business Currency</label>
//             <select
//               id="businessCurrency"
//               name="businessCurrency"
//               value={formData.businessCurrency}
//               onChange={handleChange}
//               className="form-select"
//             >
//               <option value="USD">USD</option>
//               <option value="EUR">EUR</option>
//               <option value="GBP">GBP</option>
//               <option value="CAD">CAD</option>
//               <option value="AUD">AUD</option>
//             </select>
//           </div>
//         </div>
//       </div>
      
//       {/* Main User Details Section */}
//       <div className="form-section">
//         <h2 className="section-title">Main User Details</h2>
        
//         <div className="form-row">
//           <div className="form-group">
//             <label htmlFor="title" className="form-label">Title</label>
//             <select
//               id="title"
//               name="title"
//               value={formData.title}
//               onChange={handleChange}
//               className="form-select"
//             >
//               <option value="">Select Title</option>
//               <option value="Mr">Mr</option>
//               <option value="Mrs">Mrs</option>
//               <option value="Ms">Ms</option>
//               <option value="Dr">Dr</option>
//             </select>
//           </div>
          
//           <div className="form-group">
//             <label htmlFor="firstName" className="form-label required">First Name</label>
//             <input
//               type="text"
//               id="firstName"
//               name="firstName"
//               value={formData.firstName}
//               onChange={handleChange}
//               className={errors.firstName ? 'form-input error' : 'form-input'}
//               placeholder="Enter first name"
//             />
//             {errors.firstName && <span className="error-message">{errors.firstName}</span>}
//           </div>
//         </div>
        
//         <div className="form-row">
//           <div className="form-group">
//             <label htmlFor="lastName" className="form-label required">Last Name</label>
//             <input
//               type="text"
//               id="lastName"
//               name="lastName"
//               value={formData.lastName}
//               onChange={handleChange}
//               className={errors.lastName ? 'form-input error' : 'form-input'}
//               placeholder="Enter last name"
//             />
//             {errors.lastName && <span className="error-message">{errors.lastName}</span>}
//           </div>
          
//           <div className="form-group">
//             <label htmlFor="userEmailId" className="form-label required">Email ID</label>
//             <input
//               type="email"
//               id="userEmailId"
//               name="userEmailId"
//               value={formData.userEmailId}
//               onChange={handleChange}
//               className={errors.userEmailId ? 'form-input error' : 'form-input'}
//               placeholder="email@example.com"
//             />
//             {errors.userEmailId && <span className="error-message">{errors.userEmailId}</span>}
//           </div>
//         </div>
        
//         <div className="form-row">
//           <div className="form-group">
//             <label htmlFor="designation" className="form-label required">Designation</label>
//             <input
//               type="text"
//               id="designation"
//               name="designation"
//               value={formData.designation}
//               onChange={handleChange}
//               className={errors.designation ? 'form-input error' : 'form-input'}
//               placeholder="Enter designation"
//             />
//             {errors.designation && <span className="error-message">{errors.designation}</span>}
//           </div>
          
//           <div className="form-group">
//             <label htmlFor="mobileNo" className="form-label required">Mobile No</label>
//             <input
//               type="tel"
//               id="mobileNo"
//               name="mobileNo"
//               value={formData.mobileNo}
//               onChange={handleChange}
//               className={errors.mobileNo ? 'form-input error' : 'form-input'}
//               placeholder="Enter mobile number"
//             />
//             {errors.mobileNo && <span className="error-message">{errors.mobileNo}</span>}
//           </div>
//         </div>
        
//         <div className="form-row">
//           <div className="form-group">
//             <label htmlFor="userName" className="form-label required">User Name</label>
//             <input
//               type="text"
//               id="userName"
//               name="userName"
//               value={formData.userName}
//               onChange={handleChange}
//               className={errors.userName ? 'form-input error' : 'form-input'}
//               placeholder="Enter username"
//             />
//             {errors.userName && <span className="error-message">{errors.userName}</span>}
//           </div>
//         </div>
        
//         <div className="form-row">
//           <div className="form-group">
//             <label htmlFor="password" className="form-label required">Password</label>
//             <input
//               type="password"
//               id="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               className={errors.password ? 'form-input error' : 'form-input'}
//               placeholder="Create a strong password"
//             />
//             {errors.password && <span className="error-message">{errors.password}</span>}
//             {passwordStrength && (
//               <div className={`password-strength ${passwordStrength.includes('Weak') ? 'weak' : passwordStrength.includes('Medium') ? 'medium' : 'strong'}`}>
//                 Password strength: {passwordStrength}
//               </div>
//             )}
//           </div>
          
//           <div className="form-group">
//             <label htmlFor="confirmPassword" className="form-label required">Confirm Password</label>
//             <input
//               type="password"
//               id="confirmPassword"
//               name="confirmPassword"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               className={errors.confirmPassword ? 'form-input error' : 'form-input'}
//               placeholder="Confirm your password"
//             />
//             {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
//           </div>
//         </div>
        
//         <div className="form-row">
//           <div className="form-group full-width">
//             <div className="terms-container">
//               <input
//                 type="checkbox"
//                 id="acceptTerms"
//                 name="acceptTerms"
//                 checked={formData.acceptTerms}
//                 onChange={handleChange}
//                 className="terms-checkbox"
//               />
//               <label htmlFor="acceptTerms" className="terms-text">
//                 I Accept <a href="#terms" className="terms-link">Terms and Conditions</a>
//               </label>
//             </div>
//             {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}
//           </div>
//         </div>
//       </div>
      
//       <div className="form-actions">
//         <button type="submit" className="submit-button">Register Agency</button>
//       </div>
//     </form>
//   );
// };

// export default AgencyAdd;
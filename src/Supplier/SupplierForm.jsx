// import React, { useState } from "react";
// import SupplierDetailsForm from "./steps/SupplierDetailsForm";
// import UserDetailsForm from "./steps/UserDetailsForm";
// import PaymentDetailsForm from "./steps/PaymentDetailsForm";
// import supplierApi from "../api/supplierApi";

// const SupplierForm = ({ onSaved, onCancel }) => {
//   const [formData, setFormData] = useState({
//     // Supplier info
//     supplierName: "",
//     countryId: "",
//     cityId: "",
//     postCode: "",
//     address: "",
//     region: "",
//     website: "",
//     contactPhone: "",
//     contactEmail: "",
//     businessCurrency: "",
//     supplierCategoryId: "",
//     supplierSubCategoryId: "",

//     // User info
//     title: "",
//     firstName: "",
//     lastName: "",
//     designation: "",
//     mobileNo: "",
//     userEmailId: "",
//     userName: "",
//     password: "",
//     confirmPassword: "",

//     // Payment info
//     enablePaymentDetails: false,
//     bankName: "",
//     bankAccountNumber: "",
//     bankSwiftCode: "",
//     paymentTerms: "",
//     taxId: "",

//     // Status
//     acceptTerms: false,
//     specialRemarks: ""
//   });

//   const [errors, setErrors] = useState({});
//   const [currentStep, setCurrentStep] = useState(1);
//   const [saving, setSaving] = useState(false);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData({
//       ...formData,
//       [name]: type === "checkbox" ? checked : value,
//     });
    
//     // Clear error when user starts typing
//     if (errors[name]) {
//       setErrors(prev => ({
//         ...prev,
//         [name]: ""
//       }));
//     }
//   };

//   const validateStep = (step) => {
//     const newErrors = {};
    
//     if (step === 1) {
//       if (!formData.supplierName.trim()) newErrors.supplierName = "Supplier name is required";
//       if (!formData.supplierCategoryId) newErrors.supplierCategoryId = "Category is required";
//       if (!formData.supplierSubCategoryId) newErrors.supplierSubCategoryId = "Subcategory is required";
//     }
    
//     if (step === 2) {
//       if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
//       if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
//       if (!formData.userEmailId.trim()) newErrors.userEmailId = "Email is required";
//       if (!formData.userName.trim()) newErrors.userName = "Username is required";
//       if (!formData.password) newErrors.password = "Password is required";
//       if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleNext = () => {
//     if (validateStep(currentStep)) {
//       setCurrentStep(currentStep + 1);
//     }
//   };

//   const handleBack = () => {
//     setCurrentStep(currentStep - 1);
//   };

//  const handleSubmit = async () => {
//   if (!validateStep(3)) return;

//   setSaving(true);

//   try {
//     const payload = {
//       ...formData,
//       supplierCategoryId: formData.supplierCategoryId?.id || formData.supplierCategoryId,
//       supplierSubCategoryId: formData.supplierSubCategoryId?.id || formData.supplierSubCategoryId,
//     };

//     console.log("Submitting supplier:", payload);

//     await supplierApi.createSupplier(payload);
//     onSaved();
//   } catch (error) {
//     console.error("Error saving supplier:", error);
//     alert(error.response?.data?.message || "Failed to save supplier");
//   } finally {
//     setSaving(false);
//   }
// };


//   const renderProgressSteps = () => (
//     <div className="form-progress">
//       <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
//         <div className="step-icon">
//           {currentStep > 1 ? '✓' : '1'}
//         </div>
//         <span className="step-label">Supplier Details</span>
//       </div>
      
//       <div className="step-connector"></div>
      
//       <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
//         <div className="step-icon">
//           {currentStep > 2 ? '✓' : '2'}
//         </div>
//         <span className="step-label">User Details</span>
//       </div>
      
//       <div className="step-connector"></div>
      
//       <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
//         <div className="step-icon">3</div>
//         <span className="step-label">Payment & Final</span>
//       </div>
//     </div>
//   );

//   return (
//     <div className="supplier-form-container">
//       <div className="supplier-form">
//         {renderProgressSteps()}
        
//         {currentStep === 1 && (
//           <SupplierDetailsForm
//             formData={formData}
//             setFormData={setFormData}
//             errors={errors}
//             setErrors={setErrors}
//             setCurrentStep={setCurrentStep}
//             handleChange={handleChange}
//             onNext={handleNext}
//           />
//         )}

//         {currentStep === 2 && (
//           <UserDetailsForm
//             formData={formData}
//             setFormData={setFormData}
//             errors={errors}
//             setErrors={setErrors}
//             setCurrentStep={setCurrentStep}
//             handleChange={handleChange}
//             onNext={handleNext}
//             onBack={handleBack}
//           />
//         )}

//         {currentStep === 3 && (
//           <PaymentDetailsForm
//             formData={formData}
//             setFormData={setFormData}
//             errors={errors}
//             setErrors={setErrors}
//             setCurrentStep={setCurrentStep}
//             handleChange={handleChange}
//             onSubmit={handleSubmit}
//             saving={saving}
//             onBack={handleBack}
//           />
//         )}

//         <div className="form-actions cancel-section">
//           <button 
//             onClick={onCancel} 
//             disabled={saving}
//             className="secondary-button cancel-button"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SupplierForm;
import React, { useState } from "react";
import SupplierDetailsForm from "./steps/SupplierDetailsForm";
import UserDetailsForm from "./steps/UserDetailsForm";
import PaymentDetailsForm from "./steps/PaymentDetailsForm";
import supplierApi from "../api/supplierApi";

const SupplierForm = ({ onSaved, onCancel }) => {
  const [formData, setFormData] = useState({
    // Supplier info
    supplierName: "",
    countryId: "",
    cityId: "",
    postCode: "",
    address: "",
    region: "",
    website: "",
    phoneNo: "",
    emailId: "",
    businessCurrency: "",
    supplierCategoryId: "",
    supplierSubCategoryId: "",

    // User info
    title: "",
    firstName: "",
    lastName: "",
    designation: "",
    mobileNo: "",
    userEmailId: "",
    userName: "",
    password: "",
    confirmPassword: "",

    // Payment info
    enablePaymentDetails: false,
    bankName: "",
    bankAccountNumber: "",
    bankSwiftCode: "",
    paymentTerms: "",
    taxId: "",

    // Status
    acceptTerms: false,
    specialRemarks: ""
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.supplierName.trim()) newErrors.supplierName = "Supplier name is required";
      if (!formData.supplierCategoryId) newErrors.supplierCategoryId = "Category is required";
      if (!formData.supplierSubCategoryId) newErrors.supplierSubCategoryId = "Subcategory is required";
    }
    
    if (step === 2) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.userEmailId.trim()) newErrors.userEmailId = "Email is required";
      if (!formData.userName.trim()) newErrors.userName = "Username is required";
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

const handleSubmit = async () => {
  if (!validateStep(3)) return;

  setSaving(true);

  try {
    const payload = {
      SupplierName: formData.supplierName,
      CountryId: formData.countryId ? parseInt(formData.countryId) : null,
      CityId: formData.cityId ? parseInt(formData.cityId) : null,
      PostCode: formData.postCode,
      Address: formData.address,
      Region: formData.region,
      Website: formData.website,
      SupplierCategoryId: parseInt(formData.supplierCategoryId),
      SupplierSubCategoryId: parseInt(formData.supplierSubCategoryId),
      PhoneNo: formData.phoneNo,
      EmailId: formData.emailId,
      BusinessCurrency: formData.businessCurrency,
      Title: formData.title,
      FirstName: formData.firstName,
      LastName: formData.lastName,
      UserEmailId: formData.userEmailId,
      Designation: formData.designation,
      MobileNo: formData.mobileNo,
      UserName: formData.userName,
      Password: formData.password,
      AcceptTerms: formData.acceptTerms,
      SpecialRemarks: formData.specialRemarks,
      EnablePaymentDetails: formData.enablePaymentDetails,
      BankName: formData.bankName,
      BankAccountNumber: formData.bankAccountNumber,
      PaymentTerms: formData.paymentTerms,
    };

    console.log("Submitting supplier:", payload);

    await supplierApi.createSupplier(payload);
    alert("Supplier saved successfully!");
    onSaved();
  } catch (error) {
    console.error("Error saving supplier:", error);
    alert(error.response?.data?.message || "Failed to save supplier");
  } finally {
    setSaving(false);
  }
};




  const renderProgressSteps = () => (
    <div className="form-progress">
      <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
        <div className="step-icon">
          {currentStep > 1 ? '✓' : '1'}
        </div>
        <span className="step-label">Supplier Details</span>
      </div>
      
      <div className="step-connector"></div>
      
      <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
        <div className="step-icon">
          {currentStep > 2 ? '✓' : '2'}
        </div>
        <span className="step-label">User Details</span>
      </div>
      
      <div className="step-connector"></div>
      
      <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-icon">3</div>
        <span className="step-label">Payment & Final</span>
      </div>
    </div>
  );

  return (
    <div className="supplier-form-container">
      <div className="supplier-form">
        {renderProgressSteps()}
        
        {currentStep === 1 && (
          <SupplierDetailsForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            setCurrentStep={setCurrentStep}
            handleChange={handleChange}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <UserDetailsForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            setCurrentStep={setCurrentStep}
            handleChange={handleChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <PaymentDetailsForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            setCurrentStep={setCurrentStep}
            handleChange={handleChange}
            onSubmit={handleSubmit}
            saving={saving}
            onBack={handleBack}
          />
        )}

        <div className="form-actions cancel-section">
          <button 
            onClick={onCancel} 
            disabled={saving}
            className="secondary-button cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierForm;
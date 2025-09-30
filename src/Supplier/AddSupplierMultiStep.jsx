import React, { useState } from "react";
import SupplierDetailsForm from "./SupplierDetailsForm";
import SupplierUserDetailsForm from "./SupplierUserDetailsForm";

const AddSupplierMultiStep = ({ onSaved, onCancel }) => {
  const [currentPage, setCurrentPage] = useState("details");
  const [formData, setFormData] = useState({
    supplierName: "",
    emailId: "",
    countryId: null,
    cityId: null,
    supplierCategoryId: null,
    supplierSubCategoryId: null,
    paymentEnabled: false,
    paymentMethod: "",
    accountNumber: "",
    bankName: "",
    title: "",
    firstName: "",
    lastName: "",
    userEmailId: "",
    designation: "",
    mobileNo: "",
    userName: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const handleSaved = () => {
    if (onSaved) onSaved();
  };

  return (
    <>
      {currentPage === "details" && (
        <SupplierDetailsForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          handleChange={(e) =>
            setFormData({ ...formData, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value })
          }
          setCurrentPage={setCurrentPage}
        />
      )}

      {currentPage === "user" && (
        <SupplierUserDetailsForm
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          setCurrentPage={setCurrentPage}
          onSaved={handleSaved}
        />
      )}

      <button onClick={handleCancel}>Cancel</button>
    </>
  );
};

export default AddSupplierMultiStep;

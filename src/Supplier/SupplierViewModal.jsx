import React from "react";
import "./SupplierViewModal.css";

const SupplierViewModal = ({ supplier, onClose }) => {
  if (!supplier) return null;

  console.log("Supplier data in modal:", supplier);

  return (
    <div className="svm-modal-overlay">
      <div className="svm-modal-content">
        <div className="svm-modal-header">
          <h2>Supplier Details</h2>
          <button className="svm-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="svm-modal-body">
          {/* Left Column */}
          <div className="svm-column svm-column-left">
            {/* Basic Information */}
            <div className="svm-detail-section">
              <h3>Basic Information</h3>
              <div className="svm-detail-grid">
                <div className="svm-detail-item">
                  <strong>Name:</strong> 
                  <span>{supplier.supplierName || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>First Name:</strong> 
                  <span>{supplier.firstName || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>Last Name:</strong> 
                  <span>{supplier.lastName || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="svm-detail-section">
              <h3>Contact Information</h3>
              <div className="svm-detail-grid">
                <div className="svm-detail-item">
                  <strong>Email:</strong> 
                  <span>{supplier.emailId || supplier.UserEmailId || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>Phone:</strong> 
                  <span>{supplier.phoneNo || supplier.MobileNo || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>User Name:</strong> 
                  <span>{supplier.userName || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Category Information */}
            <div className="svm-detail-section">
              <h3>Category Information</h3>
              <div className="svm-detail-grid">
                <div className="svm-detail-item">
                  <strong>Category:</strong> 
                  <span>{supplier.supplierCategoryName || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>SubCategory:</strong> 
                  <span>{supplier.supplierSubCategoryName || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>Business Currency:</strong> 
                  <span>{supplier.businessCurrency || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="svm-column svm-column-right">
            {/* Address Information */}
            <div className="svm-detail-section">
              <h3>Address</h3>
              <div className="svm-detail-grid">
                <div className="svm-detail-item">
                  <strong>Country:</strong> 
                  <span>{supplier.countryName || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>City:</strong> 
                  <span>{supplier.cityName || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>Region:</strong> 
                  <span>{supplier.region || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>Post Code:</strong> 
                  <span>{supplier.postCode || "N/A"}</span>
                </div>
                <div className="svm-detail-item">
                  <strong>Address:</strong> 
                  <span>{supplier.address || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {supplier.EnablePaymentDetails && (
              <div className="svm-detail-section">
                <h3>Payment Information</h3>
                <div className="svm-detail-grid">
                  <div className="svm-detail-item">
                    <strong>Bank Name:</strong> 
                    <span>{supplier.BankName || "N/A"}</span>
                  </div>
                  <div className="svm-detail-item">
                    <strong>Account Number:</strong> 
                    <span>{supplier.BankAccountNumber || "N/A"}</span>
                  </div>
                  <div className="svm-detail-item">
                    <strong>Payment Terms:</strong> 
                    <span>{supplier.PaymentTerms || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="svm-detail-section">
              <h3>Status</h3>
              <div className="svm-detail-grid">
                <div className="svm-detail-item">
                  <strong>Status:</strong> 
                  <span className={`svm-status-badge ${supplier.isActive ? "svm-active" : "svm-inactive"}`}>
                    {supplier.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="svm-detail-item">
                  <strong>Special Remarks:</strong> 
                  <span>{supplier.specialRemarks || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="svm-modal-footer">
          <button onClick={onClose} className="svm-close-button">Close</button>
        </div>
      </div>
    </div>
  );
};

export default SupplierViewModal;
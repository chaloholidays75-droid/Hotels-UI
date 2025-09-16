import React from 'react';

const AgencyViewModal = ({ viewModal, closeViewModal }) => {
  return (
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
                  <span className="detail-value">{viewModal.agency.address}, {viewModal.agency.city?.name || ''}, {viewModal.agency.country?.name || ''} {viewModal.agency.postCode}</span>
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
                  <span className={`detail-value status ${viewModal.agency.status?.toLowerCase() || ''}`}>
                    {viewModal.agency.status || 'N/A'}
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
  );
};

export default AgencyViewModal;
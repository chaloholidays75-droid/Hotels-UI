import React from 'react';
import {
  FaMapMarkerAlt, FaEnvelope, FaPhone, FaUserTie,
  FaClipboardList, FaMoneyCheckAlt, FaReceipt, FaConciergeBell, FaInfoCircle,
  FaTimes
} from 'react-icons/fa';

const ViewHotelModal = ({ hotel, onClose }) => {
  if (!hotel) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="hotel-title-section">
            <h2>{hotel.hotelName}</h2>
            {hotel.hotelChain && (
              <div className="hotel-chain-badge">{hotel.hotelChain}</div>
            )}
            <div className="hotel-location">
              <FaMapMarkerAlt />
              <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Basic Information Section */}
          <div className="form-section">
            <div className="section-header">
              <h3><FaInfoCircle /> Basic Information</h3>
              <p>Contact details for the hotel</p>
            </div>
            <div className="form-grid">
              {hotel.hotelContactNumber && (
                <div className="form-group">
                  <label>Contact Number</label>
                  <div className="view-field">
                    <FaPhone className="field-icon" />
                    <span>{hotel.hotelContactNumber}</span>
                  </div>
                </div>
              )}
              {hotel.hotelEmail && (
                <div className="form-group">
                  <label>Hotel Email</label>
                  <div className="view-field">
                    <FaEnvelope className="field-icon" />
                    <span>{hotel.hotelEmail}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Persons Section */}
          <div className="form-section">
            <div className="section-header">
              <h3><FaUserTie /> Contact Persons</h3>
              <p>Key contacts at the hotel</p>
            </div>
            
            <div className="contact-grid">
              {hotel.salesPersons && hotel.salesPersons.length > 0 && (
                <div className="contact-category">
                  <h4 className="category-title">
                    <FaUserTie /> Sales Persons
                  </h4>
                  {hotel.salesPersons.map((p, idx) => (
                    <div key={idx} className="contact-person">
                      <div className="contact-name">{p.name}</div>
                      {p.email && (
                        <div className="contact-info">
                          <FaEnvelope className="info-icon" />
                          <span>{p.email}</span>
                        </div>
                      )}
                      {p.contact && (
                        <div className="contact-info">
                          <FaPhone className="info-icon" />
                          <span>{p.contact}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {hotel.reservationPersons && hotel.reservationPersons.length > 0 && (
                <div className="contact-category">
                  <h4 className="category-title">
                    <FaClipboardList /> Reservation Persons
                  </h4>
                  {hotel.reservationPersons.map((p, idx) => (
                    <div key={idx} className="contact-person">
                      <div className="contact-name">{p.name}</div>
                      {p.email && (
                        <div className="contact-info">
                          <FaEnvelope className="info-icon" />
                          <span>{p.email}</span>
                        </div>
                      )}
                      {p.contact && (
                        <div className="contact-info">
                          <FaPhone className="info-icon" />
                          <span>{p.contact}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {hotel.accountsPersons && hotel.accountsPersons.length > 0 && (
                <div className="contact-category">
                  <h4 className="category-title">
                    <FaMoneyCheckAlt /> Accounts Persons
                  </h4>
                  {hotel.accountsPersons.map((p, idx) => (
                    <div key={idx} className="contact-person">
                      <div className="contact-name">{p.name}</div>
                      {p.email && (
                        <div className="contact-info">
                          <FaEnvelope className="info-icon" />
                          <span>{p.email}</span>
                        </div>
                      )}
                      {p.contact && (
                        <div className="contact-info">
                          <FaPhone className="info-icon" />
                          <span>{p.contact}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {hotel.receptionPersons && hotel.receptionPersons.length > 0 && (
                <div className="contact-category">
                  <h4 className="category-title">
                    <FaReceipt /> Reception Persons
                  </h4>
                  {hotel.receptionPersons.map((p, idx) => (
                    <div key={idx} className="contact-person">
                      <div className="contact-name">{p.name}</div>
                      {p.email && (
                        <div className="contact-info">
                          <FaEnvelope className="info-icon" />
                          <span>{p.email}</span>
                        </div>
                      )}
                      {p.contact && (
                        <div className="contact-info">
                          <FaPhone className="info-icon" />
                          <span>{p.contact}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {hotel.concierges && hotel.concierges.length > 0 && (
                <div className="contact-category">
                  <h4 className="category-title">
                    <FaConciergeBell /> Concierges
                  </h4>
                  {hotel.concierges.map((p, idx) => (
                    <div key={idx} className="contact-person">
                      <div className="contact-name">{p.name}</div>
                      {p.email && (
                        <div className="contact-info">
                          <FaEnvelope className="info-icon" />
                          <span>{p.email}</span>
                        </div>
                      )}
                      {p.contact && (
                        <div className="contact-info">
                          <FaPhone className="info-icon" />
                          <span>{p.contact}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Special Remarks Section */}
          {hotel.specialRemarks && (
            <div className="form-section">
              <div className="section-header">
                <h3><FaInfoCircle /> Special Remarks</h3>
                <p>Additional information about the hotel</p>
              </div>
              <div className="remarks-content">{hotel.specialRemarks || ''}</div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #eaeaea;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .hotel-title-section h2 {
          margin: 0 0 10px 0;
          font-size: 1.5rem;
          color: #333;
        }
        
        .hotel-chain-badge {
          display: inline-block;
          background-color: #e9f5ff;
          color: #3182ce;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          margin-bottom: 15px;
        }
        
        .hotel-location {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 0.95rem;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #999;
          padding: 5px;
          border-radius: 4px;
        }
        
        .modal-close:hover {
          color: #666;
          background: #f5f5f5;
        }
        
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        
        .form-section {
          margin-bottom: 30px;
        }
        
        .section-header {
          margin-bottom: 20px;
        }
        
        .section-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 5px 0;
          font-size: 1.2rem;
          color: #333;
        }
        
        .section-header p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #444;
        }
        
        .view-field {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #f9f9f9;
          border-radius: 6px;
          min-height: 42px;
        }
        
        .field-icon {
          color: #718096;
          font-size: 14px;
        }
        
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .contact-category {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
        }
        
        .category-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 600;
          color: #4a5568;
          margin: 0 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #eaeaea;
        }
        
        .contact-person {
          background: white;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .contact-name {
          font-size: 0.95rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 8px;
        }
        
        .contact-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #718096;
          margin-bottom: 5px;
        }
        
        .info-icon {
          font-size: 12px;
          color: #718096;
        }
        
        .remarks-content {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          font-size: 0.95rem;
          line-height: 1.5;
          color: #4a5568;
        }
        
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 10px;
          }
          
          .modal-content {
            max-height: 95vh;
          }
          
          .contact-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ViewHotelModal;
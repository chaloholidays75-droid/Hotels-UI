import React from 'react';
import {
  FaMapMarkerAlt, FaEnvelope, FaPhone, FaUserTie,
  FaClipboardList, FaMoneyCheckAlt, FaReceipt, FaConciergeBell, FaInfoCircle
} from 'react-icons/fa';

const ViewHotelModal = ({ hotel, onClose }) => {
  if (!hotel) return null;

  return (
    <div className="hotel-details-modal">
      <div className="modal-section">
        <div className="hotel-basic-info">
          <h3>{hotel.hotelName}</h3>
          {hotel.hotelChain && <div className="hotel-chain-badge">{hotel.hotelChain}</div>}
          <div className="hotel-location">
            <FaMapMarkerAlt /> 
            <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
          </div>
          <div className="detail-grid">
            {hotel.hotelContactNumber && (
              <div className="detail-item">
                <FaPhone /> 
                <div>
                  <div className="detail-label">Contact Number</div>
                  <div className="detail-value">{hotel.hotelContactNumber}</div>
                </div>
              </div>
            )}
            {hotel.hotelEmail && (
              <div className="detail-item">
                <FaEnvelope /> 
                <div>
                  <div className="detail-label">Hotel Email</div>
                  <div className="detail-value">{hotel.hotelEmail}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modal-section">
        <h4><FaUserTie /> Contact Persons</h4>
        
        <div className="contact-persons-grid">
          {hotel.salesPersons.length > 0 && (
            <div className="contact-category">
              <h5><FaUserTie /> Sales Persons</h5>
              {hotel.salesPersons.map((p, idx) => (
                <div key={idx} className="contact-person-details">
                  <div className="contact-name">{p.name}</div>
                  {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                  {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                </div>
              ))}
            </div>
          )}
          
          {hotel.reservationPersons.length > 0 && (
            <div className="contact-category">
              <h5><FaClipboardList /> Reservation Persons</h5>
              {hotel.reservationPersons.map((p, idx) => (
                <div key={idx} className="contact-person-details">
                  <div className="contact-name">{p.name}</div>
                  {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                  {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                </div>
              ))}
            </div>
          )}
          
          {hotel.accountsPersons.length > 0 && (
            <div className="contact-category">
              <h5><FaMoneyCheckAlt /> Accounts Persons</h5>
              {hotel.accountsPersons.map((p, idx) => (
                <div key={idx} className="contact-person-details">
                  <div className="contact-name">{p.name}</div>
                  {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                  {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                </div>
              ))}
            </div>
          )}
          
          {hotel.receptionPersons.length > 0 && (
            <div className="contact-category">
              <h5><FaReceipt /> Reception Persons</h5>
              {hotel.receptionPersons.map((p, idx) => (
                <div key={idx} className="contact-person-details">
                  <div className="contact-name">{p.name}</div>
                  {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                  {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                </div>
              ))}
            </div>
          )}
          
          {hotel.concierges.length > 0 && (
            <div className="contact-category">
              <h5><FaConciergeBell /> Concierges</h5>
              {hotel.concierges.map((p, idx) => (
                <div key={idx} className="contact-person-details">
                  <div className="contact-name">{p.name}</div>
                  {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                  {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {hotel.specialRemarks && (
        <div className="modal-section">
          <h4><FaInfoCircle /> Special Remarks</h4>
          <div className="remarks-content">{hotel.specialRemarks}</div>
        </div>
      )}
    </div>
  );
};

export default ViewHotelModal;
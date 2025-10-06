import React from "react";
import "./BookingViewModal.css";

const BookingViewModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'booking-view-status-confirmed';
      case 'Pending':
        return 'booking-view-status-pending';
      case 'Cancelled':
        return 'booking-view-status-cancelled';
      case 'Completed':
        return 'booking-view-status-completed';
      default:
        return 'booking-view-status-default';
    }
  };

  const parseChildrenAges = (agesString) => {
    if (!agesString) return [];
    return agesString.split(',').map(age => age.trim()).filter(age => age !== '');
  };

  const childrenAges = parseChildrenAges(booking.childrenAges);
  
  // Calculate total people if not already in booking data
  const totalPeople = booking.totalPeople || (booking.adults + booking.children);

  return (
    <div className="booking-view-modal-overlay">
      <div className="booking-view-modal-content">
        <div className="booking-view-modal-header">
          <div className="booking-view-modal-title-section">
            <h2 className="booking-view-modal-title">Booking Details</h2>
            <div className="booking-view-ticket-badge">
              <span className="booking-view-ticket-label">Ticket #</span>
              <span className="booking-view-ticket-number">{booking.ticketNumber}</span>
            </div>
          </div>
          <button 
            className="booking-view-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="booking-view-modal-body">
          <div className="booking-view-sections">
            {/* Basic Information Section */}
            <div className="booking-view-section">
              <h3 className="booking-view-section-title">
                <span className="booking-view-section-icon">📋</span>
                Basic Information
              </h3>
              <div className="booking-view-details-grid">
                <div className="booking-view-detail-item">
                  <div className="booking-view-detail-label">Agency</div>
                  <div className="booking-view-detail-value">{booking.agencyName}</div>
                </div>
                <div className="booking-view-detail-item">
                  <div className="booking-view-detail-label">Supplier</div>
                  <div className="booking-view-detail-value">{booking.supplierName}</div>
                </div>
                <div className="booking-view-detail-item">
                  <div className="booking-view-detail-label">Hotel</div>
                  <div className="booking-view-detail-value booking-view-hotel-name">{booking.hotelName}</div>
                </div>
                <div className="booking-view-detail-item">
                  <div className="booking-view-detail-label">Status</div>
                  <div className="booking-view-detail-value">
                    <span className={`booking-view-status-badge ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates & Duration Section */}
            <div className="booking-view-section">
              <h3 className="booking-view-section-title">
                <span className="booking-view-section-icon">📅</span>
                Dates & Duration
              </h3>
              <div className="booking-view-dates-container">
                <div className="booking-view-date-card">
                  <div className="booking-view-date-type">Check-In</div>
                  <div className="booking-view-date-value">{formatDate(booking.checkIn)}</div>
                </div>
                <div className="booking-view-date-arrow">→</div>
                <div className="booking-view-date-card">
                  <div className="booking-view-date-type">Check-Out</div>
                  <div className="booking-view-date-value">{formatDate(booking.checkOut)}</div>
                </div>
                <div className="booking-view-duration-card">
                  <div className="booking-view-duration-label">Total Stay</div>
                  <div className="booking-view-duration-value">
                    {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Guests & Rooms Section */}
            <div className="booking-view-section">
              <h3 className="booking-view-section-title">
                <span className="booking-view-section-icon">👥</span>
                Guests & Rooms
              </h3>
              
              {/* Guest Summary Card */}
              <div className="booking-view-guest-summary">
                <div className="booking-view-total-guests">
                  <div className="booking-view-total-count">{totalPeople}</div>
                  <div className="booking-view-total-label">
                    Total Guest{totalPeople !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="booking-view-guest-breakdown">
                  {booking.adults > 0 && (
                    <span className="booking-view-breakdown-item">
                      {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                    </span>
                  )}
                  {booking.children > 0 && (
                    <span className="booking-view-breakdown-item">
                      {booking.children} child{booking.children !== 1 ? 'ren' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="booking-view-guests-grid">
                <div className="booking-view-guest-card">
                  <div className="booking-view-guest-icon">🛏️</div>
                  <div className="booking-view-guest-info">
                    <div className="booking-view-guest-count">{booking.numberOfRooms}</div>
                    <div className="booking-view-guest-label">Room{booking.numberOfRooms !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="booking-view-guest-card">
                  <div className="booking-view-guest-icon">👨‍👩‍👧‍👦</div>
                  <div className="booking-view-guest-info">
                    <div className="booking-view-guest-count">{booking.adults}</div>
                    <div className="booking-view-guest-label">Adult{booking.adults !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="booking-view-guest-card">
                  <div className="booking-view-guest-icon">🧒</div>
                  <div className="booking-view-guest-info">
                    <div className="booking-view-guest-count">{booking.children}</div>
                    <div className="booking-view-guest-label">Child{booking.children !== 1 ? 'ren' : ''}</div>
                  </div>
                </div>
              </div>

              {childrenAges.length > 0 && (
                <div className="booking-view-children-ages">
                  <h4 className="booking-view-children-title">Children Ages</h4>
                  <div className="booking-view-ages-list">
                    {childrenAges.map((age, index) => (
                      <div key={index} className="booking-view-age-item">
                        <span className="booking-view-age-label">Child {index + 1}</span>
                        <span className="booking-view-age-value">{age} year{age !== '1' ? 's' : ''} old</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Special Requests Section */}
            {(booking.specialRequest && booking.specialRequest.trim() !== '') && (
              <div className="booking-view-section">
                <h3 className="booking-view-section-title">
                  <span className="booking-view-section-icon">💬</span>
                  Special Requests
                </h3>
                <div className="booking-view-requests-card">
                  <div className="booking-view-requests-content">
                    {booking.specialRequest}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="booking-view-modal-actions">
          <button 
            className="booking-view-close-btn"
            onClick={onClose}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingViewModal;
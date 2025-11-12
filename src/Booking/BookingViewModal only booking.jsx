import React from "react";
import "./BookingViewModal.css";

const BookingViewModal = ({ booking, onClose }) => {
  if (!booking) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate total people from rooms if numberOfPeople is 0 or invalid
  const calculateTotalPeople = () => {
    if (booking.numberOfPeople && booking.numberOfPeople > 0) {
      return booking.numberOfPeople;
    }
    
    if (booking.rooms && Array.isArray(booking.rooms)) {
      return booking.rooms.reduce((total, room) => {
        return total + (room.adults || 0) + (room.children || 0);
      }, 0);
    }
    
    return 0;
  };

  const nights = booking.nights || 0;
  const totalPeople = calculateTotalPeople();
  const numberOfRooms = booking.numberOfRooms || (booking.rooms ? booking.rooms.length : 0);

  return (
    <div className="booking-view-modal-overlay">
      <div className="booking-view-modal-content-ticket">
        <div className="booking-view-modal-header">
          <div className="booking-view-modal-title-section">
            <h2 className="booking-view-modal-title">Booking Ticket</h2>
          </div>
          <button 
            className="booking-view-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="booking-view-modal-body-ticket">
          <div className="booking-view-ticket-two-column">
            {/* Left Column */}
            <div className="booking-view-ticket-column">
              {/* Ticket Number and Status */}
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Ticket Number:</span>
                <span className="booking-view-ticket-value">{booking.ticketNumber || 'N/A'}</span>
              </div>
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Status:</span>
                <span className="booking-view-ticket-value">{booking.status || 'Pending'}</span>
              </div>

              <div className="booking-view-ticket-spacer"></div>

              {/* Agency, Supplier, Hotel */}
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Agency:</span>
                <span className="booking-view-ticket-value">{booking.agencyName || 'N/A'}</span>
              </div>
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Supplier:</span>
                <span className="booking-view-ticket-value">{booking.supplierName || 'N/A'}</span>
              </div>
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Hotel:</span>
                <span className="booking-view-ticket-value">{booking.hotelName || 'N/A'}</span>
              </div>

              <div className="booking-view-ticket-spacer"></div>

              {/* Dates */}
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Check In:</span>
                <span className="booking-view-ticket-value">
                  {booking.checkIn ? formatDate(booking.checkIn) : 'N/A'}
                </span>
              </div>
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Check Out:</span>
                <span className="booking-view-ticket-value">
                  {booking.checkOut ? formatDate(booking.checkOut) : 'N/A'}
                </span>
              </div>
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Nights:</span>
                <span className="booking-view-ticket-value">{nights}</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="booking-view-ticket-column">
              {/* Rooms and People */}
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Number Of Rooms:</span>
                <span className="booking-view-ticket-value">{numberOfRooms}</span>
              </div>
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Total People:</span>
                <span className="booking-view-ticket-value">{totalPeople}</span>
              </div>

              <div className="booking-view-ticket-spacer"></div>

              {/* Rooms Section */}
              <div className="booking-view-ticket-line">
                <span className="booking-view-ticket-label">Rooms:</span>
              </div>
              <div className="booking-view-ticket-rooms-list">
                {booking.rooms && booking.rooms.length > 0 ? (
                  booking.rooms.map((room, index) => (
                    <div key={index} className="booking-view-ticket-room-item">
                      <div className="booking-view-ticket-room-header">- Room {index + 1}</div>
                      <div className="booking-view-ticket-room-details">
                        <div className="booking-view-ticket-indented-line">
                          <span className="booking-view-ticket-label">Room Type:</span>
                          <span className="booking-view-ticket-value">
                            {room.roomTypeName || `Room Type ${room.roomTypeId || 'N/A'}`}
                          </span>
                        </div>
                        <div className="booking-view-ticket-indented-line">
                          <span className="booking-view-ticket-label">Adults:</span>
                          <span className="booking-view-ticket-value">{room.adults || 0}</span>
                        </div>
                        <div className="booking-view-ticket-indented-line">
                          <span className="booking-view-ticket-label">Children:</span>
                          <span className="booking-view-ticket-value">{room.children || 0}</span>
                        </div>
                        {room.childrenAges && (
                          <div className="booking-view-ticket-indented-line">
                            <span className="booking-view-ticket-label">Children Ages:</span>
                            <span className="booking-view-ticket-value">
                              {Array.isArray(room.childrenAges) 
                                ? room.childrenAges.join(', ') 
                                : room.childrenAges}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="booking-view-ticket-no-rooms">No rooms information available</div>
                )}
              </div>

              {/* Special Request */}
              {(booking.specialRequest && booking.specialRequest.trim() !== '') && (
                <>
                  <div className="booking-view-ticket-spacer"></div>
                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">Special Request:</span>
                  </div>
                  <div className="booking-view-ticket-special-request">
                    {booking.specialRequest}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="booking-view-modal-actions">
          <button 
            className="booking-view-close-btn"
            onClick={onClose}
          >
            Close Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingViewModal;
import React, { useState, useEffect } from "react";
import "./BookingViewModal.css";
import { getCommercialByBooking } from "../api/commercialApi";

const BookingViewModal = ({ booking, onClose, onEdit }) => {
  const [commercialData, setCommercialData] = useState(null);
  const [loadingCommercial, setLoadingCommercial] = useState(false);

  if (!booking) return null;

  // Fetch commercial data when booking is available
  useEffect(() => {
    const fetchCommercialData = async () => {
      if (booking?.id) {
        setLoadingCommercial(true);
        try {
          const data = await getCommercialByBooking(booking.id);
          setCommercialData(data);
        } catch (error) {
          console.error("Failed to fetch commercial data:", error);
          setCommercialData(null);
        } finally {
          setLoadingCommercial(false);
        }
      }
    };

    fetchCommercialData();
  }, [booking]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
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

  // Calculate commercial summary
  const calculateCommercialSummary = () => {
    if (!commercialData) return null;

    const buyingAmount = parseFloat(commercialData.buyingAmount) || 0;
    const sellingPrice = parseFloat(commercialData.sellingPrice) || 0;
    const exchangeRate = parseFloat(commercialData.exchangeRate) || 1;

    // Convert buying amount to selling currency if different
    const convertedBuying = commercialData.buyingCurrency !== commercialData.sellingCurrency 
      ? buyingAmount * exchangeRate 
      : buyingAmount;

    const profit = sellingPrice - convertedBuying;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return {
      buyingAmount: formatCurrency(buyingAmount, commercialData.buyingCurrency),
      sellingPrice: formatCurrency(sellingPrice, commercialData.sellingCurrency),
      profit: formatCurrency(profit, commercialData.sellingCurrency),
      profitMargin: profitMargin.toFixed(2),
      hasCommercial: true
    };
  };

  const commercialSummary = calculateCommercialSummary();

  return (
    <div className="booking-view-modal-overlay">
      <div className="booking-view-modal-content-ticket">
        <div className="booking-view-modal-header">
          <div className="booking-view-modal-title-section">
            <h2 className="booking-view-modal-title">Booking Ticket</h2>
            <div className="booking-view-modal-actions-header">
              <button 
                className="booking-view-edit-btn"
                onClick={() => onEdit(booking)}
              >
                Edit Booking
              </button>
              {commercialSummary && (
                <button 
                  className="booking-view-commercial-btn"
                  onClick={() => onEdit(booking, 'commercial')}
                >
                  Edit Commercial
                </button>
              )}
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

        <div className="booking-view-modal-body-ticket">
          <div className="booking-view-ticket-two-column">
            {/* Left Column - Booking Details */}
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

            {/* Right Column - Rooms & Commercial */}
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

              {/* Commercial Data Section */}
              <div className="booking-view-ticket-spacer"></div>
              <div className="booking-view-commercial-section">
                <div className="booking-view-ticket-line">
                  <span className="booking-view-ticket-label">Commercial Data:</span>
                </div>
                
                {loadingCommercial ? (
                  <div className="booking-view-commercial-loading">
                    Loading commercial data...
                  </div>
                ) : commercialSummary ? (
                  <div className="booking-view-commercial-summary">
                    <div className="booking-view-commercial-line">
                      <span className="booking-view-commercial-label">Cost:</span>
                      <span className="booking-view-commercial-value">{commercialSummary.buyingAmount}</span>
                    </div>
                    <div className="booking-view-commercial-line">
                      <span className="booking-view-commercial-label">Revenue:</span>
                      <span className="booking-view-commercial-value">{commercialSummary.sellingPrice}</span>
                    </div>
                    <div className="booking-view-commercial-line profit">
                      <span className="booking-view-commercial-label">Profit:</span>
                      <span className={`booking-view-commercial-value ${
                        parseFloat(commercialSummary.profit) >= 0 ? 'positive' : 'negative'
                      }`}>
                        {commercialSummary.profit} ({commercialSummary.profitMargin}%)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="booking-view-no-commercial">
                    No commercial data available
                    <button 
                      className="booking-view-add-commercial-btn"
                      onClick={() => onEdit(booking, 'commercial')}
                    >
                      Add Commercial Data
                    </button>
                  </div>
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
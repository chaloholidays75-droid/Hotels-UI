import React from "react";
import "./BookingList.css";

const BookingList = ({ bookings, loading, openViewModal, openEditModal, toggleBookingStatus, isAdmin, refreshBookings }) => {
  if (loading) {
    return (
      <div className="booking-list-loading">
        <div className="booking-list-spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="booking-list-empty">
        <div className="booking-list-empty-icon">📋</div>
        <h3>No Bookings Found</h3>
        <p>There are no bookings matching your criteria.</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'booking-status-confirmed';
      case 'Pending':
        return 'booking-status-pending';
      case 'Cancelled':
        return 'booking-status-cancelled';
      case 'Completed':
        return 'booking-status-completed';
      default:
        return 'booking-status-default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return "-";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="booking-list-container">
      <div className="booking-list-header">
        <h2 className="booking-list-title">Bookings</h2>
        <div className="booking-list-stats">
          <span className="booking-list-count">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="booking-list-table-container">
        <table className="booking-list-table">
          <thead className="booking-list-thead">
            <tr>
              <th className="booking-list-th booking-list-th-ticket">Ticket #</th>
              <th className="booking-list-th booking-list-th-agency">Agency</th>
              <th className="booking-list-th booking-list-th-supplier">Supplier</th>
              <th className="booking-list-th booking-list-th-hotel">Hotel</th>
              <th className="booking-list-th booking-list-th-dates">Check-In</th>
              <th className="booking-list-th booking-list-th-dates">Check-Out</th>
              <th className="booking-list-th booking-list-th-numeric">Rooms</th>
              <th className="booking-list-th booking-list-th-status">Status</th>
              {isAdmin && <th className="booking-list-th booking-list-th-actions">Actions</th>}
            </tr>
          </thead>
          <tbody className="booking-list-tbody">
            {bookings.map((booking) => (
              <tr key={booking.id} className="booking-list-row">
                <td className="booking-list-td booking-list-td-ticket">
                  <span className="booking-list-ticket-number">{booking.ticketNumber}</span>
                </td>
                <td className="booking-list-td booking-list-td-agency">
                  <div className="booking-list-agency-info">
                    <span className="booking-list-agency-name">{booking.agencyName}</span>
                  </div>
                </td>
                <td className="booking-list-td booking-list-td-supplier">
                  {booking.supplierName}
                </td>
                <td className="booking-list-td booking-list-td-hotel">
                  <div className="booking-list-hotel-info">
                    <span className="booking-list-hotel-name">{truncateText(booking.hotelName, 30)}</span>
                  </div>
                </td>
                <td className="booking-list-td booking-list-td-dates">
                  <span className="booking-list-date">{formatDate(booking.checkIn)}</span>
                </td>
                <td className="booking-list-td booking-list-td-dates">
                  <span className="booking-list-date">{formatDate(booking.checkOut)}</span>
                </td>
                <td className="booking-list-td booking-list-td-numeric">
                  <span className="booking-list-rooms">{booking.numberOfRooms}</span>
                </td>
                <td className="booking-list-td booking-list-td-status">
                  <span className={`booking-list-status ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                {isAdmin && (
                  <td className="booking-list-td booking-list-td-actions">
                    <div className="booking-list-actions">
                      <button 
                        className="booking-list-btn booking-list-btn-view"
                        onClick={() => openViewModal(booking)}
                        title="View booking details"
                      >
                        <span className="booking-list-btn-icon"><fml-icon name="settings-outline"></fml-icon></span>
                        View
                      </button>
                      <button 
                        className="booking-list-btn booking-list-btn-edit"
                        onClick={() => openEditModal(booking)}
                        title="Edit booking"
                      >
                        <span className="booking-list-btn-icon"><fml-icon name="create-outline"></fml-icon></span>
                        Edit
                      </button>
                      {/* <button 
                        className={`booking-list-btn ${booking.status === "Pending" ? 'booking-list-btn-confirm' : 'booking-list-btn-pending'}`}
                        onClick={() => toggleBookingStatus(booking.id, booking.status)}
                        title={booking.status === "Pending" ? "Confirm booking" : "Set as pending"}
                      >
                        <span className="booking-list-btn-icon">
                          {booking.status === "Pending" ? <fml-icon name="checkmark-done-outline"></fml-icon> : <fml-icon name="create-outline"></fml-icon>}
                        </span>
                        {booking.status === "Pending" ? "Confirm" : "Pending"}
                      </button> */}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingList;
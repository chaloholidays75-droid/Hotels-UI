import React, { useState, useMemo } from "react";
import "./BookingList.css";
import BookingReminders from "./BookingReminderBell";
import bookingApi from "../api/bookingApi";

const BookingList = ({ bookings, loading, openViewModal, openEditModal, isAdmin, refreshBookings }) => {
  const [updating, setUpdating] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [quickFilters, setQuickFilters] = useState({
    upcoming: false,
    todayCheckin: false,
    highPriority: false
  });

  // Feature 1: Bulk Operations
  const handleBulkAction = async () => {
    if (!bulkAction || selectedBookings.size === 0) return;
    
    try {
      const bookingIds = Array.from(selectedBookings);
      await Promise.all(
        bookingIds.map(id => bookingApi.updateBookingStatus(id, bulkAction))
      );
      await refreshBookings();
      setSelectedBookings(new Set());
      setBulkAction('');
    } catch (err) {
      console.error("Bulk action failed:", err);
      alert("Some actions failed. Please try again.");
    }
  };

  const toggleSelectBooking = (bookingId) => {
    const newSelected = new Set(selectedBookings);
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId);
    } else {
      newSelected.add(bookingId);
    }
    setSelectedBookings(newSelected);
  };

  const selectAllBookings = () => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
    }
  };

  // Feature 2: Quick Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = !searchTerm || 
        booking.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.hotelName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUpcoming = !quickFilters.upcoming || 
        new Date(booking.checkIn) > new Date();
      
      const matchesTodayCheckin = !quickFilters.todayCheckin ||
        new Date(booking.checkIn).toDateString() === new Date().toDateString();

      const matchesHighPriority = !quickFilters.highPriority ||
        booking.status === 'Pending' || booking.status === 'Holding';

      return matchesSearch && matchesUpcoming && matchesTodayCheckin && matchesHighPriority;
    });
  }, [bookings, searchTerm, quickFilters]);

  // Feature 3: Row Expansion for Details
  const toggleRowExpansion = (bookingId) => {
    setExpandedRow(expandedRow === bookingId ? null : bookingId);
  };

  // Feature 4: Booking Priority & Urgency Indicators
  const getPriorityLevel = (booking) => {
    const checkInDate = new Date(booking.checkIn);
    const today = new Date();
    const daysUntilCheckin = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilCheckin <= 1) return 'high';
    if (daysUntilCheckin <= 3) return 'medium';
    return 'low';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Confirmed': '✅',
      'Reconfirmed(Guaranteed)': '🛡️',
      'Pending': '⏳',
      'Holding': '📌',
      'Cancelled by Agent': '❌',
      'Cancelled by Hotel': '🏨❌',
      'Completed': '🏁'
    };
    return icons[status] || '📄';
  };

  // Feature 5: Export & Data Actions
  const exportBookings = () => {
    const dataToExport = filteredBookings.map(booking => ({
      'Ticket #': booking.ticketNumber,
      'Agency': booking.agencyName,
      'Supplier': booking.supplierName,
      'Hotel': booking.hotelName,
      'Check-In': formatDate(booking.checkIn),
      'Check-Out': formatDate(booking.checkOut),
      'Rooms': Array.isArray(booking.rooms) ? booking.rooms.length : (booking.rooms || 1),
      'Status': booking.status
    }));

    const csv = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Feature 6: Enhanced Date Display with Relative Time
  const formatDateWithRelative = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    if (diffDays === 0) return { date: formattedDate, relative: "Today", urgent: true };
    if (diffDays === 1) return { date: formattedDate, relative: "Tomorrow", urgent: true };
    if (diffDays > 1 && diffDays <= 7) return { date: formattedDate, relative: `In ${diffDays} days`, warning: true };
    if (diffDays < 0) return { date: formattedDate, relative: `${Math.abs(diffDays)} days ago`, past: true };
    
    return { date: formattedDate, relative: "" };
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'booking-status-confirmed'; 
      case 'Reconfirmed(Guaranteed)':
        return 'booking-status-reconfirmed';
      case 'Pending':
      case 'Holding':
        return 'booking-status-pending';
      case 'Cancelled by Agent':
      case 'Cancelled by Hotel':
        return 'booking-status-cancelled';
      case 'Completed':
        return 'booking-status-completed';
      default:
        return 'booking-status-default';
    }
  };

  const toggleBookingStatus = async (bookingId, newStatus) => {
    try {
      setUpdating(bookingId);
      await bookingApi.updateBookingStatus(bookingId, newStatus);
      await refreshBookings();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Could not update status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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

  return (
    <div className="booking-list-container">
      {/* Enhanced Header with Controls */}
      <div className="booking-list-header">
        <div className="booking-list-header-main">
          <h2 className="booking-list-title">
            Bookings <span className="booking-count-badge">{filteredBookings.length}</span>
          </h2>
          
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button 
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              📊 Table
            </button>
            <button 
              className={`view-mode-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
            >
              🃏 Cards
            </button>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="booking-list-controls">
          {/* Search */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search bookings..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Quick Filters */}
          <div className="quick-filters">
            <button 
              className={`quick-filter-btn ${quickFilters.upcoming ? 'active' : ''}`}
              onClick={() => setQuickFilters(prev => ({...prev, upcoming: !prev.upcoming}))}
            >
              🗓️ Upcoming
            </button>
            <button 
              className={`quick-filter-btn ${quickFilters.todayCheckin ? 'active' : ''}`}
              onClick={() => setQuickFilters(prev => ({...prev, todayCheckin: !prev.todayCheckin}))}
            >
              📅 Today Check-in
            </button>
            <button 
              className={`quick-filter-btn ${quickFilters.highPriority ? 'active' : ''}`}
              onClick={() => setQuickFilters(prev => ({...prev, highPriority: !prev.highPriority}))}
            >
              ⚠️ High Priority
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedBookings.size > 0 && (
            <div className="bulk-actions">
              <select 
                value={bulkAction} 
                onChange={(e) => setBulkAction(e.target.value)}
                className="bulk-action-select"
              >
                <option value="">Bulk Action ({selectedBookings.size})</option>
                <option value="Confirmed">Confirm Selected</option>
                <option value="Cancelled by Agent">Cancel Selected</option>
                <option value="Completed">Mark Completed</option>
              </select>
              <button onClick={handleBulkAction} className="bulk-action-btn">
                Apply
              </button>
            </div>
          )}

          {/* Export */}
          <button onClick={exportBookings} className="export-btn">
            📤 Export CSV
          </button>
        </div>
      </div>

      <BookingReminders />

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="booking-list-table-container">
          <table className="booking-list-table">
            <thead className="booking-list-thead">
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedBookings.size === filteredBookings.length && filteredBookings.length > 0}
                    onChange={selectAllBookings}
                    className="bulk-select-checkbox"
                  />
                </th>
                <th>TICKET #</th>
                <th>AGENCY</th>
                <th>SUPPLIER</th>
                <th>HOTEL</th>
                <th>CHECK-IN</th>
                <th>CHECK-OUT</th>
                {/* <th>ROOMS</th> */}
                <th>STATUS</th>
                {isAdmin && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => {
                const checkInInfo = formatDateWithRelative(booking.checkIn);
                const priority = getPriorityLevel(booking);
                
                return (
                  <React.Fragment key={booking.id}>
                    <tr className={`booking-list-row priority-${priority} ${expandedRow === booking.id ? 'expanded' : ''}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedBookings.has(booking.id)}
                          onChange={() => toggleSelectBooking(booking.id)}
                          className="booking-select-checkbox"
                        />
                      </td>
                      <td 
                        className="booking-ticket-number clickable"
                        onClick={() => toggleRowExpansion(booking.id)}
                        title="Click to view details"
                      >
                        {booking.ticketNumber}
                        {priority === 'high' && <span className="urgency-indicator"> 🔥</span>}
                      </td>
                      <td>{booking.agencyName}</td>
                      <td>{booking.supplierName}</td>
                      <td className="booking-hotel-name">{booking.hotelName}</td>
                      <td className={`booking-date ${checkInInfo.urgent ? 'urgent' : ''} ${checkInInfo.warning ? 'warning' : ''}`}>
                        <div className="date-with-relative">
                          {checkInInfo.date}
                          {checkInInfo.relative && (
                            <div className="relative-time">{checkInInfo.relative}</div>
                          )}
                        </div>
                      </td>
                      <td>{formatDate(booking.checkOut)}</td>
                      <td className="booking-rooms">
                        {Array.isArray(booking.rooms) ? booking.rooms.length : (booking.rooms || 1)}
                      </td>
                      <td>
                        <div className="status-with-icon">
                          <span className="status-icon">{getStatusIcon(booking.status)}</span>
                          <select
                            className={`booking-status-dropdown ${getStatusBadgeClass(booking.status)}`}
                            value={booking.status}
                            onChange={(e) => toggleBookingStatus(booking.id, e.target.value)}
                            disabled={updating === booking.id}
                          >
                            <option value="Confirmed">CONFIRMED</option>
                            <option value="Reconfirmed(Guaranteed)">RECONFIRMED</option>
                            <option value="Pending">PENDING</option>
                            <option value="Holding">HOLDING</option>
                            <option value="Cancelled by Agent">CANCELLED</option>
                            <option value="Cancelled by Hotel">CANCELLED BY HOTEL</option>
                          </select>
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="booking-actions">
                          <button
                            className="booking-btn booking-btn-view"
                            onClick={() => openViewModal(booking)}
                          >
                            👁️ View
                          </button>
                          <button
                            className="booking-btn booking-btn-edit"
                            onClick={() => openEditModal(booking)}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      )}
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRow === booking.id && (
                      <tr className="booking-details-row">
                        <td colSpan={isAdmin ? 10 : 9}>
                          <div className="booking-details">
                            <div className="detail-section">
                              <h4>Booking Details</h4>
                              <div className="detail-grid">
                                <div className="detail-item">
                                  <label>Priority:</label>
                                  <span className={`priority-badge priority-${priority}`}>
                                    {priority.toUpperCase()}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <label>Nights:</label>
                                  <span>{
                                    Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))
                                  }</span>
                                </div>
                                {Array.isArray(booking.rooms) && booking.rooms.map((room, index) => (
                                  <div key={room.id} className="detail-item">
                                    <label>Room {index + 1}:</label>
                                    <span>{room.roomTypeName} ({room.adults} adults, {room.children} children)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="booking-cards-container">
          {filteredBookings.map((booking) => {
            const checkInInfo = formatDateWithRelative(booking.checkIn);
            const priority = getPriorityLevel(booking);
            
            return (
              <div key={booking.id} className={`booking-card priority-${priority}`}>
                <div className="card-header">
                  <div className="card-ticket">
                    <span className="ticket-number">{booking.ticketNumber}</span>
                    {priority === 'high' && <span className="urgency-indicator"> 🔥</span>}
                  </div>
                  <div className="card-status">
                    <span className="status-icon">{getStatusIcon(booking.status)}</span>
                    <select
                      className={`booking-status-dropdown ${getStatusBadgeClass(booking.status)}`}
                      value={booking.status}
                      onChange={(e) => toggleBookingStatus(booking.id, e.target.value)}
                    >
                      <option value="Confirmed">CONFIRMED</option>
                      <option value="Reconfirmed(Guaranteed)">RECONFIRMED</option>
                      {/* <option value="Pending">PENDING</option> */}
                      <option value="Holding">HOLDING</option>
                      <option value="Cancelled by Agent">CANCELLED</option>
                    </select>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="card-hotel">{booking.hotelName}</div>
                  <div className="card-dates">
                    <div className={`date-item ${checkInInfo.urgent ? 'urgent' : ''}`}>
                      <span>Check-in: {checkInInfo.date}</span>
                      {checkInInfo.relative && <small>{checkInInfo.relative}</small>}
                    </div>
                    <div className="date-item">
                      <span>Check-out: {formatDate(booking.checkOut)}</span>
                    </div>
                  </div>
                  <div className="card-meta">
                    <span>Agency: {booking.agencyName}</span>
                    <span>Rooms: {Array.isArray(booking.rooms) ? booking.rooms.length : (booking.rooms || 1)}</span>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="card-actions">
                    <button
                      className="booking-btn booking-btn-view"
                      onClick={() => openViewModal(booking)}
                    >
                      👁️ View
                    </button>
                    <button
                      className="booking-btn booking-btn-edit"
                      onClick={() => openEditModal(booking)}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filteredBookings.length === 0 && bookings.length > 0 && (
        <div className="booking-list-no-results">
          <div className="no-results-icon">🔍</div>
          <h4>No matching bookings found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default BookingList;
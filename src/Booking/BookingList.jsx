import React, { useState, useMemo } from "react";
import "./BookingList.css";
import BookingReminderBell from "./BookingReminderBell"; // ✅ Bell notification
import bookingApi from "../api/bookingApi";

const BookingList = ({ bookings, loading, openViewModal, openEditModal, isAdmin, refreshBookings }) => {
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get unique agencies for filter
  const agencies = useMemo(() => {
    const uniqueAgencies = [...new Set(bookings.map((booking) => booking.agencyName))];
    return uniqueAgencies.sort();
  }, [bookings]);

  // Filter and search
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.agencyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.hotelName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesAgency = agencyFilter === "all" || booking.agencyName === agencyFilter;

      return matchesSearch && matchesStatus && matchesAgency;
    });
  }, [bookings, searchTerm, statusFilter, agencyFilter]);

  // Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  }, [filteredBookings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredBookings.length);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, agencyFilter]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setAgencyFilter("all");
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Confirmed":
        return "booking-status-confirmed";
      case "Reconfirmed(Guaranteed)":
        return "booking-status-reconfirmed";
      case "Pending":
      case "Holding":
        return "booking-status-pending";
      case "Cancelled by Agent":
      case "Cancelled by Hotel":
        return "booking-status-cancelled";
      case "Completed":
        return "booking-status-completed";
      default:
        return "booking-status-default";
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

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (loading)
    return (
      <div className="booking-list-loading">
        <div className="booking-list-spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );

  if (!bookings.length)
    return (
      <div className="booking-list-empty">
        <div className="booking-list-empty-icon">📋</div>
        <h3>No Bookings Found</h3>
        <p>There are no bookings in the system.</p>
      </div>
    );

  return (
    <div className="booking-list-container">
      {/* Filters + Notification Bell */}
      <div className="booking-list-controls" style={{ alignItems: "center" }}>
        <div className="booking-search-group">
          <label className="booking-control-label">Search Bookings</label>
          <input
            type="text"
            className="booking-search-input"
            placeholder="Search by ticket, agency, supplier, or hotel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="booking-filter-group">
          <label className="booking-control-label">Status</label>
          <select
            className="booking-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Reconfirmed(Guaranteed)">Reconfirmed</option>
            <option value="Pending">Pending</option>
            <option value="Holding">Holding</option>
            <option value="Cancelled by Agent">Cancelled</option>
            <option value="Cancelled by Hotel">Cancelled by Hotel</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="booking-filter-group">
          <label className="booking-control-label">Agency</label>
          <select
            className="booking-filter-select"
            value={agencyFilter}
            onChange={(e) => setAgencyFilter(e.target.value)}
          >
            <option value="all">All Agencies</option>
            {agencies.map((agency) => (
              <option key={agency} value={agency}>
                {agency}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ Notification Bell aligned right */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            className="booking-btn"
            onClick={clearFilters}
            style={{
              borderColor: "#6c757d",
              color: "#6c757d",
              height: "fit-content",
            }}
          >
            Clear Filters
          </button>

          <BookingReminderBell /> {/* 🔔 bell icon added here */}
        </div>
      </div>

      {/* Results Count */}
      <div className="booking-results-count">
        Showing {startItem}-{endItem} of {filteredBookings.length} bookings
        {filteredBookings.length !== bookings.length &&
          ` (filtered from ${bookings.length} total)`}
      </div>

      {/* Table */}
      <div className="booking-list-table-container">
        <table className="booking-list-table">
          <thead className="booking-list-thead">
            <tr>
              <th>TICKET #</th>
              <th>AGENCY</th>
              <th>SUPPLIER</th>
              <th>HOTEL</th>
              <th>CHECK-IN</th>
              <th>CHECK-OUT</th>
              <th>STATUS</th>
              {isAdmin && <th>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedBookings.length > 0 ? (
              paginatedBookings.map((booking) => (
                <tr key={booking.id} className="booking-list-row">
                  <td className="booking-ticket-number">{booking.ticketNumber}</td>
                  <td>{booking.agencyName}</td>
                  <td>{booking.supplierName}</td>
                  <td className="booking-hotel-name">{booking.hotelName}</td>
                  <td>{formatDate(booking.checkIn)}</td>
                  <td>{formatDate(booking.checkOut)}</td>
                  <td>
                    <select
                      className={`booking-status-dropdown ${getStatusBadgeClass(booking.status)}`}
                      value={booking.status}
                      onChange={(e) => toggleBookingStatus(booking.id, e.target.value)}
                      disabled={updating === booking.id}
                    >
                      <option value="Confirmed">CONFIRMED</option>
                      <option value="Reconfirmed(Guaranteed)">RECONFIRMED</option>
                      <option value="Holding">HOLDING</option>
                      <option value="Cancelled by Agent">CANCELLED</option>
                      <option value="Cancelled by Hotel">CANCELLED BY HOTEL</option>
                    </select>
                  </td>

                  {isAdmin && (
                    <td className="booking-actions">
                      <button
                        className="booking-btn booking-btn-view"
                        onClick={() => openViewModal(booking)}
                      >
                        View
                      </button>
                      <button
                        className="booking-btn booking-btn-edit"
                        onClick={() => openEditModal(booking)}
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: "center", padding: "2rem" }}>
                  No bookings match your search criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredBookings.length > 0 && (
        <div className="booking-pagination">
          <div className="booking-pagination-info">
            Showing {startItem}-{endItem} of {filteredBookings.length} bookings
          </div>
          <div className="booking-pagination-controls">
            <button
              className="booking-pagination-btn"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              className="booking-pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="booking-pagination-pages">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  className={`booking-pagination-page ${currentPage === page ? "active" : ""}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="booking-pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              className="booking-pagination-btn"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
            <select
              className="booking-pagination-select"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingList;

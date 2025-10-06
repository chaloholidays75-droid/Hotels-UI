import React, { useState, useEffect, useContext } from "react";
import BookingForm from "./BookingForm";
import BookingList from "./BookingList";
import BookingViewModal from "./BookingViewModal";
import BookingEditModal from "./BookingEditModal";
import bookingApi from "../api/bookingApi";
import "./BookingManagement.css"
import { AuthContext } from "../context/AuthContext";

const BookingManagement = () => {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || "employee";

  const [activeTab, setActiveTab] = useState("view");
  const [bookings, setBookings] = useState([]);
  const [viewModal, setViewModal] = useState({ isOpen: false, booking: null });
  const [editModal, setEditModal] = useState({ isOpen: false, booking: null });
  const [loading, setLoading] = useState(false);

  const isAdmin = userRole.toLowerCase() === "admin";

  const handleTabChange = (tab) => setActiveTab(tab);

  useEffect(() => {
    if (activeTab === "view") fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingApi.getBookings();
      const mappedBookings = data.map((b) => ({
        id: b.id,
        ticketNumber: b.ticketNumber,
        agencyName: b.agencyName || "N/A",
        supplierName: b.supplierName || "N/A",
        hotelName: b.hotelName || "N/A",
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: b.nights,
        numberOfRooms: b.numberOfRooms,
        adults: b.adults,
        children: b.children,
        childrenAges: b.childrenAges,
        status: b.status,
        specialRequest: b.specialRequest,
      }));
      setBookings(mappedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      alert("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (booking) => setViewModal({ isOpen: true, booking });
  const closeViewModal = () => setViewModal({ isOpen: false, booking: null });

  const openEditModal = (booking) => {
    if (!isAdmin) {
      alert("You do not have permission to edit bookings.");
      return;
    }
    setEditModal({ isOpen: true, booking });
  };
  const closeEditModal = () => setEditModal({ isOpen: false, booking: null });

  const toggleBookingStatus = async (id, currentStatus) => {
    if (!isAdmin) {
      alert("You do not have permission to change booking status.");
      return;
    }

    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;

    const newStatus = currentStatus === "Pending" ? "Confirmed" : "Pending";

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );

    try {
      await bookingApi.updateBookingStatus(id, newStatus);
      alert(`Booking status changed to ${newStatus}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update booking status");
      // rollback
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: currentStatus } : b))
      );
    }
  };

  return (
    <div className="booking-management-container">
      <div className="booking-management-header-tabs-container">
        <div className="booking-management-header-section">
          <div className="booking-management-title-section">
            <h1 className="booking-management-main-title">📖 Booking Management</h1>
            <p className="booking-management-subtitle">Manage bookings, hotels, agencies, and suppliers</p>
          </div>
          <div className="booking-management-user-role-badge">
            Logged in as: <span className={`booking-management-role-${userRole.toLowerCase()}`}>{userRole}</span>
          </div>
        </div>

        <div className="booking-management-tabs-section">
          <button
            className={activeTab === "add" ? "booking-management-tab booking-management-tab-active" : "booking-management-tab"}
            onClick={() => handleTabChange("add")}
          >
            Add Booking
          </button>
          <button
            className={activeTab === "view" ? "booking-management-tab booking-management-tab-active" : "booking-management-tab"}
            onClick={() => handleTabChange("view")}
          >
            View Bookings ({bookings.length})
          </button>
        </div>
      </div>

      <div className="booking-management-tab-content">
        {activeTab === "add" ? (
          <BookingForm
            booking={null}
            onSaved={() => {
              fetchBookings();
              setActiveTab("view");
            }}
            onCancel={() => setActiveTab("view")}
          />
        ) : (
          <BookingList
            bookings={bookings}
            loading={loading}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleBookingStatus={toggleBookingStatus}
            isAdmin={isAdmin}
            refreshBookings={fetchBookings}
          />
        )}
      </div>

      {viewModal.isOpen && (
        <BookingViewModal booking={viewModal.booking} onClose={closeViewModal} />
      )}

      {editModal.isOpen && (
        <BookingEditModal
          editModal={editModal}
          setEditModal={setEditModal}
          closeEditModal={closeEditModal}
          refreshBookings={fetchBookings}
        />
      )}

    </div>
  );
};

export default BookingManagement;
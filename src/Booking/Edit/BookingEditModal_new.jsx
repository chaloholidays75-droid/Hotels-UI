import React, { useState } from "react";
import "./CommercialEditModal.css";
import BookingEditSection from "./BookingEditSection";
import CommercialEditSection from "./CommercialEditSection";

export default function BookingEditModal({ editModal, closeEditModal, refreshBookings }) {
  const [bookingData, setBookingData] = useState(null);
  const [commercialData, setCommercialData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  if (!editModal?.isOpen) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log("Saving:", { bookingData, commercialData });
      // 🧠 integrate your updateBooking + create/updateCommercial logic here
      refreshBookings && refreshBookings();
      closeEditModal();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-modal">
      <div className="edit-container">
        {/* Header */}
        <div className="edit-header">
          <div className="title-side">
            <h2>Edit Booking</h2>
            <small className="subtle">
              Ticket: <b>{editModal?.booking?.ticketNumber}</b>
            </small>
          </div>
          <div className="header-actions">
            <button className="btn ghost" onClick={closeEditModal}>Cancel</button>
            <button className="btn primary" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save All"}
            </button>
            <button className="hamburger" onClick={() => setShowSummary(!showSummary)}>☰</button>
          </div>
        </div>

        {/* Body Grid */}
        <div className="body-grid">
          <div className="left-pane">
            <BookingEditSection onChange={setBookingData} initial={editModal.booking} />
            <CommercialEditSection onChange={setCommercialData} booking={editModal.booking} />
          </div>

          {/* Summary */}
          <aside className={`right-pane ${showSummary ? "open" : ""}`}>
            <div className="summary-head">
              <h3>Summary</h3>
              <button className="btn small ghost close-on-mobile" onClick={() => setShowSummary(false)}>Close</button>
            </div>
            {bookingData && (
              <div className="summary-card">
                <div className="summary-title">Booking</div>
                <div className="summary-row"><span>Hotel</span><b>{bookingData.hotelName}</b></div>
                <div className="summary-row"><span>Check-In</span><b>{bookingData.checkIn}</b></div>
                <div className="summary-row"><span>Nights</span><b>{bookingData.nights}</b></div>
              </div>
            )}
            {commercialData && (
              <div className="summary-card">
                <div className="summary-title">Commercial</div>
                <div className="summary-row"><span>Buying</span><b>{commercialData.buyingCurrency} {commercialData.buyingAmount}</b></div>
                <div className="summary-row"><span>Selling</span><b>{commercialData.sellingCurrency} {commercialData.sellingPrice}</b></div>
                <div className="summary-row"><span>Profit %</span><b>{commercialData.profitMarginPercent?.toFixed(2)}%</b></div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// CombinedBookingCommercial.js
import React, { useState } from "react";
import BookingForm from "./BookingForm";
import CommercialForm from "./CommercialForm";
import "./CombinedBookingCommercial.css";

const CombinedBookingCommercial = ({ onSaved, onCancel }) => {
  const [activeTab, setActiveTab] = useState("booking");
  const [bookingData, setBookingData] = useState(null);
  const [commercialData, setCommercialData] = useState(null);

  const handleBookingSave = (booking) => {
    setBookingData(booking);
    setActiveTab("commercial");
  };

  const handleCompleteBooking = () => {
    // Combine both sets of data and save
    const completeData = {
      ...bookingData,
      commercialData: commercialData
    };
    onSaved?.(completeData);
  };

  return (
    <div className="combined-booking-commercial">
      {/* Tabs Navigation */}
      <div className="combined-tabs">
        <button 
          className={`combined-tab ${activeTab === 'booking' ? 'active' : ''}`}
          onClick={() => setActiveTab('booking')}
        >
          📋 Booking Details
        </button>
        <button 
          className={`combined-tab ${activeTab === 'commercial' ? 'active' : ''}`}
          onClick={() => setActiveTab('commercial')}
           // Disable commercial tab until booking is saved
        >
          💰 Commercial Calculator
        </button>
      </div>

      {/* Tab Content */}
      <div className="combined-tab-content">
        {activeTab === "booking" ? (
          <BookingForm
            booking={null}
            onSaved={handleBookingSave}
            onCancel={onCancel}
          />
        ) : (
          <div className="commercial-tab-content">
            <CommercialForm 
              onCommercialDataChange={setCommercialData}
            />
            <div className="combined-actions">
              <button 
                className="combined-btn combined-btn-back"
                onClick={() => setActiveTab("booking")}
              >
                ← Back to Booking
              </button>
              <button 
                className="combined-btn combined-btn-complete"
                onClick={handleCompleteBooking}
              >
                Complete Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedBookingCommercial;
import React, { useState, useEffect } from "react";
import "./BookingViewModal.css";
import { getCommercialByBooking } from "../api/commercialApi";

const BookingViewModal = ({ booking, onClose, onEditCommercial }) => {
  const [commercialData, setCommercialData] = useState(null);
  const [loadingCommercial, setLoadingCommercial] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // "details" or "commercial"

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

  // Calculate detailed commercial breakdown
  const calculateCommercialBreakdown = () => {
    if (!commercialData) return null;

    const buyingAmount = parseFloat(commercialData.buyingAmount) || 0;
    const sellingPrice = parseFloat(commercialData.sellingPrice) || 0;
    const exchangeRate = parseFloat(commercialData.exchangeRate) || 1;

    // Parse additional costs and discounts
    const additionalCosts = commercialData.additionalCostsJson 
      ? JSON.parse(commercialData.additionalCostsJson)
      : [];
    
    const discounts = commercialData.discountsJson 
      ? JSON.parse(commercialData.discountsJson)
      : [];

    // Calculate total additional costs
    const totalAdditionalCosts = additionalCosts.reduce((total, cost) => {
      return total + (parseFloat(cost.amount) || 0);
    }, 0);

    // Calculate total discounts
    const totalDiscounts = discounts.reduce((total, discount) => {
      return total + (parseFloat(discount.amount) || 0);
    }, 0);

    // Commission calculation
    let commissionAmount = 0;
    if (commercialData.commissionable && commercialData.commissionValue) {
      const vatRate = commercialData.buyingVatIncluded ? parseFloat(commercialData.buyingVatPercent) / 100 : 0;
      const netBeforeVAT = commercialData.buyingVatIncluded
        ? buyingAmount / (1 + vatRate)
        : buyingAmount;

      if (commercialData.commissionType === "percentage") {
        commissionAmount = (netBeforeVAT * parseFloat(commercialData.commissionValue)) / 100;
      } else {
        commissionAmount = parseFloat(commercialData.commissionValue);
      }
    }

    // Incentive calculation
    let incentiveValue = 0;
    if (commercialData.incentive && commercialData.incentiveValue) {
      const vatRate = commercialData.sellingVatIncluded ? parseFloat(commercialData.sellingVatPercent) / 100 : 0;
      const baseBeforeVAT = commercialData.sellingVatIncluded
        ? sellingPrice / (1 + vatRate)
        : sellingPrice;

      if (commercialData.incentiveType === "percentage") {
        incentiveValue = (baseBeforeVAT * parseFloat(commercialData.incentiveValue)) / 100;
      } else {
        incentiveValue = parseFloat(commercialData.incentiveValue);
      }
    }

    // Convert buying amount to selling currency if different
    const convertedBuying = commercialData.buyingCurrency !== commercialData.sellingCurrency 
      ? (buyingAmount + totalAdditionalCosts - commissionAmount) * exchangeRate 
      : buyingAmount + totalAdditionalCosts - commissionAmount;

    const profit = (sellingPrice - totalDiscounts - incentiveValue) - convertedBuying;
    const profitMargin = (sellingPrice - totalDiscounts - incentiveValue) > 0 
      ? (profit / (sellingPrice - totalDiscounts - incentiveValue)) * 100 
      : 0;

    return {
      // Basic info
      buyingCurrency: commercialData.buyingCurrency,
      sellingCurrency: commercialData.sellingCurrency,
      exchangeRate: exchangeRate,
      
      // Buying side
      buyingAmount: buyingAmount,
      additionalCosts: additionalCosts,
      totalAdditionalCosts: totalAdditionalCosts,
      commissionAmount: commissionAmount,
      commissionable: commercialData.commissionable,
      commissionType: commercialData.commissionType,
      commissionValue: commercialData.commissionValue,
      buyingVatIncluded: commercialData.buyingVatIncluded,
      buyingVatPercent: commercialData.buyingVatPercent,
      
      // Selling side
      sellingPrice: sellingPrice,
      discounts: discounts,
      totalDiscounts: totalDiscounts,
      incentiveValue: incentiveValue,
      incentive: commercialData.incentive,
      incentiveType: commercialData.incentiveType,
      sellingVatIncluded: commercialData.sellingVatIncluded,
      sellingVatPercent: commercialData.sellingVatPercent,
      
      // Totals
      totalCost: buyingAmount + totalAdditionalCosts - commissionAmount,
      totalRevenue: sellingPrice - totalDiscounts - incentiveValue,
      convertedCost: convertedBuying,
      profit: profit,
      profitMargin: profitMargin,
      
      hasCommercial: true
    };
  };

  const commercialBreakdown = calculateCommercialBreakdown();

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
          {/* Tab Navigation */}
          <div className="booking-view-modal-tabs">
            <button 
              className={`booking-view-modal-tab ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              Booking Details
            </button>
            <button 
              className={`booking-view-modal-tab ${activeTab === "commercial" ? "active" : ""}`}
              onClick={() => setActiveTab("commercial")}
            >
              Commercial Data
            </button>
          </div>

          {/* Tab Content */}
          <div className="booking-view-modal-tab-content active">
            {activeTab === "details" && (
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

                {/* Right Column - Rooms & People */}
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
            )}

            {activeTab === "commercial" && (
              <div className="booking-view-commercial-tab">
                <div className="booking-view-commercial-section">
                  <div className="booking-view-commercial-header">
                 
         
                  </div>
                  
                  {loadingCommercial ? (
                    <div className="booking-view-commercial-loading">
                      Loading commercial data...
                    </div>
                  ) : commercialBreakdown ? (
                    <><div className="booking-view-commercial-details">
                        {/* Buying Side */}
                        <div className="booking-view-commercial-side">
                          <h4>Cost Side (Buying)</h4>
                          <div className="booking-view-commercial-line">
                            <span className="booking-view-commercial-label">Base Amount:</span>
                            <span className="booking-view-commercial-value">
                              {formatCurrency(commercialBreakdown.buyingAmount, commercialData.buyingCurrency)}
                            </span>
                          </div>

                          {commercialBreakdown.additionalCosts.length > 0 && (
                            <>
                              <div className="booking-view-commercial-subheader">Additional Costs:</div>
                              {commercialBreakdown.additionalCosts.map((cost, index) => (
                                <div key={index} className="booking-view-commercial-indented">
                                  <span className="booking-view-commercial-label">- {cost.description || 'Additional Cost'}:</span>
                                  <span className="booking-view-commercial-value">
                                    {formatCurrency(parseFloat(cost.amount), commercialData.buyingCurrency)}
                                  </span>
                                </div>
                              ))}
                              <div className="booking-view-commercial-line">
                                <span className="booking-view-commercial-label">Total Additional Costs:</span>
                                <span className="booking-view-commercial-value">
                                  {formatCurrency(commercialBreakdown.totalAdditionalCosts, commercialData.buyingCurrency)}
                                </span>
                              </div>
                            </>
                          )}

                          {commercialBreakdown.commissionable && commercialBreakdown.commissionAmount > 0 && (
                            <div className="booking-view-commercial-line">
                              <span className="booking-view-commercial-label">Commission:</span>
                              <span className="booking-view-commercial-value">
                                {formatCurrency(commercialBreakdown.commissionAmount, commercialData.buyingCurrency)}
                              </span>
                            </div>
                          )}

                          <div className="booking-view-commercial-line total">
                            <span className="booking-view-commercial-label">Total Cost:</span>
                            <span className="booking-view-commercial-value">
                              {formatCurrency(commercialBreakdown.totalCost, commercialData.buyingCurrency)}
                            </span>
                          </div>
                        </div>

                        {/* Selling Side */}
                        <div className="booking-view-commercial-side">
                          <h4>Revenue Side (Selling)</h4>
                          <div className="booking-view-commercial-line">
                            <span className="booking-view-commercial-label">Selling Price:</span>
                            <span className="booking-view-commercial-value">
                              {formatCurrency(commercialBreakdown.sellingPrice, commercialData.sellingCurrency)}
                            </span>
                          </div>

                          {commercialBreakdown.discounts.length > 0 && (
                            <>
                              <div className="booking-view-commercial-subheader">Discounts:</div>
                              {commercialBreakdown.discounts.map((discount, index) => (
                                <div key={index} className="booking-view-commercial-indented">
                                  <span className="booking-view-commercial-label">- {discount.description || 'Discount'}:</span>
                                  <span className="booking-view-commercial-value">
                                    {formatCurrency(parseFloat(discount.amount), commercialData.sellingCurrency)}
                                  </span>
                                </div>
                              ))}
                              <div className="booking-view-commercial-line">
                                <span className="booking-view-commercial-label">Total Discounts:</span>
                                <span className="booking-view-commercial-value">
                                  {formatCurrency(commercialBreakdown.totalDiscounts, commercialData.sellingCurrency)}
                                </span>
                              </div>
                            </>
                          )}

                          {commercialBreakdown.incentive && commercialBreakdown.incentiveValue > 0 && (
                            <div className="booking-view-commercial-line">
                              <span className="booking-view-commercial-label">Incentive:</span>
                              <span className="booking-view-commercial-value">
                                {formatCurrency(commercialBreakdown.incentiveValue, commercialData.sellingCurrency)}
                              </span>
                            </div>
                          )}

                          <div className="booking-view-commercial-line total">
                            <span className="booking-view-commercial-label">Total Revenue:</span>
                            <span className="booking-view-commercial-value">
                              {formatCurrency(commercialBreakdown.totalRevenue, commercialData.sellingCurrency)}
                            </span>
                          </div>
                        </div>

                        {/* Currency Exchange */}
                        {commercialData.buyingCurrency !== commercialData.sellingCurrency && (
                          <div className="booking-view-commercial-exchange">
                            <div className="booking-view-commercial-line">
                              <span className="booking-view-commercial-label">Exchange Rate:</span>
                              <span className="booking-view-commercial-value">
                                1 {commercialData.buyingCurrency} = {commercialBreakdown.exchangeRate} {commercialData.sellingCurrency}
                              </span>
                            </div>
                            <div className="booking-view-commercial-line">
                              <span className="booking-view-commercial-label">Converted Cost:</span>
                              <span className="booking-view-commercial-value">
                                {formatCurrency(commercialBreakdown.convertedCost, commercialData.sellingCurrency)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div><div className="booking-view-commercial-profit">
                          <div className="booking-view-commercial-line profit">
                            <span className="booking-view-commercial-label">Net Profit/Loss:</span>
                            <span className={`booking-view-commercial-value ${commercialBreakdown.profit >= 0 ? 'positive' : 'negative'}`}>
                              {formatCurrency(commercialBreakdown.profit, commercialData.sellingCurrency)}
                            </span>
                          </div>
                          <div className="booking-view-commercial-line">
                            <span className="booking-view-commercial-label">Profit Margin:</span>
                            <span className="booking-view-commercial-value">
                              {commercialBreakdown.profitMargin.toFixed(2)}%
                            </span>
                          </div>
                        </div></>
                  ) : (
                    <div className="booking-view-no-commercial">
                      No commercial data available
    
                    </div>
                  )}
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
            Close Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingViewModal;
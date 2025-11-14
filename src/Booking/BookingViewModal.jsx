import React, { useState, useEffect, useRef } from "react";
import "./BookingViewModal.css";
import { getCommercialByBooking } from "../api/commercialApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const BookingViewModal = ({ booking, onClose, onEditCommercial }) => {
  const [commercialData, setCommercialData] = useState(null);
  const [loadingCommercial, setLoadingCommercial] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isGenerating, setIsGenerating] = useState(false);
  const modalRef = useRef(null);
  const invoiceRef = useRef(null);

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
          // Create fallback commercial data
          setCommercialData({
            buyingAmount: booking.totalAmount ? booking.totalAmount * 0.7 : 0,
            sellingPrice: booking.totalAmount || 0,
            buyingCurrency: "EUR",
            sellingCurrency: "EUR",
            exchangeRate: 1,
            hasCommercial: false,
          });
        } finally {
          setLoadingCommercial(false);
        }
      }
    };

    fetchCommercialData();
  }, [booking]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(",", "");
  };

  const formatCurrency = (amount, currency = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Calculate total people from rooms
  const calculateTotalPeople = () => {
    if (booking.numberOfPeople && booking.numberOfPeople > 0) {
      return booking.numberOfPeople;
    }

    if (booking.bookingRooms && Array.isArray(booking.bookingRooms)) {
      return booking.bookingRooms.reduce((total, room) => {
        return total + (room.adults || 0) + (room.children || 0);
      }, 0);
    }

    return 0;
  };

  const nights = booking.nights || 0;
  const totalPeople = calculateTotalPeople();
  const numberOfRooms =
    booking.numberOfRooms || (booking.bookingRooms ? booking.bookingRooms.length : 0);

  // Calculate commercial breakdown
  const calculateCommercialBreakdown = () => {
    if (!commercialData) {
      // Fallback calculation
      const fallbackAmount =
        booking.totalAmount || (booking.ratePerNight || 0) * nights;
      return {
        buyingCurrency: "EUR",
        sellingCurrency: "EUR",
        buyingAmount: fallbackAmount * 0.7,
        sellingPrice: fallbackAmount,
        totalCost: fallbackAmount * 0.7,
        totalRevenue: fallbackAmount,
        profit: fallbackAmount * 0.3,
        profitMargin: 30,
        hasCommercial: false,
      };
    }

    const buyingAmount = parseFloat(commercialData.buyingAmount) || 0;
    const sellingPrice = parseFloat(commercialData.sellingPrice) || 0;
    const exchangeRate = parseFloat(commercialData.exchangeRate) || 1;

    const additionalCosts = commercialData.additionalCostsJson
      ? JSON.parse(commercialData.additionalCostsJson)
      : [];

    const discounts = commercialData.discountsJson
      ? JSON.parse(commercialData.discountsJson)
      : [];

    const totalAdditionalCosts = additionalCosts.reduce((total, cost) => {
      return total + (parseFloat(cost.amount) || 0);
    }, 0);

    const totalDiscounts = discounts.reduce((total, discount) => {
      return total + (parseFloat(discount.amount) || 0);
    }, 0);

    // Commission calculation
    let commissionAmount = 0;
    if (commercialData.commissionable && commercialData.commissionValue) {
      const vatRate = commercialData.buyingVatIncluded
        ? parseFloat(commercialData.buyingVatPercent) / 100
        : 0;
      const netBeforeVAT = commercialData.buyingVatIncluded
        ? buyingAmount / (1 + vatRate)
        : buyingAmount;

      if (commercialData.commissionType === "percentage") {
        commissionAmount =
          (netBeforeVAT * parseFloat(commercialData.commissionValue)) / 100;
      } else {
        commissionAmount = parseFloat(commercialData.commissionValue);
      }
    }

    // Incentive calculation
    let incentiveValue = 0;
    if (commercialData.incentive && commercialData.incentiveValue) {
      const vatRate = commercialData.sellingVatIncluded
        ? parseFloat(commercialData.sellingVatPercent) / 100
        : 0;
      const baseBeforeVAT = commercialData.sellingVatIncluded
        ? sellingPrice / (1 + vatRate)
        : sellingPrice;

      if (commercialData.incentiveType === "percentage") {
        incentiveValue =
          (baseBeforeVAT * parseFloat(commercialData.incentiveValue)) / 100;
      } else {
        incentiveValue = parseFloat(commercialData.incentiveValue);
      }
    }

    const convertedBuying =
      commercialData.buyingCurrency !== commercialData.sellingCurrency
        ? (buyingAmount + totalAdditionalCosts - commissionAmount) * exchangeRate
        : buyingAmount + totalAdditionalCosts - commissionAmount;

    const profit =
      sellingPrice - totalDiscounts - incentiveValue - convertedBuying;
    const profitMargin =
      sellingPrice - totalDiscounts - incentiveValue > 0
        ? (profit / (sellingPrice - totalDiscounts - incentiveValue)) * 100
        : 0;

    return {
      buyingCurrency: commercialData.buyingCurrency,
      sellingCurrency: commercialData.sellingCurrency,
      exchangeRate: exchangeRate,
      buyingAmount: buyingAmount,
      additionalCosts: additionalCosts,
      totalAdditionalCosts: totalAdditionalCosts,
      commissionAmount: commissionAmount,
      sellingPrice: sellingPrice,
      discounts: discounts,
      totalDiscounts: totalDiscounts,
      incentiveValue: incentiveValue,
      totalCost: buyingAmount + totalAdditionalCosts - commissionAmount,
      totalRevenue: sellingPrice - totalDiscounts - incentiveValue,
      convertedCost: convertedBuying,
      profit: profit,
      profitMargin: profitMargin,
      hasCommercial: commercialData.hasCommercial !== false,
    };
  };

  const commercialBreakdown = calculateCommercialBreakdown();

  // Generate PDF with optimized single-page approach
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Ensure invoice tab is active and rendered
      if (activeTab !== "invoice") {
        setActiveTab("invoice");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const element = invoiceRef.current;
      if (!element) {
        throw new Error("Invoice element not found");
      }

      // Create a clone of the element for PDF generation
      const clone = element.cloneNode(true);
      clone.style.width = "190mm"; // Set fixed width for A4
      clone.style.padding = "20px";
      clone.style.boxSizing = "border-box";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794, // A4 width in pixels at 96 DPI (210mm * 3.78)
        height: clone.scrollHeight,
        windowWidth: 794,
        windowHeight: clone.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      // Remove clone from DOM
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions to fit on one page
      const imgWidth = pdfWidth - 20; // 10mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Check if content fits on one page
      if (imgHeight <= pdfHeight - 20) {
        // Single page
        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      } else {
        // Multiple pages needed (unlikely with invoice format)
        let position = 10;
        let remainingHeight = imgHeight;

        while (remainingHeight > 0) {
          const pageHeight = Math.min(remainingHeight, pdfHeight - 20);
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
          remainingHeight -= pdfHeight - 20;
          position -= pdfHeight - 20;

          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      return pdf;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Print functionality with optimized single-page approach
  const handlePrint = () => {
    setIsGenerating(true);

    // Switch to invoice tab first
    if (activeTab !== "invoice") {
      setActiveTab("invoice");
    }

    // Wait for render then create print window
    setTimeout(() => {
      const invoiceElement = invoiceRef.current;
      if (!invoiceElement) {
        alert("Invoice content not available for printing. Please try again.");
        setIsGenerating(false);
        return;
      }

      const printContent = invoiceElement.innerHTML;
      const printWindow = window.open("", "_blank", "width=800,height=600");

      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${booking.ticketNumber || "Booking"}</title>
          <style>
 @media print {

  /* FORCE FULL PAGE */
  @page {
    size: A4 portrait !important;
    margin: 0 !important;
  }

  html, body {
    width: 210mm !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;

    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;

    background: white !important;

    /* THE REAL FIX: FULL WIDTH, NO SHRINK */
    zoom: 1.25 !important;  
    transform: scale(1) !important;
    transform-origin: top left !important;
  }

  /* MAIN CONTAINER SIZE */
  .invoice-print-container {
    width: 185mm !important;
    margin: 0 auto !important;
    padding: 10mm !important;
    background: white !important;
  }

  /* TABLE FULL WIDTH + EXCEL LOOK */
  table.invoice-preview-table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: auto !important;
  }

  table.invoice-preview-table td {
    border: 1px solid #b4b4b4 !important;
    padding: 4px 6px !important;
    font-size: 11px !important;
    vertical-align: middle !important;
  }

  /* COLORS EXACT FROM YOUR SAMPLE */
  .invoice-label-grey {
    background: #D9D9D9 !important;
  }
    /* MAKE ONLY THE MIDDLE (2nd) COLUMN NARROWER */
/* Safe A4 column widths */
.invoice-preview-table td:nth-child(1) {
  width: 35mm !important;
}

.invoice-preview-table td:nth-child(2) {
  width: 75mm !important;  /* middle column */
}

.invoice-preview-table td:nth-child(3) {
  width: 35mm !important;
}

.invoice-preview-table td:nth-child(4) {
  width: 35mm !important;
}



  .invoice-status-cell {
    background: #C6EFCE !important;
    font-weight: bold !important;
  }

  .invoice-balance-cell {
    background: #FFEB9C !important;
    font-weight: bold !important;
  }

  .invoice-company-name {
    font-size: 20px !important;
    color: #C00000 !important;
    font-weight: bold !important;
  }

  .invoice-company-header {
    border-bottom: 2px solid black !important;
    padding-bottom: 5px !important;
    margin-bottom: 8px !important;
    text-align: center !important;
  }

  .invoice-logo-row img {
    max-width: 160px !important;
    display: block !important;
    margin-left: auto !important;
  }

  /* TOTAL ROW */
  .invoice-total-amount {
    font-size: 13px !important;
    font-weight: bold !important;
    margin-top: 10px !important;
    padding: 5px !important;
  }
}

          </style>
        </head>
        <body>
          <div class="invoice-print-container">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
              }, 500);
            }
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 500);
            }
            setTimeout(function() {
              if (!document.hidden) {
                window.close();
              }
            }, 5000);
          </script>
        </body>
      </html>
    `);
      printWindow.document.close();

      setIsGenerating(false);
    }, 1000);
  };

  // Download as PDF functionality
  const handleDownloadPDF = async () => {
    try {
      const pdf = await generatePDF();
      const fileName = `invoice-${booking.ticketNumber || "booking"}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try the print option instead.");
    }
  };

  // Email functionality
  const handleEmail = async () => {
    try {
      const pdf = await generatePDF();
      const fileName = `invoice-${booking.ticketNumber || "booking"}.pdf`;

      // Save PDF first
      pdf.save(fileName);

      // Prepare email content
      const subject = `Invoice ${
        booking.ticketNumber || ""
      } - Chalo Holiday Limited`;
      const body = generateEmailBody();

      // Open email client with instructions
      const mailtoLink = `mailto:?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(
        body +
          "\n\n---\nThe invoice PDF has been automatically downloaded. Please attach it to this email."
      )}`;

      window.location.href = mailtoLink;
    } catch (error) {
      console.error("Error preparing email:", error);
      alert("Error preparing email. Please download the PDF first and attach manually.");
    }
  };

  // Generate email body
  const generateEmailBody = () => {
    const invoiceData = getInvoiceData();

    return `INVOICE - CHALO HOLIDAY LIMITED

Booking Reference: ${booking.ticketNumber || "N/A"}
Guest: ${getGuestNames()}
Hotel: ${booking.hotelName || "N/A"}
Check-in: ${booking.checkIn ? formatDate(booking.checkIn) : "N/A"}
Check-out: ${booking.checkOut ? formatDate(booking.checkOut) : "N/A"}
Nights: ${nights}
Total Amount: ${formatCurrency(
      invoiceData.totalAmount,
      invoiceData.currency
    )}

Please find the detailed invoice attached.

Thank you for your business!

Chalo Holiday Limited
40 South Park Crescent, Ilford, London IG11XU, UK
44 (0) 2030049978 | info@chaloholidays.com`.trim();
  };

  // Helper function to get occupancy type
  const getOccupancyType = (people) => {
    switch (people) {
      case 1:
        return "Single";
      case 2:
        return "Double";
      case 3:
        return "Triple";
      case 4:
        return "Quad";
      default:
        return `${people}Pax`;
    }
  };

  // Get guest names
  const getGuestNames = () => {
    if (booking.guestNames && Array.isArray(booking.guestNames)) {
      return booking.guestNames.join(", ");
    } else if (booking.guestNames) {
      return booking.guestNames;
    }
    return booking.guestName || "N/A";
  };

  // Get lead guest name
  const getLeadGuestName = () => {
    return booking.guestName || "N/A";
  };

  // Get room guest names
  const getRoomGuestNames = (room) => {
    if (room.guestNames && Array.isArray(room.guestNames)) {
      return room.guestNames.join(", ");
    } else if (room.guestNames) {
      return room.guestNames;
    }
    return room.leadGuestName || "N/A";
  };

  // NEW: map booking.status → Excel style text
  const getInvoiceStatusLabel = () => {
    const raw = booking.status || "";
    const lower = raw.toLowerCase();

    if (lower === "reconfirmed") return "Reconfirmed[Guaranteed]";
    if (lower === "confirmed") return "Confirmed";
    if (lower === "pending") return "Pending";

    return raw || "N/A";
  };

  // Get invoice data for display
  const getInvoiceData = () => {
    const today = new Date();
    const formattedDate = today
      .toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
      .replace(",", "");

    const netAmount = commercialBreakdown
      ? commercialBreakdown.sellingPrice
      : booking.totalAmount || 0;
    const bankCharges = 30.0;
    const totalAmount = netAmount + bankCharges;
    const ratePerNight = nights > 0 ? netAmount / nights : 0;

    return {
      date: formattedDate,
      netAmount,
      bankCharges,
      totalAmount,
      ratePerNight,
      currency: commercialBreakdown?.sellingCurrency || "EUR",
    };
  };

  const invoiceData = getInvoiceData();
  const hotelNameText = booking.hotelName || "N/A";
  const isLongHotelName = hotelNameText.length > 80; // for auto "merge" across columns

  return (
    <div className="booking-view-modal-overlay">
      <div className="booking-view-modal-content-ticket" ref={modalRef}>
        <div className="booking-view-modal-header">
          <div className="booking-view-modal-title-section">
            <h2 className="booking-view-modal-title">Booking Ticket</h2>
            <p className="booking-view-modal-subtitle">
              Ticket #: {booking.ticketNumber || "N/A"} |{" "}
              {booking.hotelName || "N/A"}
            </p>
          </div>
          <button
            className="booking-view-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Action Buttons */}
        <div className="booking-view-modal-actions-header">
          <button
            className="booking-view-action-btn booking-view-print-btn"
            onClick={handlePrint}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "🖨️ Print Invoice"}
          </button>
          <button
            className="booking-view-action-btn booking-view-download-btn"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "📥 Download PDF"}
          </button>
          <button
            className="booking-view-action-btn booking-view-email-btn"
            onClick={handleEmail}
            disabled={isGenerating}
          >
            {isGenerating ? "Preparing..." : "📧 Email with PDF"}
          </button>
        </div>

        <div className="booking-view-modal-body-ticket">
          {/* Tab Navigation */}
          <div className="booking-view-modal-tabs">
            <button
              className={`booking-view-modal-tab ${
                activeTab === "details" ? "active" : ""
              }`}
              onClick={() => setActiveTab("details")}
            >
              Booking Details
            </button>
            <button
              className={`booking-view-modal-tab ${
                activeTab === "commercial" ? "active" : ""
              }`}
              onClick={() => setActiveTab("commercial")}
            >
              Commercial Data
            </button>
            <button
              className={`booking-view-modal-tab ${
                activeTab === "invoice" ? "active" : ""
              }`}
              onClick={() => setActiveTab("invoice")}
            >
              Invoice Preview
            </button>
          </div>

          {/* Tab Content */}
          <div className="booking-view-modal-tab-content active">
            {activeTab === "details" && (
              <div className="booking-view-ticket-two-column">
                {/* Left Column - Booking Details */}
                <div className="booking-view-ticket-column">
                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">
                      Ticket Number:
                    </span>
                    <span className="booking-view-ticket-value">
                      {booking.ticketNumber || "N/A"}
                    </span>
                  </div>
                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">Status:</span>
                    <span className="booking-view-ticket-value">
                      {booking.status || "Pending"}
                    </span>
                  </div>

                  <div className="booking-view-ticket-spacer"></div>

                  {/* <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">
                      Lead Guest:
                    </span>
                    <span className="booking-view-ticket-value">
                      {getLeadGuestName()}
                    </span>
                  </div> */}
                  {/* <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">
                      All Guests:
                    </span>
                    <span className="booking-view-ticket-value">
                      {getGuestNames()}
                    </span>
                  </div> */}

                  <div className="booking-view-ticket-spacer"></div>

                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">Agency:</span>
                    <span className="booking-view-ticket-value">
                      {booking.agencyName || "N/A"}
                    </span>
                  </div>
                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">
                      Supplier:
                    </span>
                    <span className="booking-view-ticket-value">
                      {booking.supplierName || "N/A"}
                    </span>
                  </div>
                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">Hotel:</span>
                    <span className="booking-view-ticket-value">
                      {booking.hotelName || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Right Column - Dates & Rooms */}
                <div className="booking-view-ticket-column">
                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">
                      Check In:
                    </span>
                    <span className="booking-view-ticket-value">
                      {booking.checkIn ? formatDate(booking.checkIn) : "N/A"}
                    </span>
                  </div>
                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">
                      Check Out:
                    </span>
                    <span className="booking-view-ticket-value">
                      {booking.checkOut ? formatDate(booking.checkOut) : "N/A"}
                    </span>
                  </div>
                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">Nights:</span>
                    <span className="booking-view-ticket-value">
                      {nights}
                    </span>
                  </div>

                  <div className="booking-view-ticket-spacer"></div>

                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">
                      Number Of Rooms:
                    </span>
                    <span className="booking-view-ticket-value">
                      {numberOfRooms}
                    </span>
                  </div>
                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">
                      Total People:
                    </span>
                    <span className="booking-view-ticket-value">
                      {totalPeople}
                    </span>
                  </div>

                  <div className="booking-view-ticket-spacer"></div>

                  <div className="booking-view-ticket-line">
                    <span className="booking-view-ticket-label">Rooms:</span>
                  </div>
                  <div className="booking-view-ticket-rooms-list">
                    {booking.bookingRooms && booking.bookingRooms.length > 0 ? (
                      booking.bookingRooms.map((room, index) => (
                        <div
                          key={index}
                          className="booking-view-ticket-room-item"
                        >
                          <div className="booking-view-ticket-room-header">
                            - Room {index + 1}
                          </div>
                          <div className="booking-view-ticket-room-details">
                            <div className="booking-view-ticket-indented-line">
                              <span className="booking-view-ticket-label">
                                Room Type:
                              </span>
                              <span className="booking-view-ticket-value">
                                {room.roomTypeName || `${room.name || "N/A"}`}
                              </span>
                            </div>
                            <div className="booking-view-ticket-indented-line">
                              <span className="booking-view-ticket-label">
                                Lead Guest:
                              </span>
                              <span className="booking-view-ticket-value">
                                {room.leadGuestName || "N/A"}
                              </span>
                            </div>
                            <div className="booking-view-ticket-indented-line">
                              <span className="booking-view-ticket-label">
                                Adults:
                              </span>
                              <span className="booking-view-ticket-value">
                                {room.adults || 0}
                              </span>
                            </div>
                            <div className="booking-view-ticket-indented-line">
                              <span className="booking-view-ticket-label">
                                Children:
                              </span>
                              <span className="booking-view-ticket-value">
                                {room.children || 0}
                              </span>
                            </div>
                            <div className="booking-view-ticket-indented-line">
                              <span className="booking-view-ticket-label">
                                All Guests:
                              </span>
                              <span className="booking-view-ticket-value">
                                {getRoomGuestNames(room)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="booking-view-ticket-no-rooms">
                        No rooms information available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "commercial" && (
              <div className="booking-view-commercial-tab">
                <div className="booking-view-commercial-section">
                  {loadingCommercial ? (
                    <div className="booking-view-commercial-loading">
                      Loading commercial data...
                    </div>
                  ) : commercialBreakdown ? (
                    <>
                      {!commercialBreakdown.hasCommercial && (
                        <div className="commercial-fallback-notice">
                          <strong>Note:</strong> Using estimated commercial
                          data. Actual commercial data is not available for this
                          booking.
                        </div>
                      )}
                      <div className="booking-view-commercial-details">
                        <div className="booking-view-commercial-side">
                          <h4>Cost Side (Buying)</h4>
                          <div className="booking-view-commercial-line">
                            <span className="booking-view-commercial-label">
                              Base Amount:
                            </span>
                            <span className="booking-view-commercial-value">
                              {formatCurrency(
                                commercialBreakdown.buyingAmount,
                                commercialBreakdown.buyingCurrency
                              )}
                            </span>
                          </div>
                          <div className="booking-view-commercial-line total">
                            <span className="booking-view-commercial-label">
                              Total Cost:
                            </span>
                            <span className="booking-view-commercial-value">
                              {formatCurrency(
                                commercialBreakdown.totalCost,
                                commercialBreakdown.buyingCurrency
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="booking-view-commercial-side">
                          <h4>Revenue Side (Selling)</h4>
                          <div className="booking-view-commercial-line">
                            <span className="booking-view-commercial-label">
                              Selling Price:
                            </span>
                            <span className="booking-view-commercial-value">
                              {formatCurrency(
                                commercialBreakdown.sellingPrice,
                                commercialBreakdown.sellingCurrency
                              )}
                            </span>
                          </div>
                          <div className="booking-view-commercial-line total">
                            <span className="booking-view-commercial-label">
                              Total Revenue:
                            </span>
                            <span className="booking-view-commercial-value">
                              {formatCurrency(
                                commercialBreakdown.totalRevenue,
                                commercialBreakdown.sellingCurrency
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="booking-view-commercial-profit">
                        <div className="booking-view-commercial-line profit">
                          <span className="booking-view-commercial-label">
                            Net Profit/Loss:
                          </span>
                          <span
                            className={`booking-view-commercial-value ${
                              commercialBreakdown.profit >= 0
                                ? "positive"
                                : "negative"
                            }`}
                          >
                            {formatCurrency(
                              commercialBreakdown.profit,
                              commercialBreakdown.sellingCurrency
                            )}
                          </span>
                        </div>
                        <div className="booking-view-commercial-line">
                          <span className="booking-view-commercial-label">
                            Profit Margin:
                          </span>
                          <span className="booking-view-commercial-value">
                            {commercialBreakdown.profitMargin.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="booking-view-no-commercial">
                      No commercial data available
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "invoice" && (
              <div className="booking-view-invoice-tab">
                <div className="invoice-preview-container">
                  <div className="invoice-a4-preview">
                  <div
                    className="invoice-preview"
                    ref={invoiceRef}
                    id="invoice-preview"
                  >
                    <div className="invoice-company-header">
                      <h1 className="invoice-company-name">
                        Chalo Holiday Limited
                      </h1>
                      <div className="invoice-company-address">
                        Address : 40 South Park Crescent, Ilford, London
                        IG11XU, UK
                        <br />
                        44 (0) 2030049978 &nbsp; info@chaloholidays.com
                      </div>
                    </div>

                    <table className="invoice-preview-table">
                      <tbody>
                        {/* 4-column rows like Excel */}
                        <tr>
                          <td className="invoice-label">Date</td>
                          <td className="invoice-value">
                            {invoiceData.date}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">To</td>
                          <td className="invoice-value">
                            {booking.agencyName || "N/A"}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">INVOICE #</td>
                          <td className="invoice-value">
                            {booking.ticketNumber || "N/A"}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">Booking Status</td>
                          <td className="invoice-value invoice-status-cell">
                            {getInvoiceStatusLabel()}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">Agent Name</td>
                          <td className="invoice-value">
                            {booking.agencyName || "N/A"}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">Agent Voucher</td>
                          <td className="invoice-value">
                            {booking.agentVoucher || "N/A"}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">HCN</td>
                          <td className="invoice-value">
                            {booking.hcn || "N/A"}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">Guest Name</td>
                          <td className="invoice-value">{getGuestNames()}</td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        {/* Hotel name with auto "merge" across columns */}
                        <tr>
                          <td className="invoice-label">Hotel Name</td>
                          <td
                            className="invoice-value"
                            colSpan={isLongHotelName ? 3 : 1}
                          >
                            {hotelNameText}
                          </td>
                          {!isLongHotelName && (
                            <>
                              <td className="invoice-empty-cell"></td>
                              <td className="invoice-empty-cell"></td>
                            </>
                          )}
                        </tr>

                        <tr>
                          <td className="invoice-label">CHECK-IN</td>
                          <td className="invoice-value">
                            {booking.checkIn
                              ? formatDate(booking.checkIn)
                              : "N/A"}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">CHECK-OUT</td>
                          <td className="invoice-value">
                            {booking.checkOut
                              ? formatDate(booking.checkOut)
                              : "N/A"}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">Nts</td>
                          <td className="invoice-value">{nights}</td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">No of Room</td>
                          <td className="invoice-value">
                            {numberOfRooms} Room's
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">Room Category</td>
                          <td className="invoice-value">
                            {booking.roomCategory || "N/A"}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">Occupancy</td>
                          <td className="invoice-value">
                            {getOccupancyType(totalPeople)} ({totalPeople}Pax)
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        <tr>
                          <td className="invoice-label">Curr</td>
                          <td className="invoice-value">
                            {invoiceData.currency}
                          </td>
                          <td className="invoice-label"></td>
                          <td className="invoice-value"></td>
                        </tr>

                        {/* Right-side financial block */}
                        <tr>
                          <td className="invoice-label invoice-label-grey">
                            Rate/nt.
                          </td>
                          <td className="invoice-empty-cell" colSpan={2}></td>
                          <td className="invoice-value">
                            {invoiceData.ratePerNight.toFixed(2)}
                          </td>
                        </tr>

                        <tr>
                          <td className="invoice-label invoice-label-grey">
                            Net Amt.
                          </td>
                          <td className="invoice-empty-cell" colSpan={2}></td>
                          <td className="invoice-value">
                            {invoiceData.netAmount.toFixed(2)}
                          </td>
                        </tr>

                        <tr>
                          <td className="invoice-label invoice-label-grey">
                            Recd.
                          </td>
                          <td className="invoice-empty-cell" colSpan={2}></td>
                          <td className="invoice-value">0.00</td>
                        </tr>

                        <tr>
                          <td className="invoice-label invoice-label-grey">
                            Balance
                          </td>
                          <td className="invoice-empty-cell" colSpan={2}></td>
                          <td className="invoice-value invoice-balance-cell">
                            {invoiceData.netAmount.toFixed(2)}
                          </td>
                        </tr>

                        <tr>
                          <td className="invoice-label invoice-label-grey">
                            Bank Charges
                          </td>
                          <td className="invoice-empty-cell" colSpan={2}></td>
                          <td className="invoice-value">
                            {invoiceData.bankCharges.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="invoice-total-amount">
                      Total Net Payable to Chalo Holiday
                      <span>
                        {formatCurrency(
                          invoiceData.totalAmount,
                          invoiceData.currency
                        )}
                      </span>
                    </div>

                    <div className="invoice-note">
                      Note: Bank Transfer All Charges to be covered by sender
                    </div>

                    <div className="invoice-bank-details">
                      <strong>Bank Name : HSBC</strong>
                      <br />
                      <strong>Account Name: CHALO HOLIDAY LIMITED</strong>
                      <br />
                      <strong>
                        Bank Address: 196 Oxford St, Fitzrovia, London W1D 1NT
                        (UK)
                      </strong>
                    </div>

                    <div className="invoice-logo-row">
                      {/* place the logo file in /public/chalo-holiday-logo.png */}
                      <img
                        src="/chalo-holiday-logo.png"
                        alt="Chalo Holiday Logo"
                      />
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="booking-view-modal-actions">
          <button className="booking-view-close-btn" onClick={onClose}>
            Close Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingViewModal;

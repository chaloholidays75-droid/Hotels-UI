import React, { useState, useEffect, useRef } from "react";
import "./BookingViewModal.css";
import { getCommercialByBooking } from "../api/commercialApi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Helper function available to all components
const formatCurrency = (amount, currency = "EUR") => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

const BookingViewModal = ({ booking, onClose, onEditCommercial }) => {
  const [commercialData, setCommercialData] = useState(null);
  const [loadingCommercial, setLoadingCommercial] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isGenerating, setIsGenerating] = useState(false);
  const modalRef = useRef(null);
  const invoiceRef = useRef(null);

  if (!booking) return null;

  useEffect(() => {
    const fetchCommercialData = async () => {
      if (booking?.id) {
        setLoadingCommercial(true);
        try {
          const data = await getCommercialByBooking(booking.id);
          setCommercialData(data);
        } catch (error) {
          console.error("Failed to fetch commercial data:", error);
          setCommercialData({
            buyingAmount: booking.totalAmount ? booking.totalAmount * 0.7 : 0,
            sellingPrice: booking.totalAmount || 0,
            buyingCurrency: 'EUR',
            sellingCurrency: 'EUR',
            exchangeRate: 1,
            hasCommercial: false
          });
        } finally {
          setLoadingCommercial(false);
        }
      }
    };

    fetchCommercialData();
  }, [booking]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(',', '');
  };

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
  const numberOfRooms = booking.numberOfRooms || (booking.bookingRooms ? booking.bookingRooms.length : 0);

  const calculateCommercialBreakdown = () => {
    if (!commercialData) {
      const fallbackAmount = booking.totalAmount || (booking.ratePerNight || 0) * nights;
      return {
        buyingCurrency: 'EUR',
        sellingCurrency: 'EUR',
        buyingAmount: fallbackAmount * 0.7,
        sellingPrice: fallbackAmount,
        totalCost: fallbackAmount * 0.7,
        totalRevenue: fallbackAmount,
        profit: fallbackAmount * 0.3,
        profitMargin: 30,
        hasCommercial: false
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

    const convertedBuying = commercialData.buyingCurrency !== commercialData.sellingCurrency 
      ? (buyingAmount + totalAdditionalCosts - commissionAmount) * exchangeRate 
      : buyingAmount + totalAdditionalCosts - commissionAmount;

    const profit = (sellingPrice - totalDiscounts - incentiveValue) - convertedBuying;
    const profitMargin = (sellingPrice - totalDiscounts - incentiveValue) > 0 
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
      hasCommercial: commercialData.hasCommercial !== false
    };
  };

  const commercialBreakdown = calculateCommercialBreakdown();

  // SINGLE generatePDF function with larger fonts for PDF
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      if (activeTab !== "invoice") {
        setActiveTab("invoice");
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const element = invoiceRef.current;
      if (!element) throw new Error("Invoice element not found");

      // Create a clone with larger styles for PDF
      const clone = element.cloneNode(true);
      
      // Apply larger font styles for PDF
      clone.style.fontSize = '18px';
      clone.style.padding = '25px';
      clone.style.boxSizing = 'border-box';
      clone.style.width = '210mm'; // A4 width
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Use full page width with small margins
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Print function with larger fonts
  const handlePrint = () => {
    setIsGenerating(true);
    
    if (activeTab !== "invoice") {
      setActiveTab("invoice");
    }

    setTimeout(() => {
      const invoiceElement = invoiceRef.current;
      if (!invoiceElement) {
        alert("Invoice content not available for printing. Please try again.");
        setIsGenerating(false);
        return;
      }

      const printContent = invoiceElement.innerHTML;
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - ${booking.ticketNumber || 'Booking'}</title>
            <style>
              @media print {
                @page { 
                  margin: 10mm; 
                }
                body { 
                  margin: 0; 
                  padding: 0; 
                  font-family: 'Courier New', monospace; 
                  font-size: 18px;
                  line-height: 1.4;
                }
                .invoice-print-fullpage { 
                  width: 100%; 
                  height: 100%; 
                  padding: 15mm;
                  box-sizing: border-box;
                }
                .invoice-header { 
                  text-align: center; 
                  margin-bottom: 20px; 
                }
                .invoice-company-name { 
                  font-size: 32px;
                  font-weight: bold; 
                  margin: 0 0 10px 0; 
                }
                .invoice-company-address { 
                  font-size: 16px;
                  line-height: 1.4; 
                }
                .invoice-table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 25px 0;
                  font-size: 17px;
                }
                .invoice-table td { 
                  padding: 10px 15px;
                  border-bottom: 2px solid #000;
                  height: 30px;
                }
                .invoice-label { 
                  font-weight: bold; 
                  width: 160px;
                  font-size: 18px;
                }
                .invoice-total { 
                  font-weight: bold; 
                  font-size: 22px;
                  text-align: center; 
                  margin: 30px 0;
                  padding: 20px;
                  border: 3px solid #000;
                }
                .invoice-note { 
                  font-size: 16px;
                  text-align: center; 
                  margin: 20px 0;
                  font-style: italic; 
                }
                .invoice-bank { 
                  font-size: 16px;
                  margin-top: 25px;
                  padding: 20px;
                  border: 2px solid #000;
                  line-height: 1.5;
                }
              }
              
              @media screen {
                body { 
                  margin: 20px; 
                  font-family: 'Courier New', monospace;
                  background: white;
                  font-size: 18px;
                }
                .invoice-print-fullpage { 
                  max-width: 800px; 
                  margin: 0 auto;
                }
                .invoice-header { 
                  text-align: center; 
                  margin-bottom: 25px; 
                }
                .invoice-company-name { 
                  font-size: 32px; 
                  font-weight: bold; 
                  margin: 0 0 12px 0; 
                }
                .invoice-company-address { 
                  font-size: 16px; 
                  line-height: 1.4; 
                }
                .invoice-table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 30px 0; 
                  font-size: 17px; 
                }
                .invoice-table td { 
                  padding: 12px 16px; 
                  border-bottom: 2px solid #000; 
                  height: 32px;
                }
                .invoice-label { 
                  font-weight: bold; 
                  width: 160px; 
                  font-size: 18px;
                }
                .invoice-total { 
                  font-weight: bold; 
                  font-size: 22px; 
                  text-align: center; 
                  margin: 35px 0; 
                  padding: 25px; 
                  border: 3px solid #000; 
                }
                .invoice-note { 
                  font-size: 16px; 
                  text-align: center; 
                  margin: 25px 0; 
                  font-style: italic; 
                }
                .invoice-bank { 
                  font-size: 16px; 
                  margin-top: 30px; 
                  padding: 25px; 
                  border: 2px solid #000; 
                  line-height: 1.5;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-print-fullpage">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setIsGenerating(false);
    }, 500);
  };

  const handleDownloadPDF = async () => {
    try {
      const pdf = await generatePDF();
      const fileName = `invoice-${booking.ticketNumber || 'booking'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try the print option instead.');
    }
  };

  const handleEmail = async () => {
    try {
      const pdf = await generatePDF();
      const fileName = `invoice-${booking.ticketNumber || 'booking'}.pdf`;
      pdf.save(fileName);
      
      const subject = `Invoice ${booking.ticketNumber || ''} - Chalo Holiday Limited`;
      const body = `INVOICE - CHALO HOLIDAY LIMITED\n\nBooking Reference: ${booking.ticketNumber || 'N/A'}\nGuest: ${getGuestNames()}\nHotel: ${booking.hotelName || 'N/A'}\nCheck-in: ${booking.checkIn ? formatDate(booking.checkIn) : 'N/A'}\nCheck-out: ${booking.checkOut ? formatDate(booking.checkOut) : 'N/A'}\nNights: ${nights}\nTotal Amount: ${formatCurrency(getInvoiceData().totalAmount, getInvoiceData().currency)}\n\nPlease find the detailed invoice attached.\n\nThank you for your business!\n\nChalo Holiday Limited\n40 South Park Crescent, Ilford, London IG11XU, UK\n44 (0) 2030049978 | info@chaloholidays.com`;
      
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    } catch (error) {
      console.error('Error preparing email:', error);
      alert('Error preparing email. Please download the PDF first and attach manually.');
    }
  };

  const getOccupancyType = (people) => {
    switch(people) {
      case 1: return 'Single';
      case 2: return 'Double';
      case 3: return 'Triple';
      case 4: return 'Quad';
      default: return `${people}Pax`;
    }
  };

  const getGuestNames = () => {
    if (booking.guestNames && Array.isArray(booking.guestNames)) {
      return booking.guestNames.join(', ');
    } else if (booking.guestNames) {
      return booking.guestNames;
    }
    return booking.guestName || 'N/A';
  };

  const getLeadGuestName = () => {
    return booking.guestName || 'N/A';
  };

  const getInvoiceData = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(',', '');

    const netAmount = commercialBreakdown ? commercialBreakdown.sellingPrice : (booking.totalAmount || 0);
    const bankCharges = 30.00;
    const totalAmount = netAmount + bankCharges;
    const ratePerNight = nights > 0 ? netAmount / nights : 0;

    return {
      date: formattedDate,
      netAmount,
      bankCharges,
      totalAmount,
      ratePerNight,
      currency: commercialBreakdown?.sellingCurrency || 'EUR'
    };
  };

  const invoiceData = getInvoiceData();

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        {/* Minimal Header */}
        <div className="modal-header">
          <div className="header-minimal">
            <span className="booking-title">Booking #{booking.ticketNumber || 'N/A'}</span>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-bar">
          <button 
            className={`action-btn print ${isGenerating ? 'loading' : ''}`}
            onClick={handlePrint}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Print Invoice'}
          </button>
          <button 
            className={`action-btn download ${isGenerating ? 'loading' : ''}`}
            onClick={handleDownloadPDF}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
          <button 
            className="action-btn email"
            onClick={handleEmail}
            disabled={isGenerating}
          >
            Email with PDF
          </button>
        </div>

        {/* Two Tabs Only */}
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Booking & Commercial
          </button>
          <button 
            className={`tab ${activeTab === "invoice" ? "active" : ""}`}
            onClick={() => setActiveTab("invoice")}
          >
            Invoice Preview
          </button>
        </div>

        {/* Content Area */}
        <div className="modal-content">
          {activeTab === "details" && (
            <div className="content-grid">
              {/* Booking Details */}
              <div className="section">
                <h3>Booking Information</h3>
                <div className="info-list">
                  <div className="info-item">
                    <span>Ticket Number:</span>
                    <span>{booking.ticketNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span>Status:</span>
                    <span>{booking.status || 'Pending'}</span>
                  </div>
                  <div className="info-item">
                    <span>Lead Guest:</span>
                    <span>{booking.leadGuestName || "Not Defined"}</span>
                  </div>
                  <div className="info-item">
                    <span>Agency:</span>
                    <span>{booking.agencyName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span>Supplier:</span>
                    <span>{booking.supplierName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span>Hotel:</span>
                    <span>{booking.hotelName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Stay Details */}
              <div className="section">
                <h3>Stay Details</h3>
                <div className="info-list">
                  <div className="info-item">
                    <span>Check In:</span>
                    <span>{formatDate(booking.checkIn)}</span>
                  </div>
                  <div className="info-item">
                    <span>Check Out:</span>
                    <span>{formatDate(booking.checkOut)}</span>
                  </div>
                  <div className="info-item">
                    <span>Nights:</span>
                    <span>{nights}</span>
                  </div>
                  <div className="info-item">
                    <span>Rooms:</span>
                    <span>{numberOfRooms}</span>
                  </div>
                  <div className="info-item">
                    <span>Total Guests:</span>
                    <span>{totalPeople}</span>
                  </div>
                </div>
              </div>

              {/* Commercial Data */}
              <div className="section full-width">
                <h3>Commercial Data</h3>
                {loadingCommercial ? (
                  <div className="loading">Loading commercial data...</div>
                ) : commercialBreakdown ? (
                  <div className="commercial-grid">
                    <div className="commercial-card">
                      <h4>Cost Side</h4>
                      <div className="commercial-item">
                        <span>Base Amount:</span>
                        <span>{formatCurrency(commercialBreakdown.buyingAmount, commercialBreakdown.buyingCurrency)}</span>
                      </div>
                      <div className="commercial-item">
                        <span>Additional Costs:</span>
                        <span>{formatCurrency(commercialBreakdown.totalAdditionalCosts, commercialBreakdown.buyingCurrency)}</span>
                      </div>
                      <div className="commercial-item total">
                        <span>Total Cost:</span>
                        <span>{formatCurrency(commercialBreakdown.totalCost, commercialBreakdown.buyingCurrency)}</span>
                      </div>
                    </div>

                    <div className="commercial-card">
                      <h4>Revenue Side</h4>
                      <div className="commercial-item">
                        <span>Selling Price:</span>
                        <span>{formatCurrency(commercialBreakdown.sellingPrice, commercialBreakdown.sellingCurrency)}</span>
                      </div>
                      <div className="commercial-item">
                        <span>Discounts:</span>
                        <span>{formatCurrency(commercialBreakdown.totalDiscounts, commercialBreakdown.sellingCurrency)}</span>
                      </div>
                      <div className="commercial-item total">
                        <span>Total Revenue:</span>
                        <span>{formatCurrency(commercialBreakdown.totalRevenue, commercialBreakdown.sellingCurrency)}</span>
                      </div>
                    </div>

                    <div className="profit-card">
                      <h4>Profit Analysis</h4>
                      <div className="commercial-item">
                        <span>Net Profit/Loss:</span>
                        <span className={commercialBreakdown.profit >= 0 ? 'positive' : 'negative'}>
                          {formatCurrency(commercialBreakdown.profit, commercialBreakdown.sellingCurrency)}
                        </span>
                      </div>
                      <div className="commercial-item">
                        <span>Profit Margin:</span>
                        <span>{commercialBreakdown.profitMargin.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-data">No commercial data available</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "invoice" && (
            <div className="invoice-preview-large" ref={invoiceRef}>
              <div className="invoice-header-large">
                <h1 className="invoice-company-name-large">Chalo Holiday Limited</h1>
                <div className="company-address-large">
                  40 South Park Crescent, Ilford, London IG11XU, UK<br />
                  44 (0) 2030049978  info@chaloholidays.com
                </div>
              </div>

              <table className="invoice-table-large">
                <tbody>
                  {[
                    { label: "Date", value: invoiceData.date },
                    { label: "To", value: booking.agencyName },
                    { label: "INVOICE #", value: booking.ticketNumber },
                    { label: "Booking Status", value: booking.status },
                    { label: "Guest Name", value: getGuestNames() },
                    { label: "Hotel Name", value: booking.hotelName },
                    { label: "CHECK-IN", value: formatDate(booking.checkIn) },
                    { label: "CHECK-OUT", value: formatDate(booking.checkOut) },
                    { label: "Nts", value: nights },
                    { label: "No of Room", value: `${numberOfRooms} Room's` },
                    { label: "Room Category", value: booking.roomCategory },
                    { label: "Occupancy", value: `${getOccupancyType(totalPeople)} (${totalPeople}Pax)` },
                    { label: "Curr", value: invoiceData.currency },
                    { label: "Rate/nt.", value: invoiceData.ratePerNight.toFixed(2) },
                    { label: "Net Amt.", value: invoiceData.netAmount.toFixed(2) },
                    { label: "Bank Charges", value: invoiceData.bankCharges.toFixed(2) }
                  ].map((item, index) => (
                    <tr key={index}>
                      <td className="invoice-label-large">{item.label}</td>
                      <td className="invoice-value-large">{item.value || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-total-large">
                Total Net Payable to Chalo Holiday: {formatCurrency(invoiceData.totalAmount, invoiceData.currency)}
              </div>

              <div className="invoice-note-large">
                Note: Bank Transfer All Charges to be covered by sender
              </div>

              <div className="invoice-bank-large">
                <strong>Bank Name : HSBC</strong><br />
                <strong>Account Name: CHALO HOLIDAY LIMITED</strong><br />
                <strong>Bank Address: 196 Oxford St, Fitzrovia, London W1D 1NT (UK)</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingViewModal;
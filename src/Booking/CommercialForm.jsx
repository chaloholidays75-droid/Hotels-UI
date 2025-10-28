import React, { useState, useEffect } from "react";
import "./CommercialTicketForm.css";
import {
  getBookingsDropdown,
  getCommercialByBooking,
  createCommercial,
  updateCommercial,
  linkCommercialToBooking,
} from "../api/commercialApi";


export default function CommercialForm() {
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [saveStatus, setSaveStatus] = useState('idle');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [buying, setBuying] = useState({
    currency: "USD",
    amount: "",
    commissionable: false,
    commissionType: "percentage",
    commissionValue: "",
    vatIncluded: false,
    vatPercent: "20",
    additionalCosts: [{ id: 1, description: "", amount: "", type: "fixed" }],
  });

  const [selling, setSelling] = useState({
    currency: "USD",
    price: "",
    incentive: false,
    incentiveType: "percentage",
    incentiveValue: "",
    vatIncluded: false,
    vatPercent: "20",
    discounts: [{ id: 1, description: "", amount: "", type: "fixed" }],
  });

  const [exchangeRate, setExchangeRate] = useState("");
  const [autoCalculateRate, setAutoCalculateRate] = useState(false);


   useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await getBookingsDropdown();
        setBookings(data);
      } catch (err) {
        console.error("Failed to load bookings dropdown:", err);
      }
    };
    fetchBookings();
  }, []);
  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
  ];

  useEffect(() => {
    if (
      autoCalculateRate &&
      buying.currency &&
      selling.currency &&
      buying.currency !== selling.currency
    ) {
      const mockRates = {
        "USD-EUR": 0.85,
        "USD-GBP": 0.73,
        "EUR-USD": 1.18,
        "GBP-USD": 1.37,
      };
      const rateKey = `${buying.currency}-${selling.currency}`;
      setExchangeRate(mockRates[rateKey] || "1.0");
    }
  }, [autoCalculateRate, buying.currency, selling.currency]);

  const handleBuyingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBuying((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleBookingSelect = (bookingId) => {
  setSelectedBookingId(bookingId);
  setIsDropdownOpen(false);
  setSearchTerm("");
  setHighlightedIndex(-1);
};
// Filter bookings based on search term
const filteredBookings = bookings.filter(booking =>
  `${booking.ticketNumber} ${booking.hotel} ${booking.agency}`
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);

// Get the selected booking object for display
const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  const handleSellingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSelling((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
// ✅ Auto-toggle Commission checkbox based on its value
useEffect(() => {
  if (parseFloat(buying.commissionValue) > 0) {
    setBuying(prev => ({ ...prev, commissionable: true }));
  }
  if (parseFloat(selling.incentiveValue) > 0) {
    setSelling(prev => ({ ...prev, incentive: true }));
  }
}, [buying.commissionValue, selling.incentiveValue]);

// ✅ Auto-toggle Incentive checkbox based on its value
useEffect(() => {
  if (parseFloat(selling.incentiveValue) > 0 && !selling.incentive) {
    setSelling(prev => ({ ...prev, incentive: true }));
  }
  if ((!selling.incentiveValue || parseFloat(selling.incentiveValue) === 0) && selling.incentive) {
    setSelling(prev => ({ ...prev, incentive: false }));
  }
}, [selling.incentiveValue]);

  const addAdditionalCost = () => {
    setBuying((prev) => ({
      ...prev,
      additionalCosts: [
        ...prev.additionalCosts,
        { id: Date.now(), description: "", amount: "", type: "fixed" },
      ],
    }));
  };

  const removeAdditionalCost = (id) => {
    setBuying((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((cost) => cost.id !== id),
    }));
  };
useEffect(() => {
  console.log("Selected booking changed to:", selectedBookingId);
}, [selectedBookingId]);

  const updateAdditionalCost = (id, field, value) => {
    setBuying((prev) => ({
      ...prev,
      additionalCosts: prev.additionalCosts.map((cost) =>
        cost.id === id ? { ...cost, [field]: value } : cost
      ),
    }));
  };

  const addDiscount = () => {
    setSelling((prev) => ({
      ...prev,
      discounts: [
        ...prev.discounts,
        { id: Date.now(), description: "", amount: "", type: "fixed" },
      ],
    }));
  };

  const removeDiscount = (id) => {
    setSelling((prev) => ({
      ...prev,
      discounts: prev.discounts.filter((discount) => discount.id !== id),
    }));
  };

  const updateDiscount = (id, field, value) => {
    setSelling((prev) => ({
      ...prev,
      discounts: prev.discounts.map((discount) =>
        discount.id === id ? { ...discount, [field]: value } : discount
      ),
    }));
  };

  const calculateTotalAdditionalCosts = () => {
    return buying.additionalCosts.reduce((total, cost) => {
      if (cost.amount) return total + parseFloat(cost.amount);
      return total;
    }, 0);
  };

  const calculateTotalDiscounts = () => {
    return selling.discounts.reduce((total, discount) => {
      if (discount.amount) return total + parseFloat(discount.amount);
      return total;
    }, 0);
  };

  // Commission applies on Net before VAT
  const calculateCommissionAmount = () => {
    if (
      !buying.commissionable ||
      !buying.commissionValue ||
      isNaN(parseFloat(buying.commissionValue))
    )
      return 0;

    const grossAmount = parseFloat(buying.amount) || 0;
    const vatRate = buying.vatIncluded ? parseFloat(buying.vatPercent) / 100 : 0;
    const netBeforeVAT = buying.vatIncluded
      ? grossAmount / (1 + vatRate)
      : grossAmount;

    if (buying.commissionType === "percentage") {
      return (netBeforeVAT * parseFloat(buying.commissionValue)) / 100;
    } else {
      return parseFloat(buying.commissionValue);
    }
  };

  // Buying breakdown
  const calculateNetBuying = () => {
    const baseAmountIncludingVAT = parseFloat(buying.amount) || 0;
    const vatRate = parseFloat(buying.vatPercent) / 100 || 0;
    const additionalCosts = calculateTotalAdditionalCosts();

    const baseAmountWithoutVAT = buying.vatIncluded
      ? baseAmountIncludingVAT / (1 + vatRate)
      : baseAmountIncludingVAT;

    const vatAmount = buying.vatIncluded
      ? baseAmountIncludingVAT - baseAmountWithoutVAT
      : baseAmountWithoutVAT * vatRate;

    const commissionAmount = calculateCommissionAmount();
    const grossValue =
      baseAmountWithoutVAT + additionalCosts - commissionAmount;
    const netValue = baseAmountIncludingVAT + additionalCosts;

    return {
      baseAmountWithoutVAT,
      vatAmount,
      commissionAmount,
      additionalCosts,
      grossValue,
      netValue,
    };
  };

  // ✅ Revenue breakdown — VAT recomputed AFTER discounts/incentives
// ✅ Incentive should reduce only GROSS (before VAT). Net (receivable) stays the same.
//    VAT is computed from the original base (not the incentive-reduced base).
const calculateNetSelling = () => {
  const sellingPrice = parseFloat(selling.price) || 0;
  const vatRate = selling.vatIncluded ? parseFloat(selling.vatPercent) / 100 : 0;

  // Base before VAT (strip VAT if price includes it)
  const baseBeforeVAT = selling.vatIncluded
    ? sellingPrice / (1 + vatRate)
    : sellingPrice;

  // Incentive we give to supplier/agent (deduct from GROSS only)
  let incentiveValue = 0;
  if (selling.incentive && selling.incentiveValue) {
    incentiveValue =
      selling.incentiveType === "percentage"
        ? (baseBeforeVAT * parseFloat(selling.incentiveValue || 0)) / 100
        : parseFloat(selling.incentiveValue || 0);
  }

  // Additional line items on selling side are ADDITIONS to revenue
  const totalAdditional = selling.discounts.reduce((sum, item) => {
    const v = parseFloat(item.amount) || 0;
    return sum + (item.type === "fixed" ? v : (baseBeforeVAT * v) / 100);
  }, 0);

  // ✅ VAT is based on the ORIGINAL base (not reduced by incentive)
  const vatAmount = selling.vatIncluded
    ? sellingPrice - baseBeforeVAT
    : baseBeforeVAT * vatRate;

  // ✅ GROSS (before VAT) reflects the incentive
  const grossRevenue = baseBeforeVAT - incentiveValue + totalAdditional;

  // ✅ NET (after VAT) does NOT reflect the incentive; it's your receivable
  const netRevenue = baseBeforeVAT + vatAmount + totalAdditional;

  return {
    baseBeforeVAT,
    vatAmount,
    incentiveValue,
    totalAdditional,
    grossRevenue, // shown as "GROSS REVENUE (before VAT)"
    netRevenue,   // shown as "NET REVENUE (after VAT)" / Total Receivable
  };
};

  const buyingCalculation = calculateNetBuying();
  const sellingCalc = calculateNetSelling();

  const convertedBuying =
    buying.currency !== selling.currency && exchangeRate
      ? buyingCalculation.netValue * parseFloat(exchangeRate)
      : buyingCalculation.netValue;

  // ✅ Profit uses netRevenue from selling side
  const profit = (sellingCalc.netRevenue || 0) - (convertedBuying || 0);
  const profitMarginPercent =
    (sellingCalc.netRevenue || 0) > 0
      ? (profit / sellingCalc.netRevenue) * 100
      : 0;

  const getCurrencySymbol = (currencyCode) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };
const handleSaveCommercial = async () => {
  if (!selectedBookingId) {
    alert("⚠️ Please select a Booking Ticket first!");
    return;
  }

  const payload = {
    bookingId: parseInt(selectedBookingId),
    buyingCurrency: buying.currency,
    buyingAmount: parseFloat(buying.amount || 0),
    commissionable: buying.commissionable,
    commissionType: buying.commissionType,
    commissionValue: parseFloat(buying.commissionValue || 0),
    buyingVatIncluded: buying.vatIncluded,
    buyingVatPercent: parseFloat(buying.vatPercent || 0),
    additionalCostsJson: JSON.stringify(buying.additionalCosts),
    sellingCurrency: selling.currency,
    sellingPrice: parseFloat(selling.price || 0),
    incentive: selling.incentive,
    incentiveType: selling.incentiveType,
    incentiveValue: parseFloat(selling.incentiveValue || 0),
    sellingVatIncluded: selling.vatIncluded,
    sellingVatPercent: parseFloat(selling.vatPercent || 0),
    discountsJson: JSON.stringify(selling.discounts),
    exchangeRate: parseFloat(exchangeRate || 1),
    autoCalculateRate,
  };

  try {
    setLoading(true);

    let existing = null;
try {
  existing = await getCommercialByBooking(selectedBookingId);
} catch (err) {
  if (err.response && err.response.status === 404) {
    console.log("No existing commercial found — will create a new one.");
    existing = null; // allow creation
  } else {
    throw err; // real error
  }
}

    let commercialId;

    if (existing && existing.id) {
      const res = await updateCommercial(existing.id, payload);
      commercialId = res.id || existing.id;
      alert("✅ Commercial updated successfully!");
    } else {
      const res = await createCommercial(payload);
      commercialId = res.id;
      alert("✅ Commercial created successfully!");
    }

    // ✅ Ensure booking is linked
    if (commercialId) {
      await linkCommercialToBooking(selectedBookingId, commercialId);
    }
     setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  } catch (err) {
  console.error("Error saving commercial:", err);

  setSaveStatus("error");

  // 🔍 Extract deeper backend reason
  let reason = "Unknown error occurred.";

  if (err.response) {
    const { status, data } = err.response;
    if (data?.error) {
      reason = data.error; // our backend uses { error: "..." }
    } else if (data?.title) {
      reason = data.title;
    } else if (data?.errors) {
      // Collect validation messages from ASP.NET
      reason = Object.entries(data.errors)
        .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
        .join("\n");
    } else {
      reason = JSON.stringify(data, null, 2);
    }
    reason = `HTTP ${status} — ${reason}`;
  } else if (err.message) {
    reason = err.message;
  }

  // 🧾 Display clearly to user
  alert(`❌ Failed to save commercial:\n\n${reason}`);

  setTimeout(() => setSaveStatus("idle"), 3000);
} finally {
  setLoading(false);
}
};

const [profitSummary, setProfitSummary] = useState({
  profit: 0,
  profitMarginPercent: 0,
  markup: 0,
});

useEffect(() => {
  const buyingCalc = calculateNetBuying();
  const sellingCalc = calculateNetSelling();
  const convertedBuying =
    buying.currency !== selling.currency && exchangeRate
      ? buyingCalc.netValue * parseFloat(exchangeRate)
      : buyingCalc.netValue;

  const profitValue = (sellingCalc.netRevenue || 0) - (convertedBuying || 0);
  const profitMargin =
    (sellingCalc.netRevenue || 0) > 0
      ? (profitValue / sellingCalc.netRevenue) * 100
      : 0;
  const markupValue =
    convertedBuying > 0 ? (profitValue / convertedBuying) * 100 : 0;

  setProfitSummary({
    profit: profitValue,
    profitMarginPercent: profitMargin,
    markup: markupValue,
  });
}, [buying, selling, exchangeRate]);

  const resetCommercialForm = () => {
    setBuying({
      currency: "USD",
      amount: "",
      commissionable: false,
      commissionType: "percentage",
      commissionValue: "",
      vatIncluded: false,
      vatPercent: "18",
      additionalCosts: [{ id: 1, description: "", amount: "", type: "fixed" }],
    });
    setSelling({
      currency: "USD",
      price: "",
      incentive: false,
      incentiveType: "percentage",
      incentiveValue: "",
      vatIncluded: false,
      vatPercent: "18",
      discounts: [{ id: 1, description: "", amount: "", type: "fixed" }],
    });
    setExchangeRate("");
    setAutoCalculateRate(false);
  };

 useEffect(() => {
  if (!selectedBookingId) return;

  // Clear old values first
  resetCommercialForm();
  setLoading(true);

  const fetchExistingCommercial = async () => {
    try {
      const data = await getCommercialByBooking(selectedBookingId);
      if (data) {
        // ✅ Pre-fill existing data
        setBuying({
          currency: data.buyingCurrency || "USD",
          amount: data.buyingAmount || "",
           commissionable:
              data.commissionable ||
              (data.commissionValue && parseFloat(data.commissionValue) > 0)
                ? true
                : false,
          commissionType: data.commissionType || "percentage",
          commissionValue: data.commissionValue || "",
          vatIncluded: data.buyingVatIncluded || false,
          vatPercent: data.buyingVatPercent?.toString() || "18",
          additionalCosts: data.additionalCostsJson
            ? JSON.parse(data.additionalCostsJson)
            : [{ id: 1, description: "", amount: "", type: "fixed" }],
        });

        setSelling({
          currency: data.sellingCurrency || "USD",
          price: data.sellingPrice || "",
          incentive: data.incentive || false,
          incentiveType: data.incentiveType || "percentage",
          incentiveValue: data.incentiveValue || "",
          vatIncluded: data.sellingVatIncluded || false,
          vatPercent: data.sellingVatPercent?.toString() || "18",
          discounts: data.discountsJson
            ? JSON.parse(data.discountsJson)
            : [{ id: 1, description: "", amount: "", type: "fixed" }],
        });

        setExchangeRate(data.exchangeRate || 1);
        setAutoCalculateRate(data.autoCalculateRate || false);
      } else {
        resetCommercialForm();
      }
    } catch (err) {
      console.warn("No existing commercial or failed fetch:", err.message);
      resetCommercialForm();
    } finally {
      setLoading(false);
    }
  };

  fetchExistingCommercial();
}, [selectedBookingId]);
// ✅ Auto-tick commission and incentive checkboxes if their values already exist (after loading)
// ✅ Auto-tick commission and incentive checkboxes if their values exist (after loading or prefill)
// ✅ Auto-tick or untick Commission, Incentive, and VAT checkboxes dynamically
useEffect(() => {
  if (!loading) {
    // --- COMMISSION (BUYING SIDE) ---
    const commValue = parseFloat(buying.commissionValue) || 0;
    if (commValue > 0 && !buying.commissionable) {
      setBuying(prev => ({ ...prev, commissionable: true }));
    } else if ((commValue === 0 || buying.commissionValue === "" || buying.commissionValue === null) && buying.commissionable) {
      setBuying(prev => ({ ...prev, commissionable: false }));
    }

    // --- INCENTIVE (SELLING SIDE) ---
    const incValue = parseFloat(selling.incentiveValue) || 0;
    if (incValue > 0 && !selling.incentive) {
      setSelling(prev => ({ ...prev, incentive: true }));
    } else if ((incValue === 0 || selling.incentiveValue === "" || selling.incentiveValue === null) && selling.incentive) {
      setSelling(prev => ({ ...prev, incentive: false }));
    }

    // --- VAT (BUYING SIDE) ---
    const vatPercentBuy = parseFloat(buying.vatPercent) || 0;
    if (vatPercentBuy > 0 && !buying.vatIncluded) {
      setBuying(prev => ({ ...prev, vatIncluded: true }));
    } else if ((vatPercentBuy === 0 || buying.vatPercent === "" || buying.vatPercent === null) && buying.vatIncluded) {
      setBuying(prev => ({ ...prev, vatIncluded: false }));
    }

    // --- VAT (SELLING SIDE) ---
    const vatPercentSell = parseFloat(selling.vatPercent) || 0;
    if (vatPercentSell > 0 && !selling.vatIncluded) {
      setSelling(prev => ({ ...prev, vatIncluded: true }));
    } else if ((vatPercentSell === 0 || selling.vatPercent === "" || selling.vatPercent === null) && selling.vatIncluded) {
      setSelling(prev => ({ ...prev, vatIncluded: false }));
    }
  }
}, [
  loading,
  buying.commissionValue,
  selling.incentiveValue,
  buying.vatPercent,
  selling.vatPercent,
]);
useEffect(() => {
  const value = parseFloat(selling.incentiveValue);

  if (!isNaN(value) && value > 0) {
    // ✅ Auto-tick if greater than zero
    if (!selling.incentive) {
      setSelling(prev => ({ ...prev, incentive: true }));
    }
  } else {
    // ❌ Auto-untick if 0, empty, or invalid
    if (selling.incentive) {
      setSelling(prev => ({ ...prev, incentive: false }));
    }
  }
}, [selling.incentiveValue]);

// useEffect(() => {
//   if (!selectedBookingId) return;

//   const fetchExistingCommercial = async () => {
//     try {
//       const data = await getCommercialByBooking(selectedBookingId);
//       if (data) {
//         prefillCommercialData(data);
//       }
//     } catch (err) {
//       if (err.response && err.response.status === 404) {
//         resetCommercialForm(); // new record
//         console.log("No existing commercial for this booking.");
//       } else {
//         console.error("Error loading existing commercial:", err);
//       }
//     }
//   };

//   fetchExistingCommercial(); // ✅ call async inner function
// }, [selectedBookingId]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* HEADER */}
         {/* <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "24px" }}>Commercial Calculation Form</h1>
        <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
          Calculate your profit margins with detailed cost analysis
        </p>
      </div> */}
    <div className="dropdown-wrapper">
      <label className="booking-label">
        Select Booking (Ticket Number)
      </label>
      <div className="custom-dropdown">
        <div 
          className="dropdown-trigger"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsDropdownOpen(!isDropdownOpen);
            }
          }}
        >
          <span className={selectedBooking ? "selected-value" : "dropdown-placeholder"}>
            {selectedBooking 
              ? `${selectedBooking.ticketNumber} — ${selectedBooking.hotel} (${selectedBooking.agency})` 
              : "-- Select Booking --"
            }
          </span>
          <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
        </div>
        
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search bookings..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <div className="options-list">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking, index) => (
                  <div
                    key={booking.id}
                    className={`option-item ${index === highlightedIndex ? 'highlighted' : ''} ${selectedBookingId === booking.id ? 'selected' : ''}`}
                    onClick={() => handleBookingSelect(booking.id)}
                  >
                    {booking.ticketNumber} — {booking.hotel} ({booking.agency})
                  </div>
                ))
              ) : (
                <div className="no-results">No bookings found</div>
              )}
            </div>
          </div>
        )}
      </div>
     

 

      {/* TWO COLUMN GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* COST SIDE (BUYING) */}
        <div
          style={{
            background: "white",
            border: "1px solid #e1e5e9",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              borderLeft: "4px solid #dc3545",
            }}
          >
            <h3 style={{ margin: 0, color: "#dc3545" }}>Cost Side (Buying)</h3>
          </div>

          {/* Currency + Base */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ fontWeight: "bold", color: "#555" }}>Currency *</label>
              <select
                name="currency"
                value={buying.currency}
                onChange={handleBuyingChange}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "bold", color: "#555" }}>Base Amount (including VAT) *</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#666",
                  }}
                >
                  {getCurrencySymbol(buying.currency)}
                </span>
                <input
                  name="amount"
                  type="number"
                  value={buying.amount}
                  onChange={handleBuyingChange}
                  placeholder="0.00"
                  style={{ width: "100%", padding: "10px 10px 10px 30px", border: "1px solid #ddd", borderRadius: "5px" }}
                />
              </div>
            </div>
          </div>

          {/* Commission */}
          <div style={{ marginTop: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <input type="checkbox" name="commissionable" checked={buying.commissionable} onChange={handleBuyingChange} style={{ transform: "scale(1.2)" }} />
              <span style={{ fontWeight: "bold", color: "#555" }}>Commission Claim</span>
            </label>
            {buying.commissionable && (
              <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "5px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#555" }}>Type</label>
                    <select
                      name="commissionType"
                      value={buying.commissionType}
                      onChange={handleBuyingChange}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#555" }}>Value</label>
                    <input
                      name="commissionValue"
                      type="number"
                      value={buying.commissionValue}
                      onChange={handleBuyingChange}
                      placeholder={buying.commissionType === "percentage" ? "0.00%" : "0.00"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* VAT */}
          <div style={{ marginTop: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <input type="checkbox" name="vatIncluded" checked={buying.vatIncluded} onChange={handleBuyingChange} style={{ transform: "scale(1.2)" }} />
              <span style={{ fontWeight: "bold", color: "#555" }}>Include VAT</span>
            </label>
            {buying.vatIncluded && (
              <div>
                <label style={{ color: "#555" }}>VAT %</label>
                <input
                  name="vatPercent"
                  type="number"
                  onChange={handleBuyingChange}
                  value={buying.vatPercent}
                  step="0.1"
                  style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                />
              </div>
            )}
          </div>

          {/* Additional Costs */}
          <div style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h4 style={{ margin: 0, color: "#555" }}>Additional Product</h4>
              <button
                type="button"
                onClick={addAdditionalCost}
                style={{
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                + Add Product
              </button>
            </div>
            {buying.additionalCosts.map((cost) => (
              <div
                key={cost.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder="Description"
                  value={cost.description}
                  onChange={(e) => updateAdditionalCost(cost.id, "description", e.target.value)}
                  style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={cost.amount}
                  onChange={(e) => updateAdditionalCost(cost.id, "amount", e.target.value)}
                  style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                />
                <select
                  value={cost.type}
                  onChange={(e) => updateAdditionalCost(cost.id, "type", e.target.value)}
                  style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                >
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
                {buying.additionalCosts.length > 1 && (
                  <button
                    onClick={() => removeAdditionalCost(cost.id)}
                    style={{ background: "#dc3545", color: "white", border: "none", padding: "8px", borderRadius: "5px" }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Buying totals */}
          <div
            style={{
              background: "#e7f3ff",
              padding: "15px",
              borderRadius: "5px",
              marginTop: "20px",
              border: "1px solid #b3d9ff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <span style={{ fontWeight: "bold", color: "#0056b3" }}>NET VALUE (before VAT):</span>
              <span style={{ fontWeight: "bold", color: "#0056b3" }}>
                {getCurrencySymbol(buying.currency)} {(buyingCalculation.grossValue || 0).toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", color: "#0066cc" }}>GROSS PAYABLE (with VAT):</span>
              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#0066cc" }}>
                {getCurrencySymbol(buying.currency)} {(buyingCalculation.netValue || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* REVENUE SIDE (SELLING) */}
        <div
          style={{
            background: "white",
            border: "1px solid #e1e5e9",
            borderRadius: "10px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              background: "#f8f9fa",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              borderLeft: "4px solid #28a745",
            }}
          >
            <h3 style={{ margin: 0, color: "#28a745" }}>Revenue Side (Selling)</h3>
          </div>

          {/* Currency & Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ fontWeight: "bold", color: "#555" }}>Currency *</label>
              <select
                name="currency"
                value={selling.currency}
                onChange={handleSellingChange}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: "bold", color: "#555" }}>Selling Price *</label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#666",
                  }}
                >
                  {getCurrencySymbol(selling.currency)}
                </span>
                <input
                  name="price"
                  type="number"
                  value={selling.price}
                  onChange={handleSellingChange}
                  placeholder="0.00"
                  style={{ width: "100%", padding: "10px 10px 10px 30px", border: "1px solid #ddd", borderRadius: "5px" }}
                />
              </div>
            </div>
          </div>

          {/* Incentive */}
          <div style={{ marginTop: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <input type="checkbox" name="incentive" onChange={handleSellingChange} checked={selling.incentive} style={{ transform: "scale(1.2)" }} />
              <span style={{ fontWeight: "bold", color: "#555" }}>Include Incentive/Discount</span>
            </label>
            {selling.incentive && (
              <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "5px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ color: "#555" }}>Type</label>
                    <select
                      name="incentiveType"
                      value={selling.incentiveType}
                      onChange={handleSellingChange}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "#555" }}>Value</label>
                    <input
                      name="incentiveValue"
                      type="number"
                      onChange={handleSellingChange}
                      placeholder={selling.incentiveType === "percentage" ? "0.00%" : "0.00"}
                      style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* VAT */}
          <div style={{ marginTop: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <input type="checkbox" name="vatIncluded" checked={selling.vatIncluded} onChange={handleSellingChange} style={{ transform: "scale(1.2)" }} />
              <span style={{ fontWeight: "bold", color: "#555" }}>Include VAT</span>
            </label>
            {selling.vatIncluded && (
              <div>
                <label style={{ color: "#555" }}>VAT %</label>
                <input
                  name="vatPercent"
                  type="number"
                  onChange={handleSellingChange}
                  value={selling.vatPercent}
                  step="0.1"
                  style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                />
              </div>
            )}
          </div>

          {/* Discounts */}
          <div style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h4 style={{ margin: 0, color: "#555" }}>Additional Product</h4>
              <button
                type="button"
                onClick={addDiscount}
                style={{
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                + Add Product
              </button>
            </div>
            {selling.discounts.map((discount) => (
              <div
                key={discount.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder="Description"
                  value={discount.description}
                  onChange={(e) => updateDiscount(discount.id, "description", e.target.value)}
                  style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={discount.amount}
                  onChange={(e) => updateDiscount(discount.id, "amount", e.target.value)}
                  style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                />
                <select
                  value={discount.type}
                  onChange={(e) => updateDiscount(discount.id, "type", e.target.value)}
                  style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "5px" }}
                >
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
                {selling.discounts.length > 1 && (
                  <button
                    onClick={() => removeDiscount(discount.id)}
                    style={{ background: "#dc3545", color: "white", border: "none", padding: "8px", borderRadius: "5px" }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Revenue totals */}
          <div
            style={{
              background: "#e7f3ff",
              padding: "15px",
              borderRadius: "5px",
              marginTop: "20px",
              border: "1px solid #b3d9ff",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <span style={{ fontWeight: "bold", color: "#0056b3" }}>NET AMOUNT (before VAT):</span>
              <span style={{ fontWeight: "bold", color: "#0056b3" }}>
                {getCurrencySymbol(selling.currency)} {(sellingCalc.grossRevenue || 0).toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: "bold", color: "#0066cc" }}>GROSS SELLING (after VAT):</span>
              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#0066cc" }}>
                {getCurrencySymbol(selling.currency)} {(sellingCalc.netRevenue || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Exchange */}
      {buying.currency !== selling.currency && (
        <div
          style={{
            background: "white",
            border: "1px solid #e1e5e9",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ color: "#555" }}>Currency Exchange</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
            <div>
              <label style={{ fontWeight: "bold", color: "#555" }}>Exchange Rate</label>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                step="0.0001"
                placeholder="0.00"
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" }}
              />
              <small style={{ color: "#666" }}>
                1 {buying.currency} = {exchangeRate || "0"} {selling.currency}
              </small>
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  checked={autoCalculateRate}
                  onChange={(e) => setAutoCalculateRate(e.target.checked)}
                  style={{ transform: "scale(1.2)" }}
                />
                <span style={{ fontWeight: "bold", color: "#555" }}>Auto-calculate rate</span>
              </label>
              <small style={{ color: "#666" }}>Fetch current market rate</small>
            </div>
            <div
              style={{
                background: "#fff3cd",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ffeaa7",
              }}
            >
              <div style={{ fontSize: "12px", color: "#856404" }}>
                <strong>Converted Cost:</strong>
                <br />
                {getCurrencySymbol(selling.currency)} {(convertedBuying || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profit Summary */}
      <div
        style={{
          background: "white",
          border: "1px solid #e1e5e9",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ color: "#555" }}>Profit Analysis</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
          <div
            style={{
              background: profit >= 0 ? "#d4edda" : "#f8d7da",
              padding: "20px",
              borderRadius: "8px",
              border: `2px solid ${profit >= 0 ? "#c3e6cb" : "#f5c6cb"}`,
            }}
          >
            <div style={{ color: profit >= 0 ? "#155724" : "#721c24" }}>Net Profit/Loss</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: profit >= 0 ? "#155724" : "#721c24" }}>
              {getCurrencySymbol(selling.currency)} {(isNaN(profit) ? 0 : profit).toFixed(2)}
            </div>
          </div>
          <div
            style={{
              background: "#d1ecf1",
              padding: "20px",
              borderRadius: "8px",
              border: "2px solid #bee5eb",
            }}
          >
            <div style={{ color: "#0c5460" }}>Profit Margin</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0c5460" }}>
              {(isNaN(profitMarginPercent) ? 0 : profitMarginPercent).toFixed(2)}%
            </div>
          </div>
          <div
            style={{
              background: "#e2e3e5",
              padding: "20px",
              borderRadius: "8px",
              border: "2px solid #d6d8db",
            }}
          >
            <div style={{ color: "#383d41" }}>Markup Percentage</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#383d41" }}>
              {convertedBuying > 0 ? ((profit / convertedBuying) * 100).toFixed(2) : "0.00"}%
            </div>
          </div>
        </div>
      </div>

      {/* Bill-style summaries */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "30px",
         
          justifyContent: "center",
        }}
      >
        {/* COST SUMMARY */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "10px",
            marginTop: "30px",
            padding: "25px 35px",
            fontFamily: "Courier New, monospace",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            flex: "1",
          }}
        >
          <h4
            style={{
              textAlign: "center",
              marginBottom: "15px",
              fontWeight: "bold",
              color: "#222",
              letterSpacing: "1px",
              borderBottom: "2px dashed #aaa",
              paddingBottom: "5px",
            }}
          >
            COST SUMMARY (BILL STYLE)
          </h4>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              Base Cost (excluding VAT)
              {buying.vatIncluded && (
                <span style={{ color: "#777" }}> ({buying.amount || 0} incl. VAT)</span>
              )}
              :
            </span>
            <span>
              {getCurrencySymbol(buying.currency)} {(buyingCalculation.baseAmountWithoutVAT || 0).toFixed(2)}
            </span>
          </div>

          {buyingCalculation.additionalCosts > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                Additional Costs{" "}
                <span style={{ color: "#777" }}>
                  ({buying.additionalCosts.length} item{buying.additionalCosts.length > 1 ? "s" : ""})
                </span>
                :
              </span>
              <span>
                + {getCurrencySymbol(buying.currency)} {(buyingCalculation.additionalCosts || 0).toFixed(2)}
              </span>
            </div>
          )}

          {buying.commissionable && buyingCalculation.commissionAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                Commission (Your Profit)
                <span style={{ color: "#777" }}>
                  (
                  {buying.commissionType === "percentage"
                    ? `${buying.commissionValue || 0}%`
                    : `${getCurrencySymbol(buying.currency)}${buying.commissionValue || 0}`}
                  )
                </span>
                :
              </span>
              <span>
                - {getCurrencySymbol(buying.currency)} {(buyingCalculation.commissionAmount || 0).toFixed(2)}
              </span>
            </div>
          )}

          {buying.vatIncluded && buyingCalculation.vatAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                VAT <span style={{ color: "#777" }}>({buying.vatPercent || 0}%)</span>:
              </span>
              <span>
                + {getCurrencySymbol(buying.currency)} {(buyingCalculation.vatAmount || 0).toFixed(2)}
              </span>
            </div>
          )}

          <hr style={{ margin: "10px 0", border: "none", borderTop: "2px solid #999" }} />

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: "bold", color: "#555" }}>NET VALUE (before VAT):</span>
            <span style={{ fontWeight: "bold", color: "#555" }}>
              {getCurrencySymbol(buying.currency)} {(buyingCalculation.grossValue || 0).toFixed(2)}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: "bold", color: "#000" }}>GROSS VALUE (with VAT):</span>
            <span style={{ fontWeight: "bold", color: "#000" }}>
              {getCurrencySymbol(buying.currency)} {(buyingCalculation.netValue || 0).toFixed(2)}
            </span>
          </div>

          <hr style={{ margin: "15px 0", border: "none", borderTop: "3px double #333" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "18px",
              color: "#111",
              letterSpacing: "0.5px",
            }}
          >
            <span>TOTAL BILL AMOUNT:</span>
            <span>{getCurrencySymbol(buying.currency)} {(buyingCalculation.netValue || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* REVENUE SUMMARY */}
<div
  style={{
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "10px",
    marginTop: "30px",
    padding: "25px 35px",
    fontFamily: "Courier New, monospace",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    flex: "1",
  }}
>
  <h4
    style={{
      textAlign: "center",
      marginBottom: "15px",
      fontWeight: "bold",
      color: "#222",
      letterSpacing: "1px",
      borderBottom: "2px dashed #aaa",
      paddingBottom: "5px",
    }}
  >
    REVENUE SUMMARY (BILL STYLE)
  </h4>

  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span>
      Base Selling (excluding VAT)
      {selling.vatIncluded && (
        <span style={{ color: "#777" }}> ({selling.price || 0} incl. VAT)</span>
      )}
      :
    </span>
    <span>
      {getCurrencySymbol(selling.currency)}{" "}
      {(sellingCalc.baseBeforeVAT || 0).toFixed(2)}
    </span>
  </div>

  {sellingCalc.vatAmount > 0 && (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>
        VAT <span style={{ color: "#777" }}>({selling.vatPercent || 0}%)</span>:
      </span>
      <span>
        + {getCurrencySymbol(selling.currency)}{" "}
        {(sellingCalc.vatAmount || 0).toFixed(2)}
      </span>
    </div>
  )}

  {selling.incentive && sellingCalc.incentiveValue > 0 && (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>
        Incentive Given (to Supplier/Agent){" "}
        <span style={{ color: "#777" }}>
          ({selling.incentiveType === "percentage"
            ? `${selling.incentiveValue || 0}%`
            : `${getCurrencySymbol(selling.currency)}${selling.incentiveValue || 0}`}
          )
        </span>
        :
      </span>
      <span>
        - {getCurrencySymbol(selling.currency)}{" "}
        {(sellingCalc.incentiveValue || 0).toFixed(2)}
      </span>
    </div>
  )}

  {sellingCalc.discountTotal > 0 && (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>
        Additional Discounts{" "}
        <span style={{ color: "#777" }}>
          ({selling.discounts.length} item
          {selling.discounts.length > 1 ? "s" : ""})
        </span>
        :
      </span>
      <span>
        - {getCurrencySymbol(selling.currency)}{" "}
        {(sellingCalc.discountTotal || 0).toFixed(2)}
      </span>
    </div>
  )}

  <hr style={{ margin: "10px 0", border: "none", borderTop: "2px solid #999" }} />

  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span style={{ fontWeight: "bold", color: "#555" }}>
      NET REVENUE (before VAT):
    </span>
    <span style={{ fontWeight: "bold", color: "#555" }}>
      {getCurrencySymbol(selling.currency)}{" "}
      {(sellingCalc.grossRevenue || 0).toFixed(2)}
    </span>
  </div>

  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <span style={{ fontWeight: "bold", color: "#000" }}>
      GROSS REVENUE (after VAT):
    </span>
    <span style={{ fontWeight: "bold", color: "#000" }}>
      {getCurrencySymbol(selling.currency)}{" "}
      {(sellingCalc.netRevenue || 0).toFixed(2)}
    </span>
  </div>

  <hr
    style={{ margin: "15px 0", border: "none", borderTop: "3px double #333" }}
  />

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      fontWeight: "bold",
      fontSize: "18px",
      color: "#111",
      letterSpacing: "0.5px",
    }}
  >
    <span>TOTAL RECEIVABLE AMOUNT:</span>
    <span>
      {getCurrencySymbol(selling.currency)}{" "}
      {(sellingCalc.netRevenue || 0).toFixed(2)}
    </span>
  </div>
</div>

      </div>

    </div>
    {/* {selectedBookingId && (
  <p style={{ color: "#555", marginBottom: "10px" }}>
    Editing: Booking #{selectedBookingId}
    {loading && " (Loading...)"} 
  </p>
)} */}

    <button
  onClick={handleSaveCommercial}
  disabled={loading || saveStatus === 'loading'}
  className={`booking-save-button ${saveStatus !== 'idle' ? saveStatus : ''}`}
>
  {saveStatus === 'loading' ? (
    <>
      <span className="loading-spinner"></span>
      Saving...
    </>
  ) : saveStatus === 'success' ? (
    '✅ Saved!'
  ) : saveStatus === 'error' ? (
    '❌ Failed - Retry'
  ) : (
    ' Save Commercial'
  )}
</button>
    </div>
  );
}

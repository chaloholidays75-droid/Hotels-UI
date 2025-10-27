import React, { useState, useEffect } from "react";
import bookingApi from "../api/bookingApi";
import agencyApi from "../api/agencyApi";
import supplierApi from "../api/supplierApi";
import { getHotelSales } from "../api/hotelApi";
import "./BookingEditModal.css";
import {
  getCommercialByBooking,
  createCommercial,
  updateCommercial,
  linkCommercialToBooking,
} from "../api/commercialApi";
import { calculateCommercial } from "../utils/commercialCalculations";

const BookingEditModal = ({ editModal, setEditModal, closeEditModal, refreshBookings }) => {
  const [bookingData, setBookingData] = useState({
    agencyId: "",
    supplierId: "",
    hotelId: "",
    hotelName: "",
    checkIn: "",
    checkOut: "",
    numberOfRooms: 1,
    specialRequest: "",
  });

  // Separate state for rooms with their own guest details
  const [rooms, setRooms] = useState([
    {
      roomTypeId: "",
      adults: 1,
      children: 0,
      childrenAges: "",
    }
  ]);

  // Commercial Data State
  const [commercialData, setCommercialData] = useState({
    buyingAmount: "",
    buyingCurrency: "USD",
    sellingPrice: "",
    sellingCurrency: "USD",
    exchangeRate: "1.0",
    commissionable: false,
    commissionType: "percentage",
    commissionValue: "",
    incentive: false,
    incentiveType: "percentage",
    incentiveValue: "",
    buyingVatIncluded: false,
    buyingVatPercent: "0",
    sellingVatIncluded: false,
    sellingVatPercent: "0",
    additionalCosts: [],
    discounts: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [ageWarnings, setAgeWarnings] = useState({}); // Now an object to track per room
  const [agencies, setAgencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hotelsList, setHotelsList] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  
  // Search states
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  
  const [agencyQuery, setAgencyQuery] = useState("");
  const [supplierQuery, setSupplierQuery] = useState("");
  const [hotelQuery, setHotelQuery] = useState("");
  
  const [showAgencyDropdown, setShowAgencyDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  
  const [fetchLoading, setFetchLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("booking"); // "booking" or "commercial"

  const today = new Date().toISOString().slice(0, 16);

  // Calculate total people whenever rooms change
  useEffect(() => {
    const totalPeople = rooms.reduce((total, room) => 
      total + parseInt(room.adults || 0) + parseInt(room.children || 0), 0
    );
    setBookingData(prev => ({ ...prev, totalPeople }));
  }, [rooms]);

  // Update number of rooms when rooms array changes
  useEffect(() => {
    setBookingData(prev => ({ ...prev, numberOfRooms: rooms.length }));
  }, [rooms.length]);

  // Fetch room types when hotel is selected
  useEffect(() => {
    const fetchRoomTypes = async () => {
      if (bookingData.hotelId) {
        try {
          const roomTypesData = await bookingApi.getRoomTypesByHotel(bookingData.hotelId);
          setRoomTypes(roomTypesData || []);
        } catch (err) {
          console.error("Failed to fetch room types:", err);
          setRoomTypes([]);
        }
      } else {
        setRoomTypes([]);
      }
    };

    fetchRoomTypes();
  }, [bookingData.hotelId]);

  // Fetch agencies, suppliers, hotels, and commercial data when modal opens
  useEffect(() => {
    if (!editModal.isOpen) return;

    const fetchData = async () => {
      try {
        setFetchLoading(true);

        const [agencyList, supplierList, hotelsRaw] = await Promise.all([
          agencyApi.getAgencies(),
          supplierApi.getSuppliers(),
          getHotelSales(),
        ]);

        const agenciesData = agencyList || [];
        const suppliersData = supplierList || [];
        
        setAgencies(agenciesData);
        setSuppliers(suppliersData);
        setFilteredAgencies(agenciesData);
        setFilteredSuppliers(suppliersData);

        // Map hotels safely
        const allHotels = (hotelsRaw || []).map(h => ({
          id: h.id.toString(),
          hotelName: h.hotelName || "Unnamed Hotel",
        }));

        setHotelsList(allHotels);
        setFilteredHotels(allHotels);

        // Prefill booking data if editing
        if (editModal.booking) {
          const agencyMatch = agenciesData.find(a => a.agencyName === editModal.booking.agencyName);
          const supplierMatch = suppliersData.find(s => s.supplierName === editModal.booking.supplierName);
          const hotelMatch = allHotels.find(h => h.hotelName === editModal.booking.hotelName);

          // Extract rooms data from booking
          const existingRooms = editModal.booking.rooms?.map(room => ({
            roomTypeId: room.roomTypeId?.toString() || "",
            adults: room.adults || 1,
            children: room.children || 0,
            childrenAges: room.childrenAges || "",
          })) || [{
            roomTypeId: "",
            adults: 1,
            children: 0,
            childrenAges: "",
          }];

          setBookingData({
            agencyId: agencyMatch?.id || "",
            supplierId: supplierMatch?.id || "",
            hotelId: hotelMatch?.id || "",
            hotelName: hotelMatch?.hotelName || editModal.booking.hotelName || "",
            checkIn: editModal.booking.checkIn ? editModal.booking.checkIn.slice(0, 16) : "",
            checkOut: editModal.booking.checkOut ? editModal.booking.checkOut.slice(0, 16) : "",
            numberOfRooms: editModal.booking.numberOfRooms || 1,
            specialRequest: editModal.booking.specialRequest || "",
          });

          setRooms(existingRooms);
          setAgencyQuery(editModal.booking.agencyName || "");
          setSupplierQuery(editModal.booking.supplierName || "");
          setHotelQuery(editModal.booking.hotelName || "");

          // Fetch room types for the selected hotel
          if (hotelMatch?.id) {
            try {
              const roomTypesData = await bookingApi.getRoomTypesByHotel(hotelMatch.id);
              setRoomTypes(roomTypesData || []);
            } catch (err) {
              console.error("Failed to fetch room types:", err);
              setRoomTypes([]);
            }
          }

          // Fetch commercial data if available
          try {
            const commercialResponse = await getCommercialByBooking(editModal.booking.id);
            if (commercialResponse) {
              setCommercialData({
                buyingAmount: commercialResponse.buyingAmount || "",
                buyingCurrency: commercialResponse.buyingCurrency || "USD",
                sellingPrice: commercialResponse.sellingPrice || "",
                sellingCurrency: commercialResponse.sellingCurrency || "USD",
                exchangeRate: commercialResponse.exchangeRate || "1.0",
                commissionable: commercialResponse.commissionable || false,
                commissionType: commercialResponse.commissionType || "percentage",
                commissionValue: commercialResponse.commissionValue || "",
                incentive: commercialResponse.incentive || false,
                incentiveType: commercialResponse.incentiveType || "percentage",
                incentiveValue: commercialResponse.incentiveValue || "",
                buyingVatIncluded: commercialResponse.buyingVatIncluded || false,
                buyingVatPercent: commercialResponse.buyingVatPercent || "0",
                sellingVatIncluded: commercialResponse.sellingVatIncluded || false,
                sellingVatPercent: commercialResponse.sellingVatPercent || "0",
                additionalCosts: commercialResponse.additionalCostsJson ? JSON.parse(commercialResponse.additionalCostsJson) : [],
                discounts: commercialResponse.discountsJson ? JSON.parse(commercialResponse.discountsJson) : []
              });
            }
          } catch (error) {
            console.error("Failed to fetch commercial data:", error);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [editModal.isOpen, editModal.booking]);
const [commercialSummary, setCommercialSummary] = useState({
  grossBuying: 0,
  netBuying: 0,
  grossSelling: 0,
  netSelling: 0,
  profit: 0,
  margin: 0,
  markup: 0,
});

useEffect(() => {
  const buying = {
    amount: commercialData.buyingAmount,
    currency: commercialData.buyingCurrency,
    vatIncluded: commercialData.buyingVatIncluded,
    vatPercent: commercialData.buyingVatPercent,
    commissionable: commercialData.commissionable,
    commissionType: commercialData.commissionType,
    commissionValue: commercialData.commissionValue,
    additionalCosts: commercialData.additionalCosts,
  };

  const selling = {
    price: commercialData.sellingPrice,
    currency: commercialData.sellingCurrency,
    vatIncluded: commercialData.sellingVatIncluded,
    vatPercent: commercialData.sellingVatPercent,
    incentive: commercialData.incentive,
    incentiveType: commercialData.incentiveType,
    incentiveValue: commercialData.incentiveValue,
    discounts: commercialData.discounts,
  };

  const result = calculateCommercial(buying, selling, commercialData.exchangeRate);
  setCommercialSummary(result);
}, [commercialData]);

  // Filter functions
  useEffect(() => {
    const filtered = agencies.filter(a =>
      a.agencyName.toLowerCase().includes(agencyQuery.toLowerCase())
    );
    setFilteredAgencies(filtered);
  }, [agencyQuery, agencies]);

  useEffect(() => {
    const filtered = suppliers.filter(s =>
      s.supplierName.toLowerCase().includes(supplierQuery.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  }, [supplierQuery, suppliers]);

  useEffect(() => {
    const filtered = hotelsList.filter(h =>
      h.hotelName.toLowerCase().includes(hotelQuery.toLowerCase())
    );
    setFilteredHotels(filtered);
  }, [hotelQuery, hotelsList]);

  // Generic handler for dropdown selection
  const handleDropdownSelect = async (type, id, name) => {
    setBookingData(prev => ({ 
      ...prev, 
      [`${type}Id`]: id,
      ...(type === 'hotel' && { hotelName: name })
    }));
    
    if (type === 'agency') {
      setAgencyQuery(name);
      setShowAgencyDropdown(false);
    } else if (type === 'supplier') {
      setSupplierQuery(name);
      setShowSupplierDropdown(false);
    } else if (type === 'hotel') {
      setHotelQuery(name);
      setShowHotelDropdown(false);
      
      // Fetch room types when hotel is selected
      try {
        const roomTypesData = await bookingApi.getRoomTypesByHotel(id);
        setRoomTypes(roomTypesData || []);
        // Reset room type selections when hotel changes
        setRooms(prev => prev.map(room => ({ ...room, roomTypeId: "" })));
      } catch (err) {
        console.error("Failed to fetch room types:", err);
        setRoomTypes([]);
      }
    }

    if (errors[`${type}Id`]) {
      setErrors(prev => ({ ...prev, [`${type}Id`]: "" }));
    }
  };

  // Handle search input changes
  const handleSearchChange = (type, value) => {
    if (type === 'agency') {
      setAgencyQuery(value);
      setShowAgencyDropdown(true);
      if (bookingData.agencyId) setBookingData(prev => ({ ...prev, agencyId: "" }));
    } else if (type === 'supplier') {
      setSupplierQuery(value);
      setShowSupplierDropdown(true);
      if (bookingData.supplierId) setBookingData(prev => ({ ...prev, supplierId: "" }));
    } else if (type === 'hotel') {
      setHotelQuery(value);
      setShowHotelDropdown(true);
      if (bookingData.hotelName !== value) {
        setBookingData(prev => ({ ...prev, hotelId: "" }));
        setRoomTypes([]);
        setRooms(prev => prev.map(room => ({ ...room, roomTypeId: "" })));
      }
    }
  };

  // Handle booking data changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle commercial data changes
  const handleCommercialChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCommercialData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle room changes
  const handleRoomChange = (index, field, value) => {
    setRooms(prev => prev.map((room, i) => 
      i === index ? { ...room, [field]: value } : room
    ));

    // Clear errors for this field
    if (errors[`room_${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`room_${index}_${field}`]: "" }));
    }
  };

  // Handle children ages input with per-room warnings
  const handleChildrenAgesChange = (index, value) => {
    setRooms(prev => prev.map((room, i) => 
      i === index ? { ...room, childrenAges: value } : room
    ));

    if (!value) {
      setAgeWarnings(prev => ({ ...prev, [index]: [] }));
      return;
    }

    const ages = value.split(",").map(a => a.trim());
    const warnings = [];
    ages.forEach((age, idx) => {
      const n = parseInt(age);
      if (isNaN(n)) warnings.push(`Child ${idx + 1} has invalid age`);
      else if (n > 12) warnings.push(`Child ${idx + 1} (age ${age}) will be counted as adult`);
      else if (n < 0) warnings.push(`Child ${idx + 1} age cannot be negative`);
    });
    setAgeWarnings(prev => ({ ...prev, [index]: warnings }));
  };

  // Add room
  const addRoom = () => {
    setRooms(prev => [...prev, {
      roomTypeId: "",
      adults: 1,
      children: 0,
      childrenAges: "",
    }]);
  };

  // Remove room
  const removeRoom = () => {
    if (rooms.length > 1) {
      setRooms(prev => prev.slice(0, -1));
    }
  };

  // Add additional cost
  const addAdditionalCost = () => {
    setCommercialData(prev => ({
      ...prev,
      additionalCosts: [...prev.additionalCosts, { description: "", amount: "" }]
    }));
  };

  // Remove additional cost
  const removeAdditionalCost = (index) => {
    setCommercialData(prev => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((_, i) => i !== index)
    }));
  };

  // Handle additional cost change
  const handleAdditionalCostChange = (index, field, value) => {
    setCommercialData(prev => ({
      ...prev,
      additionalCosts: prev.additionalCosts.map((cost, i) => 
        i === index ? { ...cost, [field]: value } : cost
      )
    }));
  };

  // Add discount
  const addDiscount = () => {
    setCommercialData(prev => ({
      ...prev,
      discounts: [...prev.discounts, { description: "", amount: "" }]
    }));
  };

  // Remove discount
  const removeDiscount = (index) => {
    setCommercialData(prev => ({
      ...prev,
      discounts: prev.discounts.filter((_, i) => i !== index)
    }));
  };

  // Handle discount change
  const handleDiscountChange = (index, field, value) => {
    setCommercialData(prev => ({
      ...prev,
      discounts: prev.discounts.map((discount, i) => 
        i === index ? { ...discount, [field]: value } : discount
      )
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Booking level validations
    if (!bookingData.agencyId) newErrors.agencyId = "Please select an agency";
    if (!bookingData.supplierId) newErrors.supplierId = "Please select a supplier";
    if (!bookingData.hotelId) newErrors.hotelId = "Please select a hotel";
    if (!bookingData.checkIn) newErrors.checkIn = "Check-in is required";
    if (!bookingData.checkOut) newErrors.checkOut = "Check-out is required";
    if (bookingData.numberOfRooms < 1) newErrors.numberOfRooms = "At least 1 room is required";

    // Room level validations
    rooms.forEach((room, index) => {
      if (!room.roomTypeId) newErrors[`room_${index}_roomTypeId`] = "Room type is required";
      if (room.adults < 1) newErrors[`room_${index}_adults`] = "At least 1 adult is required";
      if (room.children < 0) newErrors[`room_${index}_children`] = "Children cannot be negative";
      if (room.children > 0 && !room.childrenAges) {
        newErrors[`room_${index}_childrenAges`] = "Children ages required";
      }
      
      // Validate children ages count matches children number
      if (room.children > 0 && room.childrenAges) {
        const agesArray = room.childrenAges.split(',').map(age => age.trim()).filter(age => age !== '');
        if (agesArray.length !== parseInt(room.children)) {
          newErrors[`room_${index}_childrenAges`] = `Number of children ages (${agesArray.length}) must match number of children (${room.children})`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save changes
  const handleSave = async () => {
    try {
      // Validate form before saving
      if (!validateForm()) return;

      // Auto calculate numberOfRooms and numberOfPeople
      const numberOfRooms = rooms.length;
      const numberOfPeople = rooms.reduce(
        (sum, r) => sum + (parseInt(r.adults) || 0) + (parseInt(r.children) || 0),
        0
      );

      // Convert childrenAges from string "5,7" → [5,7]
      const bookingRooms = rooms.map((room) => ({
        roomTypeId: parseInt(room.roomTypeId),
        adults: parseInt(room.adults),
        children: parseInt(room.children),
        childrenAges: room.childrenAges
          ? room.childrenAges.split(",").map((a) => parseInt(a.trim()))
          : []
      }));

      // Build payload
      const bookingPayload = {
        agencyId: parseInt(bookingData.agencyId),
        supplierId: parseInt(bookingData.supplierId),
        hotelId: parseInt(bookingData.hotelId),
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        status: editModal.booking?.status || "Pending",
        specialRequest: bookingData.specialRequest || "",
        numberOfRooms,
        numberOfPeople,
        bookingRooms
      };

      console.log("Sending payload:", bookingPayload);

      // Send update request
      await bookingApi.updateBooking(editModal.booking.id, bookingPayload);

      // Save commercial data if it exists
      if (commercialData.buyingAmount || commercialData.sellingPrice) {
 const commercialPayload = {
  bookingId: editModal.booking.id,
  buyingCurrency: commercialData.buyingCurrency,
  sellingCurrency: commercialData.sellingCurrency,
  exchangeRate: parseFloat(commercialData.exchangeRate || 1),

  buyingAmount: parseFloat(commercialData.buyingAmount || 0),
  buyingVatIncluded: !!commercialData.buyingVatIncluded,
  buyingVatPercent: parseFloat(commercialData.buyingVatPercent || 0),

  sellingPrice: parseFloat(commercialData.sellingPrice || 0),
  sellingVatIncluded: !!commercialData.sellingVatIncluded,
  sellingVatPercent: parseFloat(commercialData.sellingVatPercent || 0),

  commissionable: !!commercialData.commissionable,
  commissionType: commercialData.commissionType,
  commissionValue: parseFloat(commercialData.commissionValue || 0),

  incentive: !!commercialData.incentive,
  incentiveType: commercialData.incentiveType,
  incentiveValue: parseFloat(commercialData.incentiveValue || 0),

  additionalCostsJson: JSON.stringify(commercialData.additionalCosts || []),
  discountsJson: JSON.stringify(commercialData.discounts || [])
};

          console.log("💼 Sending Commercial payload:", commercialPayload);
 try {
  console.group("🧾 COMMERCIAL DEBUG LOG");
  console.log("📤 Payload sent to backend:", commercialPayload);

  const existing = await getCommercialByBooking(editModal.booking.id);
  console.log("🔍 Existing commercial from backend:", existing);

  let commercialId;
  if (existing && existing.id) {
    console.log("➡️ Updating commercial ID:", existing.id);
    const res = await updateCommercial(existing.id, commercialPayload);
    console.log("✅ Backend update response:", res);
    commercialId = res.id || existing.id;
  } else {
    console.log("➡️ Creating new commercial");
    const res = await createCommercial(commercialPayload);
    console.log("✅ Backend create response:", res);
    commercialId = res.id;
  }

  if (commercialId) {
    console.log(`🔗 Linking Booking ${editModal.booking.id} to Commercial ${commercialId}`);
    const linkRes = await linkCommercialToBooking(editModal.booking.id, commercialId);
    console.log("✅ Link response:", linkRes);
  }

  console.groupEnd();
} catch (error) {
  console.error("❌ Failed to save or link commercial data:", error);
  if (error.response) {
    console.error("📥 Backend Response Data:", error.response.data);
    console.error("📥 Backend Status:", error.response.status);
  }
}
      alert("✅ Booking & Commercial saved successfully!");
      refreshBookings();
      closeEditModal();
      }
    }
    catch (error) {
      console.error("❌ Update failed:", error);
      alert("Failed to update booking!");
    }
  }
  
    //     // 5️⃣ Link Booking ↔ Commercial
    //     if (commercialId) {
    //       await linkCommercialToBooking(editModal.booking.id, commercialId);
    //       console.log(`🔗 Linked Booking ${editModal.booking.id} with Commercial ${commercialId}`);
    //     }
    //   } catch (error) {
    //     console.error("❌ Failed to save or link commercial data:", error);
    //   }
    // }

    // alert("✅ Booking & Commercial saved successfully!");
    // refreshBookings();
    // closeEditModal();
  // } catch (error) {
  //   console.error("❌ Update failed:", error);
  //   alert("Failed to update booking!");
  // }


  if (!editModal.isOpen) return null;

  return (
    <div className="booking-edit-modal-overlay">
      <div className="booking-edit-modal-content">
        <div className="booking-edit-modal-header">
          <h2 className="booking-edit-modal-title">Edit Booking</h2>
          <button className="booking-edit-modal-close" onClick={closeEditModal} disabled={loading}>×</button>
        </div>

        {/* Tab Navigation */}
        <div className="booking-edit-modal-tabs">
          <button 
            className={`booking-edit-modal-tab ${activeTab === "booking" ? "active" : ""}`}
            onClick={() => setActiveTab("booking")}
          >
            Booking Details
          </button>
          <button 
            className={`booking-edit-modal-tab ${activeTab === "commercial" ? "active" : ""}`}
            onClick={() => setActiveTab("commercial")}
          >
            Commercial Data
          </button>
        </div>

        <div className="booking-edit-modal-body">
          {fetchLoading ? (
            <div className="booking-edit-modal-loading">
              <div className="booking-edit-modal-spinner"></div>
              <p>Loading booking data...</p>
            </div>
          ) : (
            <div className="booking-edit-modal-form-sections">
              {/* Booking Details Tab */}
              {activeTab === "booking" && (
                <>
                  {/* Booking Details Section */}
                  <div className="booking-edit-modal-section">
                    <h3 className="booking-edit-modal-section-title">Booking Details</h3>
                    <div className="booking-edit-modal-section-grid">
                      {/* Agency Search Dropdown */}
                      <div className="booking-edit-modal-form-group">
                        <label>Agency *</label>
                        <div className="booking-edit-modal-search-dropdown">
                          <input
                            type="text"
                            value={agencyQuery}
                            placeholder="Search agency..."
                            onChange={e => handleSearchChange('agency', e.target.value)}
                            onFocus={() => setShowAgencyDropdown(true)}
                            onBlur={() => setTimeout(() => setShowAgencyDropdown(false), 200)}
                            disabled={loading}
                          />
                          {showAgencyDropdown && filteredAgencies.length > 0 && (
                            <div className="booking-edit-modal-search-dropdown-list">
                              {filteredAgencies.map(agency => (
                                <div 
                                  key={agency.id} 
                                  onClick={() => handleDropdownSelect('agency', agency.id, agency.agencyName)}
                                >
                                  {agency.agencyName}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {errors.agencyId && <div className="booking-edit-modal-error-message">{errors.agencyId}</div>}
                      </div>

                      {/* Supplier Search Dropdown */}
                      <div className="booking-edit-modal-form-group">
                        <label>Supplier *</label>
                        <div className="booking-edit-modal-search-dropdown">
                          <input
                            type="text"
                            value={supplierQuery}
                            placeholder="Search supplier..."
                            onChange={e => handleSearchChange('supplier', e.target.value)}
                            onFocus={() => setShowSupplierDropdown(true)}
                            onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                            disabled={loading}
                          />
                          {showSupplierDropdown && filteredSuppliers.length > 0 && (
                            <div className="booking-edit-modal-search-dropdown-list">
                              {filteredSuppliers.map(supplier => (
                                <div 
                                  key={supplier.id} 
                                  onClick={() => handleDropdownSelect('supplier', supplier.id, supplier.supplierName)}
                                >
                                  {supplier.supplierName}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {errors.supplierId && <div className="booking-edit-modal-error-message">{errors.supplierId}</div>}
                      </div>

                      {/* Hotel Search Dropdown */}
                      <div className="booking-edit-modal-form-group">
                        <label>Hotel *</label>
                        <div className="booking-edit-modal-search-dropdown">
                          <input
                            type="text"
                            value={hotelQuery}
                            placeholder="Search hotel..."
                            onChange={e => handleSearchChange('hotel', e.target.value)}
                            onFocus={() => setShowHotelDropdown(true)}
                            onBlur={() => setTimeout(() => setShowHotelDropdown(false), 200)}
                            disabled={loading}
                          />
                          {showHotelDropdown && filteredHotels.length > 0 && (
                            <div className="booking-edit-modal-search-dropdown-list">
                              {filteredHotels.map(hotel => (
                                <div 
                                  key={hotel.id} 
                                  onClick={() => handleDropdownSelect('hotel', hotel.id, hotel.hotelName)}
                                >
                                  {hotel.hotelName}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {errors.hotelId && <div className="booking-edit-modal-error-message">{errors.hotelId}</div>}
                      </div>

                      {/* Total People Display */}
                      <div className="booking-edit-modal-form-group">
                        <label>Total People</label>
                        <div className="booking-edit-modal-total-display">
                          {bookingData.totalPeople || 0} people
                        </div>
                        <div className="booking-edit-modal-hint">
                          {rooms.length} room(s) with {bookingData.totalPeople || 0} total guests
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dates Section */}
                  <div className="booking-edit-modal-section">
                    <h3 className="booking-edit-modal-section-title">Dates</h3>
                    <div className="booking-edit-modal-section-grid">
                      <div className="booking-edit-modal-form-group">
                        <label>Check-In *</label>
                        <input type="datetime-local" value={bookingData.checkIn} name="checkIn" onChange={handleChange} min={today} disabled={loading} />
                        {errors.checkIn && <div className="booking-edit-modal-error-message">{errors.checkIn}</div>}
                      </div>

                      <div className="booking-edit-modal-form-group">
                        <label>Check-Out *</label>
                        <input type="datetime-local" value={bookingData.checkOut} name="checkOut" onChange={handleChange} min={bookingData.checkIn || today} disabled={loading} />
                        {errors.checkOut && <div className="booking-edit-modal-error-message">{errors.checkOut}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Room Details Section */}
                  <div className="booking-edit-modal-section">
                    <h3 className="booking-edit-modal-section-title">Room Details</h3>
                    <div className="booking-edit-modal-rooms-section">
                      <div className="booking-edit-modal-rooms-header">
                        <span>Rooms ({rooms.length})</span>
                        <div className="booking-edit-modal-room-actions">
                          <button type="button" className="booking-edit-modal-add-room" onClick={addRoom} disabled={loading}>
                            + Add Room
                          </button>
                          <button type="button" className="booking-edit-modal-remove-room" onClick={removeRoom} disabled={loading || rooms.length <= 1}>
                            - Remove Room
                          </button>
                        </div>
                      </div>
                      
                      <div className="booking-edit-modal-room-list">
                        {rooms.map((room, index) => (
                          <div key={index} className="booking-edit-modal-room-item">
                            <h4>Room {index + 1}</h4>
                            <div className="booking-edit-modal-room-grid">
                              {/* Room Type */}
                              <div className="booking-edit-modal-form-group">
                                <label>Room Type *</label>
                                <select 
                                  value={room.roomTypeId} 
                                  onChange={(e) => handleRoomChange(index, 'roomTypeId', e.target.value)}
                                  disabled={loading || !bookingData.hotelId || roomTypes.length === 0}
                                >
                                  <option value="">
                                    {!bookingData.hotelId 
                                      ? "Select a hotel first" 
                                      : roomTypes.length === 0 
                                        ? "Loading room types..." 
                                        : "Select a room type"
                                    }
                                  </option>
                                  {roomTypes.map(roomType => (
                                    <option key={roomType.id} value={roomType.id}>
                                      {roomType.name}
                                    </option>
                                  ))}
                                </select>
                                {errors[`room_${index}_roomTypeId`] && (
                                  <div className="booking-edit-modal-error-message">{errors[`room_${index}_roomTypeId`]}</div>
                                )}
                              </div>

                              {/* Adults */}
                              <div className="booking-edit-modal-form-group">
                                <label>Adults *</label>
                                <input 
                                  type="number" 
                                  value={room.adults} 
                                  min="1" 
                                  onChange={(e) => handleRoomChange(index, 'adults', e.target.value)}
                                  disabled={loading}
                                />
                                {errors[`room_${index}_adults`] && (
                                  <div className="booking-edit-modal-error-message">{errors[`room_${index}_adults`]}</div>
                                )}
                              </div>

                              {/* Children */}
                              <div className="booking-edit-modal-form-group">
                                <label>Children</label>
                                <input 
                                  type="number" 
                                  value={room.children} 
                                  min="0" 
                                  onChange={(e) => handleRoomChange(index, 'children', e.target.value)}
                                  disabled={loading}
                                />
                                {errors[`room_${index}_children`] && (
                                  <div className="booking-edit-modal-error-message">{errors[`room_${index}_children`]}</div>
                                )}
                              </div>

                              {/* Children Ages */}
                              {room.children > 0 && (
                                <div className="booking-edit-modal-form-group">
                                  <label>Children Ages *</label>
                                  <input 
                                    type="text" 
                                    value={room.childrenAges} 
                                    onChange={(e) => handleChildrenAgesChange(index, e.target.value)}
                                    placeholder="e.g., 5, 8, 10" 
                                    disabled={loading}
                                  />
                                  <div className="booking-edit-modal-hint">Enter ages separated by commas</div>
                                  {ageWarnings[index]?.map((w, idx) => (
                                    <div key={idx} className="booking-edit-modal-warning-message">{w}</div>
                                  ))}
                                  {errors[`room_${index}_childrenAges`] && (
                                    <div className="booking-edit-modal-error-message">{errors[`room_${index}_childrenAges`]}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Extras Section */}
                  <div className="booking-edit-modal-section">
                    <h3 className="booking-edit-modal-section-title">Extras</h3>
                    <div className="booking-edit-modal-form-group">
                      <label>Special Request</label>
                      <textarea value={bookingData.specialRequest} name="specialRequest" onChange={handleChange} rows="3" disabled={loading} />
                    </div>
                  </div>
                </>
              )}

              {/* Commercial Data Tab */}
              {activeTab === "commercial" && (
                <div className="booking-edit-modal-section">
                  <h3 className="booking-edit-modal-section-title">Commercial Data</h3>
                  
                  {/* Currency Section */}
                  <div className="booking-edit-modal-section-grid">
                    <div className="booking-edit-modal-form-group">
                      <label>Buying Currency</label>
                      <select name="buyingCurrency" value={commercialData.buyingCurrency} onChange={handleCommercialChange}>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>

                    <div className="booking-edit-modal-form-group">
                      <label>Selling Currency</label>
                      <select name="sellingCurrency" value={commercialData.sellingCurrency} onChange={handleCommercialChange}>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>

                    {commercialData.buyingCurrency !== commercialData.sellingCurrency && (
                      <div className="booking-edit-modal-form-group">
                        <label>Exchange Rate</label>
                        <input 
                          type="number" 
                          step="0.0001"
                          name="exchangeRate" 
                          value={commercialData.exchangeRate} 
                          onChange={handleCommercialChange}
                          placeholder="1.0"
                        />
                        <div className="booking-edit-modal-hint">
                          1 {commercialData.buyingCurrency} = {commercialData.exchangeRate} {commercialData.sellingCurrency}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buying Side */}
                  <div className="booking-edit-modal-subsection">
                    <h4 className="booking-edit-modal-subsection-title">Cost Side (Buying)</h4>
                    <div className="booking-edit-modal-section-grid">
                      <div className="booking-edit-modal-form-group">
                        <label>Base Amount</label>
                        <input 
                          type="number" 
                          step="0.01"
                          name="buyingAmount" 
                          value={commercialData.buyingAmount} 
                          onChange={handleCommercialChange}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="booking-edit-modal-form-group">
                        <label className="booking-edit-modal-checkbox-label">
                          <input 
                            type="checkbox" 
                            name="buyingVatIncluded" 
                            checked={commercialData.buyingVatIncluded} 
                            onChange={handleCommercialChange}
                          />
                          VAT Included
                        </label>
                      </div>

                      {commercialData.buyingVatIncluded && (
                        <div className="booking-edit-modal-form-group">
                          <label>VAT Percentage</label>
                          <input 
                            type="number" 
                            step="0.01"
                            name="buyingVatPercent" 
                            value={commercialData.buyingVatPercent} 
                            onChange={handleCommercialChange}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>

                    {/* Additional Costs */}
                    <div className="booking-edit-modal-form-group">
                      <div className="booking-edit-modal-array-header">
                        <label>Additional Costs</label>
                        <button type="button" className="booking-edit-modal-add-item" onClick={addAdditionalCost}>
                          + Add Cost
                        </button>
                      </div>
                      
                      {commercialData.additionalCosts.map((cost, index) => (
                        <div key={index} className="booking-edit-modal-array-item">
                          <input 
                            type="text" 
                            value={cost.description} 
                            onChange={(e) => handleAdditionalCostChange(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                          <input 
                            type="number" 
                            step="0.01"
                            value={cost.amount} 
                            onChange={(e) => handleAdditionalCostChange(index, 'amount', e.target.value)}
                            placeholder="Amount"
                          />
                          <button 
                            type="button" 
                            className="booking-edit-modal-remove-item"
                            onClick={() => removeAdditionalCost(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Commission */}
                    <div className="booking-edit-modal-section-grid">
                      <div className="booking-edit-modal-form-group">
                        <label className="booking-edit-modal-checkbox-label">
                          <input 
                            type="checkbox" 
                            name="commissionable" 
                            checked={commercialData.commissionable} 
                            onChange={handleCommercialChange}
                          />
                          Commissionable
                        </label>
                      </div>

                      {commercialData.commissionable && (
                        <>
                          <div className="booking-edit-modal-form-group">
                            <label>Commission Type</label>
                            <select name="commissionType" value={commercialData.commissionType} onChange={handleCommercialChange}>
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                          </div>

                          <div className="booking-edit-modal-form-group">
                            <label>Commission Value</label>
                            <input 
                              type="number" 
                              step="0.01"
                              name="commissionValue" 
                              value={commercialData.commissionValue} 
                              onChange={handleCommercialChange}
                              placeholder={commercialData.commissionType === "percentage" ? "0.00%" : "0.00"}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Selling Side */}
                  <div className="booking-edit-modal-subsection">
                    <h4 className="booking-edit-modal-subsection-title">Revenue Side (Selling)</h4>
                    <div className="booking-edit-modal-section-grid">
                      <div className="booking-edit-modal-form-group">
                        <label>Selling Price</label>
                        <input 
                          type="number" 
                          step="0.01"
                          name="sellingPrice" 
                          value={commercialData.sellingPrice} 
                          onChange={handleCommercialChange}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="booking-edit-modal-form-group">
                        <label className="booking-edit-modal-checkbox-label">
                          <input 
                            type="checkbox" 
                            name="sellingVatIncluded" 
                            checked={commercialData.sellingVatIncluded} 
                            onChange={handleCommercialChange}
                          />
                          VAT Included
                        </label>
                      </div>

                      {commercialData.sellingVatIncluded && (
                        <div className="booking-edit-modal-form-group">
                          <label>VAT Percentage</label>
                          <input 
                            type="number" 
                            step="0.01"
                            name="sellingVatPercent" 
                            value={commercialData.sellingVatPercent} 
                            onChange={handleCommercialChange}
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>

                    {/* Discounts */}
                    <div className="booking-edit-modal-form-group">
                      <div className="booking-edit-modal-array-header">
                        <label>Discounts</label>
                        <button type="button" className="booking-edit-modal-add-item" onClick={addDiscount}>
                          + Add Discount
                        </button>
                      </div>
                      
                      {commercialData.discounts.map((discount, index) => (
                        <div key={index} className="booking-edit-modal-array-item">
                          <input 
                            type="text" 
                            value={discount.description} 
                            onChange={(e) => handleDiscountChange(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                          <input 
                            type="number" 
                            step="0.01"
                            value={discount.amount} 
                            onChange={(e) => handleDiscountChange(index, 'amount', e.target.value)}
                            placeholder="Amount"
                          />
                          <button 
                            type="button" 
                            className="booking-edit-modal-remove-item"
                            onClick={() => removeDiscount(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Incentive */}
                    <div className="booking-edit-modal-section-grid">
                      <div className="booking-edit-modal-form-group">
                        <label className="booking-edit-modal-checkbox-label">
                          <input 
                            type="checkbox" 
                            name="incentive" 
                            checked={commercialData.incentive} 
                            onChange={handleCommercialChange}
                          />
                          Incentive
                        </label>
                      </div>

                      {commercialData.incentive && (
                        <>
                          <div className="booking-edit-modal-form-group">
                            <label>Incentive Type</label>
                            <select name="incentiveType" value={commercialData.incentiveType} onChange={handleCommercialChange}>
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                          </div>

                          <div className="booking-edit-modal-form-group">
                            <label>Incentive Value</label>
                            <input 
                              type="number" 
                              step="0.01"
                              name="incentiveValue" 
                              value={commercialData.incentiveValue} 
                              onChange={handleCommercialChange}
                              placeholder={commercialData.incentiveType === "percentage" ? "0.00%" : "0.00"}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                    <div className="booking-commercial-summary">
                      <p>Gross Buying: {commercialSummary.grossBuying.toFixed(2)}</p>
                      <p>Net Buying: {commercialSummary.netBuying.toFixed(2)}</p>
                      <p>Gross Selling: {commercialSummary.grossSelling.toFixed(2)}</p>
                      <p>Net Selling: {commercialSummary.netSelling.toFixed(2)}</p>
                      <p>Profit: {commercialSummary.profit.toFixed(2)}</p>
                      <p>Profit Margin: {commercialSummary.margin.toFixed(2)}%</p>
                    </div>

                </div>
              )}
            </div>
          )}
        </div>

        <div className="booking-edit-modal-footer">
          <button onClick={closeEditModal} disabled={loading}>Cancel</button>
          <button onClick={handleSave} disabled={loading || fetchLoading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingEditModal;
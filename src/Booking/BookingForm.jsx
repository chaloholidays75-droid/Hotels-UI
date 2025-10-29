import React, { useState, useEffect, useRef } from "react";
import bookingApi from "../api/bookingApi";
import supplierApi from "../api/supplierApi";
import agencyApi from "../api/agencyApi";
import "./BookingForm.css";
import RoomTypeSelector from "../components/RoomTypeSelector";
import CommercialForm from "./CommercialForm";

const BookingForm = ({ initialBooking, onSaved, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(
    initialBooking || {
      agencyId: null,
      agencyName: "",
      supplierCategoryId: null,
      supplierSubCategoryId: null,
      supplierId: null,
      supplierName: "",
      hotelId: null,
      hotelName: "",
      checkIn: "",
      checkOut: "",
      nights: 0,
      numberOfRooms: 0,
      adults: 0,
      children: 0,
      totalPeople: 0,
      childrenAges: [],
      status: "Confirmed",
      deadline : "",
      specialRequest: ""
    }
  );

  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [hotelQuery, setHotelQuery] = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [rooms, setRooms] = useState(() => booking.bookingRooms || []);
  const [showHotelResults, setShowHotelResults] = useState(false);
  const [sharedRoomTypes, setSharedRoomTypes] = useState([]);


  // Search states
  const [agentSearch, setAgentSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Refs for date inputs
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);

  const today = new Date().toISOString().split("T")[0];

  // Filtered data based on search
  const filteredAgents = agents.filter(agent => 
    agent.agencyName.toLowerCase().includes(agentSearch.toLowerCase())
  );
  
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  const filteredSubCategories = subCategories.filter(subCat => 
    subCat.name.toLowerCase().includes(subCategorySearch.toLowerCase())
  );
  
  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.supplierName.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const buildRooms = (count, existing = []) => {
    const next = [...existing];
    if (count > next.length) {
      for (let i = next.length; i < count; i++) {
        next.push({
          roomTypeId: null,
          adults: 2,
          children: 0,
          childrenAges: [],
        });
      }
    } else if (count < next.length) {
      next.length = count;
    }
    next.forEach(r => {
      const c = r.children || 0;
      if (r.childrenAges.length !== c) {
        r.childrenAges = Array.from({ length: c }, (_, i) => r.childrenAges[i] ?? 0);
      }
    });
    return next;
  };

  const totalPeople = rooms.reduce((sum, r) => sum + (Number(r.adults || 0) + Number(r.children || 0)), 0);
  const totalAdults = rooms.reduce((sum, r) => sum + Number(r.adults || 0), 0);
  const totalChildren = rooms.reduce((sum, r) => sum + Number(r.children || 0), 0);

  useEffect(() => {
    setBooking(prev => ({ ...prev, bookingRooms: rooms }));
  }, [rooms]);

  useEffect(() => {
    const count = Number(booking.numberOfRooms || 0);
    setRooms(prev => buildRooms(count, prev));
  }, [booking.numberOfRooms]);

  // Hotel search
  useEffect(() => {
    if (hotelQuery.length < 2) {
      setHotels([]);
      setSearchLoading(false);
      return;
    }

    const fetchHotels = async () => {
      setSearchLoading(true);
      try {
        const hotelList = await bookingApi.searchHotels(hotelQuery);
        setHotels(Array.isArray(hotelList) ? hotelList : []);
        setShowHotelResults(true);
      } catch (err) {
        console.error(err);
        setHotels([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchHotels, 300);
    return () => clearTimeout(debounceTimer);
  }, [hotelQuery]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentList, categoryList] = await Promise.all([
          agencyApi.getAgencies(),
          supplierApi.getCategories()
        ]);
        setAgents(agentList || []);
        setCategories(categoryList || []);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };
    fetchData();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (!booking.supplierCategoryId) {
      setSubCategories([]);
      setSubCategorySearch("");
      setBooking(prev => ({
        ...prev,
        supplierSubCategoryId: null,
        supplierId: null,
        supplierName: ""
      }));
      return;
    }

    const fetchSubCategories = async () => {
      try {
        const subcats = await supplierApi.getSubCategories(booking.supplierCategoryId);
        setSubCategories(subcats || []);
      } catch (err) {
        console.error("Failed fetching subcategories:", err);
      }
    };
    fetchSubCategories();
  }, [booking.supplierCategoryId]);

  // Fetch suppliers when category or subcategory changes
  useEffect(() => {
    if (!booking.supplierCategoryId) {
      setSuppliers([]);
      setSupplierSearch("");
      return;
    }

    const fetchSuppliers = async () => {
      try {
        const supplierList = await supplierApi.getSuppliersByCategory(
          booking.supplierCategoryId,
          booking.supplierSubCategoryId
        );
        setSuppliers(supplierList || []);
      } catch (err) {
        console.error("Failed fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, [booking.supplierCategoryId, booking.supplierSubCategoryId]);

  // Calculate nights
  useEffect(() => {
    if (booking.checkIn && booking.checkOut) {
      const nights = (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24);
      setBooking(prev => ({ ...prev, nights: nights > 0 ? nights : 0 }));
    }
  }, [booking.checkIn, booking.checkOut]);

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    setBooking({ 
      ...booking, 
      hotelId: hotel.id, 
      hotelName: hotel.hotelName 
    });
    setHotelQuery(hotel.hotelName);
    setShowHotelResults(false);
  };

  // Function to open calendar when clicking on date input
  const openCalendar = (type) => {
    if (type === 'checkin' && checkInRef.current) {
      checkInRef.current.showPicker();
    } else if (type === 'checkout' && checkOutRef.current) {
      checkOutRef.current.showPicker();
    }
  };

  const handleSave = async () => {
    try {
      if (!booking.hotelId) { 
        alert("Please select a hotel."); 
        return; 
      }
      if (!booking.checkIn || !booking.checkOut) { 
        alert("Please select check-in and check-out dates."); 
        return; 
      }
      if (!rooms.length) { 
        alert("Please add at least one room."); 
        return; 
      }
      if (!booking.deadline) {
        alert("Please set a deadline before saving.");
        return;
      }

      const payload = {
        agencyId: booking.agencyId,
        supplierId: booking.supplierId,
        hotelId: booking.hotelId,
        checkIn: new Date(booking.checkIn).toISOString(),
        checkOut: new Date(booking.checkOut).toISOString(),
        status: "Confirmed", // force default
        deadline: booking.deadline ? new Date(booking.deadline).toISOString() : null,
        specialRequest: booking.specialRequest,
        bookingRooms: rooms.map(r => ({
          roomTypeId: r.roomTypeId,
          adults: Number(r.adults),
          children: Number(r.children),
          childrenAges: r.childrenAges
        }))
      };
      
      setLoading(true);
      const res = await bookingApi.createBooking(payload);
      onSaved?.(res);
    } catch (err) {
      console.error(err);
      alert("Failed to save booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return booking.agencyId && 
           booking.supplierCategoryId && 
           booking.supplierId && 
           booking.hotelId && 
           booking.checkIn && 
           booking.checkOut && 
           rooms.length > 0;
  };

  return (
     <div className="booking-form-container">
      {/* <div className="booking-form-header">
        <h2>Quick Booking</h2>
        <p>Fill all details in one go</p>
      </div> */}

      <div className="booking-form-grid">
        {/* Agent Search */}
        <div className="booking-form-box">
          <label>Agent *</label>
          <div className="booking-searchable-dropdown">
            <input
              type="text"
              placeholder="Search agent..."
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              onFocus={() => setShowAgentDropdown(true)}
              onBlur={() => setTimeout(() => setShowAgentDropdown(false), 200)}
              className="booking-search-input"
            />
            {showAgentDropdown && filteredAgents.length > 0 && (
              <div className="booking-dropdown-list">
                {filteredAgents.map(agent => (
                  <div
                    key={agent.id}
                    className="booking-dropdown-item"
                    onClick={() => {
                      setBooking({ 
                        ...booking, 
                        agencyId: agent.id, 
                        agencyName: agent.agencyName 
                      });
                      setAgentSearch(agent.agencyName);
                      setShowAgentDropdown(false);
                    }}
                  >
                    {agent.agencyName}
                  </div>
                ))}
              </div>
            )}
          </div>
          {booking.agencyName && (
            <div className="booking-selected-badge"> {booking.agencyName}</div>
          )}
        </div>

        {/* Category Search */}
        <div className="booking-form-box">
          <label>Category *</label>
          <div className="booking-searchable-dropdown">
            <input
              type="text"
              placeholder="Search category..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              onFocus={() => setShowCategoryDropdown(true)}
              onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
              className="booking-search-input"
            />
            {showCategoryDropdown && filteredCategories.length > 0 && (
              <div className="booking-dropdown-list">
                {filteredCategories.map(category => (
                  <div
                    key={category.id}
                    className="booking-dropdown-item"
                    onClick={() => {
                      setBooking({ 
                        ...booking, 
                        supplierCategoryId: category.id,
                        supplierSubCategoryId: null,
                        supplierId: null,
                        supplierName: ""
                      });
                      setCategorySearch(category.name);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    {category.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {booking.supplierCategoryId && (
            <div className="booking-selected-badge">
               {categories.find(c => c.id === booking.supplierCategoryId)?.name}
            </div>
          )}
        </div>

        {/* Subcategory Search */}
        <div className="booking-form-box">
          <label>Subcategory</label>
          <div className="booking-searchable-dropdown">
            <input
              type="text"
              placeholder={booking.supplierCategoryId ? "Search subcategory..." : "Select category first"}
              value={subCategorySearch}
              onChange={(e) => setSubCategorySearch(e.target.value)}
              onFocus={() => booking.supplierCategoryId && setShowSubCategoryDropdown(true)}
              onBlur={() => setTimeout(() => setShowSubCategoryDropdown(false), 200)}
              className="booking-search-input"
              disabled={!booking.supplierCategoryId}
            />
            {showSubCategoryDropdown && filteredSubCategories.length > 0 && (
              <div className="booking-dropdown-list">
                {filteredSubCategories.map(subCat => (
                  <div
                    key={subCat.id}
                    className="booking-dropdown-item"
                    onClick={() => {
                      setBooking({ 
                        ...booking, 
                        supplierSubCategoryId: subCat.id,
                        supplierId: null,
                        supplierName: ""
                      });
                      setSubCategorySearch(subCat.name);
                      setShowSubCategoryDropdown(false);
                    }}
                  >
                    {subCat.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {booking.supplierSubCategoryId && (
            <div className="booking-selected-badge">
               {subCategories.find(sc => sc.id === booking.supplierSubCategoryId)?.name}
            </div>
          )}
        </div>

        {/* Supplier Search */}
        <div className="booking-form-box">
          <label>Supplier *</label>
          <div className="booking-searchable-dropdown">
            <input
              type="text"
              placeholder={booking.supplierCategoryId ? "Search supplier..." : "Select category first"}
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              onFocus={() => booking.supplierCategoryId && setShowSupplierDropdown(true)}
              onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
              className="booking-search-input"
              disabled={!booking.supplierCategoryId}
            />
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <div className="booking-dropdown-list">
                {filteredSuppliers.map(supplier => (
                  <div
                    key={supplier.id}
                    className="booking-dropdown-item"
                    onClick={() => {
                      setBooking({ 
                        ...booking, 
                        supplierId: supplier.id,
                        supplierName: supplier.supplierName
                      });
                      setSupplierSearch(supplier.supplierName);
                      setShowSupplierDropdown(false);
                    }}
                  >
                    {supplier.supplierName}
                  </div>
                ))}
              </div>
            )}
          </div>
          {booking.supplierName && (
            <div className="booking-selected-badge"> {booking.supplierName}</div>
          )}
        </div>

        {/* Hotel Search */}
        <div className="booking-form-box full-width">
          <label>Hotel *</label>
          <div className="booking-hotel-search-container">
            <div className="booking-search-input-wrapper">
              <div className="booking-search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748b">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search hotels, cities, or landmarks..."
                value={hotelQuery}
                onChange={(e) => setHotelQuery(e.target.value)}
                onFocus={() => setShowHotelResults(true)}
                className="booking-hotel-search-input"
              />
              {hotelQuery && (
                <button 
                  className="booking-clear-search"
                  onClick={() => {
                    setHotelQuery("");
                    setSelectedHotel(null);
                    setBooking(prev => ({ ...prev, hotelId: null, hotelName: "" }));
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
            </div>
            
            {showHotelResults && (
              <div className="booking-search-results-panel">
                {searchLoading ? (
                  <div className="booking-loading-results">
                    <div className="booking-spinner"></div>
                    Searching hotels...
                  </div>
                ) : hotels.length > 0 ? (
                  <div className="booking-hotel-results">
                    {hotels.map(hotel => (
                      <div
                        key={hotel.id}
                        className={`booking-hotel-result ${selectedHotel?.id === hotel.id ? 'selected' : ''}`}
                        onClick={() => handleHotelSelect(hotel)}
                      >
                        <div className="booking-hotel-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748b">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                          </svg>
                        </div>
                        <div className="booking-hotel-info">
                          <div className="booking-hotel-name">{hotel.hotelName}</div>
                          <div className="booking-hotel-location">{hotel.cityName}, {hotel.countryName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hotelQuery.length >= 2 ? (
                  <div className="booking-no-results">
                    No hotels found for "{hotelQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>
          {selectedHotel && (
            <div className="booking-selected-hotel-display">
              <div className="booking-selected-hotel-badge"> Selected</div>
              <div className="booking-selected-hotel-info">
                <strong>{selectedHotel.hotelName}</strong>
                <span>{selectedHotel.cityName}, {selectedHotel.countryName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dates Section */}
        <div className="booking-form-box">
          <label>Check-In *</label>
          <div className="booking-date-input-container">
            <input 
              type="text"
              value={booking.checkIn} 
              readOnly
              placeholder="Select date"
              className="booking-clickable-date-input"
              onClick={() => openCalendar('checkin')}
            />
            <button 
              className="booking-calendar-button"
              onClick={() => openCalendar('checkin')}
            >
              📅
            </button>
            <input 
              ref={checkInRef}
              type="date" 
              value={booking.checkIn} 
              min={today} 
              onChange={e => setBooking({ ...booking, checkIn: e.target.value })} 
              className="booking-hidden-date-input"
            />
          </div>
        </div>

        <div className="booking-form-box">
          <label>Check-Out *</label>
          <div className="booking-date-input-container">
            <input 
              type="text"
              value={booking.checkOut} 
              readOnly
              placeholder="Select date"
              className="booking-clickable-date-input"
              onClick={() => openCalendar('checkout')}
            />
            <button 
              className="booking-calendar-button"
              onClick={() => openCalendar('checkout')}
            >
              📅
            </button>
            <input 
              ref={checkOutRef}
              type="date" 
              value={booking.checkOut} 
              min={booking.checkIn || today} 
              onChange={e => setBooking({ ...booking, checkOut: e.target.value })} 
              className="booking-hidden-date-input"
            />
          </div>
        </div>

        {/* Nights Display - Square Box */}
        <div className="booking-form-box">
          <label>Nights</label>
          <div className="booking-nights-display">{booking.nights}</div>
        </div>

        {/* Rooms & Totals Section */}
        <div className="booking-form-box">
          <label>Rooms *</label>
          <input
            type="text"
            min={0}
            value={booking.numberOfRooms || ""}
            onChange={e =>
              setBooking(prev => ({
                ...prev,
                numberOfRooms: Math.max(1, parseInt(e.target.value || "1", 10)),
              }))
            }
            className="booking-number-input"
            placeholder="1"
          />
        </div>

 
      </div>

      {/* Room Details */}
      {rooms.length > 0 && (
        <div className="booking-rooms-section">
          <h4>Room Details</h4>
          <div className="booking-rooms-grid">
            {rooms.map((room, idx) => (
              <div className="booking-room-box" key={idx}>
                <div className="booking-room-header">Room {idx + 1}</div>
                
                <div className="booking-room-fields">
                  <div className="booking-field-box">
                    <label>Type *</label>
                    <RoomTypeSelector
                        hotelId={booking.hotelId}
                        value={room.roomTypeId}
                        sharedRoomTypes={sharedRoomTypes}
                        onSelect={(roomTypeId, roomTypeName) => {
                          const next = [...rooms];
                          next[idx] = { ...room, roomTypeId };
                          setRooms(next);
                          // Ensure selected type is tracked globally
                          if (!sharedRoomTypes.some(rt => rt.id === roomTypeId)) {
                            setSharedRoomTypes(prev => [...prev, { id: roomTypeId, name: roomTypeName }]);
                          }
                        }}
                        onNotify={(msg) => {
                          if (msg?.newRoom) {
                            setSharedRoomTypes(prev => [...prev, msg.newRoom]);
                          }
                        }}
                        placeholder="Select type"
                        compact
                        disabled={!booking.hotelId}
                      />

                  </div>

                  <div className="booking-field-box">
                    <label>Adults *</label>
                    <input
                      type="text"
                      min={1}
                      value={room.adults}
                      onChange={(e) => {
                        const next = [...rooms];
                        next[idx] = { ...room, adults: Math.max(1, parseInt(e.target.value || "1", 10)) };
                        setRooms(next);
                      }}
                      className="booking-small-input"
                      
                    />
                  </div>

                  <div className="booking-field-box">
                    <label>Children</label>
                    <input
                      type="number"
                      min={0}
                      value={room.children}
                      onChange={(e) => {
                        const count = Math.max(0, parseInt(e.target.value || "0", 12));
                        const next = [...rooms];
                        next[idx] = {
                          ...room,
                          children: count,
                          childrenAges: Array.from({ length: count }, (_, i) => room.childrenAges[i] ?? 0),
                        };
                        setRooms(next);
                      }}
                      className="booking-small-input"
                    />
                  </div>

                  {room.children > 0 && (
                    <div className="booking-field-box booking-ages-box">
                      <label>Children Ages</label>
                      <div className="booking-ages-grid">
                        {room.childrenAges.map((age, aidx) => (
                          <input
                            key={aidx}
                            type="number"
                            min={0}
                            max={12}
                            value={age}
                            onChange={(e) => {
                              const v = Math.max(0, Math.min(17, parseInt(e.target.value || "0", 10)));
                              const next = [...rooms];
                              const ages = [...room.childrenAges];
                              ages[aidx] = v;
                              next[idx] = { ...room, childrenAges: ages };
                              setRooms(next);
                            }}
                            className="booking-age-input"
                            placeholder="Age"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="viewonly">
                     {/* Total People Display - Square Box */}
        <div className="booking-form-box">
          <label>Total People</label>
          <div className="booking-total-display">{totalPeople}</div>
        </div>

        {/* Adults Display - Square Box */}
        <div className="booking-form-box">
          <label>Adults</label>
          <div className="booking-total-display booking-adults-display">{totalAdults}</div>
        </div>

        {/* Children Display - Square Box */}
        <div className="booking-form-box">
          <label>Children</label>
          <div className="booking-total-display booking-children-display">{totalChildren}</div>
        </div>
        
      </div>

      {/* Special Request */}
      <div className="booking-form-box full-width">
        <label>Special Request</label>
        <textarea
          value={booking.specialRequest}
          onChange={(e) => setBooking({ ...booking, specialRequest: e.target.value })}
          className="booking-textarea-input"
          placeholder="Any special requests..."
        />
      </div>
      {/* Status (read-only display) */}
        <div className="booking-form-box">
          <label>Status</label>
          <div className="booking-status-display">Confirmed</div>
        </div>

        {/* Deadline (staff enters) */}
        <div className="booking-form-box">
          <label>Deadline *</label>
          <input
            type="date"
            value={booking.deadline || ""}
            min={today}
            onChange={(e) => setBooking({ ...booking, deadline: e.target.value })}
            className="booking-date-input"
          />
        </div>


      {/* Actions */}
      <div className="booking-actions-section">
        <button className="booking-btn-cancel" onClick={onCancel}>Cancel</button>
        <button 
          className="booking-btn-save" 
          onClick={handleSave} 
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <>
              <div className="booking-spinner"></div>
              Saving...
            </>
          ) : (
            "Save Booking"
          )}
        </button>
      
      </div>
  
    </div>
  );
};

export default BookingForm;
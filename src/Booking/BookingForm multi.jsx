import React, { useState, useEffect } from "react";
import bookingApi from "../api/bookingApi";
import supplierApi from "../api/supplierApi";
import agencyApi from "../api/agencyApi";
import "./BookingForm.css";
import RoomTypeSelector from "../components/RoomTypeSelector";


const BookingForm = ({ initialBooking, onSaved, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ageWarnings, setAgeWarnings] = useState({});
  

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
      totalPeople: 0, // New field for automatic calculation
      childrenAges: [],
      status: "Pending",
      specialRequest: ""
    }
  );

  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [hotelQuery, setHotelQuery] = useState("");

  const today = new Date().toISOString().split("T")[0];
  // Add these state variables
const [searchFocused, setSearchFocused] = useState(false);
const [selectedHotel, setSelectedHotel] = useState(null);
const [hoveredHotel, setHoveredHotel] = useState(null);
const [showHotelsList, setShowHotelsList] = useState(false);
const [mapCenter, setMapCenter] = useState({ lat: 51.5074, lng: -0.1278 });
const [mapLoaded, setMapLoaded] = useState(false);
const [mapView, setMapView] = useState(false);
const [searchLoading, setSearchLoading] = useState(false);
const [rooms, setRooms] = useState(() => booking.bookingRooms || []); 

// Add this function for hotel selection
const handleHotelSelect = (hotel) => {
  setSelectedHotel(hotel);
  setBooking({ 
    ...booking, 
    hotelId: hotel.id, 
    hotelName: hotel.hotelName 
  });
  setHotelQuery(hotel.hotelName);
  setSearchFocused(false);
  
  // Center map on selected hotel
  if (hotel.latitude && hotel.longitude) {
    setMapCenter({ lat: hotel.latitude, lng: hotel.longitude });
  }
};
useEffect(() => {
  setBooking(prev => ({ ...prev, bookingRooms: rooms }));
}, [rooms]);
// helper: create N room rows safely
const buildRooms = (count, existing = []) => {
  const next = [...existing];
  if (count > next.length) {
    for (let i = next.length; i < count; i++) {
      next.push({
        roomTypeId: null,
        adults: 2,
        children: 0,
        childrenAges: [], // numbers
      });
    }
  } else if (count < next.length) {
    next.length = count;
  }
  // ensure childrenAges length matches children
  next.forEach(r => {
    const c = r.children || 0;
    if (r.childrenAges.length !== c) {
      r.childrenAges = Array.from({ length: c }, (_, i) => r.childrenAges[i] ?? 0);
    }
  });
  return next;
};

// inside your BookingForm component state (add these near your other state)
// [{roomTypeId, adults, children, childrenAges:number[]}]
const totalPeople = rooms.reduce((sum, r) => sum + (Number(r.adults||0) + Number(r.children||0)), 0);

// keep rooms array in sync with booking.numberOfRooms
useEffect(() => {
  const count = Number(booking.numberOfRooms || 0);
  setRooms(prev => buildRooms(count, prev));
}, [booking.numberOfRooms]);
// --- Summary aggregates ---
const totalAdults = rooms.reduce((sum, r) => sum + Number(r.adults || 0), 0);
const totalChildren = rooms.reduce((sum, r) => sum + Number(r.children || 0), 0);
const totalChildrenAges = rooms.flatMap(r => r.childrenAges || []);
const totalPeopleAll = totalAdults + totalChildren;

// Update your hotel search useEffect with loading state
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

  // --- Calculate total people whenever adults or children change ---
  useEffect(() => {
    const totalPeople = booking.adults + booking.children;
    setBooking(prev => ({ ...prev, totalPeople }));
  }, [booking.adults, booking.children]);

  // --- Fetch agents and categories ---
  useEffect(() => {
    const fetchData = async () => {
      const agentList = await agencyApi.getAgencies();
      setAgents(agentList || []);

      const categoryList = await supplierApi.getCategories();
      setCategories(categoryList || []);
    };
    fetchData();
  }, []);

  // --- Fetch subcategories ---
// --- Fetch subcategories safely ---
useEffect(() => {
  if (!booking.supplierCategoryId) {
    // No category selected: reset everything
    setSubCategories([]);
    setSuppliers([]);
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

      // 👇 Only reset if the current subcategory doesn't exist in the new list
      setBooking(prev => {
        const stillValid = subcats.some(sc => sc.id === prev.supplierSubCategoryId);
        return stillValid ? prev : { 
          ...prev, 
          supplierSubCategoryId: null, 
          supplierId: null, 
          supplierName: "" 
        };
      });
    } catch (err) {
      console.error("Failed fetching subcategories:", err);
    }
  };

  fetchSubCategories();
}, [booking.supplierCategoryId]);

// --- Fetch suppliers safely ---
useEffect(() => {
  if (!booking.supplierCategoryId) {
    setSuppliers([]);
    setBooking(prev => ({ ...prev, supplierId: null, supplierName: "" }));
    return;
  }

  const fetchSuppliers = async () => {
    try {
      const supplierList = await supplierApi.getSuppliersByCategory(
        booking.supplierCategoryId,
        booking.supplierSubCategoryId
      );
      setSuppliers(supplierList || []);

      // 👇 Only reset if current supplier not in fetched list
      setBooking(prev => {
        const stillValid = supplierList.some(s => s.id === prev.supplierId);
        return stillValid ? prev : { 
          ...prev, 
          supplierId: null, 
          supplierName: "" 
        };
      });
    } catch (err) {
      console.error("Failed fetching suppliers:", err);
    }
  };

  fetchSuppliers();
}, [booking.supplierCategoryId, booking.supplierSubCategoryId]);

  // --- Hotel autocomplete ---
  useEffect(() => {
    if (hotelQuery.length < 2) {
      setHotels([]);
      return;
    }

    const fetchHotels = async () => {
      try {
        const hotelList = await bookingApi.searchHotels(hotelQuery);
        setHotels(Array.isArray(hotelList) ? hotelList : []);
      } catch (err) {
        console.error(err);
        setHotels([]);
      }
    };
    fetchHotels();
  }, [hotelQuery]);

  // --- Calculate nights ---
  useEffect(() => {
    if (booking.checkIn && booking.checkOut) {
      const nights = (new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24);
      setBooking(prev => ({ ...prev, nights: nights > 0 ? nights : 0 }));
    }
  }, [booking.checkIn, booking.checkOut]);

  // --- Child age handler ---
  const handleChildAgeChange = (index, value) => {
    const ageValue = value === "" ? "" : parseInt(value || 0);
    const ages = [...booking.childrenAges];
    ages[index] = ageValue;

    let adults = booking.adults;
    let children = 0;
    const newWarnings = { ...ageWarnings };

    ages.forEach((age, i) => {
      if (age > 12) {
        adults += 1;
        newWarnings[i] = "Age above 12 will be counted as adult";
      } else if (age > 0) {
        children += 1;
        delete newWarnings[i];
      } else {
        delete newWarnings[i];
      }
    });

    const totalPeople = adults + children;
    
    setAgeWarnings(newWarnings);
    setBooking({ ...booking, childrenAges: ages, adults, children, totalPeople });
  };

  // --- Navigation ---
  const handleNext = () => setStep(prev => Math.min(prev + 1, 5));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  // --- Save booking ---
const handleSave = async () => {
  try {
    // validate minimal requirements
    if (!booking.hotelId) { alert("Select a hotel."); return; }
    if (!booking.checkIn || !booking.checkOut) { alert("Select dates."); return; }
    if (!rooms.length) { alert("Add at least one room."); return; }

    // build BookingRooms for backend (ChildrenAges as comma string)
    const bookingRoomsPayload = rooms.map(r => ({
      roomTypeId: r.roomTypeId,                 // required
      adults: Number(r.adults || 0),
      children: Number(r.children || 0),
      childrenAges: r.childrenAges.length ? r.childrenAges.join(",") : null,
    }));

    // final payload (align with your BookingController expectations)
const payload = {
  agencyId: booking.agencyId,
  supplierId: booking.supplierId,
  hotelId: booking.hotelId,
  checkIn: new Date(booking.checkIn).toISOString(),
  checkOut: new Date(booking.checkOut).toISOString(),
  specialRequest: booking.specialRequest,
  bookingRooms: rooms.map(r => ({
    roomTypeId: r.roomTypeId,
    adults: Number(r.adults),
    children: Number(r.children),
    childrenAges: r.childrenAges // send as array ✅
  }))
};

    setLoading(true);
    console.log("Final payload:", payload);
    const res = await bookingApi.createBooking(payload); // your existing API call
    
    onSaved?.(res);
  } catch (err) {
    console.error(err);
    alert("Failed to save booking.");
  } finally {
    setLoading(false);
  }
};

  // Step titles for progress bar
  const stepTitles = [
    "Agent & Supplier",
    "Hotel Search",
    "Dates & Duration",
    "Rooms & Guests",
    "Special Requests & Summary"
  ];

  return (
    <div className="booking-form-container">
      <div className="booking-form-header">
        <h2 className="booking-form-title">Create New Booking</h2>
        <p className="booking-form-subtitle">Fill in the details to create a new booking</p>
      </div>

      {/* Progress Bar */}
      <div className="booking-form-progress-container">
        <div className="booking-form-progress-bar">
          <div 
            className="booking-form-progress-fill" 
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
        <div className="booking-form-step-indicators">
          {stepTitles.map((title, index) => (
            <div 
              key={index + 1}
              className={`booking-form-step-indicator ${step === index + 1 ? 'booking-form-step-active' : ''} ${step > index + 1 ? 'booking-form-step-completed' : ''}`}
            >
              <div className="booking-form-step-number">{index + 1}</div>
              <span className="booking-form-step-title">{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Agent & Supplier */}
      {step === 1 && (
        <div className="booking-form-step">
          <div className="booking-form-step-header">
            <h3>Agent & Supplier Information</h3>
            <p>Select the agent and supplier details for this booking</p>
          </div>
          
          <div className="booking-form-grid">
            <div className="booking-form-group">
              <label className="booking-form-label">Agent *</label>
              <select
                className="booking-form-select"
                value={booking.agencyId || ""}
                onChange={e => {
                  const selected = agents.find(a => a.id === parseInt(e.target.value));
                  setBooking({ ...booking, agencyId: selected?.id || null, agencyName: selected?.agencyName || "" });
                }}
              >
                <option value="">Select an agent</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.agencyName}</option>)}
              </select>
            </div>

            <div className="booking-form-group">
              <label className="booking-form-label">Supplier Category *</label>
              <select
                className="booking-form-select"
                value={booking.supplierCategoryId || ""}
                onChange={e => setBooking({ ...booking, supplierCategoryId: parseInt(e.target.value) })}
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="booking-form-group">
              <label className="booking-form-label">Supplier Subcategory *</label>
              <select
                className="booking-form-select"
                value={booking.supplierSubCategoryId || ""}
                disabled={!booking.supplierCategoryId || subCategories.length === 0}
                onChange={e => setBooking({ ...booking, supplierSubCategoryId: parseInt(e.target.value) })}
              >
                <option value="">Select Subcategory</option>
                {subCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </select>
            </div>

            <div className="booking-form-group">
              <label className="booking-form-label">Supplier *</label>
              <select
                className="booking-form-select"
                value={booking.supplierId || ""}
                disabled={!booking.supplierCategoryId || suppliers.length === 0}
                onChange={e => {
                  const selected = suppliers.find(s => s.id === parseInt(e.target.value));
                  setBooking({ ...booking, supplierId: selected?.id || null, supplierName: selected?.supplierName || "" });
                }}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
              </select>
            </div>
          </div>

          <div className="booking-form-actions">
            <button className="booking-form-btn booking-form-btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="booking-form-btn booking-form-btn-primary" onClick={handleNext} disabled={!booking.supplierId}>
              Next →
            </button>
          </div>
        </div>
      )}

{step === 2 && (
  <div className="hotel-search-step">
    <div className="booking-form-step-header">
      <h3>Find Your Perfect Hotel</h3>
      <p>Search from thousands of hotels worldwide</p>
    </div>
    
    <div className="hotel-search-layout">
      {/* Left Panel - Search & Results */}
      <div className="hotel-search-panel">
        {/* Enhanced Search Bar */}
        <div className="enhanced-search-container">
          <div className="search-bar-with-filters">
            <div className="search-input-group">
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
              <input
                type="text"
                className="enhanced-search-input"
                placeholder="Where do you want to stay? Search hotels, cities, or landmarks..."
                value={hotelQuery}
                onChange={e => setHotelQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
              />
              {hotelQuery && (
                <button className="clear-search-btn" onClick={() => setHotelQuery("")}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
              {/* <button className="search-action-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8">
                  <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                </svg>
              </button> */}
            </div>
            
            {/* Quick Filters */}
           
          </div>
        </div>

        {/* Search Results */}
        <div className="search-results-container">
          {searchLoading ? (
            <div className="loading-results">
              <div className="loading-spinner"></div>
              <p>Searching hotels...</p>
            </div>
          ) : hotels.length > 0 ? (
            <>
              <div className="results-header">
                <h4>Available Hotels</h4>
                <span className="results-count">{hotels.length} properties found</span>
              </div>
              
              <div className="hotels-list">
                {hotels.map((hotel, index) => (
                  <div
                    key={hotel.id}
                    className={`hotel-result-card ${selectedHotel?.id === hotel.id ? 'selected' : ''} ${index < 3 ? 'featured' : ''}`}
                    onClick={() => handleHotelSelect(hotel)}
                  >
                    {/* Hotel Image */}
                    <div className="hotel-image">
                      <div className="image-placeholder">
                        🏨
                      </div>
                     
                    </div>
                    
                    {/* Hotel Info */}
                    <div className="hotel-info">
                      <div className="hotel-header">
                        <h4 className="hotel-name">{hotel.hotelName}</h4>
                        
                      </div>
                      
                      <div className="hotel-location">
                        <span className="location-pin">📍</span>
                        {hotel.cityName}, {hotel.countryName}
                      </div>
                      
                     
                      
                      
                      
                      <div className="hotel-actions">
                        <button className={`select-btn ${selectedHotel?.id === hotel.id ? 'selected' : ''}`}>
                          {selectedHotel?.id === hotel.id ? '✓ Selected' : 'Select Hotel'}
                        </button>
                       
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : hotelQuery.length >= 2 ? (
            <div className="no-results-state">
              <div className="no-results-icon">🔍</div>
              <h4>No hotels found</h4>
              <p>We couldn't find any hotels matching "<strong>{hotelQuery}</strong>"</p>
              <div className="suggestions">
                <p>Try these suggestions:</p>
                <ul>
                  <li>Check your spelling</li>
                  <li>Try a different city or landmark</li>
                  <li>Search with fewer keywords</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏨</div>
              <h4>Find your perfect stay</h4>
              <p>Search for hotels by name, city, or popular landmark to get started</p>
              <div className="popular-searches">
                <p>Popular searches:</p>
                <div className="popular-tags">
                  <button className="popular-tag" onClick={() => setHotelQuery("Italy")}>Italy</button>
                  <button className="popular-tag" onClick={() => setHotelQuery("Paris")}>Paris</button>
                  <button className="popular-tag" onClick={() => setHotelQuery("London")}>London</button>
                  <button className="popular-tag" onClick={() => setHotelQuery("Dubai")}>Dubai</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map & Selected Hotel */}
      <div className="hotel-details-panel">
        {/* Interactive Map */}
        <div className="interactive-map-section">
          <div className="map-header">
            <h4>Hotel Locations</h4>
            <div className="map-controls">
              <button className="map-control-btn">🗺️</button>
              <button className="map-control-btn">🌍</button>
              <button className="map-control-btn">📍</button>
            </div>
          </div>
          
          <div className="map-container">
            {/* Map Visualization with Hotel Markers */}
            <div className="dynamic-map">
              {hotels.slice(0, 6).map((hotel, index) => (
                <div
                  key={hotel.id}
                  className={`map-marker ${selectedHotel?.id === hotel.id ? 'active' : ''} ${hoveredHotel === hotel.id ? 'hovered' : ''}`}
                  style={{
                    left: `${20 + (index * 15)}%`,
                    top: `${30 + (index % 3 * 20)}%`
                  }}
                  onMouseEnter={() => setHoveredHotel(hotel.id)}
                  onMouseLeave={() => setHoveredHotel(null)}
                  onClick={() => handleHotelSelect(hotel)}
                >
                  <div className="marker-pin"></div>
                  <div className="marker-pulse"></div>
                  <div className="marker-tooltip">
                    <strong>{hotel.hotelName}</strong>
                    <br />
                 
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Hotel Details */}
        {selectedHotel && (
          <div className="selected-hotel-details">
            <div className="selected-hotel-header">
              <h4>Selected Hotel</h4>
              <div className="selection-badge">✓</div>
            </div>
            
            <div className="selected-hotel-card">
              <div className="selected-hotel-image">
                <div className="hotel-type-badge">🏨 Hotel</div>
              </div>
              
              <div className="selected-hotel-content">
                <h5>{selectedHotel.hotelName}</h5>
                <div className="selected-location">
                  📍 {selectedHotel.cityName}, {selectedHotel.countryName}
                </div>
                
        
                
               
                
           
              </div>
            </div>
            
            <button 
              className="change-selection-btn"
              onClick={() => {
                setSelectedHotel(null);
                setBooking(prev => ({ ...prev, hotelId: null, hotelName: "" }));
              }}
            >
              Change Selection
            </button>
          </div>
        )}
      </div>
    </div>

    <div className="booking-form-actions">
      <button className="booking-form-btn booking-form-btn-secondary" onClick={handlePrev}>← Back</button>
      <button className="booking-form-btn booking-form-btn-primary" onClick={handleNext} disabled={!booking.hotelId}>
        Continue to Dates & Guests →
      </button>
    </div>
  </div>
)}
      {/* Step 3: Dates */}
      {step === 3 && (
        <div className="booking-form-step">
          <div className="booking-form-step-header">
            <h3>Dates & Duration</h3>
            <p>Select check-in and check-out dates for your stay</p>
          </div>
          
          <div className="booking-form-grid">
            <div className="booking-form-group">
              <label className="booking-form-label">Check-In Date *</label>
              <input 
                type="date" 
                className="booking-form-input"
                value={booking.checkIn} 
                min={today} 
                onChange={e => setBooking({ ...booking, checkIn: e.target.value })} 
              />
            </div>

            <div className="booking-form-group">
              <label className="booking-form-label">Check-Out Date *</label>
              <input 
                type="date" 
                className="booking-form-input"
                value={booking.checkOut} 
                min={booking.checkIn || today} 
                onChange={e => setBooking({ ...booking, checkOut: e.target.value })} 
              />
            </div>
          </div>

          <div className="booking-form-duration-display">
            <div className="booking-form-duration-card">
              <div className="booking-form-duration-label">Total Nights</div>
              <div className="booking-form-duration-value">{booking.nights}</div>
            </div>
          </div>

          <div className="booking-form-actions">
            <button className="booking-form-btn booking-form-btn-secondary" onClick={handlePrev}>← Back</button>
            <button className="booking-form-btn booking-form-btn-primary" onClick={handleNext} disabled={!booking.checkIn || !booking.checkOut}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Rooms & Guests */}
      {step === 4 && (
        <div className="booking-form-step">
          <div className="booking-form-step-header">
            <h3>Rooms & Guests</h3>
            <p>Set up rooms, occupancy and room types</p>
          </div>

          <div className="booking-form-grid">
            <div className="booking-form-group">
              <label className="booking-form-label">Number of Rooms *</label>
              <input
                type="number"
                min={0}
                className="booking-form-input"
                value={booking.numberOfRooms || 0}
                onChange={e =>
                  setBooking(prev => ({
                    ...prev,
                    numberOfRooms: Math.max(0, parseInt(e.target.value || "0", 10)),
                  }))
                }
              />
            </div>
          </div>

          {/* Rooms table */}
          <div className="rooms-table">
            {rooms.map((room, idx) => (
              <div className="room-row" key={idx}>
                <div className="room-col room-index">Room {idx + 1}</div>

                <div className="room-col">
                  <label className="booking-form-label">Room Type</label>
                  <RoomTypeSelector
                    hotelId={booking.hotelId}
                    value={room.roomTypeId}
                    onSelect={(roomTypeId) => {
                      const next = [...rooms];
                      next[idx] = { ...room, roomTypeId };
                      setRooms(next);
                    }}
                    placeholder="Select or add room type"
                    allowAdd
                    disabled={!booking.hotelId}
                  />
                </div>

                <div className="room-col">
                  <label className="booking-form-label">Adults</label>
                  <input
                    type="number"
                    min={1}
                    className="booking-form-input"
                    value={room.adults}
                    onChange={(e) => {
                      const next = [...rooms];
                      next[idx] = { ...room, adults: Math.max(1, parseInt(e.target.value || "1", 10)) };
                      setRooms(next);
                    }}
                  />
                </div>

                <div className="room-col">
                  <label className="booking-form-label">Children</label>
                  <input
                    type="number"
                    min={0}
                    className="booking-form-input"
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
                  />
                </div>

                {room.children > 0 && (
                  <div className="room-col room-ages">
                    <label className="booking-form-label">Children Ages</label>
                    <div className="ages-row">
                      {room.childrenAges.map((age, aidx) => (
                        <input
                          key={aidx}
                          type="number"
                          min={0}
                          max={12}
                          className="booking-form-input age-input"
                          value={age}
                          onChange={(e) => {
                            const v = Math.max(0, Math.min(17, parseInt(e.target.value || "0", 10)));
                            const next = [...rooms];
                            const ages = [...room.childrenAges];
                            ages[aidx] = v;
                            next[idx] = { ...room, childrenAges: ages };
                            setRooms(next);
                          }}
                        />
                        
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* summary */}
          <div className="booking-form-duration-display" style={{ marginTop: 12 }}>
            <div className="booking-form-duration-card">
              <div className="booking-form-duration-label">Total People</div>
              <div className="booking-form-duration-value">{totalPeople}</div>
            </div>
          </div>

          <div className="booking-form-actions">
            <button className="booking-form-btn booking-form-btn-secondary" onClick={handlePrev}>← Back</button>
            <pre>{JSON.stringify(rooms, null, 2)}</pre>

            <button
              className="booking-form-btn booking-form-btn-primary"
              onClick={handleNext}
              disabled={
                rooms.length === 0 ||
                rooms.some(r => !r.roomTypeId || !r.adults || r.childrenAges.length !== (r.children || 0))
              }
            >
              Next →
            </button>
          </div>
        </div>
      )}


      {/* Step 5: Special Request & Summary */}
      {step === 5 && (
        <div className="booking-form-step">
          <div className="booking-form-step-header">
            <h3>Special Requests & Summary</h3>
            <p>Review your booking details and add any special requests</p>
          </div>
          
          <div className="booking-form-group">
            <label className="booking-form-label">Special Requests</label>
            <textarea 
              className="booking-form-textarea"
              value={booking.specialRequest} 
              onChange={e => setBooking({ ...booking, specialRequest: e.target.value })}
              placeholder="Any special requirements or requests..."
              rows="4"
            ></textarea>
          </div>

          <div className="booking-form-summary">
            <h4 className="booking-form-summary-title">Booking Summary</h4>
            <div className="booking-form-summary-grid">
              <div className="booking-form-summary-item">
                <span className="booking-form-summary-label">Agent:</span>
                <span className="booking-form-summary-value">{booking.agencyName || "Not selected"}</span>
              </div>
              <div className="booking-form-summary-item">
                <span className="booking-form-summary-label">Supplier:</span>
                <span className="booking-form-summary-value">{booking.supplierName || "Not selected"}</span>
              </div>
              <div className="booking-form-summary-item">
                <span className="booking-form-summary-label">Hotel:</span>
                <span className="booking-form-summary-value">{booking.hotelName || "Not selected"}</span>
              </div>
              <div className="booking-form-summary-item">
                <span className="booking-form-summary-label">Dates:</span>
                <span className="booking-form-summary-value">{booking.checkIn || "Not set"} → {booking.checkOut || "Not set"} ({booking.nights} nights)</span>
              </div>
              <div className="booking-form-summary-item">
                <span className="booking-form-summary-label">Rooms:</span>
                <span className="booking-form-summary-value">{booking.numberOfRooms}</span>
              </div>
              <div className="booking-form-summary-item">
                <span className="booking-form-summary-label">Adults:</span>
                <span className="booking-form-summary-value">{totalAdults}</span>
              </div>
              <div className="booking-form-summary-item">
                <span className="booking-form-summary-label">Children:</span>
                <span className="booking-form-summary-value">{totalChildren}</span>
              </div>
              {/* NEW: Total People in Summary */}
              <div className="booking-form-summary-item">
                <span className="booking-form-summary-label">Total People:</span>
                <span className="booking-form-summary-value booking-form-total-people">{totalPeopleAll}</span>
              </div>
              {booking.children > 0 && (
                <div className="booking-form-summary-item">
                  <span className="booking-form-summary-label">Child Ages:</span>
                  <span className="booking-form-summary-value">{totalChildrenAges.join(", ")}</span>
                </div>
              )}
              <div className="booking-form-summary-item">
                <span className="booking-form-summary-label">Status:</span>
                <span className="booking-form-summary-value booking-form-status-badge">{booking.status}</span>
              </div>
              {booking.specialRequest && (
                <div className="booking-form-summary-item booking-form-summary-full-width">
                  <span className="booking-form-summary-label">Special Requests:</span>
                  <span className="booking-form-summary-value">{booking.specialRequest}</span>
                </div>
              )}
            </div>
          </div>

          <div className="booking-form-actions">
            <button className="booking-form-btn booking-form-btn-secondary" onClick={handlePrev}>← Back</button>
            <button className="booking-form-btn booking-form-btn-success" onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <span className="booking-form-spinner"></span>
                  Saving...
                </>
              ) : (
                "Save Booking"
              )}
            </button>
            <button className="booking-form-btn booking-form-btn-outline" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
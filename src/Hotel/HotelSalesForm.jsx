import React, { useState, useRef, useEffect } from 'react';
import './HotelSalesForm.css';
import { createHotelSale } from '../api.js';
import { useNavigate } from "react-router-dom";

// Import JSON files (assuming they're in the same directory)
import countriesData from '../data/countries.json';
import citiesData from '../data/cities.json';
import hotelsData from '../data/hotels.json';

// Import icons
import { 
  FaEye, FaEdit, FaTrash, FaSearch, FaTimes, 
  FaSave, FaTimesCircle, FaCheckCircle, FaInfoCircle,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaBuilding,
  FaUserTie, FaClipboardList, FaConciergeBell,
  FaReceipt, FaMoneyCheckAlt, FaStar
} from 'react-icons/fa';

const HotelManagementSystem = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };
  
  return (
    <div className="hotel-management-system">
      {/* Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          <span>{notification.message}</span>
        </div>
      )}
      
      <div className="tabs">
        <button 
          className={activeTab === 'add' ? 'active' : ''} 
          onClick={() => setActiveTab('add')}
        >
          Add Hotel
        </button>
        <button 
          className={activeTab === 'view' ? 'active' : ''} 
          onClick={() => setActiveTab('view')}
        >
          View Hotels
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'add' && <AddHotelTab showNotification={showNotification} />}
        {activeTab === 'view' && <HotelSalesList showNotification={showNotification} />}
      </div>
    </div>
  );
};

// Add Hotel Tab Component
const AddHotelTab = ({ showNotification }) => {
  const navigate = useNavigate();

  // State for form data
  const [formData, setFormData] = useState({
    country: '',
    countryCode: '',
    city: '',
    hotelName: '',
    hotelContactNumber: '',
    address: '',
    hotelChain: '',
    // Contact persons
    salesPersonName: '',
    salesPersonEmail: '',
    salesPersonContact: '',
    reservationPersonName: '',
    reservationPersonEmail: '',
    reservationPersonContact: '',
    accountsPersonName: '',
    accountsPersonEmail: '',
    accountsPersonContact: '',
    receptionPersonName: '',
    receptionPersonEmail: '',
    receptionPersonContact: '',
    conciergeName: '',
    conciergeEmail: '',
    conciergeContact: '',
    // Credit and facilities
    creditCategory: '',
    specialRemarks: '',
    facilitiesAvailable: []
  });

  // State for dropdowns
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [error, setError] = useState('');

  // Refs for dropdown containers
  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const hotelDropdownRef = useRef(null);

  // Use imported data
  const countries = countriesData;
  const citiesByCountry = citiesData;
  const hotels = hotelsData;

  // Get hotels for the selected city, default to empty array
  const hotelsInCity = formData.city ? hotelsData[formData.city] || [] : [];

  // Get current country's phone code
  const getCurrentPhoneCode = () => {
    const country = countries.find(c => c.code === formData.countryCode);
    return country ? country.phoneCode : '+1'; // Default to US code
  };

  // Filter functions
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = formData.countryCode 
    ? citiesByCountry[formData.countryCode]?.filter(city => 
        city.toLowerCase().includes(citySearch.toLowerCase())
      ) || []
    : [];

  const filteredHotels = hotelsInCity.filter(hotel =>
    hotel.name.toLowerCase().includes(hotelSearch.toLowerCase()) ||
    hotel.address.toLowerCase().includes(hotelSearch.toLowerCase())
  );

  // Highlight matching text
  const highlightText = (text, search) => {
    if (!search) return text;
    
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? <span key={index} className="highlight">{part}</span> : part
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://hotels-8v0p.onrender.com/api/hotelsales",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        showNotification("Hotel created successfully!", "success");
        
        // Ask user if they want to see the list
        const goToList = window.confirm(
          "Hotel Sale saved successfully! Do you want to see the hotel list?"
        );

        if (goToList) {
          // Switch to the View Hotels tab
          document.querySelector('.tabs button:nth-child(2)').click();
        } else {
          // Reset form for new entry
          setFormData({
            country: '',
            countryCode: '',
            city: '',
            hotelName: '',
            hotelContactNumber: '',
            address: '',
            hotelChain: '',
            salesPersonName: '',
            salesPersonEmail: '',
            salesPersonContact: '',
            reservationPersonName: '',
            reservationPersonEmail: '',
            reservationPersonContact: '',
            accountsPersonName: '',
            accountsPersonEmail: '',
            accountsPersonContact: '',
            receptionPersonName: '',
            receptionPersonEmail: '',
            receptionPersonContact: '',
            conciergeName: '',
            conciergeEmail: '',
            conciergeContact: '',
            creditCategory: '',
            specialRemarks: '',
            facilitiesAvailable: []
          });
          setCountrySearch('');
          setCitySearch('');
          setHotelSearch('');
        }
      } else {
        showNotification("Failed to save hotel sale.", "error");
      }
    } catch (error) {
      console.error("Error saving hotel sale:", error);
      showNotification("Error saving hotel sale.", "error");
    }
  };

  // Handle country selection
  const handleCountrySelect = (code, name) => {
    setFormData(prev => ({
      ...prev,
      country: name,
      countryCode: code,
      city: '',
      hotelName: '',
      hotelContactNumber: '',
      address: '',
      hotelChain: ''
    }));
    setCountrySearch(name);
    setShowCountryDropdown(false);
    setCitySearch('');
    setHotelSearch('');
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, city }));
    setCitySearch(city);
    setShowCityDropdown(false);
  };

  // Handle hotel selection
  const handleHotelSelect = (hotel) => {
    setFormData(prev => ({
      ...prev,
      hotelName: hotel.name,
      hotelContactNumber: hotel.contactNumber || '',
      address: hotel.address,
      hotelChain: hotel.chain || ''
    }));
    setHotelSearch(hotel.name);
    setShowHotelDropdown(false);
    setError('');
  };

  // Handle manual hotel entry
  const handleManualHotel = () => {
    if (hotelSearch.trim() === '') {
      setError('Please enter a hotel name');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      hotelName: hotelSearch,
      hotelContactNumber: '',
      address: '',
      hotelChain: ''
    }));
    setShowHotelDropdown(false);
    setError('');
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          facilitiesAvailable: [...prev.facilitiesAvailable, name]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          facilitiesAvailable: prev.facilitiesAvailable.filter(item => item !== name)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle phone number input with country code
  const handlePhoneChange = (e, fieldName) => {
    const { value } = e.target;
    const digitsOnly = value.replace(/\D/g, '');
    const phoneCode = getCurrentPhoneCode().replace('+', '');
    let formattedValue = '';
    
    if (digitsOnly.startsWith(phoneCode)) {
      const restNumber = digitsOnly.substring(phoneCode.length);
      formattedValue = `+${phoneCode} ${restNumber}`;
    } else {
      formattedValue = `+${phoneCode} ${digitsOnly}`;
    }
    
    setFormData(prev => ({ ...prev, [fieldName]: formattedValue }));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
      if (hotelDropdownRef.current && !hotelDropdownRef.current.contains(event.target)) {
        setShowHotelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to render contact person sections
  const renderContactSection = (title, prefix) => (
    <div className="contact-section">
      <h4>{title}</h4>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${prefix}Name`}>Name:</label>
          <input
            type="text"
            id={`${prefix}Name`}
            name={`${prefix}Name`}
            value={formData[`${prefix}Name`]}
            onChange={handleChange}
            required={prefix === 'salesPerson'}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${prefix}Email`}>Email:</label>
          <input
            type="email"
            id={`${prefix}Email`}
            name={`${prefix}Email`}
            value={formData[`${prefix}Email`]}
            onChange={handleChange}
            required={prefix === 'salesPerson'}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${prefix}Contact`}>Contact:</label>
          <input
            type="tel"
            id={`${prefix}Contact`}
            name={`${prefix}Contact`}
            value={formData[`${prefix}Contact`]}
            onChange={(e) => handlePhoneChange(e, `${prefix}Contact`)}
            placeholder={getCurrentPhoneCode() + " XXX XXX XXXX"}
            required={prefix === 'salesPerson'}
          />
          <div className="form-note">
            Country code: {getCurrentPhoneCode()}
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ Fix: check hotel from DB using hotelsInCity array
  const isHotelFromDatabase = hotelsInCity.some(h => h.name === formData.hotelName);

  return (
    <div className="hotel-form-container">
      <h2>Add Hotel Information</h2>
      <form onSubmit={handleSubmit}>
        {/* Hotel Information Section */}
        <div className="form-section">
          <h3>Hotel Information</h3>

          {/* Country dropdown */}
          <div className="form-group searchable-dropdown" ref={countryDropdownRef}>
            <label>Country <span className="required">*</span></label>
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setShowCountryDropdown(true);
              }}
              onFocus={() => setShowCountryDropdown(true)}
              placeholder="Search for a country..."
              required
            />
            {showCountryDropdown && (
              <div className="dropdown-options">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map(country => (
                    <div 
                      key={country.code} 
                      className="dropdown-option"
                      onClick={() => handleCountrySelect(country.code, country.name)}
                    >
                      {country.flag} {highlightText(country.name, countrySearch)}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-option no-results">
                    No countries found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* City dropdown */}
          <div className="form-group searchable-dropdown" ref={cityDropdownRef}>
            <label>City <span className="required">*</span></label>
            <input
              type="text"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCityDropdown(true);
              }}
              onFocus={() => setShowCityDropdown(true)}
              placeholder="Search for a city..."
              required
              disabled={!formData.country}
            />
            {showCityDropdown && formData.country && (
              <div className="dropdown-options">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city, index) => (
                    <div 
                      key={index} 
                      className="dropdown-option"
                      onClick={() => handleCitySelect(city)}
                    >
                      {highlightText(city, citySearch)}
                    </div>
                  ))
                ) : (
                  <div className="dropdown-option no-results">
                    {citiesByCountry[formData.countryCode]?.length === 0 ? "No cities available for this country" : "No cities found"}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hotel Searchable Dropdown */}
          <div className="form-group searchable-dropdown" ref={hotelDropdownRef}>
            <label>Hotel <span className="required">*</span></label>
            <input
              type="text"
              value={hotelSearch}
              onChange={(e) => {
                setHotelSearch(e.target.value);
                setShowHotelDropdown(true);
              }}
              onFocus={() => setShowHotelDropdown(true)}
              placeholder="Search for a hotel..."
              required
              disabled={!formData.city}
            />
            {showHotelDropdown && formData.city && (
              <div className="dropdown-options">
                {filteredHotels.length > 0 ? (
                  <>
                    {filteredHotels.map(hotel => (
                      <div 
                        key={hotel.id} 
                        className="dropdown-option"
                        onClick={() => handleHotelSelect(hotel)}
                      >
                        <div className="hotel-name">{highlightText(hotel.name, hotelSearch)}</div>
                        {hotel.address && (
                          <div className="hotel-address">{highlightText(hotel.address, hotelSearch)}</div>
                        )}
                      </div>
                    ))}
                    <div 
                      className="dropdown-option manual-option"
                      onClick={handleManualHotel}
                    >
                      <div className="hotel-name">Use "{hotelSearch}" as hotel name</div>
                      <div className="hotel-address">Enter address manually</div>
                    </div>
                  </>
                ) : (
                  <div 
                    className="dropdown-option manual-option"
                    onClick={handleManualHotel}
                  >
                    <div className="hotel-name">Use " {hotelSearch} " as hotel name</div>
                    <div className="hotel-address">Enter address manually</div>
                  </div>
                )}
              </div>
            )}
            {error && (
              <p className="error-message">{error}</p>
            )}
          </div>

          {/* Hotel Contact Number */}
          <div className="form-group">
            <label htmlFor="hotelContactNumber">Hotel Contact Number:</label>
            <input
              type="tel"
              id="hotelContactNumber"
              name="hotelContactNumber"
              value={formData.hotelContactNumber}
              onChange={(e) => handlePhoneChange(e, 'hotelContactNumber')}
              placeholder={getCurrentPhoneCode() + " XXX XXX XXXX"}
            />
            <div className="form-note">
              Country code: {getCurrentPhoneCode()}
            </div>
          </div>

          {/* Address */}
          <div className="form-group">
            <label>Address<span className="required">*</span></label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Hotel address"
              readOnly={isHotelFromDatabase}
              required
            />
            {isHotelFromDatabase && (
              <div className="form-note">
                Address from our database
              </div>
            )}
          </div>
        </div>

        {/* Contact Persons Section */}
        <div className="form-section">
          <h3>Contact Persons</h3>
          
          {renderContactSection("Sales Person", "salesPerson")}
          {renderContactSection("Reservation Person", "reservationPerson")}
          {renderContactSection("Accounts Person", "accountsPerson")}
          {renderContactSection("Reception Person", "receptionPerson")}
          {renderContactSection("Concierge", "concierge")}
        </div>

        {/* Special Remarks Section */}
        <div className="form-section">
          <h3>Special Remarks</h3>
          <div className="form-group">
            <label htmlFor="specialRemarks">Remarks:</label>
            <textarea
              id="specialRemarks"
              name="specialRemarks"
              value={formData.specialRemarks}
              onChange={handleChange}
              placeholder="Enter any special remarks or notes about this hotel"
              rows="4"
            />
          </div>
        </div>
        <div className="button-container">
          <button type="submit" className="submit-btn">Submit Form</button>
        </div>
      </form>
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// Hotel Sales List Component (Enhanced version)
const HotelSalesList = ({ showNotification }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHotel, setEditingHotel] = useState(null);
  const [viewHotel, setViewHotel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const navigate = useNavigate();

  const API_URL = "https://hotels-8v0p.onrender.com/api/hotelsales";

  // Fetch all hotels
  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setHotels(data);
    } catch (err) {
      console.error("Error fetching hotels:", err);
      showNotification("Error fetching hotels", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  // Delete hotel
  const deleteHotel = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;

    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setHotels((prev) => prev.filter((h) => h.id !== id));
      showNotification("Hotel deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting hotel:", err);
      showNotification("Error deleting hotel", "error");
    }
  };

  // Save updated hotel
  const saveHotel = async (hotel) => {
    try {
      await fetch(`${API_URL}/${hotel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotel),
      });
      setEditingHotel(null);
      fetchHotels();
      showNotification("Hotel updated successfully!", "success");
    } catch (err) {
      console.error("Error updating hotel:", err);
      showNotification("Error updating hotel", "error");
    }
  };

  // Filter hotels based on search and filters
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCountry = filterCountry ? hotel.country === filterCountry : true;
    const matchesCity = filterCity ? hotel.city === filterCity : true;
    
    return matchesSearch && matchesCountry && matchesCity;
  });

  // Get unique countries and cities for filters
  const countries = [...new Set(hotels.map(hotel => hotel.country).filter(Boolean))];
  const cities = [...new Set(hotels.map(hotel => hotel.city).filter(Boolean))];

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading hotels...</p>
    </div>
  );

  return (
    <div className="hotel-sales-list">
      <div className="header-section">
        <h2>Hotel Sales List</h2>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by hotel, city, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterCountry} 
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          
          <select 
            value={filterCity} 
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          
          <button 
            className="clear-filters"
            onClick={() => {
              setFilterCountry("");
              setFilterCity("");
              setSearchTerm("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <p>Showing {filteredHotels.length} of {hotels.length} hotels</p>
      </div>

      {filteredHotels.length === 0 ? (
        <div className="no-results">
          <h3>No hotels found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="hotels-container">
          {filteredHotels.map((hotel) => (
            <div key={hotel.id} className="hotel-card">
              <div className="hotel-header">
                <h3>{hotel.hotelName}</h3>
                <div className="hotel-location">
                  <FaMapMarkerAlt /> 
                  <span className="city">{hotel.city}</span>, 
                  <span className="country"> {hotel.country}</span>
                </div>
              </div>
              
              <div className="hotel-contacts">
                <div className="contact-item">
                  <FaUserTie /> <strong>Sales:</strong> {hotel.salesPersonName} 
                  {hotel.salesPersonEmail && ` (${hotel.salesPersonEmail})`}
                </div>
                {hotel.reservationPersonName && (
                  <div className="contact-item">
                    <FaClipboardList /> <strong>Reservation:</strong> {hotel.reservationPersonName}
                  </div>
                )}
              </div>
              
              <div className="hotel-actions">
                <button 
                  className="view-details-btn"
                  onClick={() => setViewHotel(hotel)}
                >
                  <FaEye /> View Details
                </button>
                
                <div className="action-buttons">
                  <button 
                    className="edit-btn"
                    onClick={() => setEditingHotel(hotel)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteHotel(hotel.id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* View Details Modal */}
      <Modal 
        isOpen={!!viewHotel} 
        onClose={() => setViewHotel(null)}
        title="Hotel Details"
      >
        {viewHotel && (
          <div className="hotel-details-modal">
            <div className="hotel-basic-info">
              <h3>{viewHotel.hotelName}</h3>
              <div className="hotel-location">
                <FaMapMarkerAlt /> 
                {viewHotel.city}, {viewHotel.country}
              </div>
              {viewHotel.address && (
                <div className="detail-item">
                  <FaBuilding /> <strong>Address:</strong> {viewHotel.address}
                </div>
              )}
              {viewHotel.hotelContactNumber && (
                <div className="detail-item">
                  <FaPhone /> <strong>Hotel Contact:</strong> {viewHotel.hotelContactNumber}
                </div>
              )}
            </div>
            
            <div className="contact-persons-section">
              <h4>Contact Persons</h4>
              
              {viewHotel.salesPersonName && (
                <div className="contact-person">
                  <h5><FaUserTie /> Sales Person</h5>
                  <p><strong>Name:</strong> {viewHotel.salesPersonName}</p>
                  {viewHotel.salesPersonEmail && <p><strong>Email:</strong> {viewHotel.salesPersonEmail}</p>}
                  {viewHotel.salesPersonContact && <p><strong>Contact:</strong> {viewHotel.salesPersonContact}</p>}
                </div>
              )}
              
              {viewHotel.reservationPersonName && (
                <div className="contact-person">
                  <h5><FaClipboardList /> Reservation Person</h5>
                  <p><strong>Name:</strong> {viewHotel.reservationPersonName}</p>
                  {viewHotel.reservationPersonEmail && <p><strong>Email:</strong> {viewHotel.reservationPersonEmail}</p>}
                  {viewHotel.reservationPersonContact && <p><strong>Contact:</strong> {viewHotel.reservationPersonContact}</p>}
                </div>
              )}
              
              {viewHotel.accountsPersonName && (
                <div className="contact-person">
                  <h5><FaMoneyCheckAlt /> Accounts Person</h5>
                  <p><strong>Name:</strong> {viewHotel.accountsPersonName}</p>
                  {viewHotel.accountsPersonEmail && <p><strong>Email:</strong> {viewHotel.accountsPersonEmail}</p>}
                  {viewHotel.accountsPersonContact && <p><strong>Contact:</strong> {viewHotel.accountsPersonContact}</p>}
                </div>
              )}
              
              {viewHotel.receptionPersonName && (
                <div className="contact-person">
                  <h5><FaReceipt /> Reception Person</h5>
                  <p><strong>Name:</strong> {viewHotel.receptionPersonName}</p>
                  {viewHotel.receptionPersonEmail && <p><strong>Email:</strong> {viewHotel.receptionPersonEmail}</p>}
                  {viewHotel.receptionPersonContact && <p><strong>Contact:</strong> {viewHotel.receptionPersonContact}</p>}
                </div>
              )}
              
              {viewHotel.conciergeName && (
                <div className="contact-person">
                  <h5><FaConciergeBell /> Concierge</h5>
                  <p><strong>Name:</strong> {viewHotel.conciergeName}</p>
                  {viewHotel.conciergeEmail && <p><strong>Email:</strong> {viewHotel.conciergeEmail}</p>}
                  {viewHotel.conciergeContact && <p><strong>Contact:</strong> {viewHotel.conciergeContact}</p>}
                </div>
              )}
            </div>
            
            {viewHotel.specialRemarks && (
              <div className="special-remarks-section">
                <h4><FaInfoCircle /> Special Remarks</h4>
                <p>{viewHotel.specialRemarks}</p>
              </div>
            )}
            
            {viewHotel.facilitiesAvailable && viewHotel.facilitiesAvailable.length > 0 && (
              <div className="facilities-section">
                <h4><FaStar /> Facilities Available</h4>
                <div className="facilities-list">
                  {viewHotel.facilitiesAvailable.map((facility, index) => (
                    <span key={index} className="facility-tag">{facility}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* Edit Hotel Modal */}
      <Modal 
        isOpen={!!editingHotel} 
        onClose={() => setEditingHotel(null)}
        title="Edit Hotel Information"
      >
        {editingHotel && (
          <div className="edit-hotel-form">
            <div className="form-section">
              <h3>Hotel Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Hotel Name:</label>
                  <input
                    value={editingHotel.hotelName || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, hotelName: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Country:</label>
                  <input
                    value={editingHotel.country || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, country: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>City:</label>
                  <input
                    value={editingHotel.city || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, city: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Address:</label>
                  <input
                    value={editingHotel.address || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, address: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Contact Number:</label>
                  <input
                    value={editingHotel.hotelContactNumber || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, hotelContactNumber: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Contact Persons</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Sales Person Name:</label>
                  <input
                    value={editingHotel.salesPersonName || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, salesPersonName: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Sales Email:</label>
                  <input
                    value={editingHotel.salesPersonEmail || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, salesPersonEmail: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Sales Contact:</label>
                  <input
                    value={editingHotel.salesPersonContact || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, salesPersonContact: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Reservation Person Name:</label>
                  <input
                    value={editingHotel.reservationPersonName || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, reservationPersonName: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Reservation Email:</label>
                  <input
                    value={editingHotel.reservationPersonEmail || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, reservationPersonEmail: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Reservation Contact:</label>
                  <input
                    value={editingHotel.reservationPersonContact || ""}
                    onChange={(e) => setEditingHotel({...editingHotel, reservationPersonContact: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Additional Information</h3>
              
              <div className="form-group full-width">
                <label>Special Remarks:</label>
                <textarea
                  value={editingHotel.specialRemarks || ""}
                  onChange={(e) => setEditingHotel({...editingHotel, specialRemarks: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="form-group full-width">
                <label>Facilities (comma separated):</label>
                <input
                  value={editingHotel.facilitiesAvailable?.join(", ") || ""}
                  onChange={(e) => setEditingHotel({
                    ...editingHotel, 
                    facilitiesAvailable: e.target.value.split(",").map(f => f.trim())
                  })}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="save-btn"
                onClick={() => saveHotel(editingHotel)}
              >
                <FaSave /> Save Changes
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setEditingHotel(null)}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HotelManagementSystem;
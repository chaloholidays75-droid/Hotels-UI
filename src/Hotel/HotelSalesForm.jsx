import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  FaCheckCircle, FaTimesCircle, FaUserTie, FaEnvelope, FaPhone,
  FaMinus, FaPlus, FaBuilding, FaMapMarkerAlt, FaStar, FaInfoCircle,
  FaSave, FaTimes, FaEye, FaEdit, FaTrash, FaSearch, FaClipboardList,
  FaMoneyCheckAlt, FaReceipt, FaConciergeBell, FaChevronDown, FaFilter, FaCalendar,
  FaSort, FaSortUp, FaSortDown, FaEllipsisV, FaExternalLinkAlt, FaHotel, FaUsers, FaGlobe,
  FaChartBar, FaDollarSign, FaIdBadge, FaCity, FaRegChartBar
} from 'react-icons/fa';
import './HotelManagementSystem.css';


// Main Component
const HotelManagementSystem = () => {
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('view');

  const showNotification = useCallback((message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  }, []);



  return (
    <div className="hotel-management-system">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification({ show: false, message: '', type: '' })}>
              <FaTimes />
            </button>
          </div>
        </div>
      )}
      
      <div className="system-header">
        <h1>Hotel Management System</h1>
        <p>Manage hotel information, contacts, and facilities</p>
      </div>
      
      <div className="stats-bar">
        <div className="stat-item"><FaHotel /> Total Hotels <span>156</span></div>
        <div className="stat-item active-contacts"><FaUsers /> Active Contacts <span>342</span></div>
        <div className="stat-item"><FaGlobe /> Countries <span>24</span></div>
        <div className="stat-item new-this-month"><FaCalendar /> New This Month <span>12</span></div>
      </div>
      
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={activeTab === 'add' ? 'active' : ''} 
            onClick={() => setActiveTab('add')}
          >
            <FaPlus /> Add Hotel
          </button>
          <button 
            className={activeTab === 'view' ? 'active' : ''} 
            onClick={() => setActiveTab('view')}
          >
            <FaBuilding /> View Hotels
          </button>
          <button 
            className={activeTab === 'analytics' ? 'active' : ''} 
            onClick={() => setActiveTab('analytics')}
          >
            <FaChartBar /> Analytics
          </button>
        </div>
      </div>
      
      <div className="tab-content">
        {activeTab === 'add' && <AddHotelTab showNotification={showNotification} />}
        {activeTab === 'view' && <HotelSalesList showNotification={showNotification} />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
};

// Contact Person Component
const ContactPersonFields = ({ person, onChange, onRemove, index, role, phoneCode }) => (
  <div className="contact-person-fields">
    <div className="form-row">
      <div className="form-group">
        <label>Name <span className="required">*</span></label>
        <input
          type="text"
          value={person.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          required
          placeholder="Full name"
        />
      </div>
      <div className="form-group">
        <label>Email <span className="required">*</span></label>
        <input
          type="email"
          value={person.email}
          onChange={(e) => onChange(index, 'email', e.target.value)}
          required
          placeholder="email@example.com"
        />
      </div>
      <div className="form-group">
        <label>Contact <span className="required">*</span></label>
        <div className="phone-input-container">
          <span className="phone-prefix">{phoneCode}</span>
          <input
            type="tel"
            value={(person.contact || '').replace(phoneCode, '').trim()}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              onChange(index, 'contact', `${phoneCode} ${digits}`);
            }}
            placeholder="XXX XXX XXXX"
            required
          />
        </div>
      </div>
      {index > 0 && (
        <div className="form-group remove-btn-container">
          <button type="button" className="remove-person-btn" onClick={() => onRemove(index)}>
            <FaMinus />
          </button>
        </div>
      )}
    </div>
  </div>
);

// Contact Role Section
const ContactRoleSection = ({ title, role, persons, onAdd, onRemove, onChange, phoneCode, icon }) => (
  <div className="contact-section">
    <div className="section-header">
      <h4>{icon} {title}</h4>
      <span className="person-count">{persons.length} {persons.length === 1 ? 'person' : 'persons'}</span>
    </div>
    {persons.map((person, index) => (
      <ContactPersonFields 
        key={index} 
        person={person} 
        onChange={(idx, field, value) => onChange(role, idx, field, value)} 
        onRemove={(idx) => onRemove(role, idx)}
        index={index}
        role={role}
        phoneCode={phoneCode}
      />
    ))}
    <button type="button" className="add-person-btn" onClick={() => onAdd(role)}>
      <FaPlus /> Add {title}
    </button>
  </div>
);

// Add Hotel Tab Component


const API_BASE = "https://hotels-8v0p.onrender.com/api";
const API_BASE_HOTEL = `${API_BASE}/hotels`;

const AddHotelTab = ({ showNotification, setActiveTab }) => {
  const [formData, setFormData] = useState({
    country: "", countryCode: "", countryId: null,
    city: "", cityId: null,
    hotelName: "", hotelEmail: "", hotelContactNumber: "", address: "", hotelChain: "",
    salesPersons: [{ name: "", email: "", contact: "" }],
    reservationPersons: [{ name: "", email: "", contact: "" }],
    accountsPersons: [{ name: "", email: "", contact: "" }],
    receptionPersons: [{ name: "", email: "", contact: "" }],
    concierges: [{ name: "", email: "", contact: "" }],
    specialRemarks: "", facilitiesAvailable: [], creditCategory: ""
  });

  const [countries, setCountries] = useState([]);
  const [citiesByCountry, setCitiesByCountry] = useState({});
  const [hotelsInCity, setHotelsInCity] = useState([]);

  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [hotelSearch, setHotelSearch] = useState("");

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);

  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const hotelDropdownRef = useRef(null);

  const [highlightedIndex, setHighlightedIndex] = useState({ country: -1, city: -1, hotel: -1 });

  // ================= Utility =================
  const getCurrentPhoneCode = () => {
    const country = countries.find(c => c.code === formData.countryCode);
    return country?.phoneCode || "+1";
  };

  const highlightText = (text, search) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? <b key={i}>{part}</b> : part
    );
  };

  // ================= Filters =================
  const filteredCountries = countries.filter(c =>
    (c.name || "").toLowerCase().includes((countrySearch || "").toLowerCase())
  );

  const filteredCities = formData.countryCode
    ? (citiesByCountry[formData.countryCode]?.filter(c =>
        (c.name || "").toLowerCase().includes((citySearch || "").toLowerCase())
      ) || [])
    : [];

  const filteredHotels = hotelsInCity.filter(h =>
    (h.hotelName || "").toLowerCase().includes((hotelSearch || "").toLowerCase())
  );

  // ================= Selection =================
  const handleCountrySelect = (code, name, id) => {
    setFormData({ ...formData, countryCode: code, country: name, countryId: id, city: "", cityId: null, hotelName: "", hotelEmail: "", hotelContactNumber: "", address: "", hotelChain: "" });
    setCountrySearch(name);
    setShowCountryDropdown(false);
    setHotelsInCity([]);
    setCitySearch("");
    setHotelSearch("");
  };

  const handleCitySelect = (name, id) => {
    setFormData({ ...formData, city: name, cityId: id, hotelName: "", hotelEmail: "", hotelContactNumber: "", address: "", hotelChain: "" });
    setCitySearch(name);
    setShowCityDropdown(false);
    setHotelSearch("");
    fetchHotels(id);
  };

  const handleHotelSelect = hotel => {
    setFormData({
      ...formData,
      hotelName: hotel.hotelName,
      hotelEmail: hotel.hotelEmail || "",
      hotelContactNumber: hotel.hotelContactNumber || "",
      address: hotel.address || "",
      hotelChain: hotel.hotelChain || ""
    });
    setHotelSearch(hotel.hotelName);
    setShowHotelDropdown(false);
  };

  // ================= Keyboard Navigation =================
  const handleDropdownKeys = (e, type, items, onSelect) => {
    if (![ "ArrowDown", "ArrowUp", "Enter" ].includes(e.key)) return;
    e.preventDefault();

    let index = highlightedIndex[type];
    if (e.key === "ArrowDown") index = (index + 1) % items.length;
    if (e.key === "ArrowUp") index = (index - 1 + items.length) % items.length;
    if (e.key === "Enter") {
      if (items[index]) onSelect(items[index]);
      return;
    }
    setHighlightedIndex(prev => ({ ...prev, [type]: index }));
  };

  // ================= Manual Entry =================
  const handleManualCountry = async () => {
    const name = countrySearch.trim();
    if (!name) return;
    const exists = countries.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return handleCountrySelect(exists.code, exists.name, exists.id);

    try {
      const res = await fetch(`${API_BASE}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          code: name.slice(0, 2).toUpperCase(),
          phoneCode: "+1"
        })
      });
      if (!res.ok) throw new Error("Failed to create country");
      const data = await res.json();
      setCountries(prev => [...prev, data]);
      handleCountrySelect(data.code, data.name, data.id);
      showNotification("Country added successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Error adding country", "error");
    }
  };

  const handleManualCity = async () => {
    if (!citySearch.trim() || !formData.countryId) return;

    try {
      const res = await fetch(`${API_BASE}/cities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: citySearch.trim(),
          countryId: formData.countryId
        })
      });
      if (!res.ok) throw new Error("Failed to create city");
      const data = await res.json();
      setCitiesByCountry(prev => ({
        ...prev,
        [formData.countryCode]: [...(prev[formData.countryCode] || []), { id: data.id, name: data.name }]
      }));
      handleCitySelect(data.name, data.id);
      showNotification("City added successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Error adding city", "error");
    }
  };

  // ================= Fetch =================
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(`${API_BASE}/countries`);
        if (!res.ok) throw new Error("Failed to fetch countries");
        const data = await res.json();
        setCountries(data);
        const mapping = {};
        data.forEach(c => mapping[c.code] = c.cities.map(city => ({ id: city.id, name: city.name })));
        setCitiesByCountry(mapping);
      } catch (err) { console.error(err); }
    };
    fetchCountries();
  }, []);

  const fetchHotels = async cityId => {
    if (!cityId) return;
    try {
      const res = await fetch(`${API_BASE_HOTEL}?cityId=${cityId}`);
      if (!res.ok) throw new Error("Failed to fetch hotels");
      const data = await res.json();
      setHotelsInCity(data);
    } catch (err) { console.error(err); }
  };

  // ================= Validation =================
  const validateForm = () => {
    const errors = {};
    if (!formData.country) errors.country = "Country is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.hotelName) errors.hotelName = "Hotel name is required";
    if (!formData.address) errors.address = "Address is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ================= Submit =================
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return showNotification("Please fill required fields first", "error");

    setIsSubmitting(true);
    try {
      const res = await fetch(API_BASE_HOTEL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          countryId: formData.countryId,
          cityId: formData.cityId
        })
      });
      if (!res.ok) throw new Error("Failed to create hotel");
      const data = await res.json();
      showNotification("Hotel created successfully!", "success");
      setActiveTab("view");
    } catch (err) {
      console.error(err);
      showNotification("Error creating hotel", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
<div className="hotel-form-container"> <div className="form-header"> <h2>Add Hotel Information</h2> <p>Fill in the details to add a new hotel</p> </div> <form onSubmit={handleSubmit} className="hotel-form"> {/* Hotel Info Section */} <div className="form-section"> <div className="section-header"><h3><FaBuilding /> Hotel Information</h3></div> <div className="form-grid"> {/* ================= Country Dropdown ================= */} <div className="form-group searchable-dropdown" ref={countryDropdownRef}> <label>Country <span className="required">*</span></label> <div className="dropdown-container"> <input type="text" value={countrySearch} onChange={e => { setCountrySearch(e.target.value); setShowCountryDropdown(true); }} onFocus={() => setShowCountryDropdown(true)} placeholder="Search country..." required className={validationErrors.country ? 'error' : ''} /> <FaChevronDown className="dropdown-chevron" /> </div> {showCountryDropdown && ( <div className="dropdown-options"> {filteredCountries.length > 0 ? ( filteredCountries.map(c => ( <div key={c.code} className="dropdown-option" onClick={() => handleCountrySelect(c.code, c.name)}> {highlightText(c.name, countrySearch)} </div> ))) : ( <div className="dropdown-option manual-option" onClick={handleManualCountry}> Add "{countrySearch}" as new country </div> )} </div> )} </div> {/* ================= City Dropdown ================= */} <div className="form-group searchable-dropdown" ref={cityDropdownRef}> <label>City <span className="required">*</span></label> <div className="dropdown-container"> <input type="text" value={citySearch} onChange={e => { setCitySearch(e.target.value); setShowCityDropdown(true); }} onFocus={() => setShowCityDropdown(true)} placeholder="Search city..." required disabled={!formData.country} className={validationErrors.city ? 'error' : ''} /> <FaChevronDown className="dropdown-chevron" /> </div> {showCityDropdown && formData.country && ( <div className="dropdown-options"> {filteredCities.length > 0 ? ( filteredCities.map(c => ( <div key={c.id} className="dropdown-option" onClick={() => handleCitySelect(c.name, c.id)}> {highlightText(c.name, citySearch)} </div> )) ) : ( <div className="dropdown-option manual-option" onClick={handleManualCity}> Use "{citySearch}" as new city </div> )} </div> )} </div> {/* ================= Hotel Dropdown ================= */} <div className="form-group searchable-dropdown" ref={hotelDropdownRef}> <label>Hotel <span className="required">*</span></label> <div className="dropdown-container"> <input type="text" value={hotelSearch} onChange={e => { setHotelSearch(e.target.value); setShowHotelDropdown(true); }} onFocus={() => setShowHotelDropdown(true)} placeholder="Search hotel..." required disabled={!formData.city} className={validationErrors.hotelName ? 'error' : ''} /> <FaChevronDown className="dropdown-chevron" /> </div> {showHotelDropdown && formData.city && ( <div className="dropdown-options"> {filteredHotels.length > 0 ? ( filteredHotels.map(h => ( <div key={h.id} className="dropdown-option hotel-option" onClick={() => handleHotelSelect(h)}> {highlightText(h.hotelName, hotelSearch)} </div> ))) : ( <div className="dropdown-option manual-option" onClick={handleManualHotel}> Add "{hotelSearch}" as new hotel </div> )} </div> )} {error && <p className="error-message">{error}</p>} </div> {/* Address */} <div className="form-group"> <label>Address <span className="required">*</span></label> <input type="text" name="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Hotel address" required readOnly={isHotelFromDatabase} /> </div> {/* Hotel Contact */} <div className="form-group"> <label>Hotel Contact Number</label> <div className="phone-input-container"> <span className="phone-prefix">{getCurrentPhoneCode()}</span> <input type="tel" value={formData.hotelContactNumber.replace(getCurrentPhoneCode(), '').trim()} onChange={e => handlePhoneChange(e, 'hotelContactNumber')} placeholder="XXX XXX XXXX" readOnly={isHotelFromDatabase} /> </div> </div> {/* Hotel Email */} <div className="form-group"> <label>Email</label> <input type="email" name="hotelEmail" value={formData.hotelEmail} onChange={e => setFormData({ ...formData, hotelEmail: e.target.value })} placeholder="hotel@example.com" readOnly={isHotelFromDatabase} /> </div> {/* Hotel Chain */} <div className="form-group"> <label>Hotel Chain</label> <input type="text" name="hotelChain" value={formData.hotelChain} onChange={e => setFormData({ ...formData, hotelChain: e.target.value })} placeholder="Hotel chain (optional)" readOnly={isHotelFromDatabase} /> </div> </div> </div> {/* Contact Persons Section */} <div className="form-section"> <div className="section-header"><h3><FaUserTie /> Contact Persons</h3><p>Add contact information for hotel departments</p></div> <ContactRoleSection title="Sales Person" persons={formData.salesPersons} onAdd={() => addPerson('salesPersons')} onRemove={i => removePerson('salesPersons', i)} onChange={(i, f, v) => changePerson('salesPersons', i, f, v)} phoneCode={getCurrentPhoneCode()} icon={<FaUserTie />} /> <ContactRoleSection title="Reservation Person" persons={formData.reservationPersons} onAdd={() => addPerson('reservationPersons')} onRemove={i => removePerson('reservationPersons', i)} onChange={(i, f, v) => changePerson('reservationPersons', i, f, v)} phoneCode={getCurrentPhoneCode()} icon={<FaClipboardList />} /> <ContactRoleSection title="Accounts Person" persons={formData.accountsPersons} onAdd={() => addPerson('accountsPersons')} onRemove={i => removePerson('accountsPersons', i)} onChange={(i, f, v) => changePerson('accountsPersons', i, f, v)} phoneCode={getCurrentPhoneCode()} icon={<FaMoneyCheckAlt />} /> <ContactRoleSection title="Reception Person" persons={formData.receptionPersons} onAdd={() => addPerson('receptionPersons')} onRemove={i => removePerson('receptionPersons', i)} onChange={(i, f, v) => changePerson('receptionPersons', i, f, v)} phoneCode={getCurrentPhoneCode()} icon={<FaReceipt />} /> <ContactRoleSection title="Concierge" persons={formData.concierges} onAdd={() => addPerson('concierges')} onRemove={i => removePerson('concierges', i)} onChange={(i, f, v) => changePerson('concierges', i, f, v)} phoneCode={getCurrentPhoneCode()} icon={<FaConciergeBell />} /> </div> {/* Special Remarks */} <div className="form-section"> <div className="section-header"><h3><FaInfoCircle /> Special Remarks</h3></div> <div className="form-group full-width"> <textarea name="specialRemarks" value={formData.specialRemarks} onChange={e => setFormData({ ...formData, specialRemarks: e.target.value })} placeholder="Enter remarks" rows="5" /> </div> </div> {/* Form Actions */} <div className="form-actions"> <button type="submit" className="btn btn-primary" disabled={isSubmitting}> {isSubmitting ? 'Submitting...' : <><FaSave /> Submit Form</>} </button> <button type="button" className="btn btn-secondary" onClick={resetForm}>Reset Form</button> </div> </form> </div> )}
// Modal Component
const Modal = ({ isOpen, onClose, children, title, size = 'medium' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content modal-${size} modal-animate`} onClick={e => e.stopPropagation()}>
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

// Analytics Tab Component
const AnalyticsTab = () => {
  return (
    <div className="analytics-tab">
      <div className="analytics-header">
        <h2>Hotel Analytics Dashboard</h2>
        <p>Comprehensive insights into your hotel management system</p>
      </div>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-icon">
            <FaHotel />
          </div>
          <div className="analytics-content">
            <h3>156</h3>
            <p>Total Hotels</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-icon">
            <FaUsers />
          </div>
          <div className="analytics-content">
            <h3>342</h3>
            <p>Active Contacts</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-icon">
            <FaGlobe />
          </div>
          <div className="analytics-content">
            <h3>24</h3>
            <p>Countries</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="analytics-icon">
            <FaCalendar />
          </div>
          <div className="analytics-content">
            <h3>12</h3>
            <p>New This Month</p>
          </div>
        </div>
      </div>
      
      <div className="charts-section">
        <div className="chart-card">
          <h3>Hotels by Country</h3>
          <div className="chart-placeholder">
            <FaRegChartBar size={40} />
            <p>Country distribution chart</p>
          </div>
        </div>
        
        <div className="chart-card">
          <h3>Monthly Growth</h3>
          <div className="chart-placeholder">
            <FaChartBar size={40} />
            <p>Growth trend chart</p>
          </div>
        </div>
      </div>
      
      <div className="recent-activities">
        <h3>Recent Activities</h3>
        <div className="activities-list">
          <div className="activity-item">
            <div className="activity-icon">
              <FaPlus />
            </div>
            <div className="activity-content">
              <p>New hotel <strong>Grand Plaza</strong> added</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">
              <FaEdit />
            </div>
            <div className="activity-content">
              <p>Hotel <strong>Seaside Resort</strong> updated</p>
              <span className="activity-time">5 hours ago</span>
            </div>
          </div>
          
          <div className="activity-item">
            <div className="activity-icon">
              <FaUserTie />
            </div>
            <div className="activity-content">
              <p>New contact added to <strong>Mountain View Hotel</strong></p>
              <span className="activity-time">Yesterday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hotel Sales List Component
const HotelSalesList = ({ showNotification }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHotel, setEditingHotel] = useState(null);
  const [viewHotel, setViewHotel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('hotelName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const itemsPerPage = 10;


  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE_HOTEL);
      const data = await res.json();
      const adjustedData = data.map(hotel => ({
        ...hotel,
        salesPersons: Array.isArray(hotel.salesPersons) ? hotel.salesPersons : (hotel.salesPersonName ? [{name: hotel.salesPersonName, email: hotel.salesPersonEmail, contact: hotel.salesPersonContact}] : []),
        reservationPersons: Array.isArray(hotel.reservationPersons) ? hotel.reservationPersons : (hotel.reservationPersonName ? [{name: hotel.reservationPersonName, email: hotel.reservationPersonEmail, contact: hotel.reservationPersonContact}] : []),
        accountsPersons: Array.isArray(hotel.accountsPersons) ? hotel.accountsPersons : (hotel.accountsPersonName ? [{name: hotel.accountsPersonName, email: hotel.accountsPersonEmail, contact: hotel.accountsPersonContact}] : []),
        receptionPersons: Array.isArray(hotel.receptionPersons) ? hotel.receptionPersons : (hotel.receptionPersonName ? [{name: hotel.receptionPersonName, email: hotel.receptionPersonEmail, contact: hotel.receptionPersonContact}] : []),
        concierges: Array.isArray(hotel.concierges) ? hotel.concierges : (hotel.conciergeName ? [{name: hotel.conciergeName, email: hotel.conciergeEmail, contact: hotel.conciergeContact}] : []),
      }));
      setHotels(adjustedData);
    } catch (err) {
      console.error("Error fetching hotels:", err);
      showNotification("Error fetching hotels", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const deleteHotel = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;
    try {
      await fetch(`${API_BASE_HOTEL}/${id}`, { method: "DELETE" });
      setHotels(prev => prev.filter(h => h.id !== id));
      showNotification("Hotel deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting hotel:", err);
      showNotification("Error deleting hotel", "error");
    }
  };

  const deleteMultipleHotels = async () => {
    if (!selectedHotels.length || !window.confirm(`Are you sure you want to delete ${selectedHotels.length} hotels?`)) return;
    try {
      await Promise.all(selectedHotels.map(id => 
        fetch(`${API_BASE_HOTEL}/${id}`, { method: "DELETE" })
      ));
      setHotels(prev => prev.filter(h => !selectedHotels.includes(h.id)));
      setSelectedHotels([]);
      setBulkAction('');
      showNotification(`${selectedHotels.length} hotels deleted successfully!`, "success");
    } catch (err) {
      console.error("Error deleting hotels:", err);
      showNotification("Error deleting hotels", "error");
    }
  };

  const saveHotel = async (hotel) => {
    try {
      await fetch(`${API_BASE_HOTEL}/${hotel.id}`, {
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedHotels = [...hotels].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredHotels = sortedHotels.filter(hotel => {
    const matchesSearch = hotel.HotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry ? hotel.country === filterCountry : true;
    const matchesCity = filterCity ? hotel.city === filterCity : true;
    return matchesSearch && matchesCountry && matchesCity;
  });

  const countries = [...new Set(hotels.map(hotel => hotel.country).filter(Boolean))];
  const cities = [...new Set(hotels.map(hotel => hotel.city).filter(Boolean))];

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);

  const toggleSelectHotel = (id) => {
    setSelectedHotels(prev => 
      prev.includes(id) 
        ? prev.filter(hotelId => hotelId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedHotels.length === currentHotels.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels(currentHotels.map(hotel => hotel.id));
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading hotels...</p>
    </div>
  );

  return (
    <div className="hotel-sales-list">
      <div className="list-header">
        <h2>Hotel Management</h2>
        <p>View and manage all hotels in the system</p>
      </div>

      <div className="list-controls">
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
          <div className="filter-group">
            <FaFilter />
            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
              <option value="">All Countries</option>
              {countries.map(country => <option key={country} value={country}>{country}</option>)}
            </select>
          </div>
          
          <div className="filter-group">
            <FaFilter />
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
              <option value="">All Cities</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          
          <button className="btn btn-secondary" onClick={() => { setFilterCountry(""); setFilterCity(""); setSearchTerm(""); }}>
            Clear Filters
          </button>
        </div>

        {selectedHotels.length > 0 && (
          <div className="bulk-actions">
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
              <option value="">Bulk Actions</option>
              <option value="delete">Delete Selected</option>
            </select>
            <button 
              className="btn btn-danger" 
              onClick={deleteMultipleHotels}
              disabled={!bulkAction}
            >
              Apply
            </button>
            <span className="selected-count">{selectedHotels.length} selected</span>
          </div>
        )}
      </div>

      <div className="results-info">
        <p>Showing {filteredHotels.length} of {hotels.length} hotels</p>
        <div className="sort-controls">
          <span>Sort by:</span>
          <button 
            className={`sort-btn ${sortField === 'hotelName' ? 'active' : ''}`}
            onClick={() => handleSort('hotelName')}
          >
            Name {sortField === 'hotelName' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
          </button>
          <button 
            className={`sort-btn ${sortField === 'city' ? 'active' : ''}`}
            onClick={() => handleSort('city')}
          >
            City {sortField === 'city' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
          </button>
          <button 
            className={`sort-btn ${sortField === 'country' ? 'active' : ''}`}
            onClick={() => handleSort('country')}
          >
            Country {sortField === 'country' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
          </button>
        </div>
      </div>

      {filteredHotels.length === 0 ? (
        <div className="no-results">
          <h3>No hotels found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="hotels-table-container">
            <table className="hotels-table">
              <thead>
                <tr>
                  <th className="select-column">
                    <input
                      type="checkbox"
                      checked={selectedHotels.length === currentHotels.length && currentHotels.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleSort('hotelName')}>
                    Hotel Name {sortField === 'hotelName' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th onClick={() => handleSort('city')}>
                    City {sortField === 'city' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th onClick={() => handleSort('country')}>
                    Country {sortField === 'country' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th>Sales Contacts</th>
                  <th>Reservation Contacts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentHotels.map(hotel => (
                  <tr key={hotel.id} className={selectedHotels.includes(hotel.id) ? 'selected' : ''}>
                    <td className="select-column">
                      <input
                        type="checkbox"
                        checked={selectedHotels.includes(hotel.id)}
                        onChange={() => toggleSelectHotel(hotel.id)}
                      />
                    </td>
                    <td>
                      <div className="hotel-name-cell">
                        <div className="hotel-name">{hotel.hotelName}</div>
                        {hotel.hotelChain && <div className="hotel-chain">{hotel.hotelChain}</div>}
                      </div>
                    </td>
                    <td>{hotel.city}</td>
                    <td>
                      <div className="country-cell">
                        <span className="country-flag">
                          {countriesData.find(c => c.name === hotel.country)?.flag}
                        </span>
                        {hotel.country}
                      </div>
                    </td>
                    <td>
                      <div className="contact-count">
                        {hotel.salesPersons.length} {hotel.salesPersons.length === 1 ? 'person' : 'persons'}
                      </div>
                    </td>
                    <td>
                      <div className="contact-count">
                        {hotel.reservationPersons?.length || 0} {hotel.reservationPersons?.length === 1 ? 'person' : 'persons'}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon view-btn" onClick={() => setViewHotel(hotel)} title="View details">
                          <FaEye />
                        </button>
                        <button className="btn-icon edit-btn" onClick={() => setEditingHotel(hotel)} title="Edit">
                          <FaEdit />
                        </button>
                        <button className="btn-icon delete-btn" onClick={() => deleteHotel(hotel.id)} title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="rows-info">
              Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredHotels.length)} of {filteredHotels.length} entries
            </div>
            <div className="pagination">
              <button 
                className="btn btn-secondary"
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </button>
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={currentPage === pageNum ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && <span>...</span>}
              </div>
              <button 
                className="btn btn-secondary"
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
      
      <Modal isOpen={!!viewHotel} onClose={() => setViewHotel(null)} title="Hotel Details" size="large">
        {viewHotel && (
          <div className="hotel-details-modal">
            <div className="modal-section">
              <div className="hotel-basic-info">
                <h3>{viewHotel.hotelName}</h3>
                {viewHotel.hotelChain && <div className="hotel-chain-badge">{viewHotel.hotelChain}</div>}
                <div className="hotel-location">
                  <FaMapMarkerAlt /> 
                  <span>{viewHotel.address}, {viewHotel.city}, {viewHotel.country}</span>
                </div>
                <div className="detail-grid">
                  {viewHotel.hotelContactNumber && (
                    <div className="detail-item">
                      <FaPhone /> 
                      <div>
                        <div className="detail-label">Contact Number</div>
                        <div className="detail-value">{viewHotel.hotelContactNumber}</div>
                      </div>
                    </div>
                  )}
                  {viewHotel.hotelEmail && (
                  <div className="detail-item">
                    <FaEnvelope /> 
                    <div>
                      <div className="detail-label">Hotel Email</div>
                      <div className="detail-value">{viewHotel.hotelEmail}</div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h4><FaUserTie /> Contact Persons</h4>
              
              <div className="contact-persons-grid">
                {viewHotel.salesPersons.length > 0 && (
                  <div className="contact-category">
                    <h5><FaUserTie /> Sales Persons</h5>
                    {viewHotel.salesPersons.map((p, idx) => (
                      <div key={idx} className="contact-person-details">
                        <div className="contact-name">{p.name}</div>
                        {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                        {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                      </div>
                    ))}
                  </div>
                )}
                
                {viewHotel.reservationPersons.length > 0 && (
                  <div className="contact-category">
                    <h5><FaClipboardList /> Reservation Persons</h5>
                    {viewHotel.reservationPersons.map((p, idx) => (
                      <div key={idx} className="contact-person-details">
                        <div className="contact-name">{p.name}</div>
                        {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                        {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                      </div>
                    ))}
                  </div>
                )}
                
                {viewHotel.accountsPersons.length > 0 && (
                  <div className="contact-category">
                    <h5><FaMoneyCheckAlt /> Accounts Persons</h5>
                    {viewHotel.accountsPersons.map((p, idx) => (
                      <div key={idx} className="contact-person-details">
                        <div className="contact-name">{p.name}</div>
                        {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                        {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                      </div>
                    ))}
                  </div>
                )}
                
                {viewHotel.receptionPersons.length > 0 && (
                  <div className="contact-category">
                    <h5><FaReceipt /> Reception Persons</h5>
                    {viewHotel.receptionPersons.map((p, idx) => (
                      <div key={idx} className="contact-person-details">
                        <div className="contact-name">{p.name}</div>
                        {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                        {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                      </div>
                    ))}
                  </div>
                )}
                
                {viewHotel.concierges.length > 0 && (
                  <div className="contact-category">
                    <h5><FaConciergeBell /> Concierges</h5>
                    {viewHotel.concierges.map((p, idx) => (
                      <div key={idx} className="contact-person-details">
                        <div className="contact-name">{p.name}</div>
                        {p.email && <div className="contact-email"><FaEnvelope /> {p.email}</div>}
                        {p.contact && <div className="contact-phone"><FaPhone /> {p.contact}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {viewHotel.specialRemarks && (
              <div className="modal-section">
                <h4><FaInfoCircle /> Special Remarks</h4>
                <div className="remarks-content">{viewHotel.specialRemarks}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

// Edit Hotel Form Component
const EditHotelForm = ({ hotel, onSave, onCancel}) => {
  const [formData, setFormData] = useState(hotel);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updatePerson = (role, index, field, value) => {
    const key = `${role}s`;
    setFormData(prev => {
      const updated = [...prev[key]];
      updated[index][field] = value;
      return { ...prev, [key]: updated };
    });
  };

  const addPerson = (role) => {
    const key = `${role}s`;
    setFormData(prev => ({
      ...prev,
      [key]: [...prev[key], { name: '', email: '', contact: '' }]
    }));
  };

  const removePerson = (role, index) => {
    const key = `${role}s`;
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }));
  };


  return (
    <div className="edit-hotel-form">
      <div className="form-section">
        <div className="section-header">
          <h3><FaBuilding /> Hotel Information</h3>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Hotel Name <span className="required">*</span></label>
            <input 
              value={formData.hotelName || ""} 
              onChange={(e) => updateField('hotelName', e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Country <span className="required">*</span></label>
            <input 
              value={formData.country || ""} 
              onChange={(e) => updateField('country', e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>City <span className="required">*</span></label>
            <input 
              value={formData.city || ""} 
              onChange={(e) => updateField('city', e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Address <span className="required">*</span></label>
            <input 
              value={formData.address || ""} 
              onChange={(e) => updateField('address', e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input 
              value={formData.hotelContactNumber || ""} 
              onChange={(e) => updateField('hotelContactNumber', e.target.value)} 
            />
            <div className="form-group">
            <label>Hotel Email</label>
            <input 
              type="email"
              value={formData.hotelEmail || ""} 
              onChange={(e) => updateField('hotelEmail', e.target.value)} 
            />
          </div>
          </div>
          <div className="form-group">
            <label>Hotel Chain</label>
            <input 
              value={formData.hotelChain || ""} 
              onChange={(e) => updateField('hotelChain', e.target.value)} 
            />
          </div>
        </div>

      </div>
      
      <div className="form-section">
        <div className="section-header">
          <h3><FaUserTie /> Contact Persons</h3>
        </div>
        <ContactRoleSection 
          title="Sales Person" 
          role="salesPerson" 
          persons={formData.salesPersons} 
          onAdd={() => addPerson('salesPerson')} 
          onRemove={removePerson} 
          onChange={updatePerson} 
          phoneCode={'+1'}
          icon={<FaUserTie />}
        />
        <ContactRoleSection 
          title="Reservation Person" 
          role="reservationPerson" 
          persons={formData.reservationPersons} 
          onAdd={() => addPerson('reservationPerson')} 
          onRemove={removePerson} 
          onChange={updatePerson} 
          phoneCode={'+1'} 
          icon={<FaClipboardList />}
        />
        <ContactRoleSection 
          title="Accounts Person" 
          role="accountsPerson" 
          persons={formData.accountsPersons} 
          onAdd={() => addPerson('accountsPerson')} 
          onRemove={removePerson} 
          onChange={updatePerson} 
          phoneCode={'+1'} 
          icon={<FaMoneyCheckAlt />}
        />
        <ContactRoleSection 
          title="Reception Person" 
          role="receptionPerson" 
          persons={formData.receptionPersons} 
          onAdd={() => addPerson('receptionPerson')} 
          onRemove={removePerson} 
          onChange={updatePerson} 
          phoneCode={'+1'} 
          icon={<FaReceipt />}
        />
        <ContactRoleSection 
          title="Concierge" 
          role="concierge" 
          persons={formData.concierges} 
          onAdd={() => addPerson('concierge')} 
          onRemove={removePerson} 
          onChange={updatePerson} 
          phoneCode={'+1'} 
          icon={<FaConciergeBell />}
        />
      </div>
      
      <div className="form-section">
        <div className="section-header">
          <h3><FaInfoCircle /> Special Remarks</h3>
        </div>
        <div className="form-group full-width">
          <textarea
            value={formData.specialRemarks || ""}
            onChange={(e) => updateField('specialRemarks', e.target.value)}
            rows="5"
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <div className="spinner"></div> : <FaSave />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          <FaTimes /> Cancel
        </button>
      </div>
    </div>
  );
};

export default HotelManagementSystem;
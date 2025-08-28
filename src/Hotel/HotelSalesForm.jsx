import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import countriesData from '../data/countries.json';
import citiesData from '../data/cities.json';
import hotelsData from '../data/hotels.json';
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
            value={person.contact.replace(phoneCode, '').trim()}
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
const AddHotelTab = ({ showNotification }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    country: '',
    countryCode: '',
    city: '',
    hotelName: '',
     hotelEmail: '',
    hotelContactNumber: '',
    address: '',
    hotelChain: '',
    salesPersons: [{ name: '', email: '', contact: '' }],
    reservationPersons: [{ name: '', email: '', contact: '' }],
    accountsPersons: [{ name: '', email: '', contact: '' }],
    receptionPersons: [{ name: '', email: '', contact: '' }],
    concierges: [{ name: '', email: '', contact: '' }],
    creditCategory: '',
    specialRemarks: '',
    facilitiesAvailable: []
  });

  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [hotelSearch, setHotelSearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const hotelDropdownRef = useRef(null);

  const countries = countriesData;
  const citiesByCountry = citiesData;
  const hotelsInCity = formData.city ? hotelsData[formData.city] || [] : [];

  const getCurrentPhoneCode = () => {
    const country = countries.find(c => c.code === formData.countryCode);
    return country ? country.phoneCode : '+1';
  };

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

  const highlightText = (text, search) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? <span key={index} className="highlight">{part}</span> : part
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.country) errors.country = 'Country is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.hotelName) errors.hotelName = 'Hotel name is required';
    if (!formData.address) errors.address = 'Address is required';
    
    // Validate contact persons
    const contactRoles = ['salesPersons', 'reservationPersons', 'accountsPersons', 'receptionPersons', 'concierges'];
    contactRoles.forEach(role => {
      if (formData[role].some(p => !p.name || !p.email || !p.contact)) {
        errors[role] = `All ${role.replace('Persons', ' persons')} must have complete information`;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification('Please fix validation errors', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        "https://hotels-8v0p.onrender.com/api/hotels",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        showNotification("Hotel created successfully!", "success");
        const goToList = window.confirm(
          "Hotel Sale saved successfully! Do you want to see the hotel list?"
        );
        if (goToList) {
          setActiveTab('view');
        } else {
          resetForm();
        }
      } else {
        showNotification("Failed to save hotel sale.", "error");
      }
    } catch (error) {
      console.error("Error saving hotel sale:", error);
      showNotification("Error saving hotel sale.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      country: '',
      countryCode: '',
      city: '',
      hotelName: '',
      hotelEmail:'',
      hotelContactNumber: '',
      address: '',  
      hotelChain: '',
      salesPersons: [{ name: '', email: '', contact: '' }],
      reservationPersons: [{ name: '', email: '', contact: '' }],
      accountsPersons: [{ name: '', email: '', contact: '' }],
      receptionPersons: [{ name: '', email: '', contact: '' }],
      concierges: [{ name: '', email: '', contact: '' }],
      creditCategory: '',
      specialRemarks: '',
      facilitiesAvailable: []
    });
    setCountrySearch('');
    setCitySearch('');
    setHotelSearch('');
    setValidationErrors({});
  };

  const handleCountrySelect = (code, name) => {
    setFormData(prev => ({
      ...prev,
      country: name,
      countryCode: code,
      city: '',
      hotelName: '',
      hotelEmail:'',
      hotelContactNumber: '',
      address: '',
      hotelChain: ''
    }));
    setCountrySearch(name);
    setShowCountryDropdown(false);
    setCitySearch('');
    setHotelSearch('');
  };

  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, city }));
    setCitySearch(city);
    setShowCityDropdown(false);
  };

  const handleHotelSelect = (hotel) => {
    setFormData(prev => ({
      ...prev,
      hotelName: hotel.name,
      hotelEmail: hotel.email || '',
      hotelContactNumber: hotel.contactNumber || '',
      address: hotel.address,
      hotelChain: hotel.chain || ''
    }));
    setHotelSearch(hotel.name);
    setShowHotelDropdown(false);
    setError('');
  };

  const handleManualHotel = () => {
    if (hotelSearch.trim() === '') {
      setError('Please enter a hotel name');
      return;
    }
    setFormData(prev => ({
      ...prev,
      hotelName: hotelSearch,
      hotelEmail: '',
      hotelContactNumber: '',
      address: '',
      hotelChain: ''
    }));
    setShowHotelDropdown(false);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
     
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (e, field) => {
    const value = e.target.value.replace(/\D/g, '');
    const phoneCode = getCurrentPhoneCode().replace('+', '');
    const formatted = value.startsWith(phoneCode) 
      ? `+${phoneCode} ${value.substring(phoneCode.length)}`
      : `+${phoneCode} ${value}`;
    setFormData(prev => ({ ...prev, [field]: formatted }));
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

  const changePerson = (role, index, field, value) => {
    const key = `${role}s`;
    if (field === 'contact') {
      const digits = value.replace(/\D/g, '');
      const phoneCode = getCurrentPhoneCode().replace('+', '');
      value = digits.startsWith(phoneCode) 
        ? `+${phoneCode} ${digits.substring(phoneCode.length)}`
        : `+${phoneCode} ${digits}`;
    }
    setFormData(prev => {
      const updated = [...prev[key]];
      updated[index][field] = value;
      return { ...prev, [key]: updated };
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) setShowCountryDropdown(false);
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) setShowCityDropdown(false);
      if (hotelDropdownRef.current && !hotelDropdownRef.current.contains(event.target)) setShowHotelDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHotelFromDatabase = hotelsInCity.some(h => h.name === formData.hotelName);

  return (
    <div className="hotel-form-container">
      <div className="form-header">
        <h2>Add Hotel Information</h2>
        <p>Fill in the details below to add a new hotel to the system</p>
      </div>
      
      <form onSubmit={handleSubmit} className="hotel-form">
        <div className="form-section">
          <div className="section-header">
            <h3><FaBuilding /> Hotel Information</h3>
          </div>
          <div className="form-grid">
            <div className="form-group searchable-dropdown" ref={countryDropdownRef}>
              <label>Country <span className="required">*</span></label>
              <div className="dropdown-container">
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
                  className={validationErrors.country ? 'error' : ''}
                />
                <FaChevronDown className="dropdown-chevron" />
              </div>
              {validationErrors.country && <p className="error-message">{validationErrors.country}</p>}
              {showCountryDropdown && (
                <div className="dropdown-options">
                  {filteredCountries.length > 0 ? filteredCountries.map(country => (
                    <div key={country.code} className="dropdown-option" onClick={() => handleCountrySelect(country.code, country.name)}>
                      <span className="country-flag">{country.flag}</span>
                      <span className="country-name">{highlightText(country.name, countrySearch)}</span>
                      <span className="country-code">{country.code}</span>
                    </div>
                  )) : <div className="dropdown-option no-results">No countries found</div>}
                </div>
              )}
            </div>

            <div className="form-group searchable-dropdown" ref={cityDropdownRef}>
              <label>City <span className="required">*</span></label>
              <div className="dropdown-container">
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
                  className={validationErrors.city ? 'error' : ''}
                />
                <FaChevronDown className="dropdown-chevron" />
              </div>
              {validationErrors.city && <p className="error-message">{validationErrors.city}</p>}
              {showCityDropdown && formData.country && (
                <div className="dropdown-options">
                  {filteredCities.length > 0 ? filteredCities.map((city, index) => (
                    <div key={index} className="dropdown-option" onClick={() => handleCitySelect(city)}>
                      {highlightText(city, citySearch)}
                    </div>
                  )) : <div className="dropdown-option no-results">
                    {citiesByCountry[formData.countryCode]?.length === 0 ? "No cities available for this country" : "No cities found"}
                  </div>}
                </div>
              )}
            </div>

            <div className="form-group searchable-dropdown" ref={hotelDropdownRef}>
              <label>Hotel <span className="required">*</span></label>
              <div className="dropdown-container">
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
                  className={validationErrors.hotelName ? 'error' : ''}
                />
                <FaChevronDown className="dropdown-chevron" />
              </div>
              {validationErrors.hotelName && <p className="error-message">{validationErrors.hotelName}</p>}
              {showHotelDropdown && formData.city && (
                <div className="dropdown-options">
                  {filteredHotels.length > 0 ? (
                    <>
                      {filteredHotels.map(hotel => (
                        <div key={hotel.id} className="dropdown-option hotel-option" onClick={() => handleHotelSelect(hotel)}>
                          <div className="hotel-name">{highlightText(hotel.name, hotelSearch)}</div>
                          {hotel.address && <div className="hotel-address">{highlightText(hotel.address, hotelSearch)}</div>}
                          {hotel.chain && <div className="hotel-chain">{hotel.chain}</div>}
                        </div>
                      ))}
                      <div className="dropdown-option manual-option" onClick={handleManualHotel}>
                        <div className="hotel-name">Use "{hotelSearch}" as hotel name</div>
                        <div className="hotel-address">Enter address manually</div>
                      </div>
                    </>
                  ) : (
                    <div className="dropdown-option manual-option" onClick={handleManualHotel}>
                      <div className="hotel-name">Use "{hotelSearch}" as hotel name</div>
                      <div className="hotel-address">Enter address manually</div>
                    </div>
                  )}
                </div>
              )}
              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="form-group">
              <label>Hotel Contact Number</label>
              <div className="phone-input-container">
                <span className="phone-prefix">{getCurrentPhoneCode()}</span>
                <input
                  type="tel"
                  name="hotelContactNumber"
                  value={formData.hotelContactNumber.replace(getCurrentPhoneCode(), '').trim()}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    handlePhoneChange({target: {value: digits}}, 'hotelContactNumber');
                  }}
                  placeholder="XXX XXX XXXX"
                />
              </div>
              <div className="form-note">Country code: {getCurrentPhoneCode()}</div>
            </div>
            <div className="form-group">
              <label>Hotel Email</label>
              <input
                type="email"
                name="hotelEmail"
                value={formData.hotelEmail}
                onChange={handleChange}
                placeholder="hotel@example.com"
              />
            </div>
            <div className="form-group">
              <label>Address <span className="required">*</span></label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Hotel address"
                readOnly={isHotelFromDatabase}
                required
                className={validationErrors.address ? 'error' : ''}
              />
              {validationErrors.address && <p className="error-message">{validationErrors.address}</p>}
              {isHotelFromDatabase && <div className="form-note">Address from our database</div>}
            </div>

            <div className="form-group">
              <label>Hotel Chain</label>
              <input
                type="text"
                name="hotelChain"
                value={formData.hotelChain}
                onChange={handleChange}
                placeholder="Hotel chain (optional)"
                readOnly={isHotelFromDatabase}
              />
            </div>
          </div>


        </div>

        <div className="form-section">
          <div className="section-header">
            <h3><FaUserTie /> Contact Persons</h3>
            <p>Add contact information for different hotel departments</p>
          </div>
          {validationErrors.salesPersons && <p className="error-message">{validationErrors.salesPersons}</p>}
          <ContactRoleSection 
            title="Sales Person" 
            role="salesPerson" 
            persons={formData.salesPersons} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={<FaUserTie />}
          />
          <ContactRoleSection 
            title="Reservation Person" 
            role="reservationPerson" 
            persons={formData.reservationPersons} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={<FaClipboardList />}
          />
          <ContactRoleSection 
            title="Accounts Person" 
            role="accountsPerson" 
            persons={formData.accountsPersons} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={<FaMoneyCheckAlt />}
          />
          <ContactRoleSection 
            title="Reception Person" 
            role="receptionPerson" 
            persons={formData.receptionPersons} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={<FaReceipt />}
          />
          <ContactRoleSection 
            title="Concierge" 
            role="concierge" 
            persons={formData.concierges} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={<FaConciergeBell />}
          />
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3><FaInfoCircle /> Special Remarks</h3>
          </div>
          <div className="form-group full-width">
            <textarea
              name="specialRemarks"
              value={formData.specialRemarks}
              onChange={handleChange}
              placeholder="Enter any special remarks or notes about this hotel"
              rows="5"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <div className="spinner"></div> : <FaSave />}
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={resetForm}>
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

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

  const API_URL = "https://hotels-8v0p.onrender.com/api/hotels";

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
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
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
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
        fetch(`${API_URL}/${id}`, { method: "DELETE" })
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
    const matchesSearch = hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                        {hotel.ReservationPersons?.length || 0} {hotel.ReservationPersons?.length === 1 ? 'person' : 'persons'}
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
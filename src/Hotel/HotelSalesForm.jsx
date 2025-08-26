import React, { useState, useRef, useEffect } from 'react';
import './HotelSalesForm.css';
import { useNavigate } from "react-router-dom";

// Import JSON files
import countriesData from '../data/countries.json';
import citiesData from '../data/cities.json';
import hotelsData from '../data/hotels.json';

// Import icons (Font Awesome 6)
import { 
  FaEye, FaEdit, FaTrash, FaSearch, FaTimes, 
  FaSave, FaTimesCircle, FaCheckCircle, FaInfoCircle,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaBuilding,
  FaUserTie, FaClipboardList, FaConciergeBell,
  FaReceipt, FaMoneyCheckAlt, FaStar, FaPlus, FaMinus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const HotelManagementSystem = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };
  
  return (
    <div className="hotel-management-system">
      {notification.show && (
        <div className={`notification ${notification.type}`}>
          <FontAwesomeIcon icon={notification.type === 'success' ? FaCheckCircle : FaTimesCircle} />
          <span>{notification.message}</span>
        </div>
      )}
      
      <div className="tabs">
        <button 
          className={activeTab === 'add' ? 'active' : ''} 
          onClick={() => setActiveTab('add')}
        >
          <FontAwesomeIcon icon={FaPlus} /> Add Hotel
        </button>
        <button 
          className={activeTab === 'view' ? 'active' : ''} 
          onClick={() => setActiveTab('view')}
        >
          <FontAwesomeIcon icon={FaEye} /> View Hotels
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'add' && <AddHotelTab showNotification={showNotification} />}
        {activeTab === 'view' && <HotelSalesList showNotification={showNotification} />}
      </div>
    </div>
  );
};

// Contact Person Component
const ContactPersonFields = ({ person, onChange, onRemove, index, role, phoneCode }) => (
  <div className="contact-person-fields">
    <div className="form-group">
      <input
        type="text"
        value={person.name}
        onChange={(e) => onChange(index, 'name', e.target.value)}
        required
        placeholder=" "
      />
      <label><FontAwesomeIcon icon={FaUserTie} /> Name <span className="required">*</span></label>
    </div>
    <div className="form-group">
      <input
        type="email"
        value={person.email}
        onChange={(e) => onChange(index, 'email', e.target.value)}
        required
        placeholder=" "
      />
      <label><FontAwesomeIcon icon={FaEnvelope} /> Email <span className="required">*</span></label>
    </div>
    <div className="form-group">
      <input
        type="tel"
        value={person.contact}
        onChange={(e) => onChange(index, 'contact', e.target.value)}
        placeholder={`${phoneCode} XXX XXX XXXX`}
        required
      />
      <label><FontAwesomeIcon icon={FaPhone} /> Contact <span className="required">*</span></label>
    </div>
    {index > 0 && (
      <button type="button" className="remove-person-btn" onClick={() => onRemove(index)}>
        <FontAwesomeIcon icon={FaMinus} /> Remove
      </button>
    )}
  </div>
);

// Contact Role Section
const ContactRoleSection = ({ title, role, persons, onAdd, onRemove, onChange, phoneCode, icon }) => (
  <div className="contact-section">
    <h4><FontAwesomeIcon icon={icon} /> {title}</h4>
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
      <FontAwesomeIcon icon={FaPlus} /> Add {title}
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

  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const hotelDropdownRef = useRef(null);

  const countries = countriesData;
  const citiesByCountry = citiesData;
  const hotelsInCity = formData.city ? hotelsData[formData.city] || [] : [];

  const facilitiesOptions = [
    'Wi-Fi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Parking', 
    'Conference Rooms', 'Room Service', 'Pet Friendly', 'Airport Shuttle'
  ];

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
    if (formData.salesPersons.length === 0 || formData.salesPersons.some(p => !p.name || !p.email || !p.contact)) {
      errors.salesPersons = 'At least one complete sales person is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showNotification('Please fix validation errors', 'error');
      return;
    }

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
        const goToList = window.confirm(
          "Hotel Sale saved successfully! Do you want to see the hotel list?"
        );
        if (goToList) {
          document.querySelector('.tabs button:nth-child(2)').click();
        } else {
          setFormData({
            country: '',
            countryCode: '',
            city: '',
            hotelName: '',
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
        }
      } else {
        showNotification("Failed to save hotel sale.", "error");
      }
    } catch (error) {
      console.error("Error saving hotel sale:", error);
      showNotification("Error saving hotel sale.", "error");
    }
  };

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

  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, city }));
    setCitySearch(city);
    setShowCityDropdown(false);
  };

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        facilitiesAvailable: checked 
          ? [...prev.facilitiesAvailable, name]
          : prev.facilitiesAvailable.filter(item => item !== name)
      }));
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
      <h2><FontAwesomeIcon icon={FaBuilding} /> Add Hotel Information</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3><FontAwesomeIcon icon={FaBuilding} /> Hotel Information</h3>
          <div className="form-grid">
            <div className="form-group searchable-dropdown" ref={countryDropdownRef}>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setShowCountryDropdown(true);
                }}
                onFocus={() => setShowCountryDropdown(true)}
                placeholder=" "
                required
              />
              <label><FontAwesomeIcon icon={FaMapMarkerAlt} /> Country <span className="required">*</span></label>
              {validationErrors.country && <p className="error-message">{validationErrors.country}</p>}
              {showCountryDropdown && (
                <div className="dropdown-options">
                  {filteredCountries.length > 0 ? filteredCountries.map(country => (
                    <div key={country.code} className="dropdown-option" onClick={() => handleCountrySelect(country.code, country.name)}>
                      {country.flag} {highlightText(country.name, countrySearch)}
                    </div>
                  )) : <div className="dropdown-option no-results">No countries found</div>}
                </div>
              )}
            </div>

            <div className="form-group searchable-dropdown" ref={cityDropdownRef}>
              <input
                type="text"
                value={citySearch}
                onChange={(e) => {
                  setCitySearch(e.target.value);
                  setShowCityDropdown(true);
                }}
                onFocus={() => setShowCityDropdown(true)}
                placeholder=" "
                required
                disabled={!formData.country}
              />
              <label><FontAwesomeIcon icon={FaMapMarkerAlt} /> City <span className="required">*</span></label>
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
              <input
                type="text"
                value={hotelSearch}
                onChange={(e) => {
                  setHotelSearch(e.target.value);
                  setShowHotelDropdown(true);
                }}
                onFocus={() => setShowHotelDropdown(true)}
                placeholder=" "
                required
                disabled={!formData.city}
              />
              <label><FontAwesomeIcon icon={FaBuilding} /> Hotel <span className="required">*</span></label>
              {validationErrors.hotelName && <p className="error-message">{validationErrors.hotelName}</p>}
              {showHotelDropdown && formData.city && (
                <div className="dropdown-options">
                  {filteredHotels.length > 0 ? (
                    <>
                      {filteredHotels.map(hotel => (
                        <div key={hotel.id} className="dropdown-option" onClick={() => handleHotelSelect(hotel)}>
                          <div className="hotel-name">{highlightText(hotel.name, hotelSearch)}</div>
                          {hotel.address && <div className="hotel-address">{highlightText(hotel.address, hotelSearch)}</div>}
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
              <input
                type="tel"
                name="hotelContactNumber"
                value={formData.hotelContactNumber}
                onChange={(e) => handlePhoneChange(e, 'hotelContactNumber')}
                placeholder=" "
              />
              <label><FontAwesomeIcon icon={FaPhone} /> Hotel Contact Number</label>
              <div className="form-note">Country code: {getCurrentPhoneCode()}</div>
            </div>

            <div className="form-group">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder=" "
                readOnly={isHotelFromDatabase}
                required
              />
              <label><FontAwesomeIcon icon={FaMapMarkerAlt} /> Address <span className="required">*</span></label>
              {validationErrors.address && <p className="error-message">{validationErrors.address}</p>}
              {isHotelFromDatabase && <div className="form-note">Address from our database</div>}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="hotelChain"
                value={formData.hotelChain}
                onChange={handleChange}
                placeholder=" "
                readOnly={isHotelFromDatabase}
              />
              <label><FontAwesomeIcon icon={FaBuilding} /> Hotel Chain</label>
            </div>
          </div>

          <div className="form-group">
            <label><FontAwesomeIcon icon={FaStar} /> Facilities Available</label>
            <div className="facilities-grid">
              {facilitiesOptions.map(facility => (
                <label key={facility} className="facility-checkbox">
                  <input
                    type="checkbox"
                    name={facility}
                    checked={formData.facilitiesAvailable.includes(facility)}
                    onChange={handleChange}
                  />
                  <span>{facility}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><FontAwesomeIcon icon={FaUserTie} /> Contact Persons</h3>
          {validationErrors.salesPersons && <p className="error-message">{validationErrors.salesPersons}</p>}
          <ContactRoleSection 
            title="Sales Person" 
            role="salesPerson" 
            persons={formData.salesPersons} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={FaUserTie}
          />
          <ContactRoleSection 
            title="Reservation Person" 
            role="reservationPerson" 
            persons={formData.reservationPersons} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={FaClipboardList}
          />
          <ContactRoleSection 
            title="Accounts Person" 
            role="accountsPerson" 
            persons={formData.accountsPersons} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={FaMoneyCheckAlt}
          />
          <ContactRoleSection 
            title="Reception Person" 
            role="receptionPerson" 
            persons={formData.receptionPersons} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={FaReceipt}
          />
          <ContactRoleSection 
            title="Concierge" 
            role="concierge" 
            persons={formData.concierges} 
            onAdd={addPerson} 
            onRemove={removePerson} 
            onChange={changePerson} 
            phoneCode={getCurrentPhoneCode()} 
            icon={FaConciergeBell}
          />
        </div>

        <div className="form-section">
          <h3><FontAwesomeIcon icon={FaInfoCircle} /> Special Remarks</h3>
          <div className="form-group full-width">
            <textarea
              name="specialRemarks"
              value={formData.specialRemarks}
              onChange={handleChange}
              placeholder=" "
              rows="6"
            />
            <label>Remarks</label>
          </div>
        </div>

        <div className="button-container">
          <button type="submit" className="submit-btn"><FontAwesomeIcon icon={FaSave} /> Submit Form</button>
          <button type="button" className="cancel-btn" onClick={() => setFormData({
            country: '',
            countryCode: '',
            city: '',
            hotelName: '',
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
          })}><FontAwesomeIcon icon={FaTimes} /> Reset</button>
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
      <div className="modal-content modal-animate" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FontAwesomeIcon icon={FaInfoCircle} /> {title}</h3>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={FaTimes} />
          </button>
        </div>
        <div className="modal-body">
          {children}
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
  const itemsPerPage = 10;

  const API_URL = "https://hotels-8v0p.onrender.com/api/hotelsales";

  const facilitiesOptions = [
    'Wi-Fi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Parking', 
    'Conference Rooms', 'Room Service', 'Pet Friendly', 'Airport Shuttle'
  ];

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

  const filteredHotels = hotels.filter(hotel => {
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

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading hotels...</p>
    </div>
  );

  return (
    <div className="hotel-sales-list">
      <div className="header-section">
        <h2><FontAwesomeIcon icon={FaBuilding} /> Hotel Sales List</h2>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FontAwesomeIcon icon={FaSearch} className="search-icon" />
          <input
            type="text"
            placeholder=" "
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <label>Search by hotel, city, or country</label>
        </div>
        
        <div className="filter-controls">
          <div className="form-group">
            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
              <option value="">All Countries</option>
              {countries.map(country => <option key={country} value={country}>{country}</option>)}
            </select>
            <label><FontAwesomeIcon icon={FaMapMarkerAlt} /> Filter by Country</label>
          </div>
          
          <div className="form-group">
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
              <option value="">All Cities</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            <label><FontAwesomeIcon icon={FaMapMarkerAlt} /> Filter by City</label>
          </div>
          
          <button className="clear-filters" onClick={() => { setFilterCountry(""); setFilterCity(""); setSearchTerm(""); }}>
            <FontAwesomeIcon icon={FaTimes} /> Clear Filters
          </button>
        </div>
      </div>

      <div className="results-info">
        <p>Showing {filteredHotels.length} of {hotels.length} hotels</p>
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
                  <th>Hotel Name</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Sales Persons</th>
                  <th>Reservation Persons</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentHotels.map(hotel => (
                  <tr key={hotel.id}>
                    <td>{hotel.hotelName}</td>
                    <td>{hotel.city}</td>
                    <td>{hotel.country}</td>
                    <td>{hotel.salesPersons.length} {hotel.salesPersons.length === 1 ? 'person' : 'persons'}</td>
                    <td>{hotel.reservationPersons.length} {hotel.reservationPersons.length === 1 ? 'person' : 'persons'}</td>
                    <td>
                      <button className="view-btn" onClick={() => setViewHotel(hotel)}><FontAwesomeIcon icon={FaEye} /></button>
                      <button className="edit-btn" onClick={() => setEditingHotel(hotel)}><FontAwesomeIcon icon={FaEdit} /></button>
                      <button className="delete-btn" onClick={() => deleteHotel(hotel.id)}><FontAwesomeIcon icon={FaTrash} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
      
      <Modal isOpen={!!viewHotel} onClose={() => setViewHotel(null)} title="Hotel Details">
        {viewHotel && (
          <div className="hotel-details-modal">
            <div className="hotel-basic-info">
              <h3>{viewHotel.hotelName}</h3>
              <div className="hotel-location"><FontAwesomeIcon icon={FaMapMarkerAlt} /> {viewHotel.city}, {viewHotel.country}</div>
              {viewHotel.address && <div className="detail-item"><FontAwesomeIcon icon={FaBuilding} /> <strong>Address:</strong> {viewHotel.address}</div>}
              {viewHotel.hotelContactNumber && <div className="detail-item"><FontAwesomeIcon icon={FaPhone} /> <strong>Contact:</strong> {viewHotel.hotelContactNumber}</div>}
              {viewHotel.hotelChain && <div className="detail-item"><FontAwesomeIcon icon={FaBuilding} /> <strong>Chain:</strong> {viewHotel.hotelChain}</div>}
            </div>
            
            <div className="contact-persons-section">
              <h4><FontAwesomeIcon icon={FaUserTie} /> Contact Persons</h4>
              
              {viewHotel.salesPersons.length > 0 && (
                <div className="contact-person">
                  <h5><FontAwesomeIcon icon={FaUserTie} /> Sales Persons</h5>
                  {viewHotel.salesPersons.map((p, idx) => (
                    <div key={idx} className="contact-person-details">
                      <p><FontAwesomeIcon icon={FaUserTie} /> <strong>Name:</strong> {p.name}</p>
                      {p.email && <p><FontAwesomeIcon icon={FaEnvelope} /> <strong>Email:</strong> {p.email}</p>}
                      {p.contact && <p><FontAwesomeIcon icon={FaPhone} /> <strong>Contact:</strong> {p.contact}</p>}
                    </div>
                  ))}
                </div>
              )}
              
              {viewHotel.reservationPersons.length > 0 && (
                <div className="contact-person">
                  <h5><FontAwesomeIcon icon={FaClipboardList} /> Reservation Persons</h5>
                  {viewHotel.reservationPersons.map((p, idx) => (
                    <div key={idx} className="contact-person-details">
                      <p><FontAwesomeIcon icon={FaUserTie} /> <strong>Name:</strong> {p.name}</p>
                      {p.email && <p><FontAwesomeIcon icon={FaEnvelope} /> <strong>Email:</strong> {p.email}</p>}
                      {p.contact && <p><FontAwesomeIcon icon={FaPhone} /> <strong>Contact:</strong> {p.contact}</p>}
                    </div>
                  ))}
                </div>
              )}
              
              {viewHotel.accountsPersons.length > 0 && (
                <div className="contact-person">
                  <h5><FontAwesomeIcon icon={FaMoneyCheckAlt} /> Accounts Persons</h5>
                  {viewHotel.accountsPersons.map((p, idx) => (
                    <div key={idx} className="contact-person-details">
                      <p><FontAwesomeIcon icon={FaUserTie} /> <strong>Name:</strong> {p.name}</p>
                      {p.email && <p><FontAwesomeIcon icon={FaEnvelope} /> <strong>Email:</strong> {p.email}</p>}
                      {p.contact && <p><FontAwesomeIcon icon={FaPhone} /> <strong>Contact:</strong> {p.contact}</p>}
                    </div>
                  ))}
                </div>
              )}
              
              {viewHotel.receptionPersons.length > 0 && (
                <div className="contact-person">
                  <h5><FontAwesomeIcon icon={FaReceipt} /> Reception Persons</h5>
                  {viewHotel.receptionPersons.map((p, idx) => (
                    <div key={idx} className="contact-person-details">
                      <p><FontAwesomeIcon icon={FaUserTie} /> <strong>Name:</strong> {p.name}</p>
                      {p.email && <p><FontAwesomeIcon icon={FaEnvelope} /> <strong>Email:</strong> {p.email}</p>}
                      {p.contact && <p><FontAwesomeIcon icon={FaPhone} /> <strong>Contact:</strong> {p.contact}</p>}
                    </div>
                  ))}
                </div>
              )}
              
              {viewHotel.concierges.length > 0 && (
                <div className="contact-person">
                  <h5><FontAwesomeIcon icon={FaConciergeBell} /> Concierges</h5>
                  {viewHotel.concierges.map((p, idx) => (
                    <div key={idx} className="contact-person-details">
                      <p><FontAwesomeIcon icon={FaUserTie} /> <strong>Name:</strong> {p.name}</p>
                      {p.email && <p><FontAwesomeIcon icon={FaEnvelope} /> <strong>Email:</strong> {p.email}</p>}
                      {p.contact && <p><FontAwesomeIcon icon={FaPhone} /> <strong>Contact:</strong> {p.contact}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {viewHotel.specialRemarks && (
              <div className="special-remarks-section">
                <h4><FontAwesomeIcon icon={FaInfoCircle} /> Special Remarks</h4>
                <p>{viewHotel.specialRemarks}</p>
              </div>
            )}
            
            {viewHotel.facilitiesAvailable?.length > 0 && (
              <div className="facilities-section">
                <h4><FontAwesomeIcon icon={FaStar} /> Facilities Available</h4>
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
      
      <Modal isOpen={!!editingHotel} onClose={() => setEditingHotel(null)} title="Edit Hotel Information">
        {editingHotel && (
          <div className="edit-hotel-form">
            <div className="form-section">
              <h3><FontAwesomeIcon icon={FaBuilding} /> Hotel Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <input 
                    value={editingHotel.hotelName || ""} 
                    onChange={(e) => setEditingHotel({...editingHotel, hotelName: e.target.value})} 
                    required 
                    placeholder=" "
                  />
                  <label><FontAwesomeIcon icon={FaBuilding} /> Hotel Name <span className="required">*</span></label>
                </div>
                <div className="form-group">
                  <input 
                    value={editingHotel.country || ""} 
                    onChange={(e) => setEditingHotel({...editingHotel, country: e.target.value})} 
                    required 
                    placeholder=" "
                  />
                  <label><FontAwesomeIcon icon={FaMapMarkerAlt} /> Country <span className="required">*</span></label>
                </div>
                <div className="form-group">
                  <input 
                    value={editingHotel.city || ""} 
                    onChange={(e) => setEditingHotel({...editingHotel, city: e.target.value})} 
                    required 
                    placeholder=" "
                  />
                  <label><FontAwesomeIcon icon={FaMapMarkerAlt} /> City <span className="required">*</span></label>
                </div>
                <div className="form-group">
                  <input 
                    value={editingHotel.address || ""} 
                    onChange={(e) => setEditingHotel({...editingHotel, address: e.target.value})} 
                    required 
                    placeholder=" "
                  />
                  <label><FontAwesomeIcon icon={FaMapMarkerAlt} /> Address <span className="required">*</span></label>
                </div>
                <div className="form-group">
                  <input 
                    value={editingHotel.hotelContactNumber || ""} 
                    onChange={(e) => setEditingHotel({...editingHotel, hotelContactNumber: e.target.value})} 
                    placeholder=" "
                  />
                  <label><FontAwesomeIcon icon={FaPhone} /> Contact Number</label>
                </div>
                <div className="form-group">
                  <input 
                    value={editingHotel.hotelChain || ""} 
                    onChange={(e) => setEditingHotel({...editingHotel, hotelChain: e.target.value})} 
                    placeholder=" "
                  />
                  <label><FontAwesomeIcon icon={FaBuilding} /> Hotel Chain</label>
                </div>
              </div>

              <div className="form-group">
                <label><FontAwesomeIcon icon={FaStar} /> Facilities Available</label>
                <div className="facilities-grid">
                  {facilitiesOptions.map(facility => (
                    <label key={facility} className="facility-checkbox">
                      <input
                        type="checkbox"
                        name={facility}
                        checked={editingHotel.facilitiesAvailable?.includes(facility) || false}
                        onChange={(e) => {
                          const updatedFacilities = e.target.checked
                            ? [...(editingHotel.facilitiesAvailable || []), facility]
                            : (editingHotel.facilitiesAvailable || []).filter(item => item !== facility);
                          setEditingHotel({...editingHotel, facilitiesAvailable: updatedFacilities});
                        }}
                      />
                      <span>{facility}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3><FontAwesomeIcon icon={FaUserTie} /> Contact Persons</h3>
              <ContactRoleSection 
                title="Sales Person" 
                role="salesPerson" 
                persons={editingHotel.salesPersons} 
                onAdd={() => setEditingHotel({
                  ...editingHotel,
                  salesPersons: [...editingHotel.salesPersons, { name: '', email: '', contact: '' }]
                })}
                onRemove={(role, index) => setEditingHotel({
                  ...editingHotel,
                  salesPersons: editingHotel.salesPersons.filter((_, i) => i !== index)
                })}
                onChange={(role, index, field, value) => {
                  const updatedPersons = [...editingHotel.salesPersons];
                  updatedPersons[index][field] = value;
                  setEditingHotel({...editingHotel, salesPersons: updatedPersons});
                }}
                phoneCode={'+1'} // Default phone code, adjust as needed
                icon={FaUserTie}
              />
              <ContactRoleSection 
                title="Reservation Person" 
                role="reservationPerson" 
                persons={editingHotel.reservationPersons} 
                onAdd={() => setEditingHotel({
                  ...editingHotel,
                  reservationPersons: [...editingHotel.reservationPersons, { name: '', email: '', contact: '' }]
                })}
                onRemove={(role, index) => setEditingHotel({
                  ...editingHotel,
                  reservationPersons: editingHotel.reservationPersons.filter((_, i) => i !== index)
                })}
                onChange={(role, index, field, value) => {
                  const updatedPersons = [...editingHotel.reservationPersons];
                  updatedPersons[index][field] = value;
                  setEditingHotel({...editingHotel, reservationPersons: updatedPersons});
                }}
                phoneCode={'+1'}
                icon={FaClipboardList}
              />
              <ContactRoleSection 
                title="Accounts Person" 
                role="accountsPerson" 
                persons={editingHotel.accountsPersons} 
                onAdd={() => setEditingHotel({
                  ...editingHotel,
                  accountsPersons: [...editingHotel.accountsPersons, { name: '', email: '', contact: '' }]
                })}
                onRemove={(role, index) => setEditingHotel({
                  ...editingHotel,
                  accountsPersons: editingHotel.accountsPersons.filter((_, i) => i !== index)
                })}
                onChange={(role, index, field, value) => {
                  const updatedPersons = [...editingHotel.accountsPersons];
                  updatedPersons[index][field] = value;
                  setEditingHotel({...editingHotel, accountsPersons: updatedPersons});
                }}
                phoneCode={'+1'}
                icon={FaMoneyCheckAlt}
              />
              <ContactRoleSection 
                title="Reception Person" 
                role="receptionPerson" 
                persons={editingHotel.receptionPersons} 
                onAdd={() => setEditingHotel({
                  ...editingHotel,
                  receptionPersons: [...editingHotel.receptionPersons, { name: '', email: '', contact: '' }]
                })}
                onRemove={(role, index) => setEditingHotel({
                  ...editingHotel,
                  receptionPersons: editingHotel.receptionPersons.filter((_, i) => i !== index)
                })}
                onChange={(role, index, field, value) => {
                  const updatedPersons = [...editingHotel.receptionPersons];
                  updatedPersons[index][field] = value;
                  setEditingHotel({...editingHotel, receptionPersons: updatedPersons});
                }}
                phoneCode={'+1'}
                icon={FaReceipt}
              />
              <ContactRoleSection 
                title="Concierge" 
                role="concierge" 
                persons={editingHotel.concierges} 
                onAdd={() => setEditingHotel({
                  ...editingHotel,
                  concierges: [...editingHotel.concierges, { name: '', email: '', contact: '' }]
                })}
                onRemove={(role, index) => setEditingHotel({
                  ...editingHotel,
                  concierges: editingHotel.concierges.filter((_, i) => i !== index)
                })}
                onChange={(role, index, field, value) => {
                  const updatedPersons = [...editingHotel.concierges];
                  updatedPersons[index][field] = value;
                  setEditingHotel({...editingHotel, concierges: updatedPersons});
                }}
                phoneCode={'+1'}
                icon={FaConciergeBell}
              />
            </div>

            <div className="form-section">
              <h3><FontAwesomeIcon icon={FaInfoCircle} /> Special Remarks</h3>
              <div className="form-group full-width">
                <textarea
                  value={editingHotel.specialRemarks || ""}
                  onChange={(e) => setEditingHotel({...editingHotel, specialRemarks: e.target.value})}
                  placeholder=" "
                  rows="6"
                />
                <label>Remarks</label>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="save-btn" 
                onClick={() => saveHotel(editingHotel)}
              >
                <FontAwesomeIcon icon={FaSave} /> Save Changes
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => setEditingHotel(null)}
              >
                <FontAwesomeIcon icon={FaTimes} /> Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HotelManagementSystem;
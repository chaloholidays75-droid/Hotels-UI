import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBuilding, FaUserTie, FaClipboardList, FaMoneyCheckAlt, 
  FaReceipt, FaConciergeBell, FaChevronDown, FaInfoCircle, 
  FaSave, FaPlus, FaArrowLeft, FaArrowRight, FaGlobe, FaCity,
  FaHotel, FaMapMarkerAlt, FaPhone, FaEnvelope, FaLink, FaTrash,
  FaCheckCircle, FaExclamationTriangle, FaTimes
} from 'react-icons/fa';
import api from '../api/api';
import { createHotelSale } from '../api/hotelApi';

const API_BASE = "https://backend.chaloholidayonline.com/api";
const API_BASE_HOTEL = `${API_BASE}/hotels`;
import './addhotel.css'

// Message Box Component
const MessageBox = ({ type, message, onClose, isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className={`message-box-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`message-box ${type}`}>
        <div className="message-box-header">
          {type === 'success' ? (
            <FaCheckCircle className="message-icon" />
          ) : (
            <FaExclamationTriangle className="message-icon" />
          )}
          <h3>{type === 'success' ? 'Success!' : 'Error!'}</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <div className="message-box-content">
          <p>{message}</p>
        </div>
        <div className="message-box-footer">
          <button className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// ContactRoleSection Component
const ContactRoleSection = ({ title, role, persons, onAdd, onRemove, onChange, phoneCode, icon }) => {
  return (
    <div className="contact-role-section">
      <div className="role-header">
        <h4>{icon} {title}</h4>
        <button type="button" className="btn-add-person" onClick={onAdd}>
          <FaPlus /> Add {title}
        </button>
      </div>
      
      {persons.map((person, index) => (
        <div key={index} className="person-row">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={person.name}
              onChange={e => onChange(role, index, 'name', e.target.value)}
              placeholder={`${title} name`}
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={person.email}
              onChange={e => onChange(role, index, 'email', e.target.value)}
              placeholder={`${title.toLowerCase()}@example.com`}
            />
          </div>
          
          <div className="form-group">
            <label>Contact Number</label>
            <div className="phone-input-container">
              <span className="phone-prefix">{phoneCode}</span>
              <input
                type="tel"
                value={person.contact.replace(phoneCode, "").trim()}
                onChange={e => onChange(role, index, 'contact', `${phoneCode} ${e.target.value.replace(/\D/g, "")}`)}
                placeholder="XXX XXX XXXX"
              />
            </div>
          </div>
          
          <button 
            type="button" 
            className="btn-remove-person"
            onClick={() => onRemove(index)}
            disabled={persons.length <= 1}
          >
            <FaTrash />
          </button>
        </div>
      ))}
    </div>
  );
};

const AddHotelTab = ({ showNotification, setActiveTab }) => {
  const [currentPage, setCurrentPage] = useState(1);
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
  const [error, setError] = useState("");
  const [hotelSource, setHotelSource] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  
  // State for message boxes
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [messageBoxContent, setMessageBoxContent] = useState("");

  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const hotelDropdownRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState({ country: -1, city: -1, hotel: -1 });

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
  
  const handleRemovePerson = (role, index) => {
    setFormData(prev => {
      const updatedRole = [...prev[role]];
      updatedRole.splice(index, 1);
      // Ensure at least one empty person exists
      return { ...prev, [role]: updatedRole.length ? updatedRole : [{ name: "", email: "", contact: "" }] };
    });
  };
  
  const resetForm = () => {
    setFormData({
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
    setCountrySearch("");
    setCitySearch("");
    setHotelSearch("");
    setValidationErrors({});
    setError("");
    setSuccessMessage("");
    setCurrentPage(1);
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
      region: hotel.region || "",
      hotelChain: hotel.hotelChain || "",
      salesPersons: hotel.salesPersons || [{ name: "", email: "", contact: "" }],
      reservationPersons: hotel.reservationPersons || [{ name: "", email: "", contact: "" }],
      accountsPersons: hotel.accountsPersons || [{ name: "", email: "", contact: "" }],
      receptionPersons: hotel.receptionPersons || [{ name: "", email: "", contact: "" }],
      concierges: hotel.concierges || [{ name: "", email: "", contact: "" }],
      specialRemarks: hotel.specialRemarks || "",
      cityId: hotel.cityId,
      countryId: hotel.countryId,
    });
    setHotelSearch(hotel.hotelName);
    setShowHotelDropdown(false);
  };
  
  const handleHotelInput = (name) => {
    setFormData(prev => ({
      ...prev,
      hotelName: name,
      hotelEmail: "",
      hotelContactNumber: "",
      address: "",
      region: "",
      hotelChain: "",
      salesPersons: [{ name: "", email: "", contact: "" }],
      reservationPersons: [{ name: "", email: "", contact: "" }],
      accountsPersons: [{ name: "", email: "", contact: "" }],
      receptionPersons: [{ name: "", email: "", contact: "" }],
      concierges: [{ name: "", email: "", contact: "" }],
      specialRemarks: ""
    }));
    setHotelSearch(name);
    setShowHotelDropdown(false);
  };

  const handleContactChange = (role, index, field, value) => {
    setFormData(prev => {
      const updatedRole = prev[role] ? [...prev[role]] : [{ name: "", email: "", contact: "" }];

      // Initialize if undefined
      if (!updatedRole[index]) updatedRole[index] = { name: "", email: "", contact: "" };

      updatedRole[index][field] = value;
      return { ...prev, [role]: updatedRole };
    });
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
  
  const handleManualHotel = async () => {
    if (!hotelSearch.trim() || !formData.cityId || !formData.countryId) return;

    setHotelSource('manual');

    try {
      const payload = {
        ...formData, // send all fields
        hotelName: hotelSearch.trim(),
        countryId: formData.countryId,
        cityId: formData.cityId
      };

      const res = await fetch(`${API_BASE_HOTEL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create hotel");
      }

      const data = await res.json();
      setHotelsInCity(prev => [...prev, data]);
      handleHotelSelect(data);
      showNotification("Hotel added successfully!", "success");

    } catch (err) {
      console.error(err);
      showNotification(err.message || "Error adding hotel", "error");
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

  // const fetchHotels = async cityId => {
  //   if (!cityId) return;
  //   try {
  //     const res = await fetch(`${API_BASE_HOTEL}?cityId=${cityId}`);
  //     if (!res.ok) throw new Error("Failed to fetch hotels");
  //     const data = await res.json();
  //     setHotelsInCity(data);
  //   } catch (err) { console.error(err); }
  // };
  const fetchHotels = async (cityId) => {
  if (!cityId) return;
  try {
    const res = await api.get(`/hotels/by-city/${cityId}`);
    setHotelsInCity(res.data);
  } catch (err) {
    console.error('Failed to fetch hotels:', err.response?.status, err.message);
  }
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");
    setShowSuccessMessage(false);
    setShowErrorMessage(false);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    // Ensure all contact person arrays exist
    const safePayload = {
      ...formData,
      salesPersons: formData.salesPersons?.map(p => ({
        name: p.name || "",
        email: p.email || "",
        contact: p.contact || ""
      })) || [],
      reservationPersons: formData.reservationPersons?.map(p => ({
        name: p.name || "",
        email: p.email || "",
        contact: p.contact || ""
      })) || [],
      accountsPersons: formData.accountsPersons?.map(p => ({
        name: p.name || "",
        email: p.email || "",
        contact: p.contact || ""
      })) || [],
      receptionPersons: formData.receptionPersons?.map(p => ({
        name: p.name || "",
        email: p.email || "",
        contact: p.contact || ""
      })) || [],
      concierges: formData.concierges?.map(p => ({
        name: p.name || "",
        email: p.email || "",
        contact: p.contact || ""
      })) || [],
      hotelName: formData.hotelName || "",
      hotelEmail: formData.hotelEmail || "",
      hotelContactNumber: formData.hotelContactNumber || "",
      address: formData.address || "",
      region: formData.region || "",
      hotelChain: formData.hotelChain || "",
      specialRemarks: formData.specialRemarks || "",
      cityId: formData.cityId,
      countryId: formData.countryId
    };

    // try {
    //   const response = await fetch(`${API_BASE_HOTEL}`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(safePayload),
    //   });
      
    //   if (!response.ok) {
    //     const errorData = await response.json();
    //     throw new Error(errorData.message || "Failed to save hotel");
    //   }

    //   const data = await response.json();
    //   console.log("Hotel saved:", data);
    //   setMessageBoxContent("Hotel information saved successfully!");
    //   setShowSuccessMessage(true);
    //   resetForm();
    // } catch (err) {
    //   console.error(err);
    //   setMessageBoxContent(`Error: ${err.message}`);
    //   setShowErrorMessage(true);
    // }
        try {
      const data = await createHotelSale(safePayload);
      console.log("Hotel saved:", data);
      setMessageBoxContent("Hotel information saved successfully!");
      setShowSuccessMessage(true);
      resetForm();
    } catch (err) {
      console.error(err);
      setMessageBoxContent(`Error: ${err.message}`);
      setShowErrorMessage(true);
    }
 
    finally {
      setIsSubmitting(false);
    }
  };

  // ================= Page Navigation =================
  const nextPage = () => {
    // Validate required fields on page 1 before proceeding
    if (currentPage === 1) {
      const errors = {};
      if (!formData.country) errors.country = "Country is required";
      if (!formData.city) errors.city = "City is required";
      if (!formData.hotelName) errors.hotelName = "Hotel name is required";
      if (!formData.address) errors.address = "Address is required";
      
      setValidationErrors(errors);
      
      if (Object.keys(errors).length === 0) {
        setCurrentPage(2);
      }
    }
  };

  const prevPage = () => {
    setCurrentPage(1);
  };

  // ================= Render Page 1 =================
  const renderPage1 = () => (
    <div className="form-page">
      <div className="page-header">
        <h3>Basic Hotel Information</h3>
        <p>Step 1 of 2 - Enter the basic details about the hotel</p>
      </div>

      <div className="form-grid">
        {/* Country */}
        <div className="form-group searchable-dropdown" ref={countryDropdownRef}>
          <label><FaGlobe /> Country <span className="required">*</span></label>
          <div className="dropdown-container">
            <input
              type="text"
              value={countrySearch}
              onChange={e => { setCountrySearch(e.target.value); setShowCountryDropdown(true); }}
              onFocus={() => setShowCountryDropdown(true)}
              placeholder="Search country..."
              required
              className={validationErrors.country ? "error" : ""}
            />
            <FaChevronDown className="dropdown-chevron" />
          </div>
          {showCountryDropdown && (
            <div className="dropdown-options">
              {filteredCountries.length > 0 ? (
                filteredCountries.map(c => (
                  <div
                    key={c.code}
                    className="dropdown-option"
                    onClick={() => handleCountrySelect(c.code, c.name, c.id)}
                  >
                    {highlightText(c.name, countrySearch)}
                  </div>
                ))
              ) : (
                <div className="dropdown-option manual-option" onClick={handleManualCountry}>
                  Add "{countrySearch}" as new country
                </div>
              )}
            </div>
          )}
          {validationErrors.country && <span className="error-text">{validationErrors.country}</span>}
        </div>

        {/* City */}
        <div className="form-group searchable-dropdown" ref={cityDropdownRef}>
          <label><FaCity /> City <span className="required">*</span></label>
          <div className="dropdown-container">
            <input
              type="text"
              value={citySearch}
              onChange={e => { setCitySearch(e.target.value); setShowCityDropdown(true); }}
              onFocus={() => setShowCityDropdown(true)}
              placeholder="Search city..."
              required
              disabled={!formData.country}
              className={validationErrors.city ? "error" : ""}
            />
            <FaChevronDown className="dropdown-chevron" />
          </div>
          {showCityDropdown && formData.country && (
            <div className="dropdown-options">
              {filteredCities.length > 0 ? (
                filteredCities.map(c => (
                  <div
                    key={c.id}
                    className="dropdown-option"
                    onClick={() => handleCitySelect(c.name, c.id)}
                  >
                    {highlightText(c.name, citySearch)}
                  </div>
                ))
              ) : (
                <div className="dropdown-option manual-option" onClick={handleManualCity}>
                  Use "{citySearch}" as new city
                </div>
              )}
            </div>
          )}
          {validationErrors.city && <span className="error-text">{validationErrors.city}</span>}
        </div>

        {/* Hotel */}
        <div className="form-group searchable-dropdown" ref={hotelDropdownRef}>
          <label><FaHotel /> Hotel <span className="required">*</span></label>
          <div className="dropdown-container">
            <input
              type="text"
              value={hotelSearch}
              onChange={e => { setHotelSearch(e.target.value); setShowHotelDropdown(true); }}
              onFocus={() => setShowHotelDropdown(true)}
              placeholder="Search hotel..."
              required
              disabled={!formData.city}
              className={validationErrors.hotelName ? "error" : ""}
            />
            <FaChevronDown className="dropdown-chevron" />
          </div>
          {showHotelDropdown && formData.city && (
            <div className="dropdown-options">
              {filteredHotels.length > 0 ? (
                filteredHotels.map(h => (
                  <div
                    key={h.id}
                    className="dropdown-option hotel-option"
                    onClick={() => handleHotelSelect(h)} 
                  >
                    {highlightText(h.hotelName, hotelSearch)}
                  </div>
                ))
              ) : (
                <div className="dropdown-option manual-option" onClick={() => handleHotelInput(hotelSearch)} >
                  {`Type to add new hotel: "${hotelSearch}"`}
                </div>
              )}
            </div>
          )}
          {validationErrors.hotelName && <span className="error-text">{validationErrors.hotelName}</span>}
        </div>

        {/* Address */}
        <div className="form-group">
          <label><FaMapMarkerAlt /> Address <span className="required">*</span></label>
          <input
            type="text"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            placeholder="Hotel address"
            required
            className={validationErrors.address ? "error" : ""}
          />
          {validationErrors.address && <span className="error-text">{validationErrors.address}</span>}
        </div>
        {/* Region */}
        <div className="form-group">
          <label><FaMapMarkerAlt /> Region</label>
          <input
            type="text"
            value={formData.region}
            onChange={e => setFormData({ ...formData, region: e.target.value })}
            placeholder="Enter your Region"
          />
        </div>
        {/* Hotel Contact */}
        <div className="form-group">
          <label><FaPhone /> Hotel Contact Number</label>
          <div className="phone-input-container">
            <span className="phone-prefix">{getCurrentPhoneCode()}</span>
            <input
              type="tel"
              value={formData.hotelContactNumber.replace(getCurrentPhoneCode(), "").trim()}
              onChange={e =>
                setFormData({ ...formData, hotelContactNumber: `${getCurrentPhoneCode()} ${e.target.value.replace(/\D/g, "")}` })
              }
              placeholder="XXX XXX XXXX"
            />
          </div>
        </div>

        {/* Hotel Email */}
        <div className="form-group">
          <label><FaEnvelope /> Email</label>
          <input
            type="email"
            value={formData.hotelEmail}
            onChange={e => setFormData({ ...formData, hotelEmail: e.target.value })}
            placeholder="hotel@example.com"
          />
        </div>

        {/* Hotel Chain */}
        <div className="form-group">
          <label><FaLink /> Hotel Chain</label>
          <input
            type="text"
            value={formData.hotelChain}
            onChange={e => setFormData({ ...formData, hotelChain: e.target.value })}
            placeholder="Hotel chain (optional)"
          />
        </div>
      </div>

      <div className="page-navigation">
        <button type="button" className="btn btn-secondary" onClick={resetForm}>
          Reset Form
        </button>
        <button type="button" className="btn btn-primary" onClick={nextPage}>
          Next <FaArrowRight />
        </button>
      </div>
    </div>
  );

  // ================= Render Page 2 =================
  const renderPage2 = () => (
    <div className="form-page">
      <div className="page-header">
        <h3>Contact Information & Remarks</h3>
        <p>Step 2 of 2 - Add contact persons and special remarks</p>
      </div>

      {/* ================= Contact Persons ================= */}
      <div className="form-section">
        <div className="section-header">
          <h3><FaUserTie /> Contact Persons</h3>
          <p>Add contact information for hotel departments</p>
        </div>

        <ContactRoleSection
          title="Sales Person"
          role="salesPersons"
          persons={formData.salesPersons}
          onAdd={() => setFormData({ ...formData, salesPersons: [...formData.salesPersons, { name: "", email: "", contact: "" }] })}
          onRemove={(i) => handleRemovePerson('salesPersons', i)}
          onChange={handleContactChange}
          phoneCode={getCurrentPhoneCode()}
          icon={<FaUserTie />}
        />

        <ContactRoleSection
          title="Reservation Person"
          role="reservationPersons"
          persons={formData.reservationPersons}
          onAdd={() => setFormData({ ...formData, reservationPersons: [...formData.reservationPersons, { name: "", email: "", contact: "" }] })}
          onRemove={(i) => handleRemovePerson('reservationPersons', i)}
          onChange={handleContactChange}
          phoneCode={getCurrentPhoneCode()}
          icon={<FaClipboardList />}
        />

        <ContactRoleSection
          title="Accounts Person"
          role="accountsPersons"
          persons={formData.accountsPersons}
          onAdd={() => setFormData({ ...formData, accountsPersons: [...formData.accountsPersons, { name: "", email: "", contact: "" }] })}
          onRemove={(i) => handleRemovePerson('accountsPersons', i)}
          onChange={handleContactChange}
          phoneCode={getCurrentPhoneCode()}
          icon={<FaMoneyCheckAlt />}
        />

        <ContactRoleSection
          title="Reception Person"
          role="receptionPersons"
          persons={formData.receptionPersons}
          onAdd={() => setFormData({ ...formData, receptionPersons: [...formData.receptionPersons, { name: "", email: "", contact: "" }] })}
          onRemove={(i) => handleRemovePerson('receptionPersons', i)}
          onChange={handleContactChange}
          phoneCode={getCurrentPhoneCode()}
          icon={<FaReceipt />}
        />

        <ContactRoleSection
          title="Concierge"
          role="concierges"
          persons={formData.concierges}
          onAdd={() => setFormData({ ...formData, concierges: [...formData.concierges, { name: "", email: "", contact: "" }] })}
          onRemove={(i) => handleRemovePerson('concierges', i)}
          onChange={handleContactChange}
          phoneCode={getCurrentPhoneCode()}
          icon={<FaConciergeBell />}
        />
      </div>

      {/* ================= Special Remarks ================= */}
      <div className="form-section">
        <div className="section-header"><h3><FaInfoCircle /> Special Remarks</h3></div>
        <div className="form-group full-width">
          <textarea
            name="specialRemarks"
            value={formData.specialRemarks}
            onChange={e => setFormData({ ...formData, specialRemarks: e.target.value })}
            placeholder="Enter any special remarks or notes about this hotel..."
            rows="5"
          />
        </div>
      </div>
      
      <div className="page-navigation">
        <button type="button" className="btn btn-secondary" onClick={prevPage}>
          <FaArrowLeft /> Back
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}> 
          {isSubmitting ? 'Submitting...' : <><FaSave /> Submit Form</>} 
        </button>
      </div>
    </div>
  );

  return (
    <div className="hotel-form-container">
      <div className="form-header">
        <div className="form-header-content">
        <h2>Add Hotel Information</h2> 
        <p>Fill in the details to add a new hotel to the system</p> 
        </div> 
        <div className="form-progress">
          <div className={`progress-step ${currentPage >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <p>Basic Info</p>
          </div>
          <div className={`progress-step ${currentPage >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <p>Contacts & Remarks</p>
          </div>
        </div>
      </div> 

      {error && (
        <div className="message error-message">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      {successMessage && (
        <div className="message success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="hotel-form"> 
        {currentPage === 1 ? renderPage1() : renderPage2()}
      </form> 
      
      {/* Message Boxes */}
      <MessageBox 
        type="success" 
        message={messageBoxContent} 
        onClose={() => setShowSuccessMessage(false)} 
        isVisible={showSuccessMessage} 
      />
      
      <MessageBox 
        type="error" 
        message={messageBoxContent} 
        onClose={() => setShowErrorMessage(false)} 
        isVisible={showErrorMessage} 
      />
    </div> 
  );
};

export default AddHotelTab;
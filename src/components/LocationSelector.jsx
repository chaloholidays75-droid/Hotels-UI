import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const API_BASE = "https://hotels-8v0p.onrender.com/api";
const API_BASE_HOTEL = `${API_BASE}/hotels`;

const LocationSelector = ({ 
  countryId, 
  cityId, 
  onCountrySelect, 
  onCitySelect, 
  onHotelSelect,
  showNotification,        // callback to parent for notifications
  initialCountry = "", 
  initialCity = "", 
  initialHotel = "" 
}) => {

  const [countries, setCountries] = useState([]);
  const [citiesByCountry, setCitiesByCountry] = useState({});
  const [hotelsInCity, setHotelsInCity] = useState([]);

  const [countrySearch, setCountrySearch] = useState(initialCountry);
  const [citySearch, setCitySearch] = useState(initialCity);
  const [hotelSearch, setHotelSearch] = useState(initialHotel);

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);

  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const hotelDropdownRef = useRef(null);

  // ================= Fetch Countries =================
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(`${API_BASE}/countries`);
        const data = await res.json();
        setCountries(data);
        const mapping = {};
        data.forEach(c => mapping[c.code] = c.cities.map(city => ({ id: city.id, name: city.name })));
        setCitiesByCountry(mapping);
      } catch (err) { console.error(err); }
    };
    fetchCountries();
  }, []);

  const filteredCountries = countries.filter(c =>
    (c.name || "").toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = countryId 
    ? (citiesByCountry[countryId]?.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())) || [])
    : [];

  const filteredHotels = hotelsInCity.filter(h =>
    (h.hotelName || "").toLowerCase().includes(hotelSearch.toLowerCase())
  );

  // ================= Selection =================
  const handleCountrySelect = (code, name, id) => {
    setCountrySearch(name);
    onCountrySelect?.(code, name, id);
    setCitySearch("");
    setHotelsInCity([]);
  };

  const handleCitySelect = (name, id) => {
    setCitySearch(name);
    onCitySelect?.(name, id);
    setHotelSearch("");
    fetchHotels(id);
  };

  const handleHotelSelect = hotel => {
    setHotelSearch(hotel.hotelName);
    onHotelSelect?.(hotel);
  };

  // ================= Fetch Hotels =================
  const fetchHotels = async (cityId) => {
    if (!cityId) return;
    try {
      const res = await fetch(`${API_BASE_HOTEL}?cityId=${cityId}`);
      const data = await res.json();
      setHotelsInCity(data);
    } catch (err) { console.error(err); }
  };

  // ================= Manual Add =================
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
          code: name.slice(0,2).toUpperCase(),
          phoneCode: "+1"
        })
      });
      const data = await res.json();
      setCountries(prev => [...prev, data]);
      handleCountrySelect(data.code, data.name, data.id);
      showNotification?.("Country added successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification?.("Error adding country", "error");
    }
  };

  const handleManualCity = async () => {
    if (!citySearch.trim() || !countryId) return;

    try {
      const res = await fetch(`${API_BASE}/cities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: citySearch.trim(),
          countryId
        })
      });
      const data = await res.json();
      setCitiesByCountry(prev => ({
        ...prev,
        [countryId]: [...(prev[countryId] || []), { id: data.id, name: data.name }]
      }));
      handleCitySelect(data.name, data.id);
      showNotification?.("City added successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification?.("Error adding city", "error");
    }
  };

  const handleManualHotel = async () => {
    if (!hotelSearch.trim() || !cityId || !countryId) return;

    try {
      const payload = {
        hotelName: hotelSearch.trim(),
        countryId,
        cityId
      };
      const res = await fetch(`${API_BASE_HOTEL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setHotelsInCity(prev => [...prev, data]);
      handleHotelSelect(data);
      showNotification?.("Hotel added successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification?.("Error adding hotel", "error");
    }
  };

  // ================= Render =================
  return (
    <div className="location-selector">
      {/* Country */}
      <div className="form-group searchable-dropdown" ref={countryDropdownRef}>
        <label>Country</label>
        <input
          type="text"
          value={countrySearch}
          onChange={e => setCountrySearch(e.target.value)}
          onFocus={() => setShowCountryDropdown(true)}
          placeholder="Search country..."
        />
        <FaChevronDown className="dropdown-chevron" />
        {showCountryDropdown && (
          <div className="dropdown-options">
            {filteredCountries.length > 0 ? (
              filteredCountries.map(c => (
                <div key={c.id} onClick={() => handleCountrySelect(c.code, c.name, c.id)}>
                  {c.name}
                </div>
              ))
            ) : (
              <div className="dropdown-option manual-option" onClick={handleManualCountry}>
                Add "{countrySearch}" as new country
              </div>
            )}
          </div>
        )}
      </div>

      {/* City */}
      <div className="form-group searchable-dropdown" ref={cityDropdownRef}>
        <label>City</label>
        <input
          type="text"
          value={citySearch}
          onChange={e => setCitySearch(e.target.value)}
          onFocus={() => setShowCityDropdown(true)}
          placeholder="Search city..."
          disabled={!countryId}
        />
        <FaChevronDown className="dropdown-chevron" />
        {showCityDropdown && countryId && (
          <div className="dropdown-options">
            {filteredCities.length > 0 ? (
              filteredCities.map(c => (
                <div key={c.id} onClick={() => handleCitySelect(c.name, c.id)}>
                  {c.name}
                </div>
              ))
            ) : (
              <div className="dropdown-option manual-option" onClick={handleManualCity}>
                Use "{citySearch}" as new city
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;

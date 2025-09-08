import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const API_BASE = "https://hotels-8v0p.onrender.com/api";

const LocationSelector = ({ onCountrySelect, onCitySelect, errors = {} }) => {
  const [countries, setCountries] = useState([]);
  const [citiesByCountry, setCitiesByCountry] = useState({});
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [highlightedCountryIndex, setHighlightedCountryIndex] = useState(-1);
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(-1);
  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Fetch countries and cities
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(`${API_BASE}/countries`);
        const data = await res.json();
        setCountries(data);
        const mapping = {};
        data.forEach(c => mapping[c.id] = c.cities.map(city => ({ id: city.id, name: city.name })));
        setCitiesByCountry(mapping);
      } catch (err) { console.error(err); }
    };
    fetchCountries();
  }, []);

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = selectedCountryId
    ? (citiesByCountry[selectedCountryId]?.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())) || [])
    : [];

  const handleCountrySelect = (name, id) => {
    setCountrySearch(name);
    setSelectedCountryId(id);
    setCitySearch("");
    if (onCountrySelect) onCountrySelect({ id, name });
    setShowCountryDropdown(false);
    setHighlightedCountryIndex(-1);
  };
  useEffect(() => {
  const match = countries.find(c => c.name.toLowerCase() === countrySearch.toLowerCase());
  if (match) handleCountrySelect(match.name, match.id);
}, [countrySearch]);

useEffect(() => {
  if (selectedCountryId) {
    const match = (citiesByCountry[selectedCountryId] || [])
      .find(c => c.name.toLowerCase() === citySearch.toLowerCase());
    if (match) handleCitySelect(match.name, match.id);
  }
}, [citySearch, selectedCountryId]);

  const handleCitySelect = (name, id) => {
    setCitySearch(name);
    if (onCitySelect) onCitySelect({ id, name });
    setShowCityDropdown(false);
    setHighlightedCityIndex(-1);
  };

  return (
    <div className="location-selector">
      {/* Country */}
      <div className="form-group searchable-dropdown" ref={countryDropdownRef}>
        <label htmlFor="country" className="form-label required">Country</label>
        <input
          type="text"
          value={countrySearch}
          onChange={e => setCountrySearch(e.target.value)}
          onFocus={() => setShowCountryDropdown(true)}
          placeholder="Search country..."
          className={errors.country ? "form-input error" : "form-input"}
        />
        <FaChevronDown className="dropdown-chevron" onClick={() => setShowCountryDropdown(!showCountryDropdown)} />
        {showCountryDropdown && (
          <div className="dropdown-options">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, idx) => (
                <div
                  key={c.id}
                  className={`dropdown-option ${idx === highlightedCountryIndex ? "highlighted" : ""}`}
                  onMouseEnter={() => setHighlightedCountryIndex(idx)}
                  onClick={() => handleCountrySelect(c.name, c.id)}
                >
                  {c.name}
                </div>
              ))
            ) : (
              <div className="dropdown-option">No countries found</div>
            )}
          </div>
        )}
        {errors.country && <span className="error-message">{errors.country}</span>}
      </div>

      {/* City */}
      <div className="form-group searchable-dropdown" ref={cityDropdownRef}>
        <label htmlFor="city" className="form-label required">City</label>
        <input
          type="text"
          value={citySearch}
          onChange={e => setCitySearch(e.target.value)}
          onFocus={() => setShowCityDropdown(true)}
          placeholder="Search city..."
          disabled={!selectedCountryId}
          className={errors.city ? "form-input error" : "form-input"}
        />
        <FaChevronDown className="dropdown-chevron" onClick={() => selectedCountryId && setShowCityDropdown(!showCityDropdown)} />
        {showCityDropdown && selectedCountryId && (
          <div className="dropdown-options">
            {filteredCities.length > 0 ? (
              filteredCities.map((c, idx) => (
                <div
                  key={c.id}
                  className={`dropdown-option ${idx === highlightedCityIndex ? "highlighted" : ""}`}
                  onMouseEnter={() => setHighlightedCityIndex(idx)}
                  onClick={() => handleCitySelect(c.name, c.id)}
                >
                  {c.name}
                </div>
              ))
            ) : (
              <div className="dropdown-option">No cities found</div>
            )}
          </div>
        )}
        {errors.city && <span className="error-message">{errors.city}</span>}
      </div>
    </div>
  );
};

export default LocationSelector;

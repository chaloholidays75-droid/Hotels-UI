import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const API_BASE = "https://hotels-8v0p.onrender.com/api";

const LocationSelector = ({ onCountrySelect, onCitySelect }) => {
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) setShowCountryDropdown(false);
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) setShowCityDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Selection handlers
  const handleCountrySelect = (name, id) => {
    setCountrySearch(name);
    setSelectedCountryId(id);
    setCitySearch("");
    onCountrySelect?.(name, id);
    setShowCountryDropdown(false);
    setHighlightedCountryIndex(-1);
  };

  const handleCitySelect = (name, id) => {
    setCitySearch(name);
    onCitySelect?.(name, id);
    setShowCityDropdown(false);
    setHighlightedCityIndex(-1);
  };

  // Keyboard navigation
  const handleCountryKeyDown = (e) => {
    if (!showCountryDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedCountryIndex(prev => Math.min(prev + 1, filteredCountries.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedCountryIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedCountryIndex >= 0) {
        const country = filteredCountries[highlightedCountryIndex];
        handleCountrySelect(country.name, country.id);
      }
    }
  };

  const handleCityKeyDown = (e) => {
    if (!showCityDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedCityIndex(prev => Math.min(prev + 1, filteredCities.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedCityIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedCityIndex >= 0) {
        const city = filteredCities[highlightedCityIndex];
        handleCitySelect(city.name, city.id);
      }
    }
  };

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
          onKeyDown={handleCountryKeyDown}
          placeholder="Search country..."
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
      </div>

      {/* City */}
      <div className="form-group searchable-dropdown" ref={cityDropdownRef}>
        <label>City</label>
        <input
          type="text"
          value={citySearch}
          onChange={e => setCitySearch(e.target.value)}
          onFocus={() => setShowCityDropdown(true)}
          onKeyDown={handleCityKeyDown}
          placeholder="Search city..."
          disabled={!selectedCountryId}
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
      </div>
    </div>
  );
};

export default LocationSelector;

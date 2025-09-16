import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";

const API_BASE = "https://backend.chaloholidayonline.com/api";

const LocationSelector = ({ onCountrySelect, onCitySelect, errors = {} }) => {
  const [countries, setCountries] = useState([]);
  const [citiesByCountry, setCitiesByCountry] = useState({});
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [highlightedIndex, setHighlightedIndex] = useState({ country: -1, city: -1 });

  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch countries + cities
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(`${API_BASE}/countries`);
        const data = await res.json();
        setCountries(data);
        const mapping = {};
        data.forEach((c) => {
          mapping[c.id] = c.cities.map((city) => ({ id: city.id, name: city.name }));
        });
        setCitiesByCountry(mapping);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCountries();
  }, []);

  // Filters
  const filteredCountries = countries.filter((c) =>
    (c.name || "").toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredCities = selectedCountry
    ? (citiesByCountry[selectedCountry.id] || []).filter((c) =>
        (c.name || "").toLowerCase().includes(citySearch.toLowerCase())
      )
    : [];

  // Highlight text
  const highlightText = (text, search) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? <b key={i}>{part}</b> : part
    );
  };

  // ================= Selection =================
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setCountrySearch(country.name);
    setCitySearch("");
    setShowCountryDropdown(false);
    if (onCountrySelect) onCountrySelect(country);
  };

  const handleCitySelect = (city) => {
    setCitySearch(city.name);
    setShowCityDropdown(false);
    if (onCitySelect) onCitySelect(city);
  };

  // ================= Manual Add =================
  const handleManualCountry = async () => {
    if (!countrySearch.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: countrySearch,
          code: countrySearch.slice(0, 2).toUpperCase(),
          phoneCode: "+1",
        }),
      });
      if (!res.ok) throw new Error("Failed to add country");
      const newCountry = await res.json();
      setCountries((prev) => [...prev, newCountry]);
      handleCountrySelect(newCountry);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualCity = async () => {
    if (!citySearch.trim() || !selectedCountry?.id) return;
    try {
      const res = await fetch(`${API_BASE}/cities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: citySearch, countryId: selectedCountry.id }),
      });
      if (!res.ok) throw new Error("Failed to add city");
      const newCity = await res.json();
      setCitiesByCountry((prev) => ({
        ...prev,
        [selectedCountry.id]: [...(prev[selectedCountry.id] || []), newCity],
      }));
      handleCitySelect(newCity);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= Keyboard Navigation =================
  const handleDropdownKeys = (e, type, items, onSelect, manualHandler, searchValue) => {
    if (!["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) return;
    e.preventDefault();

    let index = highlightedIndex[type];

    if (e.key === "ArrowDown") index = (index + 1) % items.length;
    if (e.key === "ArrowUp") index = (index - 1 + items.length) % items.length;

    if (e.key === "Enter") {
      if (items.length > 0 && items[index]) {
        onSelect(items[index]);
      } else if (searchValue.trim()) {
        manualHandler(); // auto-trigger manual add if no matches
      }
      return;
    }

    setHighlightedIndex((prev) => ({ ...prev, [type]: index }));
  };

  return (
    <div className="location-selector">
      {/* Country */}
      <div className="form-group searchable-dropdown" ref={countryDropdownRef}>
        <label className="form-label required">Country</label>
        <input
          type="text"
          value={countrySearch}
          onChange={(e) => {
            setCountrySearch(e.target.value);
            setShowCountryDropdown(true);
          }}
          onFocus={() => setShowCountryDropdown(true)}
          onKeyDown={(e) =>
            handleDropdownKeys(
              e,
              "country",
              filteredCountries,
              handleCountrySelect,
              handleManualCountry,
              countrySearch
            )
          }
          placeholder="Search country..."
          className={errors.country ? "form-input error" : "form-input"}
        />
        <FaChevronDown
          className="dropdown-chevron"
          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
        />
        {showCountryDropdown && (
          <div className="dropdown-options">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, idx) => (
                <div
                  key={c.id}
                  className={`dropdown-option ${idx === highlightedIndex.country ? "highlighted" : ""}`}
                  onMouseEnter={() => setHighlightedIndex((p) => ({ ...p, country: idx }))}
                  onClick={() => handleCountrySelect(c)}
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
        {errors.country && <span className="error-message">{errors.country}</span>}
      </div>

      {/* City */}
      <div className="form-group searchable-dropdown" ref={cityDropdownRef}>
        <label className="form-label required">City</label>
        <input
          type="text"
          value={citySearch}
          onChange={(e) => {
            setCitySearch(e.target.value);
            setShowCityDropdown(true);
          }}
          onFocus={() => setShowCityDropdown(true)}
          onKeyDown={(e) =>
            handleDropdownKeys(
              e,
              "city",
              filteredCities,
              handleCitySelect,
              handleManualCity,
              citySearch
            )
          }
          placeholder="Search city..."
          disabled={!selectedCountry}
          className={errors.city ? "form-input error" : "form-input"}
        />
        <FaChevronDown
          className="dropdown-chevron"
          onClick={() => selectedCountry && setShowCityDropdown(!showCityDropdown)}
        />
        {showCityDropdown && selectedCountry && (
          <div className="dropdown-options">
            {filteredCities.length > 0 ? (
              filteredCities.map((c, idx) => (
                <div
                  key={c.id}
                  className={`dropdown-option ${idx === highlightedIndex.city ? "highlighted" : ""}`}
                  onMouseEnter={() => setHighlightedIndex((p) => ({ ...p, city: idx }))}
                  onClick={() => handleCitySelect(c)}
                >
                  {highlightText(c.name, citySearch)}
                </div>
              ))
            ) : (
              <div className="dropdown-option manual-option" onClick={handleManualCity}>
                Add "{citySearch}" as new city
              </div>
            )}
          </div>
        )}
        {errors.city && <span className="error-message">{errors.city}</span>}
      </div>
    </div>
  );
};

export default LocationSelector;

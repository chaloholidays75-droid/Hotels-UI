import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { FaChevronDown } from "react-icons/fa";
import "./LocationSelector.css";
import { getCode } from "country-list";
import { getCountryCallingCode } from "libphonenumber-js";

const API_BASE = "https://backend.chaloholidayonline.com/api";

const LocationSelector = forwardRef(({ countryId, cityId, onCountrySelect, onCitySelect, onNotify, errors = {} }, ref) => {
  const [countries, setCountries] = useState([]);
  const [citiesByCountry, setCitiesByCountry] = useState({});
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState({ country: 0, city: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({ country: false, city: false });
  const [notice, setNotice] = useState("");

  const countryRef = useRef(null);
  const cityRef = useRef(null);
  const countryInputRef = useRef(null);
  const cityInputRef = useRef(null);

  // expose validation
  useImperativeHandle(ref, () => ({
    isValid: () => !!(selectedCountry && selectedCity),
    getSelected: () => ({ country: selectedCountry, city: selectedCity })
  }));

  // click outside closes dropdown
  useEffect(() => {
    const handler = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) setShowCountryDropdown(false);
      if (cityRef.current && !cityRef.current.contains(e.target)) setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/countries`);
        if (!res.ok) throw new Error("Failed to fetch countries");
        const data = await res.json();
        setCountries(data || []);
        const mapping = {};
        (data || []).forEach(c => {
          if (Array.isArray(c.cities)) mapping[c.id] = c.cities.map(ct => ({ id: ct.id, name: ct.name }));
        });
        setCitiesByCountry(mapping);

        if (countryId) {
          const c = (data || []).find(x => x.id === countryId);
          if (c) handleCountrySelect(c);
        }
      } catch (err) {
        console.error("fetch countries:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, [countryId]);

  // fetch cities
  const fetchCitiesForCountry = async (countryIdToFetch) => {
    if (!countryIdToFetch) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/countries/${countryIdToFetch}/cities`);
      let data;
      if (!res.ok) {
        const res2 = await fetch(`${API_BASE}/cities?countryId=${countryIdToFetch}`);
        if (!res2.ok) throw new Error("Failed to fetch cities");
        data = await res2.json();
      } else {
        data = await res.json();
      }
      setCitiesByCountry(prev => ({ ...prev, [countryIdToFetch]: data }));
    } catch (err) {
      console.error("fetch cities:", err);
    } finally {
      setLoading(false);
    }
  };

  // initial city selection
  useEffect(() => {
    if (!cityId) return;
    const found = Object.values(citiesByCountry).flat().find(ct => ct.id === cityId);
    if (found) {
      setSelectedCity(found);
      setCitySearch(found.name);
    }
  }, [cityId, citiesByCountry]);

  const highlightText = (text, search) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, "ig");
    const parts = String(text).split(regex);
    return parts.map((p, i) => (regex.test(p) ? <b key={i}>{p}</b> : <span key={i}>{p}</span>));
  };

  const filteredCountries = countries.filter(c => (c.name || "").toLowerCase().includes(countrySearch.toLowerCase()));
  const filteredCities = selectedCountry && citiesByCountry[selectedCountry.id]
    ? citiesByCountry[selectedCountry.id].filter(ct => (ct.name || "").toLowerCase().includes(citySearch.toLowerCase()))
    : [];

  const clearCitySelection = () => {
    setSelectedCity(null);
    setCitySearch("");
    onCitySelect?.({ name: "", id: null });
  };

  const handleCountrySelect = (country) => {
    const code = country.code || getCode(country.name) || country.name.slice(0, 2).toUpperCase();
    const phoneCode = code ? `+${getCountryCallingCode(code)}` : "+0";
    const flag = code ? String.fromCodePoint(...[...code].map(c => 0x1F1E6 - 65 + c.charCodeAt(0))) : "";

    const enrichedCountry = { ...country, code, phoneCode, flag };
    setSelectedCountry(enrichedCountry);
    setCountrySearch(enrichedCountry.name);
    setShowCountryDropdown(false);
    clearCitySelection();
    fetchCitiesForCountry(enrichedCountry.id);
    onCountrySelect?.(enrichedCountry);
    setTimeout(() => cityInputRef.current?.focus(), 0);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCitySearch(city.name);
    setShowCityDropdown(false);
    onCitySelect?.(city);
  };

  const handleManualCountry = async () => {
    const name = countrySearch.trim();
    if (!name) return;
    if (countries.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setNotice("Country already exists.");
      setTimeout(() => setNotice(""), 2000);
      return;
    }
    setSaving(prev => ({ ...prev, country: true }));

    const code = getCode(name) || name.slice(0, 2).toUpperCase();
    const phoneCode = code ? `+${getCountryCallingCode(code)}` : "+0";
    const flag = code ? String.fromCodePoint(...[...code].map(c => 0x1F1E6 - 65 + c.charCodeAt(0))) : "";

    try {
      const res = await fetch(`${API_BASE}/countries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, phoneCode, flag })
      });
      const newCountry = await res.json();
      setCountries(prev => [...prev, newCountry]);
      handleCountrySelect(newCountry);
      onNotify?.({ type: "success", message: `Country "${name}" added` });
    } catch (err) {
      console.error(err);
      setNotice("Failed to add country");
      onNotify?.({ type: "error", message: "Failed to add country" });
    } finally {
      setSaving(prev => ({ ...prev, country: false }));
      setTimeout(() => setNotice(""), 3000);
    }
  };

  const handleManualCity = async () => {
    const name = citySearch.trim();
    if (!name || !selectedCountry?.id) {
      setNotice("Select a country first");
      setTimeout(() => setNotice(""), 2000);
      return;
    }
    const exists = (citiesByCountry[selectedCountry.id] || []).some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setNotice("City already exists.");
      setTimeout(() => setNotice(""), 2000);
      return;
    }
    setSaving(prev => ({ ...prev, city: true }));
    try {
      const res = await fetch(`${API_BASE}/cities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, countryId: selectedCountry.id })
      });
      const newCity = await res.json();
      setCitiesByCountry(prev => ({
        ...prev,
        [selectedCountry.id]: [...(prev[selectedCountry.id] || []), newCity]
      }));
      handleCitySelect(newCity);
      onNotify?.({ type: "success", message: `City "${name}" added` });
    } catch (err) {
      console.error(err);
      setNotice("Failed to add city");
      onNotify?.({ type: "error", message: "Failed to add city" });
    } finally {
      setSaving(prev => ({ ...prev, city: false }));
      setTimeout(() => setNotice(""), 3000);
    }
  };

  const handleDropdownKeys = (e, type, items, onSelect) => {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
    if (e.key === "Enter") e.preventDefault();
    if (e.key === "Escape") { if (type === "country") setShowCountryDropdown(false); else setShowCityDropdown(false); return; }
    if (!items.length) { if (e.key === "Enter") { setNotice('No match. Click Add.'); setTimeout(() => setNotice(""), 2000); } return; }
    let idx = highlightedIndex[type] ?? 0;
    if (e.key === "ArrowDown") idx = (idx + 1) % items.length;
    if (e.key === "ArrowUp") idx = (idx - 1 + items.length) % items.length;
    if (e.key === "Enter") { onSelect(items[idx]); return; }
    setHighlightedIndex(prev => ({ ...prev, [type]: idx }));
  };

  return (
    <div className="location-selector">
      {notice && <div className="ls-notice">{notice}</div>}

      {/* Country */}
      <div className={`form-group ${errors.country ? "error" : ""}`} ref={countryRef}>
        <label className="form-label required">Country</label>
        <div className="ls-input-wrap">
          <input
            ref={countryInputRef}
            type="text"
            value={countrySearch}
            onChange={e => { setCountrySearch(e.target.value); setShowCountryDropdown(true); setSelectedCountry(null); }}
            onFocus={() => setShowCountryDropdown(true)}
            onKeyDown={e => handleDropdownKeys(e, "country", filteredCountries, handleCountrySelect)}
            placeholder="Search country..."
            className="form-input"
          />
          <button type="button" className="ls-chevron" onClick={() => setShowCountryDropdown(s => !s)}>
            <FaChevronDown />
          </button>
        </div>
        {showCountryDropdown && (
          <ul className="ls-dropdown">
            {filteredCountries.map((c, i) => (
              <li key={c.id} className={highlightedIndex.country === i ? "highlighted" : ""} onMouseDown={e => { e.preventDefault(); handleCountrySelect(c); }}>
                {highlightText(c.name, countrySearch)}
              </li>
            ))}
            {countrySearch && <li className="ls-manual" onMouseDown={e => { e.preventDefault(); handleManualCountry(); }}>➕ Add "{countrySearch}"</li>}
          </ul>
        )}
      </div>

      {/* City */}
      <div className={`form-group ${errors.city ? "error" : ""}`} ref={cityRef}>
        <label className="form-label required">City</label>
        <div className="ls-input-wrap">
          <input
            ref={cityInputRef}
            disabled={!selectedCountry}
            type="text"
            value={citySearch}
            onChange={e => { setCitySearch(e.target.value); setShowCityDropdown(true); setSelectedCity(null); }}
            onFocus={() => selectedCountry && setShowCityDropdown(true)}
            onKeyDown={e => handleDropdownKeys(e, "city", filteredCities, handleCitySelect)}
            placeholder={selectedCountry ? "Search city..." : "Select country first"}
            className="form-input"
          />
          <button type="button" className="ls-chevron" disabled={!selectedCountry} onClick={() => selectedCountry && setShowCityDropdown(s => !s)}>
            <FaChevronDown />
          </button>
        </div>
        {showCityDropdown && selectedCountry && (
          <ul className="ls-dropdown">
            {filteredCities.map((ct, i) => (
              <li key={ct.id} className={highlightedIndex.city === i ? "highlighted" : ""} onMouseDown={e => { e.preventDefault(); handleCitySelect(ct); }}>
                {highlightText(ct.name, citySearch)}
              </li>
            ))}
            {citySearch && <li className="ls-manual" onMouseDown={e => { e.preventDefault(); handleManualCity(); }}>➕ Add "{citySearch}"</li>}
          </ul>
        )}
      </div>

      {(loading || saving.country || saving.city) && <div className="ls-status">{loading && "Loading..."}{saving.country && "Saving country..."}{saving.city && "Saving city..."}</div>}
    </div>
  );
});

export default LocationSelector;

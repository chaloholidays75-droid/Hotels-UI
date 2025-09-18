import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { FaChevronDown } from "react-icons/fa";

const API_BASE = "https://backend.chaloholidayonline.com/api";

/**
 * LocationSelector
 * Props:
 *  - countryId (optional): initial selected country id
 *  - cityId (optional): initial selected city id
 *  - onCountrySelect(countryObj) => parent will set formData
 *  - onCitySelect(cityObj) => parent will set formData
 *  - onNotify({ type: 'success'|'error', message }) optional callback for notifications
 *  - errors: optional errors object to show per-field error styles/messages
 *
 * Exposes via ref:
 *  - isValid() => boolean (country + city selected)
 */
const LocationSelector = forwardRef(
  ({ countryId, cityId, onCountrySelect, onCitySelect, onNotify, errors = {} }, ref) => {
    // master lists & mappings
    const [countries, setCountries] = useState([]);
    const [citiesByCountry, setCitiesByCountry] = useState({}); // { countryId: [ {id,name}, ... ] }

    // UI state
    const [countrySearch, setCountrySearch] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState({ country: 0, city: 0 });

    // selection
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    // loading / saving / notices
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState({ country: false, city: false });
    const [notice, setNotice] = useState(""); // small inline message used for warnings

    // refs for clicking outside
    const countryRef = useRef(null);
    const cityRef = useRef(null);
    const countryInputRef = useRef(null);
    const cityInputRef = useRef(null);

    // expose validation helper to parent
    useImperativeHandle(ref, () => ({
      isValid: () => !!(selectedCountry && selectedCountry.id && selectedCity && selectedCity.id),
      getSelected: () => ({ country: selectedCountry, city: selectedCity }),
    }));

    // Close dropdowns on click outside
    useEffect(() => {
      const onDocClick = (e) => {
        if (countryRef.current && !countryRef.current.contains(e.target)) {
          setShowCountryDropdown(false);
        }
        if (cityRef.current && !cityRef.current.contains(e.target)) {
          setShowCityDropdown(false);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // initial fetch of countries (we also build cities mapping if API returns nested cities)
    useEffect(() => {
      const fetchCountries = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/countries`);
          if (!res.ok) throw new Error("Failed to fetch countries");
          const data = await res.json();
          setCountries(data || []);
          // if API includes cities inside countries, map them
          const mapping = {};
          (data || []).forEach((c) => {
            if (Array.isArray(c.cities)) mapping[c.id] = c.cities.map((ct) => ({ id: ct.id, name: ct.name }));
          });
          setCitiesByCountry((prev) => ({ ...mapping, ...prev }));
          // if initial countryId passed, select it
          if (countryId) {
            const c = (data || []).find((x) => x.id === countryId);
            if (c) {
              setSelectedCountry(c);
              setCountrySearch(c.name);
              // fetch cities for that country if mapping absent
              if (!mapping[c.id]) fetchCitiesForCountry(c.id);
            } else {
              // maybe countryId not found yet; leave it for later
            }
          }
        } catch (err) {
          console.error("fetch countries:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchCountries();
    }, [countryId]);

    // helper: fetch cities for a country (if API endpoint exists)
    const fetchCitiesForCountry = async (countryIdToFetch) => {
      if (!countryIdToFetch) return;
      setLoading(true);
      try {
        // try endpoint that returns cities by country
        const res = await fetch(`${API_BASE}/countries/${countryIdToFetch}/cities`);
        if (!res.ok) {
          // fallback to other naming (your backend sometimes uses different routes)
          const res2 = await fetch(`${API_BASE}/cities?countryId=${countryIdToFetch}`);
          if (!res2.ok) throw new Error("Failed to fetch cities");
          const data2 = await res2.json();
          setCitiesByCountry((p) => ({ ...p, [countryIdToFetch]: data2 }));
        } else {
          const data = await res.json();
          setCitiesByCountry((p) => ({ ...p, [countryIdToFetch]: data }));
        }
      } catch (err) {
        console.error("fetch cities for country:", err);
      } finally {
        setLoading(false);
      }
    };

    // if parent provided a cityId initially, try to resolve it (best-effort)
    useEffect(() => {
      if (!cityId) return;
      // if cities mapping already contains the city, select it
      const found = Object.values(citiesByCountry || {}).flat().find((ct) => ct.id === cityId);
      if (found) {
        setSelectedCity(found);
        setCitySearch(found.name);
      } else {
        // otherwise we could attempt to fetch the city or rely on parent to pass matching names later
      }
    }, [cityId, citiesByCountry]);

    // Debounced helper for highlighting (client filtering is fine for moderate lists)
    const highlightText = (text, search) => {
      if (!search) return text;
      const regex = new RegExp(`(${escapeRegExp(search)})`, "ig");
      const parts = String(text).split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? <b key={i}>{part}</b> : <span key={i}>{part}</span>
      );
    };
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // filtered lists
    const filteredCountries = countries.filter((c) =>
      (c.name || "").toLowerCase().includes((countrySearch || "").toLowerCase())
    );
    const filteredCities =
      selectedCountry && citiesByCountry[selectedCountry.id]
        ? citiesByCountry[selectedCountry.id].filter((ct) =>
            (ct.name || "").toLowerCase().includes((citySearch || "").toLowerCase())
          )
        : [];

    // ----- Selection handlers -----
    const clearCitySelection = (notifyParent = true) => {
      setSelectedCity(null);
      setCitySearch("");
      if (notifyParent && typeof onCitySelect === "function") {
        // parent expects an object; pass empty object to clear
        try {
          onCitySelect({ name: "", id: null });
        } catch (e) {
          // if parent destructures args, passing empty object is safer than null
          console.warn("onCitySelect clear:", e);
        }
      }
    };

    const handleCountrySelect = (country) => {
      setSelectedCountry(country);
      setCountrySearch(country.name || "");
      setShowCountryDropdown(false);
      setHighlightedIndex((p) => ({ ...p, country: 0 }));
      clearCitySelection(true); // clear previous city selection in parent & local
      // ensure we have cities loaded
      if (!citiesByCountry[country.id]) fetchCitiesForCountry(country.id);
      if (typeof onCountrySelect === "function") onCountrySelect(country);
      // focus city input on select (UX)
      setTimeout(() => cityInputRef.current && cityInputRef.current.focus(), 0);
    };

    const handleCitySelect = (city) => {
      setSelectedCity(city);
      setCitySearch(city.name || "");
      setShowCityDropdown(false);
      setHighlightedIndex((p) => ({ ...p, city: 0 }));
      if (typeof onCitySelect === "function") onCitySelect(city);
    };

    // ----- Manual add (explicit click on "Add 'X'") -----
    const handleManualCountry = async () => {
      const name = countrySearch.trim();
      if (!name) return;
      // duplicate check (case-insensitive)
      if (countries.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        setNotice("Country already exists — please select it from the list.");
        return;
      }
      setSaving((s) => ({ ...s, country: true }));
      try {
        const res = await fetch(`${API_BASE}/countries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            code: name.slice(0, 2).toUpperCase(),
            phoneCode: "+1",
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || "Failed to add country");
        }
        const newCountry = await res.json();
        setCountries((p) => [...p, newCountry]);
        setCitiesByCountry((p) => ({ ...p, [newCountry.id]: newCountry.cities ? newCountry.cities.map(ct => ({ id: ct.id, name: ct.name })) : [] }));
        handleCountrySelect(newCountry);
        if (onNotify) onNotify({ type: "success", message: `Country "${name}" added` });
      } catch (err) {
        console.error("add country:", err);
        setNotice("Failed to add country");
        if (onNotify) onNotify({ type: "error", message: "Failed to add country" });
      } finally {
        setSaving((s) => ({ ...s, country: false }));
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
      // duplicate check
      const existing = (citiesByCountry[selectedCountry.id] || []).some((c) => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        setNotice("City already exists — please select it");
        setTimeout(() => setNotice(""), 2500);
        return;
      }
      setSaving((s) => ({ ...s, city: true }));
      try {
        const res = await fetch(`${API_BASE}/cities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, countryId: selectedCountry.id }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || "Failed to add city");
        }
        const newCity = await res.json();
        setCitiesByCountry((p) => ({
          ...p,
          [selectedCountry.id]: [...(p[selectedCountry.id] || []), newCity],
        }));
        handleCitySelect(newCity);
        if (onNotify) onNotify({ type: "success", message: `City "${name}" added` });
      } catch (err) {
        console.error("add city:", err);
        setNotice("Failed to add city");
        if (onNotify) onNotify({ type: "error", message: "Failed to add city" });
      } finally {
        setSaving((s) => ({ ...s, city: false }));
        setTimeout(() => setNotice(""), 3000);
      }
    };

    // ----- Keyboard nav: Arrow Up/Down + Enter (Enter selects only existing) -----
    const handleDropdownKeys = (e, type, items, onSelect) => {
      if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
      // prevent parent form submit on Enter
      if (e.key === "Enter") e.preventDefault();
      if (e.key === "Escape") {
        // just close the dropdown
        if (type === "country") setShowCountryDropdown(false);
        if (type === "city") setShowCityDropdown(false);
        return;
      }
      const length = items.length;
      if (length === 0) {
        // Arrow keys do nothing when list empty; Enter should NOT create automatically
        if (e.key === "Enter") {
          setNotice('No match found. Click "Add" below to create.');
          setTimeout(() => setNotice(""), 2000);
        }
        return;
      }
      let idx = highlightedIndex[type] ?? 0;
      if (e.key === "ArrowDown") idx = (idx + 1) % length;
      if (e.key === "ArrowUp") idx = (idx - 1 + length) % length;
      if (e.key === "Enter") {
        const item = items[idx] || items[0];
        onSelect(item);
        return;
      }
      setHighlightedIndex((prev) => ({ ...prev, [type]: idx }));
    };

    // Small helpers for UI disabled / class
    const countryHasMatches = filteredCountries.length > 0;
    const cityHasMatches = filteredCities.length > 0;

    // focus city input when country is selected (UX)
    useEffect(() => {
      if (selectedCountry) {
        setTimeout(() => {
          if (cityInputRef.current) cityInputRef.current.focus();
        }, 50);
      }
    }, [selectedCountry]);

    // Render
    return (
      <div className="location-selector">
        {/* Inline notice */}
        {notice && <div className="ls-notice">{notice}</div>}
        <div className={`form-group ls-country ${errors.country ? "error" : ""}`} ref={countryRef}>
          <label className="form-label required">Country</label>
          <div className="ls-input-wrap">
            <input
              ref={countryInputRef}
              type="text"
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setShowCountryDropdown(true);
                // mark invalid until selection/add
                setSelectedCountry(null);
              }}
              onFocus={() => setShowCountryDropdown(true)}
              onKeyDown={(e) => handleDropdownKeys(e, "country", filteredCountries, handleCountrySelect)}
              placeholder="Search country..."
              className="form-input"
              aria-autocomplete="list"
            />
            <button
              type="button"
              aria-label="toggle"
              className="ls-chevron"
              onClick={() => setShowCountryDropdown((s) => !s)}
            >
              <FaChevronDown />
            </button>
          </div>

          {showCountryDropdown && (
            <ul className="ls-dropdown" role="listbox">
              {filteredCountries.map((c, i) => (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={selectedCountry?.id === c.id}
                  className={`ls-option ${highlightedIndex.country === i ? "highlighted" : ""}`}
                  onMouseEnter={() => setHighlightedIndex((p) => ({ ...p, country: i }))}
                  onMouseDown={(ev) => {
                    // use mouseDown to avoid losing focus before click
                    ev.preventDefault();
                    handleCountrySelect(c);
                  }}
                >
                  {highlightText(c.name, countrySearch)}
                </li>
              ))}

              {/* manual add option always shown when user typed something */}
              {countrySearch.trim() && (
                <li
                  key="manual-country"
                  className="ls-option ls-manual"
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    handleManualCountry();
                  }}
                >
                  ➕ Add “{countrySearch}” (create new country)
                </li>
              )}
            </ul>
          )}

          {!selectedCountry && <div className="ls-error">Please select or add a country</div>}
        </div>

        {/* City block (depends on selectedCountry) */}
        <div className={`form-group ls-city ${errors.city ? "error" : ""}`} ref={cityRef}>
          <label className="form-label required">City</label>
          <div className="ls-input-wrap">
            <input
              ref={cityInputRef}
              disabled={!selectedCountry}
              type="text"
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                setShowCityDropdown(true);
                setSelectedCity(null);
              }}
              onFocus={() => selectedCountry && setShowCityDropdown(true)}
              onKeyDown={(e) => handleDropdownKeys(e, "city", filteredCities, handleCitySelect)}
              placeholder={selectedCountry ? "Search city..." : "Select country first"}
              className="form-input"
              aria-autocomplete="list"
            />
            <button
              type="button"
              aria-label="toggle"
              className="ls-chevron"
              onClick={() => selectedCountry && setShowCityDropdown((s) => !s)}
              disabled={!selectedCountry}
            >
              <FaChevronDown />
            </button>
          </div>

          {showCityDropdown && selectedCountry && (
            <ul className="ls-dropdown" role="listbox">
              {filteredCities.map((ct, i) => (
                <li
                  key={ct.id}
                  role="option"
                  aria-selected={selectedCity?.id === ct.id}
                  className={`ls-option ${highlightedIndex.city === i ? "highlighted" : ""}`}
                  onMouseEnter={() => setHighlightedIndex((p) => ({ ...p, city: i }))}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    handleCitySelect(ct);
                  }}
                >
                  {highlightText(ct.name, citySearch)}
                </li>
              ))}

              {citySearch.trim() && (
                <li
                  key="manual-city"
                  className="ls-option ls-manual"
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    handleManualCity();
                  }}
                >
                  ➕ Add “{citySearch}” (create new city in {selectedCountry?.name})
                </li>
              )}
            </ul>
          )}

          {!selectedCity && <div className="ls-error">Please select or add a city</div>}
        </div>

        {/* Loading / saving indicators */}
        {(loading || saving.country || saving.city) && (
          <div className="ls-status">
            {loading && "Loading..."}
            {saving.country && "Saving country..."}
            {saving.city && "Saving city..."}
          </div>
        )}
      </div>
    );
  }
);

export default LocationSelector;

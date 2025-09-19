import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useMemo
} from "react";
import { FaChevronDown, FaPlus, FaSpinner } from "react-icons/fa";
import Fuse from "fuse.js";
import debounce from "lodash/debounce";

const API_BASE = "https://backend.chaloholidayonline.com/api";

const LocationSelector = forwardRef(
  (
    {
      countryId,
      cityId,
      onCountrySelect,
      onCitySelect,
      onNotify,
      errors = {},
      className = "",
      showLabels = true,
      required = true
    },
    ref
  ) => {
    const [countries, setCountries] = useState([]);
    const [citiesByCountry, setCitiesByCountry] = useState({});
    const [countrySearch, setCountrySearch] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState({
      country: 0,
      city: 0
    });
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [loading, setLoading] = useState({ countries: false, cities: false });
    const [saving, setSaving] = useState({ country: false, city: false });
    const [notice, setNotice] = useState("");
    const [abortController, setAbortController] = useState(new AbortController());

    const countryRef = useRef(null);
    const cityRef = useRef(null);
    const countryInputRef = useRef(null);
    const cityInputRef = useRef(null);

    useImperativeHandle(ref, () => ({
      isValid: () =>
        !!(selectedCountry && selectedCountry.id && selectedCity && selectedCity.id),
      getSelected: () => ({ country: selectedCountry, city: selectedCity }),
      reset: () => {
        setSelectedCountry(null);
        setSelectedCity(null);
        setCountrySearch("");
        setCitySearch("");
      }
    }));

    // Memoized API calls with abort controller
    const fetchData = useCallback(async (url, options = {}) => {
      try {
        const signal = abortController.signal;
        const response = await fetch(url, { ...options, signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return null;
        }
        throw error;
      }
    }, [abortController]);

    // Close dropdowns when clicking outside
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

    // Fetch countries on mount
    useEffect(() => {
      const fetchCountries = async () => {
        setLoading(prev => ({ ...prev, countries: true }));
        try {
          const data = await fetchData(`${API_BASE}/countries`);
          setCountries(data || []);
          
          // Create cities mapping
          const mapping = {};
          (data || []).forEach((c) => {
            if (Array.isArray(c.cities)) {
              mapping[c.id] = c.cities.map((ct) => ({ 
                id: ct.id, 
                name: ct.name 
              }));
            }
          });
          
          setCitiesByCountry((prev) => ({ ...prev, ...mapping }));
          
          // Pre-select country if countryId provided
          if (countryId) {
            const country = (data || []).find((x) => x.id === countryId);
            if (country) {
              setSelectedCountry(country);
              setCountrySearch(country.name);
              if (!mapping[country.id]) {
                await fetchCitiesForCountry(country.id);
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch countries:", err);
          if (onNotify) {
            onNotify({ 
              type: "error", 
              message: "Failed to load countries" 
            });
          }
        } finally {
          setLoading(prev => ({ ...prev, countries: false }));
        }
      };
      
      fetchCountries();
      
      return () => {
        abortController.abort();
      };
    }, [countryId, onNotify, fetchData, abortController]);

    // Set city if cityId provided
    useEffect(() => {
      if (!cityId || !selectedCountry) return;
      
      const found = Object.values(citiesByCountry)
        .flat()
        .find((ct) => ct.id === cityId);
        
      if (found) {
        setSelectedCity(found);
        setCitySearch(found.name);
      }
    }, [cityId, citiesByCountry, selectedCountry]);

    // Fetch cities for a country
    const fetchCitiesForCountry = useCallback(async (countryIdToFetch) => {
      if (!countryIdToFetch) return;
      
      setLoading(prev => ({ ...prev, cities: true }));
      try {
        let data;
        try {
          data = await fetchData(`${API_BASE}/countries/${countryIdToFetch}/cities`);
        } catch (e) {
          // Fallback to alternative endpoint
          data = await fetchData(`${API_BASE}/cities?countryId=${countryIdToFetch}`);
        }
        
        setCitiesByCountry((prev) => ({ 
          ...prev, 
          [countryIdToFetch]: data || [] 
        }));
      } catch (err) {
        console.error("Failed to fetch cities:", err);
        if (onNotify) {
          onNotify({ 
            type: "error", 
            message: "Failed to load cities" 
          });
        }
      } finally {
        setLoading(prev => ({ ...prev, cities: false }));
      }
    }, [fetchData, onNotify]);

    // Memoized Fuse instances for better performance
    const fuseCountries = useMemo(
      () => new Fuse(countries, { keys: ["name"], threshold: 0.3 }),
      [countries]
    );

    const fuseCities = useMemo(
      () => {
        if (!selectedCountry) return null;
        return new Fuse(citiesByCountry[selectedCountry.id] || [], { 
          keys: ["name"], 
          threshold: 0.3 
        });
      },
      [selectedCountry, citiesByCountry]
    );

    // Memoized filtered results
    const filteredCountries = useMemo(
      () => countrySearch.trim() 
        ? fuseCountries.search(countrySearch).map(x => x.item) 
        : countries,
      [countrySearch, fuseCountries, countries]
    );

    const filteredCities = useMemo(
      () => {
        if (!selectedCountry) return [];
        return citySearch.trim() && fuseCities 
          ? fuseCities.search(citySearch).map(x => x.item) 
          : citiesByCountry[selectedCountry.id] || [];
      },
      [citySearch, fuseCities, selectedCountry, citiesByCountry]
    );

    // Debounced search handlers
    const handleCountrySearchChange = useCallback(
      debounce((value) => {
        setCountrySearch(value);
        setShowCountryDropdown(true);
        setSelectedCountry(null);
      }, 300),
      []
    );

    const handleCitySearchChange = useCallback(
      debounce((value) => {
        setCitySearch(value);
        setShowCityDropdown(true);
        setSelectedCity(null);
      }, 300),
      []
    );

    const handleCountrySelect = useCallback((country) => {
      setSelectedCountry(country);
      setCountrySearch(country.name || "");
      setShowCountryDropdown(false);
      setHighlightedIndex((prev) => ({ ...prev, country: 0 }));
      setSelectedCity(null);
      setCitySearch("");
      
      if (!citiesByCountry[country.id]) {
        fetchCitiesForCountry(country.id);
      }
      
      if (onCountrySelect) onCountrySelect(country);
      
      setTimeout(() => {
        if (cityInputRef.current) {
          cityInputRef.current.focus();
        }
      }, 0);
    }, [citiesByCountry, fetchCitiesForCountry, onCountrySelect]);

    const handleCitySelect = useCallback((city) => {
      setSelectedCity(city);
      setCitySearch(city.name || "");
      setShowCityDropdown(false);
      setHighlightedIndex((prev) => ({ ...prev, city: 0 }));
      if (onCitySelect) onCitySelect(city);
    }, [onCitySelect]);

    const handleManualCountry = useCallback(async () => {
      const name = countrySearch.trim();
      if (!name) return;
      
      if (fuseCountries.search(name).length > 0) {
        setNotice("Country already exists.");
        setTimeout(() => setNotice(""), 3000);
        return;
      }
      
      setSaving((prev) => ({ ...prev, country: true }));
      try {
        const newCountry = await fetchData(`${API_BASE}/countries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name, 
            code: name.slice(0, 2).toUpperCase(), 
            phoneCode: "+1" 
          })
        });
        
        setCountries((prev) => [...prev, newCountry]);
        setCitiesByCountry((prev) => ({ ...prev, [newCountry.id]: [] }));
        handleCountrySelect(newCountry);
        
        if (onNotify) {
          onNotify({ 
            type: "success", 
            message: `Country "${name}" added` 
          });
        }
      } catch (err) {
        console.error("Failed to add country:", err);
        setNotice("Failed to add country");
        setTimeout(() => setNotice(""), 3000);
      } finally {
        setSaving((prev) => ({ ...prev, country: false }));
      }
    }, [countrySearch, fuseCountries, handleCountrySelect, onNotify, fetchData]);

    const handleManualCity = useCallback(async () => {
      const name = citySearch.trim();
      if (!name || !selectedCountry) return;
      
      if (fuseCities && fuseCities.search(name).length > 0) {
        setNotice("City already exists.");
        setTimeout(() => setNotice(""), 3000);
        return;
      }
      
      setSaving((prev) => ({ ...prev, city: true }));
      try {
        const newCity = await fetchData(`${API_BASE}/cities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name, 
            countryId: selectedCountry.id 
          })
        });
        
        setCitiesByCountry((prev) => ({
          ...prev,
          [selectedCountry.id]: [...(prev[selectedCountry.id] || []), newCity]
        }));
        
        handleCitySelect(newCity);
        
        if (onNotify) {
          onNotify({ 
            type: "success", 
            message: `City "${name}" added` 
          });
        }
      } catch (err) {
        console.error("Failed to add city:", err);
        setNotice("Failed to add city");
        setTimeout(() => setNotice(""), 3000);
      } finally {
        setSaving((prev) => ({ ...prev, city: false }));
      }
    }, [citySearch, selectedCountry, fuseCities, handleCitySelect, onNotify, fetchData]);

    const handleKeyDown = useCallback((e, type, items, onSelect, manualAdd) => {
      if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
      
      e.preventDefault();
      
      if (e.key === "Escape") {
        if (type === "country") setShowCountryDropdown(false);
        if (type === "city") setShowCityDropdown(false);
        return;
      }
      
      const length = items.length;
      let idx = highlightedIndex[type] ?? 0;
      
      if (e.key === "ArrowDown") {
        idx = (idx + 1) % length;
      } else if (e.key === "ArrowUp") {
        idx = (idx - 1 + length) % length;
      } else if (e.key === "Enter") {
        if (length > 0 && idx >= 0 && idx < length) {
          onSelect(items[idx]);
        } else if (manualAdd) {
          manualAdd();
        }
        return;
      }
      
      setHighlightedIndex((prev) => ({ ...prev, [type]: idx }));
    }, [highlightedIndex]);

    // Reset highlighted index when dropdown closes
    useEffect(() => {
      if (!showCountryDropdown) {
        setHighlightedIndex(prev => ({ ...prev, country: 0 }));
      }
    }, [showCountryDropdown]);

    useEffect(() => {
      if (!showCityDropdown) {
        setHighlightedIndex(prev => ({ ...prev, city: 0 }));
      }
    }, [showCityDropdown]);

    return (
      <div className={`location-selector ${className}`}>
        {notice && (
          <div className="ls-notice">
            {notice}
          </div>
        )}

        <div 
          className={`form-group ls-country ${errors.country ? "error" : ""}`} 
          ref={countryRef}
        >
          {showLabels && (
            <label className="form-label">
              Country {required && <span className="required">*</span>}
            </label>
          )}
          <div className="ls-input-wrap">
            <input
              ref={countryInputRef}
              type="text"
              value={countrySearch}
              onChange={(e) => handleCountrySearchChange(e.target.value)}
              onFocus={() => setShowCountryDropdown(true)}
              onKeyDown={(e) => 
                handleKeyDown(
                  e, 
                  "country", 
                  filteredCountries, 
                  handleCountrySelect, 
                  handleManualCountry
                )
              }
              placeholder="Search country..."
              className="form-input"
              aria-label="Select country"
              aria-expanded={showCountryDropdown}
              aria-haspopup="listbox"
            />
            <button 
              type="button" 
              className="ls-chevron" 
              onClick={() => setShowCountryDropdown((prev) => !prev)}
              aria-label="Toggle country dropdown"
            >
              <FaChevronDown />
            </button>
          </div>
          {showCountryDropdown && (
            <ul className="ls-dropdown" role="listbox">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, index) => (
                  <li
                    key={country.id}
                    className={highlightedIndex.country === index ? "highlighted" : ""}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCountrySelect(country);
                    }}
                    role="option"
                    aria-selected={selectedCountry?.id === country.id}
                  >
                    {country.name}
                  </li>
                ))
              ) : (
                <li className="ls-no-results">No countries found</li>
              )}
              {countrySearch && (
                <li
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleManualCountry();
                  }}
                  role="option"
                  className="ls-add-option"
                >
                  <FaPlus /> Add "{countrySearch}"
                </li>
              )}
            </ul>
          )}
        </div>

        <div 
          className={`form-group ls-city ${errors.city ? "error" : ""}`} 
          ref={cityRef}
        >
          {showLabels && (
            <label className="form-label">
              City {required && <span className="required">*</span>}
            </label>
          )}
          <div className="ls-input-wrap">
            <input
              ref={cityInputRef}
              disabled={!selectedCountry}
              type="text"
              value={citySearch}
              onChange={(e) => handleCitySearchChange(e.target.value)}
              onFocus={() => selectedCountry && setShowCityDropdown(true)}
              onKeyDown={(e) =>
                handleKeyDown(
                  e,
                  "city",
                  filteredCities,
                  handleCitySelect,
                  handleManualCity
                )
              }
              placeholder={selectedCountry ? "Search city..." : "Select country first"}
              className="form-input"
              aria-label="Select city"
              aria-expanded={showCityDropdown}
              aria-haspopup="listbox"
              aria-disabled={!selectedCountry}
            />
            <button
              type="button"
              className="ls-chevron"
              disabled={!selectedCountry}
              onClick={() => selectedCountry && setShowCityDropdown((prev) => !prev)}
              aria-label="Toggle city dropdown"
            >
              <FaChevronDown />
            </button>
          </div>
          {showCityDropdown && selectedCountry && (
            <ul className="ls-dropdown" role="listbox">
              {filteredCities.length > 0 ? (
                filteredCities.map((city, index) => (
                  <li
                    key={city.id}
                    className={highlightedIndex.city === index ? "highlighted" : ""}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCitySelect(city);
                    }}
                    role="option"
                    aria-selected={selectedCity?.id === city.id}
                  >
                    {city.name}
                  </li>
                ))
              ) : (
                <li className="ls-no-results">No cities found</li>
              )}
              {citySearch && (
                <li
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleManualCity();
                  }}
                  role="option"
                  className="ls-add-option"
                >
                  <FaPlus /> Add "{citySearch}"
                </li>
              )}
            </ul>
          )}
        </div>

        {(loading.countries || loading.cities || saving.country || saving.city) && (
          <div className="ls-status">
            {loading.countries && (
              <span><FaSpinner className="spinner" /> Loading countries...</span>
            )}
            {loading.cities && (
              <span><FaSpinner className="spinner" /> Loading cities...</span>
            )}
            {saving.country && (
              <span><FaSpinner className="spinner" /> Saving country...</span>
            )}
            {saving.city && (
              <span><FaSpinner className="spinner" /> Saving city...</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default LocationSelector;
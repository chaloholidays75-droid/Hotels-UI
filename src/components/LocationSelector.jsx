// import React, {
//   useState,
//   useEffect,
//   useRef,
//   forwardRef,
//   useImperativeHandle,
//   useCallback
// } from "react";
// import { FaChevronDown } from "react-icons/fa";
// import "./LocationSelector.css";
// import { getCode } from "country-list";
// import { getCountryCallingCode } from "libphonenumber-js";

// const API_BASE = "https://backend.chaloholidayonline.com/api";

// const LocationSelector = forwardRef(
//   (
//     { countryId, cityId, onCountrySelect, onCitySelect, onNotify, errors = {} },
//     ref
//   ) => {
//     const [countries, setCountries] = useState([]);
//     const [citiesByCountry, setCitiesByCountry] = useState({});
//     const [countrySearch, setCountrySearch] = useState("");
//     const [citySearch, setCitySearch] = useState("");
//     const [selectedCountry, setSelectedCountry] = useState(null);
//     const [selectedCity, setSelectedCity] = useState(null);
//     const [showCountryDropdown, setShowCountryDropdown] = useState(false);
//     const [showCityDropdown, setShowCityDropdown] = useState(false);
//     const [highlightedIndex, setHighlightedIndex] = useState({
//       country: 0,
//       city: 0
//     });
//     const [loading, setLoading] = useState(false);
//     const [saving, setSaving] = useState({ country: false, city: false });
//     const [notice, setNotice] = useState("");

//     const countryRef = useRef(null);
//     const cityRef = useRef(null);
//     const countryInputRef = useRef(null);
//     const cityInputRef = useRef(null);

//     // expose validation
//     useImperativeHandle(ref, () => ({
//       isValid: () => !!(selectedCountry && selectedCity),
//       getSelected: () => ({ country: selectedCountry, city: selectedCity })
//     }));

//     // click outside closes dropdown
//     useEffect(() => {
//       const handler = (e) => {
//         if (countryRef.current && !countryRef.current.contains(e.target))
//           setShowCountryDropdown(false);
//         if (cityRef.current && !cityRef.current.contains(e.target))
//           setShowCityDropdown(false);
//       };
//       document.addEventListener("mousedown", handler);
//       return () => document.removeEventListener("mousedown", handler);
//     }, []);

//     // fetch countries
//     useEffect(() => {
//       const fetchCountries = async () => {
//         setLoading(true);
//         try {
//           const res = await fetch(`${API_BASE}/countries`);
//           if (!res.ok) throw new Error("Failed to fetch countries");
//           const data = await res.json();
//           setCountries(data || []);
//           const mapping = {};
//           (data || []).forEach((c) => {
//             if (Array.isArray(c.cities))
//               mapping[c.id] = c.cities.map((ct) => ({
//                 id: ct.id,
//                 name: ct.name
//               }));
//           });
//           setCitiesByCountry(mapping);

//           if (countryId) {
//             const c = (data || []).find((x) => x.id === countryId);
//             if (c) handleCountrySelect(c);
//           }
//         } catch (err) {
//           console.error("fetch countries:", err);
//         } finally {
//           setLoading(false);
//         }
//       };
//       fetchCountries();
//     }, [countryId]);

//     // fetch cities
//     const fetchCitiesForCountry = useCallback(
//       async (countryIdToFetch) => {
//         if (!countryIdToFetch) return;
//         setLoading(true);
//         try {
//           const res = await fetch(
//             `${API_BASE}/countries/${countryIdToFetch}/cities`
//           );
//           let data;
//           if (!res.ok) {
//             const res2 = await fetch(
//               `${API_BASE}/cities?countryId=${countryIdToFetch}`
//             );
//             if (!res2.ok) throw new Error("Failed to fetch cities");
//             data = await res2.json();
//           } else {
//             data = await res.json();
//           }
//           setCitiesByCountry((prev) => ({
//             ...prev,
//             [countryIdToFetch]: data
//           }));
//         } catch (err) {
//           console.error("fetch cities:", err);
//         } finally {
//           setLoading(false);
//         }
//       },
//       []
//     );

//     // initial city selection
//     useEffect(() => {
//       if (!cityId || !selectedCountry) return;
//       const found = (citiesByCountry[selectedCountry.id] || []).find(
//         (ct) => ct.id === cityId
//       );
//       if (found) {
//         setSelectedCity(found);
//         setCitySearch(found.name);
//       }
//     }, [cityId, citiesByCountry, selectedCountry]);

//     const highlightText = (text, search) => {
//       if (!search) return text;
//       const regex = new RegExp(`(${search})`, "ig");
//       const parts = String(text).split(regex);
//       return parts.map((p, i) =>
//         regex.test(p) ? <b key={i}>{p}</b> : <span key={i}>{p}</span>
//       );
//     };

//     const filteredCountries = countries.filter((c) =>
//       (c.name || "").toLowerCase().includes(countrySearch.toLowerCase())
//     );

//     const filteredCities = selectedCountry
//       ? (citiesByCountry[selectedCountry.id] || []).filter((ct) =>
//           (ct.name || "").toLowerCase().includes(citySearch.toLowerCase())
//         )
//       : [];

//     const clearCitySelection = useCallback(() => {
//       setSelectedCity(null);
//       setCitySearch("");
//       onCitySelect?.({ name: "", id: null });
//     }, [onCitySelect]);

//     const handleCountrySelect = useCallback(
//       (country) => {
//         const code = country.code || getCode(country.name) || country.name.slice(0, 2).toUpperCase();
//         let phoneCode = "+0";
//         try {
//           phoneCode = code ? `+${getCountryCallingCode(code)}` : "+0";
//         } catch (e) {
//           console.warn("Could not get calling code for", code);
//         }
        
//         const flag = code
//           ? String.fromCodePoint(
//               ...[...code.toUpperCase()].map(
//                 (c) => 0x1f1e6 - 65 + c.charCodeAt(0)
//               )
//             )
//           : "";

//         const enrichedCountry = { ...country, code, phoneCode, flag };
//         setSelectedCountry(enrichedCountry);
//         setCountrySearch(enrichedCountry.name);
//         setShowCountryDropdown(false);
//         setHighlightedIndex((prev) => ({ ...prev, country: 0 }));
//         clearCitySelection();
        
//         if (!citiesByCountry[enrichedCountry.id]) {
//           fetchCitiesForCountry(enrichedCountry.id);
//         }
        
//         onCountrySelect?.(enrichedCountry);
//         setTimeout(() => cityInputRef.current?.focus(), 0);
//       },
//       [citiesByCountry, clearCitySelection, fetchCitiesForCountry, onCountrySelect]
//     );

//     const handleCitySelect = useCallback(
//       (city) => {
//         setSelectedCity(city);
//         setCitySearch(city.name);
//         setShowCityDropdown(false);
//         setHighlightedIndex((prev) => ({ ...prev, city: 0 }));
//         onCitySelect?.(city);
//       },
//       [onCitySelect]
//     );

//     const handleManualCountry = useCallback(async () => {
//       const name = countrySearch.trim();
//       if (!name) return;
      
//       // Check for exact match (case insensitive)
//       const existingCountry = countries.find(
//         (c) => c.name.toLowerCase() === name.toLowerCase()
//       );
      
//       if (existingCountry) {
//         setNotice("Country already exists.");
//         setTimeout(() => setNotice(""), 2000);
//         handleCountrySelect(existingCountry);
//         return;
//       }
      
//       setSaving((prev) => ({ ...prev, country: true }));

//       const code = getCode(name) || name.slice(0, 2).toUpperCase();
//       let phoneCode = "+0";
//       try {
//         phoneCode = code ? `+${getCountryCallingCode(code)}` : "+0";
//       } catch (e) {
//         console.warn("Could not get calling code for", code);
//       }
      
//       const flag = code
//         ? String.fromCodePoint(
//             ...[...code.toUpperCase()].map(
//               (c) => 0x1f1e6 - 65 + c.charCodeAt(0)
//             )
//           )
//         : "";

//       try {
//         const res = await fetch(`${API_BASE}/countries`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ name, code, phoneCode, flag })
//         });
        
//         if (!res.ok) throw new Error("Failed to add country");
        
//         const newCountry = await res.json();
//         setCountries((prev) => [...prev, newCountry]);
//         setCitiesByCountry((prev) => ({ ...prev, [newCountry.id]: [] }));
//         handleCountrySelect(newCountry);
//         onNotify?.({ type: "success", message: `Country "${name}" added` });
//       } catch (err) {
//         console.error(err);
//         setNotice("Failed to add country");
//         onNotify?.({ type: "error", message: "Failed to add country" });
//       } finally {
//         setSaving((prev) => ({ ...prev, country: false }));
//         setTimeout(() => setNotice(""), 3000);
//       }
//     }, [countrySearch, countries, handleCountrySelect, onNotify]);

//     const handleManualCity = useCallback(async () => {
//       const name = citySearch.trim();
      
//       if (!name || !selectedCountry?.id) {
//         setNotice("Select a country first");
//         setTimeout(() => setNotice(""), 2000);
//         return;
//       }
      
//       // Check for exact match in the current country's cities
//       const existingCity = (citiesByCountry[selectedCountry.id] || []).find(
//         (c) => c.name.toLowerCase() === name.toLowerCase()
//       );
      
//       if (existingCity) {
//         setNotice("City already exists.");
//         setTimeout(() => setNotice(""), 2000);
//         handleCitySelect(existingCity);
//         return;
//       }
      
//       setSaving((prev) => ({ ...prev, city: true }));
      
//       try {
//         const res = await fetch(`${API_BASE}/cities`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ name, countryId: selectedCountry.id })
//         });
        
//         if (!res.ok) throw new Error("Failed to add city");
        
//         const newCity = await res.json();
//         setCitiesByCountry((prev) => ({
//           ...prev,
//           [selectedCountry.id]: [...(prev[selectedCountry.id] || []), newCity]
//         }));
//         handleCitySelect(newCity);
//         onNotify?.({ type: "success", message: `City "${name}" added` });
//       } catch (err) {
//         console.error(err);
//         setNotice("Failed to add city");
//         onNotify?.({ type: "error", message: "Failed to add city" });
//       } finally {
//         setSaving((prev) => ({ ...prev, city: false }));
//         setTimeout(() => setNotice(""), 3000);
//       }
//     }, [citySearch, selectedCountry, citiesByCountry, handleCitySelect, onNotify]);

//     const handleCountryKeyDown = (e) => {
//       if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
      
//       if (e.key === "Enter") e.preventDefault();
      
//       if (e.key === "Escape") {
//         setShowCountryDropdown(false);
//         return;
//       }
      
//       if (!filteredCountries.length) {
//         if (e.key === "Enter") {
//           setNotice("No match. Click Add.");
//           setTimeout(() => setNotice(""), 2000);
//         }
//         return;
//       }
      
//       let idx = highlightedIndex.country;
      
//       if (e.key === "ArrowDown") {
//         idx = (idx + 1) % filteredCountries.length;
//       } else if (e.key === "ArrowUp") {
//         idx = (idx - 1 + filteredCountries.length) % filteredCountries.length;
//       } else if (e.key === "Enter") {
//         handleCountrySelect(filteredCountries[idx]);
//         return;
//       }
      
//       setHighlightedIndex((prev) => ({ ...prev, country: idx }));
//     };

//     const handleCityKeyDown = (e) => {
//       if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
      
//       if (e.key === "Enter") e.preventDefault();
      
//       if (e.key === "Escape") {
//         setShowCityDropdown(false);
//         return;
//       }
      
//       if (!filteredCities.length) {
//         if (e.key === "Enter") {
//           setNotice("No match. Click Add.");
//           setTimeout(() => setNotice(""), 2000);
//         }
//         return;
//       }
      
//       let idx = highlightedIndex.city;
      
//       if (e.key === "ArrowDown") {
//         idx = (idx + 1) % filteredCities.length;
//       } else if (e.key === "ArrowUp") {
//         idx = (idx - 1 + filteredCities.length) % filteredCities.length;
//       } else if (e.key === "Enter") {
//         handleCitySelect(filteredCities[idx]);
//         return;
//       }
      
//       setHighlightedIndex((prev) => ({ ...prev, city: idx }));
//     };

//     return (
//       <div className="location-selector">
//         {notice && <div className="ls-notice">{notice}</div>}

//         {/* Country */}
//         <div
//           className={`form-group ${errors.country ? "error" : ""}`}
//           ref={countryRef}
//         >
//           <label className="form-label required">Country</label>
//           <div className="ls-input-wrap">
//             <input
//               ref={countryInputRef}
//               type="text"
//               value={countrySearch}
//               onChange={(e) => {
//                 setCountrySearch(e.target.value);
//                 setShowCountryDropdown(true);
//                 setSelectedCountry(null);
//                 setHighlightedIndex((prev) => ({ ...prev, country: 0 }));
//               }}
//               onFocus={() => setShowCountryDropdown(true)}
//               onKeyDown={handleCountryKeyDown}
//               placeholder="Search country..."
//               className="form-input"
//             />
//             <button
//               type="button"
//               className="ls-chevron"
//               onClick={() => setShowCountryDropdown((s) => !s)}
//             >
//               <FaChevronDown />
//             </button>
//           </div>
//           {showCountryDropdown && (
//             <ul className="ls-dropdown">
//               {filteredCountries.map((c, i) => (
//                 <li
//                   key={c.id}
//                   className={highlightedIndex.country === i ? "highlighted" : ""}
//                   onMouseDown={(e) => {
//                     e.preventDefault();
//                     handleCountrySelect(c);
//                   }}
//                 >
//                   {highlightText(c.name, countrySearch)}
//                 </li>
//               ))}
//               {countrySearch && (
//                 <li
//                   className="ls-manual"
//                   onMouseDown={(e) => {
//                     e.preventDefault();
//                     handleManualCountry();
//                   }}
//                 >
//                   ➕ Add "{countrySearch}"
//                 </li>
//               )}
//             </ul>
//           )}
//         </div>

//         {/* City */}
//         <div
//           className={`form-group ${errors.city ? "error" : ""}`}
//           ref={cityRef}
//         >
//           <label className="form-label required">City</label>
//           <div className="ls-input-wrap">
//             <input
//               ref={cityInputRef}
//               disabled={!selectedCountry}
//               type="text"
//               value={citySearch}
//               onChange={(e) => {
//                 setCitySearch(e.target.value);
//                 setShowCityDropdown(true);
//                 setSelectedCity(null);
//                 setHighlightedIndex((prev) => ({ ...prev, city: 0 }));
//               }}
//               onFocus={() => selectedCountry && setShowCityDropdown(true)}
//               onKeyDown={handleCityKeyDown}
//               placeholder={selectedCountry ? "Search city..." : "Select country first"}
//               className="form-input"
//             />
//             <button
//               type="button"
//               className="ls-chevron"
//               disabled={!selectedCountry}
//               onClick={() => selectedCountry && setShowCityDropdown((s) => !s)}
//             >
//               <FaChevronDown />
//             </button>
//           </div>
//           {showCityDropdown && selectedCountry && (
//             <ul className="ls-dropdown">
//               {filteredCities.map((ct, i) => (
//                 <li
//                   key={ct.id}
//                   className={highlightedIndex.city === i ? "highlighted" : ""}
//                   onMouseDown={(e) => {
//                     e.preventDefault();
//                     handleCitySelect(ct);
//                   }}
//                 >
//                   {highlightText(ct.name, citySearch)}
//                 </li>
//               ))}
//               {citySearch && (
//                 <li
//                   className="ls-manual"
//                   onMouseDown={(e) => {
//                     e.preventDefault();
//                     handleManualCity();
//                   }}
//                 >
//                   ➕ Add "{citySearch}"
//                 </li>
//               )}
//             </ul>
//           )}
//         </div>

//         {(loading || saving.country || saving.city) && (
//           <div className="ls-status">
//             {loading && "Loading..."}
//             {saving.country && "Saving country..."}
//             {saving.city && "Saving city..."}
//           </div>
//         )}
//       </div>
//     );
//   }
// );

// export default LocationSelector;
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback
} from "react";
import { FaChevronDown } from "react-icons/fa";
import "./LocationSelector.css";
import { getCode } from "country-list";
import { getCountryCallingCode } from "libphonenumber-js";

const API_BASE = "https://backend.chaloholidayonline.com/api";

const LocationSelector = forwardRef(
  (
    { countryId, cityId, onCountrySelect, onCitySelect, onNotify, errors = {} },
    ref
  ) => {
    const [countries, setCountries] = useState([]);
    const [citiesByCountry, setCitiesByCountry] = useState({});
    const [countrySearch, setCountrySearch] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState({
      country: 0,
      city: 0
    });
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
        if (countryRef.current && !countryRef.current.contains(e.target))
          setShowCountryDropdown(false);
        if (cityRef.current && !cityRef.current.contains(e.target))
          setShowCityDropdown(false);
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
          (data || []).forEach((c) => {
            if (Array.isArray(c.cities))
              mapping[c.id] = c.cities.map((ct) => ({
                id: ct.id,
                name: ct.name
              }));
          });
          setCitiesByCountry(mapping);

          if (countryId) {
            const c = (data || []).find((x) => x.id === countryId);
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
 const fetchCitiesForCountry = useCallback(
  async (countryIdToFetch) => {
    if (!countryIdToFetch) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/cities/by-country/${countryIdToFetch}`);
      if (!res.ok) throw new Error("Failed to fetch cities");
      const data = await res.json();

      setCitiesByCountry((prev) => ({
        ...prev,
        [countryIdToFetch]: data
      }));
    } catch (err) {
      console.error("fetch cities:", err);
    } finally {
      setLoading(false);
    }
  },
  []
);

    // initial city selection
    useEffect(() => {
      if (!cityId || !selectedCountry) return;

        const cities = citiesByCountry[selectedCountry.id];
        if (!cities || cities.length === 0) return
      const found = (citiesByCountry[selectedCountry.id] || []).find(
        (ct) => ct.id === cityId
      );
      if (found) {
        setSelectedCity(found);
        setCitySearch(found.name);
         onCitySelect?.(found); 
      }
    }, [cityId, citiesByCountry, selectedCountry]);

    const highlightText = (text, search) => {
      if (!search) return text;
      const regex = new RegExp(`(${search})`, "ig");
      const parts = String(text).split(regex);
      return parts.map((p, i) =>
        regex.test(p) ? <b key={i}>{p}</b> : <span key={i}>{p}</span>
      );
    };

    const filteredCountries = countries.filter((c) =>
      (c.name || "").toLowerCase().includes(countrySearch.toLowerCase())
    );

    const filteredCities = selectedCountry
      ? (citiesByCountry[selectedCountry.id] || []).filter((ct) =>
          (ct.name || "").toLowerCase().includes(citySearch.toLowerCase())
        )
      : [];

    const clearCitySelection = useCallback(() => {
      setSelectedCity(null);
      setCitySearch("");
      onCitySelect?.({ name: "", id: null });
    }, [onCitySelect]);

    // const handleCountrySelect = useCallback(
    //   (country) => {
    //     const code = country.code || getCode(country.name) || country.name.slice(0, 2).toUpperCase();
    //     let phoneCode = "+1"; // default +1
    //     try {
    //       phoneCode = code ? `+${getCountryCallingCode(code)}` : "+1";
    //     } catch (e) {
    //       console.warn("Could not get calling code for", code);
    //     }

    //     const flag = code
    //       ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)))
    //       : "";
        
    //     const enrichedCountry = { ...country, code, phoneCode, flag ,   region: country.region  };
    //     console.log("Enriched Country ✅:", enrichedCountry);
    //     setSelectedCountry(enrichedCountry);
    //     setCountrySearch(enrichedCountry.name);
    //     setShowCountryDropdown(false);
    //     setHighlightedIndex((prev) => ({ ...prev, country: 0 }));
    //     clearCitySelection();

    //     if (!citiesByCountry[enrichedCountry.id]) {
    //       fetchCitiesForCountry(enrichedCountry.id);
    //     }

    //     onCountrySelect?.(enrichedCountry); 
    //     setTimeout(() => cityInputRef.current?.focus(), 0);
    //   },
    //   [citiesByCountry, clearCitySelection, fetchCitiesForCountry, onCountrySelect]
    // );
    const handleCountrySelect = useCallback(
  (country) => {
    const code =
      country.code || getCode(country.name) || country.name.slice(0, 2).toUpperCase();

    let phoneCode = "+1"; // default if missing
    try {
      phoneCode = `+${getCountryCallingCode(code)}`;
    } catch (e) {
      console.warn("Could not get calling code for", code);
    }

    const flag = code
      ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)))
      : "";

    // ✅ Preserve backend data without overwriting
    const enrichedCountry = {
      ...country,
      code,
      phoneCode,
      flag,
      region: country.region || "N/A",
      phoneNumberDigits: country.phoneNumberDigits || 10
    };

    console.log("✅ Enriched Country:", enrichedCountry);

    setSelectedCountry(enrichedCountry);
    setCountrySearch(enrichedCountry.name);
    setShowCountryDropdown(false);
    clearCitySelection();

    if (!citiesByCountry[enrichedCountry.id]) {
      fetchCitiesForCountry(enrichedCountry.id);
    }

    onCountrySelect?.(enrichedCountry);
    setTimeout(() => cityInputRef.current?.focus(), 0);
  },
  [citiesByCountry, clearCitySelection, fetchCitiesForCountry, onCountrySelect]
);

    const handleCitySelect = useCallback(
      (city) => {
        setSelectedCity(city);
        setCitySearch(city.name);
        setShowCityDropdown(false);
        setHighlightedIndex((prev) => ({ ...prev, city: 0 }));
        onCitySelect?.(city);
      },
      [onCitySelect]
    );

    const handleManualCountry = useCallback(async () => {
      const name = countrySearch.trim();
      if (!name) return;

      // Check for exact match (case insensitive)
      const existingCountry = countries.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );

      if (existingCountry) {
        setNotice("Country already exists.");
        setTimeout(() => setNotice(""), 2000);
        handleCountrySelect(existingCountry);
        return;
      }

      setSaving((prev) => ({ ...prev, country: true }));

      const code = getCode(name) || name.slice(0, 2).toUpperCase();
      let phoneCode = "+1 "; // default
      try {
        phoneCode = code ? `+${getCountryCallingCode(code)}  ` : "+1 ";
      } catch (e) {
        console.warn("Could not get calling code for", code);
      }

      const flag = code
        ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)))
        : "";

      try {
        const res = await fetch(`${API_BASE}/countries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, code, phoneCode, flag })
        });

        if (!res.ok) throw new Error("Failed to add country");

        const newCountry = await res.json();
        setCountries((prev) => [...prev, newCountry]);
        setCitiesByCountry((prev) => ({ ...prev, [newCountry.id]: [] }));
        handleCountrySelect(newCountry);
        onNotify?.({ type: "success", message: `Country "${name}" added` });
      } catch (err) {
        console.error(err);
        setNotice("Failed to add country");
        onNotify?.({ type: "error", message: "Failed to add country" });
      } finally {
        setSaving((prev) => ({ ...prev, country: false }));
        setTimeout(() => setNotice(""), 3000);
      }
    }, [countrySearch, countries, handleCountrySelect, onNotify]);

    const handleManualCity = useCallback(async () => {
      const name = citySearch.trim();

      if (!name || !selectedCountry?.id) {
        setNotice("Select a country first");
        setTimeout(() => setNotice(""), 2000);
        return;
      }

      // Check for exact match in the current country's cities
      const existingCity = (citiesByCountry[selectedCountry.id] || []).find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );

      if (existingCity) {
        setNotice("City already exists.");
        setTimeout(() => setNotice(""), 2000);
        handleCitySelect(existingCity);
        return;
      }

      setSaving((prev) => ({ ...prev, city: true }));

      try {
        const res = await fetch(`${API_BASE}/cities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, countryId: selectedCountry.id })
        });

        if (!res.ok) throw new Error("Failed to add city");

        const newCity = await res.json();
        setCitiesByCountry((prev) => ({
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
        setSaving((prev) => ({ ...prev, city: false }));
        setTimeout(() => setNotice(""), 3000);
      }
    }, [citySearch, selectedCountry, citiesByCountry, handleCitySelect, onNotify]);

    const handleCountryKeyDown = (e) => {
      if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;

      if (e.key === "Enter") e.preventDefault();

      if (e.key === "Escape") {
        setShowCountryDropdown(false);
        return;
      }

      if (!filteredCountries.length) {
        if (e.key === "Enter") {
          setNotice("No match. Click Add.");
          setTimeout(() => setNotice(""), 2000);
        }
        return;
      }

      let idx = highlightedIndex.country;

      if (e.key === "ArrowDown") {
        idx = (idx + 1) % filteredCountries.length;
      } else if (e.key === "ArrowUp") {
        idx = (idx - 1 + filteredCountries.length) % filteredCountries.length;
      } else if (e.key === "Enter") {
        handleCountrySelect(filteredCountries[idx]);
        return;
      }

      setHighlightedIndex((prev) => ({ ...prev, country: idx }));
    };

    const handleCityKeyDown = (e) => {
      if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;

      if (e.key === "Enter") e.preventDefault();

      if (e.key === "Escape") {
        setShowCityDropdown(false);
        return;
      }

      if (!filteredCities.length) {
        if (e.key === "Enter") {
          setNotice("No match. Click Add.");
          setTimeout(() => setNotice(""), 2000);
        }
        return;
      }

      let idx = highlightedIndex.city;

      if (e.key === "ArrowDown") {
        idx = (idx + 1) % filteredCities.length;
      } else if (e.key === "ArrowUp") {
        idx = (idx - 1 + filteredCities.length) % filteredCities.length;
      } else if (e.key === "Enter") {
        handleCitySelect(filteredCities[idx]);
        return;
      }

      setHighlightedIndex((prev) => ({ ...prev, city: idx }));
    };

    return (
      <div className="location-selector">
        {notice && <div className="ls-notice">{notice}</div>}

        {/* Country */}
        <div
          className={`form-group ${errors.country ? "error" : ""}`}
          ref={countryRef}
        >
          <label className="form-label required">Country</label>
          <div className="ls-input-wrap">
            <input
              ref={countryInputRef}
              type="text"
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setShowCountryDropdown(true);
                setSelectedCountry(null);
                setHighlightedIndex((prev) => ({ ...prev, country: 0 }));
              }}
              onFocus={() => setShowCountryDropdown(true)}
              onKeyDown={handleCountryKeyDown}
              placeholder="Search country..."
              className="form-input"
            />
            <button
              type="button"
              className="ls-chevron"
              onClick={() => setShowCountryDropdown((s) => !s)}
            >
              <FaChevronDown />
            </button>
          </div>
          {showCountryDropdown && (
            <ul className="ls-dropdown">
              {filteredCountries.map((c, i) => (
                <li
                  key={c.id}
                  className={highlightedIndex.country === i ? "highlighted" : ""}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCountrySelect(c);
                  }}
                >
                  {highlightText(c.name, countrySearch)}
                </li>
              ))}
              {countrySearch && (
                <li
                  className="ls-manual"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleManualCountry();
                  }}
                >
                  ➕ Add "{countrySearch}"
                </li>
              )}
            </ul>
          )}
        </div>

        {/* City */}
        <div
          className={`form-group ${errors.city ? "error" : ""}`}
          ref={cityRef}
        >
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
                setHighlightedIndex((prev) => ({ ...prev, city: 0 }));
              }}
              onFocus={() => selectedCountry && setShowCityDropdown(true)}
              onKeyDown={handleCityKeyDown}
              placeholder={selectedCountry ? "Search city..." : "Select country first"}
              className="form-input"
            />
            <button
              type="button"
              className="ls-chevron"
              disabled={!selectedCountry}
              onClick={() => selectedCountry && setShowCityDropdown((s) => !s)}
            >
              <FaChevronDown />
            </button>
          </div>
          {showCityDropdown && selectedCountry && (
            <ul className="ls-dropdown">
              {filteredCities.map((ct, i) => (
                <li
                  key={ct.id}
                  className={highlightedIndex.city === i ? "highlighted" : ""}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCitySelect(ct);
                  }}
                >
                  {highlightText(ct.name, citySearch)}
                </li>
              ))}
              {citySearch && (
                <li
                  className="ls-manual"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleManualCity();
                  }}
                >
                  ➕ Add "{citySearch}"
                </li>
              )}
            </ul>
          )}
        </div>

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

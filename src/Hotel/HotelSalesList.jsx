import React, { useState, useEffect, useMemo } from 'react';
import ViewHotelModal from './ViewHotelModal';
import EditHotelModal from './EditHotelModal';
import HotelListSkeleton from '../components/HotelListSkeleton';
import { FixedSizeList} from 'react-window';
import { 
  FaSearch, FaSortUp, FaSortDown, FaEye, FaEdit, FaTrash, FaTimes, FaCheckCircle 
} from 'react-icons/fa';
import './viewhotel.css';

const API_BASE_HOTEL = "https://backend.chaloholidayonline.com/api/hotels";
const API_BASE_COUNTRIES = "https://backend.chaloholidayonline.com/api/countries";
const API_BASE_CITIES = "https://backend.chaloholidayonline.com/api/cities/by-country";

const HotelSalesList = ({ showNotification }) => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHotel, setEditingHotel] = useState(null);
  const [viewHotel, setViewHotel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [sortField, setSortField] = useState('hotelName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Fetch hotels and associated country/city names
  const fetchHotels = async () => {
    setLoading(true);
    try {
      const [hotelRes, countryRes] = await Promise.all([
        fetch(API_BASE_HOTEL),
        fetch(API_BASE_COUNTRIES)
      ]);
      if (!hotelRes.ok || !countryRes.ok) throw new Error("Failed to fetch data");
      const [hotelData, countryData] = await Promise.all([hotelRes.json(), countryRes.json()]);

      // Fetch cities per country
      const uniqueCountryIds = [...new Set(hotelData.map(h => h.countryId))];
      const cityPromises = uniqueCountryIds.map(id =>
        fetch(`${API_BASE_CITIES}/${id}`).then(res => res.json())
      );
      const citiesData = (await Promise.all(cityPromises)).flat();

      const countryMap = new Map(countryData.map(c => [c.id, c.name]));
      const cityMap = new Map(citiesData.map(c => [c.id, c.name]));

      const adjustedData = hotelData.map(hotel => ({
        ...hotel,
        country: countryMap.get(hotel.countryId) || "Unknown",
        city: cityMap.get(hotel.cityId) || "Unknown",
        salesPersons: hotel.salesPersons?.length ? hotel.salesPersons : hotel.salesPersonName ? [{ name: hotel.salesPersonName }] : [],
        reservationPersons: hotel.reservationPersons?.length ? hotel.reservationPersons : hotel.reservationPersonName ? [{ name: hotel.reservationPersonName }] : [],
      }));

      setHotels(adjustedData);
    } catch (err) {
      console.error(err);
      showNotification(`Error fetching hotels: ${err.message}`, "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  // Delete functions
  const deleteHotel = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;
    try {
      await fetch(`${API_BASE_HOTEL}/${id}`, { method: "DELETE" });
      setHotels(prev => prev.filter(h => h.id !== id));
      showNotification("Hotel deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Error deleting hotel", "error");
    }
  };

  const deleteMultipleHotels = async () => {
    if (!selectedHotels.length || !window.confirm(`Delete ${selectedHotels.length} hotels?`)) return;
    try {
      await Promise.all(selectedHotels.map(id => fetch(`${API_BASE_HOTEL}/${id}`, { method: "DELETE" })));
      setHotels(prev => prev.filter(h => !selectedHotels.includes(h.id)));
      setSelectedHotels([]);
      setBulkAction('');
      showNotification(`${selectedHotels.length} hotels deleted successfully!`, "success");
    } catch (err) {
      console.error(err);
      showNotification("Error deleting hotels", "error");
    }
  };

  const saveHotel = async (hotel) => {
    try {
      await fetch(`${API_BASE_HOTEL}/${hotel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotel),
      });
      setEditingHotel(null);
      fetchHotels();
      showNotification("Hotel updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Error updating hotel", "error");
    }
  };

  // Sorting
  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  // Memoized filtered & sorted hotels for performance
  const filteredHotels = useMemo(() => {
    return [...hotels]
      .filter(h => 
        (h.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.country?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterCountry ? h.country === filterCountry : true) &&
        (filterCity ? h.city === filterCity : true)
      )
      .sort((a, b) => {
        const aVal = a[sortField] || '';
        const bVal = b[sortField] || '';
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [hotels, searchTerm, filterCountry, filterCity, sortField, sortDirection]);

  const countries = useMemo(() => [...new Set(hotels.map(h => h.country).filter(Boolean))], [hotels]);
  const cities = useMemo(() => [...new Set(hotels.map(h => h.city).filter(Boolean))], [hotels]);

  const toggleSelectHotel = (id) => {
    setSelectedHotels(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedHotels.length === filteredHotels.length) setSelectedHotels([]);
    else setSelectedHotels(filteredHotels.map(h => h.id));
  };

  if (loading) return <HotelListSkeleton rowCount={5} />;

  // Virtualized Row
  const Row = ({ index, style }) => {
    const hotel = filteredHotels[index];
    return (
      <div className={`hsl-table-row ${selectedHotels.includes(hotel.id) ? 'hsl-selected' : ''}`} style={style}>
        <div className="hsl-select-column">
          <input type="checkbox" checked={selectedHotels.includes(hotel.id)} onChange={() => toggleSelectHotel(hotel.id)} />
        </div>
        <div className="hsl-cell">{hotel.hotelName}</div>
        <div className="hsl-cell">{hotel.city}</div>
        <div className="hsl-cell">{hotel.country}</div>
        <div className="hsl-cell">{hotel.salesPersons.length}</div>
        <div className="hsl-cell">
          <button onClick={() => setViewHotel(hotel)}><FaEye /></button>
          <button onClick={() => setEditingHotel(hotel)}><FaEdit /></button>
          <button onClick={() => deleteHotel(hotel.id)}><FaTrash /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="hsl-hotel-sales-list">
      <div className="hsl-card">
        <h2 className="section-title">Registered Hotels</h2>

        <div className="hsl-search-filter-section">
          <div className="hsl-search-box">
            <FaSearch />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." />
            {searchTerm && <button onClick={() => setSearchTerm('')}><FaTimes /></button>}
          </div>
          <div className="hsl-filter-controls">
            <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}>
              <option value="">All Countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterCity} onChange={e => setFilterCity(e.target.value)}>
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => { setFilterCity(''); setFilterCountry(''); setSearchTerm(''); }}>Clear Filters</button>
          </div>
        </div>

        {selectedHotels.length > 0 && (
          <div className="hsl-bulk-actions-card">
            <FaCheckCircle /> {selectedHotels.length} selected
            <button onClick={() => setSelectedHotels([])}><FaTimes /></button>
            <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
              <option value="">Choose action</option>
              <option value="delete">Delete Selected</option>
            </select>
            <button disabled={!bulkAction} onClick={deleteMultipleHotels}>Apply</button>
          </div>
        )}

        <div className="hsl-hotels-table">
          <div className="hsl-table-header">
            <div className="hsl-select-column">
              <input type="checkbox" checked={selectedHotels.length === filteredHotels.length && filteredHotels.length > 0} onChange={toggleSelectAll} />
            </div>
            <div className="hsl-cell" onClick={() => handleSort('hotelName')}>Hotel {sortField==='hotelName' ? (sortDirection==='asc'?<FaSortUp />:<FaSortDown />):''}</div>
            <div className="hsl-cell" onClick={() => handleSort('city')}>City {sortField==='city' ? (sortDirection==='asc'?<FaSortUp />:<FaSortDown />):''}</div>
            <div className="hsl-cell" onClick={() => handleSort('country')}>Country {sortField==='country' ? (sortDirection==='asc'?<FaSortUp />:<FaSortDown />):''}</div>
            <div className="hsl-cell">Sales</div>
            <div className="hsl-cell">Actions</div>
          </div>

          <List
            height={400}
            itemCount={filteredHotels.length}
            itemSize={50}
            width="100%"
          >
            {Row}
          </List>
        </div>
      </div>

      {viewHotel && <ViewHotelModal hotel={viewHotel} onClose={() => setViewHotel(null)} />}
      {editingHotel && <EditHotelModal hotel={editingHotel} onSave={saveHotel} onCancel={() => setEditingHotel(null)} />}
    </div>
  );
};

export default HotelSalesList;

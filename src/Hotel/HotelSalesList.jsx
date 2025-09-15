import React, { useState, useMemo } from 'react';
import ViewHotelModal from './ViewHotelModal';
import EditHotelModal from './EditHotelModal';
import HotelListSkeleton from '../components/HotelListSkeleton';
import { FixedSizeList as List } from 'react-window';
import { 
  FaSearch, FaSortUp, FaSortDown, FaEye, FaEdit, FaTrash, FaTimes, FaCheckCircle 
} from 'react-icons/fa';
import './viewhotel.css';

const manualHotels = [
  { id: 1, hotelName: "Sunrise Resort", country: "India", city: "Delhi", salesPersons: [{ name: "John" }] },
  { id: 2, hotelName: "Ocean View", country: "India", city: "Mumbai", salesPersons: [{ name: "Alice" }] },
  { id: 3, hotelName: "Mountain Retreat", country: "Nepal", city: "Kathmandu", salesPersons: [{ name: "Bob" }] },
  { id: 4, hotelName: "City Lodge", country: "USA", city: "New York", salesPersons: [{ name: "Charlie" }] },
  { id: 5, hotelName: "Lakeside Inn", country: "Canada", city: "Toronto", salesPersons: [{ name: "Eve" }] },
  { id: 6, hotelName: "Desert Oasis", country: "UAE", city: "Dubai", salesPersons: [{ name: "Zara" }] },
  { id: 7, hotelName: "Forest Haven", country: "Brazil", city: "Rio", salesPersons: [{ name: "Marco" }] },
  { id: 8, hotelName: "Skyline Hotel", country: "Japan", city: "Tokyo", salesPersons: [{ name: "Yuki" }] },
  { id: 9, hotelName: "Harbor View", country: "Australia", city: "Sydney", salesPersons: [{ name: "Olivia" }] },
  { id: 10, hotelName: "Seaside Retreat", country: "Spain", city: "Barcelona", salesPersons: [{ name: "Luis" }] }
];

const HotelSalesList = ({ showNotification }) => {
  const [hotels, setHotels] = useState(manualHotels);
  const [editingHotel, setEditingHotel] = useState(null);
  const [viewHotel, setViewHotel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [sortField, setSortField] = useState('hotelName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const deleteHotel = (id) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;
    setHotels(prev => prev.filter(h => h.id !== id));
    showNotification && showNotification("Hotel deleted successfully!", "success");
  };

  const deleteMultipleHotels = () => {
    if (!selectedHotels.length || !window.confirm(`Delete ${selectedHotels.length} hotels?`)) return;
    setHotels(prev => prev.filter(h => !selectedHotels.includes(h.id)));
    setSelectedHotels([]);
    setBulkAction('');
    showNotification && showNotification(`${selectedHotels.length} hotels deleted successfully!`, "success");
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const filteredHotels = useMemo(() => {
    return [...hotels]
      .filter(h => 
        (h.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.country.toLowerCase().includes(searchTerm.toLowerCase())) &&
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

  const countries = useMemo(() => [...new Set(hotels.map(h => h.country))], [hotels]);
  const cities = useMemo(() => [...new Set(hotels.map(h => h.city))], [hotels]);

  const toggleSelectHotel = (id) => {
    setSelectedHotels(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedHotels.length === filteredHotels.length) setSelectedHotels([]);
    else setSelectedHotels(filteredHotels.map(h => h.id));
  };

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
      {editingHotel && <EditHotelModal hotel={editingHotel} onSave={(h) => { setHotels(prev => prev.map(p => p.id === h.id ? h : p)); setEditingHotel(null); }} onCancel={() => setEditingHotel(null)} />}
    </div>
  );
};

export default HotelSalesList;

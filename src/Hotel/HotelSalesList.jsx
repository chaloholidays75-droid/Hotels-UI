import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ViewHotelModal from './ViewHotelModal';
import EditHotelModal from './EditHotelModal';
import HotelListSkeleton from '../components/HotelListSkeleton';
import { 
  FaSearch, FaFilter, FaSortUp, FaSortDown, FaEye, 
  FaEdit, FaTrash, FaPlus, FaEllipsisV, FaTimes,
  FaCheckCircle, FaExclamationTriangle, FaSync
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
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('hotelName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const itemsPerPage = 10;

const API_BASE_HOTEL = "https://backend.chaloholidayonline.com/api/hotels";
const API_BASE_CITIES = "https://backend.chaloholidayonline.com/api/cities/by-country";



const fetchHotels = async () => {
  setRefreshing(true);
  try {
    // Fetch hotels
    const hotelRes = await fetch(API_BASE_HOTEL);
    if (!hotelRes.ok) throw new Error(`Hotel fetch failed: ${hotelRes.status}`);
    const hotelData = await hotelRes.json();

    // Fetch countries
    const countryRes = await fetch(API_BASE_COUNTRIES);
    if (!countryRes.ok) throw new Error(`Countries fetch failed: ${countryRes.status}`);
    const countryData = await countryRes.json();

    // Fetch cities for each unique countryId
    const cityPromises = [...new Set(hotelData.map(h => h.countryId))].map(countryId =>
      fetch(`${API_BASE_CITIES}/${countryId}`).then(async res => {
        if (!res.ok) throw new Error(`Cities fetch failed for country ${countryId}: ${res.status}`);
        return res.json();
      })
    );
    const citiesData = (await Promise.all(cityPromises)).flat();

    // Create lookup maps
    const countryMap = new Map(countryData.map(c => [c.id, c.name]));
    const cityMap = new Map(citiesData.map(c => [c.id, c.name]));

    // Map hotel data with country and city names
    const adjustedData = hotelData.map(hotel => ({
      ...hotel,
      country: countryMap.get(hotel.countryId) || "Unknown Country",
      city: cityMap.get(hotel.cityId) || "Unknown City",
      salesPersons: Array.isArray(hotel.salesPersons) ? hotel.salesPersons : (hotel.salesPersonName ? [{ name: hotel.salesPersonName, email: hotel.salesPersonEmail, contact: hotel.salesPersonContact }] : []),
      reservationPersons: Array.isArray(hotel.reservationPersons) ? hotel.reservationPersons : (hotel.reservationPersonName ? [{ name: hotel.reservationPersonName, email: hotel.reservationPersonEmail, contact: hotel.reservationPersonContact }] : []),
      accountsPersons: Array.isArray(hotel.accountsPersons) ? hotel.accountsPersons : (hotel.accountsPersonName ? [{ name: hotel.accountsPersonName, email: hotel.accountsPersonEmail, contact: hotel.accountsPersonContact }] : []),
      receptionPersons: Array.isArray(hotel.receptionPersons) ? hotel.receptionPersons : (hotel.receptionPersonName ? [{ name: hotel.receptionPersonName, email: hotel.receptionPersonEmail, contact: hotel.receptionPersonContact }] : []),
      concierges: Array.isArray(hotel.concierges) ? hotel.concierges : (hotel.conciergeName ? [{ name: hotel.conciergeName, email: hotel.conciergeEmail, contact: hotel.conciergeContact }] : []),
    }));

    setHotels(adjustedData);
    console.log("Adjusted Hotels:", adjustedData);
  } catch (err) {
    console.error("Error fetching hotels:", err);
    showNotification(`Error fetching hotels: ${err.message}`, "error");
  }
  setRefreshing(false);
  setLoading(false);
};
  useEffect(() => {
    fetchHotels();
  }, []);

  const deleteHotel = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;
    try {
      await fetch(`${API_BASE_HOTEL}/${id}`, { method: "DELETE" });
      setHotels(prev => prev.filter(h => h.id !== id));
      showNotification("Hotel deleted successfully!", "success");
    } catch (err) {
      console.error("Error deleting hotel:", err);
      showNotification("Error deleting hotel", "error");
    }
  };

  const deleteMultipleHotels = async () => {
    if (!selectedHotels.length || !window.confirm(`Are you sure you want to delete ${selectedHotels.length} hotels?`)) return;
    try {
      await Promise.all(selectedHotels.map(id => 
        fetch(`${API_BASE_HOTEL}/${id}`, { method: "DELETE" })
      ));
      setHotels(prev => prev.filter(h => !selectedHotels.includes(h.id)));
      setSelectedHotels([]);
      setBulkAction('');
      showNotification(`${selectedHotels.length} hotels deleted successfully!`, "success");
    } catch (err) {
      console.error("Error deleting hotels:", err);
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
      console.error("Error updating hotel:", err);
      showNotification("Error updating hotel", "error");
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedHotels = [...hotels].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredHotels = sortedHotels.filter(hotel => {
    const matchesSearch = hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry ? hotel.country === filterCountry : true;
    const matchesCity = filterCity ? hotel.city === filterCity : true;
    return matchesSearch && matchesCountry && matchesCity;
  });

  const countries = [...new Set(hotels.map(hotel => hotel.country).filter(Boolean))];
  const cities = [...new Set(hotels.map(hotel => hotel.city).filter(Boolean))];

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);

  const toggleSelectHotel = (id) => {
    setSelectedHotels(prev => 
      prev.includes(id) 
        ? prev.filter(hotelId => hotelId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedHotels.length === currentHotels.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels(currentHotels.map(hotel => hotel.id));
    }
  };

  if (loading) return (
    <HotelListSkeleton rowCount={5} />
  );

  return (
    <div className="hsl-hotel-sales-list">

      <div className="hsl-card">
      <h2 className="section-title" >Registered Hotels</h2>

        <div className="hsl-list-controls">
          <div className="hsl-search-filter-section">
            <div className="hsl-search-box">
              <FaSearch className="hsl-search-icon" />
              <input
                type="text"
                placeholder="Search by hotel, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="hsl-clear-search" onClick={() => setSearchTerm('')}>
                  <FaTimes />
                </button>
              )}
            </div>
            
            <div className="hsl-filter-controls">
              <div className="hsl-filter-group">
                <label>Country</label>
                <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
                  <option value="">All Countries</option>
                  {countries.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>
              
              <div className="hsl-filter-group">
                <label>City</label>
                <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
                  <option value="">All Cities</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              
              <button className="hsl-btn hsl-btn-secondary" onClick={() => { setFilterCountry(""); setFilterCity(""); setSearchTerm(""); }}>
                Clear Filters
              </button>
            </div>
          </div>

          {selectedHotels.length > 0 && (
            <div className="hsl-bulk-actions-card">
              <div className="hsl-bulk-header">
                <FaCheckCircle />
                <span>{selectedHotels.length} hotel{selectedHotels.length !== 1 ? 's' : ''} selected</span>
                <button className="hsl-clear-selection" onClick={() => setSelectedHotels([])}>
                  <FaTimes />
                </button>
              </div>
              <div className="hsl-bulk-controls">
                <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                  <option value="">Choose action...</option>
                  <option value="delete">Delete Selected</option>
                </select>
                <button 
                  className="hsl-btn hsl-btn-danger" 
                  onClick={deleteMultipleHotels}
                  disabled={!bulkAction}
                >
                  Apply Action
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hsl-results-info">
          <div className="hsl-results-count">
            <span className="hsl-results-text">
              Showing <strong>{filteredHotels.length}</strong> of <strong>{hotels.length}</strong> hotels
            </span>
            {filteredHotels.length !== hotels.length && (
              <button 
                className="hsl-btn hsl-btn-text" 
                onClick={() => { setFilterCountry(""); setFilterCity(""); setSearchTerm(""); }}
              >
                Clear all filters
              </button>
            )}
          </div>
          <div className="hsl-sort-controls">
            <span>Sort by:</span>
            <button 
              className={`hsl-sort-btn ${sortField === 'hotelName' ? 'hsl-active' : ''}`}
              onClick={() => handleSort('hotelName')}
            >
              Name {sortField === 'hotelName' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
            </button>
            <button 
              className={`hsl-sort-btn ${sortField === 'city' ? 'hsl-active' : ''}`}
              onClick={() => handleSort('city')}
            >
              City {sortField === 'city' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
            </button>
            <button 
              className={`hsl-sort-btn ${sortField === 'country' ? 'hsl-active' : ''}`}
              onClick={() => handleSort('country')}
            >
              Country {sortField === 'country' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
            </button>
          </div>
        </div>

        {filteredHotels.length === 0 ? (
          <div className="hsl-no-results">
            
            <h3>No hotels found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              className="hsl-btn hsl-btn-primary" 
              onClick={() => { setFilterCountry(""); setFilterCity(""); setSearchTerm(""); }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="hsl-hotels-table-container">
              <table className="hsl-hotels-table">
                <thead>
                  <tr>
                    <th className="hsl-select-column">
                      <input
                        type="checkbox"
                        checked={selectedHotels.length === currentHotels.length && currentHotels.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th onClick={() => handleSort('hotelName')} className="hsl-sortable-header">
                      <div>
                        <span>Hotel Name</span>
                        {sortField === 'hotelName' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('city')} className="hsl-sortable-header">
                      <div>
                        <span>City</span>
                        {sortField === 'city' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('country')} className="hsl-sortable-header">
                      <div>
                        <span>Country</span>
                        {sortField === 'country' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                      </div>
                    </th>
                    <th>Sales Contacts</th>
                    <th>Reservation Contacts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHotels.map(hotel => (
                    <tr key={hotel.id} className={selectedHotels.includes(hotel.id) ? 'hsl-selected' : ''}>
                      <td className="hsl-select-column">
                        <input
                          type="checkbox"
                          checked={selectedHotels.includes(hotel.id)}
                          onChange={() => toggleSelectHotel(hotel.id)}
                        />
                      </td>
                      <td>
                        <div className="hsl-hotel-name-cell">
                          <div className="hsl-hotel-name">{hotel.hotelName || 'No Name Provided'}</div>
                          {hotel.hotelChain && <div className="hsl-hotel-chain">{hotel.hotelChain}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="hsl-city-cell">
                          <span className="hsl-city-name">{hotel.city}</span>
                        </div>
                      </td>
                      <td>
                        <div className="hsl-country-cell">
                          <span className="hsl-country-name">{hotel.country}</span>
                        </div>
                      </td>
                      <td>
                        <div className="hsl-contact-info">
                          <div className="hsl-contact-count">
                            {hotel.salesPersons.length} {hotel.salesPersons.length === 1 ? 'contact' : 'contacts'}
                          </div>
                          {hotel.salesPersons.length > 0 && (
                            <div className="hsl-contact-preview">
                              {hotel.salesPersons[0].name}
                              {hotel.salesPersons.length > 1 && ` +${hotel.salesPersons.length - 1}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="hsl-contact-info">
                          <div className="hsl-contact-count">
                            {hotel.reservationPersons?.length || 0} {hotel.reservationPersons?.length === 1 ? 'contact' : 'contacts'}
                          </div>
                          {hotel.reservationPersons?.length > 0 && (
                            <div className="hsl-contact-preview">
                              {hotel.reservationPersons[0].name}
                              {hotel.reservationPersons.length > 1 && ` +${hotel.reservationPersons.length - 1}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="hsl-action-buttons">
                          <button className="hsl-btn-icon hsl-view-btn" onClick={() => setViewHotel(hotel)} title="View details">
                            <FaEye />
                          </button>
                          <button className="hsl-btn-icon hsl-edit-btn" onClick={() => setEditingHotel(hotel)} title="Edit">
                            <FaEdit />
                          </button>
                          <button className="hsl-btn-icon hsl-delete-btn" onClick={() => deleteHotel(hotel.id)} title="Delete">
                            <FaTrash />
                          </button>
  
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="hsl-table-footer">
              <div className="hsl-rows-info">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredHotels.length)} of {filteredHotels.length} entries
              </div>
              <div className="hsl-pagination">
                <button 
                  className="hsl-pagination-btn"
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <div className="hsl-page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={currentPage === pageNum ? 'hsl-pagination-btn hsl-active' : 'hsl-pagination-btn'}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="hsl-pagination-ellipsis">...</span>}
                </div>
                <button 
                  className="hsl-pagination-btn"
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
     {viewHotel && (
  <ViewHotelModal
    hotel={viewHotel}
    onClose={() => setViewHotel(null)}
  />
)}

{editingHotel && (
  <>
    {console.log("Opening edit modal for:", editingHotel)}
    <EditHotelModal
      hotel={editingHotel}
      onSave={saveHotel}
      onCancel={() => setEditingHotel(null)}
    />
  </>

)}

    </div>
  );
};
export default HotelSalesList;

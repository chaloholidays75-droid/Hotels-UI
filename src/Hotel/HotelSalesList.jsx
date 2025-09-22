// HotelSalesList.jsx
import React, { useState } from 'react';
import HotelListSkeleton from '../components/HotelListSkeleton';
import { 
  FaSearch, FaFilter, FaSortUp, FaSortDown, FaEye, 
  FaEdit, FaToggleOn, FaToggleOff, FaPlus, FaEllipsisV, FaTimes,
  FaCheckCircle, FaExclamationTriangle, FaSync, FaBan, FaLock,FaInfoCircle
} from 'react-icons/fa';
import './viewhotel.css';

const HotelSalesList = ({ 
  hotels, 
  loading,
  showNotification, 
  openViewModal, 
  openEditModal, 
  toggleHotelStatus,
  isAdmin,
  userRole 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('hotelName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const itemsPerPage = 10;

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
      const cityName = hotel.city?.name || '';
      const countryName = hotel.country?.name || '';
    const matchesSearch = hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.cityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.countryName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry ? hotel.countryName === filterCountry : true;
    const matchesCity = filterCity ? hotel.cityName === filterCity : true;
    const matchesStatus = filterStatus === "all" ? true : 
                         filterStatus === "active" ? hotel.isActive : 
                         !hotel.isActive;
    return matchesSearch && matchesCountry && matchesCity && matchesStatus;
  });

  const countries = [...new Set(hotels.map(hotel => hotel.country?.name).filter(Boolean))];
  const cities = [...new Set(hotels.map(hotel => hotel.city?.name).filter(Boolean))];

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);

  const toggleSelectHotel = (id) => {
    if (!isAdmin) return;
    
    setSelectedHotels(prev => 
      prev.includes(id) 
        ? prev.filter(hotelId => hotelId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!isAdmin) return;
    
    if (selectedHotels.length === currentHotels.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels(currentHotels.map(hotel => hotel.id));
    }
  };

  if (loading) return <HotelListSkeleton rowCount={5} />;

  return (
    <div className="hsl-hotel-sales-list">
      <div className="hsl-card">
        <h2 className="section-title">Registered Hotels</h2>
        {!isAdmin && (
          <div className="hsl-view-only-notice">
            <FaInfoCircle /> View Only Mode - You can view hotels and create new ones, but only admins can edit or change status
          </div>
        )}

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
              
              <div className="hsl-filter-group">
                <label>Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <button className="hsl-btn hsl-btn-secondary" onClick={() => { 
                setFilterCountry(""); 
                setFilterCity(""); 
                setFilterStatus("all");
                setSearchTerm(""); 
              }}>
                Clear Filters
              </button>
            </div>
          </div>

          {isAdmin && selectedHotels.length > 0 && (
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
                  <option value="activate">Activate Selected</option>
                  <option value="deactivate">Deactivate Selected</option>
                </select>
                <button 
                  className="hsl-btn hsl-btn-primary" 
                  onClick={() => {
                    if (bulkAction === "activate") {
                      selectedHotels.forEach(id => {
                        const hotel = hotels.find(h => h.id === id);
                        if (hotel && !hotel.isActive) toggleHotelStatus(id, hotel.isActive);
                      });
                    }
                    if (bulkAction === "deactivate") {
                      selectedHotels.forEach(id => {
                        const hotel = hotels.find(h => h.id === id);
                        if (hotel && hotel.isActive) toggleHotelStatus(id, hotel.isActive);
                      });
                    }
                  }}
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
                onClick={() => { 
                  setFilterCountry(""); 
                  setFilterCity(""); 
                  setFilterStatus("all");
                  setSearchTerm(""); 
                }}
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
              onClick={() => { 
                setFilterCountry(""); 
                setFilterCity(""); 
                setFilterStatus("all");
                setSearchTerm(""); 
              }}
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
                    {isAdmin && (
                      <th className="hsl-select-column">
                        <input
                          type="checkbox"
                          checked={selectedHotels.length === currentHotels.length && currentHotels.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
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
                    <th>Status</th>
                    <th>Sales Contacts</th>
                    <th>Reservation Contacts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHotels.map(hotel => (
                    <tr key={hotel.id} className={`${selectedHotels.includes(hotel.id) ? 'hsl-selected' : ''} ${!hotel.isActive ? 'hsl-inactive-row' : ''}`}>
                      {isAdmin && (
                        <td className="hsl-select-column">
                          <input
                            type="checkbox"
                            checked={selectedHotels.includes(hotel.id)}
                            onChange={() => toggleSelectHotel(hotel.id)}
                            disabled={!hotel.isActive}
                          />
                        </td>
                      )}
                      <td>
                        <div className="hsl-hotel-name-cell">
                          <div className="hsl-hotel-name">{hotel.hotelName || 'No Name Provided'}</div>
                          {hotel.hotelChain && <div className="hsl-hotel-chain">{hotel.hotelChain}</div>}
                          {!hotel.isActive && (
                            <div className="hsl-inactive-label">
                              <FaBan /> Inactive
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="hsl-city-cell">
                          <span className="hsl-city-name">{hotel.city?.name || 'Not Defined'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="hsl-country-cell">
                          <span className="hsl-country-name">{hotel.country?.name || "Not Defined"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="hsl-status-cell">
                          <span className={`hsl-status-badge ${hotel.isActive ? 'hsl-active' : 'hsl-inactive'}`}>
                            {hotel.isActive ? 'Active' : 'Inactive'}
                          </span>
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
                          <button 
                            className="hsl-btn-icon hsl-view-btn" 
                            onClick={() => openViewModal(hotel)} 
                            title="View details"
                          >
                            <FaEye />
                          </button>
                          
                          {isAdmin ? (
                            <>
                              <button 
                                className={`hsl-btn-icon hsl-edit-btn ${!hotel.isActive ? 'hsl-disabled' : ''}`} 
                                onClick={() => openEditModal(hotel)} 
                                title={hotel.isActive ? "Edit" : "Cannot edit inactive hotels"}
                                disabled={!hotel.isActive}
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className={`hsl-btn-icon hsl-status-btn ${hotel.isActive ? 'hsl-active' : 'hsl-inactive'}`} 
                                onClick={() => toggleHotelStatus(hotel.id, hotel.isActive)} 
                                title={hotel.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {hotel.isActive ? <FaToggleOn /> : <FaToggleOff />}
                              </button>
                            </>
                          ) : (
                            <button 
                              className="hsl-btn-icon hsl-disabled" 
                              title="Admin permission required for editing"
                              disabled
                            >
                              <FaLock />
                            </button>
                          )}
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
    </div>
  );
};

export default HotelSalesList;
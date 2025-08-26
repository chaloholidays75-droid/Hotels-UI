import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const HotelSalesList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHotel, setEditingHotel] = useState(null);
  const [expandedHotel, setExpandedHotel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterHotel, setFilterHotel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  const API_URL = "https://hotels-8v0p.onrender.com/api/hotelsales";

  // Fetch all hotels
  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setHotels(data);
    } catch (err) {
      console.error("Error fetching hotels:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  // Delete hotel
  const deleteHotel = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) return;

    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      setHotels((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Error deleting hotel:", err);
    }
  };

  // Save updated hotel
  const saveHotel = async (hotel) => {
    try {
      await fetch(`${API_URL}/${hotel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotel),
      });
      setEditingHotel(null);
      fetchHotels();
    } catch (err) {
      console.error("Error updating hotel:", err);
    }
  };

  // Add new sales person to editing hotel
  const addSalesPerson = () => {
    if (!editingHotel.salesPersons) {
      setEditingHotel({
        ...editingHotel,
        salesPersons: [{ name: "", email: "", contact: "" }]
      });
    } else {
      setEditingHotel({
        ...editingHotel,
        salesPersons: [...editingHotel.salesPersons, { name: "", email: "", contact: "" }]
      });
    }
  };

  // Remove sales person from editing hotel
  const removeSalesPerson = (index) => {
    const updatedSalesPersons = [...editingHotel.salesPersons];
    updatedSalesPersons.splice(index, 1);
    setEditingHotel({
      ...editingHotel,
      salesPersons: updatedSalesPersons
    });
  };

  // Handle sales person field changes
  const handleSalesPersonChange = (index, field, value) => {
    const updatedSalesPersons = [...editingHotel.salesPersons];
    updatedSalesPersons[index][field] = value;
    setEditingHotel({
      ...editingHotel,
      salesPersons: updatedSalesPersons
    });
  };

  // Filter hotels based on search and filters
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCountry = filterCountry ? hotel.country === filterCountry : true;
    const matchesCity = filterCity ? hotel.city === filterCity : true;
    const matchesHotel = filterHotel ? hotel.hotelName === filterHotel : true;
    
    return matchesSearch && matchesCountry && matchesCity && matchesHotel;
  });

  // Get unique values for filters
  const countries = [...new Set(hotels.map(hotel => hotel.country).filter(Boolean))];
  const cities = [...new Set(hotels.map(hotel => hotel.city).filter(Boolean))];
  const hotelNames = [...new Set(hotels.map(hotel => hotel.hotelName).filter(Boolean))];

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading hotels...</p>
    </div>
  );

  return (
    <div className="hotel-sales-list">
      <div className="header-section">
        <h2>Hotel Sales List</h2>
        <button 
          onClick={() => navigate("/")} 
          className="back-btn"
        >
          ← Back to Form
        </button>
      </div>

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by hotel, city, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterCountry} 
            onChange={(e) => setFilterCountry(e.target.value)}
          >
            <option value="">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          
          <select 
            value={filterCity} 
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          
          <select 
            value={filterHotel} 
            onChange={(e) => setFilterHotel(e.target.value)}
          >
            <option value="">All Hotels</option>
            {hotelNames.map(hotel => (
              <option key={hotel} value={hotel}>{hotel}</option>
            ))}
          </select>
          
          <button 
            className="clear-filters"
            onClick={() => {
              setFilterCountry("");
              setFilterCity("");
              setFilterHotel("");
              setSearchTerm("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        <p>Showing {filteredHotels.length} of {hotels.length} hotels</p>
      </div>

      {filteredHotels.length === 0 ? (
        <div className="no-results">
          <h3>No hotels found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="hotels-list">
            <div className="list-header">
              <div className="header-cell">Hotel Name</div>
              <div className="header-cell">Location</div>
              <div className="header-cell">Sales Persons</div>
              <div className="header-cell">Reservation</div>
              <div className="header-cell actions">Actions</div>
            </div>
            
            {currentHotels.map((hotel) => (
              <div key={hotel.id} className="hotel-list-item">
                <div className="list-cell hotel-info">
                  <div className="hotel-name">{hotel.hotelName}</div>
                  <div className="hotel-address">{hotel.address}</div>
                </div>
                
                <div className="list-cell location">
                  <div className="city">{hotel.city}</div>
                  <div className="country">{hotel.country}</div>
                </div>
                
                <div className="list-cell sales-persons">
                  {hotel.salesPersons && hotel.salesPersons.length > 0 ? (
                    <div className="sales-persons-list">
                      {hotel.salesPersons.slice(0, 2).map((person, index) => (
                        <div key={index} className="sales-person">
                          <div className="person-name">{person.name}</div>
                          <div className="person-contact">{person.email}</div>
                        </div>
                      ))}
                      {hotel.salesPersons.length > 2 && (
                        <div className="more-persons">
                          +{hotel.salesPersons.length - 2} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="sales-person">
                      <div className="person-name">{hotel.salesPersonName}</div>
                      <div className="person-contact">{hotel.salesPersonEmail}</div>
                    </div>
                  )}
                </div>
                
                <div className="list-cell reservation">
                  <div className="reservation-person">
                    <div className="person-name">{hotel.reservationPersonName}</div>
                    <div className="person-contact">{hotel.reservationPersonContact}</div>
                  </div>
                </div>
                
                <div className="list-cell actions">
                  <div className="action-buttons">
                    <button 
                      className="view-details-btn"
                      onClick={() => setExpandedHotel(expandedHotel === hotel.id ? null : hotel.id)}
                    >
                      {expandedHotel === hotel.id ? "Hide" : "View"}
                    </button>
                    
                    <button 
                      className="edit-btn"
                      onClick={() => setEditingHotel(editingHotel?.id === hotel.id ? null : hotel)}
                    >
                      {editingHotel?.id === hotel.id ? "Cancel" : "Edit"}
                    </button>
                    
                    <button 
                      className="delete-btn"
                      onClick={() => deleteHotel(hotel.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Expanded Details View */}
                {expandedHotel === hotel.id && (
                  <div className="hotel-details-expanded">
                    <h4>Hotel Details</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>Address:</label>
                        <span>{hotel.address}</span>
                      </div>
                      <div className="detail-item">
                        <label>Contact Number:</label>
                        <span>{hotel.hotelContactNumber}</span>
                      </div>
                      <div className="detail-item">
                        <label>Sales Contacts:</label>
                        <div className="sales-persons-details">
                          {hotel.salesPersons && hotel.salesPersons.length > 0 ? (
                            hotel.salesPersons.map((person, index) => (
                              <div key={index} className="sales-person-detail">
                                <div>{person.name} ({person.email}) - {person.contact}</div>
                              </div>
                            ))
                          ) : (
                            <div>{hotel.salesPersonName} ({hotel.salesPersonEmail}) - {hotel.salesPersonContact}</div>
                          )}
                        </div>
                      </div>
                      <div className="detail-item">
                        <label>Reservation Contact:</label>
                        <span>{hotel.reservationPersonContact}</span>
                      </div>
                      <div className="detail-item">
                        <label>Accounts Person:</label>
                        <span>{hotel.accountsPersonName} ({hotel.accountsPersonEmail})</span>
                      </div>
                      <div className="detail-item">
                        <label>Reception:</label>
                        <span>{hotel.receptionPersonName}</span>
                      </div>
                      <div className="detail-item">
                        <label>Concierge:</label>
                        <span>{hotel.conciergeName}</span>
                      </div>
                      <div className="detail-item full-width">
                        <label>Special Remarks:</label>
                        <span>{hotel.specialRemarks || "None"}</span>
                      </div>
                      <div className="detail-item full-width">
                        <label>Facilities:</label>
                        <span>{hotel.facilitiesAvailable?.join(", ") || "None listed"}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Edit Form */}
                {editingHotel?.id === hotel.id && (
                  <div className="edit-form-expanded">
                    <h4>Edit Hotel</h4>
                    <div className="form-grid">
                      <div className="list-form-group">
                        <label>Hotel Name:</label>
                        <input
                          value={editingHotel.hotelName || ""}
                          onChange={(e) => setEditingHotel({...editingHotel, hotelName: e.target.value})}
                        />
                      </div>
                      <div className="list-form-group">
                        <label>Country:</label>
                        <input
                          value={editingHotel.country || ""}
                          onChange={(e) => setEditingHotel({...editingHotel, country: e.target.value})}
                        />
                      </div>
                      <div className="list-form-group">
                        <label>City:</label>
                        <input
                          value={editingHotel.city || ""}
                          onChange={(e) => setEditingHotel({...editingHotel, city: e.target.value})}
                        />
                      </div>
                      <div className="list-form-group">
                        <label>Address:</label>
                        <input
                          value={editingHotel.address || ""}
                          onChange={(e) => setEditingHotel({...editingHotel, address: e.target.value})}
                        />
                      </div>
                      <div className="list-form-group">
                        <label>Contact Number:</label>
                        <input
                          value={editingHotel.hotelContactNumber || ""}
                          onChange={(e) => setEditingHotel({...editingHotel, hotelContactNumber: e.target.value})}
                        />
                      </div>
                      
                      {/* Sales Persons Multi-field */}
                      <div className="list-form-group full-width">
                        <label>
                          Sales Persons: 
                          <button 
                            type="button" 
                            className="add-person-btn"
                            onClick={addSalesPerson}
                          >
                            +
                          </button>
                        </label>
                        
                        <div className="sales-persons-edit">
                          {(editingHotel.salesPersons || [{ 
                            name: editingHotel.salesPersonName || "", 
                            email: editingHotel.salesPersonEmail || "", 
                            contact: editingHotel.salesPersonContact || "" 
                          }]).map((person, index) => (
                            <div key={index} className="sales-person-edit">
                              <input
                                type="text"
                                placeholder="Name"
                                value={person.name}
                                onChange={(e) => handleSalesPersonChange(index, 'name', e.target.value)}
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                value={person.email}
                                onChange={(e) => handleSalesPersonChange(index, 'email', e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="Contact"
                                value={person.contact}
                                onChange={(e) => handleSalesPersonChange(index, 'contact', e.target.value)}
                              />
                              <button 
                                type="button" 
                                className="remove-person-btn"
                                onClick={() => removeSalesPerson(index)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="list-form-group">
                        <label>Reservation Person:</label>
                        <input
                          value={editingHotel.reservationPersonName || ""}
                          onChange={(e) => setEditingHotel({...editingHotel, reservationPersonName: e.target.value})}
                        />
                      </div>
                      <div className="list-form-group">
                        <label>Reservation Email:</label>
                        <input
                          value={editingHotel.reservationPersonEmail || ""}
                          onChange={(e) => setEditingHotel({...editingHotel, reservationPersonEmail: e.target.value})}
                        />
                      </div>
                      <div className="list-form-group">
                        <label>Reservation Contact:</label>
                        <input
                          value={editingHotel.reservationPersonContact || ""}
                          onChange={(e) => setEditingHotel({...editingHotel, reservationPersonContact: e.target.value})}
                        />
                      </div>
                      <div className="list-form-group full-width">
                        <label>Special Remarks:</label>
                        <textarea
                          value={editingHotel.specialRemarks || ""}
                          onChange={(e) => setEditingHotel({...editingHotel, specialRemarks: e.target.value})}
                        />
                      </div>
                      <div className="list-form-group full-width">
                        <label>Facilities (comma separated):</label>
                        <input
                          value={editingHotel.facilitiesAvailable?.join(", ") || ""}
                          onChange={(e) => setEditingHotel({
                            ...editingHotel, 
                            facilitiesAvailable: e.target.value.split(",").map(f => f.trim())
                          })}
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button 
                        className="save-btn"
                        onClick={() => saveHotel(editingHotel)}
                      >
                        Save Changes
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={() => setEditingHotel(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={currentPage === page ? 'active' : ''}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HotelSalesList;
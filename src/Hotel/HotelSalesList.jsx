import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HotelSalesList.css";

const HotelSalesList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHotel, setEditingHotel] = useState(null);
  const [expandedHotel, setExpandedHotel] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
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

  // Filter hotels based on search and filters
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCountry = filterCountry ? hotel.country === filterCountry : true;
    const matchesCity = filterCity ? hotel.city === filterCity : true;
    
    return matchesSearch && matchesCountry && matchesCity;
  });

  // Get unique countries and cities for filters
  const countries = [...new Set(hotels.map(hotel => hotel.country).filter(Boolean))];
  const cities = [...new Set(hotels.map(hotel => hotel.city).filter(Boolean))];

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
          
          <button 
            className="clear-filters"
            onClick={() => {
              setFilterCountry("");
              setFilterCity("");
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
        <div className="hotels-container">
          {filteredHotels.map((hotel) => (
            <div key={hotel.id} className="hotel-card">
              <div className="hotel-header">
                <h3>{hotel.hotelName}</h3>
                <div className="hotel-location">
                  <span className="city">{hotel.city}</span>, 
                  <span className="country"> {hotel.country}</span>
                </div>
              </div>
              
              <div className="hotel-contacts">
                <div className="contact-item">
                  <strong>Sales:</strong> {hotel.salesPersonName} ({hotel.salesPersonEmail})
                </div>
                <div className="contact-item">
                  <strong>Reservation:</strong> {hotel.reservationPersonName}
                </div>
              </div>
              
              <div className="hotel-actions">
                <button 
                  className="view-details-btn"
                  onClick={() => setExpandedHotel(expandedHotel === hotel.id ? null : hotel.id)}
                >
                  {expandedHotel === hotel.id ? "Hide Details" : "View Details"}
                </button>
                
                <div className="action-buttons">
                  <button 
                    className="edit-btn"
                    onClick={() => setEditingHotel(editingHotel?.id === hotel.id ? null : hotel)}
                  >
                    {editingHotel?.id === hotel.id ? "Cancel Edit" : "✏️ Edit"}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteHotel(hotel.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
              
              {/* Expanded Details View */}
              {expandedHotel === hotel.id && (
                <div className="hotel-details">
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
                      <label>Sales Contact:</label>
                      <span>{hotel.salesPersonContact}</span>
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
                <div className="edit-form">
                  <h4>Edit Hotel</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Hotel Name:</label>
                      <input
                        value={editingHotel.hotelName || ""}
                        onChange={(e) => setEditingHotel({...editingHotel, hotelName: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Country:</label>
                      <input
                        value={editingHotel.country || ""}
                        onChange={(e) => setEditingHotel({...editingHotel, country: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>City:</label>
                      <input
                        value={editingHotel.city || ""}
                        onChange={(e) => setEditingHotel({...editingHotel, city: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Address:</label>
                      <input
                        value={editingHotel.address || ""}
                        onChange={(e) => setEditingHotel({...editingHotel, address: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Number:</label>
                      <input
                        value={editingHotel.hotelContactNumber || ""}
                        onChange={(e) => setEditingHotel({...editingHotel, hotelContactNumber: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Sales Person:</label>
                      <input
                        value={editingHotel.salesPersonName || ""}
                        onChange={(e) => setEditingHotel({...editingHotel, salesPersonName: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Sales Email:</label>
                      <input
                        value={editingHotel.salesPersonEmail || ""}
                        onChange={(e) => setEditingHotel({...editingHotel, salesPersonEmail: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Sales Contact:</label>
                      <input
                        value={editingHotel.salesPersonContact || ""}
                        onChange={(e) => setEditingHotel({...editingHotel, salesPersonContact: e.target.value})}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Special Remarks:</label>
                      <textarea
                        value={editingHotel.specialRemarks || ""}
                        onChange={(e) => setEditingHotel({...editingHotel, specialRemarks: e.target.value})}
                      />
                    </div>
                    <div className="form-group full-width">
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
                      💾 Save Changes
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => setEditingHotel(null)}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HotelSalesList;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const HotelSalesList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHotel, setEditingHotel] = useState(null);
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

  if (loading) return <p>Loading hotels...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Hotel Sales List</h2>

      {/* Back to Form Button */}
      <button 
        onClick={() => navigate("/")} 
        style={{ marginBottom: "20px" }}
      >
        ← Back to Form
      </button>

      {hotels.length === 0 ? (
        <p>No hotels found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Id</th>
                <th>Country</th>
                <th>CountryCode</th>
                <th>City</th>
                <th>HotelName</th>
                <th>HotelContactNumber</th>
                <th>Address</th>
                <th>SalesPersonName</th>
                <th>SalesPersonEmail</th>
                <th>SalesPersonContact</th>
                <th>ReservationPersonName</th>
                <th>ReservationPersonEmail</th>
                <th>ReservationPersonContact</th>
                <th>AccountsPersonName</th>
                <th>AccountsPersonEmail</th>
                <th>AccountsPersonContact</th>
                <th>ReceptionPersonName</th>
                <th>ReceptionPersonEmail</th>
                <th>ReceptionPersonContact</th>
                <th>ConciergeName</th>
                <th>ConciergeEmail</th>
                <th>ConciergeContact</th>
                <th>SpecialRemarks</th>
                <th>FacilitiesAvailable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((hotel) =>
                editingHotel?.id === hotel.id ? (
                  <tr key={hotel.id}>
                    {Object.keys(hotel).map((key) => (
                      key === "id" ? (
                        <td key={key}>{hotel[key]}</td>
                      ) : key === "facilitiesAvailable" ? (
                        <td key={key}>
                          <input
                            type="text"
                            value={editingHotel[key]?.join(", ") || ""}
                            onChange={(e) =>
                              setEditingHotel({
                                ...editingHotel,
                                [key]: e.target.value.split(",").map(f => f.trim())
                              })
                            }
                          />
                        </td>
                      ) : (
                        <td key={key}>
                          <input
                            type="text"
                            value={editingHotel[key] || ""}
                            onChange={(e) =>
                              setEditingHotel({ ...editingHotel, [key]: e.target.value })
                            }
                          />
                        </td>
                      )
                    ))}
                    <td>
                      <button onClick={() => saveHotel(editingHotel)}>💾 Save</button>
                      <button onClick={() => setEditingHotel(null)}>❌ Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={hotel.id}>
                    {Object.keys(hotel).map((key) => (
                      <td key={key}>
                        {key === "facilitiesAvailable"
                          ? hotel[key]?.join(", ")
                          : hotel[key]}
                      </td>
                    ))}
                    <td>
                      <button onClick={() => setEditingHotel(hotel)}>✏️ Edit</button>
                      <button onClick={() => deleteHotel(hotel.id)}>🗑 Delete</button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HotelSalesList;

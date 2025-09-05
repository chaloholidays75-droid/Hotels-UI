import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHotelSaleById } from "../api"; // ✅ API call

const HotelSalesDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const data = await getHotelSaleById(id);
        setHotel(data);
      } catch (err) {
        console.error("Error fetching hotel details:", err);
      }
      setLoading(false);
    };

    fetchHotel();
  }, [id]);

  if (loading) return <p>Loading hotel details...</p>;
  if (!hotel) return <p>Hotel not found</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Hotel Details</h2>
      <p><strong>ID:</strong> {hotel.id}</p>
      <p><strong>Hotel Name:</strong> {hotel.hotelName}</p>
      <p><strong>City:</strong> {hotel.city}</p>
      <p><strong>Country:</strong> {hotel.country}</p>
      <p><strong>Credit Category:</strong> {hotel.creditCategory}</p>

      <br />
      <button onClick={() => navigate("/hotels")}>⬅ Back to List</button>
    </div>
  );
};

export default HotelSalesDetails;

import api from "./api"; // axios instance with interceptors

const bookingApi = {
  // --------------------------
  // 📘 Booking Endpoints
  // --------------------------

  // Get all bookings
  getBookings: async () => {
    const res = await api.get("/Booking");
    return res.data;
  },

  // Get single booking with rooms
  getBookingById: async (id) => {
    const res = await api.get(`/Booking/${id}`);
    return res.data;
  },

  // Create booking with nested rooms
// ✅ FIXED createBooking (no invalid fields)
createBooking: async (data) => {
  const payload = {
    agencyId: data.agencyId,
    supplierId: data.supplierId,
    hotelId: data.hotelId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    specialRequest: data.specialRequest || "",
    bookingRooms: (data.bookingRooms || []).map(r => ({
      roomTypeId: r.roomTypeId,
      adults: r.adults,
      children: r.children,
      childrenAges: Array.isArray(r.childrenAges) ? r.childrenAges : []
    }))
  };
  const res = await api.post("/Booking", payload);
  return res.data;
},


// ✅ Correct Update Booking API
updateBooking: async (id, data) => {
  // Auto calculate
  const numberOfRooms = data.bookingRooms?.length || 0;
  const numberOfPeople =
    data.bookingRooms?.reduce(
      (sum, r) => sum + (Number(r.adults) || 0) + (Number(r.children) || 0),
      0
    ) || 0;

  // Build payload
  const payload = {
    agencyId: data.agencyId,
    supplierId: data.supplierId,
    hotelId: data.hotelId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    status: data.status || "Pending",
    specialRequest: data.specialRequest || "",
    numberOfRooms,
    numberOfPeople,
    bookingRooms: (data.bookingRooms || []).map((r) => ({
      roomTypeId: r.roomTypeId,
      adults: r.adults,
      children: r.children,
      childrenAges: r.childrenAges || [] // ✅ send array
    }))
  };

  // Send request
  const res = await api.put(`/Booking/${id}`, payload);
  return res.data;
},

  // Delete booking
  deleteBooking: async (id) => {
    const res = await api.delete(`/Booking/${id}`);
    return res.data;
  },

  // Search bookings by hotel/city
  searchBookings: async (query) => {
    if (!query || query.length < 2) return [];
    const res = await api.get("/Booking/search", { params: { query } });
    return res.data;
  },

  // Hotel autocomplete
  searchHotels: async (query) => {
    if (!query || query.length < 2) return [];
    const res = await api.get("/Booking/hotels-autocomplete", {
      params: { query },
    });
    return (res.data || []).map((h) => ({
      id: h.id,
      hotelName: h.hotelName,
      cityName: h.cityName,
      countryName: h.countryName,
    }));
  },

  // --------------------------
  // 🏨 BookType (Room & RoomType Management)
  // --------------------------

  // Get booking rooms by bookingId
  getBookingRooms: async (bookingId) => {
    const res = await api.get(`/booktype/rooms/${bookingId}`);
    return res.data;
  },

  // Create a new booking room
  createBookingRoom: async (data) => {
    const res = await api.post(`/booktype/room`, data);
    return res.data;
  },

  // Update existing booking room
  updateBookingRoom: async (id, data) => {
    const res = await api.put(`/booktype/room/${id}`, data);
    return res.data;
  },

  // Delete booking room
  deleteBookingRoom: async (id) => {
    const res = await api.delete(`/booktype/room/${id}`);
    return res.data;
  },

  // Get all room types for a hotel
  getRoomTypesByHotel: async (hotelId) => {
    const res = await api.get(`/booktype/roomtypes/${hotelId}`);
    return res.data;
  },

  // Create a new room type
  createRoomType: async (data) => {
    const res = await api.post(`/booktype/roomtype`, data);
    return res.data;
  },

  // Update a room type
  updateRoomType: async (id, data) => {
    const res = await api.put(`/booktype/roomtype/${id}`, data);
    return res.data;
  },

  // Delete a room type
  deleteRoomType: async (id) => {
    const res = await api.delete(`/booktype/roomtype/${id}`);
    return res.data;
  },

  // Autocomplete room types
  autocompleteRoomTypes: async (hotelId, query) => {
    const res = await api.get(`/booktype/roomtypes/autocomplete`, {
      params: { hotelId, query },
    });
    return res.data;
  },
};

export default bookingApi;

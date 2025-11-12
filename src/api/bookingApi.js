// src/api/bookingApi.js
import api from "./apiInstance"; // preconfigured axios instance

const bookingApi = {
  // --------------------------
  // 📘 Booking Endpoints
  // --------------------------

  // Get all bookings
  getBookings: async () => {
    const res = await api.get("/Booking");
    return res.data;
  },

  // Get single booking
  getBookingById: async (id) => {
    const res = await api.get(`/Booking/${id}`);
    return res.data;
  },

// Create booking with rooms
createBooking: async (data) => {
  const payload = {
    agencyId: data.agencyId,
    agencyStaffId: data.agencyStaffId || null,
    supplierId: data.supplierId,
    hotelId: data.hotelId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    status: data.status || "Confirmed", // ✅ always Confirmed by default
    deadline: data.deadline || null,
    specialRequest: data.specialRequest || "",
    bookingRooms: (data.bookingRooms || []).map((r) => ({
      roomTypeId: r.roomTypeId,
      adults: r.adults,
      children: r.children,
      childrenAges: Array.isArray(r.childrenAges) ? r.childrenAges : [],
      inclusion: r.inclusion || "",
      leadGuestName: r.leadGuestName || "",    // ✅ lead guest name    
      guestNames: r.guestNames || [],              // ✅ list of other guests
    })),
  };

  const res = await api.post("/Booking", payload);
  return res.data;
},

 updateBooking: async (id, data) => {
  const numberOfRooms = data.bookingRooms?.length || 0;
  const numberOfPeople =
    data.bookingRooms?.reduce(
      (sum, r) => sum + (Number(r.adults) || 0) + (Number(r.children) || 0),
      0
    ) || 0;

  const payload = {
    agencyId: data.agencyId,
    supplierId: data.supplierId,
    hotelId: data.hotelId,
    checkIn: data.checkIn,
    checkOut: data.checkOut,
    status: data.status || "Confirmed",
    deadline: data.deadline || null,
    specialRequest: data.specialRequest || "",
    numberOfRooms,
    numberOfPeople,
    bookingRooms: (data.bookingRooms || []).map((r) => ({
      roomTypeId: r.roomTypeId,
      adults: r.adults,
      children: r.children,
      childrenAges: Array.isArray(r.childrenAges) ? r.childrenAges : [],
      inclusion: r.inclusion || "",
      leadGuestName: r.leadGuestName || "",
      guestNames: Array.isArray(r.guestNames) ? r.guestNames : [],
    })),
  };

  const res = await api.put(`/Booking/${id}`, payload);
  return res.data;
},

  // Delete booking
  deleteBooking: async (id) => {
    const res = await api.delete(`/Booking/${id}`);
    return res.data;
  },

  // Search bookings
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
  // 🏨 BookType (Room management)
  // --------------------------

  getBookingRooms: async (bookingId) => {
    const res = await api.get(`/booktype/rooms/${bookingId}`);
    return res.data;
  },

  createBookingRoom: async (data) => {
    const res = await api.post(`/booktype/room`, data);
    return res.data;
  },

  updateBookingRoom: async (id, data) => {
    const res = await api.put(`/booktype/room/${id}`, data);
    return res.data;
  },

  deleteBookingRoom: async (id) => {
    const res = await api.delete(`/booktype/room/${id}`);
    return res.data;
  },

  getRoomTypesByHotel: async (hotelId) => {
    const res = await api.get(`/booktype/roomtypes/${hotelId}`);
    return res.data;
  },

  createRoomType: async (data) => {
    const res = await api.post(`/booktype/roomtype`, data);
    return res.data;
  },

  updateRoomType: async (id, data) => {
    const res = await api.put(`/booktype/roomtype/${id}`, data);
    return res.data;
  },

  deleteRoomType: async (id) => {
    const res = await api.delete(`/booktype/roomtype/${id}`);
    return res.data;
  },

  autocompleteRoomTypes: async (hotelId, query) => {
    const res = await api.get(`/booktype/roomtypes/autocomplete`, {
      params: { hotelId, query },
    });
    return res.data;
  },

  // --------------------------
  // 🔄 Booking Status + Reminder
  // --------------------------

  // Update only booking status (used by dropdown)
 updateBookingStatus: async (id, payload) => {
  const { data } = await api.patch(`/booking/${id}/status`, payload);
  return data;
},


  // Get bookings still not reconfirmed (for staff reminder)
  getPendingReconfirmations: async () => {
    const { data } = await api.get(`/booking/pending-reconfirmations`);
    return data;
  },
};

export default bookingApi;

import api from './api'; // axios instance with interceptors

const bookingApi = {
  // Get all bookings
  getBookings: async () => {
    const res = await api.get('/Booking');
    return res.data;
  },

  // Get booking by ID
  getBookingById: async (id) => {
    const res = await api.get(`/Booking/${id}`);
    return res.data;
  },

  // Create a new booking
  createBooking: async (data) => {
    const res = await api.post('/Booking', data);
    return res.data;
  },

  // Update an existing booking
  updateBooking: async (id, data) => {
    const res = await api.put(`/Booking/${id}`, data);
    return res.data;
  },

  // Delete a booking
  deleteBooking: async (id) => {
    const res = await api.delete(`/Booking/${id}`);
    return res.data;
  },

  // Search hotels (autocomplete)
  searchHotels: async (query) => {
    if (!query || query.length < 2) return [];
    const res = await api.get('/Booking/hotels-autocomplete', { params: { query } });
    return (res.data || []).map(h => ({
      id: h.id || null,
      hotelName: h.hotelName || "",
      cityName: h.CityName || "",
      countryName: h.CountryName || ""
    }));
  }
};

export default bookingApi;

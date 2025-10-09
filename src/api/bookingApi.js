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
  searchHotels: async (query, config = {}) => {
    if (!query || query.length < 2) return [];
    const res = await api.get('/Booking/hotels-autocomplete', {
      params: { query },
      ...config,
    });
    return (res.data || []).map((hotel) => ({
      id: hotel.id ?? null,
      hotelName: hotel.hotelName ?? "",
      cityName: hotel.cityName ?? hotel.CityName ?? "",
      countryName: hotel.countryName ?? hotel.CountryName ?? "",
    }));
  },

  // Retrieve room types for a hotel
  getRoomTypesForHotel: async (hotelId) => {
    if (!hotelId) return [];
    const res = await api.get(`/booktype/roomtypes/${hotelId}`);
    return res.data;
  }
};

export default bookingApi;

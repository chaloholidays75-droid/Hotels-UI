// src/api/commercialApi.js
import api from "./api"; // your pre-configured axios instance with interceptors

// -----------------------------
// CREATE Commercial
// -----------------------------
export const createCommercial = async (data) => {
  const res = await api.post("/commercial", data);
  return res.data;
};

// -----------------------------
// GET ALL (with pagination)
// -----------------------------
export const getAllCommercials = async (page = 1, pageSize = 20) => {
  const res = await api.get(`/commercial?page=${page}&pageSize=${pageSize}`);
  return res.data;
};

// -----------------------------
// GET by Id
// -----------------------------
export const getCommercialById = async (id) => {
  const res = await api.get(`/commercial/${id}`);
  return res.data;
};

// -----------------------------
// GET by BookingId
// -----------------------------
export const getCommercialByBooking = async (bookingId) => {
  const res = await api.get(`/commercial/by-booking/${bookingId}`);
  return res.data;
};

// -----------------------------
// UPDATE
// -----------------------------
export const updateCommercial = async (id, data) => {
  const res = await api.put(`/commercial/${id}`, data);
  return res.data;
};

// -----------------------------
// DELETE
// -----------------------------
export const deleteCommercial = async (id) => {
  const res = await api.delete(`/commercial/${id}`);
  return res.data;
};

// -----------------------------
// SEARCH (TicketNumber, Hotel, Agency)
// -----------------------------
export const searchCommercials = async (query) => {
  const res = await api.get(`/commercial/search?query=${encodeURIComponent(query)}`);
  return res.data;
};

// -----------------------------
// BOOKINGS DROPDOWN
// -----------------------------
export const getBookingsDropdown = async () => {
  const res = await api.get("/commercial/bookings-dropdown");
  return res.data;
};

// -----------------------------
// SUMMARY STATS (for dashboard)
// -----------------------------
export const getCommercialSummary = async () => {
  const res = await api.get("/commercial/summary");
  return res.data;
};

// -----------------------------
// LINK EXISTING COMMERCIAL TO BOOKING
// -----------------------------
export const linkCommercialToBooking = async (bookingId, commercialId) => {
  const res = await api.put(`/commercial/link/${bookingId}/${commercialId}`);
  return res.data;
};



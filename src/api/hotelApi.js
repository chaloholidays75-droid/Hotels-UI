import api from './api';

// Get all hotels
export async function getHotelSales() {
  try {
    const res = await api.get('/hotels');
    return res.data;
  } catch (error) {
    console.error('Failed to fetch hotels:', error.response?.status, error.message);
    throw error;
  }
}

// Get hotel by ID
export async function getHotelSaleById(id) {
  try {
    const res = await api.get(`/hotels/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch hotel ${id}:`, error.response?.status, error.message);
    throw error;
  }
}

// Create hotel
export async function createHotelSale(data) {
  try {
    const res = await api.post('/hotels', data);
    return res.data;
  } catch (error) {
    console.error('Failed to create hotel:', error.response?.data || error.message);
    throw error;
  }
}

// Update hotel
export async function updateHotelSale(id, data) {
  try {
    const res = await api.put(`/hotels/${id}`, data);
    return res.data;
  } catch (error) {
    console.error(`Failed to update hotel ${id}:`, error.response?.data || error.message);
    throw error;
  }
}

// Delete hotel
export async function deleteHotelSale(id) {
  try {
    await api.delete(`/hotels/${id}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete hotel ${id}:`, error.response?.data || error.message);
    throw error;
  }
}

// Toggle hotel status
export async function toggleHotelStatus(id, isActive) {
  try {
    const res = await api.put(`/hotels/${id}/status`, { isActive });
    return res.data;
  } catch (error) {
    console.error(`Failed to toggle hotel ${id} status:`, error.response?.data || error.message);
    throw error;
  }
}

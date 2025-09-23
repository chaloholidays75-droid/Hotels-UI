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

    // If backend responds with no content, axios will have res.data as empty
    if (!res.data || Object.keys(res.data).length === 0) {
      return null; // success, but no data returned
    }

    return res.data;
  } catch (error) {
    let message = "Failed to create hotel";

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }

    console.error(message);
    throw new Error(message);
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
// Get all countries
export async function getCountries() {
  try {
    const res = await api.get('/countries');
    return res.data;
  } catch (error) {
    console.error('Failed to fetch countries:', error.response?.status, error.message);
    throw error;
  }
}

// Get cities by country ID
export async function getCitiesByCountry(countryId) {
  try {
    const res = await api.get(`/cities/by-country/${countryId}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch cities for country ${countryId}:`, error.response?.status, error.message);
    throw error;
  }
}
// Get all Hotels by city ID and country ID
export async function getHotelsByCityAndCountry(countryId, cityId) {
  try { 
    const res = await api.get(`/hotels/by-location`, { params: { countryId, cityId } });
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch hotels for country ${countryId} and city ${cityId}:`, error.response?.status, error.message);
    throw error;
  } 
}
export default api;

import api from './api';

// Get all agencies
export async function getAgencies() {
  try {
    const res = await api.get('/agency');
    return res.data;
  } catch (error) {
    console.error('Failed to fetch agencies:', error.response?.status, error.message);
    throw error;
  }
}

// Toggle agency status
export async function toggleAgencyStatus(id, isActive) {
  try {
    const res = await api.patch(`/agency/${id}/status`, { isActive });
    return res.data;
  } catch (error) {
    console.error(`Failed to update agency ${id} status:`, error.response?.status, error.message);
    throw error;
  }
}

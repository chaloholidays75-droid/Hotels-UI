// agencyApi.js
import { tr } from 'date-fns/locale';
import api from './apiInstance';

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
// ✅ Get only active agencies
export async function getActiveAgencies() {
  try {
    const res = await api.get('/agency/active');
    console.log('✅ Active agencies fetched:', res.data.length);
    return res.data;
  } catch (error) {
    console.error('❌ Failed to fetch active agencies:', error.response?.data || error.message);
    throw error;
  }
}

// Get agency by ID
export async function getAgencyById(id) {
  try {
    const res = await api.get(`/agency/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to fetch agency ${id}:`, error.response?.status, error.message);
    throw error;
  }
}

// Create agency
export async function createAgency(data) {
  try {
    const res = await api.post('/agency', data);
    return res.data;
  } catch (error) {
    console.error('Failed to create agency:', error.response?.data || error.message);
    throw error;
  }
}

// Update agency
export async function updateAgency(id, data) {
  try {
    await api.put(`/agency/${id}`, data);
    return true;
  } catch (error) {
    console.error(`Failed to update agency ${id}:`, error.response?.data || error.message);
    throw error;
  }
}

// Delete agency (soft delete)
export async function deleteAgency(id) {
  try {
    await api.delete(`/agency/${id}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete agency ${id}:`, error.response?.data || error.message);
    throw error;
  }
}

// Update agency status (activate/deactivate)
export async function updateAgencyStatus(id, isActive) {
  try {
    const res = await api.patch(`/agency/${id}/status`, { isActive });
    return res.data;
  } catch (error) {
    console.error(`Failed to update status for agency ${id}:`, error.response?.data || error.message);
    throw error;
  }
}

// Check if username exists
export async function checkUsernameExists(username) {
  try {
    const res = await api.get(`/agency/check-username?username=${encodeURIComponent(username)}`);
    return res.data.exists;
  } catch (error) {
    console.error('Failed to check username:', error.response?.data || error.message);
    throw error;
  }
}

// Check if email exists
export async function checkEmailExists(email) {
  try {
    const res = await api.get(`/agency/check-email?email=${encodeURIComponent(email)}`);
    return res.data.exists;
  } catch (error) {
    console.error('Failed to check email:', error.response?.data || error.message);
    throw error;
  }
}
export async function getAgencyStaffByAgency(agencyId) {
  try {
  const res = await api.get(`/agencyStaff/agency/${agencyId}`);
  return res.data;
  } catch (error) {
    console.error('Failed to fetch agency staff:', error.response?.data || error.message);
    throw error;
  }

}


const agencyApi = {
  getAgencies,
  getAgencyById,
  getActiveAgencies,
  createAgency,
  updateAgency,
  deleteAgency,
  updateAgencyStatus,
  checkUsernameExists,
  checkEmailExists,
  getAgencyStaffByAgency,
};

export default agencyApi;


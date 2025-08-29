const API_BASE_HOTEL = "https://hotels-8v0p.onrender.com/api/hotels";

// ✅ Get all hotel sales
export async function getHotelSales() {
  const response = await fetch(API_BASE_HOTEL);
  if (!response.ok) throw new Error("Failed to fetch hotel sales");
  return response.json();
}

// ✅ Get by Id
export async function getHotelSaleById(id) {
  const response = await fetch(`${API_BASE_HOTEL}/${id}`);
  if (!response.ok) throw new Error("Failed to fetch hotel sale");
  return response.json();
}

// ✅ Create new
export async function createHotelSale(data) {
  const response = await fetch(API_BASE_HOTEL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Failed to create hotel sale: " + errorText);
  }

  return response.json();
}

// ✅ Update
export async function updateHotelSale(id, data) {
  const response = await fetch(`${API_BASE_HOTEL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Failed to update hotel sale: " + errorText);
  }

  return response.json();
}

// ✅ Delete
export async function deleteHotelSale(id) {
  const response = await fetch(`${API_BASE_HOTEL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Failed to delete hotel sale");
  return true;
}
const API_BASE_COUNTRIES = "https://hotels-8v0p.onrender.com/api";

// Utility function for fetch with error handling
async function safeFetch(url) {
  try {
    const res = await fetch(url, { method: "GET", credentials: "include" });
    
    // Check if response is okay
    if (!res.ok) {
      console.error(`Error fetching ${url}:`, res.status, res.statusText);
      return null; // Return null instead of throwing
    }

    // Try parsing JSON
    const data = await res.json().catch(() => null); // Return null if empty or invalid JSON
    if (!data) {
      console.warn(`No data returned from ${url}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    return null;
  }
}

// Stats
export async function getStats() {
  return await safeFetch(`${API_BASE_COUNTRIES}/stats`);
}

// Countries
export async function getCountries() {
  return await safeFetch(`${API_BASE_COUNTRIES}/countries`);
}

// Hotels by City
export async function getHotelsByCity(cityId) {
  if (!cityId) return null; // Safety check
  return await safeFetch(`${API_BASE_COUNTRIES}/hotels/by-city/${cityId}`);
}

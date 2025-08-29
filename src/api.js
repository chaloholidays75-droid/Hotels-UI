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
export async function getStats() {
  const res = await fetch(`${API_BASE_COUNTRIES}/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// Countries + Cities
export async function getCountries() {
  const res = await fetch(`${API_BASE_COUNTRIES}/countries`);
  if (!res.ok) throw new Error("Failed to fetch countries");
  return res.json();
}

// Hotels by City
export async function getHotelsByCity(cityId) {
  const res = await fetch(`${API_BASE_COUNTRIES}/hotels/by-city/${cityId}`);
  if (!res.ok) throw new Error("Failed to fetch hotels");
  return res.json();
}

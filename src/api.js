const API_BASE = "https://hotels-8v0p.onrender.com/api/hotelsales";

// ✅ Get all hotel sales
export async function getHotelSales() {
  const response = await fetch(API_BASE);
  if (!response.ok) throw new Error("Failed to fetch hotel sales");
  return response.json();
}

// ✅ Get by Id
export async function getHotelSaleById(id) {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) throw new Error("Failed to fetch hotel sale");
  return response.json();
}

// ✅ Create new
export async function createHotelSale(data) {
  const response = await fetch(API_BASE, {
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
  const response = await fetch(`${API_BASE}/${id}`, {
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
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Failed to delete hotel sale");
  return true;
}

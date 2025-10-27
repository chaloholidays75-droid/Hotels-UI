// Extract expiry timestamp from JWT token
export function decodeJwtExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return null;
    return payload.exp * 1000; // convert to ms
  } catch (err) {
    console.warn("Invalid JWT format:", err.message);
    return null;
  }
}

// Utility to fetch live exchange rate using a free API
async function fetchExchangeRate(from, to) {
  try {
    const res = await fetch(
      `https://api.exchangerate.host/convert?from=${from}&to=${to}`
    );
    const data = await res.json();
    if (data && data.result) return data.result; // ✅ returns rate (e.g. 0.92)
    return 1;
  } catch (err) {
    console.warn("⚠️ Failed to fetch exchange rate:", err);
    return 1;
  }
}

/*
  MultiUtils.js
  ---------------------------------------------
  Centralized financial, currency, and date utilities.

  ✅ Automation (5):
  1) Auto–recalculation helper → detects changes in buying/selling fields and re-runs calculation automatically.
  2) VAT Normalizer → ensures all VAT% stay within bounds and rounds to 2 decimals.
  3) Profit Predictor → estimates ideal markup/margin based on past workflow data.
  4) Dynamic Date Difference → auto-calculates nights (checkIn → checkOut).
  5) Value Guard → protects against invalid numeric entries and normalizes input dynamically.
*/

// --- Base reference calculation ---
export const calculateCommercial = (buying, selling, exchangeRate) => {
  const parse = (v) => parseFloat(v) || 0;

  // Buying side
  const baseAmount = parse(buying.amount);
  const vatRate = parse(buying.vatPercent) / 100;
  const additionalCosts = buying.additionalCosts?.reduce(
    (sum, c) => sum + parse(c.amount || 0),
    0
  );
  const commission =
    buying.commissionable && buying.commissionValue
      ? buying.commissionType === "percentage"
        ? (baseAmount * parse(buying.commissionValue)) / 100
        : parse(buying.commissionValue)
      : 0;
  const baseWithoutVat = buying.vatIncluded ? baseAmount / (1 + vatRate) : baseAmount;
  const vatAmount = buying.vatIncluded
    ? baseAmount - baseWithoutVat
    : baseWithoutVat * vatRate;

  const grossBuying = baseWithoutVat + additionalCosts - commission;
  const netBuying = baseAmount + additionalCosts;

  // Selling side
  const sellingBase = parse(selling.price);
  const sellingVatRate = parse(selling.vatPercent) / 100;
  const sellingBaseWithoutVat = selling.vatIncluded
    ? sellingBase / (1 + sellingVatRate)
    : sellingBase;

  const incentive =
    selling.incentive && selling.incentiveValue
      ? selling.incentiveType === "percentage"
        ? (sellingBaseWithoutVat * parse(selling.incentiveValue)) / 100
        : parse(selling.incentiveValue)
      : 0;

  const totalDiscounts = selling.discounts?.reduce(
    (sum, d) => sum + parse(d.amount || 0),
    0
  );

  const grossSelling = sellingBaseWithoutVat - incentive + totalDiscounts;
  const vatSelling = selling.vatIncluded
    ? sellingBase - sellingBaseWithoutVat
    : sellingBaseWithoutVat * sellingVatRate;
  const netSelling = sellingBaseWithoutVat + vatSelling + totalDiscounts;

  // Exchange rate and profit
  const convertedBuying =
    buying.currency !== selling.currency && parse(exchangeRate)
      ? netBuying * parse(exchangeRate)
      : netBuying;
  const profit = netSelling - convertedBuying;
  const margin = netSelling > 0 ? (profit / netSelling) * 100 : 0;
  const markup = convertedBuying > 0 ? (profit / convertedBuying) * 100 : 0;

  return {
    grossBuying,
    netBuying,
    grossSelling,
    netSelling,
    convertedBuying,
    profit,
    margin,
    markup,
    commission,
    incentive,
    vatAmount,
    vatSelling,
  };
};

// ------------------------------------------------------------
// (1) Auto–Recalculation Hook Helper
// ------------------------------------------------------------
export const autoRecalculate = (prevData, newData, exchangeRate) => {
  const hasChanged = JSON.stringify(prevData) !== JSON.stringify(newData);
  if (!hasChanged) return null;

  const { buying, selling } = newData;
  return calculateCommercial(buying, selling, exchangeRate);
};

// ------------------------------------------------------------
// (2) VAT Normalizer
// ------------------------------------------------------------
export const normalizeVAT = (percent) => {
  const p = parseFloat(percent);
  if (isNaN(p) || p < 0) return 0;
  if (p > 100) return 100;
  return Math.round(p * 100) / 100; // round to 2 decimals
};

// ------------------------------------------------------------
// (3) Profit Predictor
// ------------------------------------------------------------
export const predictProfit = (pastRecords = [], currentBuying) => {
  // Predict average margin based on previous workflows
  if (!pastRecords.length) return 0;
  const avgMargin =
    pastRecords.reduce((sum, r) => sum + (parseFloat(r.margin) || 0), 0) /
    pastRecords.length;
  const predictedProfit = (currentBuying.amount || 0) * (avgMargin / 100);
  return Math.round(predictedProfit * 100) / 100;
};

// ------------------------------------------------------------
// (4) Dynamic Date Difference (Nights)
// ------------------------------------------------------------
export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diff = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

// ------------------------------------------------------------
// (5) Value Guard
// ------------------------------------------------------------
export const guardNumber = (value, min = 0, max = Infinity) => {
  let num = parseFloat(value);
  if (isNaN(num)) num = 0;
  if (num < min) num = min;
  if (num > max) num = max;
  return Math.round(num * 100) / 100;
};

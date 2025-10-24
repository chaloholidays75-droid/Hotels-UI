// --- /src/utils/commercialCalculations.js ---
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

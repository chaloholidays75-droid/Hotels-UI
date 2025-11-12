import React, { useEffect, useMemo, useState } from "react";

export default function CommercialEditSection({ booking, onChange }) {
  const [buying, setBuying] = useState({ currency: "USD", amount: 0, vat: 0 });
  const [selling, setSelling] = useState({ currency: "USD", price: 0, vat: 0 });

  const profit = useMemo(() => {
    const buy = Number(buying.amount) || 0;
    const sell = Number(selling.price) || 0;
    return {
      value: sell - buy,
      margin: buy > 0 ? ((sell - buy) / buy) * 100 : 0,
    };
  }, [buying, selling]);

  useEffect(() => {
    onChange({
      buyingCurrency: buying.currency,
      buyingAmount: buying.amount,
      sellingCurrency: selling.currency,
      sellingPrice: selling.price,
      profitMarginPercent: profit.margin,
    });
  }, [buying, selling, profit]);

  const currencies = ["USD", "EUR", "GBP"];

  return (
    <section className="card">
      <h3>Commercial Details</h3>
      <div className="row-2">
        <div className="input-block">
          <label>Buying Currency</label>
          <select value={buying.currency} onChange={e => setBuying({ ...buying, currency: e.target.value })}>
            {currencies.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="input-block">
          <label>Buying Amount</label>
          <input type="number" value={buying.amount} onChange={e => setBuying({ ...buying, amount: e.target.value })}/>
        </div>
      </div>
      <div className="row-2">
        <div className="input-block">
          <label>Selling Currency</label>
          <select value={selling.currency} onChange={e => setSelling({ ...selling, currency: e.target.value })}>
            {currencies.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="input-block">
          <label>Selling Price</label>
          <input type="number" value={selling.price} onChange={e => setSelling({ ...selling, price: e.target.value })}/>
        </div>
      </div>
      <div className="profit-grid">
        <div className={`profit-card ${profit.value >= 0 ? "good" : "bad"}`}>
          <div className="label">Profit Value</div>
          <div className="value">{profit.value.toFixed(2)}</div>
        </div>
        <div className="profit-card info">
          <div className="label">Profit %</div>
          <div className="value">{profit.margin.toFixed(2)}%</div>
        </div>
      </div>
    </section>
  );
}

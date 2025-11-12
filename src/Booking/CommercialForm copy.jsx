// import React, { useState, useEffect } from "react";
// import "./CommercialTicketForm.css";

// export default function CommercialForm() {
//   const [buying, setBuying] = useState({
//     currency: "USD",
//     amount: "",
//     commissionable: false,
//     commissionType: "percentage",
//     commissionValue: "",
//     vatIncluded: false,
//     vatPercent: "18",
//     additionalCosts: [{
//       id: 1,
//       description: "",
//       amount: "",
//       type: "fixed"
//     }]
//   });

//   const [selling, setSelling] = useState({
//     currency: "USD",
//     price: "",
//     incentive: false,
//     incentiveType: "percentage",
//     incentiveValue: "",
//     vatIncluded: false,
//     vatPercent: "18",
//     discounts: [{
//       id: 1,
//       description: "",
//       amount: "",
//       type: "fixed"
//     }]
//   });

//   const [exchangeRate, setExchangeRate] = useState("");
//   const [autoCalculateRate, setAutoCalculateRate] = useState(false);

//   const currencies = [
//     { code: "USD", name: "US Dollar", symbol: "$" },
//     { code: "EUR", name: "Euro", symbol: "€" },
//     { code: "GBP", name: "British Pound", symbol: "£" },
//     { code: "JPY", name: "Japanese Yen", symbol: "¥" },
//     { code: "INR", name: "Indian Rupee", symbol: "₹" },
//     { code: "CAD", name: "Canadian Dollar", symbol: "C$" }
//   ];

//   // Auto-fetch exchange rate (mock implementation)
//   useEffect(() => {
//     if (autoCalculateRate && buying.currency && selling.currency && buying.currency !== selling.currency) {
//       const mockRates = {
//         "USD-EUR": 0.85,
//         "USD-GBP": 0.73,
//         "EUR-USD": 1.18,
//         "GBP-USD": 1.37
//       };
//       const rateKey = `${buying.currency}-${selling.currency}`;
//       setExchangeRate(mockRates[rateKey] || "1.0");
//     }
//   }, [autoCalculateRate, buying.currency, selling.currency]);

//   const handleBuyingChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setBuying(prev => ({ 
//       ...prev, 
//       [name]: type === "checkbox" ? checked : value 
//     }));
//   };

//   const handleSellingChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setSelling(prev => ({ 
//       ...prev, 
//       [name]: type === "checkbox" ? checked : value 
//     }));
//   };

//   const addAdditionalCost = () => {
//     setBuying(prev => ({
//       ...prev,
//       additionalCosts: [
//         ...prev.additionalCosts,
//         {
//           id: Date.now(),
//           description: "",
//           amount: "",
//           type: "fixed"
//         }
//       ]
//     }));
//   };

//   const removeAdditionalCost = (id) => {
//     setBuying(prev => ({
//       ...prev,
//       additionalCosts: prev.additionalCosts.filter(cost => cost.id !== id)
//     }));
//   };

//   const updateAdditionalCost = (id, field, value) => {
//     setBuying(prev => ({
//       ...prev,
//       additionalCosts: prev.additionalCosts.map(cost =>
//         cost.id === id ? { ...cost, [field]: value } : cost
//       )
//     }));
//   };

//   const addDiscount = () => {
//     setSelling(prev => ({
//       ...prev,
//       discounts: [
//         ...prev.discounts,
//         {
//           id: Date.now(),
//           description: "",
//           amount: "",
//           type: "fixed"
//         }
//       ]
//     }));
//   };

//   const removeDiscount = (id) => {
//     setSelling(prev => ({
//       ...prev,
//       discounts: prev.discounts.filter(discount => discount.id !== id)
//     }));
//   };

//   const updateDiscount = (id, field, value) => {
//     setSelling(prev => ({
//       ...prev,
//       discounts: prev.discounts.map(discount =>
//         discount.id === id ? { ...discount, [field]: value } : discount
//       )
//     }));
//   };

//   const calculateTotalAdditionalCosts = () => {
//     return buying.additionalCosts.reduce((total, cost) => {
//       if (cost.amount) {
//         return total + parseFloat(cost.amount);
//       }
//       return total;
//     }, 0);
//   };

//   const calculateTotalDiscounts = () => {
//     return selling.discounts.reduce((total, discount) => {
//       if (discount.amount) {
//         return total + parseFloat(discount.amount);
//       }
//       return total;
//     }, 0);
//   };

//   const calculateCommissionAmount = () => {
//     if (!buying.commissionable || !buying.commissionValue || isNaN(parseFloat(buying.commissionValue))) return 0;
    
//     const baseAmount = parseFloat(buying.amount) || 0;
//     if (buying.commissionType === "percentage") {
//       return (baseAmount * parseFloat(buying.commissionValue)) / 100;
//     } else {
//       return parseFloat(buying.commissionValue);
//     }
//   };

//   const calculateNetBuying = () => {
//     const baseAmount = parseFloat(buying.amount) || 0; // This amount INCLUDES VAT
//     const commissionAmount = calculateCommissionAmount();
//     const additionalCosts = calculateTotalAdditionalCosts();
    
//     // Start with the base amount that includes VAT
//     let totalAmountIncludingVAT = baseAmount + additionalCosts;
    
//     // Apply commission (reduces our cost)
//     let amountAfterCommission = totalAmountIncludingVAT - commissionAmount;
    
//     // Calculate VAT
//     let vatAmount = 0;
//     let netPayment = amountAfterCommission;
    
//     if (buying.vatIncluded && buying.vatPercent && !isNaN(parseFloat(buying.vatPercent))) {
//       // Extract VAT from the amount that includes VAT
//       // amountAfterCommission = BasePrice + VAT
//       const vatRate = parseFloat(buying.vatPercent) / 100;
//       const basePriceWithoutVAT = amountAfterCommission / (1 + vatRate);
//       vatAmount = amountAfterCommission - basePriceWithoutVAT;
//       netPayment = basePriceWithoutVAT;
//     }
    
//     return {
//       baseAmount, // Amount that includes VAT
//       commissionAmount,
//       additionalCosts,
//       vatAmount,
//       totalAmountIncludingVAT,
//       amountAfterCommission, // Amount after commission but still including VAT
//       netPayment // Final amount after VAT extraction
//     };
//   };

//   const calculateNetSelling = () => {
//     let net = parseFloat(selling.price) || 0;
    
//     // Incentive calculation
//     if (selling.incentive && selling.incentiveValue) {
//       if (selling.incentiveType === "percentage") {
//         net -= (net * (parseFloat(selling.incentiveValue) || 0)) / 100;
//       } else {
//         net -= parseFloat(selling.incentiveValue) || 0;
//       }
//     }

//     // VAT calculation
//     if (selling.vatIncluded && selling.vatPercent) {
//       net -= (net * (parseFloat(selling.vatPercent) || 0)) / 100;
//     }

//     // Discounts
//     net -= calculateTotalDiscounts();

//     return Math.max(0, net); // Ensure non-negative
//   };

//   const buyingCalculation = calculateNetBuying();
//   const sellingCalculation = calculateNetSelling();

//   const convertedBuying =
//     buying.currency !== selling.currency && exchangeRate
//       ? buyingCalculation.netPayment * parseFloat(exchangeRate)
//       : buyingCalculation.netPayment;

//   const profit = sellingCalculation - convertedBuying;
//   const profitMarginPercent = sellingCalculation > 0 ? (profit / sellingCalculation) * 100 : 0;

//   const getCurrencySymbol = (currencyCode) => {
//     const currency = currencies.find(c => c.code === currencyCode);
//     return currency ? currency.symbol : currencyCode;
//   };

//   return (
//     <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
//       <div style={{ 
//         background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
//         color: "white", 
//         padding: "20px", 
//         borderRadius: "10px",
//         marginBottom: "20px"
//       }}>
//         <h1 style={{ margin: 0, fontSize: "24px" }}>Commercial Calculation Form</h1>
//         <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>Calculate your profit margins with detailed cost analysis</p>
//       </div>

//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
//         {/* Buying Section */}
//         <div style={{ 
//           background: "white", 
//           border: "1px solid #e1e5e9", 
//           borderRadius: "10px", 
//           padding: "20px",
//           boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
//         }}>
//           <div style={{ 
//             background: "#f8f9fa", 
//             padding: "15px", 
//             borderRadius: "8px", 
//             marginBottom: "20px",
//             borderLeft: "4px solid #dc3545"
//           }}>
//             <h3 style={{ margin: 0, color: "#dc3545" }}>Cost Side (Buying)</h3>
//           </div>

//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
//             <div>
//               <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>
//                 Currency *
//               </label>
//               <select 
//                 name="currency" 
//                 onChange={handleBuyingChange}
//                 value={buying.currency}
//                 style={{ 
//                   width: "100%", 
//                   padding: "10px", 
//                   border: "1px solid #ddd", 
//                   borderRadius: "5px",
//                   fontSize: "14px"
//                 }}
//               >
//                 {currencies.map(currency => (
//                   <option key={currency.code} value={currency.code}>
//                     {currency.code} - {currency.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>
//                 Base Amount (including VAT) *
//               </label>
//               <div style={{ position: "relative" }}>
//                 <span style={{
//                   position: "absolute",
//                   left: "10px",
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   color: "#666"
//                 }}>
//                   {getCurrencySymbol(buying.currency)}
//                 </span>
//                 <input 
//                   name="amount" 
//                   type="number" 
//                   onChange={handleBuyingChange}
//                   placeholder="0.00"
//                   style={{ 
//                     width: "100%", 
//                     padding: "10px 10px 10px 30px", 
//                     border: "1px solid #ddd", 
//                     borderRadius: "5px",
//                     fontSize: "14px"
//                   }}
//                 />
//               </div>
//             </div>
//           </div>

//           <div style={{ marginTop: "20px" }}>
//             <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
//               <input
//                 type="checkbox"
//                 name="commissionable"
//                 onChange={handleBuyingChange}
//                 style={{ transform: "scale(1.2)" }}
//               />
//               <span style={{ fontWeight: "bold", color: "#555" }}>Include Commission</span>
//             </label>

//             {buying.commissionable && (
//               <div style={{ 
//                 background: "#f8f9fa", 
//                 padding: "15px", 
//                 borderRadius: "5px",
//                 marginBottom: "15px"
//               }}>
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//                   <div>
//                     <label style={{ display: "block", marginBottom: "5px", color: "#555" }}>Type</label>
//                     <select
//                       name="commissionType"
//                       onChange={handleBuyingChange}
//                       value={buying.commissionType}
//                       style={{ 
//                         width: "100%", 
//                         padding: "8px", 
//                         border: "1px solid #ddd", 
//                         borderRadius: "5px" 
//                       }}
//                     >
//                       <option value="percentage">Percentage (%)</option>
//                       <option value="fixed">Fixed Amount</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label style={{ display: "block", marginBottom: "5px", color: "#555" }}>Value</label>
//                     <input
//                       name="commissionValue"
//                       type="number"
//                       onChange={handleBuyingChange}
//                       placeholder={buying.commissionType === "percentage" ? "0.00%" : "0.00"}
//                       style={{ 
//                         width: "100%", 
//                         padding: "8px", 
//                         border: "1px solid #ddd", 
//                         borderRadius: "5px" 
//                       }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div style={{ marginTop: "15px" }}>
//             <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
//               <input
//                 type="checkbox"
//                 name="vatIncluded"
//                 onChange={handleBuyingChange}
//                 style={{ transform: "scale(1.2)" }}
//               />
//               <span style={{ fontWeight: "bold", color: "#555" }}>Include VAT</span>
//             </label>

//             {buying.vatIncluded && (
//               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//                 <div>
//                   <label style={{ display: "block", marginBottom: "5px", color: "#555" }}>VAT %</label>
//                   <input
//                     name="vatPercent"
//                     type="number"
//                     onChange={handleBuyingChange}
//                     value={buying.vatPercent}
//                     step="0.1"
//                     style={{ 
//                       width: "100%", 
//                       padding: "8px", 
//                       border: "1px solid #ddd", 
//                       borderRadius: "5px" 
//                     }}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Additional Costs */}
//           <div style={{ marginTop: "20px" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
//               <h4 style={{ margin: 0, color: "#555" }}>Additional Costs</h4>
//               <button
//                 type="button"
//                 onClick={addAdditionalCost}
//                 style={{
//                   background: "#28a745",
//                   color: "white",
//                   border: "none",
//                   padding: "5px 10px",
//                   borderRadius: "5px",
//                   cursor: "pointer",
//                   fontSize: "12px"
//                 }}
//               >
//                 + Add Cost
//               </button>
//             </div>
            
//             {buying.additionalCosts.map((cost, index) => (
//               <div key={cost.id} style={{ 
//                 display: "grid", 
//                 gridTemplateColumns: "2fr 1fr 1fr auto", 
//                 gap: "10px", 
//                 alignItems: "end",
//                 marginBottom: "10px"
//               }}>
//                 <div>
//                   <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#555" }}>
//                     Description
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="e.g., Shipping, Insurance"
//                     value={cost.description}
//                     onChange={(e) => updateAdditionalCost(cost.id, "description", e.target.value)}
//                     style={{ 
//                       width: "100%", 
//                       padding: "8px", 
//                       border: "1px solid #ddd", 
//                       borderRadius: "5px",
//                       fontSize: "12px"
//                     }}
//                   />
//                 </div>
//                 <div>
//                   <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#555" }}>
//                     Amount
//                   </label>
//                   <input
//                     type="number"
//                     placeholder="0.00"
//                     value={cost.amount}
//                     onChange={(e) => updateAdditionalCost(cost.id, "amount", e.target.value)}
//                     style={{ 
//                       width: "100%", 
//                       padding: "8px", 
//                       border: "1px solid #ddd", 
//                       borderRadius: "5px",
//                       fontSize: "12px"
//                     }}
//                   />
//                 </div>
//                 <div>
//                   <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#555" }}>
//                     Type
//                   </label>
//                   <select
//                     value={cost.type}
//                     onChange={(e) => updateAdditionalCost(cost.id, "type", e.target.value)}
//                     style={{ 
//                       width: "100%", 
//                       padding: "8px", 
//                       border: "1px solid #ddd", 
//                       borderRadius: "5px",
//                       fontSize: "12px"
//                     }}
//                   >
//                     <option value="fixed">Fixed</option>
//                     <option value="percentage">Percentage</option>
//                   </select>
//                 </div>
//                 {buying.additionalCosts.length > 1 && (
//                   <button
//                     type="button"
//                     onClick={() => removeAdditionalCost(cost.id)}
//                     style={{
//                       background: "#dc3545",
//                       color: "white",
//                       border: "none",
//                       padding: "8px",
//                       borderRadius: "5px",
//                       cursor: "pointer",
//                       fontSize: "12px"
//                     }}
//                   >
//                     ×
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>

//           <div style={{ 
//             background: "#e7f3ff", 
//             padding: "15px", 
//             borderRadius: "5px", 
//             marginTop: "20px",
//             border: "1px solid #b3d9ff"
//           }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <span style={{ fontWeight: "bold", color: "#0066cc" }}>NET PAYMENT:</span>
//               <span style={{ fontSize: "18px", fontWeight: "bold", color: "#0066cc" }}>
//                 {getCurrencySymbol(buying.currency)} {(buyingCalculation.netPayment || 0).toFixed(2)}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Selling Section */}
//         <div style={{ 
//           background: "white", 
//           border: "1px solid #e1e5e9", 
//           borderRadius: "10px", 
//           padding: "20px",
//           boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
//         }}>
//           <div style={{ 
//             background: "#f8f9fa", 
//             padding: "15px", 
//             borderRadius: "8px", 
//             marginBottom: "20px",
//             borderLeft: "4px solid #28a745"
//           }}>
//             <h3 style={{ margin: 0, color: "#28a745" }}>Revenue Side (Selling)</h3>
//           </div>

//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
//             <div>
//               <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>
//                 Currency *
//               </label>
//               <select 
//                 name="currency" 
//                 onChange={handleSellingChange}
//                 value={selling.currency}
//                 style={{ 
//                   width: "100%", 
//                   padding: "10px", 
//                   border: "1px solid #ddd", 
//                   borderRadius: "5px",
//                   fontSize: "14px"
//                 }}
//               >
//                 {currencies.map(currency => (
//                   <option key={currency.code} value={currency.code}>
//                     {currency.code} - {currency.name}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>
//                 Selling Price *
//               </label>
//               <div style={{ position: "relative" }}>
//                 <span style={{
//                   position: "absolute",
//                   left: "10px",
//                   top: "50%",
//                   transform: "translateY(-50%)",
//                   color: "#666"
//                 }}>
//                   {getCurrencySymbol(selling.currency)}
//                 </span>
//                 <input 
//                   name="price" 
//                   type="number" 
//                   onChange={handleSellingChange}
//                   placeholder="0.00"
//                   style={{ 
//                     width: "100%", 
//                     padding: "10px 10px 10px 30px", 
//                     border: "1px solid #ddd", 
//                     borderRadius: "5px",
//                     fontSize: "14px"
//                   }}
//                 />
//               </div>
//             </div>
//           </div>

//           <div style={{ marginTop: "20px" }}>
//             <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
//               <input
//                 type="checkbox"
//                 name="incentive"
//                 onChange={handleSellingChange}
//                 style={{ transform: "scale(1.2)" }}
//               />
//               <span style={{ fontWeight: "bold", color: "#555" }}>Include Incentive/Discount</span>
//             </label>

//             {selling.incentive && (
//               <div style={{ 
//                 background: "#f8f9fa", 
//                 padding: "15px", 
//                 borderRadius: "5px",
//                 marginBottom: "15px"
//               }}>
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//                   <div>
//                     <label style={{ display: "block", marginBottom: "5px", color: "#555" }}>Type</label>
//                     <select
//                       name="incentiveType"
//                       onChange={handleSellingChange}
//                       value={selling.incentiveType}
//                       style={{ 
//                         width: "100%", 
//                         padding: "8px", 
//                         border: "1px solid #ddd", 
//                         borderRadius: "5px" 
//                       }}
//                     >
//                       <option value="percentage">Percentage (%)</option>
//                       <option value="fixed">Fixed Amount</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label style={{ display: "block", marginBottom: "5px", color: "#555" }}>Value</label>
//                     <input
//                       name="incentiveValue"
//                       type="number"
//                       onChange={handleSellingChange}
//                       placeholder={selling.incentiveType === "percentage" ? "0.00%" : "0.00"}
//                       style={{ 
//                         width: "100%", 
//                         padding: "8px", 
//                         border: "1px solid #ddd", 
//                         borderRadius: "5px" 
//                       }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div style={{ marginTop: "15px" }}>
//             <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
//               <input
//                 type="checkbox"
//                 name="vatIncluded"
//                 onChange={handleSellingChange}
//                 style={{ transform: "scale(1.2)" }}
//               />
//               <span style={{ fontWeight: "bold", color: "#555" }}>Include VAT</span>
//             </label>

//             {selling.vatIncluded && (
//               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
//                 <div>
//                   <label style={{ display: "block", marginBottom: "5px", color: "#555" }}>VAT %</label>
//                   <input
//                     name="vatPercent"
//                     type="number"
//                     onChange={handleSellingChange}
//                     value={selling.vatPercent}
//                     step="0.1"
//                     style={{ 
//                       width: "100%", 
//                       padding: "8px", 
//                       border: "1px solid #ddd", 
//                       borderRadius: "5px" 
//                     }}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Discounts */}
//           <div style={{ marginTop: "20px" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
//               <h4 style={{ margin: 0, color: "#555" }}>Additional Discounts</h4>
//               <button
//                 type="button"
//                 onClick={addDiscount}
//                 style={{
//                   background: "#28a745",
//                   color: "white",
//                   border: "none",
//                   padding: "5px 10px",
//                   borderRadius: "5px",
//                   cursor: "pointer",
//                   fontSize: "12px"
//                 }}
//               >
//                 + Add Discount
//               </button>
//             </div>
            
//             {selling.discounts.map((discount, index) => (
//               <div key={discount.id} style={{ 
//                 display: "grid", 
//                 gridTemplateColumns: "2fr 1fr 1fr auto", 
//                 gap: "10px", 
//                 alignItems: "end",
//                 marginBottom: "10px"
//               }}>
//                 <div>
//                   <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#555" }}>
//                     Description
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="e.g., Seasonal, Bulk"
//                     value={discount.description}
//                     onChange={(e) => updateDiscount(discount.id, "description", e.target.value)}
//                     style={{ 
//                       width: "100%", 
//                       padding: "8px", 
//                       border: "1px solid #ddd", 
//                       borderRadius: "5px",
//                       fontSize: "12px"
//                     }}
//                   />
//                 </div>
//                 <div>
//                   <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#555" }}>
//                     Amount
//                   </label>
//                   <input
//                     type="number"
//                     placeholder="0.00"
//                     value={discount.amount}
//                     onChange={(e) => updateDiscount(discount.id, "amount", e.target.value)}
//                     style={{ 
//                       width: "100%", 
//                       padding: "8px", 
//                       border: "1px solid #ddd", 
//                       borderRadius: "5px",
//                       fontSize: "12px"
//                     }}
//                   />
//                 </div>
//                 <div>
//                   <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#555" }}>
//                     Type
//                   </label>
//                   <select
//                     value={discount.type}
//                     onChange={(e) => updateDiscount(discount.id, "type", e.target.value)}
//                     style={{ 
//                       width: "100%", 
//                       padding: "8px", 
//                       border: "1px solid #ddd", 
//                       borderRadius: "5px",
//                       fontSize: "12px"
//                     }}
//                   >
//                     <option value="fixed">Fixed</option>
//                     <option value="percentage">Percentage</option>
//                   </select>
//                 </div>
//                 {selling.discounts.length > 1 && (
//                   <button
//                     type="button"
//                     onClick={() => removeDiscount(discount.id)}
//                     style={{
//                       background: "#dc3545",
//                       color: "white",
//                       border: "none",
//                       padding: "8px",
//                       borderRadius: "5px",
//                       cursor: "pointer",
//                       fontSize: "12px"
//                     }}
//                   >
//                     ×
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>

//           <div style={{ 
//             background: "#e7f3ff", 
//             padding: "15px", 
//             borderRadius: "5px", 
//             marginTop: "20px",
//             border: "1px solid #b3d9ff"
//           }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//               <span style={{ fontWeight: "bold", color: "#0066cc" }}>Net Revenue:</span>
//               <span style={{ fontSize: "18px", fontWeight: "bold", color: "#0066cc" }}>
//                 {getCurrencySymbol(selling.currency)} {(sellingCalculation || 0).toFixed(2)}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Exchange Rate Section */}
//       {buying.currency !== selling.currency && (
//         <div style={{ 
//           background: "white", 
//           border: "1px solid #e1e5e9", 
//           borderRadius: "10px", 
//           padding: "20px",
//           marginBottom: "20px",
//           boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
//         }}>
//           <h3 style={{ marginTop: 0, color: "#555" }}>Currency Exchange</h3>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", alignItems: "end" }}>
//             <div>
//               <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>
//                 Exchange Rate
//               </label>
//               <input
//                 placeholder="0.00"
//                 type="number"
//                 value={exchangeRate}
//                 onChange={(e) => setExchangeRate(e.target.value)}
//                 step="0.0001"
//                 style={{ 
//                   width: "100%", 
//                   padding: "10px", 
//                   border: "1px solid #ddd", 
//                   borderRadius: "5px",
//                   fontSize: "14px"
//                 }}
//               />
//               <small style={{ color: "#666" }}>
//                 1 {buying.currency} = {exchangeRate || "0"} {selling.currency}
//               </small>
//             </div>
//             <div>
//               <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
//                 <input
//                   type="checkbox"
//                   checked={autoCalculateRate}
//                   onChange={(e) => setAutoCalculateRate(e.target.checked)}
//                   style={{ transform: "scale(1.2)" }}
//                 />
//                 <span style={{ fontWeight: "bold", color: "#555" }}>Auto-calculate rate</span>
//               </label>
//               <small style={{ color: "#666" }}>Fetch current market rate</small>
//             </div>
//             <div style={{ 
//               background: "#fff3cd", 
//               padding: "10px", 
//               borderRadius: "5px",
//               border: "1px solid #ffeaa7"
//             }}>
//               <div style={{ fontSize: "12px", color: "#856404" }}>
//                 <strong>Converted Cost:</strong><br />
//                 {getCurrencySymbol(selling.currency)} {(convertedBuying || 0).toFixed(2)}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Profit Summary */}
//       <div style={{ 
//         background: "white", 
//         border: "1px solid #e1e5e9", 
//         borderRadius: "10px", 
//         padding: "20px",
//         boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
//       }}>
//         <h3 style={{ marginTop: 0, color: "#555" }}>Profit Analysis</h3>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px" }}>
//           <div style={{ 
//             background: profit >= 0 ? "#d4edda" : "#f8d7da", 
//             padding: "20px", 
//             borderRadius: "8px",
//             border: `2px solid ${profit >= 0 ? "#c3e6cb" : "#f5c6cb"}`
//           }}>
//             <div style={{ fontSize: "14px", color: profit >= 0 ? "#155724" : "#721c24", marginBottom: "5px" }}>
//               Net Profit/Loss
//             </div>
//             <div style={{ 
//               fontSize: "24px", 
//               fontWeight: "bold", 
//               color: profit >= 0 ? "#155724" : "#721c24" 
//             }}>
//               {getCurrencySymbol(selling.currency)} {(profit || 0).toFixed(2)}
//             </div>
//           </div>

//           <div style={{ 
//             background: profitMarginPercent >= 0 ? "#d1ecf1" : "#f8d7da", 
//             padding: "20px", 
//             borderRadius: "8px",
//             border: `2px solid ${profitMarginPercent >= 0 ? "#bee5eb" : "#f5c6cb"}`
//           }}>
//             <div style={{ fontSize: "14px", color: profitMarginPercent >= 0 ? "#0c5460" : "#721c24", marginBottom: "5px" }}>
//               Profit Margin
//             </div>
//             <div style={{ 
//               fontSize: "24px", 
//               fontWeight: "bold", 
//               color: profitMarginPercent >= 0 ? "#0c5460" : "#721c24" 
//             }}>
//               {(profitMarginPercent || 0).toFixed(2)}%
//             </div>
//           </div>

//           <div style={{ 
//             background: "#e2e3e5", 
//             padding: "20px", 
//             borderRadius: "8px",
//             border: "2px solid #d6d8db"
//           }}>
//             <div style={{ fontSize: "14px", color: "#383d41", marginBottom: "5px" }}>
//               Markup Percentage
//             </div>
//             <div style={{ fontSize: "24px", fontWeight: "bold", color: "#383d41" }}>
//               {convertedBuying > 0 ? ((profit / convertedBuying) * 100).toFixed(2) : "0.00"}%
//             </div>
//           </div>
//         </div>

//         <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
//           <div>
//             <h4 style={{ color: "#555", marginBottom: "10px" }}>Cost Breakdown</h4>
//             <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "5px" }}>
//               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
//                 <span>Base Cost (including VAT):</span>
//                 <span>{getCurrencySymbol(buying.currency)} {(buyingCalculation.baseAmount || 0).toFixed(2)}</span>
//               </div>
//               {(buyingCalculation.commissionAmount || 0) > 0 && (
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#28a745" }}>
//                   <span>Commission (Your Profit):</span>
//                   <span>-{getCurrencySymbol(buying.currency)} {(buyingCalculation.commissionAmount || 0).toFixed(2)}</span>
//                 </div>
//               )}
//               {(buyingCalculation.additionalCosts || 0) > 0 && (
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#dc3545" }}>
//                   <span>Additional Costs:</span>
//                   <span>+{getCurrencySymbol(buying.currency)} {(buyingCalculation.additionalCosts || 0).toFixed(2)}</span>
//                 </div>
//               )}
//               {(buyingCalculation.vatAmount || 0) > 0 && (
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#6f42c1" }}>
//                   <span>VAT ({buying.vatPercent}%):</span>
//                   <span>-{getCurrencySymbol(buying.currency)} {(buyingCalculation.vatAmount || 0).toFixed(2)}</span>
//                 </div>
//               )}
//               <hr style={{ margin: "10px 0", border: "none", borderTop: "1px solid #dee2e6" }} />
//               <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
//                 <span>NET PAYMENT:</span>
//                 <span>{getCurrencySymbol(buying.currency)} {(buyingCalculation.netPayment || 0).toFixed(2)}</span>
//               </div>
//             </div>
//           </div>

//           <div>
//             <h4 style={{ color: "#555", marginBottom: "10px" }}>Revenue Breakdown</h4>
//             <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "5px" }}>
//               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
//                 <span>Selling Price:</span>
//                 <span>{getCurrencySymbol(selling.currency)} {(parseFloat(selling.price) || 0).toFixed(2)}</span>
//               </div>
//               {selling.incentive && selling.incentiveValue && (
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#28a745" }}>
//                   <span>Incentive:</span>
//                   <span>-{getCurrencySymbol(selling.currency)} {
//                     selling.incentiveType === "percentage" 
//                       ? ((parseFloat(selling.price) || 0) * (parseFloat(selling.incentiveValue) || 0) / 100).toFixed(2)
//                       : (parseFloat(selling.incentiveValue) || 0).toFixed(2)
//                   }</span>
//                 </div>
//               )}
//               {calculateTotalDiscounts() > 0 && (
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#28a745" }}>
//                   <span>Discounts:</span>
//                   <span>-{getCurrencySymbol(selling.currency)} {calculateTotalDiscounts().toFixed(2)}</span>
//                 </div>
//               )}
//               {selling.vatIncluded && selling.vatPercent && (
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", color: "#28a745" }}>
//                   <span>VAT ({selling.vatPercent}%):</span>
//                   <span>-{getCurrencySymbol(selling.currency)} {
//                     ((parseFloat(selling.price) || 0) * (parseFloat(selling.vatPercent) || 0) / 100).toFixed(2)
//                   }</span>
//                 </div>
//               )}
//               <hr style={{ margin: "10px 0", border: "none", borderTop: "1px solid #dee2e6" }} />
//               <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
//                 <span>Net Revenue:</span>
//                 <span>{getCurrencySymbol(selling.currency)} {(sellingCalculation || 0).toFixed(2)}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
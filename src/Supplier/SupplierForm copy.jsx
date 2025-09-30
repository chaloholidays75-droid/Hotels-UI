// import React, { useState, useEffect } from "react";
// import supplierApi from "../api/supplierApi";

// const SupplierForm = ({ supplier, onSaved, onCancel }) => {
//   const [name, setName] = useState(supplier?.name || "");
//   const [email, setEmail] = useState(supplier?.email || "");
//   const [phone, setPhone] = useState(supplier?.phone || "");
//   const [categories, setCategories] = useState([]);
//   const [subCategories, setSubCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(
//     supplier?.supplierCategoryId || ""
//   );
//   const [selectedSubCategory, setSelectedSubCategory] = useState(
//     supplier?.supplierSubCategoryId || ""
//   );
//   const [loadingSubCategories, setLoadingSubCategories] = useState(false);
//   const [saving, setSaving] = useState(false);

//   // Fetch categories on mount
//   useEffect(() => {
//     const fetchCategories = async () => {
//       const data = await supplierApi.getCategories();
//       setCategories(data);
//     };
//     fetchCategories();
//   }, []);

//   // Fetch subcategories whenever selected category changes
//   useEffect(() => {
//     if (!selectedCategory) {
//       setSubCategories([]);
//       setSelectedSubCategory("");
//       return;
//     }

//     const fetchSubCategories = async () => {
//       setLoadingSubCategories(true);
//       const data = await supplierApi.getSubCategories(selectedCategory);
//       setSubCategories(data);
//       setLoadingSubCategories(false);
//     };
//     fetchSubCategories();
//   }, [selectedCategory]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSaving(true);

//     try {
//       const payload = {
//         id: supplier?.id || 0,
//         name,
//         email,
//         phone,
//         supplierCategoryId: selectedCategory,
//         supplierSubCategoryId: selectedSubCategory || 0
//       };

//       if (supplier?.id) {
//         await supplierApi.updateSupplier(supplier.id, payload);
//       } else {
//         await supplierApi.createSupplier(payload);
//       }

//       onSaved(); // Notify parent
//     } catch (error) {
//       console.error("Error saving supplier:", error);
//       alert(
//         error.response?.data?.message || "An error occurred while saving supplier."
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="supplier-form">
//       <div>
//         <label>Name</label>
//         <input
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           required
//         />
//       </div>

//       <div>
//         <label>Email</label>
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//       </div>

//       <div>
//         <label>Phone</label>
//         <input
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//         />
//       </div>

//       <div>
//         <label>Category</label>
//         <select
//           value={selectedCategory}
//           onChange={(e) => setSelectedCategory(Number(e.target.value))}
//           required
//         >
//           <option value="">-- Select Category --</option>
//           {categories.map((cat) => (
//             <option key={cat.id} value={cat.id}>
//               {cat.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label>Subcategory</label>
//         <select
//           value={selectedSubCategory}
//           onChange={(e) => setSelectedSubCategory(Number(e.target.value))}
//           disabled={!selectedCategory || loadingSubCategories}
//         >
//           <option value="">-- Select Subcategory --</option>
//           {subCategories.map((sub) => (
//             <option key={sub.id} value={sub.id}>
//               {sub.name}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div className="form-actions">
//         <button type="submit" disabled={saving}>
//           {saving ? "Saving..." : "Save Supplier"}
//         </button>
//         <button type="button" onClick={onCancel} disabled={saving}>
//           Cancel
//         </button>
//       </div>
//     </form>
//   );
// };

// export default SupplierForm;

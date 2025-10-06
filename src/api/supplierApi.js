// import axios from 'axios';

// const api = axios.create({
//   baseURL: 'http://localhost:5039/api' // <-- change for production
// });

// // ----------------- Helper to standardize response -----------------
// const formatResponse = (res, defaultMessage = "Success") => {
//   if (typeof res.data === "object" && res.data.message) {
//     return {
//       message: res.data.message,
//       data: res.data.supplier || res.data.items || res.data || null
//     };
//   }
//   return {
//     message: defaultMessage,
//     data: res.data
//   };
// };

// // ----------------- SUPPLIERS -----------------
// const getSuppliers = async () =>
//   formatResponse(await api.get('/Suppliers'), "Suppliers fetched");

// const getSuppliersList = async () =>
//   formatResponse(await api.get('/Suppliers/list'), "Suppliers list fetched");

// const getSupplier = async (id) =>
//   formatResponse(await api.get(`/Suppliers/${id}`), "Supplier fetched");

// const createSupplier = async (supplierData) =>
//   formatResponse(await api.post('/Suppliers', supplierData), "Supplier created");

// const updateSupplier = async (id, supplierData) =>
//   formatResponse(await api.put(`/Suppliers/${id}`, supplierData), "Supplier updated");

// const deleteSupplier = async (id) =>
//   formatResponse(await api.delete(`/Suppliers/${id}`), "Supplier deleted");

// const deleteSuppliersBatch = async (ids) =>
//   formatResponse(await api.delete('/Suppliers', { data: ids }), "Suppliers deleted");

// // ----------------- CATEGORIES -----------------
// const getCategories = async (page = 1, pageSize = 100, search = '') =>
//   formatResponse(await api.get('/SupplierCategories', { params: { page, pageSize, search } }), "Categories fetched");

// const getCategory = async (id) =>
//   formatResponse(await api.get(`/SupplierCategories/${id}`), "Category fetched");

// const createCategory = async (data) =>
//   formatResponse(await api.post('/SupplierCategories', data), "Category created");

// const updateCategory = async (id, data) =>
//   formatResponse(await api.put(`/SupplierCategories/${id}`, data), "Category updated");

// const deleteCategory = async (id) =>
//   formatResponse(await api.delete(`/SupplierCategories/${id}`), "Category deleted");

// // ----------------- SUBCATEGORIES -----------------
// const getSubCategories = async (categoryId) =>
//   formatResponse(await api.get(`/SupplierCategories/${categoryId}/subcategories`), "Subcategories fetched");

// const createSubCategory = async (categoryId, data) =>
//   formatResponse(await api.post(`/SupplierCategories/${categoryId}/subcategories`, data), "Subcategory created");

// const updateSubCategory = async (id, data) =>
//   formatResponse(await api.put(`/SupplierCategories/subcategories/${id}`, data), "Subcategory updated");

// const deleteSubCategory = async (id) =>
//   formatResponse(await api.delete(`/SupplierCategories/subcategories/${id}`), "Subcategory deleted");

// const deleteSubCategoriesBatch = async (ids) =>
//   formatResponse(await api.delete(`/SupplierCategories/subcategories`, { data: ids }), "Subcategories deleted");

// // ----------------- EXPORT -----------------
// export default {
//   // Suppliers
//   getSuppliers,
//   getSuppliersList,
//   getSupplier,
//   createSupplier,
//   updateSupplier,
//   deleteSupplier,
//   deleteSuppliersBatch,

//   // Categories
//   getCategories,
//   getCategory,
//   createCategory,
//   updateCategory,
//   deleteCategory,

//   // Subcategories
//   getSubCategories,
//   createSubCategory,
//   updateSubCategory,
//   deleteSubCategory,
//   deleteSubCategoriesBatch,
// // };
// import api from './api';
// src/api/supplierApi.js
import api from './api'; // import your axios instance with interceptors

const supplierApi = {
  // Categories
  getCategories: async (page = 1, pageSize = 50, search = '') => {
    const res = await api.get('/SupplierCategories', { params: { page, pageSize, search } });
    return res.data.items;
  },
  createCategory: async (data) => {
    const res = await api.post('/SupplierCategories', data);
    return res.data;
  },
  getSubCategories: async (categoryOrId) => {
    const categoryId = typeof categoryOrId === "number" ? categoryOrId : categoryOrId.id;
    const res = await api.get(`/SupplierCategories/${categoryId}/subcategories`);
    return res.data;
  },
  createSubCategory: async ({ categoryId, name }) => {
    const res = await api.post(`/SupplierCategories/${categoryId}/subcategories`, { name });
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await api.put(`/SupplierCategories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await api.delete(`/SupplierCategories/${id}`);
    return res.data;
  },
  updateSubCategory: async (id, data) => {
    const res = await api.put(`/SupplierCategories/subcategories/${id}`, data);
    return res.data;
  },
  deleteSubCategory: async (id) => {
    const res = await api.delete(`/SupplierCategories/subcategories/${id}`);
    return res.data;
  },
  toggleSupplierStatus: async (id) => {
  const res = await api.patch(`/Suppliers/${id}/toggle`);
  return res.data;
},
  // Suppliers
  getSuppliers: async () => {
    const res = await api.get("/Suppliers");
    return res.data;
  },
  getSuppliersList: async () => {
    const res = await api.get("/Suppliers/list");
    return res.data;
  },
  getSupplier: async (id) => {
    const res = await api.get(`/Suppliers/${id}`);
    return res.data;
  },
  createSupplier: async (data) => {
    const res = await api.post("/Suppliers", data);
    return res.data;
  },
  updateSupplier: async (id, data) => {
    const res = await api.put(`/Suppliers/${id}`, data);
    return res.data;
  },
  deleteSupplier: async (id) => {
    const res = await api.delete(`/Suppliers/${id}`);
    return res.data;
  },
  deleteSuppliers: async (ids) => {
    const res = await api.delete("/Suppliers", { data: ids });
    return res.data;
  },

  // Countries & Cities
  getCountries: async () => {
    const res = await api.get("/countries");
    return res.data;
  },
  getCities: async (countryId) => {
    if (!countryId) throw new Error("countryId is required for getCities");
    const res = await api.get(`/cities/by-country/${countryId}`);
    return res.data;
  },
  
getSuppliersByCategory: async (categoryId, subCategoryId = null) => {
  const res = await api.get("/Suppliers/by-category", { params: { categoryId, subCategoryId } });
  return res.data;
}


};

export default supplierApi;

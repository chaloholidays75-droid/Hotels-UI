import React, { useEffect, useState } from "react";
import supplierApi from "../api/supplierApi";

const SupplierList = ({ 
//   suppliers, 
  loading, 
  openViewModal, 
  openEditModal, 
  toggleSupplierStatus,
  isAdmin,
  refreshSuppliers 
})  => {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await supplierApi.getSuppliers();
      console.log("Suppliers data from backend:", data);
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const toggleSupplierStatusa = async (id, currentStatus) => {
    try {
      await supplierApi.updateSupplier(id, { IsActive: !currentStatus });
      setSuppliers((prev) =>
        prev.map((s) =>
          s.Id === id ? { ...s, IsActive: !currentStatus } : s
        )
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleViewSupplier = (supplier) => {
    console.log("View", supplier);
    // Add your modal opening logic here
  };

  const handleEditSupplier = (supplier) => {
    console.log("Edit", supplier);
    // Add your modal opening logic here
  };

  return (
    <div className="suppliers-list">
      <div className="list-header">
        <h2 className="section-title">Registered Suppliers </h2>
        <div className="action-buttons">
          <button className="action-btn refresh" onClick={fetchSuppliers} title="Refresh data">
            <fml-icon name="refresh-circle-outline"></fml-icon> Refresh
          </button>
        </div>
      </div>
      
      <div className="suppliers-table-container">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Category</th>
              <th>SubCategory</th>
              <th>Country</th>
              <th>City</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.Id} className={!s.IsActive ? 'inactive' : ''}>
                <td>{s.supplierName || "N/A"}</td>
                <td>{s.emailId || "N/A"}</td>
                <td>{s.phoneNo || "N/A"}</td>
                <td>{s.supplierCategoryName || "N/A"}</td>
                <td>{s.supplierSubCategoryName || "N/A"}</td>
                <td>{s.countryName}</td>
                <td>{s.cityName}</td>
                <td>
                  <span className={`status-indicator ${s.isActive ? 'active' : 'inactive'}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    {/* View Icon */}
                    <div 
                      className="icon-action view-icon"
                     onClick={() => openViewModal(s)}
                      title="View Supplier"
                    >
                      {/* <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg> */}
                      <fml-icon name="information-circle"></fml-icon>
                    </div>

                    {/* Edit Icon */}
                    <div 
                      className="icon-action edit-icon"
                      onClick={() => openEditModal(s)}
                      title="Edit Supplier"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </div>

                    {/* Toggle Status Icon */}
                    <div 
                      className={`icon-action toggle-icon ${s.IsActive ? 'deactivate' : 'activate'}`}
                     onClick={() => toggleSupplierStatus(s.Id, s.IsActive)}
                      title={s.IsActive ? "Deactivate Supplier" : "Activate Supplier"}
                    >
                      {s.IsActive ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierList;
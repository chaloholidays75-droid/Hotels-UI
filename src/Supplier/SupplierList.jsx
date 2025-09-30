import React, { useEffect, useState, useRef } from "react";
import supplierApi from "../api/supplierApi";
import "./SupplierList.css";

const SupplierList = ({ 
  loading, 
  openViewModal, 
  openEditModal, 
  toggleSupplierStatus,
  isAdmin,
  refreshSuppliers 
}) => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const tableRef = useRef(null);

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
      await supplierApi.updateSupplier(id, { isActive: !currentStatus });
      setSuppliers((prev) =>
        prev.map((s) =>
          s.Id === id ? { ...s, isActive: !currentStatus } : s
        )
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  // Filter suppliers based on search term and status
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.countryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cityName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && supplier.isActive) ||
                         (statusFilter === 'inactive' && !supplier.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Print functionality
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printDate = new Date().toLocaleDateString();
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Suppliers List - ${printDate}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #000; 
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333; 
              padding-bottom: 10px; 
            }
            .print-header h1 { 
              margin: 0; 
              color: #2c3e50; 
              font-size: 24px; 
            }
            .print-header p { 
              margin: 5px 0 0 0; 
              color: #666; 
            }
            .print-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .suppliers-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
            }
            .suppliers-table th { 
              background-color: #f8f9fa !important; 
              color: #000 !important; 
              border: 1px solid #ddd; 
              padding: 12px 8px; 
              text-align: left; 
              font-weight: bold; 
              font-size: 12px; 
            }
            .suppliers-table td { 
              border: 1px solid #ddd; 
              padding: 10px 8px; 
              font-size: 12px; 
              color: #000; 
            }
            .suppliers-table tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .status-active { 
              background-color: #d4edda; 
              color: #155724; 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 11px; 
              font-weight: bold; 
            }
            .status-inactive { 
              background-color: #f8d7da; 
              color: #721c24; 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 11px; 
              font-weight: bold; 
            }
            .print-footer { 
              margin-top: 30px; 
              text-align: center; 
              font-size: 12px; 
              color: #666; 
              border-top: 1px solid #ddd; 
              padding-top: 10px; 
            }
            @media print {
              body { margin: 0.5cm; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Registered Suppliers</h1>
            <p>Supplier Management System</p>
          </div>
          
          <div class="print-info">
            <div><strong>Print Date:</strong> ${printDate}</div>
            <div><strong>Total Suppliers:</strong> ${filteredSuppliers.length}</div>
            <div><strong>Status Filter:</strong> ${statusFilter === 'all' ? 'All' : statusFilter}</div>
          </div>

          <table class="suppliers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Category</th>
                <th>SubCategory</th>
                <th>Country</th>
                <th>City</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSuppliers.map(supplier => `
                <tr>
                  <td>${supplier.supplierName || "N/A"}</td>
                  <td>${supplier.emailId || "N/A"}</td>
                  <td>${supplier.supplierCategoryName || "N/A"}</td>
                  <td>${supplier.supplierSubCategoryName || "N/A"}</td>
                  <td>${supplier.countryName || "N/A"}</td>
                  <td>${supplier.cityName || "N/A"}</td>
                  <td>
                    <span class="${supplier.isActive ? 'status-active' : 'status-inactive'}">
                      ${supplier.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="print-footer">
            Generated by Supplier Management System • ${window.location.hostname}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // printWindow.close(); // Uncomment if you want to auto-close after print
    };
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Category', 'SubCategory', 'Country', 'City', 'Status'];
    const csvData = filteredSuppliers.map(supplier => [
      supplier.supplierName || 'N/A',
      supplier.emailId || 'N/A',
      supplier.supplierCategoryName || 'N/A',
      supplier.supplierSubCategoryName || 'N/A',
      supplier.countryName || 'N/A',
      supplier.cityName || 'N/A',
      supplier.isActive ? 'Active' : 'Inactive'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `suppliers_${date}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="supplier-list-wrapper">
        <div className="supplier-loading-state">
          <div className="supplier-loading-spinner"></div>
          <div className="supplier-loading-text">Loading suppliers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-list-wrapper">
      {/* Header Section */}
      <div className="supplier-list-header">
        <div className="supplier-title-section">
          <h2>Registered Suppliers</h2>
          <p>Manage your supplier relationships efficiently</p>
        </div>
        <div className="supplier-action-buttons">
          <button 
            className="supplier-action-btn refresh-btn"
            onClick={fetchSuppliers}
            title="Refresh data"
          >
            <fml-icon name="refresh-outline"></fml-icon> Refresh
          </button>
          <button 
            className="supplier-action-btn export-btn"
            onClick={handleExportCSV}
            title="Export to CSV"
          >
            <fml-icon name="document-attach-outline"></fml-icon> Export CSV
          </button>
          <button 
            className="supplier-action-btn print-btn"
            onClick={handlePrint}
            title="Print Suppliers List"
          >
            <fml-icon name="print-outline"></fml-icon> Print
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="supplier-controls">
        <div className="supplier-search-box">
          <input
            type="text"
            className="supplier-search-input"
            placeholder="Search suppliers by name, email, country, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="supplier-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Suppliers Table */}
      {filteredSuppliers.length === 0 ? (
        <div className="supplier-empty-state">
          <p>No suppliers found</p>
          <div className="supplier-empty-actions">
            <button className="supplier-action-btn refresh-btn" onClick={fetchSuppliers}>
              <fml-icon name="refresh-outline"></fml-icon> Refresh List
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="supplier-table-wrapper" ref={tableRef}>
            <table className="supplier-data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Category</th>
                  <th>SubCategory</th>
                  <th>Country</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <tr key={s.Id} className={!s.isActive ? 'supplier-inactive' : ''}>
                    <td>{s.supplierName || "N/A"}</td>
                    <td>{s.emailId || "N/A"}</td>
                    <td>{s.supplierCategoryName || "N/A"}</td>
                    <td>{s.supplierSubCategoryName || "N/A"}</td>
                    <td>{s.countryName || "N/A"}</td>
                    <td>{s.cityName || "N/A"}</td>
                    <td>
                      <span className={`supplier-status ${s.isActive ? 'active-status' : 'inactive-status'}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="supplier-action-cells">
                        {/* View Icon */}
                        <button
                          className="supplier-icon-btn supplier-view-btn"
                          onClick={() => openViewModal(s)}
                          title="View Supplier"
                        >
                          <fml-icon name="eye-outline"></fml-icon>
                        </button>

                        {/* Edit Icon */}
                        <button
                          className={`supplier-icon-btn ${isAdmin ? 'supplier-edit-btn' : 'supplier-locked-btn'}`}
                          onClick={() => isAdmin && openEditModal(s)}
                          title={isAdmin ? "Edit Supplier" : "No permission to edit"}
                        >
                          <fml-icon name="create-outline"></fml-icon>
                        </button>

                        {/* Toggle Status Icon */}
                        {/* <button
                          className={`supplier-icon-btn supplier-toggle-btn ${s.isActive ? 'deactivate-btn' : 'activate-btn'}`}
                          onClick={() => isAdmin && toggleSupplierStatus(s.Id, s.isActive)}
                          title={isAdmin ? (s.isActive ? "Deactivate Supplier" : "Activate Supplier") : "No permission"}
                        >
                          {s.isActive ? (
                            <fml-icon name="pause-circle-outline"></fml-icon>
                          ) : (
                            <fml-icon name="play-circle-outline"></fml-icon>
                          )}
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="supplier-pagination">
            <div className="supplier-pagination-info">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </div>
            <div className="supplier-pagination-controls">
              <button className="supplier-page-btn" disabled>Previous</button>
              <button className="supplier-page-btn active-page">1</button>
              <span className="supplier-page-dots">...</span>
              <button className="supplier-page-btn">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SupplierList;
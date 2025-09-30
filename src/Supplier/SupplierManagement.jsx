import React, { useState, useEffect, useContext } from "react";
import SupplierForm from "./SupplierForm";
import SupplierList from "./SupplierList";
import SupplierViewModal from "./SupplierViewModal";
import SupplierEditModal from "./SupplierEditModal";
import "./SupplierManagement.css";
import supplierApi from "../api/supplierApi";
import { AuthContext } from "../context/AuthContext";

const SupplierManagement = () => {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || "employee";

  const [activeTab, setActiveTab] = useState("view");
  const [suppliers, setSuppliers] = useState([]);
  const [viewModal, setViewModal] = useState({ isOpen: false, supplier: null });
  const [editModal, setEditModal] = useState({ isOpen: false, supplier: null });
  const [loading, setLoading] = useState(false);

  const handleTabChange = (tab) => setActiveTab(tab);

  useEffect(() => {
    if (activeTab === "view") fetchSuppliers();
  }, [activeTab]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await supplierApi.getSuppliers();

      // Map API fields to frontend expected fields
      const mappedSuppliers = data.map(s => ({
        id: s.id,
        name: s.supplierName || "N/A",
        email: s.contactEmail || "N/A",
        phone: s.contactPhone || "N/A",
        supplierCategory: { name: s.supplierCategoryName || "N/A" },
        supplierSubCategory: { name: s.supplierSubCategoryName || "N/A" },
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));

      setSuppliers(mappedSuppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      alert("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (supplier) => setViewModal({ isOpen: true, supplier });
  const closeViewModal = () => setViewModal({ isOpen: false, supplier: null });

  const openEditModal = (supplier) => {
    if (userRole.toLowerCase() !== "admin") {
      alert("You do not have permission to edit suppliers.");
      return;
    }
    setEditModal({ isOpen: true, supplier });
  };
  const closeEditModal = () => setEditModal({ isOpen: false, supplier: null });

  const toggleSupplierStatus = async (id) => {
    if (userRole.toLowerCase() !== "admin") {
      alert("You do not have permission to change supplier status.");
      return;
    }

    const supplier = suppliers.find((s) => s.id === id);
    if (!supplier) return;

    const newStatus = !supplier.isActive;
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: newStatus } : s))
    );

    try {
      await supplierApi.updateSupplierStatus(id, newStatus);
      alert(`Supplier ${newStatus ? "activated" : "deactivated"} successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to update supplier status");
      // Rollback
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: supplier.isActive } : s))
      );
    }
  };

  const isAdmin = userRole.toLowerCase() === "admin";

  return (
    <div className="supplier-management-container">
      {/* Combined header and tabs in one line */}
      <div className="sm-header-tabs-container">
        <div className="header-section">
          <div className="title-section">
            <h1>Supplier Management</h1>
            <p>Manage suppliers and their categories/subcategories</p>
          </div>
          <div className="user-role-badge">
            Logged in as: <span className={`role-${userRole.toLowerCase()}`}>{userRole}</span>
          </div>
        </div>
        
        <div className="tabs-section">
          <button
            className={activeTab === "add" ? "tab active" : "tab"}
            onClick={() => handleTabChange("add")}
          >
            Add Supplier
          </button>
          <button
            className={activeTab === "view" ? "tab active" : "tab"}
            onClick={() => handleTabChange("view")}
          >
            View Suppliers ({suppliers.length})
          </button>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === "add" ? (
          <SupplierForm
            supplier={null}
            onSaved={() => {
              fetchSuppliers();
              setActiveTab("view");
            }}
            onCancel={() => setActiveTab("view")}
          />
        ) : (
          <SupplierList
            suppliers={suppliers}
            loading={loading}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleSupplierStatus={toggleSupplierStatus}
            isAdmin={isAdmin}
            refreshSuppliers={fetchSuppliers}
          />
        )}
      </div>

      {viewModal.isOpen && (
        <SupplierViewModal supplier={viewModal.supplier} onClose={closeViewModal} />
      )}
      
      {editModal.isOpen && (
        <SupplierEditModal
          editModal={editModal}
          setEditModal={setEditModal}  
          closeEditModal={closeEditModal}
          setSuppliers={setSuppliers}
          suppliers={suppliers}
          refreshSuppliers={fetchSuppliers}
        />
      )}
    </div>
  );
};

export default SupplierManagement;
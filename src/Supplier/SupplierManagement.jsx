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
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    supplierName: "",
    emailId: "",
    phoneNo: "",
    businessCurrency: "",
    supplierCategoryId: "",
    supplierSubCategoryId: "",
    countryId: "",
    cityId: "",
    firstName: "",
    lastName: "",
    userEmailId: "",
    userName: "",
    password: "",
    confirmPassword: "",
    enablePaymentDetails: false,
    acceptTerms: false,
    area: "",
    postCode: "",
    website: "",
    address: "",
    specialRemarks: "",
    mobileNo: ""
  });

  const handleTabChange = (tab) => setActiveTab(tab);

  useEffect(() => {
    if (activeTab === "view") fetchSuppliers();
  }, [activeTab]);

  const fetchSuppliers = async () => {
    try {
      const data = await supplierApi.getSuppliers();

      const mappedSuppliers = data.map((s) => ({
        id: s.id,
        name: s.supplierName || "N/A",
        email: s.contactEmail || "N/A",
        phone: s.contactPhone || "N/A",
        supplierCategory: { name: s.supplierCategoryName || "N/A" },
        supplierSubCategory: { name: s.supplierSubCategoryName || "N/A" },
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }));

      setSuppliers(mappedSuppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      alert("Failed to fetch suppliers");
    }
  };

  // ✅ Handles both text and checkbox inputs
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // ✅ Submit handler — creates new supplier
  const handleSubmit = async () => {
    if (!formData.acceptTerms) {
      alert("You must accept the Terms & Conditions before submitting.");
      return;
    }

    try {
      setSaving(true);
      const payload = { ...formData };

      // Optional cleanup or formatting
      if (payload.phoneNo?.startsWith("+")) {
        payload.phoneNo = payload.phoneNo.replace(/\s+/g, "");
      }

      console.log("Submitting Supplier:", payload);
      const response = await supplierApi.createSupplier(payload);

      if (response?.id) {
        alert("✅ Supplier created successfully!");
        setFormData({
          supplierName: "",
          emailId: "",
          phoneNo: "",
          businessCurrency: "",
          supplierCategoryId: "",
          supplierSubCategoryId: "",
          countryId: "",
          cityId: "",
          firstName: "",
          lastName: "",
          userEmailId: "",
          userName: "",
          password: "",
          confirmPassword: "",
          enablePaymentDetails: false,
          acceptTerms: false,
          area: "",
          postCode: "",
          website: "",
          address: "",
          specialRemarks: "",
          mobileNo: ""
        });
        fetchSuppliers();
        setActiveTab("view");
      } else {
        alert("Failed to create supplier. Please try again.");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      alert("An error occurred while saving supplier.");
    } finally {
      setSaving(false);
    }
  };

  const [viewModal, setViewModal] = useState({ isOpen: false, supplier: null });
  const [editModal, setEditModal] = useState({ isOpen: false, supplier: null });

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
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, isActive: supplier.isActive } : s
        )
      );
    }
  };

  const isAdmin = userRole.toLowerCase() === "admin";

  return (
    <div className="sms-page-content">
      {/* Header */}
      <header className="sms-system-header">
        <div className="sms-header-content">
          <div className="sms-header-main">
            <div className="sms-header-text">
              <h1 className="sms-header-title">Supplier Management</h1>
              <p className="sms-header-subtitle">
                Manage suppliers and their categories/subcategories
              </p>
              <div className="sms-user-role-badge">
                Logged in as:{" "}
                <span className={`sms-role-${userRole.toLowerCase()}`}>
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          <div className="sms-nav-buttons">
            <button
              className={`sms-nav-button ${
                activeTab === "add" ? "sms-active" : ""
              }`}
              onClick={() => handleTabChange("add")}
            >
              Add Supplier
            </button>
            <button
              className={`sms-nav-button ${
                activeTab === "view" ? "sms-active" : ""
              }`}
              onClick={() => handleTabChange("view")}
            >
              View Suppliers
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="sms-content">
        {activeTab === "add" ? (
          <SupplierForm
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            onSubmit={handleSubmit}
            saving={saving}
          />
        ) : (
          <SupplierList
            suppliers={suppliers}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleSupplierStatus={toggleSupplierStatus}
            isAdmin={isAdmin}
            refreshSuppliers={fetchSuppliers}
          />
        )}
      </main>

      {/* Modals */}
      {viewModal.isOpen && (
        <SupplierViewModal
          supplier={viewModal.supplier}
          onClose={closeViewModal}
        />
      )}

      {editModal.isOpen && (
        <SupplierEditModal
          editModal={editModal}
          setEditModal={setEditModal}
          closeEditModal={closeEditModal}
          refreshSuppliers={fetchSuppliers}
        />
      )}
    </div>
  );
};

export default SupplierManagement;

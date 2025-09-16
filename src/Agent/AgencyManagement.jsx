import React, { useState, useEffect } from 'react';
import AgencyForm from './AgencyForm';
import AgencyList from './AgencyList';
import AgencyViewModal from './AgencyViewModal';
import AgencyEditModal from './AgencyEditModal';
import './AgencyManagement.css';

const AgencyManagement = () => {
  const [activeTab, setActiveTab] = useState('view');
  const [agencies, setAgencies] = useState([]);
  const [viewModal, setViewModal] = useState({ isOpen: false, agency: null });
  const [editModal, setEditModal] = useState({ isOpen: false, agency: null });
  const [loading, setLoading] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    if (activeTab === 'view') {
      fetchAgencies();
    }
  }, [activeTab]);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://backend.chaloholidayonline.com/api/agency", {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      
      if (response.ok) {
        const transformedAgencies = data.map(agency => ({
          ...agency,
          status: agency.isActive ? 'Active' : 'Inactive'
        }));
        setAgencies(transformedAgencies);
      } else {
        console.error("Failed to fetch agencies:", data);
        alert("Failed to fetch agencies");
      }
    } catch (error) {
      console.error("Error fetching agencies:", error);
      alert("An error occurred while fetching agencies");
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (agency) => {
    setViewModal({ isOpen: true, agency });
  };

  const closeViewModal = () => {
    setViewModal({ isOpen: false, agency: null });
  };

  const openEditModal = (agency) => {
    const editAgency = {
      ...agency,
      countryId: agency.country?.id || null,
      cityId: agency.city?.id || null
    };
    setEditModal({ isOpen: true, agency: editAgency });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, agency: null });
  };

  const toggleAgencyStatus = (id) => {
    setAgencies(agencies.map(agency => 
      agency.id === id 
        ? {...agency, isActive: !agency.isActive, status: agency.isActive ? 'Inactive' : 'Active'} 
        : agency
    ));
  };

  return (
    <div className="agency-management-container ">
      <div className="ag-head">
        <div className="header">
          <h1>Agency Management System</h1>
          <p>Manage your agency registrations and view all agencies in one place</p>
        </div>
        
        <div className="tabs">
          <button 
            className={activeTab === 'add' ? 'tab active' : 'tab'} 
            onClick={() => handleTabChange('add')}
          >
            Add Agency
          </button>
          <button 
            className={activeTab === 'view' ? 'tab active' : 'tab'} 
            onClick={() => handleTabChange('view')}
          >
            View Agencies ({agencies.length})
          </button>
        </div>
      </div>
      
      <div className="tab-content">
        {activeTab === 'add' ? (
          <AgencyForm 
            setActiveTab={setActiveTab}
            setAgencies={setAgencies}
            agencies={agencies}
          />
        ) : (
          <AgencyList
            agencies={agencies}
            loading={loading}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleAgencyStatus={toggleAgencyStatus}
          />
        )}
      </div>

      {viewModal.isOpen && (
        <AgencyViewModal
          viewModal={viewModal}
          closeViewModal={closeViewModal}
        />
      )}

      {editModal.isOpen && (
        <AgencyEditModal
          editModal={editModal}
          closeEditModal={closeEditModal}
          setAgencies={setAgencies}
          agencies={agencies}
        />
      )}
    </div>
  );
};

export default AgencyManagement;
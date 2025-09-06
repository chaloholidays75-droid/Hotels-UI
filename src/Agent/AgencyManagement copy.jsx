import React, { useState } from 'react';
import AgencyAdd from './AgencyAdd';
import AgencyList from './AgencyList';
import AgencyViewModal from './AgencyViewModal';
import AgencyEditModal from './AgencyEditModal';
import './AgencyManagement.css';

const AgencyManagement = () => {
  const [activeTab, setActiveTab] = useState('add');
  const [agencies, setAgencies] = useState([]);
  const [viewModal, setViewModal] = useState({ isOpen: false, agency: null });
  const [editModal, setEditModal] = useState({ isOpen: false, agency: null });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const toggleAgencyStatus = (id) => {
    setAgencies(agencies.map(agency => 
      agency.id === id 
        ? {...agency, status: agency.status === 'Active' ? 'Inactive' : 'Active'} 
        : agency
    ));
  };

  const openViewModal = (agency) => {
    setViewModal({ isOpen: true, agency });
  };

  const closeViewModal = () => {
    setViewModal({ isOpen: false, agency: null });
  };

  const openEditModal = (agency) => {
    setEditModal({ isOpen: true, agency: { ...agency } });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, agency: null });
  };

  const handleEditSubmit = (updatedAgency) => {
    setAgencies(agencies.map(agency => 
      agency.id === updatedAgency.id ? updatedAgency : agency
    ));
    closeEditModal();
  };

  return (
    <div className="agency-management-container">
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
          <AgencyAdd 
            setAgencies={setAgencies}
            agencies={agencies}
            setActiveTab={setActiveTab}
          />
        ) : (
          <AgencyList 
            agencies={agencies}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleAgencyStatus={toggleAgencyStatus}
          />
        )}
      </div>

      <AgencyViewModal 
        viewModal={viewModal}
        closeViewModal={closeViewModal}
      />

      <AgencyEditModal 
        editModal={editModal}
        closeEditModal={closeEditModal}
        handleEditSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default AgencyManagement;
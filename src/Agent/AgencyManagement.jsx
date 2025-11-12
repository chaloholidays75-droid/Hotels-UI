import React, { useState, useEffect, useContext } from 'react';
import AgencyForm from './AgencyForm';
import AgencyList from './AgencyList';
import AgencyViewModal from './AgencyViewModal';
import AgencyEditModal from './AgencyEditModal';
import './AgencyManagement.css';
import agencyApi from '../api/agencyApi';
import { AuthContext } from '../context/AuthContext';

const AgencyManagement = () => {
  const { user } = useContext(AuthContext);
  const userRole = user?.role || 'employee';
 
  const [activeTab, setActiveTab] = useState('view');
  const [agencies, setAgencies] = useState([]);
  const [viewModal, setViewModal] = useState({ isOpen: false, agency: null });
  const [editModal, setEditModal] = useState({ isOpen: false, agency: null });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    if (activeTab === 'view') {
      fetchAgencies();
    }
  }, [activeTab]);

  const fetchAgencies = async () => {
    try {
      const data = await agencyApi.getAgencies();
      const transformedAgencies = data.map(agency => ({
        ...agency,
        status: agency.isActive ? 'Active' : 'Inactive'
      }));
      setAgencies(transformedAgencies);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      alert("Failed to fetch agencies");
    }
  };

  const openViewModal = (agency) => {
    setViewModal({ isOpen: true, agency });
  };

  const closeViewModal = () => {
    setViewModal({ isOpen: false, agency: null });
  };

  const openEditModal = (agency) => {
    if (userRole.toLowerCase() !== 'admin') {
      alert("You do not have permission to edit agencies.");
      return;
    }
    
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

  const toggleAgencyStatus = async (id) => {
    if (userRole.toLowerCase() !== 'admin') {
      alert("You do not have permission to change agency status.");
      return;
    }

    const agency = agencies.find(a => a.id === id);
    if (!agency) return;

    const newStatus = !agency.isActive;

    setAgencies(prevAgencies =>
      prevAgencies.map(a =>
        a.id === id
          ? { ...a, isActive: newStatus, status: newStatus ? 'Active' : 'Inactive' }
          : a
      )
    );

    try {
      await agencyApi.updateAgencyStatus(id, newStatus);
      alert(`Agency ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error('Error updating agency status:', err);
      alert('Failed to update agency status');

      setAgencies(prev => prev.map(a =>
        a.id === id ? { ...a, isActive: agency.isActive, status: agency.isActive ? 'Active' : 'Inactive' } : a
      ));
    }
  };

  const isAdmin = userRole.toLowerCase() === 'admin';

  return (
    <div className="ams-page-content">
      {/* Compact Header */}
      <header className="ams-system-header">
        <div className="ams-header-content">
          <div className="ams-header-main">
            <div className="ams-header-texttitle">
            <h1 className="ams-header-title">Agency Management</h1>
            <p className="ams-header-subtitle">Manage agency profiles, staff, and business details</p>
              <div className="sms-user-role-badge">
                Logged in as:{" "}
                <span className={`sms-role-${userRole.toLowerCase()}`}>
                  {userRole}
                </span>
              </div>
            </div>
  
            <div className="ams-header-info">

              {/*  */}
            </div>
          </div>
          
          <div className="ams-nav-buttons">
            <button 
              className={`ams-nav-button ${activeTab === 'add' ? 'ams-active' : ''}`} 
              onClick={() => handleTabChange('add')}
            >
              Add Agency
            </button>
            <button 
              className={`ams-nav-button ${activeTab === 'view' ? 'ams-active' : ''}`} 
              onClick={() => handleTabChange('view')}
            >
              View Agencies
            </button>
          </div>
        </div>
      </header>
      
      {/* Content Area */}
      <main className="ams-content">
        {activeTab === 'add' ? (
          <AgencyForm 
            setActiveTab={setActiveTab}
            refreshAgencies={fetchAgencies}
          />
        ) : (
          <AgencyList
            agencies={agencies}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleAgencyStatus={toggleAgencyStatus}
            isAdmin={isAdmin}
            refreshAgencies={fetchAgencies}
          />
        )}
      </main>

      {/* Modals */}
      {viewModal.isOpen && (
        <AgencyViewModal
          viewModal={viewModal}
          closeViewModal={closeViewModal}
        />
      )}

      {editModal.isOpen && (
        <AgencyEditModal
          editModal={editModal}
          setEditModal={setEditModal}  
          closeEditModal={closeEditModal}
          setAgencies={setAgencies}
          refreshAgencies={fetchAgencies}
        />
      )}
    </div>
  );
};

export default AgencyManagement;
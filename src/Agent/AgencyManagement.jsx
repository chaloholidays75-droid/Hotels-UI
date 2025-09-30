import React, { useState, useEffect , useContext } from 'react';
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
  const [loading, setLoading] = useState(false);
  


  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  useEffect(() => {
    if (activeTab === 'view') {
      fetchAgencies();
    }
  }, [activeTab]);

  // const fetchAgencies = async () => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch("https://backend.chaloholidayonline.com/api/agency", {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" }
  //     });
  //     const data = await response.json();
      
  //     if (response.ok) {
  //       const transformedAgencies = data.map(agency => ({
  //         ...agency,
  //         status: agency.isActive ? 'Active' : 'Inactive'
  //       }));
  //       setAgencies(transformedAgencies);
  //     } else {
  //       console.error("Failed to fetch agencies:", data);
  //       alert("Failed to fetch agencies");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching agencies:", error);
  //     alert("An error occurred while fetching agencies");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchAgencies = async () => {
  setLoading(true);
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

  // Optimistically update the UI
  setAgencies(prevAgencies =>
    prevAgencies.map(a =>
      a.id === id
        ? { ...a, isActive: newStatus, status: newStatus ? 'Active' : 'Inactive' }
        : a
    )
  );

  // try {
  //   const response = await fetch(`https://backend.chaloholidayonline.com/api/agency/${id}/status`, {
  //     method: 'PATCH',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ isActive: newStatus })
  //   });
  //   console.log("PATCH body:", {isActive: newStatus });

  //   if (response.ok) {
  //     alert(`Agency ${newStatus ? 'activated' : 'deactivated'} successfully!`);
  //   } else {
  //     let errorMessage = 'Unknown error';
  //     try {
  //       const errorData = await response.json();
  //       errorMessage = errorData.message || errorMessage;
  //     } catch {}
  //     alert(`Failed to update agency status: ${errorMessage}`);

  //     // Rollback UI on failure
  //     setAgencies(prevAgencies =>
  //       prevAgencies.map(a =>
  //         a.id === id
  //           ? { ...a, isActive: agency.isActive, status: agency.isActive ? 'Active' : 'Inactive' }
  //           : a
  //       )
  //     );
  //   }
  // } catch (err) {
  //   console.error('Error updating agency status:', err);
  //   alert('An error occurred while updating agency status');

  //   // Rollback UI on error
  //   setAgencies(prevAgencies =>
  //     prevAgencies.map(a =>
  //       a.id === id
  //         ? { ...a, isActive: agency.isActive, status: agency.isActive ? 'Active' : 'Inactive' }
  //         : a
  //     )
  //   );
  // }
      try {
      await agencyApi.updateAgencyStatus(id, newStatus);
      alert(`Agency ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error('Error updating agency status:', err);
      alert('Failed to update agency status');

      // Rollback on error
      setAgencies(prev => prev.map(a =>
        a.id === id ? { ...a, isActive: agency.isActive, status: agency.isActive ? 'Active' : 'Inactive' } : a
      ));
    }

};


  const isAdmin = userRole.toLowerCase() === 'admin';

  return (
    <div className="agency-management-container ">
      <div className="ag-head">
        <div className="header">
          <h1>Agency Management System</h1>
          <p>Manage your agency registrations and view all agencies in one place</p>
          <div className="user-role-badge">
            Logged in as: <span className={`role-${userRole.toLowerCase()}`}>{userRole}</span>
          </div>
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
            refreshAgencies={fetchAgencies}
          />
        ) : (
          <AgencyList
            agencies={agencies}
            loading={loading}
            openViewModal={openViewModal}
            openEditModal={openEditModal}
            toggleAgencyStatus={toggleAgencyStatus}
            isAdmin={isAdmin}
            refreshAgencies={fetchAgencies} // Add refresh function
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
            setEditModal={setEditModal}  
            closeEditModal={closeEditModal}
            setAgencies={setAgencies}
            agencies={agencies}
            refreshAgencies={fetchAgencies} // Add refresh function
          />
      )}
    </div>
  );
};

export default AgencyManagement;
import React from 'react';
import * as XLSX from 'xlsx';
import AgencyListSkeleton from '../components/AgencyListSkeleton';

const AgencyList = ({ 
  agencies, 
  loading, 
  openViewModal, 
  openEditModal, 
  toggleAgencyStatus,
  isAdmin 
}) => {
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(agencies.map(agency => ({
      'Agency Name': agency.agencyName,
      'Country': agency.country?.name || 'N/A',
      'City': agency.city?.name || 'N/A',
      'Post Code': agency.postCode,
      'Address': agency.address,
      'Phone': agency.phoneNo,
      'Email': agency.emailId,
      'Currency': agency.businessCurrency,
      'Contact Person': `${agency.firstName} ${agency.lastName}`,
      'Designation': agency.designation,
      'User Email': agency.userEmailId,
      'Mobile': agency.mobileNo,
      'Status': agency.status,
      'Registered On': agency.createdAt
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agencies');
    XLSX.writeFile(workbook, 'agencies.xlsx');
  };

  const printAgencies = () => {
    const printContent = `
      <html>
        <head>
          <title>Agencies List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-active { color: green; font-weight: bold; }
            .status-inactive { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Agencies List</h1>
          <table>
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>Country</th>
                <th>City</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${agencies.map(agency => `
                <tr>
                  <td>${agency.agencyName}</td>
                  <td>${agency.country}</td>
                  <td>${agency.city}</td>
                  <td>${agency.firstName} ${agency.lastName}</td>
                  <td>${agency.phoneNo}</td>
                  <td>${agency.emailId}</td>
                  <td class="status-${agency.status.toLowerCase()}">${agency.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="margin-top: 20px; text-align: center;">
            Generated on ${new Date().toLocaleDateString()}
          </p>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (loading) {
    return <AgencyListSkeleton rowCount={5} mode="table" />;
  }

  return (
    <div className="agencies-list">
      <div className="list-header">
        <h2 className="section-title">Registered Agencies</h2>
        {!isAdmin && (
          <div className="view-only-notice">
            🔒 View Only Mode - Read-only access
          </div>
        )}
        <div className="action-buttons">
          <button className="action-btn export" onClick={exportToExcel}>
            Export to Excel
          </button>
          <button className="action-btn print" onClick={printAgencies}>
            Print
          </button>
        </div>
      </div>
      
      {agencies.length === 0 ? (
        <div className="empty-state">
          <p>No agencies registered yet.</p>
          {isAdmin && (
            <button className="secondary-button" onClick={() => handleTabChange('add')}>
              Add Your First Agency
            </button>
          )}
        </div>
      ) : (
        <div className="agencies-table-container">
          <table className="agencies-table">
            <thead>
              <tr>
                <th>Agency Name</th>
                <th>Country</th>
                <th>City</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map(agency => (
                <tr key={agency.id} className={agency.status === 'Inactive' ? 'inactive' : 'Active'}>
                  <td>{agency.agencyName}</td>
                  <td>{agency.country?.name || 'N/A'}</td>
                  <td>{agency.city?.name || 'N/A'}</td>
                  <td>{agency.firstName} {agency.lastName}</td>
                  <td>{agency.phoneNo}</td>
                  <td>{agency.emailId}</td>
                  <td>
                    <span className={`status-indicator ${agency.isActive === 'Active' ? 'active' : 'inactive'}`}>
                      {agency.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn view" onClick={() => openViewModal(agency)}>
                        View
                      </button>
                      
                      {isAdmin ? (
                        <>
                          <button className="action-btn edit" onClick={() => openEditModal(agency)}>
                            Edit
                          </button>
                          <button 
                            className={`toggle-btn ${agency.isActive ? 'active' : 'inactive'}`}
                            onClick={() => toggleAgencyStatus(agency.id)}
                          >
                            {agency.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      ) : (
                        <button className="action-btn disabled" disabled title="Admin permission required">
                          🔒
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgencyList;
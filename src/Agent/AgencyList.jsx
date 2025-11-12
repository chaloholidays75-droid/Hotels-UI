import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import AgencyListSkeleton from '../components/AgencyListSkeleton';
import './AgencyList.css';

const AgencyList = ({ 
  agencies, 
  loading, 
  openViewModal, 
  openEditModal, 
  toggleAgencyStatus,
  isAdmin,
  refreshAgencies,
  handleTabChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debug: Log the agencies data
  useEffect(() => {
    console.log('Agencies data:', agencies);
    console.log('Loading state:', loading);
    console.log('Number of agencies:', agencies?.length);
  }, [agencies, loading]);

  // Filter and search agencies
  const filteredAgencies = useMemo(() => {
    return agencies.filter(agency => {
      const matchesSearch = 
        agency.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.country?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.city?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${agency.firstName} ${agency.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && agency.isActive) ||
        (statusFilter === 'inactive' && !agency.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [agencies, searchTerm, statusFilter]);

  // Sort agencies
  const sortedAgencies = useMemo(() => {
    if (!sortConfig.key) return filteredAgencies;

    return [...filteredAgencies].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'country') {
        aValue = a.country?.name;
        bValue = b.country?.name;
      } else if (sortConfig.key === 'city') {
        aValue = a.city?.name;
        bValue = b.city?.name;
      } else if (sortConfig.key === 'contactPerson') {
        aValue = `${a.firstName} ${a.lastName}`;
        bValue = `${b.firstName} ${b.lastName}`;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredAgencies, sortConfig]);

  // Pagination
  const paginatedAgencies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAgencies.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAgencies, currentPage]);

  const totalPages = Math.ceil(sortedAgencies.length / itemsPerPage);

  // Sort handler
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Export to Excel
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
      'Status': agency.isActive ? 'Active' : 'Inactive',
      'Registered On': new Date(agency.createdAt).toLocaleDateString()
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agencies');
    XLSX.writeFile(workbook, `agencies_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Enhanced print function
  const printAgencies = () => {
    const printContent = `
      <html>
        <head>
          <title>Agencies List</title>
          <style>
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
              margin: 40px; 
              color: #333;
              line-height: 1.4;
            }
            .print-header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #7269ef;
              padding-bottom: 20px;
            }
            .print-header h1 { 
              color: #7269ef; 
              margin: 0;
              font-size: 28px;
            }
            .print-meta {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 14px;
              color: #666;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              font-size: 14px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f8f9fa; 
              font-weight: 600;
              color: #495057;
            }
            .status-active { 
              color: #28a745; 
              font-weight: 600;
            }
            .status-inactive { 
              color: #dc3545; 
              font-weight: 600;
            }
            .print-footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Agencies List</h1>
            <div class="print-meta">
              <span>Total Agencies: ${agencies.length}</span>
              <span>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
            </div>
          </div>
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
                  <td>${agency.country?.name || 'N/A'}</td>
                  <td>${agency.city?.name || 'N/A'}</td>
                  <td>${agency.firstName} ${agency.lastName}</td>
                  <td>${agency.phoneNo}</td>
                  <td>${agency.emailId}</td>
                  <td class="status-${agency.isActive ? 'active' : 'inactive'}">
                    ${agency.isActive ? 'Active' : 'Inactive'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="print-footer">
            Confidential - For internal use only
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (loading) {
    return <AgencyListSkeleton rowCount={10} mode="table" />;
  }

  return (
    <div className="agency-list-container">
      {/* Header Section */}
      <div className="agency-list-header">
        <div className="agency-list-header-main">
          <div className="agency-list-title-section">
            <h2 className="agency-list-title">Registered Agencies</h2>
            <span className="agency-list-count">{agencies.length} agencies</span>
          </div>
          {!isAdmin && (
            <div className="agency-list-view-only">
              <fml-icon name="lock-closed-outline" className="agency-list-lock-icon"></fml-icon>
              View Only Mode
            </div>
          )}
        </div>

        <div className="agency-list-actions">
          <div className="agency-list-action-group">
            <button 
              className="agency-list-btn agency-list-refresh-btn" 
              onClick={refreshAgencies}
              title="Refresh data"
            >
              <fml-icon name="refresh-outline" className="agency-list-btn-icon"></fml-icon>
              Refresh
            </button>
            
            <button className="agency-list-btn agency-list-export-btn" onClick={exportToExcel}>
              <fml-icon name="download-outline" className="agency-list-btn-icon"></fml-icon>
              Export to Excel
            </button>

            <button className="agency-list-btn agency-list-print-btn" onClick={printAgencies}>
              <fml-icon name="print-outline" className="agency-list-btn-icon"></fml-icon>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="agency-list-filters">
        <div className="agency-list-search">
          <fml-icon name="search-outline" className="agency-list-search-icon"></fml-icon>
          <input
            type="text"
            placeholder="Search agencies, countries, cities, emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="agency-list-search-input"
          />
          {searchTerm && (
            <button 
              className="agency-list-clear-search"
              onClick={() => setSearchTerm('')}
            >
              <fml-icon name="close-outline"></fml-icon>
            </button>
          )}
        </div>

        <div className="agency-list-filter-group">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="agency-list-filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Results Info */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="agency-list-results-info">
          Showing {filteredAgencies.length} of {agencies.length} agencies
          {(searchTerm || statusFilter !== 'all') && (
            <button 
              className="agency-list-clear-filters"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Agencies Table */}
      {agencies.length === 0 ? (
        <div className="agency-list-empty">
          <div className="agency-list-empty-icon">
            <fml-icon name="business-outline"></fml-icon>
          </div>
          <h3>No Agencies Found</h3>
          <p>There are no agencies registered in the system yet.</p>
          {isAdmin && (
            <button className="agency-list-primary-btn" onClick={() => handleTabChange('add')}>
              Add Your First Agency
            </button>
          )}
        </div>
      ) : filteredAgencies.length === 0 ? (
        <div className="agency-list-empty">
          <div className="agency-list-empty-icon">
            <fml-icon name="search-outline"></fml-icon>
          </div>
          <h3>No Matching Agencies</h3>
          <p>Try adjusting your search or filters to find what you're looking for.</p>
          <button 
            className="agency-list-secondary-btn"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="agency-list-table-container">
            <table className="agency-list-table">
              <thead>
                <tr>
                  <th 
                    className="agency-list-sortable-header"
                    onClick={() => handleSort('agencyName')}
                  >
                    Agency Name
                    {sortConfig.key === 'agencyName' && (
                      <fml-icon 
                        name={sortConfig.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} 
                        className="agency-list-sort-icon"
                      ></fml-icon>
                    )}
                  </th>
                  <th 
                    className="agency-list-sortable-header"
                    onClick={() => handleSort('country')}
                  >
                    Country
                    {sortConfig.key === 'country' && (
                      <fml-icon 
                        name={sortConfig.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} 
                        className="agency-list-sort-icon"
                      ></fml-icon>
                    )}
                  </th>
                  <th 
                    className="agency-list-sortable-header"
                    onClick={() => handleSort('city')}
                  >
                    City
                    {sortConfig.key === 'city' && (
                      <fml-icon 
                        name={sortConfig.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} 
                        className="agency-list-sort-icon"
                      ></fml-icon>
                    )}
                  </th>
                  <th 
                    className="agency-list-sortable-header"
                    onClick={() => handleSort('contactPerson')}
                  >
                    Contact Person
                    {sortConfig.key === 'contactPerson' && (
                      <fml-icon 
                        name={sortConfig.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} 
                        className="agency-list-sort-icon"
                      ></fml-icon>
                    )}
                  </th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th 
                    className="agency-list-sortable-header"
                    onClick={() => handleSort('isActive')}
                  >
                    Status
                    {sortConfig.key === 'isActive' && (
                      <fml-icon 
                        name={sortConfig.direction === 'asc' ? 'arrow-up-outline' : 'arrow-down-outline'} 
                        className="agency-list-sort-icon"
                      ></fml-icon>
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAgencies.map(agency => (
                  <tr 
                    key={agency.id} 
                    className={`agency-list-row ${!agency.isActive ? 'agency-list-row-inactive' : ''}`}
                  >
                    <td className="agency-list-name-cell">
                      <span className="agency-list-name">{agency.agencyName}</span>
                    </td>
                    <td>
                      <span className="agency-list-country">{agency.country?.name || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="agency-list-city">{agency.city?.name || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="agency-list-contact">
                        <span className="agency-list-contact-name">{agency.firstName} {agency.lastName}</span>
                        {agency.designation && (
                          <span className="agency-list-designation">{agency.designation}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="agency-list-phone">
                        <span className="agency-list-phone-number">{agency.phoneNo}</span>
                        {agency.mobileNo && agency.mobileNo !== agency.phoneNo && (
                          <span className="agency-list-mobile">M: {agency.mobileNo}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="agency-list-email">
                        <a href={`mailto:${agency.emailId}`} className="agency-list-email-link">
                          {agency.emailId}
                        </a>
                        {agency.userEmailId && agency.userEmailId !== agency.emailId && (
                          <span className="agency-list-user-email">User: {agency.userEmailId}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={`agency-list-status ${agency.isActive ? 'agency-list-status-active' : 'agency-list-status-inactive'}`}>
                        <span className="agency-list-status-dot"></span>
                        {agency.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>
                    <td>
                      <div className="agency-list-row-actions">
                        <button 
                          className="agency-list-action-btn agency-list-view-btn"
                          onClick={() => openViewModal(agency)}
                          title="View details"
                        >
                          <fml-icon name="eye-outline"></fml-icon>
                        </button>
                        
                        {isAdmin ? (
                          <>
                            <button 
                              className="agency-list-action-btn agency-list-edit-btn"
                              onClick={() => openEditModal(agency)}
                              title="Edit agency"
                            >
                              <fml-icon name="create-outline"></fml-icon>
                            </button>
                            <button 
                              className={`agency-list-action-btn agency-list-status-btn ${agency.isActive ? 'agency-list-status-btn-deactivate' : 'agency-list-status-btn-activate'}`}
                              onClick={() => toggleAgencyStatus(agency.id)}
                              title={agency.isActive ? 'Deactivate agency' : 'Activate agency'}
                            >
                              <fml-icon name={agency.isActive ? 'pause-outline' : 'play-outline'}></fml-icon>
                            </button>
                          </>
                        ) : (
                          <button 
                            className="agency-list-action-btn agency-list-disabled-btn"
                            disabled 
                            title="Admin permission required"
                          >
                            <fml-icon name="lock-closed-outline"></fml-icon>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="agency-list-pagination">
              <button 
                className="agency-list-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <fml-icon name="chevron-back-outline" className="agency-list-pagination-icon"></fml-icon>
                Previous
              </button>
              
              <div className="agency-list-pagination-pages">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`agency-list-pagination-page ${currentPage === pageNum ? 'agency-list-pagination-page-active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                className="agency-list-pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <fml-icon name="chevron-forward-outline" className="agency-list-pagination-icon"></fml-icon>
              </button>

              <div className="agency-list-pagination-info">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AgencyList;
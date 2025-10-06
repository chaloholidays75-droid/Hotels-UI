import React, { useState } from 'react';
import HotelListSkeleton from '../components/HotelListSkeleton';
import * as XLSX from 'xlsx';
import { 
  FaSearch, FaFilter, FaSortUp, FaSortDown, FaEye, 
  FaEdit, FaToggleOn, FaToggleOff, FaPlus, FaEllipsisV, FaTimes,
  FaCheckCircle, FaExclamationTriangle, FaSync, FaBan, FaLock,
  FaFileExcel, FaPrint, FaRedo, FaMapMarkerAlt, FaEnvelope, FaPhone, 
  FaUserTie, FaClipboardList, FaMoneyCheckAlt, FaReceipt, FaConciergeBell
} from 'react-icons/fa';
import './viewhotel.css';

const HotelSalesList = ({ 
  hotels, 
  loading,
  showNotification, 
  openViewModal, 
  openEditModal, 
  toggleHotelStatus,
  userRole 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('hotelName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedHotels, setSelectedHotels] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const itemsPerPage = 10;

  // Check if user is admin
  const isAdmin = userRole === 'Admin';

  // Format contact persons for export
  const formatContactPersons = (persons, type) => {
    if (!persons || persons.length === 0) return 'No contacts';
    
    return persons.map(person => 
      `${person.name || 'N/A'} (Email: ${person.email || 'N/A'}, Phone: ${person.contact || 'N/A'})`
    ).join('; ');
  };

  // Export to Excel functionality with all details
  const exportToExcel = () => {
    const dataToExport = filteredHotels.map(hotel => ({
      'Hotel Name': hotel.hotelName || 'No Name Provided',
      'Hotel Chain': hotel.hotelChain || 'N/A',
      'Address': hotel.address || 'N/A',
      'City': hotel.city || 'N/A',
      'Country': hotel.country || 'N/A',
      'Contact Number': hotel.hotelContactNumber || 'N/A',
      'Hotel Email': hotel.hotelEmail || 'N/A',
      'Status': hotel.isActive ? 'Active' : 'Inactive',
      
      // Sales Persons
      'Sales Persons Count': hotel.salesPersons?.length || 0,
      'Sales Persons Details': formatContactPersons(hotel.salesPersons, 'Sales'),
      
      // Reservation Persons
      'Reservation Persons Count': hotel.reservationPersons?.length || 0,
      'Reservation Persons Details': formatContactPersons(hotel.reservationPersons, 'Reservation'),
      
      // Accounts Persons
      'Accounts Persons Count': hotel.accountsPersons?.length || 0,
      'Accounts Persons Details': formatContactPersons(hotel.accountsPersons, 'Accounts'),
      
      // Reception Persons
      'Reception Persons Count': hotel.receptionPersons?.length || 0,
      'Reception Persons Details': formatContactPersons(hotel.receptionPersons, 'Reception'),
      
      // Concierges
      'Concierges Count': hotel.concierges?.length || 0,
      'Concierges Details': formatContactPersons(hotel.concierges, 'Concierge'),
      
      // Special Remarks
      'Special Remarks': hotel.specialRemarks || 'No remarks'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    
    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Hotel Name
      { wch: 15 }, // Hotel Chain
      { wch: 25 }, // Address
      { wch: 15 }, // City
      { wch: 15 }, // Country
      { wch: 15 }, // Contact Number
      { wch: 20 }, // Hotel Email
      { wch: 10 }, // Status
      { wch: 8 },  // Sales Persons Count
      { wch: 40 }, // Sales Persons Details
      { wch: 8 },  // Reservation Persons Count
      { wch: 40 }, // Reservation Persons Details
      { wch: 8 },  // Accounts Persons Count
      { wch: 40 }, // Accounts Persons Details
      { wch: 8 },  // Reception Persons Count
      { wch: 40 }, // Reception Persons Details
      { wch: 8 },  // Concierges Count
      { wch: 40 }, // Concierges Details
      { wch: 50 }  // Special Remarks
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hotels Detailed Data');
    XLSX.writeFile(workbook, `hotels_detailed_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Print functionality in list/table form
  const printHotels = () => {
    const printContent = `
      <html>
        <head>
          <title>Hotels Detailed List</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
              font-size: 12px;
            }
            h1 { 
              text-align: center; 
              color: #2c3e50;
              margin-bottom: 10px;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            .print-info {
              text-align: center;
              margin-bottom: 20px;
              color: #666;
              font-size: 11px;
            }
            .summary-stats {
              display: flex;
              justify-content: center;
              gap: 20px;
              margin-bottom: 15px;
              flex-wrap: wrap;
            }
            .stat-item {
              background: #f8f9fa;
              padding: 8px 15px;
              border-radius: 5px;
              border: 1px solid #dee2e6;
            }
            .hotels-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .hotels-table th {
              background-color: #2c3e50;
              color: white;
              padding: 10px 8px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #34495e;
            }
            .hotels-table td {
              padding: 8px;
              border: 1px solid #dee2e6;
              vertical-align: top;
            }
            .hotel-row {
              page-break-inside: avoid;
            }
            .hotel-row:nth-child(even) {
              background-color: #f8f9fa;
            }
            .hotel-name {
              font-weight: bold;
              color: #2c3e50;
            }
            .hotel-chain {
              font-size: 10px;
              color: #6c757d;
              margin-top: 2px;
            }
            .hotel-location {
              font-size: 11px;
              color: #6c757d;
              margin-top: 3px;
            }
            .status-badge {
              padding: 3px 8px;
              border-radius: 10px;
              font-size: 10px;
              font-weight: bold;
              display: inline-block;
            }
            .status-active {
              background: #d4edda;
              color: #155724;
            }
            .status-inactive {
              background: #f8d7da;
              color: #721c24;
            }
            .contact-section {
              margin: 5px 0;
            }
            .contact-category {
              margin-bottom: 8px;
            }
            .category-title {
              font-weight: bold;
              color: #495057;
              font-size: 11px;
              margin-bottom: 3px;
              border-bottom: 1px solid #dee2e6;
              padding-bottom: 2px;
            }
            .contact-person {
              margin: 3px 0;
              padding: 3px;
              background: white;
              border-radius: 3px;
              font-size: 10px;
            }
            .contact-name {
              font-weight: bold;
              color: #343a40;
            }
            .contact-details {
              color: #6c757d;
              margin-left: 8px;
            }
            .remarks {
              font-style: italic;
              color: #6c757d;
              background: #f8f9fa;
              padding: 5px;
              border-radius: 3px;
              margin-top: 5px;
              font-size: 11px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #666;
              font-size: 10px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0.5in; }
              .hotel-row { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Hotels Detailed List</h1>
          <div class="print-info">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
          
          <div class="summary-stats">
            <div class="stat-item">Total Hotels: <strong>${filteredHotels.length}</strong></div>
            <div class="stat-item">Active: <strong>${filteredHotels.filter(h => h.isActive).length}</strong></div>
            <div class="stat-item">Inactive: <strong>${filteredHotels.filter(h => !h.isActive).length}</strong></div>
            <div class="stat-item">From Total: <strong>${hotels.length}</strong></div>
          </div>
          
          <table class="hotels-table">
            <thead>
              <tr>
                <th width="15%">Hotel Information</th>
                <th width="8%">Status</th>
                <th width="12%">Basic Contact</th>
                <th width="15%">Sales Contacts</th>
                <th width="15%">Reservation Contacts</th>
                <th width="15%">Accounts Contacts</th>
                <th width="10%">Other Contacts</th>
                <th width="10%">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredHotels.map(hotel => `
                <tr class="hotel-row">
                  <!-- Hotel Information -->
                  <td>
                    <div class="hotel-name">${hotel.hotelName || 'No Name Provided'}</div>
                    ${hotel.hotelChain ? `<div class="hotel-chain">${hotel.hotelChain}</div>` : ''}
                    <div class="hotel-location">
                      ${[hotel.address, hotel.city, hotel.country].filter(Boolean).join(', ') || 'Location not specified'}
                    </div>
                  </td>
                  
                  <!-- Status -->
                  <td>
                    <span class="status-badge status-${hotel.isActive ? 'active' : 'inactive'}">
                      ${hotel.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  
                  <!-- Basic Contact -->
                  <td>
                    ${hotel.hotelContactNumber ? `<div>📞 ${hotel.hotelContactNumber}</div>` : ''}
                    ${hotel.hotelEmail ? `<div>✉️ ${hotel.hotelEmail}</div>` : ''}
                    ${!hotel.hotelContactNumber && !hotel.hotelEmail ? 'No contact info' : ''}
                  </td>
                  
                  <!-- Sales Contacts -->
                  <td>
                    ${hotel.salesPersons && hotel.salesPersons.length > 0 ? `
                      <div class="contact-category">
                        <div class="category-title">Sales (${hotel.salesPersons.length})</div>
                        ${hotel.salesPersons.map(person => `
                          <div class="contact-person">
                            <div class="contact-name">${person.name || 'N/A'}</div>
                            <div class="contact-details">
                              ${person.email ? `📧 ${person.email}` : ''}
                              ${person.contact ? `<br>📞 ${person.contact}` : ''}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : 'No sales contacts'}
                  </td>
                  
                  <!-- Reservation Contacts -->
                  <td>
                    ${hotel.reservationPersons && hotel.reservationPersons.length > 0 ? `
                      <div class="contact-category">
                        <div class="category-title">Reservation (${hotel.reservationPersons.length})</div>
                        ${hotel.reservationPersons.map(person => `
                          <div class="contact-person">
                            <div class="contact-name">${person.name || 'N/A'}</div>
                            <div class="contact-details">
                              ${person.email ? `📧 ${person.email}` : ''}
                              ${person.contact ? `<br>📞 ${person.contact}` : ''}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : 'No reservation contacts'}
                  </td>
                  
                  <!-- Accounts Contacts -->
                  <td>
                    ${hotel.accountsPersons && hotel.accountsPersons.length > 0 ? `
                      <div class="contact-category">
                        <div class="category-title">Accounts (${hotel.accountsPersons.length})</div>
                        ${hotel.accountsPersons.map(person => `
                          <div class="contact-person">
                            <div class="contact-name">${person.name || 'N/A'}</div>
                            <div class="contact-details">
                              ${person.email ? `📧 ${person.email}` : ''}
                              ${person.contact ? `<br>📞 ${person.contact}` : ''}
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    ` : 'No accounts contacts'}
                  </td>
                  
                  <!-- Other Contacts -->
                  <td>
                    ${(hotel.receptionPersons && hotel.receptionPersons.length > 0) || (hotel.concierges && hotel.concierges.length > 0) ? `
                      ${hotel.receptionPersons && hotel.receptionPersons.length > 0 ? `
                        <div class="contact-category">
                          <div class="category-title">Reception (${hotel.receptionPersons.length})</div>
                          ${hotel.receptionPersons.slice(0, 2).map(person => `
                            <div class="contact-person">
                              <div class="contact-name">${person.name || 'N/A'}</div>
                            </div>
                          `).join('')}
                          ${hotel.receptionPersons.length > 2 ? `<div>+${hotel.receptionPersons.length - 2} more</div>` : ''}
                        </div>
                      ` : ''}
                      ${hotel.concierges && hotel.concierges.length > 0 ? `
                        <div class="contact-category">
                          <div class="category-title">Concierge (${hotel.concierges.length})</div>
                          ${hotel.concierges.slice(0, 2).map(person => `
                            <div class="contact-person">
                              <div class="contact-name">${person.name || 'N/A'}</div>
                            </div>
                          `).join('')}
                          ${hotel.concierges.length > 2 ? `<div>+${hotel.concierges.length - 2} more</div>` : ''}
                        </div>
                      ` : ''}
                    ` : 'No other contacts'}
                  </td>
                  
                  <!-- Remarks -->
                  <td>
                    ${hotel.specialRemarks ? `
                      <div class="remarks">${hotel.specialRemarks.length > 100 ? hotel.specialRemarks.substring(0, 100) + '...' : hotel.specialRemarks}</div>
                    ` : 'No remarks'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            Generated by Hotel Management System • ${filteredHotels.length} hotels printed
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Add delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
      // Don't close immediately to allow user to cancel print
      setTimeout(() => {
        printWindow.close();
      }, 500);
    }, 250);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedHotels = [...hotels].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredHotels = sortedHotels.filter(hotel => {
    const matchesSearch = hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry ? hotel.country === filterCountry : true;
    const matchesCity = filterCity ? hotel.city === filterCity : true;
    const matchesStatus = filterStatus === "all" ? true : 
                         filterStatus === "active" ? hotel.isActive : 
                         !hotel.isActive;
    return matchesSearch && matchesCountry && matchesCity && matchesStatus;
  });

  const countries = [...new Set(hotels.map(hotel => hotel.country).filter(Boolean))];
  const cities = [...new Set(hotels.map(hotel => hotel.city).filter(Boolean))];

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);

  const toggleSelectHotel = (id) => {
    // Only allow selection for admin users
    if (!isAdmin) return;
    
    setSelectedHotels(prev => 
      prev.includes(id) 
        ? prev.filter(hotelId => hotelId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    // Only allow selection for admin users
    if (!isAdmin) return;
    
    if (selectedHotels.length === currentHotels.length) {
      setSelectedHotels([]);
    } else {
      setSelectedHotels(currentHotels.map(hotel => hotel.id));
    }
  };

  if (loading) return <HotelListSkeleton rowCount={5} />;

  return (
    <div className="hsl-hotel-sales-list">
      <div className="hsl-card">
        <div className="hsl-header-with-actions">
          <h2 className="section-title">Registered Hotels</h2>
          <div className="hsl-action-buttons">
            <button 
              className="hsl-btn hsl-btn-export" 
              onClick={exportToExcel}
              title="Export All Details to Excel"
            >
              <FaFileExcel /> Export Detailed
            </button>
            <button 
              className="hsl-btn hsl-btn-print" 
              onClick={printHotels}
              title="Print Detailed List"
            >
              <FaPrint /> Print List
            </button>
          </div>
        </div>
        
        {!isAdmin && (
          <div className="hsl-permission-notice">
            <FaLock /> You have view-only access. Only admins can edit or change hotel status.
          </div>
        )}

        <div className="hsl-list-controls">
          <div className="hsl-search-filter-section">
            <div className="hsl-search-box">
              <FaSearch className="hsl-search-icon" />
              <input
                type="text"
                placeholder="Search by hotel, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="hsl-clear-search" onClick={() => setSearchTerm('')}>
                  <FaTimes />
                </button>
              )}
            </div>
            
            <div className="hsl-filter-controls">
              <div className="hsl-filter-group">
                <label>Country</label>
                <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
                  <option value="">All Countries</option>
                  {countries.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>
              
              <div className="hsl-filter-group">
                <label>City</label>
                <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
                  <option value="">All Cities</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              
              <div className="hsl-filter-group">
                <label>Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <button className="hsl-btn hsl-btn-secondary" onClick={() => { 
                setFilterCountry(""); 
                setFilterCity(""); 
                setFilterStatus("all");
                setSearchTerm(""); 
              }}>
                Clear Filters
              </button>
            </div>
          </div>

          {isAdmin && selectedHotels.length > 0 && (
            <div className="hsl-bulk-actions-card">
              <div className="hsl-bulk-header">
                <FaCheckCircle />
                <span>{selectedHotels.length} hotel{selectedHotels.length !== 1 ? 's' : ''} selected</span>
                <button className="hsl-clear-selection" onClick={() => setSelectedHotels([])}>
                  <FaTimes />
                </button>
              </div>
              <div className="hsl-bulk-controls">
                <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                  <option value="">Choose action...</option>
                  <option value="activate">Activate Selected</option>
                  <option value="deactivate">Deactivate Selected</option>
                </select>
                <button 
                  className="hsl-btn hsl-btn-primary" 
                  onClick={() => {
                    if (bulkAction === "activate") {
                      selectedHotels.forEach(id => {
                        const hotel = hotels.find(h => h.id === id);
                        if (hotel && !hotel.isActive) toggleHotelStatus(id, hotel.isActive);
                      });
                    }
                    if (bulkAction === "deactivate") {
                      selectedHotels.forEach(id => {
                        const hotel = hotels.find(h => h.id === id);
                        if (hotel && hotel.isActive) toggleHotelStatus(id, hotel.isActive);
                      });
                    }
                  }}
                  disabled={!bulkAction}
                >
                  Apply Action
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hsl-results-info">
          <div className="hsl-results-count">
            <span className="hsl-results-text">
              Showing <strong>{filteredHotels.length}</strong> of <strong>{hotels.length}</strong> hotels
            </span>
            {filteredHotels.length !== hotels.length && (
              <button 
                className="hsl-btn hsl-btn-text" 
                onClick={() => { 
                  setFilterCountry(""); 
                  setFilterCity(""); 
                  setFilterStatus("all");
                  setSearchTerm(""); 
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
          <div className="hsl-sort-controls">
            <span>Sort by:</span>
            <button 
              className={`hsl-sort-btn ${sortField === 'hotelName' ? 'hsl-active' : ''}`}
              onClick={() => handleSort('hotelName')}
            >
              Name {sortField === 'hotelName' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
            </button>
            <button 
              className={`hsl-sort-btn ${sortField === 'city' ? 'hsl-active' : ''}`}
              onClick={() => handleSort('city')}
            >
              City {sortField === 'city' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
            </button>
            <button 
              className={`hsl-sort-btn ${sortField === 'country' ? 'hsl-active' : ''}`}
              onClick={() => handleSort('country')}
            >
              Country {sortField === 'country' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
            </button>
          </div>
        </div>

        {filteredHotels.length === 0 ? (
          <div className="hsl-no-results">
            <h3>No hotels found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              className="hsl-btn hsl-btn-primary" 
              onClick={() => { 
                setFilterCountry(""); 
                setFilterCity(""); 
                setFilterStatus("all");
                setSearchTerm(""); 
              }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="hsl-hotels-table-container">
              <table className="hsl-hotels-table">
                <thead>
                  <tr>
                    {isAdmin && (
                      <th className="hsl-select-column">
                        <input
                          type="checkbox"
                          checked={selectedHotels.length === currentHotels.length && currentHotels.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th onClick={() => handleSort('hotelName')} className="hsl-sortable-header">
                      <div>
                        <span>Hotel Name</span>
                        {sortField === 'hotelName' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('city')} className="hsl-sortable-header">
                      <div>
                        <span>City</span>
                        {sortField === 'city' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('country')} className="hsl-sortable-header">
                      <div>
                        <span>Country</span>
                        {sortField === 'country' && (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />)}
                      </div>
                    </th>
                    <th>Status</th>
                    <th>Sales Contacts</th>
                    <th>Reservation Contacts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHotels.map(hotel => (
                    <tr key={hotel.id} className={`${selectedHotels.includes(hotel.id) ? 'hsl-selected' : ''} ${!hotel.isActive ? 'hsl-inactive-row' : ''}`}>
                      {isAdmin && (
                        <td className="hsl-select-column">
                          <input
                            type="checkbox"
                            checked={selectedHotels.includes(hotel.id)}
                            onChange={() => toggleSelectHotel(hotel.id)}
                            disabled={!hotel.isActive}
                          />
                        </td>
                      )}
                      <td>
                        <div className="hsl-hotel-name-cell">
                          <div className="hsl-hotel-name">{hotel.hotelName || 'No Name Provided'}</div>
                          {hotel.hotelChain && <div className="hsl-hotel-chain">{hotel.hotelChain}</div>}
                          {!hotel.isActive && (
                            <div className="hsl-inactive-label">
                              <FaBan /> Inactive
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="hsl-city-cell">
                          <span className="hsl-city-name">{hotel.city}</span>
                        </div>
                      </td>
                      <td>
                        <div className="hsl-country-cell">
                          <span className="hsl-country-name">{hotel.country}</span>
                        </div>
                      </td>
                      <td>
                        <div className="hsl-status-cell">
                          <span className={`hsl-status-badge ${hotel.isActive ? 'hsl-active' : 'hsl-inactive'}`}>
                            {hotel.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="hsl-contact-info">
                          <div className="hsl-contact-count">
                            {hotel.salesPersons.length} {hotel.salesPersons.length === 1 ? 'contact' : 'contacts'}
                          </div>
                          {hotel.salesPersons.length > 0 && (
                            <div className="hsl-contact-preview">
                              {hotel.salesPersons[0].name}
                              {hotel.salesPersons.length > 1 && ` +${hotel.salesPersons.length - 1}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="hsl-contact-info">
                          <div className="hsl-contact-count">
                            {hotel.reservationPersons?.length || 0} {hotel.reservationPersons?.length === 1 ? 'contact' : 'contacts'}
                          </div>
                          {hotel.reservationPersons?.length > 0 && (
                            <div className="hsl-contact-preview">
                              {hotel.reservationPersons[0].name}
                              {hotel.reservationPersons.length > 1 && ` +${hotel.reservationPersons.length - 1}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="hsl-action-buttons">
                          <button 
                            className="hsl-btn-icon hsl-view-btn" 
                            onClick={() => openViewModal(hotel)} 
                            title="View details"
                          >
                            <FaEye />
                          </button>
                          
                          {isAdmin ? (
                            <>
                              <button 
                                className={`hsl-btn-icon hsl-edit-btn ${!hotel.isActive ? 'hsl-disabled' : ''}`} 
                                onClick={() => openEditModal(hotel)} 
                                title={hotel.isActive ? "Edit" : "Cannot edit inactive hotels"}
                                disabled={!hotel.isActive}
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className={`hsl-btn-icon hsl-status-btn ${hotel.isActive ? 'hsl-active' : 'hsl-inactive'}`} 
                                onClick={() => toggleHotelStatus(hotel.id, hotel.isActive)} 
                                title={hotel.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {hotel.isActive ? <FaToggleOn /> : <FaToggleOff />}
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="hsl-btn-icon hsl-edit-btn hsl-disabled" 
                                title="Only admins can edit hotels"
                                disabled
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="hsl-btn-icon hsl-status-btn hsl-disabled" 
                                title="Only admins can change status"
                                disabled
                              >
                                <FaLock />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="hsl-table-footer">
              <div className="hsl-rows-info">
                Showing {indexOfFirst + 1} to {Math.min(indexOfLast, filteredHotels.length)} of {filteredHotels.length} entries
              </div>
              <div className="hsl-pagination">
                <button 
                  className="hsl-pagination-btn"
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <div className="hsl-page-numbers">
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
                        className={currentPage === pageNum ? 'hsl-pagination-btn hsl-active' : 'hsl-pagination-btn'}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="hsl-pagination-ellipsis">...</span>}
                </div>
                <button 
                  className="hsl-pagination-btn"
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HotelSalesList;
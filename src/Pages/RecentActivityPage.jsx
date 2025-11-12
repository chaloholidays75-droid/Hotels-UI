import React, { useEffect, useState, useMemo } from "react";
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaClock, 
  FaSearch, 
  FaFilter,
  FaDownload,
  FaSync,
  FaEye,
  FaSort,
  FaSortUp,
  FaSortDown
} from "react-icons/fa";
import { getAllActivities } from "../api/recentApi";
import "./RecentActivitiesPage.css";

export default function RecentActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [selectedActionTypes, setSelectedActionTypes] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(0);

  // Available action types for filtering
  const actionTypes = ['INSERT', 'UPDATE', 'DELETE'];

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getAllActivities();
      const list = Array.isArray(result?.data) ? result.data : result;
      setActivities(list);
    } catch (err) {
      console.error("Failed to fetch recent activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh feature
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Filtering and sorting logic
  useMemo(() => {
    let result = activities;

    // Search filter
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.userName?.toLowerCase().includes(lower) ||
          a.tableName?.toLowerCase().includes(lower) ||
          a.description?.toLowerCase().includes(lower)
      );
    }

    // Action type filter
    if (selectedActionTypes.length > 0) {
      result = result.filter(a => selectedActionTypes.includes(a.actionType));
    }

    // Sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFiltered(result);
    setPage(1);
  }, [activities, search, selectedActionTypes, sortConfig]);

  // Pagination logic
  const start = (page - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Feature 1: Sorting handler
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Feature 2: Row selection
  const toggleRowSelection = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Feature 3: Select all rows
  const toggleSelectAll = () => {
    if (selectedRows.size === paginated.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginated.map(item => item.id)));
    }
  };

  // Feature 4: Export selected data
  const exportSelectedData = () => {
    const dataToExport = activities.filter(item => selectedRows.has(item.id));
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Feature 5: Show full description
  const showFullDescription = (description) => {
    setSelectedDescription(description);
    setShowDescriptionModal(true);
  };

  // Feature 6: Action type filter toggle
  const toggleActionType = (type) => {
    setSelectedActionTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case "INSERT":
        return <FaPlus className="recent-activities-icon-insert" />;
      case "UPDATE":
        return <FaEdit className="recent-activities-icon-update" />;
      case "DELETE":
        return <FaTrash className="recent-activities-icon-delete" />;
      default:
        return <FaClock className="recent-activities-icon-default" />;
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="recent-activities-sort-icon" />;
    return sortConfig.direction === 'asc' 
      ? <FaSortUp className="recent-activities-sort-icon recent-activities-sort-icon-active" /> 
      : <FaSortDown className="recent-activities-sort-icon recent-activities-sort-icon-active" />;
  };

  return (
    <div className="recent-activities-page-container">
      {/* Header Section */}
      <div className="recent-activities-header">
        <div className="recent-activities-header-left">
          <h2 className="recent-activities-page-title">Recent Activities</h2>
          <span className="recent-activities-activity-count">{filtered.length} activities</span>
        </div>
        
        <div className="recent-activities-header-controls">
          {/* Feature 7: Auto-refresh dropdown */}
          <div className="recent-activities-refresh-control">
            <label>Auto-refresh:</label>
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="recent-activities-refresh-select"
            >
              <option value={0}>Off</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>

          <button 
            onClick={fetchData} 
            className="recent-activities-btn-secondary"
            disabled={loading}
          >
            <FaSync className={loading ? "recent-activities-spin" : ""} />
            Refresh
          </button>

          {selectedRows.size > 0 && (
            <button onClick={exportSelectedData} className="recent-activities-btn-primary">
              <FaDownload />
              Export Selected ({selectedRows.size})
            </button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="recent-activities-filters-section">
        <div className="recent-activities-search-box">
          <FaSearch className="recent-activities-search-icon" />
          <input
            type="text"
            placeholder="Search by user, table or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="recent-activities-action-filters">
          <span className="recent-activities-filter-label">Filter by action:</span>
          {actionTypes.map(type => (
            <button
              key={type}
              className={`recent-activities-filter-chip ${selectedActionTypes.includes(type) ? 'recent-activities-filter-chip-active' : ''}`}
              onClick={() => toggleActionType(type)}
            >
              {getIcon(type)}
              {type}
            </button>
          ))}
          {selectedActionTypes.length > 0 && (
            <button 
              className="recent-activities-clear-filters"
              onClick={() => setSelectedActionTypes([])}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="recent-activities-loading-state">
          <div className="recent-activities-spinner"></div>
          <p>Loading activities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="recent-activities-empty-state">
          <FaFilter className="recent-activities-empty-icon" />
          <h3>No activities found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="recent-activities-table-wrapper">
          <table className="recent-activities-table">
            <thead>
              <tr>
                <th className="recent-activities-select-column">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginated.length && paginated.length > 0}
                    onChange={toggleSelectAll}
                    indeterminate={selectedRows.size > 0 && selectedRows.size < paginated.length}
                  />
                </th>
                <th onClick={() => handleSort('userName')} className="recent-activities-sortable">
                  User {getSortIcon('userName')}
                </th>
                <th onClick={() => handleSort('actionType')} className="recent-activities-sortable">
                  Action {getSortIcon('actionType')}
                </th>
                <th onClick={() => handleSort('tableName')} className="recent-activities-sortable">
                  Table {getSortIcon('tableName')}
                </th>
                <th>Description</th>
                <th onClick={() => handleSort('timestamp')} className="recent-activities-sortable">
                  Time {getSortIcon('timestamp')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((activity) => (
                <tr 
                  key={activity.id} 
                  className={selectedRows.has(activity.id) ? 'recent-activities-row-selected' : ''}
                >
                  <td className="recent-activities-select-column">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(activity.id)}
                      onChange={() => toggleRowSelection(activity.id)}
                    />
                  </td>
                  <td className="recent-activities-user-cell">
                    <div className="recent-activities-user-avatar">
                      {activity.userName?.charAt(0).toUpperCase()}
                    </div>
                    {activity.userName}
                  </td>
                  <td>
                    <div className="recent-activities-action-cell">
                      <span className="recent-activities-action-icon">{getIcon(activity.actionType)}</span>
                      <span className={`recent-activities-action-tag recent-activities-action-${activity.actionType?.toLowerCase()}`}>
                        {activity.actionType}
                      </span>
                    </div>
                  </td>
                  <td className="recent-activities-table-cell">{activity.tableName}</td>
                  <td className="recent-activities-description-cell">
                    <div className="recent-activities-description-content">
                      <span className="recent-activities-truncated-text">{activity.description}</span>
                      {activity.description && activity.description.length > 60 && (
                        <button 
                          className="recent-activities-view-more-btn"
                          onClick={() => showFullDescription(activity.description)}
                        >
                          <FaEye />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="recent-activities-time-cell">
                    <div className="recent-activities-time-ago">{activity.timeAgo}</div>
                    {activity.timestamp && (
                      <div className="recent-activities-timestamp">{new Date(activity.timestamp).toLocaleString()}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="recent-activities-pagination-section">
            <div className="recent-activities-pagination-info">
              Showing {start + 1}-{Math.min(start + itemsPerPage, filtered.length)} of {filtered.length}
            </div>
            
            <div className="recent-activities-pagination-controls">
              <div className="recent-activities-items-per-page">
                <label>Items per page:</label>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="recent-activities-pagination-buttons">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="recent-activities-page-btn"
                >
                  Previous
                </button>
                
                <div className="recent-activities-page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`recent-activities-page-number ${page === pageNum ? 'recent-activities-page-number-active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="recent-activities-page-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="recent-activities-modal-overlay" onClick={() => setShowDescriptionModal(false)}>
          <div className="recent-activities-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="recent-activities-modal-header">
              <h3>Full Description</h3>
              <button 
                className="recent-activities-modal-close"
                onClick={() => setShowDescriptionModal(false)}
              >
                ×
              </button>
            </div>
            <div className="recent-activities-modal-body">
              <pre>{selectedDescription}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
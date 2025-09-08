import React from 'react';
import './AgencyListSkeleton.css';

const AgencyListSkeleton = ({ rowCount = 5 }) => {
  return (
    <div className="hsl-hotel-sales-list">
      <div className="hsl-card">
        <div className="hsl-skeleton-header">
          <div className="skeleton-title skeleton"></div>
        </div>

        <div className="hsl-list-controls">
          <div className="hsl-search-filter-section">
            <div className="hsl-search-box skeleton"></div>
            
            <div className="hsl-filter-controls">
              <div className="hsl-filter-group">
                <div className="skeleton-label skeleton"></div>
                <div className="skeleton-select skeleton"></div>
              </div>
              
              <div className="hsl-filter-group">
                <div className="skeleton-label skeleton"></div>
                <div className="skeleton-select skeleton"></div>
              </div>
              
              <div className="skeleton-button skeleton"></div>
            </div>
          </div>
        </div>

        <div className="hsl-results-info">
          <div className="hsl-results-count">
            <div className="skeleton-text skeleton"></div>
          </div>
          <div className="hsl-sort-controls">
            <div className="skeleton-text skeleton"></div>
            <div className="skeleton-button skeleton"></div>
            <div className="skeleton-button skeleton"></div>
            <div className="skeleton-button skeleton"></div>
          </div>
        </div>

        <div className="hsl-hotels-table-container">
          <table className="hsl-hotels-table">
            <thead>
              <tr>
                <th className="hsl-select-column">
                  <div className="skeleton-checkbox skeleton"></div>
                </th>
                <th>
                  <div className="skeleton-header-text skeleton"></div>
                </th>
                <th>
                  <div className="skeleton-header-text skeleton"></div>
                </th>
                <th>
                  <div className="skeleton-header-text skeleton"></div>
                </th>
                <th>
                  <div className="skeleton-header-text skeleton"></div>
                </th>
                <th>
                  <div className="skeleton-header-text skeleton"></div>
                </th>
                <th>
                  <div className="skeleton-header-text skeleton"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }).map((_, index) => (
                <tr key={index}>
                  <td className="hsl-select-column">
                    <div className="skeleton-checkbox skeleton"></div>
                  </td>
                  <td>
                    <div className="skeleton-hotel-name skeleton"></div>
                    <div className="skeleton-hotel-chain skeleton"></div>
                  </td>
                  <td>
                    <div className="skeleton-text skeleton"></div>
                  </td>
                  <td>
                    <div className="skeleton-text skeleton"></div>
                  </td>
                  <td>
                    <div className="skeleton-contact-count skeleton"></div>
                    <div className="skeleton-contact-preview skeleton"></div>
                  </td>
                  <td>
                    <div className="skeleton-contact-count skeleton"></div>
                    <div className="skeleton-contact-preview skeleton"></div>
                  </td>
                  <td>
                    <div className="hsl-action-buttons">
                      <div className="skeleton-icon-button skeleton"></div>
                      <div className="skeleton-icon-button skeleton"></div>
                      <div className="skeleton-icon-button skeleton"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hsl-table-footer">
          <div className="hsl-rows-info">
            <div className="skeleton-text skeleton"></div>
          </div>
          <div className="hsl-pagination">
            <div className="skeleton-pagination-button skeleton"></div>
            <div className="hsl-page-numbers">
              <div className="skeleton-pagination-number skeleton"></div>
              <div className="skeleton-pagination-number skeleton"></div>
              <div className="skeleton-pagination-number skeleton"></div>
            </div>
            <div className="skeleton-pagination-button skeleton"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyListSkeleton;
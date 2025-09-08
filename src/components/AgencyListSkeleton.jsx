// AgencyListSkeleton.jsx
import React from 'react';
import './AgencyListSkeleton.css';

const AgencyListSkeleton = ({ rowCount = 5, mode = 'table' }) => {
  if (mode === 'table') {
    return (
      <div className="agency-management-container skeleton-mode">
        <div className="ag-head">
          <div className="header">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-subtitle"></div>
          </div>
          
          <div className="tabs">
            <div className="skeleton skeleton-tab"></div>
            <div className="skeleton skeleton-tab"></div>
          </div>
        </div>
        
        <div className="tab-content">
          <div className="agencies-list">
            <div className="list-header">
              <div className="skeleton skeleton-section-title"></div>
              <div className="action-buttons">
                <div className="skeleton skeleton-button"></div>
                <div className="skeleton skeleton-button"></div>
              </div>
            </div>
            
            <div className="agencies-table-container">
              <table className="agencies-table">
                <thead>
                  <tr>
                    {Array.from({ length: 8 }).map((_, index) => (
                      <th key={index}>
                        <div className="skeleton skeleton-header-text"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: rowCount }).map((_, index) => (
                    <tr key={index}>
                      <td><div className="skeleton skeleton-text"></div></td>
                      <td><div className="skeleton skeleton-text"></div></td>
                      <td><div className="skeleton skeleton-text"></div></td>
                      <td><div className="skeleton skeleton-text"></div></td>
                      <td><div className="skeleton skeleton-text"></div></td>
                      <td><div className="skeleton skeleton-text"></div></td>
                      <td>
                        <div className="skeleton skeleton-status"></div>
                      </td>
                      <td>
                        <div className="table-actions">
                          <div className="skeleton skeleton-action-button"></div>
                          <div className="skeleton skeleton-action-button"></div>
                          <div className="skeleton skeleton-action-button"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form mode skeleton
  return (
    <div className="agency-management-container skeleton-mode">
      <div className="ag-head">
        <div className="header">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-subtitle"></div>
        </div>
        
        <div className="tabs">
          <div className="skeleton skeleton-tab"></div>
          <div className="skeleton skeleton-tab"></div>
        </div>
      </div>
      
      <div className="tab-content">
        <div>
          <div className="form-progress">
            <div className="progress-step">
              <div className="skeleton skeleton-step"></div>
            </div>
            <div className="progress-step">
              <div className="skeleton skeleton-step"></div>
            </div>
          </div>

          <div className="agency-form">
            <div className="form-section">
              <div className="skeleton skeleton-section-title"></div>
              
              <div className="form-row">
                <div className="form-group">
                  <div className="skeleton skeleton-label"></div>
                  <div className="skeleton skeleton-input"></div>
                </div>
                
                <div className="form-group">
                  <div className="skeleton skeleton-label"></div>
                  <div className="skeleton skeleton-input"></div>
                </div>
              
                <div className="form-group">
                  <div className="skeleton skeleton-label"></div>
                  <div className="skeleton skeleton-input"></div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group full-width">
                  <div className="skeleton skeleton-label"></div>
                  <div className="skeleton skeleton-input"></div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <div className="skeleton skeleton-label"></div>
                  <div className="skeleton skeleton-input"></div>
                </div>
                
                <div className="form-group">
                  <div className="skeleton skeleton-label"></div>
                  <div className="skeleton skeleton-input"></div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <div className="skeleton skeleton-label"></div>
                  <div className="skeleton skeleton-input"></div>
                </div>
                
                <div className="form-group">
                  <div className="skeleton skeleton-label"></div>
                  <div className="skeleton skeleton-select"></div>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <div className="skeleton skeleton-button"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyListSkeleton;
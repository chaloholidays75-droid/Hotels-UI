import React from 'react';
import {
  FaMapMarkerAlt, FaEnvelope, FaPhone, FaUserTie,
  FaClipboardList, FaMoneyCheckAlt, FaReceipt, FaConciergeBell, FaInfoCircle,
  FaTimes
} from 'react-icons/fa';

const ViewHotelModal = ({ hotel, onClose }) => {
  if (!hotel) return null;

  // Inline styles
  const styles = {
    overlay: {
      // position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      width: '90%',
      maxWidth: '800px',
      maxHeight: '90vh',
      overflowY: 'auto',
      position: 'relative',
    },
    header: {
      padding: '20px 25px 15px',
      borderBottom: '1px solid #eaeaea',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      color: '#888',
      cursor: 'pointer',
      padding: '0',
      marginLeft: '15px',
    },
    section: {
      padding: '20px 25px',
      borderBottom: '1px solid #f0f0f0',
    },
    hotelName: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#2d3748',
      margin: '0 0 10px 0',
    },
    hotelChainBadge: {
      display: 'inline-block',
      backgroundColor: '#e9f5ff',
      color: '#3182ce',
      fontSize: '12px',
      fontWeight: '600',
      padding: '4px 10px',
      borderRadius: '12px',
      marginBottom: '15px',
    },
    hotelLocation: {
      display: 'flex',
      alignItems: 'center',
      color: '#718096',
      fontSize: '15px',
      marginBottom: '20px',
    },
    detailGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '15px',
    },
    detailItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    },
    detailLabel: {
      fontSize: '12px',
      color: '#718096',
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: '0.5px',
      marginBottom: '4px',
    },
    detailValue: {
      fontSize: '15px',
      color: '#2d3748',
      fontWeight: '500',
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#2d3748',
      margin: '0 0 20px 0',
    },
    contactGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '25px',
    },
    contactCategory: {
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '6px',
    },
    categoryTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '15px',
      fontWeight: '600',
      color: '#4a5568',
      margin: '0 0 12px 0',
      paddingBottom: '8px',
      borderBottom: '1px solid #eaeaea',
    },
    contactPerson: {
      marginBottom: '15px',
      padding: '12px',
      backgroundColor: 'white',
      borderRadius: '6px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    },
    contactName: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#2d3748',
      marginBottom: '8px',
    },
    contactInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#718096',
      marginBottom: '5px',
    },
    remarksContent: {
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '6px',
      fontSize: '15px',
      lineHeight: '1.5',
      color: '#4a5568',
    },
    icon: {
      color: '#718096',
      fontSize: '14px',
      flexShrink: 0,
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header with close button */}
        <div style={styles.header}>
          <div style={{flex: 1}}>
            <h3 style={styles.hotelName}>{hotel.hotelName}</h3>
            {hotel.hotelChain && (
              <div style={styles.hotelChainBadge}>{hotel.hotelChain}</div>
            )}
            <div style={styles.hotelLocation}>
              <FaMapMarkerAlt style={{...styles.icon, marginRight: '5px'}} />
              <span>{hotel.address}, {hotel.city}, {hotel.country}</span>
            </div>
          </div>
          <button style={styles.closeButton} onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {/* Basic Information Section */}
        <div style={styles.section}>
          <div style={styles.detailGrid}>
            {hotel.hotelContactNumber && (
              <div style={styles.detailItem}>
                <FaPhone style={styles.icon} />
                <div>
                  <div style={styles.detailLabel}>Contact Number</div>
                  <div style={styles.detailValue}>{hotel.hotelContactNumber}</div>
                </div>
              </div>
            )}
            {hotel.hotelEmail && (
              <div style={styles.detailItem}>
                <FaEnvelope style={styles.icon} />
                <div>
                  <div style={styles.detailLabel}>Hotel Email</div>
                  <div style={styles.detailValue}>{hotel.hotelEmail}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Persons Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <FaUserTie style={styles.icon} /> 
            Contact Persons
          </h4>
          
          <div style={styles.contactGrid}>
            {hotel.salesPersons.length > 0 && (
              <div style={styles.contactCategory}>
                <h5 style={styles.categoryTitle}>
                  <FaUserTie style={styles.icon} /> Sales Persons
                </h5>
                {hotel.salesPersons.map((p, idx) => (
                  <div key={idx} style={styles.contactPerson}>
                    <div style={styles.contactName}>{p.name}</div>
                    {p.email && (
                      <div style={styles.contactInfo}>
                        <FaEnvelope style={styles.icon} /> 
                        <span>{p.email}</span>
                      </div>
                    )}
                    {p.contact && (
                      <div style={styles.contactInfo}>
                        <FaPhone style={styles.icon} /> 
                        <span>{p.contact}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {hotel.reservationPersons.length > 0 && (
              <div style={styles.contactCategory}>
                <h5 style={styles.categoryTitle}>
                  <FaClipboardList style={styles.icon} /> Reservation Persons
                </h5>
                {hotel.reservationPersons.map((p, idx) => (
                  <div key={idx} style={styles.contactPerson}>
                    <div style={styles.contactName}>{p.name}</div>
                    {p.email && (
                      <div style={styles.contactInfo}>
                        <FaEnvelope style={styles.icon} /> 
                        <span>{p.email}</span>
                      </div>
                    )}
                    {p.contact && (
                      <div style={styles.contactInfo}>
                        <FaPhone style={styles.icon} /> 
                        <span>{p.contact}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {hotel.accountsPersons.length > 0 && (
              <div style={styles.contactCategory}>
                <h5 style={styles.categoryTitle}>
                  <FaMoneyCheckAlt style={styles.icon} /> Accounts Persons
                </h5>
                {hotel.accountsPersons.map((p, idx) => (
                  <div key={idx} style={styles.contactPerson}>
                    <div style={styles.contactName}>{p.name}</div>
                    {p.email && (
                      <div style={styles.contactInfo}>
                        <FaEnvelope style={styles.icon} /> 
                        <span>{p.email}</span>
                      </div>
                    )}
                    {p.contact && (
                      <div style={styles.contactInfo}>
                        <FaPhone style={styles.icon} /> 
                        <span>{p.contact}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {hotel.receptionPersons.length > 0 && (
              <div style={styles.contactCategory}>
                <h5 style={styles.categoryTitle}>
                  <FaReceipt style={styles.icon} /> Reception Persons
                </h5>
                {hotel.receptionPersons.map((p, idx) => (
                  <div key={idx} style={styles.contactPerson}>
                    <div style={styles.contactName}>{p.name}</div>
                    {p.email && (
                      <div style={styles.contactInfo}>
                        <FaEnvelope style={styles.icon} /> 
                        <span>{p.email}</span>
                      </div>
                    )}
                    {p.contact && (
                      <div style={styles.contactInfo}>
                        <FaPhone style={styles.icon} /> 
                        <span>{p.contact}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {hotel.concierges.length > 0 && (
              <div style={styles.contactCategory}>
                <h5 style={styles.categoryTitle}>
                  <FaConciergeBell style={styles.icon} /> Concierges
                </h5>
                {hotel.concierges.map((p, idx) => (
                  <div key={idx} style={styles.contactPerson}>
                    <div style={styles.contactName}>{p.name}</div>
                    {p.email && (
                      <div style={styles.contactInfo}>
                        <FaEnvelope style={styles.icon} /> 
                        <span>{p.email}</span>
                      </div>
                    )}
                    {p.contact && (
                      <div style={styles.contactInfo}>
                        <FaPhone style={styles.icon} /> 
                        <span>{p.contact}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Special Remarks Section */}
        {hotel.specialRemarks && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>
              <FaInfoCircle style={styles.icon} /> 
              Special Remarks
            </h4>
            <div style={styles.remarksContent}>{hotel.specialRemarks}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewHotelModal;
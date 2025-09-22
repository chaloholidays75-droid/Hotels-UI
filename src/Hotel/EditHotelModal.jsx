import React, { useState, useEffect } from 'react';
import ContactRoleSection from './ContactRoleSection';
import { 
  FaBuilding, 
  FaUserTie, 
  FaInfoCircle, 
  FaSave, 
  FaTimes, 
  FaClipboardList, 
  FaMoneyCheckAlt, 
  FaReceipt, 
  FaConciergeBell,
  FaPlus,
  FaExclamationTriangle
} from 'react-icons/fa';

const EditHotelModal = ({ hotel, onSave, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (hotel) {
      setFormData({
        ...hotel,
        salesPersons: hotel.salesPersons || [],
        reservationPersons: hotel.reservationPersons || [],
        accountsPersons: hotel.accountsPersons || [],
        receptionPersons: hotel.receptionPersons || [],
        concierges: hotel.concierges || [],
      });
      setErrors({});
      setTouched({});
    }
  }, [hotel]);

  // Validate form fields
  const validateField = (field, value) => {
    let error = '';
    
    switch(field) {
      case 'hotelName':
        if (!value.trim()) error = 'Hotel name is required';
        break;
      case 'country':
        if (!value.trim()) error = 'Country is required';
        break;
      case 'city':
        if (!value.trim()) error = 'City is required';
        break;
      case 'address':
        if (!value.trim()) error = 'Address is required';
        break;
      case 'hotelEmail':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      default:
        break;
    }
    
    return error;
  };

  // Update basic hotel fields with validation
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate on change if the field has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle blur events for validation
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Update contact person safely
  const updatePerson = (role, index, field, value) => {
    const key = `${role}s`;
    setFormData(prev => {
      const updated = prev[key] ? [...prev[key]] : [];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [key]: updated };
    });
  };

  // Add a new contact person safely
  const addPerson = (role) => {
    const key = `${role}s`;
    setFormData(prev => ({
      ...prev,
      [key]: prev[key] ? [...prev[key], { name: '', email: '', contact: '' }] : [{ name: '', email: '', contact: '' }]
    }));
  };

  // Remove a contact person safely
  const removePerson = (role, index) => {
    const key = `${role}s`;
    setFormData(prev => ({
      ...prev,
      [key]: prev[key] ? prev[key].filter((_, i) => i !== index) : []
    }));
  };

  // Validate entire form before saving
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['hotelName', 'country', 'city', 'address'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    
    // Validate emails in contact persons
    const contactRoles = ['salesPersons', 'reservationPersons', 'accountsPersons', 'receptionPersons', 'concierges'];
    
    contactRoles.forEach(role => {
      formData[role]?.forEach((person, index) => {
        if (person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) {
          newErrors[`${role}-${index}-email`] = 'Invalid email format';
        }
      });
    });
    
    setErrors(newErrors);
    setTouched(requiredFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    return Object.keys(newErrors).length === 0;
  };

  // Save changes with validation
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save hotel:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!formData) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-loading">
            <div className="spinner"></div>
            <p>Loading hotel data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Hotel Information</h2>
          <button className="modal-close" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          {/* Hotel Information */}
          <div className="form-section">
            <div className="section-header">
              <h3><FaBuilding /> Hotel Information</h3>
              <p>Basic details about the hotel</p>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Hotel Name <span className="required">*</span></label>
                <input 
                  value={formData.hotelName || ""} 
                  onChange={e => updateField('hotelName', e.target.value)}
                  onBlur={() => handleBlur('hotelName')}
                  className={errors.hotelName ? 'error' : ''}
                  required 
                />
                {errors.hotelName && <span className="error-message">{errors.hotelName}</span>}
              </div>
              <div className="form-group">
                <label>Country <span className="required">*</span></label>
                <input 
                  value={formData.country || ""} 
                  onChange={e => updateField('country', e.target.value)}
                  onBlur={() => handleBlur('country')}
                  className={errors.country ? 'error' : ''}
                  required 
                />
                {errors.country && <span className="error-message">{errors.country}</span>}
              </div>
              <div className="form-group">
                <label>City <span className="required">*</span></label>
                <input 
                  value={formData.city || ""} 
                  onChange={e => updateField('city', e.target.value)}
                  onBlur={() => handleBlur('city')}
                  className={errors.city ? 'error' : ''}
                  required 
                />
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>
              <div className="form-group">
                <label>Address <span className="required">*</span></label>
                <input 
                  value={formData.address || ""} 
                  onChange={e => updateField('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                  className={errors.address ? 'error' : ''}
                  required 
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input 
                  value={formData.hotelContactNumber || ""} 
                  onChange={e => updateField('hotelContactNumber', e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Hotel Email</label>
                <input 
                  type="email" 
                  value={formData.hotelEmail || ""} 
                  onChange={e => updateField('hotelEmail', e.target.value)}
                  onBlur={() => handleBlur('hotelEmail')}
                  className={errors.hotelEmail ? 'error' : ''}
                />
                {errors.hotelEmail && <span className="error-message">{errors.hotelEmail}</span>}
              </div>
              <div className="form-group">
                <label>Hotel Chain</label>
                <input 
                  value={formData.hotelChain || ""} 
                  onChange={e => updateField('hotelChain', e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Contact Persons */}
          <div className="form-section">
            <div className="section-header">
              <h3><FaUserTie /> Contact Persons</h3>
              <p>Key contacts at the hotel</p>
            </div>
            <ContactRoleSection 
              title="Sales Person" 
              role="salesPerson" 
              persons={formData.salesPersons} 
              onAdd={() => addPerson('salesPerson')} 
              onRemove={removePerson} 
              onChange={updatePerson} 
              phoneCode={'+1'}
              icon={<FaUserTie />}
              errors={errors}
            />
            <ContactRoleSection 
              title="Reservation Person" 
              role="reservationPerson" 
              persons={formData.reservationPersons} 
              onAdd={() => addPerson('reservationPerson')} 
              onRemove={removePerson} 
              onChange={updatePerson} 
              phoneCode={'+1'} 
              icon={<FaClipboardList />}
              errors={errors}
            />
            <ContactRoleSection 
              title="Accounts Person" 
              role="accountsPerson" 
              persons={formData.accountsPersons} 
              onAdd={() => addPerson('accountsPerson')} 
              onRemove={removePerson} 
              onChange={updatePerson} 
              phoneCode={'+1'} 
              icon={<FaMoneyCheckAlt />}
              errors={errors}
            />
            <ContactRoleSection 
              title="Reception Person" 
              role="receptionPerson" 
              persons={formData.receptionPersons} 
              onAdd={() => addPerson('receptionPerson')} 
              onRemove={removePerson} 
              onChange={updatePerson} 
              phoneCode={'+1'} 
              icon={<FaReceipt />}
              errors={errors}
            />
            <ContactRoleSection 
              title="Concierge" 
              role="concierge" 
              persons={formData.concierges} 
              onAdd={() => addPerson('concierge')} 
              onRemove={removePerson} 
              onChange={updatePerson} 
              phoneCode={'+1'} 
              icon={<FaConciergeBell />}
              errors={errors}
            />
          </div>

          {/* Special Remarks */}
          <div className="form-section">
            <div className="section-header">
              <h3><FaInfoCircle /> Special Remarks</h3>
              <p>Any additional information about the hotel</p>
            </div>
            <div className="form-group full-width">
              <textarea
                value={formData.specialRemarks || ""}
                onChange={e => updateField('specialRemarks', e.target.value)}
                rows="5"
                placeholder="Add any special notes or remarks about this hotel..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-footer">
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
              <FaTimes /> Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <div className="spinner"></div> : <FaSave />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #eaeaea;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #999;
          padding: 5px;
          border-radius: 4px;
        }
        
        .modal-close:hover {
          color: #666;
          background: #f5f5f5;
        }
        
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        
        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #eaeaea;
          background: #f9f9f9;
        }
        
        .form-section {
          margin-bottom: 30px;
        }
        
        .section-header {
          margin-bottom: 20px;
        }
        
        .section-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 5px 0;
          font-size: 1.2rem;
          color: #333;
        }
        
        .section-header p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        label {
          margin-bottom: 8px;
          font-weight: 500;
          color: #444;
        }
        
        .required {
          color: #e22;
        }
        
        input, textarea {
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        
        input:focus, textarea:focus {
          outline: none;
          border-color: #4a90e2;
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
        }
        
        input.error, textarea.error {
          border-color: #e22;
        }
        
        .error-message {
          color: #e22;
          font-size: 0.85rem;
          margin-top: 5px;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background-color: #4a90e2;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background-color: #3a80d2;
        }
        
        .btn-secondary {
          background-color: #f5f5f5;
          color: #333;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background-color: #e5e5e5;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .modal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #666;
        }
        
        .modal-loading .spinner {
          margin-bottom: 15px;
          color: #4a90e2;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 10px;
          }
          
          .modal-content {
            max-height: 95vh;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default EditHotelModal;
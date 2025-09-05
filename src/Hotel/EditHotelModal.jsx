import React, { useState } from 'react';
import ContactRoleSection from './ContactRoleSection';
import { FaBuilding, FaUserTie, FaInfoCircle, FaSave, FaTimes } from 'react-icons/fa';

const EditHotelModal = ({ hotel, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    ...hotel,
    salesPersons: hotel.salesPersons || [],
    reservationPersons: hotel.reservationPersons || [],
    accountsPersons: hotel.accountsPersons || [],
    receptionPersons: hotel.receptionPersons || [],
    concierges: hotel.concierges || [],
  });

  const [isSaving, setIsSaving] = useState(false);

  // Update basic hotel fields
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <div className="edit-hotel-form">
      {/* Hotel Information */}
      <div className="form-section">
        <div className="section-header"><h3><FaBuilding /> Hotel Information</h3></div>
        <div className="form-grid">
          <div className="form-group">
            <label>Hotel Name <span className="required">*</span></label>
            <input value={formData.hotelName || ""} onChange={e => updateField('hotelName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Country <span className="required">*</span></label>
            <input value={formData.country || ""} onChange={e => updateField('country', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>City <span className="required">*</span></label>
            <input value={formData.city || ""} onChange={e => updateField('city', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Address <span className="required">*</span></label>
            <input value={formData.address || ""} onChange={e => updateField('address', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input value={formData.hotelContactNumber || ""} onChange={e => updateField('hotelContactNumber', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hotel Email</label>
            <input type="email" value={formData.hotelEmail || ""} onChange={e => updateField('hotelEmail', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hotel Chain</label>
            <input value={formData.hotelChain || ""} onChange={e => updateField('hotelChain', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Contact Persons */}
      <div className="form-section">
        <div className="section-header"><h3><FaUserTie /> Contact Persons</h3></div>
        <ContactRoleSection 
          title="Sales Person" 
          role="salesPerson" 
          persons={formData.salesPersons} 
          onAdd={() => addPerson('salesPerson')} 
          onRemove={removePerson} 
          onChange={updatePerson} 
          phoneCode={'+1'}
          icon={<FaUserTie />}
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
        />
      </div>

      {/* Special Remarks */}
      <div className="form-section">
        <div className="section-header"><h3><FaInfoCircle /> Special Remarks</h3></div>
        <div className="form-group full-width">
          <textarea
            value={formData.specialRemarks || ""}
            onChange={e => updateField('specialRemarks', e.target.value)}
            rows="5"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <div className="spinner"></div> : <FaSave />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          <FaTimes /> Cancel
        </button>
      </div>
    </div>
  );
};

export default EditHotelModal;
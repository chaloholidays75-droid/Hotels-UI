import React from 'react';
import { FaMinus } from 'react-icons/fa';

const ContactPersonFields = ({ person, onChange, onRemove, index, role, phoneCode }) => (
  <div className="contact-person-fields">
    <div className="form-row">
      <div className="form-group">
        <label>Name <span className="required">*</span></label>
        <input
          type="text"
          value={person.name}
          onChange={(e) => onChange(index, 'name', e.target.value)}
          required
          placeholder="Full name"
        />
      </div>
      <div className="form-group">
        <label>Email <span className="required">*</span></label>
        <input
          type="email"
          value={person.email}
          onChange={(e) => onChange(index, 'email', e.target.value)}
          required
          placeholder="email@example.com"
        />
      </div>
      <div className="form-group">
        <label>Contact <span className="required">*</span></label>
        <div className="phone-input-container">
          <span className="phone-prefix">{phoneCode}</span>
          <input
            type="tel"
            value={(person.contact || '').replace(phoneCode, '').trim()}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              onChange(index, 'contact', `${phoneCode} ${digits}`);
            }}
            placeholder="XXX XXX XXXX"
            required
          />
        </div>
      </div>
      {(
        <div className="form-group remove-btn-container">
          <button type="button" className="remove-person-btn" onClick={() => onRemove(index)} >
            <FaMinus />
          </button>
        </div>
      )}
    </div>
  </div>
);

export default ContactPersonFields;
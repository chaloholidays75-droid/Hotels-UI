import React from 'react';
import ContactPersonFields from './ContactPersonFields';
import {FaPlus ,FaBuilding } from 'react-icons/fa';

const ContactRoleSection = ({ title, role, persons, onAdd, onRemove, onChange, phoneCode, icon }) => (
  <div className="contact-section">
    <div className="section-header">
      <h4>{icon} {title}</h4>
      <span className="person-count">{persons.length} {persons.length === 1 ? 'person' : 'persons'}</span>
    </div>
    {persons.map((person, index) => (
      <ContactPersonFields 
        key={index} 
        person={person} 
        onChange={(idx, field, value) => onChange(role, idx, field, value)} 
        onRemove={(idx) => onRemove(role, idx)}
        index={index}
        role={role}
        phoneCode={phoneCode}
      />
    ))}
    <button type="button" className="add-person-btn" onClick={() => onAdd(role)}>
      <FaPlus /> Add {title}
    </button>
  </div>
);

export default ContactRoleSection;
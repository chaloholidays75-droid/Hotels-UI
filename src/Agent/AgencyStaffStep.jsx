// src/components/AgencyStaffStep.jsx
import React, { useState } from "react";
import { FaPlus, FaTrash, FaArrowLeft, FaSave } from "react-icons/fa";
import agencyApi from "../api/agencyApi";

const emptyPerson = { name: "", designation: "", email: "", phone: "" };

const RoleSection = ({ title, persons, onAdd, onRemove, onChange }) => (
  <div className="contact-role-section">
    <div className="role-header">
      <h4>{title}</h4>
      <button type="button" className="btn-add-person" onClick={onAdd}>
        <FaPlus /> Add {title}
      </button>
    </div>

    {persons.map((p, idx) => (
      <div key={idx} className="person-row">
        <div className="form-group">
          <label>Name</label>
          <input
            value={p.name}
            onChange={e => onChange(idx, "name", e.target.value)}
            placeholder={`${title} name`}
          />
        </div>
        <div className="form-group">
          <label>Designation</label>
          <input
            value={p.designation}
            onChange={e => onChange(idx, "designation", e.target.value)}
            placeholder="e.g. Manager"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={p.email}
            onChange={e => onChange(idx, "email", e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            value={p.phone}
            onChange={e => onChange(idx, "phone", e.target.value)}
            placeholder="+91 9876543210"
          />
        </div>
        <button
          type="button"
          className="btn-remove-person"
          onClick={() => onRemove(idx)}
          disabled={persons.length <= 1}
        >
          <FaTrash />
        </button>
      </div>
    ))}
  </div>
);

export default function AgencyStaffStep({
  formData,
  setFormData,
  setCurrentPage,
  setActiveTab,
  setAgencies,
  agencies,
  setShowSuccessMessage,
  setShowErrorMessage,
  setMessageBoxContent
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // role-based grouped staff
  const [sales, setSales] = useState([{ ...emptyPerson }]);
  const [reservation, setReservation] = useState([{ ...emptyPerson }]);
  const [accounts, setAccounts] = useState([{ ...emptyPerson }]);
  const [reception, setReception] = useState([{ ...emptyPerson }]);
  const [concierge, setConcierge] = useState([{ ...emptyPerson }]);

  const staffSections = [
    { title: "Sales", state: sales, setter: setSales },
    { title: "Reservation", state: reservation, setter: setReservation },
    { title: "Accounts", state: accounts, setter: setAccounts },
    { title: "Reception", state: reception, setter: setReception },
    { title: "Concierge", state: concierge, setter: setConcierge }
  ];

  const collectStaff = () => {
    const all = [];
    staffSections.forEach(({ title, state }) => {
      state.forEach(p => {
        if (p.name.trim()) {
          all.push({
            role: title,
            name: p.name.trim(),
            designation: p.designation.trim() || null,
            email: p.email.trim() || null,
            phone: p.phone.trim() || null
          });
        }
      });
    });
    return all;
  };

  const handleSubmitAll = async e => {
    e.preventDefault();
    const staff = collectStaff();

    const payload = { ...formData, staff };

    try {
      setIsSubmitting(true);
      const response = await agencyApi.createAgency(payload);
      setAgencies(prev => [...prev, response]);
      setShowSuccessMessage(true);
      setMessageBoxContent("Agency and staff registered successfully!");
      setActiveTab("view");
    } catch (error) {
      setShowErrorMessage(true);
      setMessageBoxContent(error.response?.data?.message || "Error saving agency");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitAll} className="agency-form">
      <h2 className="section-title">Agency Staff</h2>

      {staffSections.map(({ title, state, setter }) => (
        <RoleSection
          key={title}
          title={title}
          persons={state}
          onAdd={() => setter([...state, { ...emptyPerson }])}
          onRemove={i => {
            const clone = [...state];
            clone.splice(i, 1);
            setter(clone.length ? clone : [{ ...emptyPerson }]);
          }}
          onChange={(i, field, val) => {
            const clone = [...state];
            clone[i] = { ...clone[i], [field]: val };
            setter(clone);
          }}
        />
      ))}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setCurrentPage("user")}
        >
          <FaArrowLeft /> Back
        </button>
        <button type="submit" className="submit-button" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : <>
            <FaSave /> Submit Agency
          </>}
        </button>
      </div>
    </form>
  );
}

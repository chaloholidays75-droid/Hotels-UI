import React, { useState, useEffect } from "react";
import bookingApi from "../api/bookingApi";
import agencyApi from "../api/agencyApi";
import supplierApi from "../api/supplierApi";
import "./BookingEditModal.css";

const BookingEditModal = ({ editModal, setEditModal, closeEditModal, refreshBookings }) => {
  const [bookingData, setBookingData] = useState({
    agencyId: "",
    supplierId: "",
    hotelId: "",
    checkIn: "",
    checkOut: "",
    numberOfRooms: 1,
    adults: 1,
    children: 0,
    totalPeople: 1,
    childrenAges: "",
    specialRequest: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [ageWarnings, setAgeWarnings] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 16);

  // Calculate total people whenever adults or children change
  useEffect(() => {
    setBookingData(prev => ({
      ...prev,
      totalPeople: (parseInt(prev.adults) || 0) + (parseInt(prev.children) || 0)
    }));
  }, [bookingData.adults, bookingData.children]);

  // Fetch dropdown data and pre-fill booking
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setFetchLoading(true);
        const [agencyList, supplierList] = await Promise.all([
          agencyApi.getAgencies(),
          supplierApi.getSuppliers()
        ]);

        setAgencies(agencyList || []);
        setSuppliers(supplierList || []);

        if (editModal.booking) {
          const b = editModal.booking;
          setBookingData({
            agencyId: b.agencyId?.toString() || "",
            supplierId: b.supplierId?.toString() || "",
            hotelId: b.hotelId?.toString() || "",
            checkIn: b.checkIn ? b.checkIn.slice(0, 16) : "",
            checkOut: b.checkOut ? b.checkOut.slice(0, 16) : "",
            numberOfRooms: b.numberOfRooms || 1,
            adults: b.adults || 1,
            children: b.children || 0,
            totalPeople: (b.adults || 1) + (b.children || 0),
            childrenAges: b.childrenAges || "",
            specialRequest: b.specialRequest || "",
          });

          if (b.childrenAges) {
            const ages = b.childrenAges.split(",").map(a => a.trim()).filter(a => a !== '');
            const warnings = [];
            ages.forEach((age, i) => {
              const ageNum = parseInt(age);
              if (isNaN(ageNum)) warnings.push(`Child ${i + 1} has invalid age`);
              else if (ageNum > 12) warnings.push(`Child ${i + 1} (age ${age}) will be counted as adult`);
              else if (ageNum < 0) warnings.push(`Child ${i + 1} age cannot be negative`);
            });
            setAgeWarnings(warnings);
          } else {
            setAgeWarnings([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
      } finally {
        setFetchLoading(false);
      }
    };

    if (editModal.isOpen) fetchDropdownData();
  }, [editModal.isOpen, editModal.booking]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleChildrenAgesChange = (e) => {
    const value = e.target.value;
    setBookingData(prev => ({ ...prev, childrenAges: value }));

    if (value) {
      const ages = value.split(",").map(a => a.trim()).filter(a => a !== '');
      const warnings = [];
      ages.forEach((age, i) => {
        const ageNum = parseInt(age);
        if (isNaN(ageNum)) warnings.push(`Child ${i + 1} has invalid age`);
        else if (ageNum > 12) warnings.push(`Child ${i + 1} (age ${age}) will be counted as adult`);
        else if (ageNum < 0) warnings.push(`Child ${i + 1} age cannot be negative`);
      });
      setAgeWarnings(warnings);
    } else {
      setAgeWarnings([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!bookingData.agencyId) newErrors.agencyId = "Please select an agency";
    if (!bookingData.supplierId) newErrors.supplierId = "Please select a supplier";
    if (!bookingData.hotelId) newErrors.hotelId = "Hotel ID is required";
    if (!bookingData.checkIn) newErrors.checkIn = "Check-in date is required";
    if (!bookingData.checkOut) newErrors.checkOut = "Check-out date is required";
    if (bookingData.numberOfRooms < 1) newErrors.numberOfRooms = "At least 1 room is required";
    if (bookingData.adults < 1) newErrors.adults = "At least 1 adult is required";
    if (bookingData.children < 0) newErrors.children = "Children cannot be negative";
    if (bookingData.totalPeople < 1) newErrors.totalPeople = "At least 1 guest is required";
    if (bookingData.children > 0 && !bookingData.childrenAges) newErrors.childrenAges = "Children ages are required";

    if (bookingData.childrenAges) {
      const ages = bookingData.childrenAges.split(",").map(a => a.trim()).filter(a => a !== '');
      if (ages.length !== parseInt(bookingData.children || 0)) newErrors.childrenAges = `Number of ages (${ages.length}) must match children count (${bookingData.children})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        ...bookingData,
        agencyId: parseInt(bookingData.agencyId),
        supplierId: parseInt(bookingData.supplierId),
        hotelId: parseInt(bookingData.hotelId),
        numberOfRooms: parseInt(bookingData.numberOfRooms),
        adults: parseInt(bookingData.adults),
        children: parseInt(bookingData.children),
        totalPeople: parseInt(bookingData.totalPeople),
      };
      await bookingApi.updateBooking(editModal.booking.id, payload);
      refreshBookings();
      closeEditModal();
      alert("Booking updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Error updating booking");
    } finally {
      setLoading(false);
    }
  };

  if (!editModal.isOpen) return null;

  const selectedAgency = agencies.find(a => a.id === parseInt(bookingData.agencyId));
  const selectedSupplier = suppliers.find(s => s.id === parseInt(bookingData.supplierId));

  return (
    <div className="booking-edit-modal-overlay">
      <div className="booking-edit-modal-content">
        <div className="booking-edit-modal-header">
          <h2>Edit Booking</h2>
          <button onClick={closeEditModal} disabled={loading}>×</button>
        </div>

        <div className="booking-edit-modal-body">
          {/* Agency & Supplier */}
          <div>
            <label>Agency *</label>
            {fetchLoading ? <div>Loading agencies...</div> : (
              <select name="agencyId" value={bookingData.agencyId} onChange={handleChange} disabled={loading}>
                <option value="">Select an agency</option>
                {agencies.map(a => <option key={a.id} value={a.id}>{a.agencyName}</option>)}
              </select>
            )}
            {errors.agencyId && <span>{errors.agencyId}</span>}
            {selectedAgency && <div>Currently: {selectedAgency.agencyName}</div>}
          </div>

          <div>
            <label>Supplier *</label>
            {fetchLoading ? <div>Loading suppliers...</div> : (
              <select name="supplierId" value={bookingData.supplierId} onChange={handleChange} disabled={loading}>
                <option value="">Select a supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
              </select>
            )}
            {errors.supplierId && <span>{errors.supplierId}</span>}
            {selectedSupplier && <div>Currently: {selectedSupplier.supplierName}</div>}
          </div>

          <div>
            <label>Hotel ID *</label>
            <input type="number" name="hotelId" value={bookingData.hotelId} onChange={handleChange} min="1" disabled={loading}/>
            {errors.hotelId && <span>{errors.hotelId}</span>}
          </div>

          <div>
            <label>Check-In *</label>
            <input type="datetime-local" name="checkIn" value={bookingData.checkIn} min={today} onChange={handleChange} disabled={loading}/>
            {errors.checkIn && <span>{errors.checkIn}</span>}
          </div>

          <div>
            <label>Check-Out *</label>
            <input type="datetime-local" name="checkOut" value={bookingData.checkOut} min={bookingData.checkIn || today} onChange={handleChange} disabled={loading}/>
            {errors.checkOut && <span>{errors.checkOut}</span>}
          </div>

          <div>
            <label>Number of Rooms *</label>
            <input type="number" name="numberOfRooms" value={bookingData.numberOfRooms} min="1" onChange={handleChange} disabled={loading}/>
            {errors.numberOfRooms && <span>{errors.numberOfRooms}</span>}
          </div>

          <div>
            <label>Adults *</label>
            <input type="number" name="adults" value={bookingData.adults} min="1" onChange={handleChange} disabled={loading}/>
            {errors.adults && <span>{errors.adults}</span>}
          </div>

          <div>
            <label>Children</label>
            <input type="number" name="children" value={bookingData.children} min="0" onChange={handleChange} disabled={loading}/>
            {errors.children && <span>{errors.children}</span>}
          </div>

          {bookingData.children > 0 && (
            <div>
              <label>Children Ages *</label>
              <input type="text" name="childrenAges" value={bookingData.childrenAges} onChange={handleChildrenAgesChange} placeholder="e.g., 5,8" disabled={loading}/>
              {errors.childrenAges && <span>{errors.childrenAges}</span>}
              {ageWarnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
            </div>
          )}

          <div>
            <label>Special Request</label>
            <textarea name="specialRequest" value={bookingData.specialRequest} onChange={handleChange} disabled={loading}/>
          </div>
        </div>

        <div>
          <button onClick={closeEditModal} disabled={loading}>Cancel</button>
          <button onClick={handleSave} disabled={loading || fetchLoading}>{loading ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
};

export default BookingEditModal;

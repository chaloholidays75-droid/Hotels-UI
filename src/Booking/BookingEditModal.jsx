import React, { useState, useEffect } from "react";
import bookingApi from "../api/bookingApi";
import agencyApi from "../api/agencyApi";
import supplierApi from "../api/supplierApi";
import { getHotelSales } from "../api/hotelApi";
import "./BookingEditModal.css";

const BookingEditModal = ({ editModal, setEditModal, closeEditModal, refreshBookings }) => {
  const [bookingData, setBookingData] = useState({
    agencyId: "",
    supplierId: "",
    hotelId: "",
    hotelName: "",
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
  const [hotelsList, setHotelsList] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [hotelQuery, setHotelQuery] = useState("");
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 16);

  // Calculate total people whenever adults or children change
  useEffect(() => {
    const total = parseInt(bookingData.adults || 0) + parseInt(bookingData.children || 0);
    setBookingData(prev => ({ ...prev, totalPeople: total }));
  }, [bookingData.adults, bookingData.children]);

  // Fetch agencies, suppliers, and hotels when modal opens
  useEffect(() => {
    if (!editModal.isOpen) return;

    const fetchData = async () => {
      try {
        setFetchLoading(true);

        const [agencyList, supplierList, hotelsRaw] = await Promise.all([
          agencyApi.getAgencies(),
          supplierApi.getSuppliers(),
          getHotelSales(),
        ]);

        setAgencies(agencyList || []);
        setSuppliers(supplierList || []);

        // Map hotels safely
        const allHotels = (hotelsRaw || []).map(h => ({
          id: h.id.toString(),
          hotelName: h.hotelName || "Unnamed Hotel",
        }));

        setHotelsList(allHotels);
        setFilteredHotels(allHotels);

        // Prefill booking data if editing
        if (editModal.booking) {
          const total = (editModal.booking.adults || 0) + (editModal.booking.children || 0);

          const agencyMatch = agencyList.find(a => a.agencyName === editModal.booking.agencyName);
          const supplierMatch = supplierList.find(s => s.supplierName === editModal.booking.supplierName);
          const hotelMatch = allHotels.find(h => h.hotelName === editModal.booking.hotelName);

          setBookingData({
            agencyId: agencyMatch?.id || "",
            supplierId: supplierMatch?.id || "",
            hotelId: hotelMatch?.id || "",
            hotelName: hotelMatch?.hotelName || editModal.booking.hotelName || "",
            checkIn: editModal.booking.checkIn ? editModal.booking.checkIn.slice(0, 16) : "",
            checkOut: editModal.booking.checkOut ? editModal.booking.checkOut.slice(0, 16) : "",
            numberOfRooms: editModal.booking.numberOfRooms || 1,
            adults: editModal.booking.adults || 1,
            children: editModal.booking.children || 0,
            totalPeople: total,
            childrenAges: editModal.booking.childrenAges || "",
            specialRequest: editModal.booking.specialRequest || "",
          });

          setHotelQuery(editModal.booking.hotelName || "");
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [editModal.isOpen, editModal.booking]);

  // Filter hotels based on search
  useEffect(() => {
    const filtered = hotelsList.filter(h =>
      h.hotelName.toLowerCase().includes(hotelQuery.toLowerCase())
    );
    setFilteredHotels(filtered);
  }, [hotelQuery, hotelsList]);

  // Generic input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Handle children ages input
  const handleChildrenAgesChange = (e) => {
    const value = e.target.value;
    setBookingData(prev => ({ ...prev, childrenAges: value }));

    if (!value) {
      setAgeWarnings([]);
      return;
    }

    const ages = value.split(",").map(a => a.trim());
    const warnings = [];
    ages.forEach((age, idx) => {
      const n = parseInt(age);
      if (isNaN(n)) warnings.push(`Child ${idx + 1} has invalid age`);
      else if (n > 12) warnings.push(`Child ${idx + 1} (age ${age}) will be counted as adult`);
      else if (n < 0) warnings.push(`Child ${idx + 1} age cannot be negative`);
    });
    setAgeWarnings(warnings);
  };

  // Validate form before saving
  const validateForm = () => {
    const newErrors = {};
    if (!bookingData.agencyId) newErrors.agencyId = "Please select an agency";
    if (!bookingData.supplierId) newErrors.supplierId = "Please select a supplier";
    if (!bookingData.hotelId) newErrors.hotelId = "Please select a hotel";
    if (!bookingData.checkIn) newErrors.checkIn = "Check-in is required";
    if (!bookingData.checkOut) newErrors.checkOut = "Check-out is required";
    if (bookingData.numberOfRooms < 1) newErrors.numberOfRooms = "At least 1 room is required";
    if (bookingData.adults < 1) newErrors.adults = "At least 1 adult is required";
    if (bookingData.children < 0) newErrors.children = "Children cannot be negative";
    if (bookingData.children > 0 && !bookingData.childrenAges) newErrors.childrenAges = "Children ages required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save changes
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
    } catch (err) {
      console.error("Failed to update booking:", err);
      alert("Error updating booking.");
    } finally {
      setLoading(false);
    }
  };

  if (!editModal.isOpen) return null;

  return (
    <div className="booking-edit-modal-overlay">
      <div className="booking-edit-modal-content">
        <div className="booking-edit-modal-header">
          <h2 className="booking-edit-modal-title">Edit Booking</h2>
          <button className="booking-edit-modal-close" onClick={closeEditModal} disabled={loading}>×</button>
        </div>

        <div className="booking-edit-modal-body">
          {fetchLoading ? (
            <div className="booking-edit-modal-loading">
              <div className="booking-edit-modal-spinner"></div>
              <p>Loading booking data...</p>
            </div>
          ) : (
            <div className="booking-edit-modal-form-grid">
              {/* Agency */}
              <div className="booking-edit-modal-form-group">
                <label>Agency *</label>
                <select value={bookingData.agencyId} name="agencyId" onChange={handleChange} disabled={loading}>
                  <option value="">Select an agency</option>
                  {agencies.map(a => <option key={a.id} value={a.id}>{a.agencyName}</option>)}
                </select>
                {errors.agencyId && <div className="booking-edit-modal-error-message">{errors.agencyId}</div>}
              </div>

              {/* Supplier */}
              <div className="booking-edit-modal-form-group">
                <label>Supplier *</label>
                <select value={bookingData.supplierId} name="supplierId" onChange={handleChange} disabled={loading}>
                  <option value="">Select a supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
                </select>
                {errors.supplierId && <div className="booking-edit-modal-error-message">{errors.supplierId}</div>}
              </div>

              {/* Hotel */}
              <div className="booking-edit-modal-form-group">
                <label>Hotel *</label>
                <div className="booking-edit-modal-hotel-search">
                  <input
                    type="text"
                    value={hotelQuery}
                    placeholder="Search hotel..."
                    onChange={e => {
                      const value = e.target.value;
                      setHotelQuery(value);
                      setShowHotelDropdown(true);
                      if (bookingData.hotelName !== value) setBookingData(prev => ({ ...prev, hotelId: "" }));
                    }}
                    onFocus={() => setShowHotelDropdown(true)}
                    disabled={loading}
                  />
                  {showHotelDropdown && filteredHotels.length > 0 && (
                    <div className="booking-edit-modal-hotel-dropdown">
                      {filteredHotels.map(h => (
                        <div key={h.id} onClick={() => {
                          setBookingData(prev => ({ ...prev, hotelId: h.id, hotelName: h.hotelName }));
                          setHotelQuery(h.hotelName);
                          setShowHotelDropdown(false);
                        }}>{h.hotelName}</div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.hotelId && <div className="booking-edit-modal-error-message">{errors.hotelId}</div>}
              </div>

              {/* Dates */}
              <div className="booking-edit-modal-form-group">
                <label>Check-In *</label>
                <input type="datetime-local" value={bookingData.checkIn} name="checkIn" onChange={handleChange} min={today} disabled={loading} />
                {errors.checkIn && <div className="booking-edit-modal-error-message">{errors.checkIn}</div>}
              </div>
              <div className="booking-edit-modal-form-group">
                <label>Check-Out *</label>
                <input type="datetime-local" value={bookingData.checkOut} name="checkOut" onChange={handleChange} min={bookingData.checkIn || today} disabled={loading} />
                {errors.checkOut && <div className="booking-edit-modal-error-message">{errors.checkOut}</div>}
              </div>

              {/* Rooms & Guests */}
              <div className="booking-edit-modal-form-group">
                <label>Number of Rooms *</label>
                <input type="number" name="numberOfRooms" value={bookingData.numberOfRooms} min="1" onChange={handleChange} disabled={loading} />
                {errors.numberOfRooms && <div className="booking-edit-modal-error-message">{errors.numberOfRooms}</div>}
              </div>

              <div className="booking-edit-modal-guests-section">
                <div className="booking-edit-modal-form-group">
                  <label>Adults *</label>
                  <input type="number" name="adults" value={bookingData.adults} min="1" onChange={handleChange} disabled={loading} />
                  {errors.adults && <div className="booking-edit-modal-error-message">{errors.adults}</div>}
                </div>
                <div className="booking-edit-modal-form-group">
                  <label>Children</label>
                  <input type="number" name="children" value={bookingData.children} min="0" onChange={handleChange} disabled={loading} />
                  {errors.children && <div className="booking-edit-modal-error-message">{errors.children}</div>}
                </div>
                <div className="booking-edit-modal-total-people">
                  <span>Total People: {bookingData.totalPeople}</span>
                </div>
              </div>

              {/* Children Ages */}
              {bookingData.children > 0 && (
                <div className="booking-edit-modal-form-group">
                  <label>Children Ages *</label>
                  <input type="text" value={bookingData.childrenAges} onChange={handleChildrenAgesChange} placeholder="e.g., 5, 8, 10" disabled={loading} />
                  <div>Enter ages separated by commas</div>
                  {ageWarnings.map((w, idx) => <div key={idx} className="booking-edit-modal-warning-message">{w}</div>)}
                  {errors.childrenAges && <div className="booking-edit-modal-error-message">{errors.childrenAges}</div>}
                </div>
              )}

              {/* Special Request */}
              <div className="booking-edit-modal-form-group">
                <label>Special Request</label>
                <textarea value={bookingData.specialRequest} name="specialRequest" onChange={handleChange} rows="3" disabled={loading} />
              </div>
            </div>
          )}
        </div>

        <div className="booking-edit-modal-footer">
          <button onClick={closeEditModal} disabled={loading}>Cancel</button>
          <button onClick={handleSave} disabled={loading || fetchLoading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingEditModal;

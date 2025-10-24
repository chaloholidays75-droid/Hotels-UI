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
    totalPeople: 1, // New field for automatic calculation
    childrenAges: "",
    specialRequest: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [ageWarnings, setAgeWarnings] = useState([]);
  
  // New state for dropdown data
  const [agencies, setAgencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Calculate total people whenever adults or children change
  useEffect(() => {
    const totalPeople = parseInt(bookingData.adults || 0) + parseInt(bookingData.children || 0);
    setBookingData(prev => ({ ...prev, totalPeople }));
  }, [bookingData.adults, bookingData.children]);

  // Fetch dropdown data and pre-fill form
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
        
        // Pre-fill form with existing booking data
        if (editModal.booking) {
          const totalPeople = (editModal.booking.adults || 0) + (editModal.booking.children || 0);
          
          setBookingData({
            agencyId: editModal.booking.agencyId?.toString() || "",
            supplierId: editModal.booking.supplierId?.toString() || "",
            hotelId: editModal.booking.hotelId?.toString() || "",
            checkIn: editModal.booking.checkIn ? editModal.booking.checkIn.slice(0, 16) : "",
            checkOut: editModal.booking.checkOut ? editModal.booking.checkOut.slice(0, 16) : "",
            numberOfRooms: editModal.booking.numberOfRooms || 1,
            adults: editModal.booking.adults || 1,
            children: editModal.booking.children || 0,
            totalPeople: totalPeople, // Set calculated total
            childrenAges: editModal.booking.childrenAges || "",
            specialRequest: editModal.booking.specialRequest || "",
          });

          // Generate age warnings for existing data
          if (editModal.booking.childrenAges) {
            const ages = editModal.booking.childrenAges.split(',').map(age => age.trim()).filter(age => age !== '');
            const warnings = [];
            ages.forEach((age, index) => {
              const ageNum = parseInt(age);
              if (isNaN(ageNum)) {
                warnings.push(`Child ${index + 1} has invalid age`);
              } else if (ageNum > 12) {
                warnings.push(`Child ${index + 1} (age ${age}) will be counted as adult`);
              } else if (ageNum < 0) {
                warnings.push(`Child ${index + 1} age cannot be negative`);
              } else if (ageNum > 17) {
                warnings.push(`Child ${index + 1} (age ${age}) is too old to be considered a child`);
              }
            });
            setAgeWarnings(warnings);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
      } finally {
        setFetchLoading(false);
      }
    };

    if (editModal.isOpen && editModal.booking) {
      fetchDropdownData();
    }
  }, [editModal.isOpen, editModal.booking]);

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

    // Validate children ages
    if (bookingData.children > 0 && !bookingData.childrenAges) {
      newErrors.childrenAges = "Children ages are required when children count is more than 0";
    }

    if (bookingData.childrenAges) {
      const ages = bookingData.childrenAges.split(',').map(age => age.trim()).filter(age => age !== '');
      if (ages.length !== bookingData.children) {
        newErrors.childrenAges = `Number of ages (${ages.length}) must match children count (${bookingData.children})`;
      }
      
      // Check for ages above 12
      const warnings = [];
      ages.forEach((age, index) => {
        const ageNum = parseInt(age);
        if (isNaN(ageNum)) {
          warnings.push(`Child ${index + 1} has invalid age`);
        } else if (ageNum > 12) {
          warnings.push(`Child ${index + 1} (age ${age}) will be counted as adult`);
        } else if (ageNum < 0) {
          warnings.push(`Child ${index + 1} age cannot be negative`);
        } else if (ageNum > 17) {
          warnings.push(`Child ${index + 1} (age ${age}) is too old to be considered a child`);
        }
      });
      setAgeWarnings(warnings);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleChildrenAgesChange = (e) => {
    const value = e.target.value;
    setBookingData(prev => ({ ...prev, childrenAges: value }));
    
    // Clear warnings when ages change
    if (value) {
      const ages = value.split(',').map(age => age.trim()).filter(age => age !== '');
      const warnings = [];
      ages.forEach((age, index) => {
        const ageNum = parseInt(age);
        if (isNaN(ageNum)) {
          warnings.push(`Child ${index + 1} has invalid age`);
        } else if (ageNum > 12) {
          warnings.push(`Child ${index + 1} (age ${age}) will be counted as adult`);
        } else if (ageNum < 0) {
          warnings.push(`Child ${index + 1} age cannot be negative`);
        } else if (ageNum > 17) {
          warnings.push(`Child ${index + 1} (age ${age}) is too old to be considered a child`);
        }
      });
      setAgeWarnings(warnings);
    } else {
      setAgeWarnings([]);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Convert string IDs back to numbers for the API
      const payload = {
        ...bookingData,
        agencyId: parseInt(bookingData.agencyId),
        supplierId: parseInt(bookingData.supplierId),
        hotelId: parseInt(bookingData.hotelId),
        numberOfRooms: parseInt(bookingData.numberOfRooms),
        adults: parseInt(bookingData.adults),
        children: parseInt(bookingData.children),
        totalPeople: parseInt(bookingData.totalPeople), // Include total people
      };

      await bookingApi.updateBooking(editModal.booking.id, payload);
      refreshBookings();
      closeEditModal();
      // Show success message
      alert("Booking updated successfully!");
    } catch (error) {
      console.error("Failed to update booking:", error);
      alert("Error updating booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!editModal.isOpen) return null;

  const today = new Date().toISOString().slice(0, 16);

  // Get selected agency and supplier names for display
  const selectedAgency = agencies.find(agency => agency.id === parseInt(bookingData.agencyId));
  const selectedSupplier = suppliers.find(supplier => supplier.id === parseInt(bookingData.supplierId));

  return (
    <div className="booking-edit-modal-overlay">
      <div className="booking-edit-modal-content">
        <div className="booking-edit-modal-header">
          <div className="booking-edit-modal-title-section">
            <h2 className="booking-edit-modal-title">Edit Booking</h2>
            {editModal.booking && (
              <div className="booking-edit-ticket-info">
                <span className="booking-edit-ticket-label">Ticket #</span>
                <span className="booking-edit-ticket-number">{editModal.booking.ticketNumber}</span>
              </div>
            )}
          </div>
          <button 
            className="booking-edit-modal-close"
            onClick={closeEditModal}
            disabled={loading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="booking-edit-modal-body">
          <div className="booking-edit-form">
            <div className="booking-edit-form-grid">
              {/* Agency & Supplier Section */}
              <div className="booking-edit-form-section">
                <h3 className="booking-edit-section-title">Agency & Supplier</h3>
                
                {/* Agency Selection */}
                <div className="booking-edit-form-group">
                  <label className="booking-edit-label">
                    Agency *
                    {errors.agencyId && <span className="booking-edit-error"> - {errors.agencyId}</span>}
                  </label>
                  {fetchLoading ? (
                    <div className="booking-edit-loading">Loading agencies...</div>
                  ) : (
                    <select
                      name="agencyId"
                      className={`booking-edit-select ${errors.agencyId ? 'booking-edit-input-error' : ''}`}
                      value={bookingData.agencyId}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select an agency</option>
                      {agencies.map(agency => (
                        <option key={agency.id} value={agency.id}>
                          {agency.agencyName} {agency.id ? `(ID: ${agency.id})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedAgency && (
                    <div className="booking-edit-selected-info">
                      Currently selected: <strong>{selectedAgency.agencyName}</strong>
                    </div>
                  )}
                </div>

                {/* Supplier Selection */}
                <div className="booking-edit-form-group">
                  <label className="booking-edit-label">
                    Supplier *
                    {errors.supplierId && <span className="booking-edit-error"> - {errors.supplierId}</span>}
                  </label>
                  {fetchLoading ? (
                    <div className="booking-edit-loading">Loading suppliers...</div>
                  ) : (
                    <select
                      name="supplierId"
                      className={`booking-edit-select ${errors.supplierId ? 'booking-edit-input-error' : ''}`}
                      value={bookingData.supplierId}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.supplierName} {supplier.id ? `(ID: ${supplier.id})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedSupplier && (
                    <div className="booking-edit-selected-info">
                      Currently selected: <strong>{selectedSupplier.supplierName}</strong>
                    </div>
                  )}
                </div>

                {/* Hotel ID */}
                <div className="booking-edit-form-group">
                  <label className="booking-edit-label">
                    Hotel ID *
                    {errors.hotelId && <span className="booking-edit-error"> - {errors.hotelId}</span>}
                  </label>
                  <input
                    type="number"
                    name="hotelId"
                    className={`booking-edit-input ${errors.hotelId ? 'booking-edit-input-error' : ''}`}
                    value={bookingData.hotelId}
                    onChange={handleChange}
                    min="1"
                    placeholder="Enter hotel ID"
                    disabled={loading}
                  />
                  <div className="booking-edit-helper-text">
                    Current hotel ID: {editModal.booking?.hotelId}
                  </div>
                </div>
              </div>

              {/* Dates Section */}
              <div className="booking-edit-form-section">
                <h3 className="booking-edit-section-title">Dates</h3>
                <div className="booking-edit-form-group">
                  <label className="booking-edit-label">
                    Check-In Date & Time *
                    {errors.checkIn && <span className="booking-edit-error"> - {errors.checkIn}</span>}
                  </label>
                  <input
                    type="datetime-local"
                    name="checkIn"
                    className={`booking-edit-input ${errors.checkIn ? 'booking-edit-input-error' : ''}`}
                    value={bookingData.checkIn}
                    onChange={handleChange}
                    min={today}
                    disabled={loading}
                  />
                  <div className="booking-edit-helper-text">
                    Original: {editModal.booking?.checkIn ? new Date(editModal.booking.checkIn).toLocaleString() : 'N/A'}
                  </div>
                </div>

                <div className="booking-edit-form-group">
                  <label className="booking-edit-label">
                    Check-Out Date & Time *
                    {errors.checkOut && <span className="booking-edit-error"> - {errors.checkOut}</span>}
                  </label>
                  <input
                    type="datetime-local"
                    name="checkOut"
                    className={`booking-edit-input ${errors.checkOut ? 'booking-edit-input-error' : ''}`}
                    value={bookingData.checkOut}
                    onChange={handleChange}
                    min={bookingData.checkIn || today}
                    disabled={loading}
                  />
                  <div className="booking-edit-helper-text">
                    Original: {editModal.booking?.checkOut ? new Date(editModal.booking.checkOut).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Guests & Rooms Section */}
              <div className="booking-edit-form-section">
                <h3 className="booking-edit-section-title">Guests & Rooms</h3>
                
                {/* Total People Display */}
                <div className="booking-edit-total-guests-card">
                  <div className="booking-edit-total-guests-header">
                    <span className="booking-edit-total-icon">👥</span>
                    <span className="booking-edit-total-label">Total Guests</span>
                  </div>
                  <div className="booking-edit-total-count">{bookingData.totalPeople}</div>
                  <div className="booking-edit-guest-breakdown">
                    {bookingData.adults > 0 && (
                      <span className="booking-edit-breakdown-item">
                        {bookingData.adults} adult{bookingData.adults !== 1 ? 's' : ''}
                      </span>
                    )}
                    {bookingData.children > 0 && (
                      <span className="booking-edit-breakdown-item">
                        {bookingData.children} child{bookingData.children !== 1 ? 'ren' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="booking-edit-form-row">
                  <div className="booking-edit-form-group">
                    <label className="booking-edit-label">
                      Number of Rooms *
                      {errors.numberOfRooms && <span className="booking-edit-error"> - {errors.numberOfRooms}</span>}
                    </label>
                    <input
                      type="number"
                      name="numberOfRooms"
                      className={`booking-edit-input ${errors.numberOfRooms ? 'booking-edit-input-error' : ''}`}
                      value={bookingData.numberOfRooms}
                      onChange={handleChange}
                      min="1"
                      max="20"
                      disabled={loading}
                    />
                  </div>

                  <div className="booking-edit-form-group">
                    <label className="booking-edit-label">
                      Adults *
                      {errors.adults && <span className="booking-edit-error"> - {errors.adults}</span>}
                    </label>
                    <input
                      type="number"
                      name="adults"
                      className={`booking-edit-input ${errors.adults ? 'booking-edit-input-error' : ''}`}
                      value={bookingData.adults}
                      onChange={handleChange}
                      min="1"
                      max="50"
                      disabled={loading}
                    />
                  </div>

                  <div className="booking-edit-form-group">
                    <label className="booking-edit-label">
                      Children
                      {errors.children && <span className="booking-edit-error"> - {errors.children}</span>}
                    </label>
                    <input
                      type="number"
                      name="children"
                      className={`booking-edit-input ${errors.children ? 'booking-edit-input-error' : ''}`}
                      value={bookingData.children}
                      onChange={handleChange}
                      min="0"
                      max="20"
                      disabled={loading}
                    />
                  </div>
                </div>

                {bookingData.children > 0 && (
                  <div className="booking-edit-form-group">
                    <label className="booking-edit-label">
                      Children Ages (comma separated) *
                      {errors.childrenAges && <span className="booking-edit-error"> - {errors.childrenAges}</span>}
                    </label>
                    <input
                      type="text"
                      name="childrenAges"
                      className={`booking-edit-input ${errors.childrenAges ? 'booking-edit-input-error' : ''}`}
                      value={bookingData.childrenAges}
                      onChange={handleChildrenAgesChange}
                      placeholder="e.g., 5, 8, 12"
                      disabled={loading}
                    />
                    <div className="booking-edit-helper-text">
                      Enter ages separated by commas. Children above 12 years will be counted as adults.
                    </div>
                    
                    {ageWarnings.length > 0 && (
                      <div className="booking-edit-warnings">
                        {ageWarnings.map((warning, index) => (
                          <div key={index} className="booking-edit-warning">
                            ⚠️ {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Special Requests Section */}
              <div className="booking-edit-form-section booking-edit-form-full-width">
                <h3 className="booking-edit-section-title">Special Requests</h3>
                <div className="booking-edit-form-group">
                  <label className="booking-edit-label">Special Request</label>
                  <textarea
                    name="specialRequest"
                    className="booking-edit-textarea"
                    value={bookingData.specialRequest}
                    onChange={handleChange}
                    placeholder="Any special requirements or requests..."
                    rows="4"
                    disabled={loading}
                  />
                  <div className="booking-edit-helper-text">
                    {editModal.booking?.specialRequest ? 
                      `Original: ${editModal.booking.specialRequest}` : 
                      'No special requests originally'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-edit-modal-actions">
          <button 
            className="booking-edit-btn booking-edit-btn-cancel"
            onClick={closeEditModal}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="booking-edit-btn booking-edit-btn-save"
            onClick={handleSave}
            disabled={loading || fetchLoading}
          >
            {loading ? (
              <>
                <span className="booking-edit-spinner"></span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingEditModal;
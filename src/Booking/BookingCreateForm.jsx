import React, { useEffect, useMemo, useState } from "react";
import bookingApi from "../api/bookingApi";
import agencyApi from "../api/agencyApi";
import supplierApi from "../api/supplierApi";
import "./BookingCreateForm.css";

const defaultStatusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Confirmed", label: "Confirmed" },
  { value: "Cancelled", label: "Cancelled" }
];

const createEmptyRoom = () => ({
  key: `${Date.now()}-${Math.random()}`,
  roomTypeId: "",
  customRoomTypeName: "",
  adults: 2,
  children: 0,
  childrenAges: [],
});

const BookingCreateForm = ({ onSaved, onCancel }) => {
  const [agencies, setAgencies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [form, setForm] = useState({
    agencyId: "",
    supplierId: "",
    checkIn: "",
    checkOut: "",
    status: "Pending",
    specialRequest: "",
  });

  const [rooms, setRooms] = useState([createEmptyRoom()]);

  const [hotelQuery, setHotelQuery] = useState("");
  const [hotelOptions, setHotelOptions] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelSearchOpen, setHotelSearchOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch agencies & suppliers on mount
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [agencyList, supplierList] = await Promise.all([
          agencyApi.getAgencies(),
          supplierApi.getSuppliersList?.() || supplierApi.getSuppliers(),
        ]);
        setAgencies(Array.isArray(agencyList) ? agencyList : []);
        setSuppliers(Array.isArray(supplierList) ? supplierList : []);
      } catch (err) {
        console.error("Failed to load lookups", err);
        setError("Failed to load agencies or suppliers. Please try again later.");
      }
    };

    loadLookups();
  }, []);

  // Hotel autocomplete search
  useEffect(() => {
    if (!hotelSearchOpen || hotelQuery.trim().length < 2) {
      setHotelOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await bookingApi.searchHotels(hotelQuery.trim(), {
          signal: controller.signal,
        });
        setHotelOptions(Array.isArray(result) ? result : []);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Hotel search failed", err);
          setError("Unable to search hotels right now.");
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [hotelQuery, hotelSearchOpen]);

  // Fetch room types when a hotel is selected
  useEffect(() => {
    const loadRoomTypes = async () => {
      if (!selectedHotel?.id) {
        setRoomTypes([]);
        return;
      }

      try {
        const types = await bookingApi.getRoomTypesForHotel(selectedHotel.id);
        setRoomTypes(Array.isArray(types) ? types : []);
      } catch (err) {
        console.error("Failed to load room types", err);
        setError("Failed to load room types for the selected hotel.");
      }
    };

    loadRoomTypes();
  }, [selectedHotel]);

  const numberOfRooms = useMemo(() => rooms.length, [rooms]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectHotel = (hotel) => {
    setSelectedHotel(hotel);
    setHotelQuery(hotel.hotelName || "");
    setHotelSearchOpen(false);
  };

  const handleRoomChange = (index, changes) => {
    setRooms((prevRooms) =>
      prevRooms.map((room, i) => {
        if (i !== index) return room;
        let updatedRoom = { ...room, ...changes };

        if (typeof changes.children === "number" || typeof changes.children === "string") {
          const childrenCount = Number(changes.children);
          if (!Number.isNaN(childrenCount)) {
            const ages = [...(updatedRoom.childrenAges || [])];
            if (childrenCount > ages.length) {
              for (let i = ages.length; i < childrenCount; i += 1) {
                ages.push("");
              }
            } else if (childrenCount < ages.length) {
              ages.splice(childrenCount);
            }
            updatedRoom.childrenAges = ages;
          }
        }

        return updatedRoom;
      })
    );
  };

  const handleChildrenAgeChange = (roomIndex, ageIndex, value) => {
    setRooms((prevRooms) =>
      prevRooms.map((room, i) => {
        if (i !== roomIndex) return room;
        const ages = [...room.childrenAges];
        ages[ageIndex] = value;
        return { ...room, childrenAges: ages };
      })
    );
  };

  const addRoom = () => {
    setRooms((prev) => [...prev, createEmptyRoom()]);
  };

  const removeRoom = (index) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setForm({
      agencyId: "",
      supplierId: "",
      checkIn: "",
      checkOut: "",
      status: "Pending",
      specialRequest: "",
    });
    setHotelQuery("");
    setSelectedHotel(null);
    setRooms([createEmptyRoom()]);
    setHotelOptions([]);
    setError(null);
    setSuccessMessage(null);
  };

  const validateForm = () => {
    if (!form.agencyId) return "Please choose an agency.";
    if (!form.supplierId) return "Please choose a supplier.";
    if (!selectedHotel?.id) return "Please select a hotel from the search results.";
    if (!form.checkIn) return "Please provide a check-in date.";
    if (!form.checkOut) return "Please provide a check-out date.";
    if (new Date(form.checkOut) < new Date(form.checkIn)) return "Check-out cannot be before check-in.";
    if (!rooms.length) return "Please add at least one room.";

    for (let i = 0; i < rooms.length; i += 1) {
      const room = rooms[i];
      if (!room.roomTypeId && !room.customRoomTypeName.trim()) {
        return `Room ${i + 1}: please select a room type or enter a custom type.`;
      }
      if (Number(room.adults) < 1) {
        return `Room ${i + 1}: at least one adult is required.`;
      }
      if (Number(room.children) !== (room.childrenAges?.length || 0)) {
        return `Room ${i + 1}: please provide ages for all children.`;
      }
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      agencyId: Number(form.agencyId),
      supplierId: Number(form.supplierId),
      hotelId: selectedHotel.id,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      numberOfRooms,
      status: form.status,
      specialRequest: form.specialRequest?.trim() || null,
      bookingRooms: rooms.map((room) => ({
        roomTypeId: room.roomTypeId ? Number(room.roomTypeId) : 0,
        roomType: !room.roomTypeId && room.customRoomTypeName
          ? { id: 0, name: room.customRoomTypeName.trim(), hotelId: selectedHotel.id }
          : null,
        adults: Number(room.adults) || 0,
        children: Number(room.children) || 0,
        childrenAges: (room.childrenAges || [])
          .map((age) => age?.toString().trim())
          .filter((age) => age !== "")
          .join(","),
      })),
    };

    setSubmitting(true);
    try {
      await bookingApi.createBooking(payload);
      setSuccessMessage("Booking created successfully.");
      if (onSaved) onSaved();
      resetForm();
    } catch (err) {
      console.error("Failed to create booking", err);
      const message = err?.response?.data?.message || "Failed to create the booking.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-create-form">
      <div className="booking-create-form__header">
        <h2>Create New Booking</h2>
        <p>Fill in the booking details below. Fields marked with * are required.</p>
      </div>

      <form className="booking-create-form__body" onSubmit={handleSubmit}>
        {error && <div className="booking-create-form__alert booking-create-form__alert--error">{error}</div>}
        {successMessage && (
          <div className="booking-create-form__alert booking-create-form__alert--success">{successMessage}</div>
        )}

        <section className="booking-create-form__section">
          <h3 className="booking-create-form__section-title">Booking Overview</h3>
          <div className="booking-create-form__grid">
            <label className="booking-create-form__field">
              <span>Agency *</span>
              <select
                value={form.agencyId}
                onChange={(event) => handleFormChange("agencyId", event.target.value)}
                required
              >
                <option value="">Select agency</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.agencyName || agency.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="booking-create-form__field">
              <span>Supplier *</span>
              <select
                value={form.supplierId}
                onChange={(event) => handleFormChange("supplierId", event.target.value)}
                required
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplierName || supplier.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="booking-create-form__field booking-create-form__field--full">
              <span>Hotel *</span>
              <input
                type="text"
                value={hotelQuery}
                placeholder="Search hotel by name, city, country..."
                onFocus={() => setHotelSearchOpen(true)}
                onChange={(event) => {
                  setHotelQuery(event.target.value);
                  setHotelSearchOpen(true);
                  setSelectedHotel(null);
                }}
                onBlur={() => setTimeout(() => setHotelSearchOpen(false), 150)}
                required
              />
              {hotelSearchOpen && hotelOptions.length > 0 && (
                <ul className="booking-create-form__autocomplete">
                  {hotelOptions.map((hotel) => (
                    <li
                      key={hotel.id}
                      className="booking-create-form__autocomplete-item"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleSelectHotel(hotel);
                      }}
                    >
                      <strong>{hotel.hotelName}</strong>
                      {hotel.cityName || hotel.countryName ? (
                        <span>{[hotel.cityName, hotel.countryName].filter(Boolean).join(", ")}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </label>

            <label className="booking-create-form__field">
              <span>Check-in *</span>
              <input
                type="date"
                value={form.checkIn}
                onChange={(event) => handleFormChange("checkIn", event.target.value)}
                required
              />
            </label>

            <label className="booking-create-form__field">
              <span>Check-out *</span>
              <input
                type="date"
                value={form.checkOut}
                onChange={(event) => handleFormChange("checkOut", event.target.value)}
                required
              />
            </label>

            <label className="booking-create-form__field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => handleFormChange("status", event.target.value)}
              >
                {defaultStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="booking-create-form__field booking-create-form__field--full">
            <span>Special requests</span>
            <textarea
              value={form.specialRequest}
              onChange={(event) => handleFormChange("specialRequest", event.target.value)}
              rows={3}
              placeholder="Any notes or requirements for this booking"
            />
          </label>
        </section>

        <section className="booking-create-form__section">
          <div className="booking-create-form__section-heading">
            <div>
              <h3 className="booking-create-form__section-title">Rooms & Occupancy</h3>
              <p className="booking-create-form__section-subtitle">
                Add room allocations, occupants and children ages. Total rooms: {numberOfRooms}
              </p>
            </div>
            <button
              type="button"
              className="booking-create-form__add-room"
              onClick={addRoom}
            >
              + Add room
            </button>
          </div>

          <div className="booking-create-form__rooms">
            {rooms.map((room, index) => (
              <div key={room.key} className="booking-create-form__room-card">
                <div className="booking-create-form__room-header">
                  <h4>Room {index + 1}</h4>
                  {rooms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoom(index)}
                      className="booking-create-form__remove-room"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="booking-create-form__grid">
                  <label className="booking-create-form__field">
                    <span>Room type *</span>
                    <select
                      value={room.roomTypeId}
                      onChange={(event) =>
                        handleRoomChange(index, {
                          roomTypeId: event.target.value,
                          customRoomTypeName: "",
                        })
                      }
                    >
                      <option value="">Select room type</option>
                      {roomTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="booking-create-form__field">
                    <span>Custom room type</span>
                    <input
                      type="text"
                      placeholder="Enter if not listed"
                      value={room.customRoomTypeName}
                      onChange={(event) =>
                        handleRoomChange(index, {
                          customRoomTypeName: event.target.value,
                          roomTypeId: "",
                        })
                      }
                    />
                  </label>

                  <label className="booking-create-form__field">
                    <span>Adults *</span>
                    <input
                      type="number"
                      min="1"
                      value={room.adults}
                      onChange={(event) =>
                        handleRoomChange(index, { adults: Number(event.target.value) })
                      }
                    />
                  </label>

                  <label className="booking-create-form__field">
                    <span>Children</span>
                    <input
                      type="number"
                      min="0"
                      value={room.children}
                      onChange={(event) =>
                        handleRoomChange(index, { children: Number(event.target.value) })
                      }
                    />
                  </label>
                </div>

                {room.children > 0 && (
                  <div className="booking-create-form__children-ages">
                    <span>Children ages</span>
                    <div className="booking-create-form__children-ages-inputs">
                      {room.childrenAges.map((age, ageIndex) => (
                        <input
                          key={`${room.key}-age-${ageIndex}`}
                          type="number"
                          min="0"
                          max="17"
                          value={age}
                          onChange={(event) =>
                            handleChildrenAgeChange(index, ageIndex, event.target.value)
                          }
                          placeholder={`Child ${ageIndex + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer className="booking-create-form__footer">
          <div className="booking-create-form__footer-actions">
            {onCancel && (
              <button type="button" className="booking-create-form__button" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button
              type="button"
              className="booking-create-form__button booking-create-form__button--secondary"
              onClick={resetForm}
              disabled={submitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="booking-create-form__button booking-create-form__button--primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Create booking"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};

export default BookingCreateForm;

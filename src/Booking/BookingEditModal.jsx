import React, { useState, useEffect } from "react";
import bookingApi from "../api/bookingApi";
import "./BookingEditModal.css";

const sanitizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// ✅ Converts DB value → editable array format
const parseList = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return val.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
};

// ✅ Improved ChipList — always controlled & logs live updates
function ChipList({ values = [], onChange }) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    console.log("🔄 ChipList render →", values);
  }, [values]);

  const addChip = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const updated = [...(values || []), trimmed];
    console.log("➕ Added chip:", trimmed, "→ New array:", updated);
    onChange(updated);
    setInputValue("");
  };

  const removeChip = (index) => {
    const updated = values.filter((_, i) => i !== index);
    console.log("🗑️ Removed chip at index", index, "→", updated);
    onChange(updated);
  };

  const editChip = (index, newVal) => {
    const updated = values.map((v, i) => (i === index ? newVal : v));
    console.log("✏️ Edited chip index", index, "→", updated);
    onChange(updated);
  };

  return (
    <div className="chip-container">
      {values.map((v, i) => (
        <div className="chip" key={i}>
          <input
            className="chip-edit-input"
            value={v}
            onChange={(e) => editChip(i, e.target.value)}
          />
          <button className="chip-remove" onClick={() => removeChip(i)}>
            ✖
          </button>
        </div>
      ))}

      <div className="chip-add-block">
        <input
          type="text"
          placeholder="Add..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addChip()}
        />
        <button className="chip-add-btn" onClick={addChip}>
          + Add
        </button>
      </div>
    </div>
  );
}

export default function BookingEditModal({ editModal, closeEditModal, refreshBookings }) {
  const b = editModal.booking;

  const [fullBooking, setFullBooking] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    deadline: "",
    specialRequest: "",
  });

  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 16);

  const calculateNights = (ci, co) => {
    if (!ci || !co) return 0;
    const start = new Date(ci);
    const end = new Date(co);
    const diff = end - start;
    return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0;
  };

  const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);

  useEffect(() => {
    if (!editModal.isOpen || !b?.id) return;

    bookingApi.getBookingById(b.id).then((bb) => {
      console.log("📦 Loaded booking:", bb);
      setFullBooking(bb);

      setBookingData({
        checkIn: new Date(bb.checkIn).toISOString().slice(0, 16),
        checkOut: new Date(bb.checkOut).toISOString().slice(0, 16),
        deadline: bb.deadline ? new Date(bb.deadline).toISOString().slice(0, 16) : "",
        specialRequest: bb.specialRequest || "",
      });

      bookingApi.getRoomTypesByHotel(bb.hotelId).then((rt) => {
        console.log("🏨 Room types:", rt);
        setRoomTypes(rt || []);

        const rawRooms =
          bb.bookingRooms && Array.isArray(bb.bookingRooms)
            ? bb.bookingRooms
            : bb.rooms && Array.isArray(bb.rooms)
            ? bb.rooms
            : [];

        const mapped = rawRooms.map((r) => ({
          id: r.id,
          roomTypeId: r.roomTypeId ? Number(r.roomTypeId) : null,
          adults: Number(r.adults) || 1,
          children: Number(r.children) || 0,
          childrenAges: parseList(r.childrenAges),
          inclusion: r.inclusion || "",
          leadGuestName: r.leadGuestName || "",
          guestNames: parseList(r.guestNames),
        }));

        console.log("🧱 Loaded rooms →", mapped);
        setRooms(mapped);
      });
    });
  }, [editModal.isOpen]);

  const updateRoom = (index, field, value) => {
    console.log(`✏️ Updating room ${index} field "${field}" →`, value);
    setRooms((prev) =>
      prev.map((room, i) =>
        i === index ? { ...room, [field]: Array.isArray(value) ? [...value] : value } : room
      )
    );
  };

  const addRoom = () => {
    const newRoom = {
      id: null,
      roomTypeId: null,
      adults: 1,
      children: 0,
      childrenAges: [],
      inclusion: "",
      leadGuestName: "",
      guestNames: [],
    };
    console.log("➕ Added new room");
    setRooms((prev) => [...prev, newRoom]);
  };

  const removeRoom = (index) => {
    console.log("🗑️ Removing room index", index);
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log("💾 Preparing save payload with current rooms:", rooms);

      const cleanedRooms = rooms.map((r) => ({
        id: sanitizeId(r.id),
        roomTypeId: sanitizeId(r.roomTypeId),
        adults: Number(r.adults),
        children: Number(r.children),
        childrenAges: r.childrenAges && Array.isArray(r.childrenAges) ? r.childrenAges : [],
        inclusion: r.inclusion || "",
        leadGuestName: r.leadGuestName || "",
        guestNames: r.guestNames && Array.isArray(r.guestNames) ? r.guestNames : [],
      }));

      const payload = {
        hotelId: sanitizeId(fullBooking?.hotelId),
        agencyId: sanitizeId(fullBooking?.agencyId),
        supplierId: sanitizeId(fullBooking?.supplierId),
        agencyStaffId: sanitizeId(fullBooking?.agencyStaffId),
        checkIn: bookingData.checkIn ? new Date(bookingData.checkIn).toISOString() : null,
        checkOut: bookingData.checkOut ? new Date(bookingData.checkOut).toISOString() : null,
        deadline: bookingData.deadline ? new Date(bookingData.deadline).toISOString() : null,
        specialRequest: bookingData.specialRequest,
        numberOfRooms: cleanedRooms.length,
        numberOfPeople: cleanedRooms.reduce((sum, r) => sum + r.adults + r.children, 0),
        bookingRooms: cleanedRooms,
      };

      console.log("🧾 Payload to send:", JSON.stringify(payload, null, 2));
      await bookingApi.updateBooking(b.id, payload);

      refreshBookings();
      closeEditModal();
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      alert("Failed to update booking!");
    } finally {
      setLoading(false);
    }
  };

  if (!editModal.isOpen) return null;

  return (
    <div className="edit-modal">
      <div className="edit-container">
        <div className="edit-header">
          <h2>Edit Booking</h2>
          <button onClick={closeEditModal}>×</button>
        </div>

        <div className="edit-body">
          {/* --- Booking Info --- */}
          <div className="row-3">
            <div className="input-block">
              <label>Agency</label>
              <input type="text" value={fullBooking?.agencyName || ""} disabled />
            </div>
            <div className="input-block">
              <label>Hotel</label>
              <input type="text" value={fullBooking?.hotelName || ""} disabled />
            </div>
            <div className="input-block">
              <label>Supplier</label>
              <input type="text" value={fullBooking?.supplierName || ""} disabled />
            </div>
          </div>

          {/* --- Dates --- */}
          <div className="row-3">
            <div className="input-block">
              <label>Check-In</label>
              <input
                type="datetime-local"
                value={bookingData.checkIn}
                min={today}
                onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
              />
            </div>
            <div className="input-block">
              <label>Check-Out</label>
              <input
                type="datetime-local"
                value={bookingData.checkOut}
                min={bookingData.checkIn || today}
                onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
              />
            </div>
            <div className="input-block">
              <label>Nights</label>
              <input type="number" value={nights} disabled />
            </div>
          </div>

          {/* --- Room Table --- */}
          <div className="room-table-wrapper">
            <table className="room-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Adults</th>
                  <th>Children</th>
                  <th>Ages</th>
                  <th>Lead Guest</th>
                  <th>Guests</th>
                  <th>Inclusion</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <select
                        value={r.roomTypeId ?? ""}
                        onChange={(e) => updateRoom(i, "roomTypeId", sanitizeId(e.target.value))}
                      >
                        <option value="">Select</option>
                        {roomTypes.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={r.adults}
                        onChange={(e) => updateRoom(i, "adults", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={r.children}
                        onChange={(e) => updateRoom(i, "children", Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <ChipList
                        values={r.childrenAges}
                        onChange={(newVal) => updateRoom(i, "childrenAges", newVal)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={r.leadGuestName}
                        onChange={(e) => updateRoom(i, "leadGuestName", e.target.value)}
                      />
                    </td>
                    <td>
                      <ChipList
                        values={r.guestNames}
                        onChange={(newVal) => updateRoom(i, "guestNames", newVal)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={r.inclusion}
                        onChange={(e) => updateRoom(i, "inclusion", e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className="remove-room-btn"
                        onClick={() => removeRoom(i)}
                        title="Remove this room"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="add-room-wrapper">
              <button className="add-room-btn" onClick={addRoom}>
                ➕ Add Room
              </button>
            </div>
          </div>

          {/* --- Notes --- */}
          <div className="split-row">
            <div className="special-block">
              <label>Special Request</label>
              <textarea
                value={bookingData.specialRequest}
                onChange={(e) =>
                  setBookingData({
                    ...bookingData,
                    specialRequest: e.target.value,
                  })
                }
              ></textarea>
            </div>

            <div className="deadline-block">
              <label>Deadline</label>
              <input
                type="datetime-local"
                value={bookingData.deadline}
                onChange={(e) => setBookingData({ ...bookingData, deadline: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="edit-footer">
          <button onClick={closeEditModal}>Cancel</button>
          <button disabled={loading} onClick={handleSave}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

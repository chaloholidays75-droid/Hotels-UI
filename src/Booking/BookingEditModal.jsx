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

// ✅ Chip list component
function ChipList({ values, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");

  const addValue = () => {
    if (!newValue.trim()) return;
    onChange([...values, newValue.trim()]);
    setNewValue("");
  };

  const removeValue = (index) => {
    const updated = values.filter((_, i) => i !== index);
    onChange(updated);
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditValue(values[index]);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;

    const updated = [...values];
    updated[editingIndex] = editValue.trim();
    onChange(updated);

    setEditingIndex(null);
    setEditValue("");
  };

  return (
    <div className="chip-container">

      {values.map((v, i) => (
        <div className="chip" key={i}>
          
          {editingIndex === i ? (
            <input
              className="chip-edit-input"
              value={editValue}
              autoFocus
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditingIndex(null);
              }}
            />
          ) : (
            <span onClick={() => startEdit(i)} className="chip-text">
              {v}
            </span>
          )}

          <button className="chip-remove" onClick={() => removeValue(i)}>
            ✖
          </button>
        </div>
      ))}

      <div className="chip-add-block">
        <input
          type="text"
          placeholder="Add..."
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addValue()}
        />
        <button className="chip-add-btn" onClick={addValue}>
          + Add
        </button>
      </div>
    </div>
  );
}


export default function BookingEditModal({
  editModal,
  closeEditModal,
  refreshBookings
}) {
  const b = editModal.booking;

  const [fullBooking, setFullBooking] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    deadline: "",
    specialRequest: ""
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
      setFullBooking(bb);

      setBookingData({
        checkIn: new Date(bb.checkIn).toISOString().slice(0, 16),
        checkOut: new Date(bb.checkOut).toISOString().slice(0, 16),
        deadline: bb.deadline
          ? new Date(bb.deadline).toISOString().slice(0, 16)
          : "",
        specialRequest: bb.specialRequest || ""
      });

      bookingApi.getRoomTypesByHotel(bb.hotelId).then((rt) => {
        setRoomTypes(rt || []);

        const rawRooms =
          bb.bookingRooms && Array.isArray(bb.bookingRooms)
            ? bb.bookingRooms
            : bb.rooms && Array.isArray(bb.rooms)
            ? bb.rooms
            : [];

        setRooms(
          rawRooms.map((r) => ({
            id: r.id,
            roomTypeId: r.roomTypeId ? Number(r.roomTypeId) : null,
            adults: Number(r.adults) || 1,
            children: Number(r.children) || 0,
            childrenAges: parseList(r.childrenAges), // ✅ FIX
            inclusion: r.inclusion || "",
            leadGuestName: r.leadGuestName || "",
            guestNames: parseList(r.guestNames) // ✅ FIX
          }))
        );
      });
    });
  }, [editModal.isOpen]);

  const updateRoom = (i, field, value) => {
    setRooms((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[i][field] = value;
      return copy;
    });
  };
// 🧩 Add these functions just above handleSave()
const addRoom = () => {
  const newRoom = {
    id: null,
    roomTypeId: null,
    adults: 1,
    children: 0,
    childrenAges: [],
    inclusion: "",
    leadGuestName: "",
    guestNames: []
  };
  setRooms((prev) => [...prev, newRoom]);
};

const removeRoom = (index) => {
  setRooms((prev) => prev.filter((_, i) => i !== index));
};

  const handleSave = async () => {
    try {
      setLoading(true);

      const cleanedRooms = rooms.map((r) => ({
        id: sanitizeId(r.id),
        roomTypeId: sanitizeId(r.roomTypeId),
        adults: Number(r.adults),
        children: Number(r.children),
        childrenAges: r.childrenAges && Array.isArray(r.childrenAges) ? r.childrenAges : [], //✅ FIX
        inclusion: r.inclusion || "",
        leadGuestName: r.leadGuestName || "",
        guestNames: r.guestNames && Array.isArray(r.guestNames) ? r.guestNames : [],
      }));

      const payload = {
        hotelId: sanitizeId(fullBooking?.hotelId),
        agencyId: sanitizeId(fullBooking?.agencyId),
        supplierId: sanitizeId(fullBooking?.supplierId),
        agencyStaffId: sanitizeId(fullBooking?.agencyStaffId),

        checkIn: bookingData.checkIn
          ? new Date(bookingData.checkIn).toISOString()
          : null,
        checkOut: bookingData.checkOut
          ? new Date(bookingData.checkOut).toISOString()
          : null,
        deadline: bookingData.deadline
          ? new Date(bookingData.deadline).toISOString()
          : null,

        specialRequest: bookingData.specialRequest,
        numberOfRooms: cleanedRooms.length,
        numberOfPeople: cleanedRooms.reduce(
          (sum, r) => sum + r.adults + r.children,
          0
        ),

        bookingRooms: cleanedRooms
      };

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

          <div className="row-3">
            <div className="input-block">
              <label>Check-In</label>
              <input
                type="datetime-local"
                value={bookingData.checkIn}
                min={today}
                onChange={(e) =>
                  setBookingData({ ...bookingData, checkIn: e.target.value })
                }
              />
            </div>

            <div className="input-block">
              <label>Check-Out</label>
              <input
                type="datetime-local"
                value={bookingData.checkOut}
                min={bookingData.checkIn || today}
                onChange={(e) =>
                  setBookingData({ ...bookingData, checkOut: e.target.value })
                }
              />
            </div>

            <div className="input-block">
              <label>Nights</label>
              <input type="number" value={nights} disabled />
            </div>
          </div>

          {/* ✅ Room table */}
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
              onChange={(e) =>
                updateRoom(i, "roomTypeId", sanitizeId(e.target.value))
              }
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
              onChange={(e) =>
                updateRoom(i, "adults", Number(e.target.value))
              }
            />
          </td>

          <td>
            <input
              type="number"
              min="0"
              value={r.children}
              onChange={(e) =>
                updateRoom(i, "children", Number(e.target.value))
              }
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
              onChange={(e) =>
                updateRoom(i, "leadGuestName", e.target.value)
              }
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
              onChange={(e) =>
                updateRoom(i, "inclusion", e.target.value)
              }
            />
          </td>

          {/* 🗑️ Remove Button */}
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

  {/* ➕ Add Room Button */}
  <div className="add-room-wrapper">
    <button className="add-room-btn" onClick={addRoom}>
      ➕ Add Room
    </button>
  </div>
</div>


          <div className="split-row">
            <div className="special-block">
              <label>Special Request</label>
              <textarea
                value={bookingData.specialRequest}
                onChange={(e) =>
                  setBookingData({
                    ...bookingData,
                    specialRequest: e.target.value
                  })
                }
              ></textarea>
            </div>

            <div className="deadline-block">
              <label>Deadline</label>
              <input
                type="datetime-local"
                value={bookingData.deadline}
                onChange={(e) =>
                  setBookingData({ ...bookingData, deadline: e.target.value })
                }
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

import React, { useState, useEffect, useRef } from "react";
import bookingApi from "../api/bookingApi";
import "./BookingEditModal.css";

import { DateRange } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

// ------------------ Helpers ------------------
const sanitizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

let debugShown = false;

const parseList = (val) => {
  if (!debugShown) {
    console.log("parseList first call →", val);
    debugShown = true;
  }

  if (Array.isArray(val)) return val;
  if (!val) return [];
  if (typeof val === "string") {
    return val
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
};

const toISODate = (dateObj) => {
  if (!(dateObj instanceof Date) || isNaN(dateObj)) return "";
  return dateObj.toISOString().split("T")[0];
};

const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

// ------------------ Message Box Component ------------------
function SuccessMessageBox({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto close after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="success-message-box">
      <div className="success-message-content">
        <span className="success-icon">✓</span>
        <span className="success-text">{message}</span>
        <button className="success-close-btn" onClick={onClose}>×</button>
      </div>
    </div>
  );
}

// ------------------ ChipList ------------------
function ChipList({ values = [], onChange, type, onStartTyping, onStopTyping }) {
  const [inputValue, setInputValue] = useState("");

  const addChip = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onChange([...(values || []), trimmed]);
    setInputValue("");
  };

  const removeChip = (index) => {
    const updated = values.filter((_, i) => i !== index);
    onChange(updated);
  };

  const editChip = (index, newVal) => {
    const updated = values.map((v, i) => (i === index ? newVal : v));
    onChange(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip();
    }
  };

  return (
    <div className="chip-container">
      {values.map((v, i) => (
        <div className="chip" key={i}>
          <input
            className={`chip-edit-input ${
              type === "guest" ? "guest-chip" : "age-chip"
            }`}
            onFocus={onStartTyping}
            onBlur={onStopTyping}
            value={v}
            onChange={(e) => editChip(i, e.target.value)}
            onKeyDown={handleKeyDown}
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
          onFocus={onStartTyping}
          onBlur={onStopTyping}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="chip-add-btn tiny" onClick={addChip}>
          + Add
        </button>
      </div>
    </div>
  );
}

// ------------------ MAIN ------------------
export default function BookingEditModal({
  editModal,
  closeEditModal,
  refreshBookings,
}) {
  const b = editModal.booking;

  const calendarRef = useRef(null);

  const [fullBooking, setFullBooking] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [activeEditor, setActiveEditor] = useState(null);
  const [isTypingChip, setIsTypingChip] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    deadline: "",
    specialRequest: "",
  });

  const [showCalendar, setShowCalendar] = useState(false);

  // Close chip popup on click outside (but not while typing)
  useEffect(() => {
    const handler = (e) => {
      if (isTypingChip) return;

      if (
        e.target.closest(".chip-editor-popup") ||
        e.target.closest(".collapsed-chip-display")
      ) {
        return;
      }

      setActiveEditor(null);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isTypingChip]);

  // DateRange state
  const [dateRange, setDateRange] = useState([
    {
      startDate: b?.checkIn ? new Date(b.checkIn) : new Date(),
      endDate: b?.checkOut
        ? new Date(b.checkOut)
        : new Date(new Date().setDate(new Date().getDate() + 1)),
      key: "selection",
    },
  ]);

  // Calculate nights
  const calculateNights = (ci, co) => {
    if (!ci || !co) return 0;
    return (new Date(co) - new Date(ci)) / (1000 * 60 * 60 * 24);
  };

  const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);

  // Close calendar on click outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener("mousedown", onClickOutside);
    }
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showCalendar]);

  // Load booking
  useEffect(() => {
    if (!editModal.isOpen || !b?.id) return;

    bookingApi.getBookingById(b.id).then((bb) => {
      setFullBooking(bb);

      setBookingData({
        checkIn: toISODate(new Date(bb.checkIn)),
        checkOut: toISODate(new Date(bb.checkOut)),
        deadline: bb.deadline ? toISODate(new Date(bb.deadline)) : "",
        specialRequest: bb.specialRequest || "",
      });

      setDateRange([
        {
          startDate: new Date(bb.checkIn),
          endDate: new Date(bb.checkOut),
          key: "selection",
        },
      ]);

      bookingApi.getRoomTypesByHotel(bb.hotelId).then((rt) => {
        setRoomTypes(rt || []);

        const rawRooms = bb.bookingRooms || [];

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

        setRooms(mapped);
      });
    });
  }, [editModal.isOpen, b?.id]);

  // Handle DateRange selection
  const handleRangeChange = (item) => {
    const start = item.selection.startDate;
    const end = item.selection.endDate;

    setDateRange([item.selection]);

    let ci = toISODate(start);
    let co = toISODate(end);

    if (new Date(co) <= new Date(ci)) {
      co = addDays(ci, 1);
    }

    setBookingData((prev) => ({
      ...prev,
      checkIn: ci,
      checkOut: co,
      deadline:
        prev.deadline && new Date(prev.deadline) >= new Date(ci)
          ? addDays(ci, -1)
          : prev.deadline,
    }));
  };

  // Room update logic with auto-calc adults/children
  const updateRoom = (index, field, value) => {
    setRooms((prev) =>
      prev.map((room, i) => {
        if (i !== index) return room;

        let updated = {
          ...room,
          [field]: Array.isArray(value) ? [...value] : value,
        };

        if (field === "guestNames" && Array.isArray(value)) {
          updated.adults = 1 + value.length;
        }

        if (field === "childrenAges" && Array.isArray(value)) {
          updated.children = value.length;
        }

        return updated;
      })
    );
  };

  const addRoom = () => {
    setRooms((prev) => [
      ...prev,
      {
        id: null,
        roomTypeId: null,
        adults: 1,
        children: 0,
        childrenAges: [],
        inclusion: "",
        leadGuestName: "",
        guestNames: [],
      },
    ]);
  };

  const removeRoom = (index) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  // Save
  const [loading, setLoading] = useState(false);
const validateRooms = () => {
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];

    if (!r.roomTypeId) {
      alert(`Room ${i + 1}: Please select a Room Type.`);
      return false;
    }

    if (!r.leadGuestName || r.leadGuestName.trim() === "") {
      alert(`Room ${i + 1}: Lead Guest Name is required.`);
      return false;
    }
  }

  return true;
};
// const validateRoomCounts = () => {
//   for (let i = 0; i < rooms.length; i++) {
//     const r = rooms[i];

//     const adults = r.adults;
//     const children = r.children;
//     const guestNames = r.guestNames?.length || 0;

//     const expectedGuestNames = (adults - 1) + children;

//     if (guestNames !== expectedGuestNames) {
//       alert(
//         `Room ${i + 1}: Missing guest names.\n\n` +
//         `Adults: ${adults}\n` +
//         `Children: ${children}\n\n` +
//         `Required guest names: ${expectedGuestNames}\n` +
//         `Added guest names: ${guestNames}\n\n` +
//         `Please add all remaining adult and child names.`
//       );
//       return false;
//     }

//     // Children ages must match children count
//     if ((r.childrenAges?.length || 0) !== children) {
//       alert(
//         `Room ${i + 1}: Children ages count does not match.\n\n` +
//         `Children: ${children}\n` +
//         `Ages added: ${r.childrenAges.length}\n\n` +
//         `Please enter all ages.`
//       );
//       return false;
//     }
//   }

//   return true;
// };

  const handleSave = async () => {
    try {
      setLoading(true);
//       if (!validateRooms() || !validateRoomCounts()) {
//   return;
// }

      if (!validateRooms()) {
        return; // stop saving
      }

      const cleanedRooms = rooms.map((r) => ({
        id: sanitizeId(r.id),
        roomTypeId: sanitizeId(r.roomTypeId),
        adults: Number(r.adults),
        children: Number(r.children),
        childrenAges: (r.childrenAges || [])
          .map((x) => Number(x))
          .filter((x) => !isNaN(x)),
        inclusion: r.inclusion || "",
        leadGuestName: r.leadGuestName || "",
        guestNames: (r.guestNames || [])
          .map((x) => String(x).trim())
          .filter((x) => x.length > 0),
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
        bookingRooms: cleanedRooms,
      };

      console.log(
        "🔥 FINAL PAYLOAD SENT TO BACKEND:",
        JSON.stringify(payload, null, 2)
      );

      await bookingApi.updateBooking(b.id, payload);

      // Show success message
      setShowSuccessMessage(true);
      
      refreshBookings();
      
      // Close modal after a short delay to show the success message
      setTimeout(() => {
        closeEditModal();
      }, 1500);
      
    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert("Failed to update booking!");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false);
  };

  if (!editModal.isOpen) return null;

  return (
    <div className="edit-modal">
      {/* Success Message Box */}
      {showSuccessMessage && (
        <SuccessMessageBox 
          message="Booking updated successfully!" 
          onClose={handleCloseSuccessMessage}
        />
      )}
      
      <div className="edit-container">
        <div className="edit-header">
          <h2>Edit Booking</h2>
          <button onClick={closeEditModal}>×</button>
        </div>

        <div className="edit-body">
          {/* Basic Info */}
          <div className="row-3">
            <div className="input-block">
              <label>Agency</label>
              <input
                type="text"
                value={fullBooking?.agencyName || ""}
                disabled
              />
            </div>
            <div className="input-block">
              <label>Hotel</label>
              <input
                type="text"
                value={fullBooking?.hotelName || ""}
                disabled
              />
            </div>
            <div className="input-block">
              <label>Supplier</label>
              <input
                type="text"
                value={fullBooking?.supplierName || ""}
                disabled
              />
            </div>
          </div>

          {/* Date Range UI */}
          <div className="row-3">
            <div className="input-block">
              <label>Check-In *</label>
              <div
                className="booking-clickable-date-input"
                onClick={() => setShowCalendar((s) => !s)}
              >
                {bookingData.checkIn
                  ? format(new Date(bookingData.checkIn), "d MMM yyyy")
                  : "Select"}
              </div>
            </div>

            <div className="input-block">
              <label>Check-Out *</label>
              <div
                className="booking-clickable-date-input"
                onClick={() => setShowCalendar((s) => !s)}
              >
                {bookingData.checkOut
                  ? format(new Date(bookingData.checkOut), "d MMM yyyy")
                  : "Select"}
              </div>
            </div>

            <div className="input-block">
              <label>Nights</label>
              <input type="text" disabled value={nights} />
            </div>
          </div>

          {/* Date Range Popup */}
          {showCalendar && (
            <div className="booking-date-range-wrapper" ref={calendarRef}>
              <DateRange
                ranges={dateRange}
                onChange={handleRangeChange}
                months={1}
                direction="horizontal"
                moveRangeOnFirstSelection={false}
                minDate={new Date()}
                rangeColors={["#2a5adf"]}
              />
            </div>
          )}

          {/* Rooms Table */}
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

                    {/* Type */}
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

                    {/* Adults */}
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

                    {/* Children */}
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

                    {/* Children Ages */}
                    <td style={{ position: "relative" }}>
                      <div
                        className="collapsed-chip-display"
                        onClick={() => setActiveEditor(`ages-${i}`)}
                      >
                        {r.childrenAges.length
                          ? r.childrenAges.join(", ")
                          : "—"}
                      </div>

                      {activeEditor === `ages-${i}` && (
                        <div className="chip-editor-popup">
                          <ChipList
                            values={r.childrenAges}
                            onChange={(newVal) =>
                              updateRoom(i, "childrenAges", newVal)
                            }
                            type="age"
                            onStartTyping={() => setIsTypingChip(true)}
                            onStopTyping={() => setIsTypingChip(false)}
                          />
                        </div>
                      )}
                    </td>

                    {/* Lead Guest */}
                    <td>
                      <input
                        type="text"
                        value={r.leadGuestName}
                        onChange={(e) =>
                          updateRoom(i, "leadGuestName", e.target.value)
                        }
                      />
                    </td>

                    {/* Guest Names */}
                    <td style={{ position: "relative" }}>
                      <div
                        className="collapsed-chip-display"
                        onClick={() => setActiveEditor(`guests-${i}`)}
                      >
                        {r.guestNames.length
                          ? r.guestNames.join(", ")
                          : "—"}
                      </div>

                      {activeEditor === `guests-${i}` && (
                        <div className="chip-editor-popup">
                          <ChipList
                            values={r.guestNames}
                            onChange={(newVal) =>
                              updateRoom(i, "guestNames", newVal)
                            }
                            type="guest"
                            onStartTyping={() => setIsTypingChip(true)}
                            onStopTyping={() => setIsTypingChip(false)}
                          />
                        </div>
                      )}
                    </td>

                    {/* Inclusion */}
                    <td>
                      <input
                        type="text"
                        value={r.inclusion}
                        onChange={(e) =>
                          updateRoom(i, "inclusion", e.target.value)
                        }
                      />
                    </td>

                    {/* Remove */}
                    <td>
                      <button
                        className="remove-room-btn"
                        onClick={() => removeRoom(i)}
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

          {/* Special Request + Deadline */}
          <div className="split-row">
            <div className="special-block">
              <label>Special Request</label>
              <textarea
                value={bookingData.specialRequest}
                onChange={(e) =>
                  setBookingData((prev) => ({
                    ...prev,
                    specialRequest: e.target.value,
                  }))
                }
              ></textarea>
            </div>

            <div className="deadline-block">
              <label>Deadline</label>
              <input
                type="date"
                value={bookingData.deadline}
                max={
                  bookingData.checkIn
                    ? addDays(bookingData.checkIn, -1)
                    : undefined
                }
                onChange={(e) =>
                  setBookingData((prev) => ({
                    ...prev,
                    deadline: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
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
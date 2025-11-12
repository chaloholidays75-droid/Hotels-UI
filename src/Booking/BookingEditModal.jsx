import React, { useState, useEffect } from "react";
import bookingApi from "../api/bookingApi";
import "./BookingEditModal.css";
import {
  getCommercialByBooking,
  updateCommercial,
  createCommercial,
} from "../api/commercialApi";

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

    return val
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
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
  refreshBookings,
}) {
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

  const [commercial, setCommercial] = useState({
    id: null,
    buyingCurrency: "USD",
    buyingAmount: "",
    sellingCurrency: "USD",
    sellingPrice: "",
    commissionType: "percentage",
    commissionValue: "",
    incentiveType: "percentage",
    incentiveValue: "",
    profit: 0,
    profitMarginPercent: 0,
    markupPercent: 0,
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

  // ✅ Load booking + commercial
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
        specialRequest: bb.specialRequest || "",
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
            childrenAges: parseList(r.childrenAges),
            inclusion: r.inclusion || "",
            leadGuestName: r.leadGuestName || "",
            guestNames: parseList(r.guestNames),
          }))
        );
      });
    });

    // 🔹 Load commercial for this booking
    getCommercialByBooking(b.id)
      .then((c) => {
        if (c) {
          setCommercial({
            id: c.id,
            buyingCurrency: c.buyingCurrency || "USD",
            buyingAmount: c.buyingAmount || "",
            sellingCurrency: c.sellingCurrency || "USD",
            sellingPrice: c.sellingPrice || "",
            commissionType: c.commissionType || "percentage",
            commissionValue: c.commissionValue || "",
            incentiveType: c.incentiveType || "percentage",
            incentiveValue: c.incentiveValue || "",
            profit: c.profit || 0,
            profitMarginPercent: c.profitMarginPercent || 0,
            markupPercent: c.markupPercent || 0,
          });
        }
      })
      .catch(() => {
        console.warn("No commercial found for this booking, will create new.");
      });
  }, [editModal.isOpen]);

  // ✅ Auto-calc profit, margin, markup
  useEffect(() => {
    const buy = parseFloat(commercial.buyingAmount) || 0;
    const sell = parseFloat(commercial.sellingPrice) || 0;
    const profit = sell - buy;
    const margin = buy ? ((profit / buy) * 100).toFixed(2) : 0;
    const markup = buy ? ((sell / buy - 1) * 100).toFixed(2) : 0;

    setCommercial((prev) => ({
      ...prev,
      profit,
      profitMarginPercent: margin,
      markupPercent: markup,
    }));
  }, [commercial.buyingAmount, commercial.sellingPrice]);

  const updateRoom = (i, field, value) => {
    setRooms((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy[i][field] = value;
      return copy;
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const cleanedRooms = rooms.map((r) => ({
        id: sanitizeId(r.id),
        roomTypeId: sanitizeId(r.roomTypeId),
        adults: Number(r.adults),
        children: Number(r.children),
        childrenAges: Array.isArray(r.childrenAges) ? r.childrenAges : [],
        inclusion: r.inclusion || "",
        leadGuestName: r.leadGuestName || "",
        guestNames: Array.isArray(r.guestNames) ? r.guestNames : [],
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

      await bookingApi.updateBooking(b.id, payload);

      // ✅ Save or update commercial
      if (commercial.id) {
        await updateCommercial(commercial.id, {
          buyingCurrency: commercial.buyingCurrency,
          buyingAmount: parseFloat(commercial.buyingAmount) || 0,
          sellingCurrency: commercial.sellingCurrency,
          sellingPrice: parseFloat(commercial.sellingPrice) || 0,
          commissionType: commercial.commissionType,
          commissionValue: parseFloat(commercial.commissionValue) || 0,
          incentiveType: commercial.incentiveType,
          incentiveValue: parseFloat(commercial.incentiveValue) || 0,
          profit: parseFloat(commercial.profit) || 0,
          profitMarginPercent: parseFloat(commercial.profitMarginPercent) || 0,
          markupPercent: parseFloat(commercial.markupPercent) || 0,
        });
      } else {
        await createCommercial({
          bookingId: b.id,
          buyingCurrency: commercial.buyingCurrency,
          buyingAmount: parseFloat(commercial.buyingAmount) || 0,
          sellingCurrency: commercial.sellingCurrency,
          sellingPrice: parseFloat(commercial.sellingPrice) || 0,
          commissionType: commercial.commissionType,
          commissionValue: parseFloat(commercial.commissionValue) || 0,
          incentiveType: commercial.incentiveType,
          incentiveValue: parseFloat(commercial.incentiveValue) || 0,
          profit: parseFloat(commercial.profit) || 0,
          profitMarginPercent: parseFloat(commercial.profitMarginPercent) || 0,
          markupPercent: parseFloat(commercial.markupPercent) || 0,
        });
      }

      refreshBookings();
      closeEditModal();
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      alert("Failed to update booking or commercial!");
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
          {/* Booking fields */}
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

          {/* Dates */}
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

          {/* Room Table */}
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
                        onChange={(newVal) =>
                          updateRoom(i, "childrenAges", newVal)
                        }
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
                        onChange={(newVal) =>
                          updateRoom(i, "guestNames", newVal)
                        }
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Special Request & Deadline */}
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
                onChange={(e) =>
                  setBookingData({ ...bookingData, deadline: e.target.value })
                }
              />
            </div>
          </div>

          {/* 💼 Commercial Section */}
          <div className="commercial-section">
            <h3>💼 Commercial Details</h3>

            <div className="row-3">
              <div className="input-block">
                <label>Buying Currency</label>
                <input
                  value={commercial.buyingCurrency}
                  onChange={(e) =>
                    setCommercial({
                      ...commercial,
                      buyingCurrency: e.target.value,
                    })
                  }
                />
              </div>
              <div className="input-block">
                <label>Buying Amount</label>
                <input
                  type="number"
                  value={commercial.buyingAmount}
                  onChange={(e) =>
                    setCommercial({
                      ...commercial,
                      buyingAmount: e.target.value,
                    })
                  }
                />
              </div>
              <div className="input-block">
                <label>Selling Price</label>
                <input
                  type="number"
                  value={commercial.sellingPrice}
                  onChange={(e) =>
                    setCommercial({
                      ...commercial,
                      sellingPrice: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="row-3">
              <div className="input-block">
                <label>Commission Type</label>
                <select
                  value={commercial.commissionType}
                  onChange={(e) =>
                    setCommercial({
                      ...commercial,
                      commissionType: e.target.value,
                    })
                  }
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div className="input-block">
                <label>Commission Value</label>
                <input
                  type="number"
                  value={commercial.commissionValue}
                  onChange={(e) =>
                    setCommercial({
                      ...commercial,
                      commissionValue: e.target.value,
                    })
                  }
                />
              </div>
              <div className="input-block">
                <label>Incentive Value</label>
                <input
                  type="number"
                  value={commercial.incentiveValue}
                  onChange={(e) =>
                    setCommercial({
                      ...commercial,
                      incentiveValue: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="row-3">
              <div className="input-block">
                <label>Profit</label>
                <input type="number" value={commercial.profit} disabled />
              </div>
              <div className="input-block">
                <label>Profit Margin %</label>
                <input
                  type="number"
                  value={commercial.profitMarginPercent}
                  disabled
                />
              </div>
              <div className="input-block">
                <label>Markup %</label>
                <input
                  type="number"
                  value={commercial.markupPercent}
                  disabled
                />
              </div>
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

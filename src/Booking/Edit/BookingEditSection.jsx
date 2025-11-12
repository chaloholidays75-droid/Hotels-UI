import React, { useEffect, useState } from "react";
import bookingApi from "../../api/bookingApi";
const parseList = (v) => (Array.isArray(v) ? v : v ? v.split(",").map(x => x.trim()) : []);

export default function BookingEditSection({ initial, onChange }) {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [form, setForm] = useState({ checkIn: "", checkOut: "", deadline: "", specialRequest: "" });

  useEffect(() => {
    if (initial?.id) {
      bookingApi.getRoomTypesByHotel(initial.hotelId).then(setRoomTypes);
      const raw = initial.bookingRooms || [];
      setRooms(raw.map(r => ({
        id: r.id,
        roomTypeId: r.roomTypeId,
        leadGuestName: r.leadGuestName || "",
        guestNames: parseList(r.guestNames),
        inclusion: r.inclusion || ""
      })));
      setForm({
        checkIn: new Date(initial.checkIn).toISOString().slice(0, 16),
        checkOut: new Date(initial.checkOut).toISOString().slice(0, 16),
        deadline: initial.deadline ? new Date(initial.deadline).toISOString().slice(0, 16) : "",
        specialRequest: initial.specialRequest || ""
      });
    }
  }, [initial]);

  useEffect(() => {
    onChange({
      ...form,
      rooms,
      hotelName: initial.hotelName,
      nights:
        (new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24),
    });
  }, [form, rooms]);

  return (
    <section className="card">
      <h3>Booking Details</h3>
      <div className="row-2">
        <div className="input-block">
          <label>Check-In</label>
          <input type="datetime-local" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })}/>
        </div>
        <div className="input-block">
          <label>Check-Out</label>
          <input type="datetime-local" value={form.checkOut} onChange={e => setForm({ ...form, checkOut: e.target.value })}/>
        </div>
      </div>
      <div className="room-table-wrapper">
        <table className="room-table">
          <thead><tr><th>#</th><th>Room Type</th><th>Lead Guest</th><th>Guests</th></tr></thead>
          <tbody>
            {rooms.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  <select
                    value={r.roomTypeId || ""}
                    onChange={e =>
                      setRooms(rooms.map((x, j) => j === i ? { ...x, roomTypeId: Number(e.target.value) } : x))
                    }>
                    <option value="">Select</option>
                    {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                  </select>
                </td>
                <td><input value={r.leadGuestName} onChange={e => setRooms(rooms.map((x, j) => j === i ? { ...x, leadGuestName: e.target.value } : x))}/></td>
                <td><input value={r.guestNames.join(", ")} onChange={e => setRooms(rooms.map((x, j) => j === i ? { ...x, guestNames: e.target.value.split(",") } : x))}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="input-block">
        <label>Special Request</label>
        <textarea value={form.specialRequest} onChange={e => setForm({ ...form, specialRequest: e.target.value })}/>
      </div>
    </section>
  );
}

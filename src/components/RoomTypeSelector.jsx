import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback
} from "react";
import { FaChevronDown } from "react-icons/fa";
import bookingApi from "../api/bookingApi";
import "./RoomTypeSelector.css"

const RoomTypeSelector = forwardRef(
  ({ hotelId, value, onSelect, onNotify, sharedRoomTypes = [], errors = {} }, ref) => {
    const [roomTypes, setRoomTypes] = useState([]);
  

    const [roomSearch, setRoomSearch] = useState("");
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState("");

    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // ✅ Expose imperative validation (optional)
    useImperativeHandle(ref, () => ({
      isValid: () => !!selectedRoom,
      getSelected: () => selectedRoom
    }));

    // ✅ Close dropdown when clicking outside
    useEffect(() => {
      const handler = (e) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
          setShowDropdown(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ✅ Fetch room types for current hotel
      const fetchRoomTypes = useCallback(async () => {
        if (!hotelId) return;
        setLoading(true);
        try {
          const data = await bookingApi.getRoomTypesByHotel(hotelId);
          // merge unique room types from shared state
          const merged = [
            ...data,
            ...sharedRoomTypes.filter(rt => !data.some(d => d.id === rt.id))
          ];
          setRoomTypes(merged);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }, [hotelId, sharedRoomTypes]);
    useEffect(() => {
  if (!value) return;
  const found = roomTypes.find(rt => rt.id === value);
  if (found) {
    setSelectedRoom(found);
    setRoomSearch(found.name);
  } else {
    // fallback: fetch single room type by ID
    (async () => {
      try {
        const single = await bookingApi.getRoomTypeById(value);
        if (single) {
          setSelectedRoom(single);
          setRoomSearch(single.name);
        }
      } catch (e) {
        console.warn("Room type fetch failed:", e);
      }
    })();
  }
}, [value, roomTypes]);

    useEffect(() => {
      fetchRoomTypes();
    }, [fetchRoomTypes]);

    // ✅ Filtered list
    const filteredRooms = roomTypes.filter((rt) =>
      (rt.name || "").toLowerCase().includes(roomSearch.toLowerCase())
    );

    // ✅ Handle selection
    const handleSelect = (room) => {
      setSelectedRoom(room);
      setRoomSearch(room.name);
      setShowDropdown(false);
      setHighlightedIndex(0);
      onSelect?.(room.id);
    };

    // ✅ Handle manual add
    // const handleManualAdd = async () => {
    //   const name = roomSearch.trim();
    //   if (!name || !hotelId) {
    //     setNotice("Please enter a name and select a hotel first");
    //     setTimeout(() => setNotice(""), 2000);
    //     return;
    //   }

    //   const exists = roomTypes.find(
    //     (r) => r.name.toLowerCase() === name.toLowerCase()
    //   );
    //   if (exists) {
    //     setNotice("Room Type already exists.");
    //     setTimeout(() => setNotice(""), 2000);
    //     handleSelect(exists);
    //     return;
    //   }

    //   setSaving(true);
    //   try {
    //     const newRoom = await bookingApi.createRoomType({
    //       hotelId,
    //       name,
    //       isActive: true
    //     });

    //     setRoomTypes((prev) => [...prev, newRoom]);
    //     handleSelect(newRoom);
    //     onNotify?.({ type: "success", message: `Room type "${name}" added` });
    //   } catch (err) {
    //     console.error(err);
    //     setNotice("Failed to add room type");
    //     onNotify?.({ type: "error", message: "Failed to add room type" });
    //   } finally {
    //     setSaving(false);
    //     setTimeout(() => setNotice(""), 2000);
    //   }
    // };
  const handleManualAdd = async () => {
  const name = roomSearch.trim();
  if (!name || !hotelId) return;

  const exists = roomTypes.find(
    (r) => r.name.toLowerCase() === name.toLowerCase()
  );
  if (exists) {
    handleSelect(exists);
    return;
  }

  setSaving(true);
  try {
    const newRoom = await bookingApi.createRoomType({
      hotelId,
      name,
      isActive: true
    });
    setRoomTypes((prev) => [...prev, newRoom]);
    handleSelect(newRoom);
    onNotify?.({ type: "success", message: `Room type "${name}" added`, newRoom });
  } catch (err) {
    console.error(err);
    onNotify?.({ type: "error", message: "Failed to add room type" });
  } finally {
    setSaving(false);
  }
};

    // ✅ Keyboard navigation
    const handleKeyDown = (e) => {
      if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
      if (e.key === "Enter") e.preventDefault();

      if (e.key === "Escape") {
        setShowDropdown(false);
        return;
      }

      if (!filteredRooms.length) {
        if (e.key === "Enter") handleManualAdd();
        return;
      }

      let idx = highlightedIndex;
      if (e.key === "ArrowDown") idx = (idx + 1) % filteredRooms.length;
      if (e.key === "ArrowUp")
        idx = (idx - 1 + filteredRooms.length) % filteredRooms.length;
      if (e.key === "Enter") {
        handleSelect(filteredRooms[idx]);
        return;
      }

      setHighlightedIndex(idx);
    };

    const highlightText = (text, search) => {
      if (!search) return text;
      const regex = new RegExp(`(${search})`, "ig");
      const parts = String(text).split(regex);
      return parts.map((p, i) =>
        regex.test(p) ? <b key={i}>{p}</b> : <span key={i}>{p}</span>
      );
    };

    return (
      <div className="rt-selector-container" ref={wrapperRef}>
        {notice && <div className="rt-selector-notice">{notice}</div>}

        <div
          className={`rt-form-group ${errors.roomType ? "rt-error" : ""}`}
          style={{ position: "relative" }}
        >
          <label className="rt-form-label rt-required">Room Type</label>
          <div className="rt-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={roomSearch}
              onChange={(e) => {
                setRoomSearch(e.target.value);
                setShowDropdown(true);
                setSelectedRoom(null);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search room type..."
              className="rt-form-input"
            />
            <button
              type="button"
              className="rt-chevron-button"
              onClick={() => setShowDropdown((s) => !s)}
            >
              <FaChevronDown />
            </button>
          </div>

          {showDropdown && (
            <ul className="rt-dropdown-list">
              {filteredRooms.map((r, i) => (
                <li
                  key={r.id}
                  className={`rt-dropdown-item ${highlightedIndex === i ? "rt-highlighted" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(r);
                  }}
                >
                  {highlightText(r.name, roomSearch)}
                </li>
              ))}

              {roomSearch && (
                <li
                  className="rt-add-option"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleManualAdd();
                  }}
                >
                   Add “{roomSearch}”
                </li>
              )}
            </ul>
          )}
        </div>

        {(loading || saving) && (
          <div className="rt-status-indicator">
            {loading && "Loading..."}
            {saving && "Saving..."}
          </div>
        )}
      </div>
    );
  }
);

export default RoomTypeSelector;
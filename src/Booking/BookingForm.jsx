import React, { useState, useEffect, useRef } from "react";
import bookingApi from "../api/bookingApi";
import supplierApi from "../api/supplierApi";
import agencyApi from "../api/agencyApi";
import "./BookingForm.css";
import RoomTypeSelector from "../components/RoomTypeSelector";
import CommercialForm from "./CommercialForm";
import CancellationPolicy from "./CancellationPolicy";

// 📅 Range calendar
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const BookingForm = ({ initialBooking, onSaved, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [agentStaffList, setAgentStaffList] = useState([]);
  const [agentStaffSearch, setAgentStaffSearch] = useState("");
  const [showAgentStaffDropdown, setShowAgentStaffDropdown] = useState(false);

  const [booking, setBooking] = useState(
    initialBooking || {
      agencyId: null,
      agencyName: "",
      agencyStaffId: null,
      agencyStaffName: "",
      supplierCategoryId: null,
      supplierSubCategoryId: null,
      supplierId: null,
      supplierName: "",
      hotelId: null,
      hotelName: "",
      checkIn: "",
      checkOut: "",
      nights: 0,
      numberOfRooms: 0,
      adults: 0,
      children: 0,
      totalPeople: 0,
      childrenAges: [],
      // kept for backward compat (not used in UI):
      leadGuestName: "",
      guestNames: "",
      inclusion: "",
      status: "Confirmed",
      deadline: "",
      specialRequest: "",
       cancellationPolicy: {
      policyType: 'free_cancellation',
      customName: '',
      rules: [
        {
          type: 'free_cancellation_before',
          days: 3,
          charge: 0,
          guestType: 'FIT'
        }
      ]
    }
    }
  );

  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [hotelQuery, setHotelQuery] = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [rooms, setRooms] = useState(() => normalizeIncomingRooms(booking.bookingRooms || []));
  const [showHotelResults, setShowHotelResults] = useState(false);
  const [sharedRoomTypes, setSharedRoomTypes] = useState([]);

  // Search states
  const [agentSearch, setAgentSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Refs (the range picker makes these mostly legacy)
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);
  const calendarWrapRef = useRef(null);

  // ---------- Date helpers ----------
  const todayISO = new Date().toISOString().split("T")[0];

  const toISODate = (dateObj) => {
    if (!(dateObj instanceof Date) || isNaN(dateObj)) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const addDaysISO = (isoDateStr, days) => {
    if (!isoDateStr) return "";
    const d = new Date(isoDateStr);
    if (isNaN(d)) return "";
    d.setDate(d.getDate() + days);
    return toISODate(d);
  };

  const checkOutMinISO = booking.checkIn ? addDaysISO(booking.checkIn, 1) : todayISO;
  const deadlineMaxISO = booking.checkIn ? addDaysISO(booking.checkIn, -1) : "";

  // ---------- Range picker state ----------
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: booking.checkIn ? new Date(booking.checkIn) : new Date(),
      endDate: booking.checkOut
        ? new Date(booking.checkOut)
        : new Date(new Date().setDate(new Date().getDate() + 1)),
      key: "selection",
    },
  ]);

  // ---------- Utilities ----------
  function normalizeIncomingRooms(incoming) {
    // Ensure every room has the new fields: leadGuestName, guestNames, inclusion (string)
    return (incoming || []).map((r) => ({
      roomTypeId: r.roomTypeId ?? null,
      adults: Number.isFinite(r.adults) ? r.adults : 2,
      children: Number.isFinite(r.children) ? r.children : 0,
      childrenAges: Array.isArray(r.childrenAges) ? r.childrenAges : [],
      inclusion: r.inclusion || "",
      // BACKWARD-COMPAT: old guestName is considered leadGuestName
      leadGuestName: r.leadGuestName ?? r.guestName ?? "",
      guestNames: Array.isArray(r.guestNames) ? r.guestNames : [],
    }));
  }

  function ensureGuestListLengths(nextRooms) {
    // For each room, guestNames length should be (adults + children - 1)
    return nextRooms.map((r) => {
      const people = (Number(r.adults) || 0) + (Number(r.children) || 0);
      const otherCount = Math.max(0, people - 1);
      const arr = Array.from({ length: otherCount }, (_, i) => r.guestNames?.[i] ?? "");
      return { ...r, guestNames: arr };
    });
  }

  // ---------- Agency Staff (including Main User) ----------
  useEffect(() => {
    if (!booking.agencyId) {
      setAgentStaffList([]);
      setBooking((prev) => ({ ...prev, agencyStaffId: null, agencyStaffName: "" }));
      return;
    }

    const fetchStaffAndMainUser = async () => {
      try {
        const [staffList, agency] = await Promise.all([
          agencyApi.getAgencyStaffByAgency(booking.agencyId),
          agencyApi.getAgencyById(booking.agencyId),
        ]);

        const mainUser = {
          id: agency.id,
          name: [agency.title, agency.firstName, agency.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() || "(Unnamed User)",
          email: agency.userEmailId,
          phone: agency.mobileNo || agency.phoneNo,
          role: "Main User",
          designation: agency.designation,
          isMainUser: true,
        };

        const combined = [mainUser, ...(staffList || [])];
        setAgentStaffList(combined);
      } catch (err) {
        console.error("Failed to load agency staff/main user:", err);
        setAgentStaffList([]);
      }
    };

    fetchStaffAndMainUser();
  }, [booking.agencyId]);

  // Close calendar on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!calendarWrapRef.current) return;
      if (!calendarWrapRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showCalendar]);

  // ---------- Derived totals & room builder ----------
  const buildRooms = (count, existing = []) => {
    const next = [...existing];
    if (count > next.length) {
      for (let i = next.length; i < count; i++) {
        next.push({
          roomTypeId: null,
          adults: 2,
          children: 0,
          childrenAges: [],
          inclusion: "",
          leadGuestName: "",
          guestNames: [], // will be resized below
        });
      }
    } else if (count < next.length) {
      next.length = count;
    }
    // Normalize ages & guest list lengths
    const normalized = next.map((r) => {
      const c = r.children || 0;
      const ages =
        r.childrenAges.length === c
          ? r.childrenAges
          : Array.from({ length: c }, (_, i) => r.childrenAges[i] ?? 0);
      return { ...r, childrenAges: ages };
    });
    return ensureGuestListLengths(normalized);
  };

  const totalPeople = rooms.reduce(
    (sum, r) => sum + (Number(r.adults || 0) + Number(r.children || 0)),
    0
  );
  const totalAdults = rooms.reduce((sum, r) => sum + Number(r.adults || 0), 0);
  const totalChildren = rooms.reduce((sum, r) => sum + Number(r.children || 0), 0);

  // keep booking.bookingRooms in sync with local rooms
  useEffect(() => {
    setBooking((prev) => ({ ...prev, bookingRooms: rooms }));
  }, [rooms]);

  // when numberOfRooms changes → build/trim rooms
  useEffect(() => {
    const count = Number(booking.numberOfRooms || 0);
    setRooms((prev) => buildRooms(count, prev));
  }, [booking.numberOfRooms]);

  // Hotel search
  useEffect(() => {
    if (hotelQuery.length < 2) {
      setHotels([]);
      setSearchLoading(false);
      return;
    }

    const fetchHotels = async () => {
      setSearchLoading(true);
      try {
        const hotelList = await bookingApi.searchHotels(hotelQuery);
        setHotels(Array.isArray(hotelList) ? hotelList : []);
        setShowHotelResults(true);
      } catch (err) {
        console.error(err);
        setHotels([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchHotels, 300);
    return () => clearTimeout(debounceTimer);
  }, [hotelQuery]);

  // Fetch initial static data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agentList, categoryList] = await Promise.all([
          agencyApi.getActiveAgencies(),
          supplierApi.getCategories(),
        ]);
        setAgents(agentList || []);
        setCategories(categoryList || []);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
      }
    };
    fetchData();
  }, []);

  // Subcategories on Category change
  // const [subCategories, setSubCategories] = useState([]);
  // const [subCategorySearch, setSubCategorySearch] = useState("");
  useEffect(() => {
    if (!booking.supplierCategoryId) {
      setSubCategories([]);
      setSubCategorySearch("");
      setBooking((prev) => ({
        ...prev,                                                                                                                                                                                                                                                                                                                                                
        supplierSubCategoryId: null,
        supplierId: null,
        supplierName: "",
      }));
      return;
    }

    const fetchSubCategories = async () => {
      try {
        const subcats = await supplierApi.getSubCategories(booking.supplierCategoryId);
        setSubCategories(subcats || []);
      } catch (err) {
        console.error("Failed fetching subcategories:", err);
      }
    };
    fetchSubCategories();
  }, [booking.supplierCategoryId]);

  // Suppliers on Category/Subcategory change
  useEffect(() => {
    if (!booking.supplierCategoryId) {
      setSuppliers([]);
      setSupplierSearch("");
      return;
    }

    const fetchSuppliers = async () => {
      try {
        const supplierList = await supplierApi.getSuppliersByCategory(
          booking.supplierCategoryId,
          booking.supplierSubCategoryId
        );
        setSuppliers(supplierList || []);
      } catch (err) {
        console.error("Failed fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, [booking.supplierCategoryId, booking.supplierSubCategoryId]);

  // Nights calculation
  useEffect(() => {
    if (booking.checkIn && booking.checkOut) {
      const nights =
        (new Date(booking.checkOut) - new Date(booking.checkIn)) /
        (1000 * 60 * 60 * 24);
      setBooking((prev) => ({ ...prev, nights: nights > 0 ? nights : 0 }));
    }
  }, [booking.checkIn, booking.checkOut]);

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    setHotelQuery(hotel.hotelName);
    setBooking((prev) => ({
      ...prev,
      hotelId: hotel.id,
      hotelName: hotel.hotelName,
    }));
    setShowHotelResults(false);
  };

  // ---------- Range selection handler ----------
  const handleRangeChange = (item) => {
    const start = item.selection.startDate;
    const end = item.selection.endDate;

    setDateRange([item.selection]);

    const isoIn = toISODate(start);
    let isoOut = toISODate(end);
    if (new Date(isoOut) <= new Date(isoIn)) {
      isoOut = addDaysISO(isoIn, 1);
    }

    let nextDeadline = booking.deadline;
    if (nextDeadline && new Date(nextDeadline) >= new Date(isoIn)) {
      nextDeadline = addDaysISO(isoIn, -1);
    }

    setBooking((prev) => ({
      ...prev,
      checkIn: isoIn,
      checkOut: isoOut,
      deadline: nextDeadline,
    }));
  };

  const handleDeadlineChange = (e) => {
    const newDeadline = e.target.value;
    if (booking.checkIn && newDeadline && new Date(newDeadline) >= new Date(booking.checkIn)) {
      setBooking((prev) => ({ ...prev, deadline: addDaysISO(booking.checkIn, -1) }));
    } else {
      setBooking((prev) => ({ ...prev, deadline: newDeadline }));
    }
  };

  // ---------- Save ----------
  const handleSave = async () => {
    try {
      if (!booking.hotelId) {
        alert("Please select a hotel.");
        return;
      }
      if (!booking.checkIn || !booking.checkOut) {
        alert("Please select check-in and check-out dates.");
        return;
      }
      if (!rooms.length) {
        alert("Please add at least one room.");
        return;
      }
      if (!booking.deadline) {
        alert("Please set a deadline before saving.");
        return;
      }

      // Require roomType + lead guest for each room
      for (let i = 0; i < rooms.length; i++) {
        const r = rooms[i];
        if (!r.roomTypeId) {
          alert(`Please select room type for Room ${i + 1}.`);
          return;
        }
        const people = (Number(r.adults) || 0) + (Number(r.children) || 0);
        if (people > 0 && !r.leadGuestName?.trim()) {
          alert(`Please enter Lead Guest Name for Room ${i + 1}.`);
          return;
        }
      }

      // Build payload
      const payload = {
        agencyId: booking.agencyId,
        ...(agentStaffList.length > 0 && booking.agencyStaffId
          ? { agencyStaffId: booking.agencyStaffId }
          : {}),
        supplierId: booking.supplierId,
        hotelId: booking.hotelId,
        checkIn: new Date(booking.checkIn).toISOString(),
        checkOut: new Date(booking.checkOut).toISOString(),
        status: "Confirmed",
        deadline: booking.deadline ? new Date(booking.deadline).toISOString() : null,
        specialRequest: booking.specialRequest,
        cancellationPolicy: booking.cancellationPolicy,
        bookingRooms: rooms.map((r) => {
          const people = (Number(r.adults) || 0) + (Number(r.children) || 0);
          const otherCount = Math.max(0, people - 1);
          const guestNames = Array.from({ length: otherCount }, (_, i) => r.guestNames?.[i] ?? "");
          return {
            roomTypeId: r.roomTypeId,
            adults: Number(r.adults),
            children: Number(r.children),
            childrenAges: r.childrenAges,
            // Backend still expects "guestName": send Lead Guest here
            leadGuestName: r.leadGuestName || "",
            inclusion: r.inclusion || "",
            // Extra field (safe to send; backend will ignore if not mapped)
            guestNames, // array of other guests in this room
          };
        }),
      };

      console.log("🟩 Payload to backend:", payload);

      setLoading(true);
      const res = await bookingApi.createBooking(payload);
      onSaved?.(res);
    } catch (err) {
      console.error(err);
      alert("Failed to save booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Validation ----------
  const isFormValid = () => {
    const baseOk =
      booking.agencyId &&
      booking.supplierCategoryId &&
      booking.supplierId &&
      booking.hotelId &&
      booking.checkIn &&
      booking.checkOut &&
      rooms.length > 0;

    if (!baseOk) return false;

    // Room-level quick checks
    for (const r of rooms) {
      if (!r.roomTypeId) return false;
      const people = (Number(r.adults) || 0) + (Number(r.children) || 0);
      if (people > 0 && !r.leadGuestName?.trim()) return false;
    }
    return true;
  };

  const formattedCheckInShort = booking.checkIn
    ? format(new Date(booking.checkIn), "d MMMM yyyy")
    : "";
  const formattedCheckOutShort = booking.checkOut
    ? format(new Date(booking.checkOut), "d MMMM yyyy")
    : "";

  // ---------- Render ----------
  return (
    <div className="booking-form-container">
      <div className="booking-form-grid">
        {/* Agent */}
        <div className="booking-form-box">
          <label>Agent *</label>
          <div className="booking-searchable-dropdown">
            <input
              type="text"
              placeholder="Search agent..."
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              onFocus={() => setShowAgentDropdown(true)}
              onBlur={() => setTimeout(() => setShowAgentDropdown(false), 200)}
              className="booking-search-input"
            />
            {showAgentDropdown &&
              agents.filter((a) =>
                a.agencyName?.toLowerCase().includes(agentSearch.toLowerCase())
              ).length > 0 && (
                <div className="booking-dropdown-list">
                  {agents
                    .filter((a) =>
                      a.agencyName?.toLowerCase().includes(agentSearch.toLowerCase())
                    )
                    .map((agent) => (
                      <div
                        key={agent.id}
                        className="booking-dropdown-item"
                        onClick={() => {
                          setBooking({
                            ...booking,
                            agencyId: agent.id,
                            agencyName: agent.agencyName,
                          });
                          setAgentSearch(agent.agencyName);
                          setShowAgentDropdown(false);
                        }}
                      >
                        {agent.agencyName}
                      </div>
                    ))}
                </div>
              )}
          </div>
          {booking.agencyName && (
            <div className="booking-selected-badge">{booking.agencyName}</div>
          )}
        </div>

        {/* Agent Staff (includes Main User) */}
        <div className="booking-form-box">
          <label>Agent Staff / Main User</label>
          <div className="booking-searchable-dropdown">
            <input
              type="text"
              placeholder={booking.agencyId ? "Search staff or main user..." : "Select agency first"}
              value={agentStaffSearch}
              onChange={(e) => setAgentStaffSearch(e.target.value)}
              onFocus={() => booking.agencyId && setShowAgentStaffDropdown(true)}
              onBlur={() => setTimeout(() => setShowAgentStaffDropdown(false), 200)}
              className="booking-search-input"
              disabled={!booking.agencyId}
            />
            {showAgentStaffDropdown &&
              agentStaffList.filter((st) =>
                st.name?.toLowerCase().includes(agentStaffSearch.toLowerCase())
              ).length > 0 && (
                <div className="booking-dropdown-list">
                  {agentStaffList
                    .filter((st) =>
                      st.name?.toLowerCase().includes(agentStaffSearch.toLowerCase())
                    )
                    .map((st) => (
                      <div
                        key={`${st.isMainUser ? "main-" : ""}${st.id}`}
                        className={`booking-dropdown-item ${st.isMainUser ? "main-user-item" : ""}`}
                        onClick={() => {
                          setBooking({
                            ...booking,
                            agencyStaffId: st.isMainUser ? null : st.id, // main user => null staff id
                            agencyStaffName: st.name,
                          });
                          setAgentStaffSearch(st.name);
                          setShowAgentStaffDropdown(false);
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            {st.name}
                            <span style={{ color: "#94a3b8", fontSize: "0.85em" }}>
                              {" "}
                              ({st.role || st.designation || "Staff"})
                            </span>
                          </div>
                          {st.isMainUser && (
                            <span
                              style={{
                                background: "#0ea5e9",
                                color: "white",
                                fontSize: "0.75em",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                marginLeft: "8px",
                              }}
                            >
                              Main
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
          </div>

          {booking.agencyStaffName && (
            <div className="booking-selected-badge">{booking.agencyStaffName}</div>
          )}
        </div>

        {/* Category */}
        <div className="booking-form-box">
          <label>Category *</label>
          <div className="booking-searchable-dropdown">
            <input
              type="text"
              placeholder="Search category..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              onFocus={() => setShowCategoryDropdown(true)}
              onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
              className="booking-search-input"
            />
            {showCategoryDropdown &&
              categories.filter((c) =>
                c.name?.toLowerCase().includes(categorySearch.toLowerCase())
              ).length > 0 && (
                <div className="booking-dropdown-list">
                  {categories
                    .filter((c) =>
                      c.name?.toLowerCase().includes(categorySearch.toLowerCase())
                    )
                    .map((category) => (
                      <div
                        key={category.id}
                        className="booking-dropdown-item"
                        onClick={() => {
                          setBooking({
                            ...booking,
                            supplierCategoryId: category.id,
                            supplierSubCategoryId: null,
                            supplierId: null,
                            supplierName: "",
                          });
                          setCategorySearch(category.name);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {category.name}
                      </div>
                    ))}
                </div>
              )}
          </div>
          {booking.supplierCategoryId && (
            <div className="booking-selected-badge">
              {categories.find((c) => c.id === booking.supplierCategoryId)?.name}
            </div>
          )}
        </div>

        {/* Subcategory */}
        <div className="booking-form-box">
          <label>Subcategory</label>
          <div className="booking-searchable-dropdown">
            <input
              type="text"
              placeholder={booking.supplierCategoryId ? "Search subcategory..." : "Select category first"}
              value={subCategorySearch}
              onChange={(e) => setSubCategorySearch(e.target.value)}
              onFocus={() => booking.supplierCategoryId && setShowSubCategoryDropdown(true)}
              onBlur={() => setTimeout(() => setShowSubCategoryDropdown(false), 200)}
              className="booking-search-input"
              disabled={!booking.supplierCategoryId}
            />
            {showSubCategoryDropdown &&
              subCategories.filter((sc) =>
                sc.name?.toLowerCase().includes(subCategorySearch.toLowerCase())
              ).length > 0 && (
                <div className="booking-dropdown-list">
                  {subCategories
                    .filter((sc) =>
                      sc.name?.toLowerCase().includes(subCategorySearch.toLowerCase())
                    )
                    .map((subCat) => (
                      <div
                        key={subCat.id}
                        className="booking-dropdown-item"
                        onClick={() => {
                          setBooking({
                            ...booking,
                            supplierSubCategoryId: subCat.id,
                            supplierId: null,
                            supplierName: "",
                          });
                          setSubCategorySearch(subCat.name);
                          setShowSubCategoryDropdown(false);
                        }}
                      >
                        {subCat.name}
                      </div>
                    ))}
                </div>
              )}
          </div>
          {booking.supplierSubCategoryId && (
            <div className="booking-selected-badge">
              {subCategories.find((sc) => sc.id === booking.supplierSubCategoryId)?.name}
            </div>
          )}
        </div>

        {/* Supplier */}
        <div className="booking-form-box">
          <label>Supplier *</label>
          <div className="booking-searchable-dropdown">
            <input
              type="text"
              placeholder={booking.supplierCategoryId ? "Search supplier..." : "Select category first"}
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              onFocus={() => booking.supplierCategoryId && setShowSupplierDropdown(true)}
              onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
              className="booking-search-input"
              disabled={!booking.supplierCategoryId}
            />
            {showSupplierDropdown &&
              suppliers.filter((s) =>
                s.supplierName?.toLowerCase().includes(supplierSearch.toLowerCase())
              ).length > 0 && (
                <div className="booking-dropdown-list">
                  {suppliers
                    .filter((s) =>
                      s.supplierName?.toLowerCase().includes(supplierSearch.toLowerCase())
                    )
                    .map((supplier) => (
                      <div
                        key={supplier.id}
                        className="booking-dropdown-item"
                        onClick={() => {
                          setBooking({
                            ...booking,
                            supplierId: supplier.id,
                            supplierName: supplier.supplierName,
                          });
                          setSupplierSearch(supplier.supplierName);
                          setShowSupplierDropdown(false);
                        }}
                      >
                        {supplier.supplierName}
                      </div>
                    ))}
                </div>
              )}
          </div>
          {booking.supplierName && (
            <div className="booking-selected-badge">{booking.supplierName}</div>
          )}
        </div>

        {/* Hotel */}
        <div className="booking-form-box full-width">
          <label>Hotel *</label>
          <div className="booking-hotel-search-container">
            <div className="booking-search-input-wrapper">
              <div className="booking-search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748b">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search hotels, cities, or landmarks..."
                value={hotelQuery}
                onChange={(e) => setHotelQuery(e.target.value)}
                onFocus={() => {
                  if (hotelQuery.length >= 2) setShowHotelResults(true);
                }}
                onBlur={() => setTimeout(() => setShowHotelResults(false), 100)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hotels.length > 0) {
                    e.preventDefault();
                    handleHotelSelect(hotels[0]);
                  }
                }}
                className="booking-hotel-search-input"
              />

              {hotelQuery && (
                <button
                  className="booking-clear-search"
                  onClick={() => {
                    setHotelQuery("");
                    setSelectedHotel(null);
                    setBooking((prev) => ({ ...prev, hotelId: null, hotelName: "" }));
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
            </div>

            {showHotelResults && (
              <div className="booking-search-results-panel">
                {searchLoading ? (
                  <div className="booking-loading-results">
                    <div className="booking-spinner"></div>
                    Searching hotels...
                  </div>
                ) : hotels.length > 0 ? (
                  <div className="booking-hotel-results">
                    {hotels.map((hotel) => (
                      <div
                        key={hotel.id}
                        className={`booking-hotel-result ${selectedHotel?.id === hotel.id ? "active-selected" : ""}`}
                        onMouseDown={() => handleHotelSelect(hotel)}
                      >
                        <div className="booking-hotel-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#64748b">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                          </svg>
                        </div>
                        <div className="booking-hotel-info">
                          <div className="booking-hotel-name">{hotel.hotelName}</div>
                          <div className="booking-hotel-location">
                            {hotel.cityName}, {hotel.countryName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hotelQuery.length >= 2 ? (
                  <div className="booking-no-results">No hotels found for "{hotelQuery}"</div>
                ) : null}
              </div>
            )}
          </div>

          {selectedHotel && (
            <div className="booking-selected-hotel-display">
              <div className="booking-selected-hotel-badge"> Selected</div>
              <div className="booking-selected-hotel-info">
                <strong>{selectedHotel.hotelName}</strong>
                <span>
                  {selectedHotel.cityName}, {selectedHotel.countryName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="booking-form-box">
          <label>Check-In *</label>
          <div
            className="booking-clickable-date-input"
            onClick={() => setShowCalendar((v) => !v)}
            role="button"
            tabIndex={0}
          >
            {booking.checkIn ? format(new Date(booking.checkIn), "d MMMM yyyy") : "Select Check-In"}
          </div>
        </div>

        <div className="booking-form-box">
          <label>Check-Out *</label>
          <div
            className="booking-clickable-date-input"
            onClick={() => setShowCalendar((v) => !v)}
            role="button"
            tabIndex={0}
          >
            {booking.checkOut ? format(new Date(booking.checkOut), "d  MMMM yyyy") : "Select Check-Out"}
          </div>
        </div>

        <div className="booking-date-range-wrapper" ref={calendarWrapRef}>
          {showCalendar && (
            <div className="booking-calendar-popup booking-calendar-centered">
              <DateRange
                ranges={dateRange}
                onChange={handleRangeChange}
                moveRangeOnFirstSelection={false}
                months={1}
                direction="horizontal"
                minDate={new Date()}
                rangeColors={["#2a5adf"]}
              />
            </div>
          )}
        </div>

        {/* Nights */}
        <div className="booking-form-box">
          <label>Nights</label>
          <div className="booking-nights-display">{booking.nights}</div>
        </div>

        {/* Rooms count */}
        <div className="booking-form-box">
          <label>Rooms *</label>
          <input
            type="text"
            min={0}
            value={booking.numberOfRooms || ""}
            onChange={(e) =>
              setBooking((prev) => ({
                ...prev,
                numberOfRooms: Math.max(1, parseInt(e.target.value || "1", 10)),
              }))
            }
            className="booking-number-input"
            placeholder="1"
          />
        </div>
      </div>

      {/* Room Details */}
      {rooms.length > 0 && (
        <div className="booking-rooms-section">
          <h4>Room Details</h4>
          <div className="booking-rooms-table-container">
            <table className="booking-rooms-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type *</th>
                  <th>Lead Guest *</th>
                  <th>Other Guests (auto)</th>
                  <th>Inclusion</th>
                  <th>Adults *</th>
                  <th>Children</th>
                  <th>Children Ages</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, idx) => {
                  const people = (Number(room.adults) || 0) + (Number(room.children) || 0);
                  const otherCount = Math.max(0, people - 1);

                  return (
                    <tr key={idx} className="booking-room-row">
                      <td className="booking-room-number">
                        <strong>Room {idx + 1}</strong>
                      </td>

                      {/* Room Type */}
                      <td className="booking-room-type">
                        <RoomTypeSelector
                          hotelId={booking.hotelId}
                          value={room.roomTypeId}
                          sharedRoomTypes={sharedRoomTypes}
                          onSelect={(roomTypeId, roomTypeName) => {
                            const next = [...rooms];
                            next[idx] = { ...room, roomTypeId };
                            setRooms(next);
                            if (!sharedRoomTypes.some((rt) => rt.id === roomTypeId)) {
                              setSharedRoomTypes((prev) => [
                                ...prev,
                                { id: roomTypeId, name: roomTypeName },
                              ]);
                            }
                          }}
                          onNotify={(msg) => {
                            if (msg?.newRoom) {
                              setSharedRoomTypes((prev) => [...prev, msg.newRoom]);
                            }
                          }}
                          placeholder="Select type"
                          compact
                          disabled={!booking.hotelId}
                        />
                      </td>

                      {/* Lead Guest */}
                      <td className="booking-guest-name">
                        <input
                          type="text"
                          value={room.leadGuestName || ""}
                          onChange={(e) => {
                            const next = [...rooms];
                            next[idx] = { ...room, leadGuestName: e.target.value };
                            setRooms(next);
                          }}
                          className="booking-table-input"
                          placeholder="Lead guest full name"
                        />
                      </td>

                      {/* Other Guests */}
                      <td className="booking-other-guests">
                        {otherCount > 0 ? (
                          <div className="booking-guestlist-grid">
                            {Array.from({ length: otherCount }, (_, gIdx) => (
                              <input
                                key={gIdx}
                                type="text"
                                value={room.guestNames?.[gIdx] ?? ""}
                                onChange={(e) => {
                                  const next = [...rooms];
                                  const list = Array.from(
                                    { length: otherCount },
                                    (_, i) => (i === gIdx ? e.target.value : (room.guestNames?.[i] ?? ""))
                                  );
                                  next[idx] = { ...room, guestNames: list };
                                  setRooms(ensureGuestListLengths(next));
                                }}
                                className="booking-guestlist-input"
                                placeholder={`Guest ${gIdx + 2} name`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="booking-no-children">-</span>
                        )}
                      </td>

                      {/* Inclusion */}
                      <td className="booking-inclusion">
                        <select
                          value={room.inclusion || ""}
                          onChange={(e) => {
                            const next = [...rooms];
                            next[idx] = { ...room, inclusion: e.target.value };
                            setRooms(next);
                          }}
                          className="booking-table-select"
                        >
                          <option value="">Select</option>
                          <option value="Room Only">Room Only</option>
                          <option value="With Breakfast">With Breakfast</option>
                        </select>
                      </td>

                      {/* Adults */}
                      <td className="booking-adults">
                        <input
                          type="number"
                          min={1}
                          value={room.adults}
                          onChange={(e) => {
                            const next = [...rooms];
                            const newAdults = Math.max(1, parseInt(e.target.value || "1", 10));
                            next[idx] = { ...room, adults: newAdults };
                            setRooms(ensureGuestListLengths(next));
                          }}
                          className="booking-table-input booking-number-input"
                        />
                      </td>

                      {/* Children */}
                      <td className="booking-children">
                        <input
                          type="number"
                          min={0}
                          value={room.children}
                          onChange={(e) => {
                            const count = Math.max(0, parseInt(e.target.value || "0", 10));
                            const next = [...rooms];
                            next[idx] = {
                              ...room,
                              children: count,
                              childrenAges: Array.from(
                                { length: count },
                                (_, i) => room.childrenAges[i] ?? 0
                              ),
                            };
                            setRooms(ensureGuestListLengths(next));
                          }}
                          className="booking-table-input booking-number-input"
                        />
                      </td>

                      {/* Children Ages */}
                      <td className="booking-children-ages">
                        <div className="booking-ages-container">
                          {room.children > 0 ? (
                            <div className="booking-ages-grid">
                              {room.childrenAges.map((age, aidx) => (
                                <input
                                  key={aidx}
                                  type="number"
                                  min={0}
                                  max={12}
                                  value={age}
                                  onChange={(e) => {
                                    const v = Math.max(
                                      0,
                                      Math.min(12, parseInt(e.target.value || "0", 10))
                                    );
                                    const next = [...rooms];
                                    const ages = [...room.childrenAges];
                                    ages[aidx] = v;
                                    next[idx] = { ...room, childrenAges: ages };
                                    setRooms(next);
                                  }}
                                  className="booking-age-input"
                                  placeholder="Age"
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="booking-no-children">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totals (view only) */}
      <div className="viewonly">
        <div className="booking-form-box">
          <label>Total People</label>
          <div className="booking-total-display">{totalPeople}</div>
        </div>

        <div className="booking-form-box">
          <label>Adults</label>
          <div className="booking-total-display booking-adults-display">{totalAdults}</div>
        </div>

        <div className="booking-form-box">
          <label>Children</label>
          <div className="booking-total-display booking-children-display">{totalChildren}</div>
        </div>
      </div>

      {/* Special Request */}
      <div className="booking-form-box full-width">
        <label>Special Request</label>
        <textarea
          value={booking.specialRequest}
          onChange={(e) => setBooking({ ...booking, specialRequest: e.target.value })}
          className="booking-textarea-input"
          placeholder="Any special requests..."
        />
      </div>
      {/* Cancellation Policy */}
      <div className="booking-form-box full-width">
        <CancellationPolicy
          policy={booking.cancellationPolicy}
          onChange={(newPolicy) => 
            setBooking({ ...booking, cancellationPolicy: newPolicy })
          }
        />
      </div>
      {/* Status */}
      <div className="booking-form-box">
        <label>Status</label>
        <div className="booking-status-display">Confirmed</div>
      </div>

      {/* Deadline */}
      <div className="booking-form-box">
        <label>Deadline *</label>
        <input
          type="date"
          value={booking.deadline || ""}
          min={todayISO}
          max={deadlineMaxISO || undefined}
          onChange={handleDeadlineChange}
          className="booking-date-input"
        />
      </div>

      {/* Actions */}
      <div className="booking-actions-section">
        <button className="booking-btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="booking-btn-save" onClick={handleSave} disabled={loading || !isFormValid()}>
          {loading ? (
            <>
              <div className="booking-spinner"></div>
              Saving...
            </>
          ) : (
            "Save Booking"
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingForm;

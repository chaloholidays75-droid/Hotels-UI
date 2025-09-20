import React, { useEffect, useState } from "react";
import { parseISO, format, isToday, isYesterday } from "date-fns";
import { getRecentActivities } from "../api"; // Your API function

const RecentActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getRecentActivities();
      const arrData = Array.isArray(data) ? data : [];
      setActivities(arrData);
      setFilteredActivities(arrData);
    };
    fetchData();
  }, []);

  const handleFilter = () => {
    const filtered = activities.filter((act) => {
      if (!act.CreatedAt) return false;
      const date = parseISO(act.CreatedAt);
      const afterStart = startDate ? date >= new Date(startDate) : true;
      const beforeEnd = endDate ? date <= new Date(endDate) : true;
      return afterStart && beforeEnd;
    });
    setFilteredActivities(filtered);
    setShowAll(false);
  };

  // Group activities by day
  const groupedActivities = (filteredActivities || []).reduce((groups, activity) => {
    if (!activity.CreatedAt) return groups;
    const date = parseISO(activity.CreatedAt);
    let groupLabel = "";
    if (isToday(date)) groupLabel = "Today";
    else if (isYesterday(date)) groupLabel = "Yesterday";
    else groupLabel = format(date, "MMM dd, yyyy");

    if (!groups[groupLabel]) groups[groupLabel] = [];
    groups[groupLabel].push(activity);
    return groups;
  }, {});

  const actionStyles = {
    Created: { color: "#16a34a", fontWeight: 600 },
    Edited: { color: "#2563eb", fontWeight: 600 },
    Deleted: { color: "#dc2626", fontWeight: 600 },
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", color: "#1f2937" }}>
      <h2 style={{ marginBottom: "20px" }}>All Recent Activities</h2>

      {/* Date Filter */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <label>
          Start Date:{" "}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </label>
        <label>
          End Date:{" "}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </label>
        <button
          onClick={handleFilter}
          style={{
            padding: "6px 12px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Filter
        </button>
      </div>

      {/* No Data */}
      {Object.keys(groupedActivities).length === 0 && (
        <p>No activities found for the selected date range.</p>
      )}

      {/* Activities */}
      {Object.entries(groupedActivities).map(([day, acts]) => {
        const displayActs = showAll ? acts : acts.slice(0, 5);
        return (
          <div key={day} style={{ marginBottom: "30px" }}>
            <h3 style={{ marginBottom: "10px" }}>{day}</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: "2px solid #ccc", padding: "8px", textAlign: "left" }}>User</th>
                  <th style={{ borderBottom: "2px solid #ccc", padding: "8px", textAlign: "left" }}>Action</th>
                  <th style={{ borderBottom: "2px solid #ccc", padding: "8px", textAlign: "left" }}>Entity</th>
                  <th style={{ borderBottom: "2px solid #ccc", padding: "8px", textAlign: "left" }}>Entity ID</th>
                  <th style={{ borderBottom: "2px solid #ccc", padding: "8px", textAlign: "left" }}>Description</th>
                  <th style={{ borderBottom: "2px solid #ccc", padding: "8px", textAlign: "left" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {displayActs.map((act) => (
                  <tr key={act.Id || act.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px" }}>{act.Username || "Unknown"}</td>
                    <td style={actionStyles[act.ActionType] || {}}>{act.ActionType || "-"}</td>
                    <td style={{ padding: "8px" }}>{act.Entity || "-"}</td>
                    <td style={{ padding: "8px" }}>{act.EntityId || "-"}</td>
                    <td style={{ padding: "8px" }}>{act.Description || "-"}</td>
                    <td style={{ padding: "8px" }}>{act.CreatedAt ? new Date(act.CreatedAt).toLocaleTimeString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* See More */}
            {acts.length > 5 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                style={{
                  marginTop: "10px",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                See More
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivityPage;

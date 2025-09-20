import React, { useEffect, useState } from "react";
import { getRecentActivities } from "../api";
import { format, isToday, isYesterday } from "date-fns";

const RecentActivityPage = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getRecentActivities();
      setActivities(data || []);
    };
    fetchData();
  }, []);

  // Group activities by day
  const groupedActivities = (activities || []).reduce((groups, activity) => {
    if (!activity.CreatedAt) return groups;
    const date = new Date(activity.CreatedAt);
    if (isNaN(date)) return groups;

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

      {Object.keys(groupedActivities).length === 0 ? (
        <p>No recent activities found.</p>
      ) : (
        Object.entries(groupedActivities).map(([day, acts]) => (
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
                {acts.map((act) => (
                  <tr key={act.Id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px" }}>{act.Username || "Unknown user"}</td>
                    <td style={actionStyles[act.ActionType] || {}}>{act.ActionType}</td>
                    <td style={{ padding: "8px" }}>{act.Entity}</td>
                    <td style={{ padding: "8px" }}>{act.EntityId}</td>
                    <td style={{ padding: "8px" }}>{act.Description}</td>
                    <td style={{ padding: "8px" }}>{new Date(act.CreatedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default RecentActivityPage;

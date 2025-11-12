import React from "react";
import { FaPlus, FaEdit, FaTrash, FaClock } from "react-icons/fa";

export default function RecentActivities({ data }) {
  const activities = Array.isArray(data?.data) ? data.data : [];

  const getIcon = (type) => {
    switch (type) {
      case "INSERT":
        return <FaPlus className="text-green-600 text-sm" />;
      case "UPDATE":
        return <FaEdit className="text-blue-600 text-sm" />;
      case "DELETE":
        return <FaTrash className="text-red-600 text-sm" />;
      default:
        return <FaClock className="text-gray-400 text-sm" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 recent-activities-card">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-800">Recent Activities</h3>
        <button
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          onClick={() => (window.location.href = "/recent-activities")}
        >
          View all →
        </button>
      </div>

      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm">No recent activity</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {activities.slice(0, 6).map((a) => (
            <li
              key={a.id}
              className="py-2 flex items-start gap-3 hover:bg-gray-50 transition rounded-md px-2"
            >
              <div className="flex-shrink-0 mt-1">{getIcon(a.actionType)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">
                  <span className="font-semibold">{a.userName}</span>{" "}
                  <span className="text-gray-600">
                    {a.actionType.toLowerCase()}d
                  </span>{" "}
                  <span className="font-medium text-gray-700">
                    {a.tableName}
                  </span>
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {a.description?.length > 60
                    ? a.description.slice(0, 60) + "..."
                    : a.description}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{a.timeAgo}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

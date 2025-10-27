import React from "react";
import { motion } from "framer-motion";

const RecentBookings = ({ data = [] }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div
      className="bg-white rounded-card shadow-sm p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
        <button className="text-primary-500 text-sm font-medium hover:text-primary-600">
          View All
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">
                Ticket
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">
                Hotel
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">
                Agency
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-4 text-center text-sm text-gray-500 italic"
                >
                  No recent bookings found
                </td>
              </tr>
            ) : (
              data.map((booking, index) => (
                <motion.tr
                  key={booking.id || booking.ticketNumber || index} // ✅ unique key
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="py-3 text-sm font-medium text-gray-900">
                    {booking.ticketNumber}
                  </td>
                  <td className="py-3 text-sm text-gray-600">{booking.hotel}</td>
                  <td className="py-3 text-sm text-gray-600">{booking.agency}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default RecentBookings;

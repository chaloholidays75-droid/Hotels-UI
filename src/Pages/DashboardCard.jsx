import React from 'react';
import { motion } from 'framer-motion';

const DashboardCard = ({ title, value, change, changeType, icon }) => {
  return (
    <motion.div
      className="bg-white rounded-card shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <span className="text-lg">{icon}</span>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          changeType === 'increase' 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {changeType === 'increase' ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <span>vs previous period</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardCard;
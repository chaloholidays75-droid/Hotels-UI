import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
// import "./ReportsPage.css";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // Example: load reports
    setLoading(true);
    setTimeout(() => {
      setReports([
        { id: 1, title: "Monthly Sales", description: "Revenue and profit trend for this month" },
        { id: 2, title: "Top Agencies", description: "Most active agencies and suppliers" },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="page-container">
      <motion.h1 
        className="page-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Reports
      </motion.h1>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className="reports-grid">
          {reports.map((r) => (
            <motion.div
              key={r.id}
              className="report-card"
              whileHover={{ scale: 1.02 }}
            >
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <button className="btn-primary">View</button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

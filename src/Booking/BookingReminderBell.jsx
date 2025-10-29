import React, { useEffect, useRef, useState } from "react";
import { getUpcomingDeadlines } from "../api/dashboardApi";
import "./BookingReminderBell.css";

const STORAGE_MUTE_KEY = "reminderBell.muted";
const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour
const UPCOMING_DAYS_THRESHOLD = 3;

export default function BookingReminderBell() {
  const [reminders, setReminders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(STORAGE_MUTE_KEY) === "true";
  });

  const previousReminderIds = useRef(new Set());

  /**
   * Filters and processes booking data to find upcoming reconfirmations
   */
  const processBookings = (bookings) => {
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() + UPCOMING_DAYS_THRESHOLD);

    return bookings.filter(booking => {
      const status = (booking.status || "").toLowerCase();
      const hasValidDeadline = booking.deadline && new Date(booking.deadline) >= now;
      
      return status.includes("confirmed") && 
             !status.includes("reconfirmed") && 
             hasValidDeadline &&
             new Date(booking.deadline) <= cutoffDate;
    });
  };

  /**
   * Checks if new reminders have been added since last fetch
   */
  const hasNewReminders = (currentReminders) => {
    const currentIds = new Set(currentReminders.map(reminder => reminder.id));
    const previousIds = previousReminderIds.current;
    
    for (const id of currentIds) {
      if (!previousIds.has(id)) return true;
    }
    return false;
  };

  /**
   * Fetches and updates reminder data
   */
  const fetchReminders = async () => {
    try {
      const bookings = await getUpcomingDeadlines();
      if (!Array.isArray(bookings)) return;

      const upcomingReminders = processBookings(bookings);
      
      // Note: Sound logic has been removed as requested
      // Previously played notification sound here when hasNewReminders() returned true
      
      setReminders(upcomingReminders);
      previousReminderIds.current = new Set(upcomingReminders.map(reminder => reminder.id));
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    }
  };

  /**
   * Toggles mute state and persists to localStorage
   */
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem(STORAGE_MUTE_KEY, String(newMuteState));
  };

  /**
   * Formats deadline date into display label and styling
   */
  const getDeadlineDisplay = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.floor((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { label: "Today", badgeClass: "badge badge-today" };
    } else if (diffDays === 1) {
      return { label: "Tomorrow", badgeClass: "badge badge-today" };
    } else {
      return {
        label: deadlineDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        badgeClass: "badge badge-normal"
      };
    }
  };

  useEffect(() => {
    fetchReminders();
    const intervalId = setInterval(fetchReminders, REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  const reminderCount = reminders.length;

  return (
    <div className="reminder-bell-container">
      <button
        type="button"
        className="reminder-bell"
        onClick={() => setIsOpen(prev => !prev)}
        title="Upcoming Reconfirmations"
        aria-label={`${reminderCount} upcoming reconfirmations`}
      >
        <fml-icon name="notifications-outline"></fml-icon>
        {reminderCount > 0 && (
          <span className="reminder-badge">{reminderCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="reminder-dropdown">
          <div className="reminder-dropdown-header">
            <span>Upcoming Reconfirmations</span>
            {/* <button
              type="button"
              className={`reminder-mute ${isMuted ? "is-muted" : ""}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute notifications" : "Mute notifications"}
              aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button> */}
          </div>

          {reminderCount === 0 ? (
            <div className="reminder-empty">No reminders at this time</div>
          ) : (
            <ul>
              {reminders.map(reminder => {
                const { label, badgeClass } = getDeadlineDisplay(reminder.deadline);
                
                return (
                  <li key={reminder.id}>
                    <div className="reminder-item-info">
                      <strong>{reminder.ticketNumber || `#${reminder.id}`}</strong>
                      <p>
                        {reminder.hotelName || "Hotel"} — {reminder.agencyName || "Agency"}
                      </p>
                    </div>
                    <span className={badgeClass}>{label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
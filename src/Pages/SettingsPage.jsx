import React, { useState, useEffect } from "react";
import "./SettingsPage.css";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Appearance
    theme: "light",
    fontSize: "medium",
    density: "comfortable",
    language: "en",
    
    // Notifications
    notifications: {
      email: true,
      push: true,
      sms: false,
      desktop: true,
      sound: true,
      vibration: false
    },
    notificationSchedule: {
      startTime: "09:00",
      endTime: "18:00",
      quietMode: false
    },
    
    // Privacy & Security
    twoFactorAuth: false,
    autoLogout: 30,
    showOnlineStatus: true,
    dataSaving: false,
    
    // Accessibility
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    keyboardShortcuts: true,
    
    // Work Preferences
    workingHours: {
      start: "09:00",
      end: "17:00",
      timezone: "UTC-5"
    },
    defaultView: "dashboard",
    quickActions: true,
    autoSave: true,
    
    // Communication
    emailSignature: "Best regards,\n[Staff Name]",
    outOfOffice: false,
    outOfOfficeMessage: "",
    
    // Data & Storage
    autoBackup: true,
    backupFrequency: "daily",
    cloudSync: true,
    
    // Advanced
    developerMode: false,
    apiAccess: false,
    performanceMode: "balanced"
  });

  const [activeSection, setActiveSection] = useState("appearance");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('staffSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Detect changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [settings]);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' 
        ? { ...prev[category], [key]: value }
        : value
    }));
  };

  const handleNestedSettingChange = (category, subCategory, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subCategory]: {
          ...prev[category][subCategory],
          [key]: value
        }
      }
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('staffSettings', JSON.stringify(settings));
    setHasUnsavedChanges(false);
    // Show success message
    alert('Settings saved successfully!');
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      localStorage.removeItem('staffSettings');
      window.location.reload();
    }
  };

  const exportSettings = () => {
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const dataStr = JSON.stringify(settings, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const exportFileDefaultName = 'staff-settings-backup.json';
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
          return 100;
        }
        return prev + 10;
      });
    }, 50);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Error importing settings: Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const sections = {
    appearance: {
      title: "Appearance",
      icon: "🎨",
      content: (
        <div className="settings-grid">
          <div className="setting-item">
            <label>Theme</label>
            <select 
              value={settings.theme} 
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Font Size</label>
            <select 
              value={settings.fontSize} 
              onChange={(e) => handleSettingChange('fontSize', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="x-large">Extra Large</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Layout Density</label>
            <select 
              value={settings.density} 
              onChange={(e) => handleSettingChange('density', e.target.value)}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Language</label>
            <select 
              value={settings.language} 
              onChange={(e) => handleSettingChange('language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      )
    },

    notifications: {
      title: "Notifications",
      icon: "🔔",
      content: (
        <div className="settings-grid">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
              />
              Email Notifications
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
              />
              Push Notifications
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications.sound}
                onChange={(e) => handleSettingChange('notifications', 'sound', e.target.checked)}
              />
              Sound Alerts
            </label>
          </div>

          <div className="setting-item">
            <label>Notification Schedule</label>
            <div className="time-inputs">
              <input
                type="time"
                value={settings.notificationSchedule.startTime}
                onChange={(e) => handleNestedSettingChange('notificationSchedule', 'startTime', e.target.value)}
              />
              <span>to</span>
              <input
                type="time"
                value={settings.notificationSchedule.endTime}
                onChange={(e) => handleNestedSettingChange('notificationSchedule', 'endTime', e.target.value)}
              />
            </div>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notificationSchedule.quietMode}
                onChange={(e) => handleNestedSettingChange('notificationSchedule', 'quietMode', e.target.checked)}
              />
              Quiet Mode (No notifications during off-hours)
            </label>
          </div>
        </div>
      )
    },

    security: {
      title: "Privacy & Security",
      icon: "🔒",
      content: (
        <div className="settings-grid">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.twoFactorAuth}
                onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
              />
              Two-Factor Authentication
            </label>
          </div>

          <div className="setting-item">
            <label>Auto Logout After</label>
            <select 
              value={settings.autoLogout} 
              onChange={(e) => handleSettingChange('autoLogout', parseInt(e.target.value))}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={0}>Never</option>
            </select>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.showOnlineStatus}
                onChange={(e) => handleSettingChange('showOnlineStatus', e.target.checked)}
              />
              Show Online Status to Colleagues
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.dataSaving}
                onChange={(e) => handleSettingChange('dataSaving', e.target.checked)}
              />
              Data Saving Mode
            </label>
          </div>
        </div>
      )
    },

    accessibility: {
      title: "Accessibility",
      icon: "♿",
      content: (
        <div className="settings-grid">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
              />
              High Contrast Mode
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
              />
              Reduced Motion
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.screenReader}
                onChange={(e) => handleSettingChange('screenReader', e.target.checked)}
              />
              Screen Reader Optimized
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.keyboardShortcuts}
                onChange={(e) => handleSettingChange('keyboardShortcuts', e.target.checked)}
              />
              Enable Keyboard Shortcuts
            </label>
          </div>
        </div>
      )
    },

    work: {
      title: "Work Preferences",
      icon: "💼",
      content: (
        <div className="settings-grid">
          <div className="setting-item">
            <label>Default View</label>
            <select 
              value={settings.defaultView} 
              onChange={(e) => handleSettingChange('defaultView', e.target.value)}
            >
              <option value="dashboard">Dashboard</option>
              <option value="tasks">Tasks</option>
              <option value="calendar">Calendar</option>
              <option value="reports">Reports</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Working Hours</label>
            <div className="time-inputs">
              <input
                type="time"
                value={settings.workingHours.start}
                onChange={(e) => handleNestedSettingChange('workingHours', 'start', e.target.value)}
              />
              <span>to</span>
              <input
                type="time"
                value={settings.workingHours.end}
                onChange={(e) => handleNestedSettingChange('workingHours', 'end', e.target.value)}
              />
            </div>
          </div>

          <div className="setting-item">
            <label>Timezone</label>
            <select 
              value={settings.workingHours.timezone} 
              onChange={(e) => handleNestedSettingChange('workingHours', 'timezone', e.target.value)}
            >
              <option value="UTC-5">EST (UTC-5)</option>
              <option value="UTC-8">PST (UTC-8)</option>
              <option value="UTC+0">GMT (UTC+0)</option>
              <option value="UTC+1">CET (UTC+1)</option>
            </select>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.quickActions}
                onChange={(e) => handleSettingChange('quickActions', e.target.checked)}
              />
              Show Quick Actions Panel
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
              />
              Auto-save Work Every 2 Minutes
            </label>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="settings-page-container">
      <div className="settings-header">
        <h1 className="page-title">Staff Settings</h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={resetToDefaults}
          >
            Reset to Defaults
          </button>
          <button 
            className="btn btn-primary"
            onClick={saveSettings}
            disabled={!hasUnsavedChanges}
          >
            {hasUnsavedChanges ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {Object.entries(sections).map(([key, section]) => (
            <button
              key={key}
              className={`sidebar-item ${activeSection === key ? 'active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <span className="sidebar-icon">{section.icon}</span>
              {section.title}
            </button>
          ))}
          
          <div className="sidebar-divider"></div>
          
          <button className="sidebar-item" onClick={exportSettings}>
            <span className="sidebar-icon">📤</span>
            Export Settings
          </button>
          
          <label className="sidebar-item import-label">
            <span className="sidebar-icon">📥</span>
            Import Settings
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h2 className="section-title">
              {sections[activeSection].icon} {sections[activeSection].title}
            </h2>
            {sections[activeSection].content}
          </div>

          {exportProgress > 0 && exportProgress < 100 && (
            <div className="export-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
              <span>Exporting... {exportProgress}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const passwordStrength = (pwd = "") => {
  // simple scoring: length + variety of char classes
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 10) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { label: "Very weak", score, color: "bg-red-400" };
  if (score === 2) return { label: "Weak", score, color: "bg-orange-400" };
  if (score === 3) return { label: "Medium", score, color: "bg-yellow-400" };
  if (score >= 4) return { label: "Strong", score, color: "bg-green-400" };
  return { label: "Very weak", score, color: "bg-red-400" };
};

// Zod schema
const UserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  userEmailId: z.string().email("Invalid email address"),
  mobileNo: z
    .string()
    .optional()
    .refine((v) => !v || /^[\+]?[0-9]{7,15}$/.test(v), "Invalid phone number"),
  userName: z
    .string()
    .min(4, "Username must be at least 4 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
})
.superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"]
    });
  }
});

const UserDetailsForm = ({ formData, handleChange, setCurrentStep }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  // compute password strength memoized
  const pwdStrength = useMemo(() => passwordStrength(formData.password || ""), [formData.password]);

  // Validate on each change of formData (debounce not needed unless you want)
  useEffect(() => {
    // prepare object for zod (ensure strings for optional)
    const data = {
      firstName: formData.firstName ?? "",
      lastName: formData.lastName ?? "",
      userEmailId: formData.userEmailId ?? "",
      mobileNo: formData.mobileNo ?? "",
      userName: formData.userName ?? "",
      password: formData.password ?? "",
      confirmPassword: formData.confirmPassword ?? ""
    };

    const parsed = UserSchema.safeParse(data);
    if (parsed.success) {
      setErrors({});
      setIsValid(true);
    } else {
      // convert Zod errors to a simple map { field: message }
      const zodErrs = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path?.[0] ?? "_";
        // only keep first error per field
        if (!zodErrs[path]) zodErrs[path] = issue.message;
      }
      setErrors(zodErrs);
      setIsValid(false);
    }
  }, [
    formData.firstName,
    formData.lastName,
    formData.userEmailId,
    formData.mobileNo,
    formData.userName,
    formData.password,
    formData.confirmPassword
  ]);

  return (
    <div className="form-section">
      <h2 className="section-title">User Details</h2>

      {/* Name Row */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label required">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter first name"
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label className="form-label required">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter last name"
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>
      </div>

      {/* Email + Phone */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label required">Email</label>
          <input
            type="email"
            name="userEmailId"
            value={formData.userEmailId || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter email address"
          />
          {errors.userEmailId && <span className="error-message">{errors.userEmailId}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Mobile No</label>
          <input
            type="text"
            name="mobileNo"
            value={formData.mobileNo || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter mobile number"
          />
          {errors.mobileNo && <span className="error-message">{errors.mobileNo}</span>}
        </div>
      </div>

      {/* Username + Password */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label required">Username</label>
          <input
            type="text"
            name="userName"
            value={formData.userName || ""}
            onChange={handleChange}
            className="form-input"
            placeholder="Choose a username"
          />
          {errors.userName && <span className="error-message">{errors.userName}</span>}
        </div>

        <div className="form-group">
          <label className="form-label required">Password</label>
          <div className="input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-icon"
              onClick={() => setShowPassword((s) => !s)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
          {errors.password && <span className="error-message">{errors.password}</span>}

          {/* Password strength UI */}
          <div className="password-strength" style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 120, height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(pwdStrength.score / 5) * 100}%`,
                    height: "100%",
                    background:
                      pwdStrength.label === "Very weak"
                        ? "#f87171"
                        : pwdStrength.label === "Weak"
                        ? "#fb923c"
                        : pwdStrength.label === "Medium"
                        ? "#fbbf24"
                        : "#34d399",
                    transition: "width 160ms ease"
                  }}
                />
              </div>
              <small style={{ color: "#444" }}>{pwdStrength.label}</small>
            </div>
            <small style={{ color: "#666", display: "block", marginTop: 6 }}>
              Tip: use 10+ chars with upper, lower, numbers and symbols for a strong password.
            </small>
          </div>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="form-row">
        <div className="form-group full-width">
          <label className="form-label required">Confirm Password</label>
          <div className="input-with-icon">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="Re-enter password"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-icon"
              onClick={() => setShowConfirmPassword((s) => !s)}
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? "🙈" : "👁"}
            </button>
          </div>
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>
      </div>

      {/* Navigation */}
      <div className="form-actions">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="secondary-button back-button"
        >
          Back: Supplier Details
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className="submit-button next-button"
          disabled={!isValid}
        >
          Next: Contact Details
        </button>
      </div>
    </div>
  );
};

export default UserDetailsForm;

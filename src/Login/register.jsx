import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/authApi";
import './Register.css';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: ""});

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!formData.password) return { score: 0, feedback: [] };

    let score = 0;
    const feedback = [];

    // Length check
    if (formData.password.length >= 8) {
      score += 1;
    } else {
      feedback.push("At least 8 characters");
    }

    // Lowercase check
    if (/[a-z]/.test(formData.password)) {
      score += 1;
    } else {
      feedback.push("One lowercase letter");
    }

    // Uppercase check
    if (/[A-Z]/.test(formData.password)) {
      score += 1;
    } else {
      feedback.push("One uppercase letter");
    }

    // Number check
    if (/\d/.test(formData.password)) {
      score += 1;
    } else {
      feedback.push("One number");
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      score += 1;
    } else {
      feedback.push("One special character");
    }

    return { score, feedback };
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getStrengthColor = (score) => {
    if (score === 0) return "#e2e8f0";
    if (score <= 2) return "#f56565";
    if (score <= 3) return "#ed8936";
    if (score === 4) return "#ecc94b";
    return "#48bb78";
  };

  const getStrengthText = (score) => {
    if (score === 0) return "";
    if (score <= 2) return "Weak";
    if (score <= 3) return "Fair";
    if (score === 4) return "Good";
    return "Strong";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.role) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    // Enhanced password validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError("Password must contain at least one lowercase letter");
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter");
      setIsLoading(false);
      return;
    }

    if (!/\d/.test(formData.password)) {
      setError("Password must contain at least one number");
      setIsLoading(false);
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError("Password must contain at least one special character");
      setIsLoading(false);
      return;
    }

    if (passwordStrength.score < 3) {
      setError("Please choose a stronger password");
      setIsLoading(false);
      return;
    }

    try {
      await register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.password,
        formData.role
      );
      alert("Registration successful!");
      navigate("/backend/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1 className="register-title">Create Account</h1>
          <p className="register-subtitle">Join us today</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="name-row">
            <input
              name="firstName"
              type="text"
              className="form-input name-input"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              disabled={isLoading}
            />
            <input
              name="lastName"
              type="text"
              className="form-input name-input"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <input
              name="email"
              type="email"
              className="form-input"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group password-group">
            <div className="password-input-wrapper">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className="form-input password-input"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="eye-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                ) : (
                  <svg className="eye-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className="strength-segment"
                      style={{
                        backgroundColor: index <= passwordStrength.score ? 
                          getStrengthColor(passwordStrength.score) : "#e2e8f0"
                      }}
                    />
                  ))}
                </div>
                <div className="strength-info">
                  <span 
                    className="strength-text"
                    style={{ color: getStrengthColor(passwordStrength.score) }}
                  >
                    {getStrengthText(passwordStrength.score)}
                  </span>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="password-requirements">
                      <p className="requirements-title">Password must include:</p>
                      <ul className="requirements-list">
                        {passwordStrength.feedback.map((requirement, index) => (
                          <li 
                            key={index} 
                            className={`requirement-item ${
                              formData.password && !passwordStrength.feedback.includes(requirement) 
                                ? 'requirement-met' 
                                : ''
                            }`}
                          >
                            {requirement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <select 
              name="role" 
              className="role-select"
              value={formData.role} 
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="">Select your role</option>
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button 
            type="submit" 
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || (formData.password && passwordStrength.score < 3)}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account?{" "}
            <Link to="/backend/login" className="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
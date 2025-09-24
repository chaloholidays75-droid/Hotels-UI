import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, login } from "../api/authApi";
import "./Register.css"; // We'll create this CSS file

function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "Employee", // default role
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.role) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Register payload:", formData); // debug

      // Register user
      await register(formData.firstName, formData.lastName, formData.email, formData.password, formData.role);

      // Login user
      const loginData = await login(formData.email, formData.password);
      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("userRole", formData.role);

      navigate("/backend/login"); // redirect to login
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Create Account</h2>
          <p>Join us today and get started</p>
        </div>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName"
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange}
                placeholder="Enter your first name"
              />
            </div>
            <div className="input-group">
              <label htmlFor="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName"
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange}
                placeholder="Enter your last name"
              />
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email"
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              name="password" 
              value={formData.password} 
              onChange={handleChange}
              placeholder="Create a password"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="role">Account Type</label>
            <select 
              id="role"
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              className="role-select"
            >
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
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
        
        <div className="login-redirect">
          <p>
            Already have an account? <Link to="/backend/login" className="login-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
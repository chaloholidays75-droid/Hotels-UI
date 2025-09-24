import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, login } from "../api/authApi";
import "./Register.css"; // We'll update this CSS file

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
          <p>Join our platform</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="input-group">
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange}
                placeholder="First Name"
                required
              />
            </div>
            <div className="input-group">
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange}
                placeholder="Last Name"
                required
              />
            </div>
          </div>
          
          <div className="input-group">
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              placeholder="Email Address"
              required
            />
          </div>
          
          <div className="input-group">
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </div>
          
          <div className="input-group">
            <select 
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
            {isLoading ? "Creating Account..." : "Create Account"}
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
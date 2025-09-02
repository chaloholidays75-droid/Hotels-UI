import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { login } from '../services/api';

// Zod schema for form validation
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be 100 characters or less'),
});

function Login({ setUserName, setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate form data with Zod
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      return;
    }

    try {
      const { userFullName } = await login(formData.email, formData.password);
      setUserName(userFullName);
      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      setErrors({ general: 'Invalid credentials' });
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />
        {errors.email && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.email}</p>}
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          required
        />
        {errors.password && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.password}</p>}
        {errors.general && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.general}</p>}
        <button type="submit">Login</button>
      </form>
      <div style={{ marginTop: '10px' }}>
        <p>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>
            Create an account
          </Link>
        </p>
        <p>
          <Link to="/forgot" style={{ color: '#007bff', textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
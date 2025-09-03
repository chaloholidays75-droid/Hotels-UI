import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { register } from '../api';

// Zod schema for form validation
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be 50 characters or less'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be 50 characters or less'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be 100 characters or less'),
});

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for the field being edited
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate form data with Zod
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      return;
    }

    try {
      await register(formData.firstName, formData.lastName, formData.email, formData.password);
      navigate('/login');
    } catch (err) {
      setErrors({ general: 'Registration failed: ' + (err.message || 'Unknown error') });
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="First Name"
          required
        />
        {errors.firstName && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.firstName}</p>}
        <input
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Last Name"
          required
        />
        {errors.lastName && <p style={{ color: 'red', marginBottom: '10px' }}>{errors.lastName}</p>}
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
        <button type="submit" className="green">Register</button>
      </form>
    </div>
  );
}

export default Register;
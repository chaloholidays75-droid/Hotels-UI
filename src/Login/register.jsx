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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(45deg, #1e3a8a 0%, #6b21a8 50%, #c026d3 100%)',
      padding: '20px',
      overflow: 'hidden'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), 0 0 10px rgba(255, 255, 255, 0.1)',
        padding: '48px 32px',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'fadeIn 0.5s ease-in-out'
      }}>
        <div style={{
          content: '""',
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #3b82f6, #ec4899)',
          borderRadius: '16px 16px 0 0'
        }}></div>
        <h2 style={{
          fontSize: '30px',
          fontWeight: '700',
          color: '#111827',
          textAlign: 'center',
          marginBottom: '32px',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          letterSpacing: '-0.025em'
        }}>Join Us Today</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First Name"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '16px',
                fontFamily: '"Inter", sans-serif',
                background: '#f9fafb',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            />
            {errors.firstName && <p style={{
              color: '#ef4444',
              fontSize: '13px',
              marginTop: '6px',
              fontFamily: '"Inter", sans-serif',
              position: 'absolute'
            }}>{errors.firstName}</p>}
          </div>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '16px',
                fontFamily: '"Inter", sans-serif',
                background: '#f9fafb',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            />
            {errors.lastName && <p style={{
              color: '#ef4444',
              fontSize: '13px',
              marginTop: '6px',
              fontFamily: '"Inter", sans-serif',
              position: 'absolute'
            }}>{errors.lastName}</p>}
          </div>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '16px',
                fontFamily: '"Inter", sans-serif',
                background: '#f9fafb',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            />
            {errors.email && <p style={{
              color: '#ef4444',
              fontSize: '13px',
              marginTop: '6px',
              fontFamily: '"Inter", sans-serif',
              position: 'absolute'
            }}>{errors.email}</p>}
          </div>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '16px',
                fontFamily: '"Inter", sans-serif',
                background: '#f9fafb',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
            />
            {errors.password && <p style={{
              color: '#ef4444',
              fontSize: '13px',
              marginTop: '6px',
              fontFamily: '"Inter", sans-serif',
              position: 'absolute'
            }}>{errors.password}</p>}
          </div>
          {errors.general && <p style={{
            color: '#ef4444',
            fontSize: '14px',
            marginBottom: '20px',
            fontFamily: '"Inter", sans-serif',
            textAlign: 'center',
            background: '#fee2e2',
            padding: '8px',
            borderRadius: '8px'
          }}>{errors.general}</p>}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(90deg, #3b82f6 0%, #ec4899 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: '"Inter", sans-serif',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.3)';
            }}
          >
            <span style={{
              position: 'relative',
              zIndex: '1'
            }}>Register</span>
            <div style={{
              content: '""',
              position: 'absolute',
              top: '0',
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              transition: '0.5s',
              zIndex: '0'
            }} onMouseOver={(e) => e.target.style.left = '100%'}></div>
          </button>
        </form>
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

export default Register;
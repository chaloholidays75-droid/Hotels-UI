import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { login } from '../api';

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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validate form data with Zod
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const { userFullName } = await login(formData.email, formData.password);
      setUserName(userFullName);
      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      setErrors({ general: 'Invalid email or password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Sign in to continue to your account</p>
        </div>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {})
              }}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p style={styles.errorText}>
                <svg style={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.password ? styles.inputError : {})
              }}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p style={styles.errorText}>
                <svg style={styles.errorIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {errors.password}
              </p>
            )}
          </div>
          
          <div style={styles.optionsContainer}>
            <div style={styles.rememberMe}>
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                style={styles.checkbox}
              />
              <label htmlFor="remember-me" style={styles.rememberLabel}>
                Remember me
              </label>
            </div>
            
            <Link
              to="/forgot"
              style={styles.forgotLink}
            >
              Forgot password?
            </Link>
          </div>
          
          {errors.general && (
            <div style={styles.generalError}>
              <svg style={styles.generalErrorIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{errors.general}</span>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.submitButton,
              ...(isLoading ? styles.submitButtonLoading : {})
            }}
          >
            {isLoading ? (
              <>
                <svg style={styles.spinner} viewBox="0 0 24 24">
                  <circle style={styles.spinnerBg} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
        
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={styles.footerLink}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

// Inline CSS styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05), 0 5px 10px rgba(0, 0, 0, 0.05)',
    padding: '32px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '16px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  inputError: {
    borderColor: '#ef4444',
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#ef4444',
    margin: '4px 0 0 0',
  },
  errorIcon: {
    width: '16px',
    height: '16px',
    marginRight: '6px',
  },
  optionsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberMe: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#4f46e5',
  },
  rememberLabel: {
    fontSize: '14px',
    color: '#374151',
  },
  forgotLink: {
    fontSize: '14px',
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s ease',
  },
  generalError: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    fontSize: '14px',
  },
  generalErrorIcon: {
    width: '20px',
    height: '20px',
    marginRight: '12px',
    flexShrink: 0,
  },
  submitButton: {
    padding: '12px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  submitButtonLoading: {
    opacity: 0.8,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '20px',
    height: '20px',
    animation: 'spin 1s linear infinite',
  },
  spinnerBg: {
    opacity: 0.25,
  },
  spinnerPath: {
    opacity: 0.75,
  },
  footer: {
    marginTop: '32px',
    textAlign: 'center',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
  },
  footerLink: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s ease',
  },
};

// Add a style tag for the animation
document.head.insertAdjacentHTML(
  'beforeend',
  '<style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>'
);
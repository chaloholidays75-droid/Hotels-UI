import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate password against criteria
  useEffect(() => {
    const criteria = {
      hasMinLength: formData.newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(formData.newPassword),
      hasLowerCase: /[a-z]/.test(formData.newPassword),
      hasNumber: /[0-9]/.test(formData.newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)
    };
    setPasswordCriteria(criteria);
  }, [formData.newPassword]);

  // Validate form
  useEffect(() => {
    const isPasswordValid = Object.values(passwordCriteria).every(criterion => criterion);
    const doPasswordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '';
    setIsFormValid(isPasswordValid && doPasswordsMatch);
  }, [formData, passwordCriteria]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await api.post('/auth/reset-password', { 
        email, 
        token, 
        newPassword: formData.newPassword 
      });
      
      setMessage({ 
        text: 'Password reset successfully! Redirecting to login...', 
        type: 'success' 
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.message || 'Error resetting password. The link may have expired.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if token and email are present
  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-gray-600">
              The password reset link is invalid or has expired. Please request a new reset link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                <p className="font-medium mb-1">Password must include:</p>
                <ul className="space-y-1">
                  <li className={`flex items-center ${passwordCriteria.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordCriteria.hasMinLength ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span className="ml-1">At least 8 characters</span>
                  </li>
                  <li className={`flex items-center ${passwordCriteria.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordCriteria.hasUpperCase ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span className="ml-1">One uppercase letter</span>
                  </li>
                  <li className={`flex items-center ${passwordCriteria.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordCriteria.hasLowerCase ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span className="ml-1">One lowercase letter</span>
                  </li>
                  <li className={`flex items-center ${passwordCriteria.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordCriteria.hasNumber ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span className="ml-1">One number</span>
                  </li>
                  <li className={`flex items-center ${passwordCriteria.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordCriteria.hasSpecialChar ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    <span className="ml-1">One special character</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`mt-1 text-xs ${formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                  {formData.newPassword === formData.confirmPassword 
                    ? 'Passwords match' 
                    : 'Passwords do not match'
                  }
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                !isFormValid || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isLoading ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : (
                'Reset Password'
              )}
            </button>
          </div>

          {message.text && (
            <div className={`rounded-md p-4 ${
              message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className={`text-sm text-center ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
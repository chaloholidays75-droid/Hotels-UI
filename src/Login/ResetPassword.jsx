import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api.js';


function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reset-password', { email, token, newPassword });
      setMessage('Password reset successful');
    } catch (err) {
      setMessage('Error resetting password');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New Password"
        className="border p-2 mb-2 w-full"
      />
      <button type="submit" className="bg-red-500 text-white p-2 w-full">
        Reset Password
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default ResetPassword;
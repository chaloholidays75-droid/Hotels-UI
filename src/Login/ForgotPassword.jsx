import { useState } from 'react';
import api from '../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/forgot-password', { email });
      setMessage('Reset link sent to email');
    } catch (err) {
      setMessage('Error sending reset link');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border p-2 mb-2 w-full"
      />
      <button type="submit" className="bg-yellow-500 text-white p-2 w-full">
        Send Reset Link
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default ForgotPassword;
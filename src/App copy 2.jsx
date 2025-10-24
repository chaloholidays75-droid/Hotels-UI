import React from 'react';
import './App.css'; // Assuming you have a CSS file for styling
import TicketCommercialsForm from './components/TicketCommercialsForm';

function App() {
  const userName = "User";

  return (
    <div className="App">
      <TicketCommercialsForm />
    </div>
  );
}

export default App;
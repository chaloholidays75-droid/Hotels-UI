import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HotelSalesForm from "../src/Hotel/HotelSalesForm";
import HotelSalesList from "../src/Hotel/HotelSalesList";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HotelSalesForm />} />
        <Route path="/list" element={<HotelSalesList />} />
      </Routes>
    </Router>
  );
}

export default App;

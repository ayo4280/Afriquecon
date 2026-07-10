import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CargoBooking from './pages/cargo/Booking';
import TripResults from './pages/passenger/TripResults';
import SeatSelection from './pages/passenger/SeatSelection';
import PassengerBooking from './pages/passenger/Booking';
import ETicket from './pages/passenger/ETicket';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import TrackShipment from './pages/cargo/TrackShipment';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import About from './pages/info/About';
import Contact from './pages/info/Contact';
import FAQ from './pages/info/FAQ';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cargo" element={<Home />} />
              <Route path="/passenger" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/cargo/booking" element={<CargoBooking />} />
              <Route path="/track" element={<TrackShipment />} />
              <Route path="/passenger/results" element={<TripResults />} />
              <Route path="/passenger/seats" element={<SeatSelection />} />
              <Route path="/passenger/booking" element={<PassengerBooking />} />
              <Route path="/ticket/:ticket_id" element={<ETicket />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

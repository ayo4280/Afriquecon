import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { AuthProvider } from './context/AuthContext';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const CargoBooking = lazy(() => import('./pages/cargo/Booking'));
const TripResults = lazy(() => import('./pages/passenger/TripResults'));
const SeatSelection = lazy(() => import('./pages/passenger/SeatSelection'));
const PassengerBooking = lazy(() => import('./pages/passenger/Booking'));
const ETicket = lazy(() => import('./pages/passenger/ETicket'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const TrackShipment = lazy(() => import('./pages/cargo/TrackShipment'));
const Terms = lazy(() => import('./pages/legal/Terms'));
const Privacy = lazy(() => import('./pages/legal/Privacy'));
const About = lazy(() => import('./pages/info/About'));
const Contact = lazy(() => import('./pages/info/Contact'));
const FAQ = lazy(() => import('./pages/info/FAQ'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow flex flex-col">
            <Suspense fallback={<div className="flex flex-1 items-center justify-center p-12 text-slate-500">Loading…</div>}>
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
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

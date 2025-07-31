import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import WeeklySchedule from './components/WeeklySchedule';
import ManageSchedules from './components/ManageSchedules';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-vh-100">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/weekly" element={<WeeklySchedule />} />
            <Route path="/manage" element={<ManageSchedules />} />
          </Routes>
        </main>
        <footer className="bg-light mt-5 py-4">
          <div className="container text-center">
            <small className="text-muted">
              © 2025 ClassInfo System | Built with ❤️ and React
            </small>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

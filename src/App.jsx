import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import SOSButton from './components/SOSButton'
import LandingPage from './pages/LandingPage'
import ChatIntake from './pages/ChatIntake'
import Results from './pages/Results'
import Summary from './pages/Summary'
import TelemetryDashboard from './pages/TelemetryDashboard'
import ReportsDashboard from './pages/ReportsDashboard'

export default function App() {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/intake" element={<ChatIntake />} />
          <Route path="/results" element={<Results />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/telemetry" element={<TelemetryDashboard />} />
          <Route path="/reports" element={<ReportsDashboard />} />
        </Routes>
      </main>
      <SOSButton />
      <Footer />
    </div>
  )
}

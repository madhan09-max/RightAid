import React from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Footer() {
  const { t } = useApp()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        {/* Government Info Section */}
        <div className="footer-section">
          <h3>{t('govTitle')}</h3>
          <p>
            <strong>RightAid - Tamil Nadu Social Protection Eligibility Portal</strong>
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            {t('disclaimerGov')}
          </p>
          <p style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
            State Emergency Care Network: Nammai Kaakkum 48 | Toll-Free Helpline: 108 / 112
          </p>
        </div>

        {/* Quick GovTech Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li>
              <Link to="/">Home Portal</Link>
            </li>
            <li>
              <Link to="/intake">Check Scheme Eligibility</Link>
            </li>
            <li>
              <Link to="/telemetry">System Telemetry & Metrics</Link>
            </li>
            <li>
              <a
                href="https://www.tn.gov.in"
                target="_blank"
                rel="noopener noreferrer"
              >
                Government of Tamil Nadu Official Portal ↗
              </a>
            </li>
            <li>
              <a
                href="https://tnesevai.tn.gov.in"
                target="_blank"
                rel="noopener noreferrer"
              >
                TNeGA e-Sevai Portal ↗
              </a>
            </li>
          </ul>
        </div>

        {/* Citizen Welfare & RTI */}
        <div className="footer-section">
          <h3>Citizen Support</h3>
          <ul className="footer-links">
            <li>
              <a href="#about" onClick={(e) => e.preventDefault()}>
                About RightAid Initiative
              </a>
            </li>
            <li>
              <a href="#rti" onClick={(e) => e.preventDefault()}>
                Right to Information (RTI)
              </a>
            </li>
            <li>
              <a href="#accessibility" onClick={(e) => e.preventDefault()}>
                Accessibility Statement (GIGW 3.0)
              </a>
            </li>
            <li>
              <a href="#contact" onClick={(e) => e.preventDefault()}>
                Contact District Welfare Offices
              </a>
            </li>
            <li>
              <a href="#privacy" onClick={(e) => e.preventDefault()}>
                Terms of Use & Privacy Policy
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom">
        <p>
          Designed & Developed for Public Welfare | Department of Social Welfare, Government of Tamil Nadu
        </p>
        <p style={{ marginTop: '0.25rem' }}>
          © {currentYear} Government of Tamil Nadu. All rights reserved. Content owned and maintained by State Welfare Authorities.
        </p>
      </div>
    </footer>
  )
}

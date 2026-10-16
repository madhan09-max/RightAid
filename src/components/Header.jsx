import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Header() {
  const { language, setLanguage, t } = useApp()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="header" role="banner">
      {/* Accessibility Skip Link */}
      <a href="#main-content" className="skip-to-content">
        {t('skipLink')}
      </a>

      {/* Official Government Top Bar */}
      <div className="header-topbar">
        <div className="header-topbar-content">
          <span>{t('govTitle')} | Government of Tamil Nadu</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>GIGW 3.0 Standard Portal</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="header-main">
        {/* Brand / Title & Emblem */}
        <Link to="/" className="header-brand" onClick={closeMobileMenu} aria-label="RightAid Home">
          <span className="material-icons header-emblem" aria-hidden="true">
            account_balance
          </span>
          <div className="header-titles">
            <span className="header-title">{t('appTitle')}</span>
            <span className="header-subtitle">{t('portalName')}</span>
          </div>
        </Link>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="header-hamburger"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <span className="material-icons">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>

        {/* Navigation & Language Select */}
        <nav
          className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}
          role="navigation"
          aria-label="Main Navigation"
        >
          <ul className="nav-links">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>
                  home
                </span>
                {t('navHome')}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/intake"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>
                  assignment_turned_in
                </span>
                {t('navCheckEligibility')}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/telemetry"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>
                  speed
                </span>
                {t('navTelemetry')}
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/reports"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="material-icons" style={{ fontSize: '1.1rem' }}>
                  assessment
                </span>
                {t('navReports', 'Caseworker Reports')}
              </NavLink>
            </li>
          </ul>

          {/* Language Switcher */}
          <div className="language-toggle" role="group" aria-label="Language selection">
            <button
              type="button"
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => setLanguage('en')}
              aria-pressed={language === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-btn ${language === 'ta' ? 'active' : ''}`}
              onClick={() => setLanguage('ta')}
              aria-pressed={language === 'ta'}
            >
              தமிழ்
            </button>
            <button
              type="button"
              className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
              onClick={() => setLanguage('hi')}
              aria-pressed={language === 'hi'}
            >
              हिन्दी
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

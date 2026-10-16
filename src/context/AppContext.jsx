import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations } from '../data/translations'

const AppContext = createContext(null)

const INITIAL_USER_DATA = {
  name: '',
  age: null,
  gender: '',
  education_level: null,
  annual_income: null,
  knows_tailoring: false,
  works_in_agriculture: false,
  owns_agricultural_land: false,
  is_unorganized_worker: false,
  has_school_kids: false,
  accident_hours_ago: null,
  uploaded_documents: [],
  community: '',
  rationCardType: '',
  district: '',
  taluk: '',
  lifeEvent: 'none',
  aadhaarLinked: false,
  incomeCertAmount: null,
  nameOnAadhaar: '',
  nameOnRationCard: '',
  documentMetadata: {},
  validationResults: null,
  riskAssessment: null,
  trackingStatus: 'data_collected'
}

export function AppProvider({ children }) {
  // 1. Language State
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('rightaid_language')
      return saved && ['en', 'ta', 'hi'].includes(saved) ? saved : 'ta'
    } catch {
      return 'ta'
    }
  })

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('rightaid_language', lang)
    } catch (e) {
      console.warn('LocalStorage unavailable for language persistence', e)
    }
  }, [])

  // 2. User Data State (Collected through Intake)
  const [userData, setUserData] = useState(() => {
    try {
      const saved = localStorage.getItem('rightaid_userdata')
      return saved ? { ...INITIAL_USER_DATA, ...JSON.parse(saved) } : INITIAL_USER_DATA
    } catch {
      return INITIAL_USER_DATA
    }
  })

  const updateUserData = useCallback((patch) => {
    setUserData((prev) => {
      const updated = { ...prev, ...patch }
      try {
        localStorage.setItem('rightaid_userdata', JSON.stringify(updated))
      } catch (e) {
        console.warn('LocalStorage save error', e)
      }
      return updated
    })
  }, [])

  const resetUserData = useCallback(() => {
    setUserData(INITIAL_USER_DATA)
    setValidationResults(null)
    setRiskAssessment(null)
    setTrackingStatus('data_collected')
    try {
      localStorage.removeItem('rightaid_userdata')
      localStorage.removeItem('rightaid_results')
    } catch (e) {
      console.warn('LocalStorage clear error', e)
    }
  }, [])

  // 3. Intake Chat Step Progress
  const [currentStep, setCurrentStep] = useState(0)

  // 4. Scheme Evaluation Results
  const [results, setResultsState] = useState(() => {
    try {
      const saved = localStorage.getItem('rightaid_results')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const setResults = useCallback((newResults) => {
    setResultsState(newResults)
    try {
      if (newResults) {
        localStorage.setItem('rightaid_results', JSON.stringify(newResults))
      } else {
        localStorage.removeItem('rightaid_results')
      }
    } catch (e) {
      console.warn('LocalStorage save error for results', e)
    }
  }, [])

  // 5. Phone-number Keyed Saved Sessions
  const [savedSessions, setSavedSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('rightaid_sessions')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const saveSession = useCallback((phoneNumber, extraMeta = {}) => {
    if (!phoneNumber) return null
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '')
    const refId = `TN-RA-${cleanPhone.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`
    const sessionRecord = {
      refId,
      phoneNumber: cleanPhone,
      userData,
      results,
      savedAt: new Date().toISOString(),
      ...extraMeta
    }

    setSavedSessions((prev) => {
      const updated = { ...prev, [cleanPhone]: sessionRecord }
      try {
        localStorage.setItem('rightaid_sessions', JSON.stringify(updated))
      } catch (e) {
        console.warn('Failed to save sessions to localStorage', e)
      }
      return updated
    })

    return sessionRecord
  }, [userData, results])

  const loadSession = useCallback((phoneNumber) => {
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '')
    const session = savedSessions[cleanPhone]
    if (session) {
      if (session.userData) updateUserData(session.userData)
      if (session.results) setResults(session.results)
      return session
    }
    return null
  }, [savedSessions, updateUserData, setResults])

  // 6. SOS State
  const [sosTriggered, setSosTriggered] = useState(false)
  const triggerSOS = useCallback((triggered = true) => {
    setSosTriggered(Boolean(triggered))
  }, [])

  // 7. Toast Notifications
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5)
    const toast = { id, message, type }
    setToasts((prev) => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    return id
  }, [removeToast])

  // 8. Translation Helper
  const t = useCallback((key) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key]
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key]
    }
    return key
  }, [language])

  // 9. Validation & Risk Engine States (Pillar 2 & 3 Expansion)
  const [validationResults, setValidationResults] = useState(null)
  const [riskAssessment, setRiskAssessment] = useState(null)
  const [trackingStatus, setTrackingStatus] = useState('data_collected')

  const value = {
    language,
    setLanguage,
    userData,
    updateUserData,
    resetUserData,
    currentStep,
    setCurrentStep,
    results,
    setResults,
    savedSessions,
    saveSession,
    loadSession,
    sosTriggered,
    triggerSOS,
    toasts,
    addToast,
    removeToast,
    t,
    validationResults,
    setValidationResults,
    riskAssessment,
    setRiskAssessment,
    trackingStatus,
    setTrackingStatus
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="toast-container" role="region" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast-notification toast-${toast.type}`}>
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export const useAppContext = useApp

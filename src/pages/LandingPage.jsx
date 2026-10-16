import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/translations';
import SOSButton from '../components/SOSButton';

export default function LandingPage() {
  const navigate = useNavigate();
  const { language, setLanguage, addToast, loadSession } = useAppContext();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumePhone, setResumePhone] = useState('');
  const [resumeError, setResumeError] = useState('');

  const t = (key, fallback) => translations?.[language]?.[key] || translations?.en?.[key] || fallback;

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeechToggle = () => {
    if (!('speechSynthesis' in window)) {
      if (addToast) {
        addToast(t('voiceNotSupported', 'Voice not supported on this device'), 'warning');
      }
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const instructionsText = language === 'ta'
      ? 'ரைட்எய்டு அரசு நலத்திட்ட வழிகாட்டிக்கு நல்வரவு. மூன்று எளிய படிகள்: முதலாவதாக, உங்களைப் பற்றிய எளிய கேள்விகளுக்குப் பதிலளிக்கவும். இரண்டாவதாக, நீங்கள் தகுதியுள்ள அரசுத் திட்டங்களை நாங்கள் உடனடியாகக் கண்டறிவோம். மூன்றாவதாக, உங்கள் தனிப்பட்ட ஆவண சரிபார்ப்புப் பட்டியலைப் பெறுங்கள். தொடங்க ஸ்டார்ட் நவ் பொத்தானை அழுத்தவும்.'
      : language === 'hi'
      ? 'राइटएड नागरिक सहायता पोर्टल में आपका स्वागत है। तीन आसान चरण: पहला, अपने बारे में सरल सवालों के जवाब दें। दूसरा, हम आपके लिए पात्र सरकारी योजनाएं खोजते हैं। तीसरा, अपनी आवश्यक दस्तावेज़ चेकलिस्ट प्राप्त करें। शुरू करने के लिए स्टार्ट नाउ पर क्लिक करें।'
      : 'Welcome to RightAid Government Scheme Assistant. Three simple steps: One, answer simple questions about yourself. Two, we find government schemes you qualify for. Three, get your personalized document checklist. Click Start Now to begin.';

    const utterance = new SpeechSynthesisUtterance(instructionsText);
    utterance.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(language));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel(); // Reset any existing
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleResumeSubmit = (e) => {
    e.preventDefault();
    setResumeError('');

    const cleanPhone = resumePhone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setResumeError(t('invalidPhone', 'Please enter a valid 10-digit mobile number'));
      return;
    }

    if (loadSession) {
      const session = loadSession(cleanPhone);
      if (session) {
        if (addToast) {
          addToast(t('sessionRestored', 'Session restored successfully!'), 'success');
        }
        setShowResumeModal(false);
        // If results exist in the loaded session, jump to results, else intake
        if (session.results && session.results.length > 0) {
          navigate('/results');
        } else {
          navigate('/intake');
        }
        return;
      }
    }

    // Try direct localStorage fallback if loadSession returned null
    try {
      const raw = localStorage.getItem(`rightaid_session_${cleanPhone}`);
      if (raw) {
        if (addToast) {
          addToast(t('sessionRestored', 'Session restored successfully!'), 'success');
        }
        setShowResumeModal(false);
        navigate('/intake');
        return;
      }
    } catch (err) {
      console.error(err);
    }

    setResumeError(
      t('sessionNotFound', 'No saved session found for this mobile number. Please start a new application.')
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Top Bar with Language Selector */}
      <header
        style={{
          backgroundColor: '#1e3a8a',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-icons" style={{ fontSize: '28px', color: '#f59e0b' }}>
            account_balance
          </span>
          <div>
            <div style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '0.5px' }}>RightAid</div>
            <div style={{ fontSize: '10px', color: '#93c5fd', textTransform: 'uppercase' }}>
              GovTech Scheme Access Initiative
            </div>
          </div>
        </div>

        {/* Language switcher buttons */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px', borderRadius: '8px' }}>
          {[
            { code: 'en', label: 'English' },
            { code: 'ta', label: 'தமிழ்' },
            { code: 'hi', label: 'हिंदी' }
          ].map(lang => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              style={{
                backgroundColor: language === lang.code ? '#ffffff' : 'transparent',
                color: language === lang.code ? '#1e3a8a' : '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '32px 20px' }}>
        <div
          className="landing-hero"
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            marginBottom: '32px',
            border: '1px solid #e2e8f0'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '16px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>verified_user</span>
            <span>{t('heroGovtTag', 'Official Welfare Matching Portal')}</span>
          </div>

          <h1
            style={{
              fontSize: '36px',
              fontWeight: '800',
              color: '#0f172a',
              margin: '0 0 12px 0',
              letterSpacing: '-0.5px'
            }}
          >
            RightAid
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: '#475569',
              maxWidth: '650px',
              margin: '0 auto 24px auto',
              lineHeight: '1.6'
            }}
          >
            {t(
              'landingSubtitle',
              language === 'ta'
                ? 'உங்களுக்கான அரசு நலத்திட்டங்கள் மற்றும் உதவித்தொகைகளை சில நிமிடங்களில் கண்டறியுங்கள்.'
                : language === 'hi'
                ? 'कुछ ही मिनटों में अपने लिए पात्र सरकारी योजनाएं और लाभ खोजें।'
                : 'Discover government welfare schemes you qualify for with instant eligibility checks and document readiness guidance.'
            )}
          </p>

          {/* Voice Instruction Button */}
          <button
            type="button"
            onClick={handleSpeechToggle}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isSpeaking ? '#fee2e2' : '#f1f5f9',
              color: isSpeaking ? '#dc2626' : '#1e293b',
              border: isSpeaking ? '2px solid #ef4444' : '1px solid #cbd5e1',
              borderRadius: '30px',
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '28px',
              transition: 'all 0.2s'
            }}
          >
            <span className="material-icons" style={{ color: isSpeaking ? '#dc2626' : '#2563eb' }}>
              {isSpeaking ? 'volume_off' : 'volume_up'}
            </span>
            <span>
              {isSpeaking
                ? t('stopListening', 'Stop Listening')
                : t('listenInstructions', 'Listen to Instructions')}
            </span>
          </button>

          {/* Saffron Start Button */}
          <div>
            <button
              type="button"
              onClick={() => navigate('/intake')}
              className="btn-primary"
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 40px',
                fontSize: '20px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(234, 88, 12, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{t('startNow', 'Start Now')}</span>
              <span className="material-icons" style={{ fontSize: '24px' }}>arrow_forward</span>
            </button>
          </div>

          {/* Resume link */}
          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setShowResumeModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
            >
              {t('resumePreviousSession', 'Resume Previous Session')}
            </button>
          </div>
        </div>

        {/* 3 Step Instruction Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '36px'
          }}
        >
          {/* Step 1 */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <span className="material-icons" style={{ fontSize: '30px' }}>chat</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              1. {t('step1Title', 'Simple Intake')}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
              {t('step1Desc', 'Answer simple questions about yourself one by one in your preferred language.')}
            </p>
          </div>

          {/* Step 2 */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <span className="material-icons" style={{ fontSize: '30px' }}>search</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              2. {t('step2Title', 'Instant Matching')}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
              {t('step2Desc', 'We evaluate rules in real-time to find all government schemes you qualify for.')}
            </p>
          </div>

          {/* Step 3 */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <span className="material-icons" style={{ fontSize: '30px' }}>description</span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
              3. {t('step3Title', 'Document Checklist')}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
              {t('step3Desc', 'Get traffic-light document readiness status and direct links to apply.')}
            </p>
          </div>
        </div>

        {/* Footer Admin Link */}
        <div style={{ textAlign: 'center', marginTop: '24px', padding: '16px 0', borderTop: '1px solid #e2e8f0' }}>
          <Link
            to="/telemetry"
            style={{
              color: '#64748b',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>dashboard</span>
            <span>{t('viewTelemetry', 'View Telemetry Dashboard (Admin)')}</span>
          </Link>
        </div>
      </main>

      {/* Resume Session Modal */}
      {showResumeModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                {t('resumeSessionTitle', 'Resume Saved Session')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowResumeModal(false);
                  setResumeError('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              {t('enterPhoneToResume', 'Enter the 10-digit mobile number you used to save your progress:')}
            </p>

            <form onSubmit={handleResumeSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="tel"
                  maxLength={10}
                  value={resumePhone}
                  onChange={(e) => setResumePhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
                {resumeError && (
                  <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px' }}>
                    {resumeError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowResumeModal(false);
                    setResumeError('');
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#1e3a8a',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {t('loadSessionBtn', 'Load Session')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Caseworker SOS Button */}
      <SOSButton />
    </div>
  );
}

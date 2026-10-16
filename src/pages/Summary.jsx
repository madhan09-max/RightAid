import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/translations';
import DocumentChecker from '../components/DocumentChecker';
import SOSButton from '../components/SOSButton';

export default function Summary() {
  const navigate = useNavigate();
  const {
    language,
    userData,
    updateUserData,
    results,
    setResults,
    saveSession,
    addToast,
    triggerSOS
  } = useAppContext();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savePhone, setSavePhone] = useState('');
  const [checkedTodos, setCheckedTodos] = useState({});

  const t = (key, fallback) => translations?.[language]?.[key] || translations?.en?.[key] || fallback;

  // Filter eligible schemes
  const eligibleSchemes = (results || []).filter(r => r.eligible);

  // Compile overall TO-DO list from all schemes
  const compileTodoList = () => {
    const todos = [];
    const missingDocsSet = new Set();

    eligibleSchemes.forEach(item => {
      const missing = item.missingDocs || [];
      missing.forEach(d => missingDocsSet.add(d));
    });

    if (missingDocsSet.size > 0) {
      missingDocsSet.forEach(doc => {
        todos.push({
          id: `doc_${doc}`,
          text: language === 'ta'
            ? `${doc} ஆவணத்தின் அசல் மற்றும் நகல்களைத் தயார் செய்யவும்.`
            : language === 'hi'
            ? `${doc} की मूल और फोटोकॉपी तैयार करें।`
            : `Obtain and prepare original & copies of ${doc}.`
        });
      });
    }

    // Default civic to-dos
    todos.push({
      id: 'aadhar_bank_link',
      text: language === 'ta'
        ? 'உங்கள் வங்கிக் கணக்கு ஆதாருடன் இணைக்கப்பட்டுள்ளதா (DBT Active) என்பதை உறுதிப்படுத்தவும்.'
        : language === 'hi'
        ? 'सुनिश्चित करें कि आपका बैंक खाता आधार से जुड़ा हुआ है (DBT Active)।'
        : 'Verify Aadhaar-Bank Account linkage for Direct Benefit Transfer (DBT).'
    });

    todos.push({
      id: 'esevai_visit',
      text: language === 'ta'
        ? 'அருகிலுள்ள இ-சேவை மையம் அல்லது பொது சேவை மையத்திற்கு (CSC) சென்று பயோமெட்ரிக் அங்கீகாரம் பெறவும்.'
        : language === 'hi'
        ? 'बायोमेट्रिक सत्यापन के लिए नजदीकी ई-सेवा केंद्र या सीएससी केंद्र पर जाएं।'
        : 'Visit nearest e-Sevai / CSC Center for biometric authentication if applying offline.'
    });

    if (userData?.hadAccident) {
      todos.push({
        id: 'accident_fir',
        text: language === 'ta'
          ? 'விபத்து அவசர உதவிக்கு மருத்துவமனை அறிக்கை அல்லது FIR நகலை 48 மணி நேரத்திற்குள் சமர்ப்பிக்கவும்.'
          : language === 'hi'
          ? 'दुर्घटना सहायता के लिए 48 घंटे के भीतर अस्पताल की रिपोर्ट या प्राथमिकी प्रति जमा करें।'
          : 'Submit hospital casualty admission report or FIR copy within 48-hour deadline.'
      });
    }

    return todos;
  };

  const todoList = compileTodoList();

  const toggleTodo = (id) => {
    setCheckedTodos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveProgress = (e) => {
    e.preventDefault();
    const phone = savePhone.trim();
    if (!phone || phone.length < 10) {
      if (addToast) {
        addToast(t('enterValidPhone', 'Please enter a valid 10-digit mobile number'), 'error');
      }
      return;
    }

    const payload = {
      userData,
      results,
      savedAt: new Date().toISOString()
    };

    if (saveSession) {
      saveSession(phone, payload);
    } else {
      localStorage.setItem(`rightaid_session_${phone}`, JSON.stringify(payload));
    }

    if (addToast) {
      addToast(
        language === 'ta'
          ? 'விண்ணப்பத் திட்டம் வெற்றிகரமாக சேமிக்கப்பட்டது!'
          : language === 'hi'
          ? 'आवेदन योजना सफलतापूर्वक सहेजी गई!'
          : 'Application plan saved successfully!',
        'success'
      );
    }
    setShowSaveModal(false);
  };

  const handleStartNew = () => {
    if (window.confirm(t('confirmNewApp', 'Start a new application? Current data will be cleared.'))) {
      if (updateUserData) updateUserData({});
      if (setResults) setResults([]);
      navigate('/');
    }
  };

  const getSchemeNextSteps = (scheme) => {
    return [
      language === 'ta'
        ? 'மேலே குறிப்பிடப்பட்டுள்ள தேவையான அனைத்து ஆவணங்களின் நகல்களைத் திரட்டவும்.'
        : language === 'hi'
        ? 'ऊपर सूचीबद्ध सभी आवश्यक दस्तावेजों की प्रतियां एकत्र करें।'
        : 'Assemble all green & amber verified documents shown above.',
      language === 'ta'
        ? 'அதிகாரப்பூர்வ அரசு இணையதளத்தில் விண்ணப்பிக்க கீழே உள்ள "விண்ணப்பிக்கவும்" இணைப்பைப் பயன்படுத்தவும்.'
        : language === 'hi'
        ? 'आधिकारिक पोर्टल पर ऑनलाइन आवेदन करने के लिए नीचे दिए गए बटन पर क्लिक करें।'
        : 'Click the official portal button below or submit via your local Taluk / Welfare Office.',
      language === 'ta'
        ? 'விண்ணப்ப ஒப்புகை சீட்டை (Acknowledgement Slip) பத்திரமாக வைத்திருக்கவும்.'
        : language === 'hi'
        ? 'स्थिति की जांच के लिए पावती रसीद को सुरक्षित रखें।'
        : 'Keep the application acknowledgement receipt safe for tracking.'
    ];
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @media print {
          header, .no-print, .sos-floating-btn {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .summary-card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <header
        style={{
          backgroundColor: '#1e3a8a',
          color: '#ffffff',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/results"
            style={{ color: '#ffffff', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            title="Back to Results"
          >
            <span className="material-icons">arrow_back</span>
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
              {t('appSummaryTitle', 'Application Preparation Assistant')}
            </h1>
            <div style={{ fontSize: '12px', color: '#93c5fd' }}>
              {t('appSummarySubtitle', 'Personalized roadmap & document checklist')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-secondary"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>print</span>
            <span>{t('printSummary', 'Print')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="btn-secondary"
            style={{
              backgroundColor: '#ea580c',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>save</span>
            <span>{t('saveAndContinue', 'Save & Continue Later')}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Profile Details Card */}
        <section
          className="summary-section summary-card card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons" style={{ color: '#1e3a8a' }}>badge</span>
              <span>{t('applicantProfile', 'Applicant Profile')}</span>
            </h2>
            <Link
              to="/intake"
              className="no-print"
              style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}
            >
              {t('editProfile', 'Edit Profile')}
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              backgroundColor: '#f8fafc',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                {t('nameLabel', 'Full Name')}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                {userData?.name || 'N/A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                {t('ageGenderLabel', 'Age / Gender')}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                {userData?.age ? `${userData.age} yrs` : 'N/A'} {userData?.gender ? `• ${userData.gender}` : ''}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                {t('annualIncomeLabel', 'Annual Income')}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                ₹{Number(userData?.income || userData?.annualIncome || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                {t('educationLabel', 'Education')}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                {userData?.education ? `Class ${userData.education}` : 'N/A'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                {t('occupationLabel', 'Occupation / Category')}
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>
                {userData?.isFarmer
                  ? (language === 'ta' ? 'விவசாயி' : language === 'hi' ? 'किसान' : 'Farmer')
                  : userData?.isDailyWage
                  ? (language === 'ta' ? 'தினக்கூலி / அமைப்புசாரா' : language === 'hi' ? 'दिहाड़ी मजदूर' : 'Daily Wage Worker')
                  : (language === 'ta' ? 'பொது' : language === 'hi' ? 'सामान्य' : 'General')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>
                {t('documentsHeldLabel', 'Uploaded / Ready Documents')}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#15803d' }}>
                {userData?.documentsReady?.length > 0
                  ? userData.documentsReady.join(', ')
                  : (language === 'ta' ? 'இல்லை' : language === 'hi' ? 'कोई नहीं' : 'None yet')}
              </div>
            </div>
          </div>
        </section>

        {/* Master To-Do Checklist */}
        <section
          className="summary-section summary-card card"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="material-icons" style={{ color: '#ea580c', fontSize: '24px' }}>
              checklist
            </span>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
              {t('masterTodoList', 'Consolidated Action Checklist')}
            </h2>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b' }}>
            {t(
              'todoInstructions',
              'Complete these essential action items to ensure your welfare applications are approved without delay.'
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todoList.map((item) => {
              const isDone = !!checkedTodos[item.id];
              return (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: isDone ? '#f0fdf4' : '#f8fafc',
                    border: isDone ? '1px solid #86efac' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleTodo(item.id)}
                    style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      color: isDone ? '#166534' : '#1e293b',
                      textDecoration: isDone ? 'line-through' : 'none',
                      lineHeight: '1.4'
                    }}
                  >
                    {item.text}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Section: Eligible Schemes Detailed Breakdown */}
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ color: '#16a34a' }}>verified</span>
            <span>
              {t('eligibleSchemesActionList', 'Eligible Schemes & Specific Instructions')} ({eligibleSchemes.length})
            </span>
          </h2>

          {eligibleSchemes.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '32px',
                borderRadius: '12px',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}
            >
              <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 16px 0' }}>
                {t('noEligibleSchemesNotice', 'No eligible schemes detected based on your current inputs.')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/intake')}
                className="btn-primary"
                style={{
                  backgroundColor: '#1e3a8a',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {t('recheckIntake', 'Re-check Answers')}
              </button>
            </div>
          ) : (
            eligibleSchemes.map((item, idx) => {
              const { scheme } = item;
              const nextSteps = getSchemeNextSteps(scheme);

              return (
                <div
                  key={scheme.id || idx}
                  className="summary-card card"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '16px',
                    border: '1px solid #bbf7d0',
                    borderLeft: '6px solid #16a34a',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '700', color: '#111827' }}>
                        {scheme.name}
                      </h3>
                      {scheme.category && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}
                        >
                          {scheme.category}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span className="material-icons" style={{ fontSize: '15px' }}>check_circle</span>
                      <span>{t('eligible', 'Eligible')}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                    {scheme.description}
                  </p>

                  {/* Document Readiness inside this scheme */}
                  <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <DocumentChecker
                      requiredDocs={scheme.requiredDocs || []}
                      uploadedDocs={userData?.documentsReady || []}
                      language={language}
                    />
                  </div>

                  {/* Next Steps for this Scheme */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                      {t('nextStepsHeader', 'Next Steps to Apply')}:
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
                      {nextSteps.map((step, sIdx) => (
                        <li key={sIdx} style={{ marginBottom: '4px' }}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Apply Link Button */}
                  {scheme.officialLink && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <a
                        href={scheme.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          textDecoration: 'none',
                          boxShadow: '0 2px 6px rgba(30, 58, 138, 0.25)'
                        }}
                      >
                        <span>{t('applyOnOfficialPortal', 'Apply on Official Portal')}</span>
                        <span className="material-icons" style={{ fontSize: '16px' }}>open_in_new</span>
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>

        {/* SOS Caseworker Support Section */}
        <section
          className="summary-section summary-card card"
          style={{
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #fecaca',
            marginBottom: '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <span className="material-icons" style={{ fontSize: '28px' }}>support_agent</span>
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: '700', color: '#991b1b' }}>
                {t('needAssistanceTitle', 'Need Help Applying or Missing Documents?')}
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#7f1d1d', lineHeight: '1.5' }}>
                {t(
                  'caseworkerDesc',
                  'A certified RightAid field caseworker can guide you in person, assist with Aadhaar biometric updates, or help file appeals for rejected certificates.'
                )}
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (triggerSOS) triggerSOS();
                    if (addToast) {
                      addToast(
                        t('sosAlertToast', 'Caseworker SOS alert triggered. A caseworker has been notified.'),
                        'error'
                      );
                    }
                  }}
                  className="btn-primary"
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span className="material-icons">phone_in_talk</span>
                  <span>{t('requestCaseworkerCallback', 'Request Caseworker Assistance')}</span>
                </button>

                <a
                  href="tel:18004251000"
                  className="btn-secondary"
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#991b1b',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="material-icons">call</span>
                  <span>Toll-Free Helpline: 1800-425-1000</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Actions Bar */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '24px 0' }}>
          <button
            type="button"
            onClick={handleStartNew}
            style={{
              background: 'none',
              border: '1px solid #cbd5e1',
              color: '#64748b',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-icons">restart_alt</span>
            <span>{t('startNewApp', 'Start New Application')}</span>
          </button>
        </div>
      </main>

      {/* Save Session Modal */}
      {showSaveModal && (
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
                {t('saveSessionTitle', 'Save Your Application Roadmap')}
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              {t(
                'savePhoneDesc',
                'Enter your 10-digit mobile number to save this summary and access it anytime.'
              )}
            </p>

            <form onSubmit={handleSaveProgress}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="tel"
                  maxLength={10}
                  value={savePhone}
                  onChange={(e) => setSavePhone(e.target.value.replace(/\D/g, ''))}
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
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
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
                  {t('saveNow', 'Save')}
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

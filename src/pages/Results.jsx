import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/translations';
import { evaluateAllSchemes } from '../engine/rulesEngine';
import { runFullValidation } from '../engine/validator';
import { runFullRiskAssessment } from '../engine/riskEngine';
import { getTalukDetails } from '../data/locations';
import * as telemetryEngine from '../engine/telemetry';
import SchemeCard from '../components/SchemeCard';
import SOSButton from '../components/SOSButton';
import AlertBanner from '../components/AlertBanner';
import LifecycleTracker from '../components/LifecycleTracker';

export default function Results() {
  const navigate = useNavigate();
  const {
    language,
    userData,
    results,
    setResults,
    addToast,
    validationResults: contextValidationResults,
    riskAssessment: contextRiskAssessment,
    trackingStatus: contextTrackingStatus
  } = useAppContext();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'eligible' | 'ineligible'
  const [smsDispatched, setSmsDispatched] = useState(false);

  const t = (key, fallback) => translations?.[language]?.[key] || translations?.en?.[key] || fallback;

  // Defensive fallback computation for Pillar 2 & 3 if not present in context
  const validationResults = contextValidationResults || (userData ? (() => {
    try {
      return runFullValidation(userData, userData.documentMetadata || {});
    } catch {
      return null;
    }
  })() : null);

  const riskAssessment = contextRiskAssessment || (userData ? (() => {
    try {
      return runFullRiskAssessment(userData, userData.documentMetadata || {});
    } catch {
      return null;
    }
  })() : null);

  const trackingStatus = contextTrackingStatus || userData?.trackingStatus || 'validation_passed';

  // Guard: if no results, re-evaluate or redirect
  useEffect(() => {
    if (!results || results.length === 0) {
      if (userData && Object.keys(userData).length > 2 && typeof evaluateAllSchemes === 'function') {
        try {
          const evaluated = evaluateAllSchemes(userData);
          if (evaluated && evaluated.length > 0) {
            setResults(evaluated);
            return;
          }
        } catch (e) {
          console.error('Re-evaluation error:', e);
        }
      }
      navigate('/intake');
    }
  }, [results, userData, navigate, setResults]);

  // Trigger simulated SMS on load
  useEffect(() => {
    if (results && results.length > 0 && !smsDispatched) {
      setSmsDispatched(true);
      const eligibleList = results.filter(r => r.eligible);

      // Trigger telemetry SMS simulation
      try {
        if (telemetryEngine && typeof telemetryEngine.simulateSMS === 'function') {
          telemetryEngine.simulateSMS(userData, eligibleList);
        }
      } catch (err) {
        console.warn('Telemetry SMS simulation failed:', err);
      }

      // Show SMS toast
      if (addToast) {
        const smsMessage = t(
          'smsNotification',
          language === 'ta'
            ? 'திட்ட விவரங்களுடன் கூடிய குறுஞ்செய்தி (SMS) உங்கள் தொலைபேசிக்கு அனுப்பப்பட்டது.'
            : language === 'hi'
            ? 'योजना विवरण के साथ एसएमएस आपके फोन पर भेजा गया है।'
            : 'SMS sent to your phone with scheme details'
        );
        addToast(smsMessage, 'info');
      }
    }
  }, [results, smsDispatched, language, addToast, userData]);

  if (!results || results.length === 0) {
    return null;
  }

  // Calculate stats
  const eligibleCount = results.filter(r => r.eligible).length;
  const ineligibleCount = results.filter(r => !r.eligible).length;
  const totalCount = results.length;

  // Total evaluation time in milliseconds
  const totalEvalTime = results.reduce((acc, curr) => {
    const val = typeof curr.evaluationTime === 'number' ? curr.evaluationTime : parseFloat(curr.evaluationTime) || 0;
    return acc + val;
  }, 0);

  // Sort: Eligible schemes first, then ineligible
  const sortedResults = [...results].sort((a, b) => {
    if (a.eligible === b.eligible) return 0;
    return a.eligible ? -1 : 1;
  });

  // Filter based on selected tab
  const filteredResults = sortedResults.filter(item => {
    if (activeFilter === 'eligible') return item.eligible;
    if (activeFilter === 'ineligible') return !item.eligible;
    return true;
  });

  // Taluk and local e-Sevai center details
  const talukDetails = (userData?.district && userData?.taluk)
    ? getTalukDetails(userData.district, userData.taluk)
    : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
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
            to="/intake"
            style={{ color: '#ffffff', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            title="Back to Questions"
          >
            <span className="material-icons">arrow_back</span>
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
              {t('yourEligibleSchemes', 'Your Eligible Schemes')}
            </h1>
            <div style={{ fontSize: '12px', color: '#93c5fd' }}>
              {userData?.name ? `${userData.name} • ` : ''}
              {t('matchedCount', `${eligibleCount} of ${totalCount} Schemes Found Eligible`)}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/intake')}
          className="btn-secondary"
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
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
          <span className="material-icons" style={{ fontSize: '16px' }}>replay</span>
          <span>{t('startOver', 'Start Over')}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* 1. Lifecycle Progress Stepper */}
        <LifecycleTracker currentStage={trackingStatus} language={language} />

        {/* 2. Coordination Gap Alerts */}
        {riskAssessment?.coordinationGaps && riskAssessment.coordinationGaps.length > 0 && (
          <AlertBanner alerts={riskAssessment.coordinationGaps} language={language} />
        )}

        {/* 3. Validation Flags Alerts */}
        {validationResults?.flags && validationResults.flags.length > 0 && (
          <AlertBanner alerts={validationResults.flags} language={language} />
        )}

        {/* 4. Expiry Warnings Alerts */}
        {validationResults?.warnings && validationResults.warnings.length > 0 && (
          <AlertBanner alerts={validationResults.warnings} language={language} />
        )}

        {/* 5. Deadline Risks Alerts */}
        {riskAssessment?.deadlineRisks && riskAssessment.deadlineRisks.length > 0 && (
          <AlertBanner alerts={riskAssessment.deadlineRisks} language={language} />
        )}

        {/* 6. Boundary Cases Alerts */}
        {riskAssessment?.boundaryCases && riskAssessment.boundaryCases.length > 0 && (
          <AlertBanner alerts={riskAssessment.boundaryCases} language={language} />
        )}

        {/* 7. Life Event Prioritization Special Green Card */}
        {riskAssessment?.lifeEventImpact && riskAssessment.lifeEventImpact.triggeredSchemes?.length > 0 && (
          <div className="alert-banner alert-banner-success" style={{ marginBottom: '16px' }}>
            <span className="material-icons alert-icon" style={{ color: '#16A34A', fontSize: '24px' }}>
              event_available
            </span>
            <div style={{ flex: 1 }}>
              <div className="alert-title" style={{ color: '#166534', fontWeight: '700' }}>
                {language === 'ta'
                  ? 'முக்கிய வாழ்க்கை நிகழ்வு முன்னுரிமை'
                  : language === 'hi'
                  ? 'जीवन घटना योजना प्राथमिकता'
                  : 'Life Event Priority Schemes'}
              </div>
              <div className="alert-message" style={{ color: '#166534' }}>
                {language === 'ta'
                  ? `உங்கள் சமீபத்திய வாழ்க்கை நிகழ்வின் அடிப்படையில், நாங்கள் உங்களுக்காக இந்தத் திட்டங்களை முன்னுரிமைப்படுத்தியுள்ளோம்: ${riskAssessment.lifeEventImpact.triggeredSchemes.map(s => s.name || s.id).join(', ')}`
                  : language === 'hi'
                  ? `आपकी हाल की जीवन घटना के आधार पर, हमने आपके लिए इन योजनाओं को प्राथमिकता दी है: ${riskAssessment.lifeEventImpact.triggeredSchemes.map(s => s.name || s.id).join(', ')}`
                  : `Based on your life event, we've prioritized these schemes for you: ${riskAssessment.lifeEventImpact.triggeredSchemes.map(s => s.name || s.id).join(', ')}`}
              </div>
            </div>
          </div>
        )}

        {/* 8. District & Taluk e-Sevai Center Location Info Card */}
        {talukDetails && (
          <div className="location-info-card">
            <span className="material-icons location-icon" aria-hidden="true">
              place
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#166534', marginBottom: '4px' }}>
                {language === 'ta'
                  ? 'அருகிலுள்ள இ-சேவை மையம் & தாலுகா அலுவலகம்'
                  : language === 'hi'
                  ? 'निकटतम ई-सेवई केंद्र और तालुक कार्यालय'
                  : 'Nearest e-Sevai Center & Taluk Welfare Office'}
              </div>
              <div style={{ fontSize: '14px', color: '#166534', marginBottom: '6px' }}>
                <strong>{userData.district}</strong> • {userData.taluk}
              </div>
              {talukDetails.welfareOffice && (
                <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                  <strong>{language === 'ta' ? 'தாலுகா அலுவலகம்: ' : language === 'hi' ? 'तालुक कार्यालय: ' : 'Taluk Office: '}</strong>
                  {talukDetails.welfareOffice}
                </div>
              )}
              {talukDetails.eSevaiCenters && talukDetails.eSevaiCenters.length > 0 && (
                <div style={{ fontSize: '13px', color: '#374151' }}>
                  <strong>{language === 'ta' ? 'இ-சேவை மையம்: ' : language === 'hi' ? 'ई-सेवई केंद्र: ' : 'e-Sevai Center: '}</strong>
                  {talukDetails.eSevaiCenters[0].name} — {talukDetails.eSevaiCenters[0].address}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metric and Performance Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: '700' }}>
              <span className="material-icons" style={{ fontSize: '20px' }}>check_circle</span>
              <span>{eligibleCount} {t('eligibleTab', 'Eligible')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: '600' }}>
              <span className="material-icons" style={{ fontSize: '20px' }}>cancel</span>
              <span>{ineligibleCount} {t('ineligibleTab', 'Ineligible')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px' }}>
            <span className="material-icons" style={{ fontSize: '18px', color: '#0284c7' }}>bolt</span>
            <span>
              {t('totalEvalTime', 'Evaluated in')} <strong>{totalEvalTime > 0 ? totalEvalTime.toFixed(2) : '< 1'}ms</strong>
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '8px'
          }}
        >
          {[
            { id: 'all', label: t('filterAll', 'All Schemes'), count: totalCount },
            { id: 'eligible', label: t('filterEligible', 'Eligible Only'), count: eligibleCount },
            { id: 'ineligible', label: t('filterIneligible', 'Ineligible'), count: ineligibleCount }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                backgroundColor: activeFilter === tab.id ? '#1e3a8a' : '#f1f5f9',
                color: activeFilter === tab.id ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  backgroundColor: activeFilter === tab.id ? 'rgba(255,255,255,0.25)' : '#cbd5e1',
                  color: activeFilter === tab.id ? '#ffffff' : '#1e293b',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* List of Scheme Cards */}
        {filteredResults.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              color: '#64748b'
            }}
          >
            <span className="material-icons" style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '12px' }}>
              folder_off
            </span>
            <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '18px' }}>
              {t('noSchemesInTab', 'No schemes match this filter')}
            </h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {t('trySwitchingTab', 'Try selecting "All Schemes" to see the complete evaluation.')}
            </p>
          </div>
        ) : (
          filteredResults.map(item => (
            <SchemeCard
              key={item.scheme?.id || item.scheme?.name}
              result={item}
              language={language}
            />
          ))
        )}

        {/* Bottom Action Footer */}
        <div
          style={{
            marginTop: '32px',
            padding: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            textAlign: 'center'
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
              {t('readyToApplyTitle', 'Ready to Apply for These Schemes?')}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              {t(
                'readyToApplyDesc',
                'Generate your unified document readiness checklist, step-by-step next steps, and official application roadmap.'
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/summary')}
              className="btn-primary"
              style={{
                backgroundColor: '#ea580c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)'
              }}
            >
              <span>{t('prepareApplication', 'Prepare Application')}</span>
              <span className="material-icons">arrow_forward</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/intake')}
              className="btn-secondary"
              style={{
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '14px 20px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-icons">edit</span>
              <span>{t('editAnswers', 'Edit Answers')}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Caseworker SOS Button */}
      <SOSButton />
    </div>
  );
}

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/translations';

export default function SOSButton() {
  const { language, userData, triggerSOS, addToast, sosTriggered } = useAppContext();
  const [showConfirm, setShowConfirm] = useState(false);

  const t = (key, fallback) => translations?.[language]?.[key] || translations?.en?.[key] || fallback;

  const handleSosClick = () => {
    const userName = userData?.name || 'Anonymous User';
    console.log(`ALERT: SOS triggered for user ${userName}. Flagging for caseworker assignment.`);
    
    if (triggerSOS) {
      triggerSOS();
    }
    
    const toastMessage = t(
      'sosAlertToast',
      language === 'ta' 
        ? 'களப்பணியாளர் அவசர உதவி கோரிக்கை பதிவு செய்யப்பட்டது. அதிகாரி விரைவில் தொடர்புகொள்வார்.'
        : language === 'hi'
        ? 'केसवर्कर एसओएस अलर्ट सक्रिय! एक अधिकारी जल्द ही आपसे संपर्क करेगा।'
        : 'Caseworker SOS alert triggered. A caseworker has been notified to assist you.'
    );

    if (addToast) {
      addToast(toastMessage, 'error');
    }

    setShowConfirm(true);
    setTimeout(() => {
      setShowConfirm(false);
    }, 6000);
  };

  const buttonLabel = t(
    'sosButtonText',
    language === 'ta'
      ? 'களப்பணியாளர் உதவி'
      : language === 'hi'
      ? 'केसवर्कर सहायता'
      : 'Talk to a Caseworker'
  );

  return (
    <>
      <style>{`
        @keyframes sosPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
            transform: scale(1);
          }
          70% {
            box-shadow: 0 0 0 14px rgba(220, 38, 38, 0);
            transform: scale(1.02);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
            transform: scale(1);
          }
        }
        .sos-floating-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          background-color: #dc2626;
          color: #ffffff;
          border: none;
          border-radius: 9999px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
          animation: sosPulse 2s infinite;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        .sos-floating-btn:hover {
          background-color: #b91c1c;
          transform: translateY(-2px);
        }
        @media (max-width: 640px) {
          .sos-floating-btn {
            bottom: 16px;
            right: 16px;
            padding: 10px 16px;
            font-size: 13px;
          }
        }
      `}</style>

      <button
        type="button"
        className="sos-button sos-floating-btn"
        onClick={handleSosClick}
        aria-label="Talk to a Caseworker"
        title="SOS Assistance"
      >
        <span className="material-icons" style={{ fontSize: '22px' }}>
          phone_in_talk
        </span>
        <span>{buttonLabel}</span>
      </button>

      {showConfirm && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: '76px',
            right: '20px',
            zIndex: 1001,
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            padding: '12px 16px',
            maxWidth: '340px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            fontSize: '13px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span className="material-icons" style={{ color: '#dc2626', fontSize: '24px' }}>
            support_agent
          </span>
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {language === 'ta'
                ? 'களப்பணியாளர் எச்சரிக்கை அனுப்பப்பட்டது'
                : language === 'hi'
                ? 'केसवर्कर सहायता सक्रिय'
                : 'Caseworker Dispatched'}
            </div>
            <div style={{ fontSize: '12px', marginTop: '2px' }}>
              {language === 'ta'
                ? 'அதிகாரி விரைவில் உங்களுடன் இணைக்கப்படுவார் (ஹெல்ப்லைன்: 1800-425-1000).'
                : language === 'hi'
                ? 'एक अधिकारी जल्द आपसे जुड़ेंगे (हेल्पलाइन: 1800-425-1000)।'
                : 'A dedicated caseworker has been alerted (Govt Helpline: 1800-425-1000).'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

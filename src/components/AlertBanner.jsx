import React, { useState } from 'react';

/**
 * GIGW 3.0 Compliant Bilingual Alert Banners Component (Pillar 4)
 * Renders stackable alert banners based on severity.
 * 
 * @param {Object} props
 * @param {Array} props.alerts - List of alert objects
 * @param {string} props.language - 'en' | 'ta' | 'hi'
 */
export default function AlertBanner({ alerts = [], language = 'en' }) {
  const [dismissedIds, setDismissedIds] = useState(new Set());

  if (!alerts || alerts.length === 0) {
    return null;
  }

  // Ensure alerts is always an array
  const alertList = Array.isArray(alerts) ? alerts : [alerts];

  const handleDismiss = (id) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const getLocalizedText = (content) => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return content[language] || content.en || Object.values(content)[0] || '';
  };

  const getSeverityConfig = (severity) => {
    const s = (severity || 'LOW').toUpperCase();
    switch (s) {
      case 'CRITICAL':
      case 'HIGH':
        return {
          bannerClass: s === 'CRITICAL' ? 'alert-banner-critical' : 'alert-banner-high',
          icon: 'error',
          ariaLive: 'assertive',
          title: {
            en: 'Action Required',
            ta: 'நடவடிக்கை தேவை',
            hi: 'कार्रवाई आवश्यक'
          }
        };
      case 'MEDIUM':
        return {
          bannerClass: 'alert-banner-medium',
          icon: 'warning',
          ariaLive: 'polite',
          title: {
            en: 'Attention Needed',
            ta: 'கவனம் தேவை',
            hi: 'ध्यान देने की आवश्यकता'
          }
        };
      case 'LOW':
      default:
        return {
          bannerClass: 'alert-banner-low',
          icon: 'info',
          ariaLive: 'polite',
          title: {
            en: 'Notice',
            ta: 'அறிவிப்பு',
            hi: 'सूचना'
          }
        };
    }
  };

  const labels = {
    howToFix: {
      en: 'How to fix:',
      ta: 'எப்படி சரிசெய்வது:',
      hi: 'समाधान:'
    },
    contact: {
      en: 'Contact:',
      ta: 'தொடர்பு கொள்ள:',
      hi: 'संपर्क:'
    },
    dismiss: {
      en: 'Dismiss alert',
      ta: 'அறிவிப்பை மூடு',
      hi: 'सूचना बंद करें'
    }
  };

  const visibleAlerts = alertList.filter((alert, idx) => {
    const alertId = alert.gapId || alert.id || alert.field || `${alert.type}_${idx}`;
    return !dismissedIds.has(alertId);
  });

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="alert-banners-container" style={{ marginBottom: '16px' }}>
      {visibleAlerts.map((alert, idx) => {
        const alertId = alert.gapId || alert.id || alert.field || `${alert.type}_${idx}`;
        const config = getSeverityConfig(alert.severity);
        const titleText = alert.title 
          ? getLocalizedText(alert.title) 
          : (config.title[language] || config.title.en);
        const messageText = getLocalizedText(alert.message);
        const resolutionText = getLocalizedText(alert.resolution);

        // Normalize departments: support both alert.departments array or departmentA/departmentB
        let depts = alert.departments || [];
        if (!depts.length && (alert.departmentA || alert.departmentB)) {
          depts = [alert.departmentA, alert.departmentB].filter(Boolean);
        }

        return (
          <div
            key={alertId}
            className={`alert-banner ${config.bannerClass}`}
            role="alert"
            aria-live={config.ariaLive}
          >
            <span className="material-icons alert-icon" aria-hidden="true">
              {config.icon}
            </span>

            <div style={{ flex: 1, paddingRight: '24px' }}>
              <div className="alert-title">{titleText}</div>
              <div className="alert-message">{messageText}</div>

              {resolutionText && (
                <div className="alert-resolution">
                  <strong>{labels.howToFix[language] || labels.howToFix.en} </strong>
                  <span>{resolutionText}</span>
                </div>
              )}

              {depts.length > 0 && (
                <div className="alert-departments">
                  <span style={{ fontSize: '11px', fontWeight: 600, alignSelf: 'center', opacity: 0.85 }}>
                    {labels.contact[language] || labels.contact.en}
                  </span>
                  {depts.map((dept, dIdx) => (
                    <span key={dIdx} className="dept-badge">
                      {typeof dept === 'string' ? dept : getLocalizedText(dept)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="alert-dismiss"
              onClick={() => handleDismiss(alertId)}
              aria-label={labels.dismiss[language] || labels.dismiss.en}
              title={labels.dismiss[language] || labels.dismiss.en}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

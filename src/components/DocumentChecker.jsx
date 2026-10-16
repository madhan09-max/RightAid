import React from 'react';
import { translations } from '../data/translations';

/**
 * Traffic-light document readiness component:
 * - GREEN (check_circle): Document present in uploadedDocs
 * - RED (cancel): Document missing
 * - AMBER (warning): Document present but flagged as 'Expired' or 'Non-Network'
 */
export default function DocumentChecker({ requiredDocs = [], uploadedDocs = [], language = 'en' }) {
  const t = (key, fallback) => translations?.[language]?.[key] || translations?.en?.[key] || fallback;

  if (!requiredDocs || requiredDocs.length === 0) {
    return (
      <div style={{ color: '#6b7280', fontSize: '13px', fontStyle: 'italic', padding: '8px 0' }}>
        {t('noDocumentsRequired', 'No documents required for this scheme.')}
      </div>
    );
  }

  const getDocStatus = (reqDoc) => {
    const cleanReq = (reqDoc || '').trim();
    const lowerReq = cleanReq.toLowerCase();

    // Check if uploaded doc exists with 'Expired' or 'Non-Network' prefix
    const amberMatch = uploadedDocs.find(item => {
      const raw = (item || '').trim();
      const isAmberFlag = /^(expired|non-network)/i.test(raw);
      if (!isAmberFlag) return false;
      const stripped = raw.replace(/^(expired|non-network)\s*/i, '').trim().toLowerCase();
      return stripped === lowerReq || lowerReq.includes(stripped) || stripped.includes(lowerReq);
    });

    if (amberMatch) {
      return {
        status: 'amber',
        icon: 'warning',
        label: amberMatch,
        badgeText: t('statusNeedsAttention', 'Needs Attention / Expired'),
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        className: 'doc-status-amber'
      };
    }

    // Check if clean valid doc is present
    const greenMatch = uploadedDocs.find(item => {
      const raw = (item || '').trim();
      if (/^(expired|non-network)/i.test(raw)) return false;
      const lowerItem = raw.toLowerCase();
      return lowerItem === lowerReq || lowerReq.includes(lowerItem) || lowerItem.includes(lowerReq);
    });

    if (greenMatch) {
      return {
        status: 'green',
        icon: 'check_circle',
        label: cleanReq,
        badgeText: t('statusReady', 'Ready'),
        color: '#16a34a',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        className: 'doc-status-green'
      };
    }

    // Otherwise missing
    return {
      status: 'red',
      icon: 'cancel',
      label: cleanReq,
      badgeText: t('statusMissing', 'Missing'),
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      className: 'doc-status-red'
    };
  };

  const results = requiredDocs.map(doc => ({
    doc,
    ...getDocStatus(doc)
  }));

  const readyCount = results.filter(r => r.status === 'green').length;
  const totalCount = requiredDocs.length;

  const countSummary = t(
    'docsReadyCount',
    language === 'ta'
      ? `${totalCount}-இல் ${readyCount} ஆவணங்கள் தயார்`
      : language === 'hi'
      ? `${totalCount} में से ${readyCount} दस्तावेज़ तैयार हैं`
      : `${readyCount} of ${totalCount} documents ready`
  );

  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px' 
      }}>
        <span style={{ fontWeight: '600', fontSize: '13px', color: '#374151' }}>
          {t('documentReadiness', 'Document Readiness')}:
        </span>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '700',
          color: readyCount === totalCount ? '#16a34a' : (readyCount > 0 ? '#d97706' : '#dc2626'),
          backgroundColor: '#f3f4f6',
          padding: '2px 8px',
          borderRadius: '12px'
        }}>
          {countSummary}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '8px'
      }}>
        {results.map((item, idx) => (
          <div
            key={idx}
            className={item.className}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: item.bg,
              border: `1px solid ${item.border}`,
              fontSize: '13px',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span className="material-icons" style={{ color: item.color, fontSize: '20px', flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ 
                fontWeight: '500', 
                color: '#1f2937', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap' 
              }}>
                {item.label}
              </span>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: item.color,
              flexShrink: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {item.badgeText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

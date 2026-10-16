import React, { useState } from 'react';
import DocumentChecker from './DocumentChecker';
import { useAppContext } from '../context/AppContext';
import { translations } from '../data/translations';

/**
 * SchemeCard - Displays eligibility result, rule breakdown, and document readiness for a scheme.
 */
export default function SchemeCard({ result, language = 'en' }) {
  const [showWhy, setShowWhy] = useState(false);
  const { userData } = useAppContext();

  if (!result || !result.scheme) return null;

  const {
    scheme,
    eligible = false,
    reasons = [],
    passedRules = [],
    failedRules = [],
    evaluationTime
  } = result;

  const t = (key, fallback) => translations?.[language]?.[key] || translations?.en?.[key] || fallback;

  // Determine user documents
  // Determine user documents — check all possible field names
  const uploadedDocs = userData?.uploaded_documents || userData?.documentsReady || userData?.uploadedDocs || result.uploadedDocs || [];

  return (
    <div
      className="scheme-card card"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: eligible ? '2px solid #22c55e' : '1px solid #e5e7eb',
        boxShadow: eligible
          ? '0 4px 16px rgba(34, 197, 94, 0.12)'
          : '0 2px 8px rgba(0, 0, 0, 0.05)',
        padding: '20px',
        marginBottom: '20px',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Top Header: Category & Last Updated */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {scheme.category && (
            <span
              className="scheme-badge"
              style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '12px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {scheme.category}
            </span>
          )}

          {scheme.lastUpdated && (
            <span
              title="Rule Refresher Tracker"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}
            >
              <span className="material-icons" style={{ fontSize: '13px' }}>
                update
              </span>
              <span>
                {t('rulesLastUpdated', 'Rules Last Updated')}: {scheme.lastUpdated}
              </span>
            </span>
          )}
        </div>

        {/* Evaluation Time */}
        {evaluationTime !== undefined && (
          <span
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '13px' }}>
              speed
            </span>
            {typeof evaluationTime === 'number'
              ? `${evaluationTime.toFixed(2)}ms`
              : `${evaluationTime}ms`}
          </span>
        )}
      </div>

      {/* Main Row: Scheme Title & Large Eligibility Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '12px'
        }}
      >
        <div>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '19px',
              fontWeight: '700',
              color: '#111827',
              lineHeight: '1.3'
            }}
          >
            {scheme.name}
          </h3>
          {scheme.shortName && scheme.shortName !== scheme.name && (
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              ({scheme.shortName})
            </span>
          )}
        </div>

        {/* Eligibility Badge */}
        <div
          style={{
            padding: '8px 16px',
            borderRadius: '30px',
            fontWeight: '800',
            fontSize: '14px',
            letterSpacing: '0.3px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            backgroundColor: eligible ? '#dcfce7' : '#fee2e2',
            color: eligible ? '#15803d' : '#b91c1c',
            border: `1px solid ${eligible ? '#86efac' : '#fca5a5'}`
          }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>
            {eligible ? 'verified' : 'highlight_off'}
          </span>
          <span>{eligible ? t('eligible', 'Eligible') : t('ineligible', 'Ineligible')}</span>
        </div>
      </div>

      {/* Description */}
      <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.5', margin: '0 0 16px 0' }}>
        {scheme.description}
      </p>

      {/* Embedded Document Checker */}
      <div
        style={{
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid #f3f4f6',
          marginBottom: '16px'
        }}
      >
        <DocumentChecker
          requiredDocs={scheme.requiredDocs || []}
          uploadedDocs={uploadedDocs}
          language={language}
        />
      </div>

      {/* Expandable Why Section Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setShowWhy(!showWhy)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 0'
          }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>
            {showWhy ? 'expand_less' : 'help_outline'}
          </span>
          <span>{showWhy ? t('hideWhy', 'Hide Eligibility Breakdown') : t('whyEligibility', 'Why? View Eligibility Breakdown')}</span>
        </button>

        {scheme.officialLink && (
          <a
            href={scheme.officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              textDecoration: 'none',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              color: '#374151',
              backgroundColor: '#f9fafb',
              fontWeight: '500'
            }}
          >
            <span>{t('officialPortal', 'Official Portal')}</span>
            <span className="material-icons" style={{ fontSize: '16px' }}>
              open_in_new
            </span>
          </a>
        )}
      </div>

      {/* Expanded Rule Explanations */}
      {showWhy && (
        <div
          style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '13px'
          }}
        >
          <div style={{ fontWeight: '700', marginBottom: '8px', color: '#1f2937' }}>
            {t('ruleBreakdown', 'Evaluation Breakdown')}:
          </div>

          {/* Passed Rules */}
          {passedRules && passedRules.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#16a34a', fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                {t('satisfiedRules', 'Conditions Satisfied')}:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                {passedRules.map((rule, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-icons" style={{ color: '#16a34a', fontSize: '16px' }}>
                        check_circle
                      </span>
                      <span>
                        {typeof rule === 'string'
                          ? rule
                          : rule.description || rule.reason || rule.id || JSON.stringify(rule)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Failed Rules */}
          {failedRules && failedRules.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#dc2626', fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                {t('unmetRules', 'Conditions Not Met')}:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                {failedRules.map((rule, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-icons" style={{ color: '#dc2626', fontSize: '16px' }}>
                        cancel
                      </span>
                      <span>
                        {typeof rule === 'string'
                          ? rule
                          : rule.description || rule.reason || rule.id || JSON.stringify(rule)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* General reasons if provided */}
          {reasons && reasons.length > 0 && passedRules.length === 0 && failedRules.length === 0 && (
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563' }}>
              {reasons.map((r, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

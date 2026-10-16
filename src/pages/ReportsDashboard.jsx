import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockData } from '../data/mockData';
import { runFullValidation } from '../engine/validator';
import { runFullRiskAssessment } from '../engine/riskEngine';
import { evaluateScheme } from '../engine/rulesEngine';
import { schemes } from '../data/schemes';

export default function ReportsDashboard() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'clean' | 'gaps' | 'ineligible'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [exportedNotice, setExportedNotice] = useState(false);

  // Districts for mock profiles
  const mockDistricts = [
    'Chennai', 'Coimbatore', 'Madurai', 'Salem',
    'Tiruchirappalli', 'Tirunelveli', 'Erode', 'Thanjavur'
  ];

  // Evaluate all 15 mock profiles on load / memoized
  const reportData = useMemo(() => {
    const startTimeTotal = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const items = mockData.map((profile, index) => {
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

      // 1. Identify target scheme
      const targetScheme = schemes.find(s =>
        s.shortName?.toLowerCase() === profile.ground_truth_target?.toLowerCase() ||
        s.name?.toLowerCase().includes(profile.ground_truth_target?.toLowerCase()) ||
        s.id?.toLowerCase() === profile.ground_truth_target?.toLowerCase()
      ) || schemes[0];

      // 2. Synthesize document metadata
      const hasDoc = (name) => (profile.uploaded_documents || []).some(
        d => typeof d === 'string' && d.toLowerCase().includes(name.toLowerCase())
      );
      const hasExpired = (name) => (profile.uploaded_documents || []).some(
        d => typeof d === 'string' && d.toLowerCase().startsWith('expired') && d.toLowerCase().includes(name.toLowerCase())
      );

      const docMetadata = profile.documentMetadata || {
        aadhaar: hasDoc('aadhar') ? {
          name: profile.name,
          linkedToBank: profile.category === 'Clean Passes' || profile.applicant_id === 'APP_07'
        } : null,
        incomeCertificate: hasDoc('income') ? {
          amount: profile.annual_income,
          issueDate: hasExpired('income')
            ? new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        } : null,
        rationCard: {
          type: profile.rationCardType || (profile.annual_income <= 100000 ? 'PHH' : 'NPHH'),
          name: (profile.category === 'Coordination Gaps' && (profile.applicant_id === 'APP_06' || profile.applicant_id === 'APP_10'))
            ? `${profile.name} K`
            : profile.name
        }
      };

      const district = profile.district || mockDistricts[index % mockDistricts.length];

      // 3. Run evaluation engines
      const schemeEval = evaluateScheme(profile, targetScheme);
      const validation = runFullValidation(profile, docMetadata);
      const risk = runFullRiskAssessment(profile, docMetadata);

      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const processingTimeMs = parseFloat((endTime - startTime).toFixed(2));

      return {
        profile,
        district,
        targetScheme,
        docMetadata,
        schemeEval,
        validation,
        risk,
        processingTimeMs
      };
    });

    const endTimeTotal = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const totalProcessingTimeMs = parseFloat((endTimeTotal - startTimeTotal).toFixed(2));
    const avgProcessingTimeMs = parseFloat((totalProcessingTimeMs / (items.length || 1)).toFixed(2));

    // Summary Statistics
    const totalApplicants = items.length;
    const cleanPassesCount = items.filter(i => i.profile.category === 'Clean Passes').length;
    const cleanPassesPct = Math.round((cleanPassesCount / totalApplicants) * 100);
    const gapsCount = items.filter(i => i.profile.category === 'Coordination Gaps').length;
    const ineligibleCount = items.filter(i => i.profile.category === 'Ineligible').length;

    // Failure / Drop-Off Breakdown
    let expiredCerts = 0;
    let nameDiscrepancies = 0;
    let incomeAboveCutoff = 0;
    let missingDocs = 0;
    let ageOutsideRange = 0;
    let aadhaarNotLinked = 0;

    items.forEach(item => {
      // Expired certs
      const hasExpiredDoc = (item.profile.uploaded_documents || []).some(
        d => typeof d === 'string' && d.toLowerCase().startsWith('expired')
      ) || (item.validation?.warnings || []).some(w => w.docName?.toLowerCase().includes('expired'));
      if (hasExpiredDoc) expiredCerts++;

      // Name discrepancies
      const hasNameGap = (item.risk?.coordinationGaps || []).some(g => g.field === 'name') ||
        (item.validation?.flags || []).some(f => f.field === 'name');
      if (hasNameGap) nameDiscrepancies++;

      // Income above cutoff
      const hasIncomeFail = (item.schemeEval?.failedRules || []).some(r => r.field === 'annual_income');
      if (hasIncomeFail) incomeAboveCutoff++;

      // Missing documents
      if (item.schemeEval?.missingDocs && item.schemeEval.missingDocs.length > 0) {
        missingDocs++;
      }

      // Age outside range
      const hasAgeFail = (item.schemeEval?.failedRules || []).some(r => r.field === 'age');
      if (hasAgeFail) ageOutsideRange++;

      // Aadhaar not linked
      const hasAadhaarLinkIssue = (item.validation?.flags || []).some(
        f => f.type === 'AADHAAR_NOT_LINKED' || f.field === 'aadhaar'
      ) || (!item.docMetadata.aadhaar?.linkedToBank && item.profile.uploaded_documents?.includes('Aadhar'));
      if (hasAadhaarLinkIssue) aadhaarNotLinked++;
    });

    const breakdown = [
      { label: 'Expired Certificates', count: expiredCerts, color: '#F59E0B' },
      { label: 'Name Discrepancies', count: nameDiscrepancies, color: '#EA580C' },
      { label: 'Income Above Cutoff', count: incomeAboveCutoff, color: '#DC2626' },
      { label: 'Missing Documents', count: missingDocs, color: '#8B5CF6' },
      { label: 'Age Outside Range', count: ageOutsideRange, color: '#CC0000' },
      { label: 'Aadhaar Not Linked', count: aadhaarNotLinked, color: '#3B82F6' }
    ];

    return {
      items,
      stats: {
        totalApplicants,
        cleanPassesCount,
        cleanPassesPct,
        gapsCount,
        ineligibleCount,
        avgProcessingTimeMs
      },
      breakdown
    };
  }, []);

  // Filter and search
  const filteredItems = useMemo(() => {
    return reportData.items.filter(item => {
      // Category filter
      if (selectedFilter === 'clean' && item.profile.category !== 'Clean Passes') return false;
      if (selectedFilter === 'gaps' && item.profile.category !== 'Coordination Gaps') return false;
      if (selectedFilter === 'ineligible' && item.profile.category !== 'Ineligible') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = item.profile.name.toLowerCase().includes(query);
        const matchesId = item.profile.applicant_id.toLowerCase().includes(query);
        const matchesDistrict = item.district.toLowerCase().includes(query);
        const matchesScheme = item.targetScheme.name.toLowerCase().includes(query);
        return matchesName || matchesId || matchesDistrict || matchesScheme;
      }

      return true;
    });
  }, [reportData, selectedFilter, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleExport = () => {
    const exportPayload = {
      generatedAt: new Date().toISOString(),
      reportTitle: 'RightAid Caseworker & NGO Operational Intelligence Report',
      standard: 'GIGW 3.0 Standard Compliance',
      summary: reportData.stats,
      failureBreakdown: reportData.breakdown,
      applicants: reportData.items.map(i => ({
        id: i.profile.applicant_id,
        name: i.profile.name,
        district: i.district,
        category: i.profile.category,
        targetScheme: i.targetScheme.shortName,
        groundTruthStatus: i.profile.ground_truth_status,
        verdict: i.schemeEval.overallVerdict,
        passedRules: i.schemeEval.passedRules.map(r => r.message),
        failedRules: i.schemeEval.failedRules.map(r => r.message),
        coordinationGaps: i.risk.coordinationGaps.map(g => ({
          type: g.type,
          severity: g.severity,
          message: g.message?.en || g.message,
          resolution: g.resolution?.en || g.resolution
        })),
        validationFlags: i.validation.flags.map(f => ({
          type: f.type,
          severity: f.severity,
          message: f.message?.en || f.message
        }))
      }))
    };

    console.log('RightAid Caseworker Report Export:', exportPayload);

    // Trigger file download
    try {
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rightaid_caseworker_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Browser download failed:', e);
    }

    setExportedNotice(true);
    setTimeout(() => setExportedNotice(false), 4000);
  };

  const maxBreakdownCount = Math.max(...reportData.breakdown.map(b => b.count), 1);

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Top Header */}
      <header
        style={{
          backgroundColor: '#003366',
          color: '#FFFFFF',
          padding: '16px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', textDecoration: 'none' }} title="Back to Home">
              <span className="material-icons">arrow_back</span>
            </Link>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>
                Reports Dashboard - Caseworker View
              </h1>
              <div style={{ fontSize: '12px', color: '#93C5FD' }}>
                Operational Ground Truth & Drop-Off Intelligence • 15 Verified Profiles
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExport}
              style={{
                backgroundColor: '#FF6600',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(255, 102, 0, 0.3)'
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>file_download</span>
              <span>Export Report</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>home</span>
              <span>Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="reports-dashboard">
        {exportedNotice && (
          <div
            className="alert-banner alert-banner-success"
            style={{ marginBottom: '20px' }}
            role="status"
          >
            <span className="material-icons alert-icon">check_circle</span>
            <div style={{ flex: 1 }}>
              <div className="alert-title">Report Exported Successfully</div>
              <div className="alert-message">
                JSON data was downloaded and logged to browser console.
              </div>
            </div>
          </div>
        )}

        {/* A. Summary Statistics Cards */}
        <section aria-label="Summary statistics" style={{ marginBottom: '28px' }}>
          <div className="reports-stats-grid">
            {/* Total Applicants */}
            <div className="reports-stat-card" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
              <div className="stat-value" style={{ color: '#1E40AF' }}>
                {reportData.stats.totalApplicants}
              </div>
              <div className="stat-label">Total Applicants</div>
            </div>

            {/* Clean Passes */}
            <div className="reports-stat-card" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <div className="stat-value" style={{ color: '#166534' }}>
                {reportData.stats.cleanPassesCount} <span style={{ fontSize: '18px', fontWeight: '600' }}>({reportData.stats.cleanPassesPct}%)</span>
              </div>
              <div className="stat-label">Clean Passes</div>
            </div>

            {/* Coordination Gaps */}
            <div className="reports-stat-card" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
              <div className="stat-value" style={{ color: '#B45309' }}>
                {reportData.stats.gapsCount}
              </div>
              <div className="stat-label">Coordination Gaps Flagged</div>
            </div>

            {/* Ineligible / Rejections */}
            <div className="reports-stat-card" style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
              <div className="stat-value" style={{ color: '#991B1B' }}>
                {reportData.stats.ineligibleCount}
              </div>
              <div className="stat-label">Ineligible / Rejections</div>
            </div>

            {/* Average Processing Time */}
            <div className="reports-stat-card" style={{ backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }}>
              <div className="stat-value" style={{ color: '#374151' }}>
                {reportData.stats.avgProcessingTimeMs} <span style={{ fontSize: '16px' }}>ms</span>
              </div>
              <div className="stat-label">Avg. Processing Time</div>
            </div>
          </div>
        </section>

        {/* B. Drop-Off / Failure Reasons Breakdown */}
        <section aria-label="Drop-off and failure reasons breakdown" style={{ marginBottom: '28px' }}>
          <div className="reports-breakdown">
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#003366', marginBottom: '16px' }}>
              Drop-Off & Failure Reasons Breakdown
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {reportData.breakdown.map((item, idx) => {
                const fillWidthPct = Math.max(Math.round((item.count / maxBreakdownCount) * 100), 12);
                return (
                  <div key={idx} className="breakdown-bar">
                    <span className="breakdown-label">{item.label}</span>
                    <div style={{ flex: 1, backgroundColor: '#E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
                      <div
                        className="breakdown-bar-fill"
                        style={{
                          width: `${fillWidthPct}%`,
                          backgroundColor: item.color
                        }}
                      >
                        {item.count} {item.count === 1 ? 'case' : 'cases'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* C. Applicant Table with Filter Bar */}
        <section aria-label="Applicant profiles table">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            {/* Filter Buttons */}
            <div className="reports-filter-bar" style={{ margin: 0 }}>
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`reports-filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              >
                <span>All</span>
                <span>({reportData.stats.totalApplicants})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('clean')}
                className={`reports-filter-btn ${selectedFilter === 'clean' ? 'active' : ''}`}
              >
                <span className="material-icons" style={{ fontSize: '16px', color: selectedFilter === 'clean' ? '#FFF' : '#16A34A' }}>check_circle</span>
                <span>Clean Passes</span>
                <span>({reportData.stats.cleanPassesCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('gaps')}
                className={`reports-filter-btn ${selectedFilter === 'gaps' ? 'active' : ''}`}
              >
                <span className="material-icons" style={{ fontSize: '16px', color: selectedFilter === 'gaps' ? '#FFF' : '#F59E0B' }}>warning</span>
                <span>Coordination Gaps</span>
                <span>({reportData.stats.gapsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('ineligible')}
                className={`reports-filter-btn ${selectedFilter === 'ineligible' ? 'active' : ''}`}
              >
                <span className="material-icons" style={{ fontSize: '16px', color: selectedFilter === 'ineligible' ? '#FFF' : '#DC2626' }}>cancel</span>
                <span>Ineligible</span>
                <span>({reportData.stats.ineligibleCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name, ID, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="reports-search"
            />
          </div>

          {/* Table */}
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>District</th>
                  <th>Category</th>
                  <th>Target Scheme</th>
                  <th>Status</th>
                  <th>Gaps</th>
                  <th>Flags</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#6B7280' }}>
                      No applicants found matching this criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const isExpanded = expandedId === item.profile.applicant_id;
                    const cat = item.profile.category;
                    const rowClass = cat === 'Clean Passes'
                      ? 'row-eligible'
                      : cat === 'Coordination Gaps'
                      ? 'row-pending'
                      : 'row-ineligible';

                    const gapsTotal = item.risk?.coordinationGaps?.length || 0;
                    const flagsTotal = item.validation?.flags?.length || 0;

                    return (
                      <React.Fragment key={item.profile.applicant_id}>
                        <tr className={`${rowClass} ${isExpanded ? 'row-expanded' : ''}`}>
                          <td style={{ fontWeight: '700', color: '#003366' }}>
                            {item.profile.applicant_id}
                          </td>
                          <td style={{ fontWeight: '600' }}>
                            {item.profile.name} ({item.profile.gender[0]}, {item.profile.age}y)
                          </td>
                          <td>{item.district}</td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '700',
                                backgroundColor: cat === 'Clean Passes' ? '#DCFCE7' : cat === 'Coordination Gaps' ? '#FEF3C7' : '#FEE2E2',
                                color: cat === 'Clean Passes' ? '#166534' : cat === 'Coordination Gaps' ? '#92400E' : '#991B1B'
                              }}
                            >
                              {cat}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600' }}>
                            {item.targetScheme.shortName || item.targetScheme.name}
                          </td>
                          <td>
                            <strong style={{
                              color: item.schemeEval.overallVerdict === 'Eligible'
                                ? '#16A34A'
                                : item.schemeEval.overallVerdict === 'Pending Action'
                                ? '#D97706'
                                : '#DC2626'
                            }}>
                              {item.schemeEval.overallVerdict}
                            </strong>
                          </td>
                          <td>
                            {gapsTotal > 0 ? (
                              <span style={{
                                backgroundColor: '#FEF3C7',
                                color: '#B45309',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '12px'
                              }}>
                                {gapsTotal}
                              </span>
                            ) : (
                              <span style={{ color: '#16A34A', fontSize: '13px' }}>0</span>
                            )}
                          </td>
                          <td>
                            {flagsTotal > 0 ? (
                              <span style={{
                                backgroundColor: '#FEE2E2',
                                color: '#DC2626',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '12px'
                              }}>
                                {flagsTotal}
                              </span>
                            ) : (
                              <span style={{ color: '#16A34A', fontSize: '13px' }}>0</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.profile.applicant_id)}
                              style={{
                                background: 'none',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                color: '#003366',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>{isExpanded ? 'Hide' : 'Details'}</span>
                              <span className="material-icons" style={{ fontSize: '16px' }}>
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: '#F8FAFC' }}>
                            <td colSpan="9" style={{ padding: '20px', borderBottom: '2px solid #CBD5E1' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                                {/* Rule Evaluation Details */}
                                <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#003366' }}>
                                    Rule Evaluation Results
                                  </h4>
                                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {item.schemeEval.passedRules.map((r, rIdx) => (
                                      <div key={rIdx} style={{ color: '#166534', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                        <span className="material-icons" style={{ fontSize: '16px', color: '#16A34A' }}>check</span>
                                        <span>{r.message}</span>
                                      </div>
                                    ))}
                                    {item.schemeEval.failedRules.map((r, rIdx) => (
                                      <div key={rIdx} style={{ color: '#991B1B', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                        <span className="material-icons" style={{ fontSize: '16px', color: '#DC2626' }}>close</span>
                                        <span>{r.message}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Document Readiness Details */}
                                <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#003366' }}>
                                    Document Readiness
                                  </h4>
                                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div>
                                      <strong>Uploaded: </strong>
                                      <span>{(item.profile.uploaded_documents || []).join(', ') || 'None'}</span>
                                    </div>
                                    {item.schemeEval.missingDocs && item.schemeEval.missingDocs.length > 0 && (
                                      <div style={{ color: '#991B1B' }}>
                                        <strong>Missing for {item.targetScheme.shortName}: </strong>
                                        <span>{item.schemeEval.missingDocs.join(', ')}</span>
                                      </div>
                                    )}
                                    {item.validation.warnings && item.validation.warnings.length > 0 && (
                                      <div style={{ color: '#92400E' }}>
                                        <strong>Warnings: </strong>
                                        {item.validation.warnings.map((w, wIdx) => (
                                          <div key={wIdx} style={{ marginTop: '2px' }}>
                                            • {w.message?.en || w.message || w.docName}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Coordination Gaps & Flags */}
                                <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#003366' }}>
                                    Gaps & Cross-Departmental Action
                                  </h4>
                                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {item.risk.coordinationGaps.length === 0 && item.validation.flags.length === 0 ? (
                                      <div style={{ color: '#166534' }}>
                                        No cross-departmental coordination gaps detected. Clean profile.
                                      </div>
                                    ) : (
                                      <>
                                        {item.risk.coordinationGaps.map((g, gIdx) => (
                                          <div key={gIdx} style={{ backgroundColor: '#FEF3C7', padding: '8px', borderRadius: '6px', color: '#92400E', marginBottom: '4px' }}>
                                            <div style={{ fontWeight: '700' }}>Gap: {g.gapId || g.type} ({g.severity})</div>
                                            <div>{g.message?.en || g.message}</div>
                                            {g.resolution && (
                                              <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
                                                Resolution: {g.resolution?.en || g.resolution}
                                              </div>
                                            )}
                                          </div>
                                        ))}

                                        {item.validation.flags.map((f, fIdx) => (
                                          <div key={fIdx} style={{ backgroundColor: '#FEE2E2', padding: '8px', borderRadius: '6px', color: '#991B1B', marginBottom: '4px' }}>
                                            <div style={{ fontWeight: '700' }}>Flag: {f.type} ({f.severity})</div>
                                            <div>{f.message?.en || f.message}</div>
                                          </div>
                                        ))}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

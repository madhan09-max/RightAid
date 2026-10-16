import { schemes } from '../data/schemes';

/**
 * PILLAR 3A: Coordination Gap Detection
 * Compares identity records across departments.
 */
export function detectCoordinationGaps(userData, documentMetadata = {}) {
  const gaps = [];
  
  // 1. Aadhaar vs Ration Card name discrepancy
  const nameOnAadhaar = documentMetadata?.aadhaar?.name || '';
  const nameOnRationCard = documentMetadata?.rationCard?.name || '';
  
  if (nameOnAadhaar && nameOnRationCard) {
    const a = nameOnAadhaar.trim().toLowerCase();
    const r = nameOnRationCard.trim().toLowerCase();
    if (a !== r) {
      const isPartial = a.includes(r) || r.includes(a);
      gaps.push({
        type: 'COORDINATION_GAP',
        gapId: 'NAME_AADHAAR_RATION',
        severity: isPartial ? 'MEDIUM' : 'HIGH',
        field: 'name',
        valueA: nameOnAadhaar,
        valueB: nameOnRationCard,
        departmentA: 'UIDAI (Aadhaar)',
        departmentB: 'Civil Supplies (PDS)',
        message: {
          en: `Name mismatch between Aadhaar ("${nameOnAadhaar}") and Ration Card ("${nameOnRationCard}"). Visit your Taluk Supply Office to correct the discrepancy.`,
          ta: `ஆதார் ("${nameOnAadhaar}") மற்றும் ரேஷன் கார்டு ("${nameOnRationCard}") இடையே பெயர் முரண்பாடு. தாலுகா வழங்கல் அலுவலகத்தை அணுகவும்.`,
          hi: `आधार ("${nameOnAadhaar}") और राशन कार्ड ("${nameOnRationCard}") में नाम मेल नहीं खाता।`
        },
        resolution: {
          en: 'Visit your Taluk Supply Office with both documents to update the name.',
          ta: 'இரண்டு ஆவணங்களையும் எடுத்துக்கொண்டு தாலுகா வழங்கல் அலுவலகத்திற்கு செல்லவும்.',
          hi: 'दोनों दस्तावेजों के साथ तालुक आपूर्ति कार्यालय जाएं।'
        }
      });
    }
  }

  // 2. Self-reported name vs Aadhaar name
  if (nameOnAadhaar && userData.name) {
    const s = (userData.name || '').trim().toLowerCase();
    const a = nameOnAadhaar.trim().toLowerCase();
    if (s && a && s !== a && !(a.includes(s) || s.includes(a))) {
      gaps.push({
        type: 'COORDINATION_GAP',
        gapId: 'NAME_SELF_AADHAAR',
        severity: 'HIGH',
        field: 'name',
        valueA: userData.name,
        valueB: nameOnAadhaar,
        departmentA: 'Self-Reported',
        departmentB: 'UIDAI (Aadhaar)',
        message: {
          en: `Your reported name "${userData.name}" does not match your Aadhaar name "${nameOnAadhaar}". This will cause rejection at e-Sevai.`,
          ta: `நீங்கள் தெரிவித்த பெயர் "${userData.name}" உங்கள் ஆதாரில் உள்ள "${nameOnAadhaar}" பெயருடன் பொருந்தவில்லை.`,
          hi: `आपका बताया गया नाम "${userData.name}" आधार नाम "${nameOnAadhaar}" से मेल नहीं खाता।`
        },
        resolution: {
          en: 'Visit the nearest UIDAI Aadhaar Enrollment Center to update your name.',
          ta: 'அருகிலுள்ள UIDAI ஆதார் மையத்தில் பெயரைப் புதுப்பிக்கவும்.',
          hi: 'निकटतम UIDAI आधार केंद्र पर जाकर नाम अपडेट करें।'
        }
      });
    }
  }

  // 3. Income mismatch between certificate and ration card tier
  const certIncome = documentMetadata?.incomeCertificate?.amount;
  const rationType = userData.rationCardType || documentMetadata?.rationCard?.type;
  if (certIncome && rationType) {
    // AAY is for < 15000, PHH < 72000 typically. If income cert shows higher, flag.
    if (rationType === 'AAY' && certIncome > 50000) {
      gaps.push({
        type: 'COORDINATION_GAP',
        gapId: 'INCOME_RATION_MISMATCH',
        severity: 'MEDIUM',
        field: 'income_ration',
        valueA: `₹${certIncome.toLocaleString('en-IN')} (Income Certificate)`,
        valueB: `${rationType} Ration Card`,
        departmentA: 'Revenue (Tahsildar)',
        departmentB: 'Civil Supplies (PDS)',
        message: {
          en: `Your Income Certificate shows ₹${certIncome.toLocaleString('en-IN')} but you hold an AAY ration card (for extreme poverty). This may trigger an audit.`,
          ta: `உங்கள் வருமானச் சான்றிதழ் ₹${certIncome.toLocaleString('en-IN')} காட்டுகிறது, ஆனால் AAY ரேஷன் கார்டு வைத்துள்ளீர்கள்.`,
          hi: `आपका आय प्रमाणपत्र ₹${certIncome.toLocaleString('en-IN')} दिखाता है लेकिन AAY कार्ड है।`
        },
        resolution: {
          en: 'Verify your ration card category at the Taluk Supply Office.',
          ta: 'தாலுகா வழங்கல் அலுவலகத்தில் ரேஷன் கார்டு வகையை சரிபார்க்கவும்.',
          hi: 'तालुक आपूर्ति कार्यालय में राशन कार्ड श्रेणी सत्यापित करें।'
        }
      });
    }
  }

  return { gaps };
}

/**
 * PILLAR 3B: Rejection & Deadline Risk Calculator
 */
export function calculateDeadlineRisks(targetSchemes = null) {
  const schemesToCheck = targetSchemes || schemes;
  const deadlines = [];
  const now = new Date();
  
  schemesToCheck.forEach(scheme => {
    if (scheme.intakeDeadline) {
      const deadline = new Date(scheme.intakeDeadline);
      const diffMs = deadline - now;
      const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      
      if (daysRemaining <= 0) {
        deadlines.push({
          schemeId: scheme.id,
          schemeName: scheme.shortName,
          daysRemaining: 0,
          deadline: scheme.intakeDeadline,
          severity: 'CRITICAL',
          message: {
            en: `${scheme.shortName} intake period has closed.`,
            ta: `${scheme.shortName} விண்ணப்ப காலம் முடிந்துவிட்டது.`,
            hi: `${scheme.shortName} आवेदन अवधि समाप्त हो गई है।`
          }
        });
      } else if (daysRemaining <= 7) {
        deadlines.push({
          schemeId: scheme.id,
          schemeName: scheme.shortName,
          daysRemaining,
          deadline: scheme.intakeDeadline,
          severity: 'HIGH',
          message: {
            en: `${scheme.shortName} closes in ${daysRemaining} days! Apply urgently.`,
            ta: `${scheme.shortName} ${daysRemaining} நாட்களில் முடிவடைகிறது! அவசரமாக விண்ணப்பிக்கவும்.`,
            hi: `${scheme.shortName} ${daysRemaining} दिनों में बंद हो रहा है!`
          }
        });
      } else if (daysRemaining <= 30) {
        deadlines.push({
          schemeId: scheme.id,
          schemeName: scheme.shortName,
          daysRemaining,
          deadline: scheme.intakeDeadline,
          severity: 'MEDIUM',
          message: {
            en: `${scheme.shortName} closing in ${daysRemaining} days.`,
            ta: `${scheme.shortName} ${daysRemaining} நாட்களில் முடிவடைகிறது.`,
            hi: `${scheme.shortName} ${daysRemaining} दिनों में बंद हो रहा है।`
          }
        });
      }
    }
  });
  
  return { deadlines };
}

/**
 * PILLAR 3C: Boundary Case Detection
 * Flags users near eligibility cutoff boundaries.
 */
export function detectBoundaryCases(userData, targetSchemes = null) {
  const schemesToCheck = targetSchemes || schemes;
  const boundaries = [];
  
  schemesToCheck.forEach(scheme => {
    (scheme.rules || []).forEach(rule => {
      const userVal = userData[rule.field];
      if (typeof userVal !== 'number' || typeof rule.value !== 'number') return;
      
      const diff = Math.abs(userVal - rule.value);
      const threshold = rule.value * 0.05; // 5% of cutoff
      
      if (rule.operator === '<=' && userVal <= rule.value && diff <= threshold && diff > 0) {
        // User is just barely eligible (within 5% of the max cutoff)
        boundaries.push({
          schemeId: scheme.id,
          schemeName: scheme.shortName,
          field: rule.field,
          currentValue: userVal,
          cutoff: rule.value,
          operator: rule.operator,
          margin: diff,
          marginPercent: Math.round((diff / rule.value) * 100),
          severity: diff <= (rule.value * 0.02) ? 'HIGH' : 'MEDIUM',
          message: {
            en: `Boundary alert for ${scheme.shortName}: Your ${rule.field.replace(/_/g, ' ')} (${userVal}) is very close to the maximum cutoff of ${rule.value}. Margin: ${diff}.`,
            ta: `${scheme.shortName} எல்லை எச்சரிக்கை: உங்கள் ${rule.field.replace(/_/g, ' ')} (${userVal}) அதிகபட்ச வரம்பு ${rule.value} க்கு மிக அருகில் உள்ளது.`,
            hi: `${scheme.shortName} सीमा चेतावनी: आपका ${rule.field.replace(/_/g, ' ')} (${userVal}) अधिकतम सीमा ${rule.value} के बहुत करीब है।`
          }
        });
      }
      
      if (rule.operator === '>=' && userVal >= rule.value && diff <= threshold && diff > 0) {
        boundaries.push({
          schemeId: scheme.id,
          schemeName: scheme.shortName,
          field: rule.field,
          currentValue: userVal,
          cutoff: rule.value,
          operator: rule.operator,
          margin: diff,
          marginPercent: Math.round((diff / rule.value) * 100),
          severity: diff <= (rule.value * 0.02) ? 'HIGH' : 'MEDIUM',
          message: {
            en: `Boundary alert for ${scheme.shortName}: Your ${rule.field.replace(/_/g, ' ')} (${userVal}) is just above the minimum requirement of ${rule.value}. Margin: ${diff}.`,
            ta: `${scheme.shortName} எல்லை எச்சரிக்கை: உங்கள் ${rule.field.replace(/_/g, ' ')} (${userVal}) குறைந்தபட்ச தேவை ${rule.value} க்கு சற்றே மேல் உள்ளது.`,
            hi: `${scheme.shortName} सीमा चेतावनी: आपका ${rule.field.replace(/_/g, ' ')} (${userVal}) न्यूनतम आवश्यकता ${rule.value} से थोड़ा ऊपर है।`
          }
        });
      }
    });
  });
  
  return { boundaries };
}

/**
 * PILLAR 3D: Life Event Impact Analysis
 * Determines which schemes are affected by recent life events.
 */
export function analyzeLifeEventImpact(lifeEventId, allSchemes = null) {
  const schemesToCheck = allSchemes || schemes;
  // Import life events data inline to avoid circular deps
  const eventMap = {
    job_loss: { affectsSchemes: ['uyegp', 'unorganized_workers_education'], priority: 'HIGH' },
    birth_of_child: { affectsSchemes: ['unorganized_workers_education'], priority: 'MEDIUM' },
    breadwinner_demise: { affectsSchemes: ['uyegp', 'cm_farmer_security', 'free_sewing_machine'], priority: 'CRITICAL' },
    none: { affectsSchemes: [], priority: 'NONE' }
  };
  
  const event = eventMap[lifeEventId] || eventMap.none;
  const triggeredSchemes = schemesToCheck.filter(s => event.affectsSchemes.includes(s.id));
  
  return {
    lifeEventId,
    priority: event.priority,
    triggeredSchemes: triggeredSchemes.map(s => ({ id: s.id, name: s.shortName })),
    message: triggeredSchemes.length > 0
      ? { en: `Based on your life event, ${triggeredSchemes.length} scheme(s) may be especially relevant.`, ta: `உங்கள் வாழ்க்கை நிகழ்வின் அடிப்படையில், ${triggeredSchemes.length} திட்டங்கள் குறிப்பாக பொருத்தமானவை.`, hi: `आपकी जीवन घटना के आधार पर, ${triggeredSchemes.length} योजनाएं विशेष रूप से प्रासंगिक हो सकती हैं।` }
      : null
  };
}

/**
 * Master risk assessment combining all Pillar 3 checks
 */
export function runFullRiskAssessment(userData, documentMetadata = {}) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  
  const coordGaps = detectCoordinationGaps(userData, documentMetadata);
  const deadlineRisks = calculateDeadlineRisks();
  const boundaryCases = detectBoundaryCases(userData);
  const lifeEventImpact = userData.lifeEvent && userData.lifeEvent !== 'none'
    ? analyzeLifeEventImpact(userData.lifeEvent)
    : null;
  
  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  
  return {
    coordinationGaps: coordGaps.gaps,
    deadlineRisks: deadlineRisks.deadlines,
    boundaryCases: boundaryCases.boundaries,
    lifeEventImpact,
    summary: {
      totalGaps: coordGaps.gaps.length,
      totalDeadlineRisks: deadlineRisks.deadlines.length,
      totalBoundaryCases: boundaryCases.boundaries.length,
      highestSeverity: [...coordGaps.gaps, ...deadlineRisks.deadlines, ...boundaryCases.boundaries]
        .reduce((max, item) => {
          const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (order[item.severity] || 0) > (order[max] || 0) ? item.severity : max;
        }, 'LOW'),
      riskAssessmentTimeMs: parseFloat((endTime - startTime).toFixed(2))
    }
  };
}

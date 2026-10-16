import { schemes } from '../data/schemes';

/**
 * PILLAR 2A: Input vs. Record Consistency
 * Compares user self-reported values against document metadata.
 * Returns DATA_MISMATCH flags with severity levels.
 */
export function validateInputConsistency(userData, documentMetadata = {}) {
  const flags = [];
  
  // 1. Income mismatch: compare self-reported income vs income certificate amount
  if (documentMetadata.incomeCertificate && documentMetadata.incomeCertificate.amount) {
    const selfReported = userData.annual_income || userData.annualIncome || 0;
    const certAmount = documentMetadata.incomeCertificate.amount;
    const diff = Math.abs(selfReported - certAmount);
    const diffPercent = certAmount > 0 ? (diff / certAmount) * 100 : 0;
    
    if (diffPercent > 20) {
      flags.push({
        type: 'DATA_MISMATCH',
        severity: diffPercent > 50 ? 'HIGH' : 'MEDIUM',
        field: 'annual_income',
        selfReported: selfReported,
        documentValue: certAmount,
        difference: diff,
        differencePercent: Math.round(diffPercent),
        message: {
          en: `Income mismatch: You reported ₹${selfReported.toLocaleString('en-IN')} but your Income Certificate shows ₹${certAmount.toLocaleString('en-IN')}. Difference: ${Math.round(diffPercent)}%.`,
          ta: `வருமான முரண்பாடு: நீங்கள் ₹${selfReported.toLocaleString('en-IN')} தெரிவித்தீர்கள், ஆனால் உங்கள் வருமானச் சான்றிதழ் ₹${certAmount.toLocaleString('en-IN')} காட்டுகிறது.`,
          hi: `आय विसंगति: आपने ₹${selfReported.toLocaleString('en-IN')} बताया लेकिन आपका आय प्रमाणपत्र ₹${certAmount.toLocaleString('en-IN')} दर्शाता है।`
        },
        departments: ['Revenue Department', 'Issuing Tahsildar']
      });
    }
  }

  // 2. Name mismatch across documents (detected by coordination gap engine too, but basic check here)
  if (documentMetadata.aadhaar && documentMetadata.aadhaar.name && userData.name) {
    const userName = (userData.name || '').trim().toLowerCase();
    const aadhaarName = (documentMetadata.aadhaar.name || '').trim().toLowerCase();
    if (userName && aadhaarName && userName !== aadhaarName) {
      // Check if it's a partial match (e.g., "Surya" vs "Surya Kumar")
      const isPartial = aadhaarName.includes(userName) || userName.includes(aadhaarName);
      flags.push({
        type: 'DATA_MISMATCH',
        severity: isPartial ? 'LOW' : 'HIGH',
        field: 'name',
        selfReported: userData.name,
        documentValue: documentMetadata.aadhaar.name,
        message: {
          en: `Name discrepancy: You entered "${userData.name}" but Aadhaar shows "${documentMetadata.aadhaar.name}".${isPartial ? ' (Partial match detected)' : ' Please verify at UIDAI center.'}`,
          ta: `பெயர் முரண்பாடு: நீங்கள் "${userData.name}" என்று உள்ளிட்டீர்கள், ஆனால் ஆதார் "${documentMetadata.aadhaar.name}" காட்டுகிறது.`,
          hi: `नाम विसंगति: आपने "${userData.name}" दर्ज किया लेकिन आधार "${documentMetadata.aadhaar.name}" दिखाता है।`
        },
        departments: ['UIDAI']
      });
    }
  }

  // 3. Aadhaar-Bank linkage check
  if (documentMetadata.aadhaar && documentMetadata.aadhaar.linkedToBank === false) {
    flags.push({
      type: 'PREREQUISITE_MISSING',
      severity: 'MEDIUM',
      field: 'aadhaar_bank_link',
      message: {
        en: 'Your Aadhaar is not linked to your Bank Account. This is required for Direct Benefit Transfer (DBT). Visit your bank branch to link.',
        ta: 'உங்கள் ஆதார் வங்கிக் கணக்குடன் இணைக்கப்படவில்லை. நேரடி பயன் பரிமாற்றத்திற்கு (DBT) இது அவசியம்.',
        hi: 'आपका आधार बैंक खाते से लिंक नहीं है। DBT के लिए यह आवश्यक है।'
      },
      departments: ['Bank', 'UIDAI']
    });
  }

  return { flags };
}

/**
 * PILLAR 2B: Document Expiry Audit
 * Checks issue dates and flags expired or soon-to-expire documents.
 */
export function auditDocumentExpiry(uploadedDocuments = [], documentMetadata = {}) {
  const warnings = [];
  const now = new Date();
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // Check Income Certificate expiry (valid for 1 year from issue)
  if (documentMetadata.incomeCertificate && documentMetadata.incomeCertificate.issueDate) {
    const issueDate = new Date(documentMetadata.incomeCertificate.issueDate);
    const ageMs = now - issueDate;
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    
    if (ageMs > ONE_YEAR_MS) {
      warnings.push({
        docName: 'Income Certificate',
        status: 'EXPIRED',
        severity: 'HIGH',
        daysSinceIssue: ageDays,
        issueDate: documentMetadata.incomeCertificate.issueDate,
        message: {
          en: `Your Income Certificate was issued ${ageDays} days ago and has expired. Please renew it at your Taluk Office.`,
          ta: `உங்கள் வருமானச் சான்றிதழ் ${ageDays} நாட்களுக்கு முன் வழங்கப்பட்டது, காலாவதியாகிவிட்டது. தாலுகா அலுவலகத்தில் புதுப்பிக்கவும்.`,
          hi: `आपका आय प्रमाणपत्र ${ageDays} दिन पहले जारी किया गया था और समाप्त हो गया है।`
        }
      });
    } else if (ONE_YEAR_MS - ageMs < THIRTY_DAYS_MS) {
      const daysLeft = Math.floor((ONE_YEAR_MS - ageMs) / (24 * 60 * 60 * 1000));
      warnings.push({
        docName: 'Income Certificate',
        status: 'EXPIRING_SOON',
        severity: 'MEDIUM',
        daysSinceIssue: ageDays,
        daysUntilExpiry: daysLeft,
        issueDate: documentMetadata.incomeCertificate.issueDate,
        message: {
          en: `Your Income Certificate expires in ${daysLeft} days. Renew it soon to avoid application delays.`,
          ta: `உங்கள் வருமானச் சான்றிதழ் ${daysLeft} நாட்களில் காலாவதியாகும். விரைவில் புதுப்பிக்கவும்.`,
          hi: `आपका आय प्रमाणपत्र ${daysLeft} दिनों में समाप्त हो रहा है।`
        }
      });
    }
  }

  // Check Welfare Board Card expiry (valid for 1 year)
  if (documentMetadata.welfareBoardCard && documentMetadata.welfareBoardCard.issueDate) {
    const issueDate = new Date(documentMetadata.welfareBoardCard.issueDate);
    const ageMs = now - issueDate;
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    
    if (ageMs > ONE_YEAR_MS) {
      warnings.push({
        docName: 'Welfare Board Card',
        status: 'EXPIRED',
        severity: 'HIGH',
        daysSinceIssue: ageDays,
        message: {
          en: `Your Welfare Board Card has expired (issued ${ageDays} days ago). Renew at the Labour Welfare Board office.`,
          ta: `உங்கள் நலவாரிய அட்டை காலாவதியாகிவிட்டது. தொழிலாளர் நலவாரிய அலுவலகத்தில் புதுப்பிக்கவும்.`,
          hi: `आपका कल्याण बोर्ड कार्ड समाप्त हो गया है।`
        }
      });
    }
  }

  // Check for documents marked as 'Expired' in the uploaded list
  uploadedDocuments.forEach(doc => {
    if (typeof doc === 'string' && doc.toLowerCase().startsWith('expired')) {
      const docType = doc.replace(/^expired\s*/i, '').trim();
      // Avoid duplicating if already flagged above
      const alreadyFlagged = warnings.some(w => w.docName.toLowerCase() === docType.toLowerCase());
      if (!alreadyFlagged) {
        warnings.push({
          docName: docType || doc,
          status: 'EXPIRED',
          severity: 'HIGH',
          daysSinceIssue: null,
          message: {
            en: `Your ${docType || doc} is marked as expired. Please obtain a renewed copy from the issuing authority.`,
            ta: `உங்கள் ${docType || doc} காலாவதியாக குறிக்கப்பட்டுள்ளது. வழங்கிய அலுவலகத்தில் புதுப்பிக்கவும்.`,
            hi: `आपका ${docType || doc} समाप्त के रूप में चिह्नित है।`
          }
        });
      }
    }
  });

  return { warnings };
}

/**
 * PILLAR 2C: Missing Prerequisite Audit
 * Scans mandatory attachments per scheme.
 */
export function auditMissingPrerequisites(userData, targetSchemes = null) {
  const schemesToCheck = targetSchemes || schemes;
  const uploadedDocs = userData.uploaded_documents || userData.uploadedDocs || userData.documentsReady || [];
  
  const missingByScheme = schemesToCheck.map(scheme => {
    const missing = [];
    const present = [];
    
    (scheme.requiredDocs || []).forEach(reqDoc => {
      const hasDoc = uploadedDocs.some(d => 
        typeof d === 'string' && d.toLowerCase() === reqDoc.toLowerCase()
      );
      const hasExpiredDoc = uploadedDocs.some(d =>
        typeof d === 'string' && d.toLowerCase().startsWith('expired') && d.toLowerCase().includes(reqDoc.toLowerCase())
      );
      
      if (hasDoc) {
        present.push(reqDoc);
      } else if (hasExpiredDoc) {
        missing.push({ doc: reqDoc, reason: 'EXPIRED', message: `${reqDoc} is expired and needs renewal` });
      } else {
        missing.push({ doc: reqDoc, reason: 'MISSING', message: `${reqDoc} is required but not provided` });
      }
    });
    
    return {
      schemeId: scheme.id,
      schemeName: scheme.shortName || scheme.name,
      totalRequired: (scheme.requiredDocs || []).length,
      presentCount: present.length,
      missingCount: missing.length,
      presentDocs: present,
      missingDocs: missing,
      isComplete: missing.length === 0
    };
  });
  
  return { missingByScheme };
}

/**
 * Master validation function combining all Pillar 2 checks
 */
export function runFullValidation(userData, documentMetadata = {}) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  
  const consistency = validateInputConsistency(userData, documentMetadata);
  const expiry = auditDocumentExpiry(userData.uploaded_documents || userData.documentsReady || [], documentMetadata);
  const prerequisites = auditMissingPrerequisites(userData);
  
  const totalFlags = consistency.flags.length;
  const totalWarnings = expiry.warnings.length;
  const totalMissing = prerequisites.missingByScheme.reduce((sum, s) => sum + s.missingCount, 0);
  
  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  
  return {
    flags: consistency.flags,
    warnings: expiry.warnings,
    missingByScheme: prerequisites.missingByScheme,
    summary: {
      totalFlags,
      totalWarnings,
      totalMissing,
      hasHighSeverity: consistency.flags.some(f => f.severity === 'HIGH') || expiry.warnings.some(w => w.severity === 'HIGH'),
      validationTimeMs: parseFloat((endTime - startTime).toFixed(2))
    }
  };
}

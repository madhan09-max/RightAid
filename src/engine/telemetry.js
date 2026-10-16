import { schemes } from '../data/schemes'
import { evaluateScheme } from './rulesEngine'

export const smsLogs = []

export function getSmsLogs() {
  return [...smsLogs]
}

/**
 * Logs telemetry events with standardized ISO timestamp formatting
 * @param {string|Object} event 
 */
export function logTelemetryEvent(event) {
  const timestamp = new Date().toISOString()
  const payload = typeof event === 'object' ? JSON.stringify(event) : event
  console.log(`[${timestamp}] [RightAid Telemetry] ${payload}`)
}

/**
 * Simulates mobile SMS gateway dispatch
 * Supports both:
 *   simulateSMS(phoneNumber, message)
 *   simulateSMS(userData, eligibleList)
 * 
 * @param {string|Object} target 
 * @param {string|Array} messageOrList 
 * @returns {Object}
 */
export function simulateSMS(target, messageOrList) {
  const timestamp = new Date().toISOString()
  const timeFormatted = new Date().toLocaleTimeString()
  const refId = `SMS_${Math.random().toString(36).substring(2, 9).toUpperCase()}`

  let phone = 'Citizen'
  let text = ''

  if (typeof target === 'string') {
    phone = target
    text = typeof messageOrList === 'string' ? messageOrList : JSON.stringify(messageOrList)
  } else if (typeof target === 'object' && target !== null) {
    phone = target.phone || target.phoneNumber || target.name || 'Citizen'
    if (Array.isArray(messageOrList)) {
      const schemeCount = messageOrList.length
      text = `RightAid Alert: ${schemeCount} welfare schemes identified for your profile. Ref: ${refId}. Visit https://www.tn.gov.in to verify.`
    } else {
      text = String(messageOrList || 'RightAid scheme eligibility verification complete.')
    }
  }

  const logEntry = `[${timeFormatted}] DLT GATEWAY (${refId}): Dispatched to ${phone} -> "${text}"`
  smsLogs.unshift(logEntry)
  if (smsLogs.length > 50) smsLogs.pop()

  console.log(`[${timestamp}] [SMS GATEWAY DISPATCH] To: ${phone} | Ref: ${refId} | "${text}"`)

  return {
    refId,
    timestamp,
    recipient: phone,
    message: text,
    status: 'DELIVERED_TO_GATEWAY'
  }
}

/**
 * Runs validation benchmark across applicant test profiles
 * @param {Array<Object>} profiles 
 * @returns {Object} { results, summary }
 */
export function runTelemetry(profiles = []) {
  logTelemetryEvent(`Starting telemetry run over ${profiles.length} test profiles`)
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

  let passedMatches = 0
  let failedMatches = 0
  let totalLatency = 0

  const results = profiles.map((profile) => {
    // Locate target scheme specified in profile
    const targetScheme = schemes.find(
      (s) =>
        s.shortName.toLowerCase() === profile.ground_truth_target.toLowerCase() ||
        s.name.toLowerCase().includes(profile.ground_truth_target.toLowerCase()) ||
        s.id.toLowerCase() === profile.ground_truth_target.toLowerCase()
    )

    if (!targetScheme) {
      logTelemetryEvent(`Warning: Target scheme not found for ${profile.ground_truth_target}`)
      return {
        applicantId: profile.applicant_id,
        applicant_id: profile.applicant_id,
        name: profile.name,
        category: profile.category,
        targetScheme: profile.ground_truth_target,
        target_scheme: profile.ground_truth_target,
        expected_status: profile.ground_truth_status,
        groundTruth: false,
        engineResult: false,
        engine_verdict: 'SCHEME_NOT_FOUND',
        latency_ms: 0,
        responseTime: 0,
        match: false,
        is_match: false,
        reasons: ['Target scheme could not be resolved in scheme database'],
        details: { reasons: ['Scheme not found'] }
      }
    }

    const evalResult = evaluateScheme(profile, targetScheme)
    totalLatency += evalResult.executionTimeMs

    // Ground truth mapping:
    // "Eligible" -> engineVerdict must be 'Eligible' (eligible && hasAllDocs)
    // "Pending Action" -> engineVerdict must be 'Pending Action' (eligible && !hasAllDocs)
    // "Ineligible" -> engineVerdict must be 'Ineligible' (!eligible)
    const expected = (profile.ground_truth_status || '').toLowerCase()
    const actual = (evalResult.overallVerdict || '').toLowerCase()

    let isMatch = false
    if (expected.startsWith('eligible') && actual === 'eligible') {
      isMatch = true
    } else if (expected.startsWith('pending action') && actual === 'pending action') {
      isMatch = true
    } else if (expected.startsWith('ineligible') && actual === 'ineligible') {
      isMatch = true
    }

    if (isMatch) {
      passedMatches++
    } else {
      failedMatches++
    }

    // Ground truth boolean for dashboard tables
    const groundTruthBool = !expected.startsWith('ineligible')
    const engineResultBool = evalResult.eligible

    const formattedDetails = {
      ...evalResult,
      passedRules: (evalResult.passedRules || []).map((r) => ({
        id: r.field || 'rule',
        description: r.message,
        field: r.field
      })),
      failedRules: (evalResult.failedRules || []).map((r) => ({
        id: r.field || 'rule',
        description: r.message,
        field: r.field
      })),
      reasons: evalResult.reasons || []
    }

    return {
      applicantId: profile.applicant_id,
      applicant_id: profile.applicant_id,
      name: profile.name,
      category: profile.category,
      targetScheme: targetScheme.shortName,
      target_scheme: targetScheme.shortName,
      expected_status: profile.ground_truth_status,
      groundTruth: groundTruthBool,
      engineResult: engineResultBool,
      engine_verdict: evalResult.overallVerdict,
      latency_ms: evalResult.executionTimeMs,
      responseTime: evalResult.executionTimeMs,
      match: isMatch,
      is_match: isMatch,
      reasons: evalResult.reasons,
      missing_docs: evalResult.missingDocs,
      expired_docs: evalResult.expiredDocs,
      non_standard_docs: evalResult.nonStandardDocs,
      doc_status: evalResult.status,
      details: formattedDetails
    }
  })

  const total = profiles.length
  const accuracy = total > 0 ? parseFloat(((passedMatches / total) * 100).toFixed(2)) : 0
  const avgResponseTime = total > 0 ? parseFloat((totalLatency / total).toFixed(2)) : 0

  const summary = {
    total,
    passed: passedMatches,
    failed: failedMatches,
    accuracy,
    avgResponseTime,
    durationMs: parseFloat(
      ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime).toFixed(2)
    )
  }

  logTelemetryEvent(
    `Telemetry complete: ${passedMatches}/${total} passed (${accuracy}% accuracy, avg ${avgResponseTime}ms latency)`
  )

  return { results, summary }
}

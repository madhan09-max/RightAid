import { schemes } from '../data/schemes'

/**
 * Evaluates an individual rule condition against applicant profile
 * @param {Object} userData 
 * @param {Object} rule 
 * @returns {Object} { passed: boolean, message: string }
 */
export function evaluateRule(userData, rule) {
  const { field, operator, value, label, nullable = true } = rule
  const userVal = userData[field]

  // Check nullable constraints
  if (userVal === undefined || userVal === null) {
    if (!nullable || operator === '==' || operator === '>=') {
      return {
        passed: false,
        field,
        message: `${label} - Not provided or invalid`
      }
    }
  }

  let passed = false
  switch (operator) {
    case '==':
      passed = userVal === value
      break
    case '!=':
      passed = userVal !== value
      break
    case '>=':
      passed = typeof userVal === 'number' && userVal >= value
      break
    case '<=':
      passed = typeof userVal === 'number' && userVal <= value
      break
    case '>':
      passed = typeof userVal === 'number' && userVal > value
      break
    case '<':
      passed = typeof userVal === 'number' && userVal < value
      break
    default:
      passed = false
  }

  const message = passed
    ? `Satisfied: ${label}`
    : `Failed: ${label} (Your detail: ${userVal !== null && userVal !== undefined ? userVal : 'Not specified'})`

  return { passed, field, message }
}

/**
 * Checks document readiness and produces traffic-light status:
 * - 'green': All required documents valid and present
 * - 'amber': Expired documents, non-standard/non-network documents, or partial documents
 * - 'red': All required documents missing
 * 
 * @param {Object} userData 
 * @param {Object} scheme 
 * @returns {Object}
 */
export function checkDocuments(userData, scheme) {
  const requiredDocs = scheme.requiredDocs || []
  const uploaded = userData.uploaded_documents || []

  const validDocs = []
  const expiredDocs = []
  const nonStandardDocs = []
  const missingDocs = []
  const warnings = []

  // Check uploaded documents for expired or non-standard items
  uploaded.forEach((doc) => {
    if (typeof doc === 'string') {
      if (doc.toLowerCase().startsWith('expired')) {
        expiredDocs.push(doc)
      } else if (
        doc.toLowerCase().includes('non-network') ||
        doc.toLowerCase().includes('provisional') ||
        doc.toLowerCase().includes('draft')
      ) {
        nonStandardDocs.push(doc)
        warnings.push(`Document '${doc}' requires empanelment verification or institutional transfer`)
      }
    }
  })

  // Compare against requiredDocs
  requiredDocs.forEach((reqDoc) => {
    const hasExact = uploaded.some(
      (u) => typeof u === 'string' && u.toLowerCase() === reqDoc.toLowerCase()
    )

    const hasExpiredMatch = uploaded.some(
      (u) =>
        typeof u === 'string' &&
        u.toLowerCase().startsWith('expired') &&
        u.toLowerCase().includes(reqDoc.toLowerCase())
    )

    const hasNonStandardMatch = uploaded.some(
      (u) =>
        typeof u === 'string' &&
        u.toLowerCase().includes('non-network') &&
        reqDoc.toLowerCase().includes('hospital')
    )

    if (hasExact) {
      validDocs.push(reqDoc)
    } else if (hasExpiredMatch) {
      warnings.push(`${reqDoc} has expired and must be renewed at the issuing authority`)
    } else if (hasNonStandardMatch) {
      warnings.push(`${reqDoc} was submitted as non-network and needs empanelment endorsement`)
    } else {
      missingDocs.push(reqDoc)
    }
  })

  const hasAllDocs =
    validDocs.length === requiredDocs.length &&
    expiredDocs.length === 0 &&
    nonStandardDocs.length === 0

  let status = 'green'
  if (!hasAllDocs) {
    if (
      expiredDocs.length > 0 ||
      nonStandardDocs.length > 0 ||
      (validDocs.length > 0 && missingDocs.length > 0)
    ) {
      status = 'amber'
    } else {
      status = 'red'
    }
  }

  return {
    requiredDocs,
    validDocs,
    missingDocs,
    expiredDocs,
    nonStandardDocs,
    warnings,
    hasAllDocs,
    status
  }
}

/**
 * Evaluates a single scheme against user data
 * @param {Object} userData 
 * @param {Object} scheme 
 * @returns {Object}
 */
export function evaluateScheme(userData, scheme) {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

  const passedRules = []
  const failedRules = []
  const reasons = []

  const rules = scheme.rules || []
  rules.forEach((rule) => {
    const result = evaluateRule(userData, rule)
    if (result.passed) {
      passedRules.push(result)
      reasons.push(result.message)
    } else {
      failedRules.push(result)
      reasons.push(result.message)
    }
  })

  const eligible = failedRules.length === 0
  const docCheck = checkDocuments(userData, scheme)

  let overallVerdict = 'Ineligible'
  if (eligible) {
    if (docCheck.hasAllDocs) {
      overallVerdict = 'Eligible'
    } else {
      overallVerdict = 'Pending Action'
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const executionTimeMs = parseFloat((endTime - startTime).toFixed(2))

  return {
    scheme,
    eligible,
    overallVerdict,
    reasons,
    passedRules,
    failedRules,
    ...docCheck,
    executionTimeMs
  }
}

/**
 * Evaluates all known schemes for the given applicant data
 * @param {Object} userData 
 * @returns {Array<Object>}
 */
export function evaluateAllSchemes(userData) {
  return schemes.map((scheme) => evaluateScheme(userData, scheme))
}

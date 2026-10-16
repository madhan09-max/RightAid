export const schemes = [
  {
    id: 'uyegp',
    name: 'UYEGP (Unemployed Youth Employment Generation Programme)',
    shortName: 'UYEGP',
    description: 'Business subsidy scheme for unemployed youth to start their own enterprise.',
    category: 'Business & Employment',
    officialLink: 'https://www.tn.gov.in/scheme/data_view/68',
    lastUpdated: '2026-09-15',
    intakeDeadline: '2026-11-15',
    requiredDocs: ['Aadhar', 'Bank Passbook', 'Transfer Certificate', 'Income Certificate'],
    rules: [
      { field: 'age', operator: '>=', value: 18, label: 'Age must be 18 or above' },
      { field: 'education_level', operator: '>=', value: 8, label: 'Education must be 8th standard or above' },
      { field: 'annual_income', operator: '<=', value: 500000, label: 'Annual income must be ₹5,00,000 or below' }
    ]
  },
  {
    id: 'nammai_kaakkum_48',
    name: 'Nammai Kaakkum 48 (Accident Relief)',
    shortName: 'Nammai Kaakkum 48',
    description: 'Emergency accident relief scheme providing immediate medical assistance within 48 hours.',
    category: 'Health & Emergency',
    officialLink: 'https://www.tn.gov.in/scheme/data_view/99',
    lastUpdated: '2026-08-20',
    intakeDeadline: null,
    requiredDocs: ['Aadhar', 'Hospital Report'],
    rules: [
      { field: 'accident_hours_ago', operator: '<=', value: 48, label: 'Accident must have occurred within last 48 hours', nullable: false }
    ]
  },
  {
    id: 'free_sewing_machine',
    name: 'Free Sewing Machine Scheme',
    shortName: 'Free Sewing Machine',
    description: 'Provides free sewing machines to economically weaker women who know tailoring.',
    category: 'Women Empowerment',
    officialLink: 'https://www.tn.gov.in/scheme/data_view/45',
    lastUpdated: '2026-10-01',
    intakeDeadline: '2026-10-30',
    requiredDocs: ['Aadhar', 'Income Certificate'],
    rules: [
      { field: 'gender', operator: '==', value: 'Female', label: 'Applicant must be Female' },
      { field: 'age', operator: '>=', value: 20, label: 'Age must be 20 or above' },
      { field: 'age', operator: '<=', value: 40, label: 'Age must be 40 or below' },
      { field: 'annual_income', operator: '<=', value: 72000, label: 'Annual income must be ₹72,000 or below' },
      { field: 'knows_tailoring', operator: '==', value: true, label: 'Must know tailoring' }
    ]
  },
  {
    id: 'unorganized_workers_education',
    name: 'Unorganized Workers Education Assistance',
    shortName: 'Unorganized Workers Education',
    description: 'Education assistance for children of workers in the unorganized sector.',
    category: 'Education & Welfare',
    officialLink: 'https://www.tn.gov.in/scheme/data_view/120',
    lastUpdated: '2026-07-10',
    intakeDeadline: '2026-12-31',
    requiredDocs: ['Welfare Board Card', 'Student ID'],
    rules: [
      { field: 'is_unorganized_worker', operator: '==', value: true, label: 'Must be an unorganized sector worker' },
      { field: 'has_school_kids', operator: '==', value: true, label: 'Must have school-going children' }
    ]
  },
  {
    id: 'cm_farmer_security',
    name: "Chief Minister's Farmer Security (Uzhavar Pathukappu)",
    shortName: 'CM Farmer Security',
    description: 'Security scheme for landless agricultural workers under the Chief Minister\'s initiative.',
    category: 'Agriculture',
    officialLink: 'https://www.tn.gov.in/scheme/data_view/156',
    lastUpdated: '2026-09-28',
    intakeDeadline: '2026-11-30',
    requiredDocs: ['Aadhar', 'Bank Passbook'],
    rules: [
      { field: 'works_in_agriculture', operator: '==', value: true, label: 'Must work in agriculture' },
      { field: 'owns_agricultural_land', operator: '==', value: false, label: 'Must NOT own agricultural land' }
    ]
  }
];

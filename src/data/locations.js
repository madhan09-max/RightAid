export const districts = [
  {
    name: 'Chennai',
    taluks: [
      { name: 'Egmore-Nungambakkam', welfareOffice: 'Chennai Central Taluk Office, Egmore', eSevaiCenters: [{ name: 'e-Sevai Egmore', address: '145 EVR Periyar Salai, Egmore, Chennai 600008' }, { name: 'e-Sevai T.Nagar', address: '12 Usman Road, T.Nagar, Chennai 600017' }] },
      { name: 'Mylapore-Triplicane', welfareOffice: 'Mylapore Taluk Welfare Office', eSevaiCenters: [{ name: 'e-Sevai Mylapore', address: '23 Kutchery Road, Mylapore, Chennai 600004' }] }
    ]
  },
  {
    name: 'Coimbatore',
    taluks: [
      { name: 'Coimbatore North', welfareOffice: 'North Coimbatore Taluk Office, RS Puram', eSevaiCenters: [{ name: 'e-Sevai RS Puram', address: '10 DB Road, RS Puram, Coimbatore 641002' }] },
      { name: 'Coimbatore South', welfareOffice: 'South Coimbatore Taluk Office, Gandhipuram', eSevaiCenters: [{ name: 'e-Sevai Gandhipuram', address: '55 Cross Cut Road, Gandhipuram, Coimbatore 641012' }] },
      { name: 'Sulur', welfareOffice: 'Sulur Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Sulur', address: 'Main Road, Sulur, Coimbatore 641401' }] }
    ]
  },
  {
    name: 'Madurai',
    taluks: [
      { name: 'Madurai North', welfareOffice: 'North Madurai Taluk Welfare Office', eSevaiCenters: [{ name: 'e-Sevai Anna Nagar', address: '7 Bypass Road, Anna Nagar, Madurai 625020' }] },
      { name: 'Madurai South', welfareOffice: 'South Madurai Taluk Office, Periyar Bus Stand', eSevaiCenters: [{ name: 'e-Sevai Periyar', address: 'Periyar Bus Stand Complex, Madurai 625002' }] },
      { name: 'Melur', welfareOffice: 'Melur Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Melur', address: 'Taluk Office Road, Melur 625106' }] }
    ]
  },
  {
    name: 'Salem',
    taluks: [
      { name: 'Salem', welfareOffice: 'Salem Taluk Welfare Office, Collectorate', eSevaiCenters: [{ name: 'e-Sevai Salem', address: 'Collectorate Campus, Salem 636007' }] },
      { name: 'Attur', welfareOffice: 'Attur Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Attur', address: 'Main Road, Attur 636102' }] },
      { name: 'Mettur', welfareOffice: 'Mettur Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Mettur', address: 'Dam Road, Mettur 636401' }] }
    ]
  },
  {
    name: 'Tiruchirappalli',
    taluks: [
      { name: 'Trichy', welfareOffice: 'Trichy Central Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Trichy', address: 'Cantonment Area, Trichy 620001' }] },
      { name: 'Srirangam', welfareOffice: 'Srirangam Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Srirangam', address: 'Temple Road, Srirangam 620006' }] }
    ]
  },
  {
    name: 'Tirunelveli',
    taluks: [
      { name: 'Tirunelveli', welfareOffice: 'Tirunelveli Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Tirunelveli', address: 'Collectorate Road, Tirunelveli 627001' }] },
      { name: 'Palayamkottai', welfareOffice: 'Palayamkottai Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Palayamkottai', address: 'High Road, Palayamkottai 627002' }] }
    ]
  },
  {
    name: 'Erode',
    taluks: [
      { name: 'Erode', welfareOffice: 'Erode Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Erode', address: 'Brough Road, Erode 638001' }] },
      { name: 'Gobichettipalayam', welfareOffice: 'Gobichettipalayam Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Gobi', address: 'Main Road, Gobichettipalayam 638452' }] }
    ]
  },
  {
    name: 'Thanjavur',
    taluks: [
      { name: 'Thanjavur', welfareOffice: 'Thanjavur Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Thanjavur', address: 'Railway Station Road, Thanjavur 613001' }] },
      { name: 'Kumbakonam', welfareOffice: 'Kumbakonam Taluk Office', eSevaiCenters: [{ name: 'e-Sevai Kumbakonam', address: 'Big Street, Kumbakonam 612001' }] }
    ]
  }
];

export function getDistrictNames() {
  return districts.map(d => d.name);
}

export function getTaluksByDistrict(districtName) {
  const dist = districts.find(d => d.name === districtName);
  return dist ? dist.taluks : [];
}

export function getTalukDetails(districtName, talukName) {
  const taluks = getTaluksByDistrict(districtName);
  return taluks.find(t => t.name === talukName) || null;
}

export const lifeEvents = [
  { id: 'job_loss', label: { en: 'Job Loss / Income Halt', ta: 'வேலை இழப்பு / வருமான நிறுத்தம்', hi: 'नौकरी छूटना / आय रुकना' }, affectsSchemes: ['uyegp', 'unorganized_workers_education'] },
  { id: 'birth_of_child', label: { en: 'Birth of a Child', ta: 'குழந்தை பிறப்பு', hi: 'बच्चे का जन्म' }, affectsSchemes: ['unorganized_workers_education'] },
  { id: 'breadwinner_demise', label: { en: 'Demise of Primary Breadwinner', ta: 'குடும்ப முதன்மை வருமானதாரர் மரணம்', hi: 'मुख्य कमाने वाले की मृत्यु' }, affectsSchemes: ['uyegp', 'cm_farmer_security', 'free_sewing_machine'] },
  { id: 'none', label: { en: 'None', ta: 'எதுவுமில்லை', hi: 'कोई नहीं' }, affectsSchemes: [] }
];

export const communityCategories = [
  { value: 'SC', label: { en: 'SC (Scheduled Caste)', ta: 'SC (ஆதி திராவிடர்)', hi: 'SC (अनुसूचित जाति)' } },
  { value: 'ST', label: { en: 'ST (Scheduled Tribe)', ta: 'ST (பழங்குடியினர்)', hi: 'ST (अनुसूचित जनजाति)' } },
  { value: 'MBC', label: { en: 'MBC (Most Backward Class)', ta: 'MBC (மிகவும் பிற்படுத்தப்பட்ட வகுப்பு)', hi: 'MBC (अत्यंत पिछड़ा वर्ग)' } },
  { value: 'BC', label: { en: 'BC (Backward Class)', ta: 'BC (பிற்படுத்தப்பட்ட வகுப்பு)', hi: 'BC (पिछड़ा वर्ग)' } },
  { value: 'General', label: { en: 'General / OC', ta: 'பொது / OC', hi: 'सामान्य / OC' } }
];

export const rationCardTypes = [
  { value: 'PHH', label: { en: 'PHH (Priority Household)', ta: 'PHH (முன்னுரிமை குடும்பம்)', hi: 'PHH (प्राथमिकता परिवार)' } },
  { value: 'NPHH', label: { en: 'NPHH (Non-Priority Household)', ta: 'NPHH (முன்னுரிமையற்ற குடும்பம்)', hi: 'NPHH (गैर-प्राथमिकता परिवार)' } },
  { value: 'AAY', label: { en: 'AAY (Antyodaya Anna Yojana)', ta: 'AAY (அந்தியோதயா அன்ன யோஜனா)', hi: 'AAY (अंत्योदय अन्न योजना)' } },
  { value: 'none', label: { en: 'No Ration Card', ta: 'ரேஷன் கார்டு இல்லை', hi: 'कोई राशन कार्ड नहीं' } }
];

/**
 * Authoritative corporate profile details for the 6 primary Indian civil infrastructure
 * contractors featured in GramSetu demonstration and audit ledgers.
 * Ensures consistent corporate credentials across registry, tender, and analytics views.
 */
export const CONTRACTOR_CORPORATE_PROFILES = {
  'larsen & toubro': {
    name: 'Larsen & Toubro Construction',
    registrationId: 'REG-LNT-INFRA-2024-MH',
    contactPerson: 'S. V. Desai (Head of Heavy Civil)',
    contactEmail: 'civil.infrastructure@larsentoubro.com',
    phone: '+91-22-6752-5656',
    address: 'L&T House, Ballard Estate, Mumbai, Maharashtra 400001',
    expertise: 'Expressways, PMGSY Highways & Heavy Civil Bridges',
    trustScore: 94,
    performanceScore: 94,
    baselineScore: 94,
    remarks: 'Grade-A National Infrastructure Contractor with ISO 9001:2015 certification. Executing PMGSY rural connectivity packages.',
    fallbackProjects: [
      { _id: 'sample-p1-lnt', title: 'PMGSY Rural Road Upgrade', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 92 },
      { _id: 'sample-p2-lnt', title: 'Eastern Peripheral Link Expressway', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 96 }
    ],
    fallbackFeedback: [
      { id: 'fb-lnt-1', title: 'Pavement Quality Audit', summary: 'Bituminous surfacing laid uniformly across Rohaniya link corridor. Density and core samples meet MoRTH specifications.' },
      { id: 'fb-lnt-2', title: 'Citizen Commute Feedback', summary: 'Travel time between Rohaniya block and Varanasi highway reduced by 35 minutes. Shoulders and signage clearly marked.' }
    ]
  },
  'afcons': {
    name: 'Afcons Infrastructure Limited',
    registrationId: 'REG-AFCONS-CIVIL-2023-MH',
    contactPerson: 'K. Subrahmanian (Executive Vice Chairman)',
    contactEmail: 'tenders@afcons.com',
    phone: '+91-22-6719-1000',
    address: 'Afcons House, 16 Veera Desai Road, Andheri West, Mumbai 400053',
    expertise: 'Institutional Educational Campuses & Civil Structures',
    trustScore: 88,
    performanceScore: 88,
    baselineScore: 88,
    remarks: 'Flagship civil construction arm of Shapoorji Pallonji Group. Specializes in structural rehabilitation and public institutions.',
    fallbackProjects: [
      { _id: 'sample-p1-afc', title: 'Government School Renovation', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 82 },
      { _id: 'sample-p2-afc', title: 'Model Vidyalaya Secondary Campus', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 94 }
    ],
    fallbackFeedback: [
      { id: 'fb-afc-1', title: 'Classroom Infrastructure Check', summary: 'Roof water-proofing and sanitary blocks completed cleanly. Natural lighting in laboratory wings noticeably improved.' },
      { id: 'fb-afc-2', title: 'Parent-Teacher Council Note', summary: 'Drinking water stations and perimeter boundary wall completed ahead of scheduled academic term opening.' }
    ]
  },
  'ncc limited': {
    name: 'NCC Limited (Nagarjuna Construction)',
    registrationId: 'REG-NCC-WATER-2024-TG',
    contactPerson: 'A. A. V. Ranga Raju (Managing Director)',
    contactEmail: 'water.projects@nccltd.in',
    phone: '+91-40-2326-8888',
    address: 'NCC House, Madhapur, Hyderabad, Telangana 500081',
    expertise: 'Jal Jeevan Mission Piped Water Networks & WTPs',
    trustScore: 92,
    performanceScore: 92,
    baselineScore: 92,
    remarks: 'National leader in bulk water transmission, rural piped drinking networks, and automated water treatment plants.',
    fallbackProjects: [
      { _id: 'sample-p1-ncc', title: 'Village Water Pipeline Network', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 94 },
      { _id: 'sample-p2-ncc', title: 'Phaphamau Piped Water Grid Ph-2', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 90 }
    ],
    fallbackFeedback: [
      { id: 'fb-ncc-1', title: 'Hydraulic Pressure Verification', summary: 'Pipeline passed 6-bar hydrostatic test with zero pressure drop. 450 village households received piped drinking supply.' },
      { id: 'fb-ncc-2', title: 'Panchayat Gram Sabha Note', summary: 'Road cut-outs for trenching were resurfaced promptly with compacted gravel.' }
    ]
  },
  'h.g. infra': {
    name: 'H.G. Infra Engineering Limited',
    registrationId: 'REG-HGINFRA-PWD-2022-RJ',
    contactPerson: 'Harendra Singh (Chairman & MD)',
    contactEmail: 'contracts@hginfra.com',
    phone: '+91-141-410-6000',
    address: '14 Panchwati Colony, Ratanada, Jaipur, Rajasthan 342011',
    expertise: 'Primary Health Centres & Rural Medical Infrastructure',
    trustScore: 74,
    performanceScore: 74,
    baselineScore: 74,
    remarks: 'Under monitoring review for masonry quality control at Pipraich PHC site. Foundation rectification under progress.',
    fallbackProjects: [
      { _id: 'sample-p1-hg', title: 'Primary Health Centre Construction', status: 'Flagged', lifecycleStatus: 'Under Authority Review', completionScore: 68 },
      { _id: 'sample-p2-hg', title: 'Sub-District Emergency Ward Block', status: 'Pending', lifecycleStatus: 'Construction Started', completionScore: 80 }
    ],
    fallbackFeedback: [
      { id: 'fb-hg-1', title: 'Citizen Structural Defect Report', summary: 'Hairline plaster cracks observed near clinic western wing lintel. Authority engineer issued rectification notice.' },
      { id: 'fb-hg-2', title: 'Inspector Follow-up', summary: 'Contractor mobilized scaffolding for crack injection grouting and surface re-plastering.' }
    ]
  },
  'pnc infratech': {
    name: 'PNC Infratech Limited',
    registrationId: 'REG-PNC-STRUCT-2023-UP',
    contactPerson: 'Pradeep Kumar Jain (Chairman & MD)',
    contactEmail: 'infra@pncinfratech.com',
    phone: '+91-562-405-4400',
    address: 'PNC Tower, 3/22-D Civil Lines, Bypass Road, Agra, UP 282002',
    expertise: 'Canal Bridges, Hydraulic Culverts & Heavy Concrete Structures',
    trustScore: 90,
    performanceScore: 90,
    baselineScore: 90,
    remarks: 'Reputed for timely execution of high-load hydraulic bridge rehabilitation along major irrigation canals.',
    fallbackProjects: [
      { _id: 'sample-p1-pnc', title: 'Bridge Rehabilitation Project', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 90 },
      { _id: 'sample-p2-pnc', title: 'Ganga Canal Feeder Aqueduct', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 91 }
    ],
    fallbackFeedback: [
      { id: 'fb-pnc-1', title: 'Bridge Bearing Inspection', summary: 'Elastomeric bearing pads and expansion joints installed to PWD specification. Deflection under load test within limits.' },
      { id: 'fb-pnc-2', title: 'Transport Union Remark', summary: 'Heavy commercial vehicles now crossing canal bridge without previous speed or weight bottlenecks.' }
    ]
  },
  'dilip buildcon': {
    name: 'Dilip Buildcon Limited',
    registrationId: 'REG-DBL-URBAN-2024-MP',
    contactPerson: 'Dilip Suryavanshi (Managing Director)',
    contactEmail: 'corporate@dilipbuildcon.co.in',
    phone: '+91-755-402-9999',
    address: 'Plot No. 5, Inside Govind Narayan Gate, Chuna Bhatti, Bhopal, MP 462016',
    expertise: 'Precast Box Culverts & Smart Drainage Infrastructure',
    trustScore: 85,
    performanceScore: 85,
    baselineScore: 85,
    remarks: 'Pioneers in mechanized urban drainage excavation, precast concrete stormwater drains, and permeable pavements.',
    fallbackProjects: [
      { _id: 'sample-p1-dbl', title: 'Smart Drainage Pavement Upgrade', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 86 },
      { _id: 'sample-p2-dbl', title: 'Civil Lines Stormwater Interceptor', status: 'Verified', lifecycleStatus: 'Approved', completionScore: 84 }
    ],
    fallbackFeedback: [
      { id: 'fb-dbl-1', title: 'Monsoon Runoff Observation', summary: 'Precast box culvert handled heavy monsoon runoff without water accumulation in Civil Lines market area.' },
      { id: 'fb-dbl-2', title: 'Pedestrian Walkway Review', summary: 'Interlocking concrete paver blocks laid evenly with wheelchair accessible curb cuts.' }
    ]
  }
};

/**
 * Resolves a contractor record against authoritative profiles by name or registration ID.
 */
export const resolveContractorProfile = (contractor) => {
  if (!contractor) return null;
  const key = Object.keys(CONTRACTOR_CORPORATE_PROFILES).find((k) => {
    const targetName = (contractor.name || '').toLowerCase();
    const targetReg = (contractor.registrationId || '').toLowerCase();
    return targetName.includes(k) || (k.includes('ncc') && targetReg.includes('ncc')) || (k.includes('larsen') && targetReg.includes('lnt'));
  });

  const profile = key ? CONTRACTOR_CORPORATE_PROFILES[key] : null;
  if (!profile) return contractor;

  return {
    ...contractor,
    contactPerson: contractor.contactPerson || profile.contactPerson,
    contactEmail: contractor.contactEmail || profile.contactEmail,
    phone: contractor.phone || profile.phone,
    address: contractor.address || profile.address,
    expertise: contractor.expertise || profile.expertise,
    remarks: contractor.remarks || profile.remarks,
    _fallbackProjects: profile.fallbackProjects,
    _fallbackFeedback: profile.fallbackFeedback
  };
};

import { Candidate, ElectionConfig, Party, PartyCategory } from './types';

export const ELECTION_TYPES = [
  "Lok Sabha General Election",
  "Rajya Sabha Election",
  "State Legislative Assembly (Vidhan Sabha)",
  "State Legislative Council (Vidhan Parishad)",
  "Municipal Corporation Election",
  "Gram Panchayat Election",
  "Zilla Parishad Election",
  "Bye-Election"
];

export const MOCK_PARTIES: Party[] = [
  // National Parties
  { id: 'p1', name: 'Bharatiya Janata Party', shortCode: 'BJP', category: PartyCategory.NATIONAL, symbolUrl: '🪷' },
  { id: 'p2', name: 'Indian National Congress', shortCode: 'INC', category: PartyCategory.NATIONAL, symbolUrl: '✋' },
  { id: 'p3', name: 'Aam Aadmi Party', shortCode: 'AAP', category: PartyCategory.NATIONAL, symbolUrl: '🧹' },
  { id: 'p4', name: 'Bahujan Samaj Party', shortCode: 'BSP', category: PartyCategory.NATIONAL, symbolUrl: '🐘' },
  { id: 'p5', name: 'Communist Party of India (Marxist)', shortCode: 'CPI(M)', category: PartyCategory.NATIONAL, symbolUrl: '🔨' },
  
  // State Parties
  { id: 'p6', name: 'Telugu Desam Party', shortCode: 'TDP', category: PartyCategory.STATE, symbolUrl: '🚲' },
  { id: 'p7', name: 'YSR Congress Party', shortCode: 'YSRCP', category: PartyCategory.STATE, symbolUrl: '🏢' }, // Approx symbol
  { id: 'p8', name: 'All India Trinamool Congress', shortCode: 'TMC', category: PartyCategory.STATE, symbolUrl: '🌱' },
  { id: 'p9', name: 'Dravida Munnetra Kazhagam', shortCode: 'DMK', category: PartyCategory.STATE, symbolUrl: '☀️' },
  
  // Independent / Other
  { id: 'ind', name: 'Independent', shortCode: 'IND', category: PartyCategory.INDEPENDENT, symbolUrl: '👤' },
  { id: 'demo', name: 'Student Union', shortCode: 'SU', category: PartyCategory.INSTITUTIONAL, symbolUrl: '🎓' },
];

export const MOCK_CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Narendra Modi', partyId: 'p1', partyName: 'Bharatiya Janata Party', symbol: '🪷' },
  { id: 'c2', name: 'Rahul Gandhi', partyId: 'p2', partyName: 'Indian National Congress', symbol: '✋' },
  { id: 'c3', name: 'Arvind Kejriwal', partyId: 'p3', partyName: 'Aam Aadmi Party', symbol: '🧹' },
  { id: 'c4', name: 'Mamata Banerjee', partyId: 'p8', partyName: 'All India Trinamool Congress', symbol: '🌱' },
];

export const INITIAL_ELECTION_CONFIG: ElectionConfig = {
  status: 'SETUP',
  type: 'Lok Sabha General Election',
  name: 'General Election 2024 - Phase 1',
  startTime: null,
  endTime: null,
  parties: MOCK_PARTIES,
  candidates: MOCK_CANDIDATES,
  publicKey: 'mock-public-key-12345',
  booths: [
    { 
      id: 'K-101', name: 'Booth A', location: 'Main Hall A', constituency: 'New Delhi Central',
      status: 'ONLINE', deviceType: 'Kiosk', accessibilityReady: true, networkType: 'Wi-Fi',
      batteryLevel: 98, lastHeartbeat: Date.now(), totalVotes: 124, authKey: 'auth-101'
    },
    { 
      id: 'K-102', name: 'Booth B', location: 'Main Hall B', constituency: 'New Delhi Central',
      status: 'ONLINE', deviceType: 'Kiosk', accessibilityReady: true, networkType: 'LAN',
      batteryLevel: 85, lastHeartbeat: Date.now(), totalVotes: 98, authKey: 'auth-102'
    },
    { 
      id: 'K-201', name: 'Booth C', location: 'Annex Room', constituency: 'New Delhi South',
      status: 'ONLINE', deviceType: 'Tablet', accessibilityReady: true, networkType: '4G/5G',
      batteryLevel: 45, lastHeartbeat: Date.now(), totalVotes: 12, authKey: 'auth-201'
    },
  ],
  logs: [
    { id: 'l1', timestamp: Date.now() - 100000, level: 'INFO', category: 'SYSTEM', message: 'System initialized' },
    { id: 'l2', timestamp: Date.now() - 50000, level: 'INFO', category: 'ACCESS', message: 'Admin logged in' },
  ]
};

export const TRANSLATIONS = {
  en: {
    welcome: "Welcome to the Voting System",
    start: "Touch anywhere to start",
    selectLang: "Select your language",
    auth: "Authentication",
    scanQr: "Scan QR Code",
    accessSetup: "Accessibility Setup",
    practice: "Practice Mode",
    voting: "Cast Your Vote",
    confirm: "Confirm Selection",
    receipt: "Voting Complete",
  },
  hi: {
    welcome: "मतदान प्रणाली में आपका स्वागत है",
    start: "शुरू करने के लिए कहीं भी स्पर्श करें",
    selectLang: "अपनी भाषा चुनें",
    auth: "प्रमाणीकरण",
    scanQr: "क्यूआर कोड स्कैन करें",
    accessSetup: "सुगम्यता सेटअप",
    practice: "अभ्यास मोड",
    voting: "अपना वोट डालें",
    confirm: "चयन की पुष्टि करें",
    receipt: "मतदान पूर्ण",
  },
  te: {
    welcome: "ఓటింగ్ విధానానికి స్వాగతం",
    start: "ప్రారంభించడానికి ఎక్కడైనా తాకండి",
    selectLang: "మీ భాషను ఎంచుకోండి",
    auth: "ధృవీకరణ",
    scanQr: "QR కోడ్‌ని స్కాన్ చేయండి",
    accessSetup: "యాక్సెసిబిలిటీ సెటప్",
    practice: "ప్రాక్టీస్ మోడ్",
    voting: "మీ ఓటు వేయండి",
    confirm: "ఎంపికను నిర్ధారించండి",
    receipt: "ఓటింగ్ పూర్తయింది",
  }
};
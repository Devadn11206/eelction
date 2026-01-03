export enum AppMode {
  LANDING = 'LANDING',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  VOTER_FLOW = 'VOTER_FLOW',
}

export enum VoterStep {
  LANGUAGE = 'LANGUAGE',
  AUTH = 'AUTH',
  ACCESS_SETUP = 'ACCESS_SETUP',
  PRACTICE_INTRO = 'PRACTICE_INTRO',
  PRACTICE_VOTE = 'PRACTICE_VOTE',
  VOTE_INTRO = 'VOTE_INTRO',
  VOTE_SELECTION = 'VOTE_SELECTION',
  CONFIRMATION = 'CONFIRMATION',
  SUBMITTING = 'SUBMITTING',
  RECEIPT = 'RECEIPT',
}

export enum PartyCategory {
  NATIONAL = 'National Party',
  STATE = 'State Party',
  INDEPENDENT = 'Independent',
  INSTITUTIONAL = 'Institutional / Demo',
}

export interface Party {
  id: string;
  name: string;
  category: PartyCategory;
  symbolUrl: string; // Emoji for demo, URL for real
  shortCode: string;
}

export interface Candidate {
  id: string;
  name: string;
  partyId: string; // Link to Party
  partyName?: string; // Denormalized for easier display
  partySymbol?: string; // Denormalized
  symbol: string; // Candidate specific symbol (mainly for independents)
}

export interface VoteRecord {
  voteId: string; // UUID
  encryptedData: string;
  timestamp: number;
  integrityHash: string;
}

export interface PollingBooth {
  id: string;
  name: string;
  location: string;
  constituency: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'LOCKED' | 'TAMPERED';
  deviceType: 'Kiosk' | 'Tablet' | 'Terminal';
  accessibilityReady: boolean;
  networkType: 'LAN' | 'Wi-Fi' | '4G/5G';
  batteryLevel: number;
  lastHeartbeat: number;
  totalVotes: number;
  authKey: string;
}

export interface SecurityLog {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  category: 'ACCESS' | 'VOTE' | 'SYSTEM' | 'SECURITY';
  message: string;
  boothId?: string;
}

export interface ElectionConfig {
  status: 'SETUP' | 'ACTIVE' | 'CLOSED' | 'PUBLISHED';
  type: string;
  name: string;
  startTime: number | null;
  endTime: number | null;
  parties: Party[];
  candidates: Candidate[];
  publicKey: string | null;
  booths: PollingBooth[];
  logs: SecurityLog[];
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  ttsEnabled: boolean;
  simplifiedView: boolean;
  language: 'en' | 'hi' | 'te';
}

export const DEFAULT_ACCESS_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  ttsEnabled: false,
  simplifiedView: false,
  language: 'en',
};

export interface TallyResult {
  candidateId: string;
  count: number;
}

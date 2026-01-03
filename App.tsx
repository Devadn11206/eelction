import React, { useState, useEffect } from 'react';
import { AppMode, VoteRecord, ElectionConfig, PollingBooth } from './types';
import { INITIAL_ELECTION_CONFIG } from './constants';
import { VoterInterface } from './components/VoterInterface';
import { AdminDashboard } from './components/AdminDashboard';
import { Shield, User, Lock } from 'lucide-react';

/* 
  SYSTEM ARCHITECTURE DOCUMENTATION
  
  1. Frontend (React SPA):
     - View Manager: Handles transitions between Landing, Admin, and Voter modes.
     - State Management: React useState for ephemeral state (current step), simulated DB in-memory.
     - Services: 
        - cryptoService: Client-side encryption simulation.
        - ttsService: Web Speech API wrapper.
  
  2. Security & Privacy:
     - Vote Encryption: Votes are encrypted immediately upon confirmation using a public key.
     - Anonymity: The VoteRecord does not contain any user identifier.
     - Tamper-Proofing: Each vote record has an integrity hash.
     - Decryption: Requires multi-authority key inputs (simulated).
  
  3. Accessibility (A11y):
     - "Need-based" setup: Users select assistance (Voice, Large Text) rather than declaring disability.
     - High Contrast Mode, Large Fonts, Screen Reader support.
     - Color-coded action buttons (Green=Go, Red=Stop).
     
  4. Real-Time System (Simulation):
     - The App component runs a `useEffect` interval to simulate WebSocket events from a backend.
     - It randomly updates polling booth status (Online/Offline) and battery levels.
     - It occasionally injects mock security logs.
*/

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LANDING);
  const [config, setConfig] = useState<ElectionConfig>(INITIAL_ELECTION_CONFIG);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [adminPass, setAdminPass] = useState('');

  // Persist votes to local storage for demo reload capability
  useEffect(() => {
    const savedVotes = localStorage.getItem('secure_votes');
    const savedConfig = localStorage.getItem('election_config');
    if (savedVotes) setVotes(JSON.parse(savedVotes));
    if (savedConfig) setConfig(JSON.parse(savedConfig));
  }, []);

  useEffect(() => {
    localStorage.setItem('secure_votes', JSON.stringify(votes));
    localStorage.setItem('election_config', JSON.stringify(config));
  }, [votes, config]);

  // --- GLOBAL REAL-TIME SIMULATION ---
  useEffect(() => {
    // This effect acts as the "Server Push" or "WebSocket" layer.
    // It is active only when the election is running to simulate live monitoring.
    if (config.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
       setConfig(prev => {
          // 1. Simulate Booth Heartbeats & Battery
          const updatedBooths = prev.booths.map(booth => {
            if (booth.status === 'LOCKED' || booth.status === 'MAINTENANCE') return booth;
            
            // Randomly drop network for 0.5% chance to simulate realism
            const isOffline = Math.random() < 0.005; 
            // Drain battery slowly
            const newBattery = Math.max(0, booth.batteryLevel - (Math.random() * 0.05));
            
            return {
              ...booth,
              lastHeartbeat: isOffline ? booth.lastHeartbeat : Date.now(),
              status: isOffline ? 'OFFLINE' : 'ONLINE',
              batteryLevel: newBattery,
            } as PollingBooth;
          });

          // 2. Simulate Security Logs (Random events)
          const newLogs = [...prev.logs];
          if (Math.random() < 0.01) { // 1% chance per tick
             newLogs.unshift({
               id: crypto.randomUUID(),
               timestamp: Date.now(),
               level: 'WARNING',
               category: 'SECURITY',
               message: `Latency spike detected in ${updatedBooths[0]?.location || 'System'}`
             });
          }

          return {
            ...prev,
            booths: updatedBooths,
            logs: newLogs
          };
       });
    }, 2000); // Tick every 2 seconds

    return () => clearInterval(interval);
  }, [config.status]);

  const handleVoteSubmit = (vote: VoteRecord) => {
    // 1. Add Vote
    setVotes(prev => [...prev, vote]);
    
    // 2. Simulate updating the Booth's total votes on the server
    // For this demo, we assume the vote came from 'K-101' (the active kiosk)
    setConfig(prev => {
       const updatedBooths = prev.booths.map(b => 
         b.id === 'K-101' ? { ...b, totalVotes: b.totalVotes + 1 } : b
       );
       return { ...prev, booths: updatedBooths };
    });
  };

  const handleAdminLogin = () => {
    if (adminPass === '123456') {
      setMode(AppMode.ADMIN_DASHBOARD);
      setAdminPass('');
    } else {
      alert('Invalid Password (Hint: 123456)');
    }
  };

  // VIEW: Landing Page
  if (mode === AppMode.LANDING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center space-y-12">
          
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-full shadow-lg shadow-blue-500/50">
                <Shield size={64} className="text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight">SecureVote</h1>
            <p className="text-xl text-blue-200">Inclusive, Accessible, and Secure Electronic Voting System</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <button 
              onClick={() => setMode(AppMode.VOTER_FLOW)}
              className="group bg-green-600 hover:bg-green-500 transition-all p-8 rounded-2xl flex flex-col items-center gap-4 shadow-xl hover:scale-105 border-2 border-green-400"
            >
              <User size={48} className="text-green-100" />
              <span className="text-3xl font-bold">Voter Entry</span>
              <span className="text-green-200">Cast your vote securely</span>
            </button>

            <button 
              onClick={() => setMode(AppMode.ADMIN_LOGIN)}
              className="group bg-slate-800 hover:bg-slate-700 transition-all p-8 rounded-2xl flex flex-col items-center gap-4 shadow-xl hover:scale-105 border-2 border-slate-600"
            >
              <Lock size={48} className="text-slate-300" />
              <span className="text-3xl font-bold">Admin Login</span>
              <span className="text-slate-400">Manage election & tally</span>
            </button>
          </div>

          <footer className="mt-16 text-slate-500 text-sm">
            <p>System Design Principles: Accessible for everyone, secure by design, trusted by democracy.</p>
          </footer>
        </div>
      </div>
    );
  }

  // VIEW: Admin Login
  if (mode === AppMode.ADMIN_LOGIN) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <Lock className="text-red-600" /> Restricted Access
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Password</label>
              <input 
                type="password" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Enter password..."
              />
            </div>
            <button 
              onClick={handleAdminLogin}
              className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800"
            >
              Access Dashboard
            </button>
            <button 
              onClick={() => setMode(AppMode.LANDING)}
              className="w-full text-gray-500 py-2 hover:underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW: Admin Dashboard
  if (mode === AppMode.ADMIN_DASHBOARD) {
    return (
      <AdminDashboard 
        config={config} 
        votes={votes} 
        onUpdateConfig={setConfig}
        onReset={() => setMode(AppMode.LANDING)}
      />
    );
  }

  // VIEW: Voter Interface
  if (mode === AppMode.VOTER_FLOW) {
    return (
      <VoterInterface 
        config={config} 
        onSubmitVote={handleVoteSubmit}
        onExit={() => setMode(AppMode.LANDING)}
      />
    );
  }

  return null;
};

export default App;
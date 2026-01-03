import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Unlock, Users, Play, StopCircle, 
  FileText, CheckCircle, AlertTriangle, Activity, 
  Settings, Server, Database, Save, Trash2, Plus, 
  RefreshCw, Eye, EyeOff, ClipboardList, Wifi, WifiOff, Battery, BatteryCharging,
  Accessibility, Globe, MapPin, XCircle
} from 'lucide-react';
import { ElectionConfig, VoteRecord, TallyResult, Candidate, PollingBooth, SecurityLog, Party, PartyCategory } from '../types';
import { decryptVote } from '../services/cryptoService';
import { ELECTION_TYPES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  config: ElectionConfig;
  votes: VoteRecord[];
  onUpdateConfig: (config: ElectionConfig) => void;
  onReset: () => void;
}

type Tab = 'CONFIG' | 'PARTIES' | 'BOOTHS' | 'MONITOR' | 'RESULTS';

export const AdminDashboard: React.FC<Props> = ({ config, votes, onUpdateConfig, onReset }) => {
  const [activeTab, setActiveTab] = useState<Tab>(config.status === 'SETUP' ? 'CONFIG' : 'MONITOR');
  
  // Setup State
  const [newCandidateName, setNewCandidateName] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  
  // Booth Setup State
  const [showBoothForm, setShowBoothForm] = useState(false);
  const [newBooth, setNewBooth] = useState<Partial<PollingBooth>>({
    id: '', name: '', location: '', constituency: '',
    status: 'ONLINE', deviceType: 'Kiosk', accessibilityReady: true,
    networkType: 'Wi-Fi', batteryLevel: 100
  });

  // Results State
  const [authKey1, setAuthKey1] = useState('');
  const [authKey2, setAuthKey2] = useState('');
  const [key1Valid, setKey1Valid] = useState(false);
  const [key2Valid, setKey2Valid] = useState(false);
  const [results, setResults] = useState<TallyResult[] | null>(null);

  // Key Validation Effect
  useEffect(() => {
    setKey1Valid(authKey1 === 'admin1');
    setKey2Valid(authKey2 === 'admin2');
  }, [authKey1, authKey2]);


  // --- ACTIONS ---

  const handleStartElection = () => {
    // Validate Readiness
    const unreadyBooths = config.booths.filter(b => !b.accessibilityReady);
    if (unreadyBooths.length > 0) {
       const ids = unreadyBooths.map(b => b.id).join(', ');
       alert(`CANNOT START ELECTION.\n\nThe following booths failed the Accessibility Readiness Check:\n👉 ${ids}\n\nPlease either:\n1. Update the booth to be "Accessibility Ready" (if configuring new booth)\n2. Remove the defective booth\n3. Ensure all equipment is functioning`);
       return;
    }
    if (config.candidates.length < 2) {
      alert("Please add at least 2 candidates to the ballot.");
      return;
    }

    const log: SecurityLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level: 'INFO',
      category: 'SYSTEM',
      message: 'Election Status changed to ACTIVE. All booths unlocked.'
    };
    onUpdateConfig({ 
      ...config, 
      status: 'ACTIVE', 
      startTime: Date.now(),
      logs: [log, ...config.logs]
    });
    setActiveTab('MONITOR');
  };

  const handleStopElection = () => {
    if (!confirm("Are you sure you want to close voting? This permanently locks all booths.")) return;
    
    // Lock all booths
    const lockedBooths = config.booths.map(b => ({ ...b, status: 'LOCKED' as const }));

    const log: SecurityLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level: 'WARNING',
      category: 'SYSTEM',
      message: 'Election Status changed to CLOSED. All booths locked.'
    };
    onUpdateConfig({ 
      ...config, 
      status: 'CLOSED', 
      endTime: Date.now(),
      booths: lockedBooths,
      logs: [log, ...config.logs]
    });
    setActiveTab('RESULTS');
  };

  const addCandidate = () => {
    if (!newCandidateName || !selectedPartyId) return;
    
    const party = config.parties.find(p => p.id === selectedPartyId);
    if (!party) return;

    const newCand: Candidate = {
      id: `c-${Date.now()}`,
      name: newCandidateName,
      partyId: party.id,
      partyName: party.name,
      partySymbol: party.symbolUrl,
      symbol: party.symbolUrl // For now use party symbol
    };
    onUpdateConfig({ ...config, candidates: [...config.candidates, newCand] });
    setNewCandidateName('');
    setSelectedPartyId('');
  };

  const removeCandidate = (candidateId: string) => {
    if(confirm('Are you sure you want to remove this candidate from the ballot?')) {
        const updatedCandidates = config.candidates.filter(c => c.id !== candidateId);
        onUpdateConfig({
            ...config,
            candidates: updatedCandidates
        });
    }
  };

  const addBooth = () => {
    if (!newBooth.id || !newBooth.location) {
        alert("Booth ID and Location are required.");
        return;
    }
    if (config.booths.some(b => b.id === newBooth.id)) {
        alert("Booth ID must be unique.");
        return;
    }

    const booth: PollingBooth = {
        id: newBooth.id || `K-${Date.now()}`,
        name: newBooth.name || `Booth ${newBooth.id}`,
        location: newBooth.location || '',
        constituency: newBooth.constituency || 'General',
        status: 'ONLINE',
        deviceType: newBooth.deviceType as any || 'Kiosk',
        accessibilityReady: newBooth.accessibilityReady || false,
        networkType: newBooth.networkType as any || 'Wi-Fi',
        batteryLevel: 100,
        lastHeartbeat: Date.now(),
        totalVotes: 0,
        authKey: `auth-${newBooth.id}-${Date.now()}`
    };

    onUpdateConfig({ ...config, booths: [...config.booths, booth] });
    setNewBooth({
        id: '', name: '', location: '', constituency: '',
        status: 'ONLINE', deviceType: 'Kiosk', accessibilityReady: true,
        networkType: 'Wi-Fi', batteryLevel: 100
    });
    setShowBoothForm(false);
  };

  const removeBooth = (boothId: string) => {
      if(confirm('Are you sure you want to deregister this polling booth?')) {
          const updatedBooths = config.booths.filter(b => b.id !== boothId);
          onUpdateConfig({
              ...config,
              booths: updatedBooths
          });
      }
  };

  const handleDecryptResults = () => {
    if (key1Valid && key2Valid) {
      const tally: Record<string, number> = {};
      config.candidates.forEach(c => tally[c.id] = 0);

      let decryptedCount = 0;
      votes.forEach(v => {
        const candidateId = decryptVote(v.encryptedData, 'mock-private-key');
        if (candidateId && tally[candidateId] !== undefined) {
          tally[candidateId]++;
          decryptedCount++;
        }
      });

      const resultsArray = Object.keys(tally).map(id => ({
        candidateId: id,
        count: tally[id]
      }));
      
      const log: SecurityLog = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: 'INFO',
        category: 'VOTE',
        message: `Votes decrypted successfully. Total verified: ${decryptedCount}`
      };

      setResults(resultsArray);
      onUpdateConfig({ 
        ...config, 
        status: 'PUBLISHED',
        logs: [log, ...config.logs] 
      });
    }
  };

  // --- RENDERERS ---

  const renderSidebar = () => (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col fixed left-0 top-0 z-20">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Shield className="w-8 h-8 text-blue-400" />
        <span className="text-xl font-bold">AdminPanel</span>
      </div>
      
      <nav className="space-y-1 flex-grow">
        <p className="px-4 text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Pre-Election</p>
        <button onClick={() => setActiveTab('CONFIG')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'CONFIG' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
          <Settings size={20} /> Election Config
        </button>
        <button onClick={() => setActiveTab('PARTIES')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'PARTIES' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
          <Users size={20} /> Candidates & Parties
        </button>
        <button onClick={() => setActiveTab('BOOTHS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'BOOTHS' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
          <Server size={20} /> Polling Booths
        </button>

        <p className="px-4 text-xs font-bold text-slate-500 uppercase mt-6 mb-2">Live Operations</p>
        <button onClick={() => setActiveTab('MONITOR')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'MONITOR' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
          <Activity size={20} /> Live Monitor
        </button>

        <p className="px-4 text-xs font-bold text-slate-500 uppercase mt-6 mb-2">Post-Election</p>
        <button onClick={() => setActiveTab('RESULTS')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'RESULTS' ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}>
          <FileText size={20} /> Results & Audit
        </button>
      </nav>

      <div className="mt-auto border-t border-slate-700 pt-4">
        <div className="flex items-center gap-2 px-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${config.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : config.status === 'CLOSED' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
          <span className="font-mono text-sm">{config.status}</span>
        </div>
        <button onClick={onReset} className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 text-sm flex items-center gap-2">
          <Lock size={16} /> Logout
        </button>
      </div>
    </div>
  );

  const renderConfig = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">Election Configuration</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
         <div>
           <label className="block text-sm font-medium text-gray-700">Election Type</label>
           <select 
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 bg-gray-50"
             value={config.type}
             disabled={config.status !== 'SETUP'}
             onChange={(e) => onUpdateConfig({...config, type: e.target.value})}
           >
             {ELECTION_TYPES.map(t => <option key={t}>{t}</option>)}
           </select>
         </div>
         <div>
           <label className="block text-sm font-medium text-gray-700">Election Name</label>
           <input 
             type="text" 
             className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
             value={config.name}
             onChange={(e) => onUpdateConfig({...config, name: e.target.value})}
             disabled={config.status !== 'SETUP'}
           />
         </div>
         {config.status === 'SETUP' && (
           <div className="pt-4 flex justify-end">
             <button 
               onClick={handleStartElection}
               className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg"
             >
               <Play size={20} /> Initialize & Start Voting
             </button>
           </div>
         )}
         {config.status === 'ACTIVE' && (
             <div className="bg-green-50 border border-green-200 p-4 rounded text-green-800 flex items-center gap-2">
                 <Activity className="animate-pulse" /> Election is currently LIVE. Config is locked.
             </div>
         )}
      </div>
    </div>
  );

  const renderPartiesCandidates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
         <h2 className="text-2xl font-bold text-gray-800">Candidates & Affiliations</h2>
         {config.status === 'SETUP' && <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Editing Enabled</span>}
      </div>

      {/* Add Candidate Form */}
      {config.status === 'SETUP' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Register New Candidate</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              placeholder="Candidate Name" 
              className="border p-2 rounded"
              value={newCandidateName}
              onChange={(e) => setNewCandidateName(e.target.value)}
            />
            <select 
              className="border p-2 rounded"
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
            >
              <option value="">Select Party / Affiliation...</option>
              {config.parties.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.shortCode})</option>
              ))}
            </select>
            <button onClick={addCandidate} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 font-medium">
              + Add to Ballot
            </button>
          </div>
        </div>
      )}

      {/* Candidate List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.candidates.map(c => {
          const party = config.parties.find(p => p.id === c.partyId);
          return (
            <div key={c.id} className="bg-white border rounded-lg p-4 flex items-center gap-4 shadow-sm">
               <div className="text-4xl bg-gray-50 p-3 rounded-lg">{c.symbol}</div>
               <div>
                 <p className="font-bold text-lg">{c.name}</p>
                 <div className="flex items-center gap-2 text-sm text-gray-600">
                   <span className="font-semibold">{party?.shortCode}</span>
                   <span>•</span>
                   <span className="text-xs text-gray-500">{party?.category}</span>
                 </div>
               </div>
               {config.status === 'SETUP' && (
                 <button 
                    onClick={() => removeCandidate(c.id)}
                    className="ml-auto text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                    title="Remove Candidate"
                 >
                    <Trash2 size={20} />
                 </button>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBooths = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
         <h2 className="text-2xl font-bold text-gray-800">Polling Booth Configuration</h2>
         {config.status === 'SETUP' && (
             <button 
               onClick={() => setShowBoothForm(!showBoothForm)}
               className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
             >
               <Plus size={16} /> {showBoothForm ? 'Cancel Registration' : 'Register New Booth'}
             </button>
         )}
      </div>

      {/* Add Booth Form */}
      {showBoothForm && config.status === 'SETUP' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-4 animate-in slide-in-from-top-4">
              <h3 className="text-lg font-semibold mb-4">New Device Registration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input 
                    className="border p-2 rounded" 
                    placeholder="Booth ID (e.g. K-999)" 
                    value={newBooth.id}
                    onChange={e => setNewBooth({...newBooth, id: e.target.value})}
                  />
                   <input 
                    className="border p-2 rounded" 
                    placeholder="Location" 
                    value={newBooth.location}
                    onChange={e => setNewBooth({...newBooth, location: e.target.value})}
                  />
                   <select 
                     className="border p-2 rounded"
                     value={newBooth.deviceType}
                     onChange={e => setNewBooth({...newBooth, deviceType: e.target.value as any})}
                   >
                       <option>Kiosk</option>
                       <option>Tablet</option>
                       <option>Terminal</option>
                   </select>
                   <select 
                     className="border p-2 rounded"
                     value={newBooth.networkType}
                     onChange={e => setNewBooth({...newBooth, networkType: e.target.value as any})}
                   >
                       <option>Wi-Fi</option>
                       <option>LAN</option>
                       <option>4G/5G</option>
                   </select>
              </div>
              <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newBooth.accessibilityReady}
                        onChange={e => setNewBooth({...newBooth, accessibilityReady: e.target.checked})}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm font-medium">Passed Accessibility Check</span>
                  </label>
                  <button 
                    onClick={addBooth}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
                  >
                      Confirm Registration
                  </button>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {config.booths.map(booth => (
          <div key={booth.id} className="bg-white border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
             <div className="flex items-start gap-4">
               <div className={`p-3 rounded-lg ${booth.status === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                 <Server size={24} />
               </div>
               <div>
                 <div className="flex items-center gap-2">
                   <h3 className="font-bold text-lg">{booth.id}</h3>
                   <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-700">{booth.constituency}</span>
                 </div>
                 <p className="text-gray-600 text-sm">{booth.location}</p>
                 <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Wifi size={12} /> {booth.networkType}</span>
                    <span className="flex items-center gap-1"><Battery size={12} /> {Math.round(booth.batteryLevel)}%</span>
                 </div>
               </div>
             </div>
             
             <div className="mt-4 md:mt-0 flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold">Accessibility</p>
                  {booth.accessibilityReady ? 
                    <div className="flex items-center gap-1 text-green-600 text-sm font-bold"><CheckCircle size={14}/> Ready</div> : 
                    <div className="flex items-center gap-1 text-red-600 text-sm font-bold"><XCircle size={14}/> Not Ready</div>
                  }
                </div>
                <div className="text-right">
                   <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                   <span className={`font-mono font-bold ${booth.status === 'ONLINE' ? 'text-green-600' : 'text-red-600'}`}>
                     {booth.status}
                   </span>
                </div>
                {config.status === 'SETUP' && (
                  <div className="flex gap-2">
                    <button className="border p-2 rounded hover:bg-gray-50"><Settings size={16} /></button>
                    <button 
                        onClick={() => removeBooth(booth.id)}
                        className="border p-2 rounded hover:bg-red-50 text-red-500"
                        title="Deregister Booth"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonitor = () => {
    // Stats
    const totalVotes = config.booths.reduce((acc, b) => acc + b.totalVotes, 0); // Real-time
    const activeBooths = config.booths.filter(b => b.status === 'ONLINE').length;
    
    return (
      <div className="space-y-6">
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="text-red-600 animate-pulse" /> Live Monitor
            </h2>
            <p className="text-gray-500 text-sm">Real-time telemetry from polling infrastructure.</p>
          </div>
          {config.status === 'ACTIVE' && (
             <button onClick={handleStopElection} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:bg-red-700 transition-all">
               <StopCircle size={20} /> STOP ELECTION
             </button>
          )}
        </header>

        {/* Live Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-slate-800 text-white p-4 rounded-lg shadow-lg">
             <p className="text-slate-400 text-xs uppercase font-bold">Live Global Vote Count</p>
             <p className="text-4xl font-mono font-bold mt-1 text-green-400">{totalVotes}</p>
             <p className="text-xs text-slate-500 mt-2">Aggregated from all booths</p>
           </div>
           <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
             <p className="text-gray-500 text-xs uppercase font-bold">Active Booths</p>
             <p className="text-3xl font-bold mt-1">{activeBooths} <span className="text-lg text-gray-400 font-normal">/ {config.booths.length}</span></p>
           </div>
           <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
             <p className="text-gray-500 text-xs uppercase font-bold">Pending Alerts</p>
             <p className="text-3xl font-bold mt-1">{config.logs.filter(l => l.level !== 'INFO').length}</p>
           </div>
           <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
             <p className="text-gray-500 text-xs uppercase font-bold">Election Time</p>
             <p className="text-xl font-bold mt-2">04:12:30</p>
             <p className="text-xs text-green-600 font-bold">● ON SCHEDULE</p>
           </div>
        </div>

        {/* Live Booth Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
           <div className="px-6 py-4 border-b bg-gray-50 font-bold flex items-center gap-2">
             <MapPin size={18} /> Booth Telemetry (Real-Time)
           </div>
           <table className="min-w-full text-sm">
             <thead className="bg-gray-100 text-gray-500">
               <tr>
                 <th className="px-6 py-3 text-left">Booth ID / Location</th>
                 <th className="px-6 py-3 text-left">Status</th>
                 <th className="px-6 py-3 text-left">Connectivity</th>
                 <th className="px-6 py-3 text-right">Votes (Live)</th>
                 <th className="px-6 py-3 text-right">Last Heartbeat</th>
               </tr>
             </thead>
             <tbody className="divide-y">
               {config.booths.map(b => (
                 <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                   <td className="px-6 py-4">
                     <p className="font-bold">{b.id}</p>
                     <p className="text-xs text-gray-500">{b.location}</p>
                   </td>
                   <td className="px-6 py-4">
                     {b.status === 'ONLINE' ? 
                       <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold">
                         <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span> ONLINE
                       </span> :
                       <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                         OFFLINE
                       </span>
                     }
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1"><Wifi size={14} /> {b.networkType}</span>
                        <span className={`flex items-center gap-1 ${b.batteryLevel < 20 ? 'text-red-600 font-bold' : ''}`}>
                          <Battery size={14} /> {Math.round(b.batteryLevel)}%
                        </span>
                     </div>
                   </td>
                   <td className="px-6 py-4 text-right font-mono font-bold text-lg">
                     {b.totalVotes}
                   </td>
                   <td className="px-6 py-4 text-right text-gray-500 text-xs">
                     {Math.round((Date.now() - b.lastHeartbeat) / 1000)}s ago
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>

        {/* Live Logs (Alerts) */}
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs h-48 overflow-y-auto shadow-inner">
           <p className="text-gray-500 mb-2 border-b border-gray-700 pb-1">SYSTEM LOGS STREAM...</p>
           {config.logs.slice(0, 20).map(log => (
             <div key={log.id} className="mb-1">
               <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
               <span className={`ml-2 font-bold ${log.level === 'CRITICAL' ? 'text-red-500' : log.level === 'WARNING' ? 'text-yellow-500' : 'text-blue-400'}`}>
                 {log.level}
               </span>: {log.message}
             </div>
           ))}
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="space-y-8">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Results & Audit</h2>
        <p className="text-gray-500">Multi-authority decryption and blockchain-verified audit ledger.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Decryption Panel */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
           <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
             <Lock className="text-blue-900" /> Secure Decryption Protocol
           </h3>
           
           {!results ? (
             <div className="space-y-6">
                <div className={`p-4 rounded-lg border transition-all ${key1Valid ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Election Authority 1</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter Private Key..."
                      value={authKey1}
                      onChange={e => setAuthKey1(e.target.value)}
                      disabled={config.status !== 'CLOSED'}
                    />
                    {key1Valid && <CheckCircle className="text-green-600 animate-bounce" />}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border transition-all ${key2Valid ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Election Authority 2</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter Private Key..."
                      value={authKey2}
                      onChange={e => setAuthKey2(e.target.value)}
                      disabled={config.status !== 'CLOSED'}
                    />
                     {key2Valid && <CheckCircle className="text-green-600 animate-bounce" />}
                  </div>
                </div>

                <button 
                  onClick={handleDecryptResults}
                  disabled={!key1Valid || !key2Valid || config.status !== 'CLOSED'}
                  className={`w-full py-3 rounded-lg font-bold shadow-md transition-all ${
                    key1Valid && key2Valid && config.status === 'CLOSED' 
                    ? 'bg-blue-900 text-white hover:bg-blue-800 transform hover:scale-105' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {config.status !== 'CLOSED' ? 'Wait for Election to Close' : 'Decrypt & Tally Votes'}
                </button>
             </div>
           ) : (
             <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-600 w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-800">Results Decrypted</h4>
                <p className="text-gray-500 mb-6">Official tally generated.</p>
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={results}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="candidateId" tick={{fontSize: 10}} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
           )}
        </div>

        {/* Right: Live Audit Ledger */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col h-full">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold flex items-center gap-2"><Database size={18} /> Audit Ledger</h3>
             <span className="flex items-center gap-1 text-xs text-green-600 font-bold px-2 py-1 bg-green-100 rounded-full">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> LIVE
             </span>
           </div>
           
           <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg border p-2 space-y-2 max-h-[500px]">
              {votes.length === 0 && <p className="text-center text-gray-400 py-10">Waiting for first vote...</p>}
              {[...votes].reverse().map(vote => (
                <div key={vote.voteId} className="bg-white p-3 rounded border shadow-sm text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                   <div>
                     <p className="text-gray-500">{new Date(vote.timestamp).toLocaleTimeString()}</p>
                     <p className="font-bold text-gray-800">ID: {vote.voteId.substring(0, 12)}...</p>
                   </div>
                   <div className="text-right">
                     <p className="text-blue-600 truncate w-24">{vote.integrityHash.substring(0, 10)}...</p>
                     <span className="text-green-600 font-bold flex items-center gap-1 justify-end"><CheckCircle size={10} /> Verified</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
       {renderSidebar()}
       <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
          {activeTab === 'CONFIG' && renderConfig()}
          {activeTab === 'PARTIES' && renderPartiesCandidates()}
          {activeTab === 'BOOTHS' && renderBooths()}
          {activeTab === 'MONITOR' && renderMonitor()}
          {activeTab === 'RESULTS' && renderResults()}
       </main>
    </div>
  );
};
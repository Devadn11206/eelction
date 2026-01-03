import React, { useState, useEffect, useRef } from 'react';
import { VoterStep, AccessibilitySettings, Candidate, VoteRecord } from '../types';
import { TRANSLATIONS } from '../constants';
import { speak, cancelSpeech } from '../services/ttsService';
import { AccessibleButton } from './AccessibleButton';
import { encryptVote, generateVoteId } from '../services/cryptoService';
import { Mic, Eye, Type, MousePointer2, Check, QrCode, ArrowRight, Volume2, ZoomIn, Sun } from 'lucide-react';

interface Props {
  config: any;
  onSubmitVote: (vote: VoteRecord) => void;
  onExit: () => void;
}

export const VoterInterface: React.FC<Props> = ({ config, onSubmitVote, onExit }) => {
  const [step, setStep] = useState<VoterStep>(VoterStep.LANGUAGE);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    ttsEnabled: false,
    simplifiedView: false,
    language: 'en',
  });
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  
  const text = TRANSLATIONS[settings.language];

  // TTS Helper
  const speakInstruction = (instruction: string) => {
    if (settings.ttsEnabled) {
      speak(instruction, settings.language);
    }
  };

  useEffect(() => {
    // Announce step change
    const timeout = setTimeout(() => {
      switch (step) {
        case VoterStep.LANGUAGE:
          speak("Select your language. English, Red. Hindi, Blue. Telugu, Green.", 'en');
          break;
        case VoterStep.AUTH:
          speakInstruction(text.scanQr + ". " + text.auth);
          break;
        case VoterStep.ACCESS_SETUP:
          if(settings.ttsEnabled) speak("Accessibility Setup. Choose how you want help.", settings.language);
          break;
        case VoterStep.VOTE_SELECTION:
          speakInstruction(text.voting + ". Select a candidate.");
          break;
        case VoterStep.CONFIRMATION:
          speakInstruction(text.confirm);
          break;
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [step, settings.language, settings.ttsEnabled]);

  const handleLanguageSelect = (lang: 'en' | 'hi' | 'te') => {
    // Enable TTS by default when a language is selected via these buttons
    setSettings(s => ({ ...s, language: lang, ttsEnabled: true }));
    setStep(VoterStep.AUTH);
  };

  const handleAuthComplete = () => {
    // Mock Auth
    setTimeout(() => {
      setStep(VoterStep.ACCESS_SETUP);
    }, 1500);
  };

  const toggleAccessibility = (key: keyof AccessibilitySettings) => {
    setSettings(prev => {
       const newSettings = { ...prev, [key]: !prev[key] };
       // If enabling TTS, speak immediately
       if (key === 'ttsEnabled' && newSettings.ttsEnabled) {
         speak("Voice guidance enabled.", prev.language);
       }
       return newSettings;
    });
  };

  const handleVoteSelect = (candidateId: string) => {
    setSelectedCandidate(candidateId);
    const candidate = config.candidates.find((c: Candidate) => c.id === candidateId);
    if (candidate) {
      speakInstruction(`You selected ${candidate.name}, ${candidate.partyName || 'Independent'}.`);
    }
  };

  const handleConfirmVote = async () => {
    if (!selectedCandidate) return;
    
    setStep(VoterStep.SUBMITTING);
    speakInstruction("Submitting vote. Please wait.");

    const { encryptedData, hash } = await encryptVote(selectedCandidate, config.publicKey);
    
    const voteRecord: VoteRecord = {
      voteId: generateVoteId(),
      encryptedData,
      integrityHash: hash,
      timestamp: Date.now(),
    };

    onSubmitVote(voteRecord);
    setReceipt(hash);
    setStep(VoterStep.RECEIPT);
    speakInstruction("Vote submitted securely. Thank you.");
  };

  const containerClass = `min-h-screen flex flex-col transition-all duration-300 ${
    settings.highContrast ? 'bg-black text-yellow-300' : 'bg-gray-50 text-gray-900'
  } ${settings.largeText ? 'text-2xl' : 'text-base'}`;

  // RENDER STEPS
  const renderStep = () => {
    switch (step) {
      case VoterStep.LANGUAGE:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 h-full flex-grow items-center">
            <AccessibleButton 
              variant="red" label="English" largeText 
              onClick={() => handleLanguageSelect('en')} 
              audioHint="For English, press here"
              hintLanguage="en"
              ttsEnabled={true}
              icon={<span className="text-4xl">A</span>}
            />
            <AccessibleButton 
              variant="blue" label="हिंदी" largeText 
              onClick={() => handleLanguageSelect('hi')} 
              audioHint="हिंदी के लिए यहाँ दबाएं" 
              hintLanguage="hi"
              ttsEnabled={true}
               icon={<span className="text-4xl">अ</span>}
            />
            <AccessibleButton 
              variant="green" label="తెలుగు" largeText 
              onClick={() => handleLanguageSelect('te')} 
              audioHint="తెలుగు కోసం ఇక్కడ నొక్కండి"
              hintLanguage="te"
              ttsEnabled={true}
               icon={<span className="text-4xl">అ</span>}
            />
          </div>
        );

      case VoterStep.AUTH:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8">
            <h2 className="text-3xl font-bold mb-8">{text.auth}</h2>
            <div className={`p-8 rounded-2xl border-4 border-dashed ${settings.highContrast ? 'border-yellow-400' : 'border-gray-400'} animate-pulse`}>
              <QrCode size={128} />
            </div>
            <p className="text-xl">{text.scanQr}</p>
            <AccessibleButton 
              variant="blue" label="Simulate Scan" 
              onClick={handleAuthComplete} 
              className="mt-8"
              ttsEnabled={settings.ttsEnabled}
              hintLanguage={settings.language}
              audioHint="Click to simulate scanning your voter ID"
            />
          </div>
        );

      case VoterStep.ACCESS_SETUP:
        return (
          <div className="p-8 max-w-5xl mx-auto w-full">
            <h2 className="text-3xl font-bold mb-8 text-center">{text.accessSetup}</h2>
            <div className="grid grid-cols-2 gap-6">
              <AccessibleButton 
                variant={settings.ttsEnabled ? "green" : "neutral"}
                label="Voice Guidance"
                icon={<Volume2 size={48} />}
                onClick={() => toggleAccessibility('ttsEnabled')}
                audioHint={settings.language === 'en' ? "Press to toggle Voice Guidance" : settings.language === 'hi' ? "आवाज़ दिशा निर्देश के लिए दबाएं" : "వాయిస్ గైడెన్స్ కోసం నొక్కండి"}
                hintLanguage={settings.language}
                ttsEnabled={true} // Always enable here to find it
                selected={settings.ttsEnabled}
              />
              <AccessibleButton 
                variant={settings.largeText ? "green" : "neutral"}
                label="Larger Text"
                icon={<ZoomIn size={48} />}
                onClick={() => toggleAccessibility('largeText')}
                audioHint={settings.language === 'en' ? "Press for Larger Text" : settings.language === 'hi' ? "बड़े टेक्स्ट के लिए दबाएं" : "పెద్ద వచనం కోసం నొక్కండి"}
                hintLanguage={settings.language}
                ttsEnabled={settings.ttsEnabled}
                selected={settings.largeText}
              />
              <AccessibleButton 
                variant={settings.highContrast ? "green" : "neutral"}
                label="High Contrast"
                icon={<Sun size={48} />}
                onClick={() => toggleAccessibility('highContrast')}
                audioHint={settings.language === 'en' ? "Press for High Contrast" : settings.language === 'hi' ? "उच्च कंट्रास्ट के लिए दबाएं" : "హై కాంట్రాస్ట్ కోసం నొక్కండి"}
                hintLanguage={settings.language}
                ttsEnabled={settings.ttsEnabled}
                selected={settings.highContrast}
              />
              <AccessibleButton 
                variant={settings.simplifiedView ? "green" : "neutral"}
                label="Simple View"
                icon={<MousePointer2 size={48} />}
                onClick={() => toggleAccessibility('simplifiedView')}
                audioHint={settings.language === 'en' ? "Press for Simplified View" : settings.language === 'hi' ? "सरल दृश्य के लिए दबाएं" : "సాధారణ వీక్షణ కోసం నొక్కండి"}
                hintLanguage={settings.language}
                ttsEnabled={settings.ttsEnabled}
                selected={settings.simplifiedView}
              />
            </div>
            <div className="mt-8 flex justify-center">
               <AccessibleButton 
                variant="blue" 
                label="Continue to Vote" 
                onClick={() => setStep(VoterStep.VOTE_SELECTION)}
                fullWidth
                largeText
                audioHint={settings.language === 'en' ? "Press to continue to voting" : settings.language === 'hi' ? "वोट डालने के लिए आगे बढ़ें" : "ఓటు వేయడానికి కొనసాగండి"}
                hintLanguage={settings.language}
                ttsEnabled={settings.ttsEnabled}
              />
            </div>
          </div>
        );

      case VoterStep.VOTE_SELECTION:
        return (
          <div className="p-4 w-full max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">{text.voting}</h2>
            <div className={`grid ${settings.simplifiedView ? 'grid-cols-1 gap-8' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6'}`}>
              {config.candidates.map((candidate: Candidate) => (
                <AccessibleButton
                  key={candidate.id}
                  variant={selectedCandidate === candidate.id ? "green" : "neutral"}
                  label={candidate.name}
                  largeText={settings.largeText}
                  onClick={() => handleVoteSelect(candidate.id)}
                  selected={selectedCandidate === candidate.id}
                  ttsEnabled={settings.ttsEnabled}
                  hintLanguage={settings.language}
                  audioHint={`Vote for ${candidate.name}, ${candidate.partyName || candidate.partyId}. Symbol: ${candidate.symbol}`}
                  icon={
                    <div className="flex flex-col items-center">
                      <span className="text-6xl mb-2">{candidate.symbol}</span>
                      <span className="text-sm font-normal">{candidate.partyName}</span>
                    </div>
                  }
                  className={settings.highContrast ? 'border-white' : ''}
                />
              ))}
            </div>
            <div className="mt-8 flex justify-between gap-4">
               <AccessibleButton 
                  variant="red" label="Back" 
                  onClick={() => setStep(VoterStep.ACCESS_SETUP)}
                  ttsEnabled={settings.ttsEnabled}
                  hintLanguage={settings.language}
               />
               <AccessibleButton 
                  variant={selectedCandidate ? "green" : "neutral"} 
                  label="Review Selection" 
                  onClick={() => selectedCandidate && setStep(VoterStep.CONFIRMATION)}
                  disabled={!selectedCandidate}
                  ttsEnabled={settings.ttsEnabled}
                  hintLanguage={settings.language}
                  audioHint="Press to review and confirm your vote"
               />
            </div>
          </div>
        );

      case VoterStep.CONFIRMATION:
        const candidate = config.candidates.find((c: any) => c.id === selectedCandidate);
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">{text.confirm}</h2>
            <div className={`p-8 rounded-xl w-full mb-8 ${settings.highContrast ? 'bg-gray-800 border-2 border-yellow-400' : 'bg-white shadow-xl border-2 border-gray-200'}`}>
               <div className="text-8xl mb-4">{candidate?.symbol}</div>
               <h3 className="text-3xl font-bold mb-2">{candidate?.name}</h3>
               <p className="text-xl">{candidate?.partyName}</p>
            </div>
            <div className="grid grid-cols-2 gap-8 w-full">
               <AccessibleButton 
                  variant="red" label="Change Vote" 
                  onClick={() => setStep(VoterStep.VOTE_SELECTION)}
                  ttsEnabled={settings.ttsEnabled}
                  hintLanguage={settings.language}
                  audioHint="Press to go back and change your vote"
                  icon={<ArrowRight className="rotate-180" />}
               />
               <AccessibleButton 
                  variant="green" label="CONFIRM VOTE" 
                  onClick={handleConfirmVote}
                  ttsEnabled={settings.ttsEnabled}
                  hintLanguage={settings.language}
                  audioHint="Press to submit your vote permanently"
                  largeText
                  icon={<Check size={32} />}
               />
            </div>
          </div>
        );

      case VoterStep.SUBMITTING:
         return (
           <div className="flex flex-col items-center justify-center h-full">
             <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mb-8"></div>
             <h2 className="text-2xl font-bold">Encrypting & Submitting...</h2>
             <p className="mt-4">Securing your identity...</p>
           </div>
         );

      case VoterStep.RECEIPT:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-2xl mx-auto">
             <CheckCircle className="text-green-500 w-32 h-32 mb-6" />
             <h2 className="text-4xl font-bold mb-4">{text.receipt}</h2>
             <p className="text-xl mb-8">Your vote has been securely recorded and anonymized.</p>
             
             <div className={`p-6 rounded-lg w-full mb-8 break-all font-mono text-sm ${settings.highContrast ? 'bg-gray-800' : 'bg-gray-200'}`}>
               <p className="font-bold mb-2">Verification Hash:</p>
               {receipt}
             </div>

             <AccessibleButton 
                variant="blue" label="Exit / Next Voter" 
                onClick={onExit}
                ttsEnabled={settings.ttsEnabled}
                hintLanguage={settings.language}
                fullWidth
             />
          </div>
        );
      
      default: return null;
    }
  };

  // Check Election Status
  if (config.status !== 'ACTIVE' && step !== VoterStep.LANGUAGE) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
         <h1 className="text-4xl font-bold text-red-600 mb-4">Election Paused</h1>
         <p className="text-xl">Please wait for the administrator to open the polls.</p>
         <button onClick={onExit} className="mt-8 text-blue-600 underline">Back to Home</button>
      </div>
    );
  }

  return (
    <div className={containerClass} style={{ fontFamily: settings.largeText ? '"Atkinson Hyperlegible", sans-serif' : 'Inter, sans-serif' }}>
       {/* Accessible Header */}
       <header className={`p-4 flex justify-between items-center ${settings.highContrast ? 'bg-gray-900 border-b border-yellow-400' : 'bg-white shadow-sm'}`}>
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8" />
            <span className="font-bold">SecureVote</span>
          </div>
          <div className="flex gap-2">
             {settings.ttsEnabled && <Volume2 className="animate-pulse text-green-600" />}
             {settings.largeText && <Type className="text-blue-600" />}
             {settings.highContrast && <Sun className="text-yellow-500" />}
          </div>
       </header>

       <main className="flex-grow flex flex-col items-center justify-center relative">
          {renderStep()}
       </main>
    </div>
  );
};

// Helper Icon for Header
import { Shield, CheckCircle } from 'lucide-react';
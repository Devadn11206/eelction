let synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

export const speak = (text: string, lang: string = 'en') => {
  if (!synth) return;
  
  // Cancel current speech to avoid overlap
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-US';
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1;
  
  synth.speak(utterance);
};

export const cancelSpeech = () => {
  if (synth) synth.cancel();
};

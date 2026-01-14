// Text-to-speech utility using Web Speech API

let synth = null;
let voices = [];
let frenchVoice = null;

// Initialize speech synthesis
const initSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    synth = window.speechSynthesis;
    
    // Load voices
    const loadVoices = () => {
      voices = synth.getVoices();
      // Try to find a French voice
      frenchVoice = voices.find(voice => 
        voice.lang.startsWith('fr') || 
        voice.name.toLowerCase().includes('french')
      ) || voices.find(voice => voice.lang.startsWith('fr'));
    };
    
    loadVoices();
    
    // Some browsers load voices asynchronously
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }
};

// Initialize on first import
if (typeof window !== 'undefined') {
  initSpeech();
}

export const speak = (text, options = {}) => {
  if (!synth) {
    console.warn('Speech synthesis not available');
    return;
  }
  
  // Cancel any ongoing speech
  synth.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language to French
  utterance.lang = 'fr-FR';
  
  // Use French voice if available
  if (frenchVoice) {
    utterance.voice = frenchVoice;
  }
  
  // Set options
  utterance.rate = options.rate || 0.9; // Slightly slower for clarity
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;
  
  // Handle errors
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
  };
  
  synth.speak(utterance);
  
  return utterance;
};

export const stop = () => {
  if (synth) {
    synth.cancel();
  }
};

export const isAvailable = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const getVoices = () => {
  return voices;
};
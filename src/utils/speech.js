// Text-to-speech utility using Web Speech API

import { getSettings } from './settingsStorage';

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
  
  // Get user settings for pronunciation speed
  const settings = getSettings();
  const defaultRate = settings.pronunciationSpeed || 0.8;
  
  // Set options - use options.rate if provided, otherwise use settings, otherwise default
  utterance.rate = options.rate || defaultRate;
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
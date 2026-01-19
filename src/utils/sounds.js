// Sound effects utility
// Uses Web Audio API to generate simple sounds

let audioContext = null;

const initAudioContext = () => {
  if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Audio context not available:', e);
    }
  }
};

// Initialize on first import
if (typeof window !== 'undefined') {
  initAudioContext();
}

const playTone = (frequency, duration, type = 'sine') => {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return;
  }
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

export const playCorrectSound = () => {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return;
  }
  
  // Play a pleasant ascending chord
  playTone(523.25, 0.1, 'sine'); // C5
  setTimeout(() => playTone(659.25, 0.1, 'sine'), 50); // E5
  setTimeout(() => playTone(783.99, 0.1, 'sine'), 100); // G5
};

export const playIncorrectSound = () => {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return;
  }
  
  // Play a descending tone
  playTone(400, 0.15, 'sawtooth');
  setTimeout(() => playTone(300, 0.15, 'sawtooth'), 100);
};

export const playFlipSound = () => {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return;
  }
  
  playTone(440, 0.05, 'sine');
};

export const playMatchSound = () => {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return;
  }
  
  // Play a pleasant match sound
  playTone(523.25, 0.08, 'sine');
  setTimeout(() => playTone(659.25, 0.12, 'sine'), 80);
};

export const playCompleteSound = () => {
  if (!audioContext) {
    initAudioContext();
    if (!audioContext) return;
  }
  
  // Play a celebratory chord progression
  playTone(523.25, 0.15, 'sine'); // C5
  setTimeout(() => playTone(659.25, 0.15, 'sine'), 150); // E5
  setTimeout(() => playTone(783.99, 0.15, 'sine'), 300); // G5
  setTimeout(() => playTone(1046.50, 0.2, 'sine'), 450); // C6
};

export const isAvailable = () => {
  return typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
};

// LocalStorage utility for storing user settings

const STORAGE_KEY = 'learnfrench_settings';

export const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const defaultSettings = {
      pronunciationSpeed: 0.8,
      darkMode: false,
      flashcardCount: 25,
      gameDifficulty: 'medium', // 'easy', 'medium', 'hard'
      soundEffects: true,
      hintsEnabled: true,
      keyboardShortcuts: true,
      autoPronounce: true
    };
    
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      pronunciationSpeed: 0.8,
      darkMode: false,
      flashcardCount: 25,
      gameDifficulty: 'medium',
      soundEffects: true,
      hintsEnabled: true,
      keyboardShortcuts: true,
      autoPronounce: true
    };
  }
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const updatePronunciationSpeed = (speed) => {
  const settings = getSettings();
  settings.pronunciationSpeed = speed;
  saveSettings(settings);
};

export const updateSetting = (key, value) => {
  const settings = getSettings();
  settings[key] = value;
  saveSettings(settings);
};

export const toggleDarkMode = () => {
  const settings = getSettings();
  settings.darkMode = !settings.darkMode;
  saveSettings(settings);
  applyDarkMode(settings.darkMode);
  return settings.darkMode;
};

export const applyDarkMode = (enabled) => {
  if (enabled) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
};

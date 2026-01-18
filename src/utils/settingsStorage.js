// LocalStorage utility for storing user settings

const STORAGE_KEY = 'learnfrench_settings';

export const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      pronunciationSpeed: 0.8 // Default: slightly slower than normal (0.8 = 80% speed)
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      pronunciationSpeed: 0.8
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

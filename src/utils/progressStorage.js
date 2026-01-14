// LocalStorage utility for tracking learning progress

const STORAGE_KEY = 'learnfrench_progress';

export const getProgress = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {
      learnedWords: [],
      categoryProgress: {},
      totalScore: 0,
      streak: 0,
      lastPlayed: null
    };
  } catch (error) {
    console.error('Error loading progress:', error);
    return {
      learnedWords: [],
      categoryProgress: {},
      totalScore: 0,
      streak: 0,
      lastPlayed: null
    };
  }
};

export const saveProgress = (progress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

export const markWordLearned = (wordId) => {
  const progress = getProgress();
  if (!progress.learnedWords.includes(wordId)) {
    progress.learnedWords.push(wordId);
    saveProgress(progress);
  }
};

export const updateCategoryProgress = (categoryId, score) => {
  const progress = getProgress();
  if (!progress.categoryProgress[categoryId]) {
    progress.categoryProgress[categoryId] = {
      score: 0,
      totalAttempts: 0,
      lastPlayed: new Date().toISOString()
    };
  }
  progress.categoryProgress[categoryId].score += score;
  progress.categoryProgress[categoryId].totalAttempts += 1;
  progress.categoryProgress[categoryId].lastPlayed = new Date().toISOString();
  progress.totalScore += score;
  const now = new Date();
  
  // Update streak (check before updating lastPlayed)
  const today = now.toDateString();
  const previousLastPlayed = progress.lastPlayed;
  const lastPlayedDate = previousLastPlayed 
    ? new Date(previousLastPlayed).toDateString() 
    : null;
  
  if (!lastPlayedDate) {
    // First time playing
    progress.streak = 1;
  } else if (lastPlayedDate === today) {
    // Already played today, keep streak (don't increment)
    // Keep existing streak value
  } else {
    // Check if played yesterday (consecutive day)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastPlayedDate === yesterday.toDateString()) {
      // Consecutive day - increment streak
      progress.streak = (progress.streak || 0) + 1;
    } else {
      // Not consecutive - reset streak
      progress.streak = 1;
    }
  }
  
  // Update lastPlayed after streak calculation
  progress.lastPlayed = now.toISOString();
  saveProgress(progress);
};

export const resetProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
};
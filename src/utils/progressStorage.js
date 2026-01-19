// LocalStorage utility for tracking learning progress

const STORAGE_KEY = 'learnfrench_progress';

export const getProgress = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const defaultProgress = {
      learnedWords: [],
      categoryProgress: {},
      totalScore: 0,
      streak: 0,
      lastPlayed: null,
      // Spaced repetition system
      wordStats: {}, // { wordId: { correct: 0, incorrect: 0, lastReviewed: null, nextReview: null, difficulty: 0 } }
      reviewQueue: [],
      // Achievement system
      achievements: [],
      achievementsUnlocked: {},
      // Practice tracking
      weakWords: [], // Words marked as needing practice
      // Statistics
      stats: {
        totalPracticeTime: 0,
        totalSessions: 0,
        wordsByDifficulty: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        accuracyHistory: [],
        lastSessionDate: null
      }
    };
    
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure new fields exist
      return { ...defaultProgress, ...parsed, 
        wordStats: { ...defaultProgress.wordStats, ...(parsed.wordStats || {}) },
        stats: { ...defaultProgress.stats, ...(parsed.stats || {}) }
      };
    }
    return defaultProgress;
  } catch (error) {
    console.error('Error loading progress:', error);
    return {
      learnedWords: [],
      categoryProgress: {},
      totalScore: 0,
      streak: 0,
      lastPlayed: null,
      wordStats: {},
      reviewQueue: [],
      achievements: [],
      achievementsUnlocked: {},
      weakWords: [],
      stats: {
        totalPracticeTime: 0,
        totalSessions: 0,
        wordsByDifficulty: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        accuracyHistory: [],
        lastSessionDate: null
      }
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
  }
  
  // Initialize word stats if not exists
  if (!progress.wordStats[wordId]) {
    progress.wordStats[wordId] = {
      correct: 0,
      incorrect: 0,
      lastReviewed: null,
      nextReview: null,
      difficulty: 0,
      timesReviewed: 0
    };
  }
  
  // Update difficulty based on performance
  const stats = progress.wordStats[wordId];
  const totalAttempts = stats.correct + stats.incorrect;
  if (totalAttempts > 0) {
    const accuracy = stats.correct / totalAttempts;
    if (accuracy >= 0.8 && stats.correct >= 3) {
      stats.difficulty = Math.min(5, stats.difficulty + 1);
    }
  }
  
  // Set next review date (spaced repetition)
  const now = new Date();
  stats.lastReviewed = now.toISOString();
  stats.timesReviewed = (stats.timesReviewed || 0) + 1;
  
  // Calculate next review based on difficulty (easier words reviewed less frequently)
  const daysUntilReview = Math.pow(2, stats.difficulty); // 1, 2, 4, 8, 16, 32 days
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + daysUntilReview);
  stats.nextReview = nextReview.toISOString();
  
  saveProgress(progress);
};

export const markWordIncorrect = (wordId) => {
  const progress = getProgress();
  
  // Initialize word stats if not exists
  if (!progress.wordStats[wordId]) {
    progress.wordStats[wordId] = {
      correct: 0,
      incorrect: 0,
      lastReviewed: null,
      nextReview: null,
      difficulty: 0,
      timesReviewed: 0
    };
  }
  
  const stats = progress.wordStats[wordId];
  stats.incorrect = (stats.incorrect || 0) + 1;
  stats.difficulty = Math.max(0, stats.difficulty - 1); // Reduce difficulty when incorrect
  
  // Set next review sooner for incorrect words
  const now = new Date();
  stats.lastReviewed = now.toISOString();
  const nextReview = new Date(now);
  nextReview.setHours(nextReview.getHours() + 1); // Review again in 1 hour
  stats.nextReview = nextReview.toISOString();
  
  // Add to weak words if not already there
  if (!progress.weakWords.includes(wordId)) {
    progress.weakWords.push(wordId);
  }
  
  // Remove from learned words if accuracy is too low
  const totalAttempts = stats.correct + stats.incorrect;
  if (totalAttempts >= 3) {
    const accuracy = stats.correct / totalAttempts;
    if (accuracy < 0.5 && progress.learnedWords.includes(wordId)) {
      progress.learnedWords = progress.learnedWords.filter(id => id !== wordId);
    }
  }
  
  saveProgress(progress);
};

export const markWordCorrect = (wordId) => {
  const progress = getProgress();
  
  // Initialize word stats if not exists
  if (!progress.wordStats[wordId]) {
    progress.wordStats[wordId] = {
      correct: 0,
      incorrect: 0,
      lastReviewed: null,
      nextReview: null,
      difficulty: 0,
      timesReviewed: 0
    };
  }
  
  const stats = progress.wordStats[wordId];
  stats.correct = (stats.correct || 0) + 1;
  
  // Remove from weak words if correct multiple times
  if (stats.correct >= 2 && progress.weakWords.includes(wordId)) {
    progress.weakWords = progress.weakWords.filter(id => id !== wordId);
  }
  
  // Mark as learned if correct enough times
  if (stats.correct >= 3 && !progress.learnedWords.includes(wordId)) {
    markWordLearned(wordId);
  } else {
    saveProgress(progress);
  }
};

export const getWordsForReview = (allWords) => {
  const progress = getProgress();
  const now = new Date();
  
  // Get words that are due for review
  const dueForReview = allWords.filter(word => {
    const stats = progress.wordStats[word.id];
    if (!stats || !stats.nextReview) return false;
    return new Date(stats.nextReview) <= now;
  });
  
  // Also include weak words
  const weakWords = allWords.filter(word => progress.weakWords.includes(word.id));
  
  // Combine and remove duplicates
  const reviewWords = [...new Set([...dueForReview, ...weakWords].map(w => w.id))];
  return allWords.filter(word => reviewWords.includes(word.id));
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
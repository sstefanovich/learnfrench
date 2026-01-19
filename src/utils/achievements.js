// Achievement system

export const ACHIEVEMENTS = {
  FIRST_STEPS: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first learning session',
    icon: '👶',
    condition: (progress) => progress.stats.totalSessions >= 1
  },
  WEEK_WARRIOR: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    condition: (progress) => progress.streak >= 7
  },
  MONTH_MASTER: {
    id: 'month_master',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    condition: (progress) => progress.streak >= 30
  },
  CATEGORY_MASTER: {
    id: 'category_master',
    name: 'Category Master',
    description: 'Master 100% of words in any category',
    icon: '⭐',
    condition: (progress, allCategories) => {
      return allCategories.some(category => {
        const categoryWords = category.words || [];
        const learnedInCategory = progress.learnedWords.filter(wordId => {
          return categoryWords.some(w => w.id === wordId);
        }).length;
        return categoryWords.length > 0 && learnedInCategory === categoryWords.length;
      });
    }
  },
  WORD_COLLECTOR: {
    id: 'word_collector',
    name: 'Word Collector',
    description: 'Learn 50 words',
    icon: '📚',
    condition: (progress) => progress.learnedWords.length >= 50
  },
  WORD_MASTER: {
    id: 'word_master',
    name: 'Word Master',
    description: 'Learn 100 words',
    icon: '👑',
    condition: (progress) => progress.learnedWords.length >= 100
  },
  PERFECT_SCORE: {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Score 100% in any quiz',
    icon: '💯',
    condition: (progress) => {
      // Check if any session had perfect score
      return progress.stats.accuracyHistory?.some(acc => acc >= 100);
    }
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a quiz in under 2 minutes',
    icon: '⚡',
    condition: (progress) => {
      // This would need to be tracked separately
      return false; // Placeholder
    }
  },
  FLASHCARD_FANATIC: {
    id: 'flashcard_fanatic',
    name: 'Flashcard Fanatic',
    description: 'Complete 50 flashcard sessions',
    icon: '🃏',
    condition: (progress) => {
      // Track separately in stats
      return (progress.stats.flashcardSessions || 0) >= 50;
    }
  },
  QUIZ_WHIZ: {
    id: 'quiz_whiz',
    name: 'Quiz Whiz',
    description: 'Complete 50 quiz sessions',
    icon: '❓',
    condition: (progress) => {
      return (progress.stats.quizSessions || 0) >= 50;
    }
  }
};

export const checkAchievements = (progress, allCategories = []) => {
  const unlocked = [];
  
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    if (!progress.achievementsUnlocked[achievement.id]) {
      if (achievement.condition(progress, allCategories)) {
        progress.achievementsUnlocked[achievement.id] = new Date().toISOString();
        progress.achievements.push({
          id: achievement.id,
          unlockedAt: progress.achievementsUnlocked[achievement.id],
          ...achievement
        });
        unlocked.push(achievement);
      }
    }
  });
  
  return unlocked;
};

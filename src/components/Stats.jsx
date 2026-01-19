import { useState, useEffect } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { getProgress } from '../utils/progressStorage';
import './Stats.css';

function Stats() {
  const [progress, setProgress] = useState(getProgress());
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const getCategoryStats = () => {
    return vocabularyData.categories.map(category => {
      const categoryWords = category.words || [];
      const learnedInCategory = progress.learnedWords.filter(wordId => {
        return categoryWords.some(w => w.id === wordId);
      }).length;
      
      const wordStats = categoryWords.map(word => progress.wordStats?.[word.id] || {
        correct: 0,
        incorrect: 0,
        difficulty: 0
      });
      
      const totalCorrect = wordStats.reduce((sum, stat) => sum + stat.correct, 0);
      const totalIncorrect = wordStats.reduce((sum, stat) => sum + stat.incorrect, 0);
      const totalAttempts = totalCorrect + totalIncorrect;
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      
      return {
        category,
        learnedCount: learnedInCategory,
        totalWords: categoryWords.length,
        completion: categoryWords.length > 0 ? Math.round((learnedInCategory / categoryWords.length) * 100) : 0,
        accuracy,
        totalCorrect,
        totalIncorrect
      };
    });
  };

  const getWordsByDifficulty = () => {
    const wordsByDifficulty = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };
    
    vocabularyData.categories.forEach(category => {
      category.words.forEach(word => {
        const stats = progress.wordStats?.[word.id] || { difficulty: 0 };
        const difficulty = Math.min(5, Math.max(0, stats.difficulty));
        if (!wordsByDifficulty[difficulty]) wordsByDifficulty[difficulty] = [];
        wordsByDifficulty[difficulty].push({
          ...word,
          category: category.name,
          stats: stats
        });
      });
    });
    
    return wordsByDifficulty;
  };

  const getWeakWords = () => {
    return vocabularyData.categories.flatMap(category => {
      return category.words.filter(word => 
        progress.weakWords?.includes(word.id)
      ).map(word => ({
        ...word,
        category: category.name,
        stats: progress.wordStats?.[word.id] || { correct: 0, incorrect: 0, difficulty: 0 }
      }));
    });
  };

  const categoryStats = getCategoryStats();
  const wordsByDifficulty = getWordsByDifficulty();
  const weakWords = getWeakWords();
  const totalWords = vocabularyData.categories.reduce((sum, cat) => sum + (cat.words?.length || 0), 0);
  const totalLearned = progress.learnedWords.length;
  const overallCompletion = totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0;

  return (
    <div className="stats-container">
      <h1>📊 Statistics & Progress</h1>
      
      <div className="stats-tabs">
        <button 
          className={selectedView === 'overview' ? 'active' : ''}
          onClick={() => setSelectedView('overview')}
        >
          Overview
        </button>
        <button 
          className={selectedView === 'categories' ? 'active' : ''}
          onClick={() => setSelectedView('categories')}
        >
          Categories
        </button>
        <button 
          className={selectedView === 'difficulty' ? 'active' : ''}
          onClick={() => setSelectedView('difficulty')}
        >
          Difficulty
        </button>
        <button 
          className={selectedView === 'weak-words' ? 'active' : ''}
          onClick={() => setSelectedView('weak-words')}
        >
          Weak Words
        </button>
      </div>

      {selectedView === 'overview' && (
        <div className="stats-overview">
          <div className="stats-summary">
            <div className="stat-box">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <div className="stat-value">{totalLearned}</div>
                <div className="stat-label">Words Learned</div>
                <div className="stat-sub">{totalWords} total words</div>
              </div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon">📈</div>
              <div className="stat-info">
                <div className="stat-value">{overallCompletion}%</div>
                <div className="stat-label">Overall Progress</div>
                <div className="stat-sub">{totalLearned} / {totalWords}</div>
              </div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <div className="stat-value">{progress.streak || 0}</div>
                <div className="stat-label">Day Streak</div>
                <div className="stat-sub">Keep it up!</div>
              </div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <div className="stat-value">{progress.totalScore || 0}</div>
                <div className="stat-label">Total Score</div>
                <div className="stat-sub">Points earned</div>
              </div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <div className="stat-value">{weakWords.length}</div>
                <div className="stat-label">Words Needing Practice</div>
                <div className="stat-sub">Focus on these</div>
              </div>
            </div>
            
            <div className="stat-box">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">{progress.stats?.totalSessions || 0}</div>
                <div className="stat-label">Total Sessions</div>
                <div className="stat-sub">Practice sessions</div>
              </div>
            </div>
          </div>

          <div className="difficulty-breakdown">
            <h2>Words by Difficulty Level</h2>
            <div className="difficulty-bars">
              {[0, 1, 2, 3, 4, 5].map(level => {
                const count = wordsByDifficulty[level]?.length || 0;
                const percentage = totalWords > 0 ? (count / totalWords) * 100 : 0;
                const labels = ['New', 'Easy', 'Medium', 'Hard', 'Mastered', 'Expert'];
                return (
                  <div key={level} className="difficulty-bar-item">
                    <div className="difficulty-label">
                      <span>{labels[level]}</span>
                      <span className="difficulty-count">{count} words</span>
                    </div>
                    <div className="difficulty-bar">
                      <div 
                        className="difficulty-bar-fill" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'categories' && (
        <div className="stats-categories">
          <h2>Category Progress</h2>
          <div className="category-stats-grid">
            {categoryStats.map(({ category, learnedCount, totalWords, completion, accuracy, totalCorrect, totalIncorrect }) => (
              <div key={category.id} className="category-stat-card">
                <div className="category-stat-header">
                  <span className="category-icon">{category.icon}</span>
                  <h3>{category.name}</h3>
                </div>
                <div className="category-stat-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${completion}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {learnedCount} / {totalWords} words ({completion}%)
                  </div>
                </div>
                <div className="category-stat-details">
                  <div className="stat-detail">
                    <span className="detail-label">Accuracy:</span>
                    <span className="detail-value">{accuracy}%</span>
                  </div>
                  <div className="stat-detail">
                    <span className="detail-label">Correct:</span>
                    <span className="detail-value">{totalCorrect}</span>
                  </div>
                  <div className="stat-detail">
                    <span className="detail-label">Incorrect:</span>
                    <span className="detail-value">{totalIncorrect}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedView === 'difficulty' && (
        <div className="stats-difficulty">
          <h2>Words by Difficulty Level</h2>
          {[0, 1, 2, 3, 4, 5].map(level => {
            const words = wordsByDifficulty[level] || [];
            const labels = ['New', 'Easy', 'Medium', 'Hard', 'Mastered', 'Expert'];
            if (words.length === 0) return null;
            
            return (
              <div key={level} className="difficulty-section">
                <h3>{labels[level]} ({words.length} words)</h3>
                <div className="difficulty-words-grid">
                  {words.slice(0, 50).map(word => (
                    <div key={word.id} className="difficulty-word-card">
                      <div className="word-main">
                        <strong>{word.french}</strong>
                        <span className="word-translation">{word.english}</span>
                      </div>
                      <div className="word-stats">
                        <span>✓ {word.stats?.correct || 0}</span>
                        <span>✗ {word.stats?.incorrect || 0}</span>
                        <span className="word-category">{word.category}</span>
                      </div>
                    </div>
                  ))}
                  {words.length > 50 && (
                    <div className="difficulty-word-card more-words">
                      +{words.length - 50} more words
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedView === 'weak-words' && (
        <div className="stats-weak-words">
          <h2>Words Needing Practice ({weakWords.length})</h2>
          {weakWords.length === 0 ? (
            <div className="no-weak-words">
              <p>🎉 Great job! You don't have any weak words right now. Keep practicing!</p>
            </div>
          ) : (
            <div className="weak-words-grid">
              {weakWords.map(word => (
                <div key={word.id} className="weak-word-card">
                  <div className="word-main">
                    <strong>{word.french}</strong>
                    <span className="word-translation">{word.english}</span>
                  </div>
                  <div className="word-stats">
                    <span className="stat-correct">✓ {word.stats?.correct || 0}</span>
                    <span className="stat-incorrect">✗ {word.stats?.incorrect || 0}</span>
                    <span className="word-category">{word.category}</span>
                  </div>
                  {word.pronunciation && (
                    <div className="word-pronunciation">/{word.pronunciation}/</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Stats;

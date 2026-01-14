import { useState } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { getProgress } from '../utils/progressStorage';
import './Dashboard.css';

function Dashboard({ onSelectCategory, onSelectGameMode }) {
  const progress = getProgress();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedMode(null);
  };
  
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    if (selectedCategory) {
      onSelectCategory(selectedCategory);
      onSelectGameMode(mode);
    }
  };
  
  const getCategoryProgress = (categoryId) => {
    const catProgress = progress.categoryProgress[categoryId];
    if (!catProgress) return 0;
    
    const category = vocabularyData.categories.find(cat => cat.id === categoryId);
    const totalWords = category?.words.length || 0;
    const learnedInCategory = progress.learnedWords.filter(wordId => {
      return category?.words.some(w => w.id === wordId);
    }).length;
    
    return totalWords > 0 ? Math.round((learnedInCategory / totalWords) * 100) : 0;
  };
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🇫🇷 Learn French for Vacation</h1>
        <p className="subtitle">Master essential French vocabulary for your trip!</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{progress.learnedWords.length}</div>
          <div className="stat-label">Words Learned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.totalScore}</div>
          <div className="stat-label">Total Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{progress.streak || 0}</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>
      
      {!selectedCategory ? (
        <div className="categories-section">
          <h2>Choose a Category</h2>
          <div className="categories-grid">
            {vocabularyData.categories.map(category => {
              const progressPercent = getCategoryProgress(category.id);
              const learnedInCategory = progress.learnedWords.filter(wordId => {
                return category.words.some(w => w.id === wordId);
              }).length;
              
              return (
                <button
                  key={category.id}
                  className="category-card"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <h3>{category.name}</h3>
                  <p className="category-word-count">{category.words.length} words</p>
                  <div className="category-progress">
                    <div className="category-progress-bar">
                      <div 
                        className="category-progress-fill" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <span className="category-progress-text">
                      {learnedInCategory}/{category.words.length} learned
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="game-mode-section">
          <button 
            className="back-button"
            onClick={() => setSelectedCategory(null)}
          >
            ← Back to Categories
          </button>
          
          <h2>Choose a Game Mode</h2>
          <div className="game-modes">
            <button
              className={`game-mode-card ${selectedMode === 'flashcard' ? 'selected' : ''}`}
              onClick={() => handleModeSelect('flashcard')}
            >
              <span className="mode-icon">🃏</span>
              <h3>Flashcards</h3>
              <p>Flip cards to learn French words and phrases</p>
            </button>
            
            <button
              className={`game-mode-card ${selectedMode === 'quiz' ? 'selected' : ''}`}
              onClick={() => handleModeSelect('quiz')}
            >
              <span className="mode-icon">❓</span>
              <h3>Quiz</h3>
              <p>Test your knowledge with multiple choice questions</p>
            </button>
            
            <button
              className={`game-mode-card ${selectedMode === 'matching' ? 'selected' : ''}`}
              onClick={() => handleModeSelect('matching')}
            >
              <span className="mode-icon">🔗</span>
              <h3>Matching</h3>
              <p>Match French words with their English translations</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
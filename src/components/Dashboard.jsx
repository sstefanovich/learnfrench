import { useState, useEffect } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { getProgress } from '../utils/progressStorage';
import { getSettings, updatePronunciationSpeed } from '../utils/settingsStorage';
import { speak, isAvailable } from '../utils/speech';
import './Dashboard.css';

function Dashboard({ onSelectCategory, onSelectGameMode }) {
  const progress = getProgress();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pronunciationSpeed, setPronunciationSpeed] = useState(0.8);
  
  useEffect(() => {
    const settings = getSettings();
    setPronunciationSpeed(settings.pronunciationSpeed || 0.8);
  }, []);
  
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
  
  const handleSpeedChange = (event) => {
    const newSpeed = parseFloat(event.target.value);
    setPronunciationSpeed(newSpeed);
    updatePronunciationSpeed(newSpeed);
    
    // Test pronunciation if available
    if (isAvailable()) {
      speak('Bonjour', { rate: newSpeed });
    }
  };
  
  const getSpeedLabel = (speed) => {
    if (speed <= 0.5) return 'Very Slow';
    if (speed <= 0.7) return 'Slow';
    if (speed <= 0.9) return 'Moderate';
    if (speed <= 1.1) return 'Normal';
    if (speed <= 1.3) return 'Fast';
    return 'Very Fast';
  };
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-top">
          <div className="dashboard-header-top-left"></div>
          <h1 className="dashboard-header-title">🇫🇷 Learn French for Vacation</h1>
          <div className="dashboard-header-top-right">
            <button
              className="settings-button"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
        <p className="subtitle">Master essential French vocabulary for your trip!</p>
      </div>
      
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>⚙️ Settings</h3>
            <button
              className="close-settings-button"
              onClick={() => setShowSettings(false)}
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>
          
          <div className="settings-content">
            <div className="setting-item">
              <label htmlFor="pronunciation-speed">
                Pronunciation Speed: <strong>{getSpeedLabel(pronunciationSpeed)}</strong> ({pronunciationSpeed.toFixed(2)}x)
              </label>
              <div className="speed-control">
                <span className="speed-label">Slow</span>
                <input
                  id="pronunciation-speed"
                  type="range"
                  min="0.3"
                  max="1.5"
                  step="0.05"
                  value={pronunciationSpeed}
                  onChange={handleSpeedChange}
                  className="speed-slider"
                />
                <span className="speed-label">Fast</span>
              </div>
              <p className="setting-description">
                Adjust how fast French words are pronounced. Current speed: {Math.round(pronunciationSpeed * 100)}% of normal speed.
              </p>
            </div>
            
            <div className="setting-item">
              <button
                className="test-pronunciation-button"
                onClick={() => {
                  if (isAvailable()) {
                    speak('Bonjour, comment allez-vous?', { rate: pronunciationSpeed });
                  } else {
                    alert('Speech synthesis is not available in your browser.');
                  }
                }}
                disabled={!isAvailable()}
              >
                🔊 Test Pronunciation
              </button>
              {!isAvailable() && (
                <p className="setting-description" style={{ color: '#999', fontSize: '0.85rem' }}>
                  Speech synthesis is not available in your browser.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
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
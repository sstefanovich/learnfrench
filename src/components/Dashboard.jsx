import { useState, useEffect, useRef } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { getProgress, saveProgress, resetProgress } from '../utils/progressStorage';
import { getSettings, updatePronunciationSpeed, updateSetting, toggleDarkMode, applyDarkMode, saveSettings } from '../utils/settingsStorage';
import { speak, isAvailable } from '../utils/speech';
import { checkAchievements, unlockAchievements } from '../utils/achievements';
import Stats from './Stats';
import './Dashboard.css';

function Dashboard({ onSelectCategory, onSelectGameMode }) {
  const progress = getProgress();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [pronunciationSpeed, setPronunciationSpeed] = useState(0.8);
  const [settings, setSettings] = useState(getSettings());
  const [searchTerm, setSearchTerm] = useState('');
  const [practiceWeakWords, setPracticeWeakWords] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [gameDifficulty, setGameDifficulty] = useState('medium');
  const [showAchievements, setShowAchievements] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const achievementCheckRef = useRef(false);
  const lastProgressRef = useRef(null);
  
  useEffect(() => {
    const currentSettings = getSettings();
    setPronunciationSpeed(currentSettings.pronunciationSpeed || 0.8);
    setSettings(currentSettings);
    applyDarkMode(currentSettings.darkMode);
  }, []);
  
  // Check for achievements separately to avoid infinite loops
  useEffect(() => {
    // Only check if not already showing achievements and progress has actually changed
    if (showAchievements || achievementCheckRef.current) {
      return;
    }
    
    // Create a stable reference to compare
    const progressKey = JSON.stringify({
      learnedWords: progress.learnedWords.length,
      streak: progress.streak,
      totalScore: progress.totalScore,
      totalSessions: progress.stats?.totalSessions || 0
    });
    
    // Only check if progress actually changed
    if (lastProgressRef.current === progressKey) {
      return;
    }
    
    lastProgressRef.current = progressKey;
    achievementCheckRef.current = true;
    
    // Use setTimeout to defer achievement check and avoid blocking
    setTimeout(() => {
      try {
        const newAchievements = checkAchievements(progress, vocabularyData.categories);
        if (newAchievements.length > 0) {
          // Unlock achievements and save progress
          const updatedProgress = unlockAchievements(progress, newAchievements);
          saveProgress(updatedProgress);
          
          setUnlockedAchievements(newAchievements);
          setShowAchievements(true);
        }
      } catch (error) {
        console.error('Error checking achievements:', error);
      } finally {
        achievementCheckRef.current = false;
      }
    }, 100);
  }, [progress, showAchievements]);
  
  // Reset achievement check flag when popup is closed
  useEffect(() => {
    if (!showAchievements) {
      achievementCheckRef.current = false;
    }
  }, [showAchievements]);
  
  // Add keyboard handler to close achievement popup with Escape key
  useEffect(() => {
    if (showAchievements) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setShowAchievements(false);
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showAchievements]);
  
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedMode(null);
  };
  
  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    const categoriesToUse = selectedCategories.length > 0 ? selectedCategories : (selectedCategory ? [selectedCategory] : []);
    if (categoriesToUse.length > 0 || selectedCategory) {
      // Pass additional props for mixed categories, weak words mode, and difficulty
      onSelectCategory(selectedCategories.length > 0 ? selectedCategories : selectedCategory);
      onSelectGameMode(mode, { 
        practiceWeakWords, 
        difficulty: gameDifficulty,
        categories: selectedCategories.length > 0 ? selectedCategories : null
      });
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
          <h1 className="dashboard-header-title">Learn the French Basics</h1>
          <div className="dashboard-header-top-right">
            <button
              className="stats-button"
              onClick={() => setShowStats(!showStats)}
              title="Statistics"
              aria-label="View statistics"
            >
              📊
            </button>
            <button
              className="settings-button"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
              aria-label="Open settings"
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
              <label htmlFor="flashcard-count">
                Flashcard Count: <strong>{settings.flashcardCount || 25}</strong> cards
              </label>
              <input
                id="flashcard-count"
                type="range"
                min="5"
                max="50"
                step="5"
                value={settings.flashcardCount || 25}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  updateSetting('flashcardCount', count);
                  setSettings({ ...settings, flashcardCount: count });
                }}
                className="speed-slider"
              />
              <p className="setting-description">
                Number of flashcard to practice per session. Current: {settings.flashcardCount || 25} cards.
              </p>
            </div>
            
            <div className="setting-item">
              <label htmlFor="game-difficulty">
                Game Difficulty: <strong>{settings.gameDifficulty || 'medium'}</strong>
              </label>
              <select
                id="game-difficulty"
                value={settings.gameDifficulty || 'medium'}
                onChange={(e) => {
                  const difficulty = e.target.value;
                  updateSetting('gameDifficulty', difficulty);
                  setSettings({ ...settings, gameDifficulty: difficulty });
                  setGameDifficulty(difficulty);
                }}
                className="setting-select"
              >
                <option value="easy">Easy (Only learned words)</option>
                <option value="medium">Medium (Mix of all words)</option>
                <option value="hard">Hard (Mostly new words)</option>
              </select>
              <p className="setting-description">
                Choose the difficulty level for games.
              </p>
            </div>
            
            <div className="setting-item">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.soundEffects !== false}
                  onChange={(e) => {
                    updateSetting('soundEffects', e.target.checked);
                    setSettings({ ...settings, soundEffects: e.target.checked });
                  }}
                />
                <span>Enable Sound Effects</span>
              </label>
              <p className="setting-description">
                Play sounds for correct/incorrect answers.
              </p>
            </div>
            
            <div className="setting-item">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.keyboardShortcuts !== false}
                  onChange={(e) => {
                    updateSetting('keyboardShortcuts', e.target.checked);
                    setSettings({ ...settings, keyboardShortcuts: e.target.checked });
                  }}
                />
                <span>Enable Keyboard Shortcuts</span>
              </label>
              <p className="setting-description">
                Use spacebar to flip cards, arrow keys for navigation.
              </p>
            </div>
            
            <div className="setting-item">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.autoPronounce !== false}
                  onChange={(e) => {
                    updateSetting('autoPronounce', e.target.checked);
                    setSettings({ ...settings, autoPronounce: e.target.checked });
                  }}
                />
                <span>Auto-Pronounce on Flip</span>
              </label>
              <p className="setting-description">
                Automatically pronounce words when flashcards are flipped.
              </p>
            </div>
            
            <div className="setting-item">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.hintsEnabled !== false}
                  onChange={(e) => {
                    updateSetting('hintsEnabled', e.target.checked);
                    setSettings({ ...settings, hintsEnabled: e.target.checked });
                  }}
                />
                <span>Enable Hints</span>
              </label>
              <p className="setting-description">
                Show hints in quiz and typing modes.
              </p>
            </div>
            
            <div className="setting-item">
              <label className="setting-checkbox">
                <input
                  type="checkbox"
                  checked={settings.darkMode === true}
                  onChange={(e) => {
                    const darkMode = e.target.checked;
                    toggleDarkMode();
                    setSettings({ ...settings, darkMode });
                  }}
                />
                <span>Dark Mode</span>
              </label>
              <p className="setting-description">
                Switch to dark theme.
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
            
            <div className="setting-item">
              <h4 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Data Management</h4>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  className="export-button"
                  onClick={() => {
                    const progressData = getProgress();
                    const settingsData = getSettings();
                    const data = {
                      progress: progressData,
                      settings: settingsData,
                      exportDate: new Date().toISOString(),
                      version: '1.0'
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `learnfrench-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  📥 Export Progress
                </button>
                
                <button
                  className="import-button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const data = JSON.parse(event.target.result);
                            if (data.progress) {
                              saveProgress(data.progress);
                            }
                            if (data.settings) {
                              saveSettings(data.settings);
                              setSettings(data.settings);
                              applyDarkMode(data.settings.darkMode);
                            }
                            alert('Progress imported successfully!');
                            window.location.reload();
                          } catch (error) {
                            alert('Error importing file. Please check the file format.');
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                >
                  📤 Import Progress
                </button>
                
                <button
                  className="reset-button"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
                      resetProgress();
                      alert('Progress has been reset.');
                      window.location.reload();
                    }
                  }}
                >
                  🔄 Reset Progress
                </button>
              </div>
              <p className="setting-description">
                Export your progress to backup, import from a backup, or reset all progress.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {showStats && (
        <div className="stats-view">
          <button className="close-stats-button" onClick={() => setShowStats(false)}>
            ← Back to Dashboard
          </button>
          <Stats />
        </div>
      )}
      
      {showAchievements && unlockedAchievements.length > 0 && (
        <div 
          className="achievement-popup"
          onClick={(e) => {
            // Close when clicking the backdrop (outside the content)
            if (e.target === e.currentTarget) {
              setShowAchievements(false);
            }
          }}
        >
          <div 
            className="achievement-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="achievement-header">
              <h3>🏆 Achievement Unlocked!</h3>
              <button
                className="achievement-close-button"
                onClick={() => setShowAchievements(false)}
                aria-label="Close achievement popup"
                title="Close"
              >
                ✕
              </button>
            </div>
            {unlockedAchievements.map(achievement => (
              <div key={achievement.id} className="achievement-item">
                <span className="achievement-icon">{achievement.icon}</span>
                <div>
                  <strong>{achievement.name}</strong>
                  <p>{achievement.description}</p>
                </div>
              </div>
            ))}
            <button 
              className="achievement-ok-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAchievements(false);
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      
      {!showStats && (
        <>
      
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
      
      <div className="practice-mode-toggle">
        <label className="practice-mode-checkbox">
          <input
            type="checkbox"
            checked={practiceWeakWords}
            onChange={(e) => setPracticeWeakWords(e.target.checked)}
          />
          <span>🎯 Practice Weak Words Only</span>
        </label>
        <p className="practice-mode-description">
          {practiceWeakWords 
            ? `Focus on ${progress.weakWords?.length || 0} words that need more practice`
            : 'Practice all words from selected category'}
        </p>
      </div>
      
      {!selectedCategory ? (
        <div className="categories-section">
          <div className="section-header">
            <h2>Choose a Category</h2>
            {searchTerm && (
              <div className="search-results-count">
                Showing results for "{searchTerm}"
              </div>
            )}
          </div>
          
          <div className="search-section">
            <input
              type="text"
              placeholder="🔍 Search categories or words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="categories-grid" role="grid">
            {vocabularyData.categories
              .filter(category => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();
                return category.name.toLowerCase().includes(searchLower) ||
                       category.words.some(w => 
                         w.french.toLowerCase().includes(searchLower) ||
                         w.english.toLowerCase().includes(searchLower)
                       );
              })
              .map(category => {
                const progressPercent = getCategoryProgress(category.id);
                const learnedInCategory = progress.learnedWords.filter(wordId => {
                  return category.words.some(w => w.id === wordId);
                }).length;
                
                return (
                  <button
                    key={category.id}
                    className="category-card"
                    onClick={() => handleCategorySelect(category.id)}
                    aria-label={`Select ${category.name} category, ${learnedInCategory} of ${category.words.length} words learned`}
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
            
            <button
              className={`game-mode-card ${selectedMode === 'typing' ? 'selected' : ''}`}
              onClick={() => handleModeSelect('typing')}
            >
              <span className="mode-icon">⌨️</span>
              <h3>Typing</h3>
              <p>Type translations to practice spelling</p>
            </button>
            
            <button
              className={`game-mode-card ${selectedMode === 'pronunciation' ? 'selected' : ''}`}
              onClick={() => handleModeSelect('pronunciation')}
            >
              <span className="mode-icon">🎤</span>
              <h3>Pronunciation</h3>
              <p>Practice speaking French words</p>
            </button>
          </div>
        </div>
        )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
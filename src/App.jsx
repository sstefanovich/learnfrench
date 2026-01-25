import { useState } from 'react';
import vocabularyData from './data/vocabulary.json';
import Dashboard from './components/Dashboard';
import Flashcard from './components/Flashcard';
import Quiz from './components/Quiz';
import Matching from './components/Matching';
import Typing from './components/Typing';
import Pronunciation from './components/Pronunciation';
import GameResults from './components/GameResults';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGameMode, setSelectedGameMode] = useState(null);
  const [gameResults, setGameResults] = useState(null);
  const [gameOptions, setGameOptions] = useState({});
  const [gameKey, setGameKey] = useState(0); // Key to force remount of game components
  
  const handleCategorySelect = (categoryId, options = {}) => {
    setSelectedCategory(categoryId);
    setGameOptions(options);
    setGameKey(prev => prev + 1); // Increment key to force fresh component
    setCurrentView('game');
  };
  
  const handleGameModeSelect = (mode, options = {}) => {
    setSelectedGameMode(mode);
    setGameOptions(options);
    setGameKey(prev => prev + 1); // Increment key to force fresh component
    setCurrentView('game');
  };
  
  const handleGameComplete = (score, total) => {
    const category = vocabularyData.categories.find(cat => cat.id === selectedCategory);
    setGameResults({
      score,
      total,
      gameMode: selectedGameMode,
      categoryName: category?.name || 'Unknown'
    });
    setCurrentView('results');
  };
  
  const handleRestart = () => {
    setGameResults(null);
    setGameKey(prev => prev + 1); // Increment key to force fresh component
    setCurrentView('game');
  };
  
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedCategory(null);
    setSelectedGameMode(null);
    setGameResults(null);
    setGameKey(prev => prev + 1); // Increment key to ensure fresh component on next game
  };
  
  const renderGame = () => {
    if (!selectedCategory || !selectedGameMode) {
      return null;
    }
    
    const commonProps = {
      categoryId: selectedCategory,
      onComplete: handleGameComplete,
      practiceWeakWords: gameOptions.practiceWeakWords || false,
      difficulty: gameOptions.difficulty || 'medium'
    };
    
    switch (selectedGameMode) {
      case 'flashcard':
        return <Flashcard key={gameKey} {...commonProps} />;
      case 'quiz':
        return <Quiz key={gameKey} {...commonProps} />;
      case 'matching':
        return <Matching key={gameKey} {...commonProps} />;
      case 'typing':
        return <Typing key={gameKey} {...commonProps} />;
      case 'pronunciation':
        return <Pronunciation key={gameKey} {...commonProps} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="app">
      <div className="app-container">
        {currentView === 'dashboard' && (
          <Dashboard 
            onSelectCategory={handleCategorySelect}
            onSelectGameMode={handleGameModeSelect}
          />
        )}
        
        {currentView === 'game' && (
          <div className="game-view">
            <button 
              className="exit-game-button"
              onClick={handleBackToDashboard}
            >
              ← Exit Game
            </button>
            {renderGame()}
          </div>
        )}
        
        {currentView === 'results' && gameResults && (
          <GameResults
            score={gameResults.score}
            total={gameResults.total}
            gameMode={gameResults.gameMode}
            categoryName={gameResults.categoryName}
            onRestart={handleRestart}
            onBackToDashboard={handleBackToDashboard}
          />
        )}
      </div>
    </div>
  );
}

export default App;
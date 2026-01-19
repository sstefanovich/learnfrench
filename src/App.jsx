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
  
  const handleCategorySelect = (categoryId, options = {}) => {
    setSelectedCategory(categoryId);
    setGameOptions(options);
    setCurrentView('game');
  };
  
  const handleGameModeSelect = (mode, options = {}) => {
    setSelectedGameMode(mode);
    setGameOptions(options);
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
    setCurrentView('game');
  };
  
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedCategory(null);
    setSelectedGameMode(null);
    setGameResults(null);
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
        return <Flashcard {...commonProps} />;
      case 'quiz':
        return <Quiz {...commonProps} />;
      case 'matching':
        return <Matching {...commonProps} />;
      case 'typing':
        return <Typing {...commonProps} />;
      case 'pronunciation':
        return <Pronunciation {...commonProps} />;
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
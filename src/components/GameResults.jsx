import { useState } from 'react';
import './GameResults.css';

function GameResults({ score, total, gameMode, categoryName, onRestart, onBackToDashboard }) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const [showDetails, setShowDetails] = useState(false);
  
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { emoji: '🌟', text: 'Excellent! You\'re a French master!', color: '#11998e' };
    if (percentage >= 70) return { emoji: '👍', text: 'Great job! Keep practicing!', color: '#4a90e2' };
    if (percentage >= 50) return { emoji: '💪', text: 'Good effort! Keep learning!', color: '#f093fb' };
    return { emoji: '📚', text: 'Keep practicing! You\'re learning!', color: '#ee0979' };
  };
  
  const performance = getPerformanceMessage();
  
  return (
    <div className="game-results">
      <div className="results-card">
        <div className="results-header">
          <span className="results-emoji">{performance.emoji}</span>
          <h2>Game Complete!</h2>
          <p className="results-category">{categoryName}</p>
        </div>
        
        <div className="results-score">
          <div className="score-circle" style={{ '--percentage': percentage, '--color': performance.color }}>
            <div className="score-inner">
              <span className="score-value">{percentage}%</span>
              <span className="score-label">Score</span>
            </div>
          </div>
          <div className="score-details">
            <div className="score-stat">
              <span className="stat-label">Correct:</span>
              <span className="stat-value">{score}</span>
            </div>
            <div className="score-stat">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{total}</span>
            </div>
          </div>
        </div>
        
        <div className="results-message" style={{ color: performance.color }}>
          {performance.text}
        </div>
        
        <div className="results-actions">
          <button className="btn-primary" onClick={onRestart}>
            Play Again
          </button>
          <button className="btn-secondary" onClick={onBackToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameResults;
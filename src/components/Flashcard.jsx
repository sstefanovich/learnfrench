import { useState, useEffect } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { markWordLearned, getProgress } from '../utils/progressStorage';
import { speak, stop, isAvailable } from '../utils/speech';
import './Flashcard.css';

function Flashcard({ categoryId, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [words, setWords] = useState([]);
  
  const category = vocabularyData.categories.find(cat => cat.id === categoryId);
  const progress = getProgress();
  const learnedWords = progress.learnedWords || [];
  
  // Function to shuffle an array (Fisher-Yates shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Initialize random selection of words when component mounts or category changes
  useEffect(() => {
    if (category?.words) {
      const allWords = category.words;
      // Randomly select up to 25 words, or all words if there are fewer than 25
      const maxWords = 25;
      const selectedCount = Math.min(maxWords, allWords.length);
      
      // Create a shuffled copy of all words, then take the first selectedCount
      const shuffled = shuffleArray(allWords);
      const selectedWords = shuffled.slice(0, selectedCount);
      
      setWords(selectedWords);
      setCurrentIndex(0);
      setCorrectCount(0);
      setFlipped(false);
      setShowResult(false);
    }
  }, [categoryId]);
  
  const currentWord = words[currentIndex];
  const isComplete = currentIndex >= words.length;
  const progressPercentage = words.length > 0 ? ((currentIndex) / words.length) * 100 : 0;
  
  useEffect(() => {
    setFlipped(false);
    setShowResult(false);
    // Stop any ongoing speech when card changes
    stop();
  }, [currentIndex]);
  
  // Automatically pronounce when card is flipped to show English side
  useEffect(() => {
    if (flipped && currentWord && isAvailable()) {
      // Small delay to let the flip animation complete
      const timeoutId = setTimeout(() => {
        speak(currentWord.french);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [flipped, currentWord]);
  
  const handleSpeak = (e) => {
    e.stopPropagation(); // Prevent card flip when clicking speaker
    if (currentWord && !flipped) {
      speak(currentWord.french);
    }
  };
  
  const handleFlip = () => {
    setFlipped(!flipped);
  };
  
  const handleNext = (wasCorrect) => {
    if (wasCorrect) {
      setCorrectCount(c => c + 1);
      if (currentWord) {
        markWordLearned(currentWord.id);
      }
    }
    
    setShowResult(true);
    
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        onComplete(correctCount + (wasCorrect ? 1 : 0), words.length);
      }
    }, 1500);
  };
  
  if (isComplete) {
    return null;
  }
  
  if (!currentWord) {
    return <div>No words available</div>;
  }
  
  const isLearned = learnedWords.includes(currentWord.id);
  
  return (
    <div className="flashcard-container">
      <div className="flashcard-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <span className="progress-text">{currentIndex + 1} / {words.length}</span>
      </div>
      
      <div 
        className={`flashcard ${flipped ? 'flipped' : ''} ${isLearned ? 'learned' : ''}`}
        onClick={handleFlip}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front">
          <div className="flashcard-content">
            <div className="word-header">
              <h2>{currentWord.french}</h2>
              {isAvailable() && (
                <button 
                  className="speaker-button"
                  onClick={handleSpeak}
                  aria-label="Listen to pronunciation"
                  title="Listen to pronunciation"
                >
                  🔊
                </button>
              )}
            </div>
            {currentWord.pronunciation && (
              <p className="pronunciation">/{currentWord.pronunciation}/</p>
            )}
            {isLearned && <span className="learned-badge">✓ Learned</span>}
            <p className="hint">Click to flip</p>
          </div>
        </div>
        
        <div className="flashcard-back">
          <div className="flashcard-content">
            <h2>{currentWord.english}</h2>
            {currentWord.example && (
              <p className="example">"{currentWord.example}"</p>
            )}
            <p className="hint">Click to flip back</p>
          </div>
        </div>
        </div>
      </div>
      
      {flipped && !showResult && (
        <div className="flashcard-actions">
          <button 
            className="btn-wrong"
            onClick={() => handleNext(false)}
          >
            ❌ Need Practice
          </button>
          <button 
            className="btn-correct"
            onClick={() => handleNext(true)}
          >
            ✓ Got It!
          </button>
        </div>
      )}
      
      {showResult && (
        <div className="result-message">
          {correctCount > 0 && <p>Great job! Keep going!</p>}
        </div>
      )}
    </div>
  );
}

export default Flashcard;
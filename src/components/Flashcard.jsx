import { useState, useEffect } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { markWordLearned, markWordCorrect, markWordIncorrect, getWordsForReview, getProgress } from '../utils/progressStorage';
import { speak, stop, isAvailable } from '../utils/speech';
import { playCorrectSound, playIncorrectSound, playFlipSound } from '../utils/sounds';
import { getSettings } from '../utils/settingsStorage';
import './Flashcard.css';

function Flashcard({ categoryId, onComplete, practiceWeakWords = false, difficulty = 'medium' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [words, setWords] = useState([]);
  
  const category = vocabularyData.categories.find(cat => cat.id === categoryId);
  const progress = getProgress();
  const learnedWords = progress.learnedWords || [];
  const settings = getSettings();
  
  // Function to shuffle an array (Fisher-Yates shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Filter words based on difficulty level
  const filterByDifficulty = (words) => {
    if (difficulty === 'easy') {
      // Only show learned words
      return words.filter(w => learnedWords.includes(w.id));
    } else if (difficulty === 'hard') {
      // Only show unlearned or weak words
      return words.filter(w => !learnedWords.includes(w.id) || progress.weakWords?.includes(w.id));
    } else {
      // Medium: mix of all words
      return words;
    }
  };
  
  // Initialize random selection of words when component mounts or category changes
  useEffect(() => {
    // Reset all state first
    setCurrentIndex(0);
    setCorrectCount(0);
    setFlipped(false);
    setShowResult(false);
    
    if (category?.words) {
      let allWords = category.words;
      
      // Filter for weak words mode
      if (practiceWeakWords) {
        const weakWords = allWords.filter(w => progress.weakWords?.includes(w.id));
        if (weakWords.length > 0) {
          allWords = weakWords;
        }
      }
      
      // Filter by difficulty
      allWords = filterByDifficulty(allWords);
      
      // Get words for review if using spaced repetition
      if (!practiceWeakWords && difficulty === 'medium') {
        const reviewWords = getWordsForReview(allWords);
        if (reviewWords.length > 0) {
          // Mix review words with other words
          const otherWords = allWords.filter(w => !reviewWords.some(rw => rw.id === w.id));
          allWords = [...reviewWords, ...shuffleArray(otherWords).slice(0, Math.max(0, allWords.length - reviewWords.length))];
        }
      }
      
      // Use customizable count from settings
      const maxWords = settings.flashcardCount || 25;
      const selectedCount = Math.min(maxWords, allWords.length);
      
      // Create a shuffled copy of all words, then take the first selectedCount
      const shuffled = shuffleArray(allWords);
      const selectedWords = shuffled.slice(0, selectedCount);
      
      setWords(selectedWords);
    } else {
      // If no category or words, set empty array
      setWords([]);
    }
  }, [categoryId, practiceWeakWords, difficulty, settings.flashcardCount, category]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!settings.keyboardShortcuts) return;
    
    const handleKeyPress = (e) => {
      // Don't handle if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!showResult) {
          setFlipped(prev => !prev);
        }
      }
      
      if (flipped && !showResult) {
        if (e.key === '1' || e.key === 'ArrowLeft') {
          e.preventDefault();
          handleNext(false);
        }
        if (e.key === '2' || e.key === 'ArrowRight' || e.key === 'Enter') {
          e.preventDefault();
          handleNext(true);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [flipped, showResult, settings.keyboardShortcuts]);
  
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
    if (flipped && currentWord && isAvailable() && settings.autoPronounce) {
      // Small delay to let the flip animation complete
      const timeoutId = setTimeout(() => {
        speak(currentWord.french);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [flipped, currentWord, settings.autoPronounce]);
  
  const handleSpeak = (e) => {
    e.stopPropagation(); // Prevent card flip when clicking speaker
    if (currentWord && !flipped) {
      speak(currentWord.french);
    }
  };
  
  const handleFlip = () => {
    setFlipped(!flipped);
    if (settings.soundEffects) {
      playFlipSound();
    }
  };
  
  const handleNext = (wasCorrect) => {
    if (wasCorrect) {
      setCorrectCount(c => c + 1);
      if (currentWord) {
        markWordCorrect(currentWord.id);
      }
      if (settings.soundEffects) {
        playCorrectSound();
      }
    } else {
      if (currentWord) {
        markWordIncorrect(currentWord.id);
      }
      if (settings.soundEffects) {
        playIncorrectSound();
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
  
  // If no words available, show message
  if (words.length === 0) {
    return (
      <div className="flashcard-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>No words available</h3>
          <p>Try adjusting your difficulty settings or select a different category.</p>
        </div>
      </div>
    );
  }
  
  // If completed, show completion message briefly before calling onComplete
  if (isComplete) {
    return null;
  }
  
  if (!currentWord) {
    return (
      <div className="flashcard-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Loading...</h3>
        </div>
      </div>
    );
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
import { useState, useEffect } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { markWordCorrect, markWordIncorrect, updateCategoryProgress, getProgress, getWordsForReview } from '../utils/progressStorage';
import { speak, stop, isAvailable } from '../utils/speech';
import { playMatchSound, playIncorrectSound } from '../utils/sounds';
import { getSettings } from '../utils/settingsStorage';
import './Matching.css';

function Matching({ categoryId, onComplete, practiceWeakWords = false, difficulty = 'medium' }) {
  const [leftWords, setLeftWords] = useState([]);
  const [rightWords, setRightWords] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const category = vocabularyData.categories.find(cat => cat.id === categoryId);
  const allWords = category?.words || [];
  const progress = getProgress();
  const settings = getSettings();
  const learnedWords = progress.learnedWords || [];
  
  // Filter words based on mode and difficulty
  const filterWords = (words) => {
    let filtered = words;
    
    // Filter for weak words mode
    if (practiceWeakWords) {
      const weakWords = filtered.filter(w => progress.weakWords?.includes(w.id));
      if (weakWords.length > 0) {
        filtered = weakWords;
      }
    }
    
    // Filter by difficulty
    if (difficulty === 'easy') {
      filtered = filtered.filter(w => learnedWords.includes(w.id));
    } else if (difficulty === 'hard') {
      filtered = filtered.filter(w => !learnedWords.includes(w.id) || progress.weakWords?.includes(w.id));
    }
    
    return filtered;
  };
  
  useEffect(() => {
    let filteredWords = filterWords(allWords);
    
    // Get words for review if using spaced repetition
    if (!practiceWeakWords && difficulty === 'medium') {
      const reviewWords = getWordsForReview(filteredWords);
      if (reviewWords.length > 0) {
        const otherWords = filteredWords.filter(w => !reviewWords.some(rw => rw.id === w.id));
        filteredWords = [...reviewWords, ...otherWords.slice(0, Math.max(0, filteredWords.length - reviewWords.length))];
      }
    }
    
    // Select a random subset of words (12 words for matching game)
    const subsetSize = Math.min(12, filteredWords.length);
    const shuffledAll = [...filteredWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledAll.slice(0, subsetSize);
    
    // Create pairs from the selected subset
    const pairs = selectedWords.map(word => ({
      id: word.id,
      french: word.french,
      english: word.english,
      matched: false
    }));
    
    // Shuffle and split
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    const french = shuffled.map(p => ({ ...p, side: 'left' }));
    const english = [...shuffled].sort(() => Math.random() - 0.5)
      .map(p => ({ ...p, side: 'right' }));
    
    setLeftWords(french);
    setRightWords(english);
  }, [categoryId, allWords, practiceWeakWords, difficulty]);
  
  const totalWordsInGame = leftWords.length;
  
  useEffect(() => {
    if (matchedPairs.length < totalWordsInGame) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [matchedPairs, totalWordsInGame, startTime]);
  
  useEffect(() => {
    if (selectedLeft && selectedRight) {
      // Check if they match
      if (selectedLeft.id === selectedRight.id) {
        // Correct match
        setMatchedPairs(prev => [...prev, selectedLeft.id]);
        setScore(prev => prev + 1);
        markWordCorrect(selectedLeft.id);
        
        if (settings.soundEffects) {
          playMatchSound();
        }
        
        // Automatically pronounce the French word when match is made
        if (isAvailable() && selectedLeft.french && settings.autoPronounce) {
          speak(selectedLeft.french);
        }
        
        // Reset selection after a brief delay
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          
          // Check if game is complete
          if (matchedPairs.length + 1 >= totalWordsInGame) {
            const finalScore = score + 1;
            updateCategoryProgress(categoryId, finalScore);
            onComplete(finalScore, totalWordsInGame);
          }
        }, 500);
      } else {
        // Incorrect match
        markWordIncorrect(selectedLeft.id);
        if (settings.soundEffects) {
          playIncorrectSound();
        }
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 1000);
      }
    }
  }, [selectedLeft, selectedRight]);
  
  const handleLeftClick = (word) => {
    if (matchedPairs.includes(word.id)) return;
    setSelectedLeft(word);
    if (selectedRight && selectedRight.id === word.id) {
      // Auto-match if already selected on right
      return;
    }
  };
  
  const handleSpeak = (e, word) => {
    e.stopPropagation(); // Prevent word selection when clicking speaker
    speak(word.french);
  };
  
  const handleRightClick = (word) => {
    if (matchedPairs.includes(word.id)) return;
    setSelectedRight(word);
  };
  
  const isMatched = (wordId) => matchedPairs.includes(wordId);
  const isSelected = (word, side) => {
    if (side === 'left') return selectedLeft?.id === word.id;
    return selectedRight?.id === word.id;
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (allWords.length === 0) {
    return <div>No words available</div>;
  }
  
  return (
    <div className="matching-container">
      <div className="matching-header">
        <div className="matching-progress">
          <span>Matched: {matchedPairs.length} / {totalWordsInGame}</span>
          <span>Score: {score}</span>
          <span>Time: {formatTime(timeElapsed)}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${totalWordsInGame > 0 ? (matchedPairs.length / totalWordsInGame) * 100 : 0}%` }}
          ></div>
        </div>
      </div>
      
      <div className="matching-game">
        <div className="matching-column">
          <h3>French</h3>
          <div className="word-list">
            {leftWords.map((word) => {
              const matched = isMatched(word.id);
              const selected = isSelected(word, 'left');
              
              return (
                <button
                  key={word.id}
                  className={`matching-word ${matched ? 'matched' : ''} ${selected ? 'selected' : ''}`}
                  onClick={() => handleLeftClick(word)}
                  disabled={matched}
                >
                  <span className="word-text">{word.french}</span>
                  {isAvailable() && !matched && (
                    <button
                      className="matching-speaker-button"
                      onClick={(e) => handleSpeak(e, word)}
                      aria-label="Listen to pronunciation"
                      title="Listen to pronunciation"
                    >
                      🔊
                    </button>
                  )}
                  {matched && <span className="check-icon">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="matching-column">
          <h3>English</h3>
          <div className="word-list">
            {rightWords.map((word) => {
              const matched = isMatched(word.id);
              const selected = isSelected(word, 'right');
              
              return (
                <button
                  key={word.id}
                  className={`matching-word ${matched ? 'matched' : ''} ${selected ? 'selected' : ''}`}
                  onClick={() => handleRightClick(word)}
                  disabled={matched}
                >
                  {word.english}
                  {matched && <span className="check-icon">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {selectedLeft && selectedRight && selectedLeft.id === selectedRight.id && (
        <div className="match-feedback correct">
          ✓ Correct match!
        </div>
      )}
      
      {selectedLeft && selectedRight && selectedLeft.id !== selectedRight.id && (
        <div className="match-feedback incorrect">
          ✗ Try again!
        </div>
      )}
    </div>
  );
}

export default Matching;
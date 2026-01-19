import { useState, useEffect } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { markWordCorrect, markWordIncorrect, updateCategoryProgress, getProgress } from '../utils/progressStorage';
import { speak, stop, isAvailable } from '../utils/speech';
import { playCorrectSound, playIncorrectSound } from '../utils/sounds';
import { getSettings } from '../utils/settingsStorage';
import './Typing.css';

function Typing({ categoryId, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [words, setWords] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  
  const category = vocabularyData.categories.find(cat => cat.id === categoryId);
  const allWords = category?.words || [];
  const settings = getSettings();
  const progress = getProgress();
  
  // Initialize word list with randomization
  useEffect(() => {
    if (allWords.length > 0) {
      const maxWords = settings.flashcardCount || 25;
      const shuffled = [...allWords].sort(() => Math.random() - 0.5);
      const selectedWords = shuffled.slice(0, Math.min(maxWords, allWords.length));
      setWords(selectedWords);
      setStartTime(Date.now());
      setCurrentIndex(0);
      setScore(0);
    }
  }, [categoryId, allWords, settings.flashcardCount]);
  
  // Timer
  useEffect(() => {
    if (currentIndex < words.length) {
      const interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, words.length, startTime]);
  
  const currentWord = words[currentIndex];
  const isComplete = currentIndex >= words.length;
  const progressPercentage = words.length > 0 ? ((currentIndex) / words.length) * 100 : 0;
  
  // Randomly choose direction: French to English or English to French
  const [questionDirection, setQuestionDirection] = useState('french-to-english');
  
  useEffect(() => {
    if (currentWord) {
      // Randomly choose direction for each word
      setQuestionDirection(Math.random() > 0.5 ? 'french-to-english' : 'english-to-french');
      setInput('');
      setShowResult(false);
      setHintUsed(false);
      stop();
    }
  }, [currentIndex, currentWord]);
  
  const questionText = questionDirection === 'french-to-english' 
    ? currentWord?.french 
    : currentWord?.english;
  
  const correctAnswer = questionDirection === 'french-to-english'
    ? currentWord?.english.toLowerCase().trim()
    : currentWord?.french.toLowerCase().trim();
  
  const normalizeAnswer = (text) => {
    return text.toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents for comparison
  };
  
  const checkAnswer = () => {
    if (!currentWord || !input.trim()) return;
    
    const normalizedInput = normalizeAnswer(input);
    const normalizedCorrect = normalizeAnswer(correctAnswer);
    
    const correct = normalizedInput === normalizedCorrect || 
                    normalizedInput === currentWord.french.toLowerCase().trim() ||
                    normalizedInput === currentWord.english.toLowerCase().trim();
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(s => s + 1);
      markWordCorrect(currentWord.id);
      if (settings.soundEffects) {
        playCorrectSound();
      }
      // Auto-pronounce if enabled
      if (settings.autoPronounce && isAvailable() && questionDirection === 'english-to-french') {
        speak(currentWord.french);
      }
    } else {
      markWordIncorrect(currentWord.id);
      if (settings.soundEffects) {
        playIncorrectSound();
      }
    }
    
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        updateCategoryProgress(categoryId, score + (correct ? 1 : 0));
        onComplete(score + (correct ? 1 : 0), words.length);
      }
    }, 2000);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showResult && input.trim()) {
      checkAnswer();
    }
    if (settings.keyboardShortcuts && e.key === ' ') {
      e.preventDefault();
      if (showResult) {
        // Move to next question
      }
    }
  };
  
  const handleSpeak = () => {
    if (currentWord && questionDirection === 'french-to-english') {
      speak(currentWord.french);
    } else if (currentWord && questionDirection === 'english-to-french') {
      speak(currentWord.french);
    }
  };
  
  const showHint = () => {
    if (!currentWord || hintUsed) return;
    setHintUsed(true);
    const hint = correctAnswer.charAt(0).toUpperCase() + '_'.repeat(Math.max(0, correctAnswer.length - 2));
    setInput(hint);
  };
  
  if (isComplete) {
    return null;
  }
  
  if (!currentWord) {
    return <div>No words available</div>;
  }
  
  return (
    <div className="typing-container">
      <div className="typing-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="typing-stats">
          <span className="progress-text">Word {currentIndex + 1} / {words.length}</span>
          <span className="score-text">Score: {score}</span>
          <span className="time-text">Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>
      
      <div className="typing-question">
        <h2>Type the translation:</h2>
        <div className="question-word">
          <div className="question-word-header">
            <h3>{questionText}</h3>
            {questionDirection === 'french-to-english' && isAvailable() && (
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
          {questionDirection === 'french-to-english' && currentWord.pronunciation && (
            <p className="pronunciation">/{currentWord.pronunciation}/</p>
          )}
        </div>
      </div>
      
      <div className="typing-input-section">
        <div className="typing-hint-section">
          {settings.hintsEnabled && !hintUsed && !showResult && (
            <button className="hint-button" onClick={showHint}>
              💡 Get Hint
            </button>
          )}
          {questionDirection === 'french-to-english' && (
            <p className="typing-direction">Type the <strong>English</strong> translation</p>
          )}
          {questionDirection === 'english-to-french' && (
            <p className="typing-direction">Type the <strong>French</strong> translation</p>
          )}
        </div>
        
        <input
          type="text"
          className={`typing-input ${showResult ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your answer..."
          disabled={showResult}
          autoFocus
          autoComplete="off"
          spellCheck="false"
        />
        
        {!showResult && (
          <button 
            className="submit-button"
            onClick={checkAnswer}
            disabled={!input.trim()}
          >
            Submit
          </button>
        )}
      </div>
      
      {showResult && (
        <div className={`typing-result ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? (
            <>
              <p className="result-icon">✓</p>
              <p className="result-message">Correct! Great job!</p>
            </>
          ) : (
            <>
              <p className="result-icon">✗</p>
              <p className="result-message">
                Not quite. The correct answer is: <strong>{correctAnswer}</strong>
              </p>
              {questionDirection === 'english-to-french' && currentWord.pronunciation && (
                <p className="pronunciation-hint">/{currentWord.pronunciation}/</p>
              )}
            </>
          )}
        </div>
      )}
      
      {showResult && (
        <div className="typing-answer-display">
          <div className="answer-info">
            <strong>Your answer:</strong> {input || '(empty)'}
          </div>
          <div className="answer-info">
            <strong>Correct answer:</strong> {correctAnswer}
          </div>
        </div>
      )}
    </div>
  );
}

export default Typing;

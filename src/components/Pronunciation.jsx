import { useState, useEffect, useRef } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { markWordCorrect, markWordIncorrect, updateCategoryProgress, getProgress, getWordsForReview } from '../utils/progressStorage';
import { speak, stop, isAvailable } from '../utils/speech';
import { playCorrectSound, playIncorrectSound } from '../utils/sounds';
import { getSettings } from '../utils/settingsStorage';
import './Pronunciation.css';

function Pronunciation({ categoryId, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [userSpeech, setUserSpeech] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [recognition, setRecognition] = useState(null);
  const recognitionRef = useRef(null);
  
  const category = vocabularyData.categories.find(cat => cat.id === categoryId);
  const allWords = category?.words || [];
  const progress = getProgress();
  const settings = getSettings();
  const learnedWords = progress.learnedWords || [];
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = 'fr-FR'; // French language
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserSpeech(transcript);
        checkPronunciation(transcript);
        setIsListening(false);
      };
      
      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please enable microphone access.');
        }
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(rec);
      recognitionRef.current = rec;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  // Filter words based on mode and difficulty
  const filterWords = (words) => {
    let filtered = words;
    
    // Filter by difficulty if needed
    const difficulty = settings.gameDifficulty || 'medium';
    if (difficulty === 'easy') {
      filtered = filtered.filter(w => learnedWords.includes(w.id));
    } else if (difficulty === 'hard') {
      filtered = filtered.filter(w => !learnedWords.includes(w.id) || progress.weakWords?.includes(w.id));
    }
    
    return filtered;
  };
  
  // Initialize word list
  useEffect(() => {
    if (allWords.length > 0) {
      let filteredWords = filterWords(allWords);
      
      // Get words for review if using spaced repetition
      const reviewWords = getWordsForReview(filteredWords);
      if (reviewWords.length > 0) {
        const otherWords = filteredWords.filter(w => !reviewWords.some(rw => rw.id === w.id));
        filteredWords = [...reviewWords, ...otherWords.slice(0, Math.max(0, filteredWords.length - reviewWords.length))];
      }
      
      const maxWords = settings.flashcardCount || 25;
      const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
      const selectedWords = shuffled.slice(0, Math.min(maxWords, filteredWords.length));
      
      setWords(selectedWords);
      setCurrentIndex(0);
      setScore(0);
      setUserSpeech('');
      setShowResult(false);
    }
  }, [categoryId, allWords]);
  
  useEffect(() => {
    setUserSpeech('');
    setShowResult(false);
    setIsListening(false);
    stop();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
  }, [currentIndex]);
  
  const currentWord = words[currentIndex];
  const isComplete = currentIndex >= words.length;
  const progressPercentage = words.length > 0 ? ((currentIndex) / words.length) * 100 : 0;
  
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[.,!?;:]/g, ''); // Remove punctuation
  };
  
  const checkPronunciation = (transcript) => {
    if (!currentWord) return;
    
    const normalizedUser = normalizeText(transcript);
    const normalizedCorrect = normalizeText(currentWord.french);
    
    // Simple comparison - check if the user's speech contains the word or vice versa
    // Speech recognition isn't perfect, so we use a flexible comparison
    const correct = normalizedUser === normalizedCorrect ||
                    normalizedUser.includes(normalizedCorrect) ||
                    normalizedCorrect.includes(normalizedUser) ||
                    (normalizedUser.length > 0 && normalizedCorrect.length > 0 && 
                     normalizedUser.split(' ').some(word => normalizedCorrect.includes(word)) ||
                     normalizedCorrect.split(' ').some(word => normalizedUser.includes(word)));
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      setScore(s => s + 1);
      markWordCorrect(currentWord.id);
      if (settings.soundEffects) {
        playCorrectSound();
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
    }, 2500);
  };
  
  const handleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not available in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setUserSpeech('');
      setShowResult(false);
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsListening(false);
      }
    }
  };
  
  const handleHearCorrect = () => {
    if (currentWord && isAvailable()) {
      speak(currentWord.french);
    }
  };
  
  const handleSkip = () => {
    if (currentWord) {
      markWordIncorrect(currentWord.id);
    }
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      onComplete(score, words.length);
    }
  };
  
  if (isComplete) {
    return null;
  }
  
  if (!currentWord) {
    return <div>No words available</div>;
  }
  
  const isSpeechRecognitionAvailable = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  
  if (!isSpeechRecognitionAvailable) {
    return (
      <div className="pronunciation-container">
        <div className="pronunciation-error">
          <h2>🎤 Speech Recognition Not Available</h2>
          <p>
            Your browser doesn't support speech recognition. Please use:
          </p>
          <ul>
            <li>Google Chrome</li>
            <li>Microsoft Edge</li>
            <li>Safari (on macOS/iOS)</li>
          </ul>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            Note: Speech recognition requires a microphone and may need permission to access it.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pronunciation-container">
      <div className="pronunciation-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="pronunciation-stats">
          <span className="progress-text">Word {currentIndex + 1} / {words.length}</span>
          <span className="score-text">Score: {score}</span>
        </div>
      </div>
      
      <div className="pronunciation-word">
        <h2>Practice Pronunciation</h2>
        <div className="word-display">
          <h3>{currentWord.english}</h3>
          <p className="word-hint">Say the French word:</p>
          <div className="french-word-display">
            <strong>{currentWord.french}</strong>
            {currentWord.pronunciation && (
              <span className="pronunciation-guide">/{currentWord.pronunciation}/</span>
            )}
          </div>
          {currentWord.example && (
            <p className="word-example">Example: "{currentWord.example}"</p>
          )}
        </div>
      </div>
      
      <div className="pronunciation-controls">
        <button
          className="hear-button"
          onClick={handleHearCorrect}
          disabled={isListening}
        >
          🔊 Hear Correct Pronunciation
        </button>
        
        <button
          className={`listen-button ${isListening ? 'listening' : ''}`}
          onClick={handleListen}
          disabled={showResult}
        >
          {isListening ? (
            <>
              <span className="listening-indicator">🎤</span>
              Listening... Click to stop
            </>
          ) : (
            <>
              🎤 Click to Speak
            </>
          )}
        </button>
        
        <button
          className="skip-button"
          onClick={handleSkip}
          disabled={isListening || showResult}
        >
          ⏭️ Skip
        </button>
      </div>
      
      {isListening && (
        <div className="listening-status">
          <div className="wave-animation">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Listening... Speak now!</p>
        </div>
      )}
      
      {userSpeech && !showResult && (
        <div className="user-speech-display">
          <p>You said: <strong>{userSpeech}</strong></p>
        </div>
      )}
      
      {showResult && (
        <div className={`pronunciation-result ${isCorrect ? 'correct' : 'incorrect'}`}>
          {isCorrect ? (
            <>
              <p className="result-icon">✓</p>
              <p className="result-message">Excellent pronunciation!</p>
              {userSpeech && (
                <p className="result-detail">You said: "{userSpeech}"</p>
              )}
            </>
          ) : (
            <>
              <p className="result-icon">✗</p>
              <p className="result-message">Not quite right. Keep practicing!</p>
              {userSpeech && (
                <p className="result-detail">You said: "{userSpeech}"</p>
              )}
              <p className="result-detail">Correct: "{currentWord.french}"</p>
              <button className="try-again-button" onClick={handleHearCorrect}>
                🔊 Hear it again
              </button>
            </>
          )}
        </div>
      )}
      
      <div className="pronunciation-help">
        <p>💡 Tip: Speak clearly and try to match the pronunciation guide if available.</p>
        <p>Note: Speech recognition works best in quiet environments with a good microphone.</p>
      </div>
    </div>
  );
}

export default Pronunciation;

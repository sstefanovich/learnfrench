import { useState, useEffect } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { markWordCorrect, markWordIncorrect, updateCategoryProgress, getProgress, getWordsForReview } from '../utils/progressStorage';
import { speak, stop, isAvailable } from '../utils/speech';
import { playCorrectSound, playIncorrectSound } from '../utils/sounds';
import { getSettings } from '../utils/settingsStorage';
import './Quiz.css';

function Quiz({ categoryId, onComplete, practiceWeakWords = false, difficulty = 'medium' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  
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
    
    // Create quiz questions
    const quizQuestions = filteredWords.map(word => ({
      word,
      questionType: Math.random() > 0.5 ? 'french-to-english' : 'english-to-french'
    }));
    
    // Shuffle questions
    const shuffled = quizQuestions.sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    
    if (shuffled.length > 0) {
      generateAnswers(shuffled[0]);
    }
  }, [categoryId, practiceWeakWords, difficulty]);
  
  const generateAnswers = (question) => {
    const correctWord = question.word;
    const wrongWords = allWords
      .filter(w => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const answers = [
      { word: correctWord, isCorrect: true },
      ...wrongWords.map(word => ({ word, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);
    
    setShuffledAnswers(answers);
  };
  
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      generateAnswers(questions[currentIndex]);
      setSelectedAnswer(null);
      setShowResult(false);
      // Stop any ongoing speech when question changes
      stop();
    }
  }, [currentIndex, questions]);
  
  const handleSpeak = (wordToSpeak) => {
    // Only use wordToSpeak if it's a string (avoid using click Event when onClick={handleSpeak})
    let word = typeof wordToSpeak === 'string' ? wordToSpeak : null;
    if (word == null && currentQuestion?.word) {
      const w = currentQuestion.word;
      word = typeof w.french === 'string' ? w.french : (w.french != null ? String(w.french) : null);
    }
    if (word && word.length > 0 && isAvailable()) {
      speak(word);
    }
  };
  
  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;
  const progressPercentage = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;
  
  const handleAnswerSelect = (answer) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    if (answer.isCorrect) {
      setScore(s => s + 1);
      markWordCorrect(answer.word.id);
      if (settings.soundEffects) {
        playCorrectSound();
      }
    } else {
      markWordIncorrect(answer.word.id);
      if (settings.soundEffects) {
        playIncorrectSound();
      }
    }
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        // Quiz complete
        updateCategoryProgress(categoryId, score + (answer.isCorrect ? 1 : 0));
        onComplete(score + (answer.isCorrect ? 1 : 0), questions.length);
      }
    }, 1500);
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!settings.keyboardShortcuts) return;
    
    const handleKeyPress = (e) => {
      if (showResult || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (['1', '2', '3', '4'].includes(e.key) && shuffledAnswers.length > 0) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < shuffledAnswers.length) {
          handleAnswerSelect(shuffledAnswers[index]);
        }
      }
      
      if (e.key === 'Enter' && shuffledAnswers.length > 0) {
        e.preventDefault();
        // Select first answer or random
        handleAnswerSelect(shuffledAnswers[0]);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showResult, shuffledAnswers, settings.keyboardShortcuts]);
  
  if (isComplete || !currentQuestion) {
    return null;
  }
  
  const isFrenchToEnglish = currentQuestion.questionType === 'french-to-english';
  
  // Ensure we always display a string (avoid "[object Object]" from malformed data)
  const getDisplayText = (word, field) => {
    const value = word?.[field];
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value[0] ?? '';
    return String(value);
  };
  
  const getPronunciation = (word) => {
    const p = word?.pronunciation;
    return typeof p === 'string' ? p : null;
  };
  
  const questionText = getDisplayText(currentQuestion.word, isFrenchToEnglish ? 'french' : 'english');
  const questionPronunciation = getPronunciation(currentQuestion.word);
  
  return (
    <div className="quiz-container">
      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <span className="progress-text">Question {currentIndex + 1} / {questions.length}</span>
        <span className="score-text">Score: {score}</span>
      </div>
      
      <div className="quiz-question">
        <h2>What does this mean?</h2>
        <div className="question-word">
          <div className="question-word-header">
            <h3>{questionText}</h3>
            {isFrenchToEnglish && isAvailable() && (
              <button
                type="button"
                className="speaker-button"
                onClick={() => handleSpeak()}
                aria-label="Listen to pronunciation"
                title="Listen to pronunciation"
              >
                🔊
              </button>
            )}
          </div>
          {isFrenchToEnglish && questionPronunciation && (
            <p className="pronunciation">/{questionPronunciation}/</p>
          )}
          {!isFrenchToEnglish && (
            <div className="question-pronunciation-section">
              {questionPronunciation && (
                <p className="pronunciation">Pronunciation: /{questionPronunciation}/</p>
              )}
              {isAvailable() && (
                <button
                  type="button"
                  className="speaker-button"
                  onClick={() => handleSpeak()}
                  aria-label="Listen to French pronunciation"
                  title="Listen to French pronunciation"
                >
                  🔊
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="quiz-answers">
        {shuffledAnswers.map((answer, index) => {
          const answerText = isFrenchToEnglish
            ? getDisplayText(answer.word, 'english')
            : getDisplayText(answer.word, 'french');
          // Do not show pronunciation on answer options — it gives away the answer
          
          let buttonClass = 'quiz-button';
          if (showResult) {
            if (answer.isCorrect) {
              buttonClass += ' correct';
            } else if (answer === selectedAnswer && !answer.isCorrect) {
              buttonClass += ' incorrect';
            } else {
              buttonClass += ' disabled';
            }
          }
          
          const frenchText = getDisplayText(answer.word, 'french');
          
          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              className={buttonClass}
              onClick={showResult ? undefined : () => handleAnswerSelect(answer)}
              onKeyDown={(e) => {
                if (showResult) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAnswerSelect(answer);
                }
              }}
              aria-disabled={showResult}
              style={!showResult ? { cursor: 'pointer' } : undefined}
            >
              <div className="answer-content">
                <span className="answer-text">{answerText}</span>
              </div>
              {!isFrenchToEnglish && isAvailable() && !showResult && (
                <button
                  type="button"
                  className="answer-speaker-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSpeak(frenchText);
                  }}
                  aria-label="Listen to pronunciation"
                  title="Listen to pronunciation"
                >
                  🔊
                </button>
              )}
              {showResult && answer.isCorrect && <span className="check-mark">✓</span>}
              {showResult && answer === selectedAnswer && !answer.isCorrect && (
                <span className="x-mark">✗</span>
              )}
            </div>
          );
        })}
      </div>
      
      {showResult && (
        <div className={`result-message ${selectedAnswer?.isCorrect ? 'correct' : 'incorrect'}`}>
          {selectedAnswer?.isCorrect ? (
            <p>✓ Correct! Great job!</p>
          ) : (
            (() => {
              const correctAnswer = shuffledAnswers.find(a => a.isCorrect);
              const correctWord = correctAnswer?.word;
              const correctText = correctWord ? getDisplayText(correctWord, isFrenchToEnglish ? 'english' : 'french') : '';
              const correctPron = correctWord ? getPronunciation(correctWord) : null;
              return (
                <div>
                  <p>✗ Not quite. The correct answer is:</p>
                  <p className="correct-answer">
                    <strong>{correctText}</strong>
                    {!isFrenchToEnglish && correctPron && (
                      <span className="pronunciation-hint"> /{correctPron}/</span>
                    )}
                  </p>
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}

export default Quiz;
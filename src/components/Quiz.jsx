import { useState, useEffect } from 'react';
import vocabularyData from '../data/vocabulary.json';
import { markWordLearned, updateCategoryProgress, getProgress } from '../utils/progressStorage';
import { speak, stop, isAvailable } from '../utils/speech';
import './Quiz.css';

function Quiz({ categoryId, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [shuffledAnswers, setShuffledAnswers] = useState([]);
  
  const category = vocabularyData.categories.find(cat => cat.id === categoryId);
  const allWords = category?.words || [];
  
  useEffect(() => {
    // Create quiz questions
    const quizQuestions = allWords.map(word => ({
      word,
      questionType: Math.random() > 0.5 ? 'french-to-english' : 'english-to-french'
    }));
    
    // Shuffle questions
    const shuffled = quizQuestions.sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    
    if (shuffled.length > 0) {
      generateAnswers(shuffled[0]);
    }
  }, [categoryId]);
  
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
  
  const handleSpeak = () => {
    if (currentQuestion && isFrenchToEnglish) {
      speak(currentQuestion.word.french);
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
      markWordLearned(answer.word.id);
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
  
  if (isComplete || !currentQuestion) {
    return null;
  }
  
  const isFrenchToEnglish = currentQuestion.questionType === 'french-to-english';
  const questionText = isFrenchToEnglish 
    ? currentQuestion.word.french 
    : currentQuestion.word.english;
  
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
                className="speaker-button"
                onClick={handleSpeak}
                aria-label="Listen to pronunciation"
                title="Listen to pronunciation"
              >
                🔊
              </button>
            )}
          </div>
          {isFrenchToEnglish && currentQuestion.word.pronunciation && (
            <p className="pronunciation">/{currentQuestion.word.pronunciation}/</p>
          )}
        </div>
      </div>
      
      <div className="quiz-answers">
        {shuffledAnswers.map((answer, index) => {
          const answerText = isFrenchToEnglish 
            ? answer.word.english 
            : answer.word.french;
          
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
          
          return (
            <button
              key={index}
              className={buttonClass}
              onClick={() => handleAnswerSelect(answer)}
              disabled={showResult}
            >
              {answerText}
              {showResult && answer.isCorrect && <span className="check-mark">✓</span>}
              {showResult && answer === selectedAnswer && !answer.isCorrect && (
                <span className="x-mark">✗</span>
              )}
            </button>
          );
        })}
      </div>
      
      {showResult && (
        <div className={`result-message ${selectedAnswer?.isCorrect ? 'correct' : 'incorrect'}`}>
          {selectedAnswer?.isCorrect ? (
            <p>✓ Correct! Great job!</p>
          ) : (
            <p>✗ Not quite. The correct answer is: {
              shuffledAnswers.find(a => a.isCorrect).word[isFrenchToEnglish ? 'english' : 'french']
            }</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Quiz;
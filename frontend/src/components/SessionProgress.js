import React from 'react';
import { motion } from 'framer-motion';
import './SessionProgress.css';

const SessionProgress = ({ sessionType, currentQuestion, totalQuestions }) => {
  const sessionTitles = {
    vision: 'Vision Mapping',
    auditing: 'Skills Auditing',
    leverage: 'Natural Leverage',
    upskill: 'Strategic Upskilling',
    execute: 'Execution Plan'
  };

  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <motion.div 
      className="session-progress"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="progress-header">
        <h3 className="session-name">{sessionTitles[sessionType]}</h3>
        <span className="question-counter">
          Question {currentQuestion} of {totalQuestions}
        </span>
      </div>
      
      <div className="progress-bar-container">
        <motion.div 
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
};

export default SessionProgress;
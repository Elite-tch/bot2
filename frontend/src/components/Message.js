import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import './Message.css';

const Message = ({ message }) => {
  const { type, content, isTitle, timestamp } = message;

  if (isTitle) {
    return (
      <motion.div 
        className="session-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`message ${type}-message`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="message-avatar">
        {type === 'bot' ? (
          <Bot size={20} />
        ) : (
          <User size={20} />
        )}
      </div>
      <div className="message-content">
        <div className="message-text">
          {content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <div className="message-time">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};

export default Message;
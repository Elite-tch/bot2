import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, Loader, Bot } from 'lucide-react';
import Message from './Message';
import UserForm from './UserForm';
import ActionButtons from './ActionButtons';
import SessionProgress from './SessionProgress';
import api from '../services/api';
import './ChatBot.css';

const ChatBot = () => {
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState({
    sessionId: null,
    sessionType: null,
    currentQuestion: 1,
    totalQuestions: 0
  });
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      id: 1,
      type: 'bot',
      content: "Hi, I'm Synergy AI; a self-consultation chatbot created by the ACTIVATIONS team. Can you please tell me your name and where you are chatting from?",
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (content, type = 'bot', isTitle = false) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      type,
      content,
      isTitle,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleUserSubmit = async (userData) => {
    setIsLoading(true);
    try {
      addMessage(`My name is ${userData.name} and I am chatting from ${userData.location}`, 'user');
      
      const response = await api.startConversation(userData);
      setUserId(response.userId);
      addMessage(response.message);
      setCurrentStep('general');
    } catch (error) {
      addMessage('Sorry, there was an error starting our conversation. Please try again.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessage = async (message) => {
    setIsLoading(true);
    try {
      addMessage(message, 'user');
      setInputValue('');
      
      const response = await api.sendMessage(userId, message);
      addMessage(response.message);
      
      if (response.showValueIntroduction) {
        setTimeout(async () => {
          const valueResponse = await api.startVALUE(userId);
          addMessage(valueResponse.message);
          setCurrentStep('value-intro');
        }, 1000);
      }
    } catch (error) {
      addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartVALUE = async () => {
    setIsLoading(true);
    try {
      const response = await api.startSession(userId, 'vision');
      setSessionData({
        sessionId: response.sessionId,
        sessionType: 'vision',
        currentQuestion: response.questionNumber,
        totalQuestions: response.totalQuestions
      });
      
      if (response.sessionTitle) {
        addMessage(response.sessionTitle, 'bot', true);
      }
      if (response.message) {
        addMessage(response.message);
      }
      if (response.question) {
        addMessage(response.question, 'bot');
      }
      
      setCurrentStep('session');
    } catch (error) {
      addMessage('Sorry, there was an error starting the VALUE framework. Please try again.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionAnswer = async (answer) => {
    setIsLoading(true);
    try {
      addMessage(answer, 'user');
      setInputValue('');
      
      const response = await api.submitAnswer(sessionData.sessionId, answer);
      
      if (response.gptResponse) {
        addMessage(response.gptResponse);
      }
      
      if (response.nextQuestion) {
        addMessage(response.nextQuestion, 'bot');
        setSessionData(prev => ({
          ...prev,
          currentQuestion: response.questionNumber
        }));
      } else if (response.sessionCompleted && response.nextSessionType) {
        if (response.message) {
          addMessage(response.message);
        }
        
        setTimeout(async () => {
          const nextResponse = await api.startSession(userId, response.nextSessionType);
          setSessionData({
            sessionId: nextResponse.sessionId,
            sessionType: response.nextSessionType,
            currentQuestion: nextResponse.questionNumber,
            totalQuestions: nextResponse.totalQuestions
          });
          
          if (nextResponse.sessionTitle) {
            addMessage(nextResponse.sessionTitle, 'bot', true);
          }
          if (nextResponse.message) {
            addMessage(nextResponse.message);
          }
          if (nextResponse.question) {
            addMessage(nextResponse.question, 'bot');
          }
        }, 2000);
      } else if (response.isCompleted) {
        if (response.finalMessage) {
          addMessage(response.finalMessage, 'bot');
        }
        setCurrentStep('completed');
      }
    } catch (error) {
      addMessage('Sorry, there was an error processing your answer. Please try again.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  const renderInput = () => {
    switch (currentStep) {
      case 'intro':
        return <UserForm onSubmit={handleUserSubmit} isLoading={isLoading} />;
      
      case 'general':
        return (
          <div className="input-container">
            <div className="input-wrapper">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && inputValue.trim() && handleMessage(inputValue.trim())}
                placeholder="Type your message..."
                disabled={isLoading}
                className="message-input"
              />
              <button
                onClick={() => handleMessage(inputValue.trim())}
                disabled={isLoading || !inputValue.trim()}
                className="send-button"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        );
      
      case 'value-intro':
        return (
          <ActionButtons
            buttons={[
              { text: "Yes, let's begin", onClick: handleStartVALUE, primary: true }
            ]}
          />
        );
      
      case 'session':
        return (
          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && inputValue.trim()) {
                      handleSessionAnswer(inputValue.trim());
                    }
                  }
                }}
                placeholder="Type your answer... (Shift+Enter for new line)"
                disabled={isLoading}
                className="answer-input"
                rows={3}
              />
              <button
                onClick={() => handleSessionAnswer(inputValue.trim())}
                disabled={isLoading || !inputValue.trim()}
                className="send-button"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        );
      
      case 'completed':
        return (
          <ActionButtons
            buttons={[
              { text: "Start Over", onClick: handleRestart, primary: false }
            ]}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div 
      className="chatbot-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="chatbot-header">
        <div className="header-content">
          <div className="logo">
            <Brain className="logo-icon" />
            <span className="logo-text">Synergy AI</span>
          </div>
          <p className="subtitle">Career Consultation Chatbot</p>
        </div>
      </div>

      {currentStep === 'session' && (
        <SessionProgress
          sessionType={sessionData.sessionType}
          currentQuestion={sessionData.currentQuestion}
          totalQuestions={sessionData.totalQuestions}
        />
      )}

      <div className="messages-container">
        <AnimatePresence>
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            className="loading-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="message bot-message">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <Loader className="spinner" size={16} />
                  <span>Synergy AI is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="input-section">
        {renderInput()}
      </div>
    </motion.div>
  );
};

export default ChatBot;
import React from 'react';
import { motion } from 'framer-motion';
import './ActionButtons.css';

const ActionButtons = ({ buttons }) => {
  return (
    <motion.div 
      className="action-buttons"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {buttons.map((button, index) => (
        <motion.button
          key={index}
          className={`action-button ${button.primary ? 'primary' : 'secondary'}`}
          onClick={button.onClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {button.text}
        </motion.button>
      ))}
    </motion.div>
  );
};

export default ActionButtons;
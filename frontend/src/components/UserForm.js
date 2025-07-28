import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, ArrowRight } from 'lucide-react';
import './UserForm.css';

const UserForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });
  
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.trim().length < 2) {
      newErrors.location = 'Location must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate() && !isLoading) {
      onSubmit({
        name: formData.name.trim(),
        location: formData.location.trim()
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <motion.form 
      className="user-form"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="form-fields">
        <div className="field-group">
          <div className="input-with-icon">
            <User className="input-icon" size={20} />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Your name..."
              className={`form-input ${errors.name ? 'error' : ''}`}
              disabled={isLoading}
              maxLength={100}
            />
          </div>
          {errors.name && (
            <motion.span 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.name}
            </motion.span>
          )}
        </div>

        <div className="field-group">
          <div className="input-with-icon">
            <MapPin className="input-icon" size={20} />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Your location (city, state/country)..."
              className={`form-input ${errors.location ? 'error' : ''}`}
              disabled={isLoading}
              maxLength={100}
            />
          </div>
          {errors.location && (
            <motion.span 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.location}
            </motion.span>
          )}
        </div>
      </div>

      <motion.button
        type="submit"
        className="submit-button"
        disabled={isLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          <div className="loading-content">
            <div className="spinner" />
            <span>Starting conversation...</span>
          </div>
        ) : (
          <div className="button-content">
            <span>Start Conversation</span>
            <ArrowRight size={20} />
          </div>
        )}
      </motion.button>
    </motion.form>
  );
};

export default UserForm;
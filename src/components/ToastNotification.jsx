import React, { useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiX, FiAlertTriangle } from 'react-icons/fi';

const ToastNotification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle />;
      case 'warning':
        return <FiAlertTriangle />;
      case 'error':
      default:
        return <FiXCircle />;
    }
  };

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        <FiX />
      </button>
    </div>
  );
};

export default ToastNotification;
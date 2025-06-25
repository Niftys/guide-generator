// src/components/AuthSidebar.jsx
import React, { useState, useEffect } from 'react';
import './authsidebar.css';
import { 
  FiUser, 
  FiBookmark, 
  FiLogOut,
  FiLogIn,
  FiUserPlus,
  FiX,
  FiMenu,
  FiTrash2,
  FiClock,
  FiLayers,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

const AuthSidebar = ({ 
  isOpen, 
  onClose,
  onToggle,
  user,
  username,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  isSignUp,
  setIsSignUp,
  handleAuth,
  savedGuides,
  loadGuide,
  deleteGuide,
  logOut
}) => {
  const [localUsername, setLocalUsername] = useState(username || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Update local username when prop changes
  useEffect(() => {
    setLocalUsername(username || '');
  }, [username]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await handleAuth(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
      
      <div className={`auth-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
        <button 
          className="sidebar-toggle" 
          onClick={onToggle}
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
        
        <div className="sidebar-content">
          {isOpen ? (
            <>
              <div className="sidebar-header">
                <h3>{user ? 'My Account' : 'Welcome'}</h3>
                {!user && (
                  <p className="sidebar-subtitle">Sign in to save your guides</p>
                )}
              </div>

              {user ? (
                <div className="user-section">
                  <div className="user-profile">
                    <div className="user-avatar">
                      <FiUser />
                    </div>
                    <div className="user-details">
                      <h4 className="user-name">
                        {localUsername || user.email?.split('@')[0] || 'User'}
                      </h4>
                      <p className="user-email">{user.email}</p>
                      <div className="user-stats">
                        <span className="stat">
                          <FiBookmark size={12} />
                          {savedGuides.length} guide{savedGuides.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="sign-out-btn" onClick={logOut}>
                    <FiLogOut />
                    Sign Out
                  </button>

                  <div className="saved-guides-section">
                    <div className="section-header">
                      <h4>
                        <FiBookmark />
                        Saved Guides
                      </h4>
                    </div>
                    
                    <div className="guides-container">
                      {savedGuides.length === 0 ? (
                        <div className="empty-state">
                          <FiLayers size={24} />
                          <p>No saved guides yet</p>
                          <span>Create and save your first guide!</span>
                        </div>
                      ) : (
                        <div className="guides-list">
                          {savedGuides
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                            .map((guide) => (
                            <div key={guide.id} className="guide-item">
                              <div 
                                className="guide-content" 
                                onClick={() => {
                                  loadGuide(guide);
                                  onClose();
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    loadGuide(guide);
                                    onClose();
                                  }
                                }}
                              >
                                <div className="guide-header">
                                  <h5 className="guide-title" title={guide.title}>
                                    {guide.title}
                                  </h5>
                                  <div className="guide-meta">
                                    <span className="step-count">
                                      <FiLayers size={12} />
                                      {guide.steps?.length || 0} steps
                                    </span>
                                    <span className="guide-date">
                                      <FiClock size={12} />
                                      {formatDate(guide.timestamp)}
                                    </span>
                                  </div>
                                  {guide.subject && guide.subject !== 'General' && (
                                    <span className="guide-subject">{guide.subject}</span>
                                  )}
                                </div>
                              </div>
                              <button 
                                className="delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if(window.confirm('Delete this guide?')) {
                                    deleteGuide(guide.id);
                                  }
                                }}
                                title="Delete guide"
                                aria-label="Delete guide"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="auth-section">
                  {authError && (
                    <div className="error-message" role="alert">
                      {authError}
                    </div>
                  )}
                  
                  <form onSubmit={handleFormSubmit} className="auth-form">
                    <div className="form-group">
                      <label htmlFor="auth-email">
                        <FiMail size={16} />
                        Email Address
                      </label>
                      <input
                        id="auth-email"
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="auth-password">
                        <FiLock size={16} />
                        Password
                      </label>
                      <div className="password-input-wrapper">
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          minLength={6}
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    
                    {isSignUp && (
                      <div className="form-group">
                        <label htmlFor="auth-username">
                          <FiUser size={16} />
                          Username
                        </label>
                        <input
                          id="auth-username"
                          type="text"
                          value={localUsername}
                          onChange={(e) => setLocalUsername(e.target.value)}
                          placeholder="Choose a username"
                          required
                          minLength={3}
                          maxLength={20}
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                    
                    <button 
                      type="submit" 
                      className="auth-submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner" />
                          {isSignUp ? 'Creating Account...' : 'Signing In...'}
                        </>
                      ) : isSignUp ? (
                        <>
                          <FiUserPlus />
                          Create Account
                        </>
                      ) : (
                        <>
                          <FiLogIn />
                          Sign In
                        </>
                      )}
                    </button>
                  </form>
                  
                  <div className="auth-switch">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setAuthError('');
                      }}
                      className="switch-btn"
                      disabled={isSubmitting}
                    >
                      {isSignUp 
                        ? "Already have an account? Sign In" 
                        : "Don't have an account? Sign Up"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="collapsed-view">
              <button 
                className="collapsed-icon" 
                onClick={onToggle}
                aria-label="Open sidebar"
              >
                <FiUser />
              </button>
              {user && savedGuides.length > 0 && (
                <div className="guide-count-badge" title={`${savedGuides.length} saved guides`}>
                  {savedGuides.length > 99 ? '99+' : savedGuides.length}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthSidebar;
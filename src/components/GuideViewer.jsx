import React from 'react';
import { FiHelpCircle, FiLoader, FiChevronUp, FiPlus, FiBookmark, FiEdit2, FiWifi, FiWifiOff } from 'react-icons/fi';

const GuideViewer = ({
  currentGuide,
  user,
  saving,
  loadingExplanationIndex,
  explainStep,
  saveGuide,
  resetGuideCreation,
  prompt,
  // Add these missing props
  subject,
  audience,
  style,
  detail,
  tone,
  custom,
  isOnline,
  saveQueue,
  isProcessingQueue
}) => {
  return (
    <div className="guide-container">
      <div className="guide-header">
        <div className="guide-title-section">
          <h2>{currentGuide?.title || 'Guide'}</h2>
          {currentGuide?.subject && (
            <div className="guide-subject-badge">
              {currentGuide.subject}
            </div>
          )}
        </div>
        
        <div className="guide-controls">
          <div className="guide-meta">
            <span className="step-count">
              {currentGuide?.steps?.length || 0} steps
            </span>
            <span className="guide-audience">
              {currentGuide?.audience || audience || 'All levels'}
            </span>
            <div className="network-status">
              {isOnline ? (
                <FiWifi className="online" title="Online" />
              ) : (
                <FiWifiOff className="offline" title="Offline" />
              )}
            </div>
          </div>
          
          <div className="guide-buttons">
            {user && (
              <button 
                onClick={saveGuide}
                disabled={saving || !isOnline || isProcessingQueue}
                className={`save-btn ${saving ? 'saving' : ''} ${!isOnline ? 'offline' : ''}`}
                title={!isOnline ? 'Cannot save while offline' : 
                       isProcessingQueue ? 'Processing queued saves...' : 'Save guide'}
              >
                {saving ? (
                  <>
                    <FiLoader className="spin" /> Saving...
                  </>
                ) : isProcessingQueue ? (
                  <>
                    <FiLoader className="spin" /> Processing...
                  </>
                ) : !isOnline ? (
                  <>
                    <FiWifiOff /> Offline
                  </>
                ) : currentGuide?.id ? (
                  <>
                    <FiEdit2 /> Update
                  </>
                ) : (
                  <>
                    <FiBookmark /> Save
                  </>
                )}
              </button>
            )}
            <button 
              className="new-guide-btn"
              onClick={resetGuideCreation}
            >
              <FiPlus /> New Guide
            </button>
          </div>
        </div>
      </div>
      
      {!isOnline && (
        <div className="offline-notice">
          <FiWifiOff /> You're currently offline. Some features may be limited.
        </div>
      )}
      
      {saveQueue.length > 0 && (
        <div className="queue-notice">
          <FiLoader className="spin" /> {saveQueue.length} guide{saveQueue.length > 1 ? 's' : ''} queued for saving when connection is restored.
        </div>
      )}
      
      <div className="guide-description">
        <p>Guide generated from prompt: "{prompt}"</p>
        {subject && subject !== 'General' && (
          <p>Subject: {subject}</p>
        )}
      </div>
      
      <ol className="steps-list">
        {currentGuide?.steps?.map((step, i) => (
          <li key={i} className="step-item">
            <div className="step-header">
              <div className="step-number">{i + 1}</div>
              <div className="step-text">
                {step.split('\n').map((line, lineIndex) => {
                  if (/^[a-z]\.\s/i.test(line)) {
                    const letter = line.charAt(0);
                    return (
                      <span 
                        key={lineIndex} 
                        className="sub-step"
                        data-letter={letter.toUpperCase() + "."}
                      >
                        {line.substring(2)}
                      </span>
                    );
                  }
                  return <div key={lineIndex}>{line}</div>;
                })}
              </div>
              <button
                className="explain-btn"
                onClick={() => explainStep(i, step)}
                disabled={loadingExplanationIndex === i || !isOnline}
                aria-expanded={!!currentGuide?.explanations?.[i]}
                title={!isOnline ? 'Cannot explain while offline' : 
                       currentGuide?.explanations?.[i] ? 'Hide explanation' : 'Explain this step'}
              >
                {loadingExplanationIndex === i ? (
                  <FiLoader className="spin" />
                ) : currentGuide?.explanations?.[i] ? (
                  <FiChevronUp />
                ) : (
                  <FiHelpCircle />
                )}
                <span className="btn-text">
                  {currentGuide?.explanations?.[i] ? 'Hide' : 'Explain'}
                </span>
              </button>
            </div>
            
            {currentGuide?.explanations?.[i] && (
              <div className="explanation-text">
                <div className="explanation-header">
                  <div className="ai-label">What does this mean?</div>
                </div>
                <div className="explanation-content">
                  {currentGuide.explanations[i]}
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default GuideViewer;
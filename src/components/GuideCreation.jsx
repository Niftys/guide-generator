import React from 'react';
import { FiZap, FiLoader, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const GuideCreation = ({
  prompt,
  setPrompt,
  subject,
  setSubject,
  showAdvanced,
  setShowAdvanced,
  audience,
  setAudience,
  style,
  setStyle,
  numSteps,
  setNumSteps,
  detail,
  setDetail,
  tone,
  setTone,
  custom,
  setCustom,
  error,
  loadingGuide,
  apiBaseUrl,
  generateGuide,
  subjects
}) => {
  return (
    <div className="input-section">
      <div className="input-card">
        <h2>What would you like to learn?</h2>
        <p className="input-hint">Describe a task or concept you want to understand</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <textarea
          placeholder="e.g., 'How to create a React component', 'Steps to bake sourdough bread', 'How to do a backflip'"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
        />
        
        <div className="subject-row">
          <label>Subject:</label>
          <select 
            value={subject} 
            onChange={e => setSubject(e.target.value)}
            className="subject-select"
          >
            {subjects.map((subj, index) => (
              <option key={index} value={subj}>{subj}</option>
            ))}
          </select>
        </div>
        
        <button 
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="advanced-toggle"
          style={{marginTop: '1rem', marginBottom: showAdvanced ? '1rem' : 0}}
        >
          {showAdvanced ? <FiChevronUp /> : <FiChevronDown />} Advanced Settings
        </button>
        
        {showAdvanced && (
          <div className="advanced-settings">
            <div className="adv-row">
              <label>Audience</label>
              <select value={audience} onChange={e => setAudience(e.target.value)}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Expert</option>
              </select>
            </div>
            <div className="adv-row">
              <label>Style</label>
              <select value={style} onChange={e => setStyle(e.target.value)}>
                <option>Casual</option>
                <option>Professional</option>
                <option>Technical</option>
              </select>
            </div>
            <div className="adv-row">
              <label>Number of Steps</label>
              <input type="number" min="1" max="30" value={numSteps} onChange={e => setNumSteps(e.target.value)} placeholder="Auto" />
            </div>
            <div className="adv-row">
              <label>Detail Level</label>
              <input type="range" min="1" max="3" value={detail} onChange={e => setDetail(Number(e.target.value))} />
              <span className="detail-label">
                {detail === 1 ? 'Concise' : detail === 2 ? 'Balanced' : 'Detailed'}
              </span>
            </div>
            <div className="adv-row">
              <label>Tone</label>
              <select value={tone} onChange={e => setTone(e.target.value)}>
                <option>Friendly</option>
                <option>Authoritative</option>
                <option>Humorous</option>
                <option>Furry</option>
              </select>
            </div>
            <div className="adv-row">
              <label>Custom Instructions</label>
              <textarea value={custom} onChange={e => setCustom(e.target.value)} rows={2} placeholder="Any extra instructions for the AI..." />
            </div>
          </div>
        )}
        <button 
          onClick={generateGuide} 
          disabled={loadingGuide || !apiBaseUrl}
          className={loadingGuide ? 'loading' : ''}
        >
          {loadingGuide ? (
            <>
              <FiLoader className="spin" /> Generating Guide...
            </>
          ) : (
            <>
              <FiZap /> Generate Guide
            </>
          )}
        </button>
        {!apiBaseUrl && (
          <p className="error-message" style={{marginTop: '10px'}}>
            API endpoint not configured. Please set VITE_FIREBASE_PROJECT_ID in .env
          </p>
        )}
      </div>
    </div>
  );
};

export default GuideCreation;
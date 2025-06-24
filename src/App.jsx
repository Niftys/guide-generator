import React, { useState } from 'react';
import { FiHelpCircle, FiLoader, FiChevronDown, FiChevronUp, FiZap, FiDownload } from 'react-icons/fi';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [guideText, setGuideText] = useState('');
  const [steps, setSteps] = useState([]);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [loadingExplanationIndex, setLoadingExplanationIndex] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [error, setError] = useState('');

  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audience, setAudience] = useState('Beginner');
  const [style, setStyle] = useState('Casual');
  const [numSteps, setNumSteps] = useState('');
  const [detail, setDetail] = useState(2); // 1: Concise, 2: Balanced, 3: Detailed
  const [tone, setTone] = useState('Friendly');
  const [custom, setCustom] = useState('');

  // Helper to build the advanced prompt
  const buildPrompt = () => {
    let adv = '';
    if (audience) adv += `\nAudience: ${audience}`;
    if (style) adv += `\nStyle: ${style}`;
    if (numSteps) adv += `\nNumber of steps: ${numSteps}`;
    if (detail === 1) adv += `\nBe concise.`;
    if (detail === 2) adv += `\nBe balanced in detail.`;
    if (detail === 3) adv += `\nBe very detailed.`;
    if (tone) adv += `\nTone: ${tone}`;
    if (custom) adv += `\n${custom}`;
    return `${prompt}${adv}`;
  };

  const generateGuide = async () => {
    if (!prompt.trim()) {
      setError('Please enter a guide topic');
      return;
    }
    
    setLoadingGuide(true);
    setError('');
    setGuideText('');
    setSteps([]);
    setExplanations({});

    try {
      const res = await fetch('/api/generate-guide-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: buildPrompt() }),
      });
      
      // Handle empty responses
      if (res.status === 204) {
        throw new Error('Server returned empty response');
      }
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          throw new Error(`Request failed: ${res.status} ${res.statusText}`);
        }
        throw new Error(errorData.message || errorData.error || 'Failed to generate guide');
      }

      const data = await res.json();
      
      // Validate response structure
      if (!data.guideText || typeof data.guideText !== 'string') {
        throw new Error('Invalid response format from server');
      }
      
      const text = data.guideText.trim();
      setGuideText(text);

      const lines = text.split('\n').filter(Boolean);
      const extractedSteps = lines.slice(1).map(line => line.replace(/^\d+[\.\)]\s*/, '').trim());
      setSteps(extractedSteps);
    } catch (e) {
      setError(e.message || 'An error occurred while generating the guide');
    } finally {
      setLoadingGuide(false);
    }
  };

  const explainStep = async (index, stepText) => {
    if (explanations[index]) {
      setExplanations(prev => ({ ...prev, [index]: null }));
      return;
    }

    setLoadingExplanationIndex(index);
    try {
      const res = await fetch('/api/explain-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, stepText }),
      });
      
      // Handle empty responses
      if (res.status === 204) {
        throw new Error('Server returned empty explanation');
      }
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          throw new Error(`Explanation request failed: ${res.status} ${res.statusText}`);
        }
        throw new Error(errorData.message || errorData.error || 'Failed to fetch explanation');
      }
      
      const data = await res.json();
      
      // Validate explanation response
      if (!data.explanation || typeof data.explanation !== 'string') {
        throw new Error('Invalid explanation format from server');
      }
      
      setExplanations(prev => ({ ...prev, [index]: data.explanation }));
    } catch (e) {
      setExplanations(prev => ({ 
        ...prev, 
        [index]: e.message || 'Failed to load explanation'
      }));
    } finally {
      setLoadingExplanationIndex(null);
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await fetch('/api/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      // Handle empty responses
      if (res.status === 204) {
        throw new Error('Server returned empty PDF response');
      }
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          throw new Error(`PDF request failed: ${res.status} ${res.statusText}`);
        }
        throw new Error(errorData.message || errorData.error || 'Failed to generate PDF');
      }
      
      // Process the blob
      const blob = await res.blob();
      
      // Validate it's actually a PDF
      if (!blob.type.includes('pdf') || blob.size < 100) {
        throw new Error('Invalid PDF file received from server');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guide-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError(e.message || 'Failed to download PDF');
    }
  };

  const title = guideText.split('\n')[0] || '';

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">
          <FiZap className="logo-icon" />
          <h1>AI Guide Generator</h1>
        </div>
        <p className="subtitle">Transform complex tasks into step-by-step guides with AI assistance</p>
      </div>

      <div className="main-content">
        <div className="input-section">
          <div className="input-card">
            <h2>What would you like to learn?</h2>
            <p className="input-hint">Describe a task or concept you want to understand</p>
            
            {error && <div className="error-message">{error}</div>}
            
            <textarea
              placeholder="e.g., 'How to create a React component', 'Steps to bake sourdough bread', 'Explain machine learning concepts'"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
            />
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
              disabled={loadingGuide}
              className={loadingGuide ? 'loading' : ''}
            >
              {loadingGuide ? (
                <>
                  <FiLoader className="spin" /> Generating Guide...
                </>
              ) : (
                <>
                  <FiZap /> Generate AI Guide
                </>
              )}
            </button>
          </div>
        </div>

        {guideText && (
          <div className="guide-container">
            <div className="guide-header">
              <h2>{title}</h2>
              <div className="guide-actions">
                <button 
                  onClick={downloadPDF}
                  className="download-btn"
                >
                  <FiDownload /> Download PDF
                </button>
                <div className="guide-meta">
                  <span>{steps.length} steps</span>
                </div>
              </div>
            </div>
            
            <ol className="steps-list">
              {steps.map((step, i) => (
                <li key={i} className="step-item">
                  <div className="step-header">
                    <div className="step-number">{i + 1}</div>
                    <div className="step-text">{step}</div>
                    <button
                      className="explain-btn"
                      onClick={() => explainStep(i, step)}
                      disabled={loadingExplanationIndex === i}
                      aria-expanded={!!explanations[i]}
                      title={explanations[i] ? 'Hide explanation' : 'Explain this step'}
                    >
                      {loadingExplanationIndex === i ? (
                        <FiLoader className="spin" />
                      ) : explanations[i] ? (
                        <FiChevronUp />
                      ) : (
                        <FiHelpCircle />
                      )}
                      <span className="btn-text">
                        {explanations[i] ? 'Hide' : 'Explain'}
                      </span>
                    </button>
                  </div>
                  
                  {explanations[i] && (
                    <div className="explanation-text">
                      <div className="explanation-header">
                        <div className="ai-label">What does this mean?</div>
                      </div>
                      <div className="explanation-content">
                        {explanations[i]}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      
      <div className="footer">
        <p>Experimental • Not for safety or medical use</p>
        <p>Created by <a href="https://sethlowery.me">Seth Lowery</a></p>
      </div>
    </div>
  );
}
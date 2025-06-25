// src/App.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiHelpCircle, FiLoader, FiChevronDown, FiChevronUp, 
  FiZap, FiSun, FiMoon, FiUser, FiMenu, FiX 
} from 'react-icons/fi';
import { 
  auth, 
  db, 
  signUp, 
  logIn, 
  logOut, 
  onAuthChange 
} from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import AuthSidebar from './components/AuthSidebar';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [guideText, setGuideText] = useState('');
  const [steps, setSteps] = useState([]);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [loadingExplanationIndex, setLoadingExplanationIndex] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [error, setError] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [audience, setAudience] = useState('Beginner');
  const [style, setStyle] = useState('Casual');
  const [numSteps, setNumSteps] = useState('');
  const [detail, setDetail] = useState(2);
  const [tone, setTone] = useState('Friendly');
  const [custom, setCustom] = useState('');
  const [subject, setSubject] = useState('General');

  // Auth states
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [savedGuides, setSavedGuides] = useState([]);
  const [saving, setSaving] = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setUser(user);
        loadUserProfile(user.uid);
        loadSavedGuides(user.uid);
      } else {
        setUser(null);
        setSavedGuides([]);
      }
    });
    return unsubscribe;
  }, []);

  // Load user profile
  const loadUserProfile = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      setUsername(docSnap.data().username || '');
    } else {
      // Create profile if doesn't exist
      await setDoc(userRef, {
        email: authEmail,
        createdAt: new Date()
      });
    }
  };

  // Load saved guides
  const loadSavedGuides = async (userId) => {
    const q = query(collection(db, 'guides'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const guides = [];
    querySnapshot.forEach((doc) => {
      guides.push({ 
        id: doc.id, 
        ...doc.data(),
        // Ensure steps is always an array
        steps: Array.isArray(doc.data().steps) ? doc.data().steps : []
      });
    });
    setSavedGuides(guides);
  };

  // Handle authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(authEmail, authPassword);
        // Create username after successful signup
        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userRef, { username }, { merge: true });
          setUsername(username);
        }
      } else {
        await logIn(authEmail, authPassword);
      }
      setAuthError('');
    } catch (error) {
      setAuthError(error.message);
      console.error("Authentication error:", error);
    }
  };

  // Save guide to Firestore
  const saveGuide = async () => {
    if (!user) {
      setAuthError('Please sign in to save guides');
      return;
    }
    
    if (!title || steps.length === 0) {
      setError('No guide to save');
      return;
    }
    
    setSaving(true);
    try {
      const guideData = {
        userId: user.uid,
        title,
        steps,
        explanations: Object.keys(explanations).length > 0 ? explanations : null,
        prompt,
        timestamp: new Date(),
        subject,
        audience,
        style,
        detail,
        tone,
        custom
      };
      
      console.log('Saving guide:', guideData);
      
      await addDoc(collection(db, 'guides'), guideData);
      loadSavedGuides(user.uid);
      setSaving(false);
      return true;
    } catch (error) {
      console.error("Error saving guide:", error);
      setError("Failed to save guide: " + error.message);
      setSaving(false);
      return false;
    }
  };

  // Delete saved guide
  const deleteGuide = async (guideId) => {
    try {
      await deleteDoc(doc(db, 'guides', guideId));
      loadSavedGuides(user.uid);
    } catch (error) {
      console.error("Error deleting guide:", error);
      setError("Failed to delete guide");
    }
  };

  // Load guide into editor
  const loadGuide = (guide) => {
    setPrompt(guide.prompt);
    setGuideText(guide.title + '\n' + guide.steps.join('\n'));
    setSteps(guide.steps);
    setExplanations(guide.explanations || {});
    setSubject(guide.subject || 'General');
    setAudience(guide.audience || 'Beginner');
    setStyle(guide.style || 'Casual');
    setDetail(guide.detail || 2);
    setTone(guide.tone || 'Friendly');
    setCustom(guide.custom || '');
  };

  // Subject options
  const subjects = [
    'General', 'Technology', 'Cooking', 'Health & Fitness', 'Education', 
    'Arts & Crafts', 'Sports', 'Music', 'Games', 'Travel', 'Finance', 
    'Gardening', 'Parenting', 'Automotive', 'Science', 'History', 
    'Literature', 'Business', 'DIY Projects', 'Pets', 'Fashion', 
    'Beauty', 'Photography', 'Psychology'
  ];

  // Set API base URL based on environment
  useEffect(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setApiBaseUrl('/api');
    } else {
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      if (projectId) {
        setApiBaseUrl(`https://us-central1-${projectId}.cloudfunctions.net/api`);
      } else {
        console.error('Firebase project ID not set in environment variables');
      }
    }
    
    // Detect system preference for dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    
    // Listen for system preference changes
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => setDarkMode(e.matches);
    
    darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Helper to build the advanced prompt
  const buildPrompt = () => {
    let instructions = `Create a comprehensive step-by-step guide about: ${prompt}\n\n`;
    instructions += `Subject Category: ${subject}\n`;
    instructions += `Target Audience: ${audience} level\n`;
    
    if (audience === "Beginner") instructions += "Assume no prior knowledge. Explain basic concepts.\n";
    if (audience === "Expert") instructions += "Use technical terminology. Skip basics.\n";
    
    if (detail === 1) instructions += "Detail Level: Concise (1-2 sentences per step)\n";
    if (detail === 2) instructions += "Detail Level: Balanced (2-3 sentences per step)\n";
    if (detail === 3) instructions += "Detail Level: Detailed (include examples)\n";
    
    instructions += `Style: ${style}\nTone: ${tone}\n`;
    if (style === "Technical") instructions += "Use precise terminology\n";
    if (tone === "Humorous") instructions += "Include light-hearted analogies\n";
    if (tone === "Furry") instructions += "Speak in an uwu voice, cringe, cute shy, furry roleplay with Kaomojis and the likes\n";
    
    if (numSteps) instructions += `Number of Steps: Exactly ${numSteps}\n`;
    if (custom) instructions += `Additional Requirements: ${custom}\n`;
    
    instructions += "\nIMPORTANT FORMATTING RULES:\n";
    instructions += "- First line = Title\n";
    instructions += "- Subsequent lines = Numbered steps (1., 2., 3.)\n";
    instructions += "- NO markdown, asterisks, or special formatting\n";
    
    return instructions;
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
    
    const MAX_RETRIES = 2;
    let attempt = 0;
    let success = false;
    let lastError = null;
  
    while (!success && attempt < MAX_RETRIES) {
      try {
        const res = await fetch(`${apiBaseUrl}/generate-guide-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: buildPrompt() }),
        });
        
        // Handle HTTP errors first
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Request failed with status ${res.status}`);
        }
        
        const data = await res.json();
        
        if (!data.guideText || typeof data.guideText !== 'string') {
          throw new Error('Invalid response format from server');
        }
        
        const text = data.guideText.trim();
        setGuideText(text);
  
        // STEP EXTRACTION
        const lines = text.split('\n').filter(Boolean);
        const extractedSteps = [];
        let currentStep = '';
  
        lines.slice(1).forEach(line => {
          // Detect new steps (number followed by period)
          if (/^\d+\.\s/.test(line)) {
            if (currentStep) extractedSteps.push(currentStep);
            currentStep = line.replace(/^\d+\.\s*/, '');
          } 
          // Detect sub-steps (letter followed by period)
          else if (/^[a-z]\.\s/i.test(line)) {
            currentStep += '\n' + line;
          }
          // Continue current step
          else if (currentStep) {
            currentStep += ' ' + line;
          }
        });
        
        if (currentStep) extractedSteps.push(currentStep);
        setSteps(extractedSteps);
        
        success = true;
      } catch (e) {
        lastError = e;
        attempt++;
        
        if (attempt >= MAX_RETRIES) {
          setError(e.message || 'Failed to generate guide');
          console.error('Final attempt failed:', e);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    
    setLoadingGuide(false);
  };
  
  // Extract title from guide text
  const title = guideText.split('\n')[0] || 'Guide';

  const explainStep = async (index, stepText) => {
    if (explanations[index]) {
      setExplanations(prev => ({ ...prev, [index]: null }));
      return;
    }

    setLoadingExplanationIndex(index);
    try {
      const res = await fetch(`${apiBaseUrl}/explain-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, stepText }),
      });
      
      // Robust error handling
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error('Server did not return JSON. Response: ' + text.slice(0, 200));
      }
      
      const data = await res.json();
      
      if (!data.explanation || typeof data.explanation !== 'string') {
        throw new Error('Invalid explanation format from server');
      }
      
      setExplanations(prev => ({ ...prev, [index]: data.explanation }));
    } catch (e) {
      setExplanations(prev => ({ 
        ...prev, 
        [index]: e.message || 'Failed to load explanation'
      }));
      console.error('Explanation error:', e);
    } finally {
      setLoadingExplanationIndex(null);
    }
  };

  return (
    <div className="app-container">
      <AuthSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        username={username}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authError={authError}
        setAuthError={setAuthError}
        isSignUp={isSignUp}
        setIsSignUp={setIsSignUp}
        handleAuth={handleAuth}
        savedGuides={savedGuides}
        loadGuide={loadGuide}
        deleteGuide={deleteGuide}
        logOut={logOut}
      />
      
      <div className="main-content-wrapper">
        <div className="header">
          <div className="logo">
            <FiZap className="logo-icon" />
            <h1>Ask SMEGLY</h1>
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
          </div>
          <p className="subtitle">Transform complex tasks into step-by-step guides with SMEGLY assistance</p>
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
              
              {/* Subject dropdown */}
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

          {guideText && (
            <div className="guide-container">
              <div className="guide-header">
                <h2>{title}</h2>
                <div className="guide-actions">
                  <div className="guide-meta">
                    <span>{steps.length} steps</span>
                    {user && (
                      <button 
                        onClick={saveGuide}
                        disabled={saving}
                        className="save-btn"
                      >
                        {saving ? (
                          <>
                            <FiLoader className="spin" /> Saving...
                          </>
                        ) : "Save Guide"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <ol className="steps-list">
                {steps.map((step, i) => (
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
          <p>Experimental • Not for safety or medical use • Check all important information</p>
          <p>Created by <a href="https://sethlowery.me">Seth Lowery</a></p>
        </div>
      </div>
    </div>
  );
}
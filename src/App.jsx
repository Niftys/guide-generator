import React, { useState, useEffect } from 'react';
import firebase from './firebase'; // Correct import
import ToastNotification from './components/ToastNotification';
import { 
  FiHelpCircle, FiLoader, FiChevronDown, FiChevronUp, 
  FiZap, FiSun, FiMoon, FiUser, FiMenu, FiX, FiPlus, FiChevronRight 
} from 'react-icons/fi';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import AuthSidebar from './components/AuthSidebar';
import GuideCreation from './components/GuideCreation';
import GuideViewer from './components/GuideViewer';

export default function App() {
  const { 
    auth, 
    db, 
    signUp, 
    logIn, 
    logOut, 
    onAuthChange,
    checkFirestoreConnection,
    setFirestoreOnline
  } = firebase;
  const [toast, setToast] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [loadingExplanationIndex, setLoadingExplanationIndex] = useState(null);
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

  // Guide states
  const [isViewingGuide, setIsViewingGuide] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Subject options
  const subjects = [
    'General', 'Technology', 'Cooking', 'Health & Fitness', 'Education', 
    'Arts & Crafts', 'Sports', 'Music', 'Games', 'Travel', 'Finance', 
    'Gardening', 'Parenting', 'Automotive', 'Science', 'History', 
    'Literature', 'Business', 'DIY Projects', 'Pets', 'Fashion', 
    'Beauty', 'Photography', 'Psychology'
  ];

  // Add a save queue for offline scenarios
  const [saveQueue, setSaveQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

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

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network came online');
      setIsOnline(true);
      // Try to refresh data when coming back online
      if (user) {
        // Add a small delay to ensure connection is stable
        setTimeout(() => {
          loadSavedGuides(user.uid);
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log('Network went offline');
      setIsOnline(false);
      setToast({
        message: 'You\'re now offline. Some features may be limited.',
        type: 'warning'
      });
    };

    // Check initial network status
    if (!navigator.onLine) {
      console.log('Initial network status: offline');
      setIsOnline(false);
      setToast({
        message: 'You\'re currently offline. Some features may be limited.',
        type: 'warning'
      });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Process save queue when coming back online
  useEffect(() => {
    if (isOnline && saveQueue.length > 0 && !isProcessingQueue) {
      processSaveQueue();
    }
  }, [isOnline, saveQueue, isProcessingQueue]);

  const processSaveQueue = async () => {
    if (saveQueue.length === 0) return;
    
    setIsProcessingQueue(true);
    console.log(`Processing ${saveQueue.length} queued saves...`);
    
    for (const queuedGuide of saveQueue) {
      try {
        await saveGuideToFirestore(queuedGuide);
        console.log('Queued guide saved successfully');
      } catch (error) {
        console.error('Failed to save queued guide:', error);
      }
    }
    
    setSaveQueue([]);
    setIsProcessingQueue(false);
  };

  const saveGuideToFirestore = async (guideData) => {
    if (guideData.id) {
      const docRef = doc(db, 'guides', guideData.id);
      await updateDoc(docRef, guideData);
    } else {
      const docRef = await addDoc(collection(db, 'guides'), guideData);
      return docRef.id;
    }
  };

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

  const loadSavedGuides = async (userId) => {
    try {
      // Skip connection check to avoid the problematic Listen stream
      // Instead, try the actual operation and handle errors gracefully
      console.log('Loading saved guides for user:', userId);
      
      const q = query(collection(db, 'guides'), where('userId', '==', userId));
      
      // Add timeout to the query
      const queryPromise = getDocs(q);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 15000)
      );
      
      const querySnapshot = await Promise.race([queryPromise, timeoutPromise]);
      const guides = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        guides.push({ 
          id: doc.id, 
          ...data,
          // Ensure steps is always an array
          steps: Array.isArray(data.steps) ? data.steps : [],
          // Ensure explanations is always an object
          explanations: (data.explanations && typeof data.explanations === 'object') 
            ? data.explanations : {},
          // Ensure timestamp is handled properly
          timestamp: data.timestamp || new Date()
        });
      });
      
      // Sort guides by timestamp (newest first)
      guides.sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return timeB.getTime() - timeA.getTime();
      });
      
      setSavedGuides(guides);
      console.log(`Loaded ${guides.length} saved guides`);
      
    } catch (error) {
      console.error('Error loading saved guides:', error);
      
      // Handle specific offline/connection errors
      if (error.message?.includes('timeout') ||
          error.code === 'failed-precondition' || 
          error.message?.includes('offline') ||
          error.message?.includes('network') ||
          error.message?.includes('client is offline') ||
          error.code === 'unavailable') {
        console.warn('Firestore offline - using cached data');
        setToast({
          message: 'Working offline - guides may not be up to date',
          type: 'warning'
        });
        // Don't show error toast for offline scenarios
        return;
      }
      
      let errorMessage = 'Failed to load saved guides';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please sign in again.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Authentication expired. Please sign in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setToast({
        message: errorMessage,
        type: 'error'
      });
    }
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

  const saveGuide = async () => {
    console.log('Save guide called');
    
    if (!user) {
      console.log('No user - showing error toast');
      setToast({
        message: 'Please sign in to save guides',
        type: 'error'
      });
      return;
    }
    
    if (!currentGuide || !currentGuide.title || !currentGuide.steps || currentGuide.steps.length === 0) {
      console.log('No valid guide to save');
      setToast({
        message: 'No guide to save',
        type: 'error'
      });
      return;
    }
    
    setSaving(true);
    console.log('Starting save process...');
    
    try {
      // Validate and clean the data before saving
      const cleanSteps = currentGuide.steps
        .filter(step => step && typeof step === 'string' && step.trim().length > 0)
        .map(step => step.trim());
      
      if (cleanSteps.length === 0) {
        throw new Error('No valid steps to save');
      }
      
      // Create a clean explanations object
      const cleanExplanations = {};
      if (currentGuide.explanations && typeof currentGuide.explanations === 'object') {
        Object.keys(currentGuide.explanations).forEach(key => {
          const explanation = currentGuide.explanations[key];
          if (explanation && typeof explanation === 'string' && explanation.trim().length > 0) {
            cleanExplanations[key] = explanation.trim();
          }
        });
      }
      
      const guideData = {
        userId: user.uid,
        title: String(currentGuide.title || '').trim(),
        steps: cleanSteps,
        explanations: cleanExplanations,
        prompt: String(prompt || '').trim(),
        timestamp: new Date(),
        // Ensure all metadata is properly typed
        subject: String(subject || 'General'),
        audience: String(audience || 'Beginner'),
        style: String(style || 'Casual'),
        detail: Number(detail) || 2,
        tone: String(tone || 'Friendly'),
        custom: String(custom || '').trim()
      };
      
      console.log('Guide data to save:', guideData);
      
      // Check if we're offline or have connection issues
      if (!navigator.onLine) {
        console.log('Device is offline, queuing save');
        setSaveQueue(prev => [...prev, guideData]);
        setToast({
          message: 'You\'re offline. Guide will be saved when connection is restored.',
          type: 'warning'
        });
        return;
      }
      
      // Try to save with timeout
      const savePromise = saveGuideToFirestore(guideData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout')), 10000)
      );
      
      const newGuideId = await Promise.race([savePromise, timeoutPromise]);
      
      if (newGuideId) {
        // Update currentGuide with new ID
        setCurrentGuide(prev => ({ ...prev, id: newGuideId }));
      }
      
      // Show success message
      setToast({
        message: currentGuide.id 
          ? 'Guide updated successfully!' 
          : 'Guide saved successfully!',
        type: 'success'
      });
      
      // Refresh saved guides list
      console.log('Refreshing saved guides list');
      await loadSavedGuides(user.uid);
      console.log('Save process completed successfully');
      
    } catch (error) {
      console.error('Save error:', error);
      
      // Check if it's a connection error
      if (error.message?.includes('timeout') || 
          error.code === 'unavailable' ||
          error.message?.includes('offline') ||
          error.message?.includes('network')) {
        
        console.log('Connection error detected, queuing save');
        setSaveQueue(prev => [...prev, guideData]);
        setToast({
          message: 'Connection issue detected. Guide will be saved when connection is restored.',
          type: 'warning'
        });
        return;
      }
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save guide';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please sign in again.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Authentication expired. Please sign in again.';
      } else if (error.code === 'resource-exhausted') {
        errorMessage = 'Database quota exceeded. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setToast({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Close toast
  const closeToast = () => {
    setToast(null);
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
    setSubject(guide.subject || 'General');
    setAudience(guide.audience || 'Beginner');
    setStyle(guide.style || 'Casual');
    setDetail(guide.detail || 2);
    setTone(guide.tone || 'Friendly');
    setCustom(guide.custom || '');
    
    setCurrentGuide({
      id: guide.id,
      title: guide.title,
      steps: guide.steps,
      explanations: guide.explanations || {}
    });
    
    setIsViewingGuide(true);
  };

  // Reset guide creation process
  const resetGuideCreation = () => {
    setPrompt('');
    setError('');
    setIsViewingGuide(false);
    setCurrentGuide(null);
  };

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
    setIsViewingGuide(false);
    
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
  
        // STEP EXTRACTION
        const lines = text.split('\n').filter(Boolean);
        const title = lines[0] || 'Guide';
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
        
        setCurrentGuide({
          title,
          steps: extractedSteps,
          explanations: {}
        });
        
        setIsViewingGuide(true);
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
      } finally {
        setLoadingGuide(false);
      }
    }
  };
  
  const explainStep = async (index, stepText) => {
    if (currentGuide?.explanations?.[index]) {
      setCurrentGuide(prev => ({
        ...prev,
        explanations: {
          ...prev.explanations,
          [index]: null
        }
      }));
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
      
      setCurrentGuide(prev => ({
        ...prev,
        explanations: {
          ...prev.explanations,
          [index]: data.explanation
        }
      }));
    } catch (e) {
      setCurrentGuide(prev => ({
        ...prev,
        explanations: {
          ...prev.explanations,
          [index]: e.message || 'Failed to load explanation'
        }
      }));
      console.error('Explanation error:', e);
    } finally {
      setLoadingExplanationIndex(null);
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <ToastNotification 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast} 
        />
      )}
      {error && (
        <div className="global-error">
          <strong>Error:</strong> {error}
        </div>
      )}
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
        logOut={logOut} // Fixed reference
      />
      {/* Sidebar open button (only when sidebar is closed) */}
      {!sidebarOpen && (
        <button
          className="sidebar-open-btn"
          aria-label="Open sidebar"
          title="Open sidebar"
          onClick={() => setSidebarOpen(true)}
          style={{ background: 'transparent', boxShadow: 'none', border: 'none', padding: 0, minWidth: 0, minHeight: 0 }}
        >
          <FiChevronRight size={28} color="#6366f1" style={{ opacity: 0.85 }} />
        </button>
      )}
      {/* Floating theme toggle button */}
      <button 
        className="theme-toggle-floating"
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {darkMode ? <FiSun /> : <FiMoon />}
      </button>
      <div className="main-content-wrapper">
        <div className="header">
          <div className="logo">
            <FiZap className="logo-icon" />
            <h1>Ask SMEGLY</h1>
          </div>
          <p className="subtitle">Transform complex tasks into step-by-step guides with SMEGLY assistance</p>
        </div>

        <div className="main-content">
          {!isViewingGuide ? (
            <GuideCreation
              prompt={prompt}
              setPrompt={setPrompt}
              subject={subject}
              setSubject={setSubject}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              audience={audience}
              setAudience={setAudience}
              style={style}
              setStyle={setStyle}
              numSteps={numSteps}
              setNumSteps={setNumSteps}
              detail={detail}
              setDetail={setDetail}
              tone={tone}
              setTone={setTone}
              custom={custom}
              setCustom={setCustom}
              error={error}
              loadingGuide={loadingGuide}
              apiBaseUrl={apiBaseUrl}
              generateGuide={generateGuide}
              subjects={subjects}
            />
          ) : (
            <GuideViewer
              currentGuide={currentGuide}
              user={user}
              saving={saving}
              loadingExplanationIndex={loadingExplanationIndex}
              explainStep={explainStep}
              saveGuide={saveGuide}
              resetGuideCreation={resetGuideCreation}
              prompt={prompt}
              subject={subject}
              audience={audience}
              style={style}
              detail={detail}
              tone={tone}
              custom={custom}
              isOnline={isOnline}
              saveQueue={saveQueue}
              isProcessingQueue={isProcessingQueue}
            />
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
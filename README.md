# AI Guide Generator (Howie)

An intelligent web application that generates personalized step-by-step guides using AI. Built with React, Firebase, and powered by DeepSeek AI.

![Howie Logo](public/howie-logo.svg)

## Features

### AI-Powered Guide Generation
- **Smart Prompts**: Describe any task or concept and get a detailed step-by-step guide
- **Multiple Subjects**: 24+ categories including Technology, Cooking, Health & Fitness, Education, and more
- **Customizable Output**: Adjust audience level, style, detail, tone, and number of steps
- **Step Explanations**: Get detailed explanations for any step with a single click

### User Management
- **Secure Authentication**: Email/password signup and login
- **Personal Guide Library**: Save and organize your generated guides
- **Offline Support**: Create guides offline, save when connection is restored
- **User Profiles**: Personalized experience with saved preferences

### Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Real-time Feedback**: Toast notifications and loading states
- **Intuitive Interface**: Clean, modern design with smooth animations

## Architecture

### Frontend (React + Vite)
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **React Icons**: Beautiful icon library for UI elements
- **CSS Modules**: Scoped styling for components

### Backend (Firebase)
- **Firebase Authentication**: Secure user management
- **Firestore Database**: NoSQL database for storing guides and user data
- **Firebase Functions**: Serverless backend for AI integration
- **Firebase Hosting**: Fast, secure hosting with CDN

### AI Integration
- **DeepSeek AI**: Advanced language model for guide generation
- **Google Secret Manager**: Secure API key management
- **Rate Limiting**: Express rate limiting for API protection
- **Error Handling**: Comprehensive error handling and retry logic

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- DeepSeek API key

### 1. Clone the Repository
```bash
git clone https://github.com/Niftys/guide-generator.git
cd guide-generator
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 3. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Set up Firebase Functions
5. Configure Firebase Hosting

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Google Secret Manager Setup
1. Enable Google Secret Manager API
2. Create a secret named `DEEPSEEK_API_KEY`
3. Add your DeepSeek API key to the secret
4. Grant Firebase Functions access to Secret Manager

### 6. Deploy Firebase Functions
```bash
cd functions
npm run deploy
cd ..
```

### 7. Start Development Server
```bash
npm run dev
```

## Deployment

### Firebase Hosting
```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

### Environment Variables
Make sure to set up environment variables in your production environment:
- Firebase configuration
- DeepSeek API key in Google Secret Manager

## Usage

### Creating a Guide
1. **Enter your prompt**: Describe what you want to learn or accomplish
2. **Select subject**: Choose from 24+ categories for better AI context
3. **Customize settings** (optional): Adjust audience, style, detail level, and tone
4. **Generate**: Click "Generate Guide" and wait for AI processing
5. **Review**: Read through the generated steps
6. **Get explanations**: Click the help icon next to any step for detailed explanations
7. **Save**: Save to your personal library (requires account)

### Managing Guides
- **View saved guides**: Access your guide library from the sidebar
- **Edit guides**: Modify saved guides with new prompts
- **Delete guides**: Remove guides you no longer need
- **Offline access**: View saved guides even without internet

### Advanced Settings
- **Audience**: Beginner, Intermediate, or Expert
- **Style**: Casual, Professional, or Technical
- **Detail Level**: Concise, Balanced, or Detailed
- **Tone**: Friendly, Authoritative, or Humorous
- **Custom Instructions**: Add specific requirements or preferences

## Configuration

### Firebase Configuration
Update `src/firebase.js` with your Firebase project settings:
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ... other config
};
```

### AI Model Configuration
Modify `functions/gpt.js` to adjust AI behavior:
- Model selection
- Token limits
- Temperature settings
- System prompts

### Rate Limiting
Configure rate limits in `functions/index.js`:
```javascript
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute
  // ... other settings
});
```

## Development

### Project Structure
```
ai-guide-generator-react/
├── src/
│   ├── components/          # React components
│   │   ├── AuthSidebar.jsx  # User authentication and guide management
│   │   ├── GuideCreation.jsx # Guide generation interface
│   │   ├── GuideViewer.jsx  # Guide display and interaction
│   │   └── ToastNotification.jsx # User feedback
│   ├── App.jsx             # Main application component
│   ├── firebase.js         # Firebase configuration and utilities
│   └── main.jsx           # Application entry point
├── functions/              # Firebase Functions (backend)
│   ├── index.js           # API endpoints
│   └── gpt.js             # AI integration
├── public/                # Static assets
└── firebase.json          # Firebase configuration
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run server       # Start backend server (if needed)
```

### Firebase Functions Scripts
```bash
cd functions
npm run serve        # Start Firebase emulator
npm run deploy       # Deploy functions
npm run logs         # View function logs
```

## Security

### Implemented Security Measures
- **Environment Variables**: All secrets stored in environment variables
- **Google Secret Manager**: API keys securely managed
- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: All user inputs validated and sanitized
- **CORS Configuration**: Proper cross-origin resource sharing
- **Firebase Security Rules**: Database access controlled by security rules

### Security Best Practices
- Never commit `.env` files
- Use Firebase Security Rules for database access
- Implement proper authentication flows
- Validate all user inputs
- Use HTTPS in production
- Regular dependency updates

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow React best practices
- Use functional components with hooks
- Maintain consistent code formatting
- Add proper error handling
- Write meaningful commit messages
- Test thoroughly before submitting

## Acknowledgments

- **DeepSeek AI** for providing the language model
- **Firebase** for the backend infrastructure
- **React** team for the amazing framework
- **Vite** for the fast build tool
- **React Icons** for the beautiful icon library

## Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/Niftys/ai-guide-generator-react/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Provide error messages and console logs

---

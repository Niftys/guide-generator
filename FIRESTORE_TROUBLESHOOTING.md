# Firestore Troubleshooting Guide

## Common Issues and Solutions

### 1. Connection Problems

**Symptoms:**
- "Failed to save guide" errors
- "Unable to connect to database" messages
- Guides not loading

**Solutions:**
- Check your internet connection
- Ensure Firebase project is properly configured
- Verify Firestore rules allow read/write access
- Try refreshing the page

### 2. Authentication Issues

**Symptoms:**
- "Permission denied" errors
- "Authentication expired" messages
- Can't save guides even when signed in

**Solutions:**
- Sign out and sign back in
- Clear browser cache and cookies
- Check if your Firebase Auth is properly configured
- Verify user has proper permissions in Firestore rules

### 3. Offline Mode

**Symptoms:**
- Save button shows "Offline"
- Network status indicator shows offline
- "Working offline" warning messages

**Solutions:**
- Check your internet connection
- Wait for connection to be restored
- The app will automatically sync when back online

### 4. Data Validation Issues

**Symptoms:**
- "No valid steps to save" errors
- Empty guides being saved
- Malformed data in database

**Solutions:**
- Ensure guide has a title and at least one step
- Check that all required fields are filled
- Try creating a new guide

## Firestore Rules Example

Make sure your Firestore security rules allow authenticated users to read/write their own guides:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own guides
    match /guides/{guideId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Browser Compatibility

The app uses IndexedDB for offline persistence. This feature is supported in:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

## Debug Mode

To enable debug logging, open browser console and look for:
- Firestore connection status
- Save/load operation logs
- Network status changes
- Error details

## Getting Help

If you continue to experience issues:
1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Test with a different browser
4. Check if the issue occurs in incognito mode 
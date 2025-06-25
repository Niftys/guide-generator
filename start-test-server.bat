@echo off
echo Starting test server on http://localhost:8000
echo Open http://localhost:8000/test-firestore.html in your browser
echo Press Ctrl+C to stop the server
python -m http.server 8000 
const API_BASE = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:3000';

// Utility to get current tab
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Deep Link to Dashboard Handler
document.getElementById('openStudioBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.url || !tab.url.includes('youtube.com')) {
      showStatus('Please navigate to a YouTube video first!', 'error');
      return;
    }
    
    // Format: http://localhost:5173/?url={encodedUrl}
    const studioUrl = `${FRONTEND_URL}/?url=${encodeURIComponent(tab.url)}`;
    chrome.tabs.create({ url: studioUrl });
    window.close(); // Close extension popup
  } catch (err) {
    showStatus('Failed to open studio: ' + err.message, 'error');
  }
});

// Quick Generate Handler
document.getElementById('generateBtn').addEventListener('click', async () => {
  const btn = document.getElementById('generateBtn');
  const notesDiv = document.getElementById('notes');
  
  btn.disabled = true;
  notesDiv.style.display = 'none';
  
  try {
    const tab = await getActiveTab();
    
    if (!tab || !tab.url || !tab.url.includes('youtube.com')) {
      showStatus('Please open a YouTube video first!', 'error');
      return;
    }

    // Phase 1: Extract transcript from Python backend
    showStatus('⏳ Fetching transcript from video...', 'loading');
    const extractRes = await fetch(`${API_BASE}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: tab.url })
    });

    if (!extractRes.ok) {
      const errData = await extractRes.json();
      throw new Error(errData.error || 'Failed to extract video data');
    }

    const extractData = await extractRes.json();
    const transcript = extractData.transcript;

    if (!transcript) {
      throw new Error('No transcript text found for this video.');
    }

    // Phase 2: Generate Quick Notes using AI Backend (Ollama)
    showStatus('🧠 Processing transcript with local AI...', 'loading');
    
    const notesRes = await fetch(`${API_BASE}/generate-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: transcript })
    });

    if (!notesRes.ok) {
      throw new Error('AI generation failed. Check if backend is active.');
    }

    const notesData = await notesRes.json();
    const generatedNotes = notesData.notes;

    // Format simple Markdown for the extension popup without full renderer
    notesDiv.textContent = cleanMarkdownForPopup(generatedNotes);
    notesDiv.style.display = 'block';
    showStatus('✨ Notes ready!', 'success');

  } catch (err) {
    showStatus(`❌ Error: ${err.message}\nEnsure python backend server.py is running on port 5000!`, 'error');
  } finally {
    btn.disabled = false;
  }
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type; // 'success', 'error', 'loading'
  status.style.display = 'block';
}

// Basic markdown simplifier so it doesn't look messy in textContent
function cleanMarkdownForPopup(text) {
  return text
    .replace(/#{1,4}\s/g, '') // Remove headers hashtags
    .replace(/\*\*/g, '')      // Remove bold markers
    .trim();
}

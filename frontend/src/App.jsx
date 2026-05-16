import { useState, useCallback } from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import NotesTab from './components/NotesTab';
import ChatTab from './components/ChatTab';
import {
  Video, FileText, Sparkles, RefreshCw, Brain, AlertCircle
} from 'lucide-react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState([]);
  const [notes, setNotes] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'transcript' | 'chat'
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // API Base URL
  const API_BASE = 'http://127.0.0.1:5000/api';

  // Extract video ID helper
  const extractVideoId = useCallback((url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, []);

  const triggerGenerateNotes = useCallback(async (rawTranscript) => {
    setGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: rawTranscript })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Backend notes generation failed');
      }

      const result = await response.json();
      setNotes(result.notes);
      setActiveTab('notes');
    } catch (err) {
      setError('AI Generation Failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  }, [API_BASE, setError, setGenerating, setNotes, setActiveTab]);

  const handleExtract = useCallback(async (targetUrl = null) => {
    const activeUrl = typeof targetUrl === 'string' ? targetUrl : url;
    const vid = extractVideoId(activeUrl);
    if (!vid) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setNotes('');
    setTranscript('');
    setSegments([]);
    setVideoInfo(null);


    try {
      const response = await fetch(`${API_BASE}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: activeUrl })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to connect to backend');
      }

      const data = await response.json();

      setTranscript(data.transcript);
      setSegments(data.transcript_segments || []);
      setVideoInfo({
        videoId: data.video_id,
        thumbnail: data.thumbnail
      });

      // Auto trigger generating notes once transcript is fetched
      triggerGenerateNotes(data.transcript);

    } catch (err) {
      setError(err.message + '. Ensure the Python backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, [url, extractVideoId, setLoading, setError, setNotes, setTranscript, setSegments, setVideoInfo, triggerGenerateNotes]);

  const handleAskAI = useCallback(async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || generating) return;

    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setGenerating(true);

    try {
      const response = await fetch(`${API_BASE}/improve-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes || transcript,
          instructions: userMsg
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get AI answer');
      }

      const result = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: result.improved_notes }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error: Could not reach the AI. Please try again.' }]);
    } finally {
      setGenerating(false);
    }
  }, [API_BASE, chatInput, generating, notes, transcript, setChatHistory, setChatInput, setGenerating]);


  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col relative">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6 min-h-0 lg:overflow-hidden">
        {/* Input Search Area */}
        <div className="glass-panel p-4 flex flex-col md:flex-row gap-3 items-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-600" />
          <div className="flex-1 w-full relative">
            <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Paste YouTube URL here (e.g., https://www.youtube.com/watch?v=...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleExtract(); }}
              className="w-full pl-12 pr-4 py-3.5 glass-input font-light placeholder:text-zinc-600"
            />
          </div>
          <button
            onClick={handleExtract}
            disabled={loading || !url}
            className="w-full md:w-auto px-6 py-3.5 premium-gradient hover:opacity-90 transition-all duration-200 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Extracting...' : 'Explain Video'}
          </button>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Video / Context Layout */}
        {!videoInfo && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-4 border border-dashed border-white/10 rounded-3xl">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-2 border border-white/5">
              <Video className="text-zinc-500 w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-white">Deep-Dive into any YouTube Video</h2>
            <p className="text-zinc-400 max-w-md text-sm leading-relaxed px-4">
              Paste a link above to automatically fetch transcripts, sync timestamps, and generate highly-structured, concept-driven AI notes using local Ollama.
            </p>
          </div>
        )}

        {(videoInfo || loading) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 lg:overflow-hidden">

            {/* Left Workspace: Video & Interactive Transcript */}
            <VideoPlayer
              url={url}
              loading={loading}
              videoInfo={videoInfo}
              setVideoInfo={setVideoInfo}
              triggerGenerateNotes={triggerGenerateNotes}
              transcript={transcript}
              setTranscript={setTranscript}
              segments={segments}
              setSegments={setSegments}
              setError={setError}
              setLoading={setLoading}
              handleExtract={handleExtract}
            />

            {/* Right Workspace: AI Insights Dashboard */}
            <div className="lg:col-span-7 flex flex-col glass-panel overflow-hidden min-h-0 lg:h-full">
              {/* Tab Header */}
              <div className="border-b border-white/5 px-4 py-1 bg-white/[0.01] flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`px-4 py-3 text-sm font-medium relative transition-all ${activeTab === 'notes' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> AI Study Notes
                    </div>
                    {activeTab === 'notes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full"></div>}
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-3 text-sm font-medium relative transition-all ${activeTab === 'chat' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" /> Chat with Video
                    </div>
                    {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full"></div>}
                  </button>
                </div>
              </div>

              {/* Tab Content Box */}
              <div className="flex-1 min-h-0 flex flex-col">
                {activeTab === 'notes' && (
                  <NotesTab
                    notes={notes}
                    generating={generating}
                    setActiveTab={setActiveTab}
                    setNotes={setNotes}
                    videoInfo={videoInfo}
                    handleAskAI={handleAskAI}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    chatHistory={chatHistory}
                    setChatHistory={setChatHistory}
                    setGenerating={setGenerating}
                  />
                )}

                {activeTab === 'chat' && (
                  <ChatTab
                    videoInfo={videoInfo}
                    generating={generating}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    chatHistory={chatHistory}
                    setChatHistory={setChatHistory}
                    handleAskAI={handleAskAI}
                    setGenerating={setGenerating}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
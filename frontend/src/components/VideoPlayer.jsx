import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw, List, Info, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

const VideoPlayer = ({ url, loading, videoInfo, setVideoInfo, triggerGenerateNotes, transcript, setTranscript, segments, setSegments, setError, setLoading, handleExtract }) => {
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptContainerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Deep link trigger for URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get('url');
    if (queryUrl) {
      // Small delay to ensure components have mounted
      setTimeout(() => {
        handleExtract(decodeURIComponent(queryUrl));
      }, 600);
    }
  }, [handleExtract]);

  // Setup polling for current video time when player is active
  useEffect(() => {
    if (videoInfo?.videoId) {
      // Re-initialize player whenever a new video gets loaded
      const initPlayer = () => {
        if (window.YT && window.YT.Player) {
          playerRef.current = new window.YT.Player('youtube-player', {
            videoId: videoInfo.videoId,
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange
            }
          });
        } else {
          setTimeout(initPlayer, 500);
        }
      };
      initPlayer();
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [videoInfo?.videoId]);

  const onPlayerReady = useCallback((event) => {
    console.log('Player ready');
  }, []);

  const onPlayerStateChange = useCallback((event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      // Start polling
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);

          // Auto-scroll to active segment (throttled to prevent jank)
          const activeEl = document.querySelector('.active-segment');
          if (activeEl && transcriptContainerRef.current) {
            requestAnimationFrame(() => {
              activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
          }
        }
      }, 1000); // Changed from 500ms to 1000ms for better performance
    } else {
      clearInterval(timerRef.current);
    }
  }, []);

  const handleSeek = useCallback((seconds) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true);
      playerRef.current.playVideo();
    }
  }, [playerRef]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  return (
    <div className="lg:col-span-5 flex flex-col gap-4 min-h-0 lg:h-full">
      {/* Video Container */}
      <div className="glass-panel overflow-hidden aspect-video relative flex items-center justify-center bg-black shrink-0">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-xs text-zinc-500 tracking-widest uppercase">Parsing Video</span>
          </div>
        ) : (
          <div id="youtube-player" className="w-full h-full"></div>
        )}
      </div>

      {/* Transcript Tab Panel */}
      <div className={`glass-panel flex flex-col transition-all duration-300 ease-in-out min-h-0 ${isCollapsed ? 'h-[48px] overflow-hidden' : 'flex-1 lg:h-[calc(100%-aspect-video)] min-h-[200px]'}`}>
        <div 
          className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.01] select-none cursor-pointer hover:bg-white/[0.03] transition-colors shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2 font-semibold text-white">
            <List className="w-4 h-4 text-red-400" />
            <span>Interactive Transcript</span>
          </div>
          <div className="flex items-center gap-3">
            {!isCollapsed && (
              <div className="hidden sm:flex text-[11px] text-zinc-500 items-center gap-1">
                <Info className="w-3 h-3" />
                Click to seek
              </div>
            )}
            <button className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-all">
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div
            ref={transcriptContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-1.5 select-none min-h-0"
          >
          {loading ? (
            <div className="space-y-4 mt-2 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-lg"></div>
              ))}
            </div>
          ) : segments.length > 0 ? (
            segments.map((seg, i) => {
              const isActive = currentTime >= seg.start && (!segments[i + 1] || currentTime < segments[i + 1].start);
              return (
                <div
                  key={i}
                  onClick={() => handleSeek(seg.start)}
                  className={`px-3 py-2.5 rounded-xl flex items-start gap-3 cursor-pointer transition-all hover:bg-white/5 border border-transparent duration-150 text-[13.5px] ${isActive ? 'active-segment' : 'text-zinc-400'}`}
                >
                  <span className={`font-mono text-xs px-2 py-0.5 rounded-md shrink-0 mt-0.5 font-medium flex items-center gap-1 ${isActive ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-zinc-500'}`}>
                    <Clock className="w-3 h-3" />
                    {formatTime(seg.start)}
                  </span>
                  <span className="leading-relaxed">{seg.text}</span>
                </div>
              )
            })
          ) : (
            <div className="text-center py-12 text-zinc-600 text-sm font-light">
              No transcript loaded yet.
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
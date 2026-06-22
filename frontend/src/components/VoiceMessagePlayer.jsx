import React, { useRef, useState } from 'react';

export default function VoiceMessagePlayer({ src, duration = null }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setAudioDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="voice-message-player flex items-center gap-2.5 w-full my-1.5 px-3 py-2.5 rounded-2xl bg-secondary/10">
      <span className="text-lg shrink-0" title="Voice Message">🎤</span>
      <button
        onClick={handlePlayPause}
        className={`shrink-0 w-8 h-8 rounded-full border-2 border-secondary flex items-center justify-center text-base transition-colors ${isPlaying ? 'bg-secondary text-white' : 'bg-white text-secondary'}`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶️'}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1 bg-secondary/20 rounded-full relative mb-0.5 w-full">
          <div className="absolute left-0 top-0 h-1 bg-secondary rounded-full transition-[width] duration-200" style={{ width: `${audioDuration ? (currentTime / audioDuration) * 100 : 0}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted w-full">
          <span>{formatTime(currentTime)}</span>
          <span>{audioDuration ? formatTime(audioDuration) : '--:--'}</span>
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} />
    </div>
  );
}

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

  // Format time as mm:ss
  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      background: 'linear-gradient(90deg, #ffe0ec 0%, #e0f7fa 100%)',
      borderRadius: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      margin: '8px 0',
      minWidth: 220,
      maxWidth: 400
    }}>
      <span style={{ fontSize: 22, marginRight: 8, color: '#ff4081' }} title="Voice Message">🎤</span>
      <button
        onClick={handlePlayPause}
        style={{
          background: isPlaying ? '#ff4081' : '#fff',
          color: isPlaying ? '#fff' : '#ff4081',
          border: '2px solid #ff4081',
          borderRadius: '50%',
          width: 40,
          height: 40,
          fontSize: 20,
          cursor: 'pointer',
          outline: 'none',
          transition: 'background 0.2s, color 0.2s'
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶️'}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{
          height: 6,
          background: '#ffe0ec',
          borderRadius: 3,
          position: 'relative',
          marginBottom: 4
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: 6,
            width: `${audioDuration ? (currentTime / audioDuration) * 100 : 0}%`,
            background: '#ff4081',
            borderRadius: 3,
            transition: 'width 0.2s'
          }} />
        </div>
        <div style={{ fontSize: 13, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{audioDuration ? formatTime(audioDuration) : '--:--'}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      />
    </div>
  );
}

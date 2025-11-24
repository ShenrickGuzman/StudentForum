import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const DRAFT_KEY = 'mf_newpost_draft';
export default function NewPostPage() {
  // Audio recording state
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
    // Audio recording handlers
    const startRecording = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => {
        audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    };

    const stopRecording = () => {
      mediaRecorderRef.current.stop();
      setRecording(false);
    };
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Academics');
  const categories = [
    { key: 'Academics', icon: '📚', colors: 'from-pink-400 to-pink-500' },
    { key: 'Arts', icon: '🎨', colors: 'from-rose-400 to-orange-300' },
    { key: 'Music', icon: '🎵', colors: 'from-indigo-400 to-fuchsia-400' },
    { key: 'Sports', icon: '🏀', colors: 'from-emerald-400 to-teal-400' },
    { key: 'Technology', icon: '💻', colors: 'from-cyan-400 to-blue-500' },
    { key: 'Ideas', icon: '💡', colors: 'from-amber-300 to-yellow-400' },
    { key: 'Random', icon: '✨', colors: 'from-purple-400 to-violet-500' },
  ];
  const [linkUrl, setLinkUrl] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const textareaRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (data.title) setTitle(data.title);
        if (data.content) setContent(data.content);
        if (data.category) setCategory(data.category);
        if (data.linkUrl) setLinkUrl(data.linkUrl);
      } catch {}
    }
    // eslint-disable-next-line
  }, []);

  // Auto-save draft as user types
  useEffect(() => {
    const draft = { title, content, category, linkUrl };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, content, category, linkUrl]);

  // Auto-resize textarea for mobile ergonomics
  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 420) + 'px';
    }
  }, [content]);

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadRes.data.url;
      }

      let audioFileUrl = '';
      console.log('audioBlob:', audioBlob);
      if (audioBlob) {
        const audioForm = new FormData();
        audioForm.append('file', audioBlob, 'voice-message.webm');
        const audioRes = await api.post('/upload/audio', audioForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log('audioRes:', audioRes);
        audioFileUrl = audioRes.data.url;
      }

      const payload = {
        title,
        content,
        category,
        linkUrl,
        imageUrl,
        audio_url: audioFileUrl,
        anonymous: anonymous === true ? true : false,
      };
      console.log('POST PAYLOAD:', payload);
      await api.post('/posts', payload);
      // Clear draft on successful submit
      localStorage.removeItem(DRAFT_KEY);
      navigate('/');
    } catch (err) {
      alert('Failed to post. Please try again!');
    } finally {
      setUploading(false);
    }
  }

  return (
  <div className="min-h-screen w-full font-cartoon relative overflow-x-hidden" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)', fontFamily: 'Fredoka, Comic Neue, Baloo, cursive'}}>
      {/* Floating pastel circles and extra playful shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <span className="hidden sm:block absolute left-8 top-8 w-20 h-20 rounded-full bg-yellow-200 opacity-30 motion-safe:animate-bounce-slow"></span>
        <span className="hidden sm:block absolute right-10 top-24 w-12 h-12 rounded-full bg-green-200 opacity-20 motion-safe:animate-spin-slow"></span>
        <span className="absolute left-1/4 bottom-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-pink-200 opacity-20 motion-safe:animate-bounce-short"></span>
        <span className="hidden md:block absolute right-1/3 top-1/2 w-16 h-16 rounded-full bg-blue-200 opacity-20 motion-safe:animate-bounce-slow"></span>
        <span className="hidden sm:block absolute left-10 bottom-24 w-12 h-12 rounded-full bg-purple-200 opacity-20 motion-safe:animate-spin-slow"></span>
        <span className="hidden sm:block absolute right-8 bottom-8 w-24 h-24 rounded-full bg-yellow-100 opacity-30 motion-safe:animate-bounce-short"></span>
        {/* Extra playful stars */}
        <span className="hidden sm:inline absolute left-1/2 top-1/4 text-yellow-400 text-4xl opacity-40 select-none">★</span>
        <span className="hidden sm:inline absolute right-1/4 bottom-1/3 text-pink-400 text-3xl opacity-30 select-none">★</span>
      </div>
      <form
        onSubmit={submit}
  className="relative z-10 max-w-2xl mx-auto mt-6 sm:mt-16 p-5 sm:p-10 flex flex-col gap-6 sm:gap-7 bg-white/95 rounded-[2rem] sm:rounded-[2.5rem] shadow-fun border-4 border-pink-200 animate-pop"
        style={{ backdropFilter: 'blur(6px)', boxShadow: '0 8px 32px 0 rgba(255, 182, 193, 0.25), 0 1.5px 0 0 #fcb7ee' }}
      >
        <button
          type="button"
          className="absolute left-4 top-4 px-5 py-2 rounded-full bg-gradient-to-r from-yellow-200 via-pink-200 to-pink-300 text-purple-800 font-extrabold shadow-fun border-4 border-pink-200 hover:scale-110 hover:bg-yellow-100 transition-all flex items-center gap-2 drop-shadow-lg hover:drop-shadow-2xl"
          onClick={() => navigate('/')}
          style={{zIndex: 20, fontFamily: 'Baloo, Fredoka, Comic Neue, cursive'}}
          aria-label="Back to Home"
        >
          <span className="text-2xl">⬅️</span> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 justify-center">
          <span className="text-4xl sm:text-5xl animate-wiggle">✏️</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-pink-500 drop-shadow-lg text-center font-cartoon" style={{fontFamily: 'Fredoka, Comic Neue, Baloo, cursive', letterSpacing: 1}}>Create a Post</h1>
        </div>
        {/* Audio Recorder UI */}
        <div className="mb-4">
          <label className="block mb-2 font-extrabold text-pink-500 text-lg font-cartoon">Record a Voice Message <span className="font-normal text-purple-400">(optional)</span></label>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className={`rounded-xl px-4 py-2 font-bold shadow-fun border-2 border-pink-300 bg-gradient-to-r from-pink-200 to-yellow-100 text-purple-700 transition-all ${recording ? 'bg-yellow-200' : ''}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading}
            >{recording ? 'Stop Recording' : 'Record Voice Message'}</button>
            {audioUrl && (
              <audio controls src={audioUrl} className="ml-2" />
            )}
            {audioUrl && (
              <button type="button" className="ml-2 text-red-500 font-bold" onClick={() => { setAudioBlob(null); setAudioUrl(''); }}>Remove</button>
            )}
          </div>
        </div>
        <input
          className="rounded-2xl sm:rounded-3xl px-5 sm:px-7 py-4 sm:py-5 border-4 border-yellow-200 w-full text-xl sm:text-2xl font-extrabold focus:ring-4 focus:ring-pink-200 outline-none transition-all bg-pink-50 placeholder:text-purple-300 shadow-fun hover:scale-[1.02] sm:hover:scale-105 focus:scale-[1.02] sm:focus:scale-105 duration-200"
          placeholder="Title (make it fun!)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}} 
        />
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={e => setAnonymous(e.target.checked)}
              className="w-5 h-5 accent-pink-500"
            />
            <span className="font-bold text-pink-500">Post Anonymously</span>
          </label>
          <label className="text-xs sm:text-sm font-bold text-purple-500 tracking-wide uppercase pl-1 sm:pl-4" style={{fontFamily: 'Baloo, Fredoka, Comic Neue, cursive'}}>Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {categories.map(c => {
              const active = c.key === category;
              return (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`relative group rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-4 font-extrabold text-sm sm:text-lg flex items-center justify-center gap-1.5 sm:gap-2 border-4 transition-all shadow-fun focus:outline-none focus:ring-4 focus:ring-pink-200 hover:scale-[1.03] sm:hover:scale-105 duration-200 whitespace-nowrap ${active ? 'border-yellow-300 scale-[1.03] sm:scale-105' : 'border-yellow-200'} bg-gradient-to-br ${c.colors} text-white`}
                  aria-pressed={active}
                >
                  <span className="text-base sm:text-xl group-hover:rotate-6 transition-transform">{c.icon}</span>
                  <span>{c.key}</span>
                  {active && <span className="absolute -top-2 -right-2 bg-white text-pink-500 rounded-full text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 shadow">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          className="rounded-2xl sm:rounded-3xl px-5 sm:px-7 py-4 sm:py-5 border-4 border-yellow-200 w-full min-h-[120px] text-xl sm:text-2xl font-extrabold focus:ring-4 focus:ring-pink-200 outline-none transition-all bg-pink-50 placeholder:text-purple-300 shadow-fun hover:scale-[1.02] sm:hover:scale-105 focus:scale-[1.02] sm:focus:scale-105 duration-200 resize-none"
          placeholder="What's on your mind? (Share your story!)"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
        />
        <div>
          <label className="block mb-2 font-extrabold text-pink-500 text-lg font-cartoon">Upload a Photo/File <span className="font-normal text-purple-400">(optional)</span></label>
          <label
            htmlFor="file-upload"
            className="inline-block cursor-pointer rounded-2xl border-4 border-yellow-200 bg-pink-100 px-6 py-3 text-lg font-bold text-purple-700 shadow-fun transition-all hover:bg-yellow-100 focus:outline-none focus:ring-4 focus:ring-pink-200 hover:scale-105 duration-200"
            style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
          >
            Choose file
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {imageFile && (
            <div className="mt-3 border-4 border-pink-300 rounded-2xl p-2 max-w-xs bg-white shadow-fun animate-pop">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="max-w-full max-h-48 object-contain rounded-xl"
              />
            </div>
          )}
        </div>
        <input
          className="rounded-2xl sm:rounded-3xl px-5 sm:px-7 py-4 sm:py-5 border-4 border-yellow-200 w-full text-xl sm:text-2xl font-extrabold focus:ring-4 focus:ring-pink-200 outline-none transition-all bg-pink-50 placeholder:text-purple-300 shadow-fun hover:scale-[1.02] sm:hover:scale-105 focus:scale-[1.02] sm:focus:scale-105 duration-200"
          placeholder="Link URL (optional)"
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
          style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
        />
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-1 sm:mt-2">
          <button
            type="button"
            onClick={() => {
              const draft = { title, content, category, linkUrl };
              localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
              const el = document.getElementById('draftSavedBadge');
              if (el) {
                el.classList.remove('opacity-0');
                el.classList.add('opacity-100');
                setTimeout(() => {
                  el.classList.add('opacity-0');
                }, 1800);
              }
            }}
            className="w-full text-base sm:text-xl py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-extrabold shadow-fun bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 hover:from-indigo-500 hover:via-purple-500 hover:to-fuchsia-500 text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 border-4 border-yellow-200 hover:scale-[1.03] sm:hover:scale-105 duration-200"
          >💾 Save Draft</button>
          <button
            className="w-full text-base sm:text-xl py-3 sm:py-4 rounded-2xl sm:rounded-3xl font-extrabold shadow-fun bg-gradient-to-r from-pink-400 via-yellow-300 to-orange-300 hover:from-pink-500 hover:via-yellow-400 hover:to-orange-400 text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 border-4 border-yellow-200 motion-safe:animate-bounce-short hover:scale-[1.03] sm:hover:scale-105 duration-200"
            type="submit"
            disabled={uploading}
          >
            {uploading ? <span className="animate-spin">🖼️</span> : <span className="animate-wiggle">🎉</span>} {uploading ? 'Uploading...' : 'Publish'}
          </button>
        </div>
        <div className="text-center mt-3 sm:mt-4 text-purple-400 font-bold text-sm sm:text-lg font-cartoon animate-pop">Your draft is saved automatically! 📝</div>
        <div id="draftSavedBadge" aria-live="polite" className="transition-opacity opacity-0 text-center text-emerald-600 font-bold text-sm sm:text-base">Draft saved!</div>
      </form>
    </div>
  );
}

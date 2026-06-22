import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../lib/Toast';
import { motion } from 'framer-motion';

const DRAFT_KEY = 'mf_newpost_draft';

const categories = [
  { key: 'Academics', label: 'Academics', icon: '📚' },
  { key: 'Arts', label: 'Arts', icon: '🎨' },
  { key: 'Music', label: 'Music', icon: '🎵' },
  { key: 'Sports', label: 'Sports', icon: '🏀' },
  { key: 'Technology', label: 'Technology', icon: '💻' },
  { key: 'Ideas', label: 'Ideas', icon: '💡' },
  { key: 'Random', label: 'Random', icon: '✨' },
];

export default function NewPostPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Academics');
  const [linkUrl, setLinkUrl] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const textareaRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new window.MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = e => { audioChunksRef.current.push(e.data); };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };
  const stopRecording = () => { mediaRecorderRef.current.stop(); setRecording(false); };

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
  }, []);

  useEffect(() => {
    const draft = { title, content, category, linkUrl };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, content, category, linkUrl]);

  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 420) + 'px';
    }
  }, [content]);

  async function submit(e) {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrls = [];
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          imageUrls.push(uploadRes.data.url);
        }
      }
      let audioFileUrl = '';
      if (audioBlob) {
        const audioForm = new FormData();
        audioForm.append('file', audioBlob, 'voice-message.webm');
        const audioRes = await api.post('/upload/audio', audioForm, { headers: { 'Content-Type': 'multipart/form-data' } });
        audioFileUrl = audioRes.data.url;
      }
      await api.post('/posts', { title, content, category, linkUrl, imageUrls, audio_url: audioFileUrl, anonymous });
      localStorage.removeItem(DRAFT_KEY);
      navigate('/');
    } catch (err) {
      toast.show('Failed to post. Please try again!', 'error');
    } finally { setUploading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button className="btn-secondary text-sm mb-4 flex items-center gap-1.5" onClick={() => navigate('/')}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      <motion.div className="card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-dark mb-6 text-center">Create a Post</h1>

        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${c.key === category ? 'bg-primary text-white shadow-button' : 'bg-gray-50 text-muted hover:bg-gray-100 border border-gray-200'}`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          <input
            className="w-full rounded-xl px-4 py-3 border border-gray-200 text-lg font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all bg-white"
            placeholder="Post title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <textarea
            ref={textareaRef}
            className="w-full rounded-xl px-4 py-3 border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all bg-white resize-none min-h-[160px]"
            placeholder="What's on your mind?"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Photos (optional)</label>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-muted cursor-pointer hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Choose files
              <input id="file-upload" type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setImageFiles(Array.from(e.target.files)); }} disabled={uploading} />
            </label>
            {imageFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {imageFiles.map((file, idx) => (
                  <img key={idx} src={URL.createObjectURL(file)} alt="" className="rounded-xl max-h-24 border border-gray-200" />
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1.5">Voice Message (optional)</label>
            <div className="flex items-center gap-3">
              <button type="button" className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${recording ? 'bg-error/10 text-error border-error/20' : 'bg-gray-50 text-muted border-gray-200 hover:bg-gray-100'}`} onClick={recording ? stopRecording : startRecording} disabled={uploading}>
                {recording ? 'Stop Recording' : 'Record Voice'}
              </button>
              {audioUrl && <audio controls src={audioUrl} className="h-8" />}
              {audioUrl && <button type="button" className="text-xs text-error" onClick={() => { setAudioBlob(null); setAudioUrl(''); }}>Remove</button>}
            </div>
          </div>

          <input
            className="w-full rounded-xl px-4 py-3 border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all bg-white"
            placeholder="Link URL (optional)"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm text-dark">
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="rounded" />
            Post anonymously
          </label>

          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1 text-sm" onClick={() => { const draft = { title, content, category, linkUrl }; localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); toast.show('Draft saved!', 'success'); }}>
              Save Draft
            </button>
            <button type="submit" className="btn-primary flex-1 text-sm flex items-center justify-center gap-2" disabled={uploading}>
              {uploading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Publishing...
                </span>
              ) : 'Publish'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

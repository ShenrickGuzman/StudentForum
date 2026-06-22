import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import api from '../lib/api';
import { reportComment } from '../lib/api';

export default function CommentCard({ avatar, username, badges = [], time, content, canDelete, onDelete, commentId, audio_url, image_url, replyButton, canEdit, onEdit, userId }) {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioUploading, setAudioUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const uploadAudioForComment = async () => {
    if (!audioBlob || !commentId) return;
    setAudioUploading(true);
    try {
      const audioForm = new FormData();
      audioForm.append('file', audioBlob, 'voice-message.webm');
      await api.post(`/upload/audio/comment/${commentId}`, { url: audioUrl });
    } catch (err) { alert('Failed to upload voice message.'); }
    finally { setAudioUploading(false); }
  };

  const handleDeleteClick = () => setShowConfirm(true);
  const handleConfirm = () => { setShowConfirm(false); if (onDelete) onDelete(); };
  const handleCancel = () => setShowConfirm(false);

  const handleReportClick = () => { setShowReport(true); setReportReason(''); setReportMsg(''); };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) { setReportMsg('Please enter a reason.'); return; }
    setReportLoading(true); setReportMsg('');
    try {
      await reportComment(commentId, reportReason);
      setReportMsg('Reported!');
      setTimeout(() => setShowReport(false), 1200);
    } catch (e) { setReportMsg(e?.response?.data?.error || 'Failed to report'); }
    setReportLoading(false);
  };

  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm relative comment-card-mobile">
      <div className="flex items-center gap-3 pb-2 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 text-base font-bold overflow-hidden">
          {React.isValidElement(avatar) ? (
            <div className="cursor-pointer" onClick={() => userId && navigate(`/profile/${userId}`)}>{avatar}</div>
          ) : (
            <img src={typeof avatar === 'string' && avatar.trim() ? avatar : '/Cute-Cat.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover cursor-pointer" onError={e => { e.target.src = '/Cute-Cat.png'; }} onClick={() => userId && navigate(`/profile/${userId}`)} />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-dark dark:text-dark-text cursor-pointer hover:underline" onClick={() => userId && navigate(`/profile/${userId}`)}>{username}</span>
          <div className="flex gap-1 mt-0.5">
            {Array.isArray(badges) && badges.length > 0 && badges.map((badge, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wide">{badge}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="pb-2">
        {editing ? (
          <div className="flex flex-col gap-2 mb-2">
            <textarea className="w-full rounded-xl px-3 py-2 border border-gray-200 dark:border-dark-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none min-h-[60px]" value={editText} onChange={e => setEditText(e.target.value)} rows={3} disabled={editSaving} />
            <div className="flex gap-2">
              <button className="btn-primary text-xs py-1.5 px-3" disabled={editSaving} onClick={async () => {
                if (!editText.trim()) return;
                setEditSaving(true);
                try {
                  await api.put(`/posts/comments/${commentId}`, { content: editText });
                  setEditing(false);
                  if (onEdit) onEdit(editText);
                } catch (err) { alert('Failed to update comment.'); }
                finally { setEditSaving(false); }
              }}>{editSaving ? 'Saving...' : 'Save'}</button>
              <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-dark dark:text-dark-text leading-relaxed mb-2 break-words whitespace-pre-line">{content}</div>
        )}
        {audio_url && (
          <div className="mb-2">
            <label className="block mb-1 font-semibold text-xs text-muted dark:text-dark-muted">Voice Message</label>
            <VoiceMessagePlayer src={audio_url} />
          </div>
        )}
        {Array.isArray(image_url) && image_url.length > 0 ? (
          <div className="flex flex-wrap justify-center mt-2 gap-2">
            {image_url.map((url, idx) => (
              <img key={idx} src={url} alt={`Comment ${idx + 1}`} className="rounded-xl max-h-44 border border-gray-200 dark:border-dark-border cursor-pointer hover:opacity-90 transition-opacity bg-white dark:bg-dark-surface" onClick={() => { setModalImageUrl(url); setShowImageModal(true); }} />
            ))}
          </div>
        ) : (typeof image_url === 'string' && image_url) ? (
          <div className="flex justify-center mt-2">
            <img src={image_url} alt="Comment" className="rounded-xl max-h-44 border border-gray-200 dark:border-dark-border cursor-pointer hover:opacity-90 transition-opacity bg-white dark:bg-dark-surface" onClick={() => { setModalImageUrl(image_url); setShowImageModal(true); }} />
          </div>
        ) : null}
      </div>
      <div className="flex flex-col md:flex-row md:items-center items-start pt-2 mt-2 w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center w-full md:w-auto">
          <div className="flex flex-row gap-1.5 rounded-xl bg-gray-50 dark:bg-dark-bg px-2 py-1.5 w-fit md:w-fit items-center">
            {canEdit && (
              <button className="rounded-full w-8 h-8 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-muted dark:text-dark-muted text-sm hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center" onClick={() => { setEditText(typeof content === 'string' ? content : ''); setEditing(true); }} title="Edit comment" aria-label="Edit">✏️</button>
            )}
            {canDelete && (
              <button className="rounded-full w-8 h-8 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-muted dark:text-dark-muted text-sm hover:bg-error/5 hover:text-error hover:border-error/30 transition-all flex items-center justify-center" onClick={handleDeleteClick} title="Delete comment" aria-label="Delete">🗑️</button>
            )}
            <button className="rounded-full w-8 h-8 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-muted dark:text-dark-muted text-sm hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all flex items-center justify-center" onClick={handleReportClick} title="Report comment" aria-label="Report">🚩</button>
            <span className="flex items-center justify-center">{replyButton}</span>
          </div>
        </div>
        <span className="text-xs text-muted dark:text-dark-muted mt-2 md:mt-0 md:ml-auto">{time}</span>
      </div>
      {showImageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={() => setShowImageModal(false)}>
          <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={modalImageUrl} alt="Preview" className="rounded-2xl object-contain max-w-[100vw] max-h-[90vh] bg-white dark:bg-dark-surface" />
            <button className="absolute top-3 right-3 bg-white/90 text-dark dark:text-dark-text rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white transition text-lg" onClick={() => setShowImageModal(false)} aria-label="Close">✕</button>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 600px) {
          .comment-card-mobile { padding: 0.7rem !important; }
        }
      `}</style>
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 rounded-2xl">
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg p-5 flex flex-col items-center">
            <div className="font-bold text-sm text-dark dark:text-dark-text mb-3">Delete this comment?</div>
            <div className="flex gap-3">
              <button className="btn-primary text-xs px-4 py-1.5" onClick={handleConfirm}>Yes</button>
              <button className="btn-secondary text-xs px-4 py-1.5" onClick={handleCancel}>No</button>
            </div>
          </div>
        </div>
      )}
      {showReport && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20 rounded-2xl">
          <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg p-5 flex flex-col items-center w-72">
            <div className="font-bold text-sm text-dark dark:text-dark-text mb-3">Report Comment</div>
            <input className="w-full rounded-lg px-3 py-2 border border-gray-200 dark:border-dark-border text-sm mb-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" placeholder="Reason for reporting" value={reportReason} onChange={e => setReportReason(e.target.value)} disabled={reportLoading} />
            {reportMsg && <p className="text-xs text-error mb-2">{reportMsg}</p>}
            <div className="flex gap-3 mt-1">
              <button className="btn-primary text-xs px-4 py-1.5" onClick={handleReportSubmit} disabled={reportLoading}>{reportLoading ? 'Reporting...' : 'Report'}</button>
              <button className="btn-secondary text-xs px-4 py-1.5" onClick={() => setShowReport(false)} disabled={reportLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

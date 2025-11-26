import React, { useState, useRef } from 'react';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import api from '../lib/api';
import { reportComment } from '../lib/api';

export default function CommentCard({ avatar, username, badges = [], time, content, canDelete, onDelete, commentId, audio_url, image_url, replyButton }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  // Voice message states
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioUploading, setAudioUploading] = useState(false);
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

  // Upload audio after comment creation (simulate here, should be called after comment is created)
  const uploadAudioForComment = async () => {
    if (!audioBlob || !commentId) return;
    setAudioUploading(true);
    try {
      const audioForm = new FormData();
      audioForm.append('file', audioBlob, 'voice-message.webm');
      await api.post(`/upload/audio/comment/${commentId}`, { url: audioUrl }); // This is a placeholder, should send file
      // In real use, upload the file and get the public URL, then call the endpoint with { url }
    } catch (err) {
      alert('Failed to upload voice message for comment.');
    } finally {
      setAudioUploading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    if (onDelete) onDelete();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const handleReportClick = () => {
    setShowReport(true);
    setReportReason('');
    setReportMsg('');
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      setReportMsg('Please enter a reason.');
      return;
    }
    setReportLoading(true);
    setReportMsg('');
    try {
      await reportComment(commentId, reportReason);
      setReportMsg('Reported!');
      setTimeout(() => setShowReport(false), 1200);
    } catch (e) {
      setReportMsg(e?.response?.data?.error || 'Failed to report comment');
    }
    setReportLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-pink-100 via-yellow-100 to-purple-100 rounded-2xl p-5 mb-4 border-2 border-pink-200 shadow-fun relative comment-card-mobile">
      {/* Header: Author info */}
      <div className="flex items-center gap-3 pb-2 border-b-2 border-pink-200 mb-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-yellow-200 text-2xl font-bold overflow-hidden comment-avatar-mobile shadow-fun">
          {React.isValidElement(avatar) ? avatar : (
            <img
              src={typeof avatar === 'string' && avatar.trim() ? avatar : '/Cute-Cat.png'}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover"
              style={{objectFit:'cover'}}
              onError={e => { e.target.src = '/Cute-Cat.png'; }}
            />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-pink-500 text-lg font-cartoony drop-shadow">{username}</span>
          <div className="flex gap-1 mt-1">
            {Array.isArray(badges) && badges.length > 0 && badges.map((badge, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-full bg-yellow-100 border-2 border-yellow-300 text-yellow-700 text-xs font-bold uppercase tracking-wide shadow-fun font-cartoony">{badge}</span>
            ))}
          </div>
        </div>
      </div>
      {/* Content: Comment text, voice, image */}
      <div className="pb-2">
        <div className="text-purple-700 text-base font-cartoony font-semibold mb-2 break-words whitespace-pre-line drop-shadow">{content}</div>
        {audio_url && (
          <div className="mb-2">
            <label className="block mb-1 font-bold text-pink-500 text-sm font-cartoony">Voice Message</label>
            <VoiceMessagePlayer src={audio_url} />
          </div>
        )}
        {image_url && (
          <div className="flex justify-center mt-2">
            <img
              src={image_url}
              alt="Comment"
              className="rounded-xl max-h-56 border-4 border-pink-200 shadow-fun cursor-pointer hover:scale-105 transition duration-150 bg-white"
              onClick={() => {
                setModalImageUrl(image_url);
                setShowImageModal(true);
              }}
            />
          </div>
        )}
      </div>
      {/* Footer: Actions */}
      <div className="flex flex-col md:flex-row md:items-center items-start pt-2 border-t-2 border-pink-200 mt-3 w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center w-full md:w-auto">
          <span className="text-xs text-purple-400 font-cartoony mb-1 ml-1 md:mb-0 md:mr-3">Actions</span>
          <div className="flex flex-row gap-2 rounded-2xl bg-gradient-to-r from-pink-100 via-yellow-100 to-orange-100 px-3 py-2 shadow-fun w-fit md:w-fit items-center">
            {canDelete && (
              <button
                className="rounded-full w-10 h-10 bg-gradient-to-r from-pink-200 to-orange-200 text-purple-700 text-lg shadow-fun font-cartoony hover:scale-110 hover:-translate-y-1 transition-transform duration-150 flex items-center justify-center"
                onClick={handleDeleteClick}
                title="Delete comment"
                aria-label="Delete"
              >🗑️</button>
            )}
            <button
              className="rounded-full w-10 h-10 bg-gradient-to-r from-yellow-200 to-pink-200 text-purple-700 text-lg shadow-fun font-cartoony hover:scale-110 hover:-translate-y-1 transition-transform duration-150 flex items-center justify-center"
              onClick={handleReportClick}
              title="Report comment"
              aria-label="Report"
            >🚩</button>
            <span className="hover:scale-110 hover:-translate-y-1 transition-transform duration-150 flex items-center justify-center">
              {replyButton}
            </span>
          </div>
        </div>
        <span className="text-xs text-purple-400 font-cartoony comment-date-mobile whitespace-nowrap mt-2 ml-1 md:ml-4">{time}</span>
      </div>
      {showImageModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 animate-pop"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={modalImageUrl}
              alt="Preview"
              className="rounded-2xl object-contain shadow-2xl border-4 border-pink-200 bg-white"
              style={{
                background: 'white',
                maxWidth: '100vw',
                maxHeight: '90vh',
                width: '100%',
                height: 'auto',
                display: 'block',
                margin: 'auto',
                boxSizing: 'border-box',
              }}
            />
            <button
              className="absolute top-2 right-2 bg-pink-500 text-white rounded-full p-3 shadow-lg hover:bg-pink-700 transition text-xl focus:outline-none"
              style={{ fontSize: '2rem', minWidth: '44px', minHeight: '44px', touchAction: 'manipulation' }}
              onClick={() => setShowImageModal(false)}
              aria-label="Close image preview"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 600px) {
          .voice-message-mobile {
            margin-bottom: 0.5rem !important;
          }
          .comment-card-mobile {
            padding: 0.7rem !important;
            gap: 0.5rem !important;
            font-size: 0.97rem !important;
          }
          .comment-avatar-mobile {
            width: 2.3rem !important;
            height: 2.3rem !important;
          }
          .comment-meta-mobile {
            gap: 0.3rem !important;
          }
          .comment-date-mobile {
            font-size: 0.8rem !important;
            right: 0.7rem !important;
            bottom: 0.3rem !important;
          }
        }
      `}</style>
      {/* End of style block, continue with modals below */}
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
            <div className="font-bold text-lg mb-3 text-purple-700">Are you sure you want to delete this comment?</div>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 rounded bg-gradient-to-r from-pink-400 to-orange-300 text-white font-bold shadow hover:scale-105 transition-all"
                onClick={handleConfirm}
              >Yes</button>
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold shadow hover:scale-105 transition-all"
                onClick={handleCancel}
              >No</button>
            </div>
          </div>
        </div>
      )}
      {showReport && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-20">
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center w-80">
            <div className="font-bold text-lg mb-3 text-pink-700">Report Comment</div>
            <input
              className="w-full rounded-xl px-3 py-2 border-2 border-pink-300 mb-2"
              placeholder="Reason for reporting"
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              disabled={reportLoading}
            />
            {reportMsg && <div className="text-error text-sm mb-2">{reportMsg}</div>}
            <div className="flex gap-4 mt-2">
              <button
                className="px-4 py-2 rounded bg-gradient-to-r from-yellow-400 to-pink-400 text-white font-bold shadow hover:scale-105 transition-all"
                onClick={handleReportSubmit}
                disabled={reportLoading}
              >{reportLoading ? 'Reporting...' : 'Report'}</button>
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold shadow hover:scale-105 transition-all"
                onClick={() => setShowReport(false)}
                disabled={reportLoading}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

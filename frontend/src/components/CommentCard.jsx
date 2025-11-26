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
    <div className="flex flex-col bg-[#fcf8ff] rounded-2xl p-4 mb-3 border border-purple-100 shadow-fun relative comment-card-mobile">
      {/* Mobile layout for comments with image */}
      {image_url && (
        <>
          <div className="block sm:hidden">
            {/* Author info row */}
            <div className="flex items-center gap-2 w-full mb-2 flex-wrap">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-yellow-200 text-2xl font-bold overflow-hidden comment-avatar-mobile">
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
              <span className="font-extrabold text-purple-800 text-base">{username}</span>
              {Array.isArray(badges) && badges.length > 0 && (
                <span className="flex gap-1 ml-2">
                  {badges.map((badge, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold uppercase tracking-wider">{badge}</span>
                  ))}
                </span>
              )}
            </div>
            {/* Comment text below author info */}
            <div className="text-gray-700 text-base font-medium mb-2 break-words w-full">{content}</div>
            {/* Image below text */}
            <div className="mb-2 flex justify-center w-full">
              <img
                src={image_url}
                alt="Comment"
                className="rounded-xl max-h-48 border-2 border-pink-200 shadow cursor-pointer hover:scale-105 transition duration-150"
                onClick={() => {
                  setModalImageUrl(image_url);
                  setShowImageModal(true);
                }}
              />
            </div>
            {/* Actions below image for mobile */}
            <div className="flex gap-2 w-full flex-wrap items-center justify-start mb-2">
              {canDelete && (
                <button
                  className="px-1.5 py-0.5 rounded bg-gradient-to-r from-pink-400 to-orange-300 text-white text-[0.7rem] font-bold shadow hover:scale-105 transition-all comment-delete-mobile"
                  onClick={handleDeleteClick}
                  title="Delete comment"
                  style={{minWidth:'36px', minHeight:'22px', padding:'2px 6px'}}
                >🗑️</button>
              )}
              <button
                className="px-1.5 py-0.5 rounded bg-gradient-to-r from-yellow-400 to-pink-400 text-white text-[0.7rem] font-bold shadow hover:scale-105 transition-all comment-report-mobile"
                onClick={handleReportClick}
                title="Report comment"
                style={{minWidth:'36px', minHeight:'22px', padding:'2px 6px'}}
              >🚩</button>
              {replyButton}
              <span className="text-xs text-gray-500 comment-date-mobile whitespace-nowrap">{time}</span>
            </div>
            {/* Voice message if present */}
            {audio_url && (
              <div className="mb-2 voice-message-mobile">
                <label className="block mb-1 font-bold text-pink-500 text-sm">Voice Message</label>
                <VoiceMessagePlayer src={audio_url} />
              </div>
            )}
          </div>
          {/* Desktop layout for comments with image */}
          <div className="hidden sm:block">
            {/* Author info, actions, reply, date in row */}
            <div className="flex items-center gap-2 w-full mb-2 flex-wrap">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-yellow-200 text-2xl font-bold overflow-hidden comment-avatar-mobile">
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
              <span className="font-extrabold text-purple-800 text-base">{username}</span>
              {Array.isArray(badges) && badges.length > 0 && (
                <span className="flex gap-1 ml-2">
                  {badges.map((badge, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold uppercase tracking-wider">{badge}</span>
                  ))}
                </span>
              )}
              {canDelete && (
                <button
                  className="ml-2 px-1.5 py-0.5 rounded bg-gradient-to-r from-pink-400 to-orange-300 text-white text-[0.7rem] font-bold shadow hover:scale-105 transition-all comment-delete-mobile"
                  onClick={handleDeleteClick}
                  title="Delete comment"
                  style={{minWidth:'36px', minHeight:'22px', padding:'2px 6px'}}
                >🗑️</button>
              )}
              <button
                className="ml-2 px-1.5 py-0.5 rounded bg-gradient-to-r from-yellow-400 to-pink-400 text-white text-[0.7rem] font-bold shadow hover:scale-105 transition-all comment-report-mobile"
                onClick={handleReportClick}
                title="Report comment"
                style={{minWidth:'36px', minHeight:'22px', padding:'2px 6px'}}
              >🚩</button>
              <div className="flex-1 flex justify-end items-center gap-2">
                {replyButton}
                <span className="text-xs text-gray-500 comment-date-mobile whitespace-nowrap">{time}</span>
              </div>
            </div>
            {/* Voice message if present */}
            {audio_url && (
              <div className="mb-2 voice-message-mobile">
                <label className="block mb-1 font-bold text-pink-500 text-sm">Voice Message</label>
                <VoiceMessagePlayer src={audio_url} />
              </div>
            )}
            {/* Image and text side by side */}
            <div className="flex flex-row gap-4 items-start w-full">
              <div className="mb-2 flex justify-center sm:justify-start sm:mb-0">
                <img
                  src={image_url}
                  alt="Comment"
                  className="rounded-xl max-h-48 border-2 border-pink-200 shadow cursor-pointer hover:scale-105 transition duration-150"
                  onClick={() => {
                    setModalImageUrl(image_url);
                    setShowImageModal(true);
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="text-gray-700 text-base font-medium mb-2 break-words">
                  {content}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Playback for saved voice message (single instance) */}
      {audio_url && (
        <div className="mb-2 voice-message-mobile">
          <label className="block mb-1 font-bold text-pink-500 text-sm">Voice Message</label>
          <VoiceMessagePlayer src={audio_url} />
        </div>
      )}
      {/* Responsive: image and text side by side on desktop, stacked on mobile */}
      <div className="flex flex-col sm:flex-row gap-4 items-start w-full">
        {image_url && (
          <div className="mb-2 flex justify-center sm:justify-start sm:mb-0">
            <img
              src={image_url}
              alt="Comment"
              className="rounded-xl max-h-48 border-2 border-pink-200 shadow cursor-pointer hover:scale-105 transition duration-150"
              onClick={() => {
                setModalImageUrl(image_url);
                setShowImageModal(true);
              }}
            />
          </div>
        )}
        <div className="flex-1">
          <div className="text-gray-700 text-base font-medium mb-2 break-words">
            {content}
          </div>
        </div>
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

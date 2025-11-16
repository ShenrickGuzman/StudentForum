
import React, { useState, useRef } from 'react';
import api from '../lib/api';
import { reportComment } from '../lib/api';

export default function CommentCard({ avatar, username, badges = [], time, content, canDelete, onDelete, commentId, audio_url }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
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
    <div className="flex gap-3 items-start bg-[#fcf8ff] rounded-2xl p-4 mb-3 border border-purple-100 shadow-fun relative comment-card-mobile">
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
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1 comment-meta-mobile">
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
              className="ml-2 px-2 py-1 rounded bg-gradient-to-r from-pink-400 to-orange-300 text-white text-xs font-bold shadow hover:scale-105 transition-all comment-delete-mobile"
              onClick={handleDeleteClick}
              title="Delete comment"
            >Delete 🗑️</button>
          )}
          <button
            className="ml-2 px-2 py-1 rounded bg-gradient-to-r from-yellow-400 to-pink-400 text-white text-xs font-bold shadow hover:scale-105 transition-all comment-report-mobile"
            onClick={handleReportClick}
            title="Report comment"
          >Report 🚩</button>
        </div>
        {/* Voice Message UI for Comment */}
        <div className="mb-2">
          <label className="block mb-1 font-bold text-pink-500 text-sm">Voice Message <span className="font-normal text-purple-400">(optional)</span></label>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className={`rounded px-3 py-1 font-bold shadow border border-pink-300 bg-gradient-to-r from-pink-100 to-yellow-100 text-purple-700 transition-all ${recording ? 'bg-yellow-200' : ''}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={audioUploading}
            >{recording ? 'Stop Recording' : 'Record Voice'}</button>
            {audioUrl && (
              <audio controls src={audioUrl} className="ml-2" />
            )}
            {audioUrl && (
              <button type="button" className="ml-2 text-red-500 font-bold" onClick={() => { setAudioBlob(null); setAudioUrl(''); }}>Remove</button>
            )}
            {audioBlob && commentId && (
              <button type="button" className="ml-2 text-green-600 font-bold" onClick={uploadAudioForComment} disabled={audioUploading}>{audioUploading ? 'Uploading...' : 'Upload Voice'}</button>
            )}
          </div>
        </div>
        <div className="text-gray-700 text-base font-medium">
          {content}
        </div>
        {/* Playback for saved voice message */}
        {audio_url && (
          <div className="mt-2">
            <audio controls src={audio_url} />
          </div>
        )}
        <span className="absolute right-4 bottom-2 text-gray-400 text-xs font-semibold comment-date-mobile">{time}</span>
      </div>
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

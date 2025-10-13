
import React, { useState } from 'react';
import { reportComment } from '../lib/api';

export default function CommentCard({ avatar, username, badges = [], time, content, canDelete, onDelete, commentId }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

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
        <div className="text-gray-700 text-base font-medium">
          {content}
        </div>
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

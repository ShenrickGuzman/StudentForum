
import React, { useState } from 'react';

export default function CommentCard({ avatar, username, time, content, canDelete, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);

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

  return (
    <div className="flex gap-3 items-start bg-[#fcf8ff] rounded-2xl p-4 mb-3 border border-purple-100 shadow-fun relative">
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-yellow-200 text-2xl font-bold overflow-hidden">
        {React.isValidElement(avatar) ? avatar : <span>{avatar}</span>}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-extrabold text-purple-800 text-base">{username}</span>
          <span className="text-gray-400 text-xs font-semibold">• {time}</span>
          {canDelete && (
            <button
              className="ml-2 px-2 py-1 rounded bg-gradient-to-r from-pink-400 to-orange-300 text-white text-xs font-bold shadow hover:scale-105 transition-all"
              onClick={handleDeleteClick}
              title="Delete comment"
            >Delete 🗑️</button>
          )}
        </div>
        <div className="text-gray-700 text-base font-medium">
          {content}
        </div>
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
    </div>
  );
}

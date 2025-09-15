import React from 'react';

export default function CommentCard({ avatar, username, time, content }) {
  return (
    <div className="flex gap-3 items-start bg-[#fcf8ff] rounded-2xl p-4 mb-3 border border-purple-100 shadow-fun">
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-yellow-200 text-2xl font-bold">
        {avatar}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-extrabold text-purple-800 text-base">{username}</span>
          <span className="text-gray-400 text-xs font-semibold">• {time}</span>
        </div>
        <div className="text-gray-700 text-base font-medium">
          {content}
        </div>
      </div>
    </div>
  );
}

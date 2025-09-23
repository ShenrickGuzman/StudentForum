import { useState } from 'react';

const RULES = [
  'Be respectful and kind to all members.',
  'No spamming, advertising, or self-promotion.',
  'Keep discussions appropriate for all ages.',
  'Do not share personal information of yourself or others.',
  'Follow all forum and school guidelines.',
  'Violations may result in account ban or deletion.'
];

export default function RulesPopup({ open, onAgree, onClose, onDontShowAgain }) {
  const [dontShow, setDontShow] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="cartoon-card max-w-lg w-full relative border-4 border-pink-300 bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 animate-pop rounded-3xl shadow-2xl p-8 text-center font-cartoon">
        <h2 className="text-4xl font-extrabold mb-2 text-pink-500 drop-shadow" style={{fontFamily: 'Fredoka, Comic Neue, Baloo, cursive'}}>Forum Rules</h2>
        <ul className="text-lg text-left mb-4 flex flex-col gap-2 font-bold text-purple-700">
          {RULES.map((rule, i) => (
            <li key={i} className="flex items-start gap-2"><span className="text-2xl">🎈</span> {rule}</li>
          ))}
        </ul>
        <div className="flex items-center justify-center gap-2 mb-4">
          <input id="dontshow" type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)} className="w-5 h-5 accent-pink-400 rounded-full" />
          <label htmlFor="dontshow" className="text-base font-bold text-pink-600 cursor-pointer">Don't show again</label>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            className="fun-btn px-8 py-3 text-lg rounded-full bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 shadow-lg"
            onClick={() => { onAgree(); if (dontShow) onDontShowAgain(); }}
          >I Agree 👍</button>
          <button
            className="fun-btn px-8 py-3 text-lg rounded-full bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 shadow-lg"
            onClick={onClose}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}

export { RULES };

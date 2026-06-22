import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="card p-8 max-w-lg w-full text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <h2 className="text-xl font-bold text-dark mb-4">Forum Rules</h2>
            <ul className="text-left flex flex-col gap-2 mb-4">
              {RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  {rule}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-2 mb-4">
              <input id="dontshow" type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="dontshow" className="text-sm text-muted cursor-pointer">Don't show again</label>
            </div>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary text-sm" onClick={() => { onAgree(); if (dontShow) onDontShowAgain(); }}>I Agree</button>
              <button className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { RULES };

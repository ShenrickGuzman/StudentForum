import { RULES } from '../components/RulesPopup';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function RulesPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div className="card p-8 max-w-2xl w-full text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-dark mb-6">Forum Rules</h2>
        <ul className="text-left flex flex-col gap-3 mb-6">
          {RULES.map((rule, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted leading-relaxed">
              <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
              {rule}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted mb-6">Please follow these rules to keep the forum enjoyable for everyone.</p>
        <button className="btn-primary text-sm" onClick={() => navigate('/')}>I Agree</button>
      </motion.div>
    </div>
  );
}

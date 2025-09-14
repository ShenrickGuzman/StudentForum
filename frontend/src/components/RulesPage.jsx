import { RULES } from '../components/RulesPopup';

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 font-cartoon">
      <div className="cartoon-card max-w-2xl w-full border-4 border-pink-300 bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 animate-pop rounded-3xl shadow-2xl p-8 text-center">
        <h2 className="text-5xl font-extrabold mb-4 text-pink-500 drop-shadow" style={{fontFamily: 'Fredoka, Comic Neue, Baloo, cursive'}}>Forum Rules</h2>
        <ul className="text-2xl text-left mb-6 flex flex-col gap-4 font-bold text-purple-700">
          {RULES.map((rule, i) => (
            <li key={i} className="flex items-start gap-3"><span className="text-3xl">🎈</span> {rule}</li>
          ))}
        </ul>
        <div className="flex justify-center">
          <span className="inline-block px-6 py-3 rounded-full bg-pink-200 text-pink-700 font-bold text-lg shadow-fun">Please follow these rules to keep the forum fun and safe for everyone!</span>
        </div>
      </div>
    </div>
  );
}

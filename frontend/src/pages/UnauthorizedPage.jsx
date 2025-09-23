import { Link } from 'react-router-dom';
import { useAuth } from '../state/auth';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full font-cartoon relative overflow-x-hidden" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)'}}>
      {/* Floating pastel circles */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <span className="absolute left-8 top-8 w-20 h-20 rounded-full bg-yellow-200 opacity-30"></span>
        <span className="absolute right-10 top-24 w-12 h-12 rounded-full bg-green-200 opacity-20"></span>
        <span className="absolute left-1/4 bottom-10 w-32 h-32 rounded-full bg-pink-200 opacity-20"></span>
        <span className="absolute right-1/3 top-1/2 w-16 h-16 rounded-full bg-blue-200 opacity-20"></span>
        <span className="absolute left-10 bottom-24 w-12 h-12 rounded-full bg-purple-200 opacity-20"></span>
        <span className="absolute right-8 bottom-8 w-24 h-24 rounded-full bg-yellow-100 opacity-30"></span>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto py-20 px-4 flex flex-col items-center gap-8 text-center">
        <div className="cartoon-card border-4 border-red-400 shadow-cartoon flex flex-col items-center gap-6 bg-white/90">
          <div className="text-8xl">🚫</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-red-500 drop-shadow-lg">
            Access Denied
          </h1>
          <div className="space-y-4 text-lg text-gray-700">
            <p className="font-semibold">
              Sorry {user?.name}, you don't have permission to access the admin panel.
            </p>
            <p className="text-base">
              This area is restricted to authorized administrators only.
            </p>
          </div>
          <div className="flex gap-4 mt-6">
            <Link 
              to="/" 
              className="fun-btn px-6 py-3 text-lg bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600"
            >
              🏠 Go Home
            </Link>
            <Link 
              to="/rules" 
              className="fun-btn px-6 py-3 text-lg bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
            >
              📜 View Rules
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
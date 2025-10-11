
import { Link, useLocation } from 'react-router-dom';

export default function AccountDeletedPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const reason = params.get('reason');

  let message = '';
  if (reason === 'warnings') {
    message = (
      <>
        Your account was deleted for violating the rules and reaching 3 warnings.<br/>
        You can sign up again using your previous username and email.
      </>
    );
  } else {
    message = (
      <>
        Your account was deleted by an admin.<br/>
        If you believe this was a mistake, please contact support or sign up again.
      </>
    );
  }

  return (
    <div className="min-h-screen w-full font-cartoon flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-yellow-100">
      <div className="cartoon-card border-4 border-error bg-white/95 shadow-2xl flex flex-col items-center gap-6 max-w-md w-full p-8 animate-pop">
        <div className="text-7xl">🗑️</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-error drop-shadow-lg text-center">Account Deleted</h1>
        <div className="text-lg text-gray-700 text-center font-semibold">
          {message}
        </div>
        <Link
          to="/auth"
          className="fun-btn px-8 py-4 text-lg bg-gradient-to-r from-blue-400 to-pink-400 hover:from-blue-500 hover:to-pink-500 text-white rounded-2xl shadow-lg font-bold mt-4"
        >
          Back to Sign In / Up
        </Link>
      </div>
    </div>
  );
}

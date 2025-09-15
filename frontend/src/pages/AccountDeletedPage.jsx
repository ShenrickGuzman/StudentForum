import { Link } from 'react-router-dom';

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen w-full font-cartoon flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-yellow-100">
      <div className="cartoon-card border-4 border-error bg-white/95 shadow-2xl flex flex-col items-center gap-6 max-w-md w-full p-8 animate-pop">
        <div className="text-7xl">🗑️</div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-error drop-shadow-lg text-center">Account Deleted</h1>
        <div className="text-lg text-gray-700 text-center font-semibold">
          Your account has been deleted by an administrator.<br/>
          You can sign up again using your previous username and email.
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

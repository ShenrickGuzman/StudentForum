
import React, { useState, useEffect } from 'react';
// Add playful Google Font for headings
// In your index.html, add: <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@700&display=swap" rel="stylesheet">
import { useAuth } from '../state/auth';

const defaultProfile = {
  avatar: '/Cute-Cat.png',
  name: 'Your Name',
  about: '',
  interests: [],
  stats: { posts: 0, likes: 0, comments: 0 }
};

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [aboutMe, setAboutMe] = useState('');
  const [hobbies, setHobbies] = useState('');
  // Fetch latest profile from backend on mount
  useEffect(() => {
    async function fetchProfile() {
      if (!token) return;
      const res = await fetch('https://studentforum-backend.onrender.com/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.profile) {
        setProfile({
          avatar: data.profile.avatar || defaultProfile.avatar,
          name: data.profile.name || defaultProfile.name,
          about: data.profile.about || '',
          interests: Array.isArray(data.profile.interests) ? data.profile.interests : (data.profile.interests ? [data.profile.interests] : []),
          stats: data.profile.stats || defaultProfile.stats
        });
        setAboutMe(data.profile.about || '');
        setHobbies(Array.isArray(data.profile.interests) ? data.profile.interests.join(', ') : (data.profile.interests || ''));
      }
    }
    fetchProfile();
  }, [token]);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(profile.profile_picture);
  const [successMsg, setSuccessMsg] = useState('');

  // Profile picture upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarError('Only JPEG and PNG images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image size must be less than 2MB.');
      return;
    }
    setAvatarError('');
    const formData = new FormData();
    formData.append('picture', file);
    const res = await fetch('https://studentforum-backend.onrender.com/api/auth/profile/picture', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data && data.profile_picture) {
      setAvatarPreview(data.profile_picture);
      setProfile(p => ({ ...p, avatar: data.profile_picture }));
    } else {
      alert((data && data.error) || 'Failed to upload profile picture.');
    }
  };

  const handleRemoveAvatar = () => {
  setAvatarPreview(defaultProfile.avatar);
  setProfile(p => ({ ...p, avatar: defaultProfile.avatar }));
  };

  // Save About Me and Hobbies & Interests
  const handleSave = async () => {
    const res = await fetch('https://studentforum-backend.onrender.com/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        about_me: aboutMe,
        hobbies_interests: hobbies
      })
    });
    const data = await res.json();
    if (data && data.ok && data.profile) {
      setProfile({
        avatar: data.profile.avatar || defaultProfile.avatar,
        name: data.profile.name || defaultProfile.name,
        about: data.profile.about || '',
        interests: Array.isArray(data.profile.interests) ? data.profile.interests : (data.profile.interests ? [data.profile.interests] : []),
        stats: data.profile.stats || defaultProfile.stats
      });
      setAboutMe(data.profile.about || '');
      setHobbies(Array.isArray(data.profile.interests) ? data.profile.interests.join(', ') : (data.profile.interests || ''));
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
      setEditing(false);
    } else {
      alert((data && data.error) || 'Failed to save profile.');
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 overflow-hidden">
      {/* Floating cartoon shapes */}
      <div className="pointer-events-none select-none absolute inset-0 z-0">
        <div className="absolute top-10 left-10 w-24 h-24 bg-pink-300 rounded-full opacity-30 animate-bounce-slow" />
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-blue-300 rounded-full opacity-20 animate-bounce-slower" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-green-300 rounded-full opacity-20 animate-bounce" />
        <div className="absolute bottom-10 left-1/2 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-bounce" />
      </div>
      <div className="w-full max-w-xl rounded-[2.5rem] shadow-2xl bg-white/70 backdrop-blur-lg p-0 overflow-hidden relative border-4 border-dashed border-purple-300 z-10">
        {successMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-400 text-white font-bold px-6 py-2 rounded-full shadow-lg z-50 animate-fadeIn">
            {successMsg}
          </div>
        )}
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 p-10 flex flex-col items-center relative rounded-b-[2.5rem] shadow-lg border-b-4 border-purple-300">
          <div className="relative mb-4">
            {/* Cartoon avatar border */}
            <div className="absolute -top-3 -left-3 w-36 h-36 rounded-full border-4 border-dashed border-yellow-400 bg-yellow-100 z-0 animate-spin-slow" style={{filter:'blur(1px)'}}></div>
            <img src={editing ? avatarPreview : profile.avatar} alt="avatar" className="w-32 h-32 rounded-full border-4 border-white shadow-xl transition-transform duration-300 hover:scale-105 relative z-10" />
            {editing && (
              <>
                <label className="absolute bottom-2 right-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-3 cursor-pointer shadow-lg border-2 border-white z-20">
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
                  <span role="img" aria-label="upload" className="text-xl">📤</span>
                </label>
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 cursor-pointer shadow-lg border-2 border-white z-20"
                  onClick={handleRemoveAvatar}
                  title="Remove avatar"
                >
                  <span role="img" aria-label="remove" className="text-lg">❌</span>
                </button>
              </>
            )}
            {avatarError && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[-2.5rem] bg-red-400 text-white px-4 py-2 rounded shadow-lg text-sm animate-fadeIn">
                {avatarError}
              </div>
            )}
          </div>
          <h2 className="text-4xl font-extrabold text-white drop-shadow mb-2 tracking-wide animate-fadeInUp" style={{fontFamily:'Fredoka, sans-serif'}}>{profile.name}</h2>
          {/* Stats with doodle icons */}
          <div className="flex gap-4 mt-2">
            <div className="bg-blue-300/80 rounded-full px-6 py-2 text-center text-white font-bold shadow-md flex flex-col items-center">
              <span className="text-2xl mb-1">📝</span>
              <div className="text-xl">{profile.stats.posts}</div>
              <div className="text-xs">Posts</div>
            </div>
            <div className="bg-pink-300/80 rounded-full px-6 py-2 text-center text-white font-bold shadow-md flex flex-col items-center">
              <span className="text-2xl mb-1">💖</span>
              <div className="text-xl">{profile.stats.likes}</div>
              <div className="text-xs">Likes</div>
            </div>
            <div className="bg-yellow-300/80 rounded-full px-6 py-2 text-center text-white font-bold shadow-md flex flex-col items-center">
              <span className="text-2xl mb-1">💬</span>
              <div className="text-xl">{profile.stats.comments}</div>
              <div className="text-xs">Comments</div>
            </div>
          </div>
          {/* Edit Button */}
          <button
            className="mt-6 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-bold py-2 px-7 rounded-full shadow-lg transition-all text-lg animate-fadeIn border-2 border-white"
            onClick={() => setEditing(true)}
            style={{fontFamily:'Fredoka, sans-serif'}}
          >
            ✏️ Edit Profile
          </button>
        </div>
        {/* About Me & Interests */}
  <div className="p-10">
          <div className="mb-8">
            <h3 className="flex items-center text-2xl font-bold text-purple-700 mb-3 animate-fadeInUp" style={{fontFamily:'Fredoka, sans-serif'}}>
              <span className="mr-2">👤</span> About Me
            </h3>
            {editing ? (
              <textarea
                className="w-full p-4 rounded-2xl border-4 border-dashed border-purple-200 focus:border-purple-400 focus:outline-none text-lg bg-white/80 shadow-inner transition-all font-mono"
                value={aboutMe}
                onChange={e => setAboutMe(e.target.value)}
                rows={4}
                placeholder="Write something fun about yourself!"
              />
            ) : (
              <div className="bg-purple-50 p-5 rounded-2xl text-gray-700 text-lg shadow-inner animate-fadeIn border-2 border-dashed border-purple-200 font-mono">
                {profile.about}
              </div>
            )}
          </div>
          <div>
            <h3 className="flex items-center text-2xl font-bold text-green-700 mb-3 animate-fadeInUp" style={{fontFamily:'Fredoka, sans-serif'}}>
              <span className="mr-2">💚</span> Interests & Hobbies
            </h3>
            {editing ? (
              <input
                className="w-full p-4 rounded-2xl border-4 border-dashed border-green-200 focus:border-green-400 focus:outline-none text-lg mb-3 bg-white/80 shadow-inner transition-all font-mono"
                value={hobbies}
                onChange={e => setHobbies(e.target.value)}
                placeholder="Comma separated interests (e.g. Drawing, Chess, Coding)"
              />
            ) : (
              <div className="flex flex-wrap gap-4 animate-fadeIn">
                {(Array.isArray(profile.interests) ? profile.interests : []).map((interest, idx) => (
                  <span key={idx} className="bg-green-100 text-green-700 px-5 py-2 rounded-full font-semibold shadow border-2 border-green-300 hover:scale-110 transition-transform duration-200" style={{fontFamily:'Fredoka, sans-serif'}}>
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Save/Cancel Buttons */}
          {editing && (
            <div className="flex justify-end gap-4 mt-10 animate-fadeInUp">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-7 rounded-full shadow-lg text-lg border-2 border-gray-400"
                onClick={() => setEditing(false)}
                style={{fontFamily:'Fredoka, sans-serif'}}
              >
                Cancel
              </button>
              <button
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-bold py-2 px-7 rounded-full shadow-lg text-lg transition-all border-2 border-white"
                onClick={handleSave}
                style={{fontFamily:'Fredoka, sans-serif'}}
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Custom cartoon bouncy animation keyframes */}
      <style>{`
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes bounce-slower { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(30px); } }
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-bounce-slow { animation: bounce-slow 4s infinite; }
        .animate-bounce-slower { animation: bounce-slower 7s infinite; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  );
}

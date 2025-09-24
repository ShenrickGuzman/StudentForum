

import React, { useState, useEffect } from 'react';
import { useAuth } from '../state/auth';

const defaultProfile = {
  avatar: '/Cute-Cat.png',
  name: 'Your Name',
  about: '',
  interests: [],
  stats: { posts: 0, likes: 0, comments: 0 },
  badges: ['Starter', 'Friendly'],
};

// SVG doodle stickers
const DoodleStars = () => (
  <svg width="120" height="60" viewBox="0 0 120 60" fill="none" className="absolute -top-8 left-8 z-10 pointer-events-none select-none">
    <g>
      <circle cx="20" cy="20" r="8" fill="#FFD700" stroke="#FFB347" strokeWidth="3" />
      <circle cx="60" cy="10" r="4" fill="#FF6F91" stroke="#FFB347" strokeWidth="2" />
      <circle cx="100" cy="30" r="6" fill="#6EC6FF" stroke="#FFB347" strokeWidth="2" />
    </g>
  </svg>
);
const DoodleCloud = () => (
  <svg width="100" height="60" viewBox="0 0 100 60" fill="none" className="absolute -bottom-8 right-8 z-10 pointer-events-none select-none">
    <ellipse cx="50" cy="40" rx="40" ry="18" fill="#fff" stroke="#6EC6FF" strokeWidth="3" />
    <ellipse cx="30" cy="35" rx="12" ry="10" fill="#fff" stroke="#FFB347" strokeWidth="2" />
    <ellipse cx="70" cy="45" rx="10" ry="8" fill="#fff" stroke="#FF6F91" strokeWidth="2" />
  </svg>
);

const Badge = ({ label }) => (
  <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-yellow-200 border-2 border-yellow-400 text-yellow-900 font-bold text-xs shadow cartoon-badge animate-bounce" style={{fontFamily:'Fredoka, Comic Neue, cursive'}}>
    <span role="img" aria-label="badge">🏅</span> {label}
  </span>
);

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [aboutMe, setAboutMe] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar);
  const [successMsg, setSuccessMsg] = useState('');

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
          stats: data.profile.stats || defaultProfile.stats,
          badges: data.profile.badges || defaultProfile.badges,
        });
        setAboutMe(data.profile.about || '');
        setHobbies(Array.isArray(data.profile.interests) ? data.profile.interests.join(', ') : (data.profile.interests || ''));
        setAvatarPreview(data.profile.avatar || defaultProfile.avatar);
      }
    }
    fetchProfile();
  }, [token]);

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
        stats: data.profile.stats || defaultProfile.stats,
        badges: data.profile.badges || defaultProfile.badges,
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

  // Fun avatar wiggle animation
  const [wiggle, setWiggle] = useState(false);
  const triggerWiggle = () => {
    setWiggle(true);
    setTimeout(() => setWiggle(false), 600);
  };

  return (
    <div className="bg-fun min-h-screen flex flex-col items-center justify-center relative overflow-x-hidden">
      {/* SVG doodles */}
      <DoodleStars />
      <DoodleCloud />
      {/* Fun background pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <svg width="100%" height="100%" className="w-full h-full" style={{position:'absolute',top:0,left:0}}>
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="#FFB347" />
              <circle cx="30" cy="30" r="2" fill="#6EC6FF" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
      <div className="cartoon-card relative w-full max-w-2xl mx-auto mt-16 mb-16 z-10 border-4 border-dashed border-pink-300 shadow-2xl flex flex-col items-center" style={{background:'rgba(255,255,255,0.95)'}}>
        {/* Success message */}
        {successMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-400 text-white font-bold px-6 py-2 rounded-full shadow-lg z-50 animate-bounce">
            {successMsg}
          </div>
        )}
        {/* Avatar + Name + Badges */}
        <div className="flex flex-col items-center w-full pt-8 pb-4 relative">
          <div className="relative mb-2">
            <div className="absolute -top-4 -left-4 w-36 h-36 rounded-full border-4 border-yellow-400 bg-yellow-100 z-0 animate-spin-slow" style={{filter:'blur(1px)'}}></div>
            <img
              src={editing ? avatarPreview : profile.avatar}
              alt="avatar"
              className={`w-32 h-32 rounded-full border-4 border-white shadow-xl transition-transform duration-300 ${wiggle ? 'animate-wiggle' : ''} hover:scale-110 relative z-10 cursor-pointer`}
              onClick={triggerWiggle}
            />
            {editing && (
              <>
                <label className="absolute bottom-2 right-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full p-3 cursor-pointer shadow-lg border-2 border-white z-20">
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
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[-2.5rem] bg-red-400 text-white px-4 py-2 rounded shadow-lg text-sm animate-bounce">
                {avatarError}
              </div>
            )}
          </div>
          <h2 className="text-4xl font-extrabold text-pink-600 drop-shadow mb-1 tracking-wide" style={{fontFamily:'Fredoka, Comic Neue, cursive'}}>{profile.name}</h2>
          <div className="flex gap-2 mb-2 flex-wrap justify-center">
            {profile.badges && profile.badges.map((b, i) => <Badge key={i} label={b} />)}
          </div>
        </div>
        {/* Stats */}
        <div className="flex gap-6 justify-center w-full mb-6">
          <div className="flex flex-col items-center bg-blue-200/80 rounded-2xl px-6 py-3 text-blue-900 font-bold shadow cartoon-stat hover:scale-105 transition-transform duration-200 border-2 border-blue-300">
            <span className="text-3xl mb-1">📝</span>
            <div className="text-2xl font-extrabold">{profile.stats.posts}</div>
            <div className="text-xs">Posts</div>
          </div>
          <div className="flex flex-col items-center bg-pink-200/80 rounded-2xl px-6 py-3 text-pink-900 font-bold shadow cartoon-stat hover:scale-105 transition-transform duration-200 border-2 border-pink-300">
            <span className="text-3xl mb-1">💖</span>
            <div className="text-2xl font-extrabold">{profile.stats.likes}</div>
            <div className="text-xs">Likes</div>
          </div>
          <div className="flex flex-col items-center bg-yellow-200/80 rounded-2xl px-6 py-3 text-yellow-900 font-bold shadow cartoon-stat hover:scale-105 transition-transform duration-200 border-2 border-yellow-300">
            <span className="text-3xl mb-1">💬</span>
            <div className="text-2xl font-extrabold">{profile.stats.comments}</div>
            <div className="text-xs">Comments</div>
          </div>
        </div>
        {/* Edit Button */}
        {!editing && (
          <button
            className="fun-btn py-2 px-8 text-lg mt-2 mb-4 border-2 border-pink-400"
            onClick={() => setEditing(true)}
            style={{fontFamily:'Fredoka, Comic Neue, cursive'}}
          >
            <span role="img" aria-label="edit">✏️</span> Edit Profile
          </button>
        )}
        {/* About Me & Interests */}
        <div className="w-full flex flex-col md:flex-row gap-8 mt-4 mb-2">
          <div className="flex-1">
            <h3 className="flex items-center text-xl font-bold text-pink-700 mb-2" style={{fontFamily:'Fredoka, Comic Neue, cursive'}}>
              <span className="mr-2">👤</span> About Me
            </h3>
            {editing ? (
              <textarea
                className="w-full p-4 rounded-2xl border-4 border-dashed border-pink-200 focus:border-pink-400 focus:outline-none text-lg bg-white/80 shadow-inner transition-all font-mono"
                value={aboutMe}
                onChange={e => setAboutMe(e.target.value)}
                rows={4}
                placeholder="Write something fun about yourself!"
              />
            ) : (
              <div className="bg-pink-50 p-5 rounded-2xl text-gray-700 text-lg shadow-inner border-2 border-dashed border-pink-200 font-mono min-h-[80px]">
                {profile.about || <span className="text-gray-400">No info yet!</span>}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="flex items-center text-xl font-bold text-blue-700 mb-2" style={{fontFamily:'Fredoka, Comic Neue, cursive'}}>
              <span className="mr-2">🎨</span> Interests & Hobbies
            </h3>
            {editing ? (
              <input
                className="w-full p-4 rounded-2xl border-4 border-dashed border-blue-200 focus:border-blue-400 focus:outline-none text-lg mb-3 bg-white/80 shadow-inner transition-all font-mono"
                value={hobbies}
                onChange={e => setHobbies(e.target.value)}
                placeholder="Comma separated interests (e.g. Drawing, Chess, Coding)"
              />
            ) : (
              <div className="flex flex-wrap gap-3">
                {(Array.isArray(profile.interests) ? profile.interests : []).length === 0 && <span className="text-gray-400">No interests yet!</span>}
                {(Array.isArray(profile.interests) ? profile.interests : []).map((interest, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold shadow border-2 border-blue-300 hover:scale-110 transition-transform duration-200" style={{fontFamily:'Fredoka, Comic Neue, cursive'}}>
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Save/Cancel Buttons */}
        {editing && (
          <div className="flex justify-end gap-4 mt-8 mb-2 w-full">
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-7 rounded-full shadow-lg text-lg border-2 border-gray-400"
              onClick={() => setEditing(false)}
              style={{fontFamily:'Fredoka, Comic Neue, cursive'}}
            >
              Cancel
            </button>
            <button
              className="fun-btn py-2 px-7 text-lg border-2 border-pink-400"
              onClick={handleSave}
              style={{fontFamily:'Fredoka, Comic Neue, cursive'}}
            >
              <span role="img" aria-label="save">💾</span> Save
            </button>
          </div>
        )}
      </div>
      {/* Custom cartoon bouncy animation keyframes */}
      <style>{`
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        @keyframes wiggle { 0%, 100% { transform: rotate(-5deg); } 20% { transform: rotate(7deg); } 40% { transform: rotate(-7deg); } 60% { transform: rotate(7deg); } 80% { transform: rotate(-7deg); } }
        .animate-wiggle { animation: wiggle 0.6s; }
        .cartoon-badge { box-shadow: 0 2px 8px 0 rgba(255,179,71,0.15); border-style: dashed; }
        .cartoon-stat { box-shadow: 0 2px 8px 0 rgba(110,198,255,0.15); border-style: dashed; }
      `}</style>
    </div>
  );
}

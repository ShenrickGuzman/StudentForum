
import React, { useState, useEffect } from 'react';
import { useAuth } from '../state/auth';

const defaultProfile = {
  avatar: '/Cute-Cat.png',
  name: 'Your Name',
  about: '',
  interests: [],
  stats: { posts: 0, likes: 0, comments: 0 },
  badge: '' // e.g. 'ADMIN', 'DEVELOPER'
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
          stats: data.profile.stats || defaultProfile.stats,
          badge: data.profile.badge || ''
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
        stats: data.profile.stats || defaultProfile.stats,
        badge: data.profile.badge || ''
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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pink-100 to-purple-200 px-2 sm:px-4">
      <div className="w-full max-w-4xl min-h-[600px] rounded-[2.5rem] shadow-2xl bg-white/80 backdrop-blur-lg p-0 overflow-hidden relative border-4 border-pink-200 flex flex-col items-center transition-all duration-300 sm:mt-8 mt-2">
        {successMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-400 text-white font-bold px-6 py-2 rounded-full shadow-lg z-50 animate-fadeIn">
            {successMsg}
          </div>
        )}
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 px-4 sm:px-8 md:px-16 py-8 sm:py-12 flex flex-col items-center relative rounded-b-[2.5rem] shadow-lg w-full">
          <div className="relative mb-4">
            <img src={editing ? avatarPreview : profile.avatar} alt="avatar" className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full border-8 border-white shadow-2xl transition-transform duration-300 hover:scale-110 bg-white object-cover" />
            {editing && (
              <>
                <label className="absolute bottom-2 right-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-2 sm:p-3 cursor-pointer shadow-lg border-2 border-white">
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
                  <span role="img" aria-label="upload" className="text-xl">📤</span>
                </label>
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 sm:p-2 cursor-pointer shadow-lg border-2 border-white"
                  onClick={handleRemoveAvatar}
                  title="Remove avatar"
                >
                  <span role="img" aria-label="remove" className="text-lg">❌</span>
                </button>
              </>
            )}
            {avatarError && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-[-2.5rem] bg-red-400 text-white px-2 sm:px-4 py-2 rounded shadow-lg text-xs sm:text-sm animate-fadeIn">
                {avatarError}
              </div>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow mb-1 tracking-wide animate-fadeInUp">{profile.name}</h2>
          {/* User Badge */}
          {profile.badge && (
            <div className={`inline-block px-4 py-1 rounded-full font-bold text-xs sm:text-sm mb-2 shadow-lg border-2 border-white uppercase tracking-widest ${profile.badge === 'ADMIN' ? 'bg-red-500 text-white' : profile.badge === 'DEVELOPER' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                 style={{letterSpacing:'0.15em'}}>
              {profile.badge}
            </div>
          )}
          {/* Stats */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-4 mb-2 w-full justify-center">
            <div className="bg-blue-300/90 rounded-2xl px-6 sm:px-10 py-3 sm:py-4 text-center text-white font-bold shadow-lg flex flex-col items-center min-w-[90px] sm:min-w-[120px]">
              <div className="text-lg sm:text-2xl">{profile.stats.posts}</div>
              <div className="text-xs sm:text-base">Posts</div>
            </div>
            <div className="bg-pink-300/90 rounded-2xl px-6 sm:px-10 py-3 sm:py-4 text-center text-white font-bold shadow-lg flex flex-col items-center min-w-[90px] sm:min-w-[120px]">
              <div className="text-lg sm:text-2xl">{profile.stats.likes}</div>
              <div className="text-xs sm:text-base">Likes</div>
            </div>
            <div className="bg-yellow-300/90 rounded-2xl px-6 sm:px-10 py-3 sm:py-4 text-center text-white font-bold shadow-lg flex flex-col items-center min-w-[90px] sm:min-w-[120px]">
              <div className="text-lg sm:text-2xl">{profile.stats.comments}</div>
              <div className="text-xs sm:text-base">Comments</div>
            </div>
          </div>
          {/* Edit Button */}
          <button
            className="mt-6 sm:mt-8 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-10 rounded-full shadow-xl transition-all text-lg sm:text-xl animate-fadeIn"
            onClick={() => setEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        </div>
        {/* About Me & Interests */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 p-4 sm:p-8 md:p-12 w-full">
          <div className="flex-1 min-w-0">
            <h3 className="flex items-center text-2xl sm:text-3xl font-bold text-purple-700 mb-3 sm:mb-4 animate-fadeInUp">
              <span className="mr-2">👤</span> About Me
            </h3>
            {editing ? (
              <textarea
                className="w-full p-4 sm:p-6 rounded-2xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none text-base sm:text-xl bg-white/80 shadow-inner transition-all min-h-[80px] sm:min-h-[120px]"
                value={aboutMe}
                onChange={e => setAboutMe(e.target.value)}
                rows={4}
              />
            ) : (
              <div className="bg-purple-50 p-4 sm:p-6 rounded-2xl text-gray-700 text-base sm:text-xl shadow-inner animate-fadeIn min-h-[80px] sm:min-h-[120px]">
                {profile.about}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="flex items-center text-2xl sm:text-3xl font-bold text-green-700 mb-3 sm:mb-4 animate-fadeInUp">
              <span className="mr-2">💚</span> Interests & Hobbies
            </h3>
            {editing ? (
              <input
                className="w-full p-4 sm:p-6 rounded-2xl border-2 border-green-200 focus:border-green-400 focus:outline-none text-base sm:text-xl mb-3 bg-white/80 shadow-inner transition-all"
                value={hobbies}
                onChange={e => setHobbies(e.target.value)}
                placeholder="Comma separated interests"
              />
            ) : (
              <div className="flex flex-wrap gap-2 sm:gap-4 animate-fadeIn">
                {(Array.isArray(profile.interests) ? profile.interests : []).map((interest, idx) => (
                  <span key={idx} className="bg-green-100 text-green-700 px-4 sm:px-7 py-2 sm:py-3 rounded-full font-semibold shadow text-base sm:text-lg">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Save/Cancel Buttons */}
        {editing && (
          <div className="flex flex-col sm:flex-row justify-end gap-4 sm:gap-6 mt-4 sm:mt-6 mb-4 sm:mb-8 w-full px-4 sm:px-12 animate-fadeInUp">
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 sm:py-3 px-6 sm:px-10 rounded-full shadow-lg text-lg sm:text-xl"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-10 rounded-full shadow-lg text-lg sm:text-xl transition-all"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

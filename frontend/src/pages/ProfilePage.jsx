import React, { useState } from 'react';
import { useAuth } from '../state/auth';

const defaultProfile = {
  avatar: '/default-avatar.png',
  name: 'Your Name',
  about: '',
  interests: [],
  stats: { posts: 0, likes: 0, comments: 0 }
};

export default function ProfilePage() {
  const { user, token, login } = useAuth();
  const [profile, setProfile] = useState(user ? {
    avatar: user.avatar || defaultProfile.avatar,
    name: user.name,
    about: user.about || defaultProfile.about,
    interests: user.interests || defaultProfile.interests,
    stats: user.stats || defaultProfile.stats
  } : defaultProfile);
  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState(profile.about);
  const [interests, setInterests] = useState(profile.interests);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    let avatarUrl = profile.avatar;
    if (avatarFile) {
      const formData = new FormData();
      formData.append('file', avatarFile);
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) avatarUrl = data.url;
    }
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ avatar: avatarUrl, about, interests })
    });
    const data = await res.json();
    if (data.ok && data.user) {
      setProfile({ ...profile, ...data.user });
      login(token, { ...user, ...data.user });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
      setEditing(false);
      setAvatarFile(null);
    } else {
      alert(data.error || 'Failed to save profile.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pink-100 to-purple-200">
      <div className="w-full max-w-xl rounded-3xl shadow-2xl bg-white/60 backdrop-blur-lg p-0 overflow-hidden relative border border-purple-200">
        {successMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-400 text-white font-bold px-6 py-2 rounded-full shadow-lg z-50 animate-fadeIn">
            {successMsg}
          </div>
        )}
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 p-10 flex flex-col items-center relative rounded-b-3xl shadow-lg">
          <div className="relative mb-4">
            <img src={editing ? avatarPreview : profile.avatar} alt="avatar" className="w-32 h-32 rounded-full border-4 border-white shadow-xl transition-transform duration-300 hover:scale-105" />
            {editing && (
              <label className="absolute bottom-2 right-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-3 cursor-pointer shadow-lg border-2 border-white">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <span role="img" aria-label="upload" className="text-xl">📤</span>
              </label>
            )}
          </div>
          <h2 className="text-4xl font-extrabold text-white drop-shadow mb-2 tracking-wide animate-fadeInUp">{profile.name}</h2>
          {/* Stats */}
          <div className="flex gap-4 mt-2">
            <div className="bg-blue-300/80 rounded-full px-6 py-2 text-center text-white font-bold shadow-md">
              <div className="text-xl">{profile.stats.posts}</div>
              <div className="text-xs">Posts</div>
            </div>
            <div className="bg-pink-300/80 rounded-full px-6 py-2 text-center text-white font-bold shadow-md">
              <div className="text-xl">{profile.stats.likes}</div>
              <div className="text-xs">Likes</div>
            </div>
            <div className="bg-yellow-300/80 rounded-full px-6 py-2 text-center text-white font-bold shadow-md">
              <div className="text-xl">{profile.stats.comments}</div>
              <div className="text-xs">Comments</div>
            </div>
          </div>
          {/* Edit Button */}
          <button
            className="mt-6 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-7 rounded-full shadow-lg transition-all text-lg animate-fadeIn"
            onClick={() => setEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        </div>
        {/* About Me & Interests */}
        <div className="p-10">
          <div className="mb-8">
            <h3 className="flex items-center text-2xl font-bold text-purple-700 mb-3 animate-fadeInUp">
              <span className="mr-2">👤</span> About Me
            </h3>
            {editing ? (
              <textarea
                className="w-full p-4 rounded-2xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none text-lg bg-white/70 shadow-inner transition-all"
                value={about}
                onChange={e => setAbout(e.target.value)}
                rows={4}
              />
            ) : (
              <div className="bg-purple-50 p-5 rounded-2xl text-gray-700 text-lg shadow-inner animate-fadeIn">
                {profile.about}
              </div>
            )}
          </div>
          <div>
            <h3 className="flex items-center text-2xl font-bold text-green-700 mb-3 animate-fadeInUp">
              <span className="mr-2">💚</span> Interests & Hobbies
            </h3>
            {editing ? (
              <input
                className="w-full p-4 rounded-2xl border-2 border-green-200 focus:border-green-400 focus:outline-none text-lg mb-3 bg-white/70 shadow-inner transition-all"
                value={interests.join(', ')}
                onChange={e => setInterests(e.target.value.split(',').map(i => i.trim()))}
                placeholder="Comma separated interests"
              />
            ) : (
              <div className="flex flex-wrap gap-4 animate-fadeIn">
                {profile.interests.map((interest, idx) => (
                  <span key={idx} className="bg-green-100 text-green-700 px-5 py-2 rounded-full font-semibold shadow">
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
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-7 rounded-full shadow-lg text-lg"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-white font-bold py-2 px-7 rounded-full shadow-lg text-lg transition-all"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

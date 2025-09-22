import React, { useState } from 'react';
import { useAuth } from '../state/auth';

const defaultProfile = {
  avatar: '/public/avatar-grad-hat.png', // Replace with your avatar asset
  name: 'SHEN',
  major: 'Computer Science',
  year: '3rd Year',
  location: 'Campus Dorms',
  stats: {
    posts: 42,
    likes: 156,
    rating: 4.8,
    comments: 89,
  },
  about: "Hey there! I'm a passionate student who loves learning new things and connecting with fellow students. Always up for a good discussion! 🌟",
  interests: ['Programming', 'Gaming', 'Music', 'Art', 'Coffee'],
};

export default function ProfilePage() {
  const [successMsg, setSuccessMsg] = useState('');
  const { user, token, login } = useAuth();
  const [profile, setProfile] = useState(user ? {
    avatar: user.avatar || defaultProfile.avatar,
    name: user.name,
    major: user.major || defaultProfile.major,
    year: user.year || defaultProfile.year,
    location: user.location || defaultProfile.location,
    stats: defaultProfile.stats,
    about: user.about || defaultProfile.about,
    interests: user.interests || defaultProfile.interests,
  } : defaultProfile);
  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState(profile.about);
  const [interests, setInterests] = useState(profile.interests);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar);

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
      // Upload avatar to backend
      const formData = new FormData();
      formData.append('file', avatarFile);
      try {
        const res = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          avatarUrl = data.url;
        }
      } catch (err) {
        alert('Failed to upload avatar.');
      }
    }
    // Save all profile fields to backend
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatar: avatarUrl,
          about,
          interests,
          major: profile.major,
          year: profile.year,
          location: profile.location,
        }),
      });
      const data = await res.json();
      if (data.ok && data.user) {
        setProfile({ ...profile, ...data.user });
        login(token, { ...user, ...data.user }); // update global user state
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 2500);
      } else {
        alert('Failed to save profile.');
      }
    } catch (err) {
      alert('Failed to save profile.');
    }
    setEditing(false);
    setAvatarFile(null);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pink-100 to-purple-200">
      <div className="w-full max-w-xl rounded-3xl shadow-2xl bg-white/90 p-0 overflow-hidden relative">
        {successMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-400 text-white font-bold px-6 py-2 rounded-full shadow-lg z-50 animate-fadeIn">
            {successMsg}
          </div>
        )}
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 p-8 flex flex-col items-center relative">
          <div className="relative mb-2">
            <img src={editing ? avatarPreview : profile.avatar} alt="avatar" className="w-28 h-28 rounded-full border-4 border-white shadow-lg" />
            {editing && (
              <label className="absolute bottom-0 right-0 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-2 cursor-pointer shadow-lg">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <span role="img" aria-label="upload">📤</span>
              </label>
            )}
          </div>
          <h2 className="text-3xl font-extrabold text-white drop-shadow mb-1 tracking-wide">{profile.name}</h2>
          <div className="text-white/90 font-medium text-lg mb-1">{profile.major} • {profile.year}</div>
          <div className="text-white/80 text-sm mb-2">🏠 {profile.location}</div>
          {/* Stats */}
          <div className="absolute top-4 right-4 flex gap-4">
            <div className="bg-blue-300/80 rounded-xl px-4 py-2 text-center text-white font-bold shadow-md">
              <div className="text-lg">{profile.stats.posts}</div>
              <div className="text-xs">Posts</div>
            </div>
            <div className="bg-pink-300/80 rounded-xl px-4 py-2 text-center text-white font-bold shadow-md">
              <div className="text-lg">{profile.stats.likes}</div>
              <div className="text-xs">Likes</div>
            </div>
            <div className="bg-purple-300/80 rounded-xl px-4 py-2 text-center text-white font-bold shadow-md">
              <div className="text-lg">{profile.stats.rating}</div>
              <div className="text-xs">Rating</div>
            </div>
            <div className="bg-yellow-300/80 rounded-xl px-4 py-2 text-center text-white font-bold shadow-md">
              <div className="text-lg">{profile.stats.comments}</div>
              <div className="text-xs">Comments</div>
            </div>
          </div>
          {/* Edit Button */}
          <button
            className="absolute bottom-4 right-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-5 rounded-full shadow-lg transition-all"
            onClick={() => setEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        </div>
        {/* About Me */}
        <div className="p-8">
          <div className="mb-6">
            <h3 className="flex items-center text-xl font-bold text-purple-700 mb-2">
              <span className="mr-2">👤</span> About Me
            </h3>
            {editing ? (
              <textarea
                className="w-full p-3 rounded-xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none text-lg"
                value={about}
                onChange={e => setAbout(e.target.value)}
                rows={3}
              />
            ) : (
              <div className="bg-purple-50 p-4 rounded-xl text-gray-700 text-lg shadow-inner">
                {profile.about}
              </div>
            )}
          </div>
          {/* Interests & Hobbies */}
          <div>
            <h3 className="flex items-center text-xl font-bold text-green-700 mb-2">
              <span className="mr-2">💚</span> Interests & Hobbies
            </h3>
            {editing ? (
              <input
                className="w-full p-3 rounded-xl border-2 border-green-200 focus:border-green-400 focus:outline-none text-lg mb-2"
                value={interests.join(', ')}
                onChange={e => setInterests(e.target.value.split(',').map(i => i.trim()))}
                placeholder="Comma separated interests"
              />
            ) : (
              <div className="flex flex-wrap gap-3">
                {profile.interests.map((interest, idx) => (
                  <span key={idx} className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold shadow">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Save/Cancel Buttons */}
          {editing && (
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-5 rounded-full shadow"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-5 rounded-full shadow"
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

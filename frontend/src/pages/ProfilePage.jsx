
import React, { useState } from 'react';
import { useAuth } from '../state/auth';

const defaultProfile = {
  profile_picture: '/Cute-Cat.png',
  name: 'Your Name',
  about_me: '',
  hobbies_interests: '',
  stats: { posts: 0, likes: 0, comments: 0 }
};

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(user ? {
    profile_picture: user.profile_picture || defaultProfile.profile_picture,
    name: user.name,
    about_me: user.about_me || defaultProfile.about_me,
    hobbies_interests: user.hobbies_interests || defaultProfile.hobbies_interests,
    stats: user.stats || defaultProfile.stats
  } : defaultProfile);
  const [editing, setEditing] = useState(false);
  const [aboutMe, setAboutMe] = useState(profile.about_me);
  const [hobbies, setHobbies] = useState(profile.hobbies_interests);
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
      setProfile(p => ({ ...p, profile_picture: data.profile_picture }));
    } else {
      alert((data && data.error) || 'Failed to upload profile picture.');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(defaultProfile.profile_picture);
    setProfile(p => ({ ...p, profile_picture: defaultProfile.profile_picture }));
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
      setProfile(p => ({ ...p, ...data.profile }));
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
      setEditing(false);
    } else {
      alert((data && data.error) || 'Failed to save profile.');
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
              <>
                <label className="absolute bottom-2 right-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full p-3 cursor-pointer shadow-lg border-2 border-white">
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
                  <span role="img" aria-label="upload" className="text-xl">📤</span>
                </label>
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 cursor-pointer shadow-lg border-2 border-white"
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
                value={aboutMe}
                onChange={e => setAboutMe(e.target.value)}
                rows={4}
              />
            ) : (
              <div className="bg-purple-50 p-5 rounded-2xl text-gray-700 text-lg shadow-inner animate-fadeIn">
                {profile.about_me}
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
                value={hobbies}
                onChange={e => setHobbies(e.target.value)}
                placeholder="Comma separated interests"
              />
            ) : (
              <div className="flex flex-wrap gap-4 animate-fadeIn">
                {(profile.hobbies_interests ? profile.hobbies_interests.split(',') : []).map((interest, idx) => (
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

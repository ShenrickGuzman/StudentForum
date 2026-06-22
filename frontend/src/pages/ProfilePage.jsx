import React, { useState, useEffect } from 'react';
import { useAuth } from '../state/auth';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../lib/Toast';

const defaultProfile = {
  avatar: '/Cute-Cat.png',
  name: 'Your Name',
  about: '',
  interests: [],
  stats: { posts: 0, likes: 0, comments: 0 },
  badges: []
};

export default function ProfilePage() {
  const toast = useToast();
  const { id: routeProfileId } = useParams();
  const navigate = useNavigate();
  const [likeCount, setLikeCount] = useState(0);
  const [likedToday, setLikedToday] = useState(false);
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [aboutMe, setAboutMe] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [profileError, setProfileError] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const handleLikeProfile = async () => {
    if (!token || likedToday || !profile || !profile.name || !profile.id) return;
    try {
      await fetch(`https://studentforum-backend.onrender.com/api/auth/profile/${profile.id}/like`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      setLikedToday(true);
      setLikeCount(likeCount + 1);
    } catch {}
  };

  useEffect(() => {
    async function fetchLikes(profileId) {
      if (!token || !profileId) return;
      try {
        const res = await fetch(`https://studentforum-backend.onrender.com/api/auth/profile/${profileId}/likes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setLikeCount(data.count || 0);
        setLikedToday(!!data.likedToday);
      } catch {}
    }
    async function fetchProfileAndStats() {
      setLoading(true); setProfileError('');
      let profileUrl; let isOwnProfile = false;
      if (routeProfileId) {
        profileUrl = `https://studentforum-backend.onrender.com/api/auth/profile/${routeProfileId}`;
        isOwnProfile = user && String(user.id) === String(routeProfileId);
      } else {
        profileUrl = 'https://studentforum-backend.onrender.com/api/auth/profile';
        isOwnProfile = true;
      }
      const fetchOptions = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
      try {
        const res = await fetch(profileUrl, fetchOptions);
        const data = await res.json();
        if (!data || !data.profile) {
          setProfileError(data && data.error ? data.error : 'Profile not found');
          setLoading(false); return;
        }
        let stats = { posts: 0, likes: 0, comments: 0 };
        const postRes = await fetch(`https://studentforum-backend.onrender.com/api/posts/count?user_id=${data.profile.id}`, token ? { headers: { 'Authorization': `Bearer ${token}` } } : {});
        const postData = await postRes.json();
        stats.posts = postData.count || 0;
        const commentRes = await fetch(`https://studentforum-backend.onrender.com/api/posts/comments/count?user_id=${data.profile.id}`, token ? { headers: { 'Authorization': `Bearer ${token}` } } : {});
        const commentData = await commentRes.json();
        stats.comments = commentData.count || 0;
        setProfile({
          avatar: data.profile.avatar || defaultProfile.avatar,
          name: data.profile.name || defaultProfile.name,
          about: data.profile.about || '',
          interests: Array.isArray(data.profile.interests) ? data.profile.interests : (data.profile.interests ? [data.profile.interests] : []),
          stats,
          badges: Array.isArray(data.profile.badges) ? data.profile.badges : (data.profile.badges ? [data.profile.badges] : []),
          id: data.profile.id
        });
        setAboutMe(data.profile.about || '');
        setHobbies(Array.isArray(data.profile.interests) ? data.profile.interests.join(', ') : (data.profile.interests || ''));
        if (token) fetchLikes(data.profile.id);
        fetchUserPosts(data.profile.id);
        setLoading(false);
      } catch (err) {
        setProfileError('Failed to load profile');
        setLoading(false);
      }
    }
    async function fetchUserPosts(userId) {
      setPostsLoading(true);
      try {
        const res = await api.get('/posts', { params: { user_id: userId } });
        setUserPosts(Array.isArray(res.data) ? res.data : (res.data?.posts || []));
      } catch {}
      setPostsLoading(false);
    }
    fetchProfileAndStats();
  }, [token, routeProfileId, user]);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(profile.profile_picture);
  const [successMsg, setSuccessMsg] = useState('');

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setAvatarError('Only JPEG and PNG allowed.'); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarError('Image must be less than 2MB.'); return; }
    setAvatarError('');
    const formData = new FormData();
    formData.append('picture', file);
    const res = await fetch('https://studentforum-backend.onrender.com/api/auth/profile/picture', {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData
    });
    const data = await res.json();
    if (data && data.profile_picture) {
      setAvatarPreview(data.profile_picture);
      setProfile(p => ({ ...p, avatar: data.profile_picture }));
    } else { toast.show((data && data.error) || 'Failed to upload.', 'error'); }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(defaultProfile.avatar);
    setProfile(p => ({ ...p, avatar: defaultProfile.avatar }));
  };

  const handleSave = async () => {
    const res = await fetch('https://studentforum-backend.onrender.com/api/auth/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ about_me: aboutMe, hobbies_interests: hobbies })
    });
    const data = await res.json();
    if (data && data.ok && data.profile) {
      setProfile({
        avatar: data.profile.avatar || defaultProfile.avatar,
        name: data.profile.name || defaultProfile.name,
        about: data.profile.about || '',
        interests: Array.isArray(data.profile.interests) ? data.profile.interests : (data.profile.interests ? [data.profile.interests] : []),
        stats: data.profile.stats || defaultProfile.stats,
        badges: Array.isArray(data.profile.badges) ? data.profile.badges : (data.profile.badges ? [data.profile.badges] : [])
      });
      setAboutMe(data.profile.about || '');
      setHobbies(Array.isArray(data.profile.interests) ? data.profile.interests.join(', ') : (data.profile.interests || ''));
      setSuccessMsg('Profile updated!');
      setTimeout(() => setSuccessMsg(''), 2500);
      setEditing(false);
    } else { toast.show((data && data.error) || 'Failed to save.', 'error'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-background dark:bg-dark-bg"><div className="card px-8 py-6 text-center"><div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin mx-auto mb-3" /><p className="text-sm text-muted dark:text-dark-muted">Loading profile...</p></div></div>;
  }
  if (profileError) {
    return <div className="flex items-center justify-center min-h-screen bg-background dark:bg-dark-bg"><div className="card px-8 py-6 text-center"><p className="text-sm text-error">{profileError}</p></div></div>;
  }
  const isOwnProfile = user && profile && String(user.id) === String(profile.id);
  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg px-4 py-8">
      {successMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-success text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg z-50 animate-fadeIn">{successMsg}</div>
      )}
      <div className="max-w-4xl mx-auto">
        {/* Hero Header */}
        <div className="relative rounded-2xl bg-gradient-to-r from-primary via-primary/80 to-secondary/80 px-6 sm:px-10 py-10 sm:py-14 flex flex-col items-center text-center mb-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white dark:bg-dark-surface" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 rounded-full bg-white dark:bg-dark-surface" />
          </div>
          <div className="relative">
            <div className="relative inline-block mb-3">
              <img src={editing ? avatarPreview : profile.avatar} alt="avatar" className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white/80 shadow-xl object-cover bg-white dark:bg-dark-surface" />
              {editing && isOwnProfile && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-2 mt-1">
                  <label className="bg-white/90 hover:bg-white text-primary rounded-full w-8 h-8 flex items-center justify-center cursor-pointer shadow text-sm transition">
                    <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarChange} />
                    📤
                  </label>
                  <button className="bg-white/90 hover:bg-white text-error rounded-full w-8 h-8 flex items-center justify-center shadow text-sm transition" onClick={handleRemoveAvatar} title="Remove avatar">❌</button>
                </div>
              )}
            </div>
            {avatarError && <p className="text-xs text-error bg-white/90 rounded-full px-3 py-1 mt-2">{avatarError}</p>}
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{profile.name}</h2>
            {Array.isArray(profile.badges) && profile.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {profile.badges.map((badge, idx) => (
                  <span key={idx} className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-white/40 ${badge === 'ADMIN' ? 'bg-red-500 text-white' : badge === 'DEVELOPER' ? 'bg-blue-500 text-white' : 'bg-white/80 text-dark'}`}>{badge}</span>
                ))}
              </div>
            )}
            {/* Stats */}
            <div className="flex gap-4 sm:gap-8 mt-5 justify-center">
              <div className="bg-white/15 rounded-xl px-5 sm:px-8 py-3 text-center text-white">
                <div className="text-lg sm:text-xl font-bold">{profile.stats.posts}</div>
                <div className="text-xs sm:text-sm opacity-80">Posts</div>
              </div>
              <div className="bg-white/15 rounded-xl px-5 sm:px-8 py-3 text-center text-white">
                <div className="text-lg sm:text-xl font-bold">{likeCount}</div>
                <div className="text-xs sm:text-sm opacity-80">Likes</div>
                {user && profile && String(user.id) !== String(profile.id) && (
                  <button className={`mt-2 px-3 py-1 rounded-full text-xs font-bold shadow transition ${likedToday ? 'bg-white/30 text-white/60 cursor-not-allowed' : 'bg-white/90 text-primary hover:bg-white'}`} onClick={handleLikeProfile} disabled={likedToday}>
                    {likedToday ? 'Liked' : '👍 Like'}
                  </button>
                )}
              </div>
              <div className="bg-white/15 rounded-xl px-5 sm:px-8 py-3 text-center text-white">
                <div className="text-lg sm:text-xl font-bold">{profile.stats.comments}</div>
                <div className="text-xs sm:text-sm opacity-80">Comments</div>
              </div>
            </div>
            {isOwnProfile && !editing && (
              <button className="mt-5 bg-white/90 hover:bg-white text-primary font-semibold py-2 px-6 rounded-full shadow transition text-sm" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
            )}
          </div>
        </div>
        {/* About Me & Interests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-base font-bold text-dark dark:text-dark-text mb-3 flex items-center gap-2"><span>👤</span> About Me</h3>
            {editing && isOwnProfile ? (
              <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-dark-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none min-h-[100px]" value={aboutMe} onChange={e => setAboutMe(e.target.value)} rows={4} />
            ) : (
              <div className="text-sm text-muted dark:text-dark-muted leading-relaxed min-h-[60px]">{profile.about}</div>
            )}
          </div>
          <div className="card p-6">
            <h3 className="text-base font-bold text-dark dark:text-dark-text mb-3 flex items-center gap-2"><span>💚</span> Interests & Hobbies</h3>
            {editing && isOwnProfile ? (
              <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-dark-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" value={hobbies} onChange={e => setHobbies(e.target.value)} placeholder="Comma separated interests" />
            ) : (
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {(Array.isArray(profile.interests) ? profile.interests : []).map((interest, idx) => (
                  <span key={idx} className="bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm font-medium">{interest}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Save/Cancel */}
        {editing && isOwnProfile && (
          <div className="flex justify-end gap-3 mt-6">
            <button className="btn-secondary text-sm" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn-primary text-sm" onClick={handleSave}>Save</button>
          </div>
        )}

        {/* Posts */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-dark dark:text-dark-text mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-muted dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            Posts ({userPosts.length})
          </h3>
          {postsLoading ? (
            <div className="flex items-center justify-center py-8"><div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>
          ) : userPosts.length === 0 ? (
            <p className="text-sm text-muted dark:text-dark-muted text-center py-8">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {userPosts.map(post => (
                <div key={post.id} className="card p-4 hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary uppercase">{post.category}</span>
                    {post.pinned && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Pinned</span>}
                    {post.status !== 'approved' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>{post.status}</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-dark dark:text-dark-text text-sm leading-snug mb-1 line-clamp-2">{post.title}</h4>
                  <p className="text-xs text-muted dark:text-dark-muted">{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

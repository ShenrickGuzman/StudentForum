import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { getAssetUrl } from '../lib/api';
import { useAuth } from '../state/auth';

export default function PostDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const { token } = useAuth();

  const load = () => api.get(`/posts/${id}`).then(r => {
    setData(r.data);
    setLoading(false);
  });
  useEffect(() => { setLoading(true); load(); }, [id]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    await api.post(`/posts/${id}/comments`, { content: comment });
    setComment('');
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-yellow-100">
        <div className="cartoon-card text-2xl font-bold text-primary bg-white/90 p-8 shadow-fun flex flex-col items-center gap-2">
          <span className="text-4xl animate-spin">💬</span>
          Loading Forum...
        </div>
      </div>
    );
  }
  if (!data) return null;
  const { post, comments } = data;

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
      <div className="relative z-10 max-w-3xl mx-auto py-12 space-y-8">
        {/* Post Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-purple-200 flex flex-col gap-4">
          {/* Forum status indicators */}
          <div className="flex gap-2 items-center mb-1 justify-center">
            {post.pinned && <span className="text-accent font-bold flex items-center gap-1"><span className="text-xl">📌</span> This Forum is pinned by an admin</span>}
            {post.locked && <span className="text-error font-bold flex items-center gap-1"><span className="text-xl">🔒</span> This Forum has been locked by an admin</span>}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{post.pinned ? '📌' : ''}</span>
            <span className={`px-3 py-1 rounded-full text-white text-xs shadow font-bold ${
              post.category === 'Academics' ? 'bg-blue-500' :
              post.category === 'Class Life' ? 'bg-green-500' :
              post.category === 'Ideas' ? 'bg-yellow-400 text-yellow-900' :
              'bg-purple-600'
            }`}>
              {post.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700 mb-2 text-center drop-shadow-lg flex items-center justify-center gap-3">
            {post.title}
            {post.locked && <span className="text-error text-2xl font-bold ml-2">🔒</span>}
          </h1>
          {/* Author and date/time */}
          <div className="text-center text-gray-500 text-base mb-2">
            By: <span className="font-bold">{post.author_name}</span>
            {post.created_at && (
              <span> • {new Date(post.created_at).toLocaleString()}</span>
            )}
          </div>
          {post.image_url && <img alt="" className="rounded-2xl my-2 max-h-64 object-contain mx-auto border-2 border-purple-100" src={getAssetUrl(post.image_url)} />}
          <p className="whitespace-pre-wrap text-lg md:text-xl font-semibold text-gray-700 text-center max-w-2xl mx-auto mb-2 drop-shadow-lg bg-white/80 rounded-xl px-4 py-2 border border-purple-100" style={{fontWeight: 600}}>{post.content}</p>
          {post.link_url && <a className="text-pink-500 underline font-bold" href={post.link_url} target="_blank" rel="noreferrer">🔗 Visit link</a>}
        </div>
        {/* Comments Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-pink-200">
          <h2 className="text-2xl font-bold mb-3 text-pink-500 drop-shadow flex items-center gap-2">💬 Comments {post.locked && <span className="text-error text-lg">(Locked)</span>}</h2>
          <div className="space-y-3">
            {comments.length === 0 && <div className="text-gray-400 text-base">No comments yet. Be the first!</div>}
            {comments.map(c => (
              <div key={c.id} className="p-3 rounded-xl border-2 border-purple-100 bg-purple-50 flex items-center gap-2">
                <span className="text-lg">🗨️</span>
                <span className="flex-1 text-gray-700">{c.content}</span>
                <span className="opacity-70 text-sm text-gray-500">- {c.author_name}</span>
              </div>
            ))}
          </div>
          {token && !post.locked && (
            <div className="mt-6 flex gap-2">
              <input
                className="flex-1 rounded-xl px-4 py-3 border-2 border-pink-200 text-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Write a comment"
              />
              <button className="rounded-xl px-6 py-3 text-lg font-bold bg-gradient-to-r from-pink-400 to-orange-300 hover:from-pink-500 hover:to-orange-400 text-white shadow-lg transition-all" onClick={sendComment}>Send 💬</button>
            </div>
          )}
          {token && post.locked && (
            <div className="mt-6 text-center text-error font-bold">Comments are locked for this post.</div>
          )}
        </div>
      </div>
    </div>
  );
}



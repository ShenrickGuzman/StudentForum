import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../state/auth';

export default function PostDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const { token } = useAuth();

  const load = () => api.get(`/posts/${id}`).then(r => setData(r.data));
  useEffect(() => { load(); }, [id]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    await api.post(`/posts/${id}/comments`, { content: comment });
    setComment('');
    load();
  };

  if (!data) return null;
  const { post, comments } = data;

  return (
    <div className="space-y-6 font-cartoon">
      <div className="cartoon-card p-6 border-4 border-primary/30 shadow-cartoon bg-white/90">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{post.pinned ? '📌' : ''}</span>
          <span className="text-base opacity-70">{post.category}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-primary drop-shadow mb-2">{post.title}</h1>
        {post.image_url && <img alt="" className="rounded-cartoon my-2 max-h-64 object-contain mx-auto border-4 border-secondary/30" src={post.image_url} />}
        <p className="whitespace-pre-wrap text-lg mb-2">{post.content}</p>
        {post.link_url && <a className="text-accent underline font-bold" href={post.link_url} target="_blank" rel="noreferrer">🔗 Visit link</a>}
      </div>
      <div className="cartoon-card p-6 border-4 border-secondary/30 shadow-fun bg-white/90">
        <h2 className="text-2xl font-bold mb-3 text-secondary drop-shadow flex items-center gap-2">💬 Comments</h2>
        <div className="space-y-3">
          {comments.length === 0 && <div className="text-dark/50 text-base">No comments yet. Be the first!</div>}
          {comments.map(c => (
            <div key={c.id} className="p-3 rounded-cartoon border-2 border-primary/20 bg-primary/10 flex items-center gap-2">
              <span className="text-lg">🗨️</span>
              <span className="flex-1">{c.content}</span>
              <span className="opacity-70 text-sm">- {c.author_name}</span>
            </div>
          ))}
        </div>
        {token && (
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 rounded-cartoon px-4 py-3 border-4 border-secondary text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write a comment"
            />
            <button className="fun-btn px-6 py-3 text-lg shadow-fun" onClick={sendComment}>Send 💬</button>
          </div>
        )}
      </div>
    </div>
  );
}



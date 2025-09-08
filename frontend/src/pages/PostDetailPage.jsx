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
    <div className="space-y-4">
      <div className="card-bubble p-4">
        <div className="text-sm opacity-70">{post.pinned ? '📌 Pinned' : ''} {post.category}</div>
        <h1 className="text-3xl font-extrabold">{post.title}</h1>
        {post.image_url && <img alt="" className="rounded-bubble my-2" src={post.image_url} />}
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.link_url && <a className="text-blue-600 underline" href={post.link_url} target="_blank" rel="noreferrer">Visit link</a>}
      </div>
      <div className="card-bubble p-4">
        <h2 className="text-2xl font-bold mb-2">Comments</h2>
        <div className="space-y-2">
          {comments.map(c => (
            <div key={c.id} className="p-3 rounded-bubble border-2">{c.content} <span className="opacity-70">- {c.author_name}</span></div>
          ))}
        </div>
        {token && (
          <div className="mt-3 flex gap-2">
            <input className="flex-1 rounded-full px-4 py-2 border-2" value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment" />
            <button className="btn-fun" onClick={sendComment}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
}



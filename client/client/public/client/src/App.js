import React, { useState, useEffect } from 'react';

function App() {
  const [tab, setTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (tab === 'feed') {
      fetch(`http://localhost:5000/api/posts?page=${page}&limit=5`)
        .then(res => res.json())
        .then(data => setPosts(prev => [...prev, ...data]));
    } else {
      fetch(`http://localhost:5000/api/reels?page=${page}&limit=3`)
        .then(res => res.json())
        .then(data => setReels(prev => [...prev, ...data]));
    }
  }, [tab, page]);

  return (
    <div style={{ maxWidth: '480px', margin: 'auto', background: '#000', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #262626', fontSize: '20px', fontWeight: 'bold' }}>
        <span>Instagram Clone</span>
        <div>
          <button onClick={() => { setTab('feed'); setPage(1); setPosts([]); }} style={{ background: tab === 'feed' ? '#0095f6' : '#262626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', marginRight: '5px', cursor: 'pointer' }}>Posts</button>
          <button onClick={() => { setTab('reels'); setPage(1); setReels([]); }} style={{ background: tab === 'reels' ? '#0095f6' : '#262626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Reels</button>
        </div>
      </div>

      {/* Content Feed */}
      <div style={{ padding: '10px' }}>
        {tab === 'feed' ? (
          posts.map(post => (
            <div key={post._id} style={{ background: '#121212', marginBottom: '15px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #262626' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
                <img src={post.user?.profilePic} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '10px' }} />
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{post.user?.username}</span>
              </div>
              <img src={post.mediaUrl} alt="" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} />
              <div style={{ padding: '10px', fontSize: '14px' }}>
                <b>{post.user?.username}</b> {post.caption}
                <div style={{ color: '#8e8e8e', fontSize: '12px', marginTop: '5px' }}>❤️ {post.likesCount} likes • 💬 {post.commentsCount} comments</div>
              </div>
            </div>
          ))
        ) : (
          reels.map(reel => (
            <div key={reel._id} style={{ position: 'relative', height: '550px', background: '#1a1a1a', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <video src={reel.mediaUrl} controls autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '20px', left: '15px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <img src={reel.user?.profilePic} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '8px' }} />
                  <span style={{ fontWeight: 'bold' }}>{reel.user?.username}</span>
                </div>
                <div style={{ fontSize: '13px' }}>{reel.caption}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Pagination */}
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <button onClick={() => setPage(p => p + 1)} style={{ background: '#0095f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Load More Content</button>
      </div>
    </div>
  );
}

export default App;
                                                                                        

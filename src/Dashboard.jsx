import './Dashboard.css'
import brandLogo from './assets/logo.png'
import userAvatar from './assets/chesterpogi.jpg'
import { GAMES } from './games'
import tempImage from './assets/strongman.png'
import { useState, useEffect } from 'react'
import ImageOverlay from './ImageOverlay.jsx'

function Dashboard({ onLogout, onNavigateExplore, onOpenGame, onOpenProfile, onOpenChat, recentVisits = [] }) {
  const IconChat = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21 12c0 4.418-4.03 8-9 8-1.02 0-2.004-.148-2.93-.426L3 21l1.44-4.32C3.53 15.31 3 13.71 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconPen = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12.5 5.5l6 6L8 22H2v-6l10.5-10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 4l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconBell = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M15 17H5l2-3v-3a5 5 0 1110 0v3l2 3h-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 21a2 2 0 002 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
  const IconHome = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M3 10l9-7 9 7v10a2 2 0 01-2 2h-5v-7H10v7H5a2 2 0 01-2-2V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconExplore = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 3a9 9 0 100 18 9 9 0 000-18Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M9 15l6-3 3-6-6 3-3 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )

  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [avatarSrc, setAvatarSrc] = useState(() => {
    try {
      const saved = localStorage.getItem('profileSelf')
      if (saved) return JSON.parse(saved).avatar || userAvatar
    } catch {}
    return userAvatar
  })
  useEffect(() => {
    function syncAvatar() {
      try {
        const saved = localStorage.getItem('profileSelf')
        if (saved) setAvatarSrc(JSON.parse(saved).avatar || userAvatar)
      } catch {}
    }
    window.addEventListener('profile-updated', syncAvatar)
    window.addEventListener('storage', syncAvatar)
    return () => {
      window.removeEventListener('profile-updated', syncAvatar)
      window.removeEventListener('storage', syncAvatar)
    }
  }, [])
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('userPosts')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  useEffect(() => {
    try {
      localStorage.setItem('userPosts', JSON.stringify(posts))
      window.dispatchEvent(new CustomEvent('posts-updated'))
    } catch {}
  }, [posts])

  useEffect(() => {
    function reloadPosts() {
      try {
        const saved = localStorage.getItem('userPosts')
        if (saved) setPosts(JSON.parse(saved))
      } catch {}
    }
    window.addEventListener('posts-updated', reloadPosts)
    window.addEventListener('storage', reloadPosts)
    return () => {
      window.removeEventListener('posts-updated', reloadPosts)
      window.removeEventListener('storage', reloadPosts)
    }
  }, [])

  function addPost(post) {
    setPosts((p) => [post, ...p])
  }

  useEffect(() => {
    function openComposer() {
      setIsComposerOpen(true)
    }
    window.addEventListener('open-composer', openComposer)
    return () => window.removeEventListener('open-composer', openComposer)
  }, [])
  return (
    <div className="dash">
      <header className="dash-header">
        <div className="dash-left">
          <img src={brandLogo} alt="Gamer Helpers" className="dash-logo" />
          <span className="dash-title">Gamer Helpers</span>
        </div>
        <div className="dash-center">
          <input className="dash-search" placeholder="Search" />
        </div>
        <div className="dash-right">
          <button className="dash-icon" aria-label="Messages" onClick={()=> onOpenChat && onOpenChat()}><IconChat /></button>
          <button className="dash-icon" aria-label="Compose" onClick={()=> setIsComposerOpen(true)}><IconPen /></button>
          <button className="dash-icon" aria-label="Alerts"><IconBell /></button>
          <div className="dash-avatar" role="button" onClick={() => onOpenProfile && onOpenProfile()}>
            <img src={avatarSrc} alt="profile" className="avatar-img" />
          </div>
          <button className="dash-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dash-body">
        <aside className="dash-sidebar">
          <nav className="dash-nav">
            <a className="dash-nav-item is-active" href="#"><span className="nav-ico"><IconHome /></span> Home</a>
            <a className="dash-nav-item" href="#" onClick={(e)=>{e.preventDefault(); onNavigateExplore && onNavigateExplore();}}>
              <span className="nav-ico"><IconExplore /></span> Explore
            </a>
          </nav>

          <div className="dash-section">
            <div className="dash-section-title">Your recent visits</div>
            <ul className="dash-list recent-list">
              {recentVisits.map((k) => (
                <li key={k} role="button" onClick={() => onOpenGame && onOpenGame(k)}>
                  <img src={GAMES[k]?.logo} alt="" />
                  <span>{GAMES[k]?.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="dash-feed">
          {posts.map((p) => (
            <article className="post" key={p.id}>
              <div className="post-header">
                <div className="post-avatar"><img src={avatarSrc} alt="" className="avatar-img" /></div>
                <div className="post-meta">
                  <div className="post-author">Chester Bryan Torres</div>
                  <div className="post-sub">posted just now</div>
                </div>
                <button className="post-close" aria-label="Close">×</button>
              </div>
              <div className="post-title">{p.title}</div>
              <div className="post-body">
                <p>{p.body}</p>
              </div>
              {p.media?.length ? (
                <div className={`post-media-grid ${p.media.length === 1 ? 'is-single' : ''}`}>
                  {p.media.map((src, idx) => (
                    <div key={idx} className="media ph" onClick={() => setLightboxSrc(src)}>
                      <img src={src} alt="" />
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="post-actions">
                <button>❤️ 0</button>
                <button>💬</button>
                <button>↗</button>
              </div>
            </article>
          ))}
          <article className="post">
            <div className="post-header">
              <div className="post-avatar"><img src={avatarSrc} alt="" className="avatar-img" /></div>
              <div className="post-meta">
                <div className="post-author">Chester Bryan Torres</div>
                <div className="post-sub">has a piloting service for Valorant</div>
              </div>
              <button className="post-close" aria-label="Close">×</button>
            </div>
            <div className="post-title">Never Gonna Give You Up Lyrics</div>
            <div className="post-body">
              <p>Never gonna give you up<br/>Never gonna let you down<br/>Never gonna run around and desert you</p>
            </div>
            <div className="post-media-grid">
              <div className="media ph" onClick={() => setLightboxSrc(tempImage)}><img src={tempImage} alt="" /></div>
              <div className="media ph" onClick={() => setLightboxSrc(tempImage)}><img src={tempImage} alt="" /></div>
            </div>
            <div className="post-actions">
              <button>❤️ 067</button>
              <button>💬</button>
              <button>↗</button>
            </div>
          </article>

          <article className="post">
            <div className="post-header">
              <div className="post-avatar"><img src={avatarSrc} alt="" className="avatar-img" /></div>
              <div className="post-meta">
                <div className="post-author">Chester Bryan Torres</div>
                <div className="post-sub">has a coaching service for Genshin Impact</div>
              </div>
              <button className="post-close" aria-label="Close">×</button>
            </div>
            <div className="post-title">PUKELOVETITE</div>
            <div className="post-body">
              <p>
                TIETITEIEITEITEITEITEITIETIEITEITIETIEITIETIEITITEITEITEITEITIETIEITEITIE
              </p>
            </div>
            <div className="post-media-wide ph" onClick={() => setLightboxSrc(tempImage)}><img src={tempImage} alt="" /></div>
            <div className="post-actions">
              <button>❤️ 124</button>
              <button>💬</button>
              <button>↗</button>
            </div>
          </article>
        </main>
        <ImageOverlay src={lightboxSrc} title="Post Image" onClose={() => setLightboxSrc(null)} />

        {isComposerOpen ? (
          <PostComposer
            onClose={() => setIsComposerOpen(false)}
            onSubmit={(post) => {
              addPost(post)
              setIsComposerOpen(false)
            }}
          />
        ) : null}

        <aside className="dash-rightbar">
          <div className="dash-card">
            <div className="dash-card-title">Who to follow</div>
            <ul className="dash-list">
              <li>@pro_helper</li>
              <li>@coach_zen</li>
              <li>@aimmaster</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Dashboard


function PostComposer({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])

  function onPick(e) {
    const list = Array.from(e.target.files || [])
    setFiles(list)
    const urls = list.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
  }

  function submit(e) {
    e.preventDefault()
    if (!title.trim() && !body.trim() && previews.length === 0) return
    onSubmit &&
      onSubmit({
        id: 'p-' + Math.random().toString(36).slice(2, 8),
        title: title.trim(),
        body: body.trim(),
        media: previews,
      })
  }

  return (
    <div className="composer-overlay" role="dialog" aria-modal="true">
      <div className="composer-backdrop" onClick={onClose} />
      <div className="composer-card">
        <div className="composer-head">
          <h3>Create Post</h3>
          <button className="composer-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="composer-form" onSubmit={submit}>
          <label className="composer-label">
            <span>Title</span>
            <input className="composer-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="composer-label">
            <span>Description</span>
            <textarea className="composer-textarea" value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <label className="composer-label">
            <span>Photos</span>
            <input className="composer-input" type="file" multiple accept="image/*" onChange={onPick} />
          </label>
          {previews.length ? (
            <div className="composer-previews">
              {previews.map((src, i) => (
                <div key={i} className="composer-thumb">
                  <img src={src} alt="" />
                </div>
              ))}
            </div>
          ) : null}
          <div className="composer-actions">
            <button type="button" className="admin-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn">
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

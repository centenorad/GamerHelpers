import './Dashboard.css'
import brandLogo from './assets/logo.png'
import { GAMES } from './games'
import userAvatar from './assets/chesterpogi.jpg'
import tempImage from './assets/strongman.png'
import { useState, useEffect } from 'react'
import ImageOverlay from './ImageOverlay.jsx'

function Profile({
  onLogout,
  onNavigateHome,
  onNavigateExplore,
  recentVisits = [],
  variant = 'self', // 'self' | 'other'
  user = { name: 'Chester Bryan Torres', handle: '@chester123' },
  onOpenChat,
  openLightbox,
}) {
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('profileSelf')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { name: user.name, handle: user.handle, bio: 'Hello this is my bio', avatar: userAvatar }
  })
  useEffect(() => {
    try { localStorage.setItem('profileSelf', JSON.stringify(profile)) } catch {}
  }, [profile])
  // Keep the header avatar (beside Logout) in sync on this page as well
  const [avatarHeader, setAvatarHeader] = useState(() => profile.avatar || userAvatar)
  useEffect(() => {
    function syncAvatar() {
      try {
        const saved = localStorage.getItem('profileSelf')
        if (saved) setAvatarHeader(JSON.parse(saved).avatar || userAvatar)
      } catch {}
    }
    window.addEventListener('profile-updated', syncAvatar)
    window.addEventListener('storage', syncAvatar)
    // also update when local profile state changes
    syncAvatar()
    return () => {
      window.removeEventListener('profile-updated', syncAvatar)
      window.removeEventListener('storage', syncAvatar)
    }
  }, [profile.avatar])
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
          <button className="dash-icon" aria-label="Compose" onClick={()=> { onNavigateHome && onNavigateHome(); setTimeout(()=>window.dispatchEvent(new CustomEvent('open-composer')),0) }}><IconPen /></button>
          <button className="dash-icon" aria-label="Alerts"><IconBell /></button>
          <div className="dash-avatar">
            <img src={avatarHeader} alt="profile" className="avatar-img" />
          </div>
          <button className="dash-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dash-body">
        <aside className="dash-sidebar">
          <nav className="dash-nav">
            <a className="dash-nav-item" href="#" onClick={(e)=>{e.preventDefault(); onNavigateHome && onNavigateHome();}}>
              <span className="nav-ico"><IconHome /></span> Home
            </a>
            <a className="dash-nav-item" href="#" onClick={(e)=>{e.preventDefault(); onNavigateExplore && onNavigateExplore();}}>
              <span className="nav-ico"><IconExplore /></span> Explore
            </a>
          </nav>

          <div className="dash-section">
            <div className="dash-section-title">Your recent visits</div>
            <ul className="dash-list recent-list">
              {recentVisits.map((k) => (
                <li key={k}>
                  <img src={GAMES[k]?.logo} alt="" />
                  <span>{GAMES[k]?.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="dash-feed">
          <div className="profile-head">
            <div className="profile-avatar"><img src={profile.avatar || userAvatar} alt="" className="avatar-img" /></div>
            <div className="profile-info">
              <div className="profile-name">{profile.name}</div>
              <div className="profile-handle">{profile.handle}</div>
            </div>
            {variant === 'self' ? (
              <button className="profile-edit" onClick={()=> setIsEditOpen(true)}>Edit Profile</button>
            ) : (
              <button className="profile-edit" onClick={() => onOpenChat && onOpenChat(user)}>Message</button>
            )}
          </div>
          <div className="profile-bio">
            {profile.bio}
          </div>

          <h3 className="exp-heading">Posts</h3>

          <UserPostsList />

          <article className="post">
            <div className="post-header">
              <div className="post-avatar"><img src={profile.avatar || userAvatar} alt="" className="avatar-img" /></div>
              <div className="post-meta">
                <div className="post-author">Chester Bryan Torres</div>
                <div className="post-sub">has a coaching service for Genshin Impact</div>
              </div>
              <button className="post-close" aria-label="Close">×</button>
            </div>
            <div className="post-title">Never Gonna Give You Up Lyrics</div>
            <div className="post-body">
              <p>
                Never gonna give you up<br/>
                Never gonna let you down<br/>
                Never gonna run around and desert you
              </p>
            </div>
            <div className="post-media-grid">
              <div className="media ph" onClick={() => setLightboxSrc(tempImage)}>
                <img src={tempImage} alt="" />
              </div>
              <div className="media ph" onClick={() => setLightboxSrc(tempImage)}>
                <img src={tempImage} alt="" />
              </div>
            </div>
            <div className="post-actions">
              <button>❤️ 067</button>
              <button>💬</button>
              <button>↗</button>
            </div>
          </article>
        </main>
        <ImageOverlay src={lightboxSrc} title="Post Image" onClose={() => setLightboxSrc(null)} />
        {isEditOpen ? (
          <EditProfileModal
            initial={profile}
            onClose={()=> setIsEditOpen(false)}
            onSave={(p)=> { 
              setProfile(p); 
              setIsEditOpen(false); 
              try { localStorage.setItem('profileSelf', JSON.stringify(p)) } catch {}
              window.dispatchEvent(new CustomEvent('profile-updated'))
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export default Profile

function UserPostsList() {
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('userPosts')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [avatarSrc, setAvatarSrc] = useState(() => {
    try {
      const saved = localStorage.getItem('profileSelf')
      if (saved) return JSON.parse(saved).avatar || userAvatar
    } catch {}
    return userAvatar
  })
  useEffect(() => {
    function reload() {
      try {
        const saved = localStorage.getItem('userPosts')
        if (saved) setPosts(JSON.parse(saved))
      } catch {}
    }
    function syncAvatar() {
      try {
        const saved = localStorage.getItem('profileSelf')
        if (saved) setAvatarSrc(JSON.parse(saved).avatar || userAvatar)
      } catch {}
    }
    window.addEventListener('posts-updated', reload)
    window.addEventListener('storage', reload)
    window.addEventListener('profile-updated', syncAvatar)
    window.addEventListener('storage', syncAvatar)
    return () => {
      window.removeEventListener('posts-updated', reload)
      window.removeEventListener('storage', reload)
      window.removeEventListener('profile-updated', syncAvatar)
      window.removeEventListener('storage', syncAvatar)
    }
  }, [])

  function deletePost(id) {
    setPosts((curr) => {
      const next = curr.filter((p) => p.id !== id)
      try {
        localStorage.setItem('userPosts', JSON.stringify(next))
        window.dispatchEvent(new CustomEvent('posts-updated'))
      } catch {}
      return next
    })
  }

  if (!posts.length) return null

  return (
    <>
      {posts.map((p) => (
        <article className="post" key={p.id}>
          <div className="post-header">
            <div className="post-avatar"><img src={avatarSrc} alt="" className="avatar-img" /></div>
            <div className="post-meta">
              <div className="post-author">Chester Bryan Torres</div>
              <div className="post-sub">posted just now</div>
            </div>
            <button className="post-close" aria-label="Delete" onClick={() => deletePost(p.id)}>×</button>
          </div>
          <div className="post-title">{p.title}</div>
          <div className="post-body">
            <p>{p.body}</p>
          </div>
          {p.media?.length ? (
            <div className={`post-media-grid ${p.media.length === 1 ? 'is-single' : ''}`}>
              {p.media.map((src, idx) => (
                <div key={idx} className="media ph">
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
    </>
  )
}

function EditProfileModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial.name || '')
  const [handle, setHandle] = useState(initial.handle || '')
  const [bio, setBio] = useState(initial.bio || '')
  const [avatar, setAvatar] = useState(initial.avatar || '')

  function pick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result)
    }
    reader.readAsDataURL(f)
  }

  function submit(e) {
    e.preventDefault()
    onSave && onSave({ name, handle, bio, avatar })
  }

  return (
    <div className="composer-overlay" role="dialog" aria-modal="true">
      <div className="composer-backdrop" onClick={onClose} />
      <div className="composer-card" style={{ width: 'min(520px, 94vw)' }}>
        <div className="composer-head">
          <h3>Edit Profile</h3>
          <button className="composer-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <form className="composer-form" onSubmit={submit}>
          <label className="composer-label">
            <span>Name</span>
            <input className="composer-input" value={name} onChange={(e)=> setName(e.target.value)} />
          </label>
          <label className="composer-label">
            <span>Username</span>
            <input className="composer-input" value={handle} onChange={(e)=> setHandle(e.target.value)} />
          </label>
          <label className="composer-label">
            <span>Bio</span>
            <textarea className="composer-textarea" value={bio} onChange={(e)=> setBio(e.target.value)} />
          </label>
          <label className="composer-label">
            <span>Picture</span>
            <input type="file" accept="image/*" onChange={pick} className="composer-input" />
          </label>
          {avatar ? (
            <div className="composer-previews">
              <div className="composer-thumb"><img src={avatar} alt="" /></div>
            </div>
          ) : null}
          <div className="composer-actions">
            <button type="button" className="admin-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

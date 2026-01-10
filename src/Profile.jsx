import './Dashboard.css'
import brandLogo from './assets/logo.png'
import { GAMES } from './games'
import userAvatar from './assets/chesterpogi.jpg'
import tempImage from './assets/strongman.png'
import tempImage2 from './assets/valorant.png'
import { useState, useEffect } from 'react'
import ImageOverlay from './ImageOverlay.jsx'

function Profile({
  onLogout,
  onNavigateHome,
  onNavigateExplore,
  recentVisits = [],
  variant = 'self',
  user = { name: 'Chester Bryan Torres', handle: '@chester123' },
  onOpenChat,
}) {
  /* ---------------- LIGHTBOX STATE (FIX) ---------------- */
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = (images, index = 0) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxImages([])
    setLightboxIndex(0)
  }
  /* ------------------------------------------------------ */

  const [isEditOpen, setIsEditOpen] = useState(false)

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('profileSelf')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      name: user.name,
      handle: user.handle,
      bio: 'Hello this is my bio',
      avatar: userAvatar,
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('profileSelf', JSON.stringify(profile))
    } catch {}
  }, [profile])

  const [avatarHeader, setAvatarHeader] = useState(profile.avatar || userAvatar)

  useEffect(() => {
    function syncAvatar() {
      try {
        const saved = localStorage.getItem('profileSelf')
        if (saved) setAvatarHeader(JSON.parse(saved).avatar || userAvatar)
      } catch {}
    }
    window.addEventListener('profile-updated', syncAvatar)
    window.addEventListener('storage', syncAvatar)
    syncAvatar()
    return () => {
      window.removeEventListener('profile-updated', syncAvatar)
      window.removeEventListener('storage', syncAvatar)
    }
  }, [profile.avatar])

  /* ---------------- ICONS (UNCHANGED) ---------------- */
  const IconHome = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 10l9-7 9 7v10a2 2 0 01-2 2h-5v-7H10v7H5a2 2 0 01-2-2V10Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconExplore = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a9 9 0 100 18 9 9 0 000-18Z"
        stroke="currentColor" strokeWidth="2"/>
      <path d="M9 15l6-3 3-6-6 3-3 6Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconChat = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M21 12c0 4.418-4.03 8-9 8-1.02 0-2.004-.148-2.93-.426L3 21l1.44-4.32C3.53 15.31 3 13.71 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconPen = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12.5 5.5l6 6L8 22H2v-6l10.5-10.5Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 4l6 6"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  const IconBell = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M15 17H5l2-3v-3a5 5 0 1110 0v3l2 3h-4Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 21a2 2 0 002 2"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
  /* --------------------------------------------------- */

  return (
    <div className="dash">
      {/* HEADER */}
      <header className="dash-header">
        <div className="dash-left">
          <img src={brandLogo} alt="Gamer Helpers" className="dash-logo" />
          <span className="dash-title">Gamer Helpers</span>
        </div>
        <div className="dash-center">
          <input className="dash-search" placeholder="Search" />
        </div>
        <div className="dash-right">
          <button className="dash-icon" onClick={()=> onOpenChat?.()}><IconChat /></button>
          <button className="dash-icon" onClick={()=> onNavigateHome?.()}><IconPen /></button>
          <button className="dash-icon"><IconBell /></button>
          <div className="dash-avatar">
            <img src={avatarHeader} alt="" className="avatar-img" />
          </div>
          <button className="dash-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dash-body">
        <aside className="dash-sidebar">
          <nav className="dash-nav">
            <a href="#" className="dash-nav-item" onClick={(e)=>{e.preventDefault(); onNavigateHome?.()}}>
              <IconHome /> Home
            </a>
            <a href="#" className="dash-nav-item" onClick={(e)=>{e.preventDefault(); onNavigateExplore?.()}}>
              <IconExplore /> Explore
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
          {/* PROFILE HEADER */}
          <div className="profile-head">
            <div
              className="profile-avatar"
              onClick={() => openLightbox([profile.avatar || userAvatar], 0)}
            >
              <img src={profile.avatar || userAvatar} alt="" className="avatar-img" />
            </div>
            <div className="profile-info">
              <div className="profile-name">{profile.name}</div>
              <div className="profile-handle">{profile.handle}</div>
            </div>
            <button className="profile-edit" onClick={()=> setIsEditOpen(true)}>
              Edit Profile
            </button>
          </div>

          <div className="profile-bio">{profile.bio}</div>

          <h3 className="exp-heading">Posts</h3>

          {/* SAMPLE POST */}
          <article className="post">
            <div className="post-header">
              <div className="post-avatar">
                <img src={profile.avatar || userAvatar} alt="" className="avatar-img" />
              </div>
              <div className="post-meta">
                <div className="post-author">Chester Bryan Torres</div>
                <div className="post-sub">has a coaching service for Genshin Impact</div>
              </div>
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
              {[tempImage, tempImage2].map((img, i) => (
                <div
                  key={i}
                  className="media ph"
                  onClick={() => openLightbox([tempImage, tempImage2], i)}
                >
                  <img src={img} alt="" />
                </div>
              ))}
            </div>

            <div className="post-actions">
              <button>❤️ 067</button>
              <button>💬</button>
              <button>↗</button>
            </div>
          </article>
        </main>

        {/* IMAGE OVERLAY */}
        <ImageOverlay
          open={lightboxOpen}
          images={lightboxImages}
          startIndex={lightboxIndex}
          title="Profile Image"
          onClose={closeLightbox}
        />

        {/* EDIT MODAL */}
        {isEditOpen && (
          <EditProfileModal
            initial={profile}
            onClose={()=> setIsEditOpen(false)}
            onSave={(p)=> {
              setProfile(p)
              setIsEditOpen(false)
              localStorage.setItem('profileSelf', JSON.stringify(p))
              window.dispatchEvent(new CustomEvent('profile-updated'))
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Profile

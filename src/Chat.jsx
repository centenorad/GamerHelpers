import './Dashboard.css'
import brandLogo from './assets/logo.png'
import userAvatar from './assets/chesterpogi.jpg'
import { useState, useEffect } from 'react'

function Chat({ onLogout, onNavigateHome, onNavigateExplore, selectedUser, onOpenProfile }) {
  const user = selectedUser || { name: 'Chester Bryan Torres' }
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
          <button className="dash-icon" aria-label="Messages"><IconChat /></button>
          <button className="dash-icon" aria-label="Compose"><IconPen /></button>
          <button className="dash-icon" aria-label="Alerts"><IconBell /></button>
          <div className="dash-avatar" role="button" onClick={() => onOpenProfile && onOpenProfile()}>
            <img src={avatarSrc} alt="profile" className="avatar-img" />
          </div>
          <button className="dash-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="dash-body chat-layout">
        <aside className="chat-list">
          <div className="chat-list-title">Chats</div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div className={`chat-list-item ${i === 0 ? 'is-active' : ''}`} key={i}>
              <div className="chat-avatar"><img src={avatarSrc} alt="" className="avatar-img" /></div>
              <div className="chat-name">{user.name}</div>
            </div>
          ))}
        </aside>

        <main className="chat-thread">
          <div className="chat-thread-head">
            <div className="chat-avatar"><img src={avatarSrc} alt="" className="avatar-img" /></div>
            <div className="chat-name">{user.name}</div>
          </div>

          <div className="chat-msg chat-right">Never gonna give you up</div>
          <div className="chat-msg chat-left">Never gonna let you down</div>
          <div className="chat-msg chat-right">Never gonna run around and desert you</div>
          <div className="chat-msg chat-right">Never gonna say goodbye</div>
          <div className="chat-msg chat-left">Never gonna tell a lie and hurt you</div>

          <div className="chat-input-wrap">
            <input className="chat-input" placeholder="Aa" />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Chat


import './Dashboard.css'
import brandLogo from './assets/logo.png'
import { GAMES } from './games'
import userAvatar from './assets/chesterpogi.jpg'
import { useState, useEffect } from 'react'
import avatarBading from './assets/maokai.jpg'
import avatarBengkong from './assets/daeny.jpg'
import avatarGandara from './assets/faker.jpg'
import avatarMrSuave from './assets/sonic.jpg'
import avatarStrongman from './assets/raz.jpg'

function Explore({ onLogout, onNavigateHome, onOpenGame, onOpenProfile, onOpenUser, onOpenChat, recentVisits = [] }) {
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

  const avatarList = [avatarBading, avatarBengkong, avatarGandara, avatarMrSuave, avatarStrongman]

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
          <div className="dash-avatar" role="button" onClick={() => onOpenProfile && onOpenProfile()}>
            <img src={avatarSrc} alt="profile" className="avatar-img" />
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
            <a className="dash-nav-item is-active" href="#">
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

        <main className="exp-main">
          <h2 className="exp-title">Explore today</h2>

          <section className="exp-section">
            <h3 className="exp-heading">Games</h3>
            <div className="exp-games">
              <div className="exp-game" role="button" onClick={()=>onOpenGame && onOpenGame('valorant')}>
                <img src={GAMES.valorant.logo} alt={GAMES.valorant.name} />
                <span>{GAMES.valorant.name}</span>
              </div>
              <div className="exp-game" role="button" onClick={()=>onOpenGame && onOpenGame('genshin')}>
                <img src={GAMES.genshin.logo} alt={GAMES.genshin.name} />
                <span>{GAMES.genshin.name}</span>
              </div>
              <div className="exp-game" role="button" onClick={()=>onOpenGame && onOpenGame('league')}>
                <img src={GAMES.league.logo} alt={GAMES.league.name} />
                <span>{GAMES.league.name}</span>
              </div>
              <div className="exp-game" role="button" onClick={()=>onOpenGame && onOpenGame('overwatch')}>
                <img src={GAMES.overwatch.logo} alt={GAMES.overwatch.name} />
                <span>{GAMES.overwatch.name}</span>
              </div>
            </div>
          </section>

          <section className="exp-section">
            <h3 className="exp-heading">Pilots</h3>
            <div className="exp-people">
              {Array.from({ length: 4 }).map((_, i) => {
                const src = avatarList[i % avatarList.length]
                return (
                  <div className="exp-person" key={`pilot-${i}`} role="button" onClick={() => onOpenUser && onOpenUser({ name: 'Chester Bryan Torres', handle: '@chester123' })}>
                    <div className="exp-avatar"><img src={src} alt="" className="avatar-img" /></div>
                    <span>Chester Bryan Torres</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="exp-section">
            <h3 className="exp-heading">Coaches</h3>
            <div className="exp-people">
              {Array.from({ length: 4 }).map((_, i) => {
                const src = avatarList[(i + 1) % avatarList.length]  // offset to alternate differently
                return (
                  <div className="exp-person" key={`coach-${i}`} role="button" onClick={() => onOpenUser && onOpenUser({ name: 'Chester Bryan Torres', handle: '@chester123' })}>
                    <div className="exp-avatar"><img src={src} alt="" className="avatar-img" /></div>
                    <span>Chester Bryan Torres</span>
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Explore



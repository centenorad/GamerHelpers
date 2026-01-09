import { useState } from 'react'
import './App.css'
import brandLogo from './assets/logo.png'
import clashLogo from './assets/clash.png'
import valorantLogo from './assets/valorant.png'
import genshinLogo from './assets/genshin.png'
import leagueLogo from './assets/league.png'
import royaleLogo from './assets/royale.png'
import { SignUp, Login } from './RegLogin.jsx'
import Dashboard from './Dashboard.jsx'
import Explore from './Explore.jsx'
import Game from './Game.jsx'
import { GAMES } from './games'
import Toast from './Toast.jsx'
import Profile from './Profile.jsx'
import Chat from './Chat.jsx'
import Lightbox from './Lightbox.jsx'

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [authedPage, setAuthedPage] = useState('home') // 'home' | 'explore' | 'game' | 'profile' | 'user'
  const [selectedGame, setSelectedGame] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [recentVisits, setRecentVisits] = useState(() => {
    try {
      const saved = localStorage.getItem('recentVisits')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [toastMsg, setToastMsg] = useState('')
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0, title: 'Post' })

  function showToast(message) {
    setToastMsg(message)
  }

  function updateRecentVisits(gameKey) {
    const allowed = Object.keys(GAMES)
    if (!allowed.includes(gameKey)) return
    const next = [gameKey, ...recentVisits.filter((k) => k !== gameKey)].slice(0, 4)
    setRecentVisits(next)
    try {
      localStorage.setItem('recentVisits', JSON.stringify(next))
    } catch {}
  }

  function openGame(gameKey) {
    updateRecentVisits(gameKey)
    setSelectedGame(gameKey)
    setAuthedPage('game')
  }

  function openLightbox(images, index = 0, title = 'Post') {
    setLightbox({ open: true, images, index, title })
  }
  function closeLightbox() {
    setLightbox((l) => ({ ...l, open: false }))
  }

  return (
    <div className="page">
      {!isAuthed && (
        <header className="navbar">
          <div className="brand">
            <img src={brandLogo} alt="Gamer Helpers logo" className="brand-logo" />
            <span className="brand-name">Gamer Helpers</span>
          </div>

          <button
            aria-label="Open menu"
            className="menu-button"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            ☰
          </button>

          <nav className={`nav ${isMobileMenuOpen ? 'is-open' : ''}`}>
            <a href="#" className="nav-link">
              Offers <span className="chev">▾</span>
            </a>
            <a href="#" className="nav-link">
              Services <span className="chev">▾</span>
            </a>
            <a href="#" className="nav-link">
              FAQ <span className="chev">▾</span>
            </a>
            <div className="actions mobile-only">
              <button className="btn btn-login" onClick={() => setIsLoginOpen(true)}>Login</button>
              <button className="btn btn-create" onClick={() => setIsSignUpOpen(true)}>
                Create Account
              </button>
            </div>
          </nav>

          <div className="actions desktop-only">
            <button className="btn btn-login" onClick={() => setIsLoginOpen(true)}>Login</button>
            <button className="btn btn-create" onClick={() => setIsSignUpOpen(true)}>
              Create Account
            </button>
          </div>
        </header>
      )}

      {isAuthed ? (
        authedPage === 'home' ? (
          <Dashboard
            onLogout={() => {
              setIsAuthed(false)
              setAuthedPage('home')
            }}
            onNavigateExplore={() => setAuthedPage('explore')}
            onOpenProfile={() => setAuthedPage('profile')}
            onOpenChat={() => setAuthedPage('chat')}
            onOpenGame={(k) => openGame(k)}
            recentVisits={recentVisits}
            openLightbox={openLightbox}
          />
        ) : authedPage === 'explore' ? (
          <Explore
            onLogout={() => {
              setIsAuthed(false)
              setAuthedPage('home')
            }}
            onNavigateHome={() => setAuthedPage('home')}
            onOpenGame={(key) => openGame(key)}
            onOpenUser={(u) => {
              setSelectedUser(u)
              setAuthedPage('user')
            }}
            onOpenProfile={() => setAuthedPage('profile')}
            onOpenChat={() => setAuthedPage('chat')}
            recentVisits={recentVisits}
          />
        ) : authedPage === 'game' ? (
          <Game
            gameKey={selectedGame || 'genshin'}
            onLogout={() => {
              setIsAuthed(false)
              setAuthedPage('home')
            }}
            onNavigateHome={() => setAuthedPage('home')}
            onNavigateExplore={() => setAuthedPage('explore')}
            onOpenProfile={() => setAuthedPage('profile')}
            onOpenChat={() => setAuthedPage('chat')}
            onOpenGame={(k) => openGame(k)}
            recentVisits={recentVisits}
            openLightbox={openLightbox}
          />
        ) : authedPage === 'profile' ? (
          <Profile
            onLogout={() => {
              setIsAuthed(false)
              setAuthedPage('home')
            }}
            onNavigateHome={() => setAuthedPage('home')}
            onNavigateExplore={() => setAuthedPage('explore')}
            recentVisits={recentVisits}
            openLightbox={openLightbox}
            variant="self"
          />
        ) : authedPage === 'user' ? (
          <Profile
            onLogout={() => {
              setIsAuthed(false)
              setAuthedPage('home')
            }}
            onNavigateHome={() => setAuthedPage('home')}
            onNavigateExplore={() => setAuthedPage('explore')}
            recentVisits={recentVisits}
            variant="other"
            user={selectedUser || { name: 'Chester Bryan Torres', handle: '@chester123' }}
            onOpenChat={(u) => {
              setSelectedUser(u)
              setAuthedPage('chat')
            }}
          />
        ) : authedPage === 'chat' ? (
          <Chat
            onLogout={() => {
              setIsAuthed(false)
              setAuthedPage('home')
            }}
            onNavigateHome={() => setAuthedPage('home')}
            onNavigateExplore={() => setAuthedPage('explore')}
            onOpenProfile={() => setAuthedPage('profile')}
            selectedUser={selectedUser}
          />
        ) : null
      ) : (
        <main className="hero">
          <h1 className="hero-title">
            Piloting Service for<br />Everyone
          </h1>
          <p className="hero-sub">
            Need some help? Come join us and be the better
            version of your future!
          </p>

          <div className="logos-scroller" aria-label="Featured games">
            <div className="logos-track">
              <img src={clashLogo} alt="Clash of Clans" className="game-logo" />
              <img src={valorantLogo} alt="Valorant" className="game-logo" />
              <img src={genshinLogo} alt="Genshin Impact" className="game-logo" />
              <img src={leagueLogo} alt="League of Legends" className="game-logo" />
              <img src={royaleLogo} alt="Clash Royale" className="game-logo" />
              {/* duplicate for seamless loop */}
              <img src={clashLogo} alt="" aria-hidden="true" className="game-logo" />
              <img src={valorantLogo} alt="" aria-hidden="true" className="game-logo" />
              <img src={genshinLogo} alt="" aria-hidden="true" className="game-logo" />
              <img src={leagueLogo} alt="" aria-hidden="true" className="game-logo" />
              <img src={royaleLogo} alt="" aria-hidden="true" className="game-logo" />
              {/* third copy to avoid gaps on wide screens */}
              <img src={clashLogo} alt="" aria-hidden="true" className="game-logo" />
              <img src={valorantLogo} alt="" aria-hidden="true" className="game-logo" />
              <img src={genshinLogo} alt="" aria-hidden="true" className="game-logo" />
              <img src={leagueLogo} alt="" aria-hidden="true" className="game-logo" />
              <img src={royaleLogo} alt="" aria-hidden="true" className="game-logo" />
            </div>
          </div>

          <div className="cta">
            <button className="btn btn-cta">
              Get Started <span className="arrow">→</span>
            </button>
          </div>
        </main>
      )}

      <SignUp
        open={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSuccess={() => showToast('Account created successfully')}
      />
      <Login
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={() => {
          setIsAuthed(true)
          showToast('Login successful')
        }}
        onOpenSignUp={() => {
          setIsLoginOpen(false)
          setIsSignUpOpen(true)
        }}
      />
      <Lightbox open={lightbox.open} images={lightbox.images} startIndex={lightbox.index} title={lightbox.title} onClose={closeLightbox} />
      {toastMsg ? <Toast message={toastMsg} onClose={() => setToastMsg('')} /> : null}
    </div>
  )
}

export default App

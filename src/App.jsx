import { useState } from 'react'
import './App.css'
import brandLogo from './assets/logo.png'
import clashLogo from './assets/clash.png'
import valorantLogo from './assets/valorant.png'
import genshinLogo from './assets/genshin.png'
import leagueLogo from './assets/league.png'
import royaleLogo from './assets/royale.png'
import { SignUp, Login } from './RegLogin.jsx'

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <div className="page">
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

      <SignUp open={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} />
      <Login
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenSignUp={() => {
          setIsLoginOpen(false)
          setIsSignUpOpen(true)
        }}
      />
    </div>
  )
}

export default App

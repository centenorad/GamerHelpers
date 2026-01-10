import { useEffect, useState } from 'react'
import './Admin.css'
import brandLogo from './assets/logo.png'

function loadAdminData() {
  try {
    const raw = localStorage.getItem('adminData')
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    users: [
      { id: 'u1', name: 'Chester Bryan Torres', handle: '@chester123', banned: false },
      { id: 'u2', name: 'Bengkong', handle: '@bengkong', banned: false },
      { id: 'u3', name: 'Gandara', handle: '@gandara', banned: false },
    ],
    posts: [
      { id: 'p1', author: 'Chester Bryan Torres', title: 'Never Gonna Give You Up' },
      { id: 'p2', author: 'Chester Bryan Torres', title: 'Title Here' },
    ],
    games: [
      { id: 'g1', name: 'Valorant' },
      { id: 'g2', name: 'Genshin Impact' },
      { id: 'g3', name: 'League of Legends' },
      { id: 'g4', name: 'Overwatch 2' },
    ],
  }
}

function Admin({ onBack, onLogoutAdmin }) {
  const [data, setData] = useState(loadAdminData())
  const [newGame, setNewGame] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [postFilter, setPostFilter] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('adminData', JSON.stringify(data))
    } catch {}
  }, [data])

  function banUser(id, banned) {
    setData((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === id ? { ...u, banned } : u)),
    }))
  }

  function deletePost(id) {
    setData((d) => ({ ...d, posts: d.posts.filter((p) => p.id !== id) }))
  }

  function addGame() {
    const name = newGame.trim()
    if (!name) return
    setData((d) => ({
      ...d,
      games: [{ id: 'g' + Math.random().toString(36).slice(2, 7), name }, ...d.games],
    }))
    setNewGame('')
  }

  function deleteGame(id) {
    setData((d) => ({ ...d, games: d.games.filter((g) => g.id !== id) }))
  }

  const filteredUsers = data.users.filter(
    (u) => u.name.toLowerCase().includes(userFilter.toLowerCase()) || u.handle.toLowerCase().includes(userFilter.toLowerCase()),
  )
  const filteredPosts = data.posts.filter(
    (p) => p.title.toLowerCase().includes(postFilter.toLowerCase()) || p.author.toLowerCase().includes(postFilter.toLowerCase()),
  )
  const filteredGames = data.games.filter((g) => g.name.toLowerCase().includes(gameFilter.toLowerCase()))

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-brand">
          <img src={brandLogo} alt="Gamer Helpers" />
          <span>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="admin-back" onClick={onBack}>← Back</button>
          <button className="admin-back" onClick={onLogoutAdmin}>Sign out</button>
        </div>
      </header>

      <main className="admin-main">
        <section className="admin-card">
          <div className="admin-card-head">
            <h3>Users</h3>
            <input className="admin-input" placeholder="Search users" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
          </div>
          <div className="admin-table">
            <div className="admin-row admin-row-head">
              <div>Name</div>
              <div>Handle</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            {filteredUsers.map((u) => (
              <div className="admin-row" key={u.id}>
                <div>{u.name}</div>
                <div>{u.handle}</div>
                <div>{u.banned ? 'BANNED' : 'OK'}</div>
                <div className="admin-actions">
                  {u.banned ? (
                    <button className="admin-btn" onClick={() => banUser(u.id, false)}>
                      Unban
                    </button>
                  ) : (
                    <button className="admin-btn danger" onClick={() => banUser(u.id, true)}>
                      Ban
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h3>Posts</h3>
            <input className="admin-input" placeholder="Search posts" value={postFilter} onChange={(e) => setPostFilter(e.target.value)} />
          </div>
          <div className="admin-table">
            <div className="admin-row admin-row-head">
              <div>Title</div>
              <div>Author</div>
              <div>Actions</div>
            </div>
            {filteredPosts.map((p) => (
              <div className="admin-row" key={p.id}>
                <div>{p.title}</div>
                <div>{p.author}</div>
                <div className="admin-actions">
                  <button className="admin-btn danger" onClick={() => deletePost(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h3>Games</h3>
            <input className="admin-input" placeholder="Search games" value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} />
          </div>
          <div className="admin-form">
            <input
              className="admin-input"
              placeholder="Add new game"
              value={newGame}
              onChange={(e) => setNewGame(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGame()}
            />
            <button className="admin-btn" onClick={addGame}>
              Add Game
            </button>
          </div>
          <div className="admin-table">
            <div className="admin-row admin-row-head">
              <div>Name</div>
              <div>Actions</div>
            </div>
            {filteredGames.map((g) => (
              <div className="admin-row" key={g.id}>
                <div>{g.name}</div>
                <div className="admin-actions">
                  <button className="admin-btn danger" onClick={() => deleteGame(g.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default Admin


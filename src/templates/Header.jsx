// React imports
import { useNavigate } from "react-router-dom";

// File imports
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="w-full bg-ghbackground shadow-md border-b border-b-ghforegroundlow px-8 py-3 flex items-center justify-between">
      {/* Logo/Brand */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-white tracking-tight">
          GamerHelpers
        </span>
      </div>

      {/* Search */}
      <nav className="flex-1 flex justify-center">
        <button
          onClick={() => navigate("/")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1 rounded shadow transition-colors"
        >
          Home
        </button>
        <button
          onClick={() => navigate("/chats")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1 rounded shadow transition-colors"
        >
          Chats
        </button>
      </nav>

      {/* User/Logout */}
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-ghforegroundlow text-sm">{user.email}</span>
        )}
        <button
          onClick={logout}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1 rounded shadow transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

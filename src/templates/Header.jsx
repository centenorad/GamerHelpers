// React imports
import { useNavigate } from "react-router-dom";
import { Home, MessageCircle, LogOut, PlusCircle } from "lucide-react";

// File imports
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="w-full bg-ghbackground-secondary shadow-lg border-b border-ghforegroundlow/20 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Logo/Brand */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => navigate("/")}
      >
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          GamerHelpers
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex justify-center gap-2">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-semibold hover:bg-ghaccent hover:text-white transition-all border border-transparent hover:border-ghaccent"
        >
          <Home size={20} /> Home
        </button>
        <button
          onClick={() => navigate("/chats")}
          className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-semibold hover:bg-ghaccent hover:text-white transition-all border border-transparent hover:border-ghaccent"
        >
          <MessageCircle size={20} /> Chats
        </button>
        <button
          onClick={() => navigate("/apply")}
          className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-semibold hover:bg-green-600 hover:text-white transition-all border border-transparent hover:border-green-400"
        >
          <PlusCircle size={20} /> Apply
        </button>
      </nav>

      {/* User Section */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex flex-col items-end">
            <span className="text-sm text-ghforegroundlow">{user.email}</span>
            <span className="text-xs text-ghforegroundlow/70">Active</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </header>
  );
}

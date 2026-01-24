// React imports
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  MessageCircle,
  LogOut,
  PlusCircle,
  Wallet,
  User,
  Shield,
} from "lucide-react";

// File imports
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const navButtonClass = (path) => `
    flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200
    ${
      isActive(path)
        ? "bg-ghaccent text-white shadow-lg shadow-ghaccent/30"
        : "text-ghforegroundlow hover:text-white hover:bg-ghforegroundlow/10"
    }
  `;

  return (
    <header className="w-full glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo/Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ghaccent to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-ghaccent/50 transition-shadow">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <span className="text-xl font-bold gradient-text hidden sm:block">
            GamerHelpers
          </span>
        </div>

        {/* Navigation */}
        {role !== "admin" && (
          <nav className="flex items-center gap-1">
            <button
              onClick={() => navigate("/")}
              className={navButtonClass("/")}
            >
              <Home size={18} />
              <span className="hidden md:inline">Home</span>
            </button>
            <button
              onClick={() => navigate("/chats")}
              className={navButtonClass("/chats")}
            >
              <MessageCircle size={18} />
              <span className="hidden md:inline">Chats</span>
            </button>
            <button
              onClick={() => navigate("/apply")}
              className={navButtonClass("/apply")}
            >
              <PlusCircle size={18} />
              <span className="hidden md:inline">Apply</span>
            </button>
          </nav>
        )}

        {role === "admin" && (
          <nav className="flex items-center gap-1">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/50 text-purple-300">
              <Shield size={18} />
              <span className="font-medium">Admin Panel</span>
            </div>
          </nav>
        )}

        {/* User Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationBell />

          {/* User Info */}
          {user && (
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-ghforegroundlow/5 border border-ghforegroundlow/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ghaccent to-purple-600 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white truncate max-w-32">
                  {user.full_name || user.email?.split("@")[0]}
                </span>
                <div className="flex items-center gap-2">
                  {user.wallet_balance !== undefined && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Wallet size={10} />$
                      {Number(user.wallet_balance || 0).toFixed(2)}
                    </span>
                  )}
                  {role === "employee" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-ghaccent/20 text-ghaccent">
                      Employee
                    </span>
                  )}
                  {role === "admin" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-300">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-ghforegroundlow hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

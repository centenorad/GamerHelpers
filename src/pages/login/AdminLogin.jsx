// React imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  Loader,
  ArrowLeft,
  AlertCircle,
  Clock,
} from "lucide-react";

// File imports
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSeconds]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockoutSeconds > 0) return;

    setIsLoading(true);
    setError("");
    setAttemptsRemaining(null);

    try {
      await adminLogin(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      // Check if the error contains lockout information
      if (err.locked) {
        setLockoutSeconds(err.remainingSeconds || 300);
        setError(err.message || "Account temporarily locked");
        setAttemptsRemaining(null);
      } else {
        setError(err.message || "Admin login failed. Please try again.");
        if (err.attemptsRemaining !== undefined) {
          setAttemptsRemaining(err.attemptsRemaining);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground flex items-center justify-center p-4">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center text-center pr-12">
        <ShieldAlert size={64} className="mb-6 text-purple-400" />
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Admin Portal
        </h1>
        <p className="text-xl text-ghforegroundlow mb-8 max-w-sm">
          Exclusive access to manage coaches, verify services, and monitor
          platform activity
        </p>
        <div className="space-y-4">
          {[
            { text: "Manage user accounts", icon: "👥" },
            { text: "Verify service providers", icon: "✅" },
            { text: "View analytics & reports", icon: "📊" },
          ].map((feature, idx) => (
            <p
              key={idx}
              className="text-ghforegroundlow flex items-center gap-3"
            >
              <span className="text-xl">{feature.icon}</span>
              {feature.text}
            </p>
          ))}
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center max-w-md w-full">
        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="bg-ghbackground-secondary rounded-2xl p-8 border border-ghforegroundlow/20 shadow-2xl"
          >
            <div className="text-center mb-8">
              <Lock size={48} className="mx-auto mb-4 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Admin Login</h2>
              <p className="text-ghforegroundlow text-sm mt-2">
                Secure admin access required
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className={`mb-6 p-4 ${isLocked ? "bg-orange-500/20 border-orange-500/50" : "bg-red-500/20 border-red-500/50"} border rounded-lg flex items-center gap-2 ${isLocked ? "text-orange-400" : "text-red-400"}`}
              >
                {isLocked ? <Clock size={20} /> : <AlertCircle size={20} />}
                <div className="flex-1">
                  <p>{error}</p>
                  {isLocked && (
                    <p className="text-sm mt-1 font-mono">
                      Try again in: {formatTime(lockoutSeconds)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Mail size={18} /> Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Lock size={18} /> Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-ghforegroundlow hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className={`w-full ${isLocked ? "bg-gray-600" : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"} text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg ${!isLocked && "hover:shadow-purple-500/50"} disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" /> Verifying...
                </>
              ) : isLocked ? (
                <>
                  <Clock size={20} /> Locked ({formatTime(lockoutSeconds)})
                </>
              ) : (
                "Access Admin Panel"
              )}
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ghforegroundlow/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-ghbackground-secondary text-ghforegroundlow">
                  or
                </span>
              </div>
            </div>

            {/* User Login Button */}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all border border-transparent hover:border-blue-400"
            >
              Regular User Login
            </button>

            {/* Back Link */}
            <p className="text-center text-ghforegroundlow text-sm mt-6">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-ghaccent hover:text-blue-400 font-semibold transition-colors flex items-center justify-center gap-2 w-full"
              >
                <ArrowLeft size={16} /> Back to home
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

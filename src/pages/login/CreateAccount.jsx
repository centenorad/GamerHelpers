// React imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Gamepad2,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";

// File imports
import { useAuth } from "../../context/AuthContext";

export default function CreateAccount() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // [PASSWORD POLICY] Password must be 8–12 characters
    if (formData.password.length < 8 || formData.password.length > 12) {
      setError("Password must be 8–12 characters long");
      return;
    }

    // [INPUT VALIDATION] Full name must not exceed 100 characters
    if (formData.fullName.trim().length > 100) {
      setError("Full name must not exceed 100 characters");
      return;
    }

    // [INPUT VALIDATION] Email must not exceed 100 characters
    if (formData.email.trim().length > 100) {
      setError("Email must not exceed 100 characters");
      return;
    }

    if (!formData.terms) {
      setError("Please accept the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.fullName);
      setSuccess(true);
      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground flex items-center justify-center p-4">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center text-center pr-12">
        <Gamepad2 size={64} className="mb-6 text-blue-400" />
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          GamerHelpers
        </h1>
        <p className="text-xl text-ghforegroundlow mb-8 max-w-sm">
          Join our community of expert gaming coaches
        </p>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex-1 flex items-center justify-center max-w-md w-full">
        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="bg-ghbackground-secondary rounded-2xl p-8 border border-ghforegroundlow/20 shadow-2xl"
          >
            <h2 className="text-3xl font-bold mb-2 text-white text-center">
              Create Account
            </h2>
            <p className="text-ghforegroundlow text-center mb-8">
              Join GamerHelpers today
            </p>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-400">
                <CheckCircle size={20} />
                Account created! Redirecting...
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <User size={18} /> Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Mail size={18} /> Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Lock size={18} /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
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

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Lock size={18} /> Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3 text-ghforegroundlow hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-6">
              <label className="flex items-start gap-3 text-sm text-ghforegroundlow hover:text-white transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-ghforegroundlow/30 focus:ring-2 focus:ring-ghaccent"
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="text-ghaccent hover:text-blue-400">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-ghaccent hover:text-blue-400">
                    Privacy Policy
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="animate-spin" /> Creating
                  Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Sign In Link */}
            <p className="text-center text-ghforegroundlow text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-ghaccent hover:text-blue-400 font-semibold transition-colors"
              >
                Sign in here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

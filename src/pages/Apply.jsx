// React imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";

// File imports
import Header from "../templates/Header";
import { ApplicationsAPI, GamesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Apply() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [formData, setFormData] = useState({
    game_id: "",
    title: "",
    description: "",
    price: "",
    service_details: [],
    termsAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loadingGames, setLoadingGames] = useState(true);

  // Fetch games on mount
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await GamesAPI.getAllGames();
        setGames(res.games || []);
      } catch (err) {
        console.error("Failed to fetch games:", err);
      } finally {
        setLoadingGames(false);
      }
    };
    fetchGames();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.termsAccepted) {
      setSubmitStatus({
        type: "error",
        message: "Please accept the terms and conditions",
      });
      return;
    }

    if (
      !formData.game_id ||
      !formData.title ||
      !formData.description ||
      !formData.price
    ) {
      setSubmitStatus({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await ApplicationsAPI.submitApplication({
        game_id: parseInt(formData.game_id),
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
      });

      setSubmitStatus({
        type: "success",
        message: "Application submitted! Admin will review it soon.",
      });

      // Reset form
      setFormData({
        game_id: "",
        title: "",
        description: "",
        price: "",
        service_details: [],
        termsAccepted: false,
      });

      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          error.message || "Failed to submit application. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto animate-slideInDown">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Become an Employee
            </h1>
            <p className="text-ghforegroundlow text-lg">
              Apply to become a pilot or coach and start offering your services
            </p>
          </div>

          {/* Status Messages */}
          {submitStatus && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                submitStatus.type === "success"
                  ? "bg-green-900/20 border border-green-500/50 text-green-200"
                  : "bg-red-900/20 border border-red-500/50 text-red-200"
              }`}
            >
              {submitStatus.type === "success" ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              {submitStatus.message}
            </div>
          )}

          {/* Application Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-8 space-y-6"
          >
            {/* Service Title */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Service Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Valorant Radiant Coaching"
                className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/20 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Game Selection */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Main Game
              </label>
              {loadingGames ? (
                <div className="flex items-center gap-2 text-ghforegroundlow">
                  <Loader size={16} className="animate-spin" />
                  Loading games...
                </div>
              ) : (
                <select
                  name="game_id"
                  value={formData.game_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/20 text-white focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select a game</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Service Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your coaching service, what you offer, and your expertise..."
                rows="5"
                className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/20 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Price per session ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., 25"
                min="1"
                className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/20 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Terms and Conditions */}
            <div className="bg-ghbackground rounded-lg p-4 max-h-48 overflow-y-auto mb-4">
              <p className="text-sm text-ghforegroundlow">
                <strong className="text-white">Terms & Conditions:</strong>
                <br />
                By applying to become a pilot or coach, you agree to:
                <br />
                • Provide quality coaching services as described
                <br />
                • Respond to service requests within 24 hours
                <br />
                • Maintain professional conduct at all times
                <br />
                • Not share or request personal contact information outside the
                platform
                <br />
                • Allow platform admins to review chats and service quality
                <br />• Platform takes a 10% commission on each service
              </p>
            </div>

            {/* Accept Terms Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="w-5 h-5 rounded border-ghforegroundlow/30 text-ghaccent focus:ring-2 focus:ring-ghaccent"
              />
              <span className="text-white font-semibold">
                I agree to the Terms and Conditions
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.termsAccepted}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader size={20} className="animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full px-4 py-3 border-2 border-ghforegroundlow/20 text-white font-semibold rounded-lg hover:border-ghaccent/50 transition-all"
            >
              Cancel
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

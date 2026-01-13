// React imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle, AlertCircle, Loader } from "lucide-react";

// File imports
import Header from "../templates/Header";

export default function Apply() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    game: "",
    images: [],
    termsAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      images: [...formData.images, ...files],
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

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitStatus({
        type: "success",
        message: "Application submitted! Admin will review it soon.",
      });
      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        game: "",
        images: [],
        termsAccepted: false,
      });
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Failed to submit application. Please try again.",
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
              Apply to become a coach and start offering your services
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
              <select
                name="game"
                value={formData.game}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg bg-ghbackground border border-ghforegroundlow/20 text-white focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                required
              >
                <option value="">Select a game</option>
                <option value="valorant">Valorant</option>
                <option value="lol">League of Legends</option>
                <option value="apex">Apex Legends</option>
                <option value="cs2">Counter-Strike 2</option>
                <option value="other">Other</option>
              </select>
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

            {/* Images Upload */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Upload Images
              </label>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-ghforegroundlow/30 rounded-lg hover:border-ghaccent/50 transition-colors cursor-pointer">
                <div className="text-center">
                  <Upload
                    size={32}
                    className="mx-auto mb-2 text-ghforegroundlow"
                  />
                  <p className="text-ghforegroundlow">Click to upload images</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {formData.images.length > 0 && (
                <div className="mt-3 text-sm text-ghforegroundlow">
                  {formData.images.length} image(s) selected
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="bg-ghbackground rounded-lg p-4 max-h-48 overflow-y-auto mb-4">
              <p className="text-sm text-ghforegroundlow">
                <strong className="text-white">Terms & Conditions:</strong>
                <br />
                By applying to become a coach, you agree to:
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

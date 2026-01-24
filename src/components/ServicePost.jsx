import { getTagColors } from "../constants/tagColors";
import { CheckCircle, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { RequestsAPI, ServicesAPI } from "../services/api";

export default function ServicePost({
  post,
  onServiceCancel,
  userRequests = [],
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [hasRequested, setHasRequested] = useState(false);
  const [requestId, setRequestId] = useState(null);

  // Check if user has already requested this service
  useEffect(() => {
    if (userRequests && Array.isArray(userRequests)) {
      const existingRequest = userRequests.find(
        (req) =>
          req.published_service_id === post.id && req.status === "pending"
      );
      if (existingRequest) {
        setHasRequested(true);
        setRequestId(existingRequest.id);
      }
    }
  }, [userRequests, post.id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const handleAskService = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Create service request
      await RequestsAPI.createRequest({
        published_service_id: post.id,
        service_details: `Requesting ${post.title} service for ${post.game_name}`,
      });

      setSubmitted(true);
      // Show notification for 3 seconds then reset
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to submit service request:", err);
      setError("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelService = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Cancel the service request
      if (requestId) {
        await RequestsAPI.cancelRequest(requestId);
        setHasRequested(false);
        setRequestId(null);

        if (onServiceCancel) {
          await onServiceCancel(post.id);
        }
      }
    } catch (err) {
      console.error("Failed to cancel service request:", err);
      setError("Failed to cancel request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-slideInUp">
      <div className="bg-ghbackground-secondary rounded-xl overflow-hidden border border-ghforegroundlow/20 hover:border-ghaccent/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all group">
        <div className="flex flex-col md:flex-row h-full">
          {/* Coach Profile Section */}
          <div className="md:w-56 bg-gradient-to-br from-ghbackground to-ghbackground-secondary p-6 flex flex-col items-center md:items-start justify-center border-b md:border-b-0 md:border-r border-ghforegroundlow/20">
            <img
              src={
                post.profile_picture ||
                "https://randomuser.me/api/portraits/lego/1.jpg"
              }
              alt={`${post.full_name} profile picture`}
              className="w-32 h-32 rounded-full object-cover border-4 border-ghaccent mb-4 shadow-lg hover:shadow-xl transition-shadow"
            />
            <h3 className="font-bold text-xl text-white text-center md:text-left">
              {post.full_name}
            </h3>
            <div className="mt-2 text-center md:text-left">
              <p className="text-sm text-ghforegroundlow">
                ⭐ {post.rating ? Number(post.rating).toFixed(1) : "N/A"} (
                {post.total_reviews || 0} reviews)
              </p>
            </div>
            <div className="mt-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-ghaccent/20 border border-ghaccent/50 rounded-full text-ghaccent text-xs font-semibold">
                <CheckCircle size={14} /> Verified Coach
              </div>
            </div>
          </div>

          {/* Service Details Section */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-ghaccent transition-colors">
                {post.title}
              </h2>

              {/* Game Tag */}
              {post.game_name && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/30">
                    🎮 {post.game_name}
                  </span>
                </div>
              )}

              <p className="text-ghforegroundlow text-base leading-relaxed">
                {post.description}
              </p>
            </div>

            {/* Footer with Price and CTA */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-ghforegroundlow/20">
              <div className="flex flex-col">
                <span className="text-sm text-ghforegroundlow">
                  Starting at
                </span>
                <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  {formatPrice(post.price)}
                </span>
              </div>
              <div className="flex gap-3">
                {!hasRequested ? (
                  <button
                    onClick={handleAskService}
                    disabled={submitting || submitted}
                    aria-label={`Ask service from ${post.full_name} about ${post.title}`}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-400 disabled:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-105 disabled:scale-100"
                  >
                    <MessageCircle size={20} />{" "}
                    {submitted
                      ? "Submitted ✓"
                      : submitting
                        ? "Submitting..."
                        : "Ask Service"}
                  </button>
                ) : (
                  <button
                    onClick={handleCancelService}
                    disabled={submitting}
                    aria-label={`Cancel service ${post.title}`}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-500 disabled:to-red-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-red-500/50 hover:scale-105 disabled:scale-100"
                  >
                    <X size={20} /> {submitting ? "Cancelling..." : "Cancel"}
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

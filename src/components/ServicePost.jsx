import { getTagColors } from "../constants/tagColors";
import { CheckCircle, MessageCircle } from "lucide-react";

export default function ServicePost({ post }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-slideInUp">
      <div className="bg-ghbackground-secondary rounded-xl overflow-hidden border border-ghforegroundlow/20 hover:border-ghaccent/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all group">
        <div className="flex flex-col md:flex-row h-full">
          {/* Coach Profile Section */}
          <div className="md:w-56 bg-gradient-to-br from-ghbackground to-ghbackground-secondary p-6 flex flex-col items-center md:items-start justify-center border-b md:border-b-0 md:border-r border-ghforegroundlow/20">
            <img
              src={post.face}
              alt={`${post.name} profile picture`}
              className="w-32 h-32 rounded-full object-cover border-4 border-ghaccent mb-4 shadow-lg hover:shadow-xl transition-shadow"
            />
            <h3 className="font-bold text-xl text-white text-center md:text-left">
              {post.name}
            </h3>
            <div className="mt-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-ghaccent/20 border border-ghaccent/50 rounded-full text-ghaccent text-xs font-semibold">
                <CheckCircle size={14} /> Verified Coach
              </div>
            </div>
          </div>

          {/* Service Images Section */}
          <div className="md:w-64 flex items-center justify-center gap-3 p-6 overflow-x-auto">
            {post.images.map((img, i) => (
              <img
                key={`${post.id}-image-${i}`}
                src={img}
                alt={`${post.title} example ${i + 1}`}
                className="w-40 h-28 object-cover rounded-lg border border-ghforegroundlow/30 hover:border-ghaccent/50 transition-all hover:scale-105"
              />
            ))}
          </div>

          {/* Details Section */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-ghaccent transition-colors">
                {post.title}
              </h2>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => {
                    const colors = getTagColors(tag);
                    return (
                      <span
                        key={tag}
                        className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-xs font-semibold border border-current/30`}
                      >
                        {tag}
                      </span>
                    );
                  })}
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
              <button
                aria-label={`Chat with ${post.name} about ${post.title}`}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-blue-500/50 hover:scale-105"
              >
                <MessageCircle size={20} /> Chat Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

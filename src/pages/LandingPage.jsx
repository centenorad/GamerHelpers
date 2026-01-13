// React imports
import { useNavigate } from "react-router-dom";
import {
  Gamepad2,
  TrendingUp,
  MessageSquare,
  Trophy,
  Star,
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Gamepad2,
      title: "Expert Coaching",
      description:
        "Learn from professional gamers and Radiant/Challenger ranked players",
    },
    {
      icon: TrendingUp,
      title: "Performance Boost",
      description: "VOD reviews, live sessions, and personalized strategies",
    },
    {
      icon: MessageSquare,
      title: "Direct Chat",
      description: "Real-time communication with coaches and service providers",
    },
    {
      icon: Trophy,
      title: "Verified Pros",
      description:
        "All coaches are verified professionals in their respective games",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground">
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-ghforegroundlow/20">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          GamerHelpers
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 rounded-lg text-white hover:text-ghaccent transition-colors font-semibold"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/admin-login")}
            className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all"
          >
            Admin Access
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-8 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-slideInDown">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Unlock Your Gaming Potential
          </h2>
          <p className="text-xl text-ghforegroundlow mb-8 max-w-2xl mx-auto">
            Connect with professional esports coaches and service providers. Get
            the guidance you need to reach your gaming goals.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            Get Started
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { number: "500+", label: "Expert Coaches" },
            { number: "10K+", label: "Happy Gamers" },
            { number: "4.8", label: "Average Rating", icon: Star },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-ghbackground-secondary rounded-lg p-6 border border-ghforegroundlow/20 text-center hover:border-ghaccent/50 transition-all"
            >
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                {stat.number}
                {stat.icon && (
                  <span className="inline-block ml-2">
                    <stat.icon size={32} className="text-yellow-400" />
                  </span>
                )}
              </p>
              <p className="text-ghforegroundlow">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <h3 className="text-3xl font-bold text-center mb-12">
          Why Choose GamerHelpers?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={idx}
                className="bg-ghbackground-secondary rounded-lg p-6 border border-ghforegroundlow/20 hover:border-ghaccent/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
              >
                <IconComponent
                  size={40}
                  className="mb-4 text-ghaccent group-hover:scale-110 transition-transform"
                />
                <h4 className="text-lg font-bold mb-2 text-white">
                  {feature.title}
                </h4>
                <p className="text-ghforegroundlow text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-ghbackground-secondary to-ghbackground border border-ghforegroundlow/20 rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Level Up?</h3>
          <p className="text-ghforegroundlow mb-8 max-w-xl mx-auto">
            Join thousands of gamers who have improved their skills with our
            expert coaches.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
          >
            Start Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ghforegroundlow/20 px-8 py-8 text-center text-ghforegroundlow text-sm mt-20">
        <p>© 2026 GamerHelpers. All rights reserved.</p>
      </footer>
    </div>
  );
}

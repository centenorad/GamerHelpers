// File imports
import { useState } from "react";
import Header from "../templates/Header";
import ServicePost from "../components/ServicePost";
import { POSTS } from "../constants/posts";
import { Gamepad2, Filter } from "lucide-react";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Games", icon: "🎮" },
    { id: "valorant", label: "Valorant", icon: "🔴" },
    { id: "lol", label: "League of Legends", icon: "🔵" },
    { id: "apex", label: "Apex Legends", icon: "🟡" },
    { id: "coaching", label: "Coaching", icon: "📚" },
    { id: "piloting", label: "Piloting", icon: "✈️" },
  ];

  const filteredPosts =
    selectedCategory === "all"
      ? POSTS
      : POSTS.filter((post) =>
          post.tags?.some((tag) =>
            tag.toLowerCase().includes(selectedCategory.toLowerCase())
          )
        );

  return (
    <>
      <Header />
      <main className="bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground min-h-screen py-12 px-4">
        {/* Page Header */}
        <div className="max-w-6xl mx-auto mb-12 text-center animate-slideInDown">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Gamepad2 size={40} /> Browse Services
          </h1>
          <p className="text-ghforegroundlow text-lg max-w-2xl mx-auto">
            Find expert coaching and services from verified professionals across
            your favorite games
          </p>
        </div>

        {/* Category Filter */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-ghaccent" />
            <span className="text-white font-semibold">
              Filter by Category:
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all border ${
                  selectedCategory === category.id
                    ? "bg-ghaccent text-white border-ghaccent shadow-lg shadow-blue-500/50"
                    : "bg-ghbackground-secondary text-white border-ghforegroundlow/20 hover:border-ghaccent/50"
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="max-w-6xl mx-auto">
          {filteredPosts.length > 0 ? (
            <div className="space-y-6">
              {filteredPosts.map((post, idx) => (
                <div key={post.id} style={{ animationDelay: `${idx * 0.1}s` }}>
                  <ServicePost post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-2xl text-ghforegroundlow mb-4">
                No services available in this category
              </p>
              <p className="text-ghforegroundlow">
                Try selecting a different category or check back soon!
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

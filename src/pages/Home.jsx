// File imports
import Header from "../templates/Header";

const posts = [
  {
    id: 1,
    name: "Alex Pro",
    face: "https://randomuser.me/api/portraits/men/32.jpg",
    images: [
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=facearea&w=400&h=200&q=80",
      "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    ],
    title: "Valorant Radiant Coaching",
    description:
      "Get coached by a Radiant player. VOD review, live games, and more!",
    price: 25,
    tags: ["Valorant", "Coaching"],
  },
  {
    id: 2,
    name: "Coach Lisa",
    face: "https://randomuser.me/api/portraits/women/44.jpg",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    ],
    title: "League of Legends Jungle Coaching",
    description: "Master jungle pathing and macro with a Challenger coach.",
    price: 30,
    tags: ["League of Legends", "Coaching"],
  },
  {
    id: 3,
    name: "Pilot Sam",
    face: "https://randomuser.me/api/portraits/men/65.jpg",
    images: [
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80",
    ],
    title: "Apex Legends Pilot Service",
    description: "Let a top 100 Apex player pilot your account to Predator!",
    price: 50,
    tags: ["Apex Legends", "Piloting"],
  },
];

function ServicePost({ post }) {
  return (
    <div className=" rounded-lg shadow-md p-6 border border-ghforegroundlow flex flex-col md:flex-row gap-8 mb-10 max-w-4xl w-full mx-auto min-h-55">
      {/* Face and name */}
      <div className="flex flex-col items-center md:items-start min-w-40">
        <img
          src={post.face}
          alt={post.name}
          className="w-28 h-28 rounded-full object-cover border-2 border-blue-400 mb-3"
        />
        <span className="font-semibold text-xl text-white text-center md:text-left">
          {post.name}
        </span>
      </div>
      {/* Service images */}
      <div className="flex gap-4 items-center justify-center md:justify-start">
        {post.images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="service"
            className="w-44 h-32 object-cover rounded-md border border-gray-200"
          />
        ))}
      </div>
      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-60">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">{post.title}</h3>
          {/* Tags/Flairs */}
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags &&
              post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className={
                    tag === "Valorant"
                      ? "bg-red-800 text-red-200 px-2 py-0.5 rounded text-xs font-semibold"
                      : tag === "League of Legends"
                      ? "bg-green-800 text-green-200 px-2 py-0.5 rounded text-xs font-semibold"
                      : tag === "Apex Legends"
                      ? "bg-yellow-800 text-yellow-200 px-2 py-0.5 rounded text-xs font-semibold"
                      : tag === "Coaching"
                      ? "bg-blue-800 text-blue-200 px-2 py-0.5 rounded text-xs font-semibold"
                      : tag === "Piloting"
                      ? "bg-purple-800 text-purple-200 px-2 py-0.5 rounded text-xs font-semibold"
                      : "bg-gray-800 text-gray-200 px-2 py-0.5 rounded text-xs font-semibold"
                  }
                >
                  {tag}
                </span>
              ))}
          </div>
          <p className="text-ghforegroundlow mb-3 text-lg">
            {post.description}
          </p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-2xl font-bold text-green-400">
            ${post.price}
          </span>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-2 rounded shadow transition-colors text-lg font-semibold">
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="bg-ghbackground min-h-screen py-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-white">
          Browse services
        </h2>
        <div className="flex flex-col gap-6 items-center">
          {posts.map((post) => (
            <ServicePost key={post.id} post={post} />
          ))}
        </div>
      </main>
    </>
  );
}

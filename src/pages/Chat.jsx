// React imports
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Plus, Info, MoreVertical } from "lucide-react";

// File imports
import Header from "../templates/Header";

const initialChats = [
  {
    id: 1,
    name: "Chester Bryan Torres",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    messages: [
      { fromMe: false, text: "Never gonna let you down" },
      { fromMe: true, text: "Never gonna give you up" },
      { fromMe: false, text: "Never gonna make you cry" },
      { fromMe: true, text: "Never gonna run around and desert you" },
      { fromMe: false, text: "Never gonna tell a lie and hurt you" },
      { fromMe: true, text: "Never gonna say goodbye" },
    ],
  },
  {
    id: 2,
    name: "Alex Pro",
    avatar: "https://randomuser.me/api/portraits/men/31.jpg",
    messages: [
      { fromMe: false, text: "Hi, do you want coaching?" },
      { fromMe: true, text: "Yes, please!" },
    ],
  },
  {
    id: 3,
    name: "Coach Lisa",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    messages: [
      { fromMe: false, text: "Hello!" },
      { fromMe: true, text: "Hi Coach!" },
    ],
  },
];

export default function Chat() {
  const [chats, setChats] = useState(initialChats);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats, selectedIdx]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setChats((prev) => {
      const updated = [...prev];
      updated[selectedIdx] = {
        ...updated[selectedIdx],
        messages: [
          ...updated[selectedIdx].messages,
          { fromMe: true, text: input },
        ],
      };
      return updated;
    });
    setInput("");
  };

  const selectedChat = chats[selectedIdx];

  return (
    <div className="bg-ghbackground min-h-screen w-full">
      <Header />
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-72 bg-ghbackground-secondary border-r border-ghforegroundlow/20 flex flex-col">
          <div className="p-6 border-b border-ghforegroundlow/20">
            <h2 className="text-white text-2xl font-bold flex items-center gap-2">
              <MessageCircle size={24} /> Messages
            </h2>
            <p className="text-ghforegroundlow text-sm mt-1">
              {chats.length} conversations
            </p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {chats.map((chat, idx) => (
              <div
                key={chat.id}
                onClick={() => setSelectedIdx(idx)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${
                  idx === selectedIdx
                    ? "bg-ghaccent/20 border border-ghaccent/50 shadow-lg shadow-blue-500/20"
                    : "hover:bg-ghforegroundlow/10 border border-transparent"
                }`}
              >
                <div className="relative">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-ghaccent/50"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-ghbackground-secondary"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate text-sm">
                    {chat.name}
                  </p>
                  <p className="text-ghforegroundlow text-xs truncate">
                    {chat.messages[chat.messages.length - 1]?.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <section className="flex-1 flex flex-col bg-gradient-to-br from-ghbackground to-ghbackground-secondary">
          {/* Chat header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-ghforegroundlow/20 bg-ghbackground-secondary">
            <div className="flex items-center gap-4">
              <img
                src={selectedChat.avatar}
                alt={selectedChat.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-ghaccent"
              />
              <div>
                <h3 className="text-white font-bold text-lg">
                  {selectedChat.name}
                </h3>
                <p className="text-ghforegroundlow text-sm">Active now</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="p-2 hover:bg-ghforegroundlow/10 rounded-lg transition-all">
                <Info size={20} />
              </button>
              <button className="p-2 hover:bg-ghforegroundlow/10 rounded-lg transition-all">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
            {selectedChat.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.fromMe ? "justify-end" : "justify-start"
                } animate-slideInUp`}
              >
                <div
                  className={`px-5 py-3 rounded-2xl max-w-[60%] break-words ${
                    msg.fromMe
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg shadow-blue-500/30"
                      : "bg-ghbackground-secondary border border-ghforegroundlow/20 text-gray-100 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            className="px-8 py-6 border-t border-ghforegroundlow/20 bg-ghbackground-secondary"
            onSubmit={handleSend}
          >
            <div className="flex gap-3 items-end">
              <button
                type="button"
                className="p-2 hover:bg-ghforegroundlow/10 rounded-lg transition-all"
              >
                <Plus size={24} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full bg-ghbackground border border-ghforegroundlow/20 rounded-full px-5 py-3 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50"
                disabled={!input.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

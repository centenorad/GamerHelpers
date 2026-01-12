// React imports
import { useState, useRef, useEffect } from "react";

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
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-72 bg-ghbackground border-r border-r-ghforegroundlow flex flex-col">
          <h2 className="text-white text-2xl font-bold mx-4 mt-2 px-2 py-4 border-b border-ghforegroundlow">
            Chats
          </h2>
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat, idx) => (
              <div
                key={chat.id}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer ${
                  idx === selectedIdx
                    ? "bg-[#22313c] rounded-md"
                    : "hover:bg-[#232b32]"
                }`}
                onClick={() => setSelectedIdx(idx)}
              >
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-white font-medium truncate">
                  {chat.name}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <section className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-3 mx-4 px-4 py-4 border-b border-ghforegroundlow">
            <img
              src={selectedChat.avatar}
              alt={selectedChat.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="text-white font-semibold text-lg">
              {selectedChat.name}
            </span>
          </div>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
            {selectedChat.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.fromMe ? "justify-end" : "justify-start"
                }`}
              >
                <span
                  className={`px-4 py-2 rounded-lg text-sm max-w-[60%] wrap-break-words ${
                    msg.fromMe
                      ? "bg-[#2563eb] text-white"
                      : "bg-[#3a4044] text-gray-100"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <form
            className="px-8 py-4 border-t border-ghforegroundlow"
            onSubmit={handleSend}
          >
            <input
              type="text"
              placeholder="Aa"
              className="w-full bg-transparent border border-ghforegroundlow rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
            />
          </form>
        </section>
      </div>
    </div>
  );
}

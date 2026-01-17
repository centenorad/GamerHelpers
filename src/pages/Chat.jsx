// React imports
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Plus,
  Info,
  MoreVertical,
  Loader,
  AlertCircle,
} from "lucide-react";

// File imports
import Header from "../templates/Header";
import { ChatAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await ChatAPI.listChats();
        setChats(res.chats || []);
      } catch (err) {
        console.error("Failed to fetch chats:", err);
        setError("Failed to load chats");
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Fetch messages when selected chat changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (chats.length === 0 || selectedIdx >= chats.length) return;

      try {
        const res = await ChatAPI.getMessages(chats[selectedIdx].id);
        setMessages(res.messages || []);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [selectedIdx, chats]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedIdx]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || chats.length === 0) return;

    try {
      await ChatAPI.sendMessage(chats[selectedIdx].id, input);
      setInput("");

      // Refresh messages
      const res = await ChatAPI.getMessages(chats[selectedIdx].id);
      setMessages(res.messages || []);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
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
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-ghforegroundlow py-4">
                <Loader size={20} className="animate-spin" />
                Loading...
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                {error}
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-8 text-ghforegroundlow">
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              chats.map((chat, idx) => (
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
                      src={
                        chat.avatar ||
                        "https://randomuser.me/api/portraits/lego/1.jpg"
                      }
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-ghaccent/50"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-ghbackground-secondary"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate text-sm">
                      {chat.employee_name || chat.requester_name}
                    </p>
                    <p className="text-ghforegroundlow text-xs truncate">
                      {chat.last_message || chat.service_title}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Chat area */}
        <section className="flex-1 flex flex-col bg-gradient-to-br from-ghbackground to-ghbackground-secondary">
          {chats.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle
                  size={48}
                  className="mx-auto mb-4 text-ghforegroundlow"
                />
                <p className="text-ghforegroundlow">
                  No conversations to display
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-ghforegroundlow/20 bg-ghbackground-secondary">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedChat?.avatar ||
                      "https://randomuser.me/api/portraits/lego/1.jpg"
                    }
                    alt={selectedChat?.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-ghaccent"
                  />
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {selectedChat?.employee_name ||
                        selectedChat?.requester_name}
                    </h3>
                    <p className="text-ghforegroundlow text-sm">
                      {selectedChat?.service_title}
                    </p>
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
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-ghforegroundlow">
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.sender_user_id === user?.id
                          ? "justify-end"
                          : "justify-start"
                      } animate-slideInUp`}
                    >
                      <div
                        className={`px-5 py-3 rounded-2xl max-w-[60%] break-words ${
                          msg.sender_user_id === user?.id
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg shadow-blue-500/30"
                            : "bg-ghbackground-secondary border border-ghforegroundlow/20 text-gray-100 rounded-bl-none"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))
                )}
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
            </>
          )}
        </section>
      </div>
    </div>
  );
}

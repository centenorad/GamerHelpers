// React imports
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Info,
  Loader,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  XCircle,
  Archive,
  Gamepad2,
  DollarSign,
  X,
} from "lucide-react";

// File imports
import Header from "../templates/Header";
import { ChatAPI, RequestsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Status timeline component
const ServiceTimeline = ({ request, isEmployee, onComplete }) => {
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleComplete = async () => {
    setProcessing(true);
    try {
      await onComplete(request.id, completionNotes);
      setShowCompleteForm(false);
    } finally {
      setProcessing(false);
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      {
        id: "requested",
        label: "Requested",
        icon: MessageCircle,
        completed: true,
        date: request?.created_at,
      },
      {
        id: "accepted",
        label: "Employee Accepted",
        icon: CheckCircle,
        completed: [
          "employee_accepted",
          "in_progress",
          "pending_completion",
          "completed",
          "closed",
        ].includes(request?.status),
        date: request?.accepted_at,
      },
      {
        id: "started",
        label: "Service Started",
        icon: Play,
        completed: [
          "in_progress",
          "pending_completion",
          "completed",
          "closed",
        ].includes(request?.status),
        active: request?.status === "in_progress",
        date: request?.started_at,
      },
      {
        id: "completed",
        label: "Marked Complete",
        icon: CheckCircle,
        completed: ["pending_completion", "completed", "closed"].includes(
          request?.status,
        ),
        date: request?.completed_at,
      },
      {
        id: "closed",
        label: "Service Closed",
        icon: Archive,
        completed: request?.status === "closed",
        date: request?.closed_at,
      },
    ];
    return steps;
  };

  const steps = getTimelineSteps();

  if (request?.status === "cancelled") {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="flex items-center gap-3 text-red-400">
          <XCircle size={20} />
          <span className="font-medium">
            This service request was cancelled
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.active;
          const isCompleted = step.completed;

          return (
            <div key={step.id} className="flex items-start gap-4 pb-4">
              {/* Line */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-[17px] top-10 w-0.5 h-6 ${
                    isCompleted ? "bg-green-500" : "bg-ghforegroundlow/30"
                  }`}
                  style={{ top: `${idx * 40 + 28}px` }}
                />
              )}

              {/* Dot */}
              <div
                className={`
                w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                ${
                  isCompleted
                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                    : isActive
                      ? "bg-ghaccent/20 text-ghaccent border border-ghaccent/50 animate-pulse"
                      : "bg-ghforegroundlow/10 text-ghforegroundlow border border-ghforegroundlow/30"
                }
              `}
              >
                <Icon size={16} />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1.5">
                <p
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-green-400"
                      : isActive
                        ? "text-ghaccent"
                        : "text-ghforegroundlow"
                  }`}
                >
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-xs text-ghforegroundlow/60 mt-0.5">
                    {new Date(step.date).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button for Employee */}
      {isEmployee &&
        request?.status === "in_progress" &&
        (showCompleteForm ? (
          <div className="space-y-3 animate-slideInUp border-t border-ghforegroundlow/20 pt-4">
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add completion notes (optional)..."
              className="w-full px-4 py-3 rounded-xl bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent resize-none text-sm"
              rows="2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleComplete}
                disabled={processing}
                className="btn-success flex-1 px-3 py-2 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={14} />
                )}
                Submit for Review
              </button>
              <button
                onClick={() => setShowCompleteForm(false)}
                className="px-3 py-2 rounded-lg bg-ghforegroundlow/10 hover:bg-ghforegroundlow/20 text-ghforegroundlow font-medium text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCompleteForm(true)}
            className="btn-success w-full px-4 py-2.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 mt-2"
          >
            <CheckCircle size={16} /> Mark as Complete
          </button>
        ))}

      {request?.status === "pending_completion" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
          <p className="text-yellow-400 text-sm flex items-center gap-2">
            <Clock size={14} />
            Waiting for admin review
          </p>
        </div>
      )}
    </div>
  );
};

export default function Chat() {
  const { user, role } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [requestDetails, setRequestDetails] = useState(null);
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

  // Fetch messages and request details when selected chat changes
  useEffect(() => {
    const fetchData = async () => {
      if (chats.length === 0 || selectedIdx >= chats.length) return;

      try {
        const [messagesRes, requestRes] = await Promise.all([
          ChatAPI.getMessages(chats[selectedIdx].id),
          RequestsAPI.getRequest(
            chats[selectedIdx].service_request_id || chats[selectedIdx].id,
          ),
        ]);
        setMessages(messagesRes.messages || []);
        setRequestDetails(requestRes.request || null);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
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

  const handleComplete = async (requestId, notes) => {
    try {
      await RequestsAPI.completeRequest(requestId, notes);
      // Refresh request details
      const res = await RequestsAPI.getRequest(requestId);
      setRequestDetails(res.request || null);
    } catch (err) {
      console.error("Failed to complete request:", err);
    }
  };

  const selectedChat = chats[selectedIdx];
  const isEmployee = role === "employee";
  const isArchived = selectedChat?.is_archived;

  return (
    <div className="bg-ghbackground min-h-screen w-full">
      <Header />
      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-80 bg-ghbackground-secondary border-r border-ghforegroundlow/20 flex flex-col">
          <div className="p-6 border-b border-ghforegroundlow/20">
            <h2 className="text-white text-xl font-bold flex items-center gap-2">
              <MessageCircle size={22} /> Messages
            </h2>
            <p className="text-ghforegroundlow text-sm mt-1">
              {chats.filter((c) => !c.is_archived).length} active •{" "}
              {chats.filter((c) => c.is_archived).length} archived
            </p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-ghforegroundlow py-8">
                <Loader size={20} className="animate-spin" />
                Loading...
              </div>
            ) : error ? (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                {error}
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-12 text-ghforegroundlow">
                <MessageCircle size={32} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1 opacity-70">
                  Start a service to chat
                </p>
              </div>
            ) : (
              chats.map((chat, idx) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedIdx(idx)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${
                    idx === selectedIdx
                      ? "bg-ghaccent/20 border border-ghaccent/50"
                      : chat.is_archived
                        ? "opacity-60 hover:bg-ghforegroundlow/5 border border-transparent"
                        : "hover:bg-ghforegroundlow/10 border border-transparent"
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ghaccent to-purple-600 flex items-center justify-center">
                      <Gamepad2 size={20} className="text-white" />
                    </div>
                    {!chat.is_archived && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-ghbackground-secondary"></div>
                    )}
                    {chat.is_archived && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-ghforegroundlow rounded-full border-2 border-ghbackground-secondary flex items-center justify-center">
                        <Archive size={10} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-medium truncate text-sm">
                        {chat.employee_name || chat.requester_name}
                      </p>
                      {chat.is_archived && (
                        <span className="text-xs text-ghforegroundlow px-1.5 py-0.5 rounded bg-ghforegroundlow/10">
                          Closed
                        </span>
                      )}
                    </div>
                    <p className="text-ghforegroundlow text-xs truncate">
                      {chat.service_title}
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
                  size={56}
                  className="mx-auto mb-4 text-ghforegroundlow/30"
                />
                <p className="text-xl text-ghforegroundlow mb-2">
                  No conversations yet
                </p>
                <p className="text-ghforegroundlow/60">
                  When you start a service, your chat will appear here
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-ghforegroundlow/20 bg-ghbackground-secondary/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ghaccent to-purple-600 flex items-center justify-center">
                    <Gamepad2 size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">
                      {selectedChat?.employee_name ||
                        selectedChat?.requester_name}
                    </h3>
                    <p className="text-ghforegroundlow text-sm flex items-center gap-2">
                      {selectedChat?.service_title}
                      {isArchived && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-ghforegroundlow/20 text-ghforegroundlow">
                          Archived
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={`p-2.5 rounded-xl transition-all ${
                    showInfo
                      ? "bg-ghaccent text-white"
                      : "hover:bg-ghforegroundlow/10 text-ghforegroundlow hover:text-white"
                  }`}
                >
                  <Info size={20} />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Messages */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-ghforegroundlow">
                        <MessageCircle
                          size={32}
                          className="mx-auto mb-3 opacity-50"
                        />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs mt-1 opacity-70">
                          Start the conversation!
                        </p>
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
                            className={`px-4 py-2.5 rounded-2xl max-w-[70%] break-words ${
                              msg.sender_user_id === user?.id
                                ? "bg-gradient-to-r from-ghaccent to-blue-600 text-white rounded-br-sm"
                                : "bg-ghbackground-secondary border border-ghforegroundlow/20 text-gray-100 rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.sender_user_id === user?.id
                                  ? "text-white/60"
                                  : "text-ghforegroundlow/60"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  {isArchived ? (
                    <div className="px-6 py-4 border-t border-ghforegroundlow/20 bg-ghbackground-secondary/50">
                      <div className="flex items-center justify-center gap-2 text-ghforegroundlow py-2">
                        <Archive size={18} />
                        <span>This chat has been archived</span>
                      </div>
                    </div>
                  ) : (
                    <form
                      className="px-6 py-4 border-t border-ghforegroundlow/20 bg-ghbackground-secondary/50"
                      onSubmit={handleSend}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Type a message..."
                            className="w-full bg-ghbackground border border-ghforegroundlow/20 rounded-xl px-4 py-3 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent transition-all"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoComplete="off"
                          />
                        </div>
                        <button
                          type="submit"
                          className="p-3 btn-primary rounded-xl transition-all disabled:opacity-50"
                          disabled={!input.trim()}
                        >
                          <Send size={20} className="text-white" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Info Panel */}
                {showInfo && (
                  <div className="w-80 border-l border-ghforegroundlow/20 bg-ghbackground-secondary/30 overflow-y-auto animate-slideInUp">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-white font-bold">
                          Service Details
                        </h4>
                        <button
                          onClick={() => setShowInfo(false)}
                          className="p-1.5 rounded-lg hover:bg-ghforegroundlow/10 text-ghforegroundlow hover:text-white transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Service Info */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-xs text-ghforegroundlow mb-1">
                            Service
                          </p>
                          <p className="text-white font-medium">
                            {selectedChat?.service_title}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ghforegroundlow mb-1">
                            {isEmployee ? "Client" : "Coach"}
                          </p>
                          <p className="text-white font-medium">
                            {isEmployee
                              ? selectedChat?.requester_name
                              : selectedChat?.employee_name}
                          </p>
                        </div>
                        {requestDetails?.amount && (
                          <div>
                            <p className="text-xs text-ghforegroundlow mb-1">
                              Amount
                            </p>
                            <p className="text-green-400 font-bold flex items-center gap-1">
                              <DollarSign size={16} />
                              {parseFloat(requestDetails.amount).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Timeline */}
                      <div className="border-t border-ghforegroundlow/20 pt-6">
                        <h4 className="text-white font-bold mb-4">
                          Service Timeline
                        </h4>
                        <ServiceTimeline
                          request={requestDetails}
                          isEmployee={isEmployee}
                          onComplete={handleComplete}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

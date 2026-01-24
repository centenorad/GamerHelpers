// React imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gamepad2,
  AlertCircle,
  Loader,
  Edit2,
  CheckCircle,
  Clock,
  XCircle,
  Briefcase,
  Star,
  MessageCircle,
  Search,
  Play,
  Check,
  X,
} from "lucide-react";

// File imports
import Header from "../templates/Header";
import { useAuth } from "../context/AuthContext";
import {
  ServicesAPI,
  GamesAPI,
  ApplicationsAPI,
  RequestsAPI,
} from "../services/api";

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { class: "status-pending", icon: Clock, label: "Pending" },
    employee_accepted: {
      class: "status-accepted",
      icon: Check,
      label: "Awaiting Your Confirmation",
    },
    in_progress: {
      class: "status-in-progress",
      icon: Play,
      label: "In Progress",
    },
    pending_completion: {
      class: "status-pending",
      icon: Clock,
      label: "Pending Review",
    },
    completed: {
      class: "status-completed",
      icon: CheckCircle,
      label: "Completed",
    },
    closed: { class: "status-closed", icon: CheckCircle, label: "Closed" },
    cancelled: { class: "status-cancelled", icon: XCircle, label: "Cancelled" },
    approved: {
      class: "status-completed",
      icon: CheckCircle,
      label: "Approved",
    },
    rejected: { class: "status-cancelled", icon: XCircle, label: "Rejected" },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.class}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
};

// Service Card Component for browsing
const ServiceCard = ({
  service,
  onRequest,
  hasRequested,
  existingRequest,
  onConfirm,
  onCancel,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [serviceDetails, setServiceDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async () => {
    if (!serviceDetails.trim()) return;
    setSubmitting(true);
    try {
      await onRequest(service.id, serviceDetails);
      setShowDetails(false);
      setServiceDetails("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-ghbackground-secondary rounded-2xl border border-ghforegroundlow/20 overflow-hidden card-hover group">
      <div className="p-6">
        <div className="flex gap-5">
          {/* Coach Avatar */}
          <div className="flex-shrink-0">
            <img
              src={
                service.profile_picture ||
                "https://randomuser.me/api/portraits/lego/1.jpg"
              }
              alt={service.full_name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-ghaccent/50 shadow-lg group-hover:shadow-ghaccent/30 transition-shadow"
            />
          </div>

          {/* Service Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-ghaccent transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-ghforegroundlow">
                  by {service.full_name}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-green-400">
                  ${parseFloat(service.price).toFixed(2)}
                </p>
                <p className="text-xs text-ghforegroundlow">per session</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ghaccent/10 border border-ghaccent/30 text-ghaccent text-sm">
                <Gamepad2 size={14} />
                {service.game_name}
              </span>
              {service.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-yellow-400 text-sm">
                  <Star size={14} fill="currentColor" />
                  {parseFloat(service.rating).toFixed(1)}
                </span>
              )}
            </div>

            <p className="text-ghforegroundlow text-sm line-clamp-2 mb-4">
              {service.description}
            </p>

            {/* Action Section */}
            {hasRequested && existingRequest ? (
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={existingRequest.status} />
                {existingRequest.status === "employee_accepted" && (
                  <button
                    onClick={() => onConfirm(existingRequest.id)}
                    className="btn-success px-4 py-2 rounded-xl text-white font-semibold text-sm flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Confirm & Start
                  </button>
                )}
                {existingRequest.status === "pending" && (
                  <button
                    onClick={() => onCancel(existingRequest.id)}
                    className="px-4 py-2 rounded-xl bg-ghforegroundlow/10 hover:bg-red-500/20 text-ghforegroundlow hover:text-red-400 font-semibold text-sm transition-all"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            ) : showDetails ? (
              <div className="space-y-3 animate-slideInUp">
                <textarea
                  value={serviceDetails}
                  onChange={(e) => setServiceDetails(e.target.value)}
                  placeholder="Describe what you need help with..."
                  className="w-full px-4 py-3 rounded-xl bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent resize-none"
                  rows="3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRequest}
                    disabled={!serviceDetails.trim() || submitting}
                    className="btn-primary px-4 py-2 rounded-xl text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Submit Request
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 rounded-xl bg-ghforegroundlow/10 hover:bg-ghforegroundlow/20 text-ghforegroundlow font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="btn-primary px-6 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2"
              >
                <MessageCircle size={18} />
                Request Service
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Employee Application Card
const ApplicationCard = ({
  app,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  editingApp,
  editFormData,
  setEditFormData,
}) => {
  return (
    <div className="bg-ghbackground-secondary rounded-2xl border border-ghforegroundlow/20 p-6 card-hover">
      {editingApp === app.id ? (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Title
            </label>
            <input
              type="text"
              value={editFormData.title}
              onChange={(e) =>
                setEditFormData({ ...editFormData, title: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl bg-ghbackground border border-ghforegroundlow/30 text-white focus:outline-none focus:ring-2 focus:ring-ghaccent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Description
            </label>
            <textarea
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  description: e.target.value,
                })
              }
              className="w-full px-4 py-3 rounded-xl bg-ghbackground border border-ghforegroundlow/30 text-white focus:outline-none focus:ring-2 focus:ring-ghaccent resize-none"
              rows="4"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Price ($)
            </label>
            <input
              type="number"
              value={editFormData.price}
              onChange={(e) =>
                setEditFormData({ ...editFormData, price: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl bg-ghbackground border border-ghforegroundlow/30 text-white focus:outline-none focus:ring-2 focus:ring-ghaccent"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onSaveEdit(app.id)}
              className="btn-success flex-1 px-4 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              <Check size={18} /> Save & Submit for Reapproval
            </button>
            <button
              onClick={onCancelEdit}
              className="flex-1 px-4 py-3 rounded-xl bg-ghforegroundlow/10 hover:bg-ghforegroundlow/20 text-ghforegroundlow font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{app.title}</h3>
              <p className="text-ghforegroundlow text-sm flex items-center gap-2">
                <Gamepad2 size={14} />
                {app.game}
              </p>
            </div>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-ghforegroundlow mb-4 line-clamp-3">
            {app.description}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-green-400">
              ${parseFloat(app.price).toFixed(2)}
            </p>
            <button
              onClick={() => onEdit(app)}
              className="btn-primary px-4 py-2 rounded-xl text-white font-semibold text-sm flex items-center gap-2"
            >
              <Edit2 size={16} /> Edit Post
            </button>
          </div>
          {app.status === "pending" && (
            <p className="text-yellow-400/80 text-xs mt-3 flex items-center gap-1">
              <Clock size={12} />
              Waiting for admin review
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Employee Request Card
const EmployeeRequestCard = ({ request, onAccept, onReject, onComplete }) => {
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCompleteForm, setShowCompleteForm] = useState(false);
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

  return (
    <div className="bg-ghbackground-secondary rounded-2xl border border-ghforegroundlow/20 p-6 card-hover">
      <div className="flex items-start gap-4 mb-4">
        <img
          src={
            request.profile_picture ||
            "https://randomuser.me/api/portraits/lego/1.jpg"
          }
          alt={request.requester_name}
          className="w-14 h-14 rounded-xl object-cover border-2 border-ghaccent/30"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">{request.title}</h3>
              <p className="text-sm text-ghforegroundlow">
                From:{" "}
                <span className="text-white">{request.requester_name}</span>
              </p>
            </div>
            <StatusBadge status={request.status} />
          </div>
        </div>
      </div>

      <div className="bg-ghbackground/50 rounded-xl p-4 mb-4">
        <p className="text-sm text-ghforegroundlow">
          {request.service_details}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-ghforegroundlow text-sm flex items-center gap-2">
          <Gamepad2 size={14} />
          {request.game_name}
        </span>
        <span className="text-green-400 font-bold text-lg">
          ${parseFloat(request.amount).toFixed(2)}
        </span>
      </div>

      {request.status === "pending" && (
        <div className="flex gap-3">
          <button
            onClick={() => onAccept(request.id)}
            className="btn-success flex-1 px-4 py-2.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          >
            <Check size={18} /> Accept
          </button>
          <button
            onClick={() => onReject(request.id)}
            className="btn-danger flex-1 px-4 py-2.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          >
            <X size={18} /> Decline
          </button>
        </div>
      )}

      {request.status === "employee_accepted" && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
          <p className="text-blue-400 text-sm flex items-center justify-center gap-2">
            <Clock size={14} />
            Waiting for user to confirm and start
          </p>
        </div>
      )}

      {request.status === "in_progress" &&
        (showCompleteForm ? (
          <div className="space-y-3 animate-slideInUp">
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add completion notes (optional)..."
              className="w-full px-4 py-3 rounded-xl bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent resize-none"
              rows="3"
            />
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                disabled={processing}
                className="btn-success flex-1 px-4 py-2.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Submit for Review
              </button>
              <button
                onClick={() => setShowCompleteForm(false)}
                className="px-4 py-2.5 rounded-xl bg-ghforegroundlow/10 hover:bg-ghforegroundlow/20 text-ghforegroundlow font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCompleteForm(true)}
            className="btn-primary w-full px-4 py-2.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} /> Mark as Complete
          </button>
        ))}

      {request.status === "pending_completion" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-center">
          <p className="text-yellow-400 text-sm flex items-center justify-center gap-2">
            <Clock size={14} />
            Waiting for admin to review completion
          </p>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState(
    role === "employee" ? "applications" : "services",
  );
  const [services, setServices] = useState([]);
  const [games, setGames] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [employeeRequests, setEmployeeRequests] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingApp, setEditingApp] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Always fetch games
        const gamesRes = await GamesAPI.getAllGames();
        setGames(gamesRes.games || []);

        if (role === "employee") {
          const [appsRes, reqsRes] = await Promise.all([
            ApplicationsAPI.getUserApplications(),
            RequestsAPI.getEmployeeRequests(),
          ]);
          setUserApplications(appsRes.applications || []);
          setEmployeeRequests(reqsRes.requests || []);
        }

        // Fetch services for all users (employees can see them too)
        const [servicesRes, userReqRes] = await Promise.all([
          ServicesAPI.listServices(null, null, 100),
          RequestsAPI.getUserRequests(),
        ]);
        setServices(servicesRes.services || []);
        setUserRequests(userReqRes.requests || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [role, authLoading]);

  // Handlers
  const handleServiceRequest = async (serviceId, details) => {
    try {
      await RequestsAPI.createRequest({
        published_service_id: serviceId,
        service_details: details,
      });
      const res = await RequestsAPI.getUserRequests();
      setUserRequests(res.requests || []);
    } catch (err) {
      console.error("Failed to create request:", err);
      setError("Failed to submit request. Please try again.");
    }
  };

  const handleConfirmRequest = async (requestId) => {
    try {
      await RequestsAPI.confirmRequest(requestId);
      const res = await RequestsAPI.getUserRequests();
      setUserRequests(res.requests || []);
      navigate("/chats");
    } catch (err) {
      console.error("Failed to confirm request:", err);
      setError("Failed to confirm request. Please try again.");
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await RequestsAPI.cancelRequest(requestId);
      const res = await RequestsAPI.getUserRequests();
      setUserRequests(res.requests || []);
    } catch (err) {
      console.error("Failed to cancel request:", err);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await RequestsAPI.acceptRequest(requestId, "Request accepted");
      const res = await RequestsAPI.getEmployeeRequests();
      setEmployeeRequests(res.requests || []);
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await RequestsAPI.rejectRequest(requestId);
      const res = await RequestsAPI.getEmployeeRequests();
      setEmployeeRequests(res.requests || []);
    } catch (err) {
      console.error("Failed to reject request:", err);
    }
  };

  const handleCompleteRequest = async (requestId, notes) => {
    try {
      await RequestsAPI.completeRequest(requestId, notes);
      const res = await RequestsAPI.getEmployeeRequests();
      setEmployeeRequests(res.requests || []);
    } catch (err) {
      console.error("Failed to complete request:", err);
    }
  };

  const handleEditApp = (app) => {
    setEditingApp(app.id);
    setEditFormData({
      title: app.title,
      description: app.description,
      price: app.price,
    });
  };

  const handleSaveEdit = async (appId) => {
    try {
      await ApplicationsAPI.updateApplication(appId, editFormData);
      setUserApplications((prev) =>
        prev.map((app) =>
          app.id === appId
            ? { ...app, ...editFormData, status: "pending" }
            : app,
        ),
      );
      setEditingApp(null);
    } catch (err) {
      console.error("Failed to update application:", err);
      setError("Failed to update application");
    }
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesCategory =
      selectedCategory === "all" ||
      service.game_id === parseInt(selectedCategory);
    const matchesSearch =
      !searchQuery ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.game_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Loading state
  if (authLoading) {
    return (
      <>
        <Header />
        <main className="bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 text-ghforegroundlow">
            <Loader size={24} className="animate-spin" />
            <span className="text-lg">Loading...</span>
          </div>
        </main>
      </>
    );
  }

  // Tab definitions
  const employeeTabs = [
    { id: "applications", label: "My Applications", icon: Briefcase },
    { id: "requests", label: "Incoming Requests", icon: MessageCircle },
  ];

  const userTabs = [
    { id: "services", label: "Browse Services", icon: Search },
    { id: "my-requests", label: "My Requests", icon: Clock },
  ];

  const tabs = role === "employee" ? employeeTabs : userTabs;

  return (
    <>
      <Header />
      <main className="bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-ghaccent/10 to-purple-600/10 border-b border-ghforegroundlow/10">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {role === "employee"
                    ? "Employee Dashboard"
                    : "Find Your Perfect Coach"}
                </h1>
                <p className="text-ghforegroundlow text-lg max-w-xl">
                  {role === "employee"
                    ? "Manage your services and handle incoming requests from users"
                    : "Connect with expert gaming coaches and level up your skills"}
                </p>
              </div>
              {role === "employee" ? (
                <div className="flex gap-4">
                  <div className="text-center px-6 py-4 rounded-2xl bg-ghbackground/50 border border-ghforegroundlow/10">
                    <p className="text-3xl font-bold text-green-400">
                      ${Number(user?.wallet_balance || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-ghforegroundlow">
                      Total Earnings
                    </p>
                  </div>
                  <div className="text-center px-6 py-4 rounded-2xl bg-ghbackground/50 border border-ghforegroundlow/10">
                    <p className="text-3xl font-bold text-ghaccent">
                      {
                        userApplications.filter((a) => a.status === "approved")
                          .length
                      }
                    </p>
                    <p className="text-sm text-ghforegroundlow">
                      Active Services
                    </p>
                  </div>
                  <div className="text-center px-6 py-4 rounded-2xl bg-ghbackground/50 border border-ghforegroundlow/10">
                    <p className="text-3xl font-bold text-purple-400">
                      {
                        employeeRequests.filter((r) => r.status === "pending")
                          .length
                      }
                    </p>
                    <p className="text-sm text-ghforegroundlow">
                      Pending Requests
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4">
                  <div className="text-center px-6 py-4 rounded-2xl bg-ghbackground/50 border border-ghforegroundlow/10">
                    <p className="text-3xl font-bold text-ghaccent">
                      {services.length}
                    </p>
                    <p className="text-sm text-ghforegroundlow">
                      Active Services
                    </p>
                  </div>
                  <div className="text-center px-6 py-4 rounded-2xl bg-ghbackground/50 border border-ghforegroundlow/10">
                    <p className="text-3xl font-bold text-green-400">
                      {games.length}
                    </p>
                    <p className="text-sm text-ghforegroundlow">Games</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-ghaccent text-white shadow-lg shadow-ghaccent/30"
                      : "text-ghforegroundlow hover:text-white hover:bg-ghforegroundlow/10"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                  {tab.id === "requests" &&
                    employeeRequests.filter((r) => r.status === "pending")
                      .length > 0 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                        {
                          employeeRequests.filter((r) => r.status === "pending")
                            .length
                        }
                      </span>
                    )}
                  {tab.id === "my-requests" &&
                    userRequests.filter((r) => r.status === "employee_accepted")
                      .length > 0 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs">
                        {
                          userRequests.filter(
                            (r) => r.status === "employee_accepted",
                          ).length
                        }
                      </span>
                    )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Browse Services Tab */}
          {activeTab === "services" && (
            <div className="animate-fadeIn">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ghforegroundlow"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search services, coaches, or games..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-ghbackground-secondary border border-ghforegroundlow/20 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-5 py-3 rounded-xl bg-ghbackground-secondary border border-ghforegroundlow/20 text-white focus:outline-none focus:ring-2 focus:ring-ghaccent cursor-pointer"
                >
                  <option value="all">All Games</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services List */}
              {loading ? (
                <div className="flex items-center justify-center gap-3 text-ghforegroundlow py-16">
                  <Loader size={24} className="animate-spin" />
                  <span>Loading services...</span>
                </div>
              ) : filteredServices.length > 0 ? (
                <div className="space-y-4">
                  {filteredServices.map((service, idx) => {
                    const existingRequest = userRequests.find(
                      (r) =>
                        r.published_service_id === service.id &&
                        !["cancelled", "closed"].includes(r.status),
                    );
                    return (
                      <div
                        key={service.id}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                        className="animate-slideInUp"
                      >
                        <ServiceCard
                          service={service}
                          hasRequested={!!existingRequest}
                          existingRequest={existingRequest}
                          onRequest={handleServiceRequest}
                          onConfirm={handleConfirmRequest}
                          onCancel={handleCancelRequest}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Gamepad2
                    size={48}
                    className="mx-auto mb-4 text-ghforegroundlow/50"
                  />
                  <p className="text-xl text-ghforegroundlow mb-2">
                    No services found
                  </p>
                  <p className="text-ghforegroundlow/70">
                    Try a different search or category
                  </p>
                </div>
              )}
            </div>
          )}

          {/* My Applications Tab (Employee) */}
          {activeTab === "applications" && role === "employee" && (
            <div className="animate-fadeIn">
              {loading ? (
                <div className="flex items-center justify-center gap-3 text-ghforegroundlow py-16">
                  <Loader size={24} className="animate-spin" />
                  <span>Loading applications...</span>
                </div>
              ) : userApplications.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {userApplications.map((app, idx) => (
                    <div
                      key={app.id}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                      className="animate-slideInUp"
                    >
                      <ApplicationCard
                        app={app}
                        onEdit={handleEditApp}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={() => setEditingApp(null)}
                        editingApp={editingApp}
                        editFormData={editFormData}
                        setEditFormData={setEditFormData}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Briefcase
                    size={48}
                    className="mx-auto mb-4 text-ghforegroundlow/50"
                  />
                  <p className="text-xl text-ghforegroundlow mb-2">
                    No applications yet
                  </p>
                  <p className="text-ghforegroundlow/70 mb-6">
                    Start offering your coaching services!
                  </p>
                  <button
                    onClick={() => navigate("/apply")}
                    className="btn-primary px-6 py-3 rounded-xl text-white font-semibold"
                  >
                    Create Your First Service
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Incoming Requests Tab (Employee) */}
          {activeTab === "requests" && role === "employee" && (
            <div className="animate-fadeIn">
              {loading ? (
                <div className="flex items-center justify-center gap-3 text-ghforegroundlow py-16">
                  <Loader size={24} className="animate-spin" />
                  <span>Loading requests...</span>
                </div>
              ) : employeeRequests.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {employeeRequests.map((request, idx) => (
                    <div
                      key={request.id}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                      className="animate-slideInUp"
                    >
                      <EmployeeRequestCard
                        request={request}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                        onComplete={handleCompleteRequest}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <MessageCircle
                    size={48}
                    className="mx-auto mb-4 text-ghforegroundlow/50"
                  />
                  <p className="text-xl text-ghforegroundlow mb-2">
                    No service requests yet
                  </p>
                  <p className="text-ghforegroundlow/70">
                    When users request your services, they will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          {/* My Requests Tab (User) */}
          {activeTab === "my-requests" && role !== "employee" && (
            <div className="animate-fadeIn">
              {loading ? (
                <div className="flex items-center justify-center gap-3 text-ghforegroundlow py-16">
                  <Loader size={24} className="animate-spin" />
                  <span>Loading your requests...</span>
                </div>
              ) : userRequests.length > 0 ? (
                <div className="space-y-4">
                  {userRequests.map((request, idx) => (
                    <div
                      key={request.id}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                      className="bg-ghbackground-secondary rounded-2xl border border-ghforegroundlow/20 p-6 animate-slideInUp card-hover"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            request.profile_picture ||
                            "https://randomuser.me/api/portraits/lego/1.jpg"
                          }
                          alt={request.employee_name}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-ghaccent/30"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {request.title}
                              </h3>
                              <p className="text-sm text-ghforegroundlow">
                                Coach:{" "}
                                <span className="text-white">
                                  {request.employee_name}
                                </span>
                              </p>
                            </div>
                            <StatusBadge status={request.status} />
                          </div>
                          <p className="text-sm text-ghforegroundlow mb-3">
                            {request.service_details}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-ghforegroundlow text-sm flex items-center gap-2">
                              <Gamepad2 size={14} />
                              {request.game_name}
                            </span>
                            <span className="text-green-400 font-bold">
                              ${parseFloat(request.amount).toFixed(2)}
                            </span>
                          </div>

                          {request.status === "employee_accepted" && (
                            <div className="mt-4 flex gap-3">
                              <button
                                onClick={() => handleConfirmRequest(request.id)}
                                className="btn-success px-4 py-2 rounded-xl text-white font-semibold text-sm flex items-center gap-2"
                              >
                                <CheckCircle size={16} />
                                Confirm & Start Service
                              </button>
                              <button
                                onClick={() => handleCancelRequest(request.id)}
                                className="px-4 py-2 rounded-xl bg-ghforegroundlow/10 hover:bg-red-500/20 text-ghforegroundlow hover:text-red-400 font-semibold text-sm transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {request.status === "pending" && (
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              className="mt-4 px-4 py-2 rounded-xl bg-ghforegroundlow/10 hover:bg-red-500/20 text-ghforegroundlow hover:text-red-400 font-semibold text-sm transition-all"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Clock
                    size={48}
                    className="mx-auto mb-4 text-ghforegroundlow/50"
                  />
                  <p className="text-xl text-ghforegroundlow mb-2">
                    No requests yet
                  </p>
                  <p className="text-ghforegroundlow/70">
                    Browse services and make your first request!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

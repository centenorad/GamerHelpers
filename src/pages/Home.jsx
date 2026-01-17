// React imports
import { useState, useEffect } from "react";
import {
  Gamepad2,
  Filter,
  AlertCircle,
  Loader,
  Edit2,
  CheckCircle,
  Clock,
  XCircle,
  Briefcase,
  User,
} from "lucide-react";

// File imports
import Header from "../templates/Header";
import ServicePost from "../components/ServicePost";
import {
  ServicesAPI,
  GamesAPI,
  ApplicationsAPI,
  RequestsAPI,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, role, loading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeEmployeeTab, setActiveEmployeeTab] = useState("applications");
  const [services, setServices] = useState([]);
  const [games, setGames] = useState([]);
  const [userApplications, setUserApplications] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingApp, setEditingApp] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
  });

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <>
        <Header />
        <main className="bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground min-h-screen py-12 px-4 flex items-center justify-center">
          <div className="flex items-center justify-center gap-3 text-ghforegroundlow">
            <Loader size={24} className="animate-spin" />
            <span className="text-lg">Loading...</span>
          </div>
        </main>
      </>
    );
  }

  console.log(role);

  // Fetch games and services on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        if (role === "employee") {
          // Fetch employee's applications
          const appsRes = await ApplicationsAPI.getUserApplications();
          setUserApplications(appsRes.applications || []);

          // Fetch employee's service requests
          const reqsRes = await RequestsAPI.getEmployeeRequests();
          setServiceRequests(reqsRes.requests || []);
        } else {
          // Fetch games
          const gamesRes = await GamesAPI.getAllGames();
          setGames(gamesRes.games || []);

          // Fetch services
          const servicesRes = await ServicesAPI.listServices(null, null, 100);
          setServices(servicesRes.services || []);

          // Fetch user's own requests
          const userReqRes = await RequestsAPI.getUserRequests();
          setUserRequests(userReqRes.requests || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

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
            : app
        )
      );
      setEditingApp(null);
    } catch (err) {
      console.error("Failed to update application:", err);
      setError("Failed to update application");
    }
  };

  const handleCancelEdit = () => {
    setEditingApp(null);
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await RequestsAPI.cancelRequest(requestId);
      setServiceRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error("Failed to cancel request:", err);
      setError("Failed to cancel request");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await RequestsAPI.acceptRequest(requestId, "Request accepted");
      setServiceRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "accepted" } : req
        )
      );
    } catch (err) {
      console.error("Failed to accept request:", err);
      setError("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await RequestsAPI.rejectRequest(requestId);
      setServiceRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "rejected" } : req
        )
      );
    } catch (err) {
      console.error("Failed to reject request:", err);
      setError("Failed to reject request");
    }
  };

  // EMPLOYEE VIEW - Show their applications and requests
  if (role === "employee") {
    return (
      <>
        <Header />
        <main className="bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground min-h-screen py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-12 text-center animate-slideInDown">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <Gamepad2 size={40} /> Dashboard
              </h1>
              <p className="text-ghforegroundlow text-lg max-w-2xl mx-auto">
                Manage your coaching applications and service requests
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-ghforegroundlow/20">
              {[
                {
                  id: "applications",
                  label: "My Applications",
                  icon: Briefcase,
                },
                { id: "requests", label: "Service Requests", icon: Clock },
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveEmployeeTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
                      activeEmployeeTab === tab.id
                        ? "border-b-2 border-ghaccent text-ghaccent"
                        : "text-ghforegroundlow hover:text-white"
                    }`}
                  >
                    <TabIcon size={20} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Applications Tab */}
            {activeEmployeeTab === "applications" && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center gap-3 text-ghforegroundlow py-12">
                    <Loader size={24} className="animate-spin" />
                    <span className="text-lg">Loading applications...</span>
                  </div>
                ) : error ? (
                  <div className="max-w-md mx-auto p-6 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
                    <AlertCircle size={24} />
                    {error}
                  </div>
                ) : userApplications.length > 0 ? (
                  userApplications.map((app, idx) => (
                    <div
                      key={app.id}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                      className="bg-ghbackground-secondary rounded-lg border border-ghforegroundlow/20 p-6 animate-slideInUp"
                    >
                      {editingApp === app.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editFormData.title}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  title: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 rounded-lg bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent"
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
                              className="w-full px-4 py-2 rounded-lg bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent"
                              rows="4"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                              Price
                            </label>
                            <input
                              type="number"
                              value={editFormData.price}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  price: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 rounded-lg bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSaveEdit(app.id)}
                              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-white mb-2">
                                {app.title}
                              </h3>
                              <p className="text-ghforegroundlow mb-2">
                                {app.game}
                              </p>
                              <p className="text-ghforegroundlow mb-4">
                                {app.description}
                              </p>
                              <p className="text-xl font-bold text-green-400">
                                ${parseFloat(app.price).toFixed(2)}
                              </p>
                            </div>
                            <div className="ml-4">
                              <div
                                className={`px-4 py-2 rounded-full text-white font-semibold flex items-center gap-2 ${
                                  app.status === "approved"
                                    ? "bg-green-600/30 border border-green-500/50 text-green-400"
                                    : app.status === "rejected"
                                      ? "bg-red-600/30 border border-red-500/50 text-red-400"
                                      : "bg-yellow-600/30 border border-yellow-500/50 text-yellow-400"
                                }`}
                              >
                                {app.status === "approved" && (
                                  <CheckCircle size={18} />
                                )}
                                {app.status === "pending" && (
                                  <Clock size={18} />
                                )}
                                {app.status === "rejected" && (
                                  <XCircle size={18} />
                                )}
                                {app.status.charAt(0).toUpperCase() +
                                  app.status.slice(1)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleEditApp(app)}
                              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                            >
                              <Edit2 size={18} /> Edit Post
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-2xl text-ghforegroundlow mb-4">
                      No applications yet
                    </p>
                    <p className="text-ghforegroundlow">
                      Head to the Apply page to submit your first coaching
                      application!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Service Requests Tab */}
            {activeEmployeeTab === "requests" && (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center gap-3 text-ghforegroundlow py-12">
                    <Loader size={24} className="animate-spin" />
                    <span className="text-lg">Loading requests...</span>
                  </div>
                ) : error ? (
                  <div className="max-w-md mx-auto p-6 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
                    <AlertCircle size={24} />
                    {error}
                  </div>
                ) : serviceRequests.length > 0 ? (
                  serviceRequests.map((request, idx) => (
                    <div
                      key={request.id}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                      className="bg-ghbackground-secondary rounded-lg border border-ghforegroundlow/20 p-6 animate-slideInUp"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <img
                            src={
                              request.profile_picture ||
                              "https://randomuser.me/api/portraits/lego/1.jpg"
                            }
                            alt={request.requester_name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-ghaccent"
                          />
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1">
                              {request.title}
                            </h3>
                            <p className="text-ghforegroundlow mb-2">
                              From: <strong>{request.requester_name}</strong> •
                              Game: <strong>{request.game_name}</strong>
                            </p>
                            <p className="text-sm text-ghforegroundlow">
                              {request.service_details}
                            </p>
                            <p className="text-sm text-ghforegroundlow mt-2">
                              Amount:{" "}
                              <span className="text-green-400 font-semibold">
                                ${parseFloat(request.amount).toFixed(2)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="ml-4 mt-4 md:mt-0">
                          <div
                            className={`px-4 py-2 rounded-full text-white font-semibold flex items-center gap-2 whitespace-nowrap ${
                              request.status === "accepted"
                                ? "bg-green-600/30 border border-green-500/50 text-green-400"
                                : request.status === "rejected"
                                  ? "bg-red-600/30 border border-red-500/50 text-red-400"
                                  : "bg-yellow-600/30 border border-yellow-500/50 text-yellow-400"
                            }`}
                          >
                            {request.status === "accepted" && (
                              <CheckCircle size={18} />
                            )}
                            {request.status === "pending" && (
                              <Clock size={18} />
                            )}
                            {request.status === "rejected" && (
                              <XCircle size={18} />
                            )}
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={request.status !== "pending"}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={request.status !== "pending"}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-2xl text-ghforegroundlow mb-4">
                      No service requests yet
                    </p>
                    <p className="text-ghforegroundlow">
                      Users will see your approved services and can request
                      them!
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

  // REGULAR USER VIEW - Browse services
  const categories = [
    { id: "all", label: "All Games" },
    ...(games.map((game) => ({
      id: game.id,
      label: game.name,
    })) || []),
  ];

  const filteredServices =
    selectedCategory === "all"
      ? services
      : services.filter(
          (service) => service.game_id === parseInt(selectedCategory)
        );

  return (
    <>
      <Header />
      <main className="bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12 text-center animate-slideInDown">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Gamepad2 size={40} /> Browse Services
            </h1>
            <p className="text-ghforegroundlow text-lg max-w-2xl mx-auto">
              Find expert coaching and services from verified professionals
              across your favorite games
            </p>
          </div>

          {/* Filter Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Filter size={20} className="text-ghaccent" />
              <span className="text-white font-semibold">
                Filter by Category:
              </span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-6 py-3 rounded-lg font-semibold bg-ghbackground-secondary text-white border border-ghforegroundlow/20 hover:border-ghaccent/50 focus:border-ghaccent focus:outline-none focus:ring-2 focus:ring-ghaccent/50 transition-all cursor-pointer"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Services Grid */}
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-3 text-ghforegroundlow py-12">
              <Loader size={24} className="animate-spin" />
              <span className="text-lg">Loading services...</span>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto p-6 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle size={24} />
              {error}
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="space-y-6">
              {filteredServices.map((service, idx) => (
                <div
                  key={service.id}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <ServicePost post={service} userRequests={userRequests} />
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

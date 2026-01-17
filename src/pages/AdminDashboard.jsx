// React imports
import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  BarChart3,
  Loader,
  AlertCircle,
} from "lucide-react";

// File imports
import Header from "../templates/Header";
import { AdminAPI, ApplicationsAPI } from "../services/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("applications");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [approvedCoaches, setApprovedCoaches] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);

  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch dashboard stats
        const statsRes = await AdminAPI.getDashboard();
        setStats(statsRes);

        // Fetch pending applications
        const appsRes = await ApplicationsAPI.getPendingApplications();
        setPendingApplications(appsRes.applications || []);

        // Fetch users (for approved coaches)
        const usersRes = await AdminAPI.listUsers();
        setApprovedCoaches(usersRes.users?.filter((u) => u.is_employee) || []);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
        setError("Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleApprove = async (appId) => {
    try {
      await ApplicationsAPI.approveApplication(appId, "Application approved");
      setPendingApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch (err) {
      console.error("Failed to approve application:", err);
    }
  };

  const handleReject = async (appId) => {
    try {
      await ApplicationsAPI.rejectApplication(appId, "Application rejected");
      setPendingApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch (err) {
      console.error("Failed to reject application:", err);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8 animate-slideInDown">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
              <BarChart3 size={40} /> Admin Dashboard
            </h1>
            <p className="text-ghforegroundlow">
              Manage applications, coaches, and service requests
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {loading ? (
              <div className="col-span-4 flex items-center justify-center gap-3 text-ghforegroundlow py-8">
                <Loader size={24} className="animate-spin" />
                <span>Loading dashboard...</span>
              </div>
            ) : error ? (
              <div className="col-span-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400">
                <AlertCircle size={24} />
                {error}
              </div>
            ) : (
              [
                {
                  icon: FileText,
                  label: "Pending Applications",
                  value: stats?.pending_applications || 0,
                  color: "yellow",
                },
                {
                  icon: CheckCircle,
                  label: "Total Coaches",
                  value: stats?.stats?.total_coaches || 0,
                  color: "green",
                },
                {
                  icon: Clock,
                  label: "Active Services",
                  value: stats?.active_requests || 0,
                  color: "blue",
                },
                {
                  icon: Users,
                  label: "Total Users",
                  value: stats?.stats?.total_users || 0,
                  color: "purple",
                },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                const colorClasses = {
                  yellow:
                    "bg-yellow-900/20 border-yellow-500/50 text-yellow-400",
                  green: "bg-green-900/20 border-green-500/50 text-green-400",
                  blue: "bg-blue-900/20 border-blue-500/50 text-blue-400",
                  purple:
                    "bg-purple-900/20 border-purple-500/50 text-purple-400",
                };
                return (
                  <div
                    key={idx}
                    className={`rounded-lg border p-6 ${
                      colorClasses[stat.color]
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-ghforegroundlow mb-1">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                      <Icon size={32} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-ghforegroundlow/20">
            {[
              { id: "applications", label: "Applications", icon: FileText },
              { id: "coaches", label: "Approved Coaches", icon: CheckCircle },
              { id: "services", label: "Service Requests", icon: Clock },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
                    activeTab === tab.id
                      ? "border-b-2 border-ghaccent text-ghaccent"
                      : "text-ghforegroundlow hover:text-white"
                  }`}
                >
                  <TabIcon size={20} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Pending Applications */}
          {activeTab === "applications" && (
            <div className="space-y-4 animate-slideInUp">
              {pendingApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-ghbackground-secondary rounded-lg border border-ghforegroundlow/20 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {app.title}
                      </h3>
                      <p className="text-ghforegroundlow text-sm mb-2">
                        by <strong>{app.full_name}</strong> • {app.game}
                      </p>
                    </div>
                    <div className="text-sm text-ghforegroundlow mt-4 md:mt-0 md:text-right">
                      Submitted:{" "}
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(app.id)}
                      className="flex-1 md:flex-none px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      className="flex-1 md:flex-none px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                </div>
              ))}
              {pendingApplications.length === 0 && (
                <p className="text-center text-ghforegroundlow py-8">
                  No pending applications
                </p>
              )}
            </div>
          )}

          {/* Approved Coaches */}
          {activeTab === "coaches" && (
            <div className="space-y-4 animate-slideInUp">
              {approvedCoaches.map((coach) => (
                <div
                  key={coach.id}
                  className="bg-ghbackground-secondary rounded-lg border border-ghforegroundlow/20 p-6 flex flex-col md:flex-row md:items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {coach.name}
                    </h3>
                    <p className="text-ghforegroundlow mb-2">
                      {coach.title} • {coach.game}
                    </p>
                    <p className="text-sm text-ghforegroundlow">
                      Joined: {coach.joinedAt}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all">
                      View Profile
                    </button>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all">
                      Suspend
                    </button>
                  </div>
                </div>
              ))}
              {approvedCoaches.length === 0 && (
                <p className="text-center text-ghforegroundlow py-8">
                  No approved coaches
                </p>
              )}
            </div>
          )}

          {/* Service Requests */}
          {activeTab === "services" && (
            <div className="space-y-4 animate-slideInUp">
              {serviceRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-ghbackground-secondary rounded-lg border border-ghforegroundlow/20 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {request.service}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            request.status === "in-progress"
                              ? "bg-blue-900/30 text-blue-200 border border-blue-500/50"
                              : "bg-yellow-900/30 text-yellow-200 border border-yellow-500/50"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-ghforegroundlow text-sm">
                        User: <strong>{request.user}</strong> → Coach:{" "}
                        <strong>{request.coach}</strong>
                      </p>
                      <p className="text-sm text-ghforegroundlow mt-2">
                        Started: {request.createdAt}
                      </p>
                    </div>
                    <button className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all">
                      View Chat
                    </button>
                  </div>
                </div>
              ))}
              {serviceRequests.length === 0 && (
                <p className="text-center text-ghforegroundlow py-8">
                  No service requests
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

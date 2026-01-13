// React imports
import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";

// File imports
import Header from "../templates/Header";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("applications");

  // Mock data
  const pendingApplications = [
    {
      id: 1,
      name: "Alex Pro",
      game: "Valorant",
      title: "Valorant Radiant Coaching",
      description: "Professional Radiant coach with 5 years experience",
      status: "pending",
      submittedAt: "2024-01-12",
    },
    {
      id: 2,
      name: "Coach Lisa",
      game: "League of Legends",
      title: "League of Legends Jungle Coaching",
      description: "Challenger tier jungle specialist",
      status: "pending",
      submittedAt: "2024-01-11",
    },
  ];

  const approvedCoaches = [
    {
      id: 3,
      name: "Pilot Sam",
      game: "Apex Legends",
      title: "Apex Legends Pilot Service",
      status: "approved",
      joinedAt: "2024-01-01",
    },
  ];

  const serviceRequests = [
    {
      id: 101,
      user: "Player1",
      coach: "Pilot Sam",
      service: "Apex Legends Pilot Service",
      status: "in-progress",
      createdAt: "2024-01-13",
    },
    {
      id: 102,
      user: "Player2",
      coach: "Alex Pro",
      service: "Valorant Radiant Coaching",
      status: "pending",
      createdAt: "2024-01-13",
    },
  ];

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
            {[
              {
                icon: FileText,
                label: "Pending Applications",
                value: pendingApplications.length,
                color: "yellow",
              },
              {
                icon: CheckCircle,
                label: "Approved Coaches",
                value: approvedCoaches.length,
                color: "green",
              },
              {
                icon: Clock,
                label: "Active Services",
                value: serviceRequests.filter((r) => r.status === "in-progress")
                  .length,
                color: "blue",
              },
              {
                icon: Users,
                label: "Total Coaches",
                value: approvedCoaches.length + pendingApplications.length,
                color: "purple",
              },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              const colorClasses = {
                yellow: "bg-yellow-900/20 border-yellow-500/50 text-yellow-400",
                green: "bg-green-900/20 border-green-500/50 text-green-400",
                blue: "bg-blue-900/20 border-blue-500/50 text-blue-400",
                purple: "bg-purple-900/20 border-purple-500/50 text-purple-400",
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
            })}
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
                        by <strong>{app.name}</strong> • {app.game}
                      </p>
                      <p className="text-ghforegroundlow">{app.description}</p>
                    </div>
                    <div className="text-sm text-ghforegroundlow mt-4 md:mt-0 md:text-right">
                      Submitted: {app.submittedAt}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 md:flex-none px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button className="flex-1 md:flex-none px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2">
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

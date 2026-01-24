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
  MessageSquare,
  DollarSign,
  Eye,
  RotateCcw,
  Archive,
  Gamepad2,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldCheck,
  UserPlus,
  UserMinus,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// File imports
import Header from "../templates/Header";
import { AdminAPI, ApplicationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/50",
      text: "text-yellow-400",
      label: "Pending",
    },
    employee_accepted: {
      bg: "bg-blue-500/20",
      border: "border-blue-500/50",
      text: "text-blue-400",
      label: "Employee Accepted",
    },
    in_progress: {
      bg: "bg-purple-500/20",
      border: "border-purple-500/50",
      text: "text-purple-400",
      label: "In Progress",
    },
    pending_completion: {
      bg: "bg-orange-500/20",
      border: "border-orange-500/50",
      text: "text-orange-400",
      label: "Awaiting Review",
    },
    completed: {
      bg: "bg-green-500/20",
      border: "border-green-500/50",
      text: "text-green-400",
      label: "Completed",
    },
    closed: {
      bg: "bg-gray-500/20",
      border: "border-gray-500/50",
      text: "text-gray-400",
      label: "Closed",
    },
    cancelled: {
      bg: "bg-red-500/20",
      border: "border-red-500/50",
      text: "text-red-400",
      label: "Cancelled",
    },
    pending_review: {
      bg: "bg-orange-500/20",
      border: "border-orange-500/50",
      text: "text-orange-400",
      label: "Pending Review",
    },
    approved: {
      bg: "bg-green-500/20",
      border: "border-green-500/50",
      text: "text-green-400",
      label: "Approved",
    },
    needs_revision: {
      bg: "bg-red-500/20",
      border: "border-red-500/50",
      text: "text-red-400",
      label: "Needs Revision",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.border} ${config.text} border`}
    >
      {config.label}
    </span>
  );
};

// Chart colors
const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

// Analytics Charts Component
const AnalyticsCharts = ({ analytics }) => {
  if (!analytics) return null;

  // Format daily data for charts
  const formatDailyData = (data, valueKey = "count") => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const found = data?.find((d) => d.date?.split("T")[0] === dateStr);
      last7Days.push({
        name: dayName,
        value: found ? Number(found[valueKey] || found.count || 0) : 0,
        revenue: found ? Number(found.revenue || 0) : 0,
        commission: found ? Number(found.commission || 0) : 0,
      });
    }
    return last7Days;
  };

  const dailyRequestsData = formatDailyData(analytics.dailyRequests);
  const dailyRevenueData = formatDailyData(analytics.dailyRevenue, "revenue");
  const dailyUsersData = formatDailyData(analytics.dailyUsers);

  // Format status distribution for pie chart
  const statusData =
    analytics.statusDistribution?.map((item) => ({
      name:
        item.status
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown",
      value: Number(item.count || 0),
    })) || [];

  // Format top games
  const topGamesData =
    analytics.topGames?.map((game) => ({
      name:
        game.name?.length > 10 ? game.name.substring(0, 10) + "..." : game.name,
      services: Number(game.services || 0),
      requests: Number(game.requests || 0),
    })) || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Row 1: Line Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Service Requests */}
        <div className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-ghaccent" />
            Daily Service Requests (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyRequestsData}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111633",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                fill="url(#colorRequests)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Revenue */}
        <div className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-green-400" />
            Daily Revenue (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dailyRevenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111633",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value) => [
                  `$${Number(value).toFixed(2)}`,
                  "Revenue",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Bar Chart and Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Games */}
        <div className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Gamepad2 size={18} className="text-purple-400" />
            Top Games by Activity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topGamesData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#6b7280"
                fontSize={11}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111633",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Bar
                dataKey="services"
                fill="#8b5cf6"
                name="Services"
                radius={[0, 4, 4, 0]}
              />
              <Bar
                dataKey="requests"
                fill="#3b82f6"
                name="Requests"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-400" />
            Service Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111633",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: New Users */}
      <div className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Users size={18} className="text-blue-400" />
          New User Registrations (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={dailyUsersData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111633",
                border: "1px solid #374151",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Admin Management Component (Super Admin Only)
const AdminManagement = ({
  admins,
  allUsers,
  onMakeAdmin,
  onUpdateAdmin,
  onRemoveAdmin,
  loading,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("regular");
  const [processing, setProcessing] = useState(false);

  const handleAddAdmin = async () => {
    if (!selectedUserId) return;
    setProcessing(true);
    try {
      await onMakeAdmin(selectedUserId, selectedRole);
      setShowAddModal(false);
      setSelectedUserId("");
      setSelectedRole("regular");
    } finally {
      setProcessing(false);
    }
  };

  // Filter out users who are already admins
  const availableUsers = allUsers.filter(
    (u) => !admins.some((a) => a.email === u.email),
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Add Admin Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Shield size={20} className="text-purple-400" />
          Admin Management
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-4 py-2 rounded-xl text-white font-semibold flex items-center gap-2 text-sm"
        >
          <UserPlus size={16} /> Add Admin
        </button>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-ghbackground-secondary rounded-2xl border border-ghforegroundlow/20 w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">Add New Admin</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-ghforegroundlow block mb-2">
                  Select User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ghbackground border border-ghforegroundlow/30 text-white focus:outline-none focus:ring-2 focus:ring-ghaccent"
                >
                  <option value="">Choose a user...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-ghforegroundlow block mb-2">
                  Admin Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-ghbackground border border-ghforegroundlow/30 text-white focus:outline-none focus:ring-2 focus:ring-ghaccent"
                >
                  <option value="regular">Regular Admin</option>
                  <option value="super">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddAdmin}
                  disabled={!selectedUserId || processing}
                  className="flex-1 btn-success px-4 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <UserPlus size={18} />
                  )}
                  Make Admin
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 rounded-xl bg-ghforegroundlow/10 hover:bg-ghforegroundlow/20 text-ghforegroundlow font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admins List */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 text-ghforegroundlow py-8">
          <Loader size={24} className="animate-spin" />
          <span>Loading admins...</span>
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 text-ghforegroundlow">
          <Shield size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No admins found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {admins.map((admin) => (
            <AdminCard
              key={admin.id}
              admin={admin}
              onUpdate={onUpdateAdmin}
              onRemove={onRemoveAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Admin Card Component
const AdminCard = ({ admin, onUpdate, onRemove }) => {
  const [processing, setProcessing] = useState(false);

  const handleToggleStatus = async () => {
    setProcessing(true);
    try {
      await onUpdate(admin.id, { is_active: !admin.is_active });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleRole = async () => {
    setProcessing(true);
    try {
      await onUpdate(admin.id, {
        role: admin.role === "super" ? "regular" : "super",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${admin.full_name} as admin?`)) return;
    setProcessing(true);
    try {
      await onRemove(admin.id);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6 animate-slideInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              admin.role === "super"
                ? "bg-gradient-to-br from-purple-500 to-pink-600"
                : "bg-gradient-to-br from-ghaccent to-blue-600"
            }`}
          >
            {admin.role === "super" ? (
              <ShieldCheck size={20} className="text-white" />
            ) : (
              <Shield size={20} className="text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {admin.full_name}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  admin.role === "super"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                    : "bg-ghaccent/20 text-ghaccent border border-ghaccent/50"
                }`}
              >
                {admin.role === "super" ? "Super Admin" : "Regular Admin"}
              </span>
            </h3>
            <p className="text-ghforegroundlow text-sm">{admin.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              admin.is_active
                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                : "bg-red-500/20 text-red-400 border border-red-500/50"
            }`}
          >
            {admin.is_active ? "Active" : "Inactive"}
          </span>

          <div className="flex gap-2">
            <button
              onClick={handleToggleStatus}
              disabled={processing}
              className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition-all ${
                admin.is_active
                  ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                  : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
              }`}
            >
              {admin.is_active ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={handleToggleRole}
              disabled={processing}
              className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-semibold flex items-center gap-1 transition-all"
            >
              {admin.role === "super" ? "Make Regular" : "Make Super"}
            </button>
            <button
              onClick={handleRemove}
              disabled={processing}
              className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-semibold flex items-center gap-1 transition-all"
            >
              <UserMinus size={14} /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Completion Card Component
const CompletionCard = ({ completion, onApprove, onReopen }) => {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await onApprove(completion.id);
    } finally {
      setProcessing(false);
    }
  };

  const handleReopen = async () => {
    if (!adminNotes.trim()) {
      alert("Please provide revision notes");
      return;
    }
    setProcessing(true);
    try {
      await onReopen(completion.id, adminNotes);
      setAdminNotes("");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 overflow-hidden animate-slideInUp">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ghaccent to-purple-600 flex items-center justify-center">
                <Gamepad2 size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {completion.service_title}
                </h3>
                <p className="text-ghforegroundlow text-sm">
                  {completion.game}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-ghforegroundlow">Employee</p>
                <p className="text-white font-medium">
                  {completion.employee_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-ghforegroundlow">Client</p>
                <p className="text-white font-medium">
                  {completion.requester_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-ghforegroundlow">Amount</p>
                <p className="text-green-400 font-bold flex items-center gap-1">
                  <DollarSign size={14} />
                  {Number(completion.amount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ghforegroundlow">Submitted</p>
                <p className="text-white">
                  {new Date(completion.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={completion.status} />
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg hover:bg-ghforegroundlow/10 text-ghforegroundlow hover:text-white transition-all"
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {completion.notes && (
          <div className="mt-4 p-3 bg-ghbackground rounded-lg border border-ghforegroundlow/10">
            <p className="text-xs text-ghforegroundlow mb-1">Employee Notes:</p>
            <p className="text-white text-sm">{completion.notes}</p>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-ghforegroundlow/20 p-6 bg-ghbackground/50">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-ghforegroundlow block mb-2">
                Revision Notes (required for reopen)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter notes for the employee if reopening..."
                className="w-full px-4 py-3 rounded-xl bg-ghbackground border border-ghforegroundlow/30 text-white placeholder-ghforegroundlow focus:outline-none focus:ring-2 focus:ring-ghaccent resize-none text-sm"
                rows="2"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 btn-success px-4 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {processing ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Approve & Close
              </button>
              <button
                onClick={handleReopen}
                disabled={processing || !adminNotes.trim()}
                className="flex-1 btn-warning px-4 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {processing ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <RotateCcw size={18} />
                )}
                Reopen for Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Chat Card Component
const ChatCard = ({ chat, onViewChat }) => {
  return (
    <div className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6 animate-slideInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ghaccent to-purple-600 flex items-center justify-center">
              <MessageSquare size={20} className="text-white" />
            </div>
            {chat.is_archived && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-ghforegroundlow rounded-full border-2 border-ghbackground-secondary flex items-center justify-center">
                <Archive size={10} />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {chat.service_title}
            </h3>
            <p className="text-ghforegroundlow text-sm">
              {chat.requester_name} ↔ {chat.employee_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge
            status={
              chat.status || (chat.is_archived ? "closed" : "in_progress")
            }
          />
          <button
            onClick={() => onViewChat(chat)}
            className="btn-primary px-4 py-2 rounded-xl text-white font-semibold flex items-center gap-2 text-sm"
          >
            <Eye size={16} /> View Messages
          </button>
        </div>
      </div>
    </div>
  );
};

// Chat Messages Modal
const ChatMessagesModal = ({ chat, messages, onClose }) => {
  if (!chat) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-ghbackground-secondary rounded-2xl border border-ghforegroundlow/20 w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-ghforegroundlow/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                {chat.service_title}
              </h3>
              <p className="text-ghforegroundlow text-sm">
                {chat.requester_name} ↔ {chat.employee_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-ghforegroundlow/10 text-ghforegroundlow hover:text-white transition-all"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-ghforegroundlow">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No messages in this chat</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender_user_id === chat.requester_user_id ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                    msg.sender_user_id === chat.requester_user_id
                      ? "bg-ghbackground border border-ghforegroundlow/20 rounded-bl-sm"
                      : "bg-gradient-to-r from-ghaccent to-blue-600 rounded-br-sm"
                  }`}
                >
                  <p className="text-xs text-ghforegroundlow/70 mb-1">
                    {msg.sender_name ||
                      (msg.sender_user_id === chat.requester_user_id
                        ? chat.requester_name
                        : chat.employee_name)}
                  </p>
                  <p className="text-white text-sm">{msg.message}</p>
                  <p className="text-xs text-ghforegroundlow/50 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-ghforegroundlow/20 text-center">
          <p className="text-ghforegroundlow text-sm">
            Admin view only • Messages cannot be sent
          </p>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [pendingCompletions, setPendingCompletions] = useState([]);
  const [allChats, setAllChats] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [approvedEmployees, setApprovedEmployees] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  // Chat modal state
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Check if current user is super admin
  const isSuperAdmin = user?.admin_role === "super";

  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all data in parallel
        const [
          statsRes,
          analyticsRes,
          appsRes,
          completionsRes,
          chatsRes,
          requestsRes,
          usersRes,
        ] = await Promise.all([
          AdminAPI.getDashboard().catch(() => ({})),
          AdminAPI.getAnalytics().catch(() => null),
          ApplicationsAPI.getPendingApplications().catch(() => ({
            applications: [],
          })),
          AdminAPI.getPendingCompletions().catch(() => ({ completions: [] })),
          AdminAPI.getAllChats().catch(() => ({ chats: [] })),
          AdminAPI.getAllRequests().catch(() => ({ requests: [] })),
          AdminAPI.listUsers().catch(() => ({ users: [] })),
        ]);

        setStats(statsRes);
        setAnalytics(analyticsRes);
        setPendingApplications(appsRes.applications || []);
        setPendingCompletions(completionsRes.completions || []);
        setAllChats(chatsRes.chats || []);
        setAllRequests(requestsRes.requests || []);
        setApprovedEmployees(
          usersRes.users?.filter((u) => u.is_employee) || [],
        );
        setAllUsers(usersRes.users || []);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
        setError("Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Fetch admins when tab is selected (super admin only)
  useEffect(() => {
    if (activeTab === "admin-management" && isSuperAdmin) {
      const fetchAdmins = async () => {
        setAdminsLoading(true);
        try {
          const res = await AdminAPI.listAdmins();
          setAdmins(res.admins || []);
        } catch (err) {
          console.error("Failed to fetch admins:", err);
        } finally {
          setAdminsLoading(false);
        }
      };
      fetchAdmins();
    }
  }, [activeTab, isSuperAdmin]);

  const handleApproveApp = async (appId) => {
    try {
      await ApplicationsAPI.approveApplication(appId, "Application approved");
      setPendingApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch (err) {
      console.error("Failed to approve application:", err);
    }
  };

  const handleRejectApp = async (appId) => {
    try {
      await ApplicationsAPI.rejectApplication(appId, "Application rejected");
      setPendingApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch (err) {
      console.error("Failed to reject application:", err);
    }
  };

  const handleApproveCompletion = async (completionId) => {
    try {
      await AdminAPI.approveCompletion(completionId);
      setPendingCompletions((prev) =>
        prev.filter((c) => c.id !== completionId),
      );
    } catch (err) {
      console.error("Failed to approve completion:", err);
    }
  };

  const handleReopenCompletion = async (completionId, notes) => {
    try {
      await AdminAPI.reopenCompletion(completionId, notes);
      setPendingCompletions((prev) =>
        prev.filter((c) => c.id !== completionId),
      );
    } catch (err) {
      console.error("Failed to reopen completion:", err);
    }
  };

  const handleViewChat = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const res = await AdminAPI.getChatMessages(chat.id);
      setChatMessages(res.messages || []);
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleMakeAdmin = async (userId, role) => {
    try {
      await AdminAPI.createAdmin(userId, role);
      // Refresh admins list
      const res = await AdminAPI.listAdmins();
      setAdmins(res.admins || []);
    } catch (err) {
      console.error("Failed to create admin:", err);
      alert(err.message || "Failed to create admin");
    }
  };

  const handleUpdateAdmin = async (adminId, data) => {
    try {
      await AdminAPI.updateAdmin(adminId, data);
      // Refresh admins list
      const res = await AdminAPI.listAdmins();
      setAdmins(res.admins || []);
    } catch (err) {
      console.error("Failed to update admin:", err);
    }
  };

  const handleRemoveAdmin = async (adminId) => {
    try {
      await AdminAPI.removeAdmin(adminId);
      setAdmins((prev) => prev.filter((a) => a.id !== adminId));
    } catch (err) {
      console.error("Failed to remove admin:", err);
    }
  };

  const tabs = [
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    {
      id: "completions",
      label: "Pending Completions",
      icon: Clock,
      count: pendingCompletions.length,
    },
    {
      id: "applications",
      label: "Applications",
      icon: FileText,
      count: pendingApplications.length,
    },
    {
      id: "chats",
      label: "All Chats",
      icon: MessageSquare,
      count: allChats.length,
    },
    {
      id: "requests",
      label: "Service Requests",
      icon: BarChart3,
      count: allRequests.length,
    },
    {
      id: "employees",
      label: "Employees",
      icon: Users,
      count: approvedEmployees.length,
    },
    ...(isSuperAdmin
      ? [{ id: "admin-management", label: "Admin Management", icon: Shield }]
      : []),
  ];

  return (
    <>
      <Header />
      <main className="bg-gradient-to-br from-ghbackground via-ghbackground-secondary to-ghbackground min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8 animate-slideInDown">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
              <BarChart3 size={40} className="text-ghaccent" /> Admin Dashboard
            </h1>
            <p className="text-ghforegroundlow">
              Manage completions, applications, chats, and service requests
              {isSuperAdmin && (
                <span className="ml-2 text-purple-400">(Super Admin)</span>
              )}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {loading ? (
              <div className="col-span-5 flex items-center justify-center gap-3 text-ghforegroundlow py-8">
                <Loader size={24} className="animate-spin" />
                <span>Loading dashboard...</span>
              </div>
            ) : error ? (
              <div className="col-span-5 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle size={24} />
                {error}
              </div>
            ) : (
              [
                {
                  icon: Clock,
                  label: "Pending Reviews",
                  value: pendingCompletions.length,
                  color: "orange",
                },
                {
                  icon: FileText,
                  label: "Pending Apps",
                  value: pendingApplications.length,
                  color: "yellow",
                },
                {
                  icon: MessageSquare,
                  label: "Active Chats",
                  value: allChats.filter((c) => !c.is_archived).length,
                  color: "blue",
                },
                {
                  icon: Users,
                  label: "Employees",
                  value: approvedEmployees.length,
                  color: "green",
                },
                {
                  icon: DollarSign,
                  label: "Total Revenue",
                  value: `$${Number(stats?.stats?.total_revenue || 0).toFixed(0)}`,
                  color: "purple",
                },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                const colorClasses = {
                  orange:
                    "bg-orange-900/20 border-orange-500/50 text-orange-400",
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
                    className={`rounded-xl border p-5 ${colorClasses[stat.color]} transition-all hover:scale-105`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-ghforegroundlow mb-1">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <Icon size={28} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-ghforegroundlow/20 pb-2">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-ghaccent/20 text-ghaccent border border-ghaccent/50"
                      : "text-ghforegroundlow hover:text-white hover:bg-ghforegroundlow/10 border border-transparent"
                  }`}
                >
                  <TabIcon size={18} />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        activeTab === tab.id
                          ? "bg-ghaccent text-white"
                          : "bg-ghforegroundlow/20"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <AnalyticsCharts analytics={analytics} />
            )}

            {/* Pending Completions */}
            {activeTab === "completions" && (
              <>
                {pendingCompletions.length === 0 ? (
                  <div className="text-center py-16 text-ghforegroundlow">
                    <CheckCircle
                      size={48}
                      className="mx-auto mb-4 opacity-30"
                    />
                    <p className="text-lg">No pending completion reviews</p>
                    <p className="text-sm opacity-70 mt-1">All caught up!</p>
                  </div>
                ) : (
                  pendingCompletions.map((completion) => (
                    <CompletionCard
                      key={completion.id}
                      completion={completion}
                      onApprove={handleApproveCompletion}
                      onReopen={handleReopenCompletion}
                    />
                  ))
                )}
              </>
            )}

            {/* Applications */}
            {activeTab === "applications" && (
              <>
                {pendingApplications.length === 0 ? (
                  <div className="text-center py-16 text-ghforegroundlow">
                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No pending applications</p>
                    <p className="text-sm opacity-70 mt-1">
                      All applications have been reviewed
                    </p>
                  </div>
                ) : (
                  pendingApplications.map((app) => (
                    <div
                      key={app.id}
                      className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6 animate-slideInUp"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                              <Gamepad2 size={20} className="text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {app.title}
                              </h3>
                              <p className="text-ghforegroundlow text-sm">
                                by <strong>{app.full_name}</strong> • {app.game}
                              </p>
                            </div>
                          </div>
                          {app.description && (
                            <p className="text-ghforegroundlow text-sm mb-3 line-clamp-2">
                              {app.description}
                            </p>
                          )}
                          <p className="text-xs text-ghforegroundlow">
                            Submitted:{" "}
                            {new Date(app.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApproveApp(app.id)}
                            className="btn-success px-5 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2"
                          >
                            <CheckCircle size={18} /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectApp(app.id)}
                            className="btn-danger px-5 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2"
                          >
                            <XCircle size={18} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* All Chats */}
            {activeTab === "chats" && (
              <>
                {allChats.length === 0 ? (
                  <div className="text-center py-16 text-ghforegroundlow">
                    <MessageSquare
                      size={48}
                      className="mx-auto mb-4 opacity-30"
                    />
                    <p className="text-lg">No chats yet</p>
                    <p className="text-sm opacity-70 mt-1">
                      Chats will appear when services start
                    </p>
                  </div>
                ) : (
                  allChats.map((chat) => (
                    <ChatCard
                      key={chat.id}
                      chat={chat}
                      onViewChat={handleViewChat}
                    />
                  ))
                )}
              </>
            )}

            {/* Service Requests */}
            {activeTab === "requests" && (
              <>
                {allRequests.length === 0 ? (
                  <div className="text-center py-16 text-ghforegroundlow">
                    <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No service requests yet</p>
                  </div>
                ) : (
                  allRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6 animate-slideInUp"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ghaccent to-purple-600 flex items-center justify-center">
                            <Gamepad2 size={20} className="text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {request.service_title}
                            </h3>
                            <p className="text-ghforegroundlow text-sm">
                              {request.requester_name} →{" "}
                              {request.employee_name || "Unassigned"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right mr-4">
                            <p className="text-green-400 font-bold flex items-center gap-1 justify-end">
                              <DollarSign size={14} />
                              {Number(request.amount || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-ghforegroundlow">
                              {new Date(
                                request.created_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Employees */}
            {activeTab === "employees" && (
              <>
                {approvedEmployees.length === 0 ? (
                  <div className="text-center py-16 text-ghforegroundlow">
                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No employees yet</p>
                  </div>
                ) : (
                  approvedEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="bg-ghbackground-secondary rounded-xl border border-ghforegroundlow/20 p-6 flex flex-col md:flex-row md:items-center justify-between animate-slideInUp"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <Users size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {employee.full_name}
                          </h3>
                          <p className="text-ghforegroundlow text-sm">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="text-right">
                          <p className="text-green-400 font-bold flex items-center gap-1 justify-end">
                            <DollarSign size={14} />
                            {Number(employee.wallet_balance || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-ghforegroundlow">
                            Wallet Balance
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 border border-green-500/50 text-green-400">
                          Active
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Admin Management (Super Admin Only) */}
            {activeTab === "admin-management" && isSuperAdmin && (
              <AdminManagement
                admins={admins}
                allUsers={allUsers}
                onMakeAdmin={handleMakeAdmin}
                onUpdateAdmin={handleUpdateAdmin}
                onRemoveAdmin={handleRemoveAdmin}
                loading={adminsLoading}
              />
            )}
          </div>
        </div>
      </main>

      {/* Chat Messages Modal */}
      {selectedChat && (
        <ChatMessagesModal
          chat={selectedChat}
          messages={loadingMessages ? [] : chatMessages}
          onClose={() => {
            setSelectedChat(null);
            setChatMessages([]);
          }}
        />
      )}
    </>
  );
}

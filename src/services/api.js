// API Base URL — uses current hostname so it works across LAN devices
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `http://${window.location.hostname}:3000/api`;

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  // [SESSION MANAGEMENT] Read token from sessionStorage (tab-scoped)
  const token = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    const error = new Error(errorData.error || "API Error");
    // Attach additional lockout/blocking information if present
    if (errorData.locked !== undefined) {
      error.locked = errorData.locked;
    }
    if (errorData.blocked !== undefined) {
      error.blocked = errorData.blocked;
    }
    if (errorData.remainingSeconds !== undefined) {
      error.remainingSeconds = errorData.remainingSeconds;
    }
    if (errorData.attemptsRemaining !== undefined) {
      error.attemptsRemaining = errorData.attemptsRemaining;
    }
    throw error;
  }

  return response.json();
};

// ==========================================
// AUTHENTICATION API
// ==========================================
export const AuthAPI = {
  register: (email, password, full_name) =>
    apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        full_name,
        accept_terms: true,
      }),
    }),

  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  adminLogin: (email, password) =>
    apiCall("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // [ADMIN AUDIT LOGS] Log admin logout on the server
  adminLogout: () => apiCall("/auth/admin-logout", { method: "POST" }),

  refreshToken: () => apiCall("/auth/refresh", { method: "POST" }),

  getCurrentUser: () => apiCall("/auth/me"),
};

// ==========================================
// GAMES API
// ==========================================
export const GamesAPI = {
  getAllGames: () => apiCall("/games"),

  getGame: (id) => apiCall(`/games/${id}`),

  getGameStats: (id) => apiCall(`/games/${id}/stats`),

  createGame: (gameData) =>
    apiCall("/games", {
      method: "POST",
      body: JSON.stringify(gameData),
    }),

  updateGame: (id, gameData) =>
    apiCall(`/games/${id}`, {
      method: "PUT",
      body: JSON.stringify(gameData),
    }),

  deleteGame: (id) =>
    apiCall(`/games/${id}`, {
      method: "DELETE",
    }),
};

// ==========================================
// USERS API
// ==========================================
export const UsersAPI = {
  getUser: (id) => apiCall(`/users/${id}`),

  updateUser: (id, userData) =>
    apiCall(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),
};

// ==========================================
// COACHES API
// ==========================================
export const CoachesAPI = {
  listCoaches: (gameId, limit = 10, offset = 0) => {
    const params = new URLSearchParams();
    if (gameId) params.append("game_id", gameId);
    params.append("limit", limit);
    params.append("offset", offset);
    return apiCall(`/coaches?${params}`);
  },

  getCoach: (id) => apiCall(`/coaches/${id}`),

  addSpecialization: (coachId, specData) =>
    apiCall(`/coaches/${coachId}/specializations`, {
      method: "POST",
      body: JSON.stringify(specData),
    }),
};

// ==========================================
// SERVICE APPLICATIONS API
// ==========================================
export const ApplicationsAPI = {
  submitApplication: (appData) =>
    apiCall("/applications", {
      method: "POST",
      body: JSON.stringify(appData),
    }),

  getPendingApplications: () => apiCall("/applications/pending"),

  getUserApplications: () => apiCall("/applications/my-applications"),

  updateApplication: (id, appData) =>
    apiCall(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(appData),
    }),

  approveApplication: (id, adminNotes) =>
    apiCall(`/applications/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ admin_notes: adminNotes }),
    }),

  rejectApplication: (id, reason) =>
    apiCall(`/applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// ==========================================
// SERVICES API
// ==========================================
export const ServicesAPI = {
  listServices: (gameId, employeeId, limit = 20, offset = 0) => {
    const params = new URLSearchParams();
    if (gameId) params.append("game_id", gameId);
    if (employeeId) params.append("employee_id", employeeId);
    params.append("limit", limit);
    params.append("offset", offset);
    return apiCall(`/services?${params}`);
  },

  getService: (id) => apiCall(`/services/${id}`),
};

// ==========================================
// SERVICE REQUESTS API
// ==========================================
export const RequestsAPI = {
  createRequest: (requestData) =>
    apiCall("/requests", {
      method: "POST",
      body: JSON.stringify(requestData),
    }),

  getRequest: (id) => apiCall(`/requests/${id}`),

  getEmployeeRequests: () => apiCall("/requests/employee/pending"),

  getUserRequests: () => apiCall("/requests/user/my-requests"),

  acceptRequest: (id, employeeResponse) =>
    apiCall(`/requests/${id}/accept`, {
      method: "POST",
      body: JSON.stringify({ employee_response: employeeResponse }),
    }),

  confirmRequest: (id) =>
    apiCall(`/requests/${id}/confirm`, {
      method: "POST",
    }),

  rejectRequest: (id) =>
    apiCall(`/requests/${id}/reject`, {
      method: "POST",
    }),

  completeRequest: (id, completionNotes) =>
    apiCall(`/requests/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ completion_notes: completionNotes }),
    }),

  cancelRequest: (id) =>
    apiCall(`/requests/${id}/cancel`, {
      method: "POST",
    }),
};

// ==========================================
// CHAT API
// ==========================================
export const ChatAPI = {
  listChats: () => apiCall("/chats"),

  getMessages: (chatId, limit = 50, offset = 0) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    params.append("offset", offset);
    return apiCall(`/chats/${chatId}/messages?${params}`);
  },

  sendMessage: (chatId, message) =>
    apiCall(`/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};

// ==========================================
// REVIEWS API
// ==========================================
export const ReviewsAPI = {
  submitReview: (reviewData) =>
    apiCall("/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    }),

  getCoachReviews: (coachId, limit = 10, offset = 0) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    params.append("offset", offset);
    return apiCall(`/reviews/${coachId}?${params}`);
  },
};

// ==========================================
// ADMIN API
// ==========================================
export const AdminAPI = {
  getDashboard: () => apiCall("/admin/dashboard"),

  listUsers: (limit = 20, offset = 0) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    params.append("offset", offset);
    return apiCall(`/admin/users?${params}`);
  },

  updateUserStatus: (userId, status) =>
    apiCall(`/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ account_status: status }),
    }),

  // [ACCOUNT BLOCKING] Unblock a user account
  unblockUser: (userId) =>
    apiCall(`/admin/users/${userId}/unblock`, {
      method: "PUT",
    }),

  // [ACCOUNT BLOCKING] Unblock an admin account
  unblockAdmin: (adminId) =>
    apiCall(`/admin/admins/${adminId}/unblock`, {
      method: "PUT",
    }),

  // [ACCOUNT BLOCKING] Get all blocked users and admins
  getBlockedUsers: () => apiCall("/admin/users/blocked"),

  // [ADMIN AUDIT LOGS] Get admin action logs
  getAdminLogs: (limit = 50, offset = 0) => {
    const params = new URLSearchParams();
    params.append("limit", limit);
    params.append("offset", offset);
    return apiCall(`/admin/logs?${params}`);
  },

  // Service completion review
  getPendingCompletions: () => apiCall("/admin/completions/pending"),

  approveCompletion: (id, adminNotes) =>
    apiCall(`/admin/completions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ admin_notes: adminNotes }),
    }),

  reopenCompletion: (id, adminNotes) =>
    apiCall(`/admin/completions/${id}/reopen`, {
      method: "POST",
      body: JSON.stringify({ admin_notes: adminNotes }),
    }),

  // Admin chat access
  getAllChats: (status) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    return apiCall(`/admin/chats?${params}`);
  },

  getChatMessages: (chatId) => apiCall(`/admin/chats/${chatId}/messages`),

  // Admin service requests
  getAllRequests: (status) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    return apiCall(`/admin/requests?${params}`);
  },

  // Analytics (range: 7, 30, or 365 days)
  getAnalytics: (range = 7) => {
    const params = new URLSearchParams();
    params.append("range", range);
    return apiCall(`/admin/analytics?${params}`);
  },

  // Super admin - admin management
  listAdmins: () => apiCall("/admin/admins"),

  createAdmin: (userId, role = "regular") =>
    apiCall("/admin/admins", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, role }),
    }),

  updateAdmin: (adminId, data) =>
    apiCall(`/admin/admins/${adminId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  removeAdmin: (adminId) =>
    apiCall(`/admin/admins/${adminId}`, {
      method: "DELETE",
    }),
};

// ==========================================
// NOTIFICATIONS API
// ==========================================
export const NotificationsAPI = {
  getNotifications: (unreadOnly = false) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append("unread_only", "true");
    return apiCall(`/notifications?${params}`);
  },

  markAsRead: (id) =>
    apiCall(`/notifications/${id}/read`, {
      method: "POST",
    }),

  markAllAsRead: () =>
    apiCall("/notifications/read-all", {
      method: "POST",
    }),

  getUnreadCount: () => apiCall("/notifications/unread-count"),
};

// ==========================================
// HEALTH CHECK
// ==========================================
export const HealthAPI = {
  check: () => apiCall("/health"),
};

import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ==========================================
// DATABASE CONFIGURATION
// ==========================================
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gamer_helpers",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// ==========================================
// MIDDLEWARE
// ==========================================

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Admin Verification Middleware
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

app.post("/api/auth/register", async (req, res) => {
  const { email, password, full_name, accept_terms } = req.body;

  if (!email || !password || !full_name || !accept_terms) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Check if email exists
    const [existing] = await conn.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await conn.execute(
      "INSERT INTO users (email, password, full_name, account_status) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, full_name, "active"]
    );

    const userId = result.insertId;

    // Generate token
    const token = jwt.sign(
      { id: userId, role: "user", email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: { id: userId, email, full_name },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.execute(
      "SELECT id, password, full_name, is_admin, is_employee FROM users WHERE email = ? AND account_status = ?",
      [email, "active"]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await conn.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    const token = jwt.sign(
      {
        id: user.id,
        role: user.is_admin ? "admin" : user.is_employee ? "employee" : "user",
        email,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email,
        full_name: user.full_name,
        is_admin: user.is_admin,
        is_employee: user.is_employee,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/auth/refresh", verifyToken, async (req, res) => {
  try {
    const newToken = jwt.sign(
      { id: req.userId, role: req.userRole },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({ token: newToken });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", verifyToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.execute(
      "SELECT id, email, full_name, is_admin, is_employee, wallet_balance FROM users WHERE id = ?",
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// GAMES ENDPOINTS
// ==========================================

app.get("/api/games", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [games] = await conn.execute(
      "SELECT * FROM games WHERE is_active = TRUE ORDER BY popularity_rank ASC"
    );

    res.json({ games });
  } catch (err) {
    console.error("Get games error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/games/:id", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();

    const [games] = await conn.execute(
      "SELECT * FROM games WHERE id = ? AND is_active = TRUE",
      [id]
    );

    if (games.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json({ game: games[0] });
  } catch (err) {
    console.error("Get game error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/games/:id/stats", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();

    const [stats] = await conn.execute(
      `SELECT 
        COUNT(DISTINCT ps.id) as total_services,
        COUNT(DISTINCT ps.employee_id) as total_coaches,
        AVG(ep.rating) as avg_coach_rating
       FROM games g
       LEFT JOIN published_services ps ON g.id = ps.game_id AND ps.is_active = TRUE
       LEFT JOIN employee_profiles ep ON ps.employee_id = ep.user_id
       WHERE g.id = ?`,
      [id]
    );

    res.json({ stats: stats[0] });
  } catch (err) {
    console.error("Get game stats error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/games", verifyToken, verifyAdmin, async (req, res) => {
  const { name, slug, description, genre, platform, popularity_rank } =
    req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: "Name and slug required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [result] = await conn.execute(
      `INSERT INTO games (name, slug, description, genre, platform, popularity_rank, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [name, slug, description, genre, platform, popularity_rank]
    );

    res.json({ success: true, game_id: result.insertId });
  } catch (err) {
    console.error("Create game error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.put("/api/games/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, genre, platform, popularity_rank, is_active } =
    req.body;

  let conn;
  try {
    conn = await pool.getConnection();

    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description) {
      updates.push("description = ?");
      values.push(description);
    }
    if (genre) {
      updates.push("genre = ?");
      values.push(genre);
    }
    if (platform) {
      updates.push("platform = ?");
      values.push(platform);
    }
    if (popularity_rank) {
      updates.push("popularity_rank = ?");
      values.push(popularity_rank);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);

    await conn.execute(
      `UPDATE games SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update game error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.delete("/api/games/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();

    await conn.execute("UPDATE games SET is_active = FALSE WHERE id = ?", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("Delete game error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// USER PROFILE ENDPOINTS
// ==========================================

app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();

    const [users] = await conn.execute(
      `SELECT id, full_name, email, profile_picture, wallet_balance, created_at, is_employee 
       FROM users WHERE id = ? AND account_status = 'active'`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Get employee profile if applicable
    if (user.is_employee) {
      const [empProfile] = await conn.execute(
        "SELECT bio, rating, total_reviews, total_services_completed FROM employee_profiles WHERE user_id = ?",
        [id]
      );

      if (empProfile.length > 0) {
        user.profile = empProfile[0];
      }
    }

    res.json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.put("/api/users/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { full_name, profile_picture, bio } = req.body;

  if (req.userId !== parseInt(id) && req.userRole !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    await conn.execute(
      "UPDATE users SET full_name = ?, profile_picture = ?, updated_at = NOW() WHERE id = ?",
      [full_name, profile_picture, id]
    );

    // Update employee profile if provided
    if (bio) {
      await conn.execute(
        "UPDATE employee_profiles SET bio = ? WHERE user_id = ?",
        [bio, id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// EMPLOYEE/COACH ENDPOINTS
// ==========================================

app.get("/api/coaches", async (req, res) => {
  const { game_id, limit = 10, offset = 0 } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();

    let query = `
      SELECT u.id, u.full_name, u.profile_picture, ep.rating, ep.total_reviews, ep.total_services_completed
      FROM users u
      JOIN employee_profiles ep ON u.id = ep.user_id
      WHERE u.is_employee = TRUE AND ep.is_verified = TRUE AND ep.status = 'active'
    `;

    const params = [];

    if (game_id) {
      query += ` AND u.id IN (
        SELECT employee_id FROM employee_specializations WHERE game_id = ?
      )`;
      params.push(game_id);
    }

    query += ` ORDER BY ep.rating DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [coaches] = await conn.execute(query, params);

    res.json({ coaches });
  } catch (err) {
    console.error("Get coaches error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/coaches/:id", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();

    const [users] = await conn.execute(
      `SELECT u.id, u.full_name, u.profile_picture
       FROM users u
       WHERE u.id = ? AND u.is_employee = TRUE`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Coach not found" });
    }

    const coach = users[0];

    // Get profile
    const [profiles] = await conn.execute(
      `SELECT bio, rating, total_reviews, total_services_completed, rank_tier, years_experience
       FROM employee_profiles WHERE user_id = ?`,
      [id]
    );

    if (profiles.length > 0) {
      coach.profile = profiles[0];
    }

    // Get specializations
    const [specs] = await conn.execute(
      `SELECT g.id, g.name, es.rank_in_game, es.years_in_game, es.hourly_rate
       FROM employee_specializations es
       JOIN games g ON es.game_id = g.id
       WHERE es.employee_id = ?`,
      [id]
    );

    coach.specializations = specs;

    // Get services
    const [services] = await conn.execute(
      `SELECT id, title, price FROM published_services WHERE employee_id = ? AND is_active = TRUE`,
      [id]
    );

    coach.services = services;

    res.json({ coach });
  } catch (err) {
    console.error("Get coach detail error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/coaches/:id/specializations", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { game_id, rank_in_game, years_in_game, hourly_rate, is_primary } =
    req.body;

  if (req.userId !== parseInt(id) && req.userRole !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // If this is primary, unset others
    if (is_primary) {
      await conn.execute(
        "UPDATE employee_specializations SET is_primary = FALSE WHERE employee_id = ?",
        [id]
      );
    }

    await conn.execute(
      `INSERT INTO employee_specializations (employee_id, game_id, rank_in_game, years_in_game, hourly_rate, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rank_in_game = ?, years_in_game = ?, hourly_rate = ?, is_primary = ?`,
      [
        id,
        game_id,
        rank_in_game,
        years_in_game,
        hourly_rate,
        is_primary,
        rank_in_game,
        years_in_game,
        hourly_rate,
        is_primary,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Add specialization error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// SERVICE APPLICATIONS ENDPOINTS
// ==========================================

app.post("/api/applications", verifyToken, async (req, res) => {
  const { game_id, title, description, price } = req.body;

  if (!game_id || !title || !description || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [result] = await conn.execute(
      `INSERT INTO service_applications (user_id, game_id, title, description, price, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [req.userId, game_id, title, description, price]
    );

    res.json({ success: true, application_id: result.insertId });
  } catch (err) {
    console.error("Create application error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get(
  "/api/applications/pending",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();

      const [apps] = await conn.execute(`
      SELECT 
        sa.id, sa.user_id, u.full_name, u.email, g.name as game,
        sa.title, sa.price, sa.submitted_at,
        DATEDIFF(NOW(), sa.submitted_at) as days_pending
      FROM service_applications sa
      JOIN users u ON sa.user_id = u.id
      JOIN games g ON sa.game_id = g.id
      WHERE sa.status = 'pending'
      ORDER BY sa.submitted_at ASC
    `);

      res.json({ applications: apps });
    } catch (err) {
      console.error("Get pending applications error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  }
);

app.post(
  "/api/applications/:id/approve",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { admin_notes } = req.body;

    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // Update application status
      const [apps] = await conn.execute(
        "SELECT user_id, game_id, title, description, price FROM service_applications WHERE id = ?",
        [id]
      );

      if (apps.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Application not found" });
      }

      const app = apps[0];

      await conn.execute(
        "UPDATE service_applications SET status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
        ["approved", admin_notes, req.userId, id]
      );

      // Create published service
      const [result] = await conn.execute(
        `INSERT INTO published_services (employee_id, application_id, game_id, title, description, price, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [app.user_id, id, app.game_id, app.title, app.description, app.price]
      );

      // Update user to employee
      await conn.execute("UPDATE users SET is_employee = TRUE WHERE id = ?", [
        app.user_id,
      ]);

      // Create employee profile if not exists
      await conn.execute(
        `INSERT INTO employee_profiles (user_id, status, is_verified)
       VALUES (?, 'active', FALSE)
       ON DUPLICATE KEY UPDATE status = 'active'`,
        [app.user_id]
      );

      await conn.commit();
      res.json({ success: true, service_id: result.insertId });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error("Approve application error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  }
);

app.post(
  "/api/applications/:id/reject",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    let conn;
    try {
      conn = await pool.getConnection();

      await conn.execute(
        "UPDATE service_applications SET status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
        ["rejected", reason, req.userId, id]
      );

      res.json({ success: true });
    } catch (err) {
      console.error("Reject application error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  }
);

// ==========================================
// PUBLISHED SERVICES ENDPOINTS
// ==========================================

app.get("/api/services", async (req, res) => {
  const { game_id, employee_id, limit = 20, offset = 0 } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();

    let query = `
      SELECT ps.*, u.full_name, u.profile_picture, ep.rating, g.name as game_name
      FROM published_services ps
      JOIN users u ON ps.employee_id = u.id
      JOIN employee_profiles ep ON u.id = ep.user_id
      JOIN games g ON ps.game_id = g.id
      WHERE ps.is_active = TRUE
    `;

    const params = [];

    if (game_id) {
      query += " AND ps.game_id = ?";
      params.push(game_id);
    }

    if (employee_id) {
      query += " AND ps.employee_id = ?";
      params.push(employee_id);
    }

    query += " ORDER BY ps.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [services] = await conn.execute(query, params);

    res.json({ services });
  } catch (err) {
    console.error("Get services error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();

    const [services] = await conn.execute(
      `SELECT ps.*, u.full_name, u.profile_picture, ep.rating, ep.total_reviews, g.name as game_name
       FROM published_services ps
       JOIN users u ON ps.employee_id = u.id
       JOIN employee_profiles ep ON u.id = ep.user_id
       JOIN games g ON ps.game_id = g.id
       WHERE ps.id = ? AND ps.is_active = TRUE`,
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json({ service: services[0] });
  } catch (err) {
    console.error("Get service error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// SERVICE REQUESTS ENDPOINTS
// ==========================================

app.post("/api/requests", verifyToken, async (req, res) => {
  const { published_service_id, service_details } = req.body;

  if (!published_service_id || !service_details) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Get service details
    const [services] = await conn.execute(
      "SELECT employee_id, price FROM published_services WHERE id = ?",
      [published_service_id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    const service = services[0];

    const [result] = await conn.execute(
      `INSERT INTO service_requests 
       (published_service_id, requester_user_id, employee_user_id, service_details, amount, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        published_service_id,
        req.userId,
        service.employee_id,
        service_details,
        service.price,
      ]
    );

    res.json({ success: true, request_id: result.insertId });
  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/requests/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();

    const [requests] = await conn.execute(
      `SELECT sr.*, ps.title, u_emp.full_name as employee_name
       FROM service_requests sr
       JOIN published_services ps ON sr.published_service_id = ps.id
       JOIN users u_emp ON sr.employee_user_id = u_emp.id
       WHERE sr.id = ?`,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ request: requests[0] });
  } catch (err) {
    console.error("Get request error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/requests/:id/accept", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { employee_response } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Update request
    await conn.execute(
      `UPDATE service_requests 
       SET status = 'accepted', employee_response = ?, initial_acceptance = TRUE, accepted_at = NOW()
       WHERE id = ?`,
      [employee_response, id]
    );

    // Create chat
    const [chatResult] = await conn.execute(
      "INSERT INTO chats (service_request_id, is_archived) VALUES (?, FALSE)",
      [id]
    );

    await conn.commit();
    res.json({ success: true, chat_id: chatResult.insertId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Accept request error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/requests/:id/reject", verifyToken, async (req, res) => {
  const { id } = req.params;

  let conn;
  try {
    conn = await pool.getConnection();

    await conn.execute("UPDATE service_requests SET status = ? WHERE id = ?", [
      "cancelled",
      id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/requests/:id/complete", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { completion_notes } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();

    await conn.execute(
      `UPDATE service_requests SET status = 'completed', completed_at = NOW() WHERE id = ?`,
      [id]
    );

    await conn.execute(
      `INSERT INTO service_completions (service_request_id, employee_completion_notes, status)
       VALUES (?, ?, 'pending_review')`,
      [id, completion_notes]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Complete request error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// CHAT/MESSAGING ENDPOINTS
// ==========================================

app.get("/api/chats", verifyToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [chats] = await conn.execute(
      `
      SELECT c.id, sr.published_service_id, ps.title as service_title,
             u_emp.full_name as employee_name, u_req.full_name as requester_name,
             c.created_at, c.is_archived,
             (SELECT message FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chats c
      JOIN service_requests sr ON c.service_request_id = sr.id
      JOIN published_services ps ON sr.published_service_id = ps.id
      JOIN users u_emp ON sr.employee_user_id = u_emp.id
      JOIN users u_req ON sr.requester_user_id = u_req.id
      WHERE sr.requester_user_id = ? OR sr.employee_user_id = ?
      ORDER BY c.created_at DESC
    `,
      [req.userId, req.userId]
    );

    res.json({ chats });
  } catch (err) {
    console.error("Get chats error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/chats/:id/messages", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  let conn;
  try {
    conn = await pool.getConnection();

    const [messages] = await conn.execute(
      `SELECT cm.*, u.full_name, u.profile_picture
       FROM chat_messages cm
       JOIN users u ON cm.sender_user_id = u.id
       WHERE cm.chat_id = ?
       ORDER BY cm.created_at ASC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );

    res.json({ messages });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/chats/:id/messages", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [result] = await conn.execute(
      "INSERT INTO chat_messages (chat_id, sender_user_id, message) VALUES (?, ?, ?)",
      [id, req.userId, message]
    );

    res.json({ success: true, message_id: result.insertId });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// REVIEWS & RATINGS ENDPOINTS
// ==========================================

app.post("/api/reviews", verifyToken, async (req, res) => {
  const { service_request_id, rating, review_text } = req.body;

  if (!service_request_id || !rating) {
    return res
      .status(400)
      .json({ error: "Service request ID and rating required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Get the service request details
    const [requests] = await conn.execute(
      "SELECT employee_user_id FROM service_requests WHERE id = ?",
      [service_request_id]
    );

    if (requests.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Service request not found" });
    }

    const employeeId = requests[0].employee_user_id;

    // Create review
    await conn.execute(
      `INSERT INTO reviews (service_request_id, reviewer_user_id, reviewed_user_id, rating, review_text)
       VALUES (?, ?, ?, ?, ?)`,
      [service_request_id, req.userId, employeeId, rating, review_text]
    );

    // Update employee profile ratings
    const [ratings] = await conn.execute(
      "SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewed_user_id = ?",
      [employeeId]
    );

    await conn.execute(
      "UPDATE employee_profiles SET rating = ?, total_reviews = ? WHERE user_id = ?",
      [ratings[0].avg_rating || 0, ratings[0].total, employeeId]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Create review error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/reviews/:coach_id", async (req, res) => {
  const { coach_id } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  let conn;
  try {
    conn = await pool.getConnection();

    const [reviews] = await conn.execute(
      `SELECT r.*, u.full_name, u.profile_picture
       FROM reviews r
       JOIN users u ON r.reviewer_user_id = u.id
       WHERE r.reviewed_user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [coach_id, parseInt(limit), parseInt(offset)]
    );

    res.json({ reviews });
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// ADMIN ANALYTICS ENDPOINTS
// ==========================================

app.get("/api/admin/dashboard", verifyToken, verifyAdmin, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    // Total counts
    const [totals] = await conn.execute(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_employee = TRUE) as total_coaches,
        (SELECT COUNT(*) FROM service_requests WHERE status = 'completed') as completed_services,
        (SELECT SUM(amount) FROM transactions WHERE status = 'completed') as total_revenue
    `);

    // Pending applications
    const [pending] = await conn.execute(
      "SELECT COUNT(*) as count FROM service_applications WHERE status = ?",
      ["pending"]
    );

    // Active requests
    const [active] = await conn.execute(
      `SELECT COUNT(*) as count FROM service_requests 
       WHERE status IN ('pending', 'accepted', 'in_progress')`
    );

    res.json({
      stats: totals[0],
      pending_applications: pending[0].count,
      active_requests: active[0].count,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();

    const [users] = await conn.execute(
      `
      SELECT id, email, full_name, is_employee, account_status, wallet_balance, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `,
      [parseInt(limit), parseInt(offset)]
    );

    res.json({ users });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.put(
  "/api/admin/users/:id/status",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { account_status } = req.body;

    if (!["active", "suspended", "banned"].includes(account_status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let conn;
    try {
      conn = await pool.getConnection();

      await conn.execute("UPDATE users SET account_status = ? WHERE id = ?", [
        account_status,
        id,
      ]);

      res.json({ success: true });
    } catch (err) {
      console.error("Update user status error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  }
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "GamerHelpers API is running" });
});

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GamerHelpers API running on http://localhost:${PORT}`);
});

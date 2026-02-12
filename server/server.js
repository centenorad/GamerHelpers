import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(204);
  }
  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.options(/.*/, (req, res) => {
  res.sendStatus(200);
});

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
// LOGIN ATTEMPT TRACKING (Rate Limiting)
// ==========================================
const loginAttempts = new Map(); // email -> { count, lastAttempt, lockedUntil }
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window to count attempts

const checkLoginAttempts = (email) => {
  const attempts = loginAttempts.get(email);
  if (!attempts) return { allowed: true };

  const now = Date.now();

  // Check if account is locked
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
    return {
      allowed: false,
      reason: `Account locked. Try again in ${remainingTime} minute${remainingTime !== 1 ? "s" : ""}.`,
      remainingSeconds: Math.ceil((attempts.lockedUntil - now) / 1000),
    };
  }

  // Reset if lockout has expired
  if (attempts.lockedUntil && now >= attempts.lockedUntil) {
    loginAttempts.delete(email);
    return { allowed: true };
  }

  return { allowed: true };
};

const recordFailedAttempt = (email) => {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (!attempts) {
    loginAttempts.set(email, { count: 1, lastAttempt: now, lockedUntil: null });
    return { locked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS - 1 };
  }

  // Reset count if last attempt was outside the window
  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(email, { count: 1, lastAttempt: now, lockedUntil: null });
    return { locked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS - 1 };
  }

  // Increment count
  attempts.count += 1;
  attempts.lastAttempt = now;

  // Lock account if max attempts reached
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_DURATION;
    loginAttempts.set(email, attempts);
    return { locked: true, lockoutMinutes: LOCKOUT_DURATION / 1000 / 60 };
  }

  loginAttempts.set(email, attempts);
  return {
    locked: false,
    attemptsRemaining: MAX_LOGIN_ATTEMPTS - attempts.count,
  };
};

const clearLoginAttempts = (email) => {
  loginAttempts.delete(email);
};

// Clean up old entries periodically (every 10 minutes)
setInterval(
  () => {
    const now = Date.now();
    for (const [email, attempts] of loginAttempts.entries()) {
      // Remove entries that are expired and not locked
      if (
        !attempts.lockedUntil &&
        now - attempts.lastAttempt > ATTEMPT_WINDOW
      ) {
        loginAttempts.delete(email);
      }
      // Remove entries where lockout has expired
      if (attempts.lockedUntil && now > attempts.lockedUntil) {
        loginAttempts.delete(email);
      }
    }
  },
  10 * 60 * 1000,
);

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
      process.env.JWT_SECRET || "your-secret-key",
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
      [email],
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await conn.execute(
      "INSERT INTO users (email, password, full_name, account_status) VALUES (?, ?, ?, ?)",
      [email, hashedPassword, full_name, "active"],
    );

    const userId = result.insertId;

    // Generate token
    const token = jwt.sign(
      { id: userId, role: "user", email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
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

  // Check if user is locked out due to too many failed attempts
  const attemptCheck = checkLoginAttempts(email);
  if (!attemptCheck.allowed) {
    return res.status(429).json({
      error: attemptCheck.reason,
      remainingSeconds: attemptCheck.remainingSeconds,
      locked: true,
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.execute(
      "SELECT id, password, full_name, is_employee FROM users WHERE email = ? AND account_status = ?",
      [email, "active"],
    );

    if (rows.length === 0) {
      // Record failed attempt for non-existent user (to prevent email enumeration)
      const result = recordFailedAttempt(email);
      if (result.locked) {
        return res.status(429).json({
          error: `Too many failed login attempts. Account locked for ${result.lockoutMinutes} minutes.`,
          locked: true,
        });
      }
      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Record failed attempt for wrong password
      const result = recordFailedAttempt(email);
      if (result.locked) {
        return res.status(429).json({
          error: `Too many failed login attempts. Account locked for ${result.lockoutMinutes} minutes.`,
          locked: true,
        });
      }
      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    // Clear login attempts on successful login
    clearLoginAttempts(email);

    // Update last login
    await conn.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    const token = jwt.sign(
      {
        id: user.id,
        role: user.is_employee ? "employee" : "user",
        email,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email,
        full_name: user.full_name,
        is_admin: false,
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

// Admin-specific login endpoint
app.post("/api/auth/admin-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // Check if admin is locked out due to too many failed attempts
  const attemptCheck = checkLoginAttempts(email);
  if (!attemptCheck.allowed) {
    return res.status(429).json({
      error: attemptCheck.reason,
      remainingSeconds: attemptCheck.remainingSeconds,
      locked: true,
    });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    const [rows] = await conn.execute(
      "SELECT id, password, full_name, role, is_active FROM admin WHERE email = ? AND is_active = TRUE",
      [email],
    );

    if (rows.length === 0) {
      // Record failed attempt
      const result = recordFailedAttempt(email);
      if (result.locked) {
        return res.status(429).json({
          error: `Too many failed login attempts. Account locked for ${result.lockoutMinutes} minutes.`,
          locked: true,
        });
      }
      return res.status(401).json({
        error: "Invalid credentials or not an admin",
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      // Record failed attempt for wrong password
      const result = recordFailedAttempt(email);
      if (result.locked) {
        return res.status(429).json({
          error: `Too many failed login attempts. Account locked for ${result.lockoutMinutes} minutes.`,
          locked: true,
        });
      }
      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    // Clear login attempts on successful login
    clearLoginAttempts(email);

    const token = jwt.sign(
      {
        id: admin.id,
        role: "admin",
        email,
        adminRole: admin.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email,
        full_name: admin.full_name,
        is_admin: true,
        is_employee: false,
        admin_role: admin.role,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
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
      { expiresIn: "7d" },
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

    // Check if user is admin or regular user based on role
    if (req.userRole === "admin") {
      const [rows] = await conn.execute(
        "SELECT id, email, full_name, role, is_active FROM admin WHERE id = ?",
        [req.userId],
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const admin = rows[0];
      res.json({
        user: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          is_admin: true,
          is_employee: false,
          admin_role: admin.role,
        },
      });
    } else {
      const [rows] = await conn.execute(
        "SELECT id, email, full_name, is_employee, wallet_balance FROM users WHERE id = ?",
        [req.userId],
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = rows[0];
      res.json({ user: { ...user, is_admin: false } });
    }
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
      "SELECT * FROM games WHERE is_active = TRUE ORDER BY popularity_rank ASC",
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
      [id],
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
      [id],
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
      [name, slug, description, genre, platform, popularity_rank],
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
      values,
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
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Get employee profile if applicable
    if (user.is_employee) {
      const [empProfile] = await conn.execute(
        "SELECT bio, rating, total_reviews, total_services_completed FROM employee_profiles WHERE user_id = ?",
        [id],
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
      [full_name, profile_picture, id],
    );

    // Update employee profile if provided
    if (bio) {
      await conn.execute(
        "UPDATE employee_profiles SET bio = ? WHERE user_id = ?",
        [bio, id],
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
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Coach not found" });
    }

    const coach = users[0];

    // Get profile
    const [profiles] = await conn.execute(
      `SELECT bio, rating, total_reviews, total_services_completed, rank_tier, years_experience
       FROM employee_profiles WHERE user_id = ?`,
      [id],
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
      [id],
    );

    coach.specializations = specs;

    // Get services
    const [services] = await conn.execute(
      `SELECT id, title, price FROM published_services WHERE employee_id = ? AND is_active = TRUE`,
      [id],
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
        [id],
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
      ],
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
      [req.userId, game_id, title, description, price],
    );

    res.json({ success: true, application_id: result.insertId });
  } catch (err) {
    console.error("Create application error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/applications/my-applications", verifyToken, async (req, res) => {
  const userId = req.userId;
  let conn;
  try {
    conn = await pool.getConnection();

    const [apps] = await conn.execute(
      `
      SELECT 
        sa.id, sa.user_id, sa.game_id, g.name as game,
        sa.title, sa.description, sa.price, sa.status,
        sa.submitted_at, sa.updated_at
      FROM service_applications sa
      JOIN games g ON sa.game_id = g.id
      WHERE sa.user_id = ?
      ORDER BY sa.submitted_at DESC
    `,
      [userId],
    );

    res.json({ applications: apps });
  } catch (err) {
    console.error("Get user applications error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.put("/api/applications/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, price } = req.body;
  const userId = req.userId;

  if (!title || !description || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Check if user owns this application
    const [appCheck] = await conn.execute(
      "SELECT user_id FROM service_applications WHERE id = ?",
      [id],
    );

    if (appCheck.length === 0 || appCheck[0].user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update application and set status back to pending
    await conn.execute(
      `UPDATE service_applications 
       SET title = ?, description = ?, price = ?, status = 'pending', updated_at = NOW()
       WHERE id = ?`,
      [title, description, price, id],
    );

    res.json({
      success: true,
      message: "Application updated and pending reapproval",
    });
  } catch (err) {
    console.error("Update application error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post(
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
  },
);

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
  },
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
        [id],
      );

      if (apps.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Application not found" });
      }

      const app = apps[0];

      await conn.execute(
        "UPDATE service_applications SET status = ?, admin_notes = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
        ["approved", admin_notes, req.userId, id],
      );

      // Create published service
      const [result] = await conn.execute(
        `INSERT INTO published_services (employee_id, application_id, game_id, title, description, price, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
        [app.user_id, id, app.game_id, app.title, app.description, app.price],
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
        [app.user_id],
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
  },
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
        ["rejected", reason, req.userId, id],
      );

      res.json({ success: true });
    } catch (err) {
      console.error("Reject application error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  },
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
      [id],
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
      [published_service_id],
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
      ],
    );

    res.json({ success: true, request_id: result.insertId });
  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/requests/employee/pending", verifyToken, async (req, res) => {
  const employeeId = req.userId;
  let conn;
  try {
    conn = await pool.getConnection();

    const [requests] = await conn.execute(
      `SELECT 
        sr.id, sr.published_service_id, sr.requester_user_id, sr.status,
        sr.service_details, sr.amount, sr.created_at,
        ps.title, ps.description,
        u_req.full_name as requester_name, u_req.profile_picture,
        g.name as game_name
       FROM service_requests sr
       JOIN published_services ps ON sr.published_service_id = ps.id
       JOIN users u_req ON sr.requester_user_id = u_req.id
       JOIN games g ON ps.game_id = g.id
       WHERE sr.employee_user_id = ?
       ORDER BY sr.created_at DESC`,
      [employeeId],
    );

    res.json({ requests });
  } catch (err) {
    console.error("Get employee requests error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/requests/user/my-requests", verifyToken, async (req, res) => {
  const userId = req.userId;
  let conn;
  try {
    conn = await pool.getConnection();

    const [requests] = await conn.execute(
      `SELECT 
        sr.id, sr.published_service_id, sr.status, sr.service_details, sr.amount, sr.created_at,
        ps.title, ps.description, ps.employee_id,
        u_emp.full_name as employee_name, u_emp.profile_picture,
        g.name as game_name
       FROM service_requests sr
       JOIN published_services ps ON sr.published_service_id = ps.id
       JOIN users u_emp ON ps.employee_id = u_emp.id
       JOIN games g ON ps.game_id = g.id
       WHERE sr.requester_user_id = ?
       ORDER BY sr.created_at DESC`,
      [userId],
    );

    res.json({ requests });
  } catch (err) {
    console.error("Get user requests error:", err);
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
      [id],
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

    // Verify the employee owns this request
    const [requests] = await conn.execute(
      "SELECT employee_user_id, requester_user_id, published_service_id FROM service_requests WHERE id = ?",
      [id],
    );

    if (requests.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Request not found" });
    }

    if (requests[0].employee_user_id !== req.userId) {
      await conn.rollback();
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update request to employee_accepted status
    await conn.execute(
      `UPDATE service_requests 
       SET status = 'employee_accepted', employee_response = ?, initial_acceptance = TRUE, accepted_at = NOW()
       WHERE id = ?`,
      [employee_response, id],
    );

    // Create notification for the requester
    const [service] = await conn.execute(
      "SELECT title FROM published_services WHERE id = ?",
      [requests[0].published_service_id],
    );

    await conn.execute(
      `INSERT INTO notifications (user_id, notification_type, related_entity_type, related_entity_id, title, message)
       VALUES (?, 'request_accepted', 'service_request', ?, 'Service Request Accepted', ?)`,
      [
        requests[0].requester_user_id,
        id,
        `Your request for "${service[0]?.title}" has been accepted! Please confirm to start the service.`,
      ],
    );

    await conn.commit();
    res.json({
      success: true,
      message: "Request accepted. Waiting for user confirmation.",
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Accept request error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// User confirms the accepted request to start service
app.post("/api/requests/:id/confirm", verifyToken, async (req, res) => {
  const { id } = req.params;

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Verify the user owns this request
    const [requests] = await conn.execute(
      "SELECT requester_user_id, employee_user_id, status, published_service_id FROM service_requests WHERE id = ?",
      [id],
    );

    if (requests.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Request not found" });
    }

    if (requests[0].requester_user_id !== req.userId) {
      await conn.rollback();
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (requests[0].status !== "employee_accepted") {
      await conn.rollback();
      return res
        .status(400)
        .json({ error: "Request must be accepted by employee first" });
    }

    // Update request to in_progress and create chat
    await conn.execute(
      `UPDATE service_requests 
       SET status = 'in_progress', final_acceptance = TRUE, user_confirmed_at = NOW(), started_at = NOW()
       WHERE id = ?`,
      [id],
    );

    // Create chat
    const [chatResult] = await conn.execute(
      "INSERT INTO chats (service_request_id, is_archived) VALUES (?, FALSE)",
      [id],
    );

    // Create notification for the employee
    const [service] = await conn.execute(
      "SELECT title FROM published_services WHERE id = ?",
      [requests[0].published_service_id],
    );

    await conn.execute(
      `INSERT INTO notifications (user_id, notification_type, related_entity_type, related_entity_id, title, message)
       VALUES (?, 'service_started', 'service_request', ?, 'Service Started', ?)`,
      [
        requests[0].employee_user_id,
        id,
        `The user has confirmed the request for "${service[0]?.title}". Chat is now open!`,
      ],
    );

    await conn.commit();
    res.json({
      success: true,
      chat_id: chatResult.insertId,
      message: "Service started. Chat is now open.",
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Confirm request error:", err);
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
    await conn.beginTransaction();

    // Verify the employee owns this request
    const [requests] = await conn.execute(
      "SELECT employee_user_id, requester_user_id, published_service_id, status FROM service_requests WHERE id = ?",
      [id],
    );

    if (requests.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Request not found" });
    }

    if (requests[0].employee_user_id !== req.userId) {
      await conn.rollback();
      return res
        .status(403)
        .json({ error: "Only the employee can mark completion" });
    }

    if (requests[0].status !== "in_progress") {
      await conn.rollback();
      return res
        .status(400)
        .json({ error: "Service must be in progress to complete" });
    }

    // Update to pending_completion (awaiting admin review)
    await conn.execute(
      `UPDATE service_requests SET status = 'pending_completion', completed_at = NOW() WHERE id = ?`,
      [id],
    );

    await conn.execute(
      `INSERT INTO service_completions (service_request_id, employee_completion_notes, status, submitted_by_employee_at)
       VALUES (?, ?, 'pending_review', NOW())`,
      [id, completion_notes],
    );

    // Notify admin about completion request (we'll also notify requester)
    const [service] = await conn.execute(
      "SELECT title FROM published_services WHERE id = ?",
      [requests[0].published_service_id],
    );

    await conn.execute(
      `INSERT INTO notifications (user_id, notification_type, related_entity_type, related_entity_id, title, message)
       VALUES (?, 'completion_requested', 'service_request', ?, 'Completion Pending Review', ?)`,
      [
        requests[0].requester_user_id,
        id,
        `The employee has marked "${service[0]?.title}" as complete. Admin will review shortly.`,
      ],
    );

    await conn.commit();
    res.json({
      success: true,
      message: "Completion submitted for admin review",
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Complete request error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.post("/api/requests/:id/cancel", verifyToken, async (req, res) => {
  const { id } = req.params;

  let conn;
  try {
    conn = await pool.getConnection();

    // Check if user is authorized (requester or employee)
    const [requests] = await conn.execute(
      "SELECT requester_user_id, employee_user_id FROM service_requests WHERE id = ?",
      [id],
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const request = requests[0];
    if (
      req.userId !== request.requester_user_id &&
      req.userId !== request.employee_user_id
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await conn.execute(
      `UPDATE service_requests SET status = 'cancelled' WHERE id = ?`,
      [id],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Cancel request error:", err);
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
      [req.userId, req.userId],
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
      [id, parseInt(limit), parseInt(offset)],
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
      [id, req.userId, message],
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
      [service_request_id],
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
      [service_request_id, req.userId, employeeId, rating, review_text],
    );

    // Update employee profile ratings
    const [ratings] = await conn.execute(
      "SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewed_user_id = ?",
      [employeeId],
    );

    await conn.execute(
      "UPDATE employee_profiles SET rating = ?, total_reviews = ? WHERE user_id = ?",
      [ratings[0].avg_rating || 0, ratings[0].total, employeeId],
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
      [coach_id, parseInt(limit), parseInt(offset)],
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
      ["pending"],
    );

    // Active requests
    const [active] = await conn.execute(
      `SELECT COUNT(*) as count FROM service_requests 
       WHERE status IN ('pending', 'accepted', 'in_progress')`,
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
      [parseInt(limit), parseInt(offset)],
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
  },
);

// ==========================================
// ADMIN SERVICE COMPLETION REVIEW ENDPOINTS
// ==========================================

// Get all pending completions for admin review
app.get(
  "/api/admin/completions/pending",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();

      const [completions] = await conn.execute(`
      SELECT 
        sc.id, sc.service_request_id, sc.employee_completion_notes, sc.status, sc.submitted_by_employee_at,
        sr.amount, sr.service_details,
        ps.title as service_title, g.name as game_name,
        u_emp.full_name as employee_name, u_emp.id as employee_id,
        u_req.full_name as requester_name, u_req.id as requester_id,
        c.id as chat_id
      FROM service_completions sc
      JOIN service_requests sr ON sc.service_request_id = sr.id
      JOIN published_services ps ON sr.published_service_id = ps.id
      JOIN games g ON ps.game_id = g.id
      JOIN users u_emp ON sr.employee_user_id = u_emp.id
      JOIN users u_req ON sr.requester_user_id = u_req.id
      LEFT JOIN chats c ON sr.id = c.service_request_id
      WHERE sc.status = 'pending_review'
      ORDER BY sc.submitted_by_employee_at ASC
    `);

      res.json({ completions });
    } catch (err) {
      console.error("Get pending completions error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  },
);

// Admin approves completion and closes service (triggers payment)
app.post(
  "/api/admin/completions/:id/approve",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { admin_notes } = req.body;

    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // Get completion details
      const [completions] = await conn.execute(
        `SELECT sc.*, sr.employee_user_id, sr.requester_user_id, sr.amount, sr.published_service_id
       FROM service_completions sc
       JOIN service_requests sr ON sc.service_request_id = sr.id
       WHERE sc.id = ?`,
        [id],
      );

      if (completions.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Completion record not found" });
      }

      const completion = completions[0];
      const commissionRate = 0.1; // 10% platform fee
      const commissionAmount = completion.amount * commissionRate;
      const employeeEarnings = completion.amount - commissionAmount;

      // Update completion status (use null for undefined values)
      await conn.execute(
        `UPDATE service_completions 
       SET status = 'closed', admin_review_notes = ?, reviewed_by_admin = ?, reviewed_at = NOW(), closed_at = NOW()
       WHERE id = ?`,
        [admin_notes || null, req.userId || null, id],
      );

      // Update service request to closed
      await conn.execute(
        `UPDATE service_requests SET status = 'closed', closed_at = NOW() WHERE id = ?`,
        [completion.service_request_id],
      );

      // Archive the chat
      await conn.execute(
        `UPDATE chats SET is_archived = TRUE, archived_at = NOW() WHERE service_request_id = ?`,
        [completion.service_request_id],
      );

      // Create transaction record
      await conn.execute(
        `INSERT INTO transactions (service_request_id, from_user_id, to_user_id, amount, commission_amount, transaction_type, status, completed_at)
       VALUES (?, ?, ?, ?, ?, 'service_payment', 'completed', NOW())`,
        [
          completion.service_request_id,
          completion.requester_user_id,
          completion.employee_user_id,
          completion.amount,
          commissionAmount,
        ],
      );

      // Update employee wallet balance
      await conn.execute(
        `UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`,
        [employeeEarnings, completion.employee_user_id],
      );

      // Update employee stats
      await conn.execute(
        `UPDATE employee_profiles SET total_services_completed = total_services_completed + 1 WHERE user_id = ?`,
        [completion.employee_user_id],
      );

      // Get service title for notifications
      const [service] = await conn.execute(
        "SELECT title FROM published_services WHERE id = ?",
        [completion.published_service_id],
      );

      // Notify employee about payment
      await conn.execute(
        `INSERT INTO notifications (user_id, notification_type, related_entity_type, related_entity_id, title, message)
       VALUES (?, 'payment_received', 'service_request', ?, 'Payment Received!', ?)`,
        [
          completion.employee_user_id,
          completion.service_request_id,
          `You earned $${employeeEarnings.toFixed(2)} for completing "${service[0]?.title}". The chat has been archived.`,
        ],
      );

      // Notify requester about service completion
      await conn.execute(
        `INSERT INTO notifications (user_id, notification_type, related_entity_type, related_entity_id, title, message)
       VALUES (?, 'service_completed', 'service_request', ?, 'Service Completed', ?)`,
        [
          completion.requester_user_id,
          completion.service_request_id,
          `Your service "${service[0]?.title}" has been completed and closed. Thank you for using GamerHelpers!`,
        ],
      );

      await conn.commit();
      res.json({
        success: true,
        message: "Service closed. Employee has been paid.",
      });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error("Approve completion error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  },
);

// Admin reopens a completion request (needs more work)
app.post(
  "/api/admin/completions/:id/reopen",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { admin_notes } = req.body;

    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();

      // Get completion details
      const [completions] = await conn.execute(
        `SELECT sc.*, sr.employee_user_id, sr.requester_user_id, sr.published_service_id
       FROM service_completions sc
       JOIN service_requests sr ON sc.service_request_id = sr.id
       WHERE sc.id = ?`,
        [id],
      );

      if (completions.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Completion record not found" });
      }

      const completion = completions[0];

      // Update completion status to needs_revision
      await conn.execute(
        `UPDATE service_completions 
       SET status = 'needs_revision', admin_review_notes = ?, reviewed_by_admin = ?, reviewed_at = NOW()
       WHERE id = ?`,
        [admin_notes, req.userId, id],
      );

      // Reopen service request to in_progress
      await conn.execute(
        `UPDATE service_requests SET status = 'in_progress', completed_at = NULL WHERE id = ?`,
        [completion.service_request_id],
      );

      // Get service title for notifications
      const [service] = await conn.execute(
        "SELECT title FROM published_services WHERE id = ?",
        [completion.published_service_id],
      );

      // Notify both parties
      await conn.execute(
        `INSERT INTO notifications (user_id, notification_type, related_entity_type, related_entity_id, title, message)
       VALUES (?, 'service_reopened', 'service_request', ?, 'Service Reopened', ?)`,
        [
          completion.employee_user_id,
          completion.service_request_id,
          `Admin has reopened "${service[0]?.title}". Reason: ${admin_notes || "Additional work needed"}`,
        ],
      );

      await conn.execute(
        `INSERT INTO notifications (user_id, notification_type, related_entity_type, related_entity_id, title, message)
       VALUES (?, 'service_reopened', 'service_request', ?, 'Service Reopened', ?)`,
        [
          completion.requester_user_id,
          completion.service_request_id,
          `The service "${service[0]?.title}" has been reopened for additional work.`,
        ],
      );

      await conn.commit();
      res.json({
        success: true,
        message: "Service reopened for additional work",
      });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error("Reopen completion error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  },
);

// Admin can view all chats
app.get("/api/admin/chats", verifyToken, verifyAdmin, async (req, res) => {
  const { status } = req.query; // 'active', 'archived', or 'all'
  let conn;
  try {
    conn = await pool.getConnection();

    let query = `
      SELECT c.id, c.is_archived, c.created_at, c.archived_at,
             sr.id as request_id, sr.status as request_status, sr.amount,
             ps.title as service_title, g.name as game_name,
             u_emp.full_name as employee_name, u_emp.id as employee_id,
             u_req.full_name as requester_name, u_req.id as requester_id,
             (SELECT COUNT(*) FROM chat_messages WHERE chat_id = c.id) as message_count,
             (SELECT message FROM chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chats c
      JOIN service_requests sr ON c.service_request_id = sr.id
      JOIN published_services ps ON sr.published_service_id = ps.id
      JOIN games g ON ps.game_id = g.id
      JOIN users u_emp ON sr.employee_user_id = u_emp.id
      JOIN users u_req ON sr.requester_user_id = u_req.id
    `;

    if (status === "active") {
      query += " WHERE c.is_archived = FALSE";
    } else if (status === "archived") {
      query += " WHERE c.is_archived = TRUE";
    }

    query += " ORDER BY c.created_at DESC";

    const [chats] = await conn.execute(query);

    res.json({ chats });
  } catch (err) {
    console.error("Admin get chats error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// Admin can view any chat messages
app.get(
  "/api/admin/chats/:id/messages",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
      conn = await pool.getConnection();

      const [messages] = await conn.execute(
        `SELECT cm.*, u.full_name, u.profile_picture
       FROM chat_messages cm
       JOIN users u ON cm.sender_user_id = u.id
       WHERE cm.chat_id = ?
       ORDER BY cm.created_at ASC`,
        [id],
      );

      res.json({ messages });
    } catch (err) {
      console.error("Admin get messages error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  },
);

// Get all active service requests for admin
app.get("/api/admin/requests", verifyToken, verifyAdmin, async (req, res) => {
  const { status } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();

    let query = `
      SELECT 
        sr.id, sr.status, sr.service_details, sr.amount, sr.created_at, sr.accepted_at, sr.started_at, sr.completed_at,
        ps.title as service_title, g.name as game_name,
        u_emp.full_name as employee_name, u_emp.id as employee_id,
        u_req.full_name as requester_name, u_req.id as requester_id
      FROM service_requests sr
      JOIN published_services ps ON sr.published_service_id = ps.id
      JOIN games g ON ps.game_id = g.id
      JOIN users u_emp ON sr.employee_user_id = u_emp.id
      JOIN users u_req ON sr.requester_user_id = u_req.id
    `;

    const params = [];
    if (status) {
      query += " WHERE sr.status = ?";
      params.push(status);
    }

    query += " ORDER BY sr.created_at DESC";

    const [requests] = await conn.execute(query, params);

    res.json({ requests });
  } catch (err) {
    console.error("Admin get requests error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// NOTIFICATION ENDPOINTS
// ==========================================

// Get user notifications
app.get("/api/notifications", verifyToken, async (req, res) => {
  const { unread_only } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();

    let query = `
      SELECT id, notification_type, related_entity_type, related_entity_id, title, message, is_read, created_at, read_at
      FROM notifications
      WHERE user_id = ?
    `;

    if (unread_only === "true") {
      query += " AND is_read = FALSE";
    }

    query += " ORDER BY created_at DESC LIMIT 50";

    const [notifications] = await conn.execute(query, [req.userId]);

    res.json({ notifications });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// Mark notification as read
app.post("/api/notifications/:id/read", verifyToken, async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();

    await conn.execute(
      "UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?",
      [id, req.userId],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// Mark all notifications as read
app.post("/api/notifications/read-all", verifyToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    await conn.execute(
      "UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE",
      [req.userId],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// Get unread notification count
app.get("/api/notifications/unread-count", verifyToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const [result] = await conn.execute(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE",
      [req.userId],
    );

    res.json({ count: result[0].count });
  } catch (err) {
    console.error("Get unread count error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// ADMIN ANALYTICS ENDPOINTS
// ==========================================

// Get analytics data for charts
app.get("/api/admin/analytics", verifyToken, verifyAdmin, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    // Get daily service requests for the last 7 days
    const [dailyRequests] = await conn.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM service_requests
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get daily revenue for the last 7 days
    const [dailyRevenue] = await conn.execute(`
      SELECT 
        DATE(completed_at) as date,
        SUM(amount) as revenue,
        SUM(commission_amount) as commission
      FROM transactions
      WHERE status = 'completed' AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `);

    // Get daily new users for the last 7 days
    const [dailyUsers] = await conn.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get weekly applications for the last 4 weeks
    const [weeklyApplications] = await conn.execute(`
      SELECT 
        YEARWEEK(submitted_at, 1) as week,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM service_applications
      WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
      GROUP BY YEARWEEK(submitted_at, 1)
      ORDER BY week ASC
    `);

    // Get service status distribution
    const [statusDistribution] = await conn.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM service_requests
      GROUP BY status
    `);

    // Get top games by service count
    const [topGames] = await conn.execute(`
      SELECT 
        g.name,
        COUNT(ps.id) as services,
        COUNT(DISTINCT sr.id) as requests
      FROM games g
      LEFT JOIN published_services ps ON g.id = ps.game_id
      LEFT JOIN service_requests sr ON ps.id = sr.published_service_id
      WHERE g.is_active = TRUE
      GROUP BY g.id, g.name
      ORDER BY services DESC
      LIMIT 5
    `);

    res.json({
      dailyRequests,
      dailyRevenue,
      dailyUsers,
      weeklyApplications,
      statusDistribution,
      topGames,
    });
  } catch (err) {
    console.error("Get analytics error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// SUPER ADMIN ENDPOINTS
// ==========================================

// Verify super admin middleware
const verifySuperAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  // Check if super admin (need to check in request or token)
  // For now, we'll check in the endpoint itself
  next();
};

// List all admins (super admin only)
app.get("/api/admin/admins", verifyToken, verifyAdmin, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();

    // First verify this is a super admin
    const [currentAdmin] = await conn.execute(
      "SELECT role FROM admin WHERE id = ?",
      [req.userId],
    );

    if (currentAdmin.length === 0 || currentAdmin[0].role !== "super") {
      return res.status(403).json({ error: "Super admin access required" });
    }

    const [admins] = await conn.execute(
      "SELECT id, email, full_name, role, is_active, created_at FROM admin ORDER BY created_at DESC",
    );

    res.json({ admins });
  } catch (err) {
    console.error("List admins error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// Make a user an admin (super admin only)
app.post("/api/admin/admins", verifyToken, verifyAdmin, async (req, res) => {
  const { user_id, role = "regular" } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();

    // Verify this is a super admin
    const [currentAdmin] = await conn.execute(
      "SELECT role FROM admin WHERE id = ?",
      [req.userId],
    );

    if (currentAdmin.length === 0 || currentAdmin[0].role !== "super") {
      return res.status(403).json({ error: "Super admin access required" });
    }

    // Get user details
    const [users] = await conn.execute(
      "SELECT id, email, full_name, password FROM users WHERE id = ?",
      [user_id],
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Check if already an admin
    const [existingAdmin] = await conn.execute(
      "SELECT id FROM admin WHERE email = ?",
      [user.email],
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({ error: "User is already an admin" });
    }

    // Create admin record
    await conn.execute(
      "INSERT INTO admin (email, full_name, password, role) VALUES (?, ?, ?, ?)",
      [user.email, user.full_name, user.password, role],
    );

    res.json({ success: true, message: `${user.full_name} is now an admin` });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// Update admin role or status (super admin only)
app.put("/api/admin/admins/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { role, is_active } = req.body;

  let conn;
  try {
    conn = await pool.getConnection();

    // Verify this is a super admin
    const [currentAdmin] = await conn.execute(
      "SELECT role FROM admin WHERE id = ?",
      [req.userId],
    );

    if (currentAdmin.length === 0 || currentAdmin[0].role !== "super") {
      return res.status(403).json({ error: "Super admin access required" });
    }

    // Can't modify yourself
    if (parseInt(id) === req.userId) {
      return res
        .status(400)
        .json({ error: "Cannot modify your own admin account" });
    }

    // Update admin
    const updates = [];
    const values = [];

    if (role !== undefined) {
      updates.push("role = ?");
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    values.push(id);
    await conn.execute(
      `UPDATE admin SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.json({ success: true, message: "Admin updated successfully" });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// Remove admin (super admin only)
app.delete(
  "/api/admin/admins/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;

    let conn;
    try {
      conn = await pool.getConnection();

      // Verify this is a super admin
      const [currentAdmin] = await conn.execute(
        "SELECT role FROM admin WHERE id = ?",
        [req.userId],
      );

      if (currentAdmin.length === 0 || currentAdmin[0].role !== "super") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      // Can't delete yourself
      if (parseInt(id) === req.userId) {
        return res
          .status(400)
          .json({ error: "Cannot delete your own admin account" });
      }

      await conn.execute("DELETE FROM admin WHERE id = ?", [id]);

      res.json({ success: true, message: "Admin removed successfully" });
    } catch (err) {
      console.error("Delete admin error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  },
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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`GamerHelpers API running on http://localhost:${PORT}`);
});

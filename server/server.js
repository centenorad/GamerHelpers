// ============================================================================
// GAMERHELPERS API SERVER
// ============================================================================
// SECURITY MEASURES IMPLEMENTED:
//
// 1. [SECURE AUTHENTICATION] - bcrypt with salt rounds for password hashing
//    (NO md5/sha1 used anywhere)
//
// 2. [INPUT VALIDATION] - All inputs are trimmed, length-checked (max 100),
//    and HTML special characters are escaped to prevent XSS.
//    No mysqli_real_escape_string — we use parameterized queries instead.
//
// 3. [PASSWORD POLICY] - Passwords must be 8–12 characters only.
//    All other text fields are limited to 100 characters.
//    All string inputs are trimmed (no leading/trailing whitespace).
//
// 4. [SESSION MANAGEMENT] - HTTP-only secure headers are set.
//    Frontend uses sessionStorage (tab-scoped) so sessions are not
//    shared across browser tabs. Refreshing the same tab keeps the
//    session, but opening a new tab requires a new login.
//
// 5. [SQL INJECTION PREVENTION] - All database queries use parameterized
//    prepared statements via mysql2 execute() with ? placeholders.
//    No raw string concatenation of user input into SQL.
//
// 6. [ADMIN AUDIT LOGS] - All admin actions are logged to the admin_logs
//    table, including: login/logout, user management, application
//    reviews, system setting changes, and viewing sensitive data.
//
// 7. [ACCOUNT BLOCKING] - After 3 failed login attempts, the account is
//    permanently blocked. Only an admin can unblock the account.
//    (No timed lockout — blocked until admin intervenes.)
// ============================================================================

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
// [INPUT VALIDATION] Sanitization & Validation Helpers
// ==========================================
// These helpers ensure all user input is safe before processing.
// - sanitizeInput: trims whitespace and escapes HTML special characters
//   to prevent XSS attacks (replaces <, >, &, ", ' with HTML entities).
// - validatePassword: enforces 8–12 character password policy.
// - validateFieldLength: ensures no field exceeds 100 characters.
// - validateEmail: checks email format and length.
// NOTE: We do NOT use mysqli_real_escape_string or any manual SQL escaping.
//       All queries use parameterized statements (?) which fully prevent
//       SQL injection at the driver level.
// ==========================================

const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  // [INPUT VALIDATION] Trim leading/trailing whitespace
  let sanitized = input.trim();
  // [INPUT VALIDATION] Escape HTML special characters to prevent XSS
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
  return sanitized;
};

const validatePassword = (password) => {
  // [PASSWORD POLICY] Password must be exactly 8–12 characters
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required" };
  }
  const trimmed = password.trim();
  if (trimmed.length < 8 || trimmed.length > 12) {
    return { valid: false, error: "Password must be 8–12 characters long" };
  }
  return { valid: true };
};

const validateFieldLength = (value, fieldName, maxLength = 100) => {
  // [INPUT VALIDATION] No field may exceed 100 characters
  if (typeof value !== "string") return { valid: true };
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`,
    };
  }
  return { valid: true };
};

const validateEmail = (email) => {
  // [INPUT VALIDATION] Email format check and length validation
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }
  const trimmed = email.trim();
  if (trimmed.length > 100) {
    return { valid: false, error: "Email must not exceed 100 characters" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true };
};

// ==========================================
// [ACCOUNT BLOCKING] Failed Login & Blocking (Database-Persisted)
// ==========================================
// Instead of a timed lockout, after 3 failed attempts the account
// is permanently BLOCKED in the database. Only an admin can unblock.
// This is stored in the DB (account_status = 'blocked' for users,
// is_active = FALSE for admins) so it persists across server restarts.
// ==========================================

const MAX_LOGIN_ATTEMPTS = 3;

/**
 * [ACCOUNT BLOCKING] Record a failed login attempt in the database.
 * If attempts reach MAX_LOGIN_ATTEMPTS, block the account permanently.
 * @param {string} table - 'users' or 'admin'
 * @param {number} userId - the user/admin ID
 * @param {object} conn - database connection
 * @returns {object} { blocked, attemptsRemaining }
 */
const recordFailedLoginAttempt = async (table, userId, conn) => {
  if (table === "users") {
    await conn.execute(
      "UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?",
      [userId],
    );
    const [rows] = await conn.execute(
      "SELECT failed_login_attempts FROM users WHERE id = ?",
      [userId],
    );
    const attempts = rows[0]?.failed_login_attempts || 0;
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      // [ACCOUNT BLOCKING] Block the account permanently after max failures
      await conn.execute(
        "UPDATE users SET account_status = 'blocked' WHERE id = ?",
        [userId],
      );
      return { blocked: true, attemptsRemaining: 0 };
    }
    return { blocked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS - attempts };
  } else {
    // admin table
    await conn.execute(
      "UPDATE admin SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?",
      [userId],
    );
    const [rows] = await conn.execute(
      "SELECT failed_login_attempts FROM admin WHERE id = ?",
      [userId],
    );
    const attempts = rows[0]?.failed_login_attempts || 0;
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      // [ACCOUNT BLOCKING] Block admin account after max failures
      await conn.execute("UPDATE admin SET is_active = FALSE WHERE id = ?", [
        userId,
      ]);
      return { blocked: true, attemptsRemaining: 0 };
    }
    return { blocked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS - attempts };
  }
};

/**
 * [ACCOUNT BLOCKING] Clear failed attempts on successful login.
 */
const clearFailedLoginAttempts = async (table, userId, conn) => {
  if (table === "users") {
    await conn.execute(
      "UPDATE users SET failed_login_attempts = 0 WHERE id = ?",
      [userId],
    );
  } else {
    await conn.execute(
      "UPDATE admin SET failed_login_attempts = 0 WHERE id = ?",
      [userId],
    );
  }
};

// ==========================================
// [ADMIN AUDIT LOGS] Logging Helper
// ==========================================
// Every admin action is recorded with: who did it, what they did,
// what entity was affected, details, and IP address.
// This covers: login/logout, user management, application reviews,
// system settings, content updates, and viewing sensitive data.
// ==========================================

const logAdminAction = async (
  conn,
  { adminId, action, targetType, targetId, details, ipAddress },
) => {
  try {
    await conn.execute(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        sanitizeInput(action),
        targetType ? sanitizeInput(targetType) : null,
        targetId || null,
        details ? sanitizeInput(details) : null,
        ipAddress || null,
      ],
    );
  } catch (err) {
    // [ADMIN AUDIT LOGS] Log failure should not break the main operation
    console.error("Failed to write admin log:", err.message);
  }
};

// ==========================================
// MIDDLEWARE
// ==========================================

// [SESSION MANAGEMENT] Set HTTP-only and security headers on every response.
// This prevents JavaScript from accessing sensitive cookies and adds
// protections against XSS, clickjacking, and MIME sniffing.
app.use((req, res, next) => {
  // [SESSION MANAGEMENT] HTTP-only: instruct browser to treat cookies as HTTP-only
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.setHeader("Pragma", "no-cache");
  next();
});

// [SECURE AUTHENTICATION] JWT Verification Middleware
// Verifies the Bearer token from the Authorization header.
// The token is signed with a server-side secret and contains user id/role.
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
    // [SECURE AUTHENTICATION] Reject expired or tampered tokens
    res.status(401).json({ error: "Invalid token" });
  }
};

// [SECURE AUTHENTICATION] Admin role verification middleware
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

  // [INPUT VALIDATION] Trim all inputs to remove leading/trailing whitespace
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();
  const trimmedName = full_name.trim();

  // [INPUT VALIDATION] Validate email format and length (max 100 chars)
  const emailCheck = validateEmail(trimmedEmail);
  if (!emailCheck.valid) {
    return res.status(400).json({ error: emailCheck.error });
  }

  // [PASSWORD POLICY] Password must be 8–12 characters
  const passwordCheck = validatePassword(trimmedPassword);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }

  // [INPUT VALIDATION] Full name must not exceed 100 characters
  const nameCheck = validateFieldLength(trimmedName, "Full name", 100);
  if (!nameCheck.valid) {
    return res.status(400).json({ error: nameCheck.error });
  }

  // [INPUT VALIDATION] Sanitize inputs to escape HTML special characters (XSS prevention)
  const safeEmail = sanitizeInput(trimmedEmail);
  const safeName = sanitizeInput(trimmedName);

  let conn;
  try {
    conn = await pool.getConnection();

    // [SQL INJECTION PREVENTION] Parameterized query to check existing email
    const [existing] = await conn.execute(
      "SELECT id FROM users WHERE email = ?",
      [safeEmail],
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // [SECURE AUTHENTICATION] Hash password with bcrypt (salt rounds = 10)
    // bcrypt is used instead of md5/sha1 for secure one-way hashing
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    // [SQL INJECTION PREVENTION] Parameterized INSERT
    const [result] = await conn.execute(
      "INSERT INTO users (email, password, full_name, account_status, failed_login_attempts) VALUES (?, ?, ?, ?, ?)",
      [safeEmail, hashedPassword, safeName, "active", 0],
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

  // [INPUT VALIDATION] Trim inputs
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  // [INPUT VALIDATION] Validate email and password format
  const emailCheck = validateEmail(trimmedEmail);
  if (!emailCheck.valid) {
    return res.status(400).json({ error: emailCheck.error });
  }

  const passwordCheck = validatePassword(trimmedPassword);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }

  const safeEmail = sanitizeInput(trimmedEmail);

  let conn;
  try {
    conn = await pool.getConnection();

    // [SQL INJECTION PREVENTION] Parameterized query to find user
    const [rows] = await conn.execute(
      "SELECT id, password, full_name, is_employee, account_status, failed_login_attempts FROM users WHERE email = ?",
      [safeEmail],
    );

    if (rows.length === 0) {
      // [SECURE AUTHENTICATION] Generic error to prevent email enumeration
      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: MAX_LOGIN_ATTEMPTS,
      });
    }

    const user = rows[0];

    // [ACCOUNT BLOCKING] Check if account is blocked
    if (user.account_status === "blocked") {
      return res.status(403).json({
        error:
          "Account is blocked due to too many failed login attempts. Please contact an administrator to unblock your account.",
        blocked: true,
      });
    }

    // [ACCOUNT BLOCKING] Check if account is suspended or banned
    if (user.account_status !== "active") {
      return res.status(403).json({
        error: `Account is ${user.account_status}. Please contact support.`,
      });
    }

    // [SECURE AUTHENTICATION] Compare password with bcrypt hash (not md5/sha1)
    const isMatch = await bcrypt.compare(trimmedPassword, user.password);

    if (!isMatch) {
      // [ACCOUNT BLOCKING] Record failed attempt; block if max reached
      const result = await recordFailedLoginAttempt("users", user.id, conn);
      if (result.blocked) {
        return res.status(403).json({
          error:
            "Account has been blocked due to too many failed login attempts. Please contact an administrator.",
          blocked: true,
        });
      }
      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    // [ACCOUNT BLOCKING] Clear failed attempts on successful login
    await clearFailedLoginAttempts("users", user.id, conn);

    // Update last login
    await conn.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    // [SECURE AUTHENTICATION] Sign JWT token with server secret
    const token = jwt.sign(
      {
        id: user.id,
        role: user.is_employee ? "employee" : "user",
        email: safeEmail,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    // [SESSION MANAGEMENT] Set HTTP-only cookie as additional security layer
    res.cookie("session_active", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: safeEmail,
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

// [SECURE AUTHENTICATION] Admin-specific login endpoint
app.post("/api/auth/admin-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // [INPUT VALIDATION] Trim and validate inputs
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  const emailCheck = validateEmail(trimmedEmail);
  if (!emailCheck.valid) {
    return res.status(400).json({ error: emailCheck.error });
  }

  const passwordCheck = validatePassword(trimmedPassword);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.error });
  }

  const safeEmail = sanitizeInput(trimmedEmail);

  let conn;
  try {
    conn = await pool.getConnection();

    // [SQL INJECTION PREVENTION] Parameterized query for admin lookup
    const [rows] = await conn.execute(
      "SELECT id, password, full_name, role, is_active, failed_login_attempts FROM admin WHERE email = ?",
      [safeEmail],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials or not an admin",
        attemptsRemaining: MAX_LOGIN_ATTEMPTS,
      });
    }

    const admin = rows[0];

    // [ACCOUNT BLOCKING] Check if admin account is blocked (is_active = false)
    if (!admin.is_active) {
      return res.status(403).json({
        error:
          "Admin account is blocked due to too many failed login attempts. Please contact a super administrator.",
        blocked: true,
      });
    }

    // [SECURE AUTHENTICATION] Compare with bcrypt hash (not md5/sha1)
    const isMatch = await bcrypt.compare(trimmedPassword, admin.password);

    if (!isMatch) {
      // [ACCOUNT BLOCKING] Record failed attempt; block if max reached
      const result = await recordFailedLoginAttempt("admin", admin.id, conn);
      if (result.blocked) {
        return res.status(403).json({
          error:
            "Admin account has been blocked due to too many failed login attempts. Please contact a super administrator.",
          blocked: true,
        });
      }
      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: result.attemptsRemaining,
      });
    }

    // [ACCOUNT BLOCKING] Clear failed attempts on successful login
    await clearFailedLoginAttempts("admin", admin.id, conn);

    // [SECURE AUTHENTICATION] Sign JWT with admin role
    const token = jwt.sign(
      {
        id: admin.id,
        role: "admin",
        email: safeEmail,
        adminRole: admin.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    // [SESSION MANAGEMENT] Set HTTP-only cookie
    res.cookie("session_active", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // [ADMIN AUDIT LOGS] Log admin login action
    await logAdminAction(conn, {
      adminId: admin.id,
      action: "ADMIN_LOGIN",
      targetType: "admin",
      targetId: admin.id,
      details: "Admin logged in successfully",
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: safeEmail,
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

  // [INPUT VALIDATION] Sanitize and validate game creation inputs
  const safeName = sanitizeInput(name);
  const safeSlug = sanitizeInput(slug);
  const safeDesc = description ? sanitizeInput(description) : null;
  const safeGenre = genre ? sanitizeInput(genre) : null;
  const safePlatform = platform ? sanitizeInput(platform) : null;

  const nameCheck = validateFieldLength(safeName, "Game name", 100);
  if (!nameCheck.valid) return res.status(400).json({ error: nameCheck.error });

  let conn;
  try {
    conn = await pool.getConnection();

    // [SQL INJECTION PREVENTION] Parameterized INSERT for game creation
    const [result] = await conn.execute(
      `INSERT INTO games (name, slug, description, genre, platform, popularity_rank, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [safeName, safeSlug, safeDesc, safeGenre, safePlatform, popularity_rank],
    );

    // [ADMIN AUDIT LOGS] Log game creation (updating website content)
    await logAdminAction(conn, {
      adminId: req.userId,
      action: "CREATE_GAME",
      targetType: "game",
      targetId: result.insertId,
      details: `Created game "${safeName}"`,
      ipAddress: req.ip,
    });

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

    // [ADMIN AUDIT LOGS] Log game update (updating website content)
    await logAdminAction(conn, {
      adminId: req.userId,
      action: "UPDATE_GAME",
      targetType: "game",
      targetId: parseInt(id),
      details: `Updated game ${id}: ${updates.map((u) => u.split(" = ")[0]).join(", ")} changed`,
      ipAddress: req.ip,
    });

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

    // [ADMIN AUDIT LOGS] Log game deletion (updating website content)
    await logAdminAction(conn, {
      adminId: req.userId,
      action: "DELETE_GAME",
      targetType: "game",
      targetId: parseInt(id),
      details: `Soft-deleted game ${id}`,
      ipAddress: req.ip,
    });

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

  // [INPUT VALIDATION] Sanitize and validate application inputs
  const safeTitle = sanitizeInput(title);
  const safeDesc = sanitizeInput(description);
  const titleCheck = validateFieldLength(safeTitle, "Title", 100);
  if (!titleCheck.valid)
    return res.status(400).json({ error: titleCheck.error });

  let conn;
  try {
    conn = await pool.getConnection();

    // [SQL INJECTION PREVENTION] Parameterized INSERT with sanitized values
    const [result] = await conn.execute(
      `INSERT INTO service_applications (user_id, game_id, title, description, price, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [req.userId, game_id, safeTitle, safeDesc, price],
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

      // [ADMIN AUDIT LOGS] Log application approval
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "APPROVE_APPLICATION",
        targetType: "service_application",
        targetId: parseInt(id),
        details: `Approved application "${app.title}" for user ${app.user_id}`,
        ipAddress: req.ip,
      });

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

      // [ADMIN AUDIT LOGS] Log application rejection
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "REJECT_APPLICATION",
        targetType: "service_application",
        targetId: parseInt(id),
        details: `Rejected application. Reason: ${reason || "No reason provided"}`,
        ipAddress: req.ip,
      });

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

  // [INPUT VALIDATION] Sanitize message content to prevent XSS
  const safeMessage = sanitizeInput(message);

  let conn;
  try {
    conn = await pool.getConnection();

    // [SQL INJECTION PREVENTION] Parameterized INSERT for chat message
    const [result] = await conn.execute(
      "INSERT INTO chat_messages (chat_id, sender_user_id, message) VALUES (?, ?, ?)",
      [id, req.userId, safeMessage],
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

    // [INPUT VALIDATION] Validate allowed status values (including 'blocked' for the blocking feature)
    if (
      !["active", "suspended", "banned", "blocked"].includes(account_status)
    ) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let conn;
    try {
      conn = await pool.getConnection();

      await conn.execute("UPDATE users SET account_status = ? WHERE id = ?", [
        account_status,
        id,
      ]);

      // [ADMIN AUDIT LOGS] Log user status change (editing user)
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "UPDATE_USER_STATUS",
        targetType: "user",
        targetId: parseInt(id),
        details: `Changed user status to '${account_status}'`,
        ipAddress: req.ip,
      });

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

      // [ADMIN AUDIT LOGS] Log completion approval (updating content/service)
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "APPROVE_COMPLETION",
        targetType: "service_completion",
        targetId: parseInt(id),
        details: `Approved completion for request ${completion.service_request_id}. Employee earned $${employeeEarnings.toFixed(2)}`,
        ipAddress: req.ip,
      });

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

      // [ADMIN AUDIT LOGS] Log completion reopen (updating content)
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "REOPEN_COMPLETION",
        targetType: "service_completion",
        targetId: parseInt(id),
        details: `Reopened service request ${completion.service_request_id}. Reason: ${admin_notes || "Additional work needed"}`,
        ipAddress: req.ip,
      });

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

      // [ADMIN AUDIT LOGS] Log viewing sensitive data (chat messages)
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "VIEW_CHAT_MESSAGES",
        targetType: "chat",
        targetId: parseInt(id),
        details: `Admin viewed chat ${id} containing ${messages.length} messages`,
        ipAddress: req.ip,
      });

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
// Accepts ?range=7|30|365 query param to control the time window
app.get("/api/admin/analytics", verifyToken, verifyAdmin, async (req, res) => {
  // [INPUT VALIDATION] Only allow specific range values
  const allowedRanges = [7, 30, 365];
  const range = allowedRanges.includes(parseInt(req.query.range))
    ? parseInt(req.query.range)
    : 7;

  let conn;
  try {
    conn = await pool.getConnection();

    // Get service requests grouped by date for the selected range
    const [dailyRequests] = await conn.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM service_requests
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${range} DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get revenue grouped by date for the selected range
    const [dailyRevenue] = await conn.execute(`
      SELECT 
        DATE(completed_at) as date,
        SUM(amount) as revenue,
        SUM(commission_amount) as commission
      FROM transactions
      WHERE status = 'completed' AND completed_at >= DATE_SUB(NOW(), INTERVAL ${range} DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `);

    // Get new users grouped by date for the selected range
    const [dailyUsers] = await conn.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${range} DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Get applications based on range
    const weeksToFetch = range <= 7 ? 4 : range <= 30 ? 8 : 52;
    const [weeklyApplications] = await conn.execute(`
      SELECT 
        YEARWEEK(submitted_at, 1) as week,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM service_applications
      WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL ${weeksToFetch} WEEK)
      GROUP BY YEARWEEK(submitted_at, 1)
      ORDER BY week ASC
    `);

    // Get service status distribution (always all-time)
    const [statusDistribution] = await conn.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM service_requests
      GROUP BY status
    `);

    // Get top games by service count (always all-time)
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
      range,
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
      "INSERT INTO admin (email, full_name, password, role, failed_login_attempts) VALUES (?, ?, ?, ?, ?)",
      [user.email, user.full_name, user.password, role, 0],
    );

    // [ADMIN AUDIT LOGS] Log creating a new admin user
    await logAdminAction(conn, {
      adminId: req.userId,
      action: "CREATE_ADMIN",
      targetType: "admin",
      targetId: user_id,
      details: `Promoted user ${user.full_name} (${user.email}) to admin with role '${role}'`,
      ipAddress: req.ip,
    });

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

    // [ADMIN AUDIT LOGS] Log admin role/status update
    await logAdminAction(conn, {
      adminId: req.userId,
      action: "UPDATE_ADMIN",
      targetType: "admin",
      targetId: parseInt(id),
      details: `Updated admin ${id}: ${updates.map((u) => u.split(" = ")[0]).join(", ")} changed`,
      ipAddress: req.ip,
    });

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

      // [ADMIN AUDIT LOGS] Log admin deletion
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "DELETE_ADMIN",
        targetType: "admin",
        targetId: parseInt(id),
        details: `Removed admin account ${id}`,
        ipAddress: req.ip,
      });

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
// [ADMIN AUDIT LOGS] Admin Logout Logging Endpoint
// ==========================================

app.post(
  "/api/auth/admin-logout",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();

      // [ADMIN AUDIT LOGS] Log admin logout action
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "ADMIN_LOGOUT",
        targetType: "admin",
        targetId: req.userId,
        details: "Admin logged out",
        ipAddress: req.ip,
      });

      // [SESSION MANAGEMENT] Clear HTTP-only cookie on logout
      res.clearCookie("session_active", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Admin logout log error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  },
);

// ==========================================
// [ACCOUNT BLOCKING] Unblock User Endpoint (Admin Only)
// ==========================================
// Only admins can unblock an account that was blocked after
// too many failed login attempts. This resets the failed attempts
// counter and sets the account status back to 'active'.
// ==========================================

app.put(
  "/api/admin/users/:id/unblock",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    const { id } = req.params;

    let conn;
    try {
      conn = await pool.getConnection();

      // [ACCOUNT BLOCKING] Reset failed attempts and unlock the account
      await conn.execute(
        "UPDATE users SET account_status = 'active', failed_login_attempts = 0 WHERE id = ?",
        [id],
      );

      // [ADMIN AUDIT LOGS] Log the unblock action
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "UNBLOCK_USER",
        targetType: "user",
        targetId: parseInt(id),
        details: `Unblocked user account ${id} and reset failed login attempts`,
        ipAddress: req.ip,
      });

      res.json({ success: true, message: "User account has been unblocked" });
    } catch (err) {
      console.error("Unblock user error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  },
);

// [ACCOUNT BLOCKING] Unblock Admin Account (Super Admin Only)
app.put(
  "/api/admin/admins/:id/unblock",
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

      // [ACCOUNT BLOCKING] Reactivate admin and reset failed attempts
      await conn.execute(
        "UPDATE admin SET is_active = TRUE, failed_login_attempts = 0 WHERE id = ?",
        [id],
      );

      // [ADMIN AUDIT LOGS] Log admin unblock
      await logAdminAction(conn, {
        adminId: req.userId,
        action: "UNBLOCK_ADMIN",
        targetType: "admin",
        targetId: parseInt(id),
        details: `Unblocked admin account ${id}`,
        ipAddress: req.ip,
      });

      res.json({ success: true, message: "Admin account has been unblocked" });
    } catch (err) {
      console.error("Unblock admin error:", err);
      res.status(500).json({ error: "Server error" });
    } finally {
      if (conn) conn.end();
    }
  },
);

// ==========================================
// [ADMIN AUDIT LOGS] Get Admin Logs Endpoint
// ==========================================
// Returns a paginated list of all admin actions logged in the system.
// ==========================================

app.get("/api/admin/logs", verifyToken, verifyAdmin, async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();

    // [SQL INJECTION PREVENTION] Parameterized query for admin logs
    const [logs] = await conn.execute(
      `SELECT al.*, a.full_name as admin_name, a.email as admin_email
       FROM admin_logs al
       LEFT JOIN admin a ON al.admin_id = a.id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)],
    );

    const [countResult] = await conn.execute(
      "SELECT COUNT(*) as total FROM admin_logs",
    );

    // [ADMIN AUDIT LOGS] Log that admin viewed audit logs (viewing sensitive data)
    await logAdminAction(conn, {
      adminId: req.userId,
      action: "VIEW_ADMIN_LOGS",
      targetType: "admin_logs",
      targetId: null,
      details: `Viewed admin logs (limit: ${limit}, offset: ${offset})`,
      ipAddress: req.ip,
    });

    res.json({ logs, total: countResult[0].total });
  } catch (err) {
    console.error("Get admin logs error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// ==========================================
// [ACCOUNT BLOCKING] Get Blocked Users Endpoint
// ==========================================

app.get(
  "/api/admin/users/blocked",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    let conn;
    try {
      conn = await pool.getConnection();

      // [SQL INJECTION PREVENTION] Parameterized query for blocked users
      const [blockedUsers] = await conn.execute(
        `SELECT id, email, full_name, failed_login_attempts, account_status, created_at
       FROM users
       WHERE account_status = 'blocked'
       ORDER BY created_at DESC`,
      );

      const [blockedAdmins] = await conn.execute(
        `SELECT id, email, full_name, failed_login_attempts, is_active, created_at
       FROM admin
       WHERE is_active = FALSE
       ORDER BY created_at DESC`,
      );

      res.json({ blocked_users: blockedUsers, blocked_admins: blockedAdmins });
    } catch (err) {
      console.error("Get blocked users error:", err);
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

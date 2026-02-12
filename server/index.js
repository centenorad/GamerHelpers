import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "db_gamerhelpers",
};

// Helper to convert BLOB to base64 data URL
function blobToDataURL(blob, mimeType = "image/jpeg") {
  if (!blob) return null;
  const base64 = Buffer.from(blob).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const conn = await mysql.createConnection(dbConfig);
    const [existing] = await conn.execute(
      "SELECT user_id FROM tbl_users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      await conn.end();
      return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");

    await conn.execute(
      "INSERT INTO tbl_users (email, password_hash, full_name, username) VALUES (?, ?, ?, ?)",
      [email, hash, name, username]
    );
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);

    const [rows] = await conn.execute(
      "SELECT user_id, password_hash, role, username, full_name, email FROM tbl_users WHERE email = ?",
      [email]
    );
    await conn.end();

    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.json({
      success: true,
      user_id: user.user_id,
      role: user.role,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("GamerHelpers API is running.");
});

app.get("/api/posts", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    const [posts] = await conn.execute(`
      SELECT p.*, u.full_name, u.username, g.game_name
      FROM tbl_posts p
      JOIN tbl_users u ON p.user_id = u.user_id
      JOIN tbl_games g ON p.game_id = g.game_id
      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    let images = [];
    try {
      const [imgRows] = await conn.execute(`
        SELECT image_id, post_id, image_data, display_order
        FROM tbl_post_images
        ORDER BY post_id, display_order
      `);
      images = imgRows;
    } catch (imgErr) {
      console.log("Note: tbl_post_images may not exist or be empty");
      images = [];
    }

    const postsWithImages = posts.map((post) => ({
      ...post,
      images: images
        .filter((img) => img.post_id === post.post_id)
        .map((img) => ({
          image_id: img.image_id,
          image_url: blobToDataURL(img.image_data),
        })),
    }));

    res.json({ posts: postsWithImages });
  } catch (err) {
    console.error("Posts query error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    if (conn) await conn.end();
  }
});

app.post("/api/posts", async (req, res) => {
  const { title, description, game_name, service_type, images, user_id } =
    req.body;

  if (!title || !description || !game_name || !service_type || !user_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    let [games] = await conn.execute(
      "SELECT game_id FROM tbl_games WHERE LOWER(game_name) = LOWER(?)",
      [game_name]
    );

    let game_id;
    if (games.length === 0) {
      const [result] = await conn.execute(
        "INSERT INTO tbl_games (game_name) VALUES (?)",
        [game_name]
      );
      game_id = result.insertId;
    } else {
      game_id = games[0].game_id;
    }

    const [postResult] = await conn.execute(
      `INSERT INTO tbl_posts (user_id, game_id, title, description, service_type) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, game_id, title, description, service_type]
    );

    const post_id = postResult.insertId;

    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const base64Data = images[i];
        const buffer = Buffer.from(base64Data, "base64");

        await conn.execute(
          `INSERT INTO tbl_post_images (post_id, image_data, display_order) 
           VALUES (?, ?, ?)`,
          [post_id, buffer, i]
        );
      }
    }

    res.json({ success: true, post_id });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post" });
  } finally {
    if (conn) await conn.end();
  }
});

app.get("/api/pilots", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`
      SELECT DISTINCT u.user_id, u.full_name, u.username
      FROM tbl_posts p
      JOIN tbl_users u ON p.user_id = u.user_id
      WHERE p.service_type = 'piloting'
      LIMIT 10
    `);
    res.json({ pilots: rows });
  } catch (err) {
    console.error("Pilots error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.get("/api/coaches", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`
      SELECT DISTINCT u.user_id, u.full_name, u.username
      FROM tbl_posts p
      JOIN tbl_users u ON p.user_id = u.user_id
      WHERE p.service_type = 'coaching'
      LIMIT 10
    `);
    res.json({ coaches: rows });
  } catch (err) {
    console.error("Coaches error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.get("/api/game-posts/:gameKey", async (req, res) => {
  const { gameKey } = req.params;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    const [games] = await conn.execute(
      "SELECT game_id FROM tbl_games WHERE LOWER(REPLACE(game_name, ' ', '')) = ?",
      [gameKey.toLowerCase().replace(/\s/g, "")]
    );

    if (games.length === 0) {
      return res.json({ posts: [] });
    }

    const game_id = games[0].game_id;
    const [posts] = await conn.execute(
      `SELECT p.*, u.full_name, u.username
       FROM tbl_posts p
       JOIN tbl_users u ON p.user_id = u.user_id
       WHERE p.game_id = ?
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [game_id]
    );

    let images = [];
    try {
      const [imgRows] = await conn.execute(
        `SELECT i.image_id, i.post_id, i.image_data, i.display_order
         FROM tbl_post_images i
         JOIN tbl_posts p ON i.post_id = p.post_id
         WHERE p.game_id = ?
         ORDER BY i.post_id, i.display_order`,
        [game_id]
      );
      images = imgRows;
    } catch (imgErr) {
      images = [];
    }

    const postsWithImages = posts.map((post) => ({
      ...post,
      images: images
        .filter((img) => img.post_id === post.post_id)
        .map((img) => ({
          image_id: img.image_id,
          image_url: blobToDataURL(img.image_data),
        })),
    }));

    res.json({ posts: postsWithImages });
  } catch (err) {
    console.error("Game posts error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.get("/api/profile/:username", async (req, res) => {
  const { username } = req.params;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [users] = await conn.execute(
      "SELECT user_id, full_name, username FROM tbl_users WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      return res.json({ profile: null, posts: [] });
    }

    const user = users[0];

    const [posts] = await conn.execute(
      `SELECT p.*, g.game_name
       FROM tbl_posts p
       JOIN tbl_games g ON p.game_id = g.game_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT 20`,
      [user.user_id]
    );

    let images = [];
    try {
      const [imgRows] = await conn.execute(
        `SELECT i.image_id, i.post_id, i.image_data, i.display_order
         FROM tbl_post_images i
         JOIN tbl_posts p ON i.post_id = p.post_id
         WHERE p.user_id = ?
         ORDER BY i.post_id, i.display_order`,
        [user.user_id]
      );
      images = imgRows;
    } catch (imgErr) {
      images = [];
    }

    const postsWithImages = posts.map((post) => ({
      ...post,
      images: images
        .filter((img) => img.post_id === post.post_id)
        .map((img) => ({
          image_id: img.image_id,
          image_url: blobToDataURL(img.image_data),
        })),
    }));

    res.json({ profile: user, posts: postsWithImages });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// ADMIN ENDPOINTS
app.get("/api/admin/users", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [users] = await conn.execute(
      "SELECT user_id AS id, full_name AS name, username AS handle FROM tbl_users ORDER BY created_at DESC"
    );
    res.json({ users });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.get("/api/admin/posts", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [posts] = await conn.execute(`
      SELECT p.post_id AS id, p.title, u.full_name AS author
      FROM tbl_posts p
      JOIN tbl_users u ON p.user_id = u.user_id
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    res.json({ posts });
  } catch (err) {
    console.error("Admin posts error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.delete("/api/admin/posts/:id", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.execute("DELETE FROM tbl_posts WHERE post_id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.get("/api/admin/games", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [games] = await conn.execute(
      "SELECT game_id AS id, game_name AS name FROM tbl_games ORDER BY game_name ASC"
    );
    res.json({ games });
  } catch (err) {
    console.error("Admin games error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.post("/api/admin/games", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Missing game name" });
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [result] = await conn.execute(
      "INSERT INTO tbl_games (game_name) VALUES (?)",
      [name]
    );
    const [games] = await conn.execute(
      "SELECT game_id AS id, game_name AS name FROM tbl_games WHERE game_id = ?",
      [result.insertId]
    );
    res.json({ game: games[0] });
  } catch (err) {
    console.error("Add game error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.delete("/api/admin/games/:id", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.execute("DELETE FROM tbl_games WHERE game_id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res
        .status(400)
        .json({ error: "Cannot delete game with existing posts" });
    }
    console.error("Delete game error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.post("/api/chats/direct", async (req, res) => {
  const { user_id, other_user_id } = req.body;

  if (!user_id || !other_user_id) {
    return res.status(400).json({ error: "Missing user IDs" });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Check if a direct chat already exists between these two users
    const [existingChats] = await conn.execute(
      `
      SELECT c.chat_id
      FROM tbl_chats c
      WHERE c.is_group = 0
        AND EXISTS (
          SELECT 1 FROM tbl_chat_members cm1 
          WHERE cm1.chat_id = c.chat_id AND cm1.user_id = ? AND cm1.is_active = 1
        )
        AND EXISTS (
          SELECT 1 FROM tbl_chat_members cm2 
          WHERE cm2.chat_id = c.chat_id AND cm2.user_id = ? AND cm2.is_active = 1
        )
        AND (SELECT COUNT(*) FROM tbl_chat_members WHERE chat_id = c.chat_id AND is_active = 1) = 2
      LIMIT 1
    `,
      [user_id, other_user_id]
    );

    if (existingChats.length > 0) {
      // Chat exists, return it
      return res.json({ chat_id: existingChats[0].chat_id, created: false });
    }

    // Create new chat
    const [chatResult] = await conn.execute(
      "INSERT INTO tbl_chats (is_group, created_by) VALUES (0, ?)",
      [user_id]
    );

    const chat_id = chatResult.insertId;

    // Add both members
    await conn.execute(
      "INSERT INTO tbl_chat_members (chat_id, user_id) VALUES (?, ?), (?, ?)",
      [chat_id, user_id, chat_id, other_user_id]
    );

    res.json({ chat_id, created: true });
  } catch (err) {
    console.error("Create/get chat error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Get all chats for a user
app.get("/api/chats/:user_id", async (req, res) => {
  const { user_id } = req.params;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    const [chats] = await conn.execute(
      `
      SELECT DISTINCT
        c.chat_id,
        c.title,
        c.is_group,
        c.created_at,
        (SELECT m.message FROM tbl_messages m 
         WHERE m.chat_id = c.chat_id 
         ORDER BY m.sent_at DESC LIMIT 1) as last_message,
        (SELECT m.sent_at FROM tbl_messages m 
         WHERE m.chat_id = c.chat_id 
         ORDER BY m.sent_at DESC LIMIT 1) as last_message_time
      FROM tbl_chats c
      JOIN tbl_chat_members cm ON c.chat_id = cm.chat_id
      WHERE cm.user_id = ? AND cm.is_active = 1
      ORDER BY last_message_time DESC
    `,
      [user_id]
    );

    // Get other members for each chat
    for (let chat of chats) {
      const [members] = await conn.execute(
        `
        SELECT u.user_id, u.full_name, u.username
        FROM tbl_chat_members cm
        JOIN tbl_users u ON cm.user_id = u.user_id
        WHERE cm.chat_id = ? AND cm.user_id != ? AND cm.is_active = 1
      `,
        [chat.chat_id, user_id]
      );

      chat.members = members;

      // For direct chats, set a display name
      if (!chat.is_group && members.length > 0) {
        chat.display_name = members[0].full_name;
        chat.other_user = members[0];
      } else {
        chat.display_name = chat.title || "Group Chat";
      }
    }

    res.json({ chats });
  } catch (err) {
    console.error("Get chats error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Get messages for a chat
app.get("/api/chats/:chat_id/messages", async (req, res) => {
  const { chat_id } = req.params;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    const [messages] = await conn.execute(
      `
      SELECT m.*, u.full_name, u.username
      FROM tbl_messages m
      JOIN tbl_users u ON m.sender_id = u.user_id
      WHERE m.chat_id = ?
      ORDER BY m.sent_at ASC
      LIMIT 100
    `,
      [chat_id]
    );

    res.json({ messages });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Send a message
app.post("/api/messages", async (req, res) => {
  const { chat_id, sender_id, message } = req.body;

  if (!chat_id || !sender_id || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    const [result] = await conn.execute(
      "INSERT INTO tbl_messages (chat_id, sender_id, message) VALUES (?, ?, ?)",
      [chat_id, sender_id, message]
    );

    const [newMessage] = await conn.execute(
      `
      SELECT m.*, u.full_name, u.username
      FROM tbl_messages m
      JOIN tbl_users u ON m.sender_id = u.user_id
      WHERE m.message_id = ?
    `,
      [result.insertId]
    );

    res.json({ message: newMessage[0] });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Update user profile
app.put("/api/profile/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { full_name, username, bio, contact_number } = req.body;

  if (!full_name || !username) {
    return res.status(400).json({ error: "Name and username are required" });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Check if username is already taken by another user
    const [existing] = await conn.execute(
      "SELECT user_id FROM tbl_users WHERE username = ? AND user_id != ?",
      [username, user_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Update user profile
    await conn.execute(
      `UPDATE tbl_users 
       SET full_name = ?, username = ?, contact_number = ?
       WHERE user_id = ?`,
      [full_name, username, contact_number || null, user_id]
    );

    // Get updated user data
    const [updated] = await conn.execute(
      "SELECT user_id, full_name, username, email, contact_number FROM tbl_users WHERE user_id = ?",
      [user_id]
    );

    res.json({ success: true, user: updated[0] });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Add these new endpoints to your existing server.js file

// CREATE USER endpoint
app.post("/api/admin/users", async (req, res) => {
  const { name, email, username, password } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Check if email or username already exists
    const [existing] = await conn.execute(
      "SELECT user_id FROM tbl_users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existing.length > 0) {
      return res
        .status(409)
        .json({ error: "Email or username already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await conn.execute(
      "INSERT INTO tbl_users (email, password_hash, full_name, username) VALUES (?, ?, ?, ?)",
      [email, hash, name, username]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// CREATE POST endpoint
app.post("/api/admin/posts", async (req, res) => {
  const { title, description, game_id, service_type, user_id } = req.body;

  if (!title || !description || !game_id || !service_type || !user_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    await conn.execute(
      `INSERT INTO tbl_posts (user_id, game_id, title, description, service_type) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, game_id, title, description, service_type]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// UPDATE POST endpoint
app.put("/api/admin/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, game_id, service_type } = req.body;

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }
    if (game_id !== undefined) {
      updates.push("game_id = ?");
      values.push(game_id);
    }
    if (service_type !== undefined) {
      updates.push("service_type = ?");
      values.push(service_type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);

    await conn.execute(
      `UPDATE tbl_posts SET ${updates.join(", ")} WHERE post_id = ?`,
      values
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Analytics endpoint
app.get("/api/admin/analytics", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Daily user registrations (last 30 days)
    const [dailyUsers] = await conn.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as users
      FROM tbl_users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Weekly posts (last 12 weeks)
    const [weeklyPosts] = await conn.execute(`
      SELECT 
        CONCAT('Week ', WEEK(created_at, 1)) as week,
        COUNT(*) as posts
      FROM tbl_posts
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
      GROUP BY WEEK(created_at, 1)
      ORDER BY WEEK(created_at, 1) ASC
      LIMIT 12
    `);

    // Monthly posts (last 12 months)
    const [monthlyPosts] = await conn.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as posts
      FROM tbl_posts
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    res.json({
      dailyUsers: dailyUsers.map((row) => ({
        date: row.date.toISOString().split("T")[0],
        users: row.users,
      })),
      weeklyPosts: weeklyPosts,
      monthlyPosts: monthlyPosts,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Update user endpoint
app.put("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, handle } = req.body;

  if (!name || !handle) {
    return res.status(400).json({ error: "Name and handle required" });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Check if handle is taken by another user
    const [existing] = await conn.execute(
      "SELECT user_id FROM tbl_users WHERE username = ? AND user_id != ?",
      [handle, id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Handle already taken" });
    }

    await conn.execute(
      "UPDATE tbl_users SET full_name = ?, username = ? WHERE user_id = ?",
      [name, handle, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Delete user endpoint
app.delete("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.execute("DELETE FROM tbl_users WHERE user_id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Ban/Unban user endpoints
app.post("/api/admin/users/:id/ban", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Add banned column if it doesn't exist
    await conn
      .execute(
        `
      ALTER TABLE tbl_users 
      ADD COLUMN IF NOT EXISTS banned TINYINT(1) DEFAULT 0
    `
      )
      .catch(() => {});

    await conn.execute("UPDATE tbl_users SET banned = 1 WHERE user_id = ?", [
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("Ban user error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.post("/api/admin/users/:id/unban", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.execute("UPDATE tbl_users SET banned = 0 WHERE user_id = ?", [
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("Unban user error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Update game endpoint
app.put("/api/admin/games/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Game name required" });
  }

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    await conn.execute("UPDATE tbl_games SET game_name = ? WHERE game_id = ?", [
      name,
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("Update game error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

// Update the admin users endpoint to include banned status
app.get("/api/admin/users", async (req, res) => {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Add banned column if it doesn't exist
    await conn
      .execute(
        `
      ALTER TABLE tbl_users 
      ADD COLUMN IF NOT EXISTS banned TINYINT(1) DEFAULT 0
    `
      )
      .catch(() => {});

    const [users] = await conn.execute(
      "SELECT user_id AS id, full_name AS name, username AS handle, banned FROM tbl_users ORDER BY created_at DESC"
    );
    res.json({ users });
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    if (conn) await conn.end();
  }
});

app.listen(4000, () => console.log("API running on http://localhost:4000"));

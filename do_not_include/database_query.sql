-- ========================================
-- GamerHelpers Database Schema
-- Complete setup for gaming coaching marketplace
-- ========================================

-- Create Database
CREATE DATABASE IF NOT EXISTS gamer_helpers;
DROP DATABASE gamer_helpers;
CREATE DATABASE gamer_helpers;
USE gamer_helpers;

-- ==========================================
-- Core Users Table
-- ==========================================
-- SECURITY NOTE: Passwords should ALWAYS be hashed using bcrypt, Argon2, or similar
-- on the application layer BEFORE storing in the database.
-- Never store plain text passwords!
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255),
    is_employee BOOLEAN DEFAULT FALSE,
    account_status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    last_login TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_is_employee (is_employee),
    INDEX idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Admin Table (Independent admin management)
-- ==========================================
CREATE TABLE admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('regular', 'super') DEFAULT 'regular',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Games Table (Dynamic game management)
-- ==========================================
CREATE TABLE games (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    banner_image_url VARCHAR(255),
    genre VARCHAR(100),
    platform ENUM('PC', 'Console', 'Mobile', 'Multi-platform') DEFAULT 'Multi-platform',
    is_active BOOLEAN DEFAULT TRUE,
    total_coaches INT DEFAULT 0,
    total_services INT DEFAULT 0,
    popularity_rank INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_popularity (popularity_rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Employee Profiles Table
-- ==========================================
CREATE TABLE employee_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    bio TEXT,
    rank_tier VARCHAR(100),
    years_experience INT,
    total_services_completed INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_verified (is_verified),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Employee Specializations (Coach expertise in specific games)
-- ==========================================
CREATE TABLE employee_specializations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    game_id INT NOT NULL,
    rank_in_game VARCHAR(100),
    years_in_game INT,
    hourly_rate DECIMAL(10, 2),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_employee_game (employee_id, game_id),
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_game_id (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Service Applications Table (Pending approval)
-- ==========================================
CREATE TABLE service_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'archived') DEFAULT 'pending',
    admin_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES admin(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_game_id (game_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Service Application Images
-- ==========================================
CREATE TABLE service_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES service_applications(id) ON DELETE CASCADE,
    INDEX idx_application_id (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Published Services (Live posts available to users)
-- ==========================================
CREATE TABLE published_services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    application_id INT NOT NULL,
    game_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    tags JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES service_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_game_id (game_id),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Service Requests (User requesting service)
-- ==========================================
CREATE TABLE service_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    published_service_id INT NOT NULL,
    requester_user_id INT NOT NULL,
    employee_user_id INT NOT NULL,
    service_details TEXT NOT NULL,
    status ENUM('pending', 'employee_accepted', 'in_progress', 'pending_completion', 'completed', 'cancelled', 'closed') DEFAULT 'pending',
    employee_response TEXT,
    initial_acceptance BOOLEAN DEFAULT FALSE,
    final_acceptance BOOLEAN DEFAULT FALSE,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    user_confirmed_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (published_service_id) REFERENCES published_services(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_requester_id (requester_user_id),
    INDEX idx_employee_id (employee_user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Chats Table (Created when service request accepted)
-- ==========================================
CREATE TABLE chats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_request_id INT NOT NULL UNIQUE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    INDEX idx_service_request_id (service_request_id),
    INDEX idx_is_archived (is_archived)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Chat Messages
-- ==========================================
CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chat_id INT NOT NULL,
    sender_user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_chat_id (chat_id),
    INDEX idx_sender_id (sender_user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Service Completion Review
-- ==========================================
CREATE TABLE service_completions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_request_id INT NOT NULL UNIQUE,
    employee_completion_notes TEXT,
    admin_review_notes TEXT,
    status ENUM('pending_review', 'approved', 'needs_revision', 'closed') DEFAULT 'pending_review',
    submitted_by_employee_at TIMESTAMP NULL,
    reviewed_by_admin INT,
    reviewed_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by_admin) REFERENCES admin(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_reviewed_by (reviewed_by_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Reviews & Ratings
-- ==========================================
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_request_id INT NOT NULL,
    reviewer_user_id INT NOT NULL,
    reviewed_user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_review (service_request_id, reviewer_user_id),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reviewed_user (reviewed_user_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Transactions (Payment tracking)
-- ==========================================
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_request_id INT NOT NULL,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    transaction_type ENUM('service_payment', 'refund', 'withdrawal') DEFAULT 'service_payment',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Notifications
-- ==========================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_type ENUM(
        'new_request',
        'request_accepted',
        'request_rejected',
        'user_confirmed',
        'service_started',
        'chat_message',
        'completion_requested',
        'service_completed',
        'service_reopened',
        'payment_received',
        'review_received',
        'application_approved',
        'application_rejected',
        'application_pending_reapproval'
    ) NOT NULL,
    related_entity_type ENUM('service_request', 'application', 'chat', 'review', 'payment') NULL,
    related_entity_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_notification_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Admin Logs (Audit trail)
-- ==========================================
CREATE TABLE admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Disputes
-- ==========================================
CREATE TABLE disputes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_request_id INT NOT NULL,
    complainant_user_id INT NOT NULL,
    respondent_user_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'investigating', 'resolved', 'closed') DEFAULT 'open',
    resolution_notes TEXT,
    resolved_by_admin INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (complainant_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (respondent_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by_admin) REFERENCES admin(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_resolved_by (resolved_by_admin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Analytics Views
-- ==========================================

-- Employee statistics view
CREATE VIEW employee_stats AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    ep.rating,
    ep.total_reviews,
    ep.total_services_completed,
    ep.is_verified,
    COUNT(DISTINCT ps.id) as active_services,
    COALESCE(AVG(r.rating), 0) as average_rating
FROM users u
LEFT JOIN employee_profiles ep ON u.id = ep.user_id
LEFT JOIN published_services ps ON u.id = ps.employee_id AND ps.is_active = TRUE
LEFT JOIN reviews r ON u.id = r.reviewed_user_id
WHERE u.is_employee = TRUE
GROUP BY u.id, u.email, u.full_name, ep.rating, ep.total_reviews, ep.total_services_completed, ep.is_verified;

-- Service request history view
CREATE VIEW service_request_history AS
SELECT 
    sr.id,
    sr.published_service_id,
    ps.title as service_title,
    g.name as game_name,
    u1.full_name as requester_name,
    u2.full_name as employee_name,
    sr.amount,
    sr.status,
    sr.created_at,
    sr.started_at,
    sr.completed_at
FROM service_requests sr
JOIN published_services ps ON sr.published_service_id = ps.id
JOIN games g ON ps.game_id = g.id
JOIN users u1 ON sr.requester_user_id = u1.id
JOIN users u2 ON sr.employee_user_id = u2.id
ORDER BY sr.created_at DESC;

-- Games with active services count
CREATE VIEW game_stats AS
SELECT 
    g.id,
    g.name,
    g.slug,
    g.genre,
    COUNT(DISTINCT ps.id) as active_services,
    COUNT(DISTINCT ps.employee_id) as total_coaches,
    g.popularity_rank,
    g.is_active
FROM games g
LEFT JOIN published_services ps ON g.id = ps.game_id AND ps.is_active = TRUE
GROUP BY g.id, g.name, g.slug, g.genre, g.popularity_rank, g.is_active
ORDER BY g.popularity_rank ASC;

-- ==========================================
-- Additional Security & Analytics Views
-- ==========================================

-- Active verified coaches with their specializations
CREATE VIEW verified_coaches_with_games AS
SELECT 
    u.id as coach_id,
    u.full_name,
    u.email,
    ep.bio,
    ep.rating,
    ep.total_reviews,
    ep.total_services_completed,
    GROUP_CONCAT(g.name SEPARATOR ', ') as specializations,
    COUNT(DISTINCT g.id) as num_games,
    COUNT(DISTINCT ps.id) as active_services
FROM users u
JOIN employee_profiles ep ON u.id = ep.user_id
LEFT JOIN employee_specializations es ON u.id = es.employee_id
LEFT JOIN games g ON es.game_id = g.id
LEFT JOIN published_services ps ON u.id = ps.employee_id AND ps.is_active = TRUE
WHERE u.is_employee = TRUE AND ep.is_verified = TRUE AND ep.status = 'active'
GROUP BY u.id, u.full_name, u.email, ep.bio, ep.rating, ep.total_reviews, ep.total_services_completed;

-- Top rated coaches by game
CREATE VIEW top_coaches_by_game AS
SELECT 
    g.id as game_id,
    g.name as game_name,
    u.id as coach_id,
    u.full_name,
    ep.rating,
    ep.total_reviews,
    es.rank_in_game,
    es.hourly_rate,
    COUNT(DISTINCT ps.id) as active_services
FROM games g
JOIN employee_specializations es ON g.id = es.game_id
JOIN users u ON es.employee_id = u.id
JOIN employee_profiles ep ON u.id = ep.user_id
LEFT JOIN published_services ps ON u.id = ps.employee_id AND ps.game_id = g.id AND ps.is_active = TRUE
WHERE ep.is_verified = TRUE AND ep.status = 'active'
GROUP BY g.id, g.name, u.id, u.full_name, ep.rating, ep.total_reviews, es.rank_in_game, es.hourly_rate
ORDER BY g.name, ep.rating DESC;

-- Pending service applications (for admin review)
CREATE VIEW pending_applications AS
SELECT 
    sa.id,
    sa.user_id,
    u.full_name as applicant_name,
    u.email,
    g.name as game,
    sa.title,
    sa.price,
    sa.submitted_at,
    DATEDIFF(NOW(), sa.submitted_at) as days_pending
FROM service_applications sa
JOIN users u ON sa.user_id = u.id
JOIN games g ON sa.game_id = g.id
WHERE sa.status = 'pending'
ORDER BY sa.submitted_at ASC;

-- Active service requests with full details
CREATE VIEW active_service_requests AS
SELECT 
    sr.id,
    ps.title as service_title,
    g.name as game,
    u_requester.full_name as requester_name,
    u_employee.full_name as employee_name,
    sr.amount,
    sr.status,
    sr.created_at,
    sr.accepted_at,
    sr.started_at,
    DATEDIFF(NOW(), sr.created_at) as days_open
FROM service_requests sr
JOIN published_services ps ON sr.published_service_id = ps.id
JOIN games g ON ps.game_id = g.id
JOIN users u_requester ON sr.requester_user_id = u_requester.id
JOIN users u_employee ON sr.employee_user_id = u_employee.id
WHERE sr.status IN ('pending', 'accepted', 'in_progress')
ORDER BY sr.created_at DESC;

-- User spending summary
CREATE VIEW user_spending_summary AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    COUNT(DISTINCT sr.id) as total_services_purchased,
    COALESCE(SUM(CASE WHEN sr.status = 'completed' THEN sr.amount ELSE 0 END), 0) as total_spent_completed,
    COALESCE(SUM(CASE WHEN sr.status IN ('pending', 'accepted', 'in_progress') THEN sr.amount ELSE 0 END), 0) as total_in_progress,
    COALESCE(AVG(r.rating), 0) as avg_coach_rating
FROM users u
LEFT JOIN service_requests sr ON u.id = sr.requester_user_id
LEFT JOIN reviews r ON sr.id = r.service_request_id
WHERE u.is_employee = FALSE
GROUP BY u.id, u.full_name, u.email;

-- Coach earnings summary
CREATE VIEW coach_earnings_summary AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    ep.rating,
    ep.total_services_completed,
    COUNT(DISTINCT sr.id) as total_services_delivered,
    COALESCE(SUM(CASE WHEN sr.status = 'completed' THEN sr.amount ELSE 0 END), 0) as total_earnings_gross,
    COALESCE(SUM(CASE WHEN sr.status = 'completed' THEN t.commission_amount ELSE 0 END), 0) as total_platform_fees,
    COALESCE(SUM(CASE WHEN sr.status = 'completed' THEN (sr.amount - t.commission_amount) ELSE 0 END), 0) as net_earnings,
    u.wallet_balance
FROM users u
LEFT JOIN employee_profiles ep ON u.id = ep.user_id
LEFT JOIN service_requests sr ON u.id = sr.employee_user_id AND sr.status = 'completed'
LEFT JOIN transactions t ON sr.id = t.service_request_id AND t.status = 'completed'
WHERE u.is_employee = TRUE
GROUP BY u.id, u.full_name, u.email, ep.rating, ep.total_services_completed, u.wallet_balance;

-- Recent transactions (for audit trail)
CREATE VIEW recent_transactions_audit AS
SELECT 
    t.id,
    t.created_at,
    u_from.full_name as from_user,
    u_to.full_name as to_user,
    t.amount,
    t.commission_amount,
    t.transaction_type,
    t.status,
    g.name as game,
    ps.title as service_title
FROM transactions t
JOIN users u_from ON t.from_user_id = u_from.id
JOIN users u_to ON t.to_user_id = u_to.id
JOIN service_requests sr ON t.service_request_id = sr.id
JOIN published_services ps ON sr.published_service_id = ps.id
JOIN games g ON ps.game_id = g.id
ORDER BY t.created_at DESC;

-- Disputed services (for admin)
CREATE VIEW active_disputes AS
SELECT 
    d.id,
    d.created_at,
    u_complainant.full_name as complainant,
    u_respondent.full_name as respondent,
    ps.title as service_title,
    g.name as game,
    d.reason,
    d.status,
    DATEDIFF(NOW(), d.created_at) as days_open
FROM disputes d
JOIN users u_complainant ON d.complainant_user_id = u_complainant.id
JOIN users u_respondent ON d.respondent_user_id = u_respondent.id
JOIN service_requests sr ON d.service_request_id = sr.id
JOIN published_services ps ON sr.published_service_id = ps.id
JOIN games g ON ps.game_id = g.id
WHERE d.status IN ('open', 'investigating')
ORDER BY d.created_at DESC;

-- User activity summary (security monitoring)
CREATE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.is_employee,
    u.last_login,
    u.account_status,
    u.created_at,
    DATEDIFF(NOW(), u.last_login) as days_since_login,
    CASE 
        WHEN u.last_login IS NULL THEN 'never'
        WHEN DATEDIFF(NOW(), u.last_login) = 0 THEN 'today'
        WHEN DATEDIFF(NOW(), u.last_login) = 1 THEN 'yesterday'
        WHEN DATEDIFF(NOW(), u.last_login) < 7 THEN 'this week'
        WHEN DATEDIFF(NOW(), u.last_login) < 30 THEN 'this month'
        ELSE 'inactive'
    END as activity_status
FROM users u
ORDER BY u.last_login DESC;

-- ==========================================
-- Sample Data (Optional - for testing)
-- ==========================================
-- IMPORTANT: These passwords are placeholders. In production:
-- 1. Use bcrypt, Argon2, or similar for password hashing
-- 2. Use environment variables for sensitive data
-- 3. Never commit real passwords to version control
-- 4. Implement proper authentication middleware

-- Add sample data here as needed for testing

-- ==========================================
-- Security Recommendations & Best Practices
-- ==========================================
-- 1. PASSWORD SECURITY:
--    • Always hash passwords using bcrypt, Argon2, or PBKDF2
--    • Never store plain text passwords
--    • Use strong hashing with proper salt/pepper
--    • Example: bcrypt with cost factor of 10+
--
-- 2. ACCESS CONTROL:
--    • Implement role-based access control (RBAC)
--    • Use prepared statements to prevent SQL injection
--    • Validate all user inputs on application layer
--    • Implement rate limiting for authentication endpoints
--
-- 3. DATA ENCRYPTION:
--    • Use SSL/TLS for all database connections
--    • Consider encrypting sensitive fields (email, etc.)
--    • Use environment variables for credentials
--
-- 4. AUDIT & MONITORING:
--    • Log all admin actions in admin_logs table
--    • Monitor for suspicious account activity
--    • Regular security audits on views and permissions
--    • Keep transaction audit trail intact
--    • Use user_activity_summary view to track user logins
--
-- 5. USER AUTHENTICATION:
--    • Implement 2FA (two_factor_enabled field available)
--    • Track password changes (password_changed_at field)
--    • Track last login (last_login field)
--    • Implement session management with JWT tokens
--
-- 6. COMPLIANCE:
--    • Follow GDPR for user data protection
--    • Implement data retention policies
--    • Enable account deletion/anonymization
--    • Regular backups with encryption
-- ==========================================

-- ==========================================
-- Database Summary
-- ==========================================
-- Total Tables: 17
-- Views: 10 (with comprehensive analytics and security views)
-- 
-- Core Views (Business Analytics):
--  1. employee_stats - Employee overview with ratings and services
--  2. service_request_history - Complete service request timeline
--  3. game_stats - Game popularity and coach availability
--  4. verified_coaches_with_games - Coaches with specializations
--  5. top_coaches_by_game - Ranked coaches by game and rating
--
-- Admin Views (Operational):
--  6. pending_applications - Coach applications awaiting review
--  7. active_service_requests - Ongoing service requests
--  8. recent_transactions_audit - Transaction audit trail
--  9. active_disputes - Open disputes for resolution
-- 10. user_activity_summary - User login activity monitoring
--
-- Financial Views:
-- 11. user_spending_summary - User purchase history & spending
-- 12. coach_earnings_summary - Coach earnings & net income
--
-- Key Features:
--  • Secure password storage with hashing
--  • Dynamic game management (add/remove games)
--  • User authentication (regular + admin)
--  • Employee specializations by game
--  • Employee application workflow
--  • Service request lifecycle
--  • Chat messaging system
--  • Transaction & payment tracking with audit trail
--  • Review & rating system
--  • Admin audit logging for compliance
--  • Dispute resolution system
--  • Notification system
--  • 2FA and security tracking fields
--  • Activity monitoring for security
--  • Comprehensive views for easy data access
-- ==========================================

-- ==========================================
-- Backend Setup Instructions
-- ==========================================
-- Before deploying this database to production:
-- 1. Set up Node.js/Express backend with bcrypt for password hashing
-- 2. Implement JWT authentication for session management
-- 3. Create API endpoints that use these views for secure queries
-- 4. Set up database connection pooling
-- 5. Implement input validation and sanitization (OWASP Top 10)
-- 6. Enable query logging for security audits
-- 7. Set up regular automated backups with encryption
-- 8. Configure SSL/TLS for database connections
-- 9. Implement rate limiting on authentication endpoints
-- 10. Set up monitoring and alerting for suspicious activities
-- 11. Enable MySQL strict mode and remove FILE privileges
-- 12. Restrict database user permissions (principle of least privilege)
-- ==========================================

-- ==========================================
-- Sample Games Data
-- ==========================================
INSERT INTO games (name, slug, description, genre, platform, is_active, popularity_rank) VALUES
('Valorant', 'valorant', 'A 5v5 tactical shooter with unique agent abilities. Master precise gunplay and strategic team coordination.', 'FPS', 'PC', TRUE, 1),
('League of Legends', 'league-of-legends', 'The world''s most popular MOBA. Dominate the Rift with over 160 champions to master.', 'MOBA', 'PC', TRUE, 2),
('Counter-Strike 2', 'cs2', 'The legendary tactical FPS reborn. Precise aim and game sense separate the pros from the rest.', 'FPS', 'PC', TRUE, 3),
('Fortnite', 'fortnite', 'Battle Royale phenomenon with building mechanics. Build, fight, and survive to be the last one standing.', 'Battle Royale', 'Multi-platform', TRUE, 4),
('Apex Legends', 'apex-legends', 'Fast-paced battle royale with unique Legends. Movement and team synergy are key to victory.', 'Battle Royale', 'Multi-platform', TRUE, 5),
('Overwatch 2', 'overwatch-2', 'Team-based hero shooter with diverse roles. Coordinate with your team to secure objectives.', 'FPS', 'Multi-platform', TRUE, 6),
('Dota 2', 'dota-2', 'Complex and rewarding MOBA with infinite depth. Every match is a unique strategic challenge.', 'MOBA', 'PC', TRUE, 7),
('Rocket League', 'rocket-league', 'Soccer meets rocket-powered cars. Master aerial mechanics and team plays.', 'Sports', 'Multi-platform', TRUE, 8),
('Call of Duty: Warzone', 'warzone', 'Intense battle royale action in the Call of Duty universe. Fast TTK and tactical gameplay.', 'Battle Royale', 'Multi-platform', TRUE, 9),
('Rainbow Six Siege', 'rainbow-six-siege', 'Tactical shooter focused on destruction and intel. Every wall can be your path or your enemy''s.', 'FPS', 'Multi-platform', TRUE, 10),
('Minecraft', 'minecraft', 'Endless creativity and survival. Build, explore, and survive in infinite procedural worlds.', 'Sandbox', 'Multi-platform', TRUE, 11),
('FIFA 24', 'fifa-24', 'The beautiful game, digitized. Master skill moves, tactics, and team management.', 'Sports', 'Multi-platform', TRUE, 12),
('Street Fighter 6', 'street-fighter-6', 'Legendary fighting game franchise. Execute combos and read your opponent to victory.', 'Fighting', 'Multi-platform', TRUE, 13),
('Tekken 8', 'tekken-8', 'King of Iron Fist returns. Deep 3D fighting mechanics with a massive roster.', 'Fighting', 'Multi-platform', TRUE, 14),
('World of Warcraft', 'world-of-warcraft', 'The legendary MMORPG. Raid, PvP, and adventure in Azeroth with millions of players.', 'MMORPG', 'PC', TRUE, 15),
('Escape from Tarkov', 'escape-from-tarkov', 'Hardcore tactical shooter with RPG elements. High stakes, high rewards gameplay.', 'FPS', 'PC', TRUE, 16),
('PUBG', 'pubg', 'The original battle royale. Tactical gunplay and survival in a massive open world.', 'Battle Royale', 'Multi-platform', TRUE, 17),
('Teamfight Tactics', 'teamfight-tactics', 'Auto-battler strategy game. Build synergies and adapt to dominate the lobby.', 'Strategy', 'Multi-platform', TRUE, 18),
('Hearthstone', 'hearthstone', 'Digital card game mastery. Build decks and outplay opponents with strategy and timing.', 'Card Game', 'Multi-platform', TRUE, 19),
('Genshin Impact', 'genshin-impact', 'Open-world action RPG adventure. Explore Teyvat and master elemental combat.', 'Action RPG', 'Multi-platform', TRUE, 20);

INSERT INTO admin (email, full_name, password, role) VALUES ('admin1@gmail.com', 'admin1', '$2b$10$LbrlPYuI0hPedxkUAvbuRO6LavgqGDiYYzkyErPPzK9J.p8euUVye', 'regular');
INSERT INTO admin (email, full_name, password, role) VALUES ('admin2@gmail.com', 'admin2', '$2b$10$LbrlPYuI0hPedxkUAvbuRO6LavgqGDiYYzkyErPPzK9J.p8euUVye', 'regular');
INSERT INTO admin (email, full_name, password, role) VALUES ('superadmin@gmail.com', 'superadmin1', '$2b$10$LbrlPYuI0hPedxkUAvbuRO6LavgqGDiYYzkyErPPzK9J.p8euUVye', 'super');

-- ============================================================================
-- GAMERHELPERS SECURITY MIGRATION
-- ============================================================================
-- This migration adds database structures required for the security measures:
--
-- 1. [ACCOUNT BLOCKING] - Add failed_login_attempts column to users and admin
-- 2. [ADMIN AUDIT LOGS] - Create admin_logs table for tracking admin actions
-- 3. [ACCOUNT BLOCKING] - Ensure account_status supports 'blocked' value
-- ============================================================================

USE gamer_helpers;

-- ==========================================
-- [ACCOUNT BLOCKING] Add failed_login_attempts to users table
-- Tracks how many consecutive failed login attempts a user has made.
-- After 3 failed attempts, account_status is set to 'blocked'.
-- Only an admin can reset this by setting account_status back to 'active'.
-- ==========================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS `failed_login_attempts` INT NOT NULL DEFAULT 0;

-- ==========================================
-- [ACCOUNT BLOCKING] Add failed_login_attempts to admin table
-- Same blocking behavior as users table, but for admin accounts.
-- A super admin must unblock a blocked admin account.
-- ==========================================

ALTER TABLE admin
  ADD COLUMN IF NOT EXISTS `failed_login_attempts` INT NOT NULL DEFAULT 0;

-- ==========================================
-- [ADMIN AUDIT LOGS] Create admin_logs table
-- Records every administrative action for security auditing.
-- Tracked actions include:
--   - ADMIN_LOGIN / ADMIN_LOGOUT
--   - APPROVE_APPLICATION / REJECT_APPLICATION
--   - UPDATE_USER_STATUS / UNBLOCK_USER
--   - APPROVE_COMPLETION / REOPEN_COMPLETION
--   - CREATE_ADMIN / UPDATE_ADMIN / DELETE_ADMIN / UNBLOCK_ADMIN
--   - VIEW_CHAT_MESSAGES (viewing sensitive data)
--   - VIEW_ADMIN_LOGS (viewing audit trail)
-- ==========================================

CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL COMMENT 'The admin who performed the action',
  `action` VARCHAR(100) NOT NULL COMMENT 'Action type (e.g., ADMIN_LOGIN, UPDATE_USER_STATUS)',
  `target_type` VARCHAR(50) DEFAULT NULL COMMENT 'Type of entity affected (user, admin, service_application, etc.)',
  `target_id` INT DEFAULT NULL COMMENT 'ID of the affected entity',
  `details` TEXT DEFAULT NULL COMMENT 'Human-readable description of what happened',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP address of the admin at time of action',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the action occurred',
  PRIMARY KEY (`id`),
  KEY `idx_admin_logs_admin_id` (`admin_id`),
  KEY `idx_admin_logs_action` (`action`),
  KEY `idx_admin_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='[ADMIN AUDIT LOGS] Tracks all administrator actions for security auditing';

-- ==========================================
-- Verify the migration
-- ==========================================
-- Run these queries to verify the migration was successful:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'failed_login_attempts';
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admin' AND COLUMN_NAME = 'failed_login_attempts';
-- SHOW TABLES LIKE 'admin_logs';

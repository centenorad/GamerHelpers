-- ============================================================================
-- GAMERHELPERS SECURITY MIGRATION
-- ============================================================================
-- This migration adds database structures required for the security measures:
--
-- 1. [ACCOUNT BLOCKING] - Add failed_login_attempts column to users and admin
-- 2. [ADMIN AUDIT LOGS] - Create admin_logs table for tracking admin actions
-- 3. [ACCOUNT BLOCKING] - Ensure account_status supports 'blocked' value
-- ============================================================================

USE db_gamerhelpers;

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

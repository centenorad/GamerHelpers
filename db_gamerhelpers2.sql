-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 10, 2026 at 11:27 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_gamerhelpers`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_chats`

CREATE DATABASE db_gamerhelpers;
USE db_gamerhelpers;
--

CREATE TABLE `tbl_chats` (
  `chat_id` int(11) NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `is_group` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_chat_members`
--

CREATE TABLE `tbl_chat_members` (
  `chat_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_games`
--

CREATE TABLE `tbl_games` (
  `game_id` int(11) NOT NULL,
  `game_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_games`
--
-- --------------------------------------------------------

--
-- Table structure for table `tbl_messages`
--

CREATE TABLE `tbl_messages` (
  `message_id` int(11) NOT NULL,
  `chat_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0,
  `reply_to_message_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_posts`
--

CREATE TABLE `tbl_posts` (
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `service_type` enum('coaching','piloting') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_posts`
--
-- --------------------------------------------------------

--
-- Table structure for table `tbl_post_images`
--

CREATE TABLE `tbl_post_images` (
  `image_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `image_data` longblob NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_post_images`
--
-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `username` varchar(150) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_users`
--
--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_chats`
--
ALTER TABLE `tbl_chats`
  ADD PRIMARY KEY (`chat_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `tbl_chat_members`
--
ALTER TABLE `tbl_chat_members`
  ADD PRIMARY KEY (`chat_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tbl_games`
--
ALTER TABLE `tbl_games`
  ADD PRIMARY KEY (`game_id`);

--
-- Indexes for table `tbl_messages`
--
ALTER TABLE `tbl_messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `chat_id` (`chat_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `reply_to_message_id` (`reply_to_message_id`),
  ADD KEY `idx_chat_sent` (`chat_id`,`sent_at`);

--
-- Indexes for table `tbl_posts`
--
ALTER TABLE `tbl_posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `game_id` (`game_id`);

--
-- Indexes for table `tbl_post_images`
--
ALTER TABLE `tbl_post_images`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `post_id` (`post_id`);

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_chats`
--
ALTER TABLE `tbl_chats`
  MODIFY `chat_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_games`
--
ALTER TABLE `tbl_games`
  MODIFY `game_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_messages`
--
ALTER TABLE `tbl_messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_posts`
--
ALTER TABLE `tbl_posts`
  MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tbl_post_images`
--
ALTER TABLE `tbl_post_images`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_posts`
--
ALTER TABLE `tbl_posts`
  ADD CONSTRAINT `fk_posts_game` FOREIGN KEY (`game_id`) REFERENCES `tbl_games` (`game_id`),
  ADD CONSTRAINT `fk_posts_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_post_images`
--
ALTER TABLE `tbl_post_images`
  ADD CONSTRAINT `fk_images_post` FOREIGN KEY (`post_id`) REFERENCES `tbl_posts` (`post_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

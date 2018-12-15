-- phpMyAdmin SQL Dump
-- version 4.8.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Dec 15, 2018 at 09:09 PM
-- Server version: 5.7.23
-- PHP Version: 7.2.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `swiftcount`
--

-- --------------------------------------------------------

--
-- Table structure for table `entries`
--

DROP TABLE IF EXISTS `entries`;
CREATE TABLE `entries` (
  `entry_id` int(11) NOT NULL,
  `log_id` int(9) NOT NULL,
  `count` int(2) NOT NULL,
  `time` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs` (
  `log_id` int(11) NOT NULL,
  `logType` int(3) NOT NULL,
  `date` datetime NOT NULL,
  `file_name` varchar(200) NOT NULL,
  `weather` varchar(600) NOT NULL,
  `notes` varchar(600) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `logtypes`
--

DROP TABLE IF EXISTS `logtypes`;
CREATE TABLE `logtypes` (
  `logtype_id` int(11) NOT NULL,
  `logtype_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `logtypes`
--

INSERT INTO `logtypes` (`logtype_id`, `logtype_name`) VALUES
(1, 'video'),
(2, 'realTime');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `entries`
--
ALTER TABLE `entries`
  ADD PRIMARY KEY (`entry_id`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `logtypes`
--
ALTER TABLE `logtypes`
  ADD PRIMARY KEY (`logtype_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `entries`
--
ALTER TABLE `entries`
  MODIFY `entry_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logtypes`
--
ALTER TABLE `logtypes`
  MODIFY `logtype_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

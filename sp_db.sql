-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 04, 2024 at 08:52 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sp_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `clock_log`
--

CREATE TABLE `clock_log` (
  `id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `time` varchar(50) NOT NULL,
  `date` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clock_log`
--

INSERT INTO `clock_log` (`id`, `action`, `time`, `date`) VALUES
(1, 'Clock In', '12:28:20 PM', '10/3/2024'),
(2, 'Clock Out', '12:29:19 PM', '10/3/2024'),
(3, 'Clock In', '12:37:46 PM', '10/3/2024'),
(4, 'Clock Out', '12:37:59 PM', '10/3/2024');

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL,
  `employee_name` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `supervisor_name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` int(11) NOT NULL,
  `resuming_work_days` date NOT NULL,
  `emergency_name` varchar(100) NOT NULL,
  `emergency_address` varchar(100) NOT NULL,
  `emergency_phone_number` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `employee_name`, `date`, `supervisor_name`, `start_date`, `end_date`, `total_days`, `resuming_work_days`, `emergency_name`, `emergency_address`, `emergency_phone_number`) VALUES
(1, 'Taloshili', '2024-10-03', 'Bra G', '2024-10-17', '2024-10-24', 8, '2024-10-25', 'Mom', 'Soweto', 2147483647);

-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `id` int(11) NOT NULL,
  `type_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_types`
--

INSERT INTO `leave_types` (`id`, `type_name`) VALUES
(1, 'Vacation'),
(2, 'Leave of Absence'),
(3, 'Sick - Family'),
(4, 'Sick - Self'),
(5, 'Doctor Appointment'),
(6, 'Funeral'),
(7, 'Other');

-- --------------------------------------------------------

--
-- Table structure for table `overtime_requests`
--

CREATE TABLE `overtime_requests` (
  `id` int(11) NOT NULL,
  `employee_name` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `duration` int(11) NOT NULL,
  `reason` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `printing_requests`
--

CREATE TABLE `printing_requests` (
  `id` int(11) NOT NULL,
  `from` varchar(100) NOT NULL,
  `to` varchar(100) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `message` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `printing_requests`
--

INSERT INTO `printing_requests` (`id`, `from`, `to`, `subject`, `message`) VALUES
(1, 'Taloshili', 'Dylan', 'ID', 'I want to make a copy of my ID');

-- --------------------------------------------------------

--
-- Table structure for table `staff_members`
--

CREATE TABLE `staff_members` (
  `Id` int(11) NOT NULL,
  `Name` varchar(128) NOT NULL,
  `Surname` varchar(128) NOT NULL,
  `ID_Number` bigint(20) DEFAULT NULL,
  `DOB` date NOT NULL,
  `Nationality` varchar(50) NOT NULL,
  `Home_Language` varchar(50) NOT NULL,
  `Other_Languages` varchar(50) NOT NULL,
  `Position` varchar(100) NOT NULL,
  `Password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff_members`
--

INSERT INTO `staff_members` (`Id`, `Name`, `Surname`, `ID_Number`, `DOB`, `Nationality`, `Home_Language`, `Other_Languages`, `Position`, `Password`) VALUES
(3, 'Owen', 'Chilwaloo', 3456789092, '4094-08-09', 'Zambian', 'IDK', 'English', 'Software development', 'Monkey2002'),
(4, 'Emily', 'Manjara', 12345678901, '2004-07-09', 'Namibian', 'Damara', 'English', 'Software developer', 'Monkey2002'),
(5, 'Hozei', 'Naobab', 909045845484, '2002-01-09', 'Namibian', 'IDK', 'English', 'Human Resource', 'Monkey2002'),
(6, 'Christy', 'Diamonds', 123456789012, '2002-06-05', 'Namibian', 'IDK', 'English', 'Human Resource', 'Monkey2002'),
(7, 'Emily', 'Manjara', 123456789013, '2003-06-18', 'Namibian', 'IDK', 'English', 'Admin', 'Monkey2002'),
(8, 'John', 'Doe', 1234567890123, '1985-11-14', 'Namibian', 'IDK', 'English', 'Admin', 'Monkey2002'),
(9, 'jane', 'doe', 34567890924, '2002-09-12', 'Namibian', 'IDK', 'English', 'Admin', 'Monkey2002'),
(10, 'Taloshili', 'Eden', 1234567890143, '2002-09-12', 'Namibian', 'Oshiwambo', 'English', 'Employee', 'Monkey2002'),
(11, 'Johnny', 'Eden', 12345678901098, '2002-09-12', 'Namibian', 'Oshiwambo', 'English', 'Employee', 'Monkey2002'),
(12, 'Hafeni', 'Neliwa', 1234567890100, '2009-02-01', 'Namibian', 'Oshiwambo', 'English', 'Employee', 'Monkey2002'),
(14, 'Floyd', 'Mayweather', 12345678901666, '2002-09-12', 'Namibian', 'Oshiwambo', 'English', 'Employee', 'Monkey2002');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clock_log`
--
ALTER TABLE `clock_log`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leave_types`
--
ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `overtime_requests`
--
ALTER TABLE `overtime_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `printing_requests`
--
ALTER TABLE `printing_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `staff_members`
--
ALTER TABLE `staff_members`
  ADD PRIMARY KEY (`Id`),
  ADD UNIQUE KEY `ID_Number` (`ID_Number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `clock_log`
--
ALTER TABLE `clock_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `leave_types`
--
ALTER TABLE `leave_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `overtime_requests`
--
ALTER TABLE `overtime_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `printing_requests`
--
ALTER TABLE `printing_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `staff_members`
--
ALTER TABLE `staff_members`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

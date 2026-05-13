# Project TogetherLearn - Repository Overview

Based on an exploration of the codebase, here is a comprehensive breakdown of the architecture, technology stack, and core concepts of **TogetherLearn**.

## 1. High-Level Architecture
The repository is a monorepo containing two main parts that act as a decoupled Client-Server architecture:
*   **Backend**: A REST API built with Node.js and Express, connected to a MongoDB database (via Mongoose). It is designed to be deployed as a standard Node.js application.
*   **Frontend**: A modern web application built with Next.js (App Router), React 19, and Tailwind CSS. It communicates with the backend via a centralized API service.

## 2. Technology Stack

### Backend
*   **Framework**: Express.js
*   **Database**: MongoDB (Mongoose ORM)
*   **Authentication**: JSON Web Tokens (JWT) and `bcryptjs` for password hashing
*   **Validation**: `zod` for robust schema validation
*   **File Uploads**: `multer` and `cloudinary` for handling media
*   **Deployment**: Deployable on standard Node.js hosting; includes a backend wrapper for flexible hosting options

### Frontend
*   **Framework**: Next.js 16 (React 19)
*   **Styling**: Tailwind CSS 4 with `@headlessui/react` and `@heroicons/react`
*   **State / Forms**: `react-hook-form` with `@hookform/resolvers` (Zod integration)
*   **Image Management**: `react-easy-crop`
*   **Notifications**: `react-hot-toast`

## 3. Core Domain Concepts
The application serves as a collaborative learning platform tailored for university students (seemingly modeled around the Faculty of Engineering, University of Sri Jayewardenepura, judging from the pre-seeded department data). 

Here are the primary entities and features:

*   **Users ([User.ts](file:///d:/M3%20Projects/Project_TogetherLearn/backend/src/models/User.ts))**: Students enrolled in the platform. They are categorized by `department` (e.g., Civil, Computer, Electrical, Mechanical, First Year) and `batch`.
*   **Course Modules ([CourseModule.ts](file:///d:/M3%20Projects/Project_TogetherLearn/backend/src/models/CourseModule.ts) & [university_curriculum_courses.json](file:///d:/M3%20Projects/Project_TogetherLearn/university_curriculum_courses.json))**: Represent university courses mapped to specific semesters and departments (e.g., *CE1201: Properties of Materials*).
*   **Group Study ([GroupStudy.ts](file:///d:/M3%20Projects/Project_TogetherLearn/backend/src/models/GroupStudy.ts))**: Allows students to organize and schedule study sessions. These can be physical or virtual and are tied directly to a specific course module.
*   **Group Messages ([GroupMessage.ts](file:///d:/M3%20Projects/Project_TogetherLearn/backend/src/models/GroupMessage.ts))**: A chat/communication layer, likely attached to the Group Study sessions.
*   **Peer Teaching & Requests ([PeerTeaching.ts](file:///d:/M3%20Projects/Project_TogetherLearn/backend/src/models/PeerTeaching.ts), [PeerRequest.ts](file:///d:/M3%20Projects/Project_TogetherLearn/backend/src/models/PeerRequest.ts))**: A system allowing students to request help or offer peer tutoring sessions to each other.
*   **Questions ([Question.ts](file:///d:/M3%20Projects/Project_TogetherLearn/backend/src/models/Question.ts))**: A Q&A forum where students can ask academic questions and get answers from their peers.
*   **Notifications ([Notification.ts](file:///d:/M3%20Projects/Project_TogetherLearn/backend/src/models/Notification.ts))**: An internal system to alert users of upcoming study groups, replies to questions, or peer teaching requests.

## 4. Frontend Structure
*   `src/app/auth`: Handles user login and registration.
*   `src/app/onboarding`: The flow for newly registered users to complete their profile (selecting department, batch, etc.).
*   `src/app/dashboard`: The core application interface containing features like study groups, Q&A, and peer teaching.
*   [src/lib/api.ts](file:///d:/M3%20Projects/Project_TogetherLearn/frontend/src/lib/api.ts): A centralized Axios/Fetch wrapper that interacts with the backend routes.

## Summary
**TogetherLearn** is a well-structured, modern stack application dedicated to improving student collaboration through group studies, peer-to-peer teaching, and specialized course discussions. The infrastructure supports flexible hosting options for both the Next.js frontend and the Express.js backend API.

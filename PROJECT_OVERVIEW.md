# Project TogetherLearn - Overview

**TogetherLearn** is a collaborative learning platform built specifically for university students. It is tailored towards engineering faculties, allowing students to collaborate, study together, ask questions, and offer peer-to-peer tutoring.

---

## 1. High-Level Architecture

The project is built as a **monorepo** containing two completely separate systems:

- **Backend (Server)**: A REST API that handles all data management, authentication, and business logic, deployable on standard Node.js hosting.
- **Frontend (Client)**: The user-facing web application that students interact with in their browsers.

---

## 2. Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| **Express.js** (Node.js) | Web framework for building the REST API |
| **MongoDB + Mongoose** | Database and ORM for data modeling |
| **JSON Web Tokens (JWT)** | Secure authentication sessions |
| **bcryptjs** | Password hashing for security |
| **Zod** | Schema validation for incoming requests |
| **Multer + Cloudinary** | File uploads and cloud media storage |
| **TypeScript** | Static typing to prevent runtime errors |
| **serverless-http** | Wraps Express backend routing for flexible deployment options |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | React 19 web framework |
| **Tailwind CSS 4** | Utility-first styling |
| **Headless UI + Heroicons** | Accessible components and SVG icons |
| **react-hook-form + Zod** | Form state management and validation |
| **react-hot-toast** | Pop-up notifications |
| **react-easy-crop** | User profile picture cropping |

---

## 3. Core Features & Entities

### 👤 Users
Students are the primary users. When registered, they are categorized by:
- **Department**: Civil (CE), Computer (CO), Electrical (EEE), Mechanical (ME), or First Year
- **Batch**: Batch 1 through Batch 10
- Account fields: `name`, `email`, `registrationNumber`, `indexNumber`, `avatarUrl`, `courses`

### 📚 Course Modules
University subjects (e.g. *CE1201: Properties of Materials*, *CO3201: Database Systems*) mapped to specific semesters and departments. Seeded from `university_curriculum_courses.json` which covers all 4 engineering departments across 8 semesters.

### 👥 Group Study
Students can organize scheduled study sessions linked to a specific Course Module. Key properties:
- `mode`: virtual or physical
- `date`, `time`, `location`
- `participants` and `hosts` (by userId)
- Can optionally become a **Peered Class** linked to a PeerTeaching session

### 💬 Group Messages
An in-session chat system attached to Group Study sessions for real-time discussion.

### 🎓 Peer Teaching & Requests
An academic exchange system:
- **PeerRequest**: A student needing help can post a request specifying the Module and topic.
- **PeerTeaching**: A peer who excels can offer tutoring sessions.

### ❓ Questions (Q&A)
A forum feature where students can ask academic questions and receive peer answers, organized by module.

### 🔔 Notifications
An internal alert system that notifies users about:
- Upcoming study groups
- Replies to Q&A posts
- Updates on Peer Teaching requests

---

## 4. Frontend Route Structure

```
src/app/
├── auth/          → Login and Registration pages
├── onboarding/    → Post-registration setup (department, batch, avatar)
└── dashboard/     → Main hub (study groups, Q&A, peer teaching)
```

### Key Frontend Files:
- **`src/lib/api.ts`**: Centralized API client that interacts with all backend endpoints
- **`src/lib/auth.tsx`**: Authentication context/provider
- **`src/components/NavBar.tsx`**: Navigation bar

---

## 5. Deployment

The application is ready for deployment as a Node.js backend plus a Next.js frontend. Configure the required environment variables and deploy using the hosting platform of your choice.

### Required Environment Variables

| Variable | Service | Description |
|---|---|---|
| `MONGODB_URI` | Backend | MongoDB Atlas connection string |
| `JWT_SECRET` | Backend | Secret key for JWT signing |
| `CORS_ORIGIN` | Backend | Frontend URL for CORS allowlist |
| `CLOUDINARY_CLOUD_NAME` | Backend (optional) | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Backend (optional) | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Backend (optional) | Cloudinary API secret |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API base URL |

---

## 6. Local Development

```bash
# Run the backend
cd backend && npm i && npm run dev

# Run the frontend (in a separate terminal)
cd frontend && npm i && npm run dev
```

> **Note**: The backend requires a local `MONGODB_URI` environment variable set in a `.env` file.

---

## Summary

**TogetherLearn** is a modern, scalable web application designed to digitize university study groups and peer tutoring. Using a **MERN stack variant** (MongoDB, Express, React/Next.js, Node.js) with TypeScript throughout, it enables engineering students to collaborate via group studies, peer teaching, and a Q&A forum — all organized around their actual university curriculum.

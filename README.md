Together Learn

This monorepo contains two main apps:

- `backend` — Express + MongoDB API
- `frontend` — Next.js app

## Local development

- Backend: `cd backend && npm install && npm run dev`
- Frontend: `cd frontend && npm install && npm run dev`

## Environment variables

- **Backend**: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, optional `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Frontend**: `NEXT_PUBLIC_API_URL`

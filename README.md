Margaret Forum

Classroom-friendly cartoony forum. Frontend (React + Tailwind) and Backend (Node + Express + PostgreSQL). Ready for Render.

Structure
- /backend: Express API with JWT auth, PostgreSQL
- /frontend: React app (CRA) + Tailwind
- render.yaml: Deploy both services on Render

Environment Variables
- DATABASE_URL (backend): PostgreSQL connection string
- JWT_SECRET (backend): secret for JWT
- REACT_APP_API_URL (frontend): backend API base, e.g. https://<backend-on-render>.onrender.com/api

Local Setup
1. Backend
   - In backend/.env:
     DATABASE_URL=postgres://user:pass@localhost:5432/margaretforum
     JWT_SECRET=devsecret
   - Install and run:
     cd backend
     npm install
     npm run dev
     # server on http://localhost:5000
2. Frontend
   - In frontend/.env:
     REACT_APP_API_URL=http://localhost:5000/api
   - Install and run:
     cd frontend
     npm install
     npm start
     # app on http://localhost:3000

Database
- On server start, the backend ensures schema from src/db/schema.sql.

Deploy on Render
1. Push repo to GitHub.
2. Render Blueprint (recommended):
   - In Render, create a New Blueprint from your repo; it will read render.yaml and provision:
     - Web Service: margaretforum-backend
     - Static Site: margaretforum-frontend
   - Set backend env vars in the service settings: DATABASE_URL, JWT_SECRET.
   - The frontend REACT_APP_API_URL is auto-wired to backend RENDER_EXTERNAL_URL via render.yaml.
3. Alternatively create services manually:
   - Web Service from backend with start: node server.js.
   - Static Site from frontend with build: npm install && npm run build and publish build folder.
   - Set env accordingly.

Categories
- Academics, Class Life, Ideas & Suggestions, Random Thoughts

Roles
- student by default. Create an admin by updating a user row role to admin or teacher in the DB.

Notes
- Images are by URL; to support uploads, add storage service and endpoints.
- Guest posting can be added by allowing token-less create with server-side flag.


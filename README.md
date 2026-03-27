# Coder's Compass

Navigate your path to coding mastery.

Coder's Compass is a full-stack competitive programming companion that unifies stats from multiple platforms, provides AI assistance, and helps you plan contests and learning in one place.

Live Demo: https://coders-compass.vercel.app

![Coder's Compass Dashboard](./screenshots/dashboard.png)

## Key Features

- Multi-platform profile tracking across Codeforces, LeetCode, and CodeChef
- Unified dashboard with solved counts, platform cards, heatmap, and rating history
- AI Coach powered by Google Gemini for hint-based guidance
- Contest Calendar with upcoming contests and one-click Google Calendar add
- CC Leaderboard with global, monthly, and weekly windows
- Learning Resources page for curated CP and interview prep links
- Protected routes with JWT auth and rate limiting
- Resilient caching with Redis Cloud and automatic in-memory fallback

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, React Calendar Heatmap
- Backend: Node.js, Express
- Database: MongoDB Atlas
- Cache: Redis Cloud (`redis` client) with memory fallback adapter
- AI: Google Gemini
- External APIs: Codeforces API, LeetCode GraphQL, CodeChef endpoints
- Deployment: Vercel (frontend), Render (backend)

## Architecture

```text
Client (React)
      |
      v
API Server (Node.js / Express)
      |
      +--> Redis Cache Layer (Redis Cloud -> memory fallback)
      +--> MongoDB Atlas
      +--> Codeforces API
      +--> LeetCode GraphQL
      +--> CodeChef
      +--> Gemini AI
```

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB connection string
- Redis Cloud credentials (or use memory-only fallback)
- Gemini API key

### 1) Clone

```bash
git clone https://github.com/Vermadeepakd1/coders-compass.git
cd coders-compass
```

### 2) Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key

# Redis (recommended)
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_USERNAME=default
REDIS_PASSWORD=your_redis_password

# Optional alternate form
# REDIS_URL=redis://username:password@host:port

# Optional: force memory-only cache
# CACHE_DRIVER=memory
```

Run backend:

```bash
npm run dev
```

### 3) Frontend Setup

```bash
cd ../client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

App runs at `http://localhost:5173`.

## Notes on Caching

- If Redis is healthy, cache reads/writes use Redis Cloud.
- If Redis is unavailable, caching automatically falls back to in-memory TTL cache.
- In-memory cache is fast but non-persistent (clears on server restart).

## Contributing

1. Fork the repository
2. Create a branch (`feature/your-feature`)
3. Commit your changes
4. Push to your branch
5. Open a pull request

## Contact

- Email: vermadeepakd1@gmail.com
- GitHub: https://github.com/Vermadeepakd1

# Coder's Compass 🧭

**Navigate Your Path to Coding Mastery**

Coder's Compass is an all-in-one dashboard designed for competitive programmers. It unifies your profiles from LeetCode and Codeforces, providing AI-powered insights, personalized problem recommendations, and detailed analytics to help you improve faster and more efficiently.

![Coder's Compass Dashboard](https://via.placeholder.com/800x400?text=Coder%27s+Compass+Dashboard+Preview)

## 🚀 Features

### ✅ Implemented

- **Unified Dashboard**: View your stats, ratings, and submission history from LeetCode and Codeforces in one centralized view.
- **AI Coach**: A personalized AI assistant (powered by Gemini) that analyzes your performance and suggests the next best problems to solve.
- **Submission Heatmap**: A GitHub-style heatmap visualizing your daily coding activity across all connected platforms.
- **Rating History Graphs**: Interactive graphs tracking your contest ratings over time for both Codeforces and LeetCode.
- **Problem Explorer**: Filter and find LeetCode problems by tag and difficulty.
- **Smart Recommendations**: Get problem suggestions tailored to your current skill level.

### 🔮 Coming Soon

- **CodeChef Integration**: Track your CodeChef ratings and stars.
- **Contest Reminders**: Get notified about upcoming contests via email or push notifications.
- **Friend Leaderboards**: Add friends and compete on custom leaderboards.
- **Topic Strength Analysis**: Detailed breakdown of your strong and weak topics (e.g., DP, Graphs, Greedy).

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Caching**: Redis (for caching Codeforces API responses)
- **AI Integration**: Google Gemini API
- **External APIs**: LeetCode GraphQL API, Codeforces API

## 📦 Installation & Setup

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (Local instance or MongoDB Atlas)
- Redis (Optional, but recommended for caching)
- API Keys for Google Gemini

### 1. Clone the Repository

```bash
git clone https://github.com/Vermadeepakd1/coders-compass.git
cd coders-compass
```

### 2. Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
```

Start the backend server:

```bash
npm start
# or for development with nodemon
npm run dev
```

### 3. Frontend Setup

Navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

## 🤝 Contribution Guidelines

We welcome contributions from the community! Whether it's fixing bugs, adding new features, or improving documentation, your help is appreciated.

1.  **Fork the Project**: Click the "Fork" button at the top right of this page.
2.  **Clone your Fork**: `git clone https://github.com/YOUR_USERNAME/coders-compass.git`
3.  **Create a Feature Branch**: `git checkout -b feature/AmazingFeature`
4.  **Commit your Changes**: `git commit -m 'Add some AmazingFeature'`
5.  **Push to the Branch**: `git push origin feature/AmazingFeature`
6.  **Open a Pull Request**: Go to the original repository and open a PR describing your changes.

### Code Style

- Please ensure your code follows the existing style (ESLint configuration provided).
- Use meaningful variable and function names.
- Comment your code where necessary.

## 📞 Contact & Support

If you have any suggestions, doubts, or want to report a bug, please feel free to reach out.

**Email**: [vermadeepakd1@gmail.com](mailto:vermadeepakd1@gmail.com)

---

_Built with ❤️ by [Deepak Verma](https://github.com/Vermadeepakd1)_

# InsightIQ Development Setup Guide

## 🎯 Project Overview

InsightIQ is an AI-powered interview practice platform that provides:
- **Real-time sentiment analysis** during interview practice
- **Personalized feedback** based on communication patterns
- **Performance tracking** with detailed analytics
- **Gamification** with badges and progress tracking

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast

### Backend (Node.js + Express)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Security**: Helmet, CORS, Rate Limiting
- **AI/ML**: Sentiment analysis with custom algorithms
- **File Upload**: Multer (for future audio/video)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or cloud)
- Git

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repo-url>
cd insightIQ

# Install root dependencies
npm install
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies (if network allows)
npm install express mongoose cors dotenv bcryptjs jsonwebtoken helmet express-rate-limit sentiment nodemon

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
# MongoDB default: mongodb://localhost:27017/insightiq
```

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Dependencies are already installed
npm run dev
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 5. Seed Database (Optional)
```bash
cd backend
npm run seed
```

## 📁 Project Structure

```
insightIQ/
├── backend/                 # Node.js API server
│   ├── models/             # MongoDB schemas
│   │   ├── User.js         # User model with auth
│   │   ├── Interview.js    # Interview sessions
│   │   └── QuestionBank.js # Interview questions
│   ├── routes/             # API endpoints
│   │   ├── auth.js         # Authentication
│   │   ├── interview.js    # Interview management
│   │   ├── analysis.js     # Sentiment analysis
│   │   └── user.js         # User management
│   ├── middleware/         # Express middleware
│   │   └── auth.js         # JWT verification
│   ├── utils/              # Utility functions
│   │   ├── sentimentAnalysis.js # AI analysis engine
│   │   └── seedData.js     # Database seeding
│   ├── scripts/            # Database scripts
│   └── server.js           # Express app entry
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Navbar.jsx  # Navigation bar
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/          # Route components
│   │   │   ├── Home.jsx    # Landing page
│   │   │   ├── Login.jsx   # Authentication
│   │   │   ├── Dashboard.jsx # User dashboard
│   │   │   ├── Interview.jsx # Interview list
│   │   │   └── Analytics.jsx # Performance charts
│   │   ├── stores/         # Zustand state management
│   │   │   └── authStore.js # Authentication state
│   │   ├── utils/          # Utility functions
│   │   │   └── api.js      # Axios configuration
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # React entry point
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
│
├── shared/                 # Shared types/utilities
├── docs/                   # Documentation
└── README.md              # Project overview
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Interviews
- `GET /api/interviews` - List user interviews
- `POST /api/interviews` - Create new interview
- `GET /api/interviews/:id` - Get interview details
- `PUT /api/interviews/:id/start` - Start interview
- `PUT /api/interviews/:id/questions/:questionId/response` - Submit response
- `PUT /api/interviews/:id/complete` - Complete interview

### Analysis
- `POST /api/analysis/text` - Analyze text sentiment
- `GET /api/analysis/dashboard` - Get dashboard analytics
- `GET /api/analysis/interview/:id` - Get interview analysis

## 🎨 Key Features Implemented

### ✅ Completed Features
1. **Project Structure** - Full-stack setup with React + Node.js
2. **Authentication System** - JWT-based auth with registration/login
3. **User Interface** - Modern, responsive design with Tailwind CSS
4. **Navigation & Routing** - Protected routes and navigation
5. **Database Models** - User, Interview, and QuestionBank schemas
6. **API Framework** - RESTful API with Express.js
7. **Sentiment Analysis Engine** - Custom sentiment analysis utility
8. **Question Bank** - Pre-populated interview questions

### 🚧 In Progress
1. **Interview Session** - Real-time interview practice interface
2. **Audio/Video Recording** - Media capture for comprehensive analysis
3. **Advanced Analytics** - Chart.js integration for performance tracking

### 📋 Upcoming Features
1. **Dashboard Analytics** - Performance charts and insights
2. **Gamification** - Badges, achievements, progress tracking
3. **AI Feedback** - Personalized improvement suggestions
4. **Export Reports** - PDF reports of interview performance

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Request rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization

## 🎯 Usage Flow

1. **Registration/Login** - Users create accounts or sign in
2. **Dashboard** - View performance overview and quick actions
3. **Start Interview** - Choose type (technical, behavioral, HR, situational)
4. **Practice Session** - Answer questions with text/voice/video
5. **Real-time Analysis** - AI analyzes sentiment, confidence, clarity
6. **Feedback** - Receive detailed feedback and improvement suggestions
7. **Progress Tracking** - View analytics and track improvement over time
8. **Achievements** - Earn badges and unlock milestones

## 🔮 Future Enhancements

- **Speech-to-Text** integration for voice analysis
- **Video analysis** for body language assessment
- **HuggingFace integration** for advanced NLP
- **Multi-language support**
- **Team/enterprise features**
- **Interview scheduling** with calendar integration
- **Mock interview with human experts**

## 🐛 Troubleshooting

### Common Issues

1. **Frontend not connecting to backend**
   - Check if backend is running on port 5000
   - Verify VITE_API_URL in frontend/.env

2. **Database connection failed**
   - Ensure MongoDB is running
   - Check MONGODB_URI in backend/.env

3. **Authentication not working**
   - Verify JWT_SECRET is set in backend/.env
   - Check browser localStorage for auth token

4. **Npm install fails**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and package-lock.json, then reinstall

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for better interview preparation**
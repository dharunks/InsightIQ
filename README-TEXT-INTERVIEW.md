# InsightIQ - Text-Based Interview Practice Platform

🎯 **A focused interview practice platform that emphasizes text-based responses with AI-powered analysis and personalized feedback.**

## 🔑 Core Features

- **Text-Based Interview Practice** ✍️ - Practice interviews with text responses only (no audio/video required)
- **AI-Powered Text Analysis** 🧠 - Advanced sentiment analysis, confidence scoring, and clarity assessment
- **Automated Answer Scoring** 📊 - Compare your responses against expected answers with detailed feedback
- **Performance Dashboard** 📈 - Track your progress over time with comprehensive analytics
- **Multiple Interview Types** 🎯 - Technical, behavioral, HR, and situational interview questions

## 🛠️ Tech Stack

### Frontend
- **React.js** with **Vite** for fast development
- **Tailwind CSS** for modern, responsive styling
- **Chart.js** for performance visualizations
- **React Router** for navigation
- **Zustand** for state management

### Backend
- **Node.js** with **Express.js** REST API
- **MongoDB** for data storage
- **JWT** for authentication
- **Custom NLP Algorithms** for text analysis

### AI/ML Integration
- **Custom Sentiment Analysis Engine** for evaluating confidence and clarity
- **Keyword Matching Algorithms** for answer scoring
- **Text Similarity Metrics** for comprehensive evaluation

## 📁 Project Structure

```
insightIQ/
├── frontend/          # React + Vite frontend
├── backend/           # Node.js + Express backend
├── shared/            # Shared utilities
└── docs/              # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- npm or yarn

### Installation

1. **Backend Setup**
```bash
cd backend
npm install
```

2. **Frontend Setup**
```bash
cd frontend
npm install
```

3. **Environment Configuration**
- Copy `backend/.env.example` to `backend/.env`
- Update `MONGODB_URI` with your MongoDB connection string
- Set a secure `JWT_SECRET`

4. **Database Seeding (Optional)**
```bash
cd backend
npm run seed
```

5. **Start Development Servers**

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

## 🎯 How It Works

### 1. Create an Account
Register for a new account or log in with existing credentials.

### 2. Start an Interview
- Choose an interview type (Technical, Behavioral, HR, or Situational)
- Select difficulty level (Beginner, Intermediate, Advanced)
- Specify number of questions

### 3. Answer Questions
- Read each question carefully
- Type your response in the text area
- Submit each answer individually for analysis

### 4. Receive AI Analysis
After submitting each response, you'll get detailed feedback:
- **Confidence Score** - How confident your response sounds
- **Clarity Score** - How clear and structured your answer is
- **Answer Quality** - How well your response matches expected key points
- **Keyword Analysis** - Which important terms you included or missed
- **Improvement Suggestions** - Personalized recommendations

### 5. Review Performance
After completing the interview:
- View overall performance metrics
- See detailed analysis for each question
- Track progress over multiple interviews
- Identify areas for improvement

## 🎯 Gamification System

InsightIQ includes a comprehensive gamification system to motivate and engage users in their interview practice journey:

### Experience Points (XP) & Levels
- Earn XP for completing interviews and achieving high scores
- Level up as you accumulate XP
- Track your progression from Beginner to Expert Interviewer

### Badges & Achievements
Earn badges for various accomplishments:
- **First Steps** - Complete your first interview
- **Getting Started** - Complete 3 interviews
- **Dedicated Learner** - Complete 10 interviews
- **Confidence Master** - Achieve confidence score above 8.0
- **Clarity Champion** - Achieve clarity score above 8.5
- **Perfectionist** - Score perfect 10 in any category
- **Consistency King** - Complete interviews 7 days in a row
- **Improvement Seeker** - Show 20% improvement in any skill
- **Technical Expert** - Complete 5 technical interviews

### Practice Streaks
- Build momentum with daily practice streaks
- Visual indicators show your current streak
- Motivational messages encourage continued practice

### Goal Tracking
Track progress toward daily, weekly, and monthly goals:
- **Daily**: Complete interviews, practice for specific time periods
- **Weekly**: Complete multiple interviews, improve confidence scores
- **Monthly**: Complete interview milestones, earn new badges

### Leaderboard
- Compete with other users globally
- See how you rank against others
- Motivation to improve and level up

## 🎯 Key Features Explained

### Text Analysis Engine
Our custom-built text analysis engine evaluates your responses based on:
- **Sentiment Analysis** - Determines the emotional tone of your response
- **Confidence Scoring** - Assesses how assertive and self-assured your language is
- **Clarity Assessment** - Evaluates the structure and coherence of your answer
- **Keyword Matching** - Identifies important terms and concepts relevant to the question

### Answer Scoring System
Each response is scored against expected answers using:
- **Keyword Coverage** - Percentage of important terms you included
- **Content Similarity** - How closely your response matches expected content
- **Response Quality** - Overall effectiveness of your answer

### Performance Tracking
- Track your scores over time
- Compare performance across different interview types
- Identify patterns in your strengths and weaknesses
- Set goals for improvement

## 🎨 User Interface

### Dashboard
- Overview of your interview history
- Performance statistics and trends
- Quick access to start new interviews

### Interview Session
- Clean, distraction-free interface
- Question display with category information
- Text response area with real-time feedback
- Progress tracking

### Results & Analytics
- Detailed breakdown of each question's analysis
- Overall performance scores
- Visual charts showing progress over time
- Personalized improvement recommendations

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Request rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization

## 📋 Development Roadmap

- [x] Text-based interview system
- [x] AI-powered text analysis
- [x] Answer scoring against expected responses
- [x] Performance dashboard
- [x] User authentication and profiles
- [ ] Advanced analytics and reporting
- [ ] Interview scheduling with calendar integration
- [ ] Export interview results to PDF
- [ ] Mobile-responsive design enhancements

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
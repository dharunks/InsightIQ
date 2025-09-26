# Database Setup Guide

## Issue
Your login and registration are failing because MongoDB is not connected. Here are your options to fix this:

## Option 1: MongoDB Atlas (Cloud Database) - **RECOMMENDED**

1. **Create a free MongoDB Atlas account:**
   - Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
   - Sign up for a free account
   - Create a new project called "InsightIQ"

2. **Create a cluster:**
   - Click "Build a Database" 
   - Choose "M0 Sandbox" (free tier)
   - Select your preferred region
   - Name your cluster (e.g., "insightiq-cluster")

3. **Configure database access:**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Set user privileges to "Read and write to any database"

4. **Configure network access:**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Choose "Allow access from anywhere" (0.0.0.0/0) for development
   - Or add your specific IP address for better security

5. **Get your connection string:**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/`)

6. **Update your .env file:**
   - Replace the MongoDB URI in your `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/insightiq
   ```
   - Replace `username` and `password` with your actual credentials

## Option 2: Local MongoDB Installation

1. **Install MongoDB Community Server:**
   - Download from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - Run the installer
   - During installation, select "Install MongoD as a Service"

2. **Start MongoDB service:**
   ```powershell
   net start MongoDB
   ```

3. **Verify installation:**
   ```powershell
   mongod --version
   ```

4. **Your .env file should use:**
   ```
   MONGODB_URI=mongodb://localhost:27017/insightiq
   ```

## Option 3: Docker MongoDB (Alternative)

If you have Docker installed:

```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

## After Database Setup

1. **Restart your backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test the connection:**
   - Try registering a new account
   - Try logging in

## Troubleshooting

- **"Network timeout"**: Check your internet connection for Atlas, or ensure MongoDB service is running for local setup
- **"Authentication failed"**: Verify your username/password in the connection string
- **"Connection refused"**: For local MongoDB, ensure the service is started
- **Still having issues?**: Check the backend console for specific error messages

## Recommended: MongoDB Atlas Benefits

- ✅ No local installation required
- ✅ Automatic backups
- ✅ Free tier available
- ✅ Better for development and production
- ✅ Built-in security features
- ✅ Easy to share with team members
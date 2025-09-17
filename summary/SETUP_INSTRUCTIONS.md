# Civic Issue Reporting System - Setup Instructions

## Prerequisites Installation

### 1. Install Node.js
```bash
# Using winget (Windows Package Manager)
winget install OpenJS.NodeJS

# Or download from: https://nodejs.org/
```

### 2. Install MongoDB
```bash
# Using winget
winget install MongoDB.Server

# Or download from: https://www.mongodb.com/try/download/community
```

## Quick Start Guide

### Step 1: Install Dependencies

#### Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Frontend Dependencies
```bash
# In the root directory
npm install
```

### Step 2: Start MongoDB
```bash
# Start MongoDB service (Windows)
net start MongoDB

# Or start manually
mongod
```

### Step 3: Create Admin User
```bash
python scripts/create-admin-user.py
```

### Step 4: Start the Application

#### Start Backend (Terminal 1)
```bash
cd backend
python app.py
```
Backend will run on: http://localhost:5000

#### Start Frontend (Terminal 2)
```bash
npm run dev
```
Frontend will run on: http://localhost:3000

## Default Admin Credentials
- Email: admin@civicreport.com
- Password: admin123

## Environment Configuration
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Troubleshooting

### MongoDB Connection Issues
1. Ensure MongoDB service is running
2. Check if port 27017 is available
3. Try restarting MongoDB service

### Node.js Issues
1. Restart terminal after Node.js installation
2. Verify installation: `node --version`
3. Update npm: `npm install -g npm@latest`

## Alternative: Using MongoDB Atlas (Cloud)
If local MongoDB installation fails, you can use MongoDB Atlas:

1. Create account at https://cloud.mongodb.com/
2. Create a free cluster
3. Get connection string
4. Update backend/app.py line 29 with your connection string

## Features Available
- User registration and authentication
- Issue reporting with photo upload
- Real-time notifications
- Admin dashboard
- Progressive Web App (PWA) capabilities
- Offline support

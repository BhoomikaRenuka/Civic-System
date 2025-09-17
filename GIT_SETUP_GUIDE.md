# 🚀 Git Setup and Push Guide

## 📋 Prerequisites

### 1. Install Git (if not already installed)
If Git is not installed, download and install it from: https://git-scm.com/download/windows

Or use winget (run as administrator):
```powershell
winget install --id Git.Git -e --source winget
```

### 2. Configure Git (First time setup)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 🔧 Push Code to GitHub Repository

### Step 1: Initialize Git Repository
```bash
cd "c:\Users\Shrusti\Downloads\Civic-issue\Civic-Issue-Reporting-System-main"
git init
```

### Step 2: Add Remote Repository
```bash
git remote add origin https://github.com/BhoomikaRenuka/Civic-System.git
```

### Step 3: Create .gitignore file
```bash
echo "node_modules/" > .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo "uploads/" >> .gitignore
echo ".next/" >> .gitignore
echo "dist/" >> .gitignore
```

### Step 4: Add all files
```bash
git add .
```

### Step 5: Create initial commit
```bash
git commit -m "Initial commit: Complete Civic Issue Reporting System with real-time features

Features implemented:
- User registration and authentication
- Issue reporting with categories (Road, Waste, Electricity, Water, Other)
- Staff role system with category-based access control
- Admin panel with full system oversight
- Real-time WebSocket connections for instant updates
- Email notifications on status changes
- MongoDB database integration
- JWT authentication with role-based access
- File upload capabilities
- Responsive UI with Next.js and HTML interfaces
- Staff dashboard with removed unnecessary sections
- Real-time data synchronization between all interfaces

Staff accounts:
- road.staff@civicreport.com / road123
- waste.staff@civicreport.com / waste123
- lighting.staff@civicreport.com / lighting123
- water.staff@civicreport.com / water123
- general.staff@civicreport.com / general123

Admin account:
- admin@civicreport.com / admin123"
```

### Step 6: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

## 🔄 Alternative: If Repository Already Exists

If the repository already has content, you might need to force push:

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

Or force push (⚠️ This will overwrite existing content):
```bash
git push -u origin main --force
```

## 📁 Project Structure Being Pushed

```
Civic-Issue-Reporting-System-main/
├── app/                          # Next.js frontend
│   ├── admin/                    # Admin pages
│   ├── dashboard/                # Dashboard with staff modifications
│   ├── issues/                   # Issues listing
│   ├── login/                    # Login page
│   ├── my-reports/               # User reports
│   ├── register/                 # Registration
│   ├── report/                   # Issue reporting
│   └── solved/                   # Resolved issues
├── backend/                      # Flask backend
│   ├── app.py                    # Main Flask application with WebSocket
│   ├── simple_app.py             # Simplified version
│   └── user_app.py               # User-focused version
├── components/                   # React components
│   ├── navbar.tsx                # Navigation with role-based menus
│   ├── protected-route.tsx       # Route protection
│   └── ui/                       # UI components
├── contexts/                     # React contexts
│   └── auth-context.tsx          # Authentication context
├── lib/                          # Utilities
│   └── api.ts                    # API client with fixes
├── scripts/                      # Utility scripts
│   └── create-staff-users.py     # Staff user creation
├── staff_dashboard.html          # Staff dashboard (modified)
├── test_frontend.html            # Test interface with WebSocket
├── test_*.py                     # Test scripts
├── package.json                  # Node.js dependencies
├── next.config.js                # Next.js configuration
├── tailwind.config.js            # Tailwind CSS config
├── IMPLEMENTATION_SUMMARY.md     # Complete feature summary
├── SYSTEM_OVERVIEW.md            # System documentation
└── GIT_SETUP_GUIDE.md            # This guide
```

## ✅ Verification

After pushing, verify the upload by:

1. Visit: https://github.com/BhoomikaRenuka/Civic-System
2. Check that all files are present
3. Verify the commit message and file structure

## 🎯 Key Features in the Repository

### ✅ Staff UI Modifications:
- Removed "My Reports" from staff navigation
- Removed "Report New Issue" from staff quick actions
- Removed "Recent Reports" section for staff users
- Added staff-specific category filtering

### ✅ Real-Time Features:
- WebSocket connections for instant updates
- Real-time data synchronization
- Live status indicators
- Automatic email notifications

### ✅ Complete System:
- User, Staff, and Admin interfaces
- MongoDB database integration
- JWT authentication with roles
- Category-based access control
- Email notification system
- File upload capabilities
- Responsive design

## 🚀 Next Steps After Push

1. Clone the repository on other machines
2. Install dependencies: `npm install` and `pip install -r requirements.txt`
3. Set up MongoDB and configure environment variables
4. Run the system: `python backend/app.py` and `npm run dev`

## 📞 Support

If you encounter any issues:
1. Check Git installation: `git --version`
2. Verify remote URL: `git remote -v`
3. Check repository permissions on GitHub
4. Ensure you have push access to the repository

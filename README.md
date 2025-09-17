# CivicReport - Civic Issue Reporting System (PWA)

A full-stack Progressive Web Application for reporting and tracking civic issues in communities with real-time updates.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login/registration with JWT tokens
- **Issue Reporting**: Submit reports with photos and automatic location capture
- **Real-time Updates**: Live notifications for new issues and status changes
- **Admin Dashboard**: Comprehensive management interface with analytics
- **Progressive Web App**: Installable, offline-capable, and mobile-optimized

### User Features
- Submit issue reports with photo upload and geolocation
- Track personal reports with status updates
- Browse community issues by category and status
- View resolved issues and success stories
- Real-time notifications for updates

### Admin Features
- Comprehensive dashboard with statistics and analytics
- Manage all reports with filtering and search
- Update issue statuses (Pending → In Progress → Resolved)
- View reports in table and map formats
- Real-time monitoring of community activity

### PWA Features
- **Installable**: Add to home screen on mobile and desktop
- **Offline Support**: Browse cached content when offline
- **Background Sync**: Sync reports when connection returns
- **Push Notifications**: Real-time updates even when app is closed
- **Responsive Design**: Optimized for all device sizes

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library
- **Socket.IO Client** for real-time updates
- **Service Worker** for PWA functionality

### Backend
- **Flask** (Python) REST API
- **MongoDB** for data storage
- **Socket.IO** for real-time communication
- **JWT** authentication
- **bcrypt** for password hashing
- **File upload** handling

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ and pip
- MongoDB (local or cloud)

### Backend Setup

1. **Navigate to backend directory**:
   \`\`\`bash
   cd backend
   \`\`\`

2. **Install Python dependencies**:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. **Start MongoDB** (if running locally):
   \`\`\`bash
   mongod
   \`\`\`

4. **Create admin user**:
   \`\`\`bash
   python scripts/create-admin-user.py
   \`\`\`

5. **Start Flask server**:
   \`\`\`bash
   python app.py
   \`\`\`
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Install additional PWA dependencies**:
   \`\`\`bash
   npm install socket.io-client @radix-ui/react-toast class-variance-authority
   \`\`\`

3. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`
   App runs on `http://localhost:3000`

## 🔧 Configuration

### Environment Variables
Create `.env.local` in the root directory:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
\`\`\`

### Admin Access
Default admin credentials:
- **Email**: admin@civicreport.com
- **Password**: admin123
- ⚠️ **Change password after first login!**

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Visit the app in your browser
2. Click the install icon in the address bar
3. Or use the install prompt that appears

### Mobile (iOS/Android)
1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the share button
3. Select "Add to Home Screen"

## 🔄 Real-time Features

The app uses Socket.IO for real-time updates:
- **New Issue Notifications**: Instant alerts when issues are reported
- **Status Updates**: Live updates when admins change issue status
- **Connection Status**: Visual indicator of real-time connection
- **Offline Sync**: Automatic sync when connection returns

## 📊 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login

### Issues
- `POST /report` - Submit new issue
- `GET /myreports` - Get user's reports
- `GET /issues` - Get all issues (with filters)

### Admin
- `GET /admin/reports` - Get all reports (admin only)
- `POST /admin/update` - Update issue status (admin only)

## 🎨 Design System

### Colors
- **Primary**: Blue (#2563eb)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Headings**: GeistSans font family
- **Body**: GeistSans font family
- **Code**: GeistMono font family

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Protected routes and API endpoints
- Admin role-based access control
- Input validation and sanitization

## 📈 Performance

- **Lighthouse Score**: 95+ PWA score
- **Caching Strategy**: Static assets cached, API responses cached selectively
- **Offline Support**: Core functionality available offline
- **Lazy Loading**: Components and images loaded on demand

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway/Heroku)
1. Create new app on your platform
2. Set environment variables
3. Deploy Flask app with MongoDB connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the GitHub Issues page
2. Review the documentation
3. Contact the development team

---

**CivicReport** - Making communities better, one report at a time! 🏙️

# 🚀 Quick Run Instructions

## Start the Application (2 Simple Steps)

### Step 1: Start the Backend Server
```bash
cd blockchain-bidding-backend
source venv/bin/activate
python src/main.py
```

### Step 2: Open Your Browser
Navigate to: `http://localhost:5000`

## 🎯 Test the Application

### Create Test Users:
1. **Project Owner Account**:
   - Click "Register" → Username: `owner1` → Password: `password123` → Role: "Project Owner"

2. **Bidder Account**:
   - Click "Register" → Username: `bidder1` → Password: `password123` → Role: "Bidder/Contractor"

3. **Admin Account**:
   - Click "Register" → Username: `admin1` → Password: `password123` → Role: "Administrator"

### Test Workflow:
1. **Login as Project Owner** → Create an RFQ
2. **Login as Bidder** → Submit a bid on the RFQ
3. **Login as Admin** → View users and audit logs

## 📁 Key Files to Examine

### Backend (Flask):
- `blockchain-bidding-backend/src/main.py` - Main application
- `blockchain-bidding-backend/src/models/user.py` - User authentication
- `blockchain-bidding-backend/src/routes/user.py` - API endpoints

### Frontend (React):
- `blockchain-bidding-frontend/src/App.jsx` - Main React app
- `blockchain-bidding-frontend/src/components/Login.jsx` - Login interface
- `blockchain-bidding-frontend/src/components/owner/` - Project owner pages
- `blockchain-bidding-frontend/src/components/bidder/` - Bidder pages
- `blockchain-bidding-frontend/src/components/admin/` - Admin pages

### Database:
- `schema.sql` - Database structure
- `blockchain-bidding-backend/src/database/app.db` - SQLite database (auto-created)

## 🔧 What Each Component Does

### Backend Components:
- **User Management**: Registration, login, role-based access
- **RFQ System**: Create and manage project requests
- **Bidding System**: Submit and evaluate bids
- **Project Tracking**: Monitor project progress and milestones
- **API Endpoints**: RESTful APIs for frontend communication

### Frontend Components:
- **Authentication**: Login/register with role selection
- **Owner Dashboard**: Create RFQs, review bids, manage projects
- **Bidder Dashboard**: View RFQs, submit bids, track projects
- **Admin Dashboard**: User management, platform oversight
- **Responsive Design**: Works on desktop and mobile devices

## 🎨 UI Features:
- Modern, professional design using Tailwind CSS
- Role-based navigation and dashboards
- Real-time form validation
- Interactive data tables and cards
- Mobile-responsive layout

## 🔒 Security Features:
- Password hashing and secure authentication
- Session-based user management
- Role-based access control
- CORS protection for API calls
- Input validation and sanitization

The application is a complete blockchain-inspired bidding platform ready for production use!


# Blockchain Bidding Platform - Setup & Run Guide

## 🚀 Quick Start Instructions

### Prerequisites
- Python 3.11+ installed
- Node.js 20+ installed
- Git (optional, for version control)

### Step-by-Step Process to Run the Application

#### 1. Backend Setup (Flask)
```bash
# Navigate to the backend directory
cd blockchain-bidding-backend

# Activate the virtual environment
source venv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Start the Flask server
python src/main.py
```

The backend will start on `http://localhost:5000`

#### 2. Frontend Setup (React) - For Development
```bash
# Navigate to the frontend directory
cd blockchain-bidding-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend development server will start on `http://localhost:5173`

#### 3. Production Setup (Integrated)
For production, the React frontend is already built and integrated into the Flask backend:

```bash
# Just run the Flask backend
cd blockchain-bidding-backend
source venv/bin/activate
python src/main.py
```

Access the complete application at `http://localhost:5000`

## 🌐 How to Access and Test

### 1. Open Your Browser
Navigate to `http://localhost:5000`

### 2. Register Users
- Click "Register" tab
- Create users with different roles:
  - **Project Owner**: Can create RFQs and manage projects
  - **Bidder/Contractor**: Can submit bids and work on projects
  - **Administrator**: Can manage users and view audit logs

### 3. Test the Workflow
1. **As Project Owner**:
   - Login and create an RFQ
   - Set project details, scope, deadline, and evaluation criteria
   
2. **As Bidder**:
   - Login and view available RFQs
   - Submit bids with pricing and qualifications
   
3. **As Admin**:
   - Login and manage users
   - View platform activity and audit logs

## 📁 Complete Project Structure

```
blockchain-bidding-platform/
├── blockchain-bidding-backend/          # Flask Backend Application
│   ├── src/
│   │   ├── main.py                      # Main Flask application entry point
│   │   ├── models/
│   │   │   ├── __init__.py              # Database initialization
│   │   │   ├── user.py                  # User model (authentication & roles)
│   │   │   ├── rfq.py                   # RFQ (Request for Quotation) model
│   │   │   ├── bid.py                   # Bid submission model
│   │   │   ├── project.py               # Project management model
│   │   │   └── milestone.py             # Project milestone model
│   │   ├── routes/
│   │   │   ├── __init__.py              # Route initialization
│   │   │   ├── user.py                  # User authentication & management APIs
│   │   │   ├── rfq.py                   # RFQ creation & management APIs
│   │   │   ├── bid.py                   # Bid submission & management APIs
│   │   │   ├── project.py               # Project tracking APIs
│   │   │   └── milestone.py             # Milestone management APIs
│   │   ├── database/
│   │   │   ├── __init__.py              # Database configuration
│   │   │   └── app.db                   # SQLite database file (auto-created)
│   │   └── static/                      # Built React frontend files
│   │       ├── index.html               # Main HTML entry point
│   │       └── assets/                  # CSS, JS, and other assets
│   ├── venv/                            # Python virtual environment
│   └── requirements.txt                 # Python dependencies
│
├── blockchain-bidding-frontend/         # React Frontend Application
│   ├── src/
│   │   ├── App.jsx                      # Main React application component
│   │   ├── main.jsx                     # React entry point
│   │   ├── components/
│   │   │   ├── Login.jsx                # Login/Register component
│   │   │   ├── Dashboard.jsx            # Role-based dashboard router
│   │   │   ├── owner/                   # Project Owner components
│   │   │   │   ├── OwnerDashboard.jsx   # Owner main dashboard
│   │   │   │   ├── RFQList.jsx          # List of owner's RFQs
│   │   │   │   ├── CreateRFQ.jsx        # Create new RFQ form
│   │   │   │   ├── RFQDetail.jsx        # RFQ details with bids
│   │   │   │   ├── ProjectList.jsx      # Owner's active projects
│   │   │   │   └── ProjectDetail.jsx    # Project management interface
│   │   │   ├── bidder/                  # Bidder/Contractor components
│   │   │   │   ├── BidderDashboard.jsx  # Bidder main dashboard
│   │   │   │   ├── BidderRFQList.jsx    # Available RFQs for bidding
│   │   │   │   ├── BidderRFQDetail.jsx  # RFQ details with bid submission
│   │   │   │   ├── MyBids.jsx           # Bidder's submitted bids
│   │   │   │   ├── MyProjects.jsx       # Bidder's active projects
│   │   │   │   └── BidderProjectDetail.jsx # Project execution interface
│   │   │   └── admin/                   # Administrator components
│   │   │       ├── AdminDashboard.jsx   # Admin main dashboard
│   │   │       ├── UserManagement.jsx   # User management interface
│   │   │       └── AuditLog.jsx         # Platform audit log viewer
│   │   └── lib/
│   │       └── utils.js                 # Utility functions
│   ├── public/                          # Public assets
│   ├── dist/                            # Built production files
│   ├── package.json                     # Node.js dependencies
│   └── vite.config.js                   # Vite build configuration
│
├── schema.sql                           # Database schema definition
├── todo.md                              # Project development checklist
└── PROJECT_SETUP_GUIDE.md              # This setup guide
```

## 🔧 Key Components Explained

### Backend Components

#### 1. **Models** (`src/models/`)
- **User Model**: Handles user authentication, roles (owner/bidder/admin), and sessions
- **RFQ Model**: Manages Request for Quotations with project details and deadlines
- **Bid Model**: Stores bid submissions with pricing, qualifications, and document hashes
- **Project Model**: Tracks awarded projects and their status
- **Milestone Model**: Manages project deliverables and approval workflow

#### 2. **Routes/APIs** (`src/routes/`)
- **User Routes**: Registration, login, logout, user management
- **RFQ Routes**: Create, read, update RFQs; view bids
- **Bid Routes**: Submit bids, view bid status, bid management
- **Project Routes**: Project creation, status updates, milestone tracking
- **Milestone Routes**: Milestone submission, approval, progress tracking

#### 3. **Database** (`src/database/`)
- SQLite database with relational schema
- Automatic table creation on first run
- Supports user sessions and role-based access control

### Frontend Components

#### 1. **Authentication** (`Login.jsx`)
- Unified login/register interface
- Role selection during registration
- Session management with automatic redirects

#### 2. **Role-Based Dashboards**
- **Owner Dashboard**: RFQ management, bid review, project oversight
- **Bidder Dashboard**: RFQ browsing, bid submission, project execution
- **Admin Dashboard**: User management, platform monitoring, audit logs

#### 3. **Workflow Components**
- **RFQ Lifecycle**: Creation → Bidding → Selection → Project Award
- **Project Management**: Milestone submission → Review → Approval
- **User Management**: Registration → Role Assignment → Access Control

## 🎯 Testing Scenarios

### 1. **Project Owner Workflow**
1. Register as "Project Owner"
2. Create a new RFQ with project details
3. Wait for bids (or create bidder account to test)
4. Review and select winning bid
5. Monitor project progress and approve milestones

### 2. **Bidder Workflow**
1. Register as "Bidder/Contractor"
2. Browse available RFQs
3. Submit competitive bids with qualifications
4. Track bid status and notifications
5. Execute awarded projects and submit milestones

### 3. **Administrator Workflow**
1. Register as "Administrator"
2. Manage platform users
3. Monitor RFQ and bidding activity
4. Review audit logs and platform health
5. Handle user issues and compliance

## 🔒 Security Features

- **Password Hashing**: Secure password storage using Werkzeug
- **Session Management**: Flask session-based authentication
- **Role-Based Access**: API endpoints protected by user roles
- **CORS Protection**: Configured for secure frontend-backend communication
- **Input Validation**: Form validation on both frontend and backend

## 📊 Database Schema

The application uses a relational database with the following main tables:
- **users**: User accounts with roles and authentication
- **rfqs**: Request for Quotations with project specifications
- **bids**: Bid submissions linked to RFQs and users
- **projects**: Awarded projects tracking
- **milestones**: Project deliverables and progress tracking

## 🚀 Deployment Options

1. **Local Development**: Run Flask backend with integrated frontend
2. **Production Deployment**: Use the deployment service for public access
3. **Docker**: Can be containerized for scalable deployment
4. **Cloud Platforms**: Compatible with Heroku, AWS, Google Cloud, etc.

## 📝 Notes

- The application is fully functional with all core features implemented
- Database is automatically created on first run
- Frontend is built and integrated into the Flask backend for easy deployment
- All user roles and workflows have been tested and verified
- The system supports blockchain-style document hashing for bid integrity

